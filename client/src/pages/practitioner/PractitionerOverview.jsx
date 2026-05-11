import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyCeremonies } from "../../api/ceremonies.api";
import { getMyLineageRecords } from "../../api/lineage.api";

const STATUS_STYLE = {
  pending_review: "badge-pending",
  published: "badge-published",
  rejected: "badge-rejected",
  draft: "badge-draft",
};
const STATUS_LABEL = { pending_review: "Pending Review", published: "Published", rejected: "Rejected", draft: "Draft" };

const StatCard = ({ label, value, color }) => (
  <div className="card">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
  </div>
);

const PractitionerOverview = () => {
  const { user } = useAuth();
  const isCeremony = user?.role === "ceremony_keeper";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = isCeremony ? getMyCeremonies() : getMyLineageRecords();
    fetch.then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [isCeremony]);

  const counts = {
    pending: items.filter((i) => i.status === "pending_review").length,
    published: items.filter((i) => i.status === "published").length,
    rejected: items.filter((i) => i.status === "rejected").length,
    draft: items.filter((i) => i.status === "draft").length,
  };

  const rejectedWithNote = items.filter((i) => i.status === "rejected" && i.rejection_note);
  const recent = [...items].slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-gray-500 mt-0.5 capitalize">{user?.role?.replace("_", " ")}</p>
      </div>

      {/* Rejection alerts */}
      {rejectedWithNote.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-800 mb-2">
            {rejectedWithNote.length} submission{rejectedWithNote.length !== 1 ? "s" : ""} rejected
          </p>
          {rejectedWithNote.slice(0, 3).map((item) => (
            <div key={item.id} className="text-sm text-red-700 mb-1">
              <span className="font-medium">{item.name || item.title}:</span>{" "}
              <span>{item.rejection_note}</span>
            </div>
          ))}
          <Link
            to={isCeremony ? "/practitioner/ceremonies" : "/practitioner/lineage"}
            className="text-xs text-red-700 font-medium hover:underline mt-1 inline-block"
          >
            View all rejections →
          </Link>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Submitted" value={items.length} color="text-gray-700" />
          <StatCard label="Pending" value={counts.pending} color="text-amber-600" />
          <StatCard label="Published" value={counts.published} color="text-green-600" />
          <StatCard label="Rejected" value={counts.rejected} color="text-red-600" />
        </div>
      )}

      {/* Recent submissions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Recent Submissions</h2>
          <Link
            to={isCeremony ? "/practitioner/ceremonies" : "/practitioner/lineage"}
            className="text-xs text-red-800 hover:underline"
          >
            View all
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse py-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-5 w-20 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nothing submitted yet.{" "}
            <Link to={isCeremony ? "/practitioner/ceremonies/new" : "/practitioner/lineage/new"}
              className="text-red-800 hover:underline">Add your first</Link>.
          </p>
        ) : (
          <div className="space-y-0">
            {recent.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <p className="text-sm text-gray-800 font-medium truncate max-w-[60%]">
                  {item.name || item.title}
                </p>
                <span className={STATUS_STYLE[item.status]}>{STATUS_LABEL[item.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mt-5">
        {isCeremony ? (
          <>
            <Link to="/practitioner/ceremonies/new" className="btn-primary">New Ceremony</Link>
            <Link to="/practitioner/ceremonies" className="btn-secondary">My Ceremonies</Link>
            <Link to="/practitioner/songs" className="btn-secondary">Songs Library</Link>
          </>
        ) : (
          <>
            <Link to="/practitioner/lineage/new" className="btn-primary">New Lineage Record</Link>
            <Link to="/practitioner/lineage" className="btn-secondary">My Records</Link>
            <Link to="/practitioner/clans" className="btn-secondary">Manage Clans</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default PractitionerOverview;
