import { useState, useEffect, useCallback } from "react";
import {
  getAdminCeremonies,
  reviewCeremony,
  getAdminLineage,
  reviewLineage,
} from "../../api/admin.api";

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const Skeleton = () => (
  <div className="card animate-pulse flex items-start justify-between gap-4">
    <div className="space-y-2 flex-1">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-100 rounded w-1/5" />
    </div>
    <div className="h-8 w-24 bg-gray-100 rounded-lg" />
  </div>
);

const PublishedContent = () => {
  const [tab, setTab] = useState("ceremonies");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unpublishing, setUnpublishing] = useState(null);

  const fetchItems = useCallback(() => {
    setLoading(true);
    setError("");
    const params = { status: "published", page, limit: 15 };
    const call = tab === "ceremonies" ? getAdminCeremonies(params) : getAdminLineage(params);
    call
      .then(({ data, meta: m }) => { setItems(data); setMeta(m); })
      .catch(() => setError("Failed to load content."))
      .finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleUnpublish = async (item) => {
    setUnpublishing(item.id);
    try {
      if (tab === "ceremonies") {
        await reviewCeremony(item.id, { status: "pending_review" });
      } else {
        await reviewLineage(item.id, { status: "pending_review" });
      }
      fetchItems();
    } catch {
      setError("Failed to unpublish.");
    } finally {
      setUnpublishing(null);
    }
  };

  const switchTab = (t) => { setTab(t); setPage(1); setItems([]); };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Published Content</h1>
        <p className="text-sm text-gray-500 mt-0.5">All live content visible to users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {[{ key: "ceremonies", label: "Ceremonies" }, { key: "lineage", label: "Lineage Records" }].map(
          ({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key ? "border-red-700 text-red-800" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">No published {tab} yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.name || item.title}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>By {item.creator_name}</span>
                  {(item.month_celebrated || item.era) && (
                    <><span>·</span><span>{item.month_celebrated || item.era}</span></>
                  )}
                  <span>·</span>
                  <span>{fmt(item.created_at)}</span>
                </div>
              </div>
              <button
                onClick={() => handleUnpublish(item)}
                disabled={unpublishing === item.id}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-amber-300
                           text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {unpublishing === item.id ? "Moving…" : "Unpublish"}
              </button>
            </div>
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishedContent;
