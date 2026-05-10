import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const link = ({ isActive }) =>
  isActive
    ? 'block px-3 py-2 rounded-lg bg-red-50 text-red-800 text-sm font-medium'
    : 'block px-3 py-2 rounded-lg text-gray-600 text-sm hover:bg-gray-50';

const AdminLayout = () => {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-white border-r border-gray-100 p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider px-3 mb-2">Admin</p>
        <NavLink to="/admin"          end className={link}>Overview</NavLink>
        <NavLink to="/admin/users"        className={link}>Users</NavLink>
        <NavLink to="/admin/review"       className={link}>Content Review</NavLink>
        <NavLink to="/admin/content"      className={link}>Published</NavLink>
        <NavLink to="/admin/cinema"       className={link}>Cinema</NavLink>
        <NavLink to="/admin/analytics"    className={link}>Analytics</NavLink>
        <NavLink to="/admin/config"       className={link}>Config</NavLink>
        <NavLink to="/admin/audit"        className={link}>Audit Log</NavLink>
        <div className="mt-auto pt-4 border-t border-gray-100">
          <button onClick={logout} className="block px-3 py-2 text-sm text-gray-500 hover:text-red-700 w-full text-left">Sign out</button>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-gray-50"><Outlet /></main>
    </div>
  );
};
export default AdminLayout;
