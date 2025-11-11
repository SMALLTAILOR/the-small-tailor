
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS, APP_NAME, ICONS } from '../../constants';
import { Role } from '../../types';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="w-64 bg-slate-800 shadow-md flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-slate-700">
        <div className="flex items-center text-white">
          <span className="w-8 h-8 mr-2 text-primary-400">{ICONS.logo}</span>
          <span className="text-xl font-bold">{APP_NAME}</span>
        </div>
      </div>
      <nav className="flex-1 mt-5">
        <ul>
          {NAV_ITEMS.filter(item => item.roles.includes(user.role)).map(item => {
            const itemName = item.href === 'wip' && user.role === Role.ADMIN ? 'Assign Cost' : item.name;
            return (
              <li key={item.href}>
                <button
                  onClick={() => setActivePage(item.href)}
                  className={`w-full text-left flex items-center px-6 py-3 my-1 transition-colors duration-200 ${
                    activePage === item.href
                      ? 'bg-slate-900 text-primary-400 border-r-4 border-primary-500'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="w-6 h-6 mr-3">{item.icon}</span>
                  {itemName}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="w-full text-left flex items-center px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-md"
        >
          <span className="w-6 h-6 mr-3">{ICONS.logout}</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;