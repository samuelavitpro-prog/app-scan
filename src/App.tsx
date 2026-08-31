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
  ShieldCheck,
  UserCheck,
  LogOut,
  KeyRound,
  Lock,
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
  UserAccount,
  StudioSpace,
  TechnicianProfile,
  ClientQuote,
  DepotWarehouse,
  NetworkDisplayScreen,
  DisplayPlaylist,
  ClientRecord,
  SupplierRecord,
  VenueRecord,
} from "./types";
import { DesktopDashboard } from "./components/DesktopDashboard";
import { MobileScanner } from "./components/MobileScanner";
import { CalendarPlanningDashboard } from "./components/CalendarPlanningDashboard";
import { KioskDisplayReceiver } from "./components/KioskDisplayReceiver";
import { ItemDetailModal } from "./components/ItemDetailModal";
import { PhonePairingModal } from "./components/PhonePairingModal";
import { EnterpriseAuthModal } from "./components/EnterpriseAuthModal";
import { LoginPage } from "./components/LoginPage";
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
  const [studios, setStudios] = useState<StudioSpace[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  const [quotes, setQuotes] = useState<ClientQuote[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [depots, setDepots] = useState<DepotWarehouse[]>([]);
  const [activeDepotId, setActiveDepotId] = useState<string>("DEP-01");
  const [displays, setDisplays] = useState<NetworkDisplayScreen[]>([]);
  const [playlists, setPlaylists] = useState<DisplayPlaylist[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    companyName: "KROMA Audiovisuel & Logistique",
    warehouseName: "Dépôt Central Paris-Nord",
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

  const [appMode, setAppMode] = useState<AppMode>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("display") || params.get("screen") || params.get("mode") === "kiosk-display" || params.get("mode") === "kiosk") {
        return "kiosk-display";
      }
      if (params.get("mode") === "calendar-broadcast" || params.get("mode") === "calendar-tv") {
        return "calendar-broadcast";
      }
      if (params.get("mode") === "mobile-scanner" || params.get("mode") === "scanner") {
        return "mobile-scanner";
      }
    }
    return "desktop";
  });
  const [isSplitMode, setIsSplitMode] = useState<boolean>(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<InventoryItem | null>(null);
  const [showPairingModal, setShowPairingModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [driveSyncInfo, setDriveSyncInfo] = useState<any>(null);
  const [livePulse, setLivePulse] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Enterprise Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Verify auth session token on mount
  useEffect(() => {
    const token = localStorage.getItem("sv_auth_token");
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem("sv_auth_token");
            setCurrentUser(null);
          }
        })
        .catch(() => {
          // offline or server unreachable - keep cached user session if available
        });
    }
  }, []);

  const handleLoginSuccess = (user: UserAccount, token: string) => {
    localStorage.setItem("sv_auth_token", token);
    setCurrentUser(user);
    if (user.activeDepotId) {
      setActiveDepotId(user.activeDepotId);
    } else if (user.defaultDepotId) {
      setActiveDepotId(user.defaultDepotId);
    } else if (user.assignedDepots && user.assignedDepots.length > 0) {
      setActiveDepotId(user.assignedDepots[0]);
    }
    setShowAuthModal(false);
    triggerLiveNotification(`Connecté : ${user.name} (${user.companyName})`);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem("sv_auth_token");
    setCurrentUser(null);
    triggerLiveNotification("Déconnexion réussie.");
  };

  const handleChangeActiveDepot = (depotId: string) => {
    setActiveDepotId(depotId);
    const targetDepot = depots.find((d) => d.id === depotId);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        activeDepotId: depotId,
        assignedWarehouse: targetDepot?.name || currentUser.assignedWarehouse,
      });
    }
    triggerLiveNotification(`Dépôt actif basculé : ${targetDepot?.name || depotId}`);
  };

  const handleAddDepot = async (newDepot: Partial<DepotWarehouse>) => {
    try {
      const res = await fetch("/api/depots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDepot),
      });
      const data = await res.json();
      if (data.depot) {
        setDepots((prev) => [...prev, data.depot]);
        triggerLiveNotification(`Dépôt créé : ${data.depot.name}`);
        return true;
      }
    } catch (err) {
      console.error("Error creating depot:", err);
    }
    return false;
  };

  const handleUpdateDepot = async (id: string, updates: Partial<DepotWarehouse>) => {
    try {
      const res = await fetch(`/api/depots/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.depot) {
        setDepots((prev) => prev.map((d) => (d.id === id ? data.depot : d)));
        triggerLiveNotification(`Dépôt mis à jour : ${data.depot.name}`);
        return true;
      }
    } catch (err) {
      console.error("Error updating depot:", err);
    }
    return false;
  };

  const handleDeleteDepot = async (id: string) => {
    try {
      const res = await fetch(`/api/depots/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDepots((prev) => prev.filter((d) => d.id !== id));
        triggerLiveNotification("Dépôt supprimé avec succès.");
        return true;
      }
    } catch (err) {
      console.error("Error deleting depot:", err);
    }
    return false;
  };

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
      const [
        itemsRes,
        rentalsRes,
        logsRes,
        statsRes,
        employeesRes,
        devicesRes,
        settingsRes,
        studiosRes,
        techniciansRes,
        quotesRes,
        depotsRes,
        displaysRes,
        playlistsRes,
        clientsRes,
        suppliersRes,
        venuesRes,
      ] = await Promise.all([
        fetch("/api/inventory").then((r) => r.json()).catch(() => ({ items: [] })),
        fetch("/api/rentals").then((r) => r.json()).catch(() => ({ rentals: [] })),
        fetch("/api/logs").then((r) => r.json()).catch(() => ({ logs: [] })),
        fetch("/api/stats").then((r) => r.json()).catch(() => null),
        fetch("/api/employees").then((r) => r.json()).catch(() => ({ employees: [] })),
        fetch("/api/devices").then((r) => r.json()).catch(() => ({ devices: [] })),
        fetch("/api/settings").then((r) => r.json()).catch(() => ({ settings: null })),
        fetch("/api/studios").then((r) => r.json()).catch(() => ({ studios: [] })),
        fetch("/api/technicians").then((r) => r.json()).catch(() => ({ technicians: [] })),
        fetch("/api/quotes").then((r) => r.json()).catch(() => ({ quotes: [] })),
        fetch("/api/depots").then((r) => r.json()).catch(() => ({ depots: [] })),
        fetch("/api/displays").then((r) => r.json()).catch(() => ({ displays: [] })),
        fetch("/api/playlists").then((r) => r.json()).catch(() => ({ playlists: [] })),
        fetch("/api/clients").then((r) => r.json()).catch(() => ({ clients: [] })),
        fetch("/api/suppliers").then((r) => r.json()).catch(() => ({ suppliers: [] })),
        fetch("/api/venues").then((r) => r.json()).catch(() => ({ venues: [] })),
      ]);

      if (itemsRes.items) setItems(itemsRes.items);
      if (rentalsRes.rentals) setRentals(rentalsRes.rentals);
      if (logsRes.logs) setLogs(logsRes.logs);
      if (statsRes) setStats(statsRes);
      if (employeesRes.employees) setEmployees(employeesRes.employees);
      if (devicesRes.devices) setDevices(devicesRes.devices);
      if (settingsRes.settings) setSettings(settingsRes.settings);
      if (studiosRes.studios) setStudios(studiosRes.studios);
      if (techniciansRes.technicians) setTechnicians(techniciansRes.technicians);
      if (quotesRes.quotes) setQuotes(quotesRes.quotes);
      if (clientsRes.clients) setClients(clientsRes.clients);
      if (suppliersRes.suppliers) setSuppliers(suppliersRes.suppliers);
      if (venuesRes.venues) setVenues(venuesRes.venues);
      if (depotsRes.depots && depotsRes.depots.length > 0) setDepots(depotsRes.depots);
      if (displaysRes.displays) setDisplays(displaysRes.displays);
      if (playlistsRes.playlists) setPlaylists(playlistsRes.playlists);
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

      eventSource.addEventListener("studios_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setStudios(data.payload);
      });

      eventSource.addEventListener("technicians_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setTechnicians(data.payload);
      });

      eventSource.addEventListener("quotes_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setQuotes(data.payload);
      });

      eventSource.addEventListener("clients_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setClients(data.payload);
      });

      eventSource.addEventListener("suppliers_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setSuppliers(data.payload);
      });

      eventSource.addEventListener("venues_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setVenues(data.payload);
      });

      eventSource.addEventListener("displays_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setDisplays(data.payload);
      });

      eventSource.addEventListener("playlists_updated", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setPlaylists(data.payload);
      });

      eventSource.addEventListener("stock_alert_triggered", (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        triggerLiveNotification(`🚨 ${data.payload.message || "Alerte de stock critique détectée !"}`);
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

  // Studio Spaces Handlers
  const handleAddStudio = async (studio: Partial<StudioSpace>): Promise<boolean> => {
    try {
      const res = await fetch("/api/studios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studio),
      });
      const data = await res.json();
      if (data.success && data.studio) {
        setStudios((prev) => [...prev, data.studio]);
        triggerLiveNotification(`Studio créé : ${data.studio.name}`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur lors de la création du studio : " + err.message);
      return false;
    }
  };

  const handleUpdateStudio = async (id: string, updates: Partial<StudioSpace>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/studios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.studio) {
        setStudios((prev) => prev.map((s) => (s.id === id ? data.studio : s)));
        triggerLiveNotification(`Studio mis à jour : ${data.studio.name}`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur lors de la mise à jour : " + err.message);
      return false;
    }
  };

  const handleDeleteStudio = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/studios/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStudios((prev) => prev.filter((s) => s.id !== id));
        triggerLiveNotification("Studio supprimé avec succès.");
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur lors de la suppression : " + err.message);
      return false;
    }
  };

  const handleBookStudio = async (studioId: string, bookingData: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/studios/${studioId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      if (data.success) {
        triggerLiveNotification(`Réservation enregistrée pour ${data.booking.clientName}`);
        fetchData();
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur de réservation : " + err.message);
      return false;
    }
  };

  // Technician Profiles Handlers
  const handleAddTechnician = async (tech: Partial<TechnicianProfile>): Promise<boolean> => {
    try {
      const res = await fetch("/api/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tech),
      });
      const data = await res.json();
      if (data.success && data.technician) {
        setTechnicians((prev) => [...prev, data.technician]);
        triggerLiveNotification(`Technicien ajouté : ${data.technician.name}`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur : " + err.message);
      return false;
    }
  };

  const handleUpdateTechnician = async (id: string, updates: Partial<TechnicianProfile>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/technicians/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.technician) {
        setTechnicians((prev) => prev.map((t) => (t.id === id ? data.technician : t)));
        triggerLiveNotification(`Fiche mise à jour : ${data.technician.name}`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur : " + err.message);
      return false;
    }
  };

  const handleDeleteTechnician = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/technicians/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTechnicians((prev) => prev.filter((t) => t.id !== id));
        triggerLiveNotification("Fiche technicien supprimée.");
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur : " + err.message);
      return false;
    }
  };

  // Quotes Handlers
  const handleAddQuote = async (quote: Partial<ClientQuote>): Promise<boolean> => {
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quote),
      });
      const data = await res.json();
      if (data.success && data.quote) {
        setQuotes((prev) => [data.quote, ...prev]);
        triggerLiveNotification(`Devis ${data.quote.quoteNumber} généré avec succès !`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur devis : " + err.message);
      return false;
    }
  };

  const handleUpdateQuote = async (id: string, updates: Partial<ClientQuote>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.quote) {
        setQuotes((prev) => prev.map((q) => (q.id === id ? data.quote : q)));
        triggerLiveNotification(`Devis ${data.quote.quoteNumber} actualisé.`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur : " + err.message);
      return false;
    }
  };

  const handleDeleteQuote = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setQuotes((prev) => prev.filter((q) => q.id !== id));
        triggerLiveNotification("Devis supprimé.");
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur : " + err.message);
      return false;
    }
  };

  // Clients Directory Handlers
  const handleAddClient = async (client: Partial<ClientRecord>): Promise<boolean> => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      });
      const data = await res.json();
      if (data.success && data.client) {
        setClients((prev) => [data.client, ...prev]);
        triggerLiveNotification(`Fiche client créée : ${data.client.companyName}`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur client : " + err.message);
      return false;
    }
  };

  const handleUpdateClient = async (id: string, updates: Partial<ClientRecord>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.client) {
        setClients((prev) => prev.map((c) => (c.id === id ? data.client : c)));
        triggerLiveNotification(`Client mis à jour : ${data.client.companyName}`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur : " + err.message);
      return false;
    }
  };

  const handleDeleteClient = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setClients((prev) => prev.filter((c) => c.id !== id));
        triggerLiveNotification("Fiche client supprimée.");
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur : " + err.message);
      return false;
    }
  };

  // Suppliers / Confrères Handlers
  const handleAddSupplier = async (supplier: Partial<SupplierRecord>): Promise<boolean> => {
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplier),
      });
      const data = await res.json();
      if (data.success && data.supplier) {
        setSuppliers((prev) => [data.supplier, ...prev]);
        triggerLiveNotification(`Fiche confrère ajoutée : ${data.supplier.name}`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur confrère : " + err.message);
      return false;
    }
  };

  const handleUpdateSupplier = async (id: string, updates: Partial<SupplierRecord>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.supplier) {
        setSuppliers((prev) => prev.map((s) => (s.id === id ? data.supplier : s)));
        triggerLiveNotification(`Confrère mis à jour : ${data.supplier.name}`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur : " + err.message);
      return false;
    }
  };

  const handleDeleteSupplier = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
        triggerLiveNotification("Fiche confrère supprimée.");
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur : " + err.message);
      return false;
    }
  };

  // Venues / Lieux & Salles de Réception Handlers (Locasyst)
  const handleAddVenue = async (venue: Partial<VenueRecord>): Promise<boolean> => {
    try {
      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venue),
      });
      const data = await res.json();
      if (data.success && data.venue) {
        setVenues((prev) => [data.venue, ...prev]);
        triggerLiveNotification(`Fiche lieu/salle créée : ${data.venue.name}`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur lieu : " + err.message);
      return false;
    }
  };

  const handleUpdateVenue = async (id: string, updates: Partial<VenueRecord>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/venues/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.venue) {
        setVenues((prev) => prev.map((v) => (v.id === id ? data.venue : v)));
        triggerLiveNotification(`Lieu mis à jour : ${data.venue.name}`);
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur : " + err.message);
      return false;
    }
  };

  const handleDeleteVenue = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/venues/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setVenues((prev) => prev.filter((v) => v.id !== id));
        triggerLiveNotification("Fiche lieu/salle supprimée.");
        return true;
      }
      return false;
    } catch (err: any) {
      triggerLiveNotification("Erreur : " + err.message);
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

  // If in dedicated kiosk / digital signage receiver mode, render full-screen receiver directly
  if (appMode === "kiosk-display") {
    return (
      <div className={darkMode ? "dark" : ""}>
        <KioskDisplayReceiver onExitKiosk={() => setAppMode("desktop")} />
      </div>
    );
  }

  // If not logged in and not explicitly launched in standalone mobile scanner mode, show LoginPage
  if (!currentUser && appMode !== "mobile-scanner") {
    return (
      <div className={darkMode ? "dark" : ""}>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          availableDepots={depots}
        />
      </div>
    );
  }

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

        {/* Global Clean Navigation Header with Logo, User & Logout */}
        <header className="sticky top-0 z-40 bg-[#121626]/90 backdrop-blur-xl border-b border-slate-700/60 px-4 sm:px-6 py-2.5 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-base text-white tracking-tight">KROMA</h1>
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black tracking-wider uppercase">
                    OS
                  </span>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 shadow-xs">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" /> Live Sync
                </span>
              </div>
            </div>

            {/* Actions & User Authentication Section */}
            <div className="flex items-center gap-2">
              {/* Refresh / Sync Button */}
              <button
                type="button"
                onClick={fetchData}
                className={`p-2 rounded-xl border border-slate-700/70 bg-[#1c2237] text-slate-300 hover:text-white hover:bg-[#242c48] transition shadow-xs ${
                  isSyncing ? "animate-spin text-indigo-400" : ""
                }`}
                title="Recharger les données"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Enterprise User Profile & Logout */}
              {currentUser ? (
                <div className="flex items-center gap-2 pl-1 border-l border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-indigo-500/40 bg-[#1c2237] hover:bg-[#242c48] text-xs font-semibold flex items-center gap-2 transition text-slate-100 shadow-xs"
                    title={`Connecté : ${currentUser.name} (${currentUser.companyName})`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="hidden md:flex flex-col text-left leading-tight">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {depots.find((d) => d.id === activeDepotId)?.name || currentUser.companyName}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="py-1.5 px-3 rounded-xl border border-rose-500/40 bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 hover:text-rose-100 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                    title="Se déconnecter de la session"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Déconnexion</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-indigo-500/50 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  title="Se connecter"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Connexion</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="max-w-7xl mx-auto p-3 sm:p-5">
          {appMode === "calendar-broadcast" ? (
            /* Dedicated Second-Screen Wallboard / Régie Broadcast Mode */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#121526] border border-indigo-500/40 rounded-2xl p-3.5 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Régie Déportée • Affichage Écran Dédié</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800 animate-pulse">
                        LIVE SYNC ACTIVE
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Ce mode est optimisé pour être projeté sur un second moniteur ou écran mural en permanence.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAppMode("desktop")}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                >
                  Retour au Bureau
                </button>
              </div>

              <CalendarPlanningDashboard
                quotes={quotes}
                studios={studios}
                technicians={technicians}
                items={items}
                depots={depots}
                activeDepotId={activeDepotId}
              />
            </div>
          ) : isSplitMode ? (
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
                  quotes={quotes}
                  displays={displays}
                  playlists={playlists}
                  currentUser={currentUser}
                  settings={settings}
                  onAddNewItem={handleAddNewItem}
                  onRentalCheckout={handleRentalCheckout}
                  onRentalCheckin={handleRentalCheckin}
                  onUpdateQuote={handleUpdateQuote}
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
                  currentUser={currentUser}
                  depots={depots}
                  activeDepotId={activeDepotId}
                  onChangeActiveDepot={handleChangeActiveDepot}
                  onLogout={handleLogout}
                  onAddDepot={handleAddDepot}
                  onUpdateDepot={handleUpdateDepot}
                  onDeleteDepot={handleDeleteDepot}
                  studios={studios}
                  technicians={technicians}
                  quotes={quotes}
                  clients={clients}
                  suppliers={suppliers}
                  venues={venues}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onAddSupplier={handleAddSupplier}
                  onUpdateSupplier={handleUpdateSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                  onAddVenue={handleAddVenue}
                  onUpdateVenue={handleUpdateVenue}
                  onDeleteVenue={handleDeleteVenue}
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
                  onAddStudio={handleAddStudio}
                  onUpdateStudio={handleUpdateStudio}
                  onDeleteStudio={handleDeleteStudio}
                  onBookStudio={handleBookStudio}
                  onAddTechnician={handleAddTechnician}
                  onUpdateTechnician={handleUpdateTechnician}
                  onDeleteTechnician={handleDeleteTechnician}
                  onAddQuote={handleAddQuote}
                  onUpdateQuote={handleUpdateQuote}
                  onDeleteQuote={handleDeleteQuote}
                  onRefresh={fetchData}
                  onRefreshData={fetchData}
                  onTriggerAuthModal={() => setShowAuthModal(true)}
                  onOpenPairingModal={() => setShowPairingModal(true)}
                  appMode={appMode}
                  onSetAppMode={(m) => {
                    setIsSplitMode(false);
                    setAppMode(m);
                  }}
                  isSplitMode={isSplitMode}
                  onToggleSplitMode={() => setIsSplitMode(!isSplitMode)}
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
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
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
              currentUser={currentUser}
              depots={depots}
              activeDepotId={activeDepotId}
              onChangeActiveDepot={handleChangeActiveDepot}
              onLogout={handleLogout}
              onAddDepot={handleAddDepot}
              onUpdateDepot={handleUpdateDepot}
              onDeleteDepot={handleDeleteDepot}
              studios={studios}
              technicians={technicians}
              quotes={quotes}
              clients={clients}
              suppliers={suppliers}
              venues={venues}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onAddVenue={handleAddVenue}
              onUpdateVenue={handleUpdateVenue}
              onDeleteVenue={handleDeleteVenue}
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
              onAddStudio={handleAddStudio}
              onUpdateStudio={handleUpdateStudio}
              onDeleteStudio={handleDeleteStudio}
              onBookStudio={handleBookStudio}
              onAddTechnician={handleAddTechnician}
              onUpdateTechnician={handleUpdateTechnician}
              onDeleteTechnician={handleDeleteTechnician}
              onAddQuote={handleAddQuote}
              onUpdateQuote={handleUpdateQuote}
              onDeleteQuote={handleDeleteQuote}
              onRefresh={fetchData}
              onRefreshData={fetchData}
              onTriggerAuthModal={() => setShowAuthModal(true)}
              onOpenPairingModal={() => setShowPairingModal(true)}
              appMode={appMode}
              onSetAppMode={(m) => {
                setIsSplitMode(false);
                setAppMode(m);
              }}
              isSplitMode={isSplitMode}
              onToggleSplitMode={() => setIsSplitMode(!isSplitMode)}
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
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />
          ) : (
            /* Single Mobile Scanner View with quick return header */
            <div className="max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161a2b] border border-slate-700/60 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    K
                  </div>
                  <span className="text-xs font-bold text-white">Scanner Mobile</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAppMode("desktop")}
                  className="py-1 px-2.5 rounded-xl bg-[#1f253d] hover:bg-[#242c48] border border-slate-600/50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Vue Bureau</span>
                </button>
              </div>

              <MobileScanner
                items={items}
                rentals={rentals}
                quotes={quotes}
                displays={displays}
                playlists={playlists}
                currentUser={currentUser}
                settings={settings}
                onAddNewItem={handleAddNewItem}
                onRentalCheckout={handleRentalCheckout}
                onRentalCheckin={handleRentalCheckin}
                onUpdateQuote={handleUpdateQuote}
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

        {/* Enterprise Authentication & Security Modal */}
        <EnterpriseAuthModal
          isOpen={showAuthModal || (Boolean(settings.requireEnterpriseLogin) && !currentUser)}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowAuthModal(false)}
          canDismiss={!(settings.requireEnterpriseLogin && !currentUser)}
        />
      </div>
    </div>
  );
}
