import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../utils/constants';
import shieldPng from '../../../lib/shield.png';
import { getMyCeremonies } from '../../../api/ceremonies.api';
import { getMyLineageRecords } from '../../../api/lineage.api';

const Icon = ({ d, d2, viewBox = "0 0 24 24" }) => (
  <svg style={{ width: 18, height: 18, flexShrink: 0 }}
    fill="none" viewBox={viewBox} stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
);

const ICONS = {
  overview:     "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  ceremonies:   "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  songs:        "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
  lineage:      "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  clans:        "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  notifications:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  profile:      "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  logout:       "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
};

const Avatar = ({ name, size = 32 }) => {
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div className="rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
      style={{ width: size, height: size, background: "linear-gradient(135deg,#92400e,#d97706)" }}>
      {initials}
    </div>
  );
};

const PractitionerLayout = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const isHistory = user?.role === ROLES.HISTORY_KEEPER;

  const roleLabel = isHistory ? "History Keeper" : "Ceremony Keeper";
  const accent    = isHistory ? "#002395" : "#d97706";

  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const fetch = isHistory ? getMyLineageRecords() : getMyCeremonies();
    fetch
      .then(items => {
        setNotifCount(items.filter(i => i.status === 'rejected' || i.status === 'published').length);
      })
      .catch(() => {});
  }, [isHistory]);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>

      {/* ── Sidebar ── */}
      <aside className="sticky top-0 h-screen flex flex-col overflow-y-auto flex-shrink-0"
        style={{ width: 220, background: "linear-gradient(180deg,#0f172a,#1e293b)" }}>

        {/* Brand */}
        <div className="px-4 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <img src={shieldPng} alt="Nguni Shield" width="24" height="30" style={{ objectFit: "contain" }} />
            <div>
              <p className="text-xs font-black text-white leading-tight">Swazi Heritage</p>
              <p className="text-xs leading-tight" style={{ color: accent, fontWeight: 600 }}>{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-bold uppercase tracking-wider px-3 mb-2"
            style={{ color: "rgba(148,163,184,0.5)" }}>Workspace</p>

          {[
            { to: "/practitioner", end: true, label: "Overview",       icon: "overview"   },
            ...(isHistory ? [
              { to: "/practitioner/lineage", label: "Lineage Records", icon: "lineage"    },
              { to: "/practitioner/clans",   label: "Clans",           icon: "clans"      },
            ] : [
              { to: "/practitioner/ceremonies", label: "Ceremonies",   icon: "ceremonies" },
              { to: "/practitioner/songs",      label: "Songs Library",icon: "songs"      },
            ]),
            { to: "/practitioner/notifications", label: "Notifications", icon: "notifications", badge: notifCount },
          ].map(({ to, end, label, icon, badge }) => (
            <NavLink key={to} to={to} end={end}>
              {({ isActive }) => (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                  style={isActive
                    ? { background: "rgba(255,255,255,0.08)", boxShadow: `inset 3px 0 0 ${accent}` }
                    : { background: "transparent" }}>
                  <span style={{ color: isActive ? accent : "#64748b" }}>
                    <Icon d={ICONS[icon]} />
                  </span>
                  <span className="text-sm font-semibold" style={{ color: isActive ? "#fff" : "#94a3b8" }}>
                    {label}
                  </span>
                  {badge > 0 ? (
                    <span className="ml-auto flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
                      style={{ minWidth: 18, height: 18, fontSize: 10, background: "#CE1126", padding: "0 4px" }}>
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : isActive ? (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} />
                  ) : null}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User panel */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <NavLink to="/practitioner/profile">
            {({ isActive }) => (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 transition-all cursor-pointer"
                style={isActive
                  ? { background: "rgba(255,255,255,0.08)", boxShadow: `inset 3px 0 0 ${accent}` }
                  : { background: "transparent" }}>
                <span style={{ color: isActive ? accent : "#64748b" }}><Icon d={ICONS.profile} /></span>
                <span className="text-sm font-semibold" style={{ color: isActive ? "#fff" : "#94a3b8" }}>Profile</span>
              </div>
            )}
          </NavLink>
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <Avatar name={user?.name} size={28} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-xs truncate" style={{ color: accent }}>{roleLabel}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors group"
            style={{ color: "#64748b" }}
            onMouseEnter={e => e.currentTarget.style.color = "#CE1126"}
            onMouseLeave={e => e.currentTarget.style.color = "#64748b"}>
            <Icon d={ICONS.logout} />
            <span className="text-sm font-semibold">Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default PractitionerLayout;
