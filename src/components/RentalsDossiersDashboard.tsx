import React, { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Package,
  Calendar,
  User,
  Phone,
  Building2,
  FileText,
  Printer,
  ChevronRight,
  X,
  Plus,
  ShieldAlert,
  Wrench,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Info,
  Truck,
  FileCheck,
  Receipt,
  MapPin,
  Check,
  AlertCircle,
  Eye,
  Edit3,
} from "lucide-react";
import {
  InventoryItem,
  ClientQuote,
  RentalOrderStatus,
  ItemReturnCondition,
  QuoteItemLine,
  AppSettings,
  DocumentPrintType,
  DocumentSignature,
} from "../types";
import { DocumentPrintModal } from "./DocumentPrintModal";
import { SignaturePadModal, SignatureTargetType } from "./SignaturePadModal";
import { PenTool, UserCheck, ShieldCheck } from "lucide-react";

interface RentalsDossiersDashboardProps {
  quotes?: ClientQuote[];
  items?: InventoryItem[];
  settings?: AppSettings;
  onUpdateQuote: (id: string, updates: Partial<ClientQuote>) => Promise<boolean>;
  onUpdateItemStock?: (itemId: string, availableDelta: number, totalDelta?: number) => void;
  onRefresh?: () => void;
  onOpenNewQuote?: () => void;
  onOpenQuickDeparture?: () => void;
  onEditQuote?: (quote: ClientQuote) => void;
}

