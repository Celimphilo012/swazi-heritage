import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCinemaSessions, bookSession, getMyBookings } from "../../api/cinema.api";

const POLL_INTERVAL = 30_000;
const STATUS_ORDER  = { live: 0, available: 1, scheduled: 2, ended: 3, cancelled: 4 };

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  }) : "TBD";

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
  { s: 12, x: "4%",  y: "25%", d: "0s",   t: "4.3s", c: "#FFD600" },
  { s:  8, x: "18%", y: "60%", d: "1.1s", t: "5.1s", c: "#fff"    },
  { s: 14, x: "40%", y: "28%", d: "0.7s", t: "3.8s", c: "#CE1126" },
  { s:  7, x: "62%", y: "70%", d: "2.0s", t: "5.3s", c: "#FFD600" },
  { s: 10, x: "80%", y: "22%", d: "0.4s", t: "4.6s", c: "#fff"    },
  { s:  9, x: "92%", y: "58%", d: "1.7s", t: "3.7s", c: "#FFD600" },
];
const DiamondParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {DIAMONDS.map((d, i) => (
      <div key={i} className="absolute" style={{
        width: d.s, height: d.s, left: d.x, top: d.y, background: d.c, opacity: 0.15,
        animationName: "floatDiamond", animationDuration: d.t, animationDelay: d.d,
        animationIterationCount: "infinite", animationTimingFunction: "ease-in-out",
      }} />
    ))}
  </div>
);

/* ── LIVE session — full-width featured card ── */
const LiveCard = ({ s }) => (
  <Link to={`/cinema/${s.id}`}
    className="block rounded-2xl overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
    style={{
      background: "linear-gradient(135deg,#5a0010 0%,#CE1126 50%,#5a0010 100%)",
      boxShadow: "0 0 40px rgba(206,17,38,0.25)",
    }}>
    <div className="p-6 text-white">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <span className="text-xs font-black uppercase tracking-widest opacity-90">Live Now</span>
        <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.15)" }}>
          {s.type}
        </span>
      </div>

      <h3 className="text-xl font-black mb-2 leading-snug">{s.title}</h3>
      {s.description && (
        <p className="text-sm opacity-80 line-clamp-2 mb-5">{s.description}</p>
      )}

      <div className="inline-flex items-center gap-2 font-black px-5 py-2.5 rounded-xl text-sm transition-all group-hover:scale-105"
           style={{ background: "#fff", color: "#CE1126" }}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        Watch Live
      </div>
    </div>
  </Link>
);

/* ── Recorded / always-available card ── */
const RecordedCard = ({ s }) => (
  <Link to={`/cinema/${s.id}`}
    className="block rounded-2xl overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    style={{
      background: "linear-gradient(135deg,#1e1a3a 0%,#2d2060 100%)",
      boxShadow: "0 0 30px rgba(124,58,237,0.2)",
    }}>
    <div className="h-1.5" style={{ background: "#7c3aed" }} />
    <div className="p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full"
          style={{ background: "rgba(124,58,237,0.3)", color: "#c4b5fd" }}>
          Recorded
        </span>
        <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          {s.type}
        </span>
      </div>

      <h3 className="font-bold leading-snug mb-2" style={{ color: "#fff" }}>{s.title}</h3>
      {s.description && (
        <p className="text-sm mb-4 line-clamp-2" style={{ color: "rgba(196,181,253,0.8)" }}>{s.description}</p>
      )}

      <div className="inline-flex items-center gap-2 font-black px-4 py-2 rounded-xl text-sm transition-all group-hover:scale-105"
        style={{ background: "#7c3aed", color: "#fff" }}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        Watch Now
      </div>
    </div>
  </Link>
);

