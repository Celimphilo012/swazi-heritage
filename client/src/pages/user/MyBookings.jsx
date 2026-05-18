import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../../api/cinema.api";

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
  { s: 11, x: "4%",  y: "25%", d: "0s",   t: "4.3s", c: "#FFD600" },
  { s:  7, x: "18%", y: "60%", d: "1.1s", t: "5.1s", c: "#fff"    },
  { s: 13, x: "38%", y: "28%", d: "0.7s", t: "4.0s", c: "#CE1126" },
  { s:  8, x: "62%", y: "70%", d: "2.0s", t: "5.3s", c: "#FFD600" },
  { s: 10, x: "78%", y: "18%", d: "0.3s", t: "4.8s", c: "#fff"    },
  { s:  6, x: "90%", y: "52%", d: "1.7s", t: "3.7s", c: "#FFD600" },
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

const TicketIcon = () => (
  <svg className="w-10 h-10 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

/* ── Formatting ── */
const fmt = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "TBD";

/* ── Inline cancel confirm panel ── */
const CancelConfirm = ({ onConfirm, onDismiss, loading }) => (
  <div className="mt-3 p-3 rounded-xl border border-red-200 bg-red-50 flex items-center gap-3">
    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
    <p className="text-xs text-red-700 flex-1 font-medium">Cancel this booking?</p>
    <button onClick={onDismiss} disabled={loading}
      className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40">
      Keep
    </button>
    <button onClick={onConfirm} disabled={loading}
      className="text-xs px-2.5 py-1 rounded-lg text-white transition-colors disabled:opacity-40"
      style={{ background: "#CE1126" }}>
      {loading ? "Cancelling…" : "Confirm"}
    </button>
  </div>
);

/* ── Status config ── */
const SESSION_CFG = {
  live:      { label: "Live Now",  dot: "#CE1126", text: "#CE1126", bg: "rgba(206,17,38,0.12)", border: "rgba(206,17,38,0.3)" },
  scheduled: { label: "Scheduled", dot: "#FFD600", text: "#b86800", bg: "rgba(255,214,0,0.10)", border: "rgba(255,214,0,0.3)" },
  ended:     { label: "Ended",     dot: "#6b7280", text: "#6b7280", bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.25)" },
  cancelled: { label: "Cancelled", dot: "#9ca3af", text: "#9ca3af", bg: "rgba(156,163,175,0.10)", border: "rgba(156,163,175,0.2)" },
};
const BOOKING_CFG = {
  confirmed: { label: "Confirmed", color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
  cancelled: { label: "Cancelled", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  attended:  { label: "Attended",  color: "#002395", bg: "rgba(0,35,149,0.12)" },
};

/* ── Booking card ── */
const BookingCard = ({ booking, onCancelRequest, cancellingId, confirmId, onCancelConfirm, onCancelDismiss }) => {
  const isLive      = booking.session_status === "live";
  const isScheduled = booking.session_status === "scheduled";
  const isEnded     = booking.session_status === "ended" || booking.session_status === "cancelled";
  const canCancel   = isScheduled && (!booking.booking_status || booking.booking_status === "confirmed");
  const isCancelled = booking.booking_status === "cancelled";
  const sessCfg     = SESSION_CFG[booking.session_status] || SESSION_CFG.ended;
  const bookCfg     = BOOKING_CFG[booking.booking_status || "confirmed"] || BOOKING_CFG.confirmed;

  return (
    <div className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: isLive
          ? "linear-gradient(135deg,#1a0010,#4a0018,#1a0010)"
          : isCancelled || isEnded
          ? "linear-gradient(135deg,#18181b,#27272a,#18181b)"
          : "linear-gradient(135deg,#0a0f2e,#0d1a4a,#0a0f2e)",
        boxShadow: isLive
          ? "0 4px 24px rgba(206,17,38,0.25), 0 1px 4px rgba(0,0,0,0.4)"
          : "0 2px 16px rgba(0,0,0,0.35)",
        border: isLive ? "1px solid rgba(206,17,38,0.35)" : "1px solid rgba(255,255,255,0.07)",
      }}>

      {/* Top accent line */}
      <div className="h-0.5 w-full" style={{
        background: isLive
          ? "linear-gradient(90deg,#CE1126,#ff6b6b,#CE1126)"
          : isCancelled
          ? "#374151"
          : "linear-gradient(90deg,#002395,#FFD600,#CE1126)",
      }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Ticket icon column */}
          <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
            style={{
              background: isLive ? "rgba(206,17,38,0.2)" : isCancelled ? "rgba(75,85,99,0.2)" : "rgba(0,35,149,0.2)",
            }}>
            {isLive ? (
              <svg className="w-4 h-4" style={{ color: "#ff6b6b" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" style={{ color: isCancelled ? "#6b7280" : "#93c5fd" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm leading-snug"
                style={{ color: isCancelled ? "#9ca3af" : "#f8fafc" }}>
                {booking.title}
              </h3>

              {/* Live pulse badge */}
              {isLive && (
                <div className="flex-shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(206,17,38,0.2)", border: "1px solid rgba(206,17,38,0.4)" }}>
                  <span className="relative flex w-2 h-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ background: "#CE1126" }} />
                    <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: "#CE1126" }} />
                  </span>
                  <span className="text-xs font-bold" style={{ color: "#ff6b6b" }}>LIVE</span>
                </div>
              )}
            </div>

            {/* Pills row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: sessCfg.bg, color: sessCfg.text, border: `1px solid ${sessCfg.border}` }}>
                {sessCfg.label}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: bookCfg.bg, color: bookCfg.color }}>
                {bookCfg.label}
              </span>
              {booking.type && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                  {booking.type}
                </span>
              )}
            </div>

            {/* Date */}
            <p className="text-xs mt-1.5" style={{ color: "#64748b" }}>
              {fmt(booking.scheduled_at)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 ml-12">
          {isLive && (
            <Link to={`/cinema/${booking.cinema_id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg,#CE1126,#ff4d6d)", color: "#fff", boxShadow: "0 2px 12px rgba(206,17,38,0.4)" }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Now
            </Link>
          )}
          {canCancel && (
            <button
              onClick={() => onCancelRequest(booking.id)}
              className="text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
              style={{ background: "rgba(206,17,38,0.12)", color: "#f87171", border: "1px solid rgba(206,17,38,0.25)" }}>
              Cancel Booking
            </button>
          )}
        </div>

        {/* Inline cancel confirm */}
        {confirmId === booking.id && (
          <div className="ml-12">
            <CancelConfirm
              loading={cancellingId === booking.id}
              onConfirm={() => onCancelConfirm(booking)}
              onDismiss={onCancelDismiss}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Skeleton ── */
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden animate-pulse"
    style={{ background: "linear-gradient(135deg,#0a0f2e,#0d1a4a,#0a0f2e)", border: "1px solid rgba(255,255,255,0.07)" }}>
    <div className="h-0.5 w-full bg-gray-700" />
    <div className="p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-gray-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-2/3" />
        <div className="flex gap-1.5">
          <div className="h-4 bg-gray-800 rounded-full w-16" />
          <div className="h-4 bg-gray-800 rounded-full w-16" />
        </div>
        <div className="h-3 bg-gray-800 rounded w-1/2" />
      </div>
    </div>
  </div>
);

/* ── Filter tabs ── */
const TABS = [
  { key: "all",       label: "All" },
  { key: "live",      label: "Live" },
  { key: "upcoming",  label: "Upcoming" },
  { key: "past",      label: "Past" },
];

const filterBookings = (bookings, tab) => {
  if (tab === "all")      return bookings;
  if (tab === "live")     return bookings.filter(b => b.session_status === "live");
  if (tab === "upcoming") return bookings.filter(b => b.session_status === "scheduled" && b.booking_status !== "cancelled");
  if (tab === "past")     return bookings.filter(b => ["ended", "cancelled"].includes(b.session_status) || b.booking_status === "cancelled");
  return bookings;
};

/* ── Page ── */
const MyBookings = () => {
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [cancelling,  setCancelling]  = useState(null);
  const [confirmId,   setConfirmId]   = useState(null);
  const [activeTab,   setActiveTab]   = useState("all");

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, []);

  const handleCancelRequest = (id) => { setConfirmId(id); };
  const handleCancelDismiss = ()  => { setConfirmId(null); };

  const handleCancelConfirm = async (booking) => {
    setCancelling(booking.id);
    try {
      await cancelBooking(booking.id);
      setBookings(bs => bs.map(b => b.id === booking.id ? { ...b, booking_status: "cancelled" } : b));
      setConfirmId(null);
    } catch {
      setError("Failed to cancel booking.");
    } finally {
      setCancelling(null);
    }
  };

  const liveCount     = bookings.filter(b => b.session_status === "live").length;
  const confirmedCount = bookings.filter(b => b.booking_status !== "cancelled").length;
  const filtered       = filterBookings(bookings, activeTab);

  return (
    <div className="-mt-8 -mx-4">

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden px-6 pt-16 pb-14 text-center"
        style={{
          background: "linear-gradient(160deg,#001540 0%,#002d80 55%,#001540 100%)",
          borderBottomLeftRadius: "2.5rem",
          borderBottomRightRadius: "2.5rem",
        }}>
        <FlagStripe />
        <DiamondParticles />

        <div className="relative z-10">
          {/* Booking count badge */}
          {!loading && bookings.length > 0 && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(255,214,0,0.14)", color: "#FFD600", border: "1px solid rgba(255,214,0,0.25)" }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
            </div>
          )}

          {/* Ticket icon */}
          <div className="flex justify-center mb-4">
            <TicketIcon />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 animate-fade-in-down">
            My Bookings
          </h1>
          <div className="flex justify-center gap-2 mb-3">
            <div className="h-1 w-8 rounded-full" style={{ background: "#002395" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#FFD600" }} />
            <div className="h-1 w-8 rounded-full" style={{ background: "#CE1126" }} />
          </div>
          <p className="text-base max-w-sm mx-auto animate-fade-in-up"
            style={{ color: "#93c5fd", animationDelay: "0.2s" }}>
            Your cinema session reservations for cultural events
          </p>

          {/* Quick stats */}
          {!loading && bookings.length > 0 && (
            <div className="flex justify-center gap-6 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{bookings.length}</p>
                <p className="text-xs" style={{ color: "#93c5fd" }}>Total</p>
              </div>
              <div className="w-px" style={{ background: "rgba(255,255,255,0.12)" }} />
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: liveCount > 0 ? "#ff6b6b" : "#fff" }}>
                  {liveCount}
                </p>
                <p className="text-xs" style={{ color: "#93c5fd" }}>Live Now</p>
              </div>
              <div className="w-px" style={{ background: "rgba(255,255,255,0.12)" }} />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{confirmedCount}</p>
                <p className="text-xs" style={{ color: "#93c5fd" }}>Active</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="px-4">
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {/* ── Filter tabs ── */}
        {!loading && bookings.length > 0 && (
          <div className="flex gap-2 mt-6 overflow-x-auto scrollbar-hide pb-1">
            {TABS.map(t => {
              const count = filterBookings(bookings, t.key).length;
              const active = activeTab === t.key;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 hover:scale-105"
                  style={active
                    ? { background: "#002395", color: "#fff", boxShadow: "0 2px 10px rgba(0,35,149,0.35)" }
                    : { background: "#f3f4f6", color: "#6b7280" }}>
                  {t.label}
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={active ? { background: "rgba(255,255,255,0.2)", color: "#fff" } : { background: "#e5e7eb", color: "#6b7280" }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="mt-6 space-y-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 rounded-2xl mt-8"
            style={{ background: "linear-gradient(135deg,#0a0f2e,#0d1a4a,#0a0f2e)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(0,35,149,0.2)" }}>
              <svg className="w-7 h-7" style={{ color: "#93c5fd" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-white mb-1">No bookings yet</p>
            <p className="text-xs mb-5" style={{ color: "#64748b" }}>
              Reserve your spot at a cinema session to watch cultural events live.
            </p>
            <Link to="/cinema"
              className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg,#002395,#1a4db0)", color: "#fff", boxShadow: "0 2px 14px rgba(0,35,149,0.4)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              Browse Cinema Sessions
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 rounded-2xl mt-6"
            style={{ background: "#f9fafb", border: "2px dashed #e5e7eb" }}>
            <p className="text-sm font-medium text-gray-500">No {activeTab} bookings</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3 mb-6">
            {filtered.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                cancellingId={cancelling}
                confirmId={confirmId}
                onCancelRequest={handleCancelRequest}
                onCancelConfirm={handleCancelConfirm}
                onCancelDismiss={handleCancelDismiss}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
