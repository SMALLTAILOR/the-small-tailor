
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../dashboard/Dashboard';
import UserManagement from '../users/UserManagement';
import AttendanceManagement from '../attendance/AttendanceManagement';
import InventoryManagement from '../inventory/InventoryManagement';
import WipManagement from '../wip/WipManagement';
import Reports from '../reports/Reports';

const MainLayout: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'wip':
        return <WipManagement />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
