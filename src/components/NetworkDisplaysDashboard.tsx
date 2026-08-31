import React, { useState, useEffect } from 'react';
import {
  Tv,
  MonitorPlay,
  Radio,
  Wifi,
  Network,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Power,
  Sliders,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Video,
  FileText,
  Clock,
  Volume2,
  VolumeX,
  Eye,
  Maximize2,
  ShieldAlert,
  Zap,
  Info,
  Server,
  Key,
  X,
  Share2,
  RotateCw,
  Search,
  ChevronRight,
  SunMedium,
  Check,
  Flame,
  ArrowRightLeft,
  Smartphone,
} from 'lucide-react';
import {
  NetworkDisplayScreen,
  DisplayPlaylist,
  DisplayMediaItem,
  DisplaySourceMode,
  KromaLiveViewKey,
  DisplayMediaType,
  SubscriptionConfig,
  DepotWarehouse
} from '../types';
import { getMaxAllowedScreens } from '../utils/subscriptionPlans';

interface NetworkDisplaysDashboardProps {
  darkMode?: boolean;
  subscription?: SubscriptionConfig;
  depots?: DepotWarehouse[];
  onOpenUpgradeModal?: () => void;
  onLaunchKioskScreen?: (screenId: string) => void;
}

export const NetworkDisplaysDashboard: React.FC<NetworkDisplaysDashboardProps> = ({
  darkMode = false,
  subscription,
  depots = [],
  onOpenUpgradeModal,
  onLaunchKioskScreen
}) => {
  const [activeTab, setActiveTab] = useState<'screens' | 'playlists' | 'failover_config' | 'guide'>('screens');
  const [displays, setDisplays] = useState<NetworkDisplayScreen[]>([]);
  const [playlists, setPlaylists] = useState<DisplayPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepotFilter, setSelectedDepotFilter] = useState<string>('ALL');

  // Modals state
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<NetworkDisplayScreen | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<DisplayPlaylist | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrScreen, setQrScreen] = useState<NetworkDisplayScreen | null>(null);
  const [isTickerModalOpen, setIsTickerModalOpen] = useState(false);
  const [tickerScreen, setTickerScreen] = useState<NetworkDisplayScreen | null>(null);
  const [newTickerText, setNewTickerText] = useState('');
  const [newTickerEnabled, setNewTickerEnabled] = useState(true);

  // New Screen Form State
  const [screenForm, setScreenForm] = useState<Partial<NetworkDisplayScreen>>({
    name: '',
    location: '',
    depotId: depots[0]?.id || 'DEP-01',
    depotName: depots[0]?.name || 'Dépôt Central Paris-Nord',
    ipAddress: '192.168.1.150',
    connectionType: 'rj45',
    primaryMode: 'ip_stream',
    assignedPlaylistId: 'pl-dock-logistics',
    assignedLiveView: 'rentals_dispatch',
    enableAutoFailover: true,
    ipStreamUrl: 'http://192.168.1.50:8080/live/stream.m3u8',
    streamProtocol: 'hls',
    failoverTimeoutSeconds: 10,
    orientation: 'landscape',
    resolution: '1080p Full HD (1920x1080)',
    brightness: 90,
    volume: 0,
    tickerMessage: '',
    tickerEnabled: false
  });

  // Limits
  const maxAllowedScreens = getMaxAllowedScreens(subscription);
  const currentScreenCount = displays.length;
  const isLimitReached = currentScreenCount >= maxAllowedScreens;

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [dispRes, plRes] = await Promise.all([
        fetch('/api/displays'),
        fetch('/api/playlists')
      ]);
      const dispData = await dispRes.json();
      const plData = await plRes.json();

      if (dispData.displays) setDisplays(dispData.displays);
      if (plData.playlists) setPlaylists(plData.playlists);
    } catch (err) {
      console.error('Error fetching displays & playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Remote Commands
  const handleRemoteCommand = async (
    displayId: string,
    command: string,
    payload?: any
  ) => {
    try {
      const res = await fetch(`/api/displays/${displayId}/remote-command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, payload })
      });
      const data = await res.json();
      if (data.success && data.display) {
        setDisplays(prev => prev.map(d => d.id === displayId ? data.display : d));
      }
    } catch (err) {
      console.error('Error sending remote command:', err);
    }
  };

  // Save / Update Screen
  const handleSaveScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenForm.name) return;

    if (!editingScreen && isLimitReached) {
      if (onOpenUpgradeModal) onOpenUpgradeModal();
      return;
    }

    try {
      if (editingScreen) {
        const res = await fetch(`/api/displays/${editingScreen.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(screenForm)
        });
        const data = await res.json();
        if (data.success) {
          setDisplays(prev => prev.map(d => d.id === editingScreen.id ? data.display : d));
        }
      } else {
        const res = await fetch('/api/displays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(screenForm)
        });
        const data = await res.json();
        if (data.success) {
          setDisplays(prev => [...prev, data.display]);
        }
      }
      setIsScreenModalOpen(false);
      setEditingScreen(null);
    } catch (err) {
      console.error('Error saving screen:', err);
    }
  };

  // Delete Screen
  const handleDeleteScreen = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet écran distant ?')) return;
    try {
      const res = await fetch(`/api/displays/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDisplays(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Error deleting screen:', err);
    }
  };

  // Open Edit Screen Modal
  const handleOpenEdit = (disp: NetworkDisplayScreen) => {
    setEditingScreen(disp);
    setScreenForm({ ...disp });
    setIsScreenModalOpen(true);
  };

  // Open New Screen Modal
  const handleOpenNew = () => {
    if (isLimitReached) {
      if (onOpenUpgradeModal) onOpenUpgradeModal();
      return;
    }
    setEditingScreen(null);
    setScreenForm({
      name: `Écran Régie #${displays.length + 1}`,
      location: 'Dépôt / Plateau A',
      depotId: depots[0]?.id || 'DEP-01',
      depotName: depots[0]?.name || 'Dépôt Central Paris-Nord',
      ipAddress: `192.168.1.${140 + displays.length}`,
      connectionType: 'rj45',
      primaryMode: 'ip_stream',
      assignedPlaylistId: playlists[0]?.id || 'pl-dock-logistics',
      assignedLiveView: 'rentals_dispatch',
      enableAutoFailover: true,
      ipStreamUrl: 'http://192.168.1.50:8080/live/feed.m3u8',
      streamProtocol: 'hls',
      failoverTimeoutSeconds: 10,
      orientation: 'landscape',
      resolution: '1080p Full HD (1920x1080)',
      brightness: 90,
      volume: 0,
      tickerMessage: '',
      tickerEnabled: false
    });
    setIsScreenModalOpen(true);
  };

  // Save Ticker
  const handleSaveTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerScreen) return;
    await handleRemoteCommand(tickerScreen.id, 'set_ticker', {
      tickerMessage: newTickerText,
      tickerEnabled: newTickerEnabled
    });
    setIsTickerModalOpen(false);
    setTickerScreen(null);
  };

  // Save Playlist
  const handleSavePlaylist = async (pl: DisplayPlaylist) => {
    try {
      if (editingPlaylist && editingPlaylist.id) {
        const res = await fetch(`/api/playlists/${editingPlaylist.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pl)
        });
        const data = await res.json();
        if (data.success) {
          setPlaylists(prev => prev.map(p => p.id === editingPlaylist.id ? data.playlist : p));
        }
      } else {
        const res = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pl)
        });
        const data = await res.json();
        if (data.success) {
          setPlaylists(prev => [...prev, data.playlist]);
        }
      }
      setIsPlaylistModalOpen(false);
      setEditingPlaylist(null);
    } catch (err) {
      console.error('Error saving playlist:', err);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!window.confirm('Voulez-vous supprimer cette boucle de diffusion ?')) return;
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPlaylists(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Error deleting playlist:', err);
    }
  };

  // Filtered displays
  const filteredDisplays = displays.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ipAddress.includes(searchQuery);
    const matchesDepot = selectedDepotFilter === 'ALL' || d.depotId === selectedDepotFilter;
    return matchesSearch && matchesDepot;
  });

  const onlineCount = displays.filter(d => d.status === 'online').length;
  const ipStreamActiveCount = displays.filter(d => d.currentActiveSource === 'ip_stream' && !d.isBlackout).length;
  const fallbackLoopCount = displays.filter(d => d.currentActiveSource === 'fallback_loop' && !d.isBlackout).length;
  const blackoutCount = displays.filter(d => d.isBlackout).length;

  return (
    <div className={`min-h-full pb-16 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`} id="network-displays-module">
      {/* Top Banner & Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Régie & Écrans Réseau</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Digital Signage & Failover IP
                </span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Pilotage centralisé de vos moniteurs régie, écrans quai et totems d'accueil via RJ45 / Wi-Fi avec bascule anti-écran noir.
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Limits & Actions */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Plan Limit Pill */}
          <div className={`px-3.5 py-1.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <Server className="w-4 h-4 text-indigo-500" />
            <div>
              <span className="font-semibold text-slate-500 dark:text-slate-400">Capacité Plan : </span>
              <span className={`font-bold ${isLimitReached ? 'text-amber-500' : 'text-emerald-500'}`}>
                {currentScreenCount} / {maxAllowedScreens === 999 ? '∞ (Illimité)' : `${maxAllowedScreens} max`}
              </span>
            </div>
            {isLimitReached && maxAllowedScreens < 999 && (
              <button
                onClick={onOpenUpgradeModal}
                className="px-2 py-0.5 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition text-[11px]"
              >
                Passer en Ultimate
              </button>
            )}
          </div>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            id="btn-add-screen"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Écran</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Écrans Connectés</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{onlineCount}</span>
            <span className="text-xs text-slate-400">/ {displays.length} total</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flux IP Direct</span>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{ipStreamActiveCount}</span>
            <span className="text-xs text-slate-400">actifs</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Boucles Secours</span>
            <RotateCw className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{fallbackLoopCount}</span>
            <span className="text-xs text-slate-400">en rotation</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mode Veille</span>
            <Power className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{blackoutCount}</span>
            <span className="text-xs text-slate-400">standby éco</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('screens')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === 'screens'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          id="tab-screens"
        >
          <Tv className="w-4 h-4" />
          <span>Parc d'Écrans en Direct ({displays.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === 'playlists'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          id="tab-playlists"
        >
          <Layers className="w-4 h-4" />
          <span>Constructeur de Boucles & Médias ({playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('failover_config')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === 'failover_config'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          id="tab-failover"
        >
          <Zap className="w-4 h-4" />
          <span>Bascule Automatique (Auto-Failover)</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === 'guide'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          id="tab-guide"
        >
          <QrCode className="w-4 h-4" />
          <span>Guide Réseau & Appairage TV</span>
        </button>
      </div>

      {/* TAB 1: LIVE SCREENS GRID */}
      {activeTab === 'screens' && (
        <div>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, IP, lieu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>

            {depots.length > 1 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500">Dépôt :</span>
                <select
                  value={selectedDepotFilter}
                  onChange={e => setSelectedDepotFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-sm border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="ALL">Tous les Dépôts ({displays.length})</option>
                  {depots.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Grid of Screen Cards */}
          {filteredDisplays.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
              <Tv className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <h3 className="text-lg font-bold">Aucun écran trouvé</h3>
              <p className="text-sm text-slate-500 mb-4">Créez votre premier écran distant pour commencer la diffusion sur votre réseau.</p>
              <button
                onClick={handleOpenNew}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                Ajouter un Écran
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDisplays.map(screen => {
                const assignedPl = playlists.find(p => p.id === screen.assignedPlaylistId);
                return (
                  <div
                    key={screen.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
                      screen.isBlackout
                        ? 'border-purple-500/40 bg-purple-950/10'
                        : darkMode
                        ? 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600 shadow-lg'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                    id={`card-display-${screen.id}`}
                  >
                    {/* Screen Live Mini-Preview Frame */}
                    <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800 group">
                      {screen.isBlackout ? (
                        <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                          <Power className="w-8 h-8 text-purple-400 animate-pulse" />
                          <span className="text-xs font-semibold uppercase tracking-widest text-purple-300">Mode Veille Actif</span>
                        </div>
                      ) : screen.currentActiveSource === 'ip_stream' && screen.isStreamSignalDetected ? (
                        <div className="relative w-full h-full">
                          {/* Simulated Live Stream Feed */}
                          <img
                            src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80"
                            alt="Direct Feed"
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold tracking-wider uppercase animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                            <span>Direct IP</span>
                          </div>
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-slate-300 text-[10px] font-mono">
                            {screen.streamProtocol.toUpperCase()} • 60 FPS
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-4 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-full bg-indigo-600/80 text-white text-[10px] font-bold">
                              Boucle Web Secours
                            </span>
                            <span className="text-[10px] font-mono text-indigo-300">
                              {assignedPl ? assignedPl.name : 'Boucle par défaut'}
                            </span>
                          </div>
                          <div className="text-center my-auto">
                            <h4 className="text-xs font-bold text-white mb-1">
                              {assignedPl?.items[0]?.title || 'Affichage KROMA OS'}
                            </h4>
                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              {assignedPl?.items[0]?.caption || 'Rotation dynamique multi-supports'}
                            </p>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                            <div className="bg-indigo-500 h-1 rounded-full w-2/3 animate-pulse"></div>
                          </div>
                        </div>
                      )}

                      {/* Marquee Preview on bottom of screen */}
                      {screen.tickerEnabled && screen.tickerMessage && !screen.isBlackout && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/85 text-amber-300 text-[11px] font-semibold py-1 px-3 truncate border-t border-amber-500/30 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                          <span className="truncate">{screen.tickerMessage}</span>
                        </div>
                      )}

                      {/* Quick Full Screen Launch Overlay on Hover */}
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                        <button
                          onClick={() => {
                            if (onLaunchKioskScreen) {
                              onLaunchKioskScreen(screen.id);
                            } else {
                              window.open(`/?display=${screen.id}`, '_blank');
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg hover:bg-indigo-500 transition"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Lancer Plein Écran Kiosque</span>
                        </button>
                        <button
                          onClick={() => {
                            setQrScreen(screen);
                            setIsQrModalOpen(true);
                          }}
                          className="p-1.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition"
                          title="QR Code d'appairage TV"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Content & Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Header Title & Status */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-bold text-base line-clamp-1">{screen.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <span>{screen.location}</span>
                              <span>•</span>
                              <span className="text-indigo-500 font-medium">{screen.depotName}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {screen.connectionType === 'rj45' ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 text-[11px] font-semibold">
                                <Network className="w-3 h-3" />
                                <span>RJ45</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 text-[11px] font-semibold">
                                <Wifi className="w-3 h-3" />
                                <span>Wi-Fi</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Network & Source Parameters */}
                        <div className="grid grid-cols-2 gap-2 text-xs py-2 my-2 border-y border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Adresse IP</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{screen.ipAddress}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Code PIN TV</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                              {screen.pinCode}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Bascule Auto (Failover) :</span>
                            <span className={`font-semibold text-[11px] ${screen.enableAutoFailover ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {screen.enableAutoFailover ? `Actif (${screen.failoverTimeoutSeconds}s)` : 'Désactivé'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Remote Interactive Control Buttons */}
                      <div className="space-y-2 pt-2">
                        {/* Quick Source Switcher & Test Failover */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (screen.currentActiveSource === 'ip_stream') {
                                handleRemoteCommand(screen.id, 'switch_source', { source: 'fallback_loop' });
                              } else {
                                handleRemoteCommand(screen.id, 'switch_source', { source: 'ip_stream' });
                              }
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                              screen.currentActiveSource === 'ip_stream'
                                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                            }`}
                            title="Basculer manuellement entre le flux IP et la boucle de secours"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>
                              {screen.currentActiveSource === 'ip_stream' ? 'Source : Flux IP' : 'Source : Boucle Web'}
                            </span>
                          </button>

                          {/* Failover Simulator Button */}
                          <button
                            onClick={() => {
                              if (screen.isStreamSignalDetected) {
                                handleRemoteCommand(screen.id, 'simulate_signal_loss');
                              } else {
                                handleRemoteCommand(screen.id, 'simulate_signal_restore');
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                              !screen.isStreamSignalDetected
                                ? 'bg-amber-500 text-white border-amber-500'
                                : darkMode
                                ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Simuler une coupure de flux IP pour vérifier le basculement automatique"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{!screen.isStreamSignalDetected ? 'Flux Coupé' : 'Test Coupure'}</span>
                          </button>
                        </div>

                        {/* Secondary Controls Bar */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          {/* Blackout Toggle */}
                          <button
                            onClick={() => handleRemoteCommand(screen.id, 'toggle_blackout')}
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                              screen.isBlackout
                                ? 'bg-purple-600 text-white'
                                : darkMode
                                ? 'bg-slate-800 text-slate-400 hover:text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Activer/Désactiver le mode veille économie d'énergie"
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span className="text-[11px]">{screen.isBlackout ? 'Réveiller' : 'Veille'}</span>
                          </button>

                          {/* Ticker Banner Edit */}
                          <button
                            onClick={() => {
                              setTickerScreen(screen);
                              setNewTickerText(screen.tickerMessage || '');
                              setNewTickerEnabled(screen.tickerEnabled);
                              setIsTickerModalOpen(true);
                            }}
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                              screen.tickerEnabled
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                : darkMode
                                ? 'bg-slate-800 text-slate-400 hover:text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Diffuser un bandeau défilant d'urgence ou d'information"
                          >
                            <Radio className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Bandeau Info</span>
                          </button>

                          {/* Edit Settings */}
                          <button
                            onClick={() => handleOpenEdit(screen)}
                            className={`p-2 rounded-lg text-xs font-semibold transition ${
                              darkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Modifier les réglages réseau"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteScreen(screen.id)}
                            className={`p-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition`}
                            title="Supprimer l'écran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLAYLISTS & MEDIA BUILDER */}
      {activeTab === 'playlists' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Boucles de Diffusion (Playlists)</h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Composez vos séquences multimédias : photos haute résolution, vidéos MP4, documents PDF et vues KROMA OS en temps réel.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPlaylist({
                  id: `pl-${Date.now()}`,
                  name: 'Nouvelle Boucle Quai / Régie',
                  description: 'Boucle personnalisée',
                  loopMode: 'infinite',
                  totalDurationSeconds: 30,
                  items: [
                    {
                      id: `item-pl-${Date.now()}-1`,
                      type: 'kroma_view',
                      title: 'Tableau Départs & Retours',
                      durationSeconds: 15,
                      kromaViewType: 'rentals_dispatch'
                    }
                  ],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
                setIsPlaylistModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Boucle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {playlists.map(pl => (
              <div
                key={pl.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between ${
                  darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {pl.items.length} diapositive(s)
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{pl.totalDurationSeconds} sec par cycle</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-1">{pl.name}</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-4 line-clamp-2`}>
                    {pl.description || 'Aucune description'}
                  </p>

                  {/* List of items in playlist */}
                  <div className="space-y-2 mb-4">
                    {pl.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                          darkMode ? 'bg-slate-900/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-5 h-5 rounded-lg bg-indigo-600/10 text-indigo-500 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-semibold truncate">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.durationSeconds}s
                          </span>
                          {item.type === 'kroma_view' && <span className="text-indigo-500 text-[11px] font-bold">KROMA</span>}
                          {item.type === 'video' && <Video className="w-3.5 h-3.5 text-blue-500" />}
                          {item.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />}
                          {item.type === 'pdf' && <FileText className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setEditingPlaylist(pl);
                      setIsPlaylistModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(pl.id)}
                    className="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10 transition"
                    title="Supprimer la boucle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUTO-FAILOVER CONFIGURATION & SIMULATION */}
      {activeTab === 'failover_config' && (
        <div className="space-y-6">
          {/* Architecture Diagram */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold">Principe de Bascule Intelligente (Auto-Failover)</h2>
            </div>
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'} mb-6`}>
              Pour garantir zéro interruption de service dans les régies et sur les quais, KROMA OS surveille en continu la présence du signal vidéo IP. En cas de perte de flux pendant plus de $X$ secondes configurables, l'écran bascule immédiatement sur la boucle web de secours sans aucun écran noir. Dès que la source vidéo est rétablie, l'écran reprend son flux en direct instantanément.
            </p>

            {/* Interactive Schema Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold mb-2">
                  1
                </div>
                <h4 className="font-bold text-sm mb-1">Source IP Principale</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  RTSP, HLS, WebRTC ou encodeur vidéo réseau connecté à la régie ou aux caméras quai.
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold mb-2">
                  2
                </div>
                <h4 className="font-bold text-sm mb-1">Détection de Perte Signal</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chien de garde (Watchdog) avec compte à rebours paramétrable (5s à 60s).
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="w-10 h-10 mx-auto rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold mb-2">
                  3
                </div>
                <h4 className="font-bold text-sm mb-1">Boucle Web de Secours</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Affichage continu du planning KROMA, départs urgents, vidéos démo et consignes de sécurité.
                </p>
              </div>
            </div>
          </div>

          {/* Screen Failover Matrix */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="font-bold text-base mb-4">État et Délai de Bascule par Écran</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className={`text-xs uppercase ${darkMode ? 'bg-slate-900/80 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">Écran Distant</th>
                    <th className="px-4 py-3">Source Active</th>
                    <th className="px-4 py-3">Signal IP Détecté</th>
                    <th className="px-4 py-3">Délai Bascule</th>
                    <th className="px-4 py-3">Boucle Assignée</th>
                    <th className="px-4 py-3 rounded-r-xl text-right">Action Simulateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displays.map(screen => {
                    const pl = playlists.find(p => p.id === screen.assignedPlaylistId);
                    return (
                      <tr key={screen.id}>
                        <td className="px-4 py-3 font-semibold">
                          <div>{screen.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{screen.ipAddress}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            screen.currentActiveSource === 'ip_stream'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {screen.currentActiveSource === 'ip_stream' ? 'Flux IP Direct' : 'Boucle Web'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {screen.isStreamSignalDetected ? (
                            <span className="flex items-center gap-1 text-emerald-500 font-semibold text-xs">
                              <CheckCircle2 className="w-4 h-4" /> Signal OK
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                              <AlertTriangle className="w-4 h-4" /> Perdu (Basculé)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{screen.failoverTimeoutSeconds} secondes</td>
                        <td className="px-4 py-3 text-xs">{pl ? pl.name : 'Défaut'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              if (screen.isStreamSignalDetected) {
                                handleRemoteCommand(screen.id, 'simulate_signal_loss');
                              } else {
                                handleRemoteCommand(screen.id, 'simulate_signal_restore');
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                              screen.isStreamSignalDetected
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {screen.isStreamSignalDetected ? 'Couper le Signal' : 'Rétablir le Signal'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEPLOYMENT & SMART TV PAIRING GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* Main Pairing Architecture Section */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} space-y-6`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Smartphone className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-bold">1. Procédure d'Appairage QR Code avec Smartphone (Smart TV)</h2>
              </div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Connectez n'importe quel téléviseur (Samsung Tizen, LG webOS, Sony Bravia Google TV, Philips, Fire TV, tablette) sans jamais devoir vous connecter à votre compte sur la TV.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs mb-2">1</div>
                <h4 className="font-bold text-xs text-white mb-1">Ouvrir le Web sur la TV</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sur la TV, lancez le navigateur internet et tapez l'adresse IP / URL KROMA (ex: <code className="text-purple-300 font-mono">192.168.1.140:3000/?display=ID</code>).
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs mb-2">2</div>
                <h4 className="font-bold text-xs text-white mb-1">Affichage du QR Code</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  L'écran TV affiche immédiatement son QR Code de sécurité unique, son code PIN à 4 chiffres et son identifiant réseau.
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="w-7 h-7 rounded-lg bg-pink-600 text-white flex items-center justify-center font-bold text-xs mb-2">3</div>
                <h4 className="font-bold text-xs text-white mb-1">Scan avec Smartphone</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  L'opérateur connecté à son compte KROMA sur mobile scanne le QR code du téléviseur via l'onglet <strong>📺 TV Scan</strong> et valide l'appairage.
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-2">4</div>
                <h4 className="font-bold text-xs text-white mb-1">Lancement Plein Écran</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  La TV reçoit la confirmation en temps réel (SSE), active le plein écran et lance immédiatement la boucle ou le planning assigné.
                </p>
              </div>
            </div>
          </div>

          {/* Native TV Setup & HDMI Input Guidance */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Tv className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold">2. Fonctionnement 100% Web & Bascule HDMI via la Télécommande du Téléviseur</h2>
            </div>
            
            <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'} leading-relaxed`}>
              Aucun boîtier électronique supplémentaire ni commutateur complexe n'est requis. L'application KROMA s'exécute directement dans le navigateur du téléviseur et laisse l'utilisateur gérer ses sources en toute simplicité.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'} space-y-2`}>
                <h4 className="font-bold text-sm text-indigo-400 flex items-center gap-1.5">
                  <Play className="w-4 h-4" /> Mode Affichage KROMA (Navigateur Web TV)
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Le téléviseur ouvre la page web KROMA en plein écran pour afficher les boucles média, les plannings de tournage, les sorties logistiques ou les messages d'urgence.
                </p>
                <div className="p-2.5 rounded-lg bg-indigo-950/40 text-[11px] text-indigo-200 border border-indigo-800/50">
                  ✨ <strong>Zero matériel supplémentaire</strong> : Fonctionne sur n'importe quel téléviseur connecté au Wi-Fi ou câble réseau RJ45.
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'} space-y-2`}>
                <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" /> Bascule vers une Source HDMI (Régie / Console)
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Pour visionner un signal vidéo branché en HDMI physique (console de mixage vidéo, caméra de plateau, retour régie) :
                </p>
                <div className="p-2.5 rounded-lg bg-emerald-950/40 text-[11px] text-emerald-200 border border-emerald-800/50">
                  🔘 <strong>Télécommande du Téléviseur</strong> : Utilisez simplement le bouton <strong>"Source"</strong> ou <strong>"Input"</strong> (HDMI 1, HDMI 2) de la télécommande de la TV pour passer au direct, puis revenez sur l'application Web / KROMA au besoin.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SCREEN */}
      {isScreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className={`w-full max-w-xl rounded-2xl border p-6 max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold">
                {editingScreen ? `Modifier : ${editingScreen.name}` : 'Ajouter un Nouvel Écran Réseau'}
              </h3>
              <button
                onClick={() => setIsScreenModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScreen} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Nom de l'écran *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Écran Quai Expéditions, Moniteur Régie A"
                  value={screenForm.name || ''}
                  onChange={e => setScreenForm({ ...screenForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-sm border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Emplacement / Zone</label>
                  <input
                    type="text"
                    placeholder="ex: Baie 2, Régie Plateau"
                    value={screenForm.location || ''}
                    onChange={e => setScreenForm({ ...screenForm, location: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-sm border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Dépôt Rattaché</label>
                  <select
                    value={screenForm.depotId || ''}
                    onChange={e => {
                      const dep = depots.find(d => d.id === e.target.value);
                      setScreenForm({
                        ...screenForm,
                        depotId: e.target.value,
                        depotName: dep?.name || 'Dépôt Central'
                      });
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-sm border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    {depots.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Adresse IP Réseau</label>
                  <input
                    type="text"
                    placeholder="192.168.1.140"
                    value={screenForm.ipAddress || ''}
                    onChange={e => setScreenForm({ ...screenForm, ipAddress: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Type de Liaison</label>
                  <select
                    value={screenForm.connectionType || 'rj45'}
                    onChange={e => setScreenForm({ ...screenForm, connectionType: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-xl text-sm border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="rj45">Câble Réseau RJ45 (Recommandé)</option>
                    <option value="wifi">Réseau Sans-Fil Wi-Fi</option>
                  </select>
                </div>
              </div>

              {/* Source Mode */}
              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/40 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Source Vidéo & Failover</span>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={screenForm.enableAutoFailover ?? true}
                      onChange={e => setScreenForm({ ...screenForm, enableAutoFailover: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-semibold">Bascule Auto en cas de coupure</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">URL Flux IP Caméra / Régie (RTSP / HLS)</label>
                  <input
                    type="text"
                    placeholder="http://192.168.1.50:8080/live/feed.m3u8"
                    value={screenForm.ipStreamUrl || ''}
                    onChange={e => setScreenForm({ ...screenForm, ipStreamUrl: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Délai avant bascule (secondes)</label>
                    <select
                      value={screenForm.failoverTimeoutSeconds || 10}
                      onChange={e => setScreenForm({ ...screenForm, failoverTimeoutSeconds: Number(e.target.value) })}
                      className={`w-full px-3 py-2 rounded-xl text-xs border ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value={5}>5 secondes (Ultra réactif)</option>
                      <option value={10}>10 secondes (Recommandé)</option>
                      <option value={15}>15 secondes</option>
                      <option value={30}>30 secondes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Boucle Web de Secours Assignée</label>
                    <select
                      value={screenForm.assignedPlaylistId || ''}
                      onChange={e => setScreenForm({ ...screenForm, assignedPlaylistId: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-xs border ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      {playlists.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScreenModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md"
                >
                  Enregistrer l'Écran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE PAIRING */}
      {isQrModalOpen && qrScreen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className={`w-full max-w-sm rounded-2xl border p-6 text-center ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-bold text-lg mb-1">{qrScreen.name}</h3>
            <p className="text-xs text-slate-400 mb-4">Scannez pour afficher le mode Kiosque Plein Écran</p>

            {/* Generated QR Code Simulation */}
            <div className="p-4 bg-white rounded-2xl inline-block mx-auto mb-4 shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  window.location.origin + `/?display=${qrScreen.id}`
                )}`}
                alt="QR Code"
                className="w-44 h-44"
              />
            </div>

            <div className="mb-4">
              <span className="text-xs text-slate-400 block mb-1">Code PIN pour Smart TV :</span>
              <span className="text-2xl font-black font-mono tracking-widest text-indigo-500 bg-indigo-500/10 px-4 py-1.5 rounded-xl border border-indigo-500/30">
                {qrScreen.pinCode}
              </span>
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL: TICKER MESSAGE BROADCAST */}
      {isTickerModalOpen && tickerScreen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl border p-6 ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base">Bandeau Défilant en Direct</h3>
              </div>
              <button onClick={() => setIsTickerModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveTicker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Message d'information / alerte</label>
                <textarea
                  rows={3}
                  placeholder="ex: ⚠️ Départ camionnage Grand Palais prévu à 14h30 - Priorité Quai A"
                  value={newTickerText}
                  onChange={e => setNewTickerText(e.target.value)}
                  className={`w-full p-3 rounded-xl text-sm border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTickerEnabled}
                    onChange={e => setNewTickerEnabled(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>Activer la diffusion du bandeau</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTickerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 shadow-md"
                >
                  Diffuser Immédiatement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PLAYLIST */}
      {isPlaylistModalOpen && editingPlaylist && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold">Éditeur de Boucle Multimédia</h3>
              <button onClick={() => setIsPlaylistModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Nom de la Boucle *</label>
                <input
                  type="text"
                  value={editingPlaylist.name}
                  onChange={e => setEditingPlaylist({ ...editingPlaylist, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-sm border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={editingPlaylist.description || ''}
                  onChange={e => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-sm border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold">Diapositives Multimédias ({editingPlaylist.items.length})</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const newItem: DisplayMediaItem = {
                          id: `item-${Date.now()}`,
                          type: 'kroma_view',
                          title: 'Tableau Départs & Retours',
                          durationSeconds: 12,
                          kromaViewType: 'rentals_dispatch',
                          caption: 'Suivi logistique en direct'
                        };
                        setEditingPlaylist({
                          ...editingPlaylist,
                          items: [...editingPlaylist.items, newItem]
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-indigo-600/10 text-indigo-500 text-xs font-semibold hover:bg-indigo-600/20"
                    >
                      + Vue KROMA OS
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newItem: DisplayMediaItem = {
                          id: `item-${Date.now()}`,
                          type: 'image',
                          title: 'Photo Équipement / Consigne',
                          url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80',
                          durationSeconds: 10,
                          caption: 'Visuel haute définition'
                        };
                        setEditingPlaylist({
                          ...editingPlaylist,
                          items: [...editingPlaylist.items, newItem]
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-600/10 text-emerald-500 text-xs font-semibold hover:bg-emerald-600/20"
                    >
                      + Image HD
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newItem: DisplayMediaItem = {
                          id: `item-${Date.now()}`,
                          type: 'video',
                          title: 'Vidéo Démo Showreel',
                          url: 'https://assets.mixkit.co/videos/preview/mixkit-camera-operator-filming-in-a-studio-41126-large.mp4',
                          durationSeconds: 15,
                          caption: 'Clip vidéo MP4 en boucle'
                        };
                        setEditingPlaylist({
                          ...editingPlaylist,
                          items: [...editingPlaylist.items, newItem]
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-blue-600/10 text-blue-500 text-xs font-semibold hover:bg-blue-600/20"
                    >
                      + Vidéo MP4
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {editingPlaylist.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={e => {
                            const newItems = [...editingPlaylist.items];
                            newItems[idx].title = e.target.value;
                            setEditingPlaylist({ ...editingPlaylist, items: newItems });
                          }}
                          className={`w-full px-2 py-1 rounded text-xs font-semibold border ${
                            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                          }`}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-indigo-400">{item.type}</span>
                          <input
                            type="text"
                            placeholder="URL média ou légende"
                            value={item.url || item.caption || ''}
                            onChange={e => {
                              const newItems = [...editingPlaylist.items];
                              if (item.type === 'kroma_view') {
                                newItems[idx].caption = e.target.value;
                              } else {
                                newItems[idx].url = e.target.value;
                              }
                              setEditingPlaylist({ ...editingPlaylist, items: newItems });
                            }}
                            className={`flex-1 px-2 py-0.5 rounded text-[11px] font-mono border ${
                              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 text-xs">
                          <input
                            type="number"
                            min={3}
                            max={120}
                            value={item.durationSeconds}
                            onChange={e => {
                              const newItems = [...editingPlaylist.items];
                              newItems[idx].durationSeconds = Number(e.target.value);
                              setEditingPlaylist({ ...editingPlaylist, items: newItems });
                            }}
                            className={`w-14 px-2 py-1 rounded text-xs text-center border ${
                              darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                            }`}
                          />
                          <span className="text-slate-400 text-xs">sec</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = editingPlaylist.items.filter((_, i) => i !== idx);
                            setEditingPlaylist({ ...editingPlaylist, items: newItems });
                          }}
                          className="p-1 rounded text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlaylistModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePlaylist(editingPlaylist)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md"
                >
                  Enregistrer la Boucle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
