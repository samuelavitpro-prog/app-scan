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
} from "lucide-react";
import {
  InventoryItem,
  RentalMovement,
  ActivityLog,
  WarehouseStats,
  AppSettings,
  Employee,
  ConnectedDevice,
} from "../types";
import { SettingsDashboard } from "./SettingsDashboard";

interface DesktopDashboardProps {
  items: InventoryItem[];
  rentals: RentalMovement[];
  logs: ActivityLog[];
  stats: WarehouseStats;
  settings: AppSettings;
  employees: Employee[];
  devices: ConnectedDevice[];
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
  onRefresh?: () => void;
  isSyncing: boolean;
  driveSyncInfo: any;
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  items,
  rentals,
  logs,
  stats,
  settings,
  employees,
  devices,
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
  onRefresh,
  isSyncing,
  driveSyncInfo,
}) => {
  const [activeTab, setActiveTab] = useState<"inventory" | "rentals" | "logs" | "cloud" | "settings">("inventory");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "rented" | "low-stock">("all");
  const [showManualAddModal, setShowManualAddModal] = useState<boolean>(false);
  const [showDepartureModal, setShowDepartureModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

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

  // Filter items
  const filteredItems = items.filter((item) => {
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

  const categories = Array.from(new Set(items.map((i) => i.category)));

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
    } catch (err: any) {
      showToast("error", "Erreur serveur : " + err.message);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // CSV Generator function for complete and customized exports
  const handleGenerateAndDownloadCSV = (targetScope: "all" | "filtered" | "selected" = exportScope) => {
    let datasetToExport: InventoryItem[] = [];

    if (targetScope === "selected" && selectedItemIds.length > 0) {
      datasetToExport = items.filter((i) => selectedItemIds.includes(i.id));
    } else if (targetScope === "filtered") {
      datasetToExport = filteredItems;
    } else {
      datasetToExport = items;
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

  return (
    <div id="desktop-dashboard" className="w-full flex flex-col space-y-6">
      {/* Toast feedback banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg transition-all animate-bounce ${
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

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Total Stock & References */}
        <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] hover:border-[#2e3658] shadow-sm flex flex-col justify-between transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Catalogue & Pièces
            </span>
            <div className="p-2 rounded-xl bg-indigo-950/70 border border-indigo-500/20 text-indigo-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white">
              {stats.totalStockItems}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">
              en {stats.totalProducts} réf.
            </span>
          </div>
        </div>

        {/* KPI 2: Available Stock in Real-Time */}
        <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] hover:border-emerald-500/30 shadow-sm flex flex-col justify-between transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Disponible en Rayon
            </span>
            <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-400">
              {stats.totalAvailable}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">
              unités prêtes
            </span>
          </div>
        </div>

        {/* KPI 3: Out on Rent / Movement */}
        <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] hover:border-amber-500/30 shadow-sm flex flex-col justify-between transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              En Location / Sortie
            </span>
            <div className="p-2 rounded-xl bg-amber-950/70 border border-amber-500/20 text-amber-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-400">
              {stats.totalRented}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">
              sur {stats.activeRentalsCount} chantiers
            </span>
          </div>
        </div>

        {/* KPI 4: Overdue & Low Stock Alerts */}
        <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] hover:border-rose-500/30 shadow-sm flex flex-col justify-between transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Alertes Logistique
            </span>
            <div className="p-2 rounded-xl bg-rose-950/70 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">
              {stats.overdueCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              retards • {stats.lowStockCount} bas
            </span>
          </div>
        </div>

        {/* KPI 5: Total Value Asset */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] hover:border-indigo-500/30 shadow-sm flex flex-col justify-between transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Valeur du Parc
            </span>
            <div className="p-2 rounded-xl bg-[#171c2e] text-slate-300">
              <Euro className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-white">
              {stats.totalInventoryValue.toLocaleString("fr-FR")} €
            </span>
          </div>
        </div>
      </div>

      {/* Main Desktop Tabs & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1e233b] pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            id="desktop-tab-inventory"
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "inventory"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-[#111422] border border-[#20253c] text-slate-300 hover:text-white hover:bg-[#181d30]"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Inventaire & Stock ({items.length})
          </button>

          <button
            id="desktop-tab-rentals"
            type="button"
            onClick={() => setActiveTab("rentals")}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "rentals"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-[#111422] border border-[#20253c] text-slate-300 hover:text-white hover:bg-[#181d30]"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Suivi Locations & Retours
            {stats.activeRentalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                {stats.activeRentalsCount}
              </span>
            )}
          </button>

          <button
            id="desktop-tab-logs"
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "logs"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-[#111422] border border-[#20253c] text-slate-300 hover:text-white hover:bg-[#181d30]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Journal Scans Temps Réel ({logs.length})
          </button>

          <button
            id="desktop-tab-cloud"
            type="button"
            onClick={() => setActiveTab("cloud")}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "cloud"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-[#111422] border border-[#20253c] text-slate-300 hover:text-white hover:bg-[#181d30]"
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            Google Drive & Sync Cloud
          </button>

          <button
            id="desktop-tab-settings"
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-[#111422] border border-[#20253c] text-slate-300 hover:text-white hover:bg-[#181d30]"
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            Paramètres, IA & Équipe
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Main CSV Export Button in Dashboard Header */}
          <button
            id="desktop-export-csv-btn"
            type="button"
            onClick={() => setShowExportModal(true)}
            className="py-2 px-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            title="Exporter l'inventaire en fichier CSV pour Excel / Tableur"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Exporter CSV
          </button>

          <button
            type="button"
            onClick={onOpenMobileView}
            className="py-2 px-3 rounded-xl border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mode Scanner Mobile (IA)
          </button>

          <button
            type="button"
            onClick={() => setShowManualAddModal(true)}
            className="py-2 px-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau Produit
          </button>
        </div>
      </div>

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
                            <button type="button" className="text-slate-400 hover:text-white">
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
      {/* TAB 2: ACTIVE RENTALS & MOVEMENTS LEDGER */}
      {/* ========================================================= */}
      {activeTab === "rentals" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e111d] p-4 rounded-2xl border border-[#1e233b]">
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
                Dossiers de Location & Mouvements de Sortie
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Suivi en temps réel des expéditions chantiers et des retours en stock
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportRentalsCSV}
                className="py-2 px-3 rounded-xl border border-[#232842] bg-[#121524] text-slate-300 hover:text-white hover:bg-[#181c30] text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                Exporter CSV
              </button>

              <button
                type="button"
                onClick={() => setShowDepartureModal(true)}
                className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Nouvelle Sortie
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {rentals.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-[#0e111d] rounded-2xl border border-[#1e233b]">
                Aucun mouvement de location enregistré.
              </div>
            ) : (
              rentals.map((rental) => {
                const isOverdue = rental.status === "overdue";
                const isReturned = rental.status === "returned";

                return (
                  <div
                    key={rental.id}
                    className={`p-4 rounded-2xl border bg-[#0e111d] transition shadow-sm ${
                      isOverdue
                        ? "border-rose-800/60 bg-rose-950/10"
                        : isReturned
                        ? "border-[#1e233b] opacity-75"
                        : "border-amber-800/50 bg-amber-950/10"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Item and Client Info */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${
                            isReturned
                              ? "bg-[#181d30] text-slate-400"
                              : isOverdue
                              ? "bg-rose-950/70 text-rose-400 border border-rose-800/40"
                              : "bg-amber-950/70 text-amber-400 border border-amber-800/40"
                          }`}
                        >
                          {isReturned ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-white">
                              {rental.itemName}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-[#181d30] border border-[#232842] font-bold text-xs text-slate-300">
                              Quantité : x{rental.quantity}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isReturned
                                  ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50"
                                  : isOverdue
                                  ? "bg-rose-950/70 text-rose-300 border border-rose-800/50"
                                  : "bg-amber-950/70 text-amber-300 border border-amber-800/50"
                              }`}
                            >
                              {isReturned
                                ? "Clôturé / Retourné"
                                : isOverdue
                                ? "⚠️ En Retard"
                                : "En cours d'utilisation"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span>Client : <strong className="text-slate-200">{rental.clientName}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              <span>{rental.destination || "Non précisé"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>
                                Retour prévu :{" "}
                                <strong className={isOverdue ? "text-rose-400 font-bold" : "text-slate-200"}>
                                  {new Date(rental.expectedReturnDate).toLocaleDateString("fr-FR")}
                                </strong>
                              </span>
                            </div>
                          </div>

                          {rental.returnNotes && (
                            <p className="text-[11px] text-slate-400 mt-1 italic">
                              Note de retour : {rental.returnNotes} ({rental.returnCondition})
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Return Button for Active Rentals */}
                      {!isReturned && (
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            type="button"
                            onClick={() => handleQuickCloseRental(rental)}
                            className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Valider le Retour Matériel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
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
          onUpdateSettings={onUpdateSettings}
          onAddEmployee={onAddEmployee}
          onUpdateEmployee={onUpdateEmployee}
          onDeleteEmployee={onDeleteEmployee}
          onRevokeDevice={onRevokeDevice}
          onRegisterDevice={onRegisterDevice}
          onTriggerDriveSync={onTriggerDriveSync}
          isSyncing={isSyncing}
        />
      )}

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
                  {items
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
    </div>
  );
};
