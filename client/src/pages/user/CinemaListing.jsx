import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCinemaSessions, bookSession, getMyBookings } from "../../api/cinema.api";

const POLL_INTERVAL = 30_000;

const STATUS_STYLE = {
  scheduled: "bg-blue-100 text-blue-800",
  live: "bg-green-100 text-green-800",
  ended: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};
const TYPE_STYLE = { live: "bg-red-100 text-red-800", recorded: "bg-purple-100 text-purple-800" };

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "TBD";

const CinemaListing = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [myBookings, setMyBookings] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);
  const [bookMsg, setBookMsg] = useState("");
  const intervalRef = useRef(null);

  const fetchSessions = (initial = false) => {
    if (initial) setLoading(true);
    const fetches = [getCinemaSessions({ limit: 20 })];
    if (user) fetches.push(getMyBookings());
    Promise.all(fetches)
      .then(([s, b]) => {
        setSessions(s.data || []);
        if (b) setMyBookings(new Set(b.map((bk) => bk.cinema_id)));
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
      setMyBookings((prev) => new Set([...prev, sessionId]));
      setBookMsg("Booked!");
      setTimeout(() => setBookMsg(""), 2000);
    } catch (err) {
      setBookMsg(err.response?.data?.message || "Failed to book.");
    } finally {
      setBooking(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Cultural Cinema</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live and recorded cultural events from the Kingdom of Eswatini</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      {bookMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${bookMsg === "Booked!" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {bookMsg}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-8 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">No upcoming cinema sessions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((s) => {
            const isBooked = myBookings.has(s.id);
            return (
              <div key={s.id} className="card flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">{s.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{fmt(s.scheduled_at)}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[s.status]}`}>
                      {s.status}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TYPE_STYLE[s.type]}`}>
                      {s.type}
                    </span>
                  </div>
                </div>

                {s.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{s.description}</p>
                )}

                <div className="mt-auto flex items-center gap-2">
                  {s.status === "live" ? (
                    <Link to={`/cinema/${s.id}`}
                      className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Watch Live
                    </Link>
                  ) : isBooked ? (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
                      ✓ Booked
                    </span>
                  ) : s.status === "scheduled" ? (
                    <button
                      onClick={() => handleBook(s.id)}
                      disabled={booking === s.id}
                      className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1"
                    >
                      {booking === s.id && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {booking === s.id ? "Booking..." : "Book Seat"}
                    </button>
                  ) : null}
                  {s.status !== "live" && isBooked && (
                    <span className="text-xs text-gray-400">Session {s.status}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {user && (
        <div className="mt-6 text-center">
          <Link to="/my-bookings" className="text-sm text-red-800 hover:underline">View my bookings →</Link>
        </div>
      )}
    </div>
  );
};

export default CinemaListing;
