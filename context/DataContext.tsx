import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { User, Attendance, Godown, Item, Inventory, InternalTransfer, WorkEntry, SewingOperation, ApprovalStatus, UserStatus, Role, SalaryType, StockItem, OperationType, GoodsOutward, Vendor, Customer, PurchaseOrder, SalesOrder, PurchaseStatus, SalesStatus } from '../types';
import { storageService } from '../services/storageService';

interface AppState {
  users: User[];
  attendance: Attendance[];
  godowns: Godown[];
  items: Item[];
  inventory: Inventory[];
  internalTransfers: InternalTransfer[];
  goodsOutward: GoodsOutward[];
  workEntries: WorkEntry[];
  sewingOperations: SewingOperation[];
  vendors: Vendor[];
  customers: Customer[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
}

type Action =
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_ATTENDANCE'; payload: Attendance }
  | { type: 'UPDATE_ATTENDANCE_STATUS'; payload: { id: string; status: ApprovalStatus } }
  | { type: 'ADD_GODOWN'; payload: Godown }
  | { type: 'DELETE_GODOWN'; payload: string }
  | { type: 'ADD_ITEM'; payload: Item }
  | { type: 'UPDATE_ITEM'; payload: Item }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'ADD_INVENTORY'; payload: Inventory }
  | { type: 'UPDATE_STOCK_ITEM'; payload: { trackingNumber: string; godownId: string; color: string; size: string; newQuantity: number; } }
  | { type: 'DELETE_STOCK_ITEM'; payload: { trackingNumber: string; godownId: string; color: string; size: string; } }
  | { type: 'ADD_INTERNAL_TRANSFER'; payload: InternalTransfer }
  | { type: 'ADD_GOODS_OUTWARD'; payload: GoodsOutward }
  | { type: 'ADD_WORK_ENTRY'; payload: WorkEntry }
  | { type: 'ADD_SEWING_OPERATION'; payload: SewingOperation }
  | { type: 'UPDATE_SEWING_OPERATION'; payload: SewingOperation }
  | { type: 'DELETE_SEWING_OPERATION'; payload: string }
  | { type: 'ADD_VENDOR'; payload: Vendor }
  | { type: 'UPDATE_VENDOR'; payload: Vendor }
  | { type: 'DELETE_VENDOR'; payload: string }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'ADD_PURCHASE_ORDER'; payload: PurchaseOrder }
  | { type: 'UPDATE_PURCHASE_ORDER'; payload: PurchaseOrder }
  | { type: 'DELETE_PURCHASE_ORDER'; payload: string }
  | { type: 'ADD_SALES_ORDER'; payload: SalesOrder }
  | { type: 'UPDATE_SALES_ORDER'; payload: SalesOrder }
  | { type: 'DELETE_SALES_ORDER'; payload: string };

const initialState: AppState = {
  users: [],
  attendance: [],
  godowns: [],
  items: [],
  inventory: [],
  internalTransfers: [],
  goodsOutward: [],
  workEntries: [],
  sewingOperations: [],
  vendors: [],
  customers: [],
  purchaseOrders: [],
  salesOrders: [],
};

const dataReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) };
    case 'DELETE_USER':
      return { ...state, users: state.users.filter(u => u.id !== action.payload) };
    case 'ADD_ATTENDANCE':
        return { ...state, attendance: [...state.attendance, action.payload] };
    case 'UPDATE_ATTENDANCE_STATUS':
        return { ...state, attendance: state.attendance.map(a => a.id === action.payload.id ? {...a, status: action.payload.status} : a) };
    case 'ADD_GODOWN':
      if (state.godowns.some(g => g.name.toLowerCase() === action.payload.name.toLowerCase())) {
        return state;
      }
      return { ...state, godowns: [...state.godowns, action.payload] };
    case 'DELETE_GODOWN':
      return { ...state, godowns: state.godowns.filter(g => g.id !== action.payload) };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE_ITEM':
      return { ...state, items: state.items.map(i => i.id === action.payload.id ? action.payload : i) };
    case 'DELETE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'ADD_INVENTORY':
      return { ...state, inventory: [...state.inventory, action.payload] };
    case 'UPDATE_STOCK_ITEM': {
      const { trackingNumber, godownId, color, size, newQuantity } = action.payload;
      const newInventory = JSON.parse(JSON.stringify(state.inventory));
      const inv = newInventory.find((i: Inventory) => i.trackingNumber === trackingNumber && i.godownId === godownId);
      
      if (inv) {
        const stockItem = inv.stock.find((s: StockItem) => s.color === color && s.size === size);
        if (stockItem) {
          stockItem.quantity = newQuantity;
        }
        // Remove item if quantity is 0 or less
        inv.stock = inv.stock.filter((s: StockItem) => s.quantity > 0);
      }

      return {
        ...state,
        inventory: newInventory.filter((i: Inventory) => i.stock.length > 0),
      };
    }
    case 'DELETE_STOCK_ITEM': {
      const { trackingNumber, godownId, color, size } = action.payload;
      const newInventory = JSON.parse(JSON.stringify(state.inventory));
      const inv = newInventory.find((i: Inventory) => i.trackingNumber === trackingNumber && i.godownId === godownId);

      if (inv) {
        inv.stock = inv.stock.filter((s: StockItem) => !(s.color === color && s.size === size));
      }
      
      return {
        ...state,
        inventory: newInventory.filter((i: Inventory) => i.stock.length > 0),
      };
    }
    case 'ADD_INTERNAL_TRANSFER': {
      const transfer = action.payload;
      const { trackingNumber, fromGodownId, toGodownId, items: transferredItems } = transfer;

      // Use a deep copy to avoid state mutation issues
      const newInventory = JSON.parse(JSON.stringify(state.inventory));

      // Subtract from 'from' godown
      const fromInv = newInventory.find((inv: Inventory) => inv.trackingNumber === trackingNumber && inv.godownId === fromGodownId);
      if (fromInv) {
        transferredItems.forEach(transferItem => {
          const stockItem = fromInv.stock.find((s: StockItem) => s.color === transferItem.color && s.size === transferItem.size);
          if (stockItem) {
            stockItem.quantity -= transferItem.quantity;
          }
        });
        fromInv.stock = fromInv.stock.filter((s: StockItem) => s.quantity > 0);
      }

      // Add to 'to' godown
      let toInv = newInventory.find((inv: Inventory) => inv.trackingNumber === trackingNumber && inv.godownId === toGodownId);
      if (toInv) {
        // Entry exists, update stock
        transferredItems.forEach(transferItem => {
          const stockItem = toInv.stock.find((s: StockItem) => s.color === transferItem.color && s.size === transferItem.size);
          if (stockItem) {
            stockItem.quantity += transferItem.quantity;
          } else {
            toInv.stock.push(transferItem);
          }
        });
      } else {
        // No entry, create a new one
        const originalInv = state.inventory.find(i => i.trackingNumber === trackingNumber);
        if (originalInv) {
          newInventory.push({
            trackingNumber: trackingNumber,
            partyChallanNumber: originalInv.partyChallanNumber,
            challanDate: originalInv.challanDate,
            itemId: originalInv.itemId,
            godownId: toGodownId,
            stock: transferredItems,
          });
        }
      }

      return {
        ...state,
        inventory: newInventory.filter((inv: Inventory) => inv.stock.length > 0),
        internalTransfers: [...state.internalTransfers, action.payload]
      };
    }
    case 'ADD_GOODS_OUTWARD': {
      const outward = action.payload;
      const { trackingNumber, godownId, items: removedItems } = outward;

      const newInventory = JSON.parse(JSON.stringify(state.inventory));

      const inv = newInventory.find((i: Inventory) => i.trackingNumber === trackingNumber && i.godownId === godownId);

      if (inv) {
          removedItems.forEach(removedItem => {
              const stockItem = inv.stock.find((s: StockItem) => s.color === removedItem.color && s.size === removedItem.size);
              if (stockItem) {
                  stockItem.quantity -= removedItem.quantity;
              }
          });
          inv.stock = inv.stock.filter((s: StockItem) => s.quantity > 0);
      }
      
      return {
          ...state,
          inventory: newInventory.filter((i: Inventory) => i.stock.length > 0),
          goodsOutward: [...state.goodsOutward, action.payload],
      };
    }
    case 'ADD_WORK_ENTRY': {
        const entry = action.payload;
        const newInventory = JSON.parse(JSON.stringify(state.inventory));

        if (entry.type === OperationType.CUTTING) {
            // 1. Consume Fabric
            const sourceGodowns = state.godowns.filter(g => ['main godown', 'fabric godown'].includes(g.name.toLowerCase()));
            const sourceGodownIds = sourceGodowns.map(g => g.id);
            const sourceInv = newInventory.find((inv: Inventory) => inv.trackingNumber === entry.trackingNumber && sourceGodownIds.includes(inv.godownId));

            if (sourceInv && entry.fabricColor && entry.fabricUsedKg) {
                const fabricStock = sourceInv.stock.find((s: StockItem) => s.color === entry.fabricColor);
                if (fabricStock) {
                    fabricStock.quantity -= entry.fabricUsedKg;
                }
                 sourceInv.stock = sourceInv.stock.filter((s: StockItem) => s.quantity > 0);
            }

            // 2. Produce Cut Pieces
            const cuttingWipGodown = state.godowns.find(g => g.name.toLowerCase() === 'cutting wip');
            if (cuttingWipGodown && entry.outputItemId && entry.outputStock) {
                let destInv = newInventory.find((inv: Inventory) => inv.trackingNumber === entry.trackingNumber && inv.godownId === cuttingWipGodown.id);
                if (destInv) { // If TN already exists in Cutting WIP, merge stock
                    entry.outputStock.forEach(newStockItem => {
                        const existingStock = destInv.stock.find((s: StockItem) => s.color === newStockItem.color && s.size === newStockItem.size);
                        if (existingStock) {
                            existingStock.quantity += newStockItem.quantity;
                        } else {
                            destInv.stock.push(newStockItem);
                        }
                    });
                } else { // Create new inventory entry for cut pieces in Cutting WIP
                    const originalInv = state.inventory.find(i => i.trackingNumber === entry.trackingNumber);
                     if (originalInv) {
                        newInventory.push({
                            trackingNumber: entry.trackingNumber,
                            partyChallanNumber: originalInv.partyChallanNumber,
                            challanDate: originalInv.challanDate,
                            itemId: entry.outputItemId,
                            godownId: cuttingWipGodown.id,
                            stock: entry.outputStock,
                        });
                    }
                }
            }

            return {
                ...state,
                inventory: newInventory.filter((inv: Inventory) => inv.stock.length > 0),
                workEntries: [...state.workEntries, action.payload]
            };

        } else if (entry.type === OperationType.SEWING || entry.type === OperationType.FINISHING) {
            const { trackingNumber, processedStock } = entry;
            if (!processedStock || processedStock.length === 0) {
                return { ...state, workEntries: [...state.workEntries, entry] };
            }

            let sourceGodownNames: string[] = [];
            let destGodownName: string = '';
            if (entry.type === OperationType.SEWING) {
                sourceGodownNames = ['cutting wip', 'sewing wip'];
                destGodownName = 'sewing wip';
            } else { // FINISHING
                sourceGodownNames = ['sewing wip', 'finishing wip'];
                destGodownName = 'finishing wip';
            }
            
            const orderedSourceGodownIds = sourceGodownNames
                .map(name => state.godowns.find(g => g.name.toLowerCase() === name)?.id)
                .filter((id): id is string => !!id);

            const destGodown = state.godowns.find(g => g.name.toLowerCase() === destGodownName);

            if (!destGodown || orderedSourceGodownIds.length === 0) return state;

            // 1. Decrease stock from source godowns
            processedStock.forEach(itemToProcess => {
                let remainingQtyToProcess = itemToProcess.quantity;
                for (const godownId of orderedSourceGodownIds) {
                    if (remainingQtyToProcess <= 0) break;
                    const sourceInv = newInventory.find((inv: Inventory) => inv.trackingNumber === trackingNumber && inv.godownId === godownId);
                    if (sourceInv) {
                        const stockItem = sourceInv.stock.find((s: StockItem) => s.color === itemToProcess.color && s.size === itemToProcess.size);
                        if (stockItem && stockItem.quantity > 0) {
                            const removableQty = Math.min(remainingQtyToProcess, stockItem.quantity);
                            stockItem.quantity -= removableQty;
                            remainingQtyToProcess -= removableQty;
                        }
                    }
                }
            });
            
            newInventory.forEach((inv: Inventory) => {
                if (orderedSourceGodownIds.includes(inv.godownId)) {
                    inv.stock = inv.stock.filter((s: StockItem) => s.quantity > 0);
                }
            });

            // 2. Increase stock in destination godown
            let destInv = newInventory.find((inv: Inventory) => inv.trackingNumber === trackingNumber && inv.godownId === destGodown.id);
            if (!destInv) {
                const originalInv = state.inventory.find(i => i.trackingNumber === trackingNumber);
                if (originalInv) {
                    const sourceInvEntry = state.inventory.find(i => i.trackingNumber === trackingNumber && orderedSourceGodownIds.includes(i.godownId));
                    destInv = {
                        trackingNumber,
                        partyChallanNumber: originalInv.partyChallanNumber,
                        challanDate: originalInv.challanDate,
                        itemId: sourceInvEntry ? sourceInvEntry.itemId : originalInv.itemId,
                        godownId: destGodown.id,
                        stock: [],
                    };
                    newInventory.push(destInv);
                }
            }

            if(destInv) {
                processedStock.forEach(itemToAdd => {
                    const stockItem = destInv.stock.find((s: StockItem) => s.color === itemToAdd.color && s.size === itemToAdd.size);
                    if (stockItem) {
                        stockItem.quantity += itemToAdd.quantity;
                    } else {
                        destInv.stock.push({ ...itemToAdd });
                    }
                });
            }
            
            return {
                ...state,
                inventory: newInventory.filter((inv: Inventory) => inv.stock.length > 0),
                workEntries: [...state.workEntries, action.payload]
            };
        }
        
        // Default behavior for other types
        return { ...state, workEntries: [...state.workEntries, action.payload] };
    }
    case 'ADD_SEWING_OPERATION':
      return { ...state, sewingOperations: [...state.sewingOperations, action.payload] };
    case 'UPDATE_SEWING_OPERATION':
       return { ...state, sewingOperations: state.sewingOperations.map(op => op.id === action.payload.id ? action.payload : op) };
    case 'DELETE_SEWING_OPERATION':
      return { ...state, sewingOperations: state.sewingOperations.filter(op => op.id !== action.payload) };
    
    // --- Accounting Actions ---
    case 'ADD_VENDOR':
      return { ...state, vendors: [...state.vendors, action.payload] };
    case 'UPDATE_VENDOR':
      return { ...state, vendors: state.vendors.map(v => v.id === action.payload.id ? action.payload : v) };
    case 'DELETE_VENDOR':
      return { ...state, vendors: state.vendors.filter(v => v.id !== action.payload) };
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CUSTOMER':
      return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };
    case 'ADD_PURCHASE_ORDER': {
      const po = action.payload;
      let newInventory = [...state.inventory];
      if (po.status === PurchaseStatus.RECEIVED) {
          const newStock: Inventory = {
              trackingNumber: po.trackingNumber,
              partyChallanNumber: po.partyChallanNumber,
              challanDate: po.orderDate,
              itemId: po.itemId,
              godownId: po.godownId,
              stock: po.items.map(({ color, size, quantity }) => ({ color, size, quantity })),
          };
          newInventory = [...newInventory, newStock];
      }
      return { ...state, purchaseOrders: [...state.purchaseOrders, po], inventory: newInventory };
    }
    case 'UPDATE_PURCHASE_ORDER': {
        const updatedPO = action.payload;
        const originalPO = state.purchaseOrders.find(po => po.id === updatedPO.id);
        if (!originalPO) return state;

        let newInventory = JSON.parse(JSON.stringify(state.inventory));

        // 1. Revert original inventory change if it was received
        if (originalPO.status === PurchaseStatus.RECEIVED) {
            const inv = newInventory.find((i: Inventory) => i.trackingNumber === originalPO.trackingNumber);
            if (inv) {
                 originalPO.items.forEach((item: StockItem) => {
                    const stockItem = inv.stock.find((s: StockItem) => s.color === item.color && s.size === item.size);
                    if (stockItem) stockItem.quantity -= item.quantity;
                });
                inv.stock = inv.stock.filter((s: StockItem) => s.quantity > 0);
            }
        }
        
        // 2. Apply new inventory change if it is received
        if (updatedPO.status === PurchaseStatus.RECEIVED) {
            const inv = newInventory.find((i: Inventory) => i.trackingNumber === updatedPO.trackingNumber);
            if (inv) {
                 updatedPO.items.forEach((item: StockItem) => {
                    const stockItem = inv.stock.find((s: StockItem) => s.color === item.color && s.size === item.size);
                    if (stockItem) stockItem.quantity += item.quantity;
                    else inv.stock.push(item);
                });
            } else { // If inventory for this TN didn't exist before, create it
                 newInventory.push({
                    trackingNumber: updatedPO.trackingNumber,
                    partyChallanNumber: updatedPO.partyChallanNumber,
                    challanDate: updatedPO.orderDate,
                    itemId: updatedPO.itemId,
                    godownId: updatedPO.godownId,
                    stock: updatedPO.items.map(({ color, size, quantity }) => ({ color, size, quantity })),
                });
            }
        }

        return {
            ...state,
            purchaseOrders: state.purchaseOrders.map(po => po.id === updatedPO.id ? updatedPO : po),
            inventory: newInventory.filter((i: Inventory) => i.stock.length > 0)
        };
    }
    case 'DELETE_PURCHASE_ORDER': {
        const poId = action.payload;
        const poToDelete = state.purchaseOrders.find(po => po.id === poId);
        if (!poToDelete) return state;

        let newInventory = JSON.parse(JSON.stringify(state.inventory));

        if (poToDelete.status === PurchaseStatus.RECEIVED) {
            const inv = newInventory.find((i: Inventory) => i.trackingNumber === poToDelete.trackingNumber);
            if (inv) {
                poToDelete.items.forEach((item: StockItem) => {
                    const stockItem = inv.stock.find((s: StockItem) => s.color === item.color && s.size === item.size);
                    if (stockItem) stockItem.quantity -= item.quantity;
                });
                inv.stock = inv.stock.filter((s: StockItem) => s.quantity > 0);
            }
        }
        
        return {
            ...state,
            purchaseOrders: state.purchaseOrders.filter(po => po.id !== poId),
            inventory: newInventory.filter((i: Inventory) => i.stock.length > 0)
        };
    }
    case 'ADD_SALES_ORDER': {
      const so = action.payload;
      let newInventory = JSON.parse(JSON.stringify(state.inventory));
      if (so.status === SalesStatus.DISPATCHED) {
          const inv = newInventory.find((i: Inventory) => i.trackingNumber === so.trackingNumber && i.godownId === so.godownId);
          if (inv) {
              so.items.forEach(removedItem => {
                  const stockItem = inv.stock.find((s: StockItem) => s.color === removedItem.color && s.size === removedItem.size);
                  if (stockItem) {
                      stockItem.quantity -= removedItem.quantity;
                  }
              });
              inv.stock = inv.stock.filter((s: StockItem) => s.quantity > 0);
          }
      }
       return { 
           ...state, 
           salesOrders: [...state.salesOrders, so],
           inventory: newInventory.filter((i: Inventory) => i.stock.length > 0),
       };
    }
    case 'UPDATE_SALES_ORDER': {
        const updatedSO = action.payload;
        const originalSO = state.salesOrders.find(so => so.id === updatedSO.id);
        if (!originalSO) return state;

        let newInventory = JSON.parse(JSON.stringify(state.inventory));

        // 1. Revert original stock change
        if (originalSO.status === SalesStatus.DISPATCHED) {
            let inv = newInventory.find((i: Inventory) => i.trackingNumber === originalSO.trackingNumber && i.godownId === originalSO.godownId);
            if (inv) {
                 originalSO.items.forEach((item: StockItem) => {
                    const stockItem = inv.stock.find((s: StockItem) => s.color === item.color && s.size === item.size);
                    if (stockItem) stockItem.quantity += item.quantity;
                    else inv.stock.push(item);
                });
            } else {
                 const originalInvData = state.inventory.find(i => i.trackingNumber === originalSO.trackingNumber);
                 if(originalInvData) {
                    newInventory.push({
                        trackingNumber: originalSO.trackingNumber,
                        partyChallanNumber: originalInvData.partyChallanNumber,
                        challanDate: originalInvData.challanDate,
                        itemId: originalInvData.itemId,
                        godownId: originalSO.godownId,
                        stock: originalSO.items,
                    });
                 }
            }
        }

        // 2. Apply new stock change
        if (updatedSO.status === SalesStatus.DISPATCHED) {
            const inv = newInventory.find((i: Inventory) => i.trackingNumber === updatedSO.trackingNumber && i.godownId === updatedSO.godownId);
            if (inv) {
                updatedSO.items.forEach((item: StockItem) => {
                    const stockItem = inv.stock.find((s: StockItem) => s.color === item.color && s.size === item.size);
                    if (stockItem) stockItem.quantity -= item.quantity;
                });
                inv.stock = inv.stock.filter((s: StockItem) => s.quantity > 0);
            }
        }
        
        return {
            ...state,
            salesOrders: state.salesOrders.map(so => so.id === updatedSO.id ? updatedSO : so),
            inventory: newInventory.filter((i: Inventory) => i.stock.length > 0)
        };
    }
    case 'DELETE_SALES_ORDER': {
        const soId = action.payload;
        const soToDelete = state.salesOrders.find(so => so.id === soId);
        if (!soToDelete) return state;

        let newInventory = JSON.parse(JSON.stringify(state.inventory));

        if (soToDelete.status === SalesStatus.DISPATCHED) {
             let inv = newInventory.find((i: Inventory) => i.trackingNumber === soToDelete.trackingNumber && i.godownId === soToDelete.godownId);
            if (inv) {
                 soToDelete.items.forEach((item: StockItem) => {
                    const stockItem = inv.stock.find((s: StockItem) => s.color === item.color && s.size === item.size);
                    if (stockItem) stockItem.quantity += item.quantity;
                    else inv.stock.push(item);
                });
            } else {
                 const originalInvData = state.inventory.find(i => i.trackingNumber === soToDelete.trackingNumber);
                 if(originalInvData) {
                    newInventory.push({
                        trackingNumber: soToDelete.trackingNumber,
                        partyChallanNumber: originalInvData.partyChallanNumber,
                        challanDate: originalInvData.challanDate,
                        itemId: originalInvData.itemId,
                        godownId: soToDelete.godownId,
                        stock: soToDelete.items,
                    });
                 }
            }
        }
        
        return {
            ...state,
            salesOrders: state.salesOrders.filter(so => so.id !== soId),
            inventory: newInventory.filter((i: Inventory) => i.stock.length > 0)
        };
    }

    default:
      return state;
  }
};

