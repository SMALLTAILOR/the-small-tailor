
import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { User, Attendance, Godown, Item, Inventory, InternalTransfer, WorkEntry, SewingOperation, ApprovalStatus, UserStatus, Role, SalaryType, StockItem, OperationType, GoodsOutward } from '../types';
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
  | { type: 'ADD_INTERNAL_TRANSFER'; payload: InternalTransfer }
  | { type: 'ADD_GOODS_OUTWARD'; payload: GoodsOutward }
  | { type: 'ADD_WORK_ENTRY'; payload: WorkEntry }
  | { type: 'ADD_SEWING_OPERATION'; payload: SewingOperation }
  | { type: 'UPDATE_SEWING_OPERATION'; payload: SewingOperation }
  | { type: 'DELETE_SEWING_OPERATION'; payload: string };

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
    case 'ADD_WORK_ENTRY':
        return { ...state, workEntries: [...state.workEntries, action.payload] };
    case 'ADD_SEWING_OPERATION':
      return { ...state, sewingOperations: [...state.sewingOperations, action.payload] };
    case 'UPDATE_SEWING_OPERATION':
       return { ...state, sewingOperations: state.sewingOperations.map(op => op.id === action.payload.id ? action.payload : op) };
    case 'DELETE_SEWING_OPERATION':
      return { ...state, sewingOperations: state.sewingOperations.filter(op => op.id !== action.payload) };
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
    };
};

// FIX: Export DataContext to allow its usage in `hooks/useDataContext.ts`.
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
