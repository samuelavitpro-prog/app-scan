import React, { useState } from "react";
import {
  Camera,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Sparkles,
  Package,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Calendar,
  User,
  MapPin,
  Clock,
  RefreshCw,
  Tag,
  Check,
  Smartphone,
  ChevronRight,
  Layers,
} from "lucide-react";
import { InventoryItem, RentalMovement, MobileScanTab, AIAnalysisResult } from "../types";
import { CameraCapture } from "./CameraCapture";
import { AIProductModal } from "./AIProductModal";
import { playScanSuccessSound, playAlertSound } from "../utils/audio";

interface MobileScannerProps {
  items: InventoryItem[];
  rentals: RentalMovement[];
  onAddNewItem: (item: Partial<InventoryItem>) => Promise<boolean>;
  onRentalCheckout: (checkoutData: any) => Promise<boolean>;
  onRentalCheckin: (checkinData: any) => Promise<boolean>;
  isSyncing: boolean;
  onRefresh: () => void;
}

export const MobileScanner: React.FC<MobileScannerProps> = ({
  items,
  rentals,
  onAddNewItem,
  onRentalCheckout,
  onRentalCheckin,
  isSyncing,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<MobileScanTab>("ai-capture");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{ photo: string; data: AIAnalysisResult } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Rental Departure Form State
  const [selectedDepartureItem, setSelectedDepartureItem] = useState<InventoryItem | null>(null);
  const [departureQty, setDepartureQty] = useState<number>(1);
  const [clientName, setClientName] = useState<string>("");
  const [clientContact, setClientContact] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [departureNotes, setDepartureNotes] = useState<string>("");
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState<boolean>(false);

  // Rental Return Form State
  const [selectedReturnRental, setSelectedReturnRental] = useState<RentalMovement | null>(null);
  const [returnCondition, setReturnCondition] = useState<string>("Parfait état");
  const [returnNotes, setReturnNotes] = useState<string>("");
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState<boolean>(false);

  // Quick lookup search
  const [lookupSearch, setLookupSearch] = useState<string>("");

  const showNotification = (type: "success" | "error", text: string) => {
    if (type === "success") playScanSuccessSound();
    else playAlertSound();

    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Handle Photo Capture -> AI Vision Analysis
  const handlePhotoCapture = async (base64Photo: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Photo,
          device: "mobile",
          user: "Opérateur Mobile",
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        playScanSuccessSound();
        setAiResult({
          photo: base64Photo,
          data: json.data,
        });
      } else {
        throw new Error(json.error || "Erreur de réponse du serveur");
      }
    } catch (err: any) {
      console.error("AI Analysis failed:", err);
      showNotification("error", "Échec de l'analyse IA : " + (err.message || "Veuillez réessayer"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save product from AI modal
  const handleSaveAIProduct = async (productData: Partial<InventoryItem>) => {
    const success = await onAddNewItem(productData);
    if (success) {
      setAiResult(null);
      showNotification("success", `Produit '${productData.name}' ajouté et synchronisé avec le stock.`);
    } else {
      showNotification("error", "Erreur lors de l'enregistrement du produit.");
    }
  };

  // Submit Departure / Check-out
  const handleDepartureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartureItem) {
      showNotification("error", "Veuillez sélectionner un matériel.");
      return;
    }
    if (!clientName.trim()) {
      showNotification("error", "Veuillez renseigner le nom du client ou chantier.");
      return;
    }

    setIsSubmittingCheckout(true);
    try {
      const ok = await onRentalCheckout({
        itemId: selectedDepartureItem.id,
        sku: selectedDepartureItem.sku,
        quantity: departureQty,
        clientName,
        clientContact,
        destination,
        expectedReturnDate: new Date(expectedReturnDate).toISOString(),
        notes: departureNotes,
        device: "mobile",
        user: "Opérateur Mobile",
      });

      if (ok) {
        showNotification(
          "success",
          `Départ validé : ${departureQty}x ${selectedDepartureItem.name} pour ${clientName}.`
        );
        setSelectedDepartureItem(null);
        setDepartureQty(1);
        setClientName("");
        setClientContact("");
        setDestination("");
        setDepartureNotes("");
      } else {
        showNotification("error", "Erreur lors du départ de location.");
      }
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  // Submit Return / Check-in
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnRental) {
      showNotification("error", "Veuillez sélectionner une location à retourner.");
      return;
    }

    setIsSubmittingCheckin(true);
    try {
      const ok = await onRentalCheckin({
        rentalId: selectedReturnRental.id,
        returnCondition,
        returnNotes,
        device: "mobile",
        user: "Opérateur Mobile",
      });

      if (ok) {
        showNotification(
          "success",
          `Retour validé : ${selectedReturnRental.itemName} réintégré au stock disponible.`
        );
        setSelectedReturnRental(null);
        setReturnNotes("");
      } else {
        showNotification("error", "Erreur lors de la clôture du retour.");
      }
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  const activeRentals = rentals.filter((r) => r.status === "active" || r.status === "overdue");

  return (
    <div id="mobile-scanner-view" className="w-full max-w-md mx-auto flex flex-col pb-12">
      {/* Mobile Top Bar */}
      <div className="bg-[#0e111d] text-white p-4 rounded-2xl shadow-xl mb-4 flex items-center justify-between border border-[#1e233b]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white">Scanner Logistique Mobile</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-400">Sync Direct & Reconnaissance IA</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className={`p-2 rounded-xl bg-[#161b2e] border border-[#1e233b] text-slate-300 hover:text-white transition ${
            isSyncing ? "animate-spin text-indigo-400" : ""
          }`}
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Real-time Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`mb-4 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-all animate-bounce ${
            feedbackMessage.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Main Tab Navigation for Mobile */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0e111d] border border-[#1e233b] rounded-xl mb-4 text-xs font-semibold">
        <button
          id="tab-ai-capture"
          type="button"
          onClick={() => setActiveTab("ai-capture")}
          className={`py-2.5 px-2 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === "ai-capture"
              ? "bg-[#161b2e] text-indigo-400 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" />
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <span>Scan IA Inventaire</span>
        </button>

        <button
          id="tab-rental-out"
          type="button"
          onClick={() => setActiveTab("rental-out")}
          className={`py-2.5 px-2 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === "rental-out"
              ? "bg-[#161b2e] text-amber-400 border border-amber-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Scan Départ</span>
        </button>

        <button
          id="tab-rental-in"
          type="button"
          onClick={() => setActiveTab("rental-in")}
          className={`py-2.5 px-2 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === "rental-in"
              ? "bg-[#161b2e] text-emerald-400 border border-emerald-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            {activeRentals.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">
                {activeRentals.length}
              </span>
            )}
          </div>
          <span>Scan Retour</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AI PHOTO SCAN & INSTANT INVENTORY ENRICHMENT */}
      {/* ========================================================= */}
      {activeTab === "ai-capture" && (
        <div className="space-y-4">
          <div className="bg-[#0e111d] p-4 rounded-2xl border border-[#1e233b] shadow-xl">
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-slate-100">
                  Ajout Rapide par Photo IA
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Prenez en photo le matériel. Gemini extrait le nom, modèle, caractéristiques et vous demande la quantité.
              </p>
            </div>

            <CameraCapture
              onCapture={handlePhotoCapture}
              isAnalyzing={isAnalyzing}
            />

            {isAnalyzing && (
              <div className="mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/60 text-center animate-pulse">
                <div className="flex items-center justify-center gap-2 text-indigo-300 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                  Gemini analyse l'image en direct...
                </div>
                <p className="text-xs text-indigo-300/70 mt-1">
                  Détection du modèle, de la catégorie et lecture des étiquettes
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-[#0e111d] border border-[#1e233b] shadow-sm">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Références en base
              </span>
              <span className="text-base font-bold text-slate-100">
                {items.length} produits
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0e111d] border border-[#1e233b] shadow-sm">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Pièces Disponibles
              </span>
              <span className="text-base font-bold text-emerald-400">
                {items.reduce((acc, i) => acc + i.availableQuantity, 0)} unités
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: RENTAL DEPARTURE SCAN (SCAN DÉPART LOCATION) */}
      {/* ========================================================= */}
      {activeTab === "rental-out" && (
        <div className="bg-[#0e111d] p-4 rounded-2xl border border-[#1e233b] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e233b]">
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
                Scan Sortie / Départ Location
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Affectation du matériel à un client ou chantier
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Départ
            </span>
          </div>

          <form onSubmit={handleDepartureSubmit} className="space-y-3.5">
            {/* Step 1: Select Item to Rent Out */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                1. Sélectionner le matériel à expédier *
              </label>

              {selectedDepartureItem ? (
                <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={selectedDepartureItem.imageUrl || "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=100"}
                      alt={selectedDepartureItem.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-[#1e233b]"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-100 truncate">
                        {selectedDepartureItem.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        SKU: <span className="font-mono text-amber-400">{selectedDepartureItem.sku}</span> | Dispo: <span className="font-bold text-emerald-400">{selectedDepartureItem.availableQuantity}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDepartureItem(null)}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline px-2 py-1"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher par nom, SKU ou code-barres..."
                      value={lookupSearch}
                      onChange={(e) => setLookupSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  {/* List of Available Items */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {items
                      .filter((i) =>
                        i.availableQuantity > 0 &&
                        (i.name.toLowerCase().includes(lookupSearch.toLowerCase()) ||
                          i.sku.toLowerCase().includes(lookupSearch.toLowerCase()) ||
                          i.category.toLowerCase().includes(lookupSearch.toLowerCase()))
                      )
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedDepartureItem(item);
                            setDepartureQty(1);
                          }}
                          className="w-full p-2 rounded-xl border border-[#1e233b] bg-[#161b2e]/60 hover:border-amber-500/50 hover:bg-[#161b2e] text-left flex items-center justify-between transition text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={item.imageUrl || "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=80"}
                              alt={item.name}
                              className="w-8 h-8 rounded object-cover flex-shrink-0 border border-[#1e233b]"
                            />
                            <div className="truncate">
                              <p className="font-semibold text-slate-200 truncate">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {item.brand} • SKU {item.sku}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                            {item.availableQuantity} dispo
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {selectedDepartureItem && (
              <>
                {/* Step 2: Quantity to rent */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      2. Quantité à sortir :
                    </label>
                    <span className="text-[11px] text-slate-400">
                      (Max: {selectedDepartureItem.availableQuantity})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDepartureQty((prev) => Math.max(1, prev - 1))}
                      className="w-9 h-9 rounded-lg border border-[#1e233b] bg-[#161b2e] text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-[#202742]"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedDepartureItem.availableQuantity}
                      value={departureQty}
                      onChange={(e) =>
                        setDepartureQty(
                          Math.min(
                            selectedDepartureItem.availableQuantity,
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        )
                      }
                      className="w-20 text-center py-1.5 font-bold text-sm rounded-lg border border-[#1e233b] bg-[#161b2e] text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDepartureQty((prev) =>
                          Math.min(selectedDepartureItem.availableQuantity, prev + 1)
                        )
                      }
                      className="w-9 h-9 rounded-lg border border-[#1e233b] bg-[#161b2e] text-slate-200 font-bold text-sm flex items-center justify-center hover:bg-[#202742]"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Step 3: Client & Destination */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Client / Projet / Chantier *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Ex: Agence Lumina / Chantier Tour Horizon"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#1e233b] bg-[#161b2e] text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Contact Client
                      </label>
                      <input
                        type="text"
                        placeholder="Tél / Email"
                        value={clientContact}
                        onChange={(e) => setClientContact(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#1e233b] bg-[#161b2e] text-slate-200 placeholder-slate-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Date de retour prévue *
                      </label>
                      <input
                        type="date"
                        required
                        value={expectedReturnDate}
                        onChange={(e) => setExpectedReturnDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#1e233b] bg-[#161b2e] text-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Lieu d'utilisation
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Paris 11ème, Stand Vivatech..."
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#1e233b] bg-[#161b2e] text-slate-200 placeholder-slate-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Notes & Accessoires inclus
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 2 batteries, chargeur, valise étanche"
                      value={departureNotes}
                      onChange={(e) => setDepartureNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#1e233b] bg-[#161b2e] text-slate-200 placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>

                {/* Submit Departure Button */}
                <button
                  type="submit"
                  disabled={isSubmittingCheckout}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  {isSubmittingCheckout ? "Validation du départ..." : "Valider le Départ & Actualiser le Stock"}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: RENTAL RETURN SCAN (SCAN RETOUR LOCATION) */}
      {/* ========================================================= */}
      {activeTab === "rental-in" && (
        <div className="bg-[#0e111d] p-4 rounded-2xl border border-[#1e233b] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e233b]">
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                Scan Entrée / Retour de Location
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Contrôle de l'état et réintégration immédiate en stock
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Retour
            </span>
          </div>

          <form onSubmit={handleReturnSubmit} className="space-y-3.5">
            {/* Step 1: Select Active Rental to Return */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                1. Sélectionner le dossier de location à clôturer *
              </label>

              {selectedReturnRental ? (
                <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs text-slate-100">
                        {selectedReturnRental.itemName}
                      </p>
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[10px] font-bold">
                        x{selectedReturnRental.quantity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Loué par : <span className="font-semibold text-slate-200">{selectedReturnRental.clientName}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Retour prévu : {new Date(selectedReturnRental.expectedReturnDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReturnRental(null)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline px-2 py-1"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeRentals.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#161b2e] border border-[#1e233b] text-center text-xs text-slate-400">
                      Aucun matériel actuellement en cours de location.
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                      {activeRentals.map((rental) => {
                        const isOverdue = rental.status === "overdue";
                        return (
                          <button
                            key={rental.id}
                            type="button"
                            onClick={() => setSelectedReturnRental(rental)}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition text-xs ${
                              isOverdue
                                ? "border-rose-500/40 bg-rose-500/5"
                                : "border-[#1e233b] bg-[#161b2e]/60 hover:border-emerald-500/40 hover:bg-[#161b2e]"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-200 truncate">
                                  {rental.itemName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-[#222944] text-slate-300 text-[10px] font-bold">
                                  x{rental.quantity}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">
                                Client : {rental.clientName}
                              </p>
                              <p className={`text-[10px] font-medium ${isOverdue ? "text-rose-400 font-bold" : "text-slate-400"}`}>
                                {isOverdue ? "⚠️ En retard (prévu " : "Prévu le : "}
                                {new Date(rental.expectedReturnDate).toLocaleDateString("fr-FR")}
                                {isOverdue && ")"}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedReturnRental && (
              <>
                {/* Step 2: Return Condition Inspection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    2. État du matériel retourné *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Parfait état", "Bon état", "Avarie / Révision"].map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setReturnCondition(cond)}
                        className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border transition ${
                          returnCondition === cond
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                            : "bg-[#161b2e] border-[#1e233b] text-slate-300 hover:bg-[#202742]"
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3: Notes on Return */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Observations de retour & contrôle accessoires
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Nettoyé, câbles complets, testé OK en sortie de valise"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-200 placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Submit Return Button */}
                <button
                  type="submit"
                  disabled={isSubmittingCheckin}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSubmittingCheckin ? "Clôture en cours..." : "Valider le Retour & Réintégrer au Stock"}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* AI Modal when a photo has been analyzed */}
      {aiResult && (
        <AIProductModal
          photoBase64={aiResult.photo}
          aiData={aiResult.data}
          onSave={handleSaveAIProduct}
          onCancel={() => setAiResult(null)}
        />
      )}
    </div>
  );
};
