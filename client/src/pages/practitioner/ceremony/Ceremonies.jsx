import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyCeremonies } from "../../../api/ceremonies.api";

const STATUS_STYLE = {
  pending_review: "badge-pending",
  published: "badge-published",
  rejected: "badge-rejected",
  draft: "badge-draft",
};

const STATUS_LABEL = {
  pending_review: "Pending Review",
  published: "Published",
  rejected: "Rejected",
  draft: "Draft",
};

const EmptyState = ({ filter }) => (
  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
    <svg
      className="w-10 h-10 text-gray-300 mx-auto mb-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
    <p className="text-sm font-medium text-gray-500">
      {filter
        ? `No ${STATUS_LABEL[filter]?.toLowerCase()} ceremonies`
        : "No ceremonies yet"}
    </p>
    <p className="text-xs text-gray-400 mt-1">
      {!filter && "Start by adding your first ceremony."}
    </p>
    {!filter && (
      <Link
        to="/practitioner/ceremonies/new"
        className="btn-primary inline-flex mt-4 text-xs"
      >
        Add first ceremony
      </Link>
    )}
  </div>
);

const Ceremonies = () => {
  const [ceremonies, setCeremonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    getMyCeremonies(filter || undefined)
      .then(setCeremonies)
      .catch(() => setError("Failed to load ceremonies."))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            My Ceremonies
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ceremonies you have submitted to the platform
          </p>
        </div>
        <Link
          to="/practitioner/ceremonies/new"
          className="btn-primary flex items-center gap-1.5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add ceremony
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {["", "pending_review", "published", "rejected", "draft"].map((val) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              filter === val
                ? "border-red-700 text-red-800"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {val === "" ? "All" : STATUS_LABEL[val]}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-2/3 mt-2" />
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : ceremonies.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-3">
          {ceremonies.map((ceremony) => (
            <div
              key={ceremony.id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {ceremony.name}
                    </h3>
                    <span className={STATUS_STYLE[ceremony.status]}>
                      {STATUS_LABEL[ceremony.status]}
                    </span>
                  </div>
                  {ceremony.month_celebrated && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {ceremony.month_celebrated}
                    </p>
                  )}
                  {ceremony.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {ceremony.description}
                    </p>
                  )}
                  {ceremony.status === "rejected" &&
                    ceremony.rejection_note && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-700">
                        <span className="font-medium">Admin note: </span>
                        {ceremony.rejection_note}
                      </div>
                    )}
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted{" "}
                    {new Date(ceremony.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {ceremony.status !== "published" && (
                    <Link
                      to={`/practitioner/ceremonies/${ceremony.id}/edit`}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Edit
                    </Link>
                  )}
                  {ceremony.status === "published" && (
                    <Link
                      to={`/explore/ceremonies/${ceremony.id}`}
                      className="btn-secondary text-xs px-3 py-1.5"
                      target="_blank"
                    >
                      View live
                    </Link>
                  )}
                  {ceremony.status === "published" && (
                    <Link
                      to={`/practitioner/ceremonies/${ceremony.id}/edit`}
                      className="text-xs text-gray-400 hover:text-gray-700 text-center"
                    >
                      Edit & resubmit
                    </Link>
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

export default Ceremonies;
