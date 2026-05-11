import { useState, useEffect, useCallback } from "react";
import { getAuditLog } from "../../api/admin.api";

const fmt = (d) =>
  new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError("");
    getAuditLog({ page, limit: 50 })
      .then((data) => {
        setLogs(data);
        setHasMore(data.length === 50);
      })
      .catch(() => setError("Failed to load audit log."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Admin actions and system events</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-24" /></td>
                  <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-20" /></td>
                  <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-16" /></td>
                  <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded w-28" /></td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-16 text-gray-400 text-sm">
                  No audit log entries yet.
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr key={log.id ?? i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{log.admin_name}</td>
                  <td className="px-4 py-3 text-gray-700 capitalize">{log.action?.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {log.entity_type && (
                      <span className="capitalize">
                        {log.entity_type.replace(/_/g, " ")}
                        {log.entity_id ? ` #${log.entity_id}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmt(log.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500">Page {page}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}
            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Previous</button>
          <button onClick={() => setPage((p) => p + 1)} disabled={!hasMore}
            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
