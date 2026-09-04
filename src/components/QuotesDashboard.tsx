import React, { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Truck,
  Copy,
  Printer,
  Trash2,
  Edit2,
  TrendingUp,
  Globe,
  CheckCircle2,
} from "lucide-react";
import {
  ClientQuote,
  InventoryItem,
  StudioSpace,
  TechnicianProfile,
  AppSettings,
  ClientRecord,
  SupplierRecord,
} from "../types";
import { DocumentPrintModal } from "./DocumentPrintModal";
import { ClientPortalModal } from "./ClientPortalModal";
import { LocasystQuoteBuilderModal } from "./LocasystQuoteBuilderModal";
import { SAMPLE_LUMENS_QUOTE } from "../data/sampleLumensQuote";
import { WorkspaceProfile } from "../config/workspaceProfiles";

interface QuotesDashboardProps {
  activeProfile?: WorkspaceProfile;
  quotes?: ClientQuote[];
  inventoryItems?: InventoryItem[];
  inventory?: InventoryItem[];
  studios?: StudioSpace[];
  technicians?: TechnicianProfile[];
  clients?: ClientRecord[];
  suppliers?: SupplierRecord[];
  settings?: AppSettings;
  onAddQuote?: (quote: Partial<ClientQuote>) => Promise<boolean>;
  onUpdateQuote?: (id: string, updates: Partial<ClientQuote>) => Promise<boolean>;
  onDeleteQuote?: (id: string) => Promise<boolean>;
  onOpenDossiers?: () => void;
  onConvertToDossier?: (quote: ClientQuote) => Promise<boolean>;
  initialPrefillTech?: TechnicianProfile | null;
  initialPrefillStudio?: StudioSpace | null;
  prefillTech?: TechnicianProfile | null;
  prefillStudio?: StudioSpace | null;
  prefillClient?: ClientRecord | null;
  onClearPrefill?: () => void;
  onRefresh?: () => void;
}

