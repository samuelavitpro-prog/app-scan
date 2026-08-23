export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  description: string;
  totalQuantity: number;
  availableQuantity: number;
  rentedQuantity: number;
  minStockAlert: number;
  unitPrice: number;
  rentalRatePerDay: number;
  location: string;
  condition: 'Neuf' | 'Très bon état' | 'Bon état' | 'Usé' | 'À réviser';
  imageUrl: string;
  barcode: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  aiConfidence?: number;
  aiAnalysisNotes?: string;
}

export interface RentalMovement {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  itemImage?: string;
  type: 'out' | 'in';
  quantity: number;
  clientName: string;
  clientContact?: string;
  destination?: string;
  departureDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'active' | 'returned' | 'overdue' | 'damaged';
  returnCondition?: string;
  returnNotes?: string;
  scannedBy: string;
  scannedReturnBy?: string;
  dailyRate?: number;
  depositAmount?: number;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  title: string;
  details: string;
  device: 'mobile' | 'desktop';
  user: string;
}

export interface WarehouseStats {
  totalProducts: number;
  totalStockItems: number;
  totalAvailable: number;
  totalRented: number;
  totalInventoryValue: number;
  lowStockCount: number;
  activeRentalsCount: number;
  overdueCount: number;
  occupancyRate: number;
}

export interface AIAnalysisResult {
  name: string;
  brand: string;
  model: string;
  category: string;
  sku: string;
  description: string;
  suggestedQuantity: number;
  condition: 'Neuf' | 'Très bon état' | 'Bon état' | 'Usé' | 'À réviser';
  unitPrice: number;
  rentalRatePerDay: number;
  suggestedLocation: string;
  detectedTextOrBarcode?: string;
  tags: string[];
  confidence: number;
  aiNotes?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'Administrateur' | 'Responsable Logistique' | 'Opérateur Scan' | 'Comptoir & Location';
  avatar?: string;
  status: 'active' | 'inactive';
  lastActive: string;
  assignedWarehouse: string;
  permissions: {
    canScanIn: boolean;
    canScanOut: boolean;
    canEditInventory: boolean;
    canManageRoles: boolean;
    canManageCloud: boolean;
  };
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'smartphone' | 'tablet' | 'desktop' | 'handheld_scanner';
  operatorName: string;
  ipAddress: string;
  lastSeen: string;
  status: 'online' | 'offline';
  appVersion: string;
  location: string;
}

export interface CloudAISettings {
  aiProvider: 'gemini' | 'openai' | 'custom';
  modelName: string;
  visionQuality: 'fast' | 'high' | 'ultra';
  autoFillConfidenceThreshold: number;
  cloudSyncFrequency: 'instant' | 'hourly' | 'daily';
  cloudStorageProvider: 'google_drive' | 'firestore' | 'local_cloud';
  autoBackupEnabled: boolean;
  apiKeyConfigured: boolean;
  aiPromptContext: string;
}

export interface AppSettings {
  companyName: string;
  warehouseName: string;
  currency: string;
  cloudAI: CloudAISettings;
  defaultDailyRentalRatio: number;
  autoOverdueAlerts: boolean;
}

export type AppMode = 'desktop' | 'mobile-scanner';
export type MobileScanTab = 'ai-capture' | 'rental-out' | 'rental-in' | 'quick-lookup';

export type OfflineActionType =
  | 'ADD_ITEM'
  | 'UPDATE_ITEM'
  | 'DELETE_ITEM'
  | 'BATCH_DELETE'
  | 'RENTAL_CHECKOUT'
  | 'RENTAL_CHECKIN'
  | 'UPDATE_SETTINGS'
  | 'ADD_EMPLOYEE'
  | 'UPDATE_EMPLOYEE'
  | 'DELETE_EMPLOYEE';

export interface QueuedOfflineAction {
  id: string;
  type: OfflineActionType;
  description: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  retryCount?: number;
}

export interface ConnectivityState {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  lastChecked: string;
  pendingCount: number;
}

