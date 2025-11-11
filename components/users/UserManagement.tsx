import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { User, ApprovalStatus, UserStatus, SalaryType, OperationType } from '../../types';

const UserEditModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
    const { dispatch } = useData();
    const [formData, setFormData] = useState<User['details']>(user.details);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'salaryAmount' ? Number(value) : value }));
    };

    const handleWipScopeChange = (scope: OperationType) => {
        setFormData(prev => {
            const newScope = prev.wipScope.includes(scope)
                ? prev.wipScope.filter(s => s !== scope)
                : [...prev.wipScope, scope];
            return { ...prev, wipScope: newScope };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'UPDATE_USER', payload: { ...user, details: formData } });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-xl font-bold">Edit User: {user.details.name}</h3>
                    
                    <div>
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900">Full Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border rounded-md" required />
                    </div>
                    
                    <div>
                        <label htmlFor="jobProfile" className="block mb-2 text-sm font-medium text-gray-900">Job Profile</label>
                        <input type="text" id="jobProfile" name="jobProfile" value={formData.jobProfile} onChange={handleInputChange} className="w-full p-2 border rounded-md" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="salaryType" className="block mb-2 text-sm font-medium text-gray-900">Salary Type</label>
                            <select id="salaryType" name="salaryType" value={formData.salaryType} onChange={handleInputChange} className="w-full p-2 border rounded-md">
                                {Object.values(SalaryType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="salaryAmount" className="block mb-2 text-sm font-medium text-gray-900">Salary Amount</label>
                            <input type="number" id="salaryAmount" name="salaryAmount" value={formData.salaryAmount} onChange={handleInputChange} className="w-full p-2 border rounded-md" required />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900">Scope of Work (WIP)</label>
                        <div className="flex items-center space-x-4 mt-1">
                            {Object.values(OperationType).map(scope => (
                                <div key={scope} className="flex items-center">
                                    <input id={`scope-${scope}`} type="checkbox" checked={formData.wipScope.includes(scope)} onChange={() => handleWipScopeChange(scope)} className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"/>
                                    <label htmlFor={`scope-${scope}`} className="ml-2 text-sm font-medium text-gray-900">{scope}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-md">Cancel</button>
                        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserManagement: React.FC = () => {
    const { state, dispatch } = useData();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    const handleApproval = (user: User, status: ApprovalStatus) => {
        dispatch({ type: 'UPDATE_USER', payload: { ...user, approvalStatus: status } });
    };

    const handleStatusChange = (user: User, status: UserStatus) => {
        dispatch({ type: 'UPDATE_USER', payload: { ...user, status: status } });
    };
    
    const handleDelete = (userId: string) => {
        if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
            dispatch({ type: 'DELETE_USER', payload: userId });
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };
    
    const pendingUsers = state.users.filter(u => u.approvalStatus === ApprovalStatus.PENDING);
    const managedUsers = state.users.filter(u => u.approvalStatus === ApprovalStatus.APPROVED);

    const UserTable = ({ users, title, isPending }: {users: User[], title: string, isPending: boolean}) => (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">User</th>
                            <th scope="col" className="px-6 py-3">Job Profile</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3">WIP Scope</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 flex items-center">
                                    <img src={user.details.image} alt={user.details.name} className="w-10 h-10 rounded-full mr-3" />
                                    <div>
                                        <div className="font-semibold text-gray-800">{user.details.name}</div>
                                        <div className="text-xs text-gray-500">{user.username}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{user.details.jobProfile}</td>
                                <td className="px-6 py-4">{user.role}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                    {user.details.wipScope?.map(scope => (
                                        <span key={scope} className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                            {scope}
                                        </span>
                                    )) || 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {isPending ? (
                                        <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Pending</span>
                                    ) : (
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.status === UserStatus.ACTIVE ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'}`}>
                                            {user.status}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {isPending ? (
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleApproval(user, ApprovalStatus.APPROVED)} className="font-medium text-green-600 hover:text-green-900">Approve</button>
                                            <button onClick={() => handleDelete(user.id)} className="font-medium text-red-600 hover:text-red-900">Reject</button>
                                        </div>
                                    ) : (
                                        <div className="flex space-x-2">
                                             <button onClick={() => handleEdit(user)} className="font-medium text-blue-600 hover:text-blue-900">Edit</button>
                                            <button onClick={() => handleStatusChange(user, user.status === UserStatus.ACTIVE ? UserStatus.TERMINATED : UserStatus.ACTIVE)} className="font-medium text-yellow-600 hover:text-yellow-900">
                                                {user.status === UserStatus.ACTIVE ? 'Terminate' : 'Activate'}
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="font-medium text-red-600 hover:text-red-900">Delete</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {users.length === 0 && <p className="text-center py-4 text-gray-500">No users found.</p>}
            </div>
        </div>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>
            <div className="space-y-8">
                {pendingUsers.length > 0 && <UserTable users={pendingUsers} title="Pending Approvals" isPending={true} />}
                <UserTable users={managedUsers} title="Managed Users" isPending={false} />
            </div>
            {isEditModalOpen && editingUser && (
                <UserEditModal 
                    user={editingUser} 
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingUser(null);
                    }}
                />
            )}
        </div>
    );
};

export default UserManagement;