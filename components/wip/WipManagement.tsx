import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { Role, WorkEntry, SewingOperation, ApprovalStatus, User, OperationType } from '../../types';

const OperationModal: React.FC<{ operation: SewingOperation | null, trackingNumber: string, closeModal: () => void }> = ({ operation, trackingNumber, closeModal }) => {
    const { dispatch } = useData();
    const { showNotification } = useNotification();
    const [formState, setFormState] = useState<SewingOperation>(operation || { 
        id: '',
        trackingNumber: trackingNumber,
        operationName: '', 
        machineType: '', 
        rate: 0,
        type: OperationType.SEWING,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (operation) { // Editing
            dispatch({ type: 'UPDATE_SEWING_OPERATION', payload: formState });
        } else { // Adding
            dispatch({ type: 'ADD_SEWING_OPERATION', payload: { ...formState, id: `sew-${Date.now()}` } });
        }
        showNotification("RECORDED SUCCESSFULLY");
        closeModal();
    };
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-xl font-bold">{operation ? 'Edit' : 'Add'} Operation</h3>
                    <p className="text-sm text-gray-500">For Tracking #: {trackingNumber}</p>
                    <div>
                        <label>Operation Type</label>
                        <select value={formState.type} onChange={e => setFormState(p => ({...p, type: e.target.value as OperationType}))} required className="w-full p-2 border rounded-md">
                            <option value={OperationType.SEWING}>Sewing</option>
                            <option value={OperationType.FINISHING}>Finishing</option>
                        </select>
                    </div>
                    <div>
                        <label>Operation Name</label>
                        <input type="text" value={formState.operationName} onChange={e => setFormState(p => ({...p, operationName: e.target.value}))} required className="w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label>Machine Type</label>
                        <input type="text" value={formState.machineType} onChange={e => setFormState(p => ({...p, machineType: e.target.value}))} required className="w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label>Rate</label>
                        <input type="number" step="0.01" value={formState.rate} onChange={e => setFormState(p => ({...p, rate: parseFloat(e.target.value) || 0}))} required className="w-full p-2 border rounded-md" />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={closeModal} className="bg-gray-200 px-4 py-2 rounded-md">Cancel</button>
                        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md">{operation ? 'Save Changes' : 'Add Operation'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const WipManagement: React.FC = () => {
    const { user } = useAuth();

    const TABS_CONFIG = [
        { id: 'operations', label: 'Manage Operations & Rates', roles: [Role.ADMIN] },
        { id: 'cutting', label: 'Cutting Entry', roles: [Role.EMPLOYEE], scope: OperationType.CUTTING },
        { id: 'sewing', label: 'Sewing Entry', roles: [Role.EMPLOYEE], scope: OperationType.SEWING },
        { id: 'finishing', label: 'Finishing Entry', roles: [Role.EMPLOYEE], scope: OperationType.FINISHING },
        { id: 'other', label: 'Other Activity Entry', roles: [Role.ADMIN, Role.MANAGER] },
    ];

    const visibleTabs = useMemo(() => {
        if (!user) return [];
        return TABS_CONFIG.filter(tab => {
            if (!tab.roles.includes(user.role)) {
                return false;
            }
            if (user.role === Role.EMPLOYEE && tab.scope) {
                return user.details.wipScope?.includes(tab.scope) ?? false;
            }
            return true;
        });
    }, [user]);

    const defaultTab = useMemo(() => (visibleTabs.length > 0 ? visibleTabs[0].id : ''), [visibleTabs]);
    const [activeTab, setActiveTab] = useState(defaultTab);
    
    useEffect(() => {
        // If the active tab is no longer visible (e.g., after user change), reset to default
        if (!visibleTabs.some(t => t.id === activeTab)) {
            setActiveTab(defaultTab);
        }
    }, [visibleTabs, activeTab, defaultTab]);

    const pageTitle = user?.role === Role.ADMIN ? 'Assign Cost' : 'Work In Progress';

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">{pageTitle}</h1>
             <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {visibleTabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-6">
                    {visibleTabs.length === 0 && <p className="text-center text-gray-500">You do not have any work-in-progress tasks assigned.</p>}
                    {activeTab === 'cutting' && <CuttingView />}
                    {activeTab === 'operations' && <OperationsAdminView />}
                    {activeTab === 'sewing' && <WorkEntryView operationType={OperationType.SEWING} />}
                    {activeTab === 'finishing' && <WorkEntryView operationType={OperationType.FINISHING} />}
                    {activeTab === 'other' && <OtherActivityView />}
                </div>
            </div>
        </div>
    );
};

const CuttingView: React.FC = () => {
    const { user } = useAuth();
    const { state, dispatch } = useData();
    const { showNotification } = useNotification();
    const cuttingGodown = state.godowns.find(g => g.name.toLowerCase().includes('cutting wip'));
    
    const availableTrackingNumbers = useMemo(() => {
        if (!cuttingGodown) return [];
        const trackingNumbersInWip = state.inventory
            .filter(inv => inv.godownId === cuttingGodown.id)
            .map(inv => inv.trackingNumber);
        return [...new Set(trackingNumbersInWip)];
    }, [state.inventory, cuttingGodown]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        if (!user) return;

        const newEntry: WorkEntry = {
            id: `work-${Date.now()}`,
            userId: user.id,
            date: new Date().toISOString().slice(0, 10),
            type: OperationType.CUTTING,
            trackingNumber: data.trackingNumber as string,
            layerLength: Number(data.layerLength),
            numLayers: Number(data.numLayers),
            fabricColor: data.fabricColor as string,
            layerWeight: Number(data.layerWeight),
            fabricUsedKg: Number(data.fabricUsedKg),
        };
        dispatch({ type: 'ADD_WORK_ENTRY', payload: newEntry });
        showNotification("RECORDED SUCCESSFULLY");
        e.currentTarget.reset();
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
             <h3 className="text-lg font-semibold mb-4">Daily Cutting Report</h3>
             <div>
                <label>Tracking Number (in Cutting WIP Godown)</label>
                <select name="trackingNumber" required className="w-full p-2 border rounded-md">
                    <option value="">Select Tracking #</option>
                    {availableTrackingNumbers.map(tn => <option key={tn} value={tn}>{tn}</option>)}
                </select>
             </div>
             <div><label>Layer Length</label><input type="number" name="layerLength" required className="w-full p-2 border rounded-md" /></div>
             <div><label>Number of Layers</label><input type="number" name="numLayers" required className="w-full p-2 border rounded-md" /></div>
             <div><label>Fabric Color</label><input type="text" name="fabricColor" required className="w-full p-2 border rounded-md" /></div>
             <div><label>Layer Weight</label><input type="number" step="0.01" name="layerWeight" required className="w-full p-2 border rounded-md" /></div>
             <div><label>Fabric Used (Kgs)</label><input type="number" step="0.01" name="fabricUsedKg" required className="w-full p-2 border rounded-md" /></div>
             <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Submit Report</button>
        </form>
    );
};

const OperationsAdminView: React.FC = () => {
    const { state, dispatch } = useData();
    const [selectedTracking, setSelectedTracking] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOperation, setEditingOperation] = useState<SewingOperation | null>(null);

    const trackingNumbersWithStock = useMemo(() => {
        const stockByTrackingNumber = state.inventory.reduce((acc, inv) => {
            if (!acc[inv.trackingNumber]) {
                acc[inv.trackingNumber] = 0;
            }
            const totalStock = inv.stock.reduce((sum, s) => sum + s.quantity, 0);
            acc[inv.trackingNumber] += totalStock;
            return acc;
        }, {} as { [key: string]: number });
    
        return Object.entries(stockByTrackingNumber)
            .filter(([, qty]) => qty > 0)
            .map(([tn]) => tn);
    }, [state.inventory]);

    const operationsForSelected = useMemo(() => state.sewingOperations.filter(op => op.trackingNumber === selectedTracking), [state.sewingOperations, selectedTracking]);
    
    const totals = useMemo(() => operationsForSelected.reduce((acc, op) => {
        if (op.type === OperationType.SEWING) {
            acc.sewing += op.rate;
        } else if (op.type === OperationType.FINISHING) {
            acc.finishing += op.rate;
        }
        return acc;
    }, { sewing: 0, finishing: 0 }), [operationsForSelected]);
    
    const openModal = (op: SewingOperation | null) => {
        setEditingOperation(op);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this operation?')) {
            dispatch({ type: 'DELETE_SEWING_OPERATION', payload: id });
        }
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Manage Operations & Rates</h3>
            <div className="max-w-lg mx-auto p-4 border rounded-lg">
                <div className="space-y-3">
                    <div>
                        <label>Tracking Number (with stock > 0)</label>
                        <select value={selectedTracking} onChange={e => setSelectedTracking(e.target.value)} required className="w-full p-2 border rounded-md">
                            <option value="">Select Tracking #</option>
                            {trackingNumbersWithStock.map(tn => <option key={tn} value={tn}>{tn}</option>)}
                        </select>
                    </div>
                    {selectedTracking && (
                        <button onClick={() => openModal(null)} className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Add New Operation</button>
                    )}
                </div>
            </div>

            {selectedTracking && (
                <div className="mt-6">
                    <h4 className="font-semibold text-center mb-2">Operations for {selectedTracking}</h4>
                    <ul className="space-y-2">
                        {operationsForSelected.map(op => (
                           <li key={op.id} className="p-2 border rounded flex justify-between items-center">
                               <div>
                                   <p>{op.operationName} <span className="text-sm text-gray-500">({op.machineType})</span></p>
                                   <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${op.type === OperationType.SEWING ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{op.type}</span>
                               </div>
                               <div className="flex items-center gap-4">
                                   <span className="font-semibold">₹{op.rate.toFixed(2)}</span>
                                   <button onClick={() => openModal(op)} className="text-blue-500 text-xs">EDIT</button>
                                   <button onClick={() => handleDelete(op.id)} className="text-red-500 text-xs">DELETE</button>
                               </div>
                           </li>
                        ))}
                    </ul>
                     {operationsForSelected.length === 0 && <p className="text-center py-4 text-gray-500">No operations defined for this tracking number.</p>}
                    <div className="text-right font-bold mt-2 pr-2 space-y-1">
                        <p>Total Sewing Rate: ₹{totals.sewing.toFixed(2)}</p>
                        <p>Total Finishing Rate: ₹{totals.finishing.toFixed(2)}</p>
                    </div>
                </div>
            )}
            {isModalOpen && selectedTracking && <OperationModal operation={editingOperation} trackingNumber={selectedTracking} closeModal={() => setIsModalOpen(false)} />}
        </div>
    );
};

