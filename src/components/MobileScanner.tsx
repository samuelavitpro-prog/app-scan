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
  PenTool,
  FileCheck,
  Truck,
  UserCheck,
  ShieldCheck,
  Printer,
  FileText,
  Eye,
  Tv,
} from "lucide-react";
import {
  InventoryItem,
  RentalMovement,
  MobileScanTab,
  AIAnalysisResult,
  ClientQuote,
  AppSettings,
  DocumentSignature,
  DocumentPrintType,
  NetworkDisplayScreen,
  DisplayPlaylist,
  UserAccount,
} from "../types";
import { CameraCapture } from "./CameraCapture";
import { AIProductModal } from "./AIProductModal";
import { SignaturePadModal, SignatureTargetType } from "./SignaturePadModal";
import { DocumentPrintModal } from "./DocumentPrintModal";
import { TvPairingModal } from "./TvPairingModal";
import { playScanSuccessSound, playAlertSound } from "../utils/audio";

interface MobileScannerProps {
  items?: InventoryItem[];
  rentals?: RentalMovement[];
  quotes?: ClientQuote[];
  displays?: NetworkDisplayScreen[];
  playlists?: DisplayPlaylist[];
  currentUser?: UserAccount | null;
  settings?: AppSettings;
  onAddNewItem: (item: Partial<InventoryItem>) => Promise<boolean>;
  onRentalCheckout: (checkoutData: any) => Promise<boolean>;
  onRentalCheckin: (checkinData: any) => Promise<boolean>;
  onUpdateQuote?: (id: string, updates: Partial<ClientQuote>) => Promise<boolean>;
  isSyncing: boolean;
  onRefresh: () => void;
}