const getInitialState = (): AppState => {
    const storedState = storageService.getItem<AppState | null>('appData', null);
    if (storedState) return storedState;

    // Default seed data
    const adminUser: User = {
        id: 'admin-user',
        username: 'admin',
        password: 'pass',
        role: Role.ADMIN,
        approvalStatus: ApprovalStatus.APPROVED,
        status: UserStatus.ACTIVE,
        details: {
            name: 'Admin User',
            image: `https://picsum.photos/seed/admin/100`,
            jobProfile: 'Administrator',
            salaryType: SalaryType.MONTHLY,
            salaryAmount: 50000,
            wipScope: [OperationType.CUTTING, OperationType.SEWING, OperationType.FINISHING]
        }
    };
    
    const employeeUser: User = {
        id: 'employee-user',
        username: 'employee',
        password: 'pass',
        role: Role.EMPLOYEE,
        approvalStatus: ApprovalStatus.APPROVED,
        status: UserStatus.ACTIVE,
        details: {
            name: 'Employee User',
            image: `https://picsum.photos/seed/employee/100`,
            jobProfile: 'Tailor',
            salaryType: SalaryType.PIECE_RATE,
            salaryAmount: 0,
            wipScope: [OperationType.CUTTING, OperationType.SEWING, OperationType.FINISHING]
        }
    };

    return {
        users: [adminUser, employeeUser],
        attendance: [],
        godowns: [
            {id: 'g1', name: 'Main Godown'},
            {id: 'g5', name: 'Fabric Godown'},
            {id: 'g2', name: 'Cutting WIP'},
            {id: 'g3', name: 'Sewing WIP'},
            {id: 'g4', name: 'Finishing WIP'}
        ],
        items: [],
        inventory: [],
        internalTransfers: [],
        goodsOutward: [],
        workEntries: [],
        sewingOperations: [],
        vendors: [{id: 'v1', name: 'ABC Textiles', contactPerson: 'Mr. Sharma', phone: '9876543210', address: '123 Textile Market, Delhi'}],
        customers: [{id: 'c1', name: 'Fashion Retail Inc.', contactPerson: 'Ms. Priya', phone: '8765432109', address: '456 Fashion Ave, Mumbai'}],
        purchaseOrders: [],
        salesOrders: [],
    };
};

export const DataContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, getInitialState());
  
  useEffect(() => {
    storageService.setItem('appData', state);
  }, [state]);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = React.useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