const WorkEntryView: React.FC<{operationType: OperationType}> = ({ operationType }) => {
    const { user } = useAuth();
    const { state, dispatch } = useData();
    const { showNotification } = useNotification();
    const [trackingNumber, setTrackingNumber] = useState('');
    const [operationId, setOperationId] = useState('');
    const [quantity, setQuantity] = useState('');

    const today = new Date().toISOString().slice(0, 10);
    const isPresent = user && state.attendance.some(a => a.userId === user.id && a.date === today && a.status === ApprovalStatus.APPROVED);
    
    const availableOperations = useMemo(() => {
        if (!trackingNumber) return [];
        return state.sewingOperations.filter(op => op.trackingNumber === trackingNumber && op.type === operationType);
    }, [trackingNumber, state.sewingOperations, operationType]);
    
    const trackingNumbersInCorrectGodown = useMemo(() => {
        const godownName = operationType === OperationType.SEWING ? 'sewing wip' : 'finishing wip';
        const wipGodown = state.godowns.find(g => g.name.toLowerCase() === godownName);
        if (!wipGodown) return [];

        // Get all TNs in the correct godown
        const tnsInGodown = new Set(
            state.inventory
                .filter(inv => inv.godownId === wipGodown.id)
                .map(inv => inv.trackingNumber)
        );

        // Get all TNs that have the required operations
        const tnsWithOps = new Set(
            state.sewingOperations
                .filter(op => op.type === operationType)
                .map(op => op.trackingNumber)
        );

        // Return the intersection of the two sets
        return [...tnsWithOps].filter(tn => tnsInGodown.has(tn));
    }, [state.godowns, state.inventory, state.sewingOperations, operationType]);

    const selectedOperation = useMemo(() => {
        return state.sewingOperations.find(op => op.id === operationId);
    }, [operationId, state.sewingOperations]);

    const itemName = useMemo(() => {
        if (!trackingNumber) return '';
        const inv = state.inventory.find(i => i.trackingNumber === trackingNumber);
        if (!inv) return '';
        const item = state.items.find(i => i.id === inv.itemId);
        return item?.name || 'Unknown Item';
    }, [trackingNumber, state.inventory, state.items]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        
        const newEntry: WorkEntry = {
            id: `work-${Date.now()}`,
            userId: user.id,
            date: today,
            type: operationType,
            trackingNumber: trackingNumber,
            operationId: operationId,
            quantity: Number(quantity),
        };
        dispatch({ type: 'ADD_WORK_ENTRY', payload: newEntry });
        showNotification("RECORDED SUCCESSFULLY");
        setTrackingNumber('');
        setOperationId('');
        setQuantity('');
    };

    if (!isPresent) {
        return <p className="text-center text-red-500">You must be marked as 'PRESENT' and approved by an admin to log work for today.</p>
    }

    const title = operationType === OperationType.SEWING ? 'Daily Sewing Entry' : 'Daily Finishing Entry';
    const godownName = operationType === OperationType.SEWING ? 'Sewing WIP' : 'Finishing WIP';

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div>
                <label>Tracking Number (in {godownName} Godown)</label>
                <select name="trackingNumber" value={trackingNumber} onChange={e => {setTrackingNumber(e.target.value); setOperationId('')}} required className="w-full p-2 border rounded-md">
                    <option value="">Select Tracking #</option>
                     {trackingNumbersInCorrectGodown.map(tn => <option key={tn} value={tn}>{tn}</option>)}
                </select>
                {itemName && <p className="text-sm text-gray-500 mt-1">Item: <strong>{itemName}</strong></p>}
            </div>
            {trackingNumber && (
                <>
                    <div>
                        <label>Operation</label>
                        <select name="sewingOperationId" value={operationId} onChange={e => setOperationId(e.target.value)} required className="w-full p-2 border rounded-md">
                            <option value="">Select Operation</option>
                            {availableOperations.map(op => <option key={op.id} value={op.id}>{op.operationName}</option>)}
                        </select>
                    </div>
                </>
            )}
            {selectedOperation && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label>Machine Type</label><input type="text" value={selectedOperation.machineType} readOnly className="w-full p-2 border rounded-md bg-gray-100" /></div>
                        <div><label>Rate</label><input type="text" value={`₹${selectedOperation.rate.toFixed(2)}`} readOnly className="w-full p-2 border rounded-md bg-gray-100" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label>Quantity</label>
                            <input name="quantity" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label>Amount</label>
                            <input type="text" value={`₹${(selectedOperation.rate * (Number(quantity) || 0)).toFixed(2)}`} readOnly className="w-full p-2 border rounded-md bg-gray-100" />
                        </div>
                    </div>
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Submit Work</button>
                </>
            )}
        </form>
    );
};

