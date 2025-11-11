
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  TERMINATED = 'TERMINATED',
}

export enum SalaryType {
  DAILY = 'DAILY WAGES',
  MONTHLY = 'MONTHLY',
  PIECE_RATE = 'PCS RATE',
}

export interface UserDetails {
  name: string;
  image: string; // URL or base64
  jobProfile: string;
  salaryType: SalaryType;
  salaryAmount: number;
  wipScope: OperationType[];
}

export interface User {
  id: string;
  username: string;
  password?: string; // Should not be stored in client-side state in a real app
  role: Role;
  approvalStatus: ApprovalStatus;
  status: UserStatus;
  details: UserDetails;
}

export interface Attendance {
    id: string;
    userId: string;
    date: string;
    checkInTime: string;
    status: ApprovalStatus;
}

export interface Godown {
    id: string;
    name: string;
}

export interface ItemSize {
    name: string;
}

export interface ItemColor {
    name: string;
    sizes: ItemSize[];
}

export interface Item {
    id: string;
    name: string;
    colors: ItemColor[];
}

export interface StockItem {
    color: string;
    size: string;
    quantity: number;
}

export interface Inventory {
    trackingNumber: string;
    partyChallanNumber: string;
    challanDate: string;

    itemId: string;
    godownId: string;
    stock: StockItem[];
}

export interface InternalTransfer {
    internalChallanNumber: string;
    date: string;
    trackingNumber: string;
    fromGodownId: string;
    toGodownId: string;
    items: StockItem[];
}

export interface GoodsOutward {
    outwardChallanNumber: string;
    partyName: string;
    date: string;
    trackingNumber: string;
    godownId: string;
    items: StockItem[];
}

export enum OperationType {
    CUTTING = 'CUTTING',
    SEWING = 'SEWING',
    FINISHING = 'FINISHING',
}

export interface SewingOperation {
    id: string;
    trackingNumber: string;
    operationName: string;
    machineType: string;
    rate: number;
    type: OperationType;
}

export interface WorkEntry {
    id: string;
    userId: string;
    date: string;
    trackingNumber: string;
    type: OperationType; // CUTTING, SEWING, or FINISHING

    // Cutting-specific
    layerLength?: number;
    numLayers?: number;
    fabricColor?: string;
    layerWeight?: number;
    fabricUsedKg?: number;
    drawingPcs?: number;
    outputItemId?: string;
    outputStock?: StockItem[];

    // Sewing/Finishing-specific
    operationId?: string;
    quantity?: number; // Total quantity, will be derived from processedStock
    processedStock?: StockItem[]; // The specific items worked on
}

// --- Accounting Types ---

export interface Vendor {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
}

export interface Customer {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
}

export enum PurchaseStatus {
    PENDING = 'PENDING',
    RECEIVED = 'RECEIVED',
    CANCELLED = 'CANCELLED',
}

export enum SalesStatus {
    PENDING = 'PENDING',
    DISPATCHED = 'DISPATCHED',
    CANCELLED = 'CANCELLED',
}

export interface PurchaseOrderItem {
    color: string;
    size: string;
    quantity: number;
    rate: number;
    amount: number;
}

export interface PurchaseOrder {
    id: string;
    purchaseOrderNumber: string;
    vendorId: string;
    orderDate: string;
    trackingNumber: string;
    partyChallanNumber: string;
    itemId: string;
    godownId: string;
    items: PurchaseOrderItem[];
    totalAmount: number;
    status: PurchaseStatus;
}

export interface SalesOrderItem {
    color: string;
    size: string;
    quantity: number;
    rate: number;
    amount: number;
}

export interface SalesOrder {
    id: string;
    salesOrderNumber: string;
    customerId: string;
    orderDate: string;
    trackingNumber: string;
    godownId: string;
    items: SalesOrderItem[];
    totalAmount: number;
    status: SalesStatus;
}
