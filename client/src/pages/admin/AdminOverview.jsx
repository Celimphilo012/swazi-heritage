import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getAnalyticsSummary } from "../../api/admin.api";
import { useAuth } from "../../context/AuthContext";
import shieldPng from "../../lib/shield.png";

/* ── Animated count-up ── */
const useCountUp = (target, duration = 1000) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(start);
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return val;
};

/* ── Animated bar ── */
const AnimBar = ({ pct, color }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 120); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${width}%`, background: color }} />
    </div>
  );
};

/* ── Stat card ── */
const StatCard = ({ label, rawValue, icon, iconBg, iconColor, sub, subColor, to, delay = 0 }) => {
  const count = useCountUp(rawValue ?? 0, 900);
  const card = (
    <div className="rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group"
      style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", animationDelay: `${delay}ms` }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ background: iconBg }}>
        <svg className="w-5 h-5" style={{ color: iconColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{label}</p>
        <p className="text-3xl font-black text-slate-800 leading-none mt-1">{count}</p>
        {sub && <p className="text-xs font-semibold mt-1.5" style={{ color: subColor || "#94a3b8" }}>{sub}</p>}
      </div>
      {to && (
        <svg className="w-4 h-4 flex-shrink-0 mt-1 opacity-30 group-hover:opacity-70 transition-opacity" style={{ color: "#64748b" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );
  return to ? <Link to={to} className="block">{card}</Link> : card;
};

/* ── Quick action card ── */
const QuickAction = ({ to, icon, label, desc, color, badgeCount }) => (
  <Link to={to}
    className="group flex flex-col gap-2 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
    <div className="flex items-center justify-between">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
        style={{ background: color + "15" }}>
        <svg className="w-4.5 h-4.5" style={{ color, width: 18, height: 18 }} fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      {badgeCount > 0 && (
        <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ background: "#CE1126" }}>
          {badgeCount}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-bold text-slate-800">{label}</p>
      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{desc}</p>
    </div>
  </Link>
);

/* ── Role / status config ── */
const ROLE_CFG = {
  admin:           { color: "#7c3aed", label: "Admins"    },
  user:            { color: "#64748b", label: "Users"     },
  history_keeper:  { color: "#d97706", label: "Historians"},
  ceremony_keeper: { color: "#ea580c", label: "Ceremony"  },
};
const STATUS_CFG = {
  pending_review: { color: "#f59e0b", label: "Pending"   },
  published:      { color: "#10b981", label: "Published" },
  rejected:       { color: "#ef4444", label: "Rejected"  },
  draft:          { color: "#94a3b8", label: "Draft"     },
};

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const fmtDate = () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/* ── Loading skeleton ── */
const Skeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="rounded-2xl h-28" style={{ background: "linear-gradient(135deg,#0f172a,#1e1b4b)" }} />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl h-24 bg-white" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }} />
      ))}
    </div>
  </div>
);

/* ── Page ── */
const AdminOverview = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getAnalyticsSummary()
      .then(setSummary)
      .catch(() => setError("Failed to load analytics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const totalUsers     = summary?.userCounts?.reduce((a, r) => a + Number(r.count), 0) ?? 0;
  const pendingCount   = Number(summary?.contentCounts?.find(r => r.status === "pending_review")?.count ?? 0);
  const publishedCount = Number(summary?.contentCounts?.find(r => r.status === "published")?.count ?? 0);
  const totalPrompts   = summary?.promptStats?.reduce((a, r) => a + Number(r.count), 0) ?? 0;
  const maxUser        = summary?.userCounts ? Math.max(...summary.userCounts.map(r => Number(r.count)), 1) : 1;
  const maxContent     = summary?.contentCounts ? Math.max(...summary.contentCounts.map(r => Number(r.count)), 1) : 1;

  return (
    <div className="p-6 space-y-6">

      {/* ══ HEADER BANNER ══ */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-6 flex items-center justify-between gap-4"
        style={{
          background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)",
          boxShadow: "0 4px 24px rgba(15,23,42,0.3)",
        }}>
        {/* Flag stripe */}
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 4 }}>
          <div className="flex-1" style={{ background: "#002395" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#CE1126" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#002395" }} />
        </div>

        {/* Decorative diamond */}
        <div className="absolute right-24 top-4 opacity-10"
          style={{ width: 60, height: 60, background: "#FFD600", transform: "rotate(45deg)" }} />
        <div className="absolute right-16 bottom-2 opacity-5"
          style={{ width: 40, height: 40, background: "#CE1126", transform: "rotate(45deg)" }} />

        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#FFD600" }}>
            {fmtDate()}
          </p>
          <h1 className="text-2xl font-black text-white">
            {GREETING()}, {user?.name?.split(" ")[0] ?? "Admin"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148,163,184,0.8)" }}>
            Here's what's happening on the platform today.
          </p>
        </div>

        {/* Nguni shield icon */}
        <div className="relative z-10 flex-shrink-0 opacity-90">
          <img src={shieldPng} alt="Nguni Shield" width="48" height="60" style={{ objectFit: "contain" }} />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* ══ STAT CARDS ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users" rawValue={totalUsers}
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          iconBg="rgba(124,58,237,0.12)" iconColor="#7c3aed"
          sub="Platform members" to="/admin/users" delay={0}
        />
        <StatCard
          label="Pending Review" rawValue={pendingCount}
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          iconBg={pendingCount > 0 ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)"}
          iconColor={pendingCount > 0 ? "#f59e0b" : "#10b981"}
          sub={pendingCount > 0 ? "Needs attention" : "All clear"}
          subColor={pendingCount > 0 ? "#f59e0b" : "#10b981"}
          to="/admin/review" delay={60}
        />
        <StatCard
          label="Published" rawValue={publishedCount}
          icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          iconBg="rgba(16,185,129,0.12)" iconColor="#10b981"
          sub="Live ceremonies" to="/admin/content" delay={120}
        />
        <StatCard
          label="AI Queries" rawValue={totalPrompts}
          icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          iconBg="rgba(0,35,149,0.12)" iconColor="#002395"
          sub="Cultural questions" delay={180}
        />
      </div>

      {/* ══ CHARTS ROW ══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Users by role */}
        <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-800">Users by Role</h2>
            <Link to="/admin/users" className="text-xs font-semibold hover:underline" style={{ color: "#002395" }}>
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {summary?.userCounts?.map(r => {
              const cfg = ROLE_CFG[r.role] || { color: "#94a3b8", label: r.role };
              const pct = maxUser > 0 ? Math.round((Number(r.count) / maxUser) * 100) : 0;
              return (
                <div key={r.role}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                      <span className="text-xs font-semibold text-slate-600">{cfg.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{r.count}</span>
                  </div>
                  <AnimBar pct={pct} color={cfg.color} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Ceremonies by status */}
        <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-800">Ceremonies by Status</h2>
            <Link to="/admin/review" className="text-xs font-semibold hover:underline" style={{ color: "#002395" }}>
              Review →
            </Link>
          </div>
          <div className="space-y-4">
            {summary?.contentCounts?.map(r => {
              const cfg = STATUS_CFG[r.status] || { color: "#94a3b8", label: r.status };
              const pct = maxContent > 0 ? Math.round((Number(r.count) / maxContent) * 100) : 0;
              return (
                <div key={r.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                      <span className="text-xs font-semibold text-slate-600">{cfg.label}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{r.count}</span>
                  </div>
                  <AnimBar pct={pct} color={cfg.color} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ AI SOURCES + BOOKINGS ROW ══ */}
      {(summary?.promptStats?.length > 0 || summary?.bookingStats?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* AI sources */}
          {summary?.promptStats?.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <h2 className="text-sm font-bold text-slate-800 mb-4">AI Query Sources</h2>
              <div className="space-y-3">
                {summary.promptStats.map(r => {
                  const color = r.source === "db_only" ? "#10b981" : r.source === "hybrid" ? "#002395" : "#7c3aed";
                  const label = r.source?.replace(/_/g, " ");
                  const total = totalPrompts || 1;
                  const pct = Math.round((Number(r.count) / total) * 100);
                  return (
                    <div key={r.source}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-xs font-semibold text-slate-600 capitalize">{label}</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{r.count} <span className="font-normal text-slate-400">({pct}%)</span></span>
                      </div>
                      <AnimBar pct={pct} color={color} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent booking activity */}
          {summary?.bookingStats?.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <h2 className="text-sm font-bold text-slate-800 mb-4">Recent Bookings (last 30 days)</h2>
              <div className="space-y-2">
                {summary.bookingStats.slice(0, 6).map(r => (
                  <div key={r.date} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-24 flex-shrink-0">{
                      new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                    }</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.05)" }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, (Number(r.count) / 10) * 100)}%`,
                        background: "linear-gradient(90deg,#002395,#CE1126)",
                      }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-4 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ QUICK ACTIONS ══ */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <QuickAction
            to="/admin/review" label="Review Queue" desc="Approve content"
            icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            color="#f59e0b" badgeCount={pendingCount}
          />
          <QuickAction
            to="/admin/users" label="Manage Users" desc="Roles & access"
            icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            color="#7c3aed"
          />
          <QuickAction
            to="/admin/cinema" label="Cinema" desc="Manage sessions"
            icon="M15 10l4.553-2.069A1 1 0 0121 8.868V15.132a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            color="#CE1126"
          />
          <QuickAction
            to="/admin/config" label="System Config" desc="Settings"
            icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            color="#002395"
          />
          <QuickAction
            to="/admin/analytics" label="Analytics" desc="Full reports"
            icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            color="#10b981"
          />
        </div>
      </div>

    </div>
  );
};

export default AdminOverview;
