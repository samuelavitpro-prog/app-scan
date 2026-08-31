import React, { useState } from "react";
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Filter,
  DollarSign,
  Package,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Truck,
  FileText,
  Eye,
  Check,
  X,
  Camera,
  Sun,
  Zap,
  Activity,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  MaintenanceTicket,
  InventoryItem,
  ClientQuote,
  IncidentType,
  IncidentSeverity,
  MaintenanceTicketStatus,
  AppSettings,
} from "../types";
import { formatPrice } from "../utils/currency";

interface MaintenanceSAVDashboardProps {
  tickets?: MaintenanceTicket[];
  inventory?: InventoryItem[];
  items?: InventoryItem[];
  quotes?: ClientQuote[];
  settings?: AppSettings;
  onCreateTicket?: (ticket: Omit<MaintenanceTicket, "id" | "ticketNumber" | "createdAt" | "updatedAt">) => Promise<boolean> | void;
  onUpdateTicket?: (id: string, updates: Partial<MaintenanceTicket>) => Promise<boolean> | void;
  onResolveTicketAndRestock?: (ticketId: string, itemId: string) => Promise<boolean> | void;
  onUpdateItem?: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>;
  onNavigateToQuotes?: () => void;
}

export const MaintenanceSAVDashboard: React.FC<MaintenanceSAVDashboardProps> = ({
  tickets = [],
  inventory = [],
  items = [],
  quotes = [],
  settings,
  onCreateTicket = async (_ticket: any) => false,
  onUpdateTicket = async (_id: string, _updates: any) => false,
  onResolveTicketAndRestock = async (_ticketId: string, _itemId: string) => false,
  onUpdateItem = async (_id: string, _updates: any) => false,
  onNavigateToQuotes,
}) => {
  const safeTickets = tickets || [];
  const safeInventory = (inventory && inventory.length > 0) ? inventory : (items || []);
  const safeQuotes = quotes || [];
  const [activeTab, setActiveTab] = useState<"tickets" | "healthbook">("tickets");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterBillable, setFilterBillable] = useState<string>("all");

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);

  // New ticket form state
  const [formItemId, setFormItemId] = useState("");
  const [formIncidentType, setFormIncidentType] = useState<IncidentType>("breakage_return");
  const [formSeverity, setFormSeverity] = useState<IncidentSeverity>("medium");
  const [formDescription, setFormDescription] = useState("");
  const [formIsClientResponsible, setFormIsClientResponsible] = useState(false);
  const [formRelatedQuoteId, setFormRelatedQuoteId] = useState("");
  const [formEstimatedCostHT, setFormEstimatedCostHT] = useState(0);
  const [formManufacturerRMA, setFormManufacturerRMA] = useState("");
  const [formEstimatedReturnDate, setFormEstimatedReturnDate] = useState("");

  // Statistics
  const activeTickets = safeTickets.filter(
    (t) => t.status !== "completed_back_stock" && t.status !== "written_off"
  );
  const totalRepairEstimated = activeTickets.reduce(
    (sum, t) => sum + (t.repairCostEstimatedHT || 0),
    0
  );
  const totalBilledToClients = safeTickets
    .filter((t) => t.isClientResponsible && t.repairCostEstimatedHT)
    .reduce((sum, t) => sum + (t.repairCostEstimatedHT || 0), 0);

  const manufacturerCount = safeTickets.filter(
    (t) => t.status === "sent_to_manufacturer"
  ).length;

  // Filtered tickets
  const filteredTickets = safeTickets.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterSeverity !== "all" && t.severity !== filterSeverity) return false;
    if (filterBillable === "billable" && !t.isClientResponsible) return false;
    if (filterBillable === "internal" && t.isClientResponsible) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (t.itemName || "").toLowerCase().includes(q);
      const matchNum = (t.ticketNumber || "").toLowerCase().includes(q);
      const matchSN = (t.serialNumber || "").toLowerCase().includes(q);
      const matchClient = (t.clientName || "").toLowerCase().includes(q);
      if (!matchName && !matchNum && !matchSN && !matchClient) return false;
    }
    return true;
  });

  const handleOpenCreateModal = (preselectedItemId?: string) => {
    if (preselectedItemId) {
      setFormItemId(preselectedItemId);
    } else if (safeInventory.length > 0) {
      setFormItemId(safeInventory[0].id);
    }
    setFormIncidentType("breakage_return");
    setFormSeverity("medium");
    setFormDescription("");
    setFormIsClientResponsible(false);
    setFormRelatedQuoteId("");
    setFormEstimatedCostHT(150);
    setFormManufacturerRMA("");
    setFormEstimatedReturnDate("");
    setShowCreateModal(true);
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = safeInventory.find((i) => i.id === formItemId);
    if (!item) return;

    const relatedQuote = safeQuotes.find((q) => q.id === formRelatedQuoteId);

    await onCreateTicket({
      itemId: item.id,
      itemName: item.name,
      itemSku: item.sku,
      serialNumber: item.serialNumber,
      category: item.category,
      brand: item.brand,
      incidentType: formIncidentType,
      severity: formSeverity,
      status: "diagnosing",
      reportedDate: new Date().toISOString(),
      reportedBy: "Responsable Atelier SAV",
      description: formDescription,
      isClientResponsible: formIsClientResponsible,
      relatedQuoteId: relatedQuote?.id,
      relatedQuoteNumber: relatedQuote?.quoteNumber,
      clientName: relatedQuote?.clientName,
      clientCompany: relatedQuote?.clientCompany || relatedQuote?.productionCompany,
      repairCostEstimatedHT: Number(formEstimatedCostHT) || 0,
      manufacturerRMA: formManufacturerRMA,
      estimatedReturnDate: formEstimatedReturnDate,
    });

    setShowCreateModal(false);
  };

  const getStatusBadge = (status: MaintenanceTicketStatus) => {
    switch (status) {
      case "diagnosing":
        return {
          label: "1. Diagnostic en cours",
          color: "bg-amber-950/80 text-amber-300 border-amber-500/40",
          icon: Clock,
        };
      case "in_repair_inhouse":
        return {
          label: "2. En réparation interne",
          color: "bg-indigo-950/80 text-indigo-300 border-indigo-500/40",
          icon: Wrench,
        };
      case "sent_to_manufacturer":
        return {
          label: "3. SAV Constructeur (RMA)",
          color: "bg-purple-950/80 text-purple-300 border-purple-500/40",
          icon: Truck,
        };
      case "waiting_parts":
        return {
          label: "En attente pièces",
          color: "bg-orange-950/80 text-orange-300 border-orange-500/40",
          icon: AlertTriangle,
        };
      case "repaired_testing":
        return {
          label: "4. Réparé / Banc de test",
          color: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40",
          icon: Sparkles,
        };
      case "completed_back_stock":
        return {
          label: "✓ Réintégré en Stock",
          color: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
          icon: CheckCircle2,
        };
      case "written_off":
        return {
          label: "Rebut / Irréparable",
          color: "bg-rose-950/80 text-rose-300 border-rose-500/40",
          icon: ShieldAlert,
        };
    }
  };

  const getIncidentTypeLabel = (type: IncidentType) => {
    switch (type) {
      case "breakage_return":
        return "Casse au retour de tournage";
      case "optical_scratch":
        return "Rayure / Impact optique";
      case "electronic_failure":
        return "Panne électronique / Firmware";
      case "connector_damaged":
        return "Connectique / BNC / Lemo tordu";
      case "cable_cut":
        return "Câble sectionné / dénudé";
      case "wear_and_tear":
        return "Usure normale & Révision";
      case "periodic_vgp":
        return "Contrôle périodique VGP Levage";
      case "firmware_calibration":
        return "Calibration mire / Flange";
      case "missing_part":
        return "Pièce / Accessoire manquant";
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header & KPI Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121629] p-6 rounded-3xl border border-[#1f2647] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Atelier SAV, Maintenance & Carnet de Santé
              </h1>
              <p className="text-xs text-slate-400">
                Suivi des pannes, révisions constructeurs (ARRI, Sony, RED), réparations et refacturation casse client
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-[#181d36] p-1 rounded-2xl border border-[#262e54]">
            <button
              onClick={() => setActiveTab("tickets")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "tickets"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Dossiers SAV ({activeTickets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("healthbook")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "healthbook"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Carnet de Santé Parc ({safeInventory.length})</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-amber-600/30 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Déclarer une Casse / SAV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#121629] border border-[#1e2544] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Matériels en Atelier
          </span>
          <div className="text-2xl font-black text-amber-400">
            {activeTickets.length}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Actuellement indisponibles à la location
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121629] border border-[#1e2544] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            SAV Constructeur (RMA)
          </span>
          <div className="text-2xl font-black text-purple-400">
            {manufacturerCount}
          </div>
          <span className="text-[10px] text-slate-500 block">
            En révision ARRI / Sony / Aputure
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121629] border border-[#1e2544] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Coût Estimé Réparations
          </span>
          <div className="text-2xl font-black text-indigo-400 font-mono">
            {totalRepairEstimated.toLocaleString("fr-FR")} € HT
          </div>
          <span className="text-[10px] text-slate-500 block">
            Devis pièces et main d'œuvre atelier
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121629] border border-[#1e2544] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Casse Imputable Clients
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {totalBilledToClients.toLocaleString("fr-FR")} € HT
          </div>
          <span className="text-[10px] text-slate-500 block">
            À refacturer ou déduire de la caution
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TICKETS D'INTERVENTION SAV                                         */}
      {/* ========================================================================= */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#121629] p-3 rounded-2xl border border-[#1f2647]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher ticket, matériel, S/N, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#171c33] border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#171c33] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-semibold focus:outline-none"
              >
                <option value="all">Tous les Statuts</option>
                <option value="diagnosing">1. Diagnostic en cours</option>
                <option value="in_repair_inhouse">2. Réparation interne</option>
                <option value="sent_to_manufacturer">3. SAV Constructeur (RMA)</option>
                <option value="waiting_parts">En attente pièces</option>
                <option value="repaired_testing">4. Réparé / Banc de test</option>
                <option value="completed_back_stock">✓ Réintégrés en stock</option>
              </select>

              <select
                value={filterBillable}
                onChange={(e) => setFilterBillable(e.target.value)}
                className="bg-[#171c33] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-semibold focus:outline-none"
              >
                <option value="all">Toutes Responsabilités</option>
                <option value="billable">Imputable Client (Casse Tournage)</option>
                <option value="internal">Usure Interne / Révision Dépôt</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTickets.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-[#121629] rounded-3xl border border-dashed border-slate-800 text-slate-400">
                <Wrench className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="font-bold text-sm text-slate-300">Aucun dossier de maintenance trouvé</p>
                <p className="text-xs text-slate-500 mt-1">
                  Votre parc de matériel est 100% opérationnel ou aucun ticket ne correspond aux filtres.
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const statusMeta = getStatusBadge(ticket.status);
                const StatusIcon = statusMeta.icon;

                return (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-2xl bg-[#121629] border border-[#1f2647] hover:border-indigo-500/50 transition shadow-lg space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      {/* Ticket Header & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/30">
                            {ticket.ticketNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(ticket.reportedDate).toLocaleDateString("fr-FR")}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-lg border text-[10px] font-black flex items-center gap-1 ${statusMeta.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusMeta.label}</span>
                        </span>
                      </div>

                      {/* Item Name & Details */}
                      <div>
                        <h4 className="text-sm font-black text-white line-clamp-1">
                          {ticket.itemName}
                        </h4>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{ticket.brand || "Marque"}</span>
                          {ticket.serialNumber && (
                            <span className="font-mono text-slate-300">
                              S/N: {ticket.serialNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Incident Cause & Severity */}
                      <div className="p-2.5 rounded-xl bg-[#171c33] border border-[#242c4f] space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">
                            {getIncidentTypeLabel(ticket.incidentType)}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                              ticket.severity === "critical"
                                ? "bg-rose-950 text-rose-300"
                                : ticket.severity === "medium"
                                ? "bg-amber-950 text-amber-300"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {ticket.severity === "critical" ? "Critique" : ticket.severity === "medium" ? "Moyen" : "Mineur"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                          "{ticket.description}"
                        </p>
                      </div>

                      {/* Client Casse Imputation if applicable */}
                      {ticket.isClientResponsible && (
                        <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold block">Imputé au client :</span>
                            <span className="text-[10px] text-rose-300 truncate block">
                              {ticket.clientCompany || ticket.clientName || "Production"} ({ticket.relatedQuoteNumber || "Devis"})
                            </span>
                          </div>
                          <span className="font-mono font-black text-rose-300">
                            {ticket.repairCostEstimatedHT} € HT
                          </span>
                        </div>
                      )}

                      {/* Manufacturer RMA if applicable */}
                      {ticket.manufacturerRMA && (
                        <div className="text-[10px] text-purple-300 font-mono bg-purple-950/40 px-2 py-1 rounded-lg border border-purple-500/20">
                          RMA Constructeur : {ticket.manufacturerRMA}
                          {ticket.estimatedReturnDate && (
                            <span className="block text-slate-400">
                              Retour estimé : {new Date(ticket.estimatedReturnDate).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[#1e2544] flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        Coût : {ticket.repairCostEstimatedHT || 0} € HT
                      </span>

                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 transition"
                      >
                        <span>Gérer & Clôturer</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CARNET DE SANTÉ & USURE DU PARC                                   */}
      {/* ========================================================================= */}
      {activeTab === "healthbook" && (
        <div className="space-y-4">
          <div className="bg-[#121629] p-4 rounded-3xl border border-[#1f2647] space-y-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Carnet de Santé & Historique Technique du Parc Audiovisuel
            </h3>
            <p className="text-xs text-slate-400">
              Visualisez le taux d'utilisation, l'état physique, la valeur d'assurance et planifiez les révisions préventives.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#171c33] text-[10px] uppercase text-slate-400 font-bold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Matériel & Réf</th>
                    <th className="py-2.5 px-2">Catégorie</th>
                    <th className="py-2.5 px-2">N° Série (S/N)</th>
                    <th className="py-2.5 px-2">État Physique</th>
                    <th className="py-2.5 px-2 text-center">En Stock / Rented / SAV</th>
                    <th className="py-2.5 px-2 text-right">Valeur Remplacement</th>
                    <th className="py-2.5 px-3 text-center">Action SAV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {safeInventory.map((item) => {
                    const itemTickets = safeTickets.filter((t) => t.itemId === item.id);
                    const hasActiveSAV = itemTickets.some(
                      (t) => t.status !== "completed_back_stock" && t.status !== "written_off"
                    );

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-white">
                          <div className="flex items-center gap-2">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-7 h-7 rounded-lg object-cover bg-slate-800"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                {item.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <span>{item.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal block font-mono">
                                {item.sku}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2 px-2 text-slate-300">{item.category}</td>

                        <td className="py-2 px-2 font-mono text-slate-300">
                          {item.serialNumber || <span className="text-slate-500 italic">Lot commun</span>}
                        </td>

                        <td className="py-2 px-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.condition === "Neuf" || item.condition === "Très bon état"
                                ? "bg-emerald-950/80 text-emerald-300"
                                : item.condition === "Bon état"
                                ? "bg-indigo-950/80 text-indigo-300"
                                : "bg-amber-950/80 text-amber-300"
                            }`}
                          >
                            {item.condition}
                          </span>
                        </td>

                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1 font-mono text-[11px]">
                            <span className="text-emerald-400 font-bold" title="Disponible">
                              {item.availableQuantity}
                            </span>
                            <span className="text-slate-600">/</span>
                            <span className="text-amber-400" title="En tournage">
                              {item.rentedQuantity}
                            </span>
                            {hasActiveSAV && (
                              <span className="text-rose-400 font-bold ml-1" title="En atelier SAV">
                                (1 SAV)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-300">
                          {(item.replacementValue || item.unitPrice * 1.5 || 0).toLocaleString("fr-FR")} €
                        </td>

                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleOpenCreateModal(item.id)}
                            className="px-2.5 py-1 rounded-xl bg-[#1e2544] hover:bg-amber-600 text-amber-300 hover:text-white font-bold text-[11px] transition flex items-center gap-1 mx-auto"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>Ouvrir SAV</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOUVEAU TICKET D'INCIDENT / CASSE                                 */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f1222] border border-[#232a4a] rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1e2544] pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Déclarer un Incident / Casse / SAV Matériel
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ouvrez un dossier technique pour immobiliser l'article et lancer le diagnostic
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-[#181d36] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTicket} className="space-y-4 text-xs">
              {/* Item selection */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                  Matériel Concerné :
                </label>
                <select
                  value={formItemId}
                  onChange={(e) => setFormItemId(e.target.value)}
                  className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2.5 text-white font-semibold focus:border-indigo-500"
                  required
                >
                  {safeInventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.brand}) - S/N: {inv.serialNumber || "N/C"} - SKU: {inv.sku}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type and Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                    Type d'Incident :
                  </label>
                  <select
                    value={formIncidentType}
                    onChange={(e) => setFormIncidentType(e.target.value as IncidentType)}
                    className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
                  >
                    <option value="breakage_return">Casse au retour de tournage</option>
                    <option value="optical_scratch">Rayure / Impact optique</option>
                    <option value="electronic_failure">Panne électronique / Firmware</option>
                    <option value="connector_damaged">Connectique / BNC / Lemo tordu</option>
                    <option value="cable_cut">Câble sectionné / dénudé</option>
                    <option value="wear_and_tear">Usure normale & Révision</option>
                    <option value="periodic_vgp">Contrôle périodique VGP Levage</option>
                    <option value="firmware_calibration">Calibration mire / Flange</option>
                    <option value="missing_part">Pièce / Accessoire manquant</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                    Gravité de l'Incident :
                  </label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as IncidentSeverity)}
                    className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
                  >
                    <option value="minor">Mineure (Cosmétique / Fonctionnel)</option>
                    <option value="medium">Moyenne (Utilisation restreinte)</option>
                    <option value="critical">Critique (Hors d'usage / Danger)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                  Description du Constat / Panne :
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Lentille frontale rayée suite à tournage en extérieur sableux, vis de serrage du bras articulé cassée..."
                  rows={3}
                  className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Client Refacturation Box */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/80 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-amber-300 font-bold">
                  <input
                    type="checkbox"
                    checked={formIsClientResponsible}
                    onChange={(e) => setFormIsClientResponsible(e.target.checked)}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                  <span>Imputer la casse / réparation au Client (Casse Tournage)</span>
                </label>

                {formIsClientResponsible && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                        Dossier de Tournage Associé :
                      </label>
                      <select
                        value={formRelatedQuoteId}
                        onChange={(e) => setFormRelatedQuoteId(e.target.value)}
                        className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2 text-white font-semibold"
                      >
                        <option value="">Sélectionner le dossier client...</option>
                        {safeQuotes.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.quoteNumber} - {q.projectName || q.clientName} ({q.clientCompany || "Production"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                        Coût Réparation Estimé HT :
                      </label>
                      <input
                        type="number"
                        value={formEstimatedCostHT}
                        onChange={(e) => setFormEstimatedCostHT(Number(e.target.value))}
                        className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* RMA & Manufacturer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                    RMA Constructeur (Si expédié ARRI / Sony) :
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: RMA-ARRI-94812"
                    value={formManufacturerRMA}
                    onChange={(e) => setFormManufacturerRMA(e.target.value)}
                    className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider">
                    Date Retour Estimée :
                  </label>
                  <input
                    type="date"
                    value={formEstimatedReturnDate}
                    onChange={(e) => setFormEstimatedReturnDate(e.target.value)}
                    className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2 text-white"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e2544]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#171c33] text-slate-400 hover:text-white font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black shadow-lg shadow-amber-600/30 flex items-center gap-1.5"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Créer le Dossier SAV</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL & GESTION DU TICKET SAV SÉLECTIONNÉ                        */}
      {/* ========================================================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f1222] border border-[#232a4a] rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1e2544] pb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  {selectedTicket.ticketNumber}
                </span>
                <h3 className="text-base font-black text-white">{selectedTicket.itemName}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-xl bg-[#181d36] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#171c33] border border-[#242c4f] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Description :</span>
                  <span className="text-[10px] text-slate-400">
                    Déclaré le {new Date(selectedTicket.reportedDate).toLocaleDateString("fr-FR")} par {selectedTicket.reportedBy}
                  </span>
                </div>
                <p className="text-white italic">"{selectedTicket.description}"</p>
              </div>

              {/* Status Update Step */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300 uppercase text-[10px] tracking-wider block">
                  Changer le Statut d'Atelier :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "diagnosing" as MaintenanceTicketStatus, label: "1. Diagnostic" },
                    { id: "in_repair_inhouse" as MaintenanceTicketStatus, label: "2. Réparation Interne" },
                    { id: "sent_to_manufacturer" as MaintenanceTicketStatus, label: "3. SAV Constructeur (RMA)" },
                    { id: "waiting_parts" as MaintenanceTicketStatus, label: "Attente Pièces" },
                    { id: "repaired_testing" as MaintenanceTicketStatus, label: "4. Réparé / Banc Test" },
                    { id: "completed_back_stock" as MaintenanceTicketStatus, label: "✓ Réintégrer en Stock" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onUpdateTicket(selectedTicket.id, { status: s.id });
                        setSelectedTicket((prev) => prev ? { ...prev, status: s.id } : null);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border transition text-left ${
                        selectedTicket.status === s.id
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                          : "bg-[#171c33] text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#1e2544]">
                {onResolveTicketAndRestock && (
                  <button
                    type="button"
                    onClick={() => {
                      onResolveTicketAndRestock(selectedTicket.id, selectedTicket.itemId);
                      setSelectedTicket(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Clôturer & Remettre en Stock Disponible</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-[#171c33] text-slate-400 hover:text-white font-bold text-xs"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
