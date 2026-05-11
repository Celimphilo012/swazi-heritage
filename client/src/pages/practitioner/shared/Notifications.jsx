import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getMyCeremonies } from "../../../api/ceremonies.api";
import { getMyLineageRecords } from "../../../api/lineage.api";

const Notifications = () => {
  const { user } = useAuth();
  const isCeremony = user?.role === "ceremony_keeper";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = isCeremony ? getMyCeremonies() : getMyLineageRecords();
    fetch.then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [isCeremony]);

  const rejected = items.filter((i) => i.status === "rejected");
  const published = items.filter((i) => i.status === "published");
  const pending = items.filter((i) => i.status === "pending_review");

  const editPath = (id) =>
    isCeremony ? `/practitioner/ceremonies/${id}/edit` : `/practitioner/lineage/${id}/edit`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-0.5">Status updates on your submitted content</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse flex gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Rejections first */}
          {rejected.map((item) => (
            <div key={`r-${item.id}`} className="card border-l-4 border-l-red-500">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Rejected: <span className="font-normal">{item.name || item.title}</span>
                  </p>
                  {item.rejection_note ? (
                    <p className="text-xs text-red-700 mt-1 bg-red-50 rounded p-2">
                      <span className="font-medium">Admin note: </span>{item.rejection_note}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-0.5">No rejection note provided.</p>
                  )}
                  <Link to={editPath(item.id)} className="text-xs text-red-700 font-medium hover:underline mt-1.5 inline-block">
                    Edit and resubmit →
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Published */}
          {published.map((item) => (
            <div key={`p-${item.id}`} className="card border-l-4 border-l-green-500">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Published: <span className="font-normal">{item.name || item.title}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Your submission is now live on the platform.</p>
                </div>
              </div>
            </div>
          ))}

          {/* Pending */}
          {pending.map((item) => (
            <div key={`pn-${item.id}`} className="card border-l-4 border-l-amber-400">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Pending review: <span className="font-normal">{item.name || item.title}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Awaiting admin approval.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
