import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../utils/constants';

const link = ({ isActive }) =>
  isActive
    ? 'block px-3 py-2 rounded-lg bg-red-50 text-red-800 text-sm font-medium'
    : 'block px-3 py-2 rounded-lg text-gray-600 text-sm hover:bg-gray-50';

const PractitionerLayout = () => {
  const { user, logout } = useAuth();
  const isHistory = user?.role === ROLES.HISTORY_KEEPER;

  return (
    <div className="min-h-screen flex">
      <aside className="sticky top-0 h-screen w-56 bg-white border-r border-gray-100 p-4 flex flex-col gap-1 overflow-y-auto">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider px-3 mb-2">Practitioner</p>
        <NavLink to="/practitioner" end className={link}>Overview</NavLink>
        {isHistory && <>
          <NavLink to="/practitioner/lineage" className={link}>Lineage Records</NavLink>
          <NavLink to="/practitioner/clans"   className={link}>Clans</NavLink>
        </>}
        {!isHistory && <>
          <NavLink to="/practitioner/ceremonies" className={link}>Ceremonies</NavLink>
          <NavLink to="/practitioner/songs"      className={link}>Songs Library</NavLink>
        </>}
        <NavLink to="/practitioner/notifications" className={link}>Notifications</NavLink>
        <div className="mt-auto pt-4 border-t border-gray-100">
          <button onClick={logout} className="block px-3 py-2 text-sm text-gray-500 hover:text-red-700 w-full text-left">Sign out</button>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-gray-50"><Outlet /></main>
    </div>
  );
};
export default PractitionerLayout;
