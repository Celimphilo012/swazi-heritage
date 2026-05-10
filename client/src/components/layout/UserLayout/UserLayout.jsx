import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROLE_HOME } from '../../../utils/constants';

const UserLayout = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-semibold text-red-800 text-lg">Swazi Cultural Heritage</Link>
        <div className="flex items-center gap-4 text-sm">
          <NavLink to="/explore"  className={({ isActive }) => isActive ? 'text-red-800 font-medium' : 'text-gray-600 hover:text-gray-900'}>Explore</NavLink>
          <NavLink to="/cinema"   className={({ isActive }) => isActive ? 'text-red-800 font-medium' : 'text-gray-600 hover:text-gray-900'}>Cinema</NavLink>
          {user ? (
            <>
              <NavLink to="/chat" className={({ isActive }) => isActive ? 'text-red-800 font-medium' : 'text-gray-600 hover:text-gray-900'}>AI Chat</NavLink>
              <Link to={ROLE_HOME[user.role]} className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <button onClick={logout} className="text-gray-500 hover:text-red-700">Sign out</button>
            </>
          ) : (
            <Link to="/login" className="btn-primary">Sign in</Link>
          )}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8"><Outlet /></main>
    </div>
  );
};
export default UserLayout;
