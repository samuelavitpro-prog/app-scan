import React, { useState } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Package,
  Layers,
  Edit3,
  X,
  Send,
  AlertCircle,
  Database,
  Smartphone,
  Check,
} from "lucide-react";
import { QueuedOfflineAction, OfflineActionType } from "../types";

interface SyncQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: QueuedOfflineAction[];
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  onSyncAll: () => Promise<void>;
  onRemoveItem: (id: string) => void;
  onClearQueue: () => void;
  isSyncing: boolean;
  lastPingTime?: string;
  onCheckConnection: () => Promise<void>;
}

export const SyncQueueModal: React.FC<SyncQueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  onSyncAll,
  onRemoveItem,
  onClearQueue,
  isSyncing,
  lastPingTime,
  onCheckConnection,
}) => {
  const [selectedAction, setSelectedAction] = useState<QueuedOfflineAction | null>(null);
  const [isCheckingPing, setIsCheckingPing] = useState(false);

  if (!isOpen) return null;

  const pendingItems = queue.filter((q) => q.status === "pending" || q.status === "error");

  const getActionBadge = (type: OfflineActionType) => {
    switch (type) {
      case "ADD_ITEM":
        return { label: "Nouveau Produit", color: "bg-emerald-950/70 border-emerald-500/40 text-emerald-300", icon: Package };
      case "UPDATE_ITEM":
        return { label: "Mise à jour", color: "bg-sky-950/70 border-sky-500/40 text-sky-300", icon: Edit3 };
      case "DELETE_ITEM":
      case "BATCH_DELETE":
        return { label: "Suppression", color: "bg-rose-950/70 border-rose-500/40 text-rose-300", icon: Trash2 };
      case "RENTAL_CHECKOUT":
        return { label: "Sortie Chantier", color: "bg-amber-950/70 border-amber-500/40 text-amber-300", icon: ArrowUpRight };
      case "RENTAL_CHECKIN":
        return { label: "Retour Stock", color: "bg-indigo-950/70 border-indigo-500/40 text-indigo-300", icon: CheckCircle2 };
      default:
        return { label: "Paramètre / Autre", color: "bg-slate-800 border-slate-600 text-slate-300", icon: Layers };
    }
  };

  const handleManualCheck = async () => {
    setIsCheckingPing(true);
    await onCheckConnection();
    setIsCheckingPing(false);
  };

  return (
    <div
      id="sync-queue-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0e111d] border border-[#1e233b] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1e233b] flex items-center justify-between bg-[#121626]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl border ${
                isOnline
                  ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-950/80 border-amber-500/30 text-amber-400"
              }`}
            >
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Gestionnaire de Connectivité & File d'attente</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    isOnline
                      ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-400"
                      : "bg-amber-950/80 border-amber-500/40 text-amber-300"
                  }`}
                >
                  {isOnline ? "En Ligne" : "Hors-Ligne"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {queue.length === 0
                  ? "Toutes vos modifications sont synchronisées avec le serveur."
                  : `${queue.length} changement(s) enregistré(s) localement en mémoire persistante.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1b2034] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connectivity Diagnostics & Simulation Toggle */}
        <div className="p-4 bg-[#141829] border-b border-[#1e233b] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="font-medium">
                {isOnline ? "Connexion active avec le serveur" : "Mode déconnecté (Queue locale active)"}
              </span>
            </div>
            {lastPingTime && (
              <span className="text-[10px] text-slate-500 font-mono">
                Vérifié à {new Date(lastPingTime).toLocaleTimeString("fr-FR")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={isCheckingPing}
              className="py-1.5 px-2.5 rounded-xl border border-[#262d48] bg-[#0e111d] text-slate-300 hover:text-white hover:bg-[#1a2036] transition flex items-center gap-1.5 text-[11px] font-semibold"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingPing ? "animate-spin text-indigo-400" : "text-slate-400"}`} />
              Tester ping
            </button>

            <button
              type="button"
              onClick={onToggleSimulatedOffline}
              className={`py-1.5 px-3 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 ${
                isSimulatedOffline
                  ? "bg-amber-600 border-amber-400 text-white shadow-md shadow-amber-600/30"
                  : "bg-[#0e111d] border-[#262d48] text-slate-300 hover:text-white hover:bg-[#181d30]"
              }`}
            >
              <WifiOff className="w-3 h-3" />
              {isSimulatedOffline ? "Désactiver simulation" : "Simuler déconnexion"}
            </button>
          </div>
        </div>

        {/* Offline Queue List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {queue.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">File d'attente vide</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Toutes vos actions ont été transmises et sécurisées sur le serveur central. En cas de coupure réseau, vos futures actions s'afficheront ici.
              </p>
            </div>
          ) : (
            queue.map((item, idx) => {
              const badge = getActionBadge(item.type);
              const IconComp = badge.icon;
              const isSelected = selectedAction?.id === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition ${
                    item.status === "error"
                      ? "bg-rose-950/20 border-rose-500/40"
                      : isSelected
                      ? "bg-[#161c32] border-indigo-500/50"
                      : "bg-[#111422] border-[#1f243b] hover:border-[#2b3352]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[#181d30] border border-[#2a3150] text-slate-400 flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0">
                        #{idx + 1}
                      </div>

                      <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${badge.color}`}>
                        <IconComp className="w-2.5 h-2.5" />
                        {badge.label}
                      </span>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{new Date(item.timestamp).toLocaleTimeString("fr-FR")}</span>
                          {item.status === "pending" && (
                            <span className="text-amber-400 font-sans font-medium">• En attente de sync</span>
                          )}
                          {item.status === "syncing" && (
                            <span className="text-sky-400 font-sans font-medium animate-pulse">• Envoi en cours...</span>
                          )}
                          {item.status === "error" && (
                            <span className="text-rose-400 font-sans font-medium">• Échec : {item.errorMessage}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedAction(isSelected ? null : item)}
                        className="py-1 px-2 rounded-lg text-[10px] font-semibold border border-[#262d48] text-slate-400 hover:text-slate-200 hover:bg-[#1a2036] transition"
                      >
                        {isSelected ? "Masquer détails" : "Détails"}
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        title="Retirer de la file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded JSON / Payload Details */}
                  {isSelected && (
                    <div className="mt-3 p-2.5 rounded-xl bg-[#090b14] border border-[#1d2238] text-[10px] font-mono text-slate-300">
                      <p className="text-indigo-400 font-bold mb-1">Charge utile (Payload) :</p>
                      <pre className="overflow-x-auto whitespace-pre-wrap max-h-36 text-slate-400">
                        {JSON.stringify(item.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 border-t border-[#1e233b] bg-[#121626] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {queue.length > 0 && (
              <button
                type="button"
                onClick={onClearQueue}
                className="py-2 px-3 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vider la file
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-[#282f4d] text-slate-300 hover:text-white hover:bg-[#1a2036] text-xs font-semibold transition"
            >
              Fermer
            </button>

            <button
              type="button"
              disabled={queue.length === 0 || isSyncing}
              onClick={onSyncAll}
              className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition ${
                queue.length === 0
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : isOnline
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                  : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing
                ? "Synchronisation en cours..."
                : `Synchroniser maintenant (${queue.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
