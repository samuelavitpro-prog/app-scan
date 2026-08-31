import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  X,
  QrCode,
  Printer,
  Sparkles,
  MapPin,
  Tag,
  Euro,
  Package,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  Shield,
  Zap,
  Weight,
  Wrench,
  HelpCircle,
  FileText,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
} from "lucide-react";
import { InventoryItem, RentalMovement, DepotWarehouse } from "../types";

interface ItemDetailModalProps {
  item: InventoryItem;
  rentals?: RentalMovement[];
  depots?: DepotWarehouse[];
  onClose: () => void;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  rentals = [],
  depots = [],
  onClose,
  onUpdateItem,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [editingStock, setEditingStock] = useState<boolean>(false);
  const [newTotalQty, setNewTotalQty] = useState<number>(item.totalQuantity || 1);
  const [newDepotId, setNewDepotId] = useState<string>(item.depotId || "DEP-01");
  const [newSubDesignation, setNewSubDesignation] = useState<string>(item.technicalSubDesignation || "");
  const [newManagementMode, setNewManagementMode] = useState<"serialized" | "bulk_quantity" | "consumable">(
    item.managementMode || "serialized"
  );
  const [newWeightKg, setNewWeightKg] = useState<number>(item.weightKg || 0);
  const [newVolumeM3, setNewVolumeM3] = useState<number>(item.volumeM3 || 0);
  const [newPowerWatts, setNewPowerWatts] = useState<number>(item.powerWatts || 0);
  const [newReplacementValue, setNewReplacementValue] = useState<number>(item.replacementValue || item.unitPrice || 0);
  const [newRentalRate, setNewRentalRate] = useState<number>(item.rentalRatePerDay || 0);
  const [newLocation, setNewLocation] = useState<string>(item.location || "Allée A - Rack 01");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"product-specs" | "pricing-coefficients" | "rentals-history" | "qrcode">("product-specs");

  // Default coefficients if not specified (Standard industry ratios)
  const coeffs = item.rentalCoefficients || {
    day1: 1.0,
    days2: 1.5,
    days3: 2.0,
    weekend: 1.2,
    week: 3.0,
    twoWeeks: 5.0,
    month: 8.0,
  };

  const baseDayRate = item.rentalRatePerDay || Math.round((item.unitPrice || 100) * 0.08) || 20;

