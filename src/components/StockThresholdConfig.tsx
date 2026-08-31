import React, { useState } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  AlertTriangle,
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Sparkles,
  Sliders,
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  Flame,
  Zap,
} from "lucide-react";
import { AppSettings, CategoryThreshold, AlertNotificationSettings, InventoryItem } from "../types";

interface StockThresholdConfigProps {
  settings: AppSettings;
  items: InventoryItem[];
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  isSyncing: boolean;
}

const DEFAULT_CATEGORIES = [
  "Audiovisuel",
  "Outillage & Travaux",
  "Informatique & Régie",
  "Éclairage & Scénographie",
  "Vidéo & Cinéma",
  "Sonorisation",
  "Mobilier & Stand",
  "EPI & Sécurité",
  "Accessoires & Câblage",
  "Général",
];

export const StockThresholdConfig: React.FC<StockThresholdConfigProps> = ({
  settings,
  items,
  onUpdateSettings,
  isSyncing,
}) => {
  // Global Notification Settings State
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState<boolean>(
    settings.alertNotifications?.emailAlertsEnabled ?? true
  );
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState<boolean>(
    settings.alertNotifications?.pushAlertsEnabled ?? true
  );
  const [defaultEmails, setDefaultEmails] = useState<string>(
    (settings.alertNotifications?.defaultEmailRecipients || ["samuelavitpro@gmail.com", "logistique@stockvision.fr"]).join(", ")
  );
  const [alertFrequency, setAlertFrequency] = useState<AlertNotificationSettings["alertFrequency"]>(
    settings.alertNotifications?.alertFrequency || "immediate"
  );
  const [webhookUrl, setWebhookUrl] = useState<string>(
    settings.alertNotifications?.webhookUrl || ""
  );

  // Category thresholds state
  const initialThresholds: CategoryThreshold[] = settings.categoryThresholds && settings.categoryThresholds.length > 0
    ? settings.categoryThresholds
    : [
        {
          category: "Audiovisuel",
          minUnitsThreshold: 4,
          criticalThreshold: 2,
          enableEmailAlerts: true,
          enablePushAlerts: true,
          alertRecipientEmails: ["samuelavitpro@gmail.com"],
          alertPriority: "critical",
          autoReorderSuggestion: true,
          reorderQuantity: 6,
        },
        {
          category: "Outillage & Travaux",
          minUnitsThreshold: 5,
          criticalThreshold: 2,
          enableEmailAlerts: true,
          enablePushAlerts: true,
          alertRecipientEmails: ["logistique@stockvision.fr"],
          alertPriority: "high",
          autoReorderSuggestion: true,
          reorderQuantity: 8,
        },
        {
          category: "Informatique & Régie",
          minUnitsThreshold: 3,
          criticalThreshold: 1,
          enableEmailAlerts: true,
          enablePushAlerts: true,
          alertRecipientEmails: ["samuelavitpro@gmail.com", "regie@stockvision.fr"],
          alertPriority: "critical",
          autoReorderSuggestion: true,
          reorderQuantity: 4,
        },
        {
          category: "Éclairage & Scénographie",
          minUnitsThreshold: 6,
          criticalThreshold: 3,
          enableEmailAlerts: true,
          enablePushAlerts: false,
          alertRecipientEmails: ["scene@stockvision.fr"],
          alertPriority: "normal",
          autoReorderSuggestion: false,
          reorderQuantity: 10,
        },
        {
          category: "Sonorisation",
          minUnitsThreshold: 4,
          criticalThreshold: 2,
          enableEmailAlerts: true,
          enablePushAlerts: true,
          alertRecipientEmails: ["samuelavitpro@gmail.com"],
          alertPriority: "high",
          autoReorderSuggestion: true,
          reorderQuantity: 5,
        },
      ];

  const [thresholds, setThresholds] = useState<CategoryThreshold[]>(initialThresholds);
  const [selectedCategoryToAdd, setSelectedCategoryToAdd] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isTestingAlert, setIsTestingAlert] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Compute live stock summary per category for comparison
  const categoryStats = React.useMemo(() => {
    const map: Record<string, { totalItems: number; availableUnits: number; rentedUnits: number; lowStockItemsCount: number }> = {};
    
    items.forEach((item) => {
      const cat = item.category || "Général";
      if (!map[cat]) {
        map[cat] = { totalItems: 0, availableUnits: 0, rentedUnits: 0, lowStockItemsCount: 0 };
      }
      map[cat].totalItems += 1;
      map[cat].availableUnits += Number(item.availableQuantity || 0);
      map[cat].rentedUnits += Number(item.rentedQuantity || 0);
      if (item.availableQuantity <= item.minStockAlert) {
        map[cat].lowStockItemsCount += 1;
      }
    });

    return map;
  }, [items]);

  // Distinct category choices from items + standard categories not yet configured
  const existingConfiguredCategories = new Set(thresholds.map((t) => t.category));
  const availableCategoriesToAdd = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...items.map((i) => i.category)])
  ).filter((cat) => !existingConfiguredCategories.has(cat));

  const handleAddCategory = () => {
    if (!selectedCategoryToAdd) return;
    const newEntry: CategoryThreshold = {
      category: selectedCategoryToAdd,
      minUnitsThreshold: 5,
      criticalThreshold: 2,
      enableEmailAlerts: true,
      enablePushAlerts: true,
      alertRecipientEmails: defaultEmails.split(",").map((e) => e.trim()).filter(Boolean),
      alertPriority: "high",
      autoReorderSuggestion: true,
      reorderQuantity: 6,
    };
    setThresholds((prev) => [...prev, newEntry]);
    setSelectedCategoryToAdd("");
  };

  const handleUpdateThreshold = (index: number, field: keyof CategoryThreshold, value: any) => {
    setThresholds((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteThreshold = (index: number) => {
    setThresholds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveConfiguration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const parsedEmails = defaultEmails
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.includes("@"));

    const alertNotifications: AlertNotificationSettings = {
      emailAlertsEnabled,
      pushAlertsEnabled,
      defaultEmailRecipients: parsedEmails.length > 0 ? parsedEmails : ["samuelavitpro@gmail.com"],
      alertFrequency,
      webhookUrl: webhookUrl.trim() || undefined,
      lastAlertSentAt: settings.alertNotifications?.lastAlertSentAt,
      totalAlertsTriggered: settings.alertNotifications?.totalAlertsTriggered || 0,
    };

    const success = await onUpdateSettings({
      categoryThresholds: thresholds,
      alertNotifications,
    });

    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  // Trigger automated test dispatch of alerts to verify email/push integration
  const handleTestAlertSimulation = async (categoryName?: string) => {
    setIsTestingAlert(true);
    setTestResult(null);

    const targetThreshold = categoryName 
      ? thresholds.find((t) => t.category === categoryName) 
      : thresholds[0];

    const currentStats = targetThreshold ? categoryStats[targetThreshold.category] : null;

    try {
      const res = await fetch("/api/alerts/test-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: targetThreshold?.category || "Audiovisuel",
          criticalThreshold: targetThreshold?.criticalThreshold ?? 2,
          minUnitsThreshold: targetThreshold?.minUnitsThreshold ?? 4,
          availableUnits: currentStats ? currentStats.availableUnits : 1,
          recipients: targetThreshold?.alertRecipientEmails?.length 
            ? targetThreshold.alertRecipientEmails 
            : defaultEmails.split(",").map(e => e.trim()).filter(Boolean),
          priority: targetThreshold?.alertPriority || "critical",
          enableEmail: emailAlertsEnabled && (targetThreshold?.enableEmailAlerts ?? true),
          enablePush: pushAlertsEnabled && (targetThreshold?.enablePushAlerts ?? true),
          webhookUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || "Alerte de test envoyée avec succès par Email & Notification !",
          details: data.details,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Échec lors de l'envoi de l'alerte de test.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "Erreur de connexion : " + err.message,
      });
    } finally {
      setIsTestingAlert(false);
    }
  };

  return (
    <div id="stock-threshold-config-container" className="space-y-6 animate-fadeIn">
      {/* Header Info & Global Toggles */}
      <div className="p-5 rounded-2xl bg-[#0e111d] border border-[#1e233b] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e233b] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Seuils d'Alerte de Stock par Catégorie & Canaux d'Automatisation
              </h3>
              <p className="text-xs text-slate-400">
                Surveillance proactive des niveaux de stock avec déclenchement automatique d'alertes Email et Notifications Push
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="test-alert-btn"
              type="button"
              onClick={() => handleTestAlertSimulation()}
              disabled={isTestingAlert}
              className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-[#141829] border border-[#262c4a] text-slate-200 hover:text-white hover:bg-[#1a2036] flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isTestingAlert ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Send className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Tester une Alerte</span>
            </button>

            <button
              id="save-thresholds-btn"
              type="button"
              onClick={() => handleSaveConfiguration()}
              disabled={isSaving}
              className="py-2 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Enregistrer les Seuils</span>
            </button>
          </div>
        </div>

        {/* Global Alert Notification Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Email Channel */}
          <div className={`p-3.5 rounded-xl border transition ${
            emailAlertsEnabled ? "bg-[#12162a] border-indigo-500/40" : "bg-[#0c0e18] border-[#1d2238] opacity-75"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                Alertes par Email
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlertsEnabled}
                  onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Envoi automatique d'un rapport détaillé dès franchissement d'un seuil critique.
            </p>
            <div>
              <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                Destinataires par défaut (séparés par virgule)
              </label>
              <input
                type="text"
                value={defaultEmails}
                onChange={(e) => setDefaultEmails(e.target.value)}
                placeholder="samuelavitpro@gmail.com, logistique@stockvision.fr"
                className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-[#252a46] bg-[#0b0e1a] text-slate-200 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Push Notification Channel */}
          <div className={`p-3.5 rounded-xl border transition ${
            pushAlertsEnabled ? "bg-[#12162a] border-emerald-500/40" : "bg-[#0c0e18] border-[#1d2238] opacity-75"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Notifications Push Appareils
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushAlertsEnabled}
                  onChange={(e) => setPushAlertsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Diffusion instantanée sur les terminaux mobiles des opérateurs et l'écran de régie.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Broadcast SSE en temps réel & son d'alerte haute priorité</span>
            </div>
          </div>

          {/* Frequency & Webhook */}
          <div className="p-3.5 rounded-xl border border-[#1d2238] bg-[#0c0e18] space-y-2.5">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Fréquence & Intégration Webhook
            </span>
            <div>
              <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                Fréquence des Alertes
              </label>
              <select
                value={alertFrequency}
                onChange={(e) => setAlertFrequency(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-[#252a46] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="immediate">Immédiat (Dès qu'un article passe sous le seuil)</option>
                <option value="daily_digest">Rapport Quotidien (Digest matinal à 08h00)</option>
                <option value="shift_change">Changement d'équipe (Bilan fin de rotation)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                Webhook Slack / Teams / Discord (Optionnel)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-[#252a46] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {saveSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Configuration des seuils d'alerte et canaux d'envoi enregistrée avec succès !</span>
          </div>
        )}

        {testResult && (
          <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs animate-fadeIn ${
            testResult.success 
              ? "bg-indigo-950/80 border-indigo-500/40 text-indigo-200" 
              : "bg-rose-950/80 border-rose-500/40 text-rose-300"
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold">{testResult.message}</p>
              {testResult.details && (
                <p className="text-[11px] text-slate-400 font-mono">
                  Canal: {testResult.details.channels?.join(", ")} | Destinataires: {testResult.details.recipients?.join(", ")} | ID Log: {testResult.details.logId}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Thresholds Table per Category */}
      <div className="p-5 rounded-2xl bg-[#0e111d] border border-[#1e233b] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e233b] pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Matrice des Seuils par Catégorie ({thresholds.length})
            </h4>
            <p className="text-xs text-slate-400">
              Définissez le seuil d'attention (Alerte basse) et le seuil critique (Rupture imminente) pour chaque famille de matériel
            </p>
          </div>

          {/* Add Category Section */}
          {availableCategoriesToAdd.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedCategoryToAdd}
                onChange={(e) => setSelectedCategoryToAdd(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-[#232842] bg-[#121524] text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="">+ Choisir une catégorie...</option>
                {availableCategoriesToAdd.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!selectedCategoryToAdd}
                className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
            </div>
          )}
        </div>

        {/* Category Cards List */}
        <div className="grid grid-cols-1 gap-3.5">
          {thresholds.map((th, idx) => {
            const stats = categoryStats[th.category] || { totalItems: 0, availableUnits: 0, rentedUnits: 0, lowStockItemsCount: 0 };
            const isCriticalNow = stats.availableUnits <= th.criticalThreshold && stats.totalItems > 0;
            const isLowNow = stats.availableUnits <= th.minUnitsThreshold && !isCriticalNow && stats.totalItems > 0;

            return (
              <div
                key={th.category}
                id={`threshold-row-${idx}`}
                className={`p-4 rounded-xl border transition-all ${
                  isCriticalNow
                    ? "bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-950/30"
                    : isLowNow
                    ? "bg-amber-950/20 border-amber-500/40 shadow-md shadow-amber-950/30"
                    : "bg-[#111422] border-[#20253c] hover:border-[#2f375a]"
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Category Name & Live Stock State */}
                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-white">{th.category}</span>
                      {isCriticalNow && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-rose-500 text-white animate-pulse flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          CRITIQUE
                        </span>
                      )}
                      {isLowNow && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300">
                          ATTENTION
                        </span>
                      )}
                      {!isCriticalNow && !isLowNow && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          OK
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{stats.totalItems} réf.</span>
                      <span>•</span>
                      <span className="font-bold text-slate-200">{stats.availableUnits} dispo</span>
                      <span>•</span>
                      <span className="text-indigo-400">{stats.rentedUnits} en location</span>
                    </div>
                  </div>

                  {/* Thresholds Input Controls */}
                  <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-lg bg-[#0a0c16] border border-[#1b1f33]">
                      <label className="block text-[10px] font-semibold text-amber-400 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Seuil Alerte (Unités)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="999"
                          value={th.minUnitsThreshold}
                          onChange={(e) =>
                            handleUpdateThreshold(idx, "minUnitsThreshold", parseInt(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 text-xs rounded border border-[#2b3252] bg-[#141829] text-white font-bold outline-none focus:border-amber-500"
                        />
                        <span className="text-[10px] text-slate-400">unités</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#0a0c16] border border-[#1b1f33]">
                      <label className="block text-[10px] font-semibold text-rose-400 mb-1 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        Seuil Critique
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="999"
                          value={th.criticalThreshold}
                          onChange={(e) =>
                            handleUpdateThreshold(idx, "criticalThreshold", parseInt(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 text-xs rounded border border-[#2b3252] bg-[#141829] text-rose-300 font-bold outline-none focus:border-rose-500"
                        />
                        <span className="text-[10px] text-slate-400">unités</span>
                      </div>
                    </div>
                  </div>

                  {/* Channel Toggles & Priority */}
                  <div className="lg:col-span-3 space-y-1.5">
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={th.enableEmailAlerts}
                          onChange={(e) => handleUpdateThreshold(idx, "enableEmailAlerts", e.target.checked)}
                          className="rounded accent-indigo-600"
                        />
                        <Mail className="w-3 h-3 text-indigo-400" />
                        <span className="text-[11px]">Email</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={th.enablePushAlerts}
                          onChange={(e) => handleUpdateThreshold(idx, "enablePushAlerts", e.target.checked)}
                          className="rounded accent-emerald-600"
                        />
                        <Smartphone className="w-3 h-3 text-emerald-400" />
                        <span className="text-[11px]">Push</span>
                      </label>

                      <select
                        value={th.alertPriority}
                        onChange={(e) => handleUpdateThreshold(idx, "alertPriority", e.target.value as any)}
                        className="px-2 py-0.5 text-[10px] rounded border border-[#2b3252] bg-[#0c0e18] text-slate-300 outline-none"
                      >
                        <option value="normal">Priorité Normale</option>
                        <option value="high">Priorité Haute</option>
                        <option value="critical">Priorité Critique</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Email dédié (ex: chef.av@domaine.fr)"
                        value={(th.alertRecipientEmails || []).join(", ")}
                        onChange={(e) =>
                          handleUpdateThreshold(
                            idx,
                            "alertRecipientEmails",
                            e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                          )
                        }
                        className="w-full px-2 py-1 text-[10px] rounded border border-[#20263f] bg-[#0a0d18] text-slate-300 font-mono outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Actions & Single test */}
                  <div className="lg:col-span-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      title="Tester l'alerte pour cette catégorie"
                      onClick={() => handleTestAlertSimulation(th.category)}
                      className="p-1.5 rounded-lg bg-[#141829] hover:bg-[#1f243d] border border-[#252b48] text-slate-300 hover:text-amber-400 transition text-[11px] flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span className="hidden sm:inline">Tester</span>
                    </button>

                    <button
                      type="button"
                      title="Supprimer cette catégorie de la surveillance"
                      onClick={() => handleDeleteThreshold(idx)}
                      className="p-1.5 rounded-lg bg-[#141829] hover:bg-rose-950/60 border border-[#252b48] hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Automation & Auto-Reorder Recommendations */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#0e111d] to-[#0e111d] border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              Suggestion de Réapprovisionnement Intelligent par Gemini IA
            </h4>
            <p className="text-[11px] text-slate-400">
              Lorsque le stock disponible passe sous le seuil critique, l'IA calcule le panier de réassort optimal selon la cadence des locations passées.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Actif en tâche de fond
          </span>
        </div>
      </div>
    </div>
  );
};