/* ── Regular session card (scheduled / ended / cancelled) ── */
const SessionCard = ({ s, isBooked, onBook, booking }) => {
  const muted = s.status === "ended" || s.status === "cancelled";

  const borderColor = { scheduled: "#002395", ended: "#9ca3af", cancelled: "#ef4444" }[s.status] ?? "#9ca3af";
  const bg = muted
    ? "#f9fafb"
    : "linear-gradient(135deg,#001540 0%,#002d80 100%)";
  const titleColor  = muted ? "#6b7280" : "#ffffff";
  const subColor    = muted ? "#9ca3af" : "rgba(147,197,253,0.9)";
  const descColor   = muted ? "#9ca3af" : "rgba(191,219,254,0.85)";

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${!muted ? "hover:-translate-y-1 hover:shadow-xl" : "opacity-70"}`}
         style={{ background: bg, border: muted ? "1px solid #e5e7eb" : "none" }}>
      {/* Status bar */}
      <div className="h-1.5" style={{ background: borderColor }} />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold leading-snug" style={{ color: titleColor }}>{s.title}</h3>
            <p className="text-xs mt-0.5" style={{ color: subColor }}>
              {fmt(s.scheduled_at)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize
              ${s.status === "scheduled" ? "bg-blue-100 text-blue-800"
              : s.status === "ended"     ? "bg-gray-100 text-gray-500"
              : s.status === "cancelled" ? "bg-red-100 text-red-600"
              : "bg-gray-100 text-gray-500"}`}>
              {s.status}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize
              ${s.type === "live"     ? "bg-red-100 text-red-700"
              : "bg-purple-100 text-purple-700"}`}>
              {s.type}
            </span>
          </div>
        </div>

        {s.description && (
          <p className="text-sm line-clamp-2 mb-4" style={{ color: descColor }}>
            {s.description}
          </p>
        )}

        {/* Action */}
        {s.status === "scheduled" && (
          isBooked ? (
            <div className="flex items-center gap-2 text-sm font-bold"
                 style={{ color: "#4ade80" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Seat Reserved
            </div>
          ) : (
            <button onClick={() => onBook(s.id)} disabled={booking === s.id}
              className="flex items-center gap-2 font-bold px-5 py-2 rounded-xl text-sm transition-all hover:scale-105 disabled:opacity-60"
              style={{ background: "#fff", color: "#002395" }}>
              {booking === s.id && (
                <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-900 rounded-full animate-spin" />
              )}
              {booking === s.id ? "Booking…" : "Book Seat"}
            </button>
          )
        )}

        {s.status === "cancelled" && (
          <span className="text-xs font-semibold text-red-400">Session cancelled</span>
        )}
        {s.status === "ended" && !isBooked && (
          <span className="text-xs font-semibold text-gray-400">Session ended</span>
        )}
        {s.status === "ended" && isBooked && (
          <span className="text-xs font-semibold text-gray-400">You attended this session</span>
        )}
      </div>
    </div>
  );
};

/* ── Skeleton ── */
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden animate-pulse"
       style={{ background: "linear-gradient(135deg,#001540,#002d80)" }}>
    <div className="h-1.5 bg-blue-800" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-blue-800 rounded w-2/3" />
      <div className="h-3 bg-blue-900 rounded w-1/3" />
      <div className="h-3 bg-blue-900 rounded w-full" />
      <div className="h-9 bg-blue-800 rounded-xl w-28 mt-2" />
    </div>
  </div>
);

/* ── Page ── */
const CinemaListing = () => {
  const { user } = useAuth();
  const [sessions,   setSessions]   = useState([]);
  const [myBookings, setMyBookings] = useState(new Set());
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [booking,    setBooking]    = useState(null);
  const [bookMsg,    setBookMsg]    = useState("");
  const intervalRef = useRef(null);

  const fetchSessions = (initial = false) => {
    if (initial) setLoading(true);
    const fetches = [getCinemaSessions({ limit: 20 })];
    if (user) fetches.push(getMyBookings());
    Promise.all(fetches)
      .then(([s, b]) => {
        setSessions(s.data || []);
        if (b) setMyBookings(new Set(b.map(bk => bk.cinema_id)));
      })
      .catch(() => { if (initial) setError("Failed to load sessions."); })
      .finally(() => { if (initial) setLoading(false); });
  };

  useEffect(() => {
    fetchSessions(true);
    intervalRef.current = setInterval(() => fetchSessions(false), POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [user]);

  const handleBook = async (sessionId) => {
    if (!user) { window.location.href = "/login"; return; }
    setBooking(sessionId);
    setBookMsg("");
    try {
      await bookSession(sessionId);
      setMyBookings(prev => new Set([...prev, sessionId]));
      setBookMsg("success");
      setTimeout(() => setBookMsg(""), 3000);
    } catch (err) {
      setBookMsg(err.response?.data?.message || "Failed to book.");
    } finally {
      setBooking(null);
    }
  };

  const sorted            = [...sessions].sort((a, b) => (STATUS_ORDER[a.status] ?? 5) - (STATUS_ORDER[b.status] ?? 5));
  const liveSessions      = sorted.filter(s => s.status === "live");
  const recordedSessions  = sorted.filter(s => s.status === "available");
  const restSessions      = sorted.filter(s => s.status !== "live" && s.status !== "available");

  return (
    <div className="-mt-8 -mx-4">

      {/* ══ HERO — cinematic maroon ══ */}
      <section className="relative overflow-hidden px-6 pt-16 pb-14 text-center"
        style={{
          background: "linear-gradient(160deg,#1a0010 0%,#6B0020 55%,#1a0010 100%)",
          borderBottomLeftRadius: "2.5rem",
          borderBottomRightRadius: "2.5rem",
        }}>
        <FlagStripe />
        <DiamondParticles />

        <div className="relative z-10">
          {/* Camera icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: "rgba(206,17,38,0.25)", border: "1px solid rgba(206,17,38,0.4)" }}>
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 10l4.553-2.069A1 1 0 0121 8.868V15.132a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 animate-fade-in-down">
            Cultural Cinema
          </h1>
          <div className="flex justify-center gap-2 mb-3">
            <div className="h-1 w-8 rounded-full" style={{ background: "#002395" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#FFD600" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#CE1126" }} />
          </div>
          <p className="text-base max-w-md mx-auto animate-fade-in-up"
             style={{ color: "rgba(252,165,165,0.85)", animationDelay: "0.2s" }}>
            Live and recorded cultural events from the Kingdom of Eswatini
          </p>

          {liveSessions.length > 0 && (
            <div className="inline-flex items-center gap-2 mt-4 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full"
                 style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {liveSessions.length} session{liveSessions.length > 1 ? "s" : ""} live right now
            </div>
          )}

          {user && (
            <div className="mt-5">
              <Link to="/my-bookings"
                className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(4px)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                My Bookings
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="px-4">

        {/* Booking feedback */}
        {bookMsg && (
          <div className={`mt-5 p-3 rounded-xl text-sm font-semibold flex items-center gap-2
            ${bookMsg === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"}`}>
            {bookMsg === "success" ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Seat booked successfully!
              </>
            ) : bookMsg}
          </div>
        )}

        {error && (
          <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border-2 border-dashed border-gray-200 mt-7">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                 style={{ background: "#f3f4f6" }}>
              <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 10l4.553-2.069A1 1 0 0121 8.868V15.132a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-500">No cinema sessions available yet.</p>
          </div>
        ) : (
          <>
            {/* LIVE SESSIONS */}
            {liveSessions.length > 0 && (
              <div className="mt-7">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-red-600">Live Now</h2>
                </div>
                <div className="space-y-4">
                  {liveSessions.map(s => <LiveCard key={s.id} s={s} />)}
                </div>
              </div>
            )}

            {/* RECORDED — always available */}
            {recordedSessions.length > 0 && (
              <div className="mt-7">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: "#7c3aed" }}>
                    Recorded
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recordedSessions.map(s => <RecordedCard key={s.id} s={s} />)}
                </div>
              </div>
            )}

            {/* SCHEDULED + ENDED */}
            {restSessions.length > 0 && (
              <div className="mt-7">
                {(liveSessions.length > 0 || recordedSessions.length > 0) && (
                  <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                    Upcoming &amp; Past
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {restSessions.map(s => (
                    <SessionCard
                      key={s.id} s={s}
                      isBooked={myBookings.has(s.id)}
                      onBook={handleBook}
                      booking={booking}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default CinemaListing;
