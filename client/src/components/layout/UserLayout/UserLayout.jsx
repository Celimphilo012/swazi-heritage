import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROLE_HOME } from '../../../utils/constants';

/* ── Mini Swazi shield ── */
const ShieldIcon = () => (
  <svg width="22" height="27" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="16" y1="4"  x2="16" y2="96" stroke="#A07840" strokeWidth="3"   strokeLinecap="round" opacity="0.85"/>
    <polygon points="16,1 11,13 21,13"     fill="#B8B8B8" opacity="0.85"/>
    <line x1="64" y1="4"  x2="64" y2="96" stroke="#A07840" strokeWidth="3"   strokeLinecap="round" opacity="0.85"/>
    <polygon points="64,1 59,13 69,13"     fill="#B8B8B8" opacity="0.85"/>
    <path d="M40,5 C56,5 68,18 68,40 C68,64 56,88 40,100 C24,88 12,64 12,40 C12,18 24,5 40,5Z"
          fill="white" stroke="#111" strokeWidth="2"/>
    <clipPath id="nav-clip">
      <path d="M40,5 C56,5 68,18 68,40 C68,64 56,88 40,100 C24,88 12,64 12,40 C12,18 24,5 40,5Z"/>
    </clipPath>
    <rect x="12" y="5" width="28" height="95" fill="#111" clipPath="url(#nav-clip)"/>
    <path d="M14,42 Q40,35 66,42" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/>
    <line x1="40" y1="3"  x2="40" y2="98" stroke="#7B4A28" strokeWidth="3.5" strokeLinecap="round"/>
    <circle cx="40" cy="2" r="3.5" fill="#FFD600"/>
  </svg>
);

/* ── Flag stripe ── */
const FlagStripe = () => (
  <div className="flex" style={{ height: 3 }}>
    <div className="flex-1" style={{ background: '#002395' }} />
    <div style={{ width: '6%', background: '#FFD600' }} />
    <div className="flex-1" style={{ background: '#CE1126' }} />
    <div style={{ width: '6%', background: '#FFD600' }} />
    <div className="flex-1" style={{ background: '#002395' }} />
  </div>
);

/* ── Nav link with animated underline ── */
const NavItem = ({ to, children, onClick }) => (
  <NavLink to={to} onClick={onClick}
    className="relative pb-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150">
    {({ isActive }) => (
      <>
        <span style={isActive ? { color: '#002395' } : {}}>{children}</span>
        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-transform duration-250 origin-left"
              style={{ background: '#CE1126', transform: isActive ? 'scaleX(1)' : 'scaleX(0)' }} />
      </>
    )}
  </NavLink>
);

/* ── User avatar (initials) ── */
const Avatar = ({ name, email }) => {
  const initial = (name || email || 'U')[0].toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
         style={{ background: 'linear-gradient(135deg,#002395,#1a4db0)' }}>
      {initial}
    </div>
  );
};

/* ── Layout ── */
const UserLayout = () => {
  const { user, logout } = useAuth();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const navLinks = [
    { to: '/explore', label: 'Explore' },
    { to: '/cinema',  label: 'Cinema'  },
    ...(user ? [{ to: '/chat', label: 'AI Chat' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className={`sticky top-0 z-20 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>

        {/* ── Main bar ── */}
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" onClick={closeMenu}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <ShieldIcon />
            <span className="font-bold text-sm leading-tight hidden sm:block" style={{ color: '#001540' }}>
              Swazi <span style={{ color: '#CE1126' }}>Cultural</span> Heritage
            </span>
            <span className="font-bold text-sm sm:hidden" style={{ color: '#001540' }}>
              SCH
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(l => <NavItem key={l.to} to={l.to}>{l.label}</NavItem>)}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to={ROLE_HOME[user.role]}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50 transition-colors">
                  <Avatar name={user.name} email={user.email} />
                  <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                    {user.name || user.email}
                  </span>
                </Link>
                <button onClick={logout}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                  style={{ borderColor: '#e5e7eb', color: '#9ca3af' }}>
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login"
                className="text-sm font-bold px-5 py-2 rounded-lg text-white transition-all hover:brightness-110 hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#002395,#1a4db0)' }}>
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile: avatar (if logged in) + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {user && <Avatar name={user.name} email={user.email} />}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu">
              <span className={`block w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>


        {/* ── Mobile drawer ── */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-96' : 'max-h-0'}`}>
          <div className="bg-white border-t border-gray-100 px-4 py-3 space-y-1">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-800' : 'text-gray-700 hover:bg-gray-50'}`
                }>
                {l.label}
              </NavLink>
            ))}

            <div className="pt-3 mt-1 border-t border-gray-100">
              {user ? (
                <div className="space-y-1">
                  <Link to={ROLE_HOME[user.role]} onClick={closeMenu}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <Avatar name={user.name} email={user.email} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user.name || 'My account'}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </Link>
                  <button onClick={() => { logout(); closeMenu(); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={closeMenu}
                  className="flex items-center justify-center text-sm font-bold px-5 py-2.5 rounded-lg text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#002395,#1a4db0)' }}>
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8"><Outlet /></main>
    </div>
  );
};

export default UserLayout;
