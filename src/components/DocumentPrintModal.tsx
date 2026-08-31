import React, { useState, useMemo } from "react";
import {
  Printer,
  X,
  FileText,
  Truck,
  RotateCcw,
  CheckCircle2,
  Package,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Clock,
  Lock,
  PenTool,
  TrendingUp,
  Receipt,
  FileCheck,
  AlertTriangle,
  FileCode,
  Layout,
  Columns,
  Share2,
} from "lucide-react";
import {
  ClientQuote,
  AppSettings,
  DocumentPrintType,
  AudiovisualChapter,
  DocumentSignature,
  SignatureTargetType,
  QuoteItemLine,
} from "../types";
import { AUDIOVISUAL_CHAPTERS, inferAudiovisualChapter } from "../utils/coefficients";
import { SignaturePadModal } from "./SignaturePadModal";

interface DocumentPrintModalProps {
  quote: ClientQuote;
  settings: AppSettings;
  onClose: () => void;
  onUpdateQuote?: (id: string, updates: Partial<ClientQuote>) => Promise<boolean> | void;
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  quote,
  settings,
  onClose,
  onUpdateQuote,
}) => {
  const [docType, setDocType] = useState<DocumentPrintType>("devis");
  const [layoutMode, setLayoutMode] = useState<"locasyst" | "cinema">("locasyst");
  const [showSignatures, setShowSignatures] = useState(true);
  const [showFinancialDetails, setShowFinancialDetails] = useState(true);
  const [groupByChapters, setGroupByChapters] = useState(true);
  const [showAccessories, setShowAccessories] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [currentQuote, setCurrentQuote] = useState<ClientQuote>(quote);

  // Tablet Signature Modal State
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureTarget, setSignatureTarget] = useState<SignatureTargetType>("client_departure");

  // Check if any returned items are damaged or missing
  const hasIncompleteItems = (currentQuote.rentalItems || []).some(
    (i) =>
      (i.missingQty && i.missingQty > 0) ||
      (i.damagedQty && i.damagedQty > 0) ||
      (i.lostQty && i.lostQty > 0) ||
      (i.stolenQty && i.stolenQty > 0)
  );

  const isFinancialDoc = docType === "devis" || docType === "facture" || docType === "bon_sous_location";

  // Document metadata title & code
  const getDocTitle = () => {
    switch (docType) {
      case "devis":
        return {
          title: "DEVIS",
          subTitle: "Proposition Commerciale & Chiffrage Audiovisuel",
          code: currentQuote.quoteNumber,
          badge: "DEVIS",
          color: "bg-indigo-950 text-indigo-200 border-indigo-700",
        };
      case "bon_location":
        return {
          title: "BON DE DÉPART MATÉRIEL",
          subTitle: "Bordereau d'Enlèvement & Prise en Charge Contradictoire",
          code: `DEP-${currentQuote.quoteNumber.replace("DEV-", "")}`,
          badge: "BON DE SORTIE",
          color: "bg-emerald-950 text-emerald-200 border-emerald-700",
        };
      case "bon_livraison":
        return {
          title: "BON DE LIVRAISON SUR SITE",
          subTitle: "Bordereau d'Acheminement & Réception Plateau / Régie",
          code: `BL-${currentQuote.quoteNumber.replace("DEV-", "")}`,
          badge: "BON DE LIVRAISON",
          color: "bg-sky-950 text-sky-200 border-sky-700",
        };
      case "bon_sous_location":
        return {
          title: "ORDRE DE SOUS-LOCATION CONFRÈRE",
          subTitle: "Bordereau Fournisseur & Engagement de Réservation",
          code: `SL-${currentQuote.quoteNumber.replace("DEV-", "")}`,
          badge: "SOUS-LOCATION",
          color: "bg-amber-950 text-amber-200 border-amber-700",
        };
      case "bon_retour":
        return {
          title: "BON DE RETOUR & CONTRÔLE TECHNIQUE",
          subTitle: "Bordereau de Restitution & Constat d'État Contradictoire",
          code: `RET-${currentQuote.quoteNumber.replace("DEV-", "")}`,
          badge: "BON DE RETOUR",
          color: hasIncompleteItems
            ? "bg-rose-950 text-rose-200 border-rose-700"
            : "bg-purple-950 text-purple-200 border-purple-700",
        };
      case "facture":
        return {
          title: "FACTURE",
          subTitle: "Facture de Prestation & Location Audiovisuelle",
          code: `FACT-${currentQuote.quoteNumber.replace("DEV-", "")}`,
          badge: "FACTURE OFFICIELLE",
          color: "bg-slate-900 text-slate-100 border-slate-700",
        };
      default:
        return {
          title: "DEVIS",
          subTitle: "Proposition Commerciale",
          code: currentQuote.quoteNumber,
          badge: "DEVIS",
          color: "bg-indigo-950 text-indigo-200 border-indigo-700",
        };
    }
  };

  const docMeta = getDocTitle();

  const handleOpenSignature = () => {
    if (docType === "bon_retour") {
      setSignatureTarget("client_return");
    } else {
      setSignatureTarget("client_departure");
    }
    setShowSignaturePad(true);
  };

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

    setCurrentQuote((prev) => ({ ...prev, ...updates }));

    if (onUpdateQuote) {
      await onUpdateQuote(quoteId, updates);
    }
  };

  const totalQuantityUnits = (currentQuote.rentalItems || []).reduce(
    (sum, i) => sum + i.quantity,
    0
  );

  // Group items by Audiovisual Chapter for structured print
  const groupedItems = useMemo(() => {
    const map = new Map<AudiovisualChapter, QuoteItemLine[]>();
    (currentQuote.rentalItems || []).forEach((item) => {
      if (docType === "bon_sous_location" && !item.isSubRental) return;
      const chap = item.chapterCategory || inferAudiovisualChapter(item.category, item.name);
      if (!map.has(chap)) {
        map.set(chap, []);
      }
      map.get(chap)!.push(item);
    });
    return map;
  }, [currentQuote.rentalItems, docType]);

  // Format dates for Locasyst French display (e.g. Samedi 04/04/26)
  const formatLocasystDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const dayName = dayNames[d.getDay()];
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2);
      return `${dayName} ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Helper for numeric formatting matching PDF (e.g. 5 040.00)
  const formatMoney = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return "0.00";
    return val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div
      id="modal-document-print"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white"
    >
      <div className="w-full max-w-6xl bg-[#0e111d] print:bg-white border border-[#232a48] print:border-none rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:h-auto animate-fadeIn">
        {/* ========================================================================= */}
        {/* TOP CONTROLS BAR (HIDDEN IN PRINT)                                        */}
        {/* ========================================================================= */}
        <div className="print:hidden px-6 py-4 bg-[#121626] border-b border-[#1e243d] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Édition & Impression Devis Audiovisuel
                  <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-bold border border-indigo-700/50">
                    Modèle Conforme Locasyst / Lumens
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Visualisation et exportation PDF avec pagination 3 pages, chapitres métiers, sous-sections et RIB
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-[#1b213b] hover:bg-[#252e52] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Document Type Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {[
              {
                id: "devis" as DocumentPrintType,
                label: "1. Devis",
                icon: FileText,
                badge: "Avec Prix",
                isFinancial: true,
              },
              {
                id: "bon_location" as DocumentPrintType,
                label: "2. Bon de Départ",
                icon: FileCheck,
                badge: "Sans Prix",
                isFinancial: false,
              },
              {
                id: "bon_livraison" as DocumentPrintType,
                label: "3. Bon Livraison",
                icon: Truck,
                badge: "Sans Prix",
                isFinancial: false,
              },
              {
                id: "bon_sous_location" as DocumentPrintType,
                label: "4. Sous-Loc Confrère",
                icon: TrendingUp,
                badge: "Fournisseur",
                isFinancial: true,
              },
              {
                id: "bon_retour" as DocumentPrintType,
                label: hasIncompleteItems ? "5. Bon Retour (!)" : "5. Bon Retour",
                icon: hasIncompleteItems ? AlertTriangle : RotateCcw,
                badge: "Sans Prix",
                isFinancial: false,
              },
              {
                id: "facture" as DocumentPrintType,
                label: "6. Facture",
                icon: Receipt,
                badge: "Avec Prix",
                isFinancial: true,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = docType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDocType(tab.id)}
                  className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30"
                      : "bg-[#161b2e] text-slate-300 hover:text-white border-[#242c4b] hover:bg-[#1c233d]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-center truncate w-full">{tab.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      tab.isFinancial
                        ? "bg-indigo-900/60 text-indigo-200"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Option Switches & Action Triggers */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#1e243d] text-xs text-slate-300">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Structure Style Toggle */}
              <div className="flex items-center bg-[#181d33] p-0.5 rounded-lg border border-[#273056]">
                <button
                  onClick={() => setLayoutMode("locasyst")}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                    layoutMode === "locasyst"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Format PDF Locasyst / Lumens</span>
                </button>
                <button
                  onClick={() => setLayoutMode("cinema")}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                    layoutMode === "cinema"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Format Standard KROMA</span>
                </button>
              </div>

              {isFinancialDoc ? (
                <label className="flex items-center gap-1.5 cursor-pointer text-indigo-300 font-medium">
                  <input
                    type="checkbox"
                    checked={showFinancialDetails}
                    onChange={(e) => setShowFinancialDetails(e.target.checked)}
                    className="rounded accent-indigo-600"
                  />
                  <span>Détail financier (P.U, Coef, R %, Total HT)</span>
                </label>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Prix masqués sur les bons logistiques</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenSignature}
                className="py-2 px-3.5 rounded-xl bg-[#1e243d] hover:bg-[#283152] border border-[#2e375c] text-indigo-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <PenTool className="w-4 h-4 text-indigo-400" />
                <span>✍️ Signer sur tablette</span>
              </button>

              <button
                onClick={() => window.print()}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer / PDF A4</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DOCUMENT PREVIEW CONTAINER (OPTIMIZED FOR A4 PRINT)                      */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/50 print:bg-white print:p-0 print:overflow-visible">
          {layoutMode === "locasyst" ? (
            /* ========================================================================= */
            /* 1. EXACT LOCASYST / LUMENS STRUCTURE (CONFORME AU MODÈLE DU CLIENT)     */
            /* ========================================================================= */
            <div
              id="printable-locasyst-document"
              className="w-full max-w-[210mm] mx-auto bg-white text-black print:rounded-none p-6 sm:p-10 shadow-2xl print:shadow-none font-sans text-xs leading-normal border border-slate-300 print:border-none print:p-0"
              style={{ minHeight: "297mm", fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              {/* Top Row: Logo & Box Devis */}
              <div className="flex items-start justify-between mb-4">
                {/* Left Brand / Logo */}
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="border-[3px] border-black rounded-full px-5 py-1 font-black text-2xl tracking-tighter uppercase font-sans text-black">
                        Lumens
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Devis Box */}
                <div className="flex flex-col items-end">
                  <div className="border-2 border-black px-4 py-1 text-center font-black text-base tracking-wider uppercase mb-1">
                    {docMeta.title}
                  </div>
                  <div className="text-right text-xs font-bold">
                    <div>N° : <span className="font-mono text-sm">{docMeta.code}</span></div>
                    <div className="text-[11px] text-gray-700 font-normal mt-0.5">
                      Page 1/3
                    </div>
                    <div className="text-[11px] font-normal">
                      Date : <span className="font-bold">{formatDateShort(currentQuote.date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* References & Account Manager */}
              <div className="flex justify-between items-center text-xs mb-3 font-semibold text-black">
                <div>
                  Dossier suivi par : <span className="font-bold">{currentQuote.projectManager || currentQuote.accountManager || "Bertrand BROT"}</span>{" "}
                  <span>{currentQuote.projectManagerPhone || currentQuote.accountManagerPhone || "06 11 60 78 77"}</span>
                </div>
                <div>
                  Vos références / Événement : <span className="font-bold">{currentQuote.clientProjectRef || currentQuote.projectName || "Convention Annuelle"}</span>
                </div>
              </div>

              {/* Side-by-Side Bordered Boxes: Livraison / Lieu & Facturation */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Box Livraison / Lieu Événement */}
                <div className="border border-black p-2.5 rounded-none text-xs flex flex-col justify-between min-h-[90px]">
                  <div>
                    <div className="font-bold uppercase text-[11px] mb-1">Lieu de l'Événement / Livraison :</div>
                    <div className="font-normal text-[11px]">
                      {currentQuote.eventLocation || currentQuote.shippingAddress || "Palais des Congrès de Paris"}
                    </div>
                  </div>
                  <div className="pt-2 text-[11px]">
                    <div>Contact Régie / Sur Place : <span className="font-medium">{currentQuote.onSiteContactName || currentQuote.deliveryContactName || currentQuote.technicalDirector || ""}</span></div>
                    <div className="flex justify-between">
                      <span>Tél. : {currentQuote.onSiteContactPhone || currentQuote.deliveryPhone || currentQuote.technicalDirectorPhone || ""}</span>
                      <span>Tél.1 : {currentQuote.deliveryPhone1 || ""}</span>
                    </div>
                  </div>
                </div>

                {/* Box Facturation */}
                <div className="border border-black p-2.5 rounded-none text-xs flex flex-col justify-between min-h-[90px]">
                  <div>
                    <div className="font-bold uppercase text-[11px] mb-1">Client / Facturation :</div>
                    <div className="font-bold text-xs">
                      {currentQuote.billingCompanyName || currentQuote.clientCompany || currentQuote.clientName || "CLIENT ÉVÉNEMENT"}
                    </div>
                  </div>
                  <div className="pt-2 text-[11px]">
                    <div>Contact : <span className="font-medium">{currentQuote.billingContactName || currentQuote.clientName || ""}</span></div>
                    <div>Mobile : <span className="font-medium">{currentQuote.clientMobile || currentQuote.clientPhone || ""}</span></div>
                  </div>
                </div>
              </div>

              {/* Dates Bar */}
              <div className="text-[11px] border-b border-black pb-1.5 mb-2 font-normal space-y-0.5">
                <div className="flex justify-between">
                  <span>
                    Départ : <strong className="font-bold">{formatLocasystDate(currentQuote.departureDate || currentQuote.startDate)}</strong>
                  </span>
                  <span>
                    Retour : <strong className="font-bold">{formatLocasystDate(currentQuote.returnDate || currentQuote.endDate)}</strong>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Début de location : <strong className="font-bold">{formatLocasystDate(currentQuote.startDate)}</strong>
                  </span>
                  <span>
                    Fin de location : <strong className="font-bold">{formatLocasystDate(currentQuote.endDate)}</strong>
                  </span>
                </div>
              </div>

              {/* Setup / Exploitation / Teardown Schedule */}
              <div className="text-[11px] font-bold text-black flex justify-between border-b border-black pb-1.5 mb-3">
                <span>{currentQuote.setupSchedule || "Montage: Samedi 4 Avril 8h"}</span>
                <span>{currentQuote.exploitationSchedule || "Exploitation:"}</span>
                <span>{currentQuote.teardownSchedule || "Démontage: Dimanche 5 Avril 20h"}</span>
              </div>

              {/* ========================================================================= */}
              {/* MAIN TABLE WITH 7 COLUMNS (EXACT LOCASYST LAYOUT)                        */}
              {/* ========================================================================= */}
              <div className="w-full mb-6">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="border-t-2 border-b-2 border-black bg-white font-bold text-black">
                      <th className="py-1 px-1.5 text-center w-10 border-r border-slate-300">Qté</th>
                      <th className="py-1 px-2 text-left">Désignation</th>
                      {isFinancialDoc && showFinancialDetails && (
                        <>
                          <th className="py-1 px-2 text-right w-20">Prix Unit</th>
                          <th className="py-1 px-1.5 text-center w-14">Coef.</th>
                          <th className="py-1 px-1.5 text-center w-10">R</th>
                          <th className="py-1 px-2 text-right w-20">P.U.HT</th>
                          <th className="py-1 px-2 text-right w-24">Total HT</th>
                        </>
                      )}
                      {!isFinancialDoc && (
                        <th className="py-1 px-3 text-center w-28">Pointage</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(groupedItems.entries()).map(([chapterKey, itemsInChapter]) => {
                      const chapDef = AUDIOVISUAL_CHAPTERS[chapterKey] || AUDIOVISUAL_CHAPTERS.videoprojection;
                      const chapterSubTotal = itemsInChapter.reduce((acc, i) => acc + (i.totalHT || 0), 0);

                      // Group by subSectionTitle if defined (e.g. "Mur Led de Fond: 6 x 3,5")
                      const subSectionGroups = new Map<string, QuoteItemLine[]>();
                      itemsInChapter.forEach((it) => {
                        const subKey = it.subSectionTitle || "__NONE__";
                        if (!subSectionGroups.has(subKey)) {
                          subSectionGroups.set(subKey, []);
                        }
                        subSectionGroups.get(subKey)!.push(it);
                      });

                      return (
                        <React.Fragment key={chapterKey}>
                          {/* Main Chapter Header (Bold, Uppercase, with Underline) */}
                          <tr className="border-t border-slate-400">
                            <td colSpan={isFinancialDoc && showFinancialDetails ? 7 : 3} className="pt-3 pb-1 px-1">
                              <div className="font-black text-xs uppercase tracking-wide underline underline-offset-4 decoration-1">
                                {chapDef.label}
                              </div>
                            </td>
                          </tr>

                          {/* Subsections & Items */}
                          {Array.from(subSectionGroups.entries()).map(([subTitle, subItems]) => {
                            const firstItemWithDetail = subItems.find((s) => Boolean(s.subSectionDetail));
                            return (
                              <React.Fragment key={subTitle}>
                                {subTitle !== "__NONE__" && (
                                  <tr>
                                    <td colSpan={isFinancialDoc && showFinancialDetails ? 7 : 3} className="pt-2 pb-1 px-2">
                                      <div className="font-bold text-[11px] text-black">
                                        {subTitle}
                                      </div>
                                      {firstItemWithDetail?.subSectionDetail && (
                                        <div className="text-[10px] font-bold text-gray-700 italic">
                                          {firstItemWithDetail.subSectionDetail}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}

                                {subItems.map((line, idx) => {
                                  const baseUnitPrice = line.unitPriceBase ?? line.unitPricePerDay ?? 0;
                                  const effectiveDiscount = line.discountPercent || 0;
                                  const discountedUnitPrice =
                                    line.unitPriceDiscounted ??
                                    (effectiveDiscount > 0
                                      ? Math.round(baseUnitPrice * (1 - effectiveDiscount / 100) * 100) / 100
                                      : baseUnitPrice);
                                  const coeff = line.rentalCoefficient || currentQuote.globalRentalCoefficient || 1.0;

                                  return (
                                    <tr
                                      key={`${line.itemId}-${idx}`}
                                      className="border-b border-dotted border-slate-200 hover:bg-slate-50/80"
                                    >
                                      {/* Quantity */}
                                      <td className="py-1 px-1.5 text-center font-bold align-top border-r border-slate-200">
                                        {line.quantity}
                                      </td>

                                      {/* Designation & Technical description */}
                                      <td className="py-1 px-2 align-top">
                                        <div className="font-normal text-black leading-tight">
                                          {line.name}
                                        </div>
                                        {line.descriptionDetail && (
                                          <div className="text-[10px] text-gray-600 font-normal mt-0.5">
                                            {line.descriptionDetail}
                                          </div>
                                        )}
                                        {line.isSubRental && (
                                          <span className="text-[9px] px-1 bg-amber-100 text-amber-900 font-bold border border-amber-300 inline-block mr-1 mt-0.5">
                                            Sous-loc {line.subRentalSupplier || "Confrère"}
                                          </span>
                                        )}
                                      </td>

                                      {/* Financial Columns */}
                                      {isFinancialDoc && showFinancialDetails && (
                                        <>
                                          <td className="py-1 px-2 text-right align-top font-mono font-normal">
                                            {formatMoney(baseUnitPrice)}
                                          </td>
                                          <td className="py-1 px-1.5 text-center align-top font-mono font-normal">
                                            {coeff.toFixed(2)}
                                          </td>
                                          <td className="py-1 px-1.5 text-center align-top font-mono font-normal">
                                            {effectiveDiscount > 0 ? `${effectiveDiscount}` : ""}
                                          </td>
                                          <td className="py-1 px-2 text-right align-top font-mono font-normal">
                                            {formatMoney(discountedUnitPrice)}
                                          </td>
                                          <td className="py-1 px-2 text-right align-top font-mono font-bold">
                                            {formatMoney(line.totalHT)}
                                          </td>
                                        </>
                                      )}

                                      {!isFinancialDoc && (
                                        <td className="py-1 px-3 text-center align-top">
                                          <div className="w-4 h-4 border border-black mx-auto" />
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}

                          {/* Chapter Subtotal Row */}
                          {isFinancialDoc && showFinancialDetails && (
                            <tr className="border-t border-black font-bold">
                              <td colSpan={6} className="py-1.5 px-2 text-left font-bold uppercase text-[11px]">
                                Total {chapDef.label}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-black text-[11px]">
                                {formatMoney(chapterSubTotal)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ========================================================================= */}
              {/* PAGE 3 / END OF QUOTE RECAP, RIB & SIGNATURES                            */}
              {/* ========================================================================= */}
              {isFinancialDoc && showFinancialDetails && (
                <div className="pt-2 border-t-2 border-black space-y-4">
                  {/* Two Columns: Reste à votre charge VS Totals Box */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Left: RESTE A VOTRE CHARGE */}
                    <div className="border border-black p-3 text-[11px] flex flex-col justify-between">
                      <div>
                        <div className="font-black uppercase tracking-wider mb-2">
                          RESTE A VOTRE CHARGE
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-gray-800 text-[11px]">
                          {(currentQuote.remainingClientCharges || [
                            "Le Transport A/R du Matériel",
                            "L'Assurance Bris de Machine",
                            "Le Respect des Conditions Techniques",
                          ]).map((charge, i) => (
                            <li key={i}>{charge}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Right: Totals Box */}
                    <div className="border border-black p-3 text-[11px] font-bold space-y-1 text-right">
                      <div className="flex justify-between">
                        <span>Total HT :</span>
                        <span className="font-mono text-xs">{formatMoney(currentQuote.totalHT)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total TVA ({currentQuote.taxRate ?? 20}%) :</span>
                        <span className="font-mono text-xs">{formatMoney(currentQuote.totalTVA)} €</span>
                      </div>
                      <div className="flex justify-between border-t-2 border-black pt-1.5 text-sm font-black">
                        <span>Total TTC :</span>
                        <span className="font-mono">{formatMoney(currentQuote.totalTTC)} €</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery / Reprise dates and payment terms */}
                  <div className="grid grid-cols-2 gap-4 text-[11px] border-b border-black pb-2">
                    <div className="space-y-0.5">
                      <div>Date de livraison : <span className="font-medium">{formatDateShort(currentQuote.deliveryDate || currentQuote.startDate)}</span></div>
                      <div>Date de reprise : <span className="font-medium">{formatDateShort(currentQuote.returnDate || currentQuote.endDate)}</span></div>
                    </div>
                    <div className="space-y-0.5">
                      <div>Délai de règlement : <span className="font-medium">{currentQuote.paymentTermsDays || "Comptant à réception"}</span></div>
                      <div>Mode de règlement : <span className="font-medium">{currentQuote.paymentMode || "Virement bancaire"}</span></div>
                    </div>
                  </div>

                  {/* Mandatory acceptance text */}
                  <div className="text-[10px] italic text-center font-semibold text-gray-800">
                    "La signature du présent devis vaut l'acceptation des conditions générales de location"
                  </div>

                  {/* Bank Details (RIB) & Signatures */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    {/* Left: RIB Table */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold">
                        IBAN : <span className="font-mono">{currentQuote.bankIban || "FR 76 1820 6000 1060 2758 9258 842"}</span>
                      </div>
                      <table className="w-full border border-black text-center text-[10px] border-collapse">
                        <thead>
                          <tr className="border-b border-black bg-gray-100 font-bold">
                            <th className="py-1 px-1 border-r border-black">Code banque</th>
                            <th className="py-1 px-1 border-r border-black">Code guichet</th>
                            <th className="py-1 px-1 border-r border-black">N° compte</th>
                            <th className="py-1 px-1">Clé</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="font-mono">
                            <td className="py-1 px-1 border-r border-black">{currentQuote.bankCodeBanque || "18206"}</td>
                            <td className="py-1 px-1 border-r border-black">{currentQuote.bankCodeGuichet || "00010"}</td>
                            <td className="py-1 px-1 border-r border-black">{currentQuote.bankNumCompte || "60275892588"}</td>
                            <td className="py-1 px-1">{currentQuote.bankCle || "42"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Right: Bon pour accord & Signature */}
                    <div className="border border-black p-2.5 text-[11px] min-h-[110px] flex flex-col justify-between">
                      <div>
                        <div className="font-bold">Bon pour accord :</div>
                        <div className="text-[10px] text-gray-700">Nom du signataire : {currentQuote.departureSignature?.signerName || ""}</div>
                      </div>

                      {currentQuote.departureSignature ? (
                        <div className="bg-emerald-50 border border-emerald-500/40 p-1.5 rounded text-emerald-950 text-[10px]">
                          <div className="font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Signé numériquement par {currentQuote.departureSignature.signerName}
                          </div>
                          <div className="text-[9px] text-emerald-800">
                            Le {new Date(currentQuote.departureSignature.signedAt).toLocaleString("fr-FR")}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-end text-[10px] text-gray-500 pt-4">
                          <span>Signature :</span>
                          <span>Cachet :</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Legal Mentions on every page */}
              <div className="mt-8 pt-2 border-t border-slate-300 text-[8px] text-gray-600 text-center leading-tight space-y-0.5">
                <div>
                  Indemnité forfaitaire de 40€ pour frais de recouvrement en cas de retard de paiement. Pénalités exigibles en cas de retard : Taux d'intérêt appliqué par la BCE majoré de 10%
                </div>
                <div>
                  {currentQuote.companyAddressLine || "Lumens Box - 277 Rue Fourny - BP36 - 78530 Buc"}
                </div>
                <div>
                  {currentQuote.companyCapital || "SAS au Capital de 25 000 €"} - Siret {currentQuote.companySiret || "523 019 446 00021"}/ RCS {currentQuote.companyRcs || "Versailles 523 019 446"}/ - APE : {currentQuote.companyApe || "9002 Z"} - tva Intracommunautaire: {currentQuote.companyTvaIntra || "FR27 523 019 446"}
                </div>
                <div className="font-mono text-gray-400">Locasyst 3.62</div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. STANDARD KROMA CINEMA & LOGISTICS LAYOUT                              */
            /* ========================================================================= */
            <div
              id="printable-cinema-document"
              className="w-full max-w-[210mm] mx-auto bg-white text-slate-900 rounded-2xl print:rounded-none p-6 sm:p-10 shadow-2xl print:shadow-none space-y-6 font-sans text-xs leading-relaxed border border-slate-200 print:border-none"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                      K
                    </div>
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                      {settings.companyName || "KROMA Audiovisuel & Logistique"}
                    </h1>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {settings.warehouseName || "Dépôt Central Paris-Nord"} • Caméras, Optiques, Éclairage, Son & Studios
                  </p>
                  <p className="text-[10px] text-slate-500">
                    SIRET : 849 203 194 00028 • TVA : FR 48 849203194 • RCS Paris
                  </p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-black uppercase tracking-wider text-center ${docMeta.color}`}
                  >
                    {docMeta.title}
                  </span>
                  <div className="text-sm font-black text-slate-900 font-mono mt-2">
                    RÉF : {docMeta.code}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Émis le : {new Date(currentQuote.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[9px] font-black uppercase text-indigo-900 tracking-wider">
                    Projet / Film & Production :
                  </span>
                  <div className="text-xs font-black text-indigo-950">
                    {currentQuote.projectName || "Projet de Tournage"}
                  </div>
                  <div className="text-[11px] font-bold text-slate-800">
                    {currentQuote.productionCompany || currentQuote.clientCompany || currentQuote.clientName}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                    Équipe Cadre & Lumière :
                  </span>
                  <div className="text-[11px] text-slate-800">
                    Chef Opérateur (DOP) : <strong>{currentQuote.directorOfPhotography || "Non renseigné"}</strong>
                  </div>
                  <div className="text-[11px] text-slate-800">
                    Chef Électricien (Gaffer) : <strong>{currentQuote.chiefElectrician || "Non renseigné"}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                    Planning & Barème :
                  </span>
                  <div className="text-xs font-bold text-slate-900">
                    Dates : {currentQuote.startDate} → {currentQuote.endDate}
                  </div>
                  <div className="text-[10px] font-bold text-indigo-700">
                    Facturation : {currentQuote.durationDays || 1}j (Coeff {currentQuote.globalRentalCoefficient || 1.0})
                  </div>
                </div>
              </div>

              {/* Grouped Table */}
              <div className="space-y-4">
                {Array.from(groupedItems.entries()).map(([chapterKey, lines]) => {
                  const chapDef = AUDIOVISUAL_CHAPTERS[chapterKey] || AUDIOVISUAL_CHAPTERS.videoprojection;
                  const chapterTotalHT = lines.reduce((acc, l) => acc + (l.totalHT || 0), 0);

                  return (
                    <div key={chapterKey} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 flex items-center justify-between border-b border-slate-200">
                        <span className="font-black text-[11px] text-slate-800 uppercase tracking-wide">
                          {chapDef.label}
                        </span>
                        {isFinancialDoc && showFinancialDetails && (
                          <span className="font-black text-[11px] text-slate-900 font-mono">
                            Sous-total : {formatMoney(chapterTotalHT)} € HT
                          </span>
                        )}
                      </div>

                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-1.5 px-3">Désignation Matériel & Réf</th>
                            <th className="py-1.5 px-2 text-center">Qté</th>
                            {isFinancialDoc && showFinancialDetails && (
                              <>
                                <th className="py-1.5 px-2 text-right">Tarif/j HT</th>
                                <th className="py-1.5 px-2 text-center">Coeff</th>
                                <th className="py-1.5 px-2 text-right">Total HT</th>
                              </>
                            )}
                            {!isFinancialDoc && (
                              <th className="py-1.5 px-3 text-center">Contrôle / Pointage</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lines.map((line, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-bold text-slate-900">
                                <div>{line.name}</div>
                                {line.subSectionTitle && (
                                  <span className="text-[9px] text-indigo-600 block">
                                    Section: {line.subSectionTitle}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-center font-black text-slate-900">
                                {line.quantity}
                              </td>
                              {isFinancialDoc && showFinancialDetails && (
                                <>
                                  <td className="py-2 px-2 text-right font-mono text-slate-700">
                                    {formatMoney(line.unitPricePerDay)} €
                                  </td>
                                  <td className="py-2 px-2 text-center font-mono text-slate-700 font-bold">
                                    {line.rentalCoefficient || currentQuote.globalRentalCoefficient || 1.0}
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono font-black text-slate-900">
                                    {formatMoney(line.totalHT)} €
                                  </td>
                                </>
                              )}
                              {!isFinancialDoc && (
                                <td className="py-2 px-3 text-center">
                                  <div className="w-4 h-4 rounded border border-slate-400 mx-auto" />
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              {/* Financial Recap */}
              {isFinancialDoc && showFinancialDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                    <span className="font-bold text-slate-800">Conditions de règlement :</span>
                    <p className="text-slate-600">{currentQuote.paymentTermsDays || "Comptant à réception"}</p>
                    <p className="text-slate-600">IBAN : {currentQuote.bankIban || "FR 76 1820 6000 1060 2758 9258 842"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-right text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Total HT :</span>
                      <span className="font-mono font-bold">{formatMoney(currentQuote.totalHT)} €</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>TVA ({currentQuote.taxRate ?? 20}%) :</span>
                      <span className="font-mono font-bold">{formatMoney(currentQuote.totalTVA)} €</span>
                    </div>
                    <div className="flex justify-between font-black text-base text-slate-900 pt-1.5 border-t-2 border-slate-900">
                      <span>TOTAL TTC :</span>
                      <span className="font-mono">{formatMoney(currentQuote.totalTTC)} €</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Signature Pad Modal for Touch/Mobile */}
      {showSignaturePad && (
        <SignaturePadModal
          quote={currentQuote}
          target={signatureTarget}
          onSave={handleSaveSignature}
          onClose={() => setShowSignaturePad(false)}
        />
      )}
    </div>
  );
};