export const QuotesDashboard: React.FC<QuotesDashboardProps> = ({
  activeProfile,
  quotes = [],
  inventoryItems = [],
  inventory = [],
  studios = [],
  technicians = [],
  clients = [],
  suppliers = [],
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
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
  onOpenDossiers,
  onConvertToDossier,
  prefillClient = null,
}) => {
  const safeQuotes = quotes || [];
  const safeStudios = studios || [];
  const safeTechnicians = technicians || [];
  const safeClients = clients || [];
  const safeSuppliers = suppliers || [];
  
  const safeInventoryItems = useMemo(() => {
    const raw = (inventoryItems && inventoryItems.length > 0) ? inventoryItems : ((inventory && inventory.length > 0) ? inventory : []);
    return raw;
  }, [inventoryItems, inventory]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState<ClientQuote | null>(null);
  const [showPortalModalQuote, setShowPortalModalQuote] = useState<ClientQuote | null>(null);
  const [editingQuote, setEditingQuote] = useState<ClientQuote | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ quote: ClientQuote; x: number; y: number } | null>(null);

  const handleOpenCreateModal = () => {
    setEditingQuote(null);
    setShowBuilderModal(true);
  };

  const handleOpenEditModal = (q: ClientQuote) => {
    setEditingQuote(q);
    setShowBuilderModal(true);
  };

  const handleQuoteContextMenu = (event: React.MouseEvent, quote: ClientQuote) => {
    event.preventDefault();
    setSelectedQuoteId(quote.id);
    setContextMenu({
      quote,
      x: Math.min(event.clientX, window.innerWidth - 280),
      y: Math.min(event.clientY, window.innerHeight - 330),
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const updateQuoteStatus = async (quote: ClientQuote, updates: Partial<ClientQuote>) => {
    if (!onUpdateQuote) return;
    await onUpdateQuote(quote.id, updates);
    closeContextMenu();
  };

  const handleDuplicateQuote = async (quote: ClientQuote) => {
    if (!onAddQuote) return;
    const { id: _id, quoteNumber: _quoteNumber, createdAt: _createdAt, updatedAt: _updatedAt, rentalStatus: _rentalStatus, ...copy } = quote;
    await onAddQuote({
      ...copy,
      status: "draft",
      date: new Date().toISOString().split("T")[0],
      rentalItems: (quote.rentalItems || []).map((line) => ({ ...line, returnStatus: undefined, shortageQuantity: undefined })),
    });
  };

  const handleSaveQuote = async (payload: Partial<ClientQuote>) => {
    let saved = true;
    if (editingQuote) {
      if (onUpdateQuote) {
        saved = await onUpdateQuote(editingQuote.id, payload);
      }
    } else {
      if (onAddQuote) {
        saved = await onAddQuote(payload);
      }
    }
    // Keep the editor open when the API rejects the save so the user can see
    // the error notification and correct the form instead of losing the draft.
    if (saved !== false) setShowBuilderModal(false);
  };

  const handleConvertToDossier = async (quote: ClientQuote) => {
    if (!onUpdateQuote) return;
    const confirmed = window.confirm(
      `Créer le dossier d'exploitation ${quote.quoteNumber} ?`
    );
    if (!confirmed) return;
    const converted = onConvertToDossier
      ? await onConvertToDossier(quote)
      : await onUpdateQuote(quote.id, {
          status: quote.status === "draft" || quote.status === "sent" ? "accepted" : quote.status,
          rentalStatus: "preparing",
        });
    if (converted) onOpenDossiers?.();
  };

  const getOperationalBadge = (quote: ClientQuote) => {
    if (quote.rentalStatus === "preparing") return <span className="quote-operational-badge quote-operational-preparing">Préparation</span>;
    if (quote.rentalStatus === "ready") return <span className="quote-operational-badge quote-operational-ready">Prêt</span>;
    if (quote.rentalStatus === "in_rental") return <span className="quote-operational-badge quote-operational-rental">En location</span>;
    if (quote.rentalStatus === "returned") return <span className="quote-operational-badge quote-operational-returned">Retour complet</span>;
    if (quote.rentalStatus === "overdue" || quote.rentalStatus === "incomplete_return" || quote.rentalStatus === "disputed") return <span className="quote-operational-badge quote-operational-issue">Retour à contrôler</span>;
    return null;
  };

  const filteredQuotes = safeQuotes.filter((q) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      (q.clientName && q.clientName.toLowerCase().includes(query)) ||
      (q.quoteNumber && q.quoteNumber.toLowerCase().includes(query)) ||
      (q.projectName && q.projectName.toLowerCase().includes(query)) ||
      (q.clientCompany && q.clientCompany.toLowerCase().includes(query)) ||
      (q.productionCompany && q.productionCompany.toLowerCase().includes(query));

    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const selectedQuote = filteredQuotes.find((q) => q.id === selectedQuoteId) || filteredQuotes[0] || null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <span className="quote-status quote-status-accepted">
            Validé
          </span>
        );
      case "invoiced":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Facturé
          </span>
        );
      case "sent":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Envoyé
          </span>
        );
      case "rejected":
      case "cancelled":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Refusé / Annulé
          </span>
        );
      default:
        return (
          <span className="quote-status quote-status-draft">
            Devis
          </span>
        );
    }
  };

  // Stats Métier
  const totalVolumeTTC = safeQuotes.reduce((acc, q) => acc + (q.totalTTC || 0), 0);
  const acceptedQuotesCount = safeQuotes.filter(
    (q) => q.status === "accepted" || q.status === "invoiced"
  ).length;
  const totalSubRentalsActive = safeQuotes.reduce((acc, q) => {
    const count = (q.rentalItems || []).filter((i) => i.isSubRental).length;
    return acc + count;
  }, 0);

  return (
    <div id="quotes-dashboard" className="locasyst-quotes-screen space-y-4">
      <div className="quotes-screen-header">
        <div>
          <div className="screen-eyebrow">COMMERCIAL · {activeProfile?.shortLabel || "PRODUCTION"}</div>
          <h1>{activeProfile?.copy.quotesTitle || "Affaires & devis"}</h1>
          <p>{activeProfile?.copy.quotesDescription || "Chiffrage, validation et suivi des dossiers de production."}</p>
        </div>
        <div className="quotes-header-actions">
          <button
            id="btn-load-lumens-template"
            onClick={() => {
              const existing = safeQuotes.find(
                (q) => q.quoteNumber === "226030033" || q.id === SAMPLE_LUMENS_QUOTE.id
              );
              if (existing) {
                setShowPrintModal(existing);
              } else {
                if (onAddQuote) {
                  onAddQuote(SAMPLE_LUMENS_QUOTE as any);
                }
                setShowPrintModal(SAMPLE_LUMENS_QUOTE as any);
              }
            }}
            className="secondary-action"
          >
            <FileText className="w-4 h-4" />
            <span>Modèles de documents</span>
          </button>

          <button
            id="btn-create-new-quote"
            onClick={handleOpenCreateModal}
            className="primary-action"
          >
            <Plus className="w-4 h-4" />
            Nouveau devis
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="quotes-summary-strip">
        <div className="p-5 rounded-2xl bg-[#121626] border border-[#232a48] shadow-md">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Volume Devis Émis</span>
          <p className="text-2xl font-black text-slate-100 mt-1">
            {totalVolumeTTC.toLocaleString("fr-FR")} € <span className="text-xs text-slate-400 font-normal">TTC</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">{safeQuotes.length} dossiers chiffrés</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121626] border border-[#232a48] shadow-md">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Taux de Concrétisation</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{acceptedQuotesCount}</p>
          <span className="text-[11px] text-emerald-400/80 mt-1 block">
            {safeQuotes.length > 0 ? Math.round((acceptedQuotesCount / safeQuotes.length) * 100) : 0}% des devis validés
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121626] border border-[#232a48] shadow-md">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sous-Locations Confrères</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{totalSubRentalsActive} <span className="text-xs text-slate-400 font-normal">articles</span></p>
          <span className="text-[11px] text-amber-300/80 mt-1 block">RVZ, TSF, PhotoCineRent, Next Shot</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121626] border border-[#232a48] shadow-md">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Grille Audiovisuelle</span>
          <p className="text-2xl font-black text-indigo-400 mt-1">Coeff. Dégressifs</p>
          <span className="text-[11px] text-indigo-300/80 mt-1 block">1j=1.0 • 2j=1.5 • WE=1.2 • Sem=3.0</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="quotes-toolbar">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une affaire, un client ou un devis..."
            className="w-full bg-[#181d33] border border-[#273052] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium">Statut:</span>
          {["all", "draft", "sent", "accepted", "invoiced"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-[#181d33] text-slate-300 hover:text-white border border-[#273052]"
              }`}
            >
              {st === "all"
                ? "Tous"
                : st === "draft"
                ? "Brouillons"
                : st === "sent"
                ? "Envoyés"
                : st === "accepted"
                ? "Acceptés"
                : "Facturés"}
            </button>
          ))}
        </div>
      </div>

      <div className="quotes-list-heading">
        <div><strong>Dossiers commerciaux</strong><span>{filteredQuotes.length} résultat{filteredQuotes.length > 1 ? "s" : ""}</span></div>
        <span className="quotes-list-hint">Sélectionnez une ligne pour ouvrir le dossier</span>
      </div>

      {/* Quotes + operational detail */}
      <div className="quotes-workspace">
      <div className="quotes-table-shell">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#181d33] border-b border-[#232a48] text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">N° Devis & Date</th>
                <th className="py-3.5 px-4">Projet / Film & Production</th>
                <th className="py-3.5 px-4">Dates Tournage & Barème</th>
                <th className="py-3.5 px-4 text-center">Sous-Loc Confrère</th>
                <th className="py-3.5 px-4 text-right">Montants HT / TTC</th>
                <th className="py-3.5 px-4 text-center">Acompte & Caution</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e243d]">
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map((q) => {
                  const subCount = (q.rentalItems || []).filter((i) => i.isSubRental).length;
                  return (
                    <tr key={q.id} onClick={() => setSelectedQuoteId(q.id)} onContextMenu={(event) => handleQuoteContextMenu(event, q)} className={`quote-row hover:bg-[#161c33] transition-colors ${selectedQuote?.id === q.id ? "quote-row-selected" : ""}`}>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          {q.quoteNumber}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{q.date}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          {q.projectName ? (
                            <span className="text-indigo-300">{q.projectName}</span>
                          ) : (
                            <span>{q.clientCompany || q.clientName}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {q.productionCompany || q.clientCompany
                            ? `${q.clientName} (${q.productionCompany || q.clientCompany})`
                            : q.clientName}
                        </div>
                        {q.directorOfPhotography && (
                          <span className="text-[10px] text-rose-400 block mt-0.5 font-medium">
                            DOP : {q.directorOfPhotography}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {q.shootStartDate || q.startDate} → {q.shootEndDate || q.endDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                          <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                            {q.shootDaysCount || q.durationDays || 1}j tournage
                          </span>
                          <span className="text-slate-400 font-mono">
                            Coeff {q.globalRentalCoefficient || 1.0}
                          </span>
                          {q.hasPrepDay && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-800 font-semibold text-[10px]">
                              Prep Day
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {subCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                            <TrendingUp className="w-3 h-3" />
                            {subCount} sous-loc
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">Parc propre</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-white text-sm">
                          {(q.totalHT || 0).toLocaleString("fr-FR")} €{" "}
                          <span className="text-[10px] text-slate-400 font-normal">HT</span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-bold block mt-0.5">
                          {(q.totalTTC || 0).toLocaleString("fr-FR")} € TTC
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="text-[11px] font-bold text-amber-300">
                          Acompte: {(q.depositAmount || 0).toLocaleString("fr-FR")} €
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Caution: {(q.depositGuaranteeAmount || 0).toLocaleString("fr-FR")} € (
                          {q.depositGuaranteeType === "imprint_cb"
                            ? "CB"
                            : q.depositGuaranteeType === "insurance_letter"
                            ? "Assurance"
                            : "Chèque"}
                          )
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getStatusBadge(q.status)}
                          {getOperationalBadge(q)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setShowPortalModalQuote(q)}
                            title="Ouvrir le Portail Client & Lien de Signature en ligne"
                            className="p-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setShowPrintModal(q)}
                            title="Imprimer Devis / Bons de sortie / Sous-loc"
                            className="p-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(q)}
                            title="Modifier le devis"
                            className="p-1.5 rounded-xl bg-[#1d233d] hover:bg-[#283256] text-slate-300 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {onDeleteQuote && (
                            <button
                              onClick={() => onDeleteQuote(q.id)}
                              title="Supprimer le devis"
                              className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    Aucun devis trouvé pour ces critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {contextMenu && (
        <>
          <button type="button" aria-label="Fermer le menu" className="quote-context-backdrop" onClick={closeContextMenu} />
          <div className="quote-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} role="menu">
            <div className="quote-context-heading">
              <span>Actions du devis</span>
              <strong>{contextMenu.quote.quoteNumber}</strong>
            </div>
            <button type="button" onClick={() => { handleOpenEditModal(contextMenu.quote); closeContextMenu(); }}><Edit2 /> Modifier le devis</button>
            {contextMenu.quote.status === "draft" && (
              <button type="button" onClick={() => updateQuoteStatus(contextMenu.quote, { status: "accepted" })}><CheckCircle2 /> Passer en Validé</button>
            )}
            {!contextMenu.quote.rentalStatus && contextMenu.quote.status !== "draft" && (
              <button type="button" onClick={() => { closeContextMenu(); handleConvertToDossier(contextMenu.quote); }}><Truck /> Préparer le dossier</button>
            )}
            {contextMenu.quote.rentalStatus === "preparing" && (
              <button type="button" onClick={() => updateQuoteStatus(contextMenu.quote, { rentalStatus: "ready" })}><CheckCircle2 /> Marquer Prêt</button>
            )}
            {contextMenu.quote.rentalStatus === "ready" && (
              <button type="button" onClick={() => updateQuoteStatus(contextMenu.quote, { rentalStatus: "in_rental" })}><Truck /> Passer En location</button>
            )}
            <button type="button" onClick={() => { setShowPrintModal(contextMenu.quote); closeContextMenu(); }}><Printer /> Générer un document</button>
            <button type="button" onClick={() => { handleDuplicateQuote(contextMenu.quote); closeContextMenu(); }}><Copy /> Dupliquer</button>
            {onDeleteQuote && <button type="button" className="quote-context-danger" onClick={() => { onDeleteQuote(contextMenu.quote.id); closeContextMenu(); }}><Trash2 /> Supprimer</button>}
          </div>
        </>
      )}

      <aside className="quote-detail-panel">
        {selectedQuote ? (
          <>
            <div className="quote-detail-topline">
              <span>DOSSIER COMMERCIAL</span>
              {getStatusBadge(selectedQuote.status)}
            </div>
            <div className="quote-detail-title">
              <div className="quote-document-icon"><FileText className="w-5 h-5" /></div>
              <div>
                <h2>{selectedQuote.projectName || selectedQuote.clientCompany || selectedQuote.clientName}</h2>
                <p>{selectedQuote.quoteNumber} · créé le {selectedQuote.date}</p>
              </div>
            </div>

            <div className="quote-phase-rail">
              {[
                ["Devis", true],
                ["Préparation", Boolean(selectedQuote.rentalStatus)],
                ["Livraison", selectedQuote.rentalStatus === "in_rental" || selectedQuote.rentalStatus === "ready" || selectedQuote.rentalStatus === "returned"],
                ["Reprise", selectedQuote.rentalStatus === "returned" || selectedQuote.rentalStatus === "incomplete_return"],
              ].map(([label, complete], index) => (
                <div className={`quote-phase ${complete ? "complete" : index === 0 ? "current" : ""}`} key={String(label)}>
                  <span>{index + 1}</span><strong>{label}</strong>
                </div>
              ))}
            </div>

            <div className="quote-detail-section">
              <div className="detail-label">CLIENT / PRODUCTION</div>
              <strong>{selectedQuote.clientName || "Client à renseigner"}</strong>
              <p>{selectedQuote.productionCompany || selectedQuote.clientCompany || "Société non renseignée"}</p>
            </div>
            <div className="quote-detail-grid">
              <div><span>DATES D’EXPLOITATION</span><strong>{selectedQuote.shootStartDate || selectedQuote.startDate || "À définir"}</strong><small>au {selectedQuote.shootEndDate || selectedQuote.endDate || "—"}</small></div>
              <div><span>DURÉE</span><strong>{selectedQuote.shootDaysCount || selectedQuote.durationDays || 1} jour(s)</strong><small>Coeff. {selectedQuote.globalRentalCoefficient || 1}</small></div>
              <div><span>MONTANT HT</span><strong>{(selectedQuote.totalHT || 0).toLocaleString("fr-FR")} €</strong></div>
              <div><span>MONTANT TTC</span><strong className="detail-total">{(selectedQuote.totalTTC || 0).toLocaleString("fr-FR")} €</strong></div>
            </div>
            <div className="quote-detail-section quote-detail-actions">
              {!selectedQuote.rentalStatus && selectedQuote.status === "draft" && (
                <button onClick={() => handleConvertToDossier(selectedQuote)} className="detail-primary detail-operation-button"><Truck className="w-4 h-4" /> Créer le dossier d’exploitation</button>
              )}
              {!selectedQuote.rentalStatus && selectedQuote.status !== "draft" && (
                <button onClick={() => handleConvertToDossier(selectedQuote)} className="detail-primary detail-operation-button"><Truck className="w-4 h-4" /> Préparer le dossier</button>
              )}
              <button onClick={() => handleOpenEditModal(selectedQuote)} className="detail-primary"><Edit2 className="w-4 h-4" /> Modifier le devis</button>
              <button onClick={() => handleDuplicateQuote(selectedQuote)}><Copy className="w-4 h-4" /> Dupliquer le devis</button>
              <button onClick={() => setShowPrintModal(selectedQuote)}><Printer className="w-4 h-4" /> Générer un document</button>
              <button onClick={() => setShowPortalModalQuote(selectedQuote)}><Globe className="w-4 h-4" /> Ouvrir l’espace client</button>
            </div>
          </>
        ) : (
          <div className="quote-empty-detail"><FileText className="w-8 h-8" /><strong>Aucun dossier sélectionné</strong><p>Créez un devis ou sélectionnez une affaire dans la liste.</p></div>
        )}
      </aside>
      </div>

      {/* 3-STEP LOCASYST QUOTE BUILDER WIZARD */}
      {showBuilderModal && (
        <LocasystQuoteBuilderModal
          editingQuote={editingQuote}
          clients={safeClients}
          inventoryItems={safeInventoryItems}
          studios={safeStudios}
          technicians={safeTechnicians}
          suppliers={safeSuppliers}
          settings={settings}
          prefillClient={prefillClient}
          onClose={() => setShowBuilderModal(false)}
          onSave={handleSaveQuote}
        />
      )}

      {/* PRINTABLE DOCUMENT PREVIEW MODAL */}
      {showPrintModal && (
        <DocumentPrintModal
          quote={showPrintModal}
          initialType="devis"
          settings={settings}
          items={inventoryItems}
          onUpdateQuote={onUpdateQuote}
          onClose={() => setShowPrintModal(null)}
        />
      )}

      {/* CLIENT PORTAL & ONLINE SIGNATURE MODAL */}
      {showPortalModalQuote && (
        <ClientPortalModal
          isOpen={!!showPortalModalQuote}
          onClose={() => setShowPortalModalQuote(null)}
          quote={showPortalModalQuote}
          items={safeInventoryItems}
          settings={settings}
          onUpdateQuote={async (updatedQuote) => {
            if (onUpdateQuote) {
              await onUpdateQuote(updatedQuote.id, updatedQuote);
            }
            setShowPortalModalQuote(updatedQuote);
          }}
        />
      )}
    </div>
  );
};
