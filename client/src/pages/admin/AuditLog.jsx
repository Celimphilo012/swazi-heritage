import { useState, useEffect, useCallback } from "react";
import { getAuditLog } from "../../api/admin.api";

const fmt = d => new Date(d).toLocaleString("en-GB", {
  day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"
});

const ACTION_COLOR = (action) => {
  if (!action) return { color:"#64748b", bg:"rgba(100,116,139,0.1)" };
  if (action.includes("delete") || action.includes("remove")) return { color:"#CE1126", bg:"rgba(206,17,38,0.08)" };
  if (action.includes("create") || action.includes("add"))    return { color:"#10b981", bg:"rgba(16,185,129,0.08)" };
  if (action.includes("update") || action.includes("edit"))   return { color:"#d97706", bg:"rgba(217,119,6,0.08)" };
  if (action.includes("publish") || action.includes("approve")) return { color:"#002395", bg:"rgba(0,35,149,0.08)" };
  return { color:"#64748b", bg:"rgba(100,116,139,0.08)" };
};

const AuditLog = () => {
  const [logs,    setLogs]    = useState([]);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = useCallback(() => {
    setLoading(true); setError("");
    getAuditLog({ page, limit:50 })
      .then(data => { setLogs(data); setHasMore(data.length === 50); })
      .catch(() => setError("Failed to load audit log."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-5"
        style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", boxShadow:"0 4px 20px rgba(15,23,42,0.2)" }}>
        <div className="absolute top-0 left-0 right-0 flex" style={{ height:3 }}>
          <div className="flex-1" style={{ background:"#002395" }} />
          <div style={{ width:"5%", background:"#FFD600" }} />
          <div className="flex-1" style={{ background:"#CE1126" }} />
          <div style={{ width:"5%", background:"#FFD600" }} />
          <div className="flex-1" style={{ background:"#002395" }} />
        </div>
        <h1 className="text-xl font-black text-white">Audit Log</h1>
        <p className="text-xs mt-0.5" style={{ color:"#94a3b8" }}>Admin actions and system events</p>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      <div className="rounded-2xl overflow-hidden" style={{ background:"#fff", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background:"#f8fafc", borderBottom:"1px solid #f1f5f9" }}>
              {["Admin","Action","Entity","When"].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_,i) => (
                <tr key={i} className="animate-pulse" style={{ borderBottom:"1px solid #f8fafc" }}>
                  <td className="px-5 py-3.5"><div className="h-3 bg-slate-100 rounded w-24" /></td>
                  <td className="px-5 py-3.5"><div className="h-5 bg-slate-100 rounded-full w-20" /></td>
                  <td className="px-5 py-3.5"><div className="h-3 bg-slate-100 rounded w-16" /></td>
                  <td className="px-5 py-3.5"><div className="h-3 bg-slate-100 rounded w-28" /></td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-16 text-slate-400 text-sm">
                  No audit log entries yet.
                </td>
              </tr>
            ) : logs.map((log, i) => {
              const ac = ACTION_COLOR(log.action);
              return (
                <tr key={log.id??i} className="transition-colors hover:bg-slate-50"
                  style={{ borderBottom:"1px solid #f8fafc" }}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-700 text-xs">{log.admin_name}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                      style={{ background: ac.bg, color: ac.color }}>
                      {log.action?.replace(/_/g," ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {log.entity_type && (
                      <span className="capitalize">
                        {log.entity_type.replace(/_/g," ")}
                        {log.entity_id ? ` #${log.entity_id}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{fmt(log.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Page {page}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p=>p-1)} disabled={page<=1}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">← Prev</button>
          <button onClick={() => setPage(p=>p+1)} disabled={!hasMore}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next →</button>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
