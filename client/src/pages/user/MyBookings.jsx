import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../../api/cinema.api";

const STATUS_STYLE = {
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500",
  attended: "bg-blue-100 text-blue-800",
};
const SESSION_STATUS_STYLE = {
  scheduled: "bg-blue-100 text-blue-800",
  live: "bg-green-100 text-green-800",
  ended: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "TBD";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (booking) => {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(booking.id);
    try {
      await cancelBooking(booking.id);
      setBookings((bs) =>
        bs.map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b))
      );
    } catch {
      setError("Failed to cancel booking.");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Bookings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your cinema session bookings</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="h-6 w-20 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-medium text-gray-500">No bookings yet</p>
          <Link to="/cinema" className="btn-primary inline-flex mt-4 text-xs">Browse Cinema Sessions</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{b.title}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${SESSION_STATUS_STYLE[b.session_status] || "bg-gray-100 text-gray-600"}`}>
                    {b.session_status}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[b.booking_status || "confirmed"]}`}>
                    {b.booking_status || "confirmed"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="capitalize">{b.type}</span> · {fmt(b.scheduled_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {b.session_status === "live" && (
                  <Link to={`/cinema/${b.cinema_id}`} className="btn-primary text-xs px-3 py-1.5">
                    Watch
                  </Link>
                )}
                {b.session_status === "scheduled" && (!b.booking_status || b.booking_status === "confirmed") && (
                  <button
                    onClick={() => handleCancel(b)}
                    disabled={cancelling === b.id}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600
                               hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {cancelling === b.id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
