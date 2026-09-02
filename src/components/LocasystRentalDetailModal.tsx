import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  History,
  Package,
  Printer,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { ClientQuote, DocumentPrintType } from "../types";

interface LocasystRentalDetailModalProps {
  quote: ClientQuote;
  onClose: () => void;
  onOpenCheckin: (quote: ClientQuote) => void;
  onQuickReturn: (quote: ClientQuote) => void;
  onPrint: (quote: ClientQuote, type: DocumentPrintType) => void;
  onSign: (quote: ClientQuote) => void;
}

type DetailTab = "detail" | "pricing" | "margin" | "info" | "notes" | "resources" | "documents" | "history";

const date = (value?: string) => (value ? new Date(value).toLocaleDateString("fr-FR") : "—");
const money = (value = 0) => `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;

export const LocasystRentalDetailModal: React.FC<LocasystRentalDetailModalProps> = ({
  quote,
  onClose,
  onOpenCheckin,
  onQuickReturn,
  onPrint,
  onSign,
}) => {
  const [tab, setTab] = useState<DetailTab>("detail");
  const lines = quote.rentalItems || [];
  const returned = quote.rentalStatus === "returned";
  const missing = lines.reduce((sum, line) => sum + (line.missingQty || line.lostQty || 0), 0);
  const totalDays = quote.durationDays || 1;
  const totalRental = useMemo(() => lines.reduce((sum, line) => sum + line.totalHT, 0), [lines]);
  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: "detail", label: "Détail location", icon: <Package size={14} /> },
    { id: "pricing", label: "Calcul du prix", icon: <span className="font-black">€</span> },
    { id: "margin", label: "Marge", icon: <span className="font-black">%</span> },
    { id: "info", label: "Autres infos", icon: <FileText size={14} /> },
    { id: "notes", label: "Observations", icon: <FileText size={14} /> },
    { id: "resources", label: "Ressources", icon: <UserRound size={14} /> },
    { id: "documents", label: "Documents", icon: <Printer size={14} /> },
    { id: "history", label: "Historique", icon: <History size={14} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm">
      <div className="locasyst-modal flex max-h-[94vh] w-full max-w-[1420px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-[#f4f7fa] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3e82b4] text-white"><Package size={21} /></div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-extrabold text-[#1e2d45]">{quote.rentalStatus === "returned" ? "Ret. contrôlé" : "Location"} n° {quote.quoteNumber.replace("DEV", "LOC")}</h2>
                <span className={`rounded-md border px-2 py-1 text-[11px] font-bold ${returned ? "border-emerald-200 bg-emerald-50 text-emerald-700" : missing ? "border-amber-200 bg-amber-50 text-amber-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
                  {returned ? "Retour conforme" : missing ? "Retour incomplet" : "En cours"}
                </span>
              </div>
              <p className="text-xs text-slate-500">Devis associé : {quote.quoteNumber} · {quote.projectName || quote.clientProjectRef || "Affaire sans intitulé"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onPrint(quote, returned ? "bon_retour" : "bon_location")} className="locasyst-toolbar-button"><Printer size={15} /> Imprimer</button>
            <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Fermer"><X size={20} /></button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-px border-b border-slate-200 bg-slate-200 md:grid-cols-6">
          {[
            ["Client", quote.clientName || "—", quote.clientCompany],
            ["Contact", quote.clientEmail || "—", quote.clientPhone],
            ["Début loc.", date(quote.startDate), `${totalDays} jour(s)`],
            ["Dépôt", quote.depotName || "Dépôt principal", quote.depotId],
            ["Départ", date(quote.departureDate || quote.startDate), quote.departureTimeSlot || "À confirmer"],
            ["Retour", date(quote.actualReturnDate || quote.endDate), returned ? "Contrôlé" : "À prévoir"],
          ].map(([label, value, detail]) => (
            <div key={label} className="bg-white px-3 py-2.5"><div className="locasyst-field-label">{label}</div><div className="truncate text-sm font-bold text-[#263852]">{value}</div><div className="truncate text-[11px] text-slate-500">{detail || " "}</div></div>
          ))}
        </section>

        <nav className="flex overflow-x-auto border-b border-slate-300 bg-white px-4 pt-2">
          {tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`locasyst-tab ${tab === item.id ? "locasyst-tab-active" : ""}`}>{item.icon}{item.label}</button>)}
        </nav>

        <main className="min-h-0 flex-1 overflow-auto p-4">
          {tab === "detail" ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="text-base font-extrabold text-[#253752]">Articles de la location</h3><p className="text-xs text-slate-500">{lines.length} référence(s) · quantités demandées, sorties et retours</p></div>
                <div className="flex items-center gap-2"><button onClick={onSign.bind(null, quote)} className="locasyst-secondary-button"><CheckCircle2 size={15} /> Émargement</button><button onClick={() => onOpenCheckin(quote)} className="locasyst-primary-button"><Check size={15} /> Pointer le retour</button></div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
                <table className="min-w-[1050px] w-full text-left text-xs">
                  <thead className="bg-[#e7f0f7] text-[10px] font-extrabold uppercase tracking-wide text-[#60758c]"><tr><th className="p-2.5">Code article</th><th className="p-2.5">Description</th><th className="p-2.5 text-center">Qté demandée</th><th className="p-2.5 text-center">Qté location</th><th className="p-2.5 text-center">Qté sortie</th><th className="p-2.5 text-center">Qté retour</th><th className="p-2.5 text-center">État</th><th className="p-2.5 text-right">Prix loc./j</th><th className="p-2.5 text-right">Rem. %</th><th className="p-2.5 text-right">Total ligne</th></tr></thead>
                  <tbody className="divide-y divide-slate-200 text-[#334962]">{lines.length ? lines.map((line, index) => { const returnedQty = line.returnedOkQty ?? (returned ? line.quantity : 0); const issue = (line.missingQty || line.damagedQty || line.lostQty || 0) > 0; return <tr key={`${line.itemId}-${index}`} className={issue ? "bg-amber-50" : index === 0 ? "bg-[#eef7fc]" : ""}><td className="p-2.5 font-mono font-bold text-[#3479ab]">{line.itemId || "—"}</td><td className="p-2.5"><div className="font-bold">{line.name}</div><div className="text-[11px] text-slate-500">{line.brand || line.category || "Matériel audiovisuel"}</div></td><td className="p-2.5 text-center font-semibold">{line.quantity}</td><td className="p-2.5 text-center">{line.quantity}</td><td className="p-2.5 text-center font-bold">{line.quantity}</td><td className="p-2.5 text-center font-bold text-emerald-700">{returnedQty}</td><td className="p-2.5 text-center">{issue ? <span className="locasyst-status-warning">Réserve</span> : <span className="locasyst-status-ok">OK</span>}</td><td className="p-2.5 text-right">{money(line.unitPricePerDay)}</td><td className="p-2.5 text-right">{line.discountPercent || 0}</td><td className="p-2.5 text-right font-extrabold">{money(line.totalHT)}</td></tr>; }) : <tr><td colSpan={10} className="p-12 text-center text-slate-500">Aucun article dans cette location.</td></tr>}</tbody>
                  <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-[#263852]"><tr><td colSpan={7} className="p-2.5 text-right">Sous-total location HT</td><td colSpan={3} className="p-2.5 text-right text-base">{money(totalRental)}</td></tr></tfoot>
                </table>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3"><div className="locasyst-summary-card"><span>Montant HT</span><strong>{money(quote.totalHT)}</strong></div><div className="locasyst-summary-card"><span>TVA</span><strong>{money(quote.totalTTC - quote.totalHT)}</strong></div><div className="locasyst-summary-card locasyst-summary-total"><span>Total TTC</span><strong>{money(quote.totalTTC)}</strong></div></div>
            </>
          ) : <div className="rounded-lg border border-slate-300 bg-white p-8"><h3 className="text-base font-extrabold text-[#253752]">{tabs.find((item) => item.id === tab)?.label}</h3><p className="mt-2 text-sm text-slate-500">Cette vue reprend les informations du dossier et sera enrichie avec les données de cet onglet.</p>{tab === "info" && <div className="mt-5 grid gap-3 md:grid-cols-2"><div><b>Lieu de livraison</b><p>{quote.shippingAddress || quote.eventLocation || "Non renseigné"}</p></div><div><b>Chargé d’affaires</b><p>{quote.projectManager || quote.accountManager || "Non renseigné"}</p></div></div>}{tab === "notes" && <p className="mt-5 whitespace-pre-wrap">{quote.notes || quote.incompleteReturnNotes || "Aucune observation enregistrée."}</p>}</div>}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-300 bg-white px-4 py-3"><div className="flex items-center gap-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><CalendarDays size={14} /> Dernière mise à jour : {date(quote.updatedAt || quote.date)}</span><span className="hidden md:inline">·</span><span>{quote.driverOrCarrier || "Transport à confirmer"}</span></div><div className="flex gap-2"><button onClick={() => onPrint(quote, "bon_livraison")} className="locasyst-secondary-button"><Truck size={15} /> Bon de livraison</button>{!returned && <button onClick={() => onQuickReturn(quote)} className="locasyst-primary-button"><Check size={15} /> Retour conforme</button>}<button onClick={onClose} className="locasyst-secondary-button">Fermer <ChevronDown size={14} className="rotate-90" /></button></div></footer>
      </div>
    </div>
  );
};
