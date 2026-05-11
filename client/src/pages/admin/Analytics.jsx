import { useState, useEffect } from "react";
import { getAnalyticsSummary } from "../../api/admin.api";

const Bar = ({ value, max, color = "bg-red-600", label, sublabel }) => (
  <div className="flex items-center gap-3">
    <div className="w-24 text-right flex-shrink-0">
      <p className="text-xs text-gray-700 font-medium truncate">{label}</p>
      {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
    </div>
    <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden relative">
      <div
        className={`h-full ${color} rounded-lg transition-all duration-500`}
        style={{ width: max > 0 ? `${Math.max(2, (value / max) * 100)}%` : "2%" }}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-700">
        {value}
      </span>
    </div>
  </div>
);

const ROLE_COLOR = { admin: "bg-purple-500", user: "bg-gray-400", history_keeper: "bg-amber-500", ceremony_keeper: "bg-orange-500" };
const STATUS_COLOR = { pending_review: "bg-amber-400", published: "bg-green-500", rejected: "bg-red-500", draft: "bg-gray-300" };
const SOURCE_COLOR = { db_only: "bg-green-500", hybrid: "bg-blue-500", ai_only: "bg-purple-500" };

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalyticsSummary()
      .then(setSummary)
      .catch(() => setError("Failed to load analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-40" />)}
        </div>
      </div>
    );
  }

  const maxUser = summary?.userCounts ? Math.max(...summary.userCounts.map((r) => Number(r.count)), 1) : 1;
  const maxContent = summary?.contentCounts ? Math.max(...summary.contentCounts.map((r) => Number(r.count)), 1) : 1;
  const maxPrompt = summary?.promptStats ? Math.max(...summary.promptStats.map((r) => Number(r.count)), 1) : 1;
  const maxBooking = summary?.bookingStats ? Math.max(...summary.bookingStats.map((r) => Number(r.count)), 1) : 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform usage at a glance</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Users by role */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Users by Role</h2>
          <div className="space-y-2.5">
            {summary?.userCounts?.map((r) => (
              <Bar
                key={r.role}
                label={r.role.replace("_", " ")}
                value={Number(r.count)}
                max={maxUser}
                color={ROLE_COLOR[r.role] || "bg-gray-400"}
              />
            ))}
            {!summary?.userCounts?.length && <p className="text-sm text-gray-400">No data</p>}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
            Total: {summary?.userCounts?.reduce((a, r) => a + Number(r.count), 0) ?? 0} users
          </div>
        </div>

        {/* Ceremonies by status */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Ceremonies by Status</h2>
          <div className="space-y-2.5">
            {summary?.contentCounts?.map((r) => (
              <Bar
                key={r.status}
                label={r.status.replace("_", " ")}
                value={Number(r.count)}
                max={maxContent}
                color={STATUS_COLOR[r.status] || "bg-gray-400"}
              />
            ))}
            {!summary?.contentCounts?.length && <p className="text-sm text-gray-400">No data</p>}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
            Total: {summary?.contentCounts?.reduce((a, r) => a + Number(r.count), 0) ?? 0} ceremonies
          </div>
        </div>

        {/* AI prompt sources */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">AI Query Sources</h2>
          <div className="space-y-2.5">
            {summary?.promptStats?.map((r) => (
              <Bar
                key={r.source}
                label={r.source?.replace("_", " ") || "unknown"}
                sublabel={r.source === "db_only" ? "Platform data" : r.source === "hybrid" ? "Combined" : "AI fallback"}
                value={Number(r.count)}
                max={maxPrompt}
                color={SOURCE_COLOR[r.source] || "bg-gray-400"}
              />
            ))}
            {!summary?.promptStats?.length && <p className="text-sm text-gray-400">No AI queries yet</p>}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
            Total: {summary?.promptStats?.reduce((a, r) => a + Number(r.count), 0) ?? 0} queries
          </div>
        </div>

        {/* Booking trend (last 30 days) */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Booking Trend (Last 30 Days)</h2>
          {summary?.bookingStats?.length > 0 ? (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {[...summary.bookingStats].slice(0, 30).map((r) => (
                <Bar
                  key={r.date}
                  label={new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  value={Number(r.count)}
                  max={maxBooking}
                  color="bg-blue-500"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No bookings yet</p>
          )}
          <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
            Total recent: {summary?.bookingStats?.reduce((a, r) => a + Number(r.count), 0) ?? 0} bookings
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
