import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { User, WorkEntry, Role, ApprovalStatus, Attendance } from '../../types';
import { ICONS } from '../../constants';

interface PayrollReportData {
  user: User;
  startDate: string;
  endDate: string;
  workEntries: WorkEntry[];
  totalPresentDays: number;
  totalPieceRateEarnings: number;
}

interface AttendanceReportData {
    user: User;
    startDate: string;
    endDate: string;
    attendanceRecords: Attendance[];
    totalPresentDays: number;
}

interface ReportFormProps {
  onSubmit: (e: React.FormEvent) => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  employees: User[];
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}

const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, selectedUserId, setSelectedUserId, employees, startDate, setStartDate, endDate, setEndDate }) => (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 pb-6 border-b items-end">
        <div className="md:col-span-1">
        <label htmlFor="employee" className="block text-sm font-medium text-gray-700">Employee</label>
        <select id="employee" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" required>
            <option value="">Select Employee</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.details.name}</option>)}
        </select>
        </div>
        <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
        <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" required/>
        </div>
        <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
        <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" required/>
        </div>
        <button type="submit" className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Generate Report</button>
    </form>
);

const Reports: React.FC = () => {
  const { state } = useData();
  const [activeTab, setActiveTab] = useState('payroll');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [payrollReport, setPayrollReport] = useState<PayrollReportData | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportData | null>(null);

  const employees = state.users.filter(u => u.role === Role.EMPLOYEE || u.role === Role.MANAGER);

  const getOperationName = (opId: string | undefined) => {
    if (!opId) return 'N/A';
    return state.sewingOperations.find(op => op.id === opId)?.operationName || 'N/A';
  }
  const getOperationRate = (opId: string | undefined) => {
    if (!opId) return 0;
    return state.sewingOperations.find(op => op.id === opId)?.rate || 0;
  }

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setPayrollReport(null);
    setAttendanceReport(null);

    if (!selectedUserId || !startDate || !endDate) {
      alert('Please select an employee and a date range.');
      return;
    }

    const user = state.users.find(u => u.id === selectedUserId);
    if (!user) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filteredAttendance = state.attendance.filter(att => {
        const attDate = new Date(att.date);
        return att.userId === selectedUserId && attDate >= start && attDate <= end && att.status === ApprovalStatus.APPROVED;
    });
    const totalPresentDays = [...new Set(filteredAttendance.map(a => a.date))].length;

    if (activeTab === 'payroll') {
        const filteredWorkEntries = state.workEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entry.userId === selectedUserId && entryDate >= start && entryDate <= end;
        });

        const totalPieceRateEarnings = filteredWorkEntries.reduce((acc, entry) => {
            if (entry.operationId && entry.quantity) {
                const rate = getOperationRate(entry.operationId);
                return acc + (rate * entry.quantity);
            }
            return acc;
        }, 0);

        setPayrollReport({
            user,
            startDate,
            endDate,
            workEntries: filteredWorkEntries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            totalPresentDays,
            totalPieceRateEarnings,
        });
    } else { // Attendance Report
        setAttendanceReport({
            user,
            startDate,
            endDate,
            attendanceRecords: filteredAttendance.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            totalPresentDays,
        });
    }
  };

  const handleDownloadPayroll = () => {
    if (!payrollReport) return;

    const headers = ['Date', 'Tracking #', 'Operation', 'Quantity', 'Rate', 'Amount'];
    const rows = payrollReport.workEntries.map(entry => {
        const rate = getOperationRate(entry.operationId);
        const amount = (entry.quantity || 0) * rate;
        return [
            entry.date,
            entry.trackingNumber,
            `"${getOperationName(entry.operationId).replace(/"/g, '""')}"`, // Quote and escape quotes
            entry.quantity || 0,
            rate.toFixed(2),
            amount.toFixed(2)
        ].join(',');
    });

    const summary = [
        '', '', '', '', '"Total Piece Rate Earnings:"', `"${payrollReport.totalPieceRateEarnings.toFixed(2)}"`
    ].join(',');
    
    const csvContent = [headers.join(','), ...rows, '', summary].join('\n');
    const fileName = `Payroll_Report_${payrollReport.user.details.name}_${payrollReport.startDate}_to_${payrollReport.endDate}.csv`;
    downloadCSV(csvContent, fileName);
  };

  const handleDownloadAttendance = () => {
    if (!attendanceReport) return;

    const headers = ['Date', 'Check-In Time', 'Status'];
    const rows = attendanceReport.attendanceRecords.map(rec => 
        [rec.date, rec.checkInTime, rec.status].join(',')
    );

    const summary = [
        '"Total Days Present (Approved):"', `"${attendanceReport.totalPresentDays}"`, ''
    ].join(',');

    const csvContent = [headers.join(','), ...rows, '', summary].join('\n');
    const fileName = `Attendance_Report_${attendanceReport.user.details.name}_${attendanceReport.startDate}_to_${attendanceReport.endDate}.csv`;
    downloadCSV(csvContent, fileName);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
         <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button onClick={() => setActiveTab('payroll')}
                    className={`${activeTab === 'payroll' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                    Payroll Report
                </button>
                 <button onClick={() => setActiveTab('attendance')}
                    className={`${activeTab === 'attendance' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                    Attendance Report
                </button>
            </nav>
        </div>
        
        <div className="mt-6">
            <ReportForm 
                onSubmit={handleGenerateReport}
                selectedUserId={selectedUserId}
                setSelectedUserId={setSelectedUserId}
                employees={employees}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
            />
            
            {activeTab === 'payroll' && payrollReport && (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Payroll Report for {payrollReport.user.details.name}</h3>
                    <button onClick={handleDownloadPayroll} className="flex items-center gap-2 bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 text-sm">
                        <span className="w-4 h-4">{ICONS.download}</span>
                        Download CSV
                    </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">From {payrollReport.startDate} to {payrollReport.endDate}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">Total Days Present</p>
                        <p className="text-2xl font-bold">{payrollReport.totalPresentDays}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">Total Work Entries</p>
                        <p className="text-2xl font-bold">{payrollReport.workEntries.length}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">Total Piece Rate Earnings</p>
                        <p className="text-2xl font-bold text-green-600">₹{payrollReport.totalPieceRateEarnings.toFixed(2)}</p>
                    </div>
                </div>

                <h4 className="font-semibold mb-2">Detailed Work Log</h4>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payrollReport.workEntries.map(entry => {
                                const rate = getOperationRate(entry.operationId);
                                const amount = (entry.quantity || 0) * rate;
                                return (
                                    <tr key={entry.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.trackingNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getOperationName(entry.operationId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{rate.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{amount.toFixed(2)}</td>
                                    </tr>
                                )
                            })}
                            {payrollReport.workEntries.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-4 text-gray-500">No work entries found for this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
            )}

            {activeTab === 'attendance' && attendanceReport && (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Attendance Report for {attendanceReport.user.details.name}</h3>
                    <button onClick={handleDownloadAttendance} className="flex items-center gap-2 bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 text-sm">
                        <span className="w-4 h-4">{ICONS.download}</span>
                        Download CSV
                    </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">From {attendanceReport.startDate} to {attendanceReport.endDate}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                     <div className="bg-gray-50 p-4 rounded-lg text-center md:col-start-2">
                        <p className="text-sm text-gray-500">Total Days Present (Approved)</p>
                        <p className="text-2xl font-bold">{attendanceReport.totalPresentDays}</p>
                    </div>
                </div>

                <h4 className="font-semibold mb-2">Detailed Attendance Log</h4>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {attendanceReport.attendanceRecords.map(rec => (
                                <tr key={rec.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rec.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rec.checkInTime}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                         <span className="px-2 py-1 text-xs font-medium rounded-full text-green-800 bg-green-100">
                                            {rec.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {attendanceReport.attendanceRecords.length === 0 && (
                                <tr><td colSpan={3} className="text-center py-4 text-gray-500">No approved attendance records found for this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Reports;