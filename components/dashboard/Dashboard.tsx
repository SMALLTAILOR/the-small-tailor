
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { Role, ApprovalStatus, WorkEntry, SewingOperation, OperationType } from '../../types';

// Helper to get an operation's rate.
const getOperationRate = (opId: string | undefined, operations: SewingOperation[]): number => {
    if (!opId) return 0;
    return operations.find(op => op.id === opId)?.rate || 0;
};

// Helper to get an operation's name.
const getOperationName = (entry: WorkEntry, operations: SewingOperation[]): string => {
    if (entry.type === OperationType.CUTTING) return "Cutting";
    if (!entry.operationId) return 'N/A';
    return operations.find(op => op.id === entry.operationId)?.operationName || 'N/A';
};


const EmployeeDashboard: React.FC = () => {
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
    
    // --- Data Calculations ---
    const thisMonth = today.slice(0, 7);
    
    const userWorkEntries = state.workEntries.filter(e => e.userId === user.id);
    
    const todaysWork = userWorkEntries.filter(e => e.date === today);
    const monthlyWork = userWorkEntries.filter(e => e.date.startsWith(thisMonth));
    const recentWork = userWorkEntries.sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1])).slice(0, 5);

    const calculateEarnings = (entries: WorkEntry[]) => {
        return entries.reduce((total, entry) => {
            const rate = getOperationRate(entry.operationId, state.sewingOperations);
            return total + (rate * (entry.quantity || 0));
        }, 0);
    };

    const todaysEarnings = calculateEarnings(todaysWork);
    const monthlyEarnings = calculateEarnings(monthlyWork);
    const totalPiecesToday = todaysWork.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
    
    const StatusBadge: React.FC<{ status: ApprovalStatus }> = ({ status }) => (
         <span className={`px-3 py-1 text-xs font-medium rounded-full ${status === ApprovalStatus.APPROVED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {status}
        </span>
    );

    const InfoCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; subtext?: string; }> = ({ title, value, icon, subtext }) => (
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
            <div className="flex-shrink-0">{icon}</div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
            </div>
        </div>
    );
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.details.name}!</h1>
            <p className="text-gray-600 mt-2">Here is your performance summary for today.</p>
            
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Status */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Today's Status
                    </h3>
                    {todaysAttendance ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span>Attendance</span>
                                <StatusBadge status={todaysAttendance.status} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span>Check-in Time</span>
                                <span className="font-semibold">{todaysAttendance.checkInTime}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-4 border-2 border-dashed rounded-lg">
                            <p className="mb-4">You have not marked your attendance for today.</p>
                            <button onClick={handleMarkPresent} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                                Mark Present
                            </button>
                        </div>
                    )}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-primary-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-primary-800">Work Entries Today</p>
                            <p className="text-3xl font-bold text-primary-600">{todaysWork.length}</p>
                        </div>
                        <div className="bg-primary-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-primary-800">Total Pieces Today</p>
                            <p className="text-3xl font-bold text-primary-600">{totalPiecesToday}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Earnings */}
                <div className="space-y-6">
                    <InfoCard 
                        title="Today's Estimated Earnings"
                        value={`₹${todaysEarnings.toFixed(2)}`}
                        icon={<div className="p-3 bg-green-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg></div>}
                        subtext="Based on piece-rate work"
                    />
                    <InfoCard 
                        title="This Month's Earnings"
                        value={`₹${monthlyEarnings.toFixed(2)}`}
                        icon={<div className="p-3 bg-blue-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div>}
                        subtext="Total for all work logged"
                    />
                </div>
            </div>
            
            {/* Recent Activity Section */}
            <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    Recent Activity
                </h3>
                 <div className="flow-root">
                    <ul role="list" className="-mb-8">
                        {recentWork.length > 0 ? recentWork.map((entry, entryIdx) => (
                        <li key={entry.id}>
                            <div className="relative pb-8">
                            {entryIdx !== recentWork.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                    <p className="text-sm text-gray-800">
                                        Logged <span className="font-semibold">{entry.quantity || entry.fabricUsedKg || 'N/A'}</span> {entry.quantity ? 'pcs for' : 'kgs for'} <span className="font-semibold">{getOperationName(entry, state.sewingOperations)}</span>
                                    </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                    <time dateTime={entry.date}>{entry.date}</time>
                                </div>
                                </div>
                            </div>
                            </div>
                        </li>
                        )) : (
                            <p className="text-center py-4 text-gray-500">No work has been logged yet.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const AdminManagerDashboard: React.FC = () => {
    const { state } = useData();
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
        <>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Pending User Approvals" value={pendingUserApprovals} details="New employees waiting for access."/>
                <Card title="Pending Attendance" value={pendingAttendanceApprovals} details="Attendance records to approve."/>
                <Card title="Total Employees" value={state.users.length} details="Across all roles."/>
                <Card title="Items in Inventory" value={state.items.length} details="Unique item types."/>
            </div>
        </>
    );
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;
  
  if (user.role === Role.EMPLOYEE) {
    return <EmployeeDashboard />;
  }

  // Admin and Manager View
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.details.name}!</h1>
      <p className="text-gray-600 mt-2">Here's a summary of your business activities.</p>
      <AdminManagerDashboard />
    </div>
  );
};

export default Dashboard;
