
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { Role, WorkEntry, SewingOperation, ApprovalStatus, User, OperationType, Item, StockItem } from '../../types';

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
            // FIX: Corrected typo to match action type in context.
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
                    <p className="text-sm text-slate-500">For Tracking #: {trackingNumber}</p>
                    <div>
                        <label>Operation Type</label>
                        <select value={formState.type} onChange={e => setFormState(p => ({...p, type: e.target.value as OperationType}))} required className="w-full p-2 border rounded-md">
                            <option value={OperationType.CUTTING}>Cutting</option>
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
                        <button type="button" onClick={closeModal} className="bg-slate-200 px-4 py-2 rounded-md">Cancel</button>
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
        if (visibleTabs.length > 0 && !visibleTabs.some(t => t.id === activeTab)) {
            setActiveTab(visibleTabs[0].id);
        }
    }, [visibleTabs, activeTab]);


    const pageTitle = user?.role === Role.ADMIN ? 'Assign Cost' : 'Work In Progress';

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">{pageTitle}</h1>
             <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {visibleTabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-6">
                    {visibleTabs.length === 0 && <p className="text-center text-slate-500">You do not have any work-in-progress tasks assigned.</p>}
                    {activeTab === 'cutting' && <WorkEntryView operationType={OperationType.CUTTING} />}
                    {activeTab === 'operations' && <OperationsAdminView />}
                    {activeTab === 'sewing' && <WorkEntryView operationType={OperationType.SEWING} />}
                    {activeTab === 'finishing' && <WorkEntryView operationType={OperationType.FINISHING} />}
                    {activeTab === 'other' && <OtherActivityView />}
                </div>
            </div>
        </div>
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
        } else if (op.type === OperationType.CUTTING) {
            acc.cutting += op.rate;
        }
        return acc;
    }, { cutting: 0, sewing: 0, finishing: 0 }), [operationsForSelected]);
    
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
                                   <p>{op.operationName} <span className="text-sm text-slate-500">({op.machineType})</span></p>
                                   <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${op.type === OperationType.SEWING ? 'bg-sky-100 text-sky-800' : op.type === OperationType.FINISHING ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{op.type}</span>
                               </div>
                               <div className="flex items-center gap-4">
                                   <span className="font-semibold">₹{op.rate.toFixed(2)}</span>
                                   <button onClick={() => openModal(op)} className="text-blue-500 text-xs">EDIT</button>
                                   <button onClick={() => handleDelete(op.id)} className="text-red-500 text-xs">DELETE</button>
                               </div>
                           </li>
                        ))}
                    </ul>
                     {operationsForSelected.length === 0 && <p className="text-center py-4 text-slate-500">No operations defined for this tracking number.</p>}
                    <div className="text-right font-bold mt-2 pr-2 space-y-1">
                        <p>Total Cutting Rate: ₹{totals.cutting.toFixed(2)}</p>
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
    const KEY_DELIMITER = '_||_';
    
    // Common state
    const [trackingNumber, setTrackingNumber] = useState('');
    
    // Sewing/Finishing state
    const [operationId, setOperationId] = useState('');
    const [processedQtys, setProcessedQtys] = useState<{ [key: string]: string }>({});

    // Cutting state
    const [fabricColor, setFabricColor] = useState('');
    const [fabricUsedKg, setFabricUsedKg] = useState('');
    const [numLayers, setNumLayers] = useState('');
    const [layerWeight, setLayerWeight] = useState('');
    const [layerLength, setLayerLength] = useState('');
    const [drawingPcs, setDrawingPcs] = useState('');
    const [isDefiningNewItem, setIsDefiningNewItem] = useState(false);
    const [newItem, setNewItem] = useState<Omit<Item, 'id'>>({ name: '', colors: [{ name: '', sizes: [{ name: '' }] }] });
    const [outputQuantities, setOutputQuantities] = useState<{ [key: string]: string }>({});

    const today = new Date().toISOString().slice(0, 10);
    const isPresent = user && state.attendance.some(a => a.userId === user.id && a.date === today && a.status === ApprovalStatus.APPROVED);
    
    const title = operationType.charAt(0).toUpperCase() + operationType.slice(1).toLowerCase();

    const trackingNumbersInCorrectGodown = useMemo(() => {
        let sourceGodownNames: string[] = [];
        if (operationType === OperationType.CUTTING) {
            sourceGodownNames = ['main godown', 'fabric godown'];
        } else if (operationType === OperationType.SEWING) {
            sourceGodownNames = ['cutting wip', 'sewing wip'];
        } else { // FINISHING
            sourceGodownNames = ['sewing wip', 'finishing wip'];
        }

        const sourceGodowns = state.godowns.filter(g => sourceGodownNames.includes(g.name.toLowerCase()));
        if (!sourceGodowns.length) return [];
        const sourceGodownIds = sourceGodowns.map(g => g.id);

        const tnsInGodown = new Set(
            state.inventory
                .filter(inv => sourceGodownIds.includes(inv.godownId) && inv.stock.some(s => s.quantity > 0))
                .map(inv => inv.trackingNumber)
        );

        if (operationType === OperationType.CUTTING) {
            return Array.from(tnsInGodown);
        }

        const tnsWithOps = new Set(
            state.sewingOperations
                .filter(op => op.type === operationType)
                .map(op => op.trackingNumber)
        );

        return Array.from(tnsWithOps).filter(tn => tnsInGodown.has(tn));
    }, [state.godowns, state.inventory, state.sewingOperations, operationType]);
    
    const availableOperations = useMemo(() => {
        if (!trackingNumber) return [];
        return state.sewingOperations.filter(op => op.trackingNumber === trackingNumber && op.type === operationType);
    }, [trackingNumber, state.sewingOperations, operationType]);

    const availableStockForProcessing = useMemo(() => {
        if (!trackingNumber) return [];
        let sourceGodownNames: string[] = [];
        if (operationType === OperationType.SEWING) {
            sourceGodownNames = ['cutting wip', 'sewing wip'];
        } else { // FINISHING
            sourceGodownNames = ['sewing wip', 'finishing wip'];
        }
        const sourceGodowns = state.godowns.filter(g => sourceGodownNames.includes(g.name.toLowerCase()));
        const sourceGodownIds = sourceGodowns.map(g => g.id);

        const stockMap = new Map<string, { color: string, size: string, quantity: number }>();
        
        state.inventory
            .filter(inv => inv.trackingNumber === trackingNumber && sourceGodownIds.includes(inv.godownId))
            .forEach(inv => {
                inv.stock.forEach(s => {
                    const key = `${s.color}${KEY_DELIMITER}${s.size}`;
                    const existing = stockMap.get(key) || { color: s.color, size: s.size, quantity: 0 };
                    existing.quantity += s.quantity;
                    stockMap.set(key, existing);
                });
            });

        return Array.from(stockMap.values());
    }, [trackingNumber, operationType, state.godowns, state.inventory]);

    const groupedStockForProcessing = useMemo(() => {
        return availableStockForProcessing.reduce((acc, item) => {
            if (!acc[item.color]) {
                acc[item.color] = [];
            }
            acc[item.color].push({ size: item.size, quantity: item.quantity });
            acc[item.color].sort((a, b) => a.size.localeCompare(b.size));
            return acc;
        }, {} as { [color: string]: { size: string, quantity: number }[] });
    }, [availableStockForProcessing]);

    const availableFabricColors = useMemo(() => {
         if (!trackingNumber) return [];
         const sourceGodowns = state.godowns.filter(g => ['main godown', 'fabric godown'].includes(g.name.toLowerCase()));
         const sourceGodownIds = sourceGodowns.map(g => g.id);
         const inv = state.inventory.find(i => i.trackingNumber === trackingNumber && sourceGodownIds.includes(i.godownId));
         return inv ? inv.stock : [];
    }, [trackingNumber, state.inventory, state.godowns]);

    const selectedFabricStock = useMemo(() => {
        return availableFabricColors.find(s => s.color === fabricColor);
    }, [availableFabricColors, fabricColor]);

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
    
    const getOperationName = (opId: string | undefined): string => {
        if (!opId) return 'N/A';
        return state.sewingOperations.find(op => op.id === opId)?.operationName || 'N/A';
    };

    const todaysEntries = useMemo(() => {
        if (!user) return [];
        return state.workEntries
            .filter(entry => entry.userId === user.id && entry.date === today && entry.type === operationType)
            .sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]));
    }, [state.workEntries, user, today, operationType]);

    const handleResetCuttingForm = () => {
        setTrackingNumber('');
        setFabricColor('');
        setFabricUsedKg('');
        setNumLayers('');
        setLayerWeight('');
        setLayerLength('');
        setDrawingPcs('');
        setIsDefiningNewItem(false);
        setNewItem({ name: '', colors: [{ name: '', sizes: [{ name: '' }] }] });
        setOutputQuantities({});
    };

    const handleCuttingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !selectedFabricStock) return;
        if (parseFloat(fabricUsedKg) > selectedFabricStock.quantity) {
            alert("Fabric used cannot be more than available stock.");
            return;
        }

        const finalNewItem = { ...newItem, id: `item-${Date.now()}`};
        dispatch({ type: 'ADD_ITEM', payload: finalNewItem });
        
        const outputStock: StockItem[] = [];
        Object.entries(outputQuantities).forEach(([key, value]) => {
            const qty = parseInt(value, 10);
            if (qty > 0) {
                const [color, size] = key.split('_||_');
                outputStock.push({ color, size, quantity: qty });
            }
        });
        
        const newEntry: WorkEntry = {
            id: `work-${Date.now()}`,
            userId: user.id,
            date: today,
            type: operationType,
            trackingNumber,
            fabricColor,
            fabricUsedKg: parseFloat(fabricUsedKg),
            numLayers: parseInt(numLayers),
            layerWeight: parseFloat(layerWeight),
            layerLength: parseFloat(layerLength),
            drawingPcs: parseInt(drawingPcs),
            outputItemId: finalNewItem.id,
            outputStock,
        };
        
        dispatch({ type: 'ADD_WORK_ENTRY', payload: newEntry });
        showNotification("CUTTING ENTRY RECORDED SUCCESSFULLY");
        handleResetCuttingForm();
    };

    const handleSewingFinishingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !operationId) return;

        const processedStock: StockItem[] = [];
        let totalQuantity = 0;
        let hasError = false;

        Object.entries(processedQtys).forEach(([key, value]) => {
            const qty = parseInt(value || '0', 10);
            if (qty > 0) {
                const [color, size] = key.split(KEY_DELIMITER);
                const availableItem = availableStockForProcessing.find(s => s.color === color && s.size === size);
                if (!availableItem || qty > availableItem.quantity) {
                    hasError = true;
                }
                processedStock.push({ color, size, quantity: qty });
                totalQuantity += qty;
            }
        });

        if (hasError) {
            alert("Processed quantity cannot exceed available stock.");
            return;
        }
        if (processedStock.length === 0) {
            alert("Please enter quantity for at least one item.");
            return;
        }
        
        const newEntry: WorkEntry = {
            id: `work-${Date.now()}`,
            userId: user.id,
            date: today,
            type: operationType,
            trackingNumber,
            operationId,
            quantity: totalQuantity,
            processedStock,
        };

        dispatch({ type: 'ADD_WORK_ENTRY', payload: newEntry });
        showNotification("RECORDED SUCCESSFULLY");
        setOperationId('');
        setProcessedQtys({});
    };

    if (!isPresent) {
        return <p className="text-center text-red-500">You must be marked as 'PRESENT' and approved by an admin to log work for today.</p>
    }

    if (operationType === OperationType.CUTTING) {
        return (
             <form onSubmit={handleCuttingSubmit} className="space-y-4 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold mb-4 text-center">Daily Cutting Entry</h3>
                
                <fieldset className="border p-4 rounded-lg space-y-3">
                    <legend className="px-2 font-semibold">1. Fabric Consumption</legend>
                    <div>
                        <label>Fabric Tracking Number</label>
                        <select value={trackingNumber} onChange={e => {setTrackingNumber(e.target.value); setFabricColor('')}} required className="w-full p-2 border rounded-md">
                            <option value="">Select Tracking #</option>
                            {trackingNumbersInCorrectGodown.map(tn => <option key={tn} value={tn}>{tn}</option>)}
                        </select>
                         {itemName && <p className="text-sm text-slate-500 mt-1">Item: <strong>{itemName}</strong></p>}
                    </div>
                    {trackingNumber && (
                        <div>
                             <label>Fabric Color</label>
                            <select value={fabricColor} onChange={e => setFabricColor(e.target.value)} required className="w-full p-2 border rounded-md">
                                <option value="">Select Color</option>
                                {availableFabricColors.map(stock => <option key={stock.color} value={stock.color}>{stock.color} ({stock.quantity} kg available)</option>)}
                            </select>
                        </div>
                    )}
                </fieldset>

                {fabricColor && (
                     <fieldset className="border p-4 rounded-lg space-y-3">
                        <legend className="px-2 font-semibold">2. Cutting Details</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label>Fabric Used (kg)</label><input type="number" step="0.01" value={fabricUsedKg} onChange={e => setFabricUsedKg(e.target.value)} max={selectedFabricStock?.quantity} required className="w-full p-2 border rounded-md" /></div>
                            <div><label>Number of Layers</label><input type="number" value={numLayers} onChange={e => setNumLayers(e.target.value)} required className="w-full p-2 border rounded-md" /></div>
                            <div><label>Layer Weight (grams)</label><input type="number" value={layerWeight} onChange={e => setLayerWeight(e.target.value)} required className="w-full p-2 border rounded-md" /></div>
                            <div><label>Layer Length (inches)</label><input type="number" value={layerLength} onChange={e => setLayerLength(e.target.value)} required className="w-full p-2 border rounded-md" /></div>
                            <div><label>Drawing Pcs</label><input type="number" value={drawingPcs} onChange={e => setDrawingPcs(e.target.value)} required className="w-full p-2 border rounded-md" /></div>
                        </div>
                        <button type="button" onClick={() => setIsDefiningNewItem(true)} className="w-full bg-slate-200 text-slate-800 p-2 rounded-md" disabled={isDefiningNewItem || newItem.name !== ''}>Define Output Item</button>
                    </fieldset>
                )}

                {isDefiningNewItem && (
                    <fieldset className="border p-4 rounded-lg space-y-3 animate-fade-in">
                        <legend className="px-2 font-semibold">3. Define New Item (Output)</legend>
                        <div>
                            <label>New Item Name</label>
                            <input type="text" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value}))} required className="w-full p-2 border rounded-md" placeholder="e.g., Cut Shirt Panels" />
                        </div>
                        <button type="button" onClick={() => setNewItem(p => ({...p, colors: [...p.colors, { name: '', sizes: [{ name: '' }]}]}))} className="text-sm text-primary-600">+ Add Color</button>
                         {newItem.colors.map((color, cIndex) => (
                            <div key={cIndex} className="p-2 border rounded space-y-2">
                                <input type="text" value={color.name} onChange={e => { const newColors = [...newItem.colors]; newColors[cIndex].name = e.target.value; setNewItem(p => ({...p, colors: newColors})); }} placeholder="Color Name" required className="w-full p-2 border rounded-md" />
                                <div className="pl-4 space-y-1">
                                    {color.sizes.map((size, sIndex) => (
                                        <input key={sIndex} type="text" value={size.name} onChange={e => { const newColors = [...newItem.colors]; newColors[cIndex].sizes[sIndex].name = e.target.value; setNewItem(p => ({...p, colors: newColors})); }} placeholder="Size Name (e.g., S, M, L)" required className="w-full p-1 border rounded-md text-sm" />
                                    ))}
                                    <button type="button" onClick={() => { const newColors = [...newItem.colors]; newColors[cIndex].sizes.push({name: ''}); setNewItem(p=>({...p, colors: newColors})); }} className="text-xs text-blue-500">+ Add Size</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={() => setIsDefiningNewItem(false)} className="w-full bg-blue-500 text-white p-2 rounded-md">Save Item Definition</button>
                    </fieldset>
                )}

                {newItem.name && !isDefiningNewItem && (
                    <fieldset className="border p-4 rounded-lg space-y-3 animate-fade-in">
                        <legend className="px-2 font-semibold">4. Enter Output Quantities for "{newItem.name}"</legend>
                        {newItem.colors.map(color => (
                            <div key={color.name}>
                                <p className="font-medium">{color.name}</p>
                                 <div className="grid grid-cols-3 gap-2 pl-4">
                                    {color.sizes.map(size => (
                                        <div key={size.name}>
                                            <label className="text-sm">{size.name}</label>
                                            <input type="number" min="0" placeholder="0" value={outputQuantities[`${color.name}_||_${size.name}`] || ''} onChange={e => setOutputQuantities(p => ({ ...p, [`${color.name}_||_${size.name}`]: e.target.value }))} className="w-full p-1 border rounded-md" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </fieldset>
                )}

                {newItem.name && !isDefiningNewItem && (
                    <button type="submit" className="w-full bg-primary-600 text-white p-3 rounded-md hover:bg-primary-700 font-bold">Submit Full Cutting Entry</button>
                )}
             </form>
        )
    }

    // New view for Sewing/Finishing
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <form onSubmit={handleSewingFinishingSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Daily {title} Entry</h3>
                <div>
                    <label>Tracking Number</label>
                    <select value={trackingNumber} onChange={e => { setTrackingNumber(e.target.value); setOperationId(''); setProcessedQtys({}) }} required className="w-full p-2 border rounded-md">
                        <option value="">Select Tracking #</option>
                        {trackingNumbersInCorrectGodown.map(tn => <option key={tn} value={tn}>{tn}</option>)}
                    </select>
                    {itemName && <p className="text-sm text-slate-500 mt-1">Item: <strong>{itemName}</strong></p>}
                </div>
                {trackingNumber && (
                    <div>
                        <label>Operation</label>
                        <select value={operationId} onChange={e => setOperationId(e.target.value)} required className="w-full p-2 border rounded-md">
                            <option value="">Select Operation</option>
                            {availableOperations.map(op => <option key={op.id} value={op.id}>{op.operationName} (₹{op.rate.toFixed(2)})</option>)}
                        </select>
                    </div>
                )}
                {operationId && availableStockForProcessing.length > 0 && (
                     <div className="border p-4 rounded-md space-y-4 max-h-72 overflow-y-auto">
                        <h4 className="font-semibold">Enter Processed Quantities</h4>
                        {Object.entries(groupedStockForProcessing).map(([color, sizes]) => (
                            <div key={color}>
                                <p className="font-medium text-slate-800 bg-slate-100 p-2 rounded-md">{color}</p>
                                <div className="pl-4 pt-2 space-y-2">
                                    {sizes.map(item => (
                                        <div key={`${color}-${item.size}`} className="flex items-center justify-between">
                                            <label htmlFor={`${color}-${item.size}-qty`} className="text-sm">
                                                {item.size}: <span className="font-semibold text-slate-600">{item.quantity} pcs available</span>
                                            </label>
                                            <input 
                                                id={`${color}-${item.size}-qty`}
                                                type="number" 
                                                max={item.quantity} 
                                                min="0" 
                                                placeholder="0"
                                                value={processedQtys[`${color}${KEY_DELIMITER}${item.size}`] || ''}
                                                onChange={e => setProcessedQtys(p => ({ ...p, [`${color}${KEY_DELIMITER}${item.size}`]: e.target.value }))}
                                                className="w-24 p-1 border rounded-md" 
                                                aria-label={`Quantity for ${color} ${item.size}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 {operationId && (
                    <button type="submit" className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Submit Work</button>
                 )}
            </form>
            <div className="mt-2 md:mt-0">
                <h4 className="text-lg font-semibold mb-4">Today's {title} Entries</h4>
                <div className="border rounded-lg p-2 max-h-96 overflow-y-auto">
                    {todaysEntries.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead className="text-left">
                                <tr className="border-b">
                                    <th className="p-2">Operation</th>
                                    <th className="p-2">Qty</th>
                                    <th className="p-2">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todaysEntries.map(entry => {
                                    const op = state.sewingOperations.find(o => o.id === entry.operationId);
                                    const amount = op && entry.quantity ? (op.rate * entry.quantity).toFixed(2) : '0.00';
                                    return (
                                        <tr key={entry.id} className="border-b last:border-0">
                                            <td className="p-2">{getOperationName(entry.operationId)}</td>
                                            <td className="p-2">{entry.quantity}</td>
                                            <td className="p-2">₹{amount}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-slate-500 py-4">No {title.toLowerCase()} work logged for today yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const OtherActivityView: React.FC = () => {
    const { state, dispatch } = useData();
    const { showNotification } = useNotification();
    const KEY_DELIMITER = '_||_';

    const [selectedUserId, setSelectedUserId] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [operationId, setOperationId] = useState('');
    const [processedQtys, setProcessedQtys] = useState<{ [key: string]: string }>({});

    const today = new Date().toISOString().slice(0, 10);
    const presentEmployees = useMemo(() => {
        const presentUserIds = state.attendance
            .filter(a => a.date === today && a.status === ApprovalStatus.APPROVED)
            .map(a => a.userId);
        return state.users.filter(u => presentUserIds.includes(u.id));
    }, [state.attendance, state.users, today]);

    const allTrackingNumbers = useMemo(() => Array.from(new Set(state.inventory.map(i => i.trackingNumber))), [state.inventory]);

    const availableOperations = useMemo(() => {
        if (!trackingNumber) return [];
        return state.sewingOperations.filter(op => op.trackingNumber === trackingNumber);
    }, [trackingNumber, state.sewingOperations]);
    
    const selectedOperation = useMemo(() => {
        return state.sewingOperations.find(op => op.id === operationId);
    }, [operationId, state.sewingOperations]);

    const availableStockForProcessing = useMemo(() => {
        if (!trackingNumber || !selectedOperation) return [];
        let sourceGodownNames: string[] = [];
        const opType = selectedOperation.type;

        if (opType === OperationType.CUTTING) {
            sourceGodownNames = ['main godown', 'fabric godown'];
        } else if (opType === OperationType.SEWING) {
            sourceGodownNames = ['cutting wip', 'sewing wip'];
        } else { // FINISHING
            sourceGodownNames = ['sewing wip', 'finishing wip'];
        }
        const sourceGodowns = state.godowns.filter(g => sourceGodownNames.includes(g.name.toLowerCase()));
        const sourceGodownIds = sourceGodowns.map(g => g.id);

        const stockMap = new Map<string, { color: string, size: string, quantity: number }>();
        
        state.inventory
            .filter(inv => inv.trackingNumber === trackingNumber && sourceGodownIds.includes(inv.godownId))
            .forEach(inv => {
                inv.stock.forEach(s => {
                    const key = `${s.color}${KEY_DELIMITER}${s.size}`;
                    const existing = stockMap.get(key) || { color: s.color, size: s.size, quantity: 0 };
                    existing.quantity += s.quantity;
                    stockMap.set(key, existing);
                });
            });
        return Array.from(stockMap.values());
    }, [trackingNumber, selectedOperation, state.godowns, state.inventory]);
    
    const groupedStockForProcessing = useMemo(() => {
        return availableStockForProcessing.reduce((acc, item) => {
            if (!acc[item.color]) {
                acc[item.color] = [];
            }
            acc[item.color].push({ size: item.size, quantity: item.quantity });
            acc[item.color].sort((a, b) => a.size.localeCompare(b.size));
            return acc;
        }, {} as { [color: string]: { size: string, quantity: number }[] });
    }, [availableStockForProcessing]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedUserId || !selectedOperation) return;
        
        const processedStock: StockItem[] = [];
        let totalQuantity = 0;
        let hasError = false;

        Object.entries(processedQtys).forEach(([key, value]) => {
            const qty = parseInt(value || '0', 10);
            if (qty > 0) {
                const [color, size] = key.split(KEY_DELIMITER);
                const availableItem = availableStockForProcessing.find(s => s.color === color && s.size === size);
                if (!availableItem || qty > availableItem.quantity) hasError = true;
                processedStock.push({ color, size, quantity: qty });
                totalQuantity += qty;
            }
        });

        if (hasError) { alert("Processed quantity cannot exceed available stock."); return; }
        if (processedStock.length === 0) { alert("Please enter a quantity."); return; }
        
        const newEntry: WorkEntry = {
            id: `work-${Date.now()}`,
            userId: selectedUserId,
            date: today,
            type: selectedOperation.type,
            trackingNumber: trackingNumber,
            operationId: operationId,
            quantity: totalQuantity,
            processedStock,
        };
        dispatch({ type: 'ADD_WORK_ENTRY', payload: newEntry });
        showNotification("RECORDED SUCCESSFULLY");
        setSelectedUserId('');
        setTrackingNumber('');
        setOperationId('');
        setProcessedQtys({});
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
                        <select value={trackingNumber} onChange={e => {setTrackingNumber(e.target.value); setOperationId(''); setProcessedQtys({})}} required className="w-full p-2 border rounded-md">
                            <option value="">Select Tracking #</option>
                            {allTrackingNumbers.map(tn => <option key={tn} value={tn}>{tn}</option>)}
                        </select>
                    </div>
                    {trackingNumber && (
                        <div>
                            <label>Operation</label>
                            <select value={operationId} onChange={e => {setOperationId(e.target.value); setProcessedQtys({})}} required className="w-full p-2 border rounded-md">
                                <option value="">Select Operation</option>
                                {availableOperations.map(op => <option key={op.id} value={op.id}>{`${op.operationName} (${op.type})`}</option>)}
                            </select>
                        </div>
                    )}
                    {operationId && availableStockForProcessing.length > 0 && (
                        <div className="border p-4 rounded-md space-y-4 max-h-72 overflow-y-auto">
                            <h4 className="font-semibold">Enter Processed Quantities</h4>
                            {Object.entries(groupedStockForProcessing).map(([color, sizes]) => (
                                <div key={color}>
                                    <p className="font-medium text-slate-800 bg-slate-100 p-2 rounded-md">{color}</p>
                                    <div className="pl-4 pt-2 space-y-2">
                                        {sizes.map(item => (
                                            <div key={`${color}-${item.size}`} className="flex items-center justify-between">
                                                <label htmlFor={`other-${color}-${item.size}-qty`} className="text-sm">
                                                    {item.size}: <span className="font-semibold text-slate-600">{item.quantity} pcs available</span>
                                                </label>
                                                <input
                                                    id={`other-${color}-${item.size}-qty`}
                                                    type="number"
                                                    max={item.quantity}
                                                    min="0"
                                                    placeholder="0"
                                                    value={processedQtys[`${color}${KEY_DELIMITER}${item.size}`] || ''}
                                                    onChange={e => setProcessedQtys(p => ({ ...p, [`${color}${KEY_DELIMITER}${item.size}`]: e.target.value }))}
                                                    className="w-24 p-1 border rounded-md"
                                                    aria-label={`Quantity for ${color} ${item.size}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {operationId && (
                        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Submit Work For Employee</button>
                    )}
                </>
            )}
        </form>
    );
};

export default WipManagement;