  useEffect(() => {
    // Generate QR Code containing product SKU and quick identification payload
    const qrPayload = JSON.stringify({
      app: "KromaOS",
      sku: item.sku,
      id: item.id,
      name: item.name,
      depot: item.depotName || item.depotId,
    });

    QRCode.toDataURL(qrPayload, {
      width: 256,
      margin: 1.5,
      color: {
        dark: "#1e1b4b",
        light: "#ffffff",
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [item]);

  const safeRentals = rentals || [];
  const safeDepots = depots || [];
  const itemRentals = safeRentals.filter((r) => r.itemId === item.id);

  const handleSaveItemChanges = async () => {
    setIsSaving(true);
    try {
      const selectedDepot = safeDepots.find((d) => d.id === newDepotId);
      await onUpdateItem(item.id, {
        totalQuantity: newTotalQty,
        availableQuantity: Math.max(0, newTotalQty - (item.rentedQuantity || 0)),
        depotId: newDepotId,
        depotName: selectedDepot ? selectedDepot.name : item.depotName,
        technicalSubDesignation: newSubDesignation,
        managementMode: newManagementMode,
        weightKg: Number(newWeightKg),
        volumeM3: Number(newVolumeM3),
        powerWatts: Number(newPowerWatts),
        replacementValue: Number(newReplacementValue),
        rentalRatePerDay: Number(newRentalRate),
        location: newLocation,
      });
      setEditingStock(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintSticker = () => {
    window.print();
  };

  const currentDepot = depots.find((d) => d.id === item.depotId) || {
    name: item.depotName || "Dépôt Central Paris-Nord",
    code: "PARIS-NORD",
    city: "Saint-Denis",
  };

  return (
    <div id="item-detail-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0e111e] border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#0a0d18] border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold shadow-md">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{item.name}</h3>
                <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border border-indigo-500/30">
                  {item.sku}
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  Fiche Technique
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{item.category}</span>
                <span>•</span>
                <span>{item.brand} {item.model ? `(${item.model})` : ""}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-indigo-300">
                  <MapPin className="w-3 h-3 text-indigo-400" /> {currentDepot.name}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#090b16] px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("product-specs")}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === "product-specs"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Fiche Produit & Spécifications
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pricing-coefficients")}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === "pricing-coefficients"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Euro className="w-3.5 h-3.5" />
            Grille Tarifaire Dégressive
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rentals-history")}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === "rentals-history"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Historique des Sorties ({itemRentals.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("qrcode")}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === "qrcode"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Étiquette QR Code
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-200">
          {/* 1. PRODUCT SPECIFICATIONS & OVERVIEW */}
          {activeTab === "product-specs" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Visual image */}
                <div className="md:col-span-5 space-y-3">
                  <div className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-[#141829] shadow">
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {item.aiConfidence && (
                      <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-500/40">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Reconnaissance IA {Math.round(item.aiConfidence * 100)}%
                      </div>
                    )}
                  </div>

                  {/* Replacement value / Caution box */}
                  <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/50 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-300 block">
                        Valeur Remplacement / Caution :
                      </span>
                      <span className="text-sm font-bold text-white font-mono">
                        {item.replacementValue || item.unitPrice || 450} € HT
                      </span>
                    </div>
                    <Shield className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>

                {/* Technical properties & Stock stats */}
                <div className="md:col-span-7 space-y-4">
                  {/* Stock and Depot management card */}
                  <div className="p-4 rounded-2xl bg-[#141829] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Warehouse className="w-4 h-4 text-indigo-400" />
                        Gestion du Stock & Dépôt Actuel
                      </span>
                      {!editingStock ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStock(true);
                            setNewTotalQty(item.totalQuantity);
                            setNewDepotId(item.depotId || "DEP-01");
                          }}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                        >
                          Modifier
                        </button>
                      ) : null}
                    </div>

                    {!editingStock ? (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Total Parc</span>
                            <span className="text-lg font-bold text-white font-mono">{item.totalQuantity}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                            <span className="text-[10px] text-emerald-400 block">Disponible</span>
                            <span className="text-lg font-bold text-emerald-300 font-mono">
                              {item.availableQuantity}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40">
                            <span className="text-[10px] text-amber-400 block">En Location</span>
                            <span className="text-lg font-bold text-amber-300 font-mono">
                              {item.rentedQuantity || 0}
                            </span>
                          </div>
                        </div>

                        {/* Locasyst Management Mode & Sub-Designation */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Mode de Gestion</span>
                            <span className="font-semibold text-indigo-300">
                              {item.managementMode === "bulk_quantity"
                                ? "Quantitatif (Lot / Masse)"
                                : item.managementMode === "consumable"
                                ? "Consommable (Vente)"
                                : "Unitaire Sérialisé (N° Série / QR)"}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Emplacement Stock</span>
                            <span className="font-semibold text-slate-200 truncate block">
                              {item.location || "Allée A - Rack 01"}
                            </span>
                          </div>
                        </div>

                        {item.technicalSubDesignation && (
                          <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-xs">
                            <span className="text-[10px] text-indigo-400 font-bold uppercase block">
                              Désignation 2 (Imprimée sur devis) :
                            </span>
                            <span className="text-slate-300 font-mono italic text-[11px] block mt-0.5">
                              {item.technicalSubDesignation}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-900/90 rounded-xl space-y-3 border border-indigo-500/40">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                              Quantité Totale
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={newTotalQty}
                              onChange={(e) => setNewTotalQty(Number(e.target.value))}
                              className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                              Dépôt d'affectation
                            </label>
                            <select
                              value={newDepotId}
                              onChange={(e) => setNewDepotId(e.target.value)}
                              className="w-full bg-[#141829] border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white"
                            >
                              {depots.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                              Mode de Gestion
                            </label>
                            <select
                              value={newManagementMode}
                              onChange={(e) => setNewManagementMode(e.target.value as any)}
                              className="w-full bg-[#141829] border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white"
                            >
                              <option value="serialized">Unitaire Sérialisé (N° de série)</option>
                              <option value="bulk_quantity">Quantitatif (Lot / Masse)</option>
                              <option value="consumable">Consommable (Vente ferme)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                              Emplacement Stockage
                            </label>
                            <input
                              type="text"
                              value={newLocation}
                              onChange={(e) => setNewLocation(e.target.value)}
                              placeholder="ex: Allée B - Rack 04"
                              className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                            Désignation 2 / Spécifications imprimées sur Devis
                          </label>
                          <input
                            type="text"
                            value={newSubDesignation}
                            onChange={(e) => setNewSubDesignation(e.target.value)}
                            placeholder="ex: Dalle 50x50cm / Driver NovaStar A8s / 1500 nits"
                            className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                              P.U. Jour (€ HT)
                            </label>
                            <input
                              type="number"
                              value={newRentalRate}
                              onChange={(e) => setNewRentalRate(Number(e.target.value))}
                              className="w-full bg-[#141829] border border-slate-700 rounded-xl px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                              Poids (kg)
                            </label>
                            <input
                              type="number"
                              value={newWeightKg}
                              onChange={(e) => setNewWeightKg(Number(e.target.value))}
                              className="w-full bg-[#141829] border border-slate-700 rounded-xl px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                              Volume (m³)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={newVolumeM3}
                              onChange={(e) => setNewVolumeM3(Number(e.target.value))}
                              className="w-full bg-[#141829] border border-slate-700 rounded-xl px-2 py-1 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingStock(false)}
                            className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveItemChanges}
                            disabled={isSaving}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isSaving ? "Enregistrement..." : "Valider les Modifications"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Technical specifications KROMA */}
                  <div className="p-4 rounded-2xl bg-[#141829] border border-slate-800 space-y-2.5">
                    <span className="text-xs font-bold text-slate-300 block">
                      Spécifications Techniques & Poids
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                        <Weight className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block">Poids unitaire</span>
                          <span className="font-semibold text-white">
                            {item.weightKg ? `${item.weightKg} kg` : "Non spécifié"}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block">Puissance / Conso.</span>
                          <span className="font-semibold text-white">
                            {item.powerWatts ? `${item.powerWatts} W` : "Sur batterie / Secteur"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {item.technicalNotes && (
                      <p className="text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
                        {item.technicalNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Included Pack Accessories */}
              <div className="p-4 rounded-2xl bg-[#141829] border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-400" />
                  Accessoires Inclus dans le Pack de Location
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(item.includedAccessories && item.includedAccessories.length > 0
                    ? item.includedAccessories
                    : [
                        "Valise de transport rigide type PeliCase",
                        "Câbles d'alimentation et cordons secteur",
                        "Batteries professionnelles de secours",
                        "Manuel d'instructions et notice constructeur",
                      ]
                  ).map((acc, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl bg-indigo-950/50 text-indigo-300 border border-indigo-800/50 text-xs flex items-center gap-1.5 font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      {acc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description Commerciale & Tournage
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#141829] p-3.5 rounded-2xl border border-slate-800">
                  {item.description || "Équipement professionnel certifié KROMA."}
                </p>
              </div>
            </div>
          )}

          {/* 2. PRICING COEFFICIENTS TABLE */}
          {activeTab === "pricing-coefficients" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-300 block">
                    Tarif Journalier de Base (1 Jour) :
                  </span>
                  <span className="text-2xl font-black text-white font-mono mt-0.5 block">
                    {baseDayRate} € HT <span className="text-xs text-slate-400 font-sans">/ jour</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Tarif TTC estimé :</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {Math.round(baseDayRate * 1.2)} € TTC
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#141829]">
                <div className="p-3.5 border-b border-slate-800 bg-[#0c0f1e] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Barème Tarifaire Dégressif Standard
                  </span>
                  <span className="text-[11px] text-slate-400">Coefficients automatiques</span>
                </div>

                <div className="divide-y divide-slate-800 text-xs">
                  <div className="grid grid-cols-3 p-3 items-center hover:bg-white/5 transition font-medium">
                    <span className="text-slate-300 font-semibold">1 Jour de location</span>
                    <span className="font-mono text-slate-400">Coeff. {coeffs.day1}x</span>
                    <span className="font-mono text-white font-bold text-right">
                      {Math.round(baseDayRate * coeffs.day1)} € HT
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 items-center hover:bg-white/5 transition font-medium">
                    <span className="text-slate-300 font-semibold">2 Jours consécutifs</span>
                    <span className="font-mono text-slate-400">Coeff. {coeffs.days2}x</span>
                    <span className="font-mono text-white font-bold text-right">
                      {Math.round(baseDayRate * coeffs.days2)} € HT
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 items-center hover:bg-white/5 transition font-medium">
                    <span className="text-slate-300 font-semibold">3 Jours de tournage</span>
                    <span className="font-mono text-slate-400">Coeff. {coeffs.days3}x</span>
                    <span className="font-mono text-white font-bold text-right">
                      {Math.round(baseDayRate * coeffs.days3)} € HT
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 items-center bg-indigo-950/20 hover:bg-indigo-950/40 transition font-medium">
                    <span className="text-indigo-300 font-semibold">Forfait Week-end (Ven. soir - Lun. matin)</span>
                    <span className="font-mono text-indigo-400">Coeff. {coeffs.weekend}x</span>
                    <span className="font-mono text-indigo-300 font-bold text-right">
                      {Math.round(baseDayRate * coeffs.weekend)} € HT
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 items-center hover:bg-white/5 transition font-medium">
                    <span className="text-slate-300 font-semibold">Semaine Complète (7 jours)</span>
                    <span className="font-mono text-slate-400">Coeff. {coeffs.week}x</span>
                    <span className="font-mono text-white font-bold text-right">
                      {Math.round(baseDayRate * coeffs.week)} € HT
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 items-center hover:bg-white/5 transition font-medium">
                    <span className="text-slate-300 font-semibold">Forfait 2 Semaines (14 jours)</span>
                    <span className="font-mono text-slate-400">Coeff. {coeffs.twoWeeks || 5.0}x</span>
                    <span className="font-mono text-white font-bold text-right">
                      {Math.round(baseDayRate * (coeffs.twoWeeks || 5.0))} € HT
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 items-center bg-purple-950/20 hover:bg-purple-950/40 transition font-medium">
                    <span className="text-purple-300 font-semibold">Forfait Mensuel (30 jours)</span>
                    <span className="font-mono text-purple-400">Coeff. {coeffs.month}x</span>
                    <span className="font-mono text-purple-300 font-bold text-right">
                      {Math.round(baseDayRate * coeffs.month)} € HT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. HISTORIQUE DES SORTIES & RENTALS */}
          {activeTab === "rentals-history" && (
            <div className="space-y-3">
              {itemRentals.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-[#141829] rounded-2xl border border-slate-800">
                  Aucun mouvement de location enregistré pour ce matériel.
                </div>
              ) : (
                itemRentals.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-[#141829] border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{r.clientName}</div>
                      <div className="text-slate-400 mt-0.5">
                        Départ: {new Date(r.departureDate).toLocaleDateString("fr-FR")} • Retour prévu:{" "}
                        {new Date(r.expectedReturnDate).toLocaleDateString("fr-FR")}
                      </div>
                      <div className="text-[11px] text-indigo-400 mt-0.5">
                        Scanné par: {r.scannedBy} ({r.quantity} unité(s))
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                      r.status === "overdue"
                        ? "bg-rose-950 text-rose-300 border-rose-800"
                        : r.status === "returned"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                        : "bg-amber-950 text-amber-300 border-amber-800"
                    }`}>
                      {r.status === "returned" ? "Retourné" : r.status === "overdue" ? "En Retard" : "En Location"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. QR CODE ÉTIQUETTE COMPTOIR */}
          {activeTab === "qrcode" && (
            <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
              <div className="p-4 bg-white rounded-3xl shadow-xl">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt={`QR Code ${item.sku}`} className="w-56 h-56" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                    Génération QR...
                  </div>
                )}
              </div>

              <div>
                <span className="font-mono text-lg font-bold text-white block">{item.sku}</span>
                <span className="text-xs text-slate-400">{item.name} • {currentDepot.name}</span>
              </div>

              <button
                type="button"
                onClick={handlePrintSticker}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer l'étiquette code-barres</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a0d18] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Parc audiovisuel certifié KROMA
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
