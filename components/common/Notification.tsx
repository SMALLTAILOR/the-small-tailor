
import React from 'react';
import { useNotification } from '../../context/NotificationContext';

const Notification: React.FC = () => {
  const { notification } = useNotification();

  if (!notification) {
    return null;
  }

  return (
    <div className="fixed top-5 right-5 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
      {notification}
    </div>
  );
};

export default Notification;