export const MobileScanner: React.FC<MobileScannerProps> = ({
  items = [],
  rentals = [],
  quotes = [],
  displays = [],
  playlists = [],
  currentUser = null,
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
  onAddNewItem,
  onRentalCheckout,
  onRentalCheckin,
  onUpdateQuote,
  isSyncing,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<MobileScanTab>("ai-capture");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{ photo: string; data: AIAnalysisResult } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // TV Pairing State
  const [isTvPairingModalOpen, setIsTvPairingModalOpen] = useState(false);
  const [pairingPreselectedScreenId, setPairingPreselectedScreenId] = useState<string | undefined>();

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

  // Mobile Signatures Tab State
  const [signatureSearchQuery, setSignatureSearchQuery] = useState("");
  const [signatureModalData, setSignatureModalData] = useState<{
    quote: ClientQuote;
    target: SignatureTargetType;
  } | null>(null);
  const [mobilePrintModalData, setMobilePrintModalData] = useState<{
    quote: ClientQuote;
    type: DocumentPrintType;
  } | null>(null);

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
        showNotification("error", "Échec de l'analyse IA. Réessayez avec plus de lumière.");
      }
    } catch (err) {
      console.error(err);
      showNotification("error", "Erreur réseau lors de l'analyse.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle AI Product Save
  const handleSaveAIProduct = async (productData: Partial<InventoryItem>) => {
    const ok = await onAddNewItem(productData);
    setAiResult(null);
    if (ok) {
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

  // Save Signature from mobile pad
  const handleSaveSignature = async (
    quoteId: string,
    signature: DocumentSignature,
    target: SignatureTargetType
  ) => {
    if (!onUpdateQuote) return;
    const updates: Partial<ClientQuote> = {};
    if (target === "client_departure") {
      updates.departureSignature = signature;
    } else if (target === "operator_departure") {
      updates.operatorDepartureSignature = signature;
    } else if (target === "client_return") {
      updates.returnSignature = signature;
    } else if (target === "operator_return") {
      updates.operatorReturnSignature = signature;
    }

    const ok = await onUpdateQuote(quoteId, updates);
    if (ok) {
      showNotification("success", "Signature enregistrée avec succès.");
      onRefresh();
    }
  };

  const safeRentals = rentals || [];
  const safeQuotes = quotes || [];
  const safeItems = items || [];

  const activeRentals = safeRentals.filter((r) => r.status === "active" || r.status === "overdue");

  // Rental Quotes Filter for Mobile Signatures
  const rentalQuotes = safeQuotes.filter(
    (q) =>
      q.status === "accepted" ||
      q.status === "invoiced" ||
      q.status === "paid" ||
      q.rentalStatus !== undefined
  );

  const filteredRentalQuotes = rentalQuotes.filter((q) => {
    const qStr = `${q.quoteNumber} ${q.clientName} ${q.clientCompany || ""}`.toLowerCase();
    return qStr.includes(signatureSearchQuery.toLowerCase());
  });

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
            <p className="text-[11px] text-slate-400">Émargements, Scan & Sync Direct</p>
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
      <div className="grid grid-cols-5 gap-1 p-1 bg-[#0e111d] border border-[#1e233b] rounded-xl mb-4 text-xs font-semibold">
        <button
          id="tab-ai-capture"
          type="button"
          onClick={() => setActiveTab("ai-capture")}
          className={`py-2 px-0.5 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === "ai-capture"
              ? "bg-[#161b2e] text-indigo-400 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-0.5">
            <Camera className="w-3.5 h-3.5" />
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <span className="text-[9px]">Photo IA</span>
        </button>

        <button
          id="tab-rental-out"
          type="button"
          onClick={() => setActiveTab("rental-out")}
          className={`py-2 px-0.5 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === "rental-out"
              ? "bg-[#161b2e] text-amber-400 border border-amber-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span className="text-[9px]">Sortie</span>
        </button>

        <button
          id="tab-rental-in"
          type="button"
          onClick={() => setActiveTab("rental-in")}
          className={`py-2 px-0.5 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === "rental-in"
              ? "bg-[#161b2e] text-emerald-400 border border-emerald-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            {activeRentals.length > 0 && (
              <span className="w-3 h-3 rounded-full bg-emerald-500 text-white text-[7px] flex items-center justify-center font-bold">
                {activeRentals.length}
              </span>
            )}
          </div>
          <span className="text-[9px]">Retour</span>
        </button>

        <button
          id="tab-dossiers-signatures"
          type="button"
          onClick={() => setActiveTab("dossiers-signatures")}
          className={`py-2 px-0.5 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === "dossiers-signatures"
              ? "bg-indigo-950 text-indigo-300 border border-indigo-500/40 shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-0.5">
            <PenTool className="w-3.5 h-3.5 text-indigo-400" />
            {rentalQuotes.length > 0 && (
              <span className="w-3 h-3 rounded-full bg-indigo-600 text-white text-[7px] flex items-center justify-center font-bold">
                {rentalQuotes.length}
              </span>
            )}
          </div>
          <span className="text-[9px]">✍️ Signer</span>
        </button>

        <button
          id="tab-tv-pairing"
          type="button"
          onClick={() => {
            setActiveTab("tv-pairing");
            setIsTvPairingModalOpen(true);
          }}
          className={`py-2 px-0.5 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === "tv-pairing"
              ? "bg-purple-950 text-purple-300 border border-purple-500/40 shadow-sm font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="flex items-center gap-0.5">
            <Tv className="w-3.5 h-3.5 text-purple-400" />
            <QrCode className="w-2.5 h-2.5 text-pink-400" />
          </div>
          <span className="text-[9px]">📺 TV Scan</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AI PHOTO SCAN & INSTANT INVENTORY ENRICHMENT       */}
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
              isProcessing={isAnalyzing}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: RENTAL DEPARTURE (SORTIE COMPTOIR RAPIDE)          */}
      {/* ========================================================= */}
      {activeTab === "rental-out" && (
        <div className="bg-[#0e111d] p-4 rounded-2xl border border-[#1e233b] shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Départ Matériel Direct</h3>
              <p className="text-xs text-slate-400">Sortie express de matériel au comptoir</p>
            </div>
          </div>

          <form onSubmit={handleDepartureSubmit} className="space-y-3">
            {/* Step 1: Select Item */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Matériel à sortir du stock
              </label>
              <select
                value={selectedDepartureItem ? selectedDepartureItem.id : ""}
                onChange={(e) => {
                  const it = items.find((i) => i.id === e.target.value);
                  setSelectedDepartureItem(it || null);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-200 outline-none"
              >
                <option value="">-- Choisir un matériel --</option>
                {items
                  .filter((i) => i.quantityAvailable > 0)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.quantityAvailable} dispo - SKU: {item.sku})
                    </option>
                  ))}
              </select>
            </div>

            {selectedDepartureItem && (
              <>
                {/* Step 2: Quantity */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Quantité sortie (Max : {selectedDepartureItem.quantityAvailable})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedDepartureItem.quantityAvailable}
                    value={departureQty}
                    onChange={(e) => setDepartureQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-200 outline-none"
                  />
                </div>

                {/* Step 3: Client & Destination */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Client ou Chantier <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nom du client / Production"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-200 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Téléphone / Contact
                    </label>
                    <input
                      type="text"
                      placeholder="06..."
                      value={clientContact}
                      onChange={(e) => setClientContact(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Retour prévu
                    </label>
                    <input
                      type="date"
                      value={expectedReturnDate}
                      onChange={(e) => setExpectedReturnDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Lieu de tournage / Destination
                  </label>
                  <input
                    type="text"
                    placeholder="Plateau, Ville, Salle..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-200 outline-none"
                  />
                </div>

                {/* Submit Departure Button */}
                <button
                  type="submit"
                  disabled={isSubmittingCheckout}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSubmittingCheckout ? "Validation..." : "Valider le Bon de Sortie Direct"}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: RENTAL RETURN (RETOUR DIRECT SCANNER)              */}
      {/* ========================================================= */}
      {activeTab === "rental-in" && (
        <div className="bg-[#0e111d] p-4 rounded-2xl border border-[#1e233b] shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Retour Direct de Matériel</h3>
              <p className="text-xs text-slate-400">Contrôle et réintégration directe au stock</p>
            </div>
          </div>

          <form onSubmit={handleReturnSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sélectionner la sortie en cours ({activeRentals.length} en cours)
              </label>
              <select
                value={selectedReturnRental ? selectedReturnRental.id : ""}
                onChange={(e) => {
                  const r = rentals.find((rent) => rent.id === e.target.value);
                  setSelectedReturnRental(r || null);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-200 outline-none"
              >
                <option value="">-- Choisir la location à réintégrer --</option>
                {activeRentals.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.itemName} ({r.quantity}x) - Client: {r.clientName}
                  </option>
                ))}
              </select>
            </div>

            {selectedReturnRental && (
              <>
                <div className="p-3 bg-[#131728] rounded-xl border border-[#1e233b] text-xs space-y-1">
                  <div className="font-bold text-white">{selectedReturnRental.itemName}</div>
                  <div className="text-slate-400">
                    Client : <strong className="text-slate-200">{selectedReturnRental.clientName}</strong>
                  </div>
                  <div className="text-slate-400">
                    Sorti le : {new Date(selectedReturnRental.checkoutDate).toLocaleDateString("fr-FR")}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    État constaté au retour
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Parfait état", "Micro-rayures", "Câble abîmé", "Nettoyage requis"].map((cond) => (
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

      {/* ========================================================= */}
      {/* TAB 4: DOSSIERS & SIGNATURES MOBILE (ÉMARGEMENT TACTILE)   */}
      {/* ========================================================= */}
      {activeTab === "dossiers-signatures" && (
        <div className="space-y-3">
          <div className="bg-[#0e111d] p-4 rounded-2xl border border-[#1e233b] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <PenTool className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Signatures & Bons Mobiles</h3>
                  <p className="text-[11px] text-slate-400">Émargement tactile sur smartphone / tablette</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                {filteredRentalQuotes.length} dossier(s)
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par N° devis, client..."
                value={signatureSearchQuery}
                onChange={(e) => setSignatureSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#14182b] border border-[#232a48] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Dossiers List for Mobile Signatures */}
          <div className="space-y-3">
            {filteredRentalQuotes.length === 0 ? (
              <div className="p-6 text-center bg-[#0e111d] rounded-2xl border border-[#1e233b] text-slate-400 text-xs">
                Aucun dossier de location trouvé.
              </div>
            ) : (
              filteredRentalQuotes.map((quote) => {
                const totalUnits = (quote.rentalItems || []).reduce((s, i) => s + i.quantity, 0);

                return (
                  <div
                    key={quote.id}
                    className="p-3.5 rounded-2xl bg-[#0e111d] border border-[#1e233b] space-y-3 shadow-md"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#1b2238] pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-white">
                            {quote.quoteNumber.replace("DEV", "LOC")}
                          </span>
                          <span className="text-indigo-300 font-bold text-xs">
                            • {quote.clientName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Du {new Date(quote.startDate).toLocaleDateString("fr-FR")} au{" "}
                          {new Date(quote.endDate).toLocaleDateString("fr-FR")} • {totalUnits} unité(s)
                        </div>
                      </div>

                      {/* Print / View Document Button (Prices strictly hidden on BL/BR/Location) */}
                      <button
                        type="button"
                        onClick={() =>
                          setMobilePrintModalData({
                            quote,
                            type:
                              quote.rentalStatus === "returned" || quote.rentalStatus === "incomplete_return"
                                ? "bon_retour"
                                : "bon_location",
                          })
                        }
                        className="p-1.5 rounded-xl bg-[#171c30] hover:bg-[#202742] border border-[#242c4b] text-indigo-300 hover:text-white transition flex items-center gap-1"
                        title="Voir le bon (Sans prix)"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">Bon</span>
                      </button>
                    </div>

                    {/* Signature 1: Departure Signature */}
                    <div className="p-2.5 rounded-xl bg-[#121626] border border-[#1e233b] flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          1. Bon de Sortie / Location
                        </div>
                        {quote.departureSignature ? (
                          <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            Signé ({quote.departureSignature.signerName})
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-400 font-medium">
                            En attente de signature départ
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSignatureModalData({
                            quote,
                            target: "client_departure",
                          })
                        }
                        className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>{quote.departureSignature ? "Modifier" : "✍️ Signer"}</span>
                      </button>
                    </div>

                    {/* Signature 2: Return Signature */}
                    <div className="p-2.5 rounded-xl bg-[#121626] border border-[#1e233b] flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          2. Bon de Restitution / Retour
                        </div>
                        {quote.returnSignature ? (
                          <div className="text-[11px] text-teal-400 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Signé ({quote.returnSignature.signerName})
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-medium">
                            Non émargé (À la restitution)
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSignatureModalData({
                            quote,
                            target: "client_return",
                          })
                        }
                        className="py-1 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>{quote.returnSignature ? "Modifier" : "✍️ Signer"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: SMART TV PAIRING & REMOTE CONTROL                  */}
      {/* ========================================================= */}
      {activeTab === "tv-pairing" && (
        <div className="space-y-4">
          <div className="bg-[#0e111d] p-5 rounded-2xl border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-950 text-purple-300 border border-purple-800">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Appairage Smart TV KROMA</h3>
                  <p className="text-xs text-slate-400">
                    Connectez n'importe quelle TV de votre réseau local à la régie
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ouvrez le navigateur web sur votre téléviseur (ex: <span className="font-mono text-purple-300">192.168.1.140</span> ou l'URL Kiosque),
              puis scannez le QR Code affiché sur la TV pour déverrouiller et lancer la diffusion plein écran.
            </p>

            <button
              type="button"
              onClick={() => setIsTvPairingModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Ouvrir le Scanner QR d'Appairage TV</span>
            </button>
          </div>

          {/* Quick List of Registered Screens */}
          <div className="bg-[#0e111d] p-4 rounded-2xl border border-[#1e233b] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Écrans Réseau Enregistrés ({displays.length})
              </h4>
              <button
                type="button"
                onClick={onRefresh}
                className="text-xs text-indigo-400 hover:underline"
              >
                Actualiser
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {displays.map((disp) => (
                <div
                  key={disp.id}
                  className="p-3 rounded-xl bg-[#121626] border border-[#1e233b] flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{disp.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                        PIN {disp.pinCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {disp.location} • <span className="font-mono">{disp.ipAddress}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPairingPreselectedScreenId(disp.id);
                      setIsTvPairingModalOpen(true);
                    }}
                    className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow transition shrink-0 flex items-center gap-1"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Appairer</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
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

      {/* Signature Pad Modal on Mobile */}
      {signatureModalData && (
        <SignaturePadModal
          quote={signatureModalData.quote}
          defaultTarget={signatureModalData.target}
          onSaveSignature={handleSaveSignature}
          onClose={() => setSignatureModalData(null)}
        />
      )}

      {/* Mobile Print Modal */}
      {mobilePrintModalData && (
        <DocumentPrintModal
          quote={mobilePrintModalData.quote}
          initialType={mobilePrintModalData.type}
          settings={settings}
          items={items}
          onUpdateQuote={onUpdateQuote}
          onClose={() => setMobilePrintModalData(null)}
        />
      )}

      {/* TV Pairing Modal */}
      <TvPairingModal
        isOpen={isTvPairingModalOpen}
        onClose={() => {
          setIsTvPairingModalOpen(false);
          setPairingPreselectedScreenId(undefined);
          onRefresh();
        }}
        currentUser={currentUser}
        displays={displays}
        playlists={playlists}
        preselectedScreenId={pairingPreselectedScreenId}
        onPairingComplete={() => {
          onRefresh();
        }}
      />
    </div>
  );
};
