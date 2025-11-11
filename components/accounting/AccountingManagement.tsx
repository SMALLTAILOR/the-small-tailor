import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { Role, Vendor, Customer, PurchaseOrder, SalesOrder, Item, PurchaseStatus, SalesStatus, PurchaseOrderItem, SalesOrderItem, StockItem } from '../../types';
import { ItemModal } from '../inventory/InventoryManagement';

const AccountingManagement: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('purchases');

    const TABS = [
        { id: 'purchases', label: 'Purchases', roles: [Role.ADMIN, Role.MANAGER] },
        { id: 'sales', label: 'Sales', roles: [Role.ADMIN, Role.MANAGER] },
        { id: 'vendors', label: 'Vendors', roles: [Role.ADMIN, Role.MANAGER] },
        { id: 'customers', label: 'Customers', roles: [Role.ADMIN, Role.MANAGER] },
    ].filter(tab => user && tab.roles.includes(user.role));

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Accounting Management</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-6">
                    {activeTab === 'purchases' && <PurchaseView />}
                    {activeTab === 'sales' && <SalesView />}
                    {activeTab === 'vendors' && <VendorView />}
                    {activeTab === 'customers' && <CustomerView />}
                </div>
            </div>
        </div>
    );
};

// #region Vendor CRUD
const VendorView: React.FC = () => {
    const { state, dispatch } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

    const openModal = (vendor: Vendor | null = null) => {
        setEditingVendor(vendor);
        setIsModalOpen(true);
    };

    const handleDelete = (vendorId: string) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            dispatch({ type: 'DELETE_VENDOR', payload: vendorId });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Vendors</h3>
                <button onClick={() => openModal()} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Add New Vendor</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Contact Person</th>
                            <th className="px-6 py-3">Phone</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.vendors.map(vendor => (
                            <tr key={vendor.id} className="bg-white border-b">
                                <td className="px-6 py-4 font-bold">{vendor.name}</td>
                                <td className="px-6 py-4">{vendor.contactPerson || '-'}</td>
                                <td className="px-6 py-4">{vendor.phone || '-'}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => openModal(vendor)} className="font-medium text-primary-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(vendor.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <VendorModal vendor={editingVendor} closeModal={() => setIsModalOpen(false)} />}
        </div>
    );
};

const VendorModal: React.FC<{ vendor: Vendor | null, closeModal: () => void }> = ({ vendor, closeModal }) => {
    const { dispatch } = useData();
    const [formState, setFormState] = useState(vendor || { id: '', name: '', contactPerson: '', phone: '', address: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (vendor) {
            dispatch({ type: 'UPDATE_VENDOR', payload: formState });
        } else {
            dispatch({ type: 'ADD_VENDOR', payload: { ...formState, id: `v-${Date.now()}` } });
        }
        closeModal();
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
                <h3 className="text-xl font-bold">{vendor ? 'Edit' : 'Add'} Vendor</h3>
                <input type="text" placeholder="Name" value={formState.name} onChange={e => setFormState(p => ({ ...p, name: e.target.value }))} required className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="Contact Person" value={formState.contactPerson} onChange={e => setFormState(p => ({ ...p, contactPerson: e.target.value }))} className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="Phone" value={formState.phone} onChange={e => setFormState(p => ({ ...p, phone: e.target.value }))} className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="Address" value={formState.address} onChange={e => setFormState(p => ({ ...p, address: e.target.value }))} className="w-full p-2 border rounded-md" />
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={closeModal} className="bg-slate-200 px-4 py-2 rounded-md">Cancel</button>
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md">Save</button>
                </div>
            </form>
        </div>
    )
};
// #endregion

// #region Customer CRUD
const CustomerView: React.FC = () => {
    const { state, dispatch } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const openModal = (customer: Customer | null = null) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = (customerId: string) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            dispatch({ type: 'DELETE_CUSTOMER', payload: customerId });
        }
    };
    
    return (
         <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Customers</h3>
                <button onClick={() => openModal()} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">Add New Customer</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Contact Person</th>
                            <th className="px-6 py-3">Phone</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.customers.map(customer => (
                            <tr key={customer.id} className="bg-white border-b">
                                <td className="px-6 py-4 font-bold">{customer.name}</td>
                                <td className="px-6 py-4">{customer.contactPerson || '-'}</td>
                                <td className="px-6 py-4">{customer.phone || '-'}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => openModal(customer)} className="font-medium text-primary-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(customer.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <CustomerModal customer={editingCustomer} closeModal={() => setIsModalOpen(false)} />}
        </div>
    )
};

