
import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6">
      <div className="flex items-center">
        <div className="text-right mr-4">
          <p className="font-semibold">{user.details.name}</p>
          <p className="text-sm text-slate-500">{user.role}</p>
        </div>
        <img
          className="w-10 h-10 rounded-full object-cover"
          src={user.details.image}
          alt={user.details.name}
        />
      </div>
    </header>
  );
};

export default Header;