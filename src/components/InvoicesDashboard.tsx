import React, { useState } from "react";
import {
  FileText,
  ScanLine,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Euro,
  Printer,
  Download,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Mail,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import { ClientQuote, InventoryItem, AppSettings } from "../types";
import { DocumentPrintModal } from "./DocumentPrintModal";

interface InvoicesDashboardProps {
  quotes: ClientQuote[];
  items: InventoryItem[];
  settings?: AppSettings;
  onUpdateQuote: (id: string, updates: Partial<ClientQuote>) => Promise<boolean>;
  onOpenScanInvoiceModal: () => void;
  onOpenNewQuote: () => void;
}

export const InvoicesDashboard: React.FC<InvoicesDashboardProps> = ({
  quotes,
  items,
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
  onOpenScanInvoiceModal,
  onOpenNewQuote,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [printingInvoice, setPrintingInvoice] = useState<ClientQuote | null>(null);

  // Invoices are quotes that have been invoiced, paid, or accepted
  const safeQuotes = quotes || [];
  const invoices = safeQuotes.filter(
    (q) => q && (q.status === "invoiced" || q.status === "paid" || q.status === "accepted")
  );

  // Financial calculations
  const totalInvoicedHT = invoices.reduce((sum, i) => sum + i.totalHT, 0);
  const totalInvoicedTTC = invoices.reduce((sum, i) => sum + i.totalTTC, 0);
  const totalPaidTTC = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.totalTTC, 0);
  const pendingTTC = totalInvoicedTTC - totalPaidTTC;

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = inv.quoteNumber.toLowerCase().includes(q);
      const matchClient = inv.clientName.toLowerCase().includes(q);
      const matchCompany = inv.clientCompany?.toLowerCase().includes(q);
      if (!matchNum && !matchClient && !matchCompany) return false;
    }
    return true;
  });

  const handleMarkAsPaid = async (inv: ClientQuote) => {
    await onUpdateQuote(inv.id, {
      status: "paid",
    });
  };

  const handlePrintInvoice = (inv: ClientQuote) => {
    window.print();
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0e111d] p-4 rounded-2xl border border-[#1e233b]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              Facturation & Règlements
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              {invoices.length} factures
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Générez des factures clients, suivez les encaissements et importez automatiquement les factures fournisseurs par IA.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenScanInvoiceModal}
            className="py-2 px-3.5 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 text-indigo-200 hover:text-white hover:border-indigo-400 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <ScanLine className="w-4 h-4 text-indigo-400" />
            <span>Scanner Facture Fournisseur IA</span>
          </button>

          <button
            onClick={onOpenNewQuote}
            className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Créer Facture Client</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Facturé TTC
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {totalInvoicedTTC.toLocaleString("fr-FR")} €
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              HT : {totalInvoicedHT.toLocaleString("fr-FR")} €
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#171c2e] flex items-center justify-center text-slate-300">
            <Euro className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Encaissé / Réglé TTC
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {totalPaidTTC.toLocaleString("fr-FR")} €
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">
              {invoices.filter((i) => i.status === "paid").length} factures soldées
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e111d] border border-[#1e233b] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              En Attente de Règlement
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {pendingTTC.toLocaleString("fr-FR")} €
            </div>
            <div className="text-[11px] text-amber-400/80 mt-0.5">
              {invoices.filter((i) => i.status !== "paid").length} factures à relancer
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
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
            placeholder="Rechercher facture par n°, client, société..."
            className="w-full pl-9 pr-4 py-2 bg-[#121626] border border-[#202742] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: "Toutes" },
            { id: "paid", label: "Payées" },
            { id: "invoiced", label: "En attente" },
            { id: "accepted", label: "À émettre" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === f.id
                  ? "bg-amber-600 text-white font-bold"
                  : "bg-[#131728] text-slate-400 hover:text-white border border-[#202742]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center bg-[#0e111d] rounded-2xl border border-[#1e233b]">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">Aucune facture trouvée</div>
            <p className="text-xs text-slate-400 mt-1">
              Les devis validés ou les factures directes apparaissent ici.
            </p>
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-[#0e111d] hover:bg-[#111524] border border-[#1e233b] hover:border-[#2b3354] rounded-2xl p-4 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                  FAC
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">
                      {inv.quoteNumber.replace("DEV", "FAC")}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {inv.clientName}
                    </span>
                    {inv.clientCompany && (
                      <span className="text-[11px] text-slate-400">
                        ({inv.clientCompany})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Émise le {new Date(inv.date).toLocaleDateString("fr-FR")} • Échéance : {new Date(inv.endDate).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>

              {/* Amount & Status Action */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-sm font-black text-white font-mono">
                    {inv.totalTTC.toLocaleString("fr-FR")} € TTC
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ({inv.totalHT.toLocaleString("fr-FR")} € HT)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {inv.status === "paid" ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Payée
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkAsPaid(inv)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marquer Payée</span>
                    </button>
                  )}

                  <button
                    onClick={() => setPrintingInvoice(inv)}
                    className="p-2 rounded-xl bg-[#14182b] hover:bg-[#1a2038] border border-[#242b4a] text-slate-300 hover:text-white transition"
                    title="Imprimer / Télécharger Facture & Bons"
                  >
                    <Printer className="w-4 h-4 text-indigo-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Document Print Modal */}
      {printingInvoice && (
        <DocumentPrintModal
          quote={printingInvoice}
          initialType="facture"
          settings={settings}
          items={items}
          onUpdateQuote={onUpdateQuote}
          onClose={() => setPrintingInvoice(null)}
        />
      )}
    </div>
  );
};
