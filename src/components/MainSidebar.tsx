import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ArrowUpRight,
  Receipt,
  Package,
  Building2,
  Users,
  Calendar,
  Clock,
  Settings,
  Tv,
  ScanLine,
  Zap,
  Radio,
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  LogOut,
  ChevronDown,
  Warehouse,
  User,
  Layers,
  Wrench,
  Lock,
  Crown,
  Sparkles,
  Smartphone,
  QrCode,
  Columns,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import {
  MainAppNavTab,
  WarehouseStats,
  UserAccount,
  DepotWarehouse,
  SubscriptionConfig,
  SubscriptionTier,
} from "../types";
import { canAccessModule } from "../utils/subscriptionPlans";

interface MainSidebarProps {
  activeTab: MainAppNavTab;
  onSelectTab: (tab: MainAppNavTab) => void;
  stats: WarehouseStats;
  quotesCount: number;
  studiosCount: number;
  techniciansCount: number;
  inventoryCount: number;
  logsCount: number;
  isOnline: boolean;
  currentUser?: UserAccount | null;
  subscription?: SubscriptionConfig;
  depots?: DepotWarehouse[];
  activeDepotId?: string;
  onChangeActiveDepot?: (depotId: string) => void;
  onLogout?: () => void;
  onOpenQuickDeparture?: () => void;
  onOpenScanInvoice?: () => void;
  onOpenDualScreenPlanning?: () => void;
  onOpenUpgradeModal?: (recommendedTier?: SubscriptionTier) => void;
  onOpenPairingModal?: () => void;
  onOpenAuthModal?: () => void;
  appMode?: string;
  onSetAppMode?: (mode: "desktop" | "mobile-scanner" | "calendar-broadcast") => void;
  isSplitMode?: boolean;
  onToggleSplitMode?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const MainSidebar: React.FC<MainSidebarProps> = ({
  activeTab,
  onSelectTab,
  stats,
  quotesCount,
  studiosCount,
  techniciansCount,
  inventoryCount,
  logsCount,
  isOnline,
  currentUser = null,
  subscription,
  depots = [],
  activeDepotId = "DEP-01",
  onChangeActiveDepot,
  onLogout,
  onOpenScanInvoice,
  onOpenUpgradeModal = (_recommendedTier?: SubscriptionTier) => {},
  onOpenPairingModal,
  onOpenAuthModal,
  appMode = "desktop",
  onSetAppMode,
  isSplitMode = false,
  onToggleSplitMode,
  darkMode = true,
  onToggleDarkMode,
}) => {
  const [showDepotDropdown, setShowDepotDropdown] = useState(false);

  const safeDepots = depots || [];
  const activeDepot = safeDepots.find((d) => d.id === activeDepotId) || {
    id: "DEP-01",
    name: "Dépôt Central Paris-Nord",
    code: "PARIS-NORD",
    city: "Saint-Denis",
    colorBadge: "border-indigo-500 text-indigo-300 bg-indigo-950/60",
  };

  // Determine allowed depots for current user
  const userAllowedDepots = safeDepots.filter((d) => {
    if (!currentUser) return true;
    if (currentUser.role === "Administrateur" || currentUser.role === "manager") return true;
    if (currentUser.assignedDepots && currentUser.assignedDepots.length > 0) {
      return currentUser.assignedDepots.includes(d.id);
    }
    return true;
  });

  const canSwitchDepot = userAllowedDepots.length > 1;

  // Subscription gating checks
  const flightCasesAccess = canAccessModule("flightcases", subscription);
  const maintenanceAccess = canAccessModule("maintenance", subscription);
  const studiosAccess = canAccessModule("studios", subscription);
  const techniciansAccess = canAccessModule("technicians", subscription);
  const invoicesAccess = canAccessModule("invoices", subscription);
  const displaysAccess = canAccessModule("displays", subscription);

  return (
    <aside className="w-full lg:w-64 bg-[#161a2b] rounded-3xl border border-slate-700/60 p-3.5 shadow-xl flex flex-col justify-between space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="px-3 pt-1 pb-3 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
              K
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white tracking-tight">KROMA</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-black uppercase">
                  {subscription?.tier?.toUpperCase() || "OS"}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Broadcast & Parc Pro</div>
            </div>
          </div>

          {/* Live connectivity dot */}
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-amber-400 animate-pulse"
            }`}
            title={isOnline ? "Connecté au Cloud" : "Mode Hors-ligne"}
          />
        </div>

        {/* SUBSCRIPTION & PLAN BANNER WIDGET */}
        {subscription && (
          <div
            onClick={() => onOpenUpgradeModal(subscription.tier)}
            className="p-2.5 rounded-2xl bg-[#1c2237] border border-slate-700/70 hover:border-indigo-500/60 cursor-pointer transition flex items-center justify-between group shadow-sm"
            title="Gérer l'abonnement KROMA ou passer à la formule supérieure"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-black text-white flex items-center gap-1">
                  <span>KROMA {subscription.tier.toUpperCase()}</span>
                  {subscription.isTrial && (
                    <span className="text-[8px] text-amber-300 font-bold bg-amber-950 px-1 py-0.2 rounded">
                      Essai 14j
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 block truncate">
                  {subscription.isTrial ? "Accès illimité" : subscription.billingCycle === "annual" ? "Annuel (-20%)" : "Mensuel"}
                </span>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:text-amber-300 transition shrink-0" />
          </div>
        )}

        {/* DEPOT SELECTION WIDGET */}
        <div className="relative">
          <div className="p-2.5 rounded-2xl bg-[#1c2237] border border-slate-700/70 text-xs">
            <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1">
                <Warehouse className="w-3 h-3 text-indigo-400" />
                Dépôt Actif
              </span>
              {canSwitchDepot && (
                <span className="text-indigo-400 font-semibold text-[9px]">
                  {userAllowedDepots.length} sites
                </span>
              )}
            </div>

            {canSwitchDepot ? (
              <button
                type="button"
                id="btn-depot-switcher"
                onClick={() => setShowDepotDropdown(!showDepotDropdown)}
                className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-[#242c48] transition text-left"
              >
                <div className="min-w-0 pr-1">
                  <span className="font-bold text-white block truncate text-xs">
                    {activeDepot.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {activeDepot.city} ({activeDepot.code})
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ) : (
              <div className="p-1.5">
                <span className="font-bold text-white block truncate text-xs">
                  {activeDepot.name}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {activeDepot.city} ({activeDepot.code})
                </span>
              </div>
            )}
          </div>

          {/* Depot Dropdown menu */}
          {showDepotDropdown && canSwitchDepot && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 p-2 bg-[#161a2b] border border-slate-700 rounded-2xl shadow-2xl space-y-1 backdrop-blur-xl animate-fadeIn">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                Changer de dépôt de travail :
              </div>
              {userAllowedDepots.map((dep) => {
                const isCurrent = dep.id === activeDepotId;
                return (
                  <button
                    key={dep.id}
                    type="button"
                    onClick={() => {
                      if (onChangeActiveDepot) onChangeActiveDepot(dep.id);
                      setShowDepotDropdown(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition ${
                      isCurrent
                        ? "bg-indigo-600 text-white font-bold"
                        : "hover:bg-[#222942] text-slate-300"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-semibold">{dep.name}</div>
                      <div className="text-[10px] opacity-70 truncate">{dep.city}</div>
                    </div>
                    {isCurrent && <MapPin className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Group 1: VUE D'ENSEMBLE */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Supervision
          </div>

          <button
            id="nav-tab-dashboard"
            type="button"
            onClick={() => onSelectTab("dashboard")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={`w-4 h-4 ${activeTab === "dashboard" ? "text-white" : "text-indigo-400"}`} />
              <span>Tableau de Bord</span>
            </div>
            {Boolean(stats?.overdueCount && stats.overdueCount > 0) && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {stats.overdueCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-calendar"
            type="button"
            onClick={() => onSelectTab("calendar")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "calendar"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className={`w-4 h-4 ${activeTab === "calendar" ? "text-white" : "text-purple-400"}`} />
              <span>Planning & Régie</span>
            </div>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
              activeTab === "calendar" ? "bg-white/20 text-white" : "bg-[#242c48] text-purple-300 border border-purple-500/30"
            }`}>
              Régie
            </span>
          </button>

