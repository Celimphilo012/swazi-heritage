import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getCinemaSession } from "../../api/cinema.api";

const POLL_INTERVAL = 10_000;

/* ── Shared primitives ── */
const FlagStripe = () => (
  <div className="absolute top-0 left-0 right-0 flex" style={{ height: 10 }}>
    <div className="flex-1" style={{ background: "#002395" }} />
    <div style={{ width: "7%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#CE1126" }} />
    <div style={{ width: "7%", background: "#FFD600" }} />
    <div className="flex-1" style={{ background: "#002395" }} />
  </div>
);

const DIAMONDS = [
  { s: 10, x: "3%",  y: "20%", d: "0s",   t: "4.5s", c: "#FFD600" },
  { s:  6, x: "15%", y: "65%", d: "1.2s", t: "5.2s", c: "#fff"    },
  { s: 13, x: "55%", y: "30%", d: "0.6s", t: "3.9s", c: "#CE1126" },
  { s:  8, x: "75%", y: "68%", d: "2.0s", t: "5.0s", c: "#FFD600" },
  { s:  9, x: "88%", y: "20%", d: "0.4s", t: "4.7s", c: "#fff"    },
];
const DiamondParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {DIAMONDS.map((d, i) => (
      <div key={i} className="absolute" style={{
        width: d.s, height: d.s, left: d.x, top: d.y, background: d.c, opacity: 0.14,
        animationName: "floatDiamond", animationDuration: d.t, animationDelay: d.d,
        animationIterationCount: "infinite", animationTimingFunction: "ease-in-out",
      }} />
    ))}
  </div>
);

