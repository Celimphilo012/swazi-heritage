import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAnalyticsSummary } from "../../api/admin.api";

const StatCard = ({ label, value, sub, color, to }) => {
  const card = (
    <div className={`card hover:shadow-md transition-shadow ${to ? "cursor-pointer" : ""}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
};

const BarRow = ({ label, value, max, color = "bg-red-600" }) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="text-gray-700 capitalize">{label}</span>
      <span className="text-gray-500 font-medium">{value}</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all`}
        style={{ width: max > 0 ? `${(value / max) * 100}%` : "0%" }}
      />
    </div>
  </div>
);

const ROLE_COLOR = {
  admin: "bg-purple-500",
  user: "bg-gray-400",
  history_keeper: "bg-amber-500",
  ceremony_keeper: "bg-orange-500",
};
const STATUS_COLOR = {
  pending_review: "bg-amber-400",
  published: "bg-green-500",
  rejected: "bg-red-500",
  draft: "bg-gray-300",
};

const AdminOverview = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalyticsSummary()
      .then(setSummary)
      .catch(() => setError("Failed to load analytics."))
      .finally(() => setLoading(false));
  }, []);

  const totalUsers = summary?.userCounts?.reduce((acc, r) => acc + Number(r.count), 0) ?? 0;
  const pendingCount = summary?.contentCounts?.find((r) => r.status === "pending_review")?.count ?? 0;
  const publishedCount = summary?.contentCounts?.find((r) => r.status === "published")?.count ?? 0;
  const totalPrompts = summary?.promptStats?.reduce((acc, r) => acc + Number(r.count), 0) ?? 0;
  const maxUser = summary?.userCounts ? Math.max(...summary.userCounts.map((r) => Number(r.count))) : 1;
  const maxContent = summary?.contentCounts ? Math.max(...summary.contentCounts.map((r) => Number(r.count))) : 1;

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform health at a glance</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={totalUsers} color="text-purple-700" to="/admin/users" />
        <StatCard
          label="Pending Review"
          value={pendingCount}
          sub={pendingCount > 0 ? "Needs attention" : "All clear"}
          color={pendingCount > 0 ? "text-amber-600" : "text-green-600"}
          to="/admin/review"
        />
        <StatCard label="Published Content" value={publishedCount} color="text-green-700" to="/admin/content" />
        <StatCard label="AI Queries" value={totalPrompts} color="text-blue-700" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Users by role */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Users by Role</h2>
          <div className="space-y-3">
            {summary?.userCounts?.map((r) => (
              <BarRow
                key={r.role}
                label={r.role.replace("_", " ")}
                value={Number(r.count)}
                max={maxUser}
                color={ROLE_COLOR[r.role] || "bg-gray-400"}
              />
            ))}
          </div>
        </div>

        {/* Content by status */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Ceremonies by Status</h2>
          <div className="space-y-3">
            {summary?.contentCounts?.map((r) => (
              <BarRow
                key={r.status}
                label={r.status.replace("_", " ")}
                value={Number(r.count)}
                max={maxContent}
                color={STATUS_COLOR[r.status] || "bg-gray-400"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* AI prompt sources */}
      {summary?.promptStats?.length > 0 && (
        <div className="card mb-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">AI Query Sources</h2>
          <div className="flex flex-wrap gap-4">
            {summary.promptStats.map((r) => (
              <div key={r.source} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  r.source === "db_only" ? "bg-green-500" : r.source === "hybrid" ? "bg-blue-500" : "bg-purple-500"
                }`} />
                <span className="text-sm text-gray-700 capitalize">{r.source?.replace("_", " ")}</span>
                <span className="text-sm font-semibold text-gray-900">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/review" className="btn-primary text-xs">
            Review Queue {pendingCount > 0 && `(${pendingCount})`}
          </Link>
          <Link to="/admin/users" className="btn-secondary text-xs">
            Manage Users
          </Link>
          <Link to="/admin/cinema" className="btn-secondary text-xs">
            Cinema Sessions
          </Link>
          <Link to="/admin/config" className="btn-secondary text-xs">
            System Config
          </Link>
          <Link to="/admin/analytics" className="btn-secondary text-xs">
            Full Analytics
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
