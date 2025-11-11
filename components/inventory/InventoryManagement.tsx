import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { Role, Godown, Item, ItemColor, ItemSize, Inventory, StockItem, InternalTransfer, GoodsOutward } from '../../types';

// Item Modal Form - Moved to top level to prevent re-rendering issues
const ItemModal: React.FC<{ item: Item | null, closeModal: () => void }> = ({ item, closeModal }) => {
    const { dispatch } = useData();
    const { showNotification } = useNotification();
    const [formState, setFormState] = useState<Item>(item || { id: '', name: '', colors: [{ name: '', sizes: [{ name: '' }] }] });

    const handleFieldChange = <T,>(field: keyof Item, value: T) => setFormState(p => ({ ...p, [field]: value }));

    const handleColorChange = (colorIndex: number, value: string) => {
        const newColors = [...formState.colors];
        newColors[colorIndex].name = value;
        handleFieldChange('colors', newColors);
    };

    const handleSizeChange = (colorIndex: number, sizeIndex: number, value: string) => {
        const newColors = [...formState.colors];
        newColors[colorIndex].sizes[sizeIndex].name = value;
        handleFieldChange('colors', newColors);
    };
    
    const addColor = () => handleFieldChange('colors', [...formState.colors, { name: '', sizes: [{ name: '' }] }]);
    const addSize = (colorIndex: number) => {
        const newColors = [...formState.colors];
        newColors[colorIndex].sizes.push({ name: '' });
        handleFieldChange('colors', newColors);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (item) {
            dispatch({ type: 'UPDATE_ITEM', payload: formState });
        } else {
            dispatch({ type: 'ADD_ITEM', payload: { ...formState, id: `item-${Date.now()}` } });
        }
        showNotification("RECORDED SUCCESSFULLY");
        closeModal();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-xl font-bold">{item ? 'Edit' : 'Add'} Item</h3>
                    <div>
                        <label>Item Name</label>
                        <input type="text" value={formState.name} onChange={e => handleFieldChange('name', e.target.value)} required className="w-full p-2 border rounded-md" />
                    </div>
                    {formState.colors.map((color, cIndex) => (
                        <div key={cIndex} className="p-2 border rounded space-y-2">
                            <input type="text" value={color.name} onChange={e => handleColorChange(cIndex, e.target.value)} placeholder="Color Name" required className="w-full p-2 border rounded-md" />
                            <div className="pl-4 space-y-1">
                                {color.sizes.map((size, sIndex) => (
                                    <input key={sIndex} type="text" value={size.name} onChange={e => handleSizeChange(cIndex, sIndex, e.target.value)} placeholder="Size Name" required className="w-full p-1 border rounded-md text-sm" />
                                ))}
                                <button type="button" onClick={() => addSize(cIndex)} className="text-xs text-blue-500">+ Add Size</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addColor} className="text-sm text-primary-600">+ Add Color</button>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={closeModal} className="bg-gray-200 px-4 py-2 rounded-md">Cancel</button>
                        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md">{item ? 'Save' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Filter Input Component - Moved to top level
const FilterInput: React.FC<{ placeholder: string, value: string, onChange: (value: string) => void }> = ({ placeholder, value, onChange }) => (
    <input 
       type="text" 
       placeholder={placeholder}
       value={value}
       onChange={e => onChange(e.target.value)}
       className="w-full p-1 border rounded-md text-sm"
   />
);

// Main Component
const InventoryManagement: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('stock');

    const TABS = [
        { id: 'stock', label: 'Stock View', roles: [Role.ADMIN, Role.MANAGER] },
        { id: 'add_stock', label: 'Add Stock', roles: [Role.ADMIN, Role.MANAGER] },
        { id: 'transfers', label: 'Internal Transfer', roles: [Role.ADMIN, Role.MANAGER] },
        { id: 'outward', label: 'Goods Outward', roles: [Role.ADMIN, Role.MANAGER] },
        { id: 'items', label: 'Manage Items', roles: [Role.ADMIN] },
        { id: 'godowns', label: 'Manage Godowns', roles: [Role.ADMIN, Role.MANAGER] }
    ].filter(tab => user && tab.roles.includes(user.role));

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Inventory Management</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-6">
                    {activeTab === 'stock' && <StockView />}
                    {activeTab === 'add_stock' && <AddStockView setTab={setActiveTab} />}
                    {activeTab === 'transfers' && <InternalTransferView />}
                    {activeTab === 'outward' && <GoodsOutwardView />}
                    {activeTab === 'items' && <ItemView />}
                    {activeTab === 'godowns' && <GodownView />}
                </div>
            </div>
        </div>
    );
};

// Stock View Component
const StockView: React.FC = () => {
    const { state } = useData();
    const [filters, setFilters] = useState({
        trackingNumber: '',
        itemId: 'all',
        godownId: 'all',
        color: '',
        size: '',
    });

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const flatInventory = useMemo(() => {
        const flattened: (StockItem & { trackingNumber: string; itemId: string; godownId: string; })[] = [];
        state.inventory.forEach(inv => {
            inv.stock.forEach(stockItem => {
                flattened.push({
                    ...stockItem,
                    trackingNumber: inv.trackingNumber,
                    itemId: inv.itemId,
                    godownId: inv.godownId,
                });
            });
        });
        return flattened;
    }, [state.inventory]);

    const filteredInventory = useMemo(() => {
        return flatInventory.filter(item => {
            const trackingMatch = !filters.trackingNumber || item.trackingNumber.toLowerCase().includes(filters.trackingNumber.toLowerCase());
            const itemMatch = filters.itemId === 'all' || item.itemId === filters.itemId;
            const godownMatch = filters.godownId === 'all' || item.godownId === filters.godownId;
            const colorMatch = !filters.color || item.color.toLowerCase().includes(filters.color.toLowerCase());
            const sizeMatch = !filters.size || item.size.toLowerCase().includes(filters.size.toLowerCase());
            return trackingMatch && itemMatch && godownMatch && colorMatch && sizeMatch;
        });
    }, [flatInventory, filters]);
    
    const getItemName = (id: string) => state.items.find(i => i.id === id)?.name || 'Unknown Item';
    const getGodownName = (id: string) => state.godowns.find(g => g.id === id)?.name || 'Unknown Godown';

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Current Stock</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Tracking #</th>
                            <th className="px-6 py-3">Item</th>
                            <th className="px-6 py-3">Godown</th>
                            <th className="px-6 py-3">Colour</th>
                            <th className="px-6 py-3">Size</th>
                            <th className="px-6 py-3">Qty</th>
                        </tr>
                        <tr>
                            <th className="px-2 py-1"><FilterInput placeholder="Filter..." value={filters.trackingNumber} onChange={val => handleFilterChange('trackingNumber', val)} /></th>
                            <th className="px-2 py-1">
                                <select value={filters.itemId} onChange={e => handleFilterChange('itemId', e.target.value)} className="w-full p-1 border rounded-md text-sm">
                                    <option value="all">All Items</option>
                                    {state.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                            </th>
                            <th className="px-2 py-1">
                                <select value={filters.godownId} onChange={e => handleFilterChange('godownId', e.target.value)} className="w-full p-1 border rounded-md text-sm">
                                    <option value="all">All Godowns</option>
                                    {state.godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </th>
                            <th className="px-2 py-1"><FilterInput placeholder="Filter..." value={filters.color} onChange={val => handleFilterChange('color', val)} /></th>
                            <th className="px-2 py-1"><FilterInput placeholder="Filter..." value={filters.size} onChange={val => handleFilterChange('size', val)} /></th>
                            <th className="px-2 py-1"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory.map((item, index) => (
                            <tr key={`${item.trackingNumber}-${item.godownId}-${item.color}-${item.size}-${index}`} className="bg-white border-b">
                                <td className="px-6 py-4 font-bold">{item.trackingNumber}</td>
                                <td className="px-6 py-4">{getItemName(item.itemId)}</td>
                                <td className="px-6 py-4">{getGodownName(item.godownId)}</td>
                                <td className="px-6 py-4">{item.color}</td>
                                <td className="px-6 py-4">{item.size}</td>
                                <td className="px-6 py-4 font-semibold text-lg">{item.quantity}</td>
                            </tr>
                        ))}
                         {filteredInventory.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-4 text-gray-500">No stock found for this filter.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// Add Stock Component
const AddStockView: React.FC<{setTab: (tab: string) => void}> = ({ setTab }) => {
    const { state, dispatch } = useData();
    const { showNotification } = useNotification();
    const [formState, setFormState] = useState<{ [key: string]: any }>({});
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);

    const handleItemSelect = (itemId: string) => {
        const item = state.items.find(i => i.id === itemId);
        setSelectedItem(item || null);
        setFormState(prev => ({ ...prev, itemId }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) {
            alert('Please select an item.');
            return;
        }
        if (state.inventory.some(i => i.trackingNumber === formState.trackingNumber)) {
            alert('This tracking number already exists.');
            return;
        }

        const stock: StockItem[] = [];
        selectedItem.colors.forEach(color => {
            color.sizes.forEach(size => {
                const qty = parseInt(formState[`${color.name}-${size.name}`] || '0');
                if (qty > 0) {
                    stock.push({ color: color.name, size: size.name, quantity: qty });
                }
            });
        });

        if (stock.length === 0) {
            alert('Please enter quantity for at least one size.');
            return;
        }

        const newInventory: Inventory = {
            trackingNumber: formState.trackingNumber,
            partyChallanNumber: formState.partyChallanNumber,
            challanDate: formState.challanDate,
            itemId: formState.itemId,
            godownId: formState.godownId,
            stock,
        };

        dispatch({ type: 'ADD_INVENTORY', payload: newInventory });
        showNotification("RECORDED SUCCESSFULLY");
        setTab('stock');
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
                <h3 className="text-lg font-semibold">Add New Stock Entry</h3>
                <div>
                    <label>Tracking Number</label>
                    <input type="text" required onChange={e => setFormState(p => ({ ...p, trackingNumber: e.target.value }))} className="w-full p-2 border rounded-md" />
                </div>
                 <div>
                    <label>Party Challan Number</label>
                    <input type="text" required onChange={e => setFormState(p => ({ ...p, partyChallanNumber: e.target.value }))} className="w-full p-2 border rounded-md" />
                </div>
                 <div>
                    <label>Challan Date</label>
                    <input type="date" required onChange={e => setFormState(p => ({ ...p, challanDate: e.target.value }))} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label>Godown</label>
                    <select required onChange={e => setFormState(p => ({ ...p, godownId: e.target.value }))} className="w-full p-2 border rounded-md">
                        <option value="">Select Godown</option>
                        {state.godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="item-select" className="text-sm font-medium text-gray-700">Item</label>
                        <button
                            type="button"
                            onClick={() => setIsItemModalOpen(true)}
                            className="text-xs font-medium text-primary-600 hover:underline"
                        >
                            + Add New Item
                        </button>
                    </div>
                    <select id="item-select" value={formState.itemId || ''} required onChange={e => handleItemSelect(e.target.value)} className="w-full p-2 border rounded-md">
                        <option value="">Select Item</option>
                        {state.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                </div>

                {selectedItem && (
                    <div className="border p-4 rounded-md space-y-2">
                        <h4 className="font-semibold">Enter Quantities for {selectedItem.name}</h4>
                        {selectedItem.colors.map(color => (
                            <div key={color.name}>
                                <p className="font-medium">{color.name}</p>
                                 <div className="grid grid-cols-3 gap-2 pl-4">
                                    {color.sizes.map(size => (
                                        <div key={size.name}>
                                            <label className="text-sm">{size.name}</label>
                                            <input type="number" min="0" placeholder="0" onChange={e => setFormState(p => ({ ...p, [`${color.name}-${size.name}`]: e.target.value }))} className="w-full p-1 border rounded-md" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Add Stock</button>
            </form>
            {isItemModalOpen && <ItemModal item={null} closeModal={() => setIsItemModalOpen(false)} />}
        </>
    );
};

// Internal Transfer Component
const InternalTransferView: React.FC = () => {
    const { state, dispatch } = useData();
    const { showNotification } = useNotification();
    const [trackingNumber, setTrackingNumber] = useState('');
    const [fromGodownId, setFromGodownId] = useState('');
    const [toGodownId, setToGodownId] = useState('');
    const [transferQtys, setTransferQtys] = useState<{ [key: string]: string }>({});
    const KEY_DELIMITER = '_||_';

    const trackingNumbersWithStock = useMemo(() => {
        const stockByTrackingNumber = state.inventory.reduce((acc, inv) => {
            if (!acc[inv.trackingNumber]) acc[inv.trackingNumber] = 0;
            acc[inv.trackingNumber] += inv.stock.reduce((sum, s) => sum + s.quantity, 0);
            return acc;
        }, {} as { [key: string]: number });
        return Object.entries(stockByTrackingNumber).filter(([, qty]) => qty > 0).map(([tn]) => tn);
    }, [state.inventory]);
    
    const godownsWithStock = useMemo(() => {
        if (!trackingNumber) return [];
        const godownIds = state.inventory
            .filter(i => i.trackingNumber === trackingNumber && i.stock.some(s => s.quantity > 0))
            .map(i => i.godownId);
        return state.godowns.filter(g => godownIds.includes(g.id));
    }, [trackingNumber, state.inventory, state.godowns]);

    const availableStock = useMemo(() => {
        if (!trackingNumber || !fromGodownId) return null;
        return state.inventory.find(i => i.trackingNumber === trackingNumber && i.godownId === fromGodownId);
    }, [trackingNumber, fromGodownId, state.inventory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!availableStock) {
            alert("Selected stock not found.");
            return;
        }
        if (fromGodownId === toGodownId) {
            alert("From and To godowns cannot be the same.");
            return;
        }

        const items: StockItem[] = [];
        let hasError = false;
        Object.entries(transferQtys).forEach(([key, value]) => {
            const qty = parseInt(value || '0');
            if (qty > 0) {
                const [color, size] = key.split(KEY_DELIMITER);
                const stockItem = availableStock.stock.find(s => s.color === color && s.size === size);
                if (!stockItem || qty > stockItem.quantity) {
                    hasError = true;
                }
                items.push({ color, size, quantity: qty });
            }
        });
        
        if (hasError) {
            alert("Transfer quantity cannot exceed available stock.");
            return;
        }
        if (items.length === 0) {
            alert("Please enter a quantity to transfer.");
            return;
        }

        const newTransfer: InternalTransfer = {
            internalChallanNumber: `INT-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            trackingNumber,
            fromGodownId,
            toGodownId,
            items
        };

        dispatch({ type: 'ADD_INTERNAL_TRANSFER', payload: newTransfer });
        showNotification("RECORDED SUCCESSFULLY");
        setTrackingNumber('');
        setFromGodownId('');
        setToGodownId('');
        setTransferQtys({});
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            <h3 className="text-lg font-semibold">Internal Goods Transfer</h3>
            <div>
                <label>Tracking Number (with stock > 0)</label>
                <select value={trackingNumber} onChange={e => { setTrackingNumber(e.target.value); setFromGodownId(''); setToGodownId(''); setTransferQtys({}); }} className="w-full p-2 border rounded-md">
                    <option value="">Select Tracking #</option>
                    {trackingNumbersWithStock.map(tn => <option key={tn} value={tn}>{tn}</option>)}
                </select>
            </div>
             <div>
                <label>From Godown</label>
                <select value={fromGodownId} onChange={e => { setFromGodownId(e.target.value); setToGodownId(''); setTransferQtys({}); }} className="w-full p-2 border rounded-md" disabled={!trackingNumber}>
                    <option value="">Select Godown</option>
                    {godownsWithStock.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>
            {availableStock && (
                <div className="border p-4 rounded-md space-y-2">
                    <h4 className="font-semibold">Available to Transfer</h4>
                    {availableStock.stock.map(item => (
                        <div key={`${item.color}-${item.size}`} className="flex items-center justify-between">
                            <span>{item.color} / {item.size}: <span className="font-semibold">{item.quantity} pcs</span></span>
                            <input type="number" max={item.quantity} min="0" placeholder="0"
                                onChange={e => setTransferQtys(p => ({ ...p, [`${item.color}${KEY_DELIMITER}${item.size}`]: e.target.value }))}
                                className="w-24 p-1 border rounded-md" />
                        </div>
                    ))}
                     <div>
                        <label>To Godown</label>
                        <select value={toGodownId} onChange={e => setToGodownId(e.target.value)} className="w-full p-2 border rounded-md mt-2" required>
                            <option value="">Select Godown</option>
                            {state.godowns.filter(g => g.id !== fromGodownId).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                </div>
            )}
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700" disabled={!availableStock || !toGodownId}>Transfer Goods</button>
        </form>
    )
};

const GoodsOutwardView: React.FC = () => {
    const { state, dispatch } = useData();
    const { showNotification } = useNotification();
    const [trackingNumber, setTrackingNumber] = useState('');
    const [godownId, setGodownId] = useState('');
    const [partyName, setPartyName] = useState('');
    const [outwardQtys, setOutwardQtys] = useState<{ [key: string]: string }>({});
    const KEY_DELIMITER = '_||_';

    const trackingNumbersWithStock = useMemo(() => {
        const stockByTrackingNumber = state.inventory.reduce((acc, inv) => {
            if (!acc[inv.trackingNumber]) acc[inv.trackingNumber] = 0;
            acc[inv.trackingNumber] += inv.stock.reduce((sum, s) => sum + s.quantity, 0);
            return acc;
        }, {} as { [key: string]: number });
        return Object.entries(stockByTrackingNumber).filter(([, qty]) => qty > 0).map(([tn]) => tn);
    }, [state.inventory]);

    const godownsWithStock = useMemo(() => {
        if (!trackingNumber) return [];
        const godownIds = state.inventory
            .filter(i => i.trackingNumber === trackingNumber && i.stock.some(s => s.quantity > 0))
            .map(i => i.godownId);
        return state.godowns.filter(g => godownIds.includes(g.id));
    }, [trackingNumber, state.inventory, state.godowns]);
    
    const availableStock = useMemo(() => {
        if (!trackingNumber || !godownId) return null;
        return state.inventory.find(i => i.trackingNumber === trackingNumber && i.godownId === godownId);
    }, [trackingNumber, godownId, state.inventory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!availableStock) { alert("Selected stock not found."); return; }
        
        const items: StockItem[] = [];
        let hasError = false;
        Object.entries(outwardQtys).forEach(([key, value]) => {
            const qty = parseInt(value || '0');
            if (qty > 0) {
                const [color, size] = key.split(KEY_DELIMITER);
                const stockItem = availableStock.stock.find(s => s.color === color && s.size === size);
                if (!stockItem || qty > stockItem.quantity) hasError = true;
                items.push({ color, size, quantity: qty });
            }
        });
        
        if (hasError) { alert("Outward quantity cannot exceed available stock."); return; }
        if (items.length === 0) { alert("Please enter a quantity for dispatch."); return; }

        const newOutward: GoodsOutward = {
            outwardChallanNumber: `OUT-${Date.now()}`,
            partyName,
            date: new Date().toISOString().slice(0, 10),
            trackingNumber,
            godownId,
            items
        };

        dispatch({ type: 'ADD_GOODS_OUTWARD', payload: newOutward });
        showNotification("RECORDED SUCCESSFULLY");
        setTrackingNumber('');
        setGodownId('');
        setPartyName('');
        setOutwardQtys({});
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            <h3 className="text-lg font-semibold">Dispatch Goods (Outward)</h3>
            <div>
                <label>Party Name</label>
                <input type="text" value={partyName} onChange={e => setPartyName(e.target.value)} required className="w-full p-2 border rounded-md" />
            </div>
            <div>
                <label>Tracking Number (with stock > 0)</label>
                <select value={trackingNumber} onChange={e => { setTrackingNumber(e.target.value); setGodownId(''); setOutwardQtys({}); }} className="w-full p-2 border rounded-md" required>
                    <option value="">Select Tracking #</option>
                    {trackingNumbersWithStock.map(tn => <option key={tn} value={tn}>{tn}</option>)}
                </select>
            </div>
             <div>
                <label>From Godown</label>
                <select value={godownId} onChange={e => { setGodownId(e.target.value); setOutwardQtys({}); }} className="w-full p-2 border rounded-md" disabled={!trackingNumber} required>
                    <option value="">Select Godown</option>
                    {godownsWithStock.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>
            {availableStock && (
                <div className="border p-4 rounded-md space-y-2">
                    <h4 className="font-semibold">Available to Dispatch</h4>
                    {availableStock.stock.map(item => (
                        <div key={`${item.color}-${item.size}`} className="flex items-center justify-between">
                            <span>{item.color} / {item.size}: <span className="font-semibold">{item.quantity} pcs</span></span>
                            <input type="number" max={item.quantity} min="0" placeholder="0"
                                onChange={e => setOutwardQtys(p => ({ ...p, [`${item.color}${KEY_DELIMITER}${item.size}`]: e.target.value }))}
                                className="w-24 p-1 border rounded-md" />
                        </div>
                    ))}
                </div>
            )}
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700" disabled={!availableStock}>Dispatch Goods</button>
        </form>
    );
};


// Item Management Component
const ItemView: React.FC = () => {
    const { state, dispatch } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    const openModal = (item: Item | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (itemId: string) => {
        if(window.confirm('Are you sure? This may affect inventory records.')){
            dispatch({ type: 'DELETE_ITEM', payload: itemId });
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Items</h3>
                <button onClick={() => openModal()} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Add New Item</button>
            </div>
            <ul className="space-y-2">
                {state.items.map(item => (
                    <li key={item.id} className="p-3 border rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-bold">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.colors.length} colors</p>
                        </div>
                        <div className="space-x-2">
                            <button onClick={() => openModal(item)} className="text-blue-500">Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="text-red-500">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
            {isModalOpen && <ItemModal item={editingItem} closeModal={() => setIsModalOpen(false)} />}
        </div>
    );
};

// Godown Management Component
const GodownView: React.FC = () => {
    const { state, dispatch } = useData();
    const { showNotification } = useNotification();
    const [godownName, setGodownName] = useState('');

    const handleAddGodown = () => {
        if (godownName.trim()) {
            dispatch({ type: 'ADD_GODOWN', payload: { id: `g-${Date.now()}`, name: godownName.trim() } });
            showNotification("RECORDED SUCCESSFULLY");
            setGodownName('');
        }
    };
    
    const handleDelete = (id: string) => {
        if(window.confirm('Are you sure? This may affect inventory records.')){
            dispatch({ type: 'DELETE_GODOWN', payload: id });
        }
    }

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Godowns</h3>
            <div className="flex gap-2 mb-4">
                <input type="text" value={godownName} onChange={e => setGodownName(e.target.value)} placeholder="New Godown Name" className="flex-grow p-2 border rounded-md" />
                <button onClick={handleAddGodown} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Add</button>
            </div>
            <ul className="space-y-2">
                {state.godowns.map(g => (
                    <li key={g.id} className="p-2 border rounded flex justify-between items-center">
                        {g.name}
                        <button onClick={() => handleDelete(g.id)} className="text-red-500 text-sm">Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default InventoryManagement;