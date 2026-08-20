import React, { useState } from "react";
import { Sparkles, Check, Package, Tag, Layers, MapPin, Euro, Hash, AlertCircle, FileText, ChevronRight, X } from "lucide-react";
import { AIAnalysisResult, InventoryItem } from "../types";

interface AIProductModalProps {
  photoBase64: string;
  aiData: AIAnalysisResult;
  onSave: (item: Partial<InventoryItem>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const AIProductModal: React.FC<AIProductModalProps> = ({
  photoBase64,
  aiData,
  onSave,
  onCancel,
  isSubmitting = false,
}) => {
  const [name, setName] = useState(aiData.name || "");
  const [brand, setBrand] = useState(aiData.brand || "");
  const [model, setModel] = useState(aiData.model || "");
  const [category, setCategory] = useState(aiData.category || "Général");
  const [sku, setSku] = useState(aiData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [quantity, setQuantity] = useState<number>(aiData.suggestedQuantity || 1);
  const [condition, setCondition] = useState(aiData.condition || "Très bon état");
  const [unitPrice, setUnitPrice] = useState<number>(aiData.unitPrice || 150);
  const [rentalRatePerDay, setRentalRatePerDay] = useState<number>(aiData.rentalRatePerDay || 20);
  const [location, setLocation] = useState(aiData.suggestedLocation || "Entrepôt Principal - Allée A");
  const [description, setDescription] = useState(aiData.description || "");
  const [tagsInput, setTagsInput] = useState((aiData.tags || []).join(", "));
  const [barcode, setBarcode] = useState(aiData.detectedTextOrBarcode || sku);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      name,
      brand,
      model,
      category,
      sku,
      totalQuantity: Number(quantity),
      availableQuantity: Number(quantity),
      condition: condition as any,
      unitPrice: Number(unitPrice),
      rentalRatePerDay: Number(rentalRatePerDay),
      location,
      description,
      barcode,
      tags,
      imageUrl: photoBase64,
      aiConfidence: aiData.confidence || 0.95,
      aiAnalysisNotes: aiData.aiNotes || "Fiche générée par analyse d'image Gemini.",
    });
  };

  const adjustQty = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  return (
    <div id="ai-product-modal-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0e111d] border border-[#1e233b] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header with AI Badge */}
        <div className="bg-[#0a0c16] border-b border-[#1e233b] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Fiche Produit IA</h3>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {Math.round((aiData.confidence || 0.92) * 100)}% de précision
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Vérifiez les données et confirmez la quantité à intégrer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#161b2e] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-200 flex-1">
          {/* Photo & Main Identification Summary */}
          <div className="flex gap-3 items-center p-3 rounded-xl bg-[#161b2e] border border-[#1e233b]">
            <img
              src={photoBase64}
              alt="Scan"
              className="w-16 h-16 rounded-lg object-cover border border-[#1e233b] flex-shrink-0 shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                Reconnaissance Visuelle
              </span>
              <p className="font-semibold text-sm text-slate-100 truncate">
                {name || "Équipement non titré"}
              </p>
              <p className="text-xs text-slate-400">
                Marque : <span className="font-medium text-slate-300">{brand || "Inconnue"}</span> | SKU : <span className="font-mono text-indigo-400">{sku}</span>
              </p>
            </div>
          </div>

          {/* QUANTITY PROMPT - High Priority Callout */}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="product-quantity-input" className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-400" />
                Quantité en stock à intégrer :
              </label>
              <span className="text-[11px] font-medium text-amber-400/80">
                (Demandée obligatoirement)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-amber-500/40 rounded-xl bg-[#161b2e] overflow-hidden shadow-inner flex-1">
                <button
                  type="button"
                  onClick={() => adjustQty(-1)}
                  className="px-4 py-2.5 text-lg font-bold text-amber-400 hover:bg-[#202742] transition active:scale-95"
                >
                  -
                </button>
                <input
                  id="product-quantity-input"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center font-bold text-lg text-white bg-transparent outline-none py-2"
                />
                <button
                  type="button"
                  onClick={() => adjustQty(1)}
                  className="px-4 py-2.5 text-lg font-bold text-amber-400 hover:bg-[#202742] transition active:scale-95"
                >
                  +
                </button>
              </div>

              {/* Quick Quantity Presets */}
              <div className="flex gap-1">
                {[1, 2, 5, 10].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-xl border transition ${
                      quantity === q
                        ? "bg-amber-600 text-white border-amber-500"
                        : "bg-[#161b2e] text-slate-300 border-[#1e233b] hover:bg-[#202742]"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Core Product Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nom du produit *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Catégorie Logistique
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="Audiovisuel">Audiovisuel & Son</option>
                <option value="Outillage & Travaux">Outillage & Travaux</option>
                <option value="Vidéo & Cinéma">Vidéo & Cinéma</option>
                <option value="Informatique & Régie">Informatique & Régie</option>
                <option value="Éclairage & Scénographie">Éclairage & Scénographie</option>
                <option value="Mobilier & Stand">Mobilier & Stand</option>
                <option value="EPI & Sécurité">EPI & Sécurité</option>
                <option value="Général">Général / Divers</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Marque
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Modèle / Référence
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                État matériel
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="Neuf">Neuf</option>
                <option value="Très bon état">Très bon état</option>
                <option value="Bon état">Bon état</option>
                <option value="Usé">Usé (fonctionnel)</option>
                <option value="À réviser">À réviser</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Emplacement de stockage
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Valeur d'achat / Remplacement (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <Euro className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tarif Location Journalier (€ / jour)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={rentalRatePerDay}
                  onChange={(e) => setRentalRatePerDay(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <Euro className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description technique (générée par l'IA)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tags & mots-clés de recherche
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ex: Audio, Chantier, Sans fil..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 border-t border-[#1e233b] flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="py-2.5 px-4 rounded-xl border border-[#1e233b] text-slate-300 hover:bg-[#161b2e] text-sm font-medium transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? "Enregistrement..." : "Enregistrer & Synchroniser en Direct"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