const OtherActivityView: React.FC = () => {
    const { user } = useAuth(); // Logged in admin/manager
    const { state, dispatch } = useData();
    const { showNotification } = useNotification();

    const [selectedUserId, setSelectedUserId] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [operationId, setOperationId] = useState('');
    const [quantity, setQuantity] = useState('');

    const today = new Date().toISOString().slice(0, 10);
    const presentEmployees = useMemo(() => {
        const presentUserIds = state.attendance
            .filter(a => a.date === today && a.status === ApprovalStatus.APPROVED)
            .map(a => a.userId);
        return state.users.filter(u => presentUserIds.includes(u.id));
    }, [state.attendance, state.users, today]);

    const availableOperations = useMemo(() => {
        if (!trackingNumber) return [];
        return state.sewingOperations.filter(op => op.trackingNumber === trackingNumber);
    }, [trackingNumber, state.sewingOperations]);

    const selectedOperation = useMemo(() => {
        return state.sewingOperations.find(op => op.id === operationId);
    }, [operationId, state.sewingOperations]);

    const itemName = useMemo(() => {
        if (!trackingNumber) return '';
        const inv = state.inventory.find(i => i.trackingNumber === trackingNumber);
        if (!inv) return '';
        const item = state.items.find(i => i.id === inv.itemId);
        return item?.name || 'Unknown Item';
    }, [trackingNumber, state.inventory, state.items]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedUserId) {
            alert('Please select an employee.');
            return;
        }
        if (!selectedOperation) {
            alert('Please select an operation.');
            return;
        }
        
        const newEntry: WorkEntry = {
            id: `work-${Date.now()}`,
            userId: selectedUserId,
            date: today,
            type: selectedOperation.type,
            trackingNumber: trackingNumber,
            operationId: operationId,
            quantity: Number(quantity),
        };
        dispatch({ type: 'ADD_WORK_ENTRY', payload: newEntry });
        showNotification("RECORDED SUCCESSFULLY");
        setSelectedUserId('');
        setTrackingNumber('');
        setOperationId('');
        setQuantity('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            <h3 className="text-lg font-semibold mb-4">Add Work Entry for Employee</h3>
            <div>
                <label>Employee (Must be present today)</label>
                 <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required className="w-full p-2 border rounded-md">
                    <option value="">Select Employee</option>
                    {presentEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.details.name}</option>)}
                </select>
            </div>
            {selectedUserId && (
                <>
                    <div>
                        <label>Tracking Number</label>
                        <select name="trackingNumber" value={trackingNumber} onChange={e => {setTrackingNumber(e.target.value); setOperationId('')}} required className="w-full p-2 border rounded-md">
                            <option value="">Select Tracking #</option>
                            {[...new Set(state.sewingOperations.map(op => op.trackingNumber))].map(tn => <option key={tn} value={tn}>{tn}</option>)}
                        </select>
                         {itemName && <p className="text-sm text-gray-500 mt-1">Item: <strong>{itemName}</strong></p>}
                    </div>
                    {trackingNumber && (
                        <div>
                            <label>Operation</label>
                            <select name="sewingOperationId" value={operationId} onChange={e => setOperationId(e.target.value)} required className="w-full p-2 border rounded-md">
                                <option value="">Select Operation</option>
                                {availableOperations.map(op => <option key={op.id} value={op.id}>{`${op.operationName} (${op.type})`}</option>)}
                            </select>
                        </div>
                    )}
                    {selectedOperation && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label>Machine Type</label><input type="text" value={selectedOperation.machineType} readOnly className="w-full p-2 border rounded-md bg-gray-100" /></div>
                                <div><label>Rate</label><input type="text" value={`₹${selectedOperation.rate.toFixed(2)}`} readOnly className="w-full p-2 border rounded-md bg-gray-100" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label>Quantity</label>
                                    <input name="quantity" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full p-2 border rounded-md" />
                                </div>
                                <div>
                                    <label>Amount</label>
                                    <input type="text" value={`₹${(selectedOperation.rate * (Number(quantity) || 0)).toFixed(2)}`} readOnly className="w-full p-2 border rounded-md bg-gray-100" />
                                </div>
                            </div>
                            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Submit Work For Employee</button>
                        </>
                    )}
                </>
            )}
        </form>
    );
};

export default WipManagement;