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
} from "lucide-react";
import { InventoryItem, RentalMovement } from "../types";

interface ItemDetailModalProps {
  item: InventoryItem;
  rentals: RentalMovement[];
  onClose: () => void;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  rentals,
  onClose,
  onUpdateItem,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [editingStock, setEditingStock] = useState<boolean>(false);
  const [newTotalQty, setNewTotalQty] = useState<number>(item.totalQuantity);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    // Generate QR Code containing product SKU and quick identification payload
    const qrPayload = JSON.stringify({
      app: "ScanLogix",
      sku: item.sku,
      id: item.id,
      name: item.name,
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

  const itemRentals = rentals.filter((r) => r.itemId === item.id);

  const handleStockUpdate = async () => {
    setIsSaving(true);
    try {
      await onUpdateItem(item.id, {
        totalQuantity: newTotalQty,
        availableQuantity: Math.max(0, newTotalQty - (item.rentedQuantity || 0)),
      });
      setEditingStock(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintSticker = () => {
    window.print();
  };

  return (
    <div id="item-detail-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0e111d] border border-[#1e233b] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0a0c16] border-b border-[#1e233b] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{item.name}</h3>
                <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-mono font-semibold border border-indigo-500/30">
                  {item.sku}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {item.category} • {item.brand} {item.model ? `(${item.model})` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#161b2e] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-200">
          {/* Main Info Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Image & Description */}
            <div className="space-y-3">
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#1e233b] shadow-sm bg-[#161b2e]">
                <img
                  src={item.imageUrl || "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {item.aiConfidence && (
                  <div className="absolute bottom-2 left-2 bg-[#0a0c16]/90 backdrop-blur-md text-amber-300 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-500/30">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Analyse IA {Math.round(item.aiConfidence * 100)}%
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description technique
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#161b2e] p-3 rounded-xl border border-[#1e233b]">
                  {item.description || "Aucune description fournie."}
                </p>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Stock Status, Rates & Printable QR Label */}
            <div className="space-y-4">
              {/* Stock Status Box */}
              <div className="p-4 rounded-2xl bg-[#161b2e] border border-[#1e233b] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Niveau de Stock en Rayon :
                  </span>
                  {!editingStock ? (
                    <button
                      type="button"
                      onClick={() => setEditingStock(true)}
                      className="text-xs text-indigo-400 hover:underline font-medium"
                    >
                      Ajuster
                    </button>
                  ) : null}
                </div>

                {!editingStock ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-[#0e111d] border border-[#1e233b]">
                      <span className="text-[10px] text-slate-400 block">Total</span>
                      <span className="text-base font-bold text-slate-100">
                        {item.totalQuantity}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#0e111d] border border-[#1e233b]">
                      <span className="text-[10px] text-emerald-400 font-semibold block">Dispo</span>
                      <span className="text-base font-bold text-emerald-400">
                        {item.availableQuantity}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#0e111d] border border-[#1e233b]">
                      <span className="text-[10px] text-amber-400 font-semibold block">Loué</span>
                      <span className="text-base font-bold text-amber-400">
                        {item.rentedQuantity || 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={item.rentedQuantity || 0}
                      value={newTotalQty}
                      onChange={(e) => setNewTotalQty(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm rounded-xl border border-indigo-500/50 bg-[#0e111d] text-white font-bold outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleStockUpdate}
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      {isSaving ? "..." : "Valider"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingStock(false)}
                      className="px-2 py-1.5 rounded-xl border border-[#1e233b] text-xs text-slate-400 hover:text-slate-200"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#1e233b]">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Emplacement</span>
                    <span className="font-semibold text-slate-200">{item.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Tarif Location</span>
                    <span className="font-semibold text-emerald-400">{item.rentalRatePerDay} € / jour</span>
                  </div>
                </div>
              </div>

              {/* Printable QR Code Sticker Box */}
              <div className="p-4 rounded-2xl bg-[#161b2e] border-2 border-dashed border-[#1e233b] flex flex-col items-center text-center">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-indigo-400" />
                    Étiquette QR Scan Logistique
                  </span>
                  <button
                    type="button"
                    onClick={handlePrintSticker}
                    className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-[#0e111d] rounded-lg flex items-center gap-1 text-[11px] font-semibold transition"
                    title="Imprimer l'étiquette pour la valise/matériel"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimer
                  </button>
                </div>

                {qrCodeDataUrl ? (
                  <div className="bg-white p-2 rounded-xl border border-[#1e233b] shadow-md">
                    <img
                      src={qrCodeDataUrl}
                      alt={`QR Code ${item.sku}`}
                      className="w-28 h-28 object-contain"
                    />
                    <span className="font-mono text-[10px] font-bold text-slate-900 block mt-1">
                      {item.sku}
                    </span>
                  </div>
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center text-slate-400 text-xs">
                    Génération QR...
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                  Collez cette étiquette sur le matériel pour un scan départ/retour instantané avec le mobile.
                </p>
              </div>
            </div>
          </div>

          {/* Rental History for this Item */}
          <div className="pt-3 border-t border-[#1e233b]">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Historique des Mouvements & Locations ({itemRentals.length})
            </h4>

            {itemRentals.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Aucun mouvement de location enregistré pour ce matériel.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {itemRentals.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-xl bg-[#161b2e] border border-[#1e233b] text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          r.status === "returned"
                            ? "bg-emerald-400"
                            : r.status === "overdue"
                            ? "bg-rose-400"
                            : "bg-amber-400"
                        }`}
                      />
                      <div>
                        <span className="font-bold text-slate-200">
                          {r.clientName} (x{r.quantity})
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          Du {new Date(r.departureDate).toLocaleDateString("fr-FR")} au{" "}
                          {new Date(r.expectedReturnDate).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        r.status === "returned"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : r.status === "overdue"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {r.status === "returned" ? "Retourné" : r.status === "overdue" ? "En Retard" : "En cours"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a0c16] border-t border-[#1e233b] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-[#161b2e] border border-[#1e233b] text-slate-200 hover:text-white hover:bg-[#202742] text-xs font-semibold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
