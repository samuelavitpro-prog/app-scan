import React, { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Check,
  Building2,
  Calendar,
  Euro,
  Layers,
  ArrowRight,
  RefreshCw,
  Camera,
  FileCheck,
  PackageCheck,
  Edit2
} from "lucide-react";
import { InvoiceParseResult, ExtractedInvoiceItem, InventoryItem } from "../types";

interface InvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessImport: (importedItems: InventoryItem[]) => void;
}

export const InvoiceScannerModal: React.FC<InvoiceScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccessImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<InvoiceParseResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [index: number]: boolean }>({});
  const [editableItems, setEditableItems] = useState<ExtractedInvoiceItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);
    setParseResult(null);
    setSuccessCount(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const runAnalysisWithImage = async (base64Data: string, mimeType: string, hint?: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/ai/parse-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
          documentHint: hint,
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        const result: InvoiceParseResult = data.data;
        setParseResult(result);
        const items = result.extractedItems || [];
        setEditableItems(items);
        
        // Select all by default
        const initialSelection: { [index: number]: boolean } = {};
        items.forEach((_, idx) => {
          initialSelection[idx] = true;
        });
        setSelectedItems(initialSelection);
      } else {
        setErrorMessage(data.error || "Impossible d'analyser ce document.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de connexion lors de l'analyse.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    if (!previewUrl) {
      setErrorMessage("Veuillez sélectionner un fichier ou choisir un modèle de démonstration.");
      return;
    }
    const mimeType = file?.type || "image/jpeg";
    runAnalysisWithImage(previewUrl, mimeType);
  };

  // Demo presets for quick testing
  const handleLoadSample = (type: "thomann" | "sony" | "lighting") => {
    let mockImageUrl = "";
    let hint = "facture";
    if (type === "thomann") {
      mockImageUrl = "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80";
      hint = "facture";
    } else if (type === "sony") {
      mockImageUrl = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80";
      hint = "devis";
    } else {
      mockImageUrl = "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80";
      hint = "facture";
    }

    setPreviewUrl(mockImageUrl);
    setFile(null);
    runAnalysisWithImage(mockImageUrl, "image/jpeg", hint);
  };

  const handleItemFieldChange = (index: number, field: keyof ExtractedInvoiceItem, value: any) => {
    setEditableItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const toggleSelectItem = (index: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleSelectAll = () => {
    const allSelected = editableItems.every((_, idx) => selectedItems[idx]);
    const nextState: { [index: number]: boolean } = {};
    editableItems.forEach((_, idx) => {
      nextState[idx] = !allSelected;
    });
    setSelectedItems(nextState);
  };

  const handleImportToInventory = async () => {
    const itemsToImport = editableItems.filter((_, idx) => selectedItems[idx]);
    if (itemsToImport.length === 0) {
      setErrorMessage("Veuillez cocher au moins un article à importer.");
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/inventory/import-invoice-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToImport,
          vendor: parseResult?.vendor || "Facture Numérisée",
          invoiceNumber: parseResult?.invoiceNumber || "FAC-SCAN",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccessCount(data.count);
        onSuccessImport(data.items);
      } else {
        setErrorMessage(data.error || "Erreur lors de l'import des articles.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur réseau lors de l'importation.");
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = editableItems.filter((_, idx) => selectedItems[idx]).length;

  return (
    <div
      id="invoice-scanner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">
                  Scan & OCR Factures / Devis
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  Vision Gemini AI
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Importez automatiquement le matériel acheté depuis vos factures d'achat, devis ou bons de livraison.
              </p>
            </div>
          </div>
          <button
            id="btn-close-invoice-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Success State */}
          {successCount !== null ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-100">
                  {successCount} Article(s) Ajouté(s) au Stock !
                </h3>
                <p className="text-slate-400 text-sm max-w-md">
                  Le matériel extrait du document {parseResult?.invoiceNumber} ({parseResult?.vendor}) a été injecté dans votre inventaire avec codes-barres et tarifs suggérés.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  id="btn-scan-another-invoice"
                  onClick={() => {
                    setParseResult(null);
                    setSuccessCount(null);
                    setPreviewUrl(null);
                    setFile(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors"
                >
                  Scanner une autre facture
                </button>
                <button
                  id="btn-finish-invoice-scan"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-colors"
                >
                  Voir dans l'inventaire
                </button>
              </div>
            </div>
          ) : !parseResult ? (
            /* Upload / Capture Screen */
            <div className="space-y-6">
              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-900/80 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-200">
                      Glissez-déposez votre facture ou devis ici
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Formats supportés : JPEG, PNG, WEBP, PDF (scan photo de document)
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-300">
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    Ou cliquez pour parcourir vos fichiers
                  </div>
                </div>
              </div>

              {/* Preview if loaded */}
              {previewUrl && (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="Document sélectionné"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-700"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {file ? file.name : "Document sélectionné"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Prêt pour la reconnaissance optique IA
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn-trigger-ai-analysis"
                    disabled={isAnalyzing}
                    onClick={handleAnalyze}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Extraction IA en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Lancer l'analyse du document
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Instant Preset Examples */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Ou testez instantanément avec un exemple type :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    id="btn-sample-thomann"
                    onClick={() => handleLoadSample("thomann")}
                    disabled={isAnalyzing}
                    className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-indigo-400">Facture Audio</span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">Thomann Music Pro</p>
                    <p className="text-xs text-slate-400 mt-0.5">2x Shure SM7B + Bras Rode + Câbles</p>
                  </button>

                  <button
                    id="btn-sample-sony"
                    onClick={() => handleLoadSample("sony")}
                    disabled={isAnalyzing}
                    className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-emerald-400">Devis Vidéo 4K</span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">Sony France Pro</p>
                    <p className="text-xs text-slate-400 mt-0.5">Caméras FX3 Cinéma & Optiques</p>
                  </button>

                  <button
                    id="btn-sample-lighting"
                    onClick={() => handleLoadSample("lighting")}
                    disabled={isAnalyzing}
                    className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-amber-400">Facture Éclairage</span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">Astera / ProLight</p>
                    <p className="text-xs text-slate-400 mt-0.5">Tubes LED Titan + Valise de charge</p>
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* Results Review Table */
            <div className="space-y-6">
              {/* Document Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400">Fournisseur</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {parseResult.vendor || "Non spécifié"}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">N° Document</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-200">
                      {parseResult.invoiceNumber || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Date d'émission</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-200">
                      {parseResult.documentDate || new Date().toISOString().split("T")[0]}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Montant Total HT</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Euro className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-400">
                      {parseResult.totalHT ? `${parseResult.totalHT.toLocaleString("fr-FR")} €` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items List Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    id="btn-toggle-select-all-extracted"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-slate-100 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    {selectedCount === editableItems.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                  <span className="text-xs text-slate-400">
                    <strong className="text-indigo-300">{selectedCount}</strong> sur {editableItems.length} article(s) sélectionné(s)
                  </span>
                </div>

                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Edit2 className="w-3 h-3 text-slate-500" />
                  Vous pouvez éditer directement les champs avant l'import
                </span>
              </div>

              {/* Extracted Items Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                      <tr>
                        <th className="p-3 w-10 text-center">Sélec.</th>
                        <th className="p-3 min-w-[200px]">Désignation Matériel</th>
                        <th className="p-3 min-w-[120px]">Catégorie</th>
                        <th className="p-3 w-20 text-center">Qté</th>
                        <th className="p-3 min-w-[90px]">Prix Achat HT</th>
                        <th className="p-3 min-w-[90px]">Tarif Loc./j</th>
                        <th className="p-3 min-w-[130px]">Emplacement Suggéré</th>
                        <th className="p-3 min-w-[110px]">N° Série</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {editableItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-800/30 transition-colors ${
                            selectedItems[idx] ? "bg-indigo-950/10" : "opacity-60"
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedItems[idx])}
                              onChange={() => toggleSelectItem(idx)}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemFieldChange(idx, "name", e.target.value)}
                              className="w-full bg-slate-900/80 border border-slate-700/80 rounded px-2 py-1 text-slate-200 font-medium focus:border-indigo-500 focus:outline-none"
                            />
                            <div className="flex gap-2 mt-1 text-[11px] text-slate-400">
                              <span>Marque: <strong>{item.brand || "N/A"}</strong></span>
                              <span>•</span>
                              <span>SKU: {item.suggestedSKU || "Auto"}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <select
                              value={item.category}
                              onChange={(e) => handleItemFieldChange(idx, "category", e.target.value)}
                              className="w-full bg-slate-900/80 border border-slate-700/80 rounded px-2 py-1 text-slate-200 focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="Audio & Sonorisation">Audio & Sonorisation</option>
                              <option value="Vidéo & Cinéma">Vidéo & Cinéma</option>
                              <option value="Éclairage & Scénographie">Éclairage & Scénographie</option>
                              <option value="Informatique & Régie">Informatique & Régie</option>
                              <option value="Outillage & Travaux">Outillage & Travaux</option>
                              <option value="Câblage & Accessoires">Câblage & Accessoires</option>
                              <option value="Général">Général</option>
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemFieldChange(idx, "quantity", Number(e.target.value))}
                              className="w-14 bg-slate-900/80 border border-slate-700/80 rounded px-1.5 py-1 text-center font-bold text-slate-100 focus:border-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={item.unitPriceHT}
                                onChange={(e) => handleItemFieldChange(idx, "unitPriceHT", Number(e.target.value))}
                                className="w-20 bg-slate-900/80 border border-slate-700/80 rounded px-2 py-1 text-right text-slate-200 focus:border-indigo-500 focus:outline-none pr-5"
                              />
                              <span className="absolute right-1.5 top-1 text-slate-400">€</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                value={item.suggestedRentalRatePerDay}
                                onChange={(e) => handleItemFieldChange(idx, "suggestedRentalRatePerDay", Number(e.target.value))}
                                className="w-20 bg-slate-900/80 border border-slate-700/80 rounded px-2 py-1 text-right text-emerald-400 font-semibold focus:border-indigo-500 focus:outline-none pr-5"
                              />
                              <span className="absolute right-1.5 top-1 text-emerald-500">€</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.suggestedLocation || ""}
                              onChange={(e) => handleItemFieldChange(idx, "suggestedLocation", e.target.value)}
                              className="w-full bg-slate-900/80 border border-slate-700/80 rounded px-2 py-1 text-slate-300 focus:border-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={item.serialNumber || ""}
                              placeholder="S/N optionnel"
                              onChange={(e) => handleItemFieldChange(idx, "serialNumber", e.target.value)}
                              className="w-full bg-slate-900/80 border border-slate-700/80 rounded px-2 py-1 text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {parseResult && successCount === null && (
          <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <button
              id="btn-re-scan-invoice"
              onClick={() => {
                setParseResult(null);
                setFile(null);
                setPreviewUrl(null);
              }}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Recommencer le scan
            </button>
            <div className="flex items-center gap-3">
              <button
                id="btn-cancel-invoice-import"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                id="btn-confirm-import-invoice-items"
                disabled={isImporting || selectedCount === 0}
                onClick={handleImportToInventory}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Injection en stock...
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" />
                    Ajouter {selectedCount} article(s) au catalogue
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