          <button
            id="nav-tab-displays"
            type="button"
            onClick={() => onSelectTab("displays")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "displays"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Tv className={`w-4 h-4 ${activeTab === "displays" ? "text-white" : "text-indigo-400"}`} />
              <span>Régie & Écrans Réseau</span>
            </div>
            <div className="flex items-center gap-1">
              {!displaysAccess.allowed ? (
                <Lock className="w-3.5 h-3.5 text-amber-400/80" title="Verrouillé (Formule Pro ou Ultimate requise)" />
              ) : (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  activeTab === "displays" ? "bg-white/20 text-white" : "bg-[#242c48] text-indigo-300 border border-indigo-500/30"
                }`}>
                  IP/RJ45
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Group 2: COMMERCIAL & COMMANDE */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Commercial & Devis
          </div>

          <button
            id="nav-tab-quotes"
            type="button"
            onClick={() => onSelectTab("quotes")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "quotes"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className={`w-4 h-4 ${activeTab === "quotes" ? "text-white" : "text-amber-400"}`} />
              <span>Devis Clients</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === "quotes" ? "bg-white/20 text-white" : "bg-[#242c48] text-slate-300"
            }`}>
              {quotesCount || 0}
            </span>
          </button>

          <button
            id="nav-tab-rentals"
            type="button"
            onClick={() => onSelectTab("rentals")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "rentals"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ArrowUpRight className={`w-4 h-4 ${activeTab === "rentals" ? "text-white" : "text-indigo-400"}`} />
              <span>Dossiers de Location</span>
            </div>
            {(stats?.activeRentalsCount || 0) > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {stats?.activeRentalsCount || 0}
              </span>
            ) : (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === "rentals" ? "bg-white/20 text-white" : "bg-[#242c48] text-slate-300"
              }`}>
                0
              </span>
            )}
          </button>

          <button
            id="nav-tab-directory"
            type="button"
            onClick={() => onSelectTab("directory")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "directory"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Building2 className={`w-4 h-4 ${activeTab === "directory" ? "text-white" : "text-purple-400"}`} />
              <span>Annuaire, Lieux & Confrères</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === "directory" ? "bg-white/20 text-white" : "bg-[#242c48] text-purple-300 border border-purple-500/30"
            }`}>
              3 Fiches
            </span>
          </button>

          <button
            id="nav-tab-invoices"
            type="button"
            onClick={() => onSelectTab("invoices")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "invoices"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Receipt className={`w-4 h-4 ${activeTab === "invoices" ? "text-white" : "text-emerald-400"}`} />
              <span>Facturation</span>
            </div>
            {!invoicesAccess.allowed && (
              <Lock className="w-3.5 h-3.5 text-amber-400/80" title="Verrouillé (Formule Ultimate)" />
            )}
          </button>
        </div>

        {/* Group 3: DÉPÔT, LOGISTIQUE & PARC */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Dépôt, Logistique & Parc
          </div>

          <button
            id="nav-tab-inventory"
            type="button"
            onClick={() => onSelectTab("inventory")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "inventory"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package className={`w-4 h-4 ${activeTab === "inventory" ? "text-white" : "text-indigo-400"}`} />
              <span>Inventaire & Stock</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === "inventory" ? "bg-white/20 text-white" : "bg-[#242c48] text-slate-300"
            }`}>
              {inventoryCount}
            </span>
          </button>

          <button
            id="nav-tab-flightcases"
            type="button"
            onClick={() => onSelectTab("flightcases")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "flightcases"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className={`w-4 h-4 ${activeTab === "flightcases" ? "text-white" : "text-cyan-400"}`} />
              <span>Malles & Flight Cases</span>
            </div>
            <div className="flex items-center gap-1.5">
              {!flightCasesAccess.allowed ? (
                <Lock className="w-3.5 h-3.5 text-amber-400/80" title="Verrouillé (Formule Pro ou Ultimate requise)" />
              ) : (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  activeTab === "flightcases" ? "bg-white/20 text-white" : "bg-[#242c48] text-cyan-300 border border-cyan-500/30"
                }`}>
                  RFID
                </span>
              )}
            </div>
          </button>

