
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { Role, ApprovalStatus } from '../../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { state, dispatch } = useData();
  const { showNotification } = useNotification();

  if (!user) return null;
  
  const today = new Date().toISOString().slice(0, 10);
  const todaysAttendance = state.attendance.find(a => a.userId === user.id && a.date === today);

  const handleMarkPresent = () => {
    if (!todaysAttendance) {
        const newAttendance = {
            id: `att-${Date.now()}`,
            userId: user.id,
            date: today,
            checkInTime: new Date().toLocaleTimeString(),
            status: ApprovalStatus.PENDING,
        };
        dispatch({ type: 'ADD_ATTENDANCE', payload: newAttendance });
        showNotification("RECORDED SUCCESSFULLY");
    }
  };

  const pendingUserApprovals = state.users.filter(u => u.approvalStatus === ApprovalStatus.PENDING).length;
  const pendingAttendanceApprovals = state.attendance.filter(a => a.status === ApprovalStatus.PENDING).length;

  const Card = ({ title, value, details }: { title: string, value: string | number, details: string}) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-500">{title}</h3>
        <p className="text-3xl font-bold mt-2 text-gray-800">{value}</p>
        <p className="text-sm text-gray-400 mt-1">{details}</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.details.name}!</h1>
      <p className="text-gray-600 mt-2">Here's a summary of your business activities.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {user.role === Role.ADMIN && (
              <>
                <Card title="Pending User Approvals" value={pendingUserApprovals} details="New employees waiting for access."/>
                <Card title="Pending Attendance" value={pendingAttendanceApprovals} details="Attendance records to approve."/>
              </>
          )}
          <Card title="Total Employees" value={state.users.length} details="Across all roles."/>
          <Card title="Items in Inventory" value={state.items.length} details="Unique item types."/>
      </div>
      
      {user.role === Role.EMPLOYEE && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Daily Attendance</h2>
            {todaysAttendance ? (
                <div>
                    <p className="text-green-600 font-semibold">You are marked present for today.</p>
                    <p>Checked in at: {todaysAttendance.checkInTime}</p>
                    <p>Status: <span className={`font-semibold ${todaysAttendance.status === ApprovalStatus.APPROVED ? 'text-green-500' : 'text-yellow-500'}`}>{todaysAttendance.status}</span></p>
                </div>
            ) : (
                <div>
                    <p className="mb-4">You have not marked your attendance for today.</p>
                    <button onClick={handleMarkPresent} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                        Mark Present
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;