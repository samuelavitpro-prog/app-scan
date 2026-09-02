import React, { useState, useRef } from "react";
import {
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Sparkles,
  QrCode,
  Euro,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  Upload,
  Cloud,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  Tag,
  Eye,
  FileSpreadsheet,
  Check,
  Smartphone,
  Calendar,
  User,
  Settings,
  Shield,
  Users,
  CheckSquare,
  Square,
  RotateCcw,
  AlertCircle,
  FileText,
  ChevronDown,
  Wifi,
  WifiOff,
  Building2,
  ScanLine,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  SlidersHorizontal,
  Zap,
  ChevronRight,
  Radio,
  Truck,
  ArrowRight,
} from "lucide-react";
import {
  InventoryItem,
  RentalMovement,
  ActivityLog,
  WarehouseStats,
  AppSettings,
  Employee,
  ConnectedDevice,
  QueuedOfflineAction,
  UserAccount,
  StudioSpace,
  TechnicianProfile,
  ClientQuote,
  MainAppNavTab,
} from "../types";
import { SettingsDashboard } from "./SettingsDashboard";
import { ConnectivityIndicator } from "./ConnectivityIndicator";
import { SyncQueueModal } from "./SyncQueueModal";
import { InvoiceScannerModal } from "./InvoiceScannerModal";
import { StudiosDashboard } from "./StudiosDashboard";
import { TechniciansDashboard } from "./TechniciansDashboard";
import { QuotesDashboard } from "./QuotesDashboard";
import { CommandPaletteModal } from "./CommandPaletteModal";
import { DirectoryDashboard } from "./DirectoryDashboard";
import { MainSidebar } from "./MainSidebar";
import { RentalsDossiersDashboard } from "./RentalsDossiersDashboard";
import { InvoicesDashboard } from "./InvoicesDashboard";
import { CalendarPlanningDashboard } from "./CalendarPlanningDashboard";
import { FlightCasesDashboard } from "./FlightCasesDashboard";
import { MaintenanceSAVDashboard } from "./MaintenanceSAVDashboard";
import { NetworkDisplaysDashboard } from "./NetworkDisplaysDashboard";
import { PlanGateGuard } from "./PlanGateGuard";
import { PlanUpgradeModal } from "./PlanUpgradeModal";
import { canAccessModule } from "../utils/subscriptionPlans";
import { DepotWarehouse, SubscriptionTier, ClientRecord, SupplierRecord, VenueRecord } from "../types";
import { getWorkspaceProfile, WorkspaceProfileId } from "../config/workspaceProfiles";

