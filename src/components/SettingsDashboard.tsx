import React, { useState } from "react";
import QRCode from "qrcode";
import {
  Settings,
  Cloud,
  Cpu,
  Smartphone,
  Users,
  Shield,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Database,
  Radio,
  Sliders,
  Laptop,
  Tablet,
  ScanLine,
  Check,
  Building,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Bell,
  Warehouse,
  MapPin,
  QrCode,
  Link,
  Edit3,
  Phone,
  Layers,
  Copy,
  Tv,
  Coins,
  ExternalLink,
  Zap,
  CreditCard,
  Crown,
  Sun,
  Moon,
} from "lucide-react";
import {
  AppSettings,
  CloudAISettings,
  ConnectedDevice,
  Employee,
  InventoryItem,
  UserAccount,
  DepotWarehouse,
  SubscriptionConfig,
  SubscriptionTier,
  BillingCycle,
} from "../types";
import { StockThresholdConfig } from "./StockThresholdConfig";
import { EnterpriseSecurityConfig } from "./EnterpriseSecurityConfig";
import { POPULAR_CURRENCIES, formatPrice } from "../utils/currency";
import { PLAN_PRICING } from "../utils/subscriptionPlans";

interface SettingsDashboardProps {
  settings: AppSettings;
  employees: Employee[];
  devices: ConnectedDevice[];
  items?: InventoryItem[];
  currentUser?: UserAccount | null;
  depots?: DepotWarehouse[];
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  onAddEmployee: (employee: Partial<Employee>) => Promise<boolean>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<boolean>;
  onDeleteEmployee: (id: string) => Promise<boolean>;
  onRevokeDevice: (id: string) => Promise<boolean>;
  onRegisterDevice: (device: Partial<ConnectedDevice>) => Promise<boolean>;
  onTriggerDriveSync: () => Promise<boolean>;
  onAddDepot?: (depot: Partial<DepotWarehouse>) => Promise<boolean>;
  onUpdateDepot?: (id: string, updates: Partial<DepotWarehouse>) => Promise<boolean>;
  onDeleteDepot?: (id: string) => Promise<boolean>;
  onRefreshData?: () => Promise<void>;
  onTriggerAuthModal?: () => void;
  onOpenUpgradeModal?: (recommendedTier?: SubscriptionTier) => void;
  isSyncing: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const SettingsDashboard: React.FC<SettingsDashboardProps> = ({
  settings,
  employees,
  devices,
  items = [],
  currentUser = null,
  depots = [],
  onUpdateSettings,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onRevokeDevice,
  onRegisterDevice,
  onTriggerDriveSync,
  onAddDepot = async (_depot: Partial<DepotWarehouse>) => false,
  onUpdateDepot = async (_id: string, _updates: Partial<DepotWarehouse>) => false,
  onDeleteDepot = async (_id: string) => false,
  onRefreshData = async () => {},
  onTriggerAuthModal = () => {},
  onOpenUpgradeModal = (_recommendedTier?: SubscriptionTier) => {},
  isSyncing,
  darkMode = true,
  onToggleDarkMode,
}) => {
  const [subTab, setSubTab] = useState<
    "depots" | "employees" | "mobile-pairing" | "security-data" | "stock-alerts" | "cloud-ai" | "general" | "screens-displays" | "subscription"
  >("subscription");
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Cloud AI state form
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai" | "custom">(
    settings.cloudAI?.aiProvider || "gemini"
  );
  const [modelName, setModelName] = useState<string>(
    settings.cloudAI?.modelName || "gemini-3.7-flash"
  );
  const [visionQuality, setVisionQuality] = useState<"fast" | "high" | "ultra">(
    settings.cloudAI?.visionQuality || "high"
  );
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(
    settings.cloudAI?.autoFillConfidenceThreshold || 0.85
  );
  const [cloudStorage, setCloudStorage] = useState<"google_drive" | "firestore" | "local_cloud">(
    settings.cloudAI?.cloudStorageProvider || "google_drive"
  );
  const [syncFreq, setSyncFreq] = useState<"instant" | "hourly" | "daily">(
    settings.cloudAI?.cloudSyncFrequency || "instant"
  );
  const [autoBackup, setAutoBackup] = useState<boolean>(
    settings.cloudAI?.autoBackupEnabled ?? true
  );
  const [promptContext, setPromptContext] = useState<string>(
    settings.cloudAI?.aiPromptContext ||
      "Spécialisé dans le matériel audiovisuel, l'outillage professionnel et l'événementiel."
  );

