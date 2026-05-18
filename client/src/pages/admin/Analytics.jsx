import { useState, useEffect } from "react";
import { getAnalyticsSummary } from "../../api/admin.api";

const AnimBar = ({ value, max, color }) => {
  const [w, setW] = useState(0);
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 2;
  useEffect(() => { const t = setTimeout(() => setW(pct), 100); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="flex-1 h-7 rounded-xl overflow-hidden relative" style={{ background:"#f1f5f9" }}>
      <div className="h-full rounded-xl transition-all duration-700 ease-out" style={{ width:`${w}%`, background: color }} />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color:"#0f172a" }}>
        {value}
      </span>
    </div>
  );
};

const BarRow = ({ label, sublabel, value, max, color }) => (
  <div className="flex items-center gap-3">
    <div className="w-24 flex-shrink-0 text-right">
      <p className="text-xs font-semibold text-slate-600 capitalize">{label}</p>
      {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
    </div>
    <AnimBar value={value} max={max} color={color} />
  </div>
);

const ROLE_CFG   = { admin:"#7c3aed", user:"#94a3b8", history_keeper:"#d97706", ceremony_keeper:"#ea580c" };
const STATUS_CFG = { pending_review:"#f59e0b", published:"#10b981", rejected:"#CE1126", draft:"#94a3b8" };
const SOURCE_CFG = { db_only:"#10b981", hybrid:"#002395", ai_only:"#7c3aed" };

const Card = ({ title, total, totalLabel, children }) => (
  <div className="rounded-2xl p-5" style={{ background:"#fff", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
    <h2 className="text-sm font-bold text-slate-800 mb-4">{title}</h2>
    <div className="space-y-3">{children}</div>
    <div className="mt-4 pt-3 border-t border-slate-50 text-xs font-semibold text-slate-400">
      Total: <span className="text-slate-700 font-bold">{total}</span> {totalLabel}
    </div>
  </div>
);

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getAnalyticsSummary()
      .then(setSummary)
      .catch(() => setError("Failed to load analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 space-y-5 animate-pulse">
      <div className="rounded-2xl h-24" style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)" }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[...Array(4)].map((_,i) => <div key={i} className="rounded-2xl h-48 bg-white" style={{ boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }} />)}
      </div>
    </div>
  );

  const maxUser    = Math.max(...(summary?.userCounts?.map(r=>Number(r.count))??[1]),1);
  const maxContent = Math.max(...(summary?.contentCounts?.map(r=>Number(r.count))??[1]),1);
  const maxPrompt  = Math.max(...(summary?.promptStats?.map(r=>Number(r.count))??[1]),1);
  const maxBooking = Math.max(...(summary?.bookingStats?.map(r=>Number(r.count))??[1]),1);
  const totalUsers    = summary?.userCounts?.reduce((a,r)=>a+Number(r.count),0)??0;
  const totalContent  = summary?.contentCounts?.reduce((a,r)=>a+Number(r.count),0)??0;
  const totalPrompts  = summary?.promptStats?.reduce((a,r)=>a+Number(r.count),0)??0;
  const totalBookings = summary?.bookingStats?.reduce((a,r)=>a+Number(r.count),0)??0;

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
        <h1 className="text-xl font-black text-white">Analytics</h1>
        <p className="text-xs mt-0.5" style={{ color:"#94a3b8" }}>Platform usage overview</p>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Users",    value:totalUsers,    color:"#7c3aed" },
          { label:"Content",  value:totalContent,  color:"#10b981" },
          { label:"AI Queries",value:totalPrompts, color:"#002395" },
          { label:"Bookings", value:totalBookings, color:"#CE1126" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background:"#fff", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
            <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: color }} />
            <div>
              <p className="text-xs font-semibold text-slate-400">{label}</p>
              <p className="text-2xl font-black text-slate-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Users by role */}
        <Card title="Users by Role" total={totalUsers} totalLabel="users">
          {summary?.userCounts?.map(r => (
            <BarRow key={r.role} label={r.role.replace(/_/g," ")}
              value={Number(r.count)} max={maxUser} color={ROLE_CFG[r.role]||"#94a3b8"} />
          ))}
          {!summary?.userCounts?.length && <p className="text-sm text-slate-400">No data</p>}
        </Card>

        {/* Ceremonies by status */}
        <Card title="Ceremonies by Status" total={totalContent} totalLabel="ceremonies">
          {summary?.contentCounts?.map(r => (
            <BarRow key={r.status} label={r.status.replace(/_/g," ")}
              value={Number(r.count)} max={maxContent} color={STATUS_CFG[r.status]||"#94a3b8"} />
          ))}
          {!summary?.contentCounts?.length && <p className="text-sm text-slate-400">No data</p>}
        </Card>

        {/* AI prompt sources */}
        <Card title="AI Query Sources" total={totalPrompts} totalLabel="queries">
          {summary?.promptStats?.map(r => (
            <BarRow key={r.source}
              label={r.source?.replace(/_/g," ")||"unknown"}
              sublabel={r.source==="db_only"?"Platform data":r.source==="hybrid"?"Combined":"AI fallback"}
              value={Number(r.count)} max={maxPrompt} color={SOURCE_CFG[r.source]||"#94a3b8"} />
          ))}
          {!summary?.promptStats?.length && <p className="text-sm text-slate-400">No AI queries yet</p>}
        </Card>

        {/* Booking trend */}
        <div className="rounded-2xl p-5" style={{ background:"#fff", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
          <h2 className="text-sm font-bold text-slate-800 mb-4">Booking Trend (Last 30 Days)</h2>
          {summary?.bookingStats?.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {summary.bookingStats.slice(0,30).map(r => (
                <BarRow key={r.date}
                  label={new Date(r.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                  value={Number(r.count)} max={maxBooking}
                  color="linear-gradient(90deg,#002395,#CE1126)" />
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No bookings yet</p>}
          <div className="mt-4 pt-3 border-t border-slate-50 text-xs font-semibold text-slate-400">
            Total recent: <span className="text-slate-700 font-bold">{totalBookings}</span> bookings
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
