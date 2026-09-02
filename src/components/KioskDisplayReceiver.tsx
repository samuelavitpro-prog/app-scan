import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Wifi,
  Network,
  Clock,
  Maximize,
  Minimize,
  AlertTriangle,
  Radio,
  Power,
  RotateCw,
  Layers,
  Video,
  FileText,
  Calendar,
  Truck,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  RefreshCw,
  QrCode,
  Smartphone,
  ShieldCheck,
  Play,
  Sliders,
  Settings,
  Sparkles,
  Cable,
  Check
} from 'lucide-react';
import {
  NetworkDisplayScreen,
  DisplayPlaylist,
  DisplayMediaItem,
  RentalMovement
} from '../types';
import { playScanSuccessSound } from '../utils/audio';

interface KioskDisplayReceiverProps {
  displayId?: string;
  onExitKiosk?: () => void;
}

export const KioskDisplayReceiver: React.FC<KioskDisplayReceiverProps> = ({
  displayId: propDisplayId,
  onExitKiosk
}) => {
  // Determine screen ID from prop or URL query parameter
  const [currentScreenId, setCurrentScreenId] = useState<string>(() => {
    if (propDisplayId) return propDisplayId;
    const params = new URLSearchParams(window.location.search);
    return params.get('display') || params.get('screen') || 'disp-dock-1';
  });

  const [screen, setScreen] = useState<NetworkDisplayScreen | null>(null);
  const [playlist, setPlaylist] = useState<DisplayPlaylist | null>(null);
  const [allDisplays, setAllDisplays] = useState<NetworkDisplayScreen[]>([]);
  const [rentals, setRentals] = useState<RentalMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Pairing State
  const [isPairingMode, setIsPairingMode] = useState(false);
  const [pairedSuccessNotice, setPairedSuccessNotice] = useState<string | null>(null);

  // Active slide index in playlist
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);

  // Auto-failover state engine
  const [isFailoverActive, setIsFailoverActive] = useState(false);
  const [failoverCountdown, setFailoverCountdown] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Direct Web HDMI Capture Support (USB-HDMI Dongle / CamLink)
  const [isHdmiCaptureActive, setIsHdmiCaptureActive] = useState(false);
  const [hdmiStreamError, setHdmiStreamError] = useState<string | null>(null);
  const hdmiVideoRef = useRef<HTMLVideoElement>(null);

  // UI Controls
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Fullscreen Container Ref
  const containerRef = useRef<HTMLDivElement>(null);

  // Live Clock Interval
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Fetch screen & playlist details from server
  const fetchScreenData = async () => {
    try {
      const [screenRes, plRes, dispListRes, rentalsRes] = await Promise.all([
        fetch(`/api/displays/${currentScreenId}`),
        fetch('/api/playlists'),
        fetch('/api/displays'),
        fetch('/api/rentals')
      ]);

      const screenData = await screenRes.json();
      const plData = await plRes.json();
      const dispListData = await dispListRes.json();
      const rentalsData = await rentalsRes.json();

      if (screenData.success && screenData.display) {
        setScreen(screenData.display);
        
        // If not explicitly paired, show pairing screen
        if (screenData.display.isPaired === false) {
          setIsPairingMode(true);
        }

        if (plData.playlists) {
          const matchedPl = plData.playlists.find(
            (p: DisplayPlaylist) => p.id === screenData.display.assignedPlaylistId
          );
          setPlaylist(matchedPl || plData.playlists[0] || null);
        }
      }

      if (dispListData.displays) setAllDisplays(dispListData.displays);
      if (rentalsData.rentals) setRentals(rentalsData.rentals);
    } catch (err) {
      console.error('Error loading kiosk screen data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenData();
    const refreshInterval = setInterval(fetchScreenData, 5000);
    return () => clearInterval(refreshInterval);
  }, [currentScreenId]);

  // Real-Time SSE Listener for pairing and remote commands
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      const handleDisplayEvent = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          
          // If this display was paired via smartphone
          if (parsed.type === 'display_paired' && parsed.data?.displayId === currentScreenId) {
            playScanSuccessSound();
            setScreen(parsed.data.display);
            setIsPairingMode(false);
            setPairedSuccessNotice(`Validé par ${parsed.data.pairedBy || 'Smartphone'} ! Lancement du flux...`);
            
            // Auto request fullscreen on pairing validation
            if (!document.fullscreenElement) {
              containerRef.current?.requestFullscreen().catch(() => {});
            }

            setTimeout(() => setPairedSuccessNotice(null), 5000);
          }

          // If unpaired
          if (parsed.type === 'display_unpaired' && parsed.data?.displayId === currentScreenId) {
            setScreen(parsed.data.display);
            setIsPairingMode(true);
          }

          // If remote command received
          if (parsed.type === 'display_command' && parsed.data?.displayId === currentScreenId) {
            if (parsed.data.display) setScreen(parsed.data.display);
          }
        } catch (e) {
          // ignore parsing error
        }
      };

      // The server uses named SSE events. Listening explicitly is required;
      // EventSource.onmessage only receives unnamed `message` events.
      eventSource.addEventListener('display_paired', handleDisplayEvent);
      eventSource.addEventListener('display_unpaired', handleDisplayEvent);
      eventSource.addEventListener('display_command', handleDisplayEvent);
      eventSource.addEventListener('displays_updated', handleDisplayEvent);
    } catch (e) {
      // SSE fallback handled by polling
    }

    return () => {
      eventSource?.close();
    };
  }, [currentScreenId]);

  // Periodic heartbeat / ping from this TV receiver to the server
  useEffect(() => {
    if (!screen) return;
    const pingInterval = setInterval(async () => {
      try {
        await fetch(`/api/displays/${screen.id}/ping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentActiveSource: isFailoverActive ? 'fallback_loop' : screen.currentActiveSource,
            isStreamSignalDetected: screen.isStreamSignalDetected
          })
        });
      } catch (err) {
        // quiet error
      }
    }, 8000);
    return () => clearInterval(pingInterval);
  }, [screen, isFailoverActive]);

  // Handle Signal Failover Watchdog
  useEffect(() => {
    if (!screen || isPairingMode) return;

    // If screen is configured for IP Stream
    if (screen.primaryMode === 'ip_stream') {
      if (!screen.isStreamSignalDetected && screen.enableAutoFailover) {
        // Start countdown if not already in failover
        if (!isFailoverActive && failoverCountdown === null) {
          setFailoverCountdown(screen.failoverTimeoutSeconds || 10);
        }
      } else if (screen.isStreamSignalDetected) {
        // Signal is good -> Stay or return to stream
        setIsFailoverActive(false);
        setFailoverCountdown(null);
      }
    } else {
      // Primary mode is loop playlist directly
      setIsFailoverActive(true);
      setFailoverCountdown(null);
    }
  }, [screen?.isStreamSignalDetected, screen?.primaryMode, screen?.enableAutoFailover, isFailoverActive, isPairingMode]);

  // Failover Countdown tick
  useEffect(() => {
    if (failoverCountdown === null) return;
    if (failoverCountdown <= 0) {
      setIsFailoverActive(true);
      setFailoverCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setFailoverCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [failoverCountdown]);

  // Direct HDMI USB Capture Initialization (Web API getUserMedia)
  useEffect(() => {
    if (screen?.primaryMode !== 'hdmi_direct' || isPairingMode) {
      if (hdmiVideoRef.current && hdmiVideoRef.current.srcObject) {
        const stream = hdmiVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        hdmiVideoRef.current.srcObject = null;
      }
      setIsHdmiCaptureActive(false);
      return;
    }

    let activeStream: MediaStream | null = null;

    const startHdmiCapture = async () => {
      try {
        setHdmiStreamError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 60 }
          },
          audio: false
        });

        activeStream = stream;
        if (hdmiVideoRef.current) {
          hdmiVideoRef.current.srcObject = stream;
          hdmiVideoRef.current.play().catch(() => {});
        }
        setIsHdmiCaptureActive(true);

        // Listen for track ending (unplugged HDMI capture dongle)
        stream.getVideoTracks()[0].onended = () => {
          setIsHdmiCaptureActive(false);
          if (screen.enableAutoFailover) {
            setIsFailoverActive(true);
          }
        };
      } catch (err: any) {
        console.warn('HDMI Web Capture not available:', err);
        setHdmiStreamError("Carte de capture HDMI non détectée sur ce port USB.");
        if (screen.enableAutoFailover) {
          setIsFailoverActive(true);
        }
      }
    };

    startHdmiCapture();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [screen?.primaryMode, isPairingMode, screen?.enableAutoFailover]);

  // Playlist Slide Rotation Engine
  useEffect(() => {
    if (isPairingMode || !playlist || playlist.items.length === 0) return;

    const currentItem = playlist.items[currentSlideIndex] || playlist.items[0];
    const durationMs = (currentItem.durationSeconds || 10) * 1000;
    const updateFrequencyMs = 100;
    const progressStep = (updateFrequencyMs / durationMs) * 100;

    setSlideProgress(0);

    const progressTimer = setInterval(() => {
      setSlideProgress(prev => {
        if (prev >= 100) {
          setCurrentSlideIndex(slideIdx => (slideIdx + 1) % playlist.items.length);
          return 0;
        }
        return prev + progressStep;
      });
    }, updateFrequencyMs);

    return () => clearInterval(progressTimer);
  }, [playlist, currentSlideIndex, isPairingMode]);

  // Toggle Full Screen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullScreen(false);
    }
  };

  // Keyboard shortcut listener (ESC or 'M' for menu, 'F' for fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        setIsMenuOpen(prev => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullScreen();
      } else if (e.key === 'p' || e.key === 'P') {
        setIsPairingMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading && !screen) {
    return (
      <div className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Connexion au Réseau KROMA OS...</h2>
        <p className="text-sm text-slate-400 font-mono mt-1">Écran : {currentScreenId}</p>
      </div>
    );
  }

  // Pairing QR Code URL
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pairingQrData = `${originUrl}/?pairDisplay=${screen?.id || currentScreenId}&pin=${screen?.pinCode || '1234'}`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    pairingQrData
  )}&bgcolor=0f172a&color=ffffff&margin=10`;

  // =========================================================================
  // VIEW: TV WAITING FOR PAIRING (AFFICHAGE ATTENTE APPAIRAGE SMART TV)
  // =========================================================================
  if (isPairingMode || screen?.isPaired === false) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 bg-[#050711] text-white flex flex-col justify-between p-8 select-none font-sans overflow-hidden"
        onDoubleClick={toggleFullScreen}
      >
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-600/30">
              K
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                KROMA OS <span className="text-indigo-400 font-mono text-sm font-normal">| RÉGIE & SIGNAGE</span>
              </h1>
              <p className="text-xs text-slate-400">Écran Réseau Distant • En attente d'autorisation</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-lg font-black font-mono text-white">
                {currentTime.toLocaleTimeString('fr-FR')}
              </span>
              <span className="text-xs text-slate-400 block -mt-1 font-medium capitalize">
                {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              {screen?.connectionType === 'rj45' ? (
                <Network className="w-4 h-4 text-emerald-400" />
              ) : (
                <Wifi className="w-4 h-4 text-blue-400" />
              )}
              <span>{screen?.ipAddress || '192.168.1.140'}</span>
            </div>
          </div>
        </header>

        {/* Central Pairing Stage */}
        <main className="flex-1 flex items-center justify-center py-6">
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-900/60 p-8 rounded-3xl border border-slate-800/90 shadow-2xl backdrop-blur-xl">
            {/* Left Column: QR Code */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-3xl bg-slate-950 border-2 border-indigo-500/40 shadow-2xl shadow-indigo-600/20 relative group">
                <img
                  src={qrSvgUrl}
                  alt="QR Code d'appairage TV"
                  className="w-56 h-56 rounded-2xl"
                />
                <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 pointer-events-none"></div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-950/80 px-3 py-1.5 rounded-full border border-indigo-800">
                <Smartphone className="w-4 h-4 animate-bounce" />
                <span>Scannez avec un smartphone connecté</span>
              </div>
            </div>

            {/* Right Column: PIN Code & Instructions */}
            <div className="md:col-span-7 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Prêt pour l'Appairage Sécurisé</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {screen?.name || 'Écran Réseau KROMA'}
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  Emplacement : <strong className="text-white">{screen?.location || 'Zone Quai / Régie'}</strong> ({screen?.depotName || 'Dépôt Central'})
                </p>
              </div>

              {/* 4-Digit PIN Banner */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Ou saisissez ce Code PIN sur l'application :
                </span>
                <div className="flex items-center gap-3">
                  {(screen?.pinCode || '4892').split('').map((digit, i) => (
                    <div
                      key={i}
                      className="w-14 h-16 rounded-2xl bg-slate-900 border-2 border-indigo-500/60 text-white font-mono text-3xl font-black flex items-center justify-center shadow-lg shadow-indigo-600/10"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="text-indigo-400 font-bold mb-1">1. Ouvrez KROMA</div>
                  <p className="text-slate-400 text-[11px]">Sur votre smartphone connecté au compte.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="text-indigo-400 font-bold mb-1">2. Scannez le QR</div>
                  <p className="text-slate-400 text-[11px]">Ou entrez le PIN dans l'onglet 'Appairer TV'.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="text-indigo-400 font-bold mb-1">3. Lancement Direct</div>
                  <p className="text-slate-400 text-[11px]">La boucle ou le direct démarre en plein écran.</p>
                </div>
              </div>

              {/* Quick bypass button for testing */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (screen) {
                      await fetch('/api/displays/pair-verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          screenId: screen.id,
                          pinCode: screen.pinCode,
                          confirmedByUserName: 'Régie Locale (Bypass Test)',
                          assignedPlaylistId: screen.assignedPlaylistId,
                          primaryMode: screen.primaryMode,
                          enableAutoFailover: screen.enableAutoFailover,
                        })
                      });
                      setIsPairingMode(false);
                      setScreen({ ...screen, isPaired: true });
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Tester le flux sans smartphone (Simulation)</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Footer */}
        <footer className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4 font-mono">
          <span>KROMA Digital Signage Receiver • v2.6.0-pro</span>
          <span>Double-cliquez n'importe où pour activer / quitter le Plein Écran</span>
        </footer>
      </div>
    );
  }

  // Blackout / Standby Mode
  if (screen?.isBlackout) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 bg-black text-slate-700 flex flex-col items-center justify-center select-none"
        onDoubleClick={toggleFullScreen}
      >
        <Power className="w-12 h-12 text-slate-800 animate-pulse mb-3" />
        <span className="text-xs font-mono uppercase tracking-widest text-slate-700">Mode Veille Éco</span>
        <span className="text-sm font-mono text-slate-800 mt-2">
          {currentTime.toLocaleTimeString('fr-FR')}
        </span>

        {/* Discreet Menu Trigger */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/50 text-slate-600 hover:text-white opacity-20 hover:opacity-100 transition"
        >
          <Tv className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const currentItem: DisplayMediaItem | undefined = playlist?.items[currentSlideIndex];
  const isPlayingStream =
    screen?.primaryMode === 'ip_stream' &&
    screen?.isStreamSignalDetected &&
    !isFailoverActive;
  const isPlayingHdmiDirect =
    screen?.primaryMode === 'hdmi_direct' &&
    isHdmiCaptureActive &&
    !isFailoverActive;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden select-none font-sans"
      onDoubleClick={toggleFullScreen}
    >
      {/* SUCCESS FLASH OVERLAY WHEN JUST PAIRED */}
      {pairedSuccessNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-emerald-950/95 border border-emerald-500 text-white text-sm font-bold shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{pairedSuccessNotice}</span>
        </div>
      )}

      {/* Top Header Bar (Subtle & Professional) */}
      <header className="h-14 px-6 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-20 shrink-0">
        {/* Left: Branding & Depot */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-sm tracking-wider shadow-md shadow-indigo-600/30">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">{screen?.name || 'Écran Réseau'}</span>
              <span className="text-[11px] px-2 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                {screen?.depotName || 'Dépôt Central'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Source Pill & Failover Alert */}
        <div className="flex items-center gap-3">
          {isPlayingHdmiDirect ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/60 text-purple-300 text-xs font-bold uppercase tracking-wider animate-pulse">
              <Cable className="w-3.5 h-3.5 text-purple-400" />
              <span>Direct Entrée HDMI</span>
            </div>
          ) : isPlayingStream ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-300 text-xs font-bold uppercase tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Direct Flux IP</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Boucle Web : {playlist?.name || 'Rotation KROMA'}</span>
            </div>
          )}

          {/* Failover Countdown Toast */}
          {failoverCountdown !== null && failoverCountdown > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/90 border border-amber-600 text-amber-300 text-xs font-bold animate-bounce">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Signal Principal Perdu • Bascule de secours dans {failoverCountdown}s</span>
            </div>
          )}
        </div>

        {/* Right: Clock, Network, Fullscreen */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-base font-black font-mono tracking-wider text-white">
              {currentTime.toLocaleTimeString('fr-FR')}
            </span>
            <span className="text-[11px] text-slate-400 block -mt-1 font-medium capitalize">
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            {screen?.connectionType === 'rj45' ? <Network className="w-3.5 h-3.5 text-emerald-400" /> : <Wifi className="w-3.5 h-3.5 text-blue-400" />}
            <span>{screen?.ipAddress}</span>
          </div>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Options de l'écran"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT CANVAS */}
      <main className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {/* DIRECT HDMI CAPTURE VIEW (USB DONGLE / WEBRTC) */}
        {isPlayingHdmiDirect ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={hdmiVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            {/* OSD Overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <Cable className="w-4 h-4 text-purple-400 animate-pulse" />
              <div>
                <span className="text-xs font-bold block uppercase tracking-wider text-white">SOURCE DIRECTE HDMI (USB)</span>
                <span className="text-[10px] font-mono text-slate-400">
                  Synchro 1080p60 • Zéro Latence Matérielle
                </span>
              </div>
            </div>
          </div>
        ) : isPlayingStream ? (
          /* LIVE IP STREAM VIEW */
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&auto=format&fit=crop&q=80"
              alt="Flux IP Caméra Live"
              className="w-full h-full object-cover"
            />
            {/* OSD Overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <div>
                <span className="text-xs font-bold block uppercase tracking-wider text-white">RÉGIE DIRECTE • QUAI</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {screen?.streamProtocol.toUpperCase()} 1080p60 • Bitrate 12.4 Mbps
                </span>
              </div>
            </div>
          </div>
        ) : currentItem ? (
          /* PLAYLIST WEB LOOP SLIDES */
          <div className="relative w-full h-full flex flex-col justify-between p-8 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950">
            {/* SLIDE TYPE: KROMA LIVE VIEW (Départs/Retours ou Planning) */}
            {currentItem.type === 'kroma_view' && (
              <div className="w-full h-full flex flex-col justify-between max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">{currentItem.title}</h2>
                    <p className="text-sm text-indigo-300">{currentItem.caption || 'Données synchronisées en temps réel'}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" /> KROMA OS Direct
                  </div>
                </div>

                {/* Table of Departures & Returns */}
                <div className="flex-1 bg-slate-900/80 rounded-2xl border border-slate-800 p-4 overflow-hidden flex flex-col justify-between shadow-2xl">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-400 border-b border-slate-800 pb-2">
                      <tr>
                        <th className="py-2.5 px-3">Statut / Type</th>
                        <th className="py-2.5 px-3">Matériel / Kit Audiovisuel</th>
                        <th className="py-2.5 px-3">Client & Projet</th>
                        <th className="py-2.5 px-3">Date Prévue</th>
                        <th className="py-2.5 px-3 text-right">Destination</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {rentals.slice(0, 5).map((rent, idx) => (
                        <tr key={rent.id || idx} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3">
                            {rent.status === 'overdue' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-900/80 text-red-300 border border-red-700 animate-pulse flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" /> RETARD URGENT
                              </span>
                            ) : rent.type === 'out' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-900/60 text-amber-300 border border-amber-700/60 flex items-center gap-1 w-fit">
                                <Truck className="w-3 h-3" /> DÉPART QUAI
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> RETOUR ENREGISTRÉ
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white text-base">{rent.itemName}</div>
                            <div className="text-xs text-slate-400 font-mono">SKU: {rent.itemSku} • Qté: {rent.quantity}</div>
                          </td>
                          <td className="py-3 px-3 text-indigo-300 font-semibold">{rent.clientName}</td>
                          <td className="py-3 px-3 font-mono text-xs text-slate-300">
                            {new Date(rent.expectedReturnDate || rent.departureDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-400">
                            {rent.destination || 'Non spécifié'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: HIGH RESOLUTION IMAGE */}
            {currentItem.type === 'image' && (
              <div className="w-full h-full flex flex-col justify-center items-center relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={currentItem.url}
                  alt={currentItem.title}
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute bottom-6 inset-x-6 bg-slate-950/85 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{currentItem.title}</h3>
                    <p className="text-sm text-slate-300">{currentItem.caption}</p>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-950/80 px-3 py-1.5 rounded-xl border border-indigo-800">
                    KROMA Signage
                  </span>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: VIDEO MP4 */}
            {currentItem.type === 'video' && (
              <div className="w-full h-full flex flex-col justify-center items-center relative rounded-2xl overflow-hidden shadow-2xl">
                <video
                  src={currentItem.url}
                  autoPlay
                  loop
                  muted={isMuted}
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute bottom-6 inset-x-6 bg-slate-950/85 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{currentItem.title}</h3>
                    <p className="text-sm text-slate-300">{currentItem.caption}</p>
                  </div>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: TEXT / ANNOUNCEMENT */}
            {currentItem.type === 'text_slide' && (
              <div
                className="w-full h-full flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/10 shadow-2xl"
                style={{
                  backgroundColor: currentItem.bgColor || '#0f172a',
                  color: currentItem.textColor || '#ffffff'
                }}
              >
                <div className="max-w-3xl space-y-4">
                  <h2 className="text-4xl font-black tracking-tight uppercase">{currentItem.customHeading || currentItem.title}</h2>
                  <p className="text-xl font-medium opacity-90 leading-relaxed">{currentItem.customBody || currentItem.caption}</p>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: PDF DOCUMENT */}
            {currentItem.type === 'pdf' && (
              <div className="w-full h-full flex flex-col justify-between p-8 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-amber-400 flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Document Technique PDF
                    </span>
                    <h2 className="text-2xl font-bold text-white">{currentItem.title}</h2>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Page 1 / {currentItem.pdfPageCount || 3}</span>
                </div>
                <div className="flex-1 bg-slate-950 p-6 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-hidden">
                  <p className="font-bold text-indigo-400 mb-2">// NOTICE TECHNIQUE RÉGIE & SYNOPTIQUE RÉSEAU</p>
                  <p>1. Liaisons Dante configurées sur VLAN 20 (Audio Multicanal 48kHz/24bit).</p>
                  <p>2. Caméras PTZ tourelles routées sur les adresses 192.168.1.101 à 104.</p>
                  <p>3. Enregistrement Master ProRes 422HQ sur serveur NAS baie n°2.</p>
                  <p className="mt-4 text-emerald-400">✓ Toutes les lignes de transmission vérifiées et certifiées opérationnelles.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8">
            <Tv className="w-16 h-16 mx-auto text-slate-600 mb-3" />
            <h3 className="text-xl font-bold">En attente de contenu</h3>
            <p className="text-sm text-slate-400 mt-1">Assignez une boucle de diffusion depuis le tableau de bord KROMA OS.</p>
          </div>
        )}
      </main>

      {/* Ticker / Marquee Banner on Bottom */}
      {screen?.tickerEnabled && screen?.tickerMessage && (
        <footer className="h-11 bg-amber-500 text-slate-950 font-bold px-6 flex items-center gap-3 z-30 shrink-0 shadow-lg overflow-hidden border-t border-amber-400">
          <span className="px-2 py-0.5 rounded bg-black text-amber-400 text-xs font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>FLASH INFO</span>
          </span>
          <div className="overflow-hidden whitespace-nowrap w-full">
            <div className="inline-block animate-marquee text-sm tracking-wide">
              {screen.tickerMessage} ••• {screen.tickerMessage}
            </div>
          </div>
        </footer>
      )}

      {/* Progress Bar of Slide Rotation */}
      {!isPlayingStream && !isPlayingHdmiDirect && playlist && playlist.items.length > 1 && (
        <div className="w-full h-1.5 bg-slate-900 z-30 shrink-0">
          <div
            className="h-full bg-indigo-500 transition-all duration-100 ease-linear"
            style={{ width: `${slideProgress}%` }}
          ></div>
        </div>
      )}

      {/* SLIDE-OUT ESCAPE & SELECTOR MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-lg">Réglages de l'Écran Kiosque</h3>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Changer d'écran assigné :</label>
                <select
                  value={currentScreenId}
                  onChange={e => {
                    setCurrentScreenId(e.target.value);
                    setIsMenuOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white"
                >
                  {allDisplays.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.ipAddress})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-sm font-semibold">Mode Plein Écran TV</span>
                <button
                  onClick={toggleFullScreen}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold transition flex items-center gap-1.5"
                >
                  {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  <span>{isFullScreen ? 'Quitter Plein Écran' : 'Activer Plein Écran'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-start gap-2.5 text-xs text-purple-200">
                <Tv className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Astuce TV :</strong> Pour basculer sur une régie, un décodeur ou une console branchée en HDMI physique, utilisez simplement la touche <strong>Source / Input</strong> de votre télécommande TV.
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsPairingMode(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Afficher l'Écran d'Appairage QR Code</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              {onExitKiosk && (
                <button
                  onClick={onExitKiosk}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Retour au Tableau de Bord
                </button>
              )}
              <button
                onClick={() => setIsMenuOpen(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
