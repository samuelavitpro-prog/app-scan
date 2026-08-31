import React, { useState } from "react";
import {
  Globe,
  Share2,
  Copy,
  Check,
  X,
  FileText,
  Lock,
  CreditCard,
  PenTool,
  Download,
  Calendar,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  Send,
  AlertCircle,
} from "lucide-react";
import { ClientQuote, AppSettings, DocumentSignature } from "../types";
import { AUDIOVISUAL_CHAPTERS, inferAudiovisualChapter } from "../utils/coefficients";

interface ClientPortalModalProps {
  quote: ClientQuote;
  settings: AppSettings;
  onClose: () => void;
  onUpdateQuote?: (id: string, updates: Partial<ClientQuote>) => Promise<boolean> | void;
}

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({
  quote,
  settings,
  onClose,
  onUpdateQuote,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSignedOnline, setIsSignedOnline] = useState(Boolean(quote.departureSignature));
  const [signerName, setSignerName] = useState(quote.clientName || "Directeur de Production");
  const [signerRole, setSignerRole] = useState("Production & Régie");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [clientComment, setClientComment] = useState("");
  const [isDepositPaid, setIsDepositPaid] = useState(quote.depositStatus === "received");
  const [activeTab, setActiveTab] = useState<"client_view" | "share_settings">("client_view");

  const portalUrl = `https://kroma-rental.app/portal/quote/${quote.quoteNumber}?token=sec_${quote.id.substring(0, 8)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSignOnline = async () => {
    if (!acceptedTerms) {
      alert("Veuillez cocher la case d'acceptation des Conditions Générales de Location.");
      return;
    }

    const signature: DocumentSignature = {
      signerName,
      signerRole,
      signedAt: new Date().toISOString(),
      validationMethod: "mobile_signed",
      isOperatorValidated: true,
    };

    const updates: Partial<ClientQuote> = {
      departureSignature: signature,
      status: "accepted",
    };

    setIsSignedOnline(true);
    if (onUpdateQuote) {
      await onUpdateQuote(quote.id, updates);
    }
  };

  const handlePayDeposit = async () => {
    const updates: Partial<ClientQuote> = {
      depositStatus: "received",
      depositPaymentDate: new Date().toISOString(),
      depositPaymentMethod: "cb",
    };
    setIsDepositPaid(true);
    if (onUpdateQuote) {
      await onUpdateQuote(quote.id, updates);
    }
  };

  // Group items by chapter
  const groupedItems = React.useMemo(() => {
    const map = new Map<string, typeof quote.rentalItems>();
    (quote.rentalItems || []).forEach((item) => {
      const chap = item.chapterCategory || inferAudiovisualChapter(item.category, item.name);
      if (!map.has(chap)) {
        map.set(chap, []);
      }
      map.get(chap)!.push(item);
    });
    return map;
  }, [quote.rentalItems]);

  return (
    <div
      id="modal-client-portal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-4xl bg-[#0f1222] border border-[#232a48] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] animate-fadeIn">
        {/* Top Navigation Bar */}
        <div className="px-6 py-4 bg-[#14182b] border-b border-[#1f2647] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black shadow-md">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Portail Client & Validation en Ligne
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Lien Sécurisé Actif
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Espace dédié à la société de production pour consulter, signer et régler l'acompte
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

        {/* Share Link Banner */}
        <div className="px-6 py-3 bg-[#181e38] border-b border-[#252e54] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 min-w-0">
            <Share2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-bold text-white shrink-0">Lien Privé Client :</span>
            <span className="font-mono text-indigo-300 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800 truncate">
              {portalUrl}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                copiedLink
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
              }`}
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? "Copié !" : "Copier le Lien"}</span>
            </button>

            <a
              href={`mailto:${quote.clientEmail || ""}?subject=Votre Devis Audiovisuel KROMA ${quote.quoteNumber}&body=Bonjour,\n\nRetrouvez votre devis et signez-le en ligne sur votre espace dédié : ${portalUrl}`}
              className="px-3 py-1.5 rounded-xl bg-[#222a4d] hover:bg-[#2c3763] text-slate-200 font-bold flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer par Email</span>
            </a>
          </div>
        </div>

        {/* Simulated Client Portal View (What Production Sees) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950/60">
          <div className="max-w-3xl mx-auto bg-[#121629] border border-[#232a48] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-200">
            {/* Header Event & Client */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                  Proposition Événementielle & Location Matériel
                </span>
                <h1 className="text-xl font-black text-white">
                  {quote.projectName || "Événement & Prestation Technique"}
                </h1>
                <p className="text-xs text-slate-300 font-medium">
                  Client : <strong>{quote.clientCompany || quote.clientName}</strong>
                  {quote.clientName && quote.clientCompany ? ` (Attn: ${quote.clientName})` : ""}
                </p>
                {quote.eventLocation && (
                  <p className="text-xs text-emerald-400 font-medium">
                    📍 Lieu de prestation : {quote.eventLocation}
                  </p>
                )}
                <div className="text-[11px] text-slate-400">
                  Émis par : <strong>{settings.companyName || "KROMA Location & Événement"}</strong>
                  {quote.projectManager ? ` • Chargé d'affaires : ${quote.projectManager}` : ""}
                </div>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-black">
                  RÉF : {quote.quoteNumber}
                </span>
                <div className="text-xs text-slate-400 mt-2">
                  Dates : {quote.shootStartDate || quote.startDate} → {quote.shootEndDate || quote.endDate}
                </div>
                <div className="text-xs font-bold text-indigo-300">
                  {quote.durationDays || 1} jour(s) facturé(s) (Coeff {quote.rentalCoefficient || quote.globalRentalCoefficient || 1.0})
                </div>
                {quote.setupSchedule && (
                  <div className="text-[10px] text-slate-400 mt-1">
                    Montage : {quote.setupSchedule}
                  </div>
                )}
              </div>
            </div>

            {/* Audiovisual Chapters Equipment Preview */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Détail du Matériel & Prestations Réservés
              </h3>

              {Array.from(groupedItems.entries()).map(([chapterKey, lines]) => {
                const chapDef = (AUDIOVISUAL_CHAPTERS as any)[chapterKey] || { label: "Équipements" };
                const subTotalHT = lines.reduce((sum, l) => sum + (l.totalHT || 0), 0);

                return (
                  <div key={chapterKey} className="border border-slate-800 rounded-2xl overflow-hidden bg-[#171c33]">
                    <div className="bg-[#1c223d] px-3.5 py-2 flex items-center justify-between text-xs font-black text-slate-200">
                      <span>{chapDef.label}</span>
                      <span className="font-mono text-indigo-300">{subTotalHT.toLocaleString("fr-FR")} € HT</span>
                    </div>

                    <div className="divide-y divide-slate-800 text-xs">
                      {lines.map((line, idx) => (
                        <div key={idx} className="p-2.5 px-3.5 flex items-start justify-between gap-2">
                          <div>
                            {line.subSectionTitle && (
                              <span className="text-[10px] font-bold text-indigo-400 block mb-0.5">
                                ▸ {line.subSectionTitle}
                              </span>
                            )}
                            <span className="font-bold text-white block">{line.name}</span>
                            {line.descriptionDetail && (
                              <span className="text-[10px] text-slate-400 block italic">
                                {line.descriptionDetail}
                              </span>
                            )}
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Qté: {line.quantity}</span>
                              {line.discountPercent && line.discountPercent > 0 ? (
                                <span className="text-amber-400 font-semibold">Remise: -{line.discountPercent}%</span>
                              ) : null}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-300 shrink-0">
                            {line.totalHT.toLocaleString("fr-FR")} € HT
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Totals Recap */}
            <div className="p-4 rounded-2xl bg-[#171c33] border border-[#232a48] space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Matériel & Services HT :</span>
                <span className="font-mono font-bold text-slate-200">{quote.totalHT.toLocaleString("fr-FR")} €</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>TVA (20%) :</span>
                <span className="font-mono font-bold text-slate-200">{quote.totalTVA.toLocaleString("fr-FR")} €</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-700">
                <span>TOTAL TTC :</span>
                <span className="font-mono text-indigo-400 text-base">{quote.totalTTC.toLocaleString("fr-FR")} € TTC</span>
              </div>
            </div>

            {/* Acompte & Caution Callout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Acompte Box */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-200 uppercase text-[10px]">
                    1. Acompte de Réservation ({quote.depositPercent || 30}%) :
                  </span>
                  {isDepositPaid ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      ✓ Réglé en ligne
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-300 font-bold">À régler</span>
                  )}
                </div>

                <div className="text-lg font-black text-white font-mono">
                  {(quote.depositAmount || (quote.totalTTC * 0.3)).toLocaleString("fr-FR")} € TTC
                </div>

                {!isDepositPaid && (
                  <button
                    onClick={handlePayDeposit}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Payer l'Acompte par CB</span>
                  </button>
                )}
              </div>

              {/* Caution Box */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="font-black text-slate-400 uppercase text-[10px] block">
                  2. Caution de Garantie Financière :
                </span>
                <div className="text-lg font-black text-white font-mono">
                  {(quote.depositGuaranteeAmount || 5000).toLocaleString("fr-FR")} €
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Non débitée. Prise par empreinte CB ou lettre d'assurance production au départ du matériel.
                </p>
              </div>
            </div>

            {/* Online Signature Box */}
            <div className="p-5 rounded-2xl bg-[#171c33] border border-[#232a48] space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-black text-white">Signature Électronique pour Accord</h4>
                </div>

                {isSignedOnline && (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Devis Signé en Ligne</span>
                  </span>
                )}
              </div>

              {!isSignedOnline ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Nom du Signataire :</label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="w-full bg-[#121629] border border-slate-700 rounded-xl p-2 text-white font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Qualité / Fonction :</label>
                      <input
                        type="text"
                        value={signerRole}
                        onChange={(e) => setSignerRole(e.target.value)}
                        className="w-full bg-[#121629] border border-slate-700 rounded-xl p-2 text-white font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="rounded accent-indigo-600 w-4 h-4"
                    />
                    <span>
                      Je confirme l'accord de la société de production et j'accepte les Conditions Générales de Location.
                    </span>
                  </label>

                  <button
                    onClick={handleSignOnline}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Signer Électroniquement & Valider la Réservation</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Validé par {signerName} ({signerRole})</span>
                  </div>
                  <div className="text-[10px] opacity-80 font-mono">
                    Horodatage certifié : {new Date().toLocaleString("fr-FR")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
