import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import shieldPng from '../../../lib/shield.png';

/* ── Icons ── */
const Icon = ({ d, d2, viewBox = "0 0 24 24" }) => (
  <svg className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }}
    fill="none" viewBox={viewBox} stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
);

const ICONS = {
  overview:  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  users:     "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  review:    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  published: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  cinema:    "M15 10l4.553-2.069A1 1 0 0121 8.868V15.132a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  analytics: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  config:    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  audit:     "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  model:     "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  logout:    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
};

const NAV_ITEMS = [
  { to: "/admin",          end: true,  label: "Overview",       icon: "overview"  },
  { to: "/admin/users",               label: "Users",           icon: "users"     },
  { to: "/admin/review",              label: "Content Review",  icon: "review"    },
  { to: "/admin/content",             label: "Published",       icon: "published" },
  { to: "/admin/cinema",              label: "Cinema",          icon: "cinema"    },
  { to: "/admin/analytics",           label: "Analytics",       icon: "analytics" },
  { to: "/admin/config",              label: "Config",          icon: "config"    },
  { to: "/admin/audit",               label: "Audit Log",       icon: "audit"     },
  { to: "/admin/model",               label: "ML Model",        icon: "model"     },
];

/* ── Nguni shield logo ── */
const ShieldLogo = () => (
  <img src={shieldPng} alt="Nguni Shield" width="26" height="32" style={{ objectFit: "contain" }} />
);

/* ── Initials avatar ── */
const Avatar = ({ name, size = 32 }) => {
  const initials = name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div className="rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
      style={{ width: size, height: size, background: "linear-gradient(135deg,#002395,#1a4db0)" }}>
      {initials}
    </div>
  );
};

/* ── Single nav item ── */
const NavItem = ({ to, end, label, icon }) => (
  <NavLink to={to} end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
        isActive
          ? "text-white"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`
    }
    style={({ isActive }) => isActive ? {
      background: "linear-gradient(135deg,rgba(206,17,38,0.25),rgba(206,17,38,0.12))",
      boxShadow: "inset 3px 0 0 #CE1126",
    } : {}}>
    {({ isActive }) => (
      <>
        <span style={{ color: isActive ? "#ff6b6b" : undefined }}>
          <Icon d={ICONS[icon]} />
        </span>
        <span>{label}</span>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: "#CE1126" }} />
        )}
      </>
    )}
  </NavLink>
);

/* ── Layout ── */
const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen flex" style={{ background: "#f1f5f9" }}>

      {/* ══ SIDEBAR ══ */}
      <aside className="sticky top-0 h-screen flex flex-col flex-shrink-0 overflow-y-auto overflow-x-hidden transition-all duration-300"
        style={{
          width: 220,
          background: "linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}>

        {/* Logo */}
        <div className="px-4 py-5 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <ShieldLogo />
          <div className="min-w-0">
            <p className="text-white font-black text-sm leading-tight tracking-tight">Swazi</p>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#FFD600" }}>Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-bold uppercase tracking-widest px-3 mb-3" style={{ color: "rgba(148,163,184,0.5)" }}>
            Management
          </p>
          {NAV_ITEMS.slice(0, 5).map(item => (
            <NavItem key={item.to} {...item} />
          ))}

          <p className="text-xs font-bold uppercase tracking-widest px-3 mb-3 mt-5" style={{ color: "rgba(148,163,184,0.5)" }}>
            System
          </p>
          {NAV_ITEMS.slice(5).map(item => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* User panel */}
        <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-2"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <Avatar name={user.name} size={30} />
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate">{user.name}</p>
                <p className="text-xs capitalize truncate" style={{ color: "#FFD600", fontSize: 10 }}>
                  {user.role?.replace("_", " ")}
                </p>
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-red-500/10 group"
            style={{ color: "rgba(148,163,184,0.7)" }}>
            <span className="group-hover:text-red-400 transition-colors">
              <Icon d={ICONS.logout} />
            </span>
            <span className="group-hover:text-red-400 transition-colors">Sign out</span>
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