/* ── YouTube URL → embed URL ── */
const toEmbedUrl = (url) => {
  if (!url) return url;
  const yt = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&autoplay=1`;
  return url;
};

/* ── Loading skeleton ── */
const LoadingSkeleton = () => (
  <div className="-mt-8 -mx-4 animate-pulse">
    <div className="px-5 pt-14 pb-10"
      style={{ background: "linear-gradient(160deg,#1a0010,#6B0020,#1a0010)" }}>
      <div className="h-3 bg-red-900 rounded w-20 mb-6" />
      <div className="h-7 bg-red-900 rounded w-2/3 mb-3" />
      <div className="h-3 bg-red-900 rounded w-full mb-1" />
      <div className="h-3 bg-red-900 rounded w-4/5" />
    </div>
    <div className="mx-4 mt-4">
      <div className="aspect-video bg-gray-900 rounded-2xl" />
    </div>
  </div>
);

/* ── Page ── */
const CinemaRoom = () => {
  const { id } = useParams();
  const [session,  setSession]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const intervalRef = useRef(null);

  const fetchSession = (initial = false) => {
    if (initial) setLoading(true);
    getCinemaSession(id)
      .then((data) => {
        setSession(data);
        if (["ended", "cancelled"].includes(data.status)) {
          clearInterval(intervalRef.current);
        }
      })
      .catch(() => setError("Session not found or failed to load."))
      .finally(() => { if (initial) setLoading(false); });
  };

  useEffect(() => {
    fetchSession(true);
    intervalRef.current = setInterval(() => fetchSession(false), POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (error || !session) {
    return (
      <div className="-mt-8 -mx-4">
        <div className="px-5 pt-16 pb-10 text-center"
          style={{ background: "linear-gradient(160deg,#1a0010,#6B0020,#1a0010)" }}>
          <p className="text-white font-bold text-lg mb-2">Session not found</p>
          <p className="text-sm mb-6" style={{ color: "rgba(252,165,165,0.8)" }}>
            {error || "This session may have been removed."}
          </p>
          <Link to="/cinema"
            className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
            ← Back to Cinema
          </Link>
        </div>
      </div>
    );
  }

  const isLive      = session.status === "live";
  const isScheduled = session.status === "scheduled";
  const isEnded     = session.status === "ended";
  const isCancelled = session.status === "cancelled";
  const embedUrl    = toEmbedUrl(session.stream_url);
  const isVideoFile = session.stream_url?.match(/\.(mp4|webm|ogg)(\?.*)?$/i);

  return (
    <div className="-mt-8 -mx-4">

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden px-5 pt-14 pb-10"
        style={{
          background: "linear-gradient(160deg,#1a0010 0%,#6B0020 55%,#1a0010 100%)",
          borderBottomLeftRadius: "2rem",
          borderBottomRightRadius: "2rem",
        }}>
        <FlagStripe />
        <DiamondParticles />

        <div className="relative z-10">
          {/* Back link */}
          <Link to="/cinema"
            className="inline-flex items-center gap-1.5 text-xs font-semibold mb-5 transition-opacity hover:opacity-70"
            style={{ color: "rgba(252,165,165,0.75)" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Cinema
          </Link>

          {/* Status pills */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {isLive && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                style={{ background: "rgba(206,17,38,0.25)", color: "#ff6b6b", border: "1px solid rgba(206,17,38,0.4)" }}>
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#CE1126" }} />
                  <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: "#CE1126" }} />
                </span>
                Live Now
              </div>
            )}
            {isScheduled && (
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(255,214,0,0.15)", color: "#FFD600", border: "1px solid rgba(255,214,0,0.3)" }}>
                Scheduled
              </span>
            )}
            {isEnded && (
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(107,114,128,0.2)", color: "#9ca3af" }}>
                Ended
              </span>
            )}
            {isCancelled && (
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(107,114,128,0.2)", color: "#9ca3af" }}>
                Cancelled
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-bold capitalize"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
              {session.type}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-2 animate-fade-in-down">
            {session.title}
          </h1>

          {/* Flag divider */}
          <div className="flex gap-2 mb-3">
            <div className="h-0.5 w-6 rounded-full" style={{ background: "#002395" }} />
            <div className="h-0.5 w-6 rounded-full" style={{ background: "#FFD600" }} />
            <div className="h-0.5 w-6 rounded-full" style={{ background: "#CE1126" }} />
          </div>

          {session.description && (
            <p className="text-sm leading-relaxed animate-fade-in-up"
              style={{ color: "rgba(252,165,165,0.8)", animationDelay: "0.15s", maxWidth: "42rem" }}>
              {session.description}
            </p>
          )}

          {/* Meta row */}
          {(session.booking_count !== undefined || session.scheduled_at) && (
            <div className="flex flex-wrap items-center gap-4 mt-4">
              {session.booking_count !== undefined && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(252,165,165,0.65)" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {session.booking_count} {session.booking_count === 1 ? "attendee" : "attendees"}
                </div>
              )}
              {isLive && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(252,165,165,0.65)" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refreshes every 10s
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══ PLAYER SECTION ══ */}
      <div className="px-4 mt-5 mb-6">

        {/* Player frame */}
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "#0a0a0a",
            border: isLive ? "1px solid rgba(206,17,38,0.3)" : "1px solid rgba(255,255,255,0.06)",
            boxShadow: isLive ? "0 0 40px rgba(206,17,38,0.15)" : "0 8px 40px rgba(0,0,0,0.5)",
          }}>

          {/* Status top bar */}
          <div className="h-1" style={{
            background: isLive
              ? "linear-gradient(90deg,#CE1126,#ff4d6d,#CE1126)"
              : isScheduled
              ? "linear-gradient(90deg,#002395,#FFD600,#CE1126)"
              : "#374151",
          }} />

          <div className="aspect-video relative">
            {isScheduled ? (
              /* Waiting screen */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6"
                style={{ background: "linear-gradient(135deg,#0a0f2e,#0d1a4a)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,214,0,0.1)", border: "1px solid rgba(255,214,0,0.2)" }}>
                  <svg className="w-7 h-7" style={{ color: "#FFD600" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-base mb-1">Session not started yet</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>
                    This page refreshes automatically every 10 seconds
                  </p>
                </div>
                {/* Animated flag dots as loading indicator */}
                <div className="flex items-center gap-2 mt-1">
                  {["#002395","#FFD600","#CE1126"].map((c, i) => (
                    <div key={i} className="w-2 h-2 rounded-full"
                      style={{
                        background: c, opacity: 0.8,
                        animationName: "bounce", animationDuration: "1.2s",
                        animationDelay: `${i * 0.2}s`, animationIterationCount: "infinite",
                        animationTimingFunction: "ease-in-out",
                      }} />
                  ))}
                </div>
              </div>
            ) : isCancelled ? (
              /* Cancelled screen */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6"
                style={{ background: "#111" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(107,114,128,0.15)" }}>
                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-gray-400 font-semibold text-sm">Session was cancelled</p>
              </div>
            ) : isVideoFile ? (
              <video src={session.stream_url} controls autoPlay className="w-full h-full" />
            ) : (
              <iframe
                src={embedUrl}
                title={session.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            )}
          </div>
        </div>

        {/* Ended message */}
        {isEnded && (
          <div className="mt-4 p-4 rounded-2xl flex items-center gap-3"
            style={{ background: "linear-gradient(135deg,#0a0f2e,#0d1a4a)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,35,149,0.2)" }}>
              <svg className="w-4 h-4" style={{ color: "#93c5fd" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Session has ended</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                Thank you for watching this cultural event.
              </p>
            </div>
          </div>
        )}

        {/* YouTube fallback */}
        {!isVideoFile && !isScheduled && !isCancelled && session.stream_url && (
          <div className="mt-4 p-4 rounded-2xl flex items-center justify-between gap-4"
            style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "#64748b" }}>
              If the player above doesn't load, the host may have disabled embedding.
            </p>
            <a href={session.stream_url} target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
              style={{ background: "#CE1126", color: "#fff" }}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Watch on YouTube
            </a>
          </div>
        )}

        {/* Back to cinema CTA */}
        <div className="mt-6 flex justify-center">
          <Link to="/cinema"
            className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#6B0020,#CE1126)", color: "#fff", boxShadow: "0 2px 14px rgba(206,17,38,0.3)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 10l4.553-2.069A1 1 0 0121 8.868V15.132a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Browse All Sessions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CinemaRoom;
