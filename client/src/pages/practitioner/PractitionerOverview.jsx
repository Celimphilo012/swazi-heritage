import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyCeremonies } from "../../api/ceremonies.api";
import { getMyLineageRecords } from "../../api/lineage.api";

const STATUS_CFG = {
  pending_review: { label: "Pending",   color: "#d97706", bg: "rgba(217,119,6,0.1)"   },
  published:      { label: "Published", color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  rejected:       { label: "Rejected",  color: "#CE1126", bg: "rgba(206,17,38,0.1)"   },
  draft:          { label: "Draft",     color: "#64748b", bg: "rgba(100,116,139,0.1)" },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

const StatCard = ({ label, value, color, sublabel }) => (
  <div className="rounded-2xl p-5 flex items-center gap-3"
    style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
    <div className="w-2 h-12 rounded-full flex-shrink-0" style={{ background: color }} />
    <div>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="text-3xl font-black text-slate-800">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
    </div>
  </div>
);

const PractitionerOverview = () => {
  const { user } = useAuth();
  const isCeremony = user?.role === "ceremony_keeper";
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const fetch = isCeremony ? getMyCeremonies() : getMyLineageRecords();
    fetch.then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [isCeremony]);

  const counts = {
    total:     items.length,
    pending:   items.filter(i => i.status === "pending_review").length,
    published: items.filter(i => i.status === "published").length,
    rejected:  items.filter(i => i.status === "rejected").length,
  };

  const rejectedWithNote = items.filter(i => i.status === "rejected" && i.rejection_note);
  const recent = items.slice(0, 5);

  const contentPath   = isCeremony ? "/practitioner/ceremonies" : "/practitioner/lineage";
  const newPath       = isCeremony ? "/practitioner/ceremonies/new" : "/practitioner/lineage/new";
  const contentLabel  = isCeremony ? "ceremony" : "lineage record";

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-5"
        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", boxShadow: "0 4px 20px rgba(15,23,42,0.2)" }}>
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 3 }}>
          <div className="flex-1" style={{ background: "#002395" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#CE1126" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#002395" }} />
        </div>
        <h1 className="text-xl font-black text-white">
          {greeting()}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-xs mt-0.5 capitalize" style={{ color: "#94a3b8" }}>
          {user?.role?.replace(/_/g, " ")} · Here's your content overview
        </p>
      </div>

      {/* Rejection alerts */}
      {rejectedWithNote.length > 0 && (
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(206,17,38,0.05)", border: "1px solid rgba(206,17,38,0.15)" }}>
          <p className="text-sm font-bold mb-2" style={{ color: "#CE1126" }}>
            {rejectedWithNote.length} submission{rejectedWithNote.length !== 1 ? "s" : ""} need your attention
          </p>
          {rejectedWithNote.slice(0, 3).map(item => (
            <div key={item.id} className="text-sm mb-1" style={{ color: "#b91c1c" }}>
              <span className="font-semibold">{item.name || item.title}:</span>{" "}
              <span className="text-xs">{item.rejection_note}</span>
            </div>
          ))}
          <Link to={contentPath}
            className="text-xs font-bold hover:underline mt-1 inline-block" style={{ color: "#CE1126" }}>
            View all rejections →
          </Link>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl h-24 bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total"     value={counts.total}     color="#64748b" />
          <StatCard label="Pending"   value={counts.pending}   color="#d97706" />
          <StatCard label="Published" value={counts.published} color="#10b981" />
          <StatCard label="Rejected"  value={counts.rejected}  color="#CE1126" />
        </div>
      )}

      {/* Recent submissions + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent list */}
        <div className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">Recent Submissions</h2>
            <Link to={contentPath}
              className="text-xs font-semibold hover:underline" style={{ color: "#d97706" }}>
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-5 w-20 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-slate-400 mb-3">Nothing submitted yet.</p>
              <Link to={newPath}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
                Add your first {contentLabel}
              </Link>
            </div>
          ) : (
            <div>
              {recent.map(item => (
                <div key={item.id}
                  className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 gap-3">
                  <p className="text-sm font-semibold text-slate-700 truncate">{item.name || item.title}</p>
                  <StatusPill status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl p-5"
          style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <h2 className="text-sm font-bold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {(isCeremony ? [
              { to: "/practitioner/ceremonies/new", label: "New Ceremony",    primary: true  },
              { to: "/practitioner/ceremonies",     label: "My Ceremonies",   primary: false },
              { to: "/practitioner/songs",          label: "Songs Library",   primary: false },
              { to: "/practitioner/notifications",  label: "Notifications",   primary: false },
            ] : [
              { to: "/practitioner/lineage/new", label: "New Lineage Record", primary: true  },
              { to: "/practitioner/lineage",     label: "My Records",         primary: false },
              { to: "/practitioner/clans",       label: "Manage Clans",       primary: false },
              { to: "/practitioner/notifications",label: "Notifications",     primary: false },
            ]).map(({ to, label, primary }) => (
              <Link key={to} to={to}
                className="block w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-center transition-all hover:opacity-90"
                style={primary
                  ? { background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#fff" }
                  : { background: "#f8fafc", color: "#475569", border: "1px solid #f1f5f9" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PractitionerOverview;