  // Admin Custom API Key State
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isTestingApiKey, setIsTestingApiKey] = useState<boolean>(false);
  const [apiKeyTestResult, setApiKeyTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    error?: string;
    model?: string;
    isCustomKeyUsed?: boolean;
  } | null>(null);

  // General Settings & Multi-Devise
  const [companyName, setCompanyName] = useState<string>(
    settings.companyName || "KROMA Audiovisuel & Logistique"
  );
  const [warehouseName, setWarehouseName] = useState<string>(
    settings.warehouseName || "Dépôt Central Paris-Nord"
  );
  const [currency, setCurrency] = useState<string>(settings.currency || "EUR (€)");
  const [customCurrencyCode, setCustomCurrencyCode] = useState<string>("");
  const [customCurrencySymbol, setCustomCurrencySymbol] = useState<string>("");

  // Employee creation modal state
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState<boolean>(false);
  const [newEmpName, setNewEmpName] = useState<string>("");
  const [newEmpEmail, setNewEmpEmail] = useState<string>("");
  const [newEmpRole, setNewEmpRole] = useState<Employee["role"]>("Opérateur Scan");
  const [newEmpAssignedDepots, setNewEmpAssignedDepots] = useState<string[]>(["DEP-01"]);
  const [newEmpDefaultDepot, setNewEmpDefaultDepot] = useState<string>("DEP-01");
  const [newEmpScanIn, setNewEmpScanIn] = useState<boolean>(true);
  const [newEmpScanOut, setNewEmpScanOut] = useState<boolean>(true);
  const [newEmpEditInv, setNewEmpEditInv] = useState<boolean>(false);
  const [newEmpManageRoles, setNewEmpManageRoles] = useState<boolean>(false);

  // Depot creation modal state
  const [showAddDepotModal, setShowAddDepotModal] = useState<boolean>(false);
  const [newDepotName, setNewDepotName] = useState<string>("");
  const [newDepotCode, setNewDepotCode] = useState<string>("");
  const [newDepotCity, setNewDepotCity] = useState<string>("");
  const [newDepotAddress, setNewDepotAddress] = useState<string>("");
  const [newDepotPhone, setNewDepotPhone] = useState<string>("");

  // Mobile pairing QR Code
  const [mobileQrUrl, setMobileQrUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  React.useEffect(() => {
    const mobileLink = `${window.location.origin}/?mode=mobile-scanner&warehouse=${warehouseName}`;
    QRCode.toDataURL(mobileLink, {
      width: 260,
      margin: 1.5,
      color: { dark: "#1e1b4b", light: "#ffffff" },
    })
      .then((url) => setMobileQrUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [warehouseName]);

  const handleTestApiKey = async () => {
    setIsTestingApiKey(true);
    setApiKeyTestResult(null);
    try {
      const res = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          apiKey: customApiKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      setApiKeyTestResult(data);
    } catch (err: any) {
      setApiKeyTestResult({
        success: false,
        error: err?.message || "Erreur de communication avec le serveur",
      });
    } finally {
      setIsTestingApiKey(false);
    }
  };

  const handleClearCustomApiKey = async () => {
    setCustomApiKey("");
    setApiKeyTestResult(null);
    await onUpdateSettings({
      cloudAI: {
        ...settings.cloudAI,
        customApiKey: "",
      },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatePayload: any = {
      companyName,
      warehouseName,
      currency,
      cloudAI: {
        aiProvider,
        modelName,
        visionQuality,
        autoFillConfidenceThreshold: Number(confidenceThreshold),
        cloudSyncFrequency: syncFreq,
        cloudStorageProvider: cloudStorage,
        autoBackupEnabled: autoBackup,
        apiKeyConfigured: true,
        aiPromptContext: promptContext,
      },
    };

    if (customApiKey.trim() !== "") {
      updatePayload.cloudAI.customApiKey = customApiKey.trim();
    }

    const success = await onUpdateSettings(updatePayload);

    if (success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;

    await onAddEmployee({
      name: newEmpName,
      email: newEmpEmail || `${newEmpName.toLowerCase().replace(/\s+/g, ".")}@kroma.fr`,
      role: newEmpRole,
      assignedDepots: newEmpAssignedDepots,
      defaultDepotId: newEmpDefaultDepot,
      assignedWarehouse: depots.find((d) => d.id === newEmpDefaultDepot)?.name || "Dépôt Central",
      permissions: {
        canScanIn: newEmpScanIn,
        canScanOut: newEmpScanOut,
        canEditInventory: newEmpEditInv,
        canManageRoles: newEmpManageRoles,
        canManageCloud: false,
      },
    });

    setShowAddEmployeeModal(false);
    setNewEmpName("");
    setNewEmpEmail("");
    setNewEmpAssignedDepots(["DEP-01"]);
    setNewEmpDefaultDepot("DEP-01");
  };

  const handleCreateDepot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepotName.trim()) return;

    await onAddDepot({
      name: newDepotName,
      code: newDepotCode || newDepotName.slice(0, 4).toUpperCase(),
      city: newDepotCity || "France",
      address: newDepotAddress || "Adresse non spécifiée",
      phone: newDepotPhone || "01 00 00 00 00",
      colorBadge: "border-indigo-500 text-indigo-300 bg-indigo-950/60",
    });

    setShowAddDepotModal(false);
    setNewDepotName("");
    setNewDepotCode("");
    setNewDepotCity("");
    setNewDepotAddress("");
    setNewDepotPhone("");
  };

  const toggleDepotAssignment = (employee: Employee, depotId: string) => {
    const currentList = employee.assignedDepots || ["DEP-01"];
    let updatedList: string[];
    if (currentList.includes(depotId)) {
      if (currentList.length === 1) return; // Must keep at least 1 depot
      updatedList = currentList.filter((id) => id !== depotId);
    } else {
      updatedList = [...currentList, depotId];
    }
    const newDefault = updatedList.includes(employee.defaultDepotId || "")
      ? employee.defaultDepotId
      : updatedList[0];

    onUpdateEmployee(employee.id, {
      assignedDepots: updatedList,
      defaultDepotId: newDefault,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-200">
      {/* Header */}
      <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Paramètres & Gestion Multi-Dépôts</h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold">
                Administration KROMA
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gérez vos sites logistiques, les affectations des salariés, l'appairage mobile et les données de l'entreprise.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Paramètres enregistrés avec succès
          </div>
        )}
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-800 bg-[#0c0f1d] p-1.5 rounded-2xl gap-1 overflow-x-auto">
        <button
          type="button"
          id="tab-btn-subscription"
          onClick={() => setSubTab("subscription")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === "subscription"
              ? "bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Abonnement & Formules</span>
          {settings.subscription?.isTrial ? (
            <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
              Essai 14j
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 text-[9px] font-black uppercase border border-indigo-500/40">
              {settings.subscription?.tier?.toUpperCase() || "PRO"}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-btn-depots"
          onClick={() => setSubTab("depots")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === "depots"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Warehouse className="w-3.5 h-3.5" />
          <span>Gestion des Dépôts ({depots.length})</span>
        </button>

        <button
          type="button"
          id="tab-btn-employees"
          onClick={() => setSubTab("employees")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === "employees"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Salariés & Droits Multi-Dépôts ({employees.length})</span>
        </button>

        <button
          type="button"
          id="tab-btn-mobile-pairing"
          onClick={() => setSubTab("mobile-pairing")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === "mobile-pairing"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Appairage Mobile & Scan</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("security-data")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === "security-data"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Sécurité & Données</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("stock-alerts")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === "stock-alerts"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alertes Stock</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("cloud-ai")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === "cloud-ai"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>IA Gemini (Clé Admin)</span>
          {settings.cloudAI?.isCustomApiKeySet && (
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab("general")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === "general"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Général & Devises</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("screens-displays")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            subTab === "screens-displays"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Écrans & Régie TV</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 0. ABONNEMENTS, FORMULES & ESSAI 14 JOURS */}
      {/* ========================================================================= */}
      {subTab === "subscription" && (
        <div className="space-y-6">
          {/* Current Status Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#12172b] to-[#0c0f1e] border border-indigo-500/40 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/50 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Formule Active : {settings.subscription?.tier?.toUpperCase() || "ULTIMATE"}
                  </span>
                  {settings.subscription?.isTrial && (
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider animate-pulse">
                      🎁 Période d'Essai 14 Jours Active
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-white">
                  {settings.subscription?.tier === "basic"
                    ? "KROMA Basic — 90 € / mois"
                    : settings.subscription?.tier === "pro"
                    ? "KROMA Pro — 150 € / mois (ou 1350 € / an)"
                    : "KROMA Ultimate — 220 € / mois (ou 2000 € / an)"}
                </h3>

                <p className="text-xs text-slate-300 max-w-xl">
                  {settings.subscription?.isTrial ? (
                    <>
                      Votre période d'essai vous donne un accès intégral sans restriction. Fin de la période d'essai :{" "}
                      <strong className="text-amber-400 font-mono">
                        {new Date(settings.subscription.trialEndsAt || Date.now() + 14 * 86400000).toLocaleDateString(
                          "fr-FR"
                        )}
                      </strong>{" "}
                      (dans{" "}
                      {Math.max(
                        0,
                        Math.ceil(
                          (new Date(settings.subscription.trialEndsAt || Date.now() + 14 * 86400000).getTime() -
                            Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )}{" "}
                      jours).
                    </>
                  ) : (
                    <>
                      Abonnement actif avec facturation{" "}
                      <strong>
                        {settings.subscription?.billingCycle === "annual" ? "Annuelle (2,5 mois offerts)" : "Mensuelle"}
                      </strong>
                      . Prochain renouvellement :{" "}
                      <span className="font-mono text-indigo-300">
                        {new Date(settings.subscription?.nextBillingDate || Date.now() + 30 * 86400000).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                      .
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenUpgradeModal(settings.subscription?.tier || "pro")}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Changer de Formule / Mettre à Niveau</span>
                </button>
              </div>
            </div>

            {/* Quotas bar */}
            <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-2xl bg-[#090b14]/70 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Comptes Utilisateurs</div>
                <div className="text-base font-black text-white mt-0.5">
                  {employees.length} / {settings.subscription?.tier === "basic" ? "2" : settings.subscription?.tier === "pro" ? "5" : "Illimité"}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#090b14]/70 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Dépôts Physiques</div>
                <div className="text-base font-black text-white mt-0.5">
                  {depots.length} / {settings.subscription?.tier === "basic" ? "1" : settings.subscription?.tier === "pro" ? "3" : "Illimité"}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#090b14]/70 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Option Crew Intermittents</div>
                <div className="text-base font-black text-white mt-0.5">
                  {settings.subscription?.tier === "ultimate"
                    ? "Inclus (Illimité)"
                    : settings.subscription?.crewAddonActive
                    ? "Activé (+35€/m)"
                    : "Non Inclus"}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#090b14]/70 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Malles, SAV & Confrère</div>
                <div className="text-base font-black text-white mt-0.5">
                  {settings.subscription?.tier === "basic" ? "Verrouillé" : "Actif (Complet)"}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Grid Summary for Quick Reference */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Grille Tarifaire & Modules Débloqués KROMA
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* BASIC */}
              <div className="p-4 rounded-2xl bg-[#101426] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-sm">🥉 KROMA Basic</span>
                    <span className="text-xs font-bold text-slate-300">90 €/m</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">2 Users • 1 Dépôt</p>
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Inventaire & Stock</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Devis dégressifs & Bons de livraison</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Planning des sorties & Scan QR</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenUpgradeModal("basic")}
                  className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                >
                  Choisir Basic (90€/m)
                </button>
              </div>

              {/* PRO */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#141c38] to-[#0f1426] border border-indigo-500/60 flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-300 text-sm">🥈 KROMA Pro</span>
                    <span className="text-xs font-bold text-indigo-200">150 €/m ou 1350 €/an</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">5 Users • Jusqu'à 3 Dépôts</p>
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-200">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Malles & Flight Cases RFID</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Atelier SAV & Casse Matériel</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Calculateur Logistique Poids/Watts</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Sous-Location Confrère (Sub-Rental)</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Option Crew disponible (+35€/m)</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenUpgradeModal("pro")}
                  className="mt-4 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow"
                >
                  Passer à KROMA Pro
                </button>
              </div>

              {/* ULTIMATE */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#1b1428] to-[#100d1a] border border-pink-500/60 flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-pink-300 text-sm">👑 KROMA Ultimate</span>
                    <span className="text-xs font-bold text-pink-200">220 €/m ou 2000 €/an</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">Users Illimités • Dépôts Illimités</p>
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-200">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-pink-400" />
                      <span>Tout le pack KROMA Pro inclus</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-pink-400" />
                      <span>Crew & Techniciens (Sans supplément)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-pink-400" />
                      <span>Studios & Plateaux de tournage</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-pink-400" />
                      <span>Facturation Factur-X & Extranet Client</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenUpgradeModal("ultimate")}
                  className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs transition shadow"
                >
                  Activer KROMA Ultimate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. GESTION DES DÉPÔTS (MULTI-WAREHOUSE) */}
      {/* ========================================================================= */}
      {subTab === "depots" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Parc des Dépôts & Hubs Logistiques</h3>
              <p className="text-xs text-slate-400">
                Créez et configurez les différents sites et points de retrait pour l'affectation du matériel et du personnel.
              </p>
            </div>
            <button
              type="button"
              id="btn-add-depot"
              onClick={() => setShowAddDepotModal(true)}
              className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Dépôt</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {depots.map((dep) => (
              <div
                key={dep.id}
                className="p-5 rounded-3xl bg-[#0e111e] border border-slate-800 shadow-xl flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                        <Warehouse className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{dep.name}</h4>
                        <span className="text-[10px] text-indigo-400 font-mono font-bold">
                          Code : {dep.code}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700 bg-[#141829] text-slate-300">
                      {dep.city}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{dep.address || "Adresse principale non renseignée"}</span>
                    </div>
                    {dep.phone && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{dep.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 font-mono">ID: {dep.id}</span>
                  {depots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteDepot(dep.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
                      title="Supprimer ce dépôt"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal Add Depot */}
          {showAddDepotModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0e111e] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-white text-base">Créer un Nouveau Dépôt / Hub</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddDepotModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateDepot} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nom complet du dépôt *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDepotName}
                      onChange={(e) => setNewDepotName(e.target.value)}
                      placeholder="ex: Dépôt Sud Marseille - La Joliette"
                      className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Code court (Trigramme) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newDepotCode}
                        onChange={(e) => setNewDepotCode(e.target.value.toUpperCase())}
                        placeholder="ex: MARS-01"
                        className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Ville / Région *</label>
                      <input
                        type="text"
                        required
                        value={newDepotCity}
                        onChange={(e) => setNewDepotCity(e.target.value)}
                        placeholder="ex: Marseille"
                        className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Adresse postale</label>
                    <input
                      type="text"
                      value={newDepotAddress}
                      onChange={(e) => setNewDepotAddress(e.target.value)}
                      placeholder="ex: 12 Rue des Docks, 13002 Marseille"
                      className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Téléphone direct</label>
                    <input
                      type="text"
                      value={newDepotPhone}
                      onChange={(e) => setNewDepotPhone(e.target.value)}
                      placeholder="ex: 04 91 00 00 00"
                      className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDepotModal(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30"
                    >
                      Créer le Dépôt
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SALARIÉS & DROITS D'ACCÈS AUX DÉPÔTS */}
      {/* ========================================================================= */}
      {subTab === "employees" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Attribution des Dépôts aux Salariés</h3>
              <p className="text-xs text-slate-400">
                En tant qu'administrateur, définissez à quels dépôts chaque salarié est rattaché et quel est son dépôt par défaut.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddEmployeeModal(true)}
              className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Salarié</span>
            </button>
          </div>

          <div className="space-y-3">
            {employees.map((emp) => {
              const assigned = emp.assignedDepots || ["DEP-01"];
              const defaultDep = emp.defaultDepotId || assigned[0] || "DEP-01";

              return (
                <div
                  key={emp.id}
                  className="p-5 rounded-3xl bg-[#0e111e] border border-slate-800 shadow-xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-white font-bold text-base shadow">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{emp.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {emp.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{emp.email}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteEmployee(emp.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition self-end sm:self-auto"
                      title="Supprimer le salarié"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Depot assignments section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Warehouse className="w-3.5 h-3.5 text-indigo-400" />
                        Dépôts autorisés pour ce salarié :
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {assigned.length} dépôt(s) rattaché(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {depots.map((dep) => {
                        const isAssigned = assigned.includes(dep.id);
                        const isDefault = defaultDep === dep.id;

                        return (
                          <div
                            key={dep.id}
                            className={`p-3 rounded-2xl border transition flex flex-col justify-between ${
                              isAssigned
                                ? "bg-indigo-950/30 border-indigo-500/60"
                                : "bg-[#141829] border-slate-800 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-xs text-white truncate">{dep.name}</span>
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => toggleDepotAssignment(emp, dep.id)}
                                className="rounded accent-indigo-600 cursor-pointer"
                              />
                            </div>

                            {isAssigned && (
                              <div className="pt-2 border-t border-indigo-900/40 flex items-center justify-between">
                                {isDefault ? (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                                    ✓ Dépôt par défaut
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateEmployee(emp.id, { defaultDepotId: dep.id })
                                    }
                                    className="text-[10px] text-slate-400 hover:text-indigo-300 font-semibold"
                                  >
                                    Définir par défaut
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Employee Modal */}
          {showAddEmployeeModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0e111e] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-white text-base">Ajouter un Collaborateur</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddEmployeeModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Prénom & Nom *</label>
                    <input
                      type="text"
                      required
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      placeholder="ex: Jean Dupond"
                      className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Email Professionnel</label>
                    <input
                      type="email"
                      value={newEmpEmail}
                      onChange={(e) => setNewEmpEmail(e.target.value)}
                      placeholder="j.dupond@kroma.fr"
                      className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Rôle dans l'entreprise</label>
                    <select
                      value={newEmpRole}
                      onChange={(e) => setNewEmpRole(e.target.value as any)}
                      className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                    >
                      <option value="Opérateur Scan">Opérateur Scan & Quai</option>
                      <option value="Comptoir & Location">Comptoir & Location</option>
                      <option value="Responsable Logistique">Responsable Logistique</option>
                      <option value="Administrateur">Administrateur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Dépôt Principal de Rattachement
                    </label>
                    <select
                      value={newEmpDefaultDepot}
                      onChange={(e) => {
                        setNewEmpDefaultDepot(e.target.value);
                        if (!newEmpAssignedDepots.includes(e.target.value)) {
                          setNewEmpAssignedDepots([...newEmpAssignedDepots, e.target.value]);
                        }
                      }}
                      className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                    >
                      {depots.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddEmployeeModal(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30"
                    >
                      Enregistrer le Salarié
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. APPAIRAGE MOBILE & SCANNER */}
      {/* ========================================================================= */}
      {subTab === "mobile-pairing" && (
        <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              Connecter un Mobile / Scanner de Quai
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Sur ordinateur de bureau, la saisie se fait au clavier et à la souris. Pour scanner des codes-barres directement sur le quai de chargement, jumelez un smartphone ou une tablette via ce QR code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* QR Code */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-xl">
              {mobileQrUrl ? (
                <img src={mobileQrUrl} alt="QR Code Appairage" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                  Génération QR...
                </div>
              )}
              <span className="text-[11px] font-mono text-slate-700 font-bold mt-2">
                Scanner avec l'appareil photo du mobile
              </span>
            </div>

            {/* Steps & Direct pairing link */}
            <div className="md:col-span-8 space-y-4">
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#141829] border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-white block">Scannez le QR Code</span>
                    <span className="text-slate-400">
                      Ouvrez l'appareil photo de votre smartphone iOS ou Android et pointez l'écran vers le QR code.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#141829] border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-white block">Accès instantané à l'interface Scan</span>
                    <span className="text-slate-400">
                      Votre smartphone se connecte instantanément au dépôt configuré avec la caméra intégrée haute vitesse.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#141829] border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-white block">Synchronisation bidirectionnelle</span>
                    <span className="text-slate-400">
                      Tous les scans effectués sur le quai mettent à jour le tableau de bord et les devis sur votre bureau en temps réel.
                    </span>
                  </div>
                </div>
              </div>

              {/* Copy Direct URL */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?mode=mobile-scanner`}
                  className="flex-1 bg-[#141829] border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-indigo-300 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/?mode=mobile-scanner`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? "Copié !" : "Copier le lien"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SÉCURITÉ & DONNÉES */}
      {/* ========================================================================= */}
      {subTab === "security-data" && (
        <EnterpriseSecurityConfig
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onTriggerDriveSync={onTriggerDriveSync}
          onRefreshData={onRefreshData}
          onTriggerAuthModal={onTriggerAuthModal}
          isSyncing={isSyncing}
          currentUser={currentUser}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. ALERTES STOCK */}
      {/* ========================================================================= */}
      {subTab === "stock-alerts" && (
        <StockThresholdConfig
          items={items}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. IA GEMINI VISION & CLÉ API ADMINISTRATEUR */}
      {/* ========================================================================= */}
      {subTab === "cloud-ai" && (
        <form onSubmit={handleSaveAISettings} className="space-y-6 text-xs">
          {/* Admin Custom API Key Card */}
          <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Clé d'API IA Gemini de l'Administrateur</h3>
                    {settings.cloudAI?.isCustomApiKeySet ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Clé Personnalisée Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        Clé Développeur / Système
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    L'administrateur peut renseigner sa propre clé d'API Google Gemini (Vision & Modèles).
                  </p>
                </div>
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Obtenir une clé Google AI Studio</span>
              </a>
            </div>

            {/* Key Input Field */}
            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold">
                Clé API Google Gemini (Google AI Studio)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder={
                      settings.cloudAI?.customApiKeyMasked
                        ? `Clé actuelle : ${settings.cloudAI.customApiKeyMasked} (Saisissez pour modifier)`
                        : "Collez votre clé API Gemini (ex: AIzaSy...)"
                    }
                    className="w-full bg-[#141829] border border-slate-700 rounded-2xl pl-4 pr-11 py-3 text-white placeholder:text-slate-500 font-mono text-xs focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                    title={showApiKey ? "Masquer la clé" : "Afficher la clé"}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={isTestingApiKey}
                  className="px-4 py-3 bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold rounded-2xl border border-indigo-500/40 transition flex items-center gap-2 shrink-0 disabled:opacity-50"
                  title="Tester la validité de la clé API"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingApiKey ? "animate-spin" : ""}`} />
                  <span>{isTestingApiKey ? "Test en cours..." : "Tester la Clé"}</span>
                </button>

                {settings.cloudAI?.isCustomApiKeySet && (
                  <button
                    type="button"
                    onClick={handleClearCustomApiKey}
                    className="px-3.5 py-3 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-2xl border border-rose-800/80 transition flex items-center gap-1.5 shrink-0"
                    title="Supprimer la clé personnalisée et revenir à la clé système"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Réinitialiser</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                La clé est transmise de manière chiffrée au serveur et reste privée pour votre entreprise.
              </p>
            </div>

            {/* Test Connection Result Box */}
            {apiKeyTestResult && (
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 animate-fadeIn ${
                  apiKeyTestResult.success
                    ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                    : "bg-rose-950/40 border-rose-800 text-rose-200"
                }`}
              >
                {apiKeyTestResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="font-bold text-xs">
                    {apiKeyTestResult.success
                      ? "Connexion IA Validée avec Succès !"
                      : "Échec du Test de Connexion IA"}
                  </div>
                  <div className="text-[11px] opacity-90">
                    {apiKeyTestResult.message || apiKeyTestResult.error}
                  </div>
                  {apiKeyTestResult.latencyMs !== undefined && (
                    <div className="text-[10px] font-mono text-slate-300">
                      Temps de réponse du modèle : {apiKeyTestResult.latencyMs} ms
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Model & Vision Parameters Card */}
          <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Paramètres des Modèles & Reconnaissance Visuelle</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Modèle Gemini Recommandé</label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                >
                  <option value="gemini-3.7-flash">Gemini 3.7 Flash (Dernière génération - Vitesse & Précision)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Rapide)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Haute Capacité Raisonnement)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Qualité d'Analyse Visuelle</label>
                <select
                  value={visionQuality}
                  onChange={(e) => setVisionQuality(e.target.value as any)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                >
                  <option value="fast">Rapide (Économique)</option>
                  <option value="high">Haute Précision (Recommandé)</option>
                  <option value="ultra">Ultra Haute Définition</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Contexte Métier Personnalisé pour l'IA</label>
              <textarea
                rows={3}
                value={promptContext}
                onChange={(e) => setPromptContext(e.target.value)}
                placeholder="Ex: Entreprise de location audiovisuelle, caméras RED/Arri, projecteurs Astera/Aputure..."
                className="w-full bg-[#141829] border border-slate-700 rounded-2xl p-3 text-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition shadow-lg shadow-indigo-600/30"
              >
                Enregistrer la Clé & Réglages IA
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 7. GÉNÉRAL & MULTI-DEVISES */}
      {/* ========================================================================= */}
      {subTab === "general" && (
        <form onSubmit={handleSaveAISettings} className="space-y-6 text-xs">
          {/* Theme & Display Configuration */}
          <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Apparence & Thème de l'Application</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Personnalisez l'affichage de l'interface entre le mode sombre (optimisé régie & entrepôt) et le mode clair.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (!darkMode && onToggleDarkMode) onToggleDarkMode();
                }}
                className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 ${
                  darkMode
                    ? "bg-indigo-950/80 border-indigo-500 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/50"
                    : "bg-[#141829] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-[#1a1f35]"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#0a0c16] border border-slate-700 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-2">
                    <span>Mode Sombre (Dark Pro)</span>
                    {darkMode && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-extrabold uppercase">
                        Actif
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Contraste élevé pour régie, quai logistique et faible luminosité.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (darkMode && onToggleDarkMode) onToggleDarkMode();
                }}
                className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 ${
                  !darkMode
                    ? "bg-indigo-950/80 border-indigo-500 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/50"
                    : "bg-[#141829] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-[#1a1f35]"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-amber-500 shadow-inner">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-2">
                    <span>Mode Clair (Light Bureau)</span>
                    {!darkMode && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-extrabold uppercase">
                        Actif
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Idéal pour bureaux administratifs et impressions de documents.
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white">Informations Générales de l'Entreprise</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Raison Sociale de l'Entreprise</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Nom du Dépôt / Siège Principal</label>
                <input
                  type="text"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-2xl px-3.5 py-2.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Multi-Devises Selection Section */}
          <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Devise Monétaire Principale & Multi-Devises</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sélectionnez la devise pour les devis, factures, cautions, tarifs journaliers et valorisation du stock.
                </p>
              </div>

              <div className="px-3 py-1 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold text-xs">
                Devise Active : <span className="text-white">{currency}</span>
              </div>
            </div>

            {/* Currency Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {POPULAR_CURRENCIES.map((cur) => {
                const isSelected =
                  currency === `${cur.code} (${cur.symbol})` ||
                  currency === cur.code ||
                  currency.includes(cur.code);

                return (
                  <button
                    key={cur.code}
                    type="button"
                    onClick={() => setCurrency(`${cur.code} (${cur.symbol})`)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "bg-indigo-950/80 border-indigo-500 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/50"
                        : "bg-[#141829] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-[#1a1f35]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{cur.flag}</span>
                      <span className="font-mono font-bold text-xs text-indigo-300">{cur.symbol}</span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{cur.code}</div>
                      <div className="text-[10px] text-slate-400 truncate">{cur.name}</div>
                    </div>
                    <div className="pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                      Ex: {formatPrice(1250, `${cur.code} (${cur.symbol})`)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Currency input option */}
            <div className="mt-4 p-4 rounded-2xl bg-[#141829] border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1">
                <span className="font-bold text-xs text-slate-200">Devise personnalisée / Autre monnaie</span>
                <p className="text-[11px] text-slate-400">Saisissez un code (ex: DZD, TND, PLN) et un symbole (ex: د.ج, zł).</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Code (ex: DZD)"
                  value={customCurrencyCode}
                  onChange={(e) => setCustomCurrencyCode(e.target.value.toUpperCase())}
                  className="w-24 bg-[#0e111e] border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Symbole (ex: د.ج)"
                  value={customCurrencySymbol}
                  onChange={(e) => setCustomCurrencySymbol(e.target.value)}
                  className="w-20 bg-[#0e111e] border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customCurrencyCode.trim()) {
                      setCurrency(`${customCurrencyCode.trim()} (${customCurrencySymbol.trim() || customCurrencyCode.trim()})`);
                      setCustomCurrencyCode("");
                      setCustomCurrencySymbol("");
                    }
                  }}
                  disabled={!customCurrencyCode.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition text-xs"
                >
                  Appliquer
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition shadow-lg shadow-indigo-600/30"
              >
                Enregistrer les Paramètres & Devises
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 8. ÉCRANS CONNECTÉS & AFFICHAGE RÉGIE PERMANENT */}
      {/* ========================================================================= */}
      {subTab === "screens-displays" && (
        <div className="space-y-6 text-xs">
          <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Affichage Permanent sur Écran Déporté / TV Quai</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Projetez le calendrier logistique, les départs et les retours en temps réel 24/7 sur un second moniteur.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/?mode=calendar-broadcast`;
                  window.open(url, "StockVision_Broadcast", "width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no");
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
              >
                <Tv className="w-4 h-4" />
                <span>Ouvrir Fenêtre Régie Déportée</span>
              </button>
            </div>

            {/* Instructions & Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#141829] border border-slate-800 space-y-2">
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Synchronisation Instantanée
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Le flux déporté se met à jour instantanément via flux SSE dès qu'un scan ou départ est enregistré.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#141829] border border-slate-800 space-y-2">
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-indigo-400" />
                  Multi-Moniteurs Natif
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Glissez la fenêtre détachée sur votre 2ème ou 3ème écran ou utilisez le bouton de projection automatique.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#141829] border border-slate-800 space-y-2">
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  Lien Direct TV & Raspberry Pi
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Compatible navigateurs connectés Smart TV, Google TV, affichage dynamique et bornes d'atelier.
                </p>
              </div>
            </div>

            {/* Direct URL copy bar */}
            <div className="p-4 rounded-2xl bg-[#141829] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-white">URL de Diffusion Régie Permanente</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {typeof window !== "undefined" ? `${window.location.origin}/?mode=calendar-broadcast` : "/?mode=calendar-broadcast"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/?mode=calendar-broadcast`;
                  navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? "Copié !" : "Copier l'URL"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
