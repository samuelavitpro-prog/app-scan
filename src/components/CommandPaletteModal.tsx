import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Package,
  Building2,
  Users,
  FileText,
  ScanLine,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  Settings,
  Sparkles,
  ChevronRight,
  X,
  ExternalLink,
  Archive,
  Wrench,
  Radio,
} from "lucide-react";
import { InventoryItem, StudioSpace, TechnicianProfile, ClientQuote, MainAppNavTab } from "../types";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: InventoryItem[];
  studios?: StudioSpace[];
  technicians?: TechnicianProfile[];
  quotes?: ClientQuote[];
  onNavigateTab: (tab: MainAppNavTab) => void;
  onOpenItemDetail: (item: InventoryItem) => void;
  onOpenInvoiceScanner: () => void;
  onOpenManualAdd: () => void;
  onOpenDeparture: () => void;
  onExportCsv: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  items = [],
  studios = [],
  technicians = [],
  quotes = [],
  onNavigateTab,
  onOpenItemDetail,
  onOpenInvoiceScanner,
  onOpenManualAdd,
  onOpenDeparture,
  onExportCsv,
}) => {
  const safeItems = items || [];
  const safeStudios = studios || [];
  const safeTechnicians = technicians || [];
  const safeQuotes = quotes || [];
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keydown handler for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Filter items
  const matchedItems = cleanQuery
    ? safeItems.filter(
        (i) =>
          i.name.toLowerCase().includes(cleanQuery) ||
          i.brand?.toLowerCase().includes(cleanQuery) ||
          i.category?.toLowerCase().includes(cleanQuery) ||
          i.sku?.toLowerCase().includes(cleanQuery) ||
          i.serialNumber?.toLowerCase().includes(cleanQuery)
      ).slice(0, 5)
    : [];

  // Filter studios
  const matchedStudios = cleanQuery
    ? safeStudios.filter(
        (s) =>
          s.name.toLowerCase().includes(cleanQuery) ||
          s.type?.toLowerCase().includes(cleanQuery) ||
          s.description?.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  // Filter technicians
  const matchedTechnicians = cleanQuery
    ? safeTechnicians.filter(
        (t) =>
          t.name.toLowerCase().includes(cleanQuery) ||
          t.primaryRole?.toLowerCase().includes(cleanQuery) ||
          t.email?.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  // Filter quotes
  const matchedQuotes = cleanQuery
    ? safeQuotes.filter(
        (q) =>
          q.quoteNumber.toLowerCase().includes(cleanQuery) ||
          q.clientName.toLowerCase().includes(cleanQuery) ||
          q.projectName?.toLowerCase().includes(cleanQuery)
      ).slice(0, 3)
    : [];

  // Actions
  const quickActions = [
    {
      id: "scan-invoice",
      label: "Scanner une facture / devis avec IA (Gemini)",
      icon: ScanLine,
      color: "text-indigo-400 bg-indigo-950/60",
      action: () => {
        onClose();
        onOpenInvoiceScanner();
      },
    },
    {
      id: "new-quote",
      label: "Créer un nouveau Devis / Facturation",
      icon: FileText,
      color: "text-amber-400 bg-amber-950/60",
      action: () => {
        onClose();
        onNavigateTab("quotes");
      },
    },
    {
      id: "new-item",
      label: "Ajouter un nouveau matériel au parc",
      icon: Plus,
      color: "text-emerald-400 bg-emerald-950/60",
      action: () => {
        onClose();
        onOpenManualAdd();
      },
    },
    {
      id: "departure-movement",
      label: "Enregistrer un bon de sortie / départ location",
      icon: ArrowUpRight,
      color: "text-purple-400 bg-purple-950/60",
      action: () => {
        onClose();
        onOpenDeparture();
      },
    },
    {
      id: "view-studios",
      label: "Consulter la disponibilité des studios & espaces",
      icon: Building2,
      color: "text-cyan-400 bg-cyan-950/60",
      action: () => {
        onClose();
        onNavigateTab("studios");
      },
    },
    {
      id: "flightcases",
      label: "Gérer les Malles & Flight Cases (Master QR / RFID)",
      icon: Archive,
      color: "text-amber-400 bg-amber-950/60",
      action: () => {
        onClose();
        onNavigateTab("flightcases");
      },
    },
    {
      id: "sav-maintenance",
      label: "Atelier SAV, Maintenance & Déclaration de Casse",
      icon: Wrench,
      color: "text-rose-400 bg-rose-950/60",
      action: () => {
        onClose();
        onNavigateTab("maintenance");
      },
    },
    {
      id: "export-csv",
      label: "Exporter l'inventaire en format Excel / CSV",
      icon: FileSpreadsheet,
      color: "text-emerald-400 bg-emerald-950/60",
      action: () => {
        onClose();
        onExportCsv();
      },
    },
  ].filter(
    (a) => !cleanQuery || a.label.toLowerCase().includes(cleanQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-[#0e111d] border border-[#232945] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1e243d] bg-[#121626]">
          <Search className="w-5 h-5 text-indigo-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher matériel, studio, technicien, devis ou action rapide..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="ml-2 text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-[#1b2038] border border-[#2a3152]">
            ESC pour fermer
          </span>
        </div>

        {/* Results scrollable container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Matériel / Parc */}
          {matchedItems.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-400" /> Matériel & Stock ({matchedItems.length})
              </p>
              <div className="space-y-1">
                {matchedItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onClose();
                      onOpenItemDetail(item);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#181e35] text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#14192b] border border-[#232a48] flex items-center justify-center text-slate-300">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.brand} • {item.category} • {item.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.availableQuantity > 0 ? "bg-emerald-950 text-emerald-300" : "bg-rose-950 text-rose-300"
                      }`}>
                        {item.availableQuantity}/{item.totalQuantity} dispo
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Studios & Espaces */}
          {matchedStudios.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Studios & Plateaux ({matchedStudios.length})
              </p>
              <div className="space-y-1">
                {matchedStudios.map((studio) => (
                  <button
                    key={studio.id}
                    onClick={() => {
                      onClose();
                      onNavigateTab("studios");
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#181e35] text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                          {studio.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {studio.type} • Capacité {studio.capacity} pers. • {studio.hourlyRate}€/h
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-indigo-300 font-medium group-hover:underline">
                      Ouvrir studio
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Techniciens & Personnel */}
          {matchedTechnicians.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Techniciens & Crew ({matchedTechnicians.length})
              </p>
              <div className="space-y-1">
                {matchedTechnicians.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => {
                      onClose();
                      onNavigateTab("technicians");
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#181e35] text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                        {tech.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                          {tech.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {tech.specialty} • {tech.dailyRate}€ HT/jour • {tech.phone}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-medium group-hover:underline">
                      Voir profil
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Devis & Facturation */}
          {matchedQuotes.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" /> Devis & Factures ({matchedQuotes.length})
              </p>
              <div className="space-y-1">
                {matchedQuotes.map((quote) => (
                  <button
                    key={quote.id}
                    onClick={() => {
                      onClose();
                      onNavigateTab("quotes");
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#181e35] text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                          {quote.quoteNumber} — {quote.clientName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {quote.eventName} • {quote.totalTTC.toLocaleString("fr-FR")} € TTC • {quote.status}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-300 font-medium group-hover:underline">
                      Ouvrir devis
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions Rapides */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Actions Rapides
            </p>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#181e35] text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 ${action.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition">
                        {action.label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#0a0c16] border-t border-[#1e243d] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-[#171c30] rounded border border-[#2b3354] text-slate-300 font-mono text-[10px]">
                ↑↓
              </kbd>{" "}
              Naviguer
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-[#171c30] rounded border border-[#2b3354] text-slate-300 font-mono text-[10px]">
                ESC
              </kbd>{" "}
              Fermer
            </span>
          </div>
          <span className="text-indigo-400 font-medium">KROMA Command Center</span>
        </div>
      </div>
    </div>
  );
};
