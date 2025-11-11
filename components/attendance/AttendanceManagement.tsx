
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Role, ApprovalStatus, Attendance } from '../../types';

const AttendanceManagement: React.FC = () => {
    const { user } = useAuth();
    const { state, dispatch } = useData();

    const AdminView = () => {
        const pendingAttendance = state.attendance.filter(a => a.status === ApprovalStatus.PENDING);

        const handleApproval = (attendanceId: string, status: ApprovalStatus) => {
            dispatch({ type: 'UPDATE_ATTENDANCE_STATUS', payload: { id: attendanceId, status } });
        };

        const getUserName = (userId: string) => state.users.find(u => u.id === userId)?.details.name || 'Unknown';

        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Pending Attendance Approvals</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Employee</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Check-in Time</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingAttendance.map(att => (
                                <tr key={att.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{getUserName(att.userId)}</td>
                                    <td className="px-6 py-4">{att.date}</td>
                                    <td className="px-6 py-4">{att.checkInTime}</td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => handleApproval(att.id, ApprovalStatus.APPROVED)} className="text-green-600 hover:text-green-900">Approve</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pendingAttendance.length === 0 && <p className="text-center py-4 text-gray-500">No pending approvals.</p>}
                </div>
            </div>
        );
    };

    const EmployeeView = () => {
        const myAttendance = state.attendance.filter(a => a.userId === user?.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">My Attendance History</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Check-in Time</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myAttendance.map(att => (
                                <tr key={att.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{att.date}</td>
                                    <td className="px-6 py-4">{att.checkInTime}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${att.status === ApprovalStatus.APPROVED ? 'text-green-800 bg-green-100' : 'text-yellow-800 bg-yellow-100'}`}>
                                            {att.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {myAttendance.length === 0 && <p className="text-center py-4 text-gray-500">No attendance records found.</p>}
                </div>
            </div>
        );
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Attendance</h1>
            {user?.role === Role.ADMIN ? <AdminView /> : <EmployeeView />}
        </div>
    );
};

export default AttendanceManagement;
