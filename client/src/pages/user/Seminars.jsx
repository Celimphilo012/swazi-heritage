import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSeminars, bookSeminar, getMySeminarBookings } from "../../api/seminars.api";
import CultureMap from "../../components/common/CultureMap";

const POLL_INTERVAL = 30_000;

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  }) : "TBD";

const FORMATS = [
  { value: "",         label: "All" },
  { value: "online",   label: "Online" },
  { value: "physical", label: "In person" },
];

const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden animate-pulse bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
    <div className="h-1.5 bg-gray-100" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-100 rounded w-2/3" />
      <div className="h-3 bg-gray-50 rounded w-1/3" />
      <div className="h-3 bg-gray-50 rounded w-full" />
      <div className="h-9 bg-gray-100 rounded-xl w-28 mt-2" />
    </div>
  </div>
);

const SeminarCard = ({ s, isBooked, onBook, booking }) => (
  <div className="rounded-2xl overflow-hidden bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
    style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
    <div className="h-1.5" style={{ background: s.format === "online" ? "#002395" : "#d97706" }} />
    <div className="p-5">
      <div className="flex items-start gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 leading-snug">{s.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{fmt(s.scheduled_at)} · {s.duration_minutes} min</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
          style={s.format === "online" ? { background: "rgba(0,35,149,0.08)", color: "#002395" } : { background: "rgba(217,119,6,0.1)", color: "#92400e" }}>
          {s.format === "online" ? "Online" : "In person"}
        </span>
      </div>

      {s.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{s.description}</p>}

      <p className="text-xs text-gray-400 mb-1">Hosted by {s.practitioner_name}</p>
      {s.format === "physical" && s.location_name && (
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {s.location_name}
        </p>
      )}
      <p className="text-xs text-gray-400 mb-4">
        {s.booking_count} booked{s.capacity ? ` / ${s.capacity} spots` : ""}
      </p>

      {isBooked ? (
        <div className="flex items-center gap-2 text-sm font-bold text-green-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          You're booked in
        </div>
      ) : s.capacity && s.booking_count >= s.capacity ? (
        <span className="text-xs font-semibold text-gray-400">Fully booked</span>
      ) : (
        <button onClick={() => onBook(s.id)} disabled={booking === s.id}
          className="flex items-center gap-2 font-bold px-5 py-2 rounded-xl text-sm text-white transition-all hover:scale-105 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
          {booking === s.id && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {booking === s.id ? "Booking…" : "Book a spot"}
        </button>
      )}
    </div>
  </div>
);

const Seminars = () => {
  const { user } = useAuth();
  const [seminars, setSeminars] = useState([]);
  const [myBookings, setMyBookings] = useState(new Set());
  const [format, setFormat] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);
  const [bookMsg, setBookMsg] = useState("");
  const intervalRef = useRef(null);

  const fetchSeminars = (initial = false) => {
    if (initial) setLoading(true);
    const fetches = [getSeminars({ format: format || undefined, limit: 30 })];
    if (user) fetches.push(getMySeminarBookings());
    Promise.all(fetches)
      .then(([s, b]) => {
        setSeminars(s.data || []);
        if (b) setMyBookings(new Set(b.filter((bk) => bk.booking_status !== "cancelled").map((bk) => bk.seminar_id)));
      })
      .catch(() => { if (initial) setError("Failed to load seminars."); })
      .finally(() => { if (initial) setLoading(false); });
  };

  useEffect(() => {
    fetchSeminars(true);
    intervalRef.current = setInterval(() => fetchSeminars(false), POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [user, format]);

  const handleBook = async (id) => {
    if (!user) { window.location.href = "/login"; return; }
    setBooking(id);
    setBookMsg("");
    try {
      await bookSeminar(id);
      setMyBookings((prev) => new Set([...prev, id]));
      setBookMsg("success");
      setTimeout(() => setBookMsg(""), 3000);
    } catch (err) {
      setBookMsg(err.response?.data?.message || "Failed to book.");
    } finally {
      setBooking(null);
    }
  };

  const physicalMarkers = seminars
    .filter((s) => s.format === "physical" && s.latitude && s.longitude)
    .map((s) => ({ lat: s.latitude, lng: s.longitude, title: s.title, subtitle: fmt(s.scheduled_at), type: "ceremony" }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seminars & Workshops</h1>
        <p className="text-sm text-gray-500 mt-1">Book online or in-person cultural sessions led by practitioners.</p>
      </div>

      {user && (
        <Link to="/my-bookings" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: "#002395" }}>
          View my bookings →
        </Link>
      )}

      <div className="flex gap-1.5">
        {FORMATS.map((f) => (
          <button key={f.value} onClick={() => setFormat(f.value)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={format === f.value ? { background: "#0f172a", color: "#fff" } : { background: "#f1f5f9", color: "#64748b" }}>
            {f.label}
          </button>
        ))}
      </div>

      {physicalMarkers.length > 0 && (
        <CultureMap markers={physicalMarkers} zoom={8} height={280} />
      )}

      {bookMsg && (
        <div className={`p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
          bookMsg === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {bookMsg === "success" ? "Booking confirmed!" : bookMsg}
        </div>
      )}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : seminars.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-sm font-semibold text-gray-500">No seminars scheduled yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seminars.map((s) => (
            <SeminarCard key={s.id} s={s} isBooked={myBookings.has(s.id)} onBook={handleBook} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Seminars;