          <button
            id="nav-tab-maintenance"
            type="button"
            onClick={() => onSelectTab("maintenance")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "maintenance"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Wrench className={`w-4 h-4 ${activeTab === "maintenance" ? "text-white" : "text-amber-400"}`} />
              <span>Atelier SAV & Casse</span>
            </div>
            <div className="flex items-center gap-1.5">
              {!maintenanceAccess.allowed ? (
                <Lock className="w-3.5 h-3.5 text-amber-400/80" title="Verrouillé (Formule Pro ou Ultimate requise)" />
              ) : (
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  activeTab === "maintenance" ? "bg-white/20 text-white" : "bg-[#242c48] text-amber-300 border border-amber-500/30"
                }`}>
                  SAV
                </span>
              )}
            </div>
          </button>

          <button
            id="nav-tab-studios"
            type="button"
            onClick={() => onSelectTab("studios")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "studios"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Building2 className={`w-4 h-4 ${activeTab === "studios" ? "text-white" : "text-cyan-400"}`} />
              <span>Studios & Plateaux</span>
            </div>
            <div className="flex items-center gap-1.5">
              {!studiosAccess.allowed ? (
                <Lock className="w-3.5 h-3.5 text-amber-400/80" title="Verrouillé (Formule Ultimate requise)" />
              ) : (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === "studios" ? "bg-white/20 text-white" : "bg-[#242c48] text-slate-300"
                }`}>
                  {studiosCount}
                </span>
              )}
            </div>
          </button>

          <button
            id="nav-tab-technicians"
            type="button"
            onClick={() => onSelectTab("technicians")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "technicians"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className={`w-4 h-4 ${activeTab === "technicians" ? "text-white" : "text-emerald-400"}`} />
              <span>Personnel & Crew</span>
            </div>
            <div className="flex items-center gap-1.5">
              {!techniciansAccess.allowed ? (
                <Lock className="w-3.5 h-3.5 text-amber-400/80" title="Verrouillé (Option Crew ou Ultimate requise)" />
              ) : (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === "technicians" ? "bg-white/20 text-white" : "bg-[#242c48] text-slate-300"
                }`}>
                  {techniciansCount}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Group 4: SYSTÈME */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Système
          </div>

          <button
            id="nav-tab-logs"
            type="button"
            onClick={() => onSelectTab("logs")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "logs"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className={`w-4 h-4 ${activeTab === "logs" ? "text-white" : "text-sky-400"}`} />
              <span>Journal des Scans</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === "logs" ? "bg-white/20 text-white" : "bg-[#242c48] text-slate-300"
            }`}>
              {logsCount}
            </span>
          </button>

          <button
            id="nav-tab-settings"
            type="button"
            onClick={() => onSelectTab("settings")}
            className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-semibold transition ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25"
                : "text-slate-300 hover:text-white hover:bg-[#1f253d]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className={`w-4 h-4 ${activeTab === "settings" ? "text-white" : "text-amber-400"}`} />
              <span>Paramètres & Multi-Dépôts</span>
            </div>
          </button>
        </div>
      </div>

      {/* BOTTOM TOOLS & USER SECTION */}
      <div className="pt-3 border-t border-slate-700/60 space-y-2">
        {/* Smartphone pairing & mode shortcuts */}
        <div className="flex items-center gap-1.5">
          {onOpenPairingModal && (
            <button
              type="button"
              onClick={onOpenPairingModal}
              className="flex-1 py-1.5 px-2 rounded-xl bg-[#1c2237] hover:bg-[#242c48] border border-slate-700/70 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
              title="Scanner le QR Code pour ouvrir le scanner sur smartphone"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mobile QR</span>
            </button>
          )}

          {onSetAppMode && (
            <button
              type="button"
              onClick={() => onSetAppMode(appMode === "mobile-scanner" ? "desktop" : "mobile-scanner")}
              className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
                appMode === "mobile-scanner"
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-[#1c2237] hover:bg-[#242c48] border-slate-700/70 text-slate-300 hover:text-white"
              }`}
              title="Basculer vers la vue Scanner Mobile"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleSplitMode && (
            <button
              type="button"
              onClick={onToggleSplitMode}
              className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
                isSplitMode
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-[#1c2237] hover:bg-[#242c48] border-slate-700/70 text-slate-300 hover:text-white"
              }`}
              title="Vue Duo : Bureau + Mobile côte à côte"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleDarkMode && (
            <button
              type="button"
              id="btn-sidebar-theme-toggle"
              onClick={onToggleDarkMode}
              className="py-1.5 px-2.5 rounded-xl border border-slate-700/70 bg-[#1c2237] hover:bg-[#242c48] text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center transition"
              title={darkMode ? "Basculer en Mode Clair" : "Basculer en Mode Sombre"}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            </button>
          )}
        </div>

        {currentUser ? (
          <div className="p-2.5 rounded-2xl bg-[#1c2237] border border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden shadow">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 block truncate">{currentUser.role}</span>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                id="btn-logout"
                onClick={onLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : onOpenAuthModal ? (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="w-full p-2.5 rounded-2xl bg-[#1c2237] hover:bg-[#242c48] border border-slate-700/70 text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>Connexion Entreprise</span>
          </button>
        ) : null}
      </div>
    </aside>
  );
};
