import React, { useState } from "react";
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
} from "lucide-react";
import { AppSettings, CloudAISettings, ConnectedDevice, Employee } from "../types";

interface SettingsDashboardProps {
  settings: AppSettings;
  employees: Employee[];
  devices: ConnectedDevice[];
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  onAddEmployee: (employee: Partial<Employee>) => Promise<boolean>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<boolean>;
  onDeleteEmployee: (id: string) => Promise<boolean>;
  onRevokeDevice: (id: string) => Promise<boolean>;
  onRegisterDevice: (device: Partial<ConnectedDevice>) => Promise<boolean>;
  onTriggerDriveSync: () => Promise<boolean>;
  isSyncing: boolean;
}

export const SettingsDashboard: React.FC<SettingsDashboardProps> = ({
  settings,
  employees,
  devices,
  onUpdateSettings,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onRevokeDevice,
  onRegisterDevice,
  onTriggerDriveSync,
  isSyncing,
}) => {
  const [subTab, setSubTab] = useState<"cloud-ai" | "devices" | "employees" | "general">("cloud-ai");
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Cloud AI state form
  const [aiProvider, setAiProvider] = useState<"gemini" | "openai" | "custom">(settings.cloudAI?.aiProvider || "gemini");
  const [modelName, setModelName] = useState<string>(settings.cloudAI?.modelName || "gemini-3.7-flash");
  const [visionQuality, setVisionQuality] = useState<"fast" | "high" | "ultra">(settings.cloudAI?.visionQuality || "high");
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(settings.cloudAI?.autoFillConfidenceThreshold || 0.85);
  const [cloudStorage, setCloudStorage] = useState<"google_drive" | "firestore" | "local_cloud">(
    settings.cloudAI?.cloudStorageProvider || "google_drive"
  );
  const [syncFreq, setSyncFreq] = useState<"instant" | "hourly" | "daily">(settings.cloudAI?.cloudSyncFrequency || "instant");
  const [autoBackup, setAutoBackup] = useState<boolean>(settings.cloudAI?.autoBackupEnabled ?? true);
  const [promptContext, setPromptContext] = useState<string>(
    settings.cloudAI?.aiPromptContext ||
      "Spécialisé dans le matériel audiovisuel, l'outillage professionnel et l'événementiel."
  );

  // General Settings
  const [companyName, setCompanyName] = useState<string>(settings.companyName || "StockVision IA & Logistique");
  const [warehouseName, setWarehouseName] = useState<string>(settings.warehouseName || "Hub Central Paris-Nord");
  const [currency, setCurrency] = useState<string>(settings.currency || "EUR (€)");

  // Employee creation modal state
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState<boolean>(false);
  const [newEmpName, setNewEmpName] = useState<string>("");
  const [newEmpEmail, setNewEmpEmail] = useState<string>("");
  const [newEmpRole, setNewEmpRole] = useState<Employee["role"]>("Opérateur Scan");
  const [newEmpWarehouse, setNewEmpWarehouse] = useState<string>("Entrepôt Principal");
  const [newEmpScanIn, setNewEmpScanIn] = useState<boolean>(true);
  const [newEmpScanOut, setNewEmpScanOut] = useState<boolean>(true);
  const [newEmpEditInv, setNewEmpEditInv] = useState<boolean>(false);
  const [newEmpManageRoles, setNewEmpManageRoles] = useState<boolean>(false);
  const [newEmpManageCloud, setNewEmpManageCloud] = useState<boolean>(false);

  // Pairing quick device modal
  const [showPairDeviceModal, setShowPairDeviceModal] = useState<boolean>(false);
  const [newDevName, setNewDevName] = useState<string>("");
  const [newDevType, setNewDevType] = useState<ConnectedDevice["type"]>("smartphone");
  const [newDevOperator, setNewDevOperator] = useState<string>("Sarah Benali");
  const [newDevLocation, setNewDevLocation] = useState<string>("Zone Quai Réception A");

  // AI Connection test state
  const [isTestingAI, setIsTestingAI] = useState<boolean>(false);
  const [aiTestResult, setAiTestResult] = useState<any>(null);

  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onUpdateSettings({
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
    });

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
      email: newEmpEmail || `${newEmpName.toLowerCase().replace(/\s+/g, ".")}@stockvision.fr`,
      role: newEmpRole,
      assignedWarehouse: newEmpWarehouse,
      permissions: {
        canScanIn: newEmpScanIn,
        canScanOut: newEmpScanOut,
        canEditInventory: newEmpEditInv,
        canManageRoles: newEmpManageRoles,
        canManageCloud: newEmpManageCloud,
      },
    });

    setShowAddEmployeeModal(false);
    setNewEmpName("");
    setNewEmpEmail("");
  };

  const handleQuickRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName.trim()) return;

    await onRegisterDevice({
      name: newDevName,
      type: newDevType,
      operatorName: newDevOperator,
      location: newDevLocation,
    });

    setShowPairDeviceModal(false);
    setNewDevName("");
  };

  const getDeviceIcon = (type: ConnectedDevice["type"]) => {
    switch (type) {
      case "smartphone":
        return <Smartphone className="w-4 h-4 text-indigo-400" />;
      case "tablet":
        return <Tablet className="w-4 h-4 text-sky-400" />;
      case "handheld_scanner":
        return <ScanLine className="w-4 h-4 text-emerald-400" />;
      case "desktop":
        return <Laptop className="w-4 h-4 text-purple-400" />;
    }
  };

  const getRoleBadge = (role: Employee["role"]) => {
    switch (role) {
      case "Administrateur":
        return "bg-rose-950/70 border-rose-500/30 text-rose-300";
      case "Responsable Logistique":
        return "bg-purple-950/70 border-purple-500/30 text-purple-300";
      case "Opérateur Scan":
        return "bg-emerald-950/70 border-emerald-500/30 text-emerald-300";
      case "Comptoir & Location":
        return "bg-amber-950/70 border-amber-500/30 text-amber-300";
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Sub tabs navigation */}
      <div className="flex items-center justify-between border-b border-[#1e233b] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab("cloud-ai")}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              subTab === "cloud-ai"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-[#111422] border border-[#20253c] text-slate-300 hover:text-white hover:bg-[#181d30]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            IA & Stockage Cloud
          </button>

          <button
            type="button"
            onClick={() => setSubTab("devices")}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              subTab === "devices"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-[#111422] border border-[#20253c] text-slate-300 hover:text-white hover:bg-[#181d30]"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-300" />
            Appareils Connectés ({devices.length})
          </button>

          <button
            type="button"
            onClick={() => setSubTab("employees")}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              subTab === "employees"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-[#111422] border border-[#20253c] text-slate-300 hover:text-white hover:bg-[#181d30]"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            Gestion des Employés & Rôles ({employees.length})
          </button>

          <button
            type="button"
            onClick={() => setSubTab("general")}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              subTab === "general"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-[#111422] border border-[#20253c] text-slate-300 hover:text-white hover:bg-[#181d30]"
            }`}
          >
            <Building className="w-3.5 h-3.5 text-amber-300" />
            Entrepôt & Paramètres
          </button>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Paramètres enregistrés avec succès
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. CLOUD AI & VISION CONFIGURATION */}
      {/* ========================================================= */}
      {subTab === "cloud-ai" && (
        <form onSubmit={handleSaveAISettings} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: AI Model & Provider */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0e111d] border border-[#1e233b] space-y-5">
              <div className="flex items-center justify-between border-b border-[#1e233b] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Moteur de Reconnaissance Visuelle IA</h3>
                    <p className="text-xs text-slate-400">
                      Configuration du modèle de vision pour l'indexation optique de vos équipements
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Opérationnel
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fournisseur Cloud IA</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="gemini">Google Gemini AI (Recommandé - Ultra rapide & Multimodal)</option>
                    <option value="openai">OpenAI Vision (GPT-4o)</option>
                    <option value="custom">Serveur Dédié / Cloud On-Premise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Modèle Sélectionné</label>
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="gemini-3.7-flash">Gemini 3.7 Flash (Latence ultra-faible & Vision haute résolution)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Raisonnement technique approfondi)</option>
                    <option value="gpt-4o">GPT-4o Vision API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Résolution & Qualité de Prise de Vue</label>
                  <select
                    value={visionQuality}
                    onChange={(e) => setVisionQuality(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="fast">Rapide (Compressé 1080p - Idéal 4G/5G mobile)</option>
                    <option value="high">Haute Définition (Optimale pour lire codes-barres & numéros de série)</option>
                    <option value="ultra">Ultra Haute Précision (RAW & Micro-détails étiquettes)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Seuil de Confiance IA pour Auto-remplissage : {Math.round(confidenceThreshold * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">
                    En dessous de ce seuil, l'opérateur devra valider manuellement la marque et le modèle.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Instructions & Contexte Métier pour l'IA (Prompt Système Personnalisé)
                </label>
                <textarea
                  rows={3}
                  value={promptContext}
                  onChange={(e) => setPromptContext(e.target.value)}
                  placeholder="Ex: Entreprise spécialisée en matériel de tournage cinéma, drones, régie et micros HF..."
                  className="w-full p-3 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Ce contexte oriente l'IA pour catégoriser vos équipements avec les termes exacts utilisés dans votre entrepôt.
                </p>
              </div>

              {/* Live Gemini Test Connectivity Button */}
              <div className="pt-3 border-t border-[#1e233b] flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsTestingAI(true);
                    setAiTestResult(null);
                    try {
                      const res = await fetch("/api/ai/test-connection", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ model: modelName }),
                      });
                      const data = await res.json();
                      setAiTestResult(data);
                    } catch (err: any) {
                      setAiTestResult({ success: false, error: err.message });
                    } finally {
                      setIsTestingAI(false);
                    }
                  }}
                  disabled={isTestingAI}
                  className="py-2 px-3.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/50 text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isTestingAI ? "animate-spin" : ""}`} />
                  {isTestingAI ? "Test de latence en cours..." : "Tester la Connexion IA Gemini"}
                </button>

                {aiTestResult && (
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                      aiTestResult.success
                        ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                        : "bg-amber-950/80 border-amber-500/40 text-amber-300"
                    }`}
                  >
                    {aiTestResult.success ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Latence {aiTestResult.latencyMs}ms • Modèle actif
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Mode secouru actif ({aiTestResult.latencyMs}ms)
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Right Col: Cloud Storage & Google Drive */}
            <div className="p-5 rounded-2xl bg-[#0e111d] border border-[#1e233b] space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[#1e233b] pb-3">
                  <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-500/30 text-sky-400">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Stockage & Synchronisation Cloud</h3>
                    <p className="text-xs text-slate-400">Sauvegarde et réplication temps réel</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Destination Principale</label>
                  <select
                    value={cloudStorage}
                    onChange={(e) => setCloudStorage(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="google_drive">Google Drive Entreprise (Drive / StockLogix_Data)</option>
                    <option value="firestore">Firebase Cloud Database (Temps Réel Multi-sites)</option>
                    <option value="local_cloud">Cloud Privé On-Premise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fréquence de Synchronisation</label>
                  <select
                    value={syncFreq}
                    onChange={(e) => setSyncFreq(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="instant">Instantanée (À chaque scan ou mouvement de location)</option>
                    <option value="hourly">Toutes les heures</option>
                    <option value="daily">Quotidienne (Clôture à 20h00)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-[#121524] border border-[#232842] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">Sauvegarde Automatique</span>
                    <input
                      type="checkbox"
                      checked={autoBackup}
                      onChange={(e) => setAutoBackup(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Génère des instantanés quotidiens horodatés du catalogue et des contrats de location.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e233b] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onTriggerDriveSync}
                  disabled={isSyncing}
                  className="w-full py-2 px-3 rounded-xl bg-sky-950/60 border border-sky-500/30 text-sky-300 hover:bg-sky-900/50 text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Synchronisation en cours..." : "Sauvegarder Maintenant"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              Enregistrer la Configuration IA & Cloud
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* 2. CONNECTED DEVICES & ACTIVE SCANNERS (REVOKE ACCESS) */}
      {/* ========================================================= */}
      {subTab === "devices" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                Flotte d'Appareils & Scanners Connectés ({devices.length})
              </h3>
              <p className="text-xs text-slate-400">
                Gérez les smartphones, tablettes et terminaux laser autorisés à scanner et modifier les stocks en temps réel.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPairDeviceModal(true)}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition self-start md:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Appairer un Nouvel Appareil
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] hover:border-[#2e3658] transition flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#14182a] border border-[#232842]">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{device.name}</h4>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          En Ligne
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Opérateur : <span className="text-slate-200 font-medium">{device.operatorName}</span> • {device.location}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRevokeDevice(device.id)}
                    title="Déconnecter et révoquer cet appareil"
                    className="py-1 px-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    Déconnecter
                  </button>
                </div>

                <div className="pt-2 border-t border-[#181d30] flex items-center justify-between text-[11px] text-slate-400">
                  <span>IP: {device.ipAddress}</span>
                  <span>Version App: {device.appVersion}</span>
                  <span>Vu il y a {new Date(device.lastSeen).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. EMPLOYEES & ROLE-BASED ACCESS CONTROL (RBAC) */}
      {/* ========================================================= */}
      {subTab === "employees" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Équipe & Attribution des Rôles Logistiques ({employees.length})
              </h3>
              <p className="text-xs text-slate-400">
                Attribuez des rôles avec permissions précises pour les sorties matériel, retours, gestion du catalogue et accès cloud.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddEmployeeModal(true)}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition self-start md:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter un Employé
            </button>
          </div>

          <div className="bg-[#0e111d] rounded-2xl border border-[#1e233b] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#121627] text-[11px] uppercase font-semibold text-slate-400 border-b border-[#1e233b]">
                  <tr>
                    <th className="py-3 px-4">Employé & Contact</th>
                    <th className="py-3 px-4">Rôle Attribué</th>
                    <th className="py-3 px-4">Entrepôt / Zone</th>
                    <th className="py-3 px-4">Permissions Clés</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181d30]">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#121525] transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs uppercase">
                            {emp.name.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-white">{emp.name}</div>
                            <div className="text-[11px] text-slate-400">{emp.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={emp.role}
                          onChange={(e) => onUpdateEmployee(emp.id, { role: e.target.value as any })}
                          className={`py-1 px-2.5 text-xs font-semibold rounded-lg border outline-none cursor-pointer bg-[#0e111d] ${getRoleBadge(
                            emp.role
                          )}`}
                        >
                          <option value="Administrateur" className="bg-[#0e111d] text-rose-300">
                            Administrateur
                          </option>
                          <option value="Responsable Logistique" className="bg-[#0e111d] text-purple-300">
                            Responsable Logistique
                          </option>
                          <option value="Opérateur Scan" className="bg-[#0e111d] text-emerald-300">
                            Opérateur Scan
                          </option>
                          <option value="Comptoir & Location" className="bg-[#0e111d] text-amber-300">
                            Comptoir & Location
                          </option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-medium">{emp.assignedWarehouse}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {emp.permissions?.canScanOut && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              Départs Scan
                            </span>
                          )}
                          {emp.permissions?.canScanIn && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-950/70 text-sky-400 border border-sky-500/20 text-[10px]">
                              Retours Scan
                            </span>
                          )}
                          {emp.permissions?.canEditInventory && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-400 border border-purple-500/20 text-[10px]">
                              Édition Stock
                            </span>
                          )}
                          {emp.permissions?.canManageRoles && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-400 border border-rose-500/20 text-[10px]">
                              Gestion Rôles
                            </span>
                          )}
                          {emp.permissions?.canManageCloud && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-950/70 text-indigo-400 border border-indigo-500/20 text-[10px]">
                              Cloud & Drive
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteEmployee(emp.id)}
                          title="Supprimer cet employé"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. GENERAL WAREHOUSE SETTINGS */}
      {/* ========================================================= */}
      {subTab === "general" && (
        <form onSubmit={handleSaveAISettings} className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0e111d] border border-[#1e233b] space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#1e233b] pb-3">
              <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Paramètres Généraux de l'Entreprise</h3>
                <p className="text-xs text-slate-400">Identité de l'entrepôt et règles tarifaires par défaut</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nom de l'Entreprise</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nom du Hub Logistique</label>
                <input
                  type="text"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Devise d'Inventaire</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="EUR (€)">EUR (€) - Euro</option>
                  <option value="USD ($)">USD ($) - Dollar US</option>
                  <option value="CHF (CHF)">CHF (CHF) - Franc Suisse</option>
                  <option value="CAD ($)">CAD ($) - Dollar Canadien</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              Enregistrer les Paramètres
            </button>
          </div>
        </form>
      )}

      {/* MODAL: Add Employee */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0e111d] border border-[#242a45] rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#1e233b] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Ajouter un Employé & Définir son Rôle
              </h3>
              <button
                type="button"
                onClick={() => setShowAddEmployeeModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: David Martin"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Adresse Email Professionnelle</label>
                <input
                  type="email"
                  placeholder="Ex: d.martin@stockvision.fr"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Rôle Logistique</label>
                  <select
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="Opérateur Scan">Opérateur Scan</option>
                    <option value="Comptoir & Location">Comptoir & Location</option>
                    <option value="Responsable Logistique">Responsable Logistique</option>
                    <option value="Administrateur">Administrateur</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Entrepôt Assigné</label>
                  <input
                    type="text"
                    value={newEmpWarehouse}
                    onChange={(e) => setNewEmpWarehouse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121524] border border-[#232842] space-y-2.5">
                <span className="font-bold text-white block">Permissions d'Accès</span>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEmpScanOut}
                      onChange={(e) => setNewEmpScanOut(e.target.checked)}
                      className="accent-indigo-600 rounded"
                    />
                    Départs & Sorties
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEmpScanIn}
                      onChange={(e) => setNewEmpScanIn(e.target.checked)}
                      className="accent-indigo-600 rounded"
                    />
                    Retours & Réceptions
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEmpEditInv}
                      onChange={(e) => setNewEmpEditInv(e.target.checked)}
                      className="accent-indigo-600 rounded"
                    />
                    Modifier le Stock
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEmpManageRoles}
                      onChange={(e) => setNewEmpManageRoles(e.target.checked)}
                      className="accent-indigo-600 rounded"
                    />
                    Gérer les Rôles
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEmpManageCloud}
                      onChange={(e) => setNewEmpManageCloud(e.target.checked)}
                      className="accent-indigo-600 rounded"
                    />
                    Gestion Cloud & Drive
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="py-2 px-4 rounded-xl border border-[#232842] text-slate-300 hover:bg-[#181d30] font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  Créer l'Employé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Pair Device */}
      {showPairDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e111d] border border-[#242a45] rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#1e233b] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                Appairer un Appareil Scanner
              </h3>
              <button
                type="button"
                onClick={() => setShowPairDeviceModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickRegisterDevice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nom de l'Appareil</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Scanner Zebra Quai B ou Samsung S24"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Type d'Appareil</label>
                <select
                  value={newDevType}
                  onChange={(e) => setNewDevType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="smartphone">Smartphone (iPhone / Android)</option>
                  <option value="tablet">Tablette (iPad / Galaxy Tab)</option>
                  <option value="handheld_scanner">Terminal Laser Scanner (Zebra / Honeywell)</option>
                  <option value="desktop">Poste Fixe / PC Portable</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Opérateur Affecté</label>
                <select
                  value={newDevOperator}
                  onChange={(e) => setNewDevOperator(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Zone de Travail / Emplacement</label>
                <input
                  type="text"
                  value={newDevLocation}
                  onChange={(e) => setNewDevLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPairDeviceModal(false)}
                  className="py-2 px-4 rounded-xl border border-[#232842] text-slate-300 hover:bg-[#181d30] font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  Autoriser & Connecter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
