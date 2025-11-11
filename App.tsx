
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import LoginScreen from './components/auth/LoginScreen';
import MainLayout from './components/layout/MainLayout';
import Notification from './components/common/Notification';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <NotificationProvider>
          <AppContent />
          <Notification />
        </NotificationProvider>
      </DataProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {user ? <MainLayout /> : <LoginScreen />}
    </div>
  );
};

export default App;