const CustomerModal: React.FC<{ customer: Customer | null, closeModal: () => void }> = ({ customer, closeModal }) => {
    const { dispatch } = useData();
    const [formState, setFormState] = useState(customer || { id: '', name: '', contactPerson: '', phone: '', address: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customer) {
            dispatch({ type: 'UPDATE_CUSTOMER', payload: formState });
        } else {
            dispatch({ type: 'ADD_CUSTOMER', payload: { ...formState, id: `c-${Date.now()}` } });
        }
        closeModal();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full space-y-4">
                <h3 className="text-xl font-bold">{customer ? 'Edit' : 'Add'} Customer</h3>
                <input type="text" placeholder="Name" value={formState.name} onChange={e => setFormState(p => ({ ...p, name: e.target.value }))} required className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="Contact Person" value={formState.contactPerson} onChange={e => setFormState(p => ({ ...p, contactPerson: e.target.value }))} className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="Phone" value={formState.phone} onChange={e => setFormState(p => ({ ...p, phone: e.target.value }))} className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="Address" value={formState.address} onChange={e => setFormState(p => ({ ...p, address: e.target.value }))} className="w-full p-2 border rounded-md" />
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={closeModal} className="bg-slate-200 px-4 py-2 rounded-md">Cancel</button>
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md">Save</button>
                </div>
            </form>
        </div>
    )
};
// #endregion

// #region Purchases
const PurchaseView: React.FC = () => {
    const { state, dispatch } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);

    const getVendorName = (id: string) => state.vendors.find(v => v.id === id)?.name || 'Unknown';
    const getItemName = (id: string) => state.items.find(i => i.id === id)?.name || 'Unknown';
    
    const openModal = (po: PurchaseOrder | null = null) => {
        setEditingPO(po);
        setIsModalOpen(true);
    };

    const handleDelete = (poId: string) => {
        if (window.confirm('Are you sure you want to delete this purchase order? This will also reverse the stock entry.')) {
            dispatch({ type: 'DELETE_PURCHASE_ORDER', payload: poId });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Purchase Orders</h3>
                <button onClick={() => openModal(null)} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">New Purchase</button>
            </div>
            <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3">PO #</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Vendor</th>
                            <th className="px-6 py-3">Item</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Status</th>
                             <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.purchaseOrders.map(po => (
                             <tr key={po.id} className="bg-white border-b">
                                <td className="px-6 py-4 font-bold">{po.purchaseOrderNumber}</td>
                                <td className="px-6 py-4">{po.orderDate}</td>
                                <td className="px-6 py-4">{getVendorName(po.vendorId)}</td>
                                <td className="px-6 py-4">{getItemName(po.itemId)} ({po.trackingNumber})</td>
                                <td className="px-6 py-4">₹{po.totalAmount.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${po.status === PurchaseStatus.RECEIVED ? 'text-emerald-800 bg-emerald-100' : 'text-amber-800 bg-amber-100'}`}>
                                        {po.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => openModal(po)} className="font-medium text-primary-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(po.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
            {isModalOpen && <PurchaseOrderModal purchaseOrder={editingPO} closeModal={() => setIsModalOpen(false)} />}
        </div>
    );
};

const PurchaseOrderModal: React.FC<{ purchaseOrder: PurchaseOrder | null, closeModal: () => void }> = ({ purchaseOrder, closeModal }) => {
    const { state, dispatch } = useData();
    const { showNotification } = useNotification();
    const [formState, setFormState] = useState<Omit<PurchaseOrder, 'id' | 'purchaseOrderNumber'>>({
        vendorId: '',
        orderDate: new Date().toISOString().slice(0, 10),
        trackingNumber: '',
        partyChallanNumber: '',
        itemId: '',
        godownId: '',
        items: [],
        totalAmount: 0,
        status: PurchaseStatus.RECEIVED,
    });
    const [itemQuantities, setItemQuantities] = useState<{[key: string]: {qty: string, rate: string}}>({});
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    
    useEffect(() => {
        if (purchaseOrder) {
            setFormState({ ...purchaseOrder });
            const quantities: { [key: string]: { qty: string; rate: string } } = {};
            purchaseOrder.items.forEach(item => {
                const key = `${item.color}_||_${item.size}`;
                quantities[key] = { qty: String(item.quantity), rate: String(item.rate) };
            });
            setItemQuantities(quantities);
        }
    }, [purchaseOrder]);

    const selectedItem = useMemo(() => state.items.find(i => i.id === formState.itemId), [formState.itemId, state.items]);

    const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '--create-new--') {
            setIsItemModalOpen(true);
            setFormState(p => ({...p, itemId: ''}));
        } else {
            setFormState(p => ({...p, itemId: value}));
        }
    };

    const handleItemModalClose = (newItemId?: string) => {
        setIsItemModalOpen(false);
        if (newItemId) {
            setFormState(p => ({...p, itemId: newItemId}));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        if (!purchaseOrder && state.inventory.some(i => i.trackingNumber === formState.trackingNumber)) {
            alert('This tracking number already exists.');
            return;
        }

        const items: PurchaseOrderItem[] = [];
        let totalAmount = 0;

        Object.entries(itemQuantities).forEach(([key, values]) => {
            const qty = parseInt(values.qty || '0');
            const rate = parseFloat(values.rate || '0');
            if(qty > 0) {
                const [color, size] = key.split('_||_');
                const amount = qty * rate;
                items.push({ color, size, quantity: qty, rate, amount });
                totalAmount += amount;
            }
        });

        if (items.length === 0) {
            alert('Please enter quantity for at least one item.');
            return;
        }

        if (purchaseOrder) {
            const updatedPO: PurchaseOrder = {
                ...purchaseOrder,
                ...formState,
                items,
                totalAmount,
            };
            dispatch({ type: 'UPDATE_PURCHASE_ORDER', payload: updatedPO });
            showNotification("Purchase order updated!");
        } else {
            const newPO: PurchaseOrder = {
                id: `po-${Date.now()}`,
                purchaseOrderNumber: `PO-${Date.now()}`,
                ...formState,
                items,
                totalAmount,
            };
            dispatch({ type: 'ADD_PURCHASE_ORDER', payload: newPO });
            showNotification("Purchase recorded and stock updated!");
        }
        closeModal();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            {isItemModalOpen && <ItemModal item={null} onClose={handleItemModalClose} />}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold">{purchaseOrder ? 'Edit' : 'New'} Purchase Order</h3>
                <div className="grid grid-cols-2 gap-4">
                    <select value={formState.vendorId} onChange={e => setFormState(p => ({...p, vendorId: e.target.value}))} required className="w-full p-2 border rounded-md"><option value="">Select Vendor</option>{state.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
                    <input type="date" value={formState.orderDate} onChange={e => setFormState(p => ({...p, orderDate: e.target.value}))} required className="w-full p-2 border rounded-md" />
                    <input type="text" placeholder="Tracking Number" value={formState.trackingNumber} onChange={e => setFormState(p => ({...p, trackingNumber: e.target.value}))} required className="w-full p-2 border rounded-md" disabled={!!purchaseOrder} />
                    <input type="text" placeholder="Party Challan Number" value={formState.partyChallanNumber} onChange={e => setFormState(p => ({...p, partyChallanNumber: e.target.value}))} required className="w-full p-2 border rounded-md" />
                    <select value={formState.itemId} onChange={handleItemSelect} required className="w-full p-2 border rounded-md">
                        <option value="">Select Item</option>
                        {!purchaseOrder && <option value="--create-new--" className="font-bold text-primary-600">-- Create New Item --</option>}
                        {state.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <select value={formState.godownId} onChange={e => setFormState(p => ({...p, godownId: e.target.value}))} required className="w-full p-2 border rounded-md"><option value="">Deliver to Godown</option>{state.godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
                </div>
                 {selectedItem && (
                    <div className="border p-4 rounded-md space-y-2">
                        <h4 className="font-semibold">Enter Quantities & Rates for {selectedItem.name}</h4>
                        {selectedItem.colors.map(color => (
                            <div key={color.name}>
                                <p className="font-medium">{color.name}</p>
                                 <div className="grid grid-cols-4 gap-2 pl-4">
                                    {color.sizes.map(size => {
                                        const key = `${color.name}_||_${size.name}`;
                                        return (<React.Fragment key={key}>
                                            <label className="text-sm self-center">{size.name}</label>
                                            <input type="number" min="0" placeholder="Qty" value={itemQuantities[key]?.qty || ''} onChange={e => setItemQuantities(p => ({...p, [key]: {...p[key], qty: e.target.value}}))} className="w-full p-1 border rounded-md" />
                                            <input type="number" step="0.01" min="0" placeholder="Rate" value={itemQuantities[key]?.rate || ''} onChange={e => setItemQuantities(p => ({...p, [key]: {...p[key], rate: e.target.value}}))} className="w-full p-1 border rounded-md" />
                                            <span>₹{(parseInt(itemQuantities[key]?.qty || '0') * parseFloat(itemQuantities[key]?.rate || '0')).toFixed(2)}</span>
                                        </React.Fragment>)
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={closeModal} className="bg-slate-200 px-4 py-2 rounded-md">Cancel</button>
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md">{purchaseOrder ? 'Update PO' : 'Create PO & Receive Stock'}</button>
                </div>
            </form>
        </div>
    )
};
// #endregion

// #region Sales
const SalesView: React.FC = () => {
    const { state, dispatch } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSO, setEditingSO] = useState<SalesOrder | null>(null);

    const getCustomerName = (id: string) => state.customers.find(c => c.id === id)?.name || 'Unknown';
    
    const openModal = (so: SalesOrder | null = null) => {
        setEditingSO(so);
        setIsModalOpen(true);
    };

    const handleDelete = (soId: string) => {
        if (window.confirm('Are you sure you want to delete this sales order? This will also add the stock back to inventory.')) {
            dispatch({ type: 'DELETE_SALES_ORDER', payload: soId });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Sales Orders</h3>
                <button onClick={() => openModal(null)} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">New Sale</button>
            </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3">SO #</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Tracking #</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.salesOrders.map(so => (
                             <tr key={so.id} className="bg-white border-b">
                                <td className="px-6 py-4 font-bold">{so.salesOrderNumber}</td>
                                <td className="px-6 py-4">{so.orderDate}</td>
                                <td className="px-6 py-4">{getCustomerName(so.customerId)}</td>
                                <td className="px-6 py-4">{so.trackingNumber}</td>
                                <td className="px-6 py-4">₹{so.totalAmount.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${so.status === SalesStatus.DISPATCHED ? 'text-emerald-800 bg-emerald-100' : 'text-amber-800 bg-amber-100'}`}>
                                        {so.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => openModal(so)} className="font-medium text-primary-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(so.id)} className="font-medium text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
            {isModalOpen && <SalesOrderModal salesOrder={editingSO} closeModal={() => setIsModalOpen(false)} />}
        </div>
    )
};

const SalesOrderModal: React.FC<{ salesOrder: SalesOrder | null, closeModal: () => void }> = ({ salesOrder, closeModal }) => {
    const { state, dispatch } = useData();
    const { showNotification } = useNotification();
    const [formState, setFormState] = useState<Omit<SalesOrder, 'id' | 'salesOrderNumber'>>({
        customerId: '',
        orderDate: new Date().toISOString().slice(0, 10),
        trackingNumber: '',
        godownId: '',
        items: [],
        totalAmount: 0,
        status: SalesStatus.DISPATCHED
    });
    const [itemQuantities, setItemQuantities] = useState<{[key: string]: {qty: string, rate: string}}>({});

    useEffect(() => {
        if (salesOrder) {
            setFormState({ ...salesOrder });
            const quantities: { [key: string]: { qty: string; rate: string } } = {};
            salesOrder.items.forEach(item => {
                const key = `${item.color}_||_${item.size}`;
                quantities[key] = { qty: String(item.quantity), rate: String(item.rate) };
            });
            setItemQuantities(quantities);
        }
    }, [salesOrder]);

    const trackingNumbersWithStock = useMemo(() => Array.from(new Set(state.inventory.filter(i => i.stock.length > 0).map(i => i.trackingNumber))), [state.inventory]);
    const godownsWithStock = useMemo(() => {
        if (!formState.trackingNumber) return [];
        const godownIds = state.inventory.filter(i => i.trackingNumber === formState.trackingNumber).map(i => i.godownId);
        return state.godowns.filter(g => godownIds.includes(g.id));
    }, [formState.trackingNumber, state.inventory, state.godowns]);
    
    const availableStock = useMemo(() => {
        // For editing, we need to consider the stock that *was* available before this sale
        if (salesOrder && salesOrder.trackingNumber === formState.trackingNumber && salesOrder.godownId === formState.godownId) {
            const currentStock = state.inventory.find(i => i.trackingNumber === formState.trackingNumber && i.godownId === formState.godownId)?.stock || [];
            const tempStock = JSON.parse(JSON.stringify(currentStock));
            // Add back the original sale quantity to calculate available stock for editing
            salesOrder.items.forEach(soldItem => {
                const stockItem = tempStock.find((s: StockItem) => s.color === soldItem.color && s.size === soldItem.size);
                if (stockItem) {
                    stockItem.quantity += soldItem.quantity;
                } else {
                    tempStock.push(soldItem);
                }
            });
            return tempStock;
        }
        return state.inventory.find(i => i.trackingNumber === formState.trackingNumber && i.godownId === formState.godownId)?.stock;
    }, [formState.trackingNumber, formState.godownId, state.inventory, salesOrder]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!availableStock) return;

        const items: SalesOrderItem[] = [];
        let totalAmount = 0;
        let hasError = false;

        Object.entries(itemQuantities).forEach(([key, values]) => {
            const qty = parseInt(values.qty || '0');
            const rate = parseFloat(values.rate || '0');
            if (qty > 0) {
                const [color, size] = key.split('_||_');
                const stockItem = availableStock.find(s => s.color === color && s.size === size);
                if (!stockItem || qty > stockItem.quantity) hasError = true;
                const amount = qty * rate;
                items.push({ color, size, quantity: qty, rate, amount });
                totalAmount += amount;
            }
        });
        
        if (hasError) { alert("Sale quantity cannot exceed available stock."); return; }
        if (items.length === 0) { alert("Please enter quantity for at least one item."); return; }
        
        if (salesOrder) {
             const updatedSO: SalesOrder = {
                ...salesOrder,
                ...formState,
                items,
                totalAmount,
            };
            dispatch({ type: 'UPDATE_SALES_ORDER', payload: updatedSO });
            showNotification("Sales order updated!");
        } else {
            const newSO: SalesOrder = {
                id: `so-${Date.now()}`,
                salesOrderNumber: `SO-${Date.now()}`,
                ...formState,
                items,
                totalAmount,
            };
            dispatch({ type: 'ADD_SALES_ORDER', payload: newSO });
            showNotification("Sale recorded and stock updated!");
        }
        closeModal();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
                 <h3 className="text-xl font-bold">{salesOrder ? 'Edit' : 'New'} Sales Order</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <select value={formState.customerId} onChange={e => setFormState(p => ({...p, customerId: e.target.value}))} required className="w-full p-2 border rounded-md"><option value="">Select Customer</option>{state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    <input type="date" value={formState.orderDate} onChange={e => setFormState(p => ({...p, orderDate: e.target.value}))} required className="w-full p-2 border rounded-md" />
                    <select value={formState.trackingNumber} onChange={e => setFormState(p => ({...p, trackingNumber: e.target.value}))} required className="w-full p-2 border rounded-md" disabled={!!salesOrder}><option value="">Select Tracking #</option>{trackingNumbersWithStock.map(tn => <option key={tn} value={tn}>{tn}</option>)}</select>
                    <select value={formState.godownId} onChange={e => setFormState(p => ({...p, godownId: e.target.value}))} required className="w-full p-2 border rounded-md" disabled={!formState.trackingNumber || !!salesOrder}><option value="">Select Godown</option>{godownsWithStock.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
                </div>
                 {availableStock && (
                    <div className="border p-4 rounded-md space-y-2">
                        <h4 className="font-semibold">Enter Quantities & Rates to Sell</h4>
                        {availableStock.map(stock => {
                            const key = `${stock.color}_||_${stock.size}`;
                            return (
                                <div key={key} className="grid grid-cols-5 gap-2 items-center">
                                    <span className="text-sm col-span-2">{stock.color} / {stock.size} ({stock.quantity} avail.)</span>
                                    <input type="number" max={stock.quantity} min="0" placeholder="Qty" value={itemQuantities[key]?.qty || ''} onChange={e => setItemQuantities(p => ({...p, [key]: {...p[key], qty: e.target.value}}))} className="w-full p-1 border rounded-md" />
                                    <input type="number" step="0.01" min="0" placeholder="Rate" value={itemQuantities[key]?.rate || ''} onChange={e => setItemQuantities(p => ({...p, [key]: {...p[key], rate: e.target.value}}))} className="w-full p-1 border rounded-md" />
                                     <span>₹{(parseInt(itemQuantities[key]?.qty || '0') * parseFloat(itemQuantities[key]?.rate || '0')).toFixed(2)}</span>
                                </div>
                            )
                        })}
                    </div>
                 )}
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={closeModal} className="bg-slate-200 px-4 py-2 rounded-md">Cancel</button>
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-md">{salesOrder ? 'Update SO' : 'Create SO & Dispatch Stock'}</button>
                </div>
            </form>
        </div>
    )
};

// #endregion


export default AccountingManagement;