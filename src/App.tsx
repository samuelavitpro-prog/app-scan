import React, { useEffect, useState, useCallback } from "react";
import {
  Package,
  Layers,
  Smartphone,
  Monitor,
  Sparkles,
  RefreshCw,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Sliders,
  Columns,
  Moon,
  Sun,
  Radio,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  InventoryItem,
  RentalMovement,
  ActivityLog,
  WarehouseStats,
  AppMode,
  AppSettings,
  Employee,
  ConnectedDevice,
  QueuedOfflineAction,
} from "./types";
import { DesktopDashboard } from "./components/DesktopDashboard";
import { MobileScanner } from "./components/MobileScanner";
import { ItemDetailModal } from "./components/ItemDetailModal";
import { PhonePairingModal } from "./components/PhonePairingModal";
import { playScanSuccessSound } from "./utils/audio";
import {
  getStoredQueue,
  saveStoredQueue,
  getStoredSimulatedOffline,
  setStoredSimulatedOffline,
  enqueueOfflineAction,
  removeQueueAction,
  clearAllQueuedActions,
} from "./utils/offlineQueue";

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [rentals, setRentals] = useState<RentalMovement[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    companyName: "StockVision IA & Logistique",
    warehouseName: "Hub Central Paris-Nord",
    currency: "EUR (€)",
    cloudAI: {
      aiProvider: "gemini",
      modelName: "gemini-3.7-flash",
      visionQuality: "high",
      autoFillConfidenceThreshold: 0.85,
      cloudSyncFrequency: "instant",
      cloudStorageProvider: "google_drive",
      autoBackupEnabled: true,
      apiKeyConfigured: true,
      aiPromptContext: "Spécialisé dans le matériel audiovisuel, l'outillage professionnel et l'événementiel.",
    },
    defaultDailyRentalRatio: 0.08,
    autoOverdueAlerts: true,
  });

  const [stats, setStats] = useState<WarehouseStats>({
    totalProducts: 0,
    totalStockItems: 0,
    totalAvailable: 0,
    totalRented: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    activeRentalsCount: 0,
    overdueCount: 0,
    occupancyRate: 0,
  });

  const [appMode, setAppMode] = useState<AppMode>("desktop");
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<InventoryItem | null>(null);
  const [showPairingModal, setShowPairingModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [driveSyncInfo, setDriveSyncInfo] = useState<any>(null);
  const [livePulse, setLivePulse] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Connectivity & Offline Queue States
  const [offlineQueue, setOfflineQueue] = useState<QueuedOfflineAction[]>([]);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastPingTime, setLastPingTime] = useState<string>(new Date().toISOString());

  // Initialize offline queue and simulation flags from localStorage
  useEffect(() => {
    const queue = getStoredQueue();
    setOfflineQueue(queue);
    const simulated = getStoredSimulatedOffline();
    setIsSimulatedOffline(simulated);
    if (simulated) {
      setIsOnline(false);
    } else if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }
  }, []);

  // Ping connection check function
  const checkConnection = useCallback(async () => {
    if (isSimulatedOffline) {
      setIsOnline(false);
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("/api/ping", { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.status === "ok") {
        setIsOnline(true);
        setLastPingTime(new Date().toISOString());
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
    }
  }, [isSimulatedOffline]);

  // Online / Offline window listeners & periodic heartbeat
  useEffect(() => {
    const handleOnlineEvent = () => {
      if (!isSimulatedOffline) {
        setIsOnline(true);
        checkConnection();
        triggerLiveNotification("Connexion Internet rétablie.");
      }
    };

    const handleOfflineEvent = () => {
      setIsOnline(false);
      triggerLiveNotification("Connexion perdue : Passage en mode hors-ligne.");
    };

    window.addEventListener("online", handleOnlineEvent);
    window.addEventListener("offline", handleOfflineEvent);

    const interval = setInterval(() => {
      checkConnection();
    }, 15000);

    return () => {
      window.removeEventListener("online", handleOnlineEvent);
      window.removeEventListener("offline", handleOfflineEvent);
      clearInterval(interval);
    };
  }, [isSimulatedOffline, checkConnection]);

  // Recalculate stats locally when items/rentals change
  const computeLocalStats = (currentItems: InventoryItem[], currentRentals: RentalMovement[]) => {
    const totalProducts = currentItems.length;
    const totalStockItems = currentItems.reduce((acc, i) => acc + (i.totalQuantity || 0), 0);
    const totalAvailable = currentItems.reduce((acc, i) => acc + (i.availableQuantity || 0), 0);
    const totalRented = currentItems.reduce((acc, i) => acc + (i.rentedQuantity || 0), 0);
    const totalInventoryValue = currentItems.reduce((acc, i) => acc + (i.unitPrice || 0) * (i.totalQuantity || 1), 0);
    const lowStockCount = currentItems.filter((i) => i.availableQuantity <= (i.minStockAlert || 2)).length;
    const activeRentalsCount = currentRentals.filter((r) => r.status === "active" || r.status === "overdue").length;
    const overdueCount = currentRentals.filter(
      (r) => r.status === "overdue" || (r.status === "active" && new Date(r.expectedReturnDate) < new Date())
    ).length;
    const occupancyRate = totalStockItems > 0 ? Math.round((totalRented / totalStockItems) * 100) : 0;

    setStats({
      totalProducts,
      totalStockItems,
      totalAvailable,
      totalRented,
      totalInventoryValue,
      lowStockCount,
      activeRentalsCount,
      overdueCount,
      occupancyRate,
    });
  };

  // Toggle Simulated Offline
  const handleToggleSimulatedOffline = () => {
    const next = !isSimulatedOffline;
    setIsSimulatedOffline(next);
    setStoredSimulatedOffline(next);
    if (next) {
      setIsOnline(false);
      triggerLiveNotification("Mode Déconnecté simulé activé.");
    } else {
      const realOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
      setIsOnline(realOnline);
      if (realOnline) checkConnection();
      triggerLiveNotification("Mode Simulation désactivé : Retour en ligne.");
    }
  };

  // Remove single action from queue
  const handleRemoveQueueItem = (id: string) => {
    const updated = removeQueueAction(id);
    setOfflineQueue(updated);
    triggerLiveNotification("Élément retiré de la file de synchronisation.");
  };

  // Clear entire queue
  const handleClearQueue = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vider toute la file d'attente hors-ligne ?")) {
      clearAllQueuedActions();
      setOfflineQueue([]);
      triggerLiveNotification("File d'attente vidée.");
    }
  };

  // Batch Sync Offline Queue with Server
  const handleSyncOfflineQueue = async (): Promise<void> => {
    const queue = getStoredQueue();
    if (queue.length === 0) {
      triggerLiveNotification("Aucun changement en attente dans la file.");
      return;
    }

    if (!isOnline) {
      triggerLiveNotification("Impossible de synchroniser : Vous êtes actuellement hors-ligne.");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync/batch-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: queue }),
      });
      const data = await res.json();
      if (data.success) {
        clearAllQueuedActions();
        setOfflineQueue([]);
        if (data.items) setItems(data.items);
        if (data.rentals) setRentals(data.rentals);
        if (data.stats) setStats(data.stats);
        triggerLiveNotification(
          `${data.processedCount || queue.length} changement(s) synchronisé(s) avec succès avec le serveur !`
        );
      } else {
        triggerLiveNotification("Erreur lors de la synchronisation de la file.");
      }
    } catch (err: any) {
      triggerLiveNotification("Erreur de connexion lors de la synchronisation : " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Check URL param for mobile mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "mobile") {
        setAppMode("mobile-scanner");
      }
    }
  }, []);

  // Fetch all initial data
  const fetchData = async () => {
    if (!isOnline && !isSimulatedOffline) {
      return;
    }
    setIsSyncing(true);
    try {
      const [itemsRes, rentalsRes, logsRes, statsRes, employeesRes, devicesRes, settingsRes] = await Promise.all([
        fetch("/api/inventory").then((r) => r.json()),
        fetch("/api/rentals").then((r) => r.json()),
        fetch("/api/logs").then((r) => r.json()),
        fetch("/api/stats").then((r) => r.json()),
        fetch("/api/employees").then((r) => r.json()),
        fetch("/api/devices").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
      ]);

      if (itemsRes.items) setItems(itemsRes.items);
      if (rentalsRes.rentals) setRentals(rentalsRes.rentals);
      if (logsRes.logs) setLogs(logsRes.logs);
      if (statsRes) setStats(statsRes);
      if (employeesRes.employees) setEmployees(employeesRes.employees);
      if (devicesRes.devices) setDevices(devicesRes.devices);
      if (settingsRes.settings) setSettings(settingsRes.settings);
      setIsOnline(true);
      setLastPingTime(new Date().toISOString());
    } catch (err) {
      console.warn("Could not fetch remote data (offline mode active):", err);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup SSE stream for Real-Time Sync across Mobile and Desktop
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/sync/stream");

      eventSource.addEventListener("inventory_item_added", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setItems((prev) => [data.payload, ...prev.filter((i) => i.id !== data.payload.id)]);
        triggerLiveNotification(`Nouveau produit indexé : ${data.payload.name}`);
        fetchStats();
      });

      eventSource.addEventListener("inventory_item_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setItems((prev) => prev.map((i) => (i.id === data.payload.id ? data.payload : i)));
        fetchStats();
      });

      eventSource.addEventListener("inventory_item_deleted", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setItems((prev) => prev.filter((i) => i.id !== data.payload.id));
        fetchStats();
      });

      eventSource.addEventListener("rental_checkout_created", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setRentals((prev) => [data.payload.rental, ...prev]);
        if (data.payload.item) {
          setItems((prev) => prev.map((i) => (i.id === data.payload.item.id ? data.payload.item : i)));
        }
        triggerLiveNotification(`Sortie validée : ${data.payload.rental.itemName} pour ${data.payload.rental.clientName}`);
        fetchStats();
      });

      eventSource.addEventListener("rental_checkin_completed", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setRentals((prev) => prev.map((r) => (r.id === data.payload.rental.id ? data.payload.rental : r)));
        if (data.payload.updatedItem) {
          setItems((prev) => prev.map((i) => (i.id === data.payload.updatedItem.id ? data.payload.updatedItem : i)));
        }
        triggerLiveNotification(`Retour validé : ${data.payload.rental.itemName} réintégré au stock`);
        fetchStats();
      });

      eventSource.addEventListener("activity_logged", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setLogs((prev) => [data.payload, ...prev.slice(0, 99)]);
      });

      eventSource.addEventListener("drive_synced", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setDriveSyncInfo(data.payload);
      });

      eventSource.addEventListener("employees_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setEmployees(data.payload);
      });

      eventSource.addEventListener("devices_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setDevices(data.payload);
      });

      eventSource.addEventListener("settings_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setSettings(data.payload);
      });
    } catch (err) {
      console.warn("SSE connection error:", err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const fetchStats = async () => {
    try {
      const statsRes = await fetch("/api/stats").then((r) => r.json());
      if (statsRes) setStats(statsRes);
    } catch {
      // Ignore
    }
  };

  const triggerLiveNotification = (text: string) => {
    playScanSuccessSound();
    setLivePulse(text);
    setTimeout(() => {
      setLivePulse(null);
    }, 4500);
  };

  // Handlers for Settings & Employees & Devices (with offline support)
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    if (!isOnline) {
      enqueueOfflineAction("UPDATE_SETTINGS", "Mise à jour des paramètres généraux & IA", newSettings);
      setOfflineQueue(getStoredQueue());
      setSettings((prev) => ({ ...prev, ...newSettings }));
      triggerLiveNotification("Mode déconnecté : Paramètres enregistrés localement dans la file.");
      return true;
    }
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        triggerLiveNotification("Paramètres IA & Cloud enregistrés !");
        return true;
      }
      return false;
    } catch {
      enqueueOfflineAction("UPDATE_SETTINGS", "Mise à jour des paramètres généraux & IA", newSettings);
      setOfflineQueue(getStoredQueue());
      setSettings((prev) => ({ ...prev, ...newSettings }));
      setIsOnline(false);
      triggerLiveNotification("Réseau indisponible : Paramètres enregistrés en file locale.");
      return true;
    }
  };

  const handleAddEmployee = async (employee: Partial<Employee>): Promise<boolean> => {
    if (!isOnline) {
      const offlineEmp: Employee = {
        id: employee.id || `emp-${Date.now()}`,
        name: employee.name || "Nouvel Employé",
        email: employee.email || "",
        role: employee.role || "Opérateur Scan",
        status: "active",
        lastActive: new Date().toISOString(),
        assignedWarehouse: employee.assignedWarehouse || "Hub Central",
        permissions: employee.permissions || {
          canScanIn: true,
          canScanOut: true,
          canEditInventory: false,
          canManageRoles: false,
          canManageCloud: false,
        },
      };
      enqueueOfflineAction("ADD_EMPLOYEE", `Ajout employé: ${offlineEmp.name}`, offlineEmp);
      setOfflineQueue(getStoredQueue());
      setEmployees((prev) => [offlineEmp, ...prev]);
      triggerLiveNotification(`Mode déconnecté : Employé ${offlineEmp.name} enregistré dans la file.`);
      return true;
    }
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
      const data = await res.json();
      if (data.success) {
        setEmployees((prev) => [data.employee, ...prev]);
        triggerLiveNotification(`Employé ajouté : ${data.employee.name} (${data.employee.role})`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>): Promise<boolean> => {
    if (!isOnline) {
      enqueueOfflineAction("UPDATE_EMPLOYEE", `Modification employé ${id}`, { id, ...updates });
      setOfflineQueue(getStoredQueue());
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      triggerLiveNotification("Mode déconnecté : Rôle mis à jour dans la file.");
      return true;
    }
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setEmployees((prev) => prev.map((e) => (e.id === id ? data.employee : e)));
        triggerLiveNotification("Rôle employé mis à jour !");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDeleteEmployee = async (id: string): Promise<boolean> => {
    if (!window.confirm("Êtes-vous sûr de vouloir retirer cet employé de l'équipe ?")) return false;
    if (!isOnline) {
      enqueueOfflineAction("DELETE_EMPLOYEE", `Suppression employé ${id}`, { id });
      setOfflineQueue(getStoredQueue());
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      triggerLiveNotification("Mode déconnecté : Suppression mise en attente.");
      return true;
    }
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        triggerLiveNotification("Employé retiré de la liste");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleRevokeDevice = async (id: string): Promise<boolean> => {
    if (!window.confirm("Voulez-vous déconnecter et révoquer l'accès de cet appareil ?")) return false;
    try {
      const res = await fetch(`/api/devices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDevices((prev) => prev.filter((d) => d.id !== id));
        triggerLiveNotification("Appareil déconnecté et révoqué.");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleRegisterDevice = async (device: Partial<ConnectedDevice>): Promise<boolean> => {
    try {
      const res = await fetch("/api/devices/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(device),
      });
      const data = await res.json();
      if (data.success) {
        setDevices((prev) => [...prev, data.device]);
        triggerLiveNotification(`Appareil appairé : ${data.device.name}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Handlers for CRUD & Logistics (Fully wired with Offline Queue & Optimistic Updates)
  const handleAddNewItem = async (newItem: Partial<InventoryItem>): Promise<boolean> => {
    const fullItem: InventoryItem = {
      id: newItem.id || `item-${Date.now()}`,
      sku: newItem.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newItem.name || "Nouveau Produit Non Nommé",
      category: newItem.category || "Général",
      brand: newItem.brand || "Marque non spécifiée",
      model: newItem.model || "",
      serialNumber: newItem.serialNumber || "",
      description: newItem.description || "",
      totalQuantity: Number(newItem.totalQuantity ?? 1),
      availableQuantity: Number(newItem.availableQuantity ?? newItem.totalQuantity ?? 1),
      rentedQuantity: 0,
      minStockAlert: Number(newItem.minStockAlert ?? 2),
      unitPrice: Number(newItem.unitPrice ?? 0),
      rentalRatePerDay: Number(newItem.rentalRatePerDay ?? 15),
      location: newItem.location || "Entrepôt Principal - Réception",
      condition: newItem.condition || "Très bon état",
      imageUrl: newItem.imageUrl || "",
      barcode: newItem.barcode || newItem.sku || `BC-${Date.now().toString().slice(-6)}`,
      tags: Array.isArray(newItem.tags) ? newItem.tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiConfidence: newItem.aiConfidence || 0.9,
      aiAnalysisNotes: newItem.aiAnalysisNotes || "Ajouté depuis l'application.",
    };

    if (!isOnline) {
      enqueueOfflineAction("ADD_ITEM", `Création: ${fullItem.name} (${fullItem.sku})`, fullItem);
      setOfflineQueue(getStoredQueue());
      const updatedItems = [fullItem, ...items];
      setItems(updatedItems);
      computeLocalStats(updatedItems, rentals);
      triggerLiveNotification(`Mode Déconnecté : "${fullItem.name}" enregistré dans la file.`);
      return true;
    }

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullItem),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => [data.item, ...prev]);
        fetchStats();
        return true;
      }
      return false;
    } catch {
      // Fallback to offline queue on network error
      enqueueOfflineAction("ADD_ITEM", `Création: ${fullItem.name} (${fullItem.sku})`, fullItem);
      setOfflineQueue(getStoredQueue());
      const updatedItems = [fullItem, ...items];
      setItems(updatedItems);
      computeLocalStats(updatedItems, rentals);
      setIsOnline(false);
      triggerLiveNotification(`Réseau coupé : "${fullItem.name}" sauvegardé en file d'attente.`);
      return true;
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<InventoryItem>): Promise<boolean> => {
    if (!isOnline) {
      enqueueOfflineAction("UPDATE_ITEM", `Mise à jour: ${updates.name || `Article #${id}`}`, { itemId: id, updates });
      setOfflineQueue(getStoredQueue());
      const updatedItems = items.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i));
      setItems(updatedItems);
      computeLocalStats(updatedItems, rentals);
      triggerLiveNotification("Mode Déconnecté : Modification mise en file d'attente.");
      return true;
    }

    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => prev.map((i) => (i.id === id ? data.item : i)));
        fetchStats();
        return true;
      }
      return false;
    } catch {
      enqueueOfflineAction("UPDATE_ITEM", `Mise à jour: ${updates.name || `Article #${id}`}`, { itemId: id, updates });
      setOfflineQueue(getStoredQueue());
      const updatedItems = items.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i));
      setItems(updatedItems);
      computeLocalStats(updatedItems, rentals);
      setIsOnline(false);
      triggerLiveNotification("Réseau indisponible : Modification enregistrée localement.");
      return true;
    }
  };

  const handleDeleteItem = async (id: string): Promise<boolean> => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cet équipement du catalogue ?")) {
      return false;
    }

    const item = items.find((i) => i.id === id);
    const itemName = item?.name || `Article #${id}`;

    if (!isOnline) {
      enqueueOfflineAction("DELETE_ITEM", `Suppression: ${itemName}`, { id });
      setOfflineQueue(getStoredQueue());
      const updatedItems = items.filter((i) => i.id !== id);
      setItems(updatedItems);
      computeLocalStats(updatedItems, rentals);
      triggerLiveNotification(`Mode Déconnecté : Suppression de "${itemName}" mise en attente.`);
      return true;
    }

    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        fetchStats();
        return true;
      }
      return false;
    } catch {
      enqueueOfflineAction("DELETE_ITEM", `Suppression: ${itemName}`, { id });
      setOfflineQueue(getStoredQueue());
      const updatedItems = items.filter((i) => i.id !== id);
      setItems(updatedItems);
      computeLocalStats(updatedItems, rentals);
      setIsOnline(false);
      triggerLiveNotification(`Réseau coupé : Suppression de "${itemName}" enregistrée en file.`);
      return true;
    }
  };

  const handleBatchDelete = async (ids: string[]): Promise<boolean> => {
    if (ids.length === 0) return false;

    if (!isOnline) {
      enqueueOfflineAction("BATCH_DELETE", `Suppression groupée de ${ids.length} articles`, { ids });
      setOfflineQueue(getStoredQueue());
      const updatedItems = items.filter((i) => !ids.includes(i.id));
      setItems(updatedItems);
      computeLocalStats(updatedItems, rentals);
      triggerLiveNotification(`Mode Déconnecté : Suppression de ${ids.length} articles mise en attente.`);
      return true;
    }

    try {
      const res = await fetch("/api/inventory/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
        fetchStats();
        return true;
      }
      return false;
    } catch {
      enqueueOfflineAction("BATCH_DELETE", `Suppression groupée de ${ids.length} articles`, { ids });
      setOfflineQueue(getStoredQueue());
      const updatedItems = items.filter((i) => !ids.includes(i.id));
      setItems(updatedItems);
      computeLocalStats(updatedItems, rentals);
      setIsOnline(false);
      triggerLiveNotification("Réseau indisponible : Suppression groupée enregistrée dans la file.");
      return true;
    }
  };

  const handleRentalCheckout = async (checkoutData: any): Promise<boolean> => {
    const targetItem = items.find((i) => i.id === checkoutData.itemId || i.sku === checkoutData.sku);
    const itemName = targetItem?.name || "Matériel";
    const qty = Number(checkoutData.quantity || 1);

    if (!isOnline) {
      const offlineRental: RentalMovement = {
        id: `rent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemId: targetItem?.id || checkoutData.itemId,
        itemName,
        itemSku: targetItem?.sku || checkoutData.sku || "SKU-LOC",
        itemImage: targetItem?.imageUrl,
        type: "out",
        quantity: qty,
        clientName: checkoutData.clientName || "Client",
        clientContact: checkoutData.clientContact || "",
        destination: checkoutData.destination || "Chantier",
        departureDate: new Date().toISOString(),
        expectedReturnDate: checkoutData.expectedReturnDate || new Date(Date.now() + 86400000 * 3).toISOString(),
        status: "active",
        scannedBy: checkoutData.user || "Opérateur Mode Hors-Ligne",
        dailyRate: targetItem?.rentalRatePerDay || 15,
        notes: checkoutData.notes || "Sortie enregistrée en mode déconnecté.",
      };

      enqueueOfflineAction(
        "RENTAL_CHECKOUT",
        `Sortie Chantier: ${qty}x ${itemName} pour ${checkoutData.clientName}`,
        checkoutData
      );
      setOfflineQueue(getStoredQueue());

      const updatedRentals = [offlineRental, ...rentals];
      const updatedItems = items.map((i) =>
        i.id === targetItem?.id
          ? {
              ...i,
              availableQuantity: Math.max(0, i.availableQuantity - qty),
              rentedQuantity: (i.rentedQuantity || 0) + qty,
            }
          : i
      );

      setRentals(updatedRentals);
      setItems(updatedItems);
      computeLocalStats(updatedItems, updatedRentals);
      triggerLiveNotification(`Mode Déconnecté : Sortie de "${itemName}" enregistrée en file.`);
      return true;
    }

    try {
      const res = await fetch("/api/rentals/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutData),
      });
      const data = await res.json();
      if (data.success) {
        if (data.rental) setRentals((prev) => [data.rental, ...prev]);
        if (data.updatedItem) {
          setItems((prev) => prev.map((i) => (i.id === data.updatedItem.id ? data.updatedItem : i)));
        }
        fetchStats();
        return true;
      }
      return false;
    } catch {
      enqueueOfflineAction(
        "RENTAL_CHECKOUT",
        `Sortie Chantier: ${qty}x ${itemName} pour ${checkoutData.clientName}`,
        checkoutData
      );
      setOfflineQueue(getStoredQueue());
      setIsOnline(false);
      triggerLiveNotification(`Réseau indisponible : Sortie de "${itemName}" enregistrée en file.`);
      return true;
    }
  };

  const handleRentalCheckin = async (checkinData: any): Promise<boolean> => {
    const rental = rentals.find((r) => r.id === checkinData.rentalId);
    const itemName = rental?.itemName || "Matériel";

    if (!isOnline) {
      enqueueOfflineAction("RENTAL_CHECKIN", `Retour Stock: ${itemName}`, checkinData);
      setOfflineQueue(getStoredQueue());

      const updatedRentals = rentals.map((r) =>
        r.id === checkinData.rentalId
          ? ({
              ...r,
              status: "returned" as const,
              actualReturnDate: new Date().toISOString(),
              returnCondition: checkinData.returnCondition || "Bon état",
              returnNotes: checkinData.returnNotes || "Retourné hors-ligne",
            })
          : r
      );

      const updatedItems = items.map((i) =>
        i.id === rental?.itemId
          ? {
              ...i,
              availableQuantity: Math.min(i.totalQuantity, i.availableQuantity + (rental?.quantity || 1)),
              rentedQuantity: Math.max(0, (i.rentedQuantity || 0) - (rental?.quantity || 1)),
            }
          : i
      );

      setRentals(updatedRentals);
      setItems(updatedItems);
      computeLocalStats(updatedItems, updatedRentals);
      triggerLiveNotification(`Mode Déconnecté : Retour de "${itemName}" mis en file d'attente.`);
      return true;
    }

    try {
      const res = await fetch("/api/rentals/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkinData),
      });
      const data = await res.json();
      if (data.success) {
        if (data.rental) {
          setRentals((prev) => prev.map((r) => (r.id === data.rental.id ? data.rental : r)));
        }
        if (data.updatedItem) {
          setItems((prev) => prev.map((i) => (i.id === data.updatedItem.id ? data.updatedItem : i)));
        }
        fetchStats();
        return true;
      }
      return false;
    } catch {
      enqueueOfflineAction("RENTAL_CHECKIN", `Retour Stock: ${itemName}`, checkinData);
      setOfflineQueue(getStoredQueue());
      setIsOnline(false);
      triggerLiveNotification(`Réseau indisponible : Retour de "${itemName}" enregistré en file.`);
      return true;
    }
  };

  const handleTriggerDriveSync = async (): Promise<boolean> => {
    if (!isOnline) {
      triggerLiveNotification("Impossible de synchroniser Google Drive : Vous êtes en mode déconnecté.");
      return false;
    }
    setIsSyncing(true);
    try {
      const res = await fetch("/api/drive/sync-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device: appMode }),
      });
      const data = await res.json();
      if (data.success) {
        setDriveSyncInfo(data.syncSummary);
        triggerLiveNotification("Sauvegarde Google Drive terminée avec succès !");
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#07080e] text-[#e2e8f0] font-sans transition-colors selection:bg-indigo-500/30 selection:text-indigo-200">
        {/* Real-time Broadcast Toast Notification */}
        {livePulse && (
          <div className="fixed top-4 right-4 z-50 p-3.5 bg-[#0e111d]/95 text-white rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-3 animate-slide-in backdrop-blur-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <p className="text-xs font-semibold text-slate-100">{livePulse}</p>
          </div>
        )}

        {/* Global Navigation Header */}
        <header className="sticky top-0 z-40 bg-[#0a0c16]/90 backdrop-blur-xl border-b border-[#1c2035] px-4 sm:px-6 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Brand Logo & Live status */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-600/30 border border-indigo-400/20">
                <Layers className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                    StockVision <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">IA</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 text-[10px] font-bold border border-emerald-800/80 shadow-xs">
                    <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" /> Live Sync
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Inventaire par Photo IA & Suivi des Locations en Temps Réel
                </p>
              </div>
            </div>

            {/* Mode Controls: Desktop / Mobile / Split Simulator */}
            <div className="flex items-center gap-2">
              {/* Device Selector Pill */}
              <div className="flex items-center p-1 bg-[#121524] rounded-xl text-xs font-semibold border border-[#20253e]">
                <button
                  type="button"
                  onClick={() => {
                    setAppMode("desktop");
                    setIsSplitMode(false);
                  }}
                  className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition ${
                    appMode === "desktop" && !isSplitMode
                      ? "bg-indigo-600 text-white shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1e33]"
                  }`}
                  title="Vue Bureau / Dashboard Logistique"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Bureau</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAppMode("mobile-scanner");
                    setIsSplitMode(false);
                  }}
                  className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition ${
                    appMode === "mobile-scanner" && !isSplitMode
                      ? "bg-indigo-600 text-white shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1e33]"
                  }`}
                  title="Vue Scanner Mobile (Caméra & Départ/Retour)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Scanner Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSplitMode(!isSplitMode)}
                  className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 transition ${
                    isSplitMode
                      ? "bg-violet-600 text-white shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1e33]"
                  }`}
                  title="Simulateur Split : Bureau + Scanner Mobile côte à côte"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Vue Duo</span>
                </button>
              </div>

              {/* Pair Real Phone Button */}
              <button
                type="button"
                onClick={() => setShowPairingModal(true)}
                className="p-2 rounded-xl border border-[#232842] bg-[#121524] text-slate-200 hover:bg-[#181c30] hover:border-indigo-500/50 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                title="Scanner le QR Code pour ouvrir sur smartphone"
              >
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Connecter Smartphone</span>
              </button>

              {/* Refresh / Sync Button */}
              <button
                type="button"
                onClick={fetchData}
                className={`p-2 rounded-xl border border-[#232842] bg-[#121524] text-slate-300 hover:text-white hover:bg-[#181c30] transition shadow-xs ${
                  isSyncing ? "animate-spin text-indigo-400" : ""
                }`}
                title="Recharger les données"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl border border-[#232842] bg-[#121524] text-slate-300 hover:text-white hover:bg-[#181c30] transition shadow-xs"
                title="Mode thème"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="max-w-7xl mx-auto p-4 sm:p-6">
          {/* Split Mode: Desktop & Mobile Scanner in real-time side-by-side! */}
          {isSplitMode ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Mobile Scanner in realistic smartphone frame */}
              <div className="lg:col-span-4 bg-[#090b14] p-4 rounded-3xl border-2 border-[#232842] shadow-2xl">
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> Poste Mobile Opérateur
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <MobileScanner
                  items={items}
                  rentals={rentals}
                  onAddNewItem={handleAddNewItem}
                  onRentalCheckout={handleRentalCheckout}
                  onRentalCheckin={handleRentalCheckin}
                  isSyncing={isSyncing}
                  onRefresh={fetchData}
                />
              </div>

              {/* Right Column: Desktop Logistics Dashboard */}
              <div className="lg:col-span-8">
                <DesktopDashboard
                  items={items}
                  rentals={rentals}
                  logs={logs}
                  stats={stats}
                  settings={settings}
                  employees={employees}
                  devices={devices}
                  onDeleteItem={handleDeleteItem}
                  onUpdateItem={handleUpdateItem}
                  onManualAddItem={handleAddNewItem}
                  onRentalCheckout={handleRentalCheckout}
                  onRentalCheckin={handleRentalCheckin}
                  onTriggerDriveSync={handleTriggerDriveSync}
                  onOpenMobileView={() => {
                    setIsSplitMode(false);
                    setAppMode("mobile-scanner");
                  }}
                  onOpenItemDetail={(item) => setSelectedItemDetail(item)}
                  onUpdateSettings={handleUpdateSettings}
                  onAddEmployee={handleAddEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                  onRevokeDevice={handleRevokeDevice}
                  onRegisterDevice={handleRegisterDevice}
                  onRefresh={fetchData}
                  isSyncing={isSyncing}
                  driveSyncInfo={driveSyncInfo}
                  isOnline={isOnline}
                  isSimulatedOffline={isSimulatedOffline}
                  offlineQueue={offlineQueue}
                  onToggleSimulatedOffline={handleToggleSimulatedOffline}
                  onSyncOfflineQueue={handleSyncOfflineQueue}
                  onRemoveQueueItem={handleRemoveQueueItem}
                  onClearQueue={handleClearQueue}
                  onCheckConnection={checkConnection}
                  lastPingTime={lastPingTime}
                  onBatchDelete={handleBatchDelete}
                />
              </div>
            </div>
          ) : appMode === "desktop" ? (
            /* Single Desktop View */
            <DesktopDashboard
              items={items}
              rentals={rentals}
              logs={logs}
              stats={stats}
              settings={settings}
              employees={employees}
              devices={devices}
              onDeleteItem={handleDeleteItem}
              onUpdateItem={handleUpdateItem}
              onManualAddItem={handleAddNewItem}
              onRentalCheckout={handleRentalCheckout}
              onRentalCheckin={handleRentalCheckin}
              onTriggerDriveSync={handleTriggerDriveSync}
              onOpenMobileView={() => setAppMode("mobile-scanner")}
              onOpenItemDetail={(item) => setSelectedItemDetail(item)}
              onUpdateSettings={handleUpdateSettings}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onRevokeDevice={handleRevokeDevice}
              onRegisterDevice={handleRegisterDevice}
              onRefresh={fetchData}
              isSyncing={isSyncing}
              driveSyncInfo={driveSyncInfo}
              isOnline={isOnline}
              isSimulatedOffline={isSimulatedOffline}
              offlineQueue={offlineQueue}
              onToggleSimulatedOffline={handleToggleSimulatedOffline}
              onSyncOfflineQueue={handleSyncOfflineQueue}
              onRemoveQueueItem={handleRemoveQueueItem}
              onClearQueue={handleClearQueue}
              onCheckConnection={checkConnection}
              lastPingTime={lastPingTime}
              onBatchDelete={handleBatchDelete}
            />
          ) : (
            /* Single Mobile Scanner View */
            <div className="max-w-md mx-auto">
              <MobileScanner
                items={items}
                rentals={rentals}
                onAddNewItem={handleAddNewItem}
                onRentalCheckout={handleRentalCheckout}
                onRentalCheckin={handleRentalCheckin}
                isSyncing={isSyncing}
                onRefresh={fetchData}
              />
            </div>
          )}
        </main>

        {/* Item Detail & Printable QR Modal */}
        {selectedItemDetail && (
          <ItemDetailModal
            item={selectedItemDetail}
            rentals={rentals}
            onClose={() => setSelectedItemDetail(null)}
            onUpdateItem={handleUpdateItem}
          />
        )}

        {/* Mobile Phone Pairing Modal */}
        {showPairingModal && (
          <PhonePairingModal
            onClose={() => setShowPairingModal(false)}
            onSimulateMobile={() => {
              setAppMode("mobile-scanner");
              setIsSplitMode(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
