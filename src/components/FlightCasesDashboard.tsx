import React, { useState } from "react";
import {
  Layers,
  Search,
  Plus,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Package,
  QrCode,
  Radio,
  Sparkles,
  Camera,
  Sun,
  Zap,
  Tag,
  Check,
  X,
  ArrowRight,
  Info,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import {
  FlightCaseMaster,
  FlightCaseCategory,
  FlightCaseContainedItem,
  InventoryItem,
  ClientQuote,
  AppSettings,
} from "../types";

interface FlightCasesDashboardProps {
  flightCases?: FlightCaseMaster[];
  inventory?: InventoryItem[];
  items?: InventoryItem[];
  quotes?: ClientQuote[];
  settings?: AppSettings;
  onCreateFlightCase?: (flightCase: Omit<FlightCaseMaster, "id" | "createdAt" | "updatedAt">) => Promise<boolean> | void;
  onUpdateFlightCase?: (id: string, updates: Partial<FlightCaseMaster>) => Promise<boolean> | void;
  onDeleteFlightCase?: (id: string) => Promise<boolean> | void;
  onUpdateItem?: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>;
  onNavigateToRentals?: () => void;
}

export const FlightCasesDashboard: React.FC<FlightCasesDashboardProps> = ({
  flightCases = [],
  inventory = [],
  items = [],
  quotes = [],
  settings,
  onCreateFlightCase = async (_flightCase: any) => false,
  onUpdateFlightCase = async (_id: string, _updates: any) => false,
  onDeleteFlightCase = async (_id: string) => false,
  onUpdateItem = async (_id: string, _updates: any) => false,
  onNavigateToRentals,
}) => {
  const safeFlightCases = flightCases || [];
  const safeInventory = (inventory && inventory.length > 0) ? inventory : (items || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sealFilter, setSealFilter] = useState<string>("all");

  // Fast Scan Modal / Box
  const [fastScanInput, setFastScanInput] = useState("");
  const [scannedCase, setScannedCase] = useState<FlightCaseMaster | null>(null);
  const [scanFeedbackMessage, setScanFeedbackMessage] = useState<string | null>(null);

  // Create / Edit Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState<FlightCaseCategory>("camera_flightcase");
  const [formBarcode, setFormBarcode] = useState("");
  const [formRfidTag, setFormRfidTag] = useState("");
  const [formLocationRack, setFormLocationRack] = useState("");
  const [formDimensions, setFormDimensions] = useState("60 x 40 x 35 cm");
  const [formTotalWeightKg, setFormTotalWeightKg] = useState(14.5);
  const [formContainedItems, setFormContainedItems] = useState<FlightCaseContainedItem[]>([]);

  // Statistics
  const totalCount = safeFlightCases.length;
  const sealedCount = safeFlightCases.filter((f) => f.sealStatus === "sealed_ready").length;
  const onShootCount = safeFlightCases.filter((f) => f.sealStatus === "on_shoot").length;
  const incompleteCount = safeFlightCases.filter((f) => f.sealStatus === "incomplete").length;

  // Filtered cases
  const filteredCases = safeFlightCases.filter((fc) => {
    if (categoryFilter !== "all" && fc.category !== categoryFilter) return false;
    if (sealFilter !== "all" && fc.sealStatus !== sealFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = fc.name.toLowerCase().includes(q);
      const matchCode = fc.code.toLowerCase().includes(q);
      const matchBarcode = fc.barcode.toLowerCase().includes(q);
      const matchItem = (fc.containedItems || []).some((ci) => ci.itemName.toLowerCase().includes(q));
      if (!matchName && !matchCode && !matchBarcode && !matchItem) return false;
    }
    return true;
  });

  const handleFastScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastScanInput.trim()) return;

    const term = fastScanInput.trim().toUpperCase();
    const found = safeFlightCases.find(
      (f) =>
        f.code.toUpperCase() === term ||
        f.barcode.toUpperCase() === term ||
        (f.rfidTag && f.rfidTag.toUpperCase() === term)
    );

    if (found) {
      setScannedCase(found);
      setScanFeedbackMessage(`✓ Malle "${found.name}" identifiée - ${(found.containedItems || []).length} accessoires scellés validés`);
    } else {
      setScanFeedbackMessage(`❌ Aucune malle trouvée pour le code : "${term}"`);
    }
    setFastScanInput("");
  };

  const handleToggleCheckItem = (caseId: string, itemIdx: number) => {
    const fc = safeFlightCases.find((f) => f.id === caseId);
    if (!fc) return;

    const updatedContained = [...(fc.containedItems || [])];
    if (!updatedContained[itemIdx]) return;
    updatedContained[itemIdx] = {
      ...updatedContained[itemIdx],
      isChecked: !updatedContained[itemIdx].isChecked,
    };

    onUpdateFlightCase(caseId, { containedItems: updatedContained });
    if (scannedCase && scannedCase.id === caseId) {
      setScannedCase({ ...scannedCase, containedItems: updatedContained });
    }
  };

  const handleSealFlightCase = (caseId: string) => {
    const sealNum = `SEAL-${Math.floor(1000 + Math.random() * 9000)}`;
    const updates: Partial<FlightCaseMaster> = {
      sealStatus: "sealed_ready",
      sealSecurityNumber: sealNum,
      sealedBy: "Magasinier Dépôt",
      sealedDate: new Date().toISOString(),
    };
    onUpdateFlightCase(caseId, updates);
    if (scannedCase && scannedCase.id === caseId) {
      setScannedCase({ ...scannedCase, ...updates });
    }
  };

  const handleUnsealFlightCase = (caseId: string) => {
    const updates: Partial<FlightCaseMaster> = {
      sealStatus: "opened_in_prep",
      sealSecurityNumber: undefined,
      sealedDate: undefined,
    };
    onUpdateFlightCase(caseId, updates);
    if (scannedCase && scannedCase.id === caseId) {
      setScannedCase({ ...scannedCase, ...updates });
    }
  };

  const handleOpenCreateModal = () => {
    const nextCode = `FC-${Math.floor(100 + Math.random() * 900)}`;
    setFormName("Malle Caméra & Optiques Valise Peli");
    setFormCode(nextCode);
    setFormCategory("camera_flightcase");
    setFormBarcode(nextCode);
    setFormRfidTag(`RFID-984-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormLocationRack("Allée A - Rack 02");
    setFormDimensions("55 x 35 x 22 cm");
    setFormTotalWeightKg(12.5);

    // Populate initial items if inventory available
    if (inventory.length > 0) {
      setFormContainedItems([
        {
          itemId: inventory[0].id,
          itemName: inventory[0].name,
          itemSku: inventory[0].sku,
          requiredQty: 1,
          serialNumber: inventory[0].serialNumber,
          isChecked: true,
          status: "ok",
        },
      ]);
    } else {
      setFormContainedItems([]);
    }
    setShowCreateModal(true);
  };

  const handleAddContainedItemToForm = (itemId: string) => {
    const inv = inventory.find((i) => i.id === itemId);
    if (!inv) return;
    setFormContainedItems((prev) => [
      ...prev,
      {
        itemId: inv.id,
        itemName: inv.name,
        itemSku: inv.sku,
        requiredQty: 1,
        serialNumber: inv.serialNumber,
        isChecked: true,
        status: "ok",
      },
    ]);
  };

  const handleRemoveContainedItemFromForm = (idx: number) => {
    setFormContainedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveFlightCase = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateFlightCase({
      name: formName,
      code: formCode,
      category: formCategory,
      barcode: formBarcode,
      rfidTag: formRfidTag,
      locationRack: formLocationRack,
      dimensions: formDimensions,
      totalWeightKg: Number(formTotalWeightKg) || 10,
      sealStatus: "sealed_ready",
      sealSecurityNumber: `SEAL-${Math.floor(1000 + Math.random() * 9000)}`,
      sealedBy: "Responsable Dépôt",
      sealedDate: new Date().toISOString(),
      containedItems: formContainedItems,
    });
    setShowCreateModal(false);
  };

  const getCategoryMeta = (cat: FlightCaseCategory) => {
    switch (cat) {
      case "camera_flightcase":
        return { label: "Peli Caméra", color: "border-indigo-500/40 text-indigo-300 bg-indigo-950/60" };
      case "lens_case":
        return { label: "Malle Optiques", color: "border-purple-500/40 text-purple-300 bg-purple-950/60" };
      case "lighting_trunk":
        return { label: "Cantine Éclairage", color: "border-amber-500/40 text-amber-300 bg-amber-950/60" };
      case "grip_bag_trunk":
        return { label: "Fly Machinerie", color: "border-emerald-500/40 text-emerald-300 bg-emerald-950/60" };
      case "cable_trunk":
        return { label: "Malle Câblage", color: "border-cyan-500/40 text-cyan-300 bg-cyan-950/60" };
      case "sound_rack_bag":
        return { label: "Rack Son / HF", color: "border-pink-500/40 text-pink-300 bg-pink-950/60" };
      case "distribution_box":
        return { label: "Armoire Énergie", color: "border-blue-500/40 text-blue-300 bg-blue-950/60" };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header & KPI Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121629] p-6 rounded-3xl border border-[#1f2647] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Gestion des Flight Cases & Packs Scellés (Master QR / RFID)
              </h1>
              <p className="text-xs text-slate-400">
                Gagnez un temps précieux : validez 15 accessoires en 1 seul scan de malle scellée avec plomb de sécurité
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Malle / Flight Case</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#121629] border border-[#1e2544] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Malles Répertoriées
          </span>
          <div className="text-2xl font-black text-white">{totalCount}</div>
          <span className="text-[10px] text-slate-500 block">Kits et packs configurés</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121629] border border-[#1e2544] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Scellées & Prêtes Dépôt
          </span>
          <div className="text-2xl font-black text-emerald-400">{sealedCount}</div>
          <span className="text-[10px] text-slate-500 block">Prêtes au départ immédiat</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121629] border border-[#1e2544] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            En Tournage Plateau
          </span>
          <div className="text-2xl font-black text-amber-400">{onShootCount}</div>
          <span className="text-[10px] text-slate-500 block">Sorties actuellement</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#121629] border border-[#1e2544] space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Incomplètes / Contrôle
          </span>
          <div className="text-2xl font-black text-rose-400">{incompleteCount}</div>
          <span className="text-[10px] text-slate-500 block">Accessoire manquant à vérifier</span>
        </div>
      </div>

      {/* 2. Fast Scan Master QR / RFID Tool */}
      <div className="bg-[#121629] p-4 sm:p-5 rounded-3xl border border-[#1f2647] space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-black text-white">
              Bip Scanner Master QR / RFID Malle
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Valide automatiquement l'intégralité des accessoires contenus
          </span>
        </div>

        <form onSubmit={handleFastScanSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Scanner ou saisir le code Master (Ex: FC-CAM-01, MALLE-APUTURE-600C)..."
              value={fastScanInput}
              onChange={(e) => setFastScanInput(e.target.value)}
              className="w-full bg-[#171c33] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 transition shrink-0"
          >
            <Radio className="w-4 h-4" />
            <span>Biper Malle</span>
          </button>
        </form>

        {scanFeedbackMessage && (
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center justify-between animate-fadeIn">
            <span>{scanFeedbackMessage}</span>
            <button
              onClick={() => setScanFeedbackMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Scanned Case Detail View if active */}
      {scannedCase && (
        <div className="p-5 rounded-3xl bg-[#0f1222] border-2 border-cyan-500/50 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                  {scannedCase.code}
                </span>
                <h3 className="text-base font-black text-white">{scannedCase.name}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Emplacement : {scannedCase.locationRack || "Dépôt Central"} • Poids : {scannedCase.totalWeightKg} kg • {scannedCase.dimensions}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {scannedCase.sealStatus === "sealed_ready" ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Plomb {scannedCase.sealSecurityNumber || "OK"}</span>
                  </span>
                  <button
                    onClick={() => handleUnsealFlightCase(scannedCase.id)}
                    className="p-1.5 rounded-xl bg-[#1e243d] hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    title="Briser le scellé pour inventaire"
                  >
                    <Unlock className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSealFlightCase(scannedCase.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Poser Scellé Sécurité Plomb</span>
                </button>
              )}
            </div>
          </div>

          {/* Checklist of contained items */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Contenu Scellé du Pack ({scannedCase.containedItems.length} références) :
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {scannedCase.containedItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleToggleCheckItem(scannedCase.id, idx)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                    item.isChecked
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                      : "bg-[#171c33] border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold block truncate">{item.itemName}</span>
                    <span className="text-[10px] opacity-70 block font-mono">
                      Qté: {item.requiredQty} {item.serialNumber && `• S/N: ${item.serialNumber}`}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                      item.isChecked
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                        : "border-slate-600 bg-slate-800"
                    }`}
                  >
                    {item.isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Catalog & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#121629] p-3 rounded-2xl border border-[#1f2647]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher malle, contenu, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#171c33] border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#171c33] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-semibold focus:outline-none"
            >
              <option value="all">Toutes Catégories Malles</option>
              <option value="camera_flightcase">Peli Caméra</option>
              <option value="lens_case">Malle Optiques</option>
              <option value="lighting_trunk">Cantine Éclairage</option>
              <option value="grip_bag_trunk">Fly Machinerie</option>
              <option value="cable_trunk">Malle Câblage</option>
              <option value="sound_rack_bag">Rack Son / HF</option>
              <option value="distribution_box">Armoire Énergie</option>
            </select>

            <select
              value={sealFilter}
              onChange={(e) => setSealFilter(e.target.value)}
              className="bg-[#171c33] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-semibold focus:outline-none"
            >
              <option value="all">Tous Scellés</option>
              <option value="sealed_ready">Scellé Intact</option>
              <option value="opened_in_prep">En Préparation</option>
              <option value="on_shoot">En Tournage</option>
              <option value="incomplete">Incomplet</option>
            </select>
          </div>
        </div>

        {/* Flight Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCases.map((fc) => {
            const catMeta = getCategoryMeta(fc.category);
            const isSealed = fc.sealStatus === "sealed_ready";

            return (
              <div
                key={fc.id}
                className="p-4 rounded-2xl bg-[#121629] border border-[#1f2647] hover:border-indigo-500/40 transition shadow-lg space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-black text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                        {fc.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${catMeta.color}`}>
                        {catMeta.label}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                        isSealed
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                          : fc.sealStatus === "on_shoot"
                          ? "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {isSealed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{isSealed ? "Scellé OK" : fc.sealStatus === "on_shoot" ? "Plateau" : "En Prépa"}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white">{fc.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {fc.locationRack || "Dépôt Central"} • {fc.totalWeightKg} kg • {fc.dimensions}
                    </p>
                  </div>

                  {/* Contained Items List */}
                  <div className="p-2.5 rounded-xl bg-[#171c33] border border-[#242c4f] space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Accessoires Scellés ({fc.containedItems.length}) :
                    </span>
                    <div className="space-y-0.5 max-h-24 overflow-y-auto pr-1">
                      {fc.containedItems.map((ci, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300 flex items-center justify-between">
                          <span className="truncate pr-2">• {ci.itemName}</span>
                          <span className="font-mono text-[10px] opacity-70">x{ci.requiredQty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e2544] flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {fc.barcode}
                  </span>

                  <button
                    onClick={() => {
                      setScannedCase(fc);
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
                    className="px-3 py-1 rounded-xl bg-cyan-600/80 hover:bg-cyan-600 text-white font-bold text-xs flex items-center gap-1 transition"
                  >
                    <span>Inspecter Pack</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL CREATE FLIGHT CASE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0f1222] border border-[#232a4a] rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#1e2544] pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">
                  Créer un Nouveau Flight Case / Pack Scellé
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-[#181d36] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFlightCase} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px]">Nom de la Malle :</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2 text-white font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px]">Code Malle :</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2 text-white font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px]">Catégorie :</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as FlightCaseCategory)}
                    className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2 text-white"
                  >
                    <option value="camera_flightcase">Peli Caméra</option>
                    <option value="lens_case">Malle Optiques</option>
                    <option value="lighting_trunk">Cantine Éclairage</option>
                    <option value="grip_bag_trunk">Fly Machinerie</option>
                    <option value="cable_trunk">Malle Câblage</option>
                    <option value="sound_rack_bag">Rack Son / HF</option>
                    <option value="distribution_box">Armoire Énergie</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px]">Emplacement :</label>
                  <input
                    type="text"
                    value={formLocationRack}
                    onChange={(e) => setFormLocationRack(e.target.value)}
                    className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase text-[10px]">Poids Total (kg) :</label>
                  <input
                    type="number"
                    value={formTotalWeightKg}
                    onChange={(e) => setFormTotalWeightKg(Number(e.target.value))}
                    className="w-full bg-[#171c33] border border-slate-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Contained Items Picker */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#171c33] border border-[#242c4f]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 uppercase text-[10px]">
                    Accessoires inclus dans le pack scellé :
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddContainedItemToForm(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="bg-[#1e2544] border border-slate-600 rounded-lg px-2 py-1 text-[11px] text-indigo-300 font-bold"
                  >
                    <option value="">+ Ajouter un matériel du stock...</option>
                    {inventory.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} ({inv.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {formContainedItems.map((ci, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-900 flex items-center justify-between text-xs">
                      <span className="text-white font-bold">{ci.itemName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">Qté: {ci.requiredQty}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveContainedItemFromForm(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer Malle Scellée</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
