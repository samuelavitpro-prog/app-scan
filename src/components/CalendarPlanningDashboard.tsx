import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  Package,
  Users,
  Tv,
  Maximize2,
  Minimize2,
  Filter,
  ExternalLink,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sparkles,
  Search,
  MapPin,
  Tag,
  Eye,
  Layers,
  ArrowDownLeft,
  RefreshCw,
  SlidersHorizontal,
  Monitor,
  Laptop,
  Copy,
  X,
  Cast,
  Zap,
  ShieldAlert,
  Archive,
  Trash2,
  Edit3,
  AlertCircle,
  Check,
  Lock,
  Unlock,
  Coins,
  FileText,
} from "lucide-react";
import {
  ClientQuote,
  StudioSpace,
  TechnicianProfile,
  InventoryItem,
  DepotWarehouse,
  DetectedScreen,
  CalendarInventoryBlock,
} from "../types";

interface CalendarPlanningDashboardProps {
  quotes: ClientQuote[];
  studios: StudioSpace[];
  technicians: TechnicianProfile[];
  items: InventoryItem[];
  depots?: DepotWarehouse[];
  activeDepotId?: string;
  onOpenNewQuote?: () => void;
  onSelectQuote?: (quote: ClientQuote) => void;
  onSelectProduct?: (item: InventoryItem) => void;
}

// Initial sample inventory blocks for realistic operations
const DEFAULT_INVENTORY_BLOCKS: CalendarInventoryBlock[] = [
  {
    id: "blk-inv-01",
    title: "Inventaire Annuel Général - Parc Caméras & Optiques",
    type: "general_inventory",
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 12).toISOString().split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 14).toISOString().split("T")[0],
    depotId: "ALL",
    depotName: "Tous les dépôts",
    affectedCategory: "Caméras & Boîtiers",
    assignedTechnicians: ["Marc V.", "Sarah L."],
    blockRentals: true,
    notes: "Comptage complet, recalibrage optiques cinéma et vérification firmware.",
    status: "scheduled",
    createdAt: new Date().toISOString(),
  },
  {
    id: "blk-inv-02",
    title: "Contrôle Réglementaire VGP & Révision Électricité / Levage",
    type: "maintenance_vgp",
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 24).toISOString().split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 25).toISOString().split("T")[0],
    depotId: "DEP-01",
    depotName: "Dépôt Central Paris-Nord",
    affectedCategory: "Machinerie",
    assignedTechnicians: ["Bureau Veritas", "Alexandre T."],
    blockRentals: true,
    notes: "Inspection annuelle obligatoire des pieds lourds, structures et armoires de puissance.",
    status: "scheduled",
    createdAt: new Date().toISOString(),
  },
  {
    id: "blk-inv-03",
    title: "Inventaire Tournant Éclairage LED & Projecteurs",
    type: "partial_inventory",
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 6).toISOString().split("T")[0],
    depotId: "DEP-02",
    depotName: "Hub Lyon Studios",
    affectedCategory: "Éclairage & Projecteurs",
    assignedTechnicians: ["Julien M."],
    blockRentals: false,
    notes: "Pointage des kits tubes Titan et projecteurs Aputure.",
    status: "completed",
    createdAt: new Date().toISOString(),
  },
];

