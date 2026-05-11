import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyLineageRecords } from "../../../api/lineage.api";

const STATUS_STYLE = {
  pending_review: "badge-pending",
  published: "badge-published",
  rejected: "badge-rejected",
  draft: "badge-draft",
};
const STATUS_LABEL = { pending_review: "Pending Review", published: "Published", rejected: "Rejected", draft: "Draft" };
const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const LineageRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    getMyLineageRecords(filter || undefined)
      .then(setRecords)
      .catch(() => setError("Failed to load lineage records."))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Lineage Records</h1>
          <p className="text-sm text-gray-500 mt-0.5">Royal lineage records you have submitted</p>
        </div>
        <Link to="/practitioner/lineage/new" className="btn-primary flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add record
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {["", "pending_review", "published", "rejected"].map((val) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              filter === val ? "border-red-700 text-red-800" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}>
            {val === "" ? "All" : STATUS_LABEL[val]}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-medium text-gray-500">
            {filter ? `No ${STATUS_LABEL[filter]?.toLowerCase()} records` : "No lineage records yet"}
          </p>
          {!filter && (
            <Link to="/practitioner/lineage/new" className="btn-primary inline-flex mt-4 text-xs">
              Add first record
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-gray-900">{r.title}</h3>
                    <span className={STATUS_STYLE[r.status]}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  {r.era && (
                    <p className="text-xs text-gray-500 mt-0.5">Era: {r.era}</p>
                  )}
                  {r.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{r.description}</p>
                  )}
                  {r.status === "rejected" && r.rejection_note && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-700">
                      <span className="font-medium">Admin note: </span>{r.rejection_note}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Submitted {fmt(r.created_at)}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {r.status !== "published" && (
                    <Link to={`/practitioner/lineage/${r.id}/edit`}
                      className="btn-secondary text-xs px-3 py-1.5">Edit</Link>
                  )}
                  {r.status === "published" && (
                    <Link to={`/practitioner/lineage/${r.id}/edit`}
                      className="text-xs text-gray-400 hover:text-gray-700">Edit & resubmit</Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LineageRecords;
