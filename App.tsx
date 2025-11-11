
import React from 'react';
// FIX: Import `useAuth` to use the authentication context.
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
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {user ? <MainLayout /> : <LoginScreen />}
    </div>
  );
};

export default App;