export const CalendarPlanningDashboard: React.FC<CalendarPlanningDashboardProps> = ({
  quotes = [],
  studios = [],
  technicians = [],
  items = [],
  depots = [],
  activeDepotId = "ALL",
  onOpenNewQuote,
  onSelectQuote,
  onSelectProduct,
}) => {
  const safeQuotes = quotes || [];
  const safeStudios = studios || [];
  const safeTechnicians = technicians || [];
  const safeItems = items || [];
  const safeDepots = depots || [];

  const [currentDate, setCurrentDate] = useState(new Date());
  const [planningView, setPlanningView] = useState<"gantt-resources" | "calendar-grid" | "today-counter" | "inventory-blocks">("gantt-resources");
  const [filterType, setFilterType] = useState<"all" | "rentals" | "studios" | "crew" | "inventory_blocks">("all");
  const [validationFilter, setValidationFilter] = useState<"all" | "validated_only" | "drafts">("all");
  const [selectedDepotFilter, setSelectedDepotFilter] = useState<string>(activeDepotId || "ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSecondScreenMode, setIsSecondScreenMode] = useState(false);
  const [liveClock, setLiveClock] = useState(new Date());

  // Inventory Blocks state with localStorage persistence
  const [inventoryBlocks, setInventoryBlocks] = useState<CalendarInventoryBlock[]>(() => {
    try {
      const saved = localStorage.getItem("kroma_calendar_inventory_blocks_v1");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load inventory blocks from local storage", e);
    }
    return DEFAULT_INVENTORY_BLOCKS;
  });

  // Modal State for Inventory Blocks Creation / Edition
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CalendarInventoryBlock | null>(null);
  const [blockFormTitle, setBlockFormTitle] = useState("");
  const [blockFormType, setBlockFormType] = useState<CalendarInventoryBlock["type"]>("general_inventory");
  const [blockFormStartDate, setBlockFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [blockFormEndDate, setBlockFormEndDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]);
  const [blockFormDepotId, setBlockFormDepotId] = useState("ALL");
  const [blockFormCategory, setBlockFormCategory] = useState("ALL");
  const [blockFormTechnicians, setBlockFormTechnicians] = useState("");
  const [blockFormBlockRentals, setBlockFormBlockRentals] = useState(true);
  const [blockFormNotes, setBlockFormNotes] = useState("");
  const [blockFormStatus, setBlockFormStatus] = useState<CalendarInventoryBlock["status"]>("scheduled");

  // Multi-Screen Detection States
  const [showScreenPickerModal, setShowScreenPickerModal] = useState<boolean>(false);
  const [detectedScreens, setDetectedScreens] = useState<DetectedScreen[]>([]);
  const [isDetectingScreens, setIsDetectingScreens] = useState<boolean>(false);
  const [copiedBroadcastUrl, setCopiedBroadcastUrl] = useState<boolean>(false);

  // Synchronize depot filter if prop changes
  useEffect(() => {
    if (activeDepotId && activeDepotId !== "ALL") {
      setSelectedDepotFilter(activeDepotId);
    }
  }, [activeDepotId]);

  // Persist inventory blocks
  const saveInventoryBlocks = (newBlocks: CalendarInventoryBlock[]) => {
    setInventoryBlocks(newBlocks);
    try {
      localStorage.setItem("kroma_calendar_inventory_blocks_v1", JSON.stringify(newBlocks));
    } catch (e) {
      console.error("Could not persist inventory blocks", e);
    }
  };

  // Real-time clock for second-screen control room HUD
  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Screen detection logic
  const detectConnectedScreens = async () => {
    setIsDetectingScreens(true);
    try {
      if (typeof window !== "undefined" && "getScreenDetails" in window) {
        const screenDetails = await (window as any).getScreenDetails();
        if (screenDetails && screenDetails.screens) {
          const mapped: DetectedScreen[] = screenDetails.screens.map((s: any, idx: number) => ({
            id: `screen-${idx}`,
            name: s.label || (s.isPrimary ? `Écran 1 (Moniteur Principal)` : `Écran ${idx + 1} (Secondaire / Régie)`),
            isPrimary: Boolean(s.isPrimary),
            isInternal: Boolean(s.isInternal),
            width: s.width || window.screen.width,
            height: s.height || window.screen.height,
            availWidth: s.availWidth || window.screen.availWidth,
            availHeight: s.availHeight || window.screen.availHeight,
            left: s.left || 0,
            top: s.top || 0,
            devicePixelRatio: s.devicePixelRatio || window.devicePixelRatio || 1,
            colorDepth: s.colorDepth || window.screen.colorDepth || 24,
          }));
          setDetectedScreens(mapped);
          setIsDetectingScreens(false);
          return mapped;
        }
      }
    } catch (err) {
      console.log("Window Management API note:", err);
    }

    // Fallback detection using standard window & screen APIs
    const isExtended = (window.screen as any)?.isExtended ?? false;
    const currentW = window.screen.width;
    const currentH = window.screen.height;
    const availW = window.screen.availWidth;
    const availH = window.screen.availHeight;

    const list: DetectedScreen[] = [
      {
        id: "screen-primary",
        name: "Écran Principal (Moniteur Actuel)",
        isPrimary: true,
        width: currentW,
        height: currentH,
        availWidth: availW,
        availHeight: availH,
        left: 0,
        top: 0,
        devicePixelRatio: window.devicePixelRatio || 1,
        colorDepth: window.screen.colorDepth || 24,
      },
    ];

    if (isExtended || currentW > 2500) {
      list.push({
        id: "screen-secondary",
        name: "Écran Secondaire (TV / Régie Déportée Détectée)",
        isPrimary: false,
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1080,
        left: currentW,
        top: 0,
        devicePixelRatio: 1,
        colorDepth: 24,
      });
    }

    setDetectedScreens(list);
    setIsDetectingScreens(false);
    return list;
  };

  const handleOpenScreenPicker = async () => {
    setShowScreenPickerModal(true);
    await detectConnectedScreens();
  };

  const handleLaunchOnScreen = (targetScreen?: DetectedScreen) => {
    const left = targetScreen?.left !== undefined && targetScreen.left !== 0 ? targetScreen.left : window.screen.width;
    const top = targetScreen?.top !== undefined ? targetScreen.top : 0;
    const width = targetScreen?.width || 1920;
    const height = targetScreen?.height || 1080;

    const windowFeatures = `left=${left},top=${top},width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`;
    const popoutUrl = `${window.location.origin}/?mode=calendar-broadcast&depot=${selectedDepotFilter}`;

    try {
      const popoutWin = window.open(popoutUrl, "KromaCalendarBroadcastWindow", windowFeatures);
      if (popoutWin) {
        popoutWin.focus();
      }
    } catch (err) {
      console.error("Popup window launch:", err);
      setIsSecondScreenMode(true);
    }
    setShowScreenPickerModal(false);
  };

  const handleOpenDualMonitorPopout = () => {
    setIsSecondScreenMode(true);
  };

  // Date Navigation Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const setToday = () => setCurrentDate(new Date());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const startDayOffset = (firstDayIndex + 6) % 7; // Monday-first offset (0 for Mon, 6 for Sun)

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  // Distinct categories from inventory
  const availableCategories = Array.from(new Set(safeItems.map((i) => i.category || "Général"))).filter(Boolean);

  // Filter quotes by depot, validation status, search
  const filteredQuotes = safeQuotes.filter((q) => {
    if (!q || q.status === "rejected") return false;

    // Filter by Validation status
    const isValidated = q.status === "accepted" || q.status === "invoiced" || q.status === "paid" || q.rentalStatus === "in_rental" || q.rentalStatus === "returned";
    if (validationFilter === "validated_only" && !isValidated) {
      return false;
    }
    if (validationFilter === "drafts" && isValidated) {
      return false;
    }

    // Filter by Depot
    if (selectedDepotFilter !== "ALL" && q.depotId && q.depotId !== selectedDepotFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const qry = searchQuery.toLowerCase();
      const matchClient = (q.clientName || "").toLowerCase().includes(qry);
      const matchNumber = (q.quoteNumber || "").toLowerCase().includes(qry);
      const matchItems = (q.rentalItems || []).some((item) => (item.name || "").toLowerCase().includes(qry));
      const matchStudios = (q.studioRentals || []).some((s) => (s.studioName || "").toLowerCase().includes(qry));
      if (!matchClient && !matchNumber && !matchItems && !matchStudios) return false;
    }
    return true;
  });

  // Filter items for Gantt resource view
  const filteredItems = (items || []).filter((item) => {
    if (selectedDepotFilter !== "ALL" && item.depotId && item.depotId !== selectedDepotFilter) {
      return false;
    }
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const qry = searchQuery.toLowerCase();
      const matchName = (item.name || "").toLowerCase().includes(qry);
      const matchSku = (item.sku || "").toLowerCase().includes(qry);
      const matchBrand = (item.brand || "").toLowerCase().includes(qry);
      if (!matchName && !matchSku && !matchBrand) return false;
    }
    return true;
  });

  // Filtered inventory blocks
  const filteredInventoryBlocks = inventoryBlocks.filter((b) => {
    if (selectedDepotFilter !== "ALL" && b.depotId && b.depotId !== "ALL" && b.depotId !== selectedDepotFilter) {
      return false;
    }
    if (selectedCategory !== "ALL" && b.affectedCategory && b.affectedCategory !== "ALL" && b.affectedCategory !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const qry = searchQuery.toLowerCase();
      return b.title.toLowerCase().includes(qry) || (b.notes || "").toLowerCase().includes(qry);
    }
    return true;
  });

  // Today departures and returns (KROMA Comptoir)
  const todayStr = new Date().toISOString().split("T")[0];
  const departuresToday = filteredQuotes.filter((q) => {
    const start = (q.startDate || "").split("T")[0];
    return start === todayStr;
  });
  const returnsToday = filteredQuotes.filter((q) => {
    const end = (q.endDate || "").split("T")[0];
    return end === todayStr;
  });
  const overdueRentals = filteredQuotes.filter((q) => {
    const end = new Date(q.endDate);
    return end < new Date() && q.rentalStatus !== "returned";
  });
  const inventoryBlocksToday = inventoryBlocks.filter((b) => {
    const target = new Date(todayStr);
    const s = new Date(b.startDate);
    const e = new Date(b.endDate);
    s.setHours(0, 0, 0, 0);
    e.setHours(23, 59, 59, 999);
    return target >= s && target <= e;
  });

  // Helper to extract events and inventory blocks for a specific date (YYYY-MM-DD)
  const getEventsForDate = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const events: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: "rental" | "studio" | "crew" | "inventory_block";
      status: string;
      isValidated?: boolean;
      depositInfo?: { percent?: number; amount?: number; status?: string };
      quoteRef?: ClientQuote;
      blockRef?: CalendarInventoryBlock;
      depotName?: string;
    }> = [];

    // 1. Inventory Blocks
    if (filterType === "all" || filterType === "inventory_blocks") {
      filteredInventoryBlocks.forEach((b) => {
        const start = new Date(b.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(b.endDate);
        end.setHours(23, 59, 59, 999);

        if (targetDate >= start && targetDate <= end) {
          events.push({
            id: `block-${b.id}`,
            title: `🚫 [INVENTAIRE] ${b.title}`,
            subtitle: `${b.affectedCategory || "Tout le parc"} • ${b.depotName || "Dépôt"}`,
            type: "inventory_block",
            status: b.status,
            blockRef: b,
            depotName: b.depotName,
          });
        }
      });
    }

    // 2. Quotes & Bookings
    if (filterType !== "inventory_blocks") {
      filteredQuotes.forEach((q) => {
        const start = new Date(q.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(q.endDate);
        end.setHours(23, 59, 59, 999);

        const isValidated = q.status === "accepted" || q.status === "invoiced" || q.status === "paid";

        if (targetDate >= start && targetDate <= end) {
          // Material rental event
          if (filterType === "all" || filterType === "rentals") {
            if (q.rentalItems && q.rentalItems.length > 0) {
              const depositText = q.depositAmount ? ` • Acompte ${q.depositAmount}€` : "";
              events.push({
                id: `${q.id}-rental`,
                title: `${isValidated ? "✓ " : ""}${q.clientName} (${q.quoteNumber})`,
                subtitle: `${q.rentalItems.reduce((acc, i) => acc + i.quantity, 0)} réf. matériel${depositText}`,
                type: "rental",
                status: q.rentalStatus || (isValidated ? "validated" : "pending"),
                isValidated,
                depositInfo: {
                  percent: q.depositPercent,
                  amount: q.depositAmount,
                  status: q.depositStatus,
                },
                quoteRef: q,
                depotName: q.depotName,
              });
            }
          }

          // Studio booking event
          if (filterType === "all" || filterType === "studios") {
            (q.studioRentals || []).forEach((st) => {
              events.push({
                id: `${q.id}-studio-${st.studioId}`,
                title: `${isValidated ? "✓ " : ""}Studio : ${st.studioName}`,
                subtitle: `Client : ${q.clientName} (${q.quoteNumber})`,
                type: "studio",
                status: q.rentalStatus || (isValidated ? "validated" : "pending"),
                isValidated,
                depositInfo: {
                  percent: q.depositPercent,
                  amount: q.depositAmount,
                  status: q.depositStatus,
                },
                quoteRef: q,
                depotName: q.depotName,
              });
            });
          }

          // Crew staff event
          if (filterType === "all" || filterType === "crew") {
            (q.crewStaff || []).forEach((cr) => {
              events.push({
                id: `${q.id}-crew-${cr.technicianId}`,
                title: `${isValidated ? "✓ " : ""}${cr.technicianName} (${cr.role})`,
                subtitle: `Mission client : ${q.clientName}`,
                type: "crew",
                status: q.rentalStatus || (isValidated ? "validated" : "pending"),
                isValidated,
                quoteRef: q,
                depotName: q.depotName,
              });
            });
          }
        }
      });
    }

    return events;
  };

  // Helper for Gantt bar booking across days
  const getItemBookingsForMonth = (itemId: string, itemCategory: string, itemDepotId?: string) => {
    const bookings: Array<{
      quote?: ClientQuote;
      block?: CalendarInventoryBlock;
      startDay: number;
      endDay: number;
      qty?: number;
      clientName: string;
      status: string;
      color: string;
      isBlock?: boolean;
    }> = [];

    // 1. Check if an inventory block covers this item/category
    filteredInventoryBlocks.forEach((blk) => {
      const isCatMatch = !blk.affectedCategory || blk.affectedCategory === "ALL" || blk.affectedCategory === itemCategory;
      const isDepotMatch = !blk.depotId || blk.depotId === "ALL" || blk.depotId === itemDepotId;

      if (isCatMatch && isDepotMatch) {
        const bStart = new Date(blk.startDate);
        const bEnd = new Date(blk.endDate);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59);

        if (bEnd >= monthStart && bStart <= monthEnd) {
          let sDay = 1;
          if (bStart.getFullYear() === year && bStart.getMonth() === month) {
            sDay = bStart.getDate();
          }
          let eDay = daysInMonth;
          if (bEnd.getFullYear() === year && bEnd.getMonth() === month) {
            eDay = bEnd.getDate();
          }

          bookings.push({
            block: blk,
            startDay: sDay,
            endDay: eDay,
            clientName: `🚫 BLOCAGE: ${blk.title}`,
            status: blk.status,
            color: "bg-amber-600/90 border-amber-400 text-white shadow-lg pattern-stripes",
            isBlock: true,
          });
        }
      }
    });

    // 2. Bookings from quotes
    filteredQuotes.forEach((q) => {
      const matchLine = (q.rentalItems || []).find((ri) => ri.itemId === itemId);
      if (!matchLine) return;

      const qStart = new Date(q.startDate);
      const qEnd = new Date(q.endDate);

      // Check if overlaps current month
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59);

      if (qEnd >= monthStart && qStart <= monthEnd) {
        let sDay = 1;
        if (qStart.getFullYear() === year && qStart.getMonth() === month) {
          sDay = qStart.getDate();
        }
        let eDay = daysInMonth;
        if (qEnd.getFullYear() === year && qEnd.getMonth() === month) {
          eDay = qEnd.getDate();
        }

        const isValidated = q.status === "accepted" || q.status === "invoiced" || q.status === "paid";

        let barColor = "bg-indigo-600 border-indigo-400 text-white";
        if (q.rentalStatus === "overdue") {
          barColor = "bg-rose-600 border-rose-400 text-white";
        } else if (q.rentalStatus === "returned") {
          barColor = "bg-emerald-700/80 border-emerald-500 text-emerald-100";
        } else if (isValidated) {
          barColor = "bg-cyan-700 border-cyan-400 text-cyan-50";
        } else if (q.rentalStatus === "reserved") {
          barColor = "bg-purple-600 border-purple-400 text-purple-50";
        }

        bookings.push({
          quote: q,
          startDay: sDay,
          endDay: eDay,
          qty: matchLine.quantity || 1,
          clientName: `${isValidated ? "✓ " : ""}${q.clientName}`,
          status: q.rentalStatus || (isValidated ? "validated" : "in_rental"),
          color: barColor,
          isBlock: false,
        });
      }
    });

    return bookings;
  };

  // Open Block Modal for Creation or Edit
  const handleOpenCreateBlock = () => {
    setEditingBlock(null);
    setBlockFormTitle("");
    setBlockFormType("general_inventory");
    setBlockFormStartDate(new Date().toISOString().split("T")[0]);
    setBlockFormEndDate(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]);
    setBlockFormDepotId(selectedDepotFilter !== "ALL" ? selectedDepotFilter : "ALL");
    setBlockFormCategory(selectedCategory !== "ALL" ? selectedCategory : "ALL");
    setBlockFormTechnicians("");
    setBlockFormBlockRentals(true);
    setBlockFormNotes("");
    setBlockFormStatus("scheduled");
    setIsBlockModalOpen(true);
  };

  const handleOpenEditBlock = (blk: CalendarInventoryBlock) => {
    setEditingBlock(blk);
    setBlockFormTitle(blk.title);
    setBlockFormType(blk.type);
    setBlockFormStartDate(blk.startDate);
    setBlockFormEndDate(blk.endDate);
    setBlockFormDepotId(blk.depotId || "ALL");
    setBlockFormCategory(blk.affectedCategory || "ALL");
    setBlockFormTechnicians(blk.assignedTechnicians ? blk.assignedTechnicians.join(", ") : "");
    setBlockFormBlockRentals(blk.blockRentals);
    setBlockFormNotes(blk.notes || "");
    setBlockFormStatus(blk.status);
    setIsBlockModalOpen(true);
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockFormTitle.trim()) return;

    const depotObj = safeDepots.find((d) => d.id === blockFormDepotId);
    const depotName = blockFormDepotId === "ALL" ? "Tous les dépôts" : depotObj?.name || "Dépôt Central";

    const techList = blockFormTechnicians
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingBlock) {
      const updated: CalendarInventoryBlock = {
        ...editingBlock,
        title: blockFormTitle.trim(),
        type: blockFormType,
        startDate: blockFormStartDate,
        endDate: blockFormEndDate,
        depotId: blockFormDepotId,
        depotName,
        affectedCategory: blockFormCategory,
        assignedTechnicians: techList,
        blockRentals: blockFormBlockRentals,
        notes: blockFormNotes.trim(),
        status: blockFormStatus,
      };
      saveInventoryBlocks(inventoryBlocks.map((b) => (b.id === editingBlock.id ? updated : b)));
    } else {
      const newBlock: CalendarInventoryBlock = {
        id: `blk-${Date.now()}`,
        title: blockFormTitle.trim(),
        type: blockFormType,
        startDate: blockFormStartDate,
        endDate: blockFormEndDate,
        depotId: blockFormDepotId,
        depotName,
        affectedCategory: blockFormCategory,
        assignedTechnicians: techList,
        blockRentals: blockFormBlockRentals,
        notes: blockFormNotes.trim(),
        status: blockFormStatus,
        createdAt: new Date().toISOString(),
      };
      saveInventoryBlocks([newBlock, ...inventoryBlocks]);
    }
    setIsBlockModalOpen(false);
  };

  const handleDeleteBlock = (blockId: string) => {
    saveInventoryBlocks(inventoryBlocks.filter((b) => b.id !== blockId));
    if (editingBlock?.id === blockId) {
      setIsBlockModalOpen(false);
    }
  };

  // Find rental conflicts for an inventory block
  const getConflictsForBlock = (blk: CalendarInventoryBlock) => {
    const bStart = new Date(blk.startDate);
    const bEnd = new Date(blk.endDate);
    bStart.setHours(0, 0, 0, 0);
    bEnd.setHours(23, 59, 59, 999);

    return safeQuotes.filter((q) => {
      if (q.status === "rejected" || q.rentalStatus === "returned") return false;
      const qStart = new Date(q.startDate);
      const qEnd = new Date(q.endDate);
      qStart.setHours(0, 0, 0, 0);
      qEnd.setHours(23, 59, 59, 999);

      // Overlap check
      const overlaps = qEnd >= bStart && qStart <= bEnd;
      if (!overlaps) return false;

      // Depot check
      if (blk.depotId && blk.depotId !== "ALL" && q.depotId && q.depotId !== blk.depotId) {
        return false;
      }

      // Category check
      if (blk.affectedCategory && blk.affectedCategory !== "ALL") {
        const hasMatchingItem = (q.rentalItems || []).some((i) => {
          const matchedItem = safeItems.find((item) => item.id === i.itemId);
          return matchedItem?.category === blk.affectedCategory;
        });
        if (!hasMatchingItem) return false;
      }

      return true;
    });
  };

  return (
    <div className="locasyst-calendar-screen space-y-5 animate-fadeIn font-sans">
      {/* ========================================================================= */}
      {/* SECOND SCREEN BROADCAST HUD OVERLAY MODE */}
      {/* ========================================================================= */}
      {isSecondScreenMode ? (
        <div className="fixed inset-0 z-[100] bg-[#070913] text-white p-6 flex flex-col justify-between overflow-hidden">
          {/* Top Bar for Broadcast Screen */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>KROMA • Régie Déportée & Calendrier Continu</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono animate-pulse">
                    LIVE REGIE
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Affichage dynamique automatique des sorties matériel, inventaires et réservations
                </p>
              </div>
            </div>

            {/* Live Clock & Exit */}
            <div className="flex items-center gap-4">
              <div className="text-right font-mono">
                <div className="text-2xl font-bold text-indigo-400 tracking-wider">
                  {liveClock.toLocaleTimeString("fr-FR")}
                </div>
                <div className="text-xs text-slate-400">
                  {liveClock.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSecondScreenMode(false)}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Quitter le mode régie"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Broadcast Content Grid */}
          <div className="grid grid-cols-12 gap-6 my-auto h-[78vh]">
            {/* Left: Departures */}
            <div className="col-span-4 bg-[#0d1020] border border-slate-800 rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  Enlèvements Prévus Aujourd'hui
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
                  {departuresToday.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {departuresToday.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Aucun départ planifié aujourd'hui.
                  </div>
                ) : (
                  departuresToday.map((q) => {
                    const isValidated = q.status === "accepted" || q.status === "invoiced" || q.status === "paid";
                    return (
                      <div
                        key={q.id}
                        className="p-3.5 rounded-2xl bg-[#14182e] border border-slate-800 flex items-center justify-between hover:border-indigo-500 transition"
                      >
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            {isValidated && <span className="text-emerald-400 text-xs font-bold">✓</span>}
                            <span>{q.clientName}</span>
                          </div>
                          <div className="text-xs text-indigo-400 font-mono mt-0.5">{q.quoteNumber}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {q.rentalItems?.length || 0} références matériel
                            {q.depositAmount ? ` • Acompte ${q.depositAmount}€` : ""}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-950 text-indigo-300 text-xs font-bold border border-indigo-800">
                          {q.depotName || "Dépôt Central"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Middle: Active Month Stream & Active Inventories */}
            <div className="col-span-5 bg-[#0d1020] border border-slate-800 rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-indigo-400" />
                  Planning & Dossiers Validés ({filteredQuotes.length})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold font-mono">
                  {monthNames[month]} {year}
                </span>
              </div>

              {/* Active Inventories Banner */}
              {inventoryBlocksToday.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-600/50 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>{inventoryBlocksToday.length} Blocage(s) d'Inventaire en cours aujourd'hui</span>
                  </div>
                  {inventoryBlocksToday.map((b) => (
                    <div key={b.id} className="text-xs text-slate-300 flex justify-between">
                      <span>{b.title}</span>
                      <span className="text-amber-400 font-mono text-[11px]">{b.affectedCategory || "Parc complet"}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {filteredQuotes.slice(0, 10).map((q) => {
                  const isValidated = q.status === "accepted" || q.status === "invoiced" || q.status === "paid";
                  return (
                    <div
                      key={q.id}
                      className="p-3 rounded-2xl bg-[#14182e] border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-mono font-bold text-xs">
                          {q.quoteNumber.slice(-3)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            {isValidated && <span className="text-emerald-400 text-xs font-bold">✓ Validé •</span>}
                            <span>{q.clientName}</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            Du {new Date(q.startDate).toLocaleDateString("fr-FR")} au {new Date(q.endDate).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        q.rentalStatus === "overdue"
                          ? "bg-rose-950/80 text-rose-300 border-rose-800"
                          : isValidated
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                          : "bg-indigo-950/80 text-indigo-300 border-indigo-800"
                      }`}>
                        {q.rentalStatus === "overdue" ? "En Retard" : isValidated ? "Validé & Confirmé" : "En Location"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Returns & Overdues */}
            <div className="col-span-3 bg-[#0d1020] border border-slate-800 rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  Retours Aujourd'hui
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono">
                  {returnsToday.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {returnsToday.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Aucun retour attendu aujourd'hui.
                  </div>
                ) : (
                  returnsToday.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-2xl bg-[#14182e] border border-emerald-900/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{q.clientName}</div>
                        <div className="text-xs text-slate-400 font-mono">{q.quoteNumber}</div>
                      </div>
                      <span className="text-xs text-emerald-400 font-bold">À Réceptionner</span>
                    </div>
                  ))
                )}

                {overdueRentals.length > 0 && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                      <span>{overdueRentals.length} Dossier(s) en Retard !</span>
                    </div>
                    {overdueRentals.map((ov) => (
                      <div key={ov.id} className="text-xs text-slate-300 flex justify-between">
                        <span className="truncate">{ov.clientName}</span>
                        <span className="text-rose-400 font-mono font-bold shrink-0">{ov.quoteNumber}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HUD Bottom Status Bar */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
              <span>Synchronisation temps réel active • Flux KROMA Régie</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Parc matériel total : {items.length} articles</span>
              <span>•</span>
              <span>Dossiers actifs : {filteredQuotes.length}</span>
              <span>•</span>
              <span>Blocages inventaire programmés : {inventoryBlocks.length}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* NORMAL DASHBOARD HEADER & CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        {/* Top title and secondary screen trigger */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Planning & Calendrier des Locations</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold">
                  Module KROMA Planning
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visualisation chronologique des sorties matériels, réservation studios, techniciens et blocages d'inventaires.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Plan Inventory Block Button */}
            <button
              type="button"
              id="btn-plan-inventory"
              onClick={handleOpenCreateBlock}
              className="px-3.5 py-2 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-2 shadow-sm"
              title="Bloquer une période pour inventaire ou maintenance VGP"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Bloquer un Inventaire</span>
            </button>

            {/* Popout second screen button */}
            <button
              type="button"
              id="btn-open-second-screen"
              onClick={handleOpenScreenPicker}
              className="px-3.5 py-2 rounded-2xl bg-[#171b30] hover:bg-[#202642] text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-sm"
              title="Gérer les écrans connectés et projeter sur régie / TV déportée"
            >
              <Monitor className="w-4 h-4 text-purple-400" />
              <span>Afficher sur 2ème Écran</span>
            </button>

            <button
              type="button"
              id="btn-open-hud-mode"
              onClick={handleOpenDualMonitorPopout}
              className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              title="Mode Plein Écran Régie Direct"
            >
              <Tv className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Plein Écran</span>
            </button>

            {onOpenNewQuote && (
              <button
                type="button"
                onClick={onOpenNewQuote}
                className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Devis / Réservation</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters & View Switchers Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Left: View Modes */}
          <div className="flex items-center gap-1.5 bg-[#141829] p-1 rounded-2xl border border-slate-800 flex-wrap">
            <button
              type="button"
              id="btn-view-gantt"
              onClick={() => setPlanningView("gantt-resources")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                planningView === "gantt-resources"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Planning Ressources (Gantt)</span>
            </button>

            <button
              type="button"
              id="btn-view-calendar"
              onClick={() => setPlanningView("calendar-grid")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                planningView === "calendar-grid"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendrier Mensuel</span>
            </button>

            <button
              type="button"
              id="btn-view-counter"
              onClick={() => setPlanningView("today-counter")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                planningView === "today-counter"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Comptoir & Départs du jour</span>
              {(departuresToday.length > 0 || returnsToday.length > 0) && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              id="btn-view-inventory-blocks"
              onClick={() => setPlanningView("inventory-blocks")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                planningView === "inventory-blocks"
                  ? "bg-amber-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>Inventaires & Blocages</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-200 text-[10px] font-mono font-bold border border-amber-700">
                {inventoryBlocks.length}
              </span>
            </button>
          </div>

          {/* Right: Date navigation & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Validation Filter */}
            <div className="flex items-center gap-1 bg-[#141829] px-2.5 py-1.5 rounded-2xl border border-slate-800 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={validationFilter}
                onChange={(e) => setValidationFilter(e.target.value as any)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
              >
                <option value="all" className="bg-[#141829] text-white">
                  Tous les dossiers
                </option>
                <option value="validated_only" className="bg-[#141829] text-white">
                  ✓ Devis Validés Uniquement
                </option>
                <option value="drafts" className="bg-[#141829] text-white">
                  Brouillons / En attente
                </option>
              </select>
            </div>

            {/* Dépôt Filter */}
            <div className="flex items-center gap-1.5 bg-[#141829] px-2.5 py-1.5 rounded-2xl border border-slate-800 text-xs">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={selectedDepotFilter}
                onChange={(e) => setSelectedDepotFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
              >
                <option value="ALL" className="bg-[#141829] text-white">
                  Tous les dépôts
                </option>
                {safeDepots.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#141829] text-white">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-1 bg-[#141829] p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 text-xs font-bold text-white min-w-[130px] text-center font-mono">
                {monthNames[month]} {year}
              </span>

              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={setToday}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition ml-1"
              >
                Aujourd'hui
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Sub-Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-800/50 text-xs">
          {/* Categories / Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 ${
                filterType === "all"
                  ? "bg-slate-700 text-white"
                  : "bg-[#141829] text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Tous Types</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("rentals")}
              className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 ${
                filterType === "rentals"
                  ? "bg-indigo-600 text-white"
                  : "bg-[#141829] text-slate-400 hover:text-slate-200"
              }`}
            >
              <Package className="w-3 h-3" />
              <span>Locations Matériel</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("studios")}
              className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 ${
                filterType === "studios"
                  ? "bg-cyan-600 text-white"
                  : "bg-[#141829] text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Locations Plateaux Studios</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("crew")}
              className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 ${
                filterType === "crew"
                  ? "bg-emerald-600 text-white"
                  : "bg-[#141829] text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Équipe Technique</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("inventory_blocks")}
              className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 ${
                filterType === "inventory_blocks"
                  ? "bg-amber-600 text-white"
                  : "bg-[#141829] text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Inventaires & Blocages ({inventoryBlocks.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher dossier, matériel, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141829] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: GANTT PLANNING RESSOURCES (MATÉRIELS & BLOCAGES PAR JOUR) */}
      {/* ========================================================================= */}
      {planningView === "gantt-resources" && (
        <div className="bg-[#0e111e] border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          {/* Header info */}
          <div className="p-4 border-b border-slate-800 bg-[#0a0d18] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Planning KROMA • {filteredItems.length} référence(s) matériel sous surveillance
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Devis Validé / Confirmé
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> En location
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Blocage Inventaire / VGP
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> En Retard
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Retourné
              </span>
            </div>
          </div>

          {/* Timeline Grid Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[950px]">
              {/* Header Days Row */}
              <div className="grid grid-cols-[240px_repeat(31,_minmax(32px,_1fr))] border-b border-slate-800 bg-[#0c0f1d] sticky top-0 z-10 text-[10px] font-mono text-slate-400 font-bold">
                <div className="p-3 border-r border-slate-800 font-sans text-slate-300">
                  Équipement / Catégorie
                </div>
                {Array.from({ length: daysInMonth }).map((_, dIdx) => {
                  const dayNum = dIdx + 1;
                  const dateObj = new Date(year, month, dayNum);
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                  const isToday = dateObj.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={dayNum}
                      className={`p-2 text-center border-r border-slate-800/60 ${
                        isToday
                          ? "bg-indigo-600/30 text-indigo-300 font-bold"
                          : isWeekend
                          ? "bg-slate-900/60 text-slate-400"
                          : ""
                      }`}
                    >
                      <span>{dayNum}</span>
                    </div>
                  );
                })}
              </div>

              {/* Rows per item */}
              <div className="divide-y divide-slate-800/80">
                {filteredItems.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs">
                    Aucun matériel ne correspond aux filtres sélectionnés.
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const bookings = getItemBookingsForMonth(item.id, item.category || "Général", item.depotId);

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-[240px_repeat(31,_minmax(32px,_1fr))] hover:bg-[#131728] transition items-center text-xs group relative min-h-[52px]"
                      >
                        {/* Left column: Item info */}
                        <div
                          className="p-3 border-r border-slate-800 flex items-center justify-between cursor-pointer group-hover:bg-[#161a2e]"
                          onClick={() => onSelectProduct && onSelectProduct(item)}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-bold text-white block truncate text-xs group-hover:text-indigo-300 transition">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">
                              {item.sku} • Stock : {item.availableQuantity}/{item.totalQuantity}
                            </span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 font-mono">
                            {item.rentalRatePerDay || 0}€/j
                          </span>
                        </div>

                        {/* Month Days Track with Booking & Blocking Bars */}
                        <div className="col-span-31 grid grid-cols-31 h-full relative items-center">
                          {/* Grid lines */}
                          {Array.from({ length: daysInMonth }).map((_, dIdx) => {
                            const dayNum = dIdx + 1;
                            const dateObj = new Date(year, month, dayNum);
                            const isToday = dateObj.toDateString() === new Date().toDateString();
                            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                            return (
                              <div
                                key={dIdx}
                                className={`h-full border-r border-slate-800/40 ${
                                  isToday ? "bg-indigo-500/10" : isWeekend ? "bg-slate-900/40" : ""
                                }`}
                              />
                            );
                          })}

                          {/* Render booking & inventory bars overlaid on the days */}
                          {bookings.map((b, bIdx) => {
                            const colStart = b.startDay;
                            const span = Math.max(1, b.endDay - b.startDay + 1);

                            if (b.isBlock && b.block) {
                              return (
                                <div
                                  key={`blk-${bIdx}`}
                                  onClick={() => handleOpenEditBlock(b.block!)}
                                  style={{
                                    gridColumnStart: colStart,
                                    gridColumnEnd: `span ${span}`,
                                  }}
                                  className={`absolute h-7 rounded-lg border px-2 flex items-center justify-between text-[10px] font-bold shadow-md cursor-pointer transition transform hover:scale-[1.02] z-20 truncate ${b.color}`}
                                  title={`BLOCAGE INVENTAIRE: ${b.block.title} - Du ${b.block.startDate} au ${b.block.endDate}`}
                                >
                                  <div className="flex items-center gap-1 truncate">
                                    <ShieldAlert className="w-3 h-3 text-amber-300 shrink-0" />
                                    <span className="truncate">{b.block.title}</span>
                                  </div>
                                  <span className="font-mono text-[9px] ml-1 shrink-0 bg-amber-950/80 px-1 rounded">
                                    BLOCAGE
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={bIdx}
                                onClick={() => b.quote && onSelectQuote && onSelectQuote(b.quote)}
                                style={{
                                  gridColumnStart: colStart,
                                  gridColumnEnd: `span ${span}`,
                                }}
                                className={`absolute h-7 rounded-lg border px-2 flex items-center justify-between text-[10px] font-bold shadow-md cursor-pointer transition transform hover:scale-[1.02] z-10 truncate ${b.color}`}
                                title={`${b.clientName} (${b.quote?.quoteNumber}) - Du ${b.quote?.startDate.slice(0, 10)} au ${b.quote?.endDate.slice(0, 10)}`}
                              >
                                <span className="truncate">{b.clientName}</span>
                                <span className="font-mono text-[9px] ml-1 shrink-0 opacity-80">
                                  x{b.qty}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CALENDRIER MENSUEL TRADITIONNEL (GRILLE) */}
      {/* ========================================================================= */}
      {planningView === "calendar-grid" && (
        <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Jeu</div>
            <div>Ven</div>
            <div className="text-indigo-400">Sam</div>
            <div className="text-indigo-400">Dim</div>
          </div>

          {/* Days Cells Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank leading days */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[120px] rounded-2xl bg-[#090b14]/50 border border-slate-900" />
            ))}

            {/* Actual month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const events = getEventsForDate(dateStr);
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

              return (
                <div
                  key={day}
                  className={`min-h-[120px] p-2.5 rounded-2xl border transition flex flex-col justify-between ${
                    isToday
                      ? "bg-indigo-950/30 border-indigo-500/70 shadow-lg shadow-indigo-950/40"
                      : "bg-[#121628] border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center font-mono ${
                        isToday ? "bg-indigo-600 text-white shadow" : "text-slate-300"
                      }`}
                    >
                      {day}
                    </span>
                    {events.length > 0 && (
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">
                        {events.length} evt{events.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Events list in cell */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] pr-0.5">
                    {events.slice(0, 3).map((evt) => {
                      if (evt.type === "inventory_block") {
                        return (
                          <div
                            key={evt.id}
                            onClick={() => evt.blockRef && handleOpenEditBlock(evt.blockRef)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold truncate cursor-pointer transition bg-amber-950/80 text-amber-200 border border-amber-600 flex items-center gap-1 shadow-sm"
                            title={`${evt.title} - ${evt.subtitle}`}
                          >
                            <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{evt.title}</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={evt.id}
                          onClick={() => evt.quoteRef && onSelectQuote && onSelectQuote(evt.quoteRef)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold truncate cursor-pointer transition ${
                            evt.status === "overdue"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : evt.type === "studio"
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                              : evt.type === "crew"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : evt.isValidated
                              ? "bg-cyan-950/90 text-cyan-200 border border-cyan-600"
                              : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                          }`}
                          title={`${evt.title} - ${evt.subtitle}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{evt.title}</span>
                            {evt.depositInfo?.amount ? (
                              <span className="text-[9px] px-1 rounded bg-black/40 font-mono shrink-0">
                                {evt.depositInfo.amount}€
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    {events.length > 3 && (
                      <div className="text-[9px] text-slate-500 text-center font-bold">
                        +{events.length - 3} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: KROMA COMPTOIR & RETOURS / ENLÈVEMENTS DU JOUR */}
      {/* ========================================================================= */}
      {planningView === "today-counter" && (
        <div className="space-y-6">
          {/* Active Inventory Blocks Alert if any */}
          {inventoryBlocksToday.length > 0 && (
            <div className="p-4 rounded-3xl bg-amber-950/30 border border-amber-600/60 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {inventoryBlocksToday.length} Blocage(s) d'Inventaire / Maintenance Actif(s) Aujourd'hui
                    </h4>
                    <p className="text-xs text-amber-200/80">
                      Les sorties matériels sur les catégories concernées sont bloquées ou requièrent validation responsable.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPlanningView("inventory-blocks")}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
                >
                  Voir les détails
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inventoryBlocksToday.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleOpenEditBlock(b)}
                    className="p-3 rounded-2xl bg-[#141829] border border-amber-500/40 flex items-center justify-between cursor-pointer hover:border-amber-400"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{b.title}</div>
                      <div className="text-[11px] text-slate-400">
                        Catégorie : <strong className="text-amber-300">{b.affectedCategory || "Tout le parc"}</strong> • Dépôt : {b.depotName}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-950 text-amber-300 text-[10px] font-bold border border-amber-800">
                      {b.status === "in_progress" ? "En cours" : "Prévu"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Departures column */}
            <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Enlèvements Prévus Aujourd'hui</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-xs font-bold font-mono">
                  {departuresToday.length}
                </span>
              </div>

              <div className="space-y-3">
                {departuresToday.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Aucun enlèvement prévu pour aujourd'hui.
                  </div>
                ) : (
                  departuresToday.map((q) => {
                    const isValidated = q.status === "accepted" || q.status === "invoiced" || q.status === "paid";
                    return (
                      <div
                        key={q.id}
                        onClick={() => onSelectQuote && onSelectQuote(q)}
                        className="p-4 rounded-2xl bg-[#141829] border border-slate-800 hover:border-indigo-500 transition cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{q.clientName}</span>
                            {isValidated && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                                ✓ Validé
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-indigo-400 font-mono font-bold">{q.quoteNumber}</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {q.rentalItems?.length || 0} référence(s) • Total TTC : {Math.round(q.totalTTC || 0)}€
                          {q.depositAmount ? ` • Acompte versé : ${q.depositAmount}€` : ""}
                        </p>
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-indigo-400" /> {q.depotName || "Dépôt Central"}
                          </span>
                          <span className="text-amber-400 font-bold">Prêt pour check-out</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Returns column */}
            <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Retours Attendus Aujourd'hui</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold font-mono">
                  {returnsToday.length}
                </span>
              </div>

              <div className="space-y-3">
                {returnsToday.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Aucun retour programmé aujourd'hui.
                  </div>
                ) : (
                  returnsToday.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => onSelectQuote && onSelectQuote(q)}
                      className="p-4 rounded-2xl bg-[#141829] border border-slate-800 hover:border-emerald-500 transition cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{q.clientName}</span>
                        <span className="text-xs text-emerald-400 font-mono font-bold">{q.quoteNumber}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {q.rentalItems?.length || 0} référence(s) à contrôler (Check-in KROMA)
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" /> {q.depotName || "Dépôt Central"}
                        </span>
                        <span className="text-emerald-400 font-bold">Contrôle retour requis</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: INVENTAIRES & BLOCAGES DÉDIÉ */}
      {/* ========================================================================= */}
      {planningView === "inventory-blocks" && (
        <div className="space-y-5">
          {/* Header Card */}
          <div className="bg-[#0e111e] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Gestion des Blocages d'Inventaire & Maintenances VGP</h3>
                <p className="text-xs text-slate-400">
                  Planifiez les créneaux d'inventaire général, contrôles réglementaires et recensements périodiques visibles par toute l'équipe.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateBlock}
              className="px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Blocage d'Inventaire</span>
            </button>
          </div>

          {/* List of Inventory Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventoryBlocks.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-[#0e111e] border border-slate-800 rounded-3xl text-slate-500 text-xs">
                Aucun blocage d'inventaire ne correspond aux critères sélectionnés.
              </div>
            ) : (
              filteredInventoryBlocks.map((blk) => {
                const conflicts = getConflictsForBlock(blk);
                const isOngoing = new Date(blk.startDate) <= new Date() && new Date(blk.endDate) >= new Date();

                return (
                  <div
                    key={blk.id}
                    className={`bg-[#0e111e] border rounded-3xl p-5 shadow-xl transition flex flex-col justify-between space-y-4 ${
                      isOngoing
                        ? "border-amber-500/70 bg-amber-950/10"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top status line */}
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            blk.type === "general_inventory"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : blk.type === "maintenance_vgp"
                              ? "bg-purple-950 text-purple-300 border border-purple-800"
                              : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                          }`}
                        >
                          {blk.type === "general_inventory"
                            ? "Inventaire Général"
                            : blk.type === "maintenance_vgp"
                            ? "Contrôle VGP / Révision"
                            : "Inventaire Tournant"}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            blk.status === "completed"
                              ? "bg-emerald-950 text-emerald-300"
                              : isOngoing
                              ? "bg-amber-950 text-amber-300 animate-pulse border border-amber-700"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {blk.status === "completed" ? "Terminé" : isOngoing ? "En cours" : "Planifié"}
                        </span>
                      </div>

                      {/* Title & Dates */}
                      <div>
                        <h4 className="text-sm font-bold text-white hover:text-amber-300 transition">
                          {blk.title}
                        </h4>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>
                            Du {new Date(blk.startDate).toLocaleDateString("fr-FR")} au {new Date(blk.endDate).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>

                      {/* Scope properties */}
                      <div className="p-3 rounded-2xl bg-[#141829] border border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">Dépôt concerné :</span>
                          <span className="font-bold">{blk.depotName || "Tous les dépôts"}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">Catégorie :</span>
                          <span className="font-bold text-amber-300">{blk.affectedCategory || "Tout le parc"}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500">Blocage locations :</span>
                          <span className={`font-bold ${blk.blockRentals ? "text-rose-400" : "text-slate-400"}`}>
                            {blk.blockRentals ? "Oui (Strict)" : "Informatif"}
                          </span>
                        </div>
                      </div>

                      {/* Technicians & Notes */}
                      {blk.assignedTechnicians && blk.assignedTechnicians.length > 0 && (
                        <div className="text-xs text-slate-400">
                          <span className="text-slate-500">Affecté à : </span>
                          <span className="text-slate-300 font-medium">{blk.assignedTechnicians.join(", ")}</span>
                        </div>
                      )}

                      {blk.notes && (
                        <p className="text-[11px] text-slate-400 italic bg-[#0c0e18] p-2.5 rounded-xl border border-slate-800/80">
                          "{blk.notes}"
                        </p>
                      )}

                      {/* Conflicts Alert */}
                      {conflicts.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>{conflicts.length} conflit(s) avec des dossiers de location !</span>
                          </div>
                          <div className="text-[10px] text-slate-300 space-y-0.5">
                            {conflicts.slice(0, 2).map((c) => (
                              <div key={c.id} className="truncate">
                                • {c.clientName} ({c.quoteNumber})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBlock(blk)}
                        className="px-3 py-1.5 rounded-xl bg-[#141829] hover:bg-[#1f253f] text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Modifier</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(blk.id)}
                        className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                        title="Supprimer ce blocage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INVENTORY BLOCK CREATION / EDIT MODAL */}
      {/* ========================================================================= */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0f1222] border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingBlock ? "Modifier le Blocage d'Inventaire" : "Planifier un Blocage d'Inventaire"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Définir la plage horaire et le matériel concerné pour prévenir les réservations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Intitulé du Blocage / Inventaire *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Inventaire Annuel Caméras, Contrôle VGP Levage..."
                  value={blockFormTitle}
                  onChange={(e) => setBlockFormTitle(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Type d'opération</label>
                  <select
                    value={blockFormType}
                    onChange={(e) => setBlockFormType(e.target.value as any)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="general_inventory">Inventaire Général (Complet)</option>
                    <option value="partial_inventory">Inventaire Tournant (Partiel)</option>
                    <option value="maintenance_vgp">Contrôle VGP / Révision Tech</option>
                    <option value="depot_closure">Fermeture Exceptionnelle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Statut</label>
                  <select
                    value={blockFormStatus}
                    onChange={(e) => setBlockFormStatus(e.target.value as any)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="scheduled">Planifié / Prévu</option>
                    <option value="in_progress">En cours d'exécution</option>
                    <option value="completed">Clôturé & Validé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Date de Début *</label>
                  <input
                    type="date"
                    required
                    value={blockFormStartDate}
                    onChange={(e) => setBlockFormStartDate(e.target.value)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Date de Fin *</label>
                  <input
                    type="date"
                    required
                    value={blockFormEndDate}
                    onChange={(e) => setBlockFormEndDate(e.target.value)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Dépôt Concerné</label>
                  <select
                    value={blockFormDepotId}
                    onChange={(e) => setBlockFormDepotId(e.target.value)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="ALL">Tous les dépôts</option>
                    {safeDepots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Catégorie Matériel Affectée</label>
                  <select
                    value={blockFormCategory}
                    onChange={(e) => setBlockFormCategory(e.target.value)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="ALL">Tout le parc matériel (Global)</option>
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Équipe & Techniciens assignés (séparés par virgules)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Marc V., Sarah L., Bureau Veritas..."
                  value={blockFormTechnicians}
                  onChange={(e) => setBlockFormTechnicians(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#141829] border border-slate-800">
                <input
                  type="checkbox"
                  id="block-rentals-toggle"
                  checked={blockFormBlockRentals}
                  onChange={(e) => setBlockFormBlockRentals(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 bg-slate-900 border-slate-700"
                />
                <label htmlFor="block-rentals-toggle" className="text-slate-200 font-medium cursor-pointer">
                  Bloquer strictement les sorties et afficher une alerte de collision sur les devis
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Notes & Consignes Opérationnelles</label>
                <textarea
                  rows={2}
                  placeholder="Consignes particulières pour l'équipe ou l'organisme de contrôle..."
                  value={blockFormNotes}
                  onChange={(e) => setBlockFormNotes(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {editingBlock && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(editingBlock.id)}
                    className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsBlockModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-lg shadow-amber-600/30 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingBlock ? "Enregistrer les modifications" : "Créer le Blocage"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MULTI-SCREEN SELECTION & PROJECTOR MODAL */}
      {/* ========================================================================= */}
      {showScreenPickerModal && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0f1222] border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6 p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Écrans & Affichage Déporté Régie</h3>
                  <p className="text-xs text-slate-400">
                    Détection automatique des moniteurs et régies pour projeter le calendrier en permanence
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScreenPickerModal(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Screens List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-purple-400" />
                  Écrans Détectés ({detectedScreens.length})
                </span>
                <button
                  type="button"
                  onClick={detectConnectedScreens}
                  disabled={isDetectingScreens}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDetectingScreens ? "animate-spin" : ""}`} />
                  <span>Re-scanner les écrans</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {detectedScreens.map((screen, idx) => (
                  <div
                    key={screen.id || idx}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                      screen.isPrimary
                        ? "bg-[#14182e] border-indigo-500/50"
                        : "bg-[#13172b] border-purple-500/50 shadow-lg shadow-purple-950/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            screen.isPrimary
                              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30"
                              : "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {screen.isPrimary ? <Laptop className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{screen.name}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {screen.width} × {screen.height} px • {(screen.devicePixelRatio || 1) > 1 ? `HiDPI @${screen.devicePixelRatio}x` : "Standard"}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          screen.isPrimary
                            ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                            : "bg-purple-950 text-purple-300 border border-purple-800 animate-pulse"
                        }`}
                      >
                        {screen.isPrimary ? "Principal" : "Secondaire / Régie"}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {screen.left !== undefined ? `Coord: X=${screen.left}, Y=${screen.top}` : "Connecté"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLaunchOnScreen(screen)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                          screen.isPrimary
                            ? "bg-slate-800 hover:bg-slate-700 text-white"
                            : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30"
                        }`}
                      >
                        <Cast className="w-3.5 h-3.5" />
                        <span>{screen.isPrimary ? "Ouvrir Fenêtre" : "Projeter sur cet Écran"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Broadcast Options & Permanent URL */}
            <div className="p-4 rounded-2xl bg-[#141829] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Lien d'Affichage Kiosk 24/7 (Smart TV / Régie)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/?mode=calendar-broadcast&depot=${selectedDepotFilter}`;
                    navigator.clipboard.writeText(url);
                    setCopiedBroadcastUrl(true);
                    setTimeout(() => setCopiedBroadcastUrl(false), 2500);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedBroadcastUrl ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">URL Copiée !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Copier le lien permanent</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Vous pouvez ouvrir ce lien directement sur un second moniteur, une smart TV murale ou un boîtier Raspberry Pi.
                Les modifications d'agenda et retours s'actualisent en direct.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowScreenPickerModal(false);
                  setIsSecondScreenMode(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-2"
              >
                <Tv className="w-4 h-4" />
                <span>Tester le HUD plein écran dans cet onglet</span>
              </button>

              <button
                type="button"
                onClick={() => setShowScreenPickerModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
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
