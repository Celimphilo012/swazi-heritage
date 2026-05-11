import { useState, useEffect, useCallback } from "react";
import { getPublishedLineage } from "../../api/lineage.api";

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const ClanItem = ({ clan }) => (
  <div className="pl-4 border-l-2 border-amber-200 ml-4">
    <p className="text-sm font-medium text-gray-800">{clan.name}</p>
    {clan.royal_connection && <p className="text-xs text-gray-500">Connection: {clan.royal_connection}</p>}
    {clan.founding_era && <p className="text-xs text-gray-500">Era: {clan.founding_era}</p>}
    {clan.description && <p className="text-xs text-gray-600 mt-1">{clan.description}</p>}
  </div>
);

const LineageCard = ({ record }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900">{record.title}</h3>
          {record.era && <p className="text-xs text-gray-500 mt-0.5">{record.era}</p>}
          {record.creator_name && <p className="text-xs text-gray-400 mt-0.5">By {record.creator_name}</p>}
          {record.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-3">{record.description}</p>
          )}
        </div>
        {record.clans?.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {expanded ? "Hide" : `${record.clans.length}`} clan{record.clans.length !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {expanded && record.clans?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Associated Clans</p>
          {record.clans.map((c) => <ClanItem key={c.id} clan={c} />)}
        </div>
      )}
    </div>
  );
};

const LineageExplorer = () => {
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRecords = useCallback(() => {
    setLoading(true);
    setError("");
    getPublishedLineage({ page, limit: 10 })
      .then(({ data, meta: m }) => { setRecords(data); setMeta(m); })
      .catch(() => setError("Failed to load lineage records."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Royal Lineage Records</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Documented royal lineages and clan histories of the Kingdom of Eswatini
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">No lineage records published yet.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">{meta.total} records</p>
          <div className="space-y-4">
            {records.map((r) => <LineageCard key={r.id} record={r} />)}
          </div>
        </>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">Page {page} of {meta.totalPages}</p>
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

export default LineageExplorer;