interface DesktopDashboardProps {
  items: InventoryItem[];
  rentals: RentalMovement[];
  logs: ActivityLog[];
  stats: WarehouseStats;
  settings: AppSettings;
  employees: Employee[];
  devices: ConnectedDevice[];
  currentUser?: UserAccount | null;
  depots?: DepotWarehouse[];
  activeDepotId?: string;
  onChangeActiveDepot?: (depotId: string) => void;
  onLogout?: () => void;
  studios?: StudioSpace[];
  technicians?: TechnicianProfile[];
  quotes?: ClientQuote[];
  clients?: ClientRecord[];
  suppliers?: SupplierRecord[];
  venues?: VenueRecord[];
  onAddClient?: (client: Partial<ClientRecord>) => Promise<boolean>;
  onUpdateClient?: (id: string, updates: Partial<ClientRecord>) => Promise<boolean>;
  onDeleteClient?: (id: string) => Promise<boolean>;
  onAddSupplier?: (supplier: Partial<SupplierRecord>) => Promise<boolean>;
  onUpdateSupplier?: (id: string, updates: Partial<SupplierRecord>) => Promise<boolean>;
  onDeleteSupplier?: (id: string) => Promise<boolean>;
  onAddVenue?: (venue: Partial<VenueRecord>) => Promise<boolean>;
  onUpdateVenue?: (id: string, updates: Partial<VenueRecord>) => Promise<boolean>;
  onDeleteVenue?: (id: string) => Promise<boolean>;
  onDeleteItem: (id: string) => Promise<boolean>;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>;
  onManualAddItem: (item: Partial<InventoryItem>) => Promise<boolean>;
  onRentalCheckout?: (checkoutData: any) => Promise<boolean>;
  onRentalCheckin: (checkinData: any) => Promise<boolean>;
  onTriggerDriveSync: () => Promise<boolean>;
  onOpenMobileView: () => void;
  onOpenItemDetail: (item: InventoryItem) => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  onAddEmployee: (employee: Partial<Employee>) => Promise<boolean>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<boolean>;
  onDeleteEmployee: (id: string) => Promise<boolean>;
  onRevokeDevice: (id: string) => Promise<boolean>;
  onRegisterDevice: (device: Partial<ConnectedDevice>) => Promise<boolean>;
  onAddDepot?: (depot: Partial<DepotWarehouse>) => Promise<boolean>;
  onUpdateDepot?: (id: string, updates: Partial<DepotWarehouse>) => Promise<boolean>;
  onDeleteDepot?: (id: string) => Promise<boolean>;
  onAddStudio?: (studio: Partial<StudioSpace>) => Promise<boolean>;
  onUpdateStudio?: (id: string, updates: Partial<StudioSpace>) => Promise<boolean>;
  onDeleteStudio?: (id: string) => Promise<boolean>;
  onBookStudio?: (studioId: string, bookingData: any) => Promise<boolean>;
  onAddTechnician?: (tech: Partial<TechnicianProfile>) => Promise<boolean>;
  onUpdateTechnician?: (id: string, updates: Partial<TechnicianProfile>) => Promise<boolean>;
  onDeleteTechnician?: (id: string) => Promise<boolean>;
  onAddQuote?: (quote: Partial<ClientQuote>) => Promise<boolean>;
  onUpdateQuote?: (id: string, updates: Partial<ClientQuote>) => Promise<boolean>;
  onDeleteQuote?: (id: string) => Promise<boolean>;
  onImportInvoiceItems?: (items: any[]) => Promise<boolean>;
  onRefresh?: () => void;
  onRefreshData?: () => Promise<void>;
  onTriggerAuthModal?: () => void;
  onOpenPairingModal?: () => void;
  appMode?: string;
  onSetAppMode?: (mode: "desktop" | "mobile-scanner" | "calendar-broadcast") => void;
  isSplitMode?: boolean;
  onToggleSplitMode?: () => void;
  isSyncing: boolean;
  driveSyncInfo: any;
  isOnline?: boolean;
  isSimulatedOffline?: boolean;
  offlineQueue?: QueuedOfflineAction[];
  onToggleSimulatedOffline?: () => void;
  onSyncOfflineQueue?: () => Promise<void>;
  onRemoveQueueItem?: (id: string) => void;
  onClearQueue?: () => void;
  onCheckConnection?: () => Promise<void>;
  lastPingTime?: string;
  onBatchDelete?: (ids: string[]) => Promise<boolean>;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  items = [],
  rentals = [],
  logs = [],
  stats,
  settings,
  employees = [],
  devices = [],
  currentUser = null,
  depots = [],
  activeDepotId = "DEP-01",
  onChangeActiveDepot = () => {},
  onLogout = () => {},
  studios = [],
  technicians = [],
  quotes = [],
  clients = [],
  suppliers = [],
  venues = [],
  onAddClient = async () => false,
  onUpdateClient = async () => false,
  onDeleteClient = async () => false,
  onAddSupplier = async () => false,
  onUpdateSupplier = async () => false,
  onDeleteSupplier = async () => false,
  onAddVenue = async () => false,
  onUpdateVenue = async () => false,
  onDeleteVenue = async () => false,
  onDeleteItem,
  onUpdateItem,
  onManualAddItem,
  onRentalCheckout,
  onRentalCheckin,
  onTriggerDriveSync,
  onOpenMobileView,
  onOpenItemDetail,
  onUpdateSettings,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onRevokeDevice,
  onRegisterDevice,
  onAddDepot,
  onUpdateDepot,
  onDeleteDepot,
  onAddStudio = async () => false,
  onUpdateStudio = async () => false,
  onDeleteStudio = async () => false,
  onBookStudio = async () => false,
  onAddTechnician = async () => false,
  onUpdateTechnician = async () => false,
  onDeleteTechnician = async () => false,
  onAddQuote = async () => false,
  onUpdateQuote = async (_id: string, _updates: Partial<ClientQuote>) => false,
  onDeleteQuote = async () => false,
  onImportInvoiceItems,
  onRefresh,
  onRefreshData,
  onTriggerAuthModal,
  onOpenPairingModal,
  appMode,
  onSetAppMode,
  isSplitMode,
  onToggleSplitMode,
  isSyncing,
  driveSyncInfo,
  isOnline = true,
  isSimulatedOffline = false,
  offlineQueue = [],
  onToggleSimulatedOffline = () => {},
  onSyncOfflineQueue = async () => {},
  onRemoveQueueItem = () => {},
  onClearQueue = () => {},
  onCheckConnection = async () => {},
  lastPingTime,
  onBatchDelete,
  darkMode = true,
  onToggleDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<MainAppNavTab>("dashboard");
  const [activeProfileId, setActiveProfileId] = useState<WorkspaceProfileId>(() => {
    if (typeof window === "undefined") return "production";
    return (window.localStorage.getItem("kroma_workspace_profile") as WorkspaceProfileId) || "production";
  });
  const activeProfile = getWorkspaceProfile(activeProfileId);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "rented" | "low-stock">("all");
  const [showManualAddModal, setShowManualAddModal] = useState<boolean>(false);
  const [showInvoiceScannerModal, setShowInvoiceScannerModal] = useState<boolean>(false);
  const [showDepartureModal, setShowDepartureModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showSyncQueueModal, setShowSyncQueueModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [showQuickActionsDropdown, setShowQuickActionsDropdown] = useState<boolean>(false);
  const [quotePrefillTech, setQuotePrefillTech] = useState<TechnicianProfile | null>(null);
  const [quotePrefillStudio, setQuotePrefillStudio] = useState<StudioSpace | null>(null);
  const [quotePrefillClient, setQuotePrefillClient] = useState<ClientRecord | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [upgradeTargetTier, setUpgradeTargetTier] = useState<SubscriptionTier>("pro");

  const handleChangeProfile = (profileId: WorkspaceProfileId) => {
    const nextProfile = getWorkspaceProfile(profileId);
    setActiveProfileId(profileId);
    window.localStorage.setItem("kroma_workspace_profile", profileId);
    if (!nextProfile.visibleTabs.includes(activeTab)) {
      setActiveTab("dashboard");
    }
    showToast("success", `Univers actif : ${nextProfile.label}`);
  };

  const handleConvertQuoteToDossier = async (quote: ClientQuote): Promise<boolean> => {
    if (quote.rentalStatus) {
      setActiveTab("rentals");
      return true;
    }

    const quantities = new Map<string, number>();
    (quote.rentalItems || []).forEach((line) => {
      if (!line.itemId || line.isSubRental) return;
      quantities.set(line.itemId, (quantities.get(line.itemId) || 0) + Math.max(0, Number(line.quantity) || 0));
    });

    const reserved: Array<{ item: InventoryItem; quantity: number }> = [];
    let missingTotal = 0;
    for (const [itemId, quantity] of quantities) {
      const item = items.find((candidate) => candidate.id === itemId);
      if (!item) {
        missingTotal += quantity;
        continue;
      }
      const availableToReserve = Math.min(item.availableQuantity, quantity);
      missingTotal += Math.max(0, quantity - item.availableQuantity);
      if (availableToReserve === 0) continue;
      const updated = await onUpdateItem(item.id, {
        availableQuantity: Math.max(0, item.availableQuantity - availableToReserve),
        reservedQuantity: (item.reservedQuantity || 0) + availableToReserve,
      });
      if (!updated) {
        for (const previous of reserved) {
          await onUpdateItem(previous.item.id, {
            availableQuantity: previous.item.availableQuantity,
            reservedQuantity: previous.item.reservedQuantity || 0,
          });
        }
        showToast("error", "La réservation du parc n’a pas pu être finalisée.");
        return false;
      }
      reserved.push({ item, quantity: availableToReserve });
    }

    const rentalItemsWithShortage = (quote.rentalItems || []).map((line) => {
      const stockItem = items.find((candidate) => candidate.id === line.itemId);
      const available = stockItem?.availableQuantity || 0;
      return {
        ...line,
        shortageQuantity: line.isSubRental ? 0 : Math.max(0, line.quantity - available),
      };
    });
    const converted = await onUpdateQuote(quote.id, {
      status: quote.status === "draft" || quote.status === "sent" ? "accepted" : quote.status,
      rentalStatus: "preparing",
      rentalItems: rentalItemsWithShortage,
    });
    if (!converted) {
      for (const previous of reserved) {
        await onUpdateItem(previous.item.id, {
          availableQuantity: previous.item.availableQuantity,
          reservedQuantity: previous.item.reservedQuantity || 0,
        });
      }
      showToast("error", "Le dossier n’a pas pu être créé.");
      return false;
    }
    showToast("success", missingTotal > 0
      ? `Dossier ${quote.quoteNumber} créé. ${missingTotal} article(s) à sous-louer.`
      : `Dossier ${quote.quoteNumber} créé et matériel réservé.`);
    setActiveTab("rentals");
    return true;
  };

  // Handler to open Plan Upgrade Modal
  const handleOpenUpgradeModal = (recommendedTier: SubscriptionTier = "pro") => {
    setUpgradeTargetTier(recommendedTier);
    setShowUpgradeModal(true);
  };

  // Module access checks
  const studiosAccess = canAccessModule("studios", settings.subscription);
  const techniciansAccess = canAccessModule("technicians", settings.subscription);
  const invoicesAccess = canAccessModule("invoices", settings.subscription);
  const flightcasesAccess = canAccessModule("flightcases", settings.subscription);
  const maintenanceAccess = canAccessModule("maintenance", settings.subscription);
  const displaysAccess = canAccessModule("displays", settings.subscription);

  // Global Command Palette Shortcut Listener (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Batch selection in inventory
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState<boolean>(false);

  // Export options state
  const [exportScope, setExportScope] = useState<"all" | "filtered" | "selected">("all");
  const [exportFormat, setExportFormat] = useState<"excel-fr" | "standard-csv">("excel-fr");
  const [includeFinancials, setIncludeFinancials] = useState<boolean>(true);
  const [includeAiNotes, setIncludeAiNotes] = useState<boolean>(true);

  // Import / Export states
  const importFileRef = useRef<HTMLInputElement>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual Add Form State
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Outillage & Travaux");
  const [newItemBrand, setNewItemBrand] = useState("");
  const [newItemModel, setNewItemModel] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(150);
  const [newItemRate, setNewItemRate] = useState(25);
  const [newItemLocation, setNewItemLocation] = useState("Entrepôt Principal - Allée A");
  const [newItemCondition, setNewItemCondition] = useState("Neuf");
  const [newItemDesc, setNewItemDesc] = useState("");

  // New Rental Departure from Desktop Form State
  const [depItemId, setDepItemId] = useState<string>("");
  const [depQty, setDepQty] = useState<number>(1);
  const [depClientName, setDepClientName] = useState<string>("");
  const [depClientContact, setDepClientContact] = useState<string>("");
  const [depDestination, setDepDestination] = useState<string>("");
  const [depExpectedDate, setDepExpectedDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [depNotes, setDepNotes] = useState<string>("");
  const [isSubmittingDep, setIsSubmittingDep] = useState<boolean>(false);

  const showToast = (type: "success" | "error", text: string) => {
    setActionFeedback({ type, text });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const safeItems = items || [];
  const safeRentals = rentals || [];
  const safeQuotes = quotes || [];
  const safeStudios = studios || [];
  const safeTechnicians = technicians || [];
  const safeClients = clients || [];
  const safeSuppliers = suppliers || [];
  const safeVenues = venues || [];
  const safeLogs = logs || [];
  const safeDepots = depots || [];
  const safeEmployees = employees || [];
  const safeDevices = devices || [];

  // Filter items
  const filteredItems = safeItems.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === "available") matchesStatus = item.availableQuantity > 0;
    if (statusFilter === "rented") matchesStatus = (item.rentedQuantity || 0) > 0;
    if (statusFilter === "low-stock") matchesStatus = item.availableQuantity <= item.minStockAlert;

    return matchesQuery && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(safeItems.map((i) => i.category)));

  // Batch Select Handlers
  const handleToggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map((i) => i.id));
    }
  };

  const handleToggleSelectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedItemIds.length === 0) return;
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement ces ${selectedItemIds.length} article(s) ?`)) {
      return;
    }

    setIsBatchDeleting(true);
    try {
      if (onBatchDelete) {
        const ok = await onBatchDelete(selectedItemIds);
        if (ok) {
          showToast("success", `${selectedItemIds.length} article(s) supprimé(s).`);
          setSelectedItemIds([]);
        } else {
          showToast("error", "Erreur lors de la suppression groupée.");
        }
      } else {
        const res = await fetch("/api/inventory/batch-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedItemIds }),
        });
        const data = await res.json();
        if (data.success) {
          showToast("success", `${data.deletedCount} article(s) supprimé(s) avec succès.`);
          setSelectedItemIds([]);
          onRefresh?.();
        } else {
          showToast("error", "Erreur lors de la suppression groupée.");
        }
      }
    } catch (err: any) {
      showToast("error", "Erreur : " + err.message);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // CSV Generator function for complete and customized exports
  const handleGenerateAndDownloadCSV = (targetScope: "all" | "filtered" | "selected" = exportScope) => {
    let datasetToExport: InventoryItem[] = [];

    if (targetScope === "selected" && selectedItemIds.length > 0) {
      datasetToExport = safeItems.filter((i) => selectedItemIds.includes(i.id));
    } else if (targetScope === "filtered") {
      datasetToExport = filteredItems;
    } else {
      datasetToExport = safeItems;
    }

    if (datasetToExport.length === 0) {
      showToast("error", "Aucun article à exporter.");
      return;
    }

    const delimiter = exportFormat === "excel-fr" ? ";" : ",";

    const headers = [
      "SKU",
      "Nom du Matériel",
      "Catégorie",
      "Marque",
      "Modèle",
      "Stock Total",
      "Disponible",
      "En Location",
      "Seuil Alerte",
      "Emplacement",
      "État",
    ];

    if (includeFinancials) {
      headers.push("Valeur Remplacement (€)", "Tarif Journalier Loc (€)");
    }
    if (includeAiNotes) {
      headers.push("Confiance IA", "Notes Analyse IA", "Tags");
    }
    headers.push("Code-barres", "Date Création", "Dernière Mise à Jour");

    const rows = datasetToExport.map((item) => {
      const escape = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;

      const row: (string | number)[] = [
        escape(item.sku),
        escape(item.name),
        escape(item.category),
        escape(item.brand),
        escape(item.model || ""),
        item.totalQuantity,
        item.availableQuantity,
        item.rentedQuantity || 0,
        item.minStockAlert,
        escape(item.location),
        escape(item.condition),
      ];

      if (includeFinancials) {
        row.push(item.unitPrice, item.rentalRatePerDay);
      }
      if (includeAiNotes) {
        row.push(
          item.aiConfidence ? `${Math.round(item.aiConfidence * 100)}%` : "",
          escape(item.aiAnalysisNotes || ""),
          escape((item.tags || []).join(", "))
        );
      }
      row.push(
        escape(item.barcode || item.sku),
        escape(new Date(item.createdAt).toLocaleDateString("fr-FR")),
        escape(new Date(item.updatedAt).toLocaleDateString("fr-FR"))
      );

      return row.join(delimiter);
    });

    // Add BOM (\uFEFF) for Excel compatibility with UTF-8
    const csvContent = "\uFEFF" + [headers.join(delimiter), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `inventaire-stockvision-${targetScope}-${dateStr}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportModal(false);
    showToast("success", `Export CSV (${datasetToExport.length} articles) téléchargé.`);
  };

  // Quick Direct Server CSV Export Handler
  const handleExportInventoryCSV = () => {
    window.location.href = "/api/inventory/export-csv";
    showToast("success", "Export CSV complet de l'inventaire téléchargé.");
  };

  const handleExportRentalsCSV = () => {
    window.location.href = "/api/rentals/export-csv";
    showToast("success", "Export CSV des locations téléchargé.");
  };

  const handleExportLogsCSV = () => {
    window.location.href = "/api/logs/export-csv";
    showToast("success", "Export CSV du journal d'audit téléchargé.");
  };

  // Clear Logs Handler
  const handleClearLogs = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir effacer l'ensemble de l'historique des scans et événements ?")) {
      return;
    }

    try {
      const res = await fetch("/api/logs", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Journal d'audit réinitialisé.");
        onRefresh?.();
      }
    } catch (err: any) {
      showToast("error", "Erreur : " + err.message);
    }
  };

  // Import Catalogue File Handler
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      let newItems: any[] = [];

      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(content);
        newItems = Array.isArray(parsed) ? parsed : (parsed.inventoryCatalog || [parsed]);
      } else {
        // Parse CSV format
        const lines = content.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const delimiter = lines[0].includes(";") ? ";" : ",";
          const headers = lines[0].split(delimiter).map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
          
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(delimiter).map((c) => c.replace(/^"|"$/g, "").trim());
            if (cols.length >= 2) {
              const nameIdx = headers.findIndex((h) => h.includes("nom") || h.includes("name"));
              const skuIdx = headers.findIndex((h) => h.includes("sku") || h.includes("ref"));
              const catIdx = headers.findIndex((h) => h.includes("cat"));
              const qtyIdx = headers.findIndex((h) => h.includes("stock") || h.includes("quant") || h.includes("total"));
              const priceIdx = headers.findIndex((h) => h.includes("prix") || h.includes("valeur") || h.includes("price"));
              const rateIdx = headers.findIndex((h) => h.includes("tarif") || h.includes("loc") || h.includes("rate"));

              newItems.push({
                name: cols[nameIdx !== -1 ? nameIdx : 1] || cols[0],
                sku: cols[skuIdx !== -1 ? skuIdx : 0] || `SKU-${Date.now().toString().slice(-4)}`,
                category: cols[catIdx !== -1 ? catIdx : 2] || "Général",
                totalQuantity: Number(cols[qtyIdx !== -1 ? qtyIdx : 5]) || 1,
                unitPrice: Number(cols[priceIdx !== -1 ? priceIdx : 10]) || 100,
                rentalRatePerDay: Number(cols[rateIdx !== -1 ? rateIdx : 11]) || 15,
                location: "Entrepôt Principal",
                condition: "Bon état",
              });
            }
          }
        }
      }

      const res = await fetch("/api/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newItems }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", `${data.count} produit(s) importé(s) avec succès !`);
        onRefresh?.();
      } else {
        showToast("error", data.error || "Échec de l'importation");
      }
    } catch (err: any) {
      showToast("error", "Format de fichier invalide : " + err.message);
    } finally {
      if (importFileRef.current) importFileRef.current.value = "";
    }
  };

  // Restore Backup File Handler
  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const res = await fetch("/api/system/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupData }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", "Sauvegarde système restaurée avec succès !");
        onRefresh?.();
      } else {
        showToast("error", "Échec de la restauration de la sauvegarde");
      }
    } catch (err: any) {
      showToast("error", "Fichier de sauvegarde invalide (JSON attendu).");
    } finally {
      if (restoreFileRef.current) restoreFileRef.current.value = "";
    }
  };

  // Reset System Handler
  const handleResetSystem = async () => {
    const confirmName = prompt(
      "ATTENTION : Cette action supprimera tous les produits, mouvements de location et logs pour réinitialiser la base à zéro.\n\nTapez 'REINITIALISER' pour confirmer :"
    );
    if (confirmName !== "REINITIALISER") {
      alert("Action annulée.");
      return;
    }

    try {
      const res = await fetch("/api/system/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Base réinitialisée en mode vierge de production.");
        onRefresh?.();
      }
    } catch (err: any) {
      showToast("error", "Erreur lors de la réinitialisation : " + err.message);
    }
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const ok = await onManualAddItem({
      name: newItemName,
      category: newItemCategory,
      brand: newItemBrand,
      model: newItemModel,
      totalQuantity: Number(newItemQty),
      availableQuantity: Number(newItemQty),
      unitPrice: Number(newItemPrice),
      rentalRatePerDay: Number(newItemRate),
      location: newItemLocation,
      condition: newItemCondition as any,
      description: newItemDesc || "Ajouté manuellement depuis le poste Desktop.",
      tags: [newItemCategory, newItemBrand, newItemModel].filter(Boolean),
      imageUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600",
    });

    if (ok) {
      setShowManualAddModal(false);
      setNewItemName("");
      setNewItemBrand("");
      setNewItemModel("");
      setNewItemDesc("");
      setNewItemQty(1);
      showToast("success", `Matériel '${newItemName}' créé avec succès.`);
    } else {
      showToast("error", "Erreur lors de l'ajout du produit.");
    }
  };

  const handleQuickCloseRental = async (rental: RentalMovement) => {
    if (window.confirm(`Confirmer la réception et le retour en stock de "${rental.itemName}" ?`)) {
      const ok = await onRentalCheckin({
        rentalId: rental.id,
        returnCondition: "Bon état vérifié au bureau",
        returnNotes: "Clôturé depuis le tableau de bord desktop",
        device: "desktop",
        user: "Gestionnaire Bureau",
      });
      if (ok) {
        showToast("success", `Retour validé pour ${rental.itemName}.`);
      }
    }
  };

  const handleDesktopDepartureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depItemId) {
      showToast("error", "Veuillez choisir un matériel disponible.");
      return;
    }
    if (!depClientName.trim()) {
      showToast("error", "Veuillez saisir le nom du client.");
      return;
    }

    const targetItem = items.find((i) => i.id === depItemId);
    if (!targetItem) return;

    if (onRentalCheckout) {
      setIsSubmittingDep(true);
      try {
        const ok = await onRentalCheckout({
          itemId: targetItem.id,
          sku: targetItem.sku,
          quantity: depQty,
          clientName: depClientName,
          clientContact: depClientContact,
          destination: depDestination,
          expectedReturnDate: new Date(depExpectedDate).toISOString(),
          notes: depNotes,
          device: "desktop",
          user: "Gestionnaire Bureau",
        });

        if (ok) {
          setShowDepartureModal(false);
          setDepItemId("");
          setDepQty(1);
          setDepClientName("");
          setDepClientContact("");
          setDepDestination("");
          setDepNotes("");
          showToast("success", `Départ enregistré : ${depQty}x ${targetItem.name} pour ${depClientName}.`);
        } else {
          showToast("error", "Erreur lors de l'enregistrement de la sortie.");
        }
      } finally {
        setIsSubmittingDep(false);
      }
    }
  };

  const downloadDriveBackup = () => {
    window.location.href = "/api/drive/export";
    showToast("success", "Téléchargement du fichier de sauvegarde JSON lancé.");
  };

  const activeEvent = (quotes || []).find((quote) =>
    quote.status === "accepted" || quote.rentalStatus === "in_rental" || quote.rentalStatus === "overdue"
  ) || (quotes || [])[0];

  return (
    <div id="desktop-dashboard" className={`locasyst-theme profile-${activeProfile.id} w-full flex flex-col space-y-5`}>
      {/* Persistent Offline & Sync Status Banner */}
      <ConnectivityIndicator
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        pendingQueue={offlineQueue}
        isSyncing={isSyncing}
        onOpenQueueModal={() => setShowSyncQueueModal(true)}
        onSyncNow={onSyncOfflineQueue}
        onToggleSimulatedOffline={onToggleSimulatedOffline}
      />

      {/* Toast feedback banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xl transition-all animate-bounce ${
            actionFeedback.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-white/80 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP COMMAND BAR: Global Search (Spotlight / Cmd+K), Quick Action Launcher & Connectivity */}
      <div className="dashboard-command-bar flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-[#161a2b] rounded-2xl border border-slate-700/60 shadow-md">
        {/* Spotlight Universal Search trigger */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <button
            id="global-spotlight-btn"
            type="button"
            onClick={() => setShowCommandPalette(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1c2237] hover:bg-[#222942] border border-slate-750 hover:border-indigo-500/60 text-slate-400 hover:text-slate-200 transition group text-left shadow-inner"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
              <span className="text-xs font-medium text-slate-300">
                Rechercher matériel, technicien, studio, devis...
              </span>
            </div>
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-[#242c48] text-indigo-300 border border-slate-700">
              <Command className="w-3 h-3" /> K
            </span>
          </button>
        </div>

        {/* Action Controls & Fast Launcher */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end relative">
          {/* Quick Action Dropdown Trigger */}
          <div className="relative">
            <button
              id="quick-actions-launcher-btn"
              type="button"
              onClick={() => setShowQuickActionsDropdown(!showQuickActionsDropdown)}
              className="py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>+ Action Rapide</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showQuickActionsDropdown ? "rotate-180" : ""}`} />
            </button>

            {showQuickActionsDropdown && (
              <div
                className="absolute right-0 mt-2 w-64 bg-[#161a2b] border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-fadeIn"
                onClick={() => setShowQuickActionsDropdown(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Créations & Départs
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("quotes");
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#202742] transition text-left"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Nouveau Devis / Facture</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDepartureModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#202742] transition text-left"
                >
                  <ArrowUpRight className="w-4 h-4 text-purple-400" />
                  <span>Nouveau Bon de Sortie</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowInvoiceScannerModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#202742] transition text-left"
                >
                  <ScanLine className="w-4 h-4 text-indigo-400" />
                  <span>Scanner Facture / Devis IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowManualAddModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#202742] transition text-left"
                >
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>Ajouter Matériel au Stock</span>
                </button>

                <div className="my-1 border-t border-slate-700/60" />

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("studios");
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#202742] transition text-left"
                >
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>Gérer Studios & Plateaux</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("technicians");
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-[#202742] transition text-left"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Gérer Personnel & Crew</span>
                </button>
              </div>
            )}
          </div>

          {/* Scan Invoice Button */}
          <button
            id="desktop-scan-invoice-btn"
            type="button"
            onClick={() => setShowInvoiceScannerModal(true)}
            className="py-2.5 px-3 rounded-xl border border-indigo-500/40 bg-[#1c2237] hover:bg-[#222942] text-indigo-300 hover:text-white hover:border-indigo-400 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            title="Scanner une facture ou un devis fournisseur pour ajouter du matériel par IA"
          >
            <ScanLine className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Scan Facture IA</span>
          </button>

          {/* Connectivity Status & Queue Button */}
          <button
            id="desktop-header-connectivity-btn"
            type="button"
            onClick={() => setShowSyncQueueModal(true)}
            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
              !isOnline
                ? "bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/50"
                : offlineQueue.length > 0
                ? "bg-indigo-950/60 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/50"
                : "bg-[#1c2237] border-slate-700/70 text-slate-300 hover:text-white hover:bg-[#222942]"
            }`}
            title="État de connexion et file d'attente hors-ligne"
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline font-bold">
              {isOnline ? "En Ligne" : "Hors-Ligne"}
            </span>
            {offlineQueue.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] animate-pulse">
                {offlineQueue.length}
              </span>
            )}
          </button>

          {/* Export CSV Button */}
          <button
            id="desktop-export-csv-btn"
            type="button"
            onClick={() => setShowExportModal(true)}
            className="py-2.5 px-3 rounded-xl border border-emerald-500/40 bg-[#1c2237] text-emerald-300 hover:text-white hover:bg-emerald-950/50 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            title="Exporter l'inventaire en fichier CSV pour Excel / Tableur"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Export CSV</span>
          </button>

          {/* New Item Modal */}
          <button
            type="button"
            onClick={() => setShowManualAddModal(true)}
            className="py-2.5 px-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 shadow-sm transition whitespace-nowrap active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Produit</span>
          </button>
        </div>
      </div>

      {/* Primary rental ERP tabs: the workspace is organized by business flow. */}
      <nav
        aria-label="Navigation métier"
        className="dashboard-primary-nav locasyst-primary-tabs flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
      >
        {[
          { id: "dashboard" as MainAppNavTab, label: "Accueil" },
          { id: "quotes" as MainAppNavTab, label: "Affaires & Devis" },
          { id: "rentals" as MainAppNavTab, label: "Locations" },
          { id: "inventory" as MainAppNavTab, label: "Parc & Stock" },
          { id: "calendar" as MainAppNavTab, label: "Planning" },
          { id: "invoices" as MainAppNavTab, label: "Facturation" },
          { id: "directory" as MainAppNavTab, label: "Clients & Lieux" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === tab.id
                ? "bg-[#3978a8] text-white shadow-sm"
                : "text-slate-500 hover:bg-[#edf4f9] hover:text-[#19304d]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Event Control Center header */}
      <section className="event-control-header rounded-xl border border-[#c9dceb] bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#3978a8]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> {activeProfile.copy.activeEntity}
            </div>
            <h2 className="truncate text-xl font-black tracking-tight text-[#17243a]">
              {activeEvent?.projectName || activeEvent?.clientName || "Aucun événement sélectionné"}
            </h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
              <span>{activeEvent?.clientCompany || activeEvent?.clientName || "Créer un premier dossier"}</span>
              <span>{activeEvent?.eventLocation || activeEvent?.shippingAddress || "Lieu à renseigner"}</span>
              <span>{activeEvent?.startDate ? new Date(activeEvent.startDate).toLocaleDateString("fr-FR") : "Dates à définir"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setActiveTab("quotes")} className="rounded-lg border border-[#b9d0e1] bg-[#f4f8fb] px-3 py-2 text-xs font-bold text-[#3978a8] hover:bg-[#e8f1f7] transition">
              Ouvrir le dossier
            </button>
            <button type="button" onClick={() => setActiveTab("calendar")} className="rounded-lg bg-[#3978a8] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#2f668f] transition">
              Voir le planning
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-[#e2eaf1] sm:grid-cols-5">
          {[
            ["Devis", activeEvent ? "Validé" : "À créer", "text-[#3978a8]"],
            ["Préparation", activeEvent ? "À organiser" : "—", "text-amber-600"],
            ["Livraison", activeEvent ? "À planifier" : "—", "text-slate-500"],
            ["Exploitation", activeEvent ? "À venir" : "—", "text-slate-500"],
            ["Reprise", activeEvent ? "À prévoir" : "—", "text-slate-500"],
          ].map(([label, value, color]) => (
            <div key={label} className="border-r border-[#e2eaf1] px-4 py-2.5 last:border-r-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
              <div className={`mt-0.5 text-xs font-black ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Metric KPI Cards */}
      <div className="dashboard-kpis grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Total Stock & References */}
        <div className="p-4 rounded-2xl bg-[#161a2b] border border-slate-700/60 hover:border-indigo-500/50 shadow-sm flex flex-col justify-between transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Parc & Références
            </span>
            <div className="p-2 rounded-xl bg-[#1c2237] border border-slate-700/60 text-indigo-400 group-hover:scale-105 transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">
              {stats.totalStockItems}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">
              en {stats.totalProducts} réf.
            </span>
          </div>
        </div>

        {/* KPI 2: Available Stock in Real-Time */}
        <div className="p-4 rounded-2xl bg-[#161a2b] border border-slate-700/60 hover:border-emerald-500/50 shadow-sm flex flex-col justify-between transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Dispo en Rayon
            </span>
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-400">
              {stats.totalAvailable}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">
              unités prêtes
            </span>
          </div>
        </div>

        {/* KPI 3: Out on Rent / Movement */}
        <div className="p-4 rounded-2xl bg-[#161a2b] border border-slate-700/60 hover:border-amber-500/50 shadow-sm flex flex-col justify-between transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              En Location / Sortie
            </span>
            <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 group-hover:scale-105 transition">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-400">
              {stats.totalRented}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">
              sur {stats.activeRentalsCount} chantiers
            </span>
          </div>
        </div>

        {/* KPI 4: Overdue & Low Stock Alerts */}
        <div className="p-4 rounded-2xl bg-[#161a2b] border border-slate-700/60 hover:border-rose-500/50 shadow-sm flex flex-col justify-between transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Alertes & Retards
            </span>
            <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 group-hover:scale-105 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">
              {stats.overdueCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              retards • {stats.lowStockCount} bas
            </span>
          </div>
        </div>

        {/* KPI 5: Total Value Asset */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#161a2b] border border-slate-700/60 hover:border-indigo-500/50 shadow-sm flex flex-col justify-between transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Valeur du Parc
            </span>
            <div className="p-2 rounded-xl bg-[#1c2237] border border-slate-700/60 text-slate-300 group-hover:scale-105 transition">
              <Euro className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-white">
              {stats.totalInventoryValue.toLocaleString("fr-FR")} €
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HIGH-END DUAL-AXIS WORKSPACE: MODERN NAVIGATION & PANELS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Modern Categorized Sidebar Navigation Rail */}
        <div className="lg:col-span-3 lg:sticky lg:top-4 z-20">
          <MainSidebar
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            stats={stats}
            quotesCount={quotes.length}
            studiosCount={studios.length}
            techniciansCount={technicians.length}
            inventoryCount={items.length}
            logsCount={logs.length}
            isOnline={isOnline}
            currentUser={currentUser}
            subscription={settings.subscription}
            depots={depots}
            activeDepotId={activeDepotId}
            onChangeActiveDepot={onChangeActiveDepot}
            onLogout={onLogout}
            onOpenQuickDeparture={() => setShowDepartureModal(true)}
            onOpenScanInvoice={() => setShowInvoiceScannerModal(true)}
            onOpenDualScreenPlanning={() => setActiveTab("calendar")}
            onOpenUpgradeModal={handleOpenUpgradeModal}
            onOpenPairingModal={onOpenPairingModal}
            onOpenAuthModal={onTriggerAuthModal}
            appMode={appMode}
            onSetAppMode={onSetAppMode}
            isSplitMode={isSplitMode}
            onToggleSplitMode={onToggleSplitMode}
            darkMode={darkMode}
            onToggleDarkMode={onToggleDarkMode}
            activeProfile={activeProfile}
            onChangeProfile={handleChangeProfile}
            visibleTabs={activeProfile.visibleTabs}
          />
        </div>

        {/* Right Workspace Main Panel */}
        <div className="lg:col-span-9 space-y-4">
          {/* ========================================================= */}
          {/* TAB 0: EXECUTIVE DASHBOARD */}
          {/* ========================================================= */}
          {activeTab === "dashboard" && (
            <div className="space-y-5">
              {/* Top Banner with Quick Actions */}
              <div className="dashboard-hero bg-gradient-to-r from-[#12162a] via-[#101527] to-[#0c0f1c] border border-indigo-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Tableau de Bord Régie & Logistique KROMA
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                      Bonjour, {currentUser?.name || "Régisseur"}
                    </h2>
                    <p className="text-xs text-slate-400 max-w-xl">
                      Gestion centralisée du parc audiovisuel, des plateaux de tournage, des devis, de la facturation et du check-in/out matériel avec pointage contradictoire.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("quotes")}
                      className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      Nouveau Devis
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDepartureModal(true)}
                      className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition active:scale-95"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Départ Matériel
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("calendar")}
                      className="py-2.5 px-3.5 rounded-xl bg-[#1c223c] hover:bg-[#252d4e] text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-2 transition"
                    >
                      <Calendar className="w-4 h-4" />
                      Planning Régie
                    </button>
                  </div>
                </div>
              </div>

              {/* Compact operational header: actions stay visible without a marketing hero. */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#3978a8]">{activeProfile.copy.dashboardEyebrow}</p>
                  <h2 className="text-base font-black text-[#17243a]">{activeProfile.copy.dashboardTitle}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setActiveTab("quotes")} className="rounded-lg bg-[#d49a45] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#bd8432] transition">
                    <Plus className="mr-1 inline-block h-3.5 w-3.5" /> Nouveau devis
                  </button>
                  <button type="button" onClick={() => setShowDepartureModal(true)} className="rounded-lg bg-[#3978a8] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#2f668f] transition">
                    <ArrowUpRight className="mr-1 inline-block h-3.5 w-3.5" /> Départ matériel
                  </button>
                  <button type="button" onClick={() => setActiveTab("calendar")} className="rounded-lg border border-[#b7cde0] bg-[#f4f8fb] px-3 py-2 text-xs font-bold text-[#3978a8] hover:bg-[#e8f1f7] transition">
                    Planning
                  </button>
                </div>
              </div>

              {/* Quick Operational Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Rentals Summary */}
                <div className="bg-[#0e111d] border border-[#1e233b] rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1b2038]">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Truck className="w-4 h-4 text-purple-400" />
                      <span>Dossiers de Location en Cours ({(quotes || []).filter(q => q.status === "accepted" || q.rentalStatus === "in_rental").length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("rentals")}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      Voir tout <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(quotes || []).filter(q => q.status === "accepted" || q.rentalStatus === "in_rental" || q.rentalStatus === "overdue").length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Aucun dossier en cours de tournage.
                      </div>
                    ) : (
                      (quotes || [])
                        .filter(q => q.status === "accepted" || q.rentalStatus === "in_rental" || q.rentalStatus === "overdue")
                        .slice(0, 4)
                        .map(quote => (
                          <div
                            key={quote.id}
                            onClick={() => setActiveTab("rentals")}
                            className="p-2.5 rounded-xl bg-[#121524] border border-[#1e233b] hover:border-purple-500/40 cursor-pointer transition flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-100">{quote.clientName}</p>
                              <p className="text-[11px] text-slate-400">
                                {quote.rentalItems?.length || 0} équipement(s) • Retour {quote.endDate ? new Date(quote.endDate).toLocaleDateString("fr-FR") : "Non définie"}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              quote.rentalStatus === "overdue"
                                ? "bg-rose-950/80 text-rose-300 border border-rose-800"
                                : "bg-purple-950/80 text-purple-300 border border-purple-800"
                            }`}>
                              {quote.rentalStatus === "overdue" ? "En retard" : "Sur tournage"}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Studios Status */}
                <div className="bg-[#0e111d] border border-[#1e233b] rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1b2038]">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <span>Plateaux & Studios ({(studios || []).length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("studios")}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      Gérer <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {(studios || []).slice(0, 4).map(studio => (
                      <div
                        key={studio.id}
                        onClick={() => setActiveTab("studios")}
                        className="p-2.5 rounded-xl bg-[#121524] border border-[#1e233b] hover:border-cyan-500/40 cursor-pointer transition flex flex-col justify-between text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-200 truncate">{studio.name}</p>
                          <span className={`w-2 h-2 rounded-full ${
                            studio.status === "available" ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-rose-400"
                          }`} />
                        </div>
                        <p className="text-[11px] text-slate-400">{studio.surfaceSqm} m² • {studio.hourlyRate} €/h</p>
                        <span className="text-[10px] text-slate-500">
                          {studio.status === "available" ? "🟢 Disponible" : "🔴 En direct / Réservé"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Low Stock & System Scan Logs Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Low Stock Alerts */}
                <div className="bg-[#0e111d] border border-[#1e233b] rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1b2038]">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Alertes Stock Bas ({stats?.lowStockCount || 0})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("low-stock");
                        setActiveTab("inventory");
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                    >
                      Filtrer inventaire <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(items || []).filter(i => (i.availableQuantity ?? i.stockQuantity ?? 0) <= (i.minStockAlert || 2)).length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Tous les niveaux de stock sont optimaux.
                      </div>
                    ) : (
                      (items || [])
                        .filter(i => (i.availableQuantity ?? i.stockQuantity ?? 0) <= (i.minStockAlert || 2))
                        .slice(0, 4)
                        .map(item => (
                          <div
                            key={item.id}
                            className="p-2 rounded-xl bg-rose-950/20 border border-rose-900/30 flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-slate-200">{item.name}</span>
                            <span className="font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/40">
                              {item.availableQuantity ?? item.stockQuantity ?? 0} restant(s)
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Latest Scans */}
                <div className="bg-[#0e111d] border border-[#1e233b] rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1b2038]">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <span>Dernières Activités & Scans ({(logs || []).length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("logs")}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                    >
                      Journal complet <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(logs || []).slice(0, 4).map(log => (
                      <div
                        key={log.id}
                        className="p-2 rounded-xl bg-[#121524] border border-[#1e233b] flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-2">
                          <p className="font-semibold text-slate-200 truncate">{log.title}</p>
                          <p className="text-[10px] text-slate-500">{log.details}</p>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 flex-shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* ========================================================= */}
      {/* TAB 1: INVENTORY & STOCK MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          {/* Filters and Production Action Bar */}
          <div className="p-3 bg-[#0e111d] rounded-2xl border border-[#1e233b] shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <input
                type="text"
                placeholder="Rechercher par nom, SKU, marque ou tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>

            {/* Category and Status Dropdowns */}
            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="all">Toutes Catégories ({items.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#121524] text-slate-200">
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="all" className="bg-[#121524] text-slate-200">Tous les Statuts</option>
                <option value="available" className="bg-[#121524] text-slate-200">En stock disponible</option>
                <option value="rented" className="bg-[#121524] text-slate-200">Actuellement loué</option>
                <option value="low-stock" className="bg-[#121524] text-slate-200">Stock bas / Alerte</option>
              </select>

              {/* CSV Import / Export buttons */}
              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="file"
                  ref={importFileRef}
                  onChange={handleImportFile}
                  accept=".csv,.json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => importFileRef.current?.click()}
                  className="py-2 px-3 rounded-xl border border-[#232842] bg-[#121524] text-slate-300 hover:text-white hover:bg-[#181c30] text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Importer un fichier CSV ou JSON"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  Importer
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="py-2 px-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 text-xs font-bold flex items-center gap-1.5 transition"
                  title="Exporter tout le stock au format CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  Exporter CSV
                </button>
              </div>
            </div>
          </div>

          {/* Batch Action Bar when items selected */}
          {selectedItemIds.length > 0 && (
            <div className="p-3 bg-indigo-950/80 border border-indigo-500/40 rounded-2xl flex items-center justify-between text-xs animate-fade-in shadow-md">
              <div className="flex items-center gap-2 text-indigo-200 font-bold">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <span>{selectedItemIds.length} article(s) sélectionné(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateAndDownloadCSV("selected")}
                  className="py-1.5 px-3 rounded-lg border border-emerald-500/40 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/60 font-semibold flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  Exporter la sélection en CSV
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItemIds([])}
                  className="py-1.5 px-3 rounded-lg border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/50 transition font-medium"
                >
                  Désélectionner tout
                </button>
                <button
                  type="button"
                  disabled={isBatchDeleting}
                  onClick={handleBatchDelete}
                  className="py-1.5 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isBatchDeleting ? "Suppression..." : `Supprimer la sélection (${selectedItemIds.length})`}
                </button>
              </div>
            </div>
          )}

          {/* Product Items Table */}
          <div className="bg-[#0e111d] rounded-2xl border border-[#1e233b] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#121627] text-[11px] uppercase font-semibold text-slate-400 border-b border-[#1e233b]">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-slate-400 hover:text-white"
                        title={selectedItemIds.length === filteredItems.length ? "Tout désélectionner" : "Tout sélectionner"}
                      >
                        {selectedItemIds.length > 0 && selectedItemIds.length === filteredItems.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">Produit & Référence</th>
                    <th className="py-3 px-4">Catégorie & Marque</th>
                    <th className="py-3 px-4 text-center">Stock Dispo / Total</th>
                    <th className="py-3 px-4">État & Emplacement</th>
                    <th className="py-3 px-4">Tarif Loc. / Valeur</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181d30]">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Aucun matériel ne correspond à votre recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isLowStock = item.availableQuantity <= item.minStockAlert;
                      const hasRentals = (item.rentedQuantity || 0) > 0;
                      const isSelected = selectedItemIds.includes(item.id);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-[#141829] transition cursor-pointer ${
                            isSelected ? "bg-indigo-950/20" : ""
                          }`}
                          onClick={() => onOpenItemDetail(item)}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-3 px-4 text-center" onClick={(e) => handleToggleSelectItem(item.id, e)}>
                            <button
                              type="button"
                              aria-label="Sélectionner le produit"
                              onClick={(e) => handleToggleSelectItem(item.id, e)}
                              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Image & Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.imageUrl || "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=100"}
                                alt={item.name}
                                className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-[#232842] shadow-sm bg-[#121524]"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-slate-100 hover:text-indigo-400 transition truncate max-w-xs">
                                  {item.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/70 border border-indigo-800/40 px-1.5 py-0.2 rounded font-semibold">
                                    {item.sku}
                                  </span>
                                  {item.aiConfidence && (
                                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                      IA {Math.round(item.aiConfidence * 100)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category & Brand */}
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-200">
                              {item.category}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {item.brand} {item.model ? `• ${item.model}` : ""}
                            </p>
                          </td>

                          {/* Stock Status */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-sm font-bold ${
                                    item.availableQuantity === 0
                                      ? "text-rose-400"
                                      : isLowStock
                                      ? "text-amber-400"
                                      : "text-emerald-400"
                                  }`}
                                >
                                  {item.availableQuantity}
                                </span>
                                <span className="text-slate-500 font-semibold">/</span>
                                <span className="text-xs font-semibold text-slate-400">
                                  {item.totalQuantity}
                                </span>
                              </div>
                              {hasRentals && (
                                <span className="text-[10px] text-amber-400 font-medium">
                                  ({item.rentedQuantity} en location)
                                </span>
                              )}
                              {isLowStock && item.availableQuantity > 0 && (
                                <span className="text-[9px] font-bold text-amber-300 bg-amber-950/70 border border-amber-800/50 px-1.5 py-0.2 rounded mt-0.5">
                                  Alerte Stock Bas
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Condition & Location */}
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#181d30] border border-[#262c46] text-slate-300 mb-1">
                              {item.condition}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span className="truncate max-w-[150px]">{item.location}</span>
                            </div>
                          </td>

                          {/* Rates */}
                          <td className="py-3 px-4">
                            <p className="font-semibold text-white">
                              {item.rentalRatePerDay} € <span className="text-[10px] font-normal text-slate-400">/ jour</span>
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Val. {item.unitPrice} €
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenItemDetail(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-[#1a1f33] transition"
                                title="Voir la fiche & QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`Supprimer "${item.name}" ?`)) {
                                    await onDeleteItem(item.id);
                                    showToast("success", `Matériel '${item.name}' supprimé.`);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-[#1a1f33] transition"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: STUDIOS & SPACES (PODCAST / TOURNAGE) */}
      {/* ========================================================= */}
      {activeTab === "studios" && (
        <PlanGateGuard
          moduleName="Studios & Plateaux"
          requiredTier="ultimate"
          reason="La gestion et réservation des plateaux de tournage, régies et studios d'enregistrement est incluse dans la formule KROMA Ultimate."
          hasAccess={studiosAccess.allowed}
          onOpenUpgradeModal={handleOpenUpgradeModal}
        >
          <StudiosDashboard
            studios={safeStudios}
            inventoryItems={safeItems}
            technicians={safeTechnicians}
            onAddStudio={onAddStudio}
            onUpdateStudio={onUpdateStudio}
            onDeleteStudio={onDeleteStudio}
            onBookStudio={onBookStudio}
            onOpenQuoteWithStudio={(studio) => {
              setQuotePrefillStudio(studio);
              setActiveTab("quotes");
            }}
          />
        </PlanGateGuard>
      )}

      {/* ========================================================= */}
      {/* TAB: TECHNICIANS & CREW */}
      {/* ========================================================= */}
      {activeTab === "technicians" && (
        <PlanGateGuard
          moduleName="Personnel & Crew Intermittents"
          requiredTier="ultimate"
          canBuyAddon={true}
          reason="Le planning des équipes techniques, taux horaires, qualifications et contrats d'intermittents nécessite l'option Crew (+35€/mois) ou la formule Ultimate."
          hasAccess={techniciansAccess.allowed}
          onOpenUpgradeModal={handleOpenUpgradeModal}
        >
          <TechniciansDashboard
            technicians={safeTechnicians}
            onAddTechnician={onAddTechnician}
            onUpdateTechnician={onUpdateTechnician}
            onDeleteTechnician={onDeleteTechnician}
            onRefresh={onRefresh}
            onAddTechToQuote={(tech) => {
              setQuotePrefillTech(tech);
              setActiveTab("quotes");
            }}
          />
        </PlanGateGuard>
      )}

      {/* ========================================================= */}
      {/* TAB: QUOTES GENERATOR */}
      {/* ========================================================= */}
      {activeTab === "quotes" && (
        <QuotesDashboard
          activeProfile={activeProfile}
          quotes={safeQuotes}
          inventory={safeItems}
          studios={safeStudios}
          technicians={safeTechnicians}
          clients={safeClients}
          suppliers={safeSuppliers}
          settings={settings}
          onAddQuote={onAddQuote}
          onUpdateQuote={onUpdateQuote}
          onDeleteQuote={onDeleteQuote}
          onOpenDossiers={() => setActiveTab("rentals")}
          onConvertToDossier={handleConvertQuoteToDossier}
          onRefresh={onRefresh}
          prefillTech={quotePrefillTech}
          prefillStudio={quotePrefillStudio}
          prefillClient={quotePrefillClient}
          onClearPrefill={() => {
            setQuotePrefillTech(null);
            setQuotePrefillStudio(null);
            setQuotePrefillClient(null);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* TAB: ANNUAIRE CLIENTS, LIEUX & FOURNISSEURS (LOCASYST) */}
      {/* ========================================================= */}
      {activeTab === "directory" && (
        <DirectoryDashboard
          clients={safeClients}
          suppliers={safeSuppliers}
          venues={safeVenues}
          onAddClient={onAddClient}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
          onAddSupplier={onAddSupplier}
          onUpdateSupplier={onUpdateSupplier}
          onDeleteSupplier={onDeleteSupplier}
          onAddVenue={onAddVenue}
          onUpdateVenue={onUpdateVenue}
          onDeleteVenue={onDeleteVenue}
          onDraftQuoteForClient={(client) => {
            setQuotePrefillClient(client);
            setActiveTab("quotes");
          }}
        />
      )}

      {/* ========================================================= */}
      {/* TAB: INVOICES & FACTURATION */}
      {/* ========================================================= */}
      {activeTab === "invoices" && (
        <PlanGateGuard
          moduleName="Facturation & Échéances"
          requiredTier="ultimate"
          reason="L'édition des factures directes, acomptes, avoirs et relevés comptables avancés est réservée à la formule Ultimate."
          hasAccess={invoicesAccess.allowed}
          onOpenUpgradeModal={handleOpenUpgradeModal}
        >
          <InvoicesDashboard
            quotes={safeQuotes}
            items={safeItems}
            settings={settings}
            onUpdateQuote={onUpdateQuote}
            onOpenScanInvoiceModal={() => setShowInvoiceScannerModal(true)}
            onOpenNewQuote={() => setActiveTab("quotes")}
          />
        </PlanGateGuard>
      )}

      {/* ========================================================= */}
      {/* TAB: RENTALS & KROMA-STYLE CHECK-IN / CHECK-OUT */}
      {/* ========================================================= */}
      {activeTab === "rentals" && (
        <RentalsDossiersDashboard
          quotes={safeQuotes}
          items={safeItems}
          settings={settings}
          onUpdateQuote={onUpdateQuote}
          onRefresh={onRefresh}
          onOpenNewQuote={() => setActiveTab("quotes")}
          onOpenQuickDeparture={() => setShowDepartureModal(true)}
        />
      )}

      {/* ========================================================= */}
      {/* TAB: CALENDAR & REGIE PLANNING (SECOND SCREEN SUPPORT) */}
      {/* ========================================================= */}
      {activeTab === "calendar" && (
        <CalendarPlanningDashboard
          quotes={safeQuotes}
          studios={safeStudios}
          technicians={safeTechnicians}
          items={safeItems}
          depots={safeDepots}
          activeDepotId={activeDepotId}
          onOpenNewQuote={() => setActiveTab("quotes")}
          onSelectQuote={() => {
            setActiveTab("rentals");
          }}
        />
      )}

      {/* ========================================================= */}
      {/* TAB: MALLES & FLIGHT CASES (MASTER QR / RFID BUNDLES) */}
      {/* ========================================================= */}
      {activeTab === "flightcases" && (
        <PlanGateGuard
          moduleName="Malles & Flight Cases RFID"
          requiredTier="pro"
          reason="Le regroupement de matériel par malles et QR Codes maîtres de kits est disponible à partir de la formule KROMA Pro."
          hasAccess={flightcasesAccess.allowed}
          onOpenUpgradeModal={handleOpenUpgradeModal}
        >
          <FlightCasesDashboard
            inventory={safeItems}
            items={safeItems}
            quotes={safeQuotes}
            settings={settings}
            onUpdateItem={onUpdateItem}
            onNavigateToRentals={() => setActiveTab("rentals")}
          />
        </PlanGateGuard>
      )}

      {/* ========================================================= */}
      {/* TAB: ATELIER SAV, RÉPARATIONS & CASSE MATÉRIEL */}
      {/* ========================================================= */}
      {activeTab === "maintenance" && (
        <PlanGateGuard
          moduleName="Atelier SAV & Suivi de Casse"
          requiredTier="pro"
          reason="La gestion de l'atelier de réparation, des devis de remise en état et du suivi SAV est disponible à partir de la formule KROMA Pro."
          hasAccess={maintenanceAccess.allowed}
          onOpenUpgradeModal={handleOpenUpgradeModal}
        >
          <MaintenanceSAVDashboard
            inventory={safeItems}
            items={safeItems}
            quotes={safeQuotes}
            settings={settings}
            onUpdateItem={onUpdateItem}
            onNavigateToQuotes={() => setActiveTab("quotes")}
          />
        </PlanGateGuard>
      )}

      {/* ========================================================= */}
      {/* TAB: RÉGIE & ÉCRANS RÉSEAU (DIGITAL SIGNAGE & FAILOVER) */}
      {/* ========================================================= */}
      {activeTab === "displays" && (
        <PlanGateGuard
          moduleName="Régie & Écrans Réseau"
          requiredTier="pro"
          reason="Le pilotage des écrans distants et le mode bascule automatique (failover) sont disponibles à partir de la formule KROMA Pro (jusqu'à 2 écrans) et illimités en formule Ultimate."
          hasAccess={displaysAccess.allowed}
          onOpenUpgradeModal={handleOpenUpgradeModal}
        >
          <NetworkDisplaysDashboard
            darkMode={darkMode}
            subscription={settings.subscription}
            depots={safeDepots as any}
            onOpenUpgradeModal={handleOpenUpgradeModal}
            onLaunchKioskScreen={(screenId) => {
              if (onSetAppMode) {
                onSetAppMode("kiosk-display");
              } else {
                window.open(`/?display=${screenId}`, "_blank");
              }
            }}
          />
        </PlanGateGuard>
      )}

      {/* ========================================================= */}
      {/* TAB 3: REAL-TIME AUDIT LOGS */}
      {/* ========================================================= */}
      {activeTab === "logs" && (
        <div className="bg-[#0e111d] rounded-2xl border border-[#1e233b] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1e233b] gap-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Journal des Scans & Événements en Direct
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chaque scan mobile et action desktop est consigné de façon immuable
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportLogsCSV}
                className="py-1.5 px-3 rounded-xl border border-[#232842] bg-[#121524] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                Exporter CSV
              </button>

              <button
                type="button"
                onClick={handleClearLogs}
                className="py-1.5 px-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Purger le Journal
              </button>

              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold ml-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SSE Connecté
              </span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                Aucun log d'événement enregistré.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#121524] border border-[#1f243c] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        log.device === "mobile"
                          ? "bg-indigo-950/80 text-indigo-400 border border-indigo-800/40"
                          : "bg-[#1a1f33] text-slate-300"
                      }`}
                    >
                      {log.device === "mobile" ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Layers className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-100">
                        {log.title}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono text-[10px] text-slate-400 block">
                      {new Date(log.timestamp).toLocaleTimeString("fr-FR")}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-medium">
                      {log.user}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: GOOGLE DRIVE & CLOUD SYNC ARCHITECTURE */}
      {/* ========================================================= */}
      {activeTab === "cloud" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#0f1b33] via-[#0d1527] to-[#0a0d18] text-white p-6 rounded-2xl border border-[#233152] shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
                  <Cloud className="w-3.5 h-3.5" /> Stockage Google Drive & Sauvegardes Sécurisées
                </div>
                <h3 className="text-xl font-bold text-white">
                  Synchronisation Google Drive & Sauvegarde Automatique
                </h3>
                <p className="text-xs text-sky-200/80 max-w-xl">
                  Les données d'inventaire, les mouvements de location et les photos de scans sont indexés avec Gemini 3.7 Flash et stockés sous format structuré synchronisable avec votre Google Drive.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={onTriggerDriveSync}
                  className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                  Synchroniser Maintenant
                </button>
                <button
                  type="button"
                  onClick={downloadDriveBackup}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <Download className="w-4 h-4" />
                  Télécharger Sauvegarde (.json)
                </button>
              </div>
            </div>
          </div>

          {/* Drive Folders Architecture Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <FileSpreadsheet className="w-4 h-4" />
                <span>1. Catalogue Produits (CSV / JSON)</span>
              </div>
              <p className="text-xs text-slate-400">
                Structure normalisée avec SKUs, descriptions enrichies par l'IA, seuils d'alerte et taux journaliers.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="p-1.5 rounded-lg bg-[#121524] border border-[#1f243c] text-[10px] font-mono text-slate-300">
                  📁 inventory_catalog.csv
                </span>
                <button
                  type="button"
                  onClick={handleExportInventoryCSV}
                  className="py-1 px-2.5 rounded-lg bg-indigo-950 border border-indigo-700/50 text-indigo-300 hover:bg-indigo-900 text-[11px] font-semibold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Exporter
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <ArrowUpRight className="w-4 h-4" />
                <span>2. Grand Livre des Locations</span>
              </div>
              <p className="text-xs text-slate-400">
                Historique complet des départs, dates prévues, clôtures de retour et constats d'état.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="p-1.5 rounded-lg bg-[#121524] border border-[#1f243c] text-[10px] font-mono text-slate-300">
                  📁 rental_ledger.csv
                </span>
                <button
                  type="button"
                  onClick={handleExportRentalsCSV}
                  className="py-1 px-2.5 rounded-lg bg-amber-950 border border-amber-700/50 text-amber-300 hover:bg-amber-900 text-[11px] font-semibold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Exporter
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>3. Indexation IA Économique</span>
              </div>
              <p className="text-xs text-slate-400">
                Gemini 3.7 Flash assure une vision multimodale instantanée à coût minimal sans serveur GPU dédié lourd.
              </p>
              <div className="p-2 rounded-lg bg-[#121524] border border-[#1f243c] text-[11px] font-mono text-slate-300">
                ⚡ Gemini 3.7 Flash Cloud Engine
              </div>
            </div>
          </div>

          {/* Maintenance & Backup Actions */}
          <div className="p-5 rounded-2xl bg-[#0e111d] border border-[#1e233b] shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              Restauration Système & Gestion des Données
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#121524] border border-[#1e233b] space-y-2">
                <p className="font-bold text-xs text-slate-200">Restaurer une sauvegarde JSON</p>
                <p className="text-[11px] text-slate-400">
                  Réimportez un fichier de sauvegarde (.json) préalablement téléchargé pour réhydrater l'ensemble de votre base.
                </p>
                <input
                  type="file"
                  ref={restoreFileRef}
                  onChange={handleRestoreBackup}
                  accept=".json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => restoreFileRef.current?.click()}
                  className="py-2 px-3 rounded-lg border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/50 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Sélectionner un fichier JSON de restauration
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-2">
                <p className="font-bold text-xs text-rose-300">Réinitialiser la base de données</p>
                <p className="text-[11px] text-rose-300/70">
                  Efface toutes les données pour repartir sur une base de production complètement vierge.
                </p>
                <button
                  type="button"
                  onClick={handleResetSystem}
                  className="py-2 px-3 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réinitialiser à zéro (Mode Vierge)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: SETTINGS, CLOUD AI, DEVICES & EMPLOYEES */}
      {/* ========================================================= */}
      {activeTab === "settings" && (
        <SettingsDashboard
          settings={settings}
          employees={employees}
          devices={devices}
          items={items}
          currentUser={currentUser}
          depots={depots}
          onUpdateSettings={onUpdateSettings}
          onAddEmployee={onAddEmployee}
          onUpdateEmployee={onUpdateEmployee}
          onDeleteEmployee={onDeleteEmployee}
          onRevokeDevice={onRevokeDevice}
          onRegisterDevice={onRegisterDevice}
          onTriggerDriveSync={onTriggerDriveSync}
          onAddDepot={onAddDepot}
          onUpdateDepot={onUpdateDepot}
          onDeleteDepot={onDeleteDepot}
          onRefreshData={onRefreshData}
          onTriggerAuthModal={onTriggerAuthModal}
          isSyncing={isSyncing}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      )}
        </div>
      </div>

      {/* Advanced CSV Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e111d] border border-[#232842] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e233b]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Exporter l'Inventaire en CSV
              </h3>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Périmètre d'exportation */}
              <div>
                <label className="block font-semibold text-slate-200 mb-2">
                  1. Périmètre de l'exportation
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      exportScope === "all"
                        ? "bg-indigo-950/40 border-indigo-500/60 text-white"
                        : "bg-[#121524] border-[#232842] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="exportScope"
                        checked={exportScope === "all"}
                        onChange={() => setExportScope("all")}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <div>
                        <p className="font-bold">Catalogue complet</p>
                        <p className="text-[11px] text-slate-400">
                          Tous les {items.length} articles enregistrés
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-indigo-400">{items.length}</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      exportScope === "filtered"
                        ? "bg-indigo-950/40 border-indigo-500/60 text-white"
                        : "bg-[#121524] border-[#232842] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="exportScope"
                        checked={exportScope === "filtered"}
                        onChange={() => setExportScope("filtered")}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <div>
                        <p className="font-bold">Vue filtrée actuelle</p>
                        <p className="text-[11px] text-slate-400">
                          Selon filtres et recherche en cours
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-indigo-400">{filteredItems.length}</span>
                  </label>

                  {selectedItemIds.length > 0 && (
                    <label
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        exportScope === "selected"
                          ? "bg-indigo-950/40 border-indigo-500/60 text-white"
                          : "bg-[#121524] border-[#232842] text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="exportScope"
                          checked={exportScope === "selected"}
                          onChange={() => setExportScope("selected")}
                          className="text-indigo-600 focus:ring-0"
                        />
                        <div>
                          <p className="font-bold">Articles sélectionnés</p>
                          <p className="text-[11px] text-slate-400">
                            Cochés manuellement dans le tableau
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-indigo-400">{selectedItemIds.length}</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Format du fichier */}
              <div>
                <label className="block font-semibold text-slate-200 mb-2">
                  2. Format & Encodage
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat("excel-fr")}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      exportFormat === "excel-fr"
                        ? "bg-emerald-950/40 border-emerald-500/60 text-white"
                        : "bg-[#121524] border-[#232842] text-slate-400"
                    }`}
                  >
                    <p className="font-bold text-slate-200">Excel Français</p>
                    <p className="text-[10px] text-slate-400">Séparateur ';' + UTF-8 BOM</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat("standard-csv")}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      exportFormat === "standard-csv"
                        ? "bg-emerald-950/40 border-emerald-500/60 text-white"
                        : "bg-[#121524] border-[#232842] text-slate-400"
                    }`}
                  >
                    <p className="font-bold text-slate-200">CSV Standard</p>
                    <p className="text-[10px] text-slate-400">Séparateur ',' (International)</p>
                  </button>
                </div>
              </div>

              {/* Colonnes optionnelles */}
              <div>
                <label className="block font-semibold text-slate-200 mb-2">
                  3. Colonnes complémentaires
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={includeFinancials}
                      onChange={(e) => setIncludeFinancials(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>Inclure les valeurs financières (prix unitaire, tarif de location)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={includeAiNotes}
                      onChange={(e) => setIncludeAiNotes(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>Inclure les analyses et notes IA (confiance, tags)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e233b]">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="py-2 px-3.5 rounded-xl border border-[#232842] text-slate-300 hover:text-white text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleGenerateAndDownloadCSV()}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/30 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger le fichier CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Product Modal */}
      {showManualAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e111d] border border-[#232842] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e233b]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Ajouter un Produit Manuellement
              </h3>
              <button
                type="button"
                onClick={() => setShowManualAddModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Nom du matériel *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Scie Circulaire Sans Fil"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Outillage & Travaux" className="bg-[#121524]">Outillage & Travaux</option>
                    <option value="Audiovisuel & Son" className="bg-[#121524]">Audiovisuel & Son</option>
                    <option value="Vidéo & Cinéma" className="bg-[#121524]">Vidéo & Cinéma</option>
                    <option value="Informatique & Régie" className="bg-[#121524]">Informatique & Régie</option>
                    <option value="Éclairage & Scénographie" className="bg-[#121524]">Éclairage & Scénographie</option>
                    <option value="Mobilier & Stand" className="bg-[#121524]">Mobilier & Stand</option>
                    <option value="Général" className="bg-[#121524]">Général</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Marque
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Makita, Sony, Bosch..."
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Modèle / Référence
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: DHS680Z"
                    value={newItemModel}
                    onChange={(e) => setNewItemModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    État du produit
                  </label>
                  <select
                    value={newItemCondition}
                    onChange={(e) => setNewItemCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Neuf" className="bg-[#121524]">Neuf</option>
                    <option value="Excellent" className="bg-[#121524]">Excellent</option>
                    <option value="Bon état" className="bg-[#121524]">Bon état</option>
                    <option value="Usagé" className="bg-[#121524]">Usagé</option>
                    <option value="À réviser" className="bg-[#121524]">À réviser</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Quantité
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white outline-none font-bold focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Tarif Loc. (€/j)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white outline-none font-bold focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Valeur Unit. (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white outline-none font-bold focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Emplacement dans l'entrepôt
                </label>
                <input
                  type="text"
                  placeholder="Ex: Entrepôt Principal - Allée B, Bac 14"
                  value={newItemLocation}
                  onChange={(e) => setNewItemLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Description & Accessoires
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Livré avec mallette, 2 batteries Li-Ion et lame carbure..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1e233b]">
                <button
                  type="button"
                  onClick={() => setShowManualAddModal(false)}
                  className="py-2 px-3 rounded-lg border border-[#232842] text-slate-300 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Ajouter au stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Rental Departure from Desktop */}
      {showDepartureModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e111d] border border-[#232842] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e233b]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
                Enregistrer une Sortie de Location
              </h3>
              <button
                type="button"
                onClick={() => setShowDepartureModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDesktopDepartureSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Matériel à expédier *
                </label>
                <select
                  required
                  value={depItemId}
                  onChange={(e) => setDepItemId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white outline-none focus:border-amber-500"
                >
                  <option value="">-- Choisir un matériel --</option>
                  {safeItems
                    .filter((i) => i.availableQuantity > 0)
                    .map((item) => (
                      <option key={item.id} value={item.id} className="bg-[#121524]">
                        {item.name} ({item.availableQuantity} dispo - SKU: {item.sku})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={depQty}
                    onChange={(e) => setDepQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white font-bold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Date de retour prévue *
                  </label>
                  <input
                    type="date"
                    required
                    value={depExpectedDate}
                    onChange={(e) => setDepExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Client / Entreprise / Chantier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Agence Lumière / Chantier Tour Défense"
                  value={depClientName}
                  onChange={(e) => setDepClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white placeholder-slate-500 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Contact Client
                  </label>
                  <input
                    type="text"
                    placeholder="Tél ou email"
                    value={depClientContact}
                    onChange={(e) => setDepClientContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Lieu d'utilisation
                  </label>
                  <input
                    type="text"
                    placeholder="Ville, quai..."
                    value={depDestination}
                    onChange={(e) => setDepDestination(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Notes & Accessoires inclus
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Fourni avec câbles et chargeur rapide..."
                  value={depNotes}
                  onChange={(e) => setDepNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#232842] bg-[#121524] text-white placeholder-slate-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1e233b]">
                <button
                  type="button"
                  onClick={() => setShowDepartureModal(false)}
                  className="py-2 px-3 rounded-lg border border-[#232842] text-slate-300 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDep}
                  className="py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {isSubmittingDep ? "Validation..." : "Valider la Sortie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Offline Sync Queue Details & Controls Modal */}
      <SyncQueueModal
        isOpen={showSyncQueueModal}
        onClose={() => setShowSyncQueueModal(false)}
        queue={offlineQueue}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={onToggleSimulatedOffline}
        onSyncAll={onSyncOfflineQueue}
        onRemoveItem={onRemoveQueueItem}
        onClearQueue={onClearQueue}
        isSyncing={isSyncing}
        lastPingTime={lastPingTime}
        onCheckConnection={onCheckConnection}
      />

      {/* Invoice / Quote AI Scanner Modal */}
      <InvoiceScannerModal
        isOpen={showInvoiceScannerModal}
        onClose={() => setShowInvoiceScannerModal(false)}
        onItemsImported={async () => {
          if (onRefreshData) {
            await onRefreshData();
          } else if (onRefresh) {
            onRefresh();
          }
          showToast("success", "Matériel extrait de la facture importé avec succès !");
        }}
      />

      {/* Global Command Palette (Spotlight Search ⌘K) */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        items={items}
        studios={studios}
        technicians={technicians}
        quotes={quotes}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenItemDetail={(item) => onOpenItemDetail(item)}
        onOpenManualAdd={() => setShowManualAddModal(true)}
        onOpenInvoiceScanner={() => setShowInvoiceScannerModal(true)}
        onOpenDeparture={() => setShowDepartureModal(true)}
      />

      {/* Subscription Plan Upgrade & Pricing Modal */}
      <PlanUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentSubscription={settings.subscription}
        recommendedTier={upgradeTargetTier}
        onPlanChanged={async (updatedConfig) => {
          await onUpdateSettings({
            subscription: updatedConfig,
          });
          showToast(
            "success",
            `Formule KROMA mise à jour avec succès : ${updatedConfig.tier.toUpperCase()} (${
              updatedConfig.billingCycle === "annual" ? "Annuel" : "Mensuel"
            })`
          );
          if (onRefreshData) {
            await onRefreshData();
          } else if (onRefresh) {
            onRefresh();
          }
        }}
      />
    </div>
  );
};