export const RentalsDossiersDashboard: React.FC<RentalsDossiersDashboardProps> = ({
  quotes = [],
  items = [],
  settings = {
    companyName: "KROMA Audiovisuel & Logistique",
    warehouseName: "Dépôt Central Paris-Nord",
    currency: "EUR",
    cloudAI: {
      aiProvider: "gemini",
      modelName: "gemini-2.5-flash",
      visionQuality: "high",
      autoFillConfidenceThreshold: 0.85,
      cloudSyncFrequency: "instant",
      cloudStorageProvider: "google_drive",
      autoBackupEnabled: true,
      apiKeyConfigured: true,
      aiPromptContext: "",
    },
    defaultDailyRentalRatio: 0.05,
    autoOverdueAlerts: true,
  },
  onUpdateQuote,
  onRefresh,
  onOpenNewQuote,
  onOpenQuickDeparture,
  onEditQuote,
}) => {
  const safeQuotes = quotes || [];
  const safeItems = items || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Full Dossier Inspection & Detail Modal State
  const [activeDossierModal, setActiveDossierModal] = useState<ClientQuote | null>(null);
  
  // Check-in / Return Modal State
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [selectedRentalQuote, setSelectedRentalQuote] = useState<ClientQuote | null>(null);
  const [inspectionItems, setInspectionItems] = useState<QuoteItemLine[]>([]);
  const [generalReturnNotes, setGeneralReturnNotes] = useState("");
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  
  // Print Modal State
  const [printModalData, setPrintModalData] = useState<{
    quote: ClientQuote;
    type: DocumentPrintType;
  } | null>(null);

  // Signature Pad Modal State
  const [signatureModalData, setSignatureModalData] = useState<{
    quote: ClientQuote;
    target: SignatureTargetType;
  } | null>(null);

  const handleSaveSignature = async (
    quoteId: string,
    signature: DocumentSignature,
    target: SignatureTargetType
  ) => {
    const updates: Partial<ClientQuote> = {};
    if (target === "client_departure") {
      updates.departureSignature = signature;
    } else if (target === "operator_departure") {
      updates.operatorDepartureSignature = signature;
    } else if (target === "client_return") {
      updates.returnSignature = signature;
    } else if (target === "operator_return") {
      updates.operatorReturnSignature = signature;
    }

    await onUpdateQuote(quoteId, updates);
    
    // Update local modal if open
    if (activeDossierModal && activeDossierModal.id === quoteId) {
      setActiveDossierModal((prev) => (prev ? { ...prev, ...updates } : null));
    }

    if (onRefresh) {
      onRefresh();
    }
  };

  // A quote becomes an operational dossier only after explicit conversion.
  // Accepted quotes without rentalStatus remain commercial documents.
  const rentalQuotes = safeQuotes.filter(
    (q) =>
      q && (
        q.rentalStatus !== undefined
      )
  );

  // Calculate statistics
  const now = new Date();
  const activeRentals = rentalQuotes.filter(
    (q) => (q.rentalStatus || "in_rental") === "in_rental"
  );
  const overdueRentals = rentalQuotes.filter((q) => {
    const isRental = (q.rentalStatus || "in_rental") === "in_rental";
    if (!isRental) return false;
    const end = new Date(q.endDate);
    return end < now;
  });
  const incompleteRentals = rentalQuotes.filter(
    (q) => q.rentalStatus === "incomplete_return"
  );
  const disputedRentals = rentalQuotes.filter(
    (q) => q.rentalStatus === "disputed"
  );
  const returnedRentals = rentalQuotes.filter(
    (q) => q.rentalStatus === "returned"
  );

  // Filter rentals based on filter pills and query
  const filteredRentals = rentalQuotes.filter((q) => {
    const isOverdue = new Date(q.endDate) < now && (q.rentalStatus || "in_rental") === "in_rental";
    const currentStatus: RentalOrderStatus = q.rentalStatus || (isOverdue ? "overdue" : "in_rental");
    
    if (statusFilter !== "all") {
      if (statusFilter === "overdue" && currentStatus !== "overdue") return false;
      if (statusFilter === "in_rental" && currentStatus !== "in_rental") return false;
      if (statusFilter === "incomplete_return" && currentStatus !== "incomplete_return") return false;
      if (statusFilter === "disputed" && currentStatus !== "disputed") return false;
      if (statusFilter === "returned" && currentStatus !== "returned") return false;
    }

    if (searchQuery) {
      const qLower = searchQuery.toLowerCase();
      const matchNum = q.quoteNumber.toLowerCase().includes(qLower);
      const matchClient = q.clientName.toLowerCase().includes(qLower);
      const matchCompany = q.clientCompany?.toLowerCase().includes(qLower);
      const matchDepot = q.depotName?.toLowerCase().includes(qLower);
      if (!matchNum && !matchClient && !matchCompany && !matchDepot) return false;
    }
    return true;
  });

  // Open Full Dossier Details
  const handleOpenDossier = (quote: ClientQuote) => {
    setActiveDossierModal(quote);
  };

  // Open Return / Check-in Modal
  const handleOpenCheckin = (quote: ClientQuote, defaultMode: "complete" | "incomplete" = "complete") => {
    setSelectedRentalQuote(quote);
    
    // Prepare inspection items with kit accessories defaults
    const linesWithDefaults = (quote.rentalItems || []).map((item) => {
      const invItem = safeItems.find((i) => i.id === item.itemId);
      const accessories = item.includedAccessories || invItem?.includedAccessories || [];
      
      if (defaultMode === "complete") {
        return {
          ...item,
          includedAccessories: accessories,
          returnStatus: "returned_ok" as ItemReturnCondition,
          returnedOkQty: item.quantity,
          missingQty: 0,
          damagedQty: 0,
          lostQty: 0,
          stolenQty: 0,
          missingAccessories: [],
          inspectionNotes: "",
        };
      } else {
        return {
          ...item,
          includedAccessories: accessories,
          returnStatus: item.returnStatus || ("returned_ok" as ItemReturnCondition),
          returnedOkQty: item.returnedOkQty ?? item.quantity,
          missingQty: item.missingQty || 0,
          damagedQty: item.damagedQty || 0,
          lostQty: item.lostQty || 0,
          stolenQty: item.stolenQty || 0,
          missingAccessories: item.missingAccessories || [],
          inspectionNotes: item.inspectionNotes || "",
        };
      }
    });

    setInspectionItems(linesWithDefaults);
    setGeneralReturnNotes(quote.disputeNotes || quote.incompleteReturnNotes || "");
    setIsCheckinModalOpen(true);
  };

  // Fast 1-Click "Retour Complet (100% Conforme)"
  const handleQuickRetourComplet = async (quote: ClientQuote) => {
    const updatedItems = (quote.rentalItems || []).map((item) => ({
      ...item,
      returnStatus: "returned_ok" as ItemReturnCondition,
      returnedOkQty: item.quantity,
      missingQty: 0,
      damagedQty: 0,
      lostQty: 0,
      stolenQty: 0,
      missingAccessories: [],
      inspectionNotes: "Restitution 100% conforme au dépôt.",
    }));

    await onUpdateQuote(quote.id, {
      rentalItems: updatedItems,
      rentalStatus: "returned",
      returnType: "complete",
      actualReturnDate: new Date().toISOString().split("T")[0],
      disputeNotes: "",
      incompleteReturnNotes: "",
      penaltyCharges: 0,
    });

    if (activeDossierModal && activeDossierModal.id === quote.id) {
      setActiveDossierModal({
        ...activeDossierModal,
        rentalItems: updatedItems,
        rentalStatus: "returned",
        returnType: "complete",
        actualReturnDate: new Date().toISOString().split("T")[0],
      });
    }

    if (onRefresh) onRefresh();
  };

  // Submit Detailed Inspection (Full or Incomplete)
  const handleSubmitInspection = async (forcedStatus?: RentalOrderStatus) => {
    if (!selectedRentalQuote) return;
    setIsSubmittingCheckin(true);

    let hasMissing = false;
    let hasDamagedOrLost = false;
    let totalPenalty = 0;
    const missingSummaries: string[] = [];

    inspectionItems.forEach((line) => {
      const invItem = safeItems.find((i) => i.id === line.itemId);
      const replacementUnit = line.replacementValue || invItem?.unitPrice || 250;

      // Check missing quantity
      const missing = line.missingQty || 0;
      if (missing > 0) {
        hasMissing = true;
        totalPenalty += missing * replacementUnit;
        missingSummaries.push(`${missing}x ${line.name} (Non restitué)`);
      }

      // Check missing accessories
      if (line.missingAccessories && line.missingAccessories.length > 0) {
        hasMissing = true;
        totalPenalty += line.missingAccessories.length * 35; // 35€ per missing cable / accessory
        missingSummaries.push(`${line.name} : ${line.missingAccessories.join(", ")} manquant(s)`);
      }

      // Check damaged
      const damaged = line.damagedQty || 0;
      if (damaged > 0) {
        hasDamagedOrLost = true;
        totalPenalty += line.repairCostEstimate || damaged * (replacementUnit * 0.4);
      }

      // Check lost or stolen
      const lost = (line.lostQty || 0) + (line.stolenQty || 0);
      if (lost > 0) {
        hasDamagedOrLost = true;
        totalPenalty += lost * replacementUnit;
        missingSummaries.push(`${lost}x ${line.name} (Perdu/Volé)`);
      }
    });

    let finalStatus: RentalOrderStatus = "returned";
    if (forcedStatus) {
      finalStatus = forcedStatus;
    } else if (hasDamagedOrLost) {
      finalStatus = "disputed";
    } else if (hasMissing) {
      finalStatus = "incomplete_return";
    }

    const returnType = finalStatus === "returned" ? "complete" : "incomplete";

    await onUpdateQuote(selectedRentalQuote.id, {
      rentalItems: inspectionItems,
      rentalStatus: finalStatus,
      returnType: returnType,
      actualReturnDate: new Date().toISOString().split("T")[0],
      disputeNotes: generalReturnNotes,
      incompleteReturnNotes: hasMissing ? missingSummaries.join(" | ") : "",
      missingItemsSummary: missingSummaries.join("\n"),
      penaltyCharges: totalPenalty,
    });

    if (activeDossierModal && activeDossierModal.id === selectedRentalQuote.id) {
      setActiveDossierModal({
        ...activeDossierModal,
        rentalItems: inspectionItems,
        rentalStatus: finalStatus,
        returnType: returnType,
        actualReturnDate: new Date().toISOString().split("T")[0],
        disputeNotes: generalReturnNotes,
        penaltyCharges: totalPenalty,
      });
    }

    setIsSubmittingCheckin(false);
    setIsCheckinModalOpen(false);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0e111d] p-4 rounded-2xl border border-[#1e233b]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-indigo-400" />
              Locations & Retours Matériel & Studios
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
              {rentalQuotes.length} dossiers
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ouverture des dossiers de location, édition des bons (Livraison, Location, Retour complet ou incomplet) et gestion des manquants.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenQuickDeparture && (
            <button
              onClick={onOpenQuickDeparture}
              className="py-2 px-3.5 rounded-xl bg-[#14182b] hover:bg-[#1a2038] border border-[#262e52] text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowUpRight className="w-4 h-4 text-purple-400" />
              <span>Bon de Sortie Direct</span>
            </button>
          )}

          {onOpenNewQuote && (
            <button
              onClick={onOpenNewQuote}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Devis / Location</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter("in_rental")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
            statusFilter === "in_rental"
              ? "bg-indigo-950/70 border-indigo-500/50 shadow-md"
              : "bg-[#0d101c] border-[#1e233b] hover:border-indigo-500/30"
          }`}
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              En Tournage / Sortis
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {activeRentals.length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("overdue")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
            statusFilter === "overdue"
              ? "bg-rose-950/70 border-rose-500/50 shadow-md"
              : "bg-[#0d101c] border-[#1e233b] hover:border-rose-500/30"
          }`}
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              En Retard
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {overdueRentals.length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("incomplete_return")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
            statusFilter === "incomplete_return"
              ? "bg-amber-950/70 border-amber-500/50 shadow-md"
              : "bg-[#0d101c] border-[#1e233b] hover:border-amber-500/30"
          }`}
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Retours Incomplets
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {incompleteRentals.length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("disputed")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
            statusFilter === "disputed"
              ? "bg-purple-950/70 border-purple-500/50 shadow-md"
              : "bg-[#0d101c] border-[#1e233b] hover:border-purple-500/30"
          }`}
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Litiges & Casse
            </div>
            <div className="text-2xl font-black text-purple-400 mt-1">
              {disputedRentals.length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("returned")}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
            statusFilter === "returned"
              ? "bg-emerald-950/70 border-emerald-500/50 shadow-md"
              : "bg-[#0d101c] border-[#1e233b] hover:border-emerald-500/30"
          }`}
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Retours Complets
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {returnedRentals.length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d101c] p-3 rounded-2xl border border-[#1e233b]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dossier par client, société, référence ou dépôt..."
            className="w-full pl-9 pr-4 py-2 bg-[#121626] border border-[#202742] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tous" },
            { id: "in_rental", label: "En cours" },
            { id: "overdue", label: "En retard" },
            { id: "incomplete_return", label: "Incomplets" },
            { id: "disputed", label: "Litiges" },
            { id: "returned", label: "Clôturés" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === f.id
                  ? "bg-indigo-600 text-white font-bold"
                  : "bg-[#131728] text-slate-400 hover:text-white border border-[#202742]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rentals Table / Dossier Cards */}
      <div className="space-y-3">
        {filteredRentals.length === 0 ? (
          <div className="p-8 text-center bg-[#0e111d] rounded-2xl border border-[#1e233b]">
            <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">Aucun dossier de location trouvé</div>
            <p className="text-xs text-slate-400 mt-1">
              Validez un devis client pour générer le dossier de location et les bons de sortie/livraison.
            </p>
          </div>
        ) : (
          filteredRentals.map((quote) => {
            const isOverdue = new Date(quote.endDate) < now && (quote.rentalStatus || "in_rental") === "in_rental";
            const currentStatus: RentalOrderStatus = quote.rentalStatus || (isOverdue ? "overdue" : "in_rental");
            const itemsCount = (quote.rentalItems || []).reduce((sum, i) => sum + i.quantity, 0);

            // Compute incomplete summary count
            const missingUnitsCount = (quote.rentalItems || []).reduce(
              (sum, it) => sum + (it.missingQty || it.lostQty || 0),
              0
            );

            return (
              <div
                key={quote.id}
                className="bg-[#0e111d] hover:bg-[#111524] border border-[#1e233b] hover:border-[#2b3354] rounded-2xl p-4 transition space-y-3 shadow-xs"
              >
                {/* Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#1a2038] pb-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xs flex-shrink-0">
                      LOC
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white">
                          {quote.quoteNumber.replace("DEV", "LOC")}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-xs font-bold text-indigo-300">
                          {quote.clientName}
                        </span>
                        {quote.clientCompany && (
                          <span className="text-[11px] text-slate-400">
                            ({quote.clientCompany})
                          </span>
                        )}
                        {quote.depotName && (
                          <span className="px-2 py-0.5 rounded-md bg-[#161a2e] text-slate-300 text-[10px] border border-[#262c4a]">
                            {quote.depotName}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Du {new Date(quote.startDate).toLocaleDateString("fr-FR")} au {new Date(quote.endDate).toLocaleDateString("fr-FR")} ({quote.durationDays}j)
                        </span>
                        {quote.clientPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {quote.clientPhone}
                          </span>
                        )}
                        {quote.actualReturnDate && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Restitué le {new Date(quote.actualReturnDate).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges & Quick Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Status Badge */}
                    {currentStatus === "in_rental" && (
                      <span className="px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3 text-indigo-400" /> En Tournage
                      </span>
                    )}
                    {currentStatus === "overdue" && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-400" /> RETARD DE RETOUR
                      </span>
                    )}
                    {currentStatus === "incomplete_return" && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400" /> Retour Incomplet ({missingUnitsCount} manquants)
                      </span>
                    )}
                    {currentStatus === "disputed" && (
                      <span className="px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 text-[11px] font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-purple-400" /> Litige / Casse
                      </span>
                    )}
                    {currentStatus === "returned" && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Retour Conforme
                      </span>
                    )}

                    {/* Signature Status Pills */}
                    {quote.departureSignature && (
                      <span
                        className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1"
                        title={`Départ signé par ${quote.departureSignature.signerName}`}
                      >
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        <span>Départ Signé</span>
                      </span>
                    )}
                    {quote.returnSignature && (
                      <span
                        className="px-2 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border border-teal-500/40 text-[10px] font-bold flex items-center gap-1"
                        title={`Retour signé par ${quote.returnSignature.signerName}`}
                      >
                        <ShieldCheck className="w-3 h-3 text-teal-400" />
                        <span>Retour Signé</span>
                      </span>
                    )}

                    {/* QUICK MOBILE SIGNATURE BUTTON */}
                    <button
                      onClick={() =>
                        setSignatureModalData({
                          quote,
                          target:
                            currentStatus === "returned" || currentStatus === "incomplete_return"
                              ? "client_return"
                              : "client_departure",
                        })
                      }
                      className="py-1.5 px-2.5 rounded-xl bg-[#181e36] hover:bg-[#222a4c] border border-[#2b355d] text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
                      title="Émargement & Signature sur smartphone, tablette ou validation dépôt"
                    >
                      <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                      <span>✍️ Signer</span>
                    </button>

                    {/* OPEN DOSSIER BUTTON */}
                    <button
                      id={`btn-open-dossier-${quote.id}`}
                      onClick={() => handleOpenDossier(quote)}
                      className="py-1.5 px-3 rounded-xl bg-[#171c30] hover:bg-[#202742] border border-[#252d4e] text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ouvrir Devis & Infos</span>
                    </button>

                    {/* RETOUR COMPLET 1-CLIC */}
                    {currentStatus !== "returned" && (
                      <button
                        onClick={() => handleQuickRetourComplet(quote)}
                        className="py-1.5 px-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
                        title="Valider le retour complet et conforme d'un clic"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Retour Complet</span>
                      </button>
                    )}

                    {/* RETOUR INCOMPLET / POINTAGE DETAIL */}
                    <button
                      onClick={() => handleOpenCheckin(quote, "incomplete")}
                      className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
                      title="Pointer les articles conformes, manquants ou cassés"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pointer Retour</span>
                    </button>

                    {/* PRINT DROPDOWN / BUTTON */}
                    {(quote.rentalItems || []).some((item) => item.isSubRental) && (
                      <button
                        onClick={() => setPrintModalData({ quote, type: "bon_sous_location" })}
                        className="py-1.5 px-2.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1 transition"
                        title="Générer le bon de sous-location fournisseur"
                      >
                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Bon sous-loc.</span>
                      </button>
                    )}

                    <div className="relative">
                      <button
                        onClick={() =>
                          setPrintModalData({
                            quote,
                            type:
                              currentStatus === "returned" || currentStatus === "incomplete_return"
                                ? "bon_retour"
                                : "bon_location",
                          })
                        }
                        className="p-1.5 rounded-xl bg-[#14182b] hover:bg-[#1a2038] border border-[#242b4a] text-slate-300 hover:text-white transition flex items-center gap-1"
                        title="Imprimer les documents (Bon de livraison, Bon de location, Bon de retour, Devis, Facture)"
                      >
                        <Printer className="w-4 h-4 text-indigo-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items Summary preview */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">
                    Matériel ({itemsCount} pièces) :
                  </span>
                  {(quote.rentalItems || []).map((it, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-[#14182b] border border-[#242b4a] text-slate-300 text-[11px] flex items-center gap-1"
                    >
                      <span className="font-bold text-indigo-400">{it.quantity}x</span> {it.name}
                      {it.shortageQuantity && it.shortageQuantity > 0 ? (
                        <span className="px-1 py-0.2 rounded bg-amber-950 text-amber-300 text-[9px] font-black uppercase border border-amber-500/30">
                          {it.shortageQuantity} manquant(s)
                        </span>
                      ) : null}
                      {it.missingQty && it.missingQty > 0 ? (
                        <span className="px-1 py-0.2 rounded bg-rose-950 text-rose-300 text-[9px] font-black uppercase border border-rose-500/30">
                          {it.missingQty} Manquant(s)
                        </span>
                      ) : it.returnStatus && it.returnStatus !== "returned_ok" ? (
                        <span className="px-1 py-0.2 rounded bg-rose-900/60 text-rose-300 text-[9px] font-black uppercase">
                          {it.returnStatus === "damaged" && "Cassé"}
                          {it.returnStatus === "lost" && "Perdu"}
                          {it.returnStatus === "stolen" && "Volé"}
                        </span>
                      ) : null}
                    </span>
                  ))}
                  {(quote.studioRentals || []).length > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium">
                      Studio : {quote.studioRentals[0].studioName}
                    </span>
                  )}
                  {(quote.crewStaff || []).length > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
                      Technicien : {quote.crewStaff[0].technicianName} ({quote.crewStaff[0].role})
                    </span>
                  )}
                </div>

                {/* Dispute / Incomplete return alert banner if any */}
                {quote.rentalStatus === "incomplete_return" || (quote.penaltyCharges && quote.penaltyCharges > 0) ? (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div>
                        <strong>Constat de retour incomplet / Réserves :</strong>{" "}
                        {quote.incompleteReturnNotes || quote.disputeNotes || "Articles ou accessoires non restitués."}
                      </div>
                    </div>
                    {quote.penaltyCharges && quote.penaltyCharges > 0 ? (
                      <span className="font-mono font-bold text-amber-300 whitespace-nowrap">
                        Pénalité / Valeur à neuf : {quote.penaltyCharges.toLocaleString("fr-FR")} €
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. FULL KROMA DOSSIER DETAILS MODAL (OUVERTURE DU DEVIS & INFOS)           */}
      {/* ========================================================================= */}
      {activeDossierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-4xl bg-[#0e111d] border border-[#232945] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1e243d] bg-[#121626] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-400" />
                    Dossier de Location {activeDossierModal.quoteNumber.replace("DEV", "LOC")}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                    Devis associé : {activeDossierModal.quoteNumber}
                  </span>
                  {activeDossierModal.rentalStatus === "returned" && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      Clôturé Conforme
                    </span>
                  )}
                  {activeDossierModal.rentalStatus === "incomplete_return" && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                      Retour Incomplet
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Client : <strong className="text-white">{activeDossierModal.clientName}</strong>{" "}
                  {activeDossierModal.clientCompany && `(${activeDossierModal.clientCompany})`} • Dépôt de départ :{" "}
                  <strong>{activeDossierModal.depotName || "Dépôt Central Paris-Nord"}</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveDossierModal(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#1a2038] hover:bg-[#252e52] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#131728] border border-[#202742] space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Période & Durée</span>
                  <div className="font-bold text-white">
                    Du {new Date(activeDossierModal.startDate).toLocaleDateString("fr-FR")} au {new Date(activeDossierModal.endDate).toLocaleDateString("fr-FR")}
                  </div>
                  <div className="text-slate-400 text-[11px]">{activeDossierModal.durationDays} jour(s) de location</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#131728] border border-[#202742] space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Lieu & Logistique</span>
                  <div className="font-bold text-white truncate">
                    {activeDossierModal.shippingAddress || activeDossierModal.clientAddress || "Enlèvement Dépôt"}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Tél client : {activeDossierModal.clientPhone || "Non renseigné"}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#131728] border border-[#202742] space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Montants & Caution</span>
                  <div className="font-bold text-emerald-400">
                    {activeDossierModal.totalTTC.toLocaleString("fr-FR")} € TTC
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    HT : {activeDossierModal.totalHT.toLocaleString("fr-FR")} € • TVA 20%
                  </div>
                </div>
              </div>

              {/* Equipment Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" />
                  Matériel du dossier ({activeDossierModal.rentalItems?.length || 0} références)
                </h4>

                <div className="bg-[#121626] rounded-2xl border border-[#1e233b] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#171c30] text-slate-400 uppercase text-[10px] font-bold border-b border-[#202742]">
                      <tr>
                        <th className="p-3">Désignation</th>
                        <th className="p-3 text-center">Qté Sortie</th>
                        <th className="p-3 text-center">Qté Reçue</th>
                        <th className="p-3 text-center">Manquants</th>
                        <th className="p-3 text-center">État</th>
                        <th className="p-3 text-right">Tarif Loc. HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b2138] text-slate-200">
                      {(activeDossierModal.rentalItems || []).map((item, idx) => {
                        const invItem = safeItems.find((i) => i.id === item.itemId);
                        const isMissing = (item.missingQty && item.missingQty > 0) || (item.lostQty && item.lostQty > 0);

                        return (
                          <tr key={idx} className={isMissing ? "bg-rose-950/20" : ""}>
                            <td className="p-3">
                              <div className="font-bold text-white">{item.name}</div>
                              {item.brand && <div className="text-[10px] text-slate-400">{item.brand}</div>}
                              {item.includedAccessories && item.includedAccessories.length > 0 && (
                                <div className="text-[10px] text-indigo-300 mt-0.5">
                                  Pack : {item.includedAccessories.join(", ")}
                                </div>
                              )}
                              {item.missingAccessories && item.missingAccessories.length > 0 && (
                                <div className="text-[10px] text-rose-400 font-bold mt-0.5">
                                  ⚠️ Accessoires manquants : {item.missingAccessories.join(", ")}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold">{item.quantity}</td>
                            <td className="p-3 text-center text-emerald-400 font-bold">
                              {item.returnedOkQty ?? (activeDossierModal.rentalStatus === "returned" ? item.quantity : 0)}
                            </td>
                            <td className="p-3 text-center font-bold">
                              {item.missingQty && item.missingQty > 0 ? (
                                <span className="text-rose-400">{item.missingQty}</span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {item.returnStatus === "returned_ok" || !item.returnStatus ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                                  OK
                                </span>
                              ) : item.returnStatus === "damaged" ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-bold">
                                  Casse
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 text-[10px] font-bold">
                                  Manquant
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-bold">{item.totalHT} €</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Studios & Technicians */}
              {((activeDossierModal.studioRentals && activeDossierModal.studioRentals.length > 0) ||
                (activeDossierModal.crewStaff && activeDossierModal.crewStaff.length > 0)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {activeDossierModal.studioRentals && activeDossierModal.studioRentals.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-[#131728] border border-[#202742] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-cyan-400">Studio Associé</span>
                      <div className="font-bold text-white">{activeDossierModal.studioRentals[0].studioName}</div>
                      <div className="text-slate-400 text-[11px]">
                        {activeDossierModal.studioRentals[0].quantityUnits} {activeDossierModal.studioRentals[0].rateType === "hourly" ? "heures" : "jours"}
                      </div>
                    </div>
                  )}
                  {activeDossierModal.crewStaff && activeDossierModal.crewStaff.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-[#131728] border border-[#202742] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-400">Personnel Technique</span>
                      <div className="font-bold text-white">
                        {activeDossierModal.crewStaff[0].technicianName} ({activeDossierModal.crewStaff[0].role})
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Tarif : {activeDossierModal.crewStaff[0].unitRate} € / {activeDossierModal.crewStaff[0].rateType}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Émargements & Signatures Numériques Block */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-indigo-400" />
                  Émargements & Signatures Numériques (Départ & Retour)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Departure Signature Card */}
                  <div className="p-4 rounded-2xl bg-[#121626] border border-[#202742] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-indigo-300">
                        1. Bon de Sortie / Départ Matériel
                      </span>
                      {activeDossierModal.departureSignature ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-400" /> Signé
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          En attente signature
                        </span>
                      )}
                    </div>

                    {activeDossierModal.departureSignature ? (
                      <div className="p-3 rounded-xl bg-[#0b0e1a] border border-[#1b223b] space-y-2">
                        {activeDossierModal.departureSignature.signatureDataUrl && (
                          <div className="bg-white p-2 rounded-lg flex items-center justify-center">
                            <img
                              src={activeDossierModal.departureSignature.signatureDataUrl}
                              alt="Signature départ"
                              className="h-12 object-contain"
                            />
                          </div>
                        )}
                        <div className="text-xs text-white font-bold">
                          {activeDossierModal.departureSignature.signerName}{" "}
                          <span className="text-slate-400 font-normal">
                            ({activeDossierModal.departureSignature.signerRole || "Client"})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Signé le {new Date(activeDossierModal.departureSignature.signedAt).toLocaleDateString("fr-FR")} à{" "}
                          {new Date(activeDossierModal.departureSignature.signedAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Aucun émargement de départ enregistré. Faites signer le client sur écran tactile ou validez la conformité du bon de location papier.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setSignatureModalData({
                          quote: activeDossierModal,
                          target: "client_departure",
                        })
                      }
                      className="w-full py-2 px-3 rounded-xl bg-[#1a2038] hover:bg-[#252e52] border border-[#2b355d] text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>{activeDossierModal.departureSignature ? "Modifier la Signature Départ" : "✍️ Faire Signer le Départ"}</span>
                    </button>
                  </div>

                  {/* Return Signature Card */}
                  <div className="p-4 rounded-2xl bg-[#121626] border border-[#202742] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-teal-300">
                        2. Bon de Restitution / Retour Matériel
                      </span>
                      {activeDossierModal.returnSignature ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Signé
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                          Non émargé
                        </span>
                      )}
                    </div>

                    {activeDossierModal.returnSignature ? (
                      <div className="p-3 rounded-xl bg-[#0b0e1a] border border-[#1b223b] space-y-2">
                        {activeDossierModal.returnSignature.signatureDataUrl && (
                          <div className="bg-white p-2 rounded-lg flex items-center justify-center">
                            <img
                              src={activeDossierModal.returnSignature.signatureDataUrl}
                              alt="Signature retour"
                              className="h-12 object-contain"
                            />
                          </div>
                        )}
                        <div className="text-xs text-white font-bold">
                          {activeDossierModal.returnSignature.signerName}{" "}
                          <span className="text-slate-400 font-normal">
                            ({activeDossierModal.returnSignature.signerRole || "Restituant"})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Signé le {new Date(activeDossierModal.returnSignature.signedAt).toLocaleDateString("fr-FR")} à{" "}
                          {new Date(activeDossierModal.returnSignature.signedAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Le bon de retour sera signé contradictoirement lors de la restitution du matériel au comptoir dépôt.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setSignatureModalData({
                          quote: activeDossierModal,
                          target: "client_return",
                        })
                      }
                      className="w-full py-2 px-3 rounded-xl bg-[#1a2038] hover:bg-[#252e52] border border-[#2b355d] text-teal-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>{activeDossierModal.returnSignature ? "Modifier la Signature Retour" : "✍️ Faire Signer le Retour"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer: Action Bar */}
            <div className="px-6 py-4 bg-[#0a0c16] border-t border-[#1e243d] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrintModalData({
                      quote: activeDossierModal,
                      type: "bon_location",
                    });
                  }}
                  className="py-2 px-3.5 rounded-xl bg-[#171c30] hover:bg-[#202742] border border-[#242c4b] text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <span>Imprimer Documents</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeDossierModal.rentalStatus !== "returned" && (
                  <button
                    type="button"
                    onClick={() => handleQuickRetourComplet(activeDossierModal)}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Retour Complet (100% OK)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenCheckin(activeDossierModal, "incomplete")}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pointer Manquants / Incomplet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. KROMA DETAILED RETURN & INCOMPLETE ITEM CHECK-IN MODAL                 */}
      {/* ========================================================================= */}
      {isCheckinModalOpen && selectedRentalQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div
            className="w-full max-w-4xl bg-[#0e111d] border border-[#232945] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1e243d] bg-[#121626] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    Pointage de Retour Matériel — {selectedRentalQuote.quoteNumber.replace("DEV", "LOC")}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                    Contrôle Déchargement
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client : <strong className="text-white">{selectedRentalQuote.clientName}</strong> • Date retour : {new Date().toLocaleDateString("fr-FR")}
                </p>
              </div>
              <button
                onClick={() => setIsCheckinModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#1a2038] hover:bg-[#252e52] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Item-by-item inspection table */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-200">
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>
                  Pour chaque ligne, confirmez la quantité restituée conforme, signalez les éventuels articles manquants ou endommagés, et pointez les accessoires du pack.
                </span>
              </div>

              {/* Items List Table */}
              <div className="space-y-3">
                {inspectionItems.map((item, index) => {
                  const invItem = safeItems.find((i) => i.id === item.itemId);
                  const packAccessories = item.includedAccessories || invItem?.includedAccessories || [];

                  return (
                    <div
                      key={index}
                      className="p-4 rounded-2xl bg-[#131728] border border-[#202742] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#0d101c] border border-[#202742] flex items-center justify-center text-slate-300 flex-shrink-0">
                            {invItem?.imageUrl ? (
                              <img src={invItem.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <Package className="w-5 h-5 text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{item.name}</div>
                            <div className="text-[11px] text-slate-400">
                              Quantité sortie : <strong className="text-white">{item.quantity} unité(s)</strong> • Valeur remplacement : {item.replacementValue || invItem?.unitPrice || 250} €
                            </div>
                          </div>
                        </div>

                        {/* Status Preset Quick Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...inspectionItems];
                              updated[index].returnStatus = "returned_ok";
                              updated[index].returnedOkQty = item.quantity;
                              updated[index].missingQty = 0;
                              updated[index].damagedQty = 0;
                              updated[index].lostQty = 0;
                              updated[index].missingAccessories = [];
                              setInspectionItems(updated);
                            }}
                            className={`py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                              item.returnStatus === "returned_ok" && (!item.missingQty || item.missingQty === 0)
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                : "bg-[#181d33] text-slate-400 hover:text-emerald-300"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            100% Conforme
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...inspectionItems];
                              updated[index].returnStatus = "incomplete";
                              updated[index].missingQty = 1;
                              updated[index].returnedOkQty = Math.max(0, item.quantity - 1);
                              setInspectionItems(updated);
                            }}
                            className={`py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                              item.returnStatus === "incomplete" || (item.missingQty && item.missingQty > 0)
                                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                                : "bg-[#181d33] text-slate-400 hover:text-rose-300"
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Manquant / Incomplet
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...inspectionItems];
                              updated[index].returnStatus = "damaged";
                              updated[index].damagedQty = 1;
                              setInspectionItems(updated);
                            }}
                            className={`py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                              item.returnStatus === "damaged"
                                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                                : "bg-[#181d33] text-slate-400 hover:text-amber-300"
                            }`}
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            Endommagé / Casse
                          </button>
                        </div>
                      </div>

                      {/* Quantities Fine-Tuning Grid */}
                      <div className="pt-2 border-t border-[#1e243d] grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-emerald-400 uppercase">
                            Qté Restituée Conforme :
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.returnedOkQty ?? item.quantity}
                            onChange={(e) => {
                              const val = Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0));
                              const updated = [...inspectionItems];
                              updated[index].returnedOkQty = val;
                              updated[index].missingQty = Math.max(0, item.quantity - val);
                              setInspectionItems(updated);
                            }}
                            className="w-full mt-1 px-3 py-1.5 bg-[#0d101c] border border-[#202742] rounded-xl text-xs text-white font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-rose-400 uppercase">
                            Qté Manquante / Non Restituée :
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.missingQty || 0}
                            onChange={(e) => {
                              const val = Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0));
                              const updated = [...inspectionItems];
                              updated[index].missingQty = val;
                              updated[index].returnedOkQty = Math.max(0, item.quantity - val);
                              setInspectionItems(updated);
                            }}
                            className="w-full mt-1 px-3 py-1.5 bg-[#0d101c] border border-[#202742] rounded-xl text-xs text-rose-300 font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-amber-400 uppercase">
                            Qté Endommagée (Casse) :
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.damagedQty || 0}
                            onChange={(e) => {
                              const val = Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0));
                              const updated = [...inspectionItems];
                              updated[index].damagedQty = val;
                              setInspectionItems(updated);
                            }}
                            className="w-full mt-1 px-3 py-1.5 bg-[#0d101c] border border-[#202742] rounded-xl text-xs text-amber-300 font-bold"
                          />
                        </div>
                      </div>

                      {/* Included Kit Accessories Checkboxes (KROMA Kit Check) */}
                      {packAccessories.length > 0 && (
                        <div className="pt-2 border-t border-[#1e243d]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                            Accessoires du Kit / Pack :
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {packAccessories.map((acc, accIdx) => {
                              const isMissing = (item.missingAccessories || []).includes(acc);
                              return (
                                <button
                                  key={accIdx}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...inspectionItems];
                                    const currMissing = updated[index].missingAccessories || [];
                                    if (isMissing) {
                                      updated[index].missingAccessories = currMissing.filter((a) => a !== acc);
                                    } else {
                                      updated[index].missingAccessories = [...currMissing, acc];
                                    }
                                    setInspectionItems(updated);
                                  }}
                                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                                    isMissing
                                      ? "bg-rose-950/80 border-rose-500/50 text-rose-300 line-through"
                                      : "bg-[#181d33] border-[#252d4e] text-slate-300 hover:text-white"
                                  }`}
                                >
                                  {isMissing ? (
                                    <X className="w-3 h-3 text-rose-400" />
                                  ) : (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  )}
                                  <span>{acc}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Observations / Inspection notes */}
                      <div className="pt-2 border-t border-[#1e243d]">
                        <input
                          type="text"
                          placeholder="Observations matérielles (ex: rayure sur lentille, câble alim manquant, boîte abîmée...)"
                          value={item.inspectionNotes || ""}
                          onChange={(e) => {
                            const updated = [...inspectionItems];
                            updated[index].inspectionNotes = e.target.value;
                            setInspectionItems(updated);
                          }}
                          className="w-full px-3 py-1.5 bg-[#0d101c] border border-[#202742] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* General Return Inspection Notes */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Observations générales du responsable de retour :
                </label>
                <textarea
                  rows={2}
                  value={generalReturnNotes}
                  onChange={(e) => setGeneralReturnNotes(e.target.value)}
                  placeholder="Notes de déchargement, état général des malles, réserves écrites émises au client..."
                  className="w-full px-3 py-2 bg-[#121626] border border-[#202742] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#0a0c16] border-t border-[#1e243d] flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsCheckinModalOpen(false)}
                className="py-2 px-4 rounded-xl bg-[#171c30] text-slate-300 hover:text-white text-xs font-semibold"
              >
                Annuler
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmittingCheckin}
                  onClick={() => handleSubmitInspection("incomplete_return")}
                  className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-2 transition"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Enregistrer Retour Incomplet (Avec Manquants)</span>
                </button>

                <button
                  id="btn-confirm-checkin-submission"
                  type="button"
                  disabled={isSubmittingCheckin}
                  onClick={() => handleSubmitInspection("returned")}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
                >
                  {isSubmittingCheckin ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Valider Retour Complet (100% Conforme)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MULTI-DOCUMENT PRINT MODAL                                             */}
      {/* ========================================================================= */}
      {printModalData && (
        <DocumentPrintModal
          quote={printModalData.quote}
          initialType={printModalData.type}
          settings={settings}
          items={safeItems}
          onUpdateQuote={onUpdateQuote}
          onClose={() => setPrintModalData(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. DIGITAL SIGNATURE PAD MODAL (MOBILE / TABLET / VERIFICATION DEPOT)    */}
      {/* ========================================================================= */}
      {signatureModalData && (
        <SignaturePadModal
          quote={signatureModalData.quote}
          defaultTarget={signatureModalData.target}
          onSaveSignature={handleSaveSignature}
          onClose={() => setSignatureModalData(null)}
        />
      )}
    </div>
  );
};
