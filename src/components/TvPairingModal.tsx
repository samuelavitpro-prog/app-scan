import React, { useState, useEffect } from "react";
import {
  Tv,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Layers,
  Calendar,
  Truck,
  Video,
  Radio,
  Sparkles,
  ShieldCheck,
  X,
  ExternalLink,
  Search,
  Wifi,
  Power,
  Sliders,
  Check
} from "lucide-react";
import { CameraCapture } from "./CameraCapture";
import {
  NetworkDisplayScreen,
  DisplayPlaylist,
  DisplaySourceMode,
  KromaLiveViewKey,
  UserAccount
} from "../types";
import { playScanSuccessSound, playAlertSound } from "../utils/audio";

interface TvPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  displays?: NetworkDisplayScreen[];
  playlists?: DisplayPlaylist[];
  preselectedScreenId?: string;
  onPairingComplete?: (screen: NetworkDisplayScreen) => void;
}

export const TvPairingModal: React.FC<TvPairingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  displays = [],
  playlists = [],
  preselectedScreenId,
  onPairingComplete
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"scan_camera" | "manual_pin" | "quick_select">(
    preselectedScreenId ? "quick_select" : "scan_camera"
  );
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [enteredPin, setEnteredPin] = useState("");
  const [selectedScreen, setSelectedScreen] = useState<NetworkDisplayScreen | null>(null);

  // Configuration options to push to the TV
  const [selectedMode, setSelectedMode] = useState<DisplaySourceMode>("loop_playlist");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [selectedLiveView, setSelectedLiveView] = useState<KromaLiveViewKey>("rentals_dispatch");
  const [enableAutoFailover, setEnableAutoFailover] = useState(true);
  const [failoverTimeout, setFailoverTimeout] = useState(10);
  const [customTicker, setCustomTicker] = useState("");
  const [tickerEnabled, setTickerEnabled] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successScreen, setSuccessScreen] = useState<NetworkDisplayScreen | null>(null);

  // Reset or match preselected screen on open
  useEffect(() => {
    if (!isOpen) {
      setSuccessScreen(null);
      setErrorMsg(null);
      return;
    }

    if (preselectedScreenId) {
      const match = displays.find((d) => d.id === preselectedScreenId);
      if (match) {
        setSelectedScreen(match);
        setSelectedMode(match.primaryMode || "loop_playlist");
        setSelectedPlaylistId(match.assignedPlaylistId || (playlists[0]?.id ?? ""));
        setSelectedLiveView(match.assignedLiveView || "rentals_dispatch");
        setEnableAutoFailover(match.enableAutoFailover ?? true);
        setCustomTicker(match.tickerMessage || "");
        setTickerEnabled(Boolean(match.tickerEnabled));
        setActiveSubTab("quick_select");
      }
    } else if (playlists.length > 0 && !selectedPlaylistId) {
      setSelectedPlaylistId(playlists[0].id);
    }
  }, [isOpen, preselectedScreenId, displays, playlists]);

  if (!isOpen) return null;

  // Handle QR code scanning from smartphone camera
  const handleQrDetected = (scannedText: string) => {
    try {
      // Possible formats:
      // 1. Full URL: https://domain.com/?display=disp-dock-1&pin=4892
      // 2. KROMA-DISPLAY:disp-dock-1:4892
      // 3. Just display ID or PIN
      let foundScreen: NetworkDisplayScreen | undefined;

      if (scannedText.includes("display=") || scannedText.includes("pairDisplay=")) {
        const url = new URL(scannedText, window.location.origin);
        const dispId = url.searchParams.get("display") || url.searchParams.get("pairDisplay");
        const pin = url.searchParams.get("pin");
        foundScreen = displays.find((d) => d.id === dispId || (pin && d.pinCode === pin));
      } else if (scannedText.startsWith("KROMA-TV:")) {
        const parts = scannedText.split(":");
        const id = parts[1];
        foundScreen = displays.find((d) => d.id === id);
      } else {
        // Search by ID or PIN
        foundScreen = displays.find(
          (d) => d.id.toLowerCase() === scannedText.trim().toLowerCase() || d.pinCode === scannedText.trim()
        );
      }

      if (foundScreen) {
        playScanSuccessSound();
        setSelectedScreen(foundScreen);
        setSelectedMode(foundScreen.primaryMode || "loop_playlist");
        setSelectedPlaylistId(foundScreen.assignedPlaylistId || (playlists[0]?.id ?? ""));
        setSelectedLiveView(foundScreen.assignedLiveView || "rentals_dispatch");
        setEnableAutoFailover(foundScreen.enableAutoFailover ?? true);
        setCustomTicker(foundScreen.tickerMessage || "");
        setTickerEnabled(Boolean(foundScreen.tickerEnabled));
        setErrorMsg(null);
      } else {
        playAlertSound();
        setErrorMsg(`QR Code non reconnu (${scannedText.slice(0, 30)}...). Vérifiez qu'il s'agit bien d'un écran KROMA.`);
      }
    } catch (err) {
      // quiet fallback
      const found = displays.find((d) => d.pinCode === scannedText.trim() || d.id === scannedText.trim());
      if (found) {
        setSelectedScreen(found);
      } else {
        setErrorMsg("Code QR invalide ou illisible.");
      }
    }
  };

  // Handle Manual PIN Search
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim()) return;

    const match = displays.find((d) => d.pinCode === enteredPin.trim());
    if (match) {
      playScanSuccessSound();
      setSelectedScreen(match);
      setSelectedMode(match.primaryMode || "loop_playlist");
      setSelectedPlaylistId(match.assignedPlaylistId || (playlists[0]?.id ?? ""));
      setSelectedLiveView(match.assignedLiveView || "rentals_dispatch");
      setEnableAutoFailover(match.enableAutoFailover ?? true);
      setCustomTicker(match.tickerMessage || "");
      setTickerEnabled(Boolean(match.tickerEnabled));
      setErrorMsg(null);
    } else {
      playAlertSound();
      setErrorMsg(`Aucun écran trouvé avec le code PIN "${enteredPin}". Vérifiez le code affiché sur la TV.`);
    }
  };

  // Submit and approve pairing on the backend
  const handleConfirmPairing = async () => {
    if (!selectedScreen) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/displays/pair-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenId: selectedScreen.id,
          pinCode: selectedScreen.pinCode,
          confirmedByUserName: currentUser?.name || "Samuel Avit (Administrateur)",
          assignedPlaylistId: selectedPlaylistId,
          assignedLiveView: selectedLiveView,
          primaryMode: selectedMode,
          enableAutoFailover,
          tickerMessage: customTicker,
          tickerEnabled,
        }),
      });

      const data = await response.json();
      if (data.success && data.display) {
        playScanSuccessSound();
        setSuccessScreen(data.display);
        if (onPairingComplete) {
          onPairingComplete(data.display);
        }
      } else {
        playAlertSound();
        setErrorMsg(data.error || "Impossible de valider l'appairage.");
      }
    } catch (err: any) {
      playAlertSound();
      setErrorMsg(err.message || "Erreur réseau lors de la validation de l'écran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Appairer un Écran Smart TV
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                  Scan & Lancement Direct
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scannez le QR Code de la TV pour la connecter à votre régie
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 3: SUCCESS STATE */}
          {successScreen ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Écran Appairé & Lancé avec Succès !</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                  La Smart TV <strong className="text-indigo-300">{successScreen.name}</strong> a reçu la confirmation.
                  Le flux a été déverrouillé et s'affiche actuellement en <strong>Plein Écran Kiosque</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2 font-mono text-xs text-slate-300 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Écran :</span>
                  <span className="text-white font-bold">{successScreen.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Adresse IP TV :</span>
                  <span className="text-indigo-400">{successScreen.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contenu Actif :</span>
                  <span className="text-emerald-400">
                    {successScreen.primaryMode === "loop_playlist"
                      ? "Boucle Multimédia"
                      : successScreen.primaryMode === "ip_stream"
                      ? "Direct Flux IP"
                      : "Vue Direct KROMA"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Failover Auto :</span>
                  <span className="text-cyan-400">
                    {successScreen.enableAutoFailover ? "✅ Actif (Anti-Écran Noir)" : "Désactivé"}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition"
                >
                  Terminer & Fermer
                </button>
              </div>
            </div>
          ) : selectedScreen ? (
            /* STEP 2: SCREEN DETECTED -> CONFIGURE & LAUNCH */
            <div className="space-y-5">
              {/* Screen Summary Banner */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-400/30">
                    <Tv className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{selectedScreen.name}</h3>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-900 text-indigo-200 border border-indigo-700">
                        PIN: {selectedScreen.pinCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {selectedScreen.location} • <span className="font-mono text-indigo-300">{selectedScreen.ipAddress}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Signal TV Détecté • En attente de confirmation de régie</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedScreen(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Changer
                </button>
              </div>

              {/* Selection of Broadcast Mode */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  1. Choisir le contenu à diffuser sur cet écran
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option A: Boucle Multimédia */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode("loop_playlist")}
                    className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                      selectedMode === "loop_playlist"
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-xs">Boucle Multimédia</span>
                      </div>
                      {selectedMode === "loop_playlist" && <Check className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Images HD, vidéos MP4, fiches techniques et PDF en boucle automatique.
                    </p>
                  </button>

                  {/* Option B: Direct Flux IP / HDMI */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode("ip_stream")}
                    className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                      selectedMode === "ip_stream"
                        ? "bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/20"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-red-400" />
                        <span className="font-bold text-xs">Direct HDMI / Flux IP</span>
                      </div>
                      {selectedMode === "ip_stream" && <Check className="w-4 h-4 text-red-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Retour caméra / régie en direct (HLS, RTSP, NDI) avec failover.
                    </p>
                  </button>

                  {/* Option C: Planning Tournages */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode("kroma_live_view");
                      setSelectedLiveView("calendar_planning");
                    }}
                    className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                      selectedMode === "kroma_live_view" && selectedLiveView === "calendar_planning"
                        ? "bg-cyan-600/20 border-cyan-500 text-white shadow-lg shadow-cyan-600/20"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-xs">Planning Tournages</span>
                      </div>
                      {selectedMode === "kroma_live_view" && selectedLiveView === "calendar_planning" && (
                        <Check className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Vue direct des studios, réservations et tournages du jour.
                    </p>
                  </button>

                  {/* Option D: Départs & Retours Quai */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode("kroma_live_view");
                      setSelectedLiveView("rentals_dispatch");
                    }}
                    className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                      selectedMode === "kroma_live_view" && selectedLiveView === "rentals_dispatch"
                        ? "bg-amber-600/20 border-amber-500 text-white shadow-lg shadow-amber-600/20"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-xs">Quai Départs/Retours</span>
                      </div>
                      {selectedMode === "kroma_live_view" && selectedLiveView === "rentals_dispatch" && (
                        <Check className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tableau dynamique des mouvements de matériel et chauffeurs.
                    </p>
                  </button>
                </div>
              </div>

              {/* If Playlist Mode: Select Playlist */}
              {selectedMode === "loop_playlist" && (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Sélectionner la boucle multimédia KROMA :
                  </label>
                  <select
                    value={selectedPlaylistId}
                    onChange={(e) => setSelectedPlaylistId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {playlists.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name} ({pl.items.length} éléments • {pl.totalDurationSeconds}s)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* TV Remote HDMI Source Guidance */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40 shrink-0">
                  <Tv className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200">Sources Physiques HDMI</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pour basculer sur une régie, console ou caméra branchée en HDMI, utilisez directement le bouton <strong>"Source / Input"</strong> de la télécommande du téléviseur.
                  </p>
                </div>
              </div>

              {/* Error Display */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Validation Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmPairing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Envoi de l'autorisation à la TV...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Valider & Déverrouiller la TV en Plein Écran</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 1: SCAN QR CODE OR ENTER PIN */
            <div className="space-y-4">
              {/* Mode Switch Tabs */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab("scan_camera");
                    setIsCameraActive(true);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                    activeSubTab === "scan_camera"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scanner QR TV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab("manual_pin");
                    setIsCameraActive(false);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                    activeSubTab === "manual_pin"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Code PIN (4 Chiffres)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab("quick_select");
                    setIsCameraActive(false);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                    activeSubTab === "quick_select"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>Liste des Écrans</span>
                </button>
              </div>

              {/* Tab 1: Live QR Scanner via Smartphone Camera */}
              {activeSubTab === "scan_camera" && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center">
                    <CameraCapture
                      onScanSuccess={handleQrDetected}
                      isActive={isCameraActive}
                    />
                  </div>
                  <p className="text-center text-xs text-slate-400">
                    Pointez votre caméra vers le QR Code affiché sur l'écran du téléviseur.
                  </p>
                </div>
              )}

              {/* Tab 2: Manual 4-digit PIN Entry */}
              {activeSubTab === "manual_pin" && (
                <form onSubmit={handlePinSubmit} className="space-y-4 py-4">
                  <div className="text-center space-y-1">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Saisir le Code PIN affiché sur la TV
                    </label>
                    <p className="text-xs text-slate-400">
                      Code de sécurité à 4 chiffres généré sur l'écran d'attente
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Ex: 4892"
                      value={enteredPin}
                      onChange={(e) => setEnteredPin(e.target.value)}
                      className="w-48 text-center text-2xl font-mono tracking-widest bg-slate-950 border-2 border-indigo-500/50 rounded-2xl py-3 text-white focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
                    >
                      Rechercher l'Écran
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 3: Quick Select from existing screens list */}
              {activeSubTab === "quick_select" && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {displays.map((disp) => (
                    <button
                      key={disp.id}
                      type="button"
                      onClick={() => {
                        setSelectedScreen(disp);
                        setSelectedMode(disp.primaryMode || "loop_playlist");
                        setSelectedPlaylistId(disp.assignedPlaylistId || (playlists[0]?.id ?? ""));
                        setSelectedLiveView(disp.assignedLiveView || "rentals_dispatch");
                        setEnableAutoFailover(disp.enableAutoFailover ?? true);
                        setCustomTicker(disp.tickerMessage || "");
                        setTickerEnabled(Boolean(disp.tickerEnabled));
                      }}
                      className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 text-left transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800">
                          <Tv className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                            {disp.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {disp.location} • <span className="font-mono">{disp.ipAddress}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          PIN {disp.pinCode}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
