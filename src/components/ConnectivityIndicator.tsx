import React from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Database,
} from "lucide-react";
import { QueuedOfflineAction } from "../types";

interface ConnectivityIndicatorProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  pendingQueue: QueuedOfflineAction[];
  isSyncing: boolean;
  onOpenQueueModal: () => void;
  onSyncNow: () => Promise<void>;
  onToggleSimulatedOffline: () => void;
}

export const ConnectivityIndicator: React.FC<ConnectivityIndicatorProps> = ({
  isOnline,
  isSimulatedOffline,
  pendingQueue,
  isSyncing,
  onOpenQueueModal,
  onSyncNow,
  onToggleSimulatedOffline,
}) => {
  const pendingCount = pendingQueue.length;

  return (
    <>
      {/* 1. Header Compact Badge */}
      <button
        id="desktop-connectivity-badge"
        type="button"
        onClick={onOpenQueueModal}
        className={`py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition shadow-sm ${
          !isOnline
            ? "bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/50"
            : pendingCount > 0
            ? "bg-indigo-950/60 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/50"
            : "bg-[#121524] border-[#22273e] text-slate-300 hover:text-white hover:bg-[#181d30]"
        }`}
        title={
          isOnline
            ? "Connecté au serveur central. Cliquez pour voir les diagnostics de synchronisation."
            : "Mode déconnecté actif. Cliquez pour ouvrir la file d'attente des changements."
        }
      >
        <span className="relative flex h-2 w-2">
          {isOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </>
          )}
        </span>

        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="font-bold">
            {isOnline ? "En Ligne" : "Hors-Ligne"}
          </span>
        </div>

        {pendingCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] ml-0.5 animate-pulse">
            {pendingCount}
          </span>
        )}

        {isSyncing && (
          <RefreshCw className="w-3 h-3 animate-spin text-sky-400 ml-0.5" />
        )}
      </button>

      {/* 2. Persistent Offline Warning Banner (Displayed when offline or when actions are pending) */}
      {(!isOnline || pendingCount > 0) && (
        <div
          id="desktop-offline-banner"
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md transition-all ${
            !isOnline
              ? "bg-amber-950/80 border-amber-500/50 text-amber-200"
              : "bg-indigo-950/80 border-indigo-500/50 text-indigo-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl flex-shrink-0 ${
                !isOnline
                  ? "bg-amber-900/80 text-amber-300 border border-amber-500/40"
                  : "bg-indigo-900/80 text-indigo-300 border border-indigo-500/40"
              }`}
            >
              {!isOnline ? (
                <WifiOff className="w-4 h-4 animate-pulse" />
              ) : (
                <Database className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs text-white">
                  {!isOnline ? "Mode Déconnecté Actif" : "Synchronisation en Attente"}
                </span>
                {isSimulatedOffline && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-400/20 border border-amber-400/40 text-amber-300">
                    Mode Simulation
                  </span>
                )}
                <span className="text-[11px] opacity-90">
                  {pendingCount === 0
                    ? "Vos données actuelles sont consultables hors-ligne."
                    : `${pendingCount} opération(s) en file d'attente locale.`}
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                {!isOnline
                  ? "Toutes vos créations, modifications de stock et sorties chantiers sont sauvegardées localement et seront synchronisées dès le retour de la connexion."
                  : "Des modifications ont été enregistrées localement et sont prêtes à être envoyées au serveur."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
            {isSimulatedOffline && (
              <button
                type="button"
                onClick={onToggleSimulatedOffline}
                className="py-1.5 px-3 rounded-xl border border-amber-400/40 bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-xs font-semibold transition"
              >
                Quitter simulation
              </button>
            )}

            <button
              type="button"
              onClick={onOpenQueueModal}
              className="py-1.5 px-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span>Voir la file ({pendingCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {isOnline && pendingCount > 0 && (
              <button
                type="button"
                disabled={isSyncing}
                onClick={onSyncNow}
                className="py-1.5 px-3 rounded-xl bg-white text-slate-900 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "En cours..." : "Synchroniser tout"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
