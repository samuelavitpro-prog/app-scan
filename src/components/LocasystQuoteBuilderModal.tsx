import React, { useState, useMemo } from "react";
import {
  X,
  Package,
  Calendar,
  Building2,
  Users,
  Plus,
  Trash2,
  Sparkles,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShoppingBag,
  SlidersHorizontal,
  MapPin,
  Truck,
  ShieldCheck,
  Receipt,
  Minus,
  Check,
  Box,
  Mic,
  Camera,
  Sun,
  Clapperboard,
  Layers,
  ListFilter,
} from "lucide-react";
import {
  ClientQuote,
  QuoteItemLine,
  QuoteStudioLine,
  QuoteCrewLine,
  InventoryItem,
  StudioSpace,
  TechnicianProfile,
  AppSettings,
  AudiovisualChapter,
  ClientRecord,
  SupplierRecord,
} from "../types";
import {
  AUDIOVISUAL_CHAPTERS,
  computeAudiovisualCoefficient,
  DEFAULT_RENTAL_COEFFICIENTS,
  computeSubRentalMargin,
  inferAudiovisualChapter,
} from "../utils/coefficients";
import { calculateQuoteLogistics } from "../utils/logisticsCalculator";
import { SAMPLE_LUMENS_QUOTE } from "../data/sampleLumensQuote";

interface LocasystQuoteBuilderModalProps {
  editingQuote: ClientQuote | null;
  clients?: ClientRecord[];
  inventoryItems?: InventoryItem[];
  studios?: StudioSpace[];
  technicians?: TechnicianProfile[];
  suppliers?: SupplierRecord[];
  settings?: AppSettings;
  prefillClient?: ClientRecord | null;
  onClose: () => void;
  onSave: (quote: Partial<ClientQuote>) => Promise<void> | void;
}

const DEMO_MATERIAL: InventoryItem[] = [
  { id: "demo-camera-fx6", sku: "CAM-FX6", name: "Sony FX6", category: "Caméra", brand: "Sony", description: "Caméra cinéma plein format", totalQuantity: 4, availableQuantity: 3, rentedQuantity: 1, minStockAlert: 1, unitPrice: 180, rentalRatePerDay: 180, replacementValue: 6000, location: "Rayon A1", condition: "Très bon état", imageUrl: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=320&q=80", barcode: "DEMO-CAM-001", tags: ["caméra", "cinéma"], createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "demo-lens-2470", sku: "OPT-2470", name: "FE 24–70 mm f/2.8 GM II", category: "Optique", brand: "Sony", description: "Zoom standard lumineux", totalQuantity: 6, availableQuantity: 5, rentedQuantity: 1, minStockAlert: 1, unitPrice: 85, rentalRatePerDay: 85, replacementValue: 2200, location: "Rayon B2", condition: "Très bon état", imageUrl: "https://images.unsplash.com/photo-1606986628253-3c2f4f7d39a4?auto=format&fit=crop&w=320&q=80", barcode: "DEMO-OPT-001", tags: ["objectif", "zoom"], createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "demo-light-600d", sku: "LUM-600D", name: "Aputure 600D Pro", category: "Lumière", brand: "Aputure", description: "Projecteur LED daylight", totalQuantity: 8, availableQuantity: 8, rentedQuantity: 0, minStockAlert: 2, unitPrice: 110, rentalRatePerDay: 110, replacementValue: 1900, location: "Rayon C1", condition: "Neuf", imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=320&q=80", barcode: "DEMO-LUM-001", tags: ["led", "projecteur"], createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "demo-audio-uwp", sku: "SON-UWP", name: "Kit HF UWP-D", category: "Son", brand: "Sony", description: "Micro-cravate HF double", totalQuantity: 10, availableQuantity: 7, rentedQuantity: 3, minStockAlert: 2, unitPrice: 65, rentalRatePerDay: 65, replacementValue: 900, location: "Rayon D3", condition: "Bon état", imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=320&q=80", barcode: "DEMO-SON-001", tags: ["micro", "hf"], createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "demo-monitor-ninja", sku: "VID-NINJA", name: "Ninja V 5\"", category: "Vidéo", brand: "Atomos", description: "Moniteur-enregistreur 4K", totalQuantity: 5, availableQuantity: 4, rentedQuantity: 1, minStockAlert: 1, unitPrice: 55, rentalRatePerDay: 55, replacementValue: 850, location: "Rayon E1", condition: "Très bon état", imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=320&q=80", barcode: "DEMO-VID-001", tags: ["moniteur", "enregistreur"], createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "demo-tripod", sku: "MAC-TRIP", name: "Trépied vidéo 75 mm", category: "Machinerie", brand: "Manfrotto", description: "Trépied avec tête fluide", totalQuantity: 12, availableQuantity: 10, rentedQuantity: 2, minStockAlert: 2, unitPrice: 35, rentalRatePerDay: 35, replacementValue: 700, location: "Rayon F2", condition: "Bon état", imageUrl: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=320&q=80", barcode: "DEMO-MAC-001", tags: ["pied", "support"], createdAt: "2026-01-01", updatedAt: "2026-01-01" },
];

export const LocasystQuoteBuilderModal: React.FC<LocasystQuoteBuilderModalProps> = ({
  editingQuote,
  clients = [],
  inventoryItems = [],
  studios = [],
  technicians = [],
  suppliers = [],
  settings,
  prefillClient,
  onClose,
  onSave,
}) => {
  // 3-step wizard step
  const [builderStep, setBuilderStep] = useState<1 | 2 | 3>(1);
  const [isMaterialImporterOpen, setIsMaterialImporterOpen] = useState(false);

  // General event & client details
  const [selectedClientId, setSelectedClientId] = useState<string>(
    editingQuote?.clientId || prefillClient?.id || ""
  );
  const [clientName, setClientName] = useState<string>(
    editingQuote?.clientName || prefillClient?.contactPerson || ""
  );
  const [clientCompany, setClientCompany] = useState<string>(
    editingQuote?.clientCompany || prefillClient?.companyName || ""
  );
  const [clientEmail, setClientEmail] = useState<string>(
    editingQuote?.clientEmail || prefillClient?.email || ""
  );
  const [clientPhone, setClientPhone] = useState<string>(
    editingQuote?.clientPhone || prefillClient?.phone || prefillClient?.mobile || ""
  );
  const [clientAddress, setClientAddress] = useState<string>(
    editingQuote?.clientAddress || prefillClient?.billingAddress || ""
  );
  const [projectName, setProjectName] = useState<string>(
    editingQuote?.projectName || ""
  );
  const [clientProjectRef, setClientProjectRef] = useState<string>(
    editingQuote?.clientProjectRef || ""
  );
  const [eventLocation, setEventLocation] = useState<string>(
    editingQuote?.eventLocation || prefillClient?.deliveryAddress || "Palais des Congrès / Salle Polyvalente"
  );
  const [projectManager, setProjectManager] = useState<string>(
    editingQuote?.projectManager || editingQuote?.accountManager || "Bertrand BROT"
  );
  const [projectManagerPhone, setProjectManagerPhone] = useState<string>(
    editingQuote?.projectManagerPhone || editingQuote?.accountManagerPhone || "06 11 60 78 77"
  );
  const [technicalDirector, setTechnicalDirector] = useState<string>(
    editingQuote?.technicalDirector || ""
  );
  const [technicalDirectorPhone, setTechnicalDirectorPhone] = useState<string>(
    editingQuote?.technicalDirectorPhone || ""
  );
  const [onSiteContactName, setOnSiteContactName] = useState<string>(
    editingQuote?.onSiteContactName || ""
  );
  const [onSiteContactPhone, setOnSiteContactPhone] = useState<string>(
    editingQuote?.onSiteContactPhone || ""
  );
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  // Dates & Planning
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [departureDate, setDepartureDate] = useState<string>(
    editingQuote?.departureDate || todayStr
  );
  const [departureTimeSlot, setDepartureTimeSlot] = useState<string>(
    editingQuote?.departureTimeSlot || "Matin (09h-12h)"
  );
  const [shootStartDate, setShootStartDate] = useState<string>(
    editingQuote?.shootStartDate || todayStr
  );
  const [shootEndDate, setShootEndDate] = useState<string>(
    editingQuote?.shootEndDate || tomorrowStr
  );
  const [returnDate, setReturnDate] = useState<string>(
    editingQuote?.returnDate || tomorrowStr
  );
  const [returnTimeSlot, setReturnTimeSlot] = useState<string>(
    editingQuote?.returnTimeSlot || "Après-midi (14h-18h)"
  );

  const [setupSchedule, setSetupSchedule] = useState<string>(
    editingQuote?.setupSchedule || "Montage : Jour J - 08h00"
  );
  const [exploitationSchedule, setExploitationSchedule] = useState<string>(
    editingQuote?.exploitationSchedule || "Exploitation : 14h00 - 23h30"
  );
  const [teardownSchedule, setTeardownSchedule] = useState<string>(
    editingQuote?.teardownSchedule || "Démontage : Fin de prestation (Nuit)"
  );

  // Dégressif
  const [coeffPreset, setCoeffPreset] = useState<
    "auto" | "1j" | "2j" | "3j" | "4j" | "weekend" | "week" | "2weeks" | "3weeks" | "month" | "custom"
  >(editingQuote?.appliedCoeffPreset || "auto");
  const [customCoeffValue, setCustomCoeffValue] = useState<number>(
    editingQuote?.globalRentalCoefficient || 1.0
  );

  // Lines
  const [rentalItems, setRentalItems] = useState<QuoteItemLine[]>(
    editingQuote?.rentalItems || []
  );
  const [studioRentals, setStudioRentals] = useState<QuoteStudioLine[]>(
    editingQuote?.studioRentals || []
  );
  const [crewStaff, setCrewStaff] = useState<QuoteCrewLine[]>(
    editingQuote?.crewStaff || []
  );

  // Financials & Discounts
  const [discountGlobal, setDiscountGlobal] = useState<number>(
    editingQuote?.discountGlobalPercent || 0
  );
  const [taxRate] = useState<number>(editingQuote?.taxRate || 20);
  const [paymentTermsDays, setPaymentTermsDays] = useState<string>(
    editingQuote?.paymentTermsDays || "Comptant à réception"
  );
  const [paymentMode, setPaymentMode] = useState<string>(
    editingQuote?.paymentMode || "Virement bancaire"
  );
  const [quoteStatus, setQuoteStatus] = useState<ClientQuote["status"]>(
    editingQuote?.status || "draft"
  );

  // Acompte
  const [depositPercent, setDepositPercent] = useState<number>(
    editingQuote?.depositPercent !== undefined ? editingQuote.depositPercent : 30
  );
  const [depositAmount] = useState<number>(
    editingQuote?.depositAmount || 0
  );
  const [isCustomDepositAmount, setIsCustomDepositAmount] = useState<boolean>(false);
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<
    "virement" | "cb" | "cheque" | "especes" | "traite"
  >(editingQuote?.depositPaymentMethod || "virement");
  const [depositStatus, setDepositStatus] = useState<
    "pending" | "received" | "not_required"
  >(editingQuote?.depositStatus || "pending");

  // Caution
  const [depositGuaranteeType, setDepositGuaranteeType] = useState<
    "imprint_cb" | "check" | "insurance_letter" | "bank_transfer" | "none"
  >(editingQuote?.depositGuaranteeType || "imprint_cb");
  const [depositGuaranteeAmount] = useState<number>(
    editingQuote?.depositGuaranteeAmount || 0
  );
  const [isCustomGuaranteeAmount] = useState<boolean>(false);

  // Active step 2 item tab & catalog filters
  const [activeItemTab, setActiveItemTab] = useState<"equipment" | "studios" | "technicians">("equipment");
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>("all");
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<string>("all");
  const [catalogQuantities, setCatalogQuantities] = useState<Record<string, number>>({});
  
  // Dropdown equipment selector state
  const [selectedDropdownItemId, setSelectedDropdownItemId] = useState<string>("");
  const [dropdownQuantity, setDropdownQuantity] = useState<number>(1);
  const [dropdownSuccessToast, setDropdownSuccessToast] = useState<string | null>(null);

  // Safe catalog list (merges inventoryItems and comprehensive audiovisual defaults)
  const safeCatalogList = useMemo(() => {
    const base = inventoryItems && inventoryItems.length > 0 ? inventoryItems : DEMO_MATERIAL;
    return base;
  }, [inventoryItems]);

  // Grouped catalog items for categorized <optgroup> dropdown
  const groupedCatalogItems = useMemo(() => {
    const groups: { [key: string]: InventoryItem[] } = {
      "🎥 Caméras & Tournage": [],
      "🔍 Optiques & Objectifs": [],
      "💡 Lumière & Projecteurs": [],
      "🎙️ Sonorisation & Microphones HF": [],
      "🎛️ Vidéo, Régie & Écrans": [],
      "🏗️ Machinerie & Structure": [],
      "⚡ Énergie, Câblage & Divers": [],
    };

    safeCatalogList.forEach((item) => {
      const catLower = (item.category || "").toLowerCase();
      const nameLower = item.name.toLowerCase();

      if (catLower.includes("cam") || nameLower.includes("camera") || nameLower.includes("caméra") || nameLower.includes("boîtier") || nameLower.includes("alexa") || nameLower.includes("fx3") || nameLower.includes("fx6")) {
        groups["🎥 Caméras & Tournage"].push(item);
      } else if (catLower.includes("opt") || nameLower.includes("objectif") || nameLower.includes("zoom") || nameLower.includes("prime") || nameLower.includes("zeiss")) {
        groups["🔍 Optiques & Objectifs"].push(item);
      } else if (catLower.includes("lum") || catLower.includes("eclairage") || nameLower.includes("aputure") || nameLower.includes("led") || nameLower.includes("projecteur") || nameLower.includes("astera") || nameLower.includes("skypanel")) {
        groups["💡 Lumière & Projecteurs"].push(item);
      } else if (catLower.includes("son") || catLower.includes("audio") || nameLower.includes("shure") || nameLower.includes("micro") || nameLower.includes("sennheiser") || nameLower.includes("mixette") || nameLower.includes("zoom") || nameLower.includes("enceinte") || nameLower.includes("lacoustics")) {
        groups["🎙️ Sonorisation & Microphones HF"].push(item);
      } else if (catLower.includes("vid") || catLower.includes("regie") || nameLower.includes("atem") || nameLower.includes("ninja") || nameLower.includes("teradek") || nameLower.includes("projecteur") || nameLower.includes("moniteur") || nameLower.includes("écran")) {
        groups["🎛️ Vidéo, Régie & Écrans"].push(item);
      } else if (catLower.includes("mach") || catLower.includes("struct") || nameLower.includes("ronin") || nameLower.includes("trépied") || nameLower.includes("cstand") || nameLower.includes("c-stand") || nameLower.includes("pied") || nameLower.includes("truss") || nameLower.includes("manfrotto")) {
        groups["🏗️ Machinerie & Structure"].push(item);
      } else {
        groups["⚡ Énergie, Câblage & Divers"].push(item);
      }
    });

    return groups;
  }, [safeCatalogList]);

  // Client Selection helper
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const cli = clients.find((c) => c.id === clientId);
    if (cli) {
      setClientCompany(cli.companyName || "");
      setClientName(cli.contactPerson || "");
      setClientEmail(cli.email || "");
      setClientPhone(cli.phone || cli.mobile || "");
      setClientAddress(cli.billingAddress || "");
      if (cli.deliveryAddress) setEventLocation(cli.deliveryAddress);
      if (cli.onSiteContactName) setOnSiteContactName(cli.onSiteContactName);
      if (cli.onSiteContactPhone) setOnSiteContactPhone(cli.onSiteContactPhone);
      if (cli.defaultDiscountPercent !== undefined && cli.defaultDiscountPercent > 0) {
        setDiscountGlobal(cli.defaultDiscountPercent);
      }
      if (cli.paymentTermsDays) setPaymentTermsDays(cli.paymentTermsDays);
      if (cli.paymentMode) setPaymentMode(cli.paymentMode);
    }
  };

  // Shoot days calculation
  const computedShootDays = useMemo(() => {
    if (!shootStartDate || !shootEndDate) return 1;
    const start = new Date(shootStartDate).getTime();
    const end = new Date(shootEndDate).getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  }, [shootStartDate, shootEndDate]);

  // Active Dégressif Coefficient
  const activeCoefficient = useMemo(() => {
    if (coeffPreset === "custom") return customCoeffValue || 1.0;
    if (coeffPreset === "1j") return DEFAULT_RENTAL_COEFFICIENTS.day1;
    if (coeffPreset === "2j") return DEFAULT_RENTAL_COEFFICIENTS.days2;
    if (coeffPreset === "3j") return DEFAULT_RENTAL_COEFFICIENTS.days3;
    if (coeffPreset === "4j") return DEFAULT_RENTAL_COEFFICIENTS.days4;
    if (coeffPreset === "weekend") return DEFAULT_RENTAL_COEFFICIENTS.weekend;
    if (coeffPreset === "week") return DEFAULT_RENTAL_COEFFICIENTS.week;
    if (coeffPreset === "2weeks") return DEFAULT_RENTAL_COEFFICIENTS.twoWeeks;
    if (coeffPreset === "3weeks") return DEFAULT_RENTAL_COEFFICIENTS.threeWeeks;
    if (coeffPreset === "month") return DEFAULT_RENTAL_COEFFICIENTS.month;
    return computeAudiovisualCoefficient(computedShootDays);
  }, [coeffPreset, customCoeffValue, computedShootDays]);

  // Filter inventory catalog from safeCatalogList
  const filteredCatalogItems = useMemo(() => {
    return safeCatalogList.filter((item) => {
      const matchSearch =
        catalogSearch === "" ||
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(catalogSearch.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(catalogSearch.toLowerCase()));
      const matchCategory =
        catalogCategoryFilter === "all" ||
        item.category?.toLowerCase() === catalogCategoryFilter.toLowerCase();
      const matchType = catalogTypeFilter === "all" || item.managementMode === catalogTypeFilter || item.category?.toLowerCase() === catalogTypeFilter.toLowerCase();
      return matchSearch && matchCategory && matchType;
    });
  }, [safeCatalogList, catalogSearch, catalogCategoryFilter, catalogTypeFilter]);

  // Handle Add Item from Dropdown with Quantity
  const handleAddItemWithQuantity = (item: InventoryItem, qty: number = 1) => {
    const existingIndex = rentalItems.findIndex((l) => l.itemId === item.id);
    if (existingIndex >= 0) {
      handleAdjustQuantity(existingIndex, qty);
      setDropdownSuccessToast(`+${qty} "${item.name}" ajouté !`);
      setTimeout(() => setDropdownSuccessToast(null), 3000);
      return;
    }

    const chapter = inferAudiovisualChapter(item.category, item.name);
    const unitPrice = item.rentalRatePerDay || 25;
    const base = qty * unitPrice * activeCoefficient;
    const totalHT = Math.round(base * 100) / 100;

    const newLine: QuoteItemLine = {
      itemId: item.id,
      name: item.name,
      brand: item.brand || "",
      category: item.category || "Matériel",
      chapterCategory: chapter,
      quantity: qty,
      unitPricePerDay: unitPrice,
      days: computedShootDays,
      rentalCoefficient: activeCoefficient,
      discountPercent: 0,
      totalHT,
      replacementValue: item.replacementValue || 500,
      isSubRental: false,
    };

    setRentalItems((prev) => [...prev, newLine]);
    setDropdownSuccessToast(`"${item.name}" (${qty}x) ajouté au devis !`);
    setTimeout(() => setDropdownSuccessToast(null), 3000);
  };

  // Handle Add Item from Catalog to Selection
  const handleAddItemFromCatalog = (item: InventoryItem) => {
    handleAddItemWithQuantity(item, 1);
  };

  // Replace equipment in an existing line via dropdown
  const handleReplaceEquipmentInLine = (lineIndex: number, newItemId: string) => {
    const item = safeCatalogList.find((i) => i.id === newItemId);
    if (!item) return;
    const line = rentalItems[lineIndex];
    const unitPrice = item.rentalRatePerDay || 25;
    const coeff = line.rentalCoefficient ?? activeCoefficient;
    const qty = line.quantity || 1;
    const base = qty * unitPrice * coeff;
    const totalHT = Math.round(base * (1 - (line.discountPercent || 0) / 100) * 100) / 100;
    const chapter = inferAudiovisualChapter(item.category, item.name);

    handleUpdateEquipmentLine(lineIndex, {
      itemId: item.id,
      name: item.name,
      brand: item.brand || "",
      category: item.category || "Matériel",
      chapterCategory: chapter,
      unitPricePerDay: unitPrice,
      totalHT,
      replacementValue: item.replacementValue || 500,
    });
  };

  // Adjust item quantity in selection
  const handleAdjustQuantity = (index: number, delta: number) => {
    setRentalItems((prev) => {
      const line = prev[index];
      const newQty = Math.max(1, (line.quantity || 1) + delta);
      const coeff = line.rentalCoefficient ?? activeCoefficient;
      const base = newQty * line.unitPricePerDay * coeff;
      const totalHT = Math.round(base * (1 - (line.discountPercent || 0) / 100) * 100) / 100;
      let marginHT = line.marginHT;
      let marginPercent = line.marginPercent;
      if (line.isSubRental && line.subRentalCostHT) {
        const res = computeSubRentalMargin(totalHT, line.subRentalCostHT);
        marginHT = res.marginHT;
        marginPercent = res.marginPercent;
      }
      const updated = [...prev];
      updated[index] = {
        ...line,
        quantity: newQty,
        totalHT,
        marginHT,
        marginPercent,
      };
      return updated;
    });
  };

  // Apply Quick Preset Packs
  const handleApplyPresetPack = (packType: "conference" | "interview" | "lighting" | "cinema") => {
    let packLines: QuoteItemLine[] = [];
    if (packType === "conference") {
      packLines = [
        {
          itemId: `pack-conf-1-${Date.now()}`,
          name: "Pack 2 Micros HF Sans-Fil Main + Récepteur Double",
          brand: "Sennheiser EW-D",
          category: "Son",
          chapterCategory: "sound_hf",
          quantity: 1,
          unitPricePerDay: 65,
          days: computedShootDays,
          rentalCoefficient: activeCoefficient,
          discountPercent: 0,
          totalHT: 65 * activeCoefficient,
          replacementValue: 1200,
          isSubRental: false,
        },
        {
          itemId: `pack-conf-2-${Date.now()}`,
          name: "Enceinte Amplifiée 1000W sur Pied (Paire)",
          brand: "QSC K10.2",
          category: "Son",
          chapterCategory: "sound_hf",
          quantity: 2,
          unitPricePerDay: 45,
          days: computedShootDays,
          rentalCoefficient: activeCoefficient,
          discountPercent: 0,
          totalHT: 90 * activeCoefficient,
          replacementValue: 1800,
          isSubRental: false,
        },
        {
          itemId: `pack-conf-3-${Date.now()}`,
          name: "Console de Mixage Numérique 16 Canaux",
          brand: "Yamaha TF1",
          category: "Son",
          chapterCategory: "sound_hf",
          quantity: 1,
          unitPricePerDay: 80,
          days: computedShootDays,
          rentalCoefficient: activeCoefficient,
          discountPercent: 0,
          totalHT: 80 * activeCoefficient,
          replacementValue: 2400,
          isSubRental: false,
        },
      ];
    } else if (packType === "interview") {
      packLines = [
        {
          itemId: `pack-int-1-${Date.now()}`,
          name: "Caméra 4K Plein Format Cinéma FX6",
          brand: "Sony FX6",
          category: "Camera",
          chapterCategory: "camera_optics",
          quantity: 2,
          unitPricePerDay: 180,
          days: computedShootDays,
          rentalCoefficient: activeCoefficient,
          discountPercent: 0,
          totalHT: 360 * activeCoefficient,
          replacementValue: 12000,
          isSubRental: false,
        },
        {
          itemId: `pack-int-2-${Date.now()}`,
          name: "Kit 2 Projecteurs LED Bicolor 300W + Boîtes à lumière",
          brand: "Aputure 300d II",
          category: "Lumiere",
          chapterCategory: "lighting_grip",
          quantity: 2,
          unitPricePerDay: 55,
          days: computedShootDays,
          rentalCoefficient: activeCoefficient,
          discountPercent: 0,
          totalHT: 110 * activeCoefficient,
          replacementValue: 2600,
          isSubRental: false,
        },
      ];
    } else if (packType === "lighting") {
      packLines = [
        {
          itemId: `pack-light-1-${Date.now()}`,
          name: "Projecteur LED RGBAC 600W Haut Rendement",
          brand: "Aputure 600c Pro",
          category: "Lumiere",
          chapterCategory: "lighting_grip",
          quantity: 2,
          unitPricePerDay: 140,
          days: computedShootDays,
          rentalCoefficient: activeCoefficient,
          discountPercent: 0,
          totalHT: 280 * activeCoefficient,
          replacementValue: 6500,
          isSubRental: false,
        },
        {
          itemId: `pack-light-2-${Date.now()}`,
          name: "Kit 8 Tubes LED Autonomes Pixel Titan",
          brand: "Astera Titan Tube",
          category: "Lumiere",
          chapterCategory: "lighting_grip",
          quantity: 1,
          unitPricePerDay: 220,
          days: computedShootDays,
          rentalCoefficient: activeCoefficient,
          discountPercent: 0,
          totalHT: 220 * activeCoefficient,
          replacementValue: 5800,
          isSubRental: false,
        },
      ];
    } else if (packType === "cinema") {
      packLines = [
        {
          itemId: `pack-cine-1-${Date.now()}`,
          name: "Caméra Grand Format Arri Alexa Mini LF",
          brand: "ARRI Alexa Mini LF",
          category: "Camera",
          chapterCategory: "camera_optics",
          quantity: 1,
          unitPricePerDay: 750,
          days: computedShootDays,
          rentalCoefficient: activeCoefficient,
          discountPercent: 0,
          totalHT: 750 * activeCoefficient,
          replacementValue: 65000,
          isSubRental: false,
        },
        {
          itemId: `pack-cine-2-${Date.now()}`,
          name: "Série 5 Optiques Cinéma Plein Format T1.5",
          brand: "Zeiss Supreme Prime",
          category: "Optique",
          chapterCategory: "lenses_filters",
          quantity: 1,
          unitPricePerDay: 550,
          days: computedShootDays,
          rentalCoefficient: activeCoefficient,
          discountPercent: 0,
          totalHT: 550 * activeCoefficient,
          replacementValue: 95000,
          isSubRental: false,
        },
      ];
    }

    setRentalItems((prev) => [...prev, ...packLines]);
  };

  // Add a manual equipment line
  const handleAddEquipmentLine = (chapter: AudiovisualChapter = "consumables_sales") => {
    const newLine: QuoteItemLine = {
      itemId: `manual-line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `Matériel ${chapter}`,
      brand: "",
      category: "Divers",
      chapterCategory: chapter,
      quantity: 1,
      unitPricePerDay: 50,
      days: computedShootDays,
      rentalCoefficient: activeCoefficient,
      discountPercent: 0,
      totalHT: 50 * activeCoefficient,
      isSubRental: false,
    };
    setRentalItems((prev) => [...prev, newLine]);
  };

  // Update an equipment line
  const handleUpdateEquipmentLine = (index: number, updates: Partial<QuoteItemLine>) => {
    setRentalItems((prev) => {
      const line = { ...prev[index], ...updates };
      const qty = line.quantity || 1;
      const unit = line.unitPricePerDay || 0;
      const coeff = line.rentalCoefficient !== undefined ? line.rentalCoefficient : activeCoefficient;
      const disc = line.discountPercent || 0;
      const base = qty * unit * coeff;
      const totalHT = Math.round(base * (1 - disc / 100) * 100) / 100;

      let marginHT = line.marginHT;
      let marginPercent = line.marginPercent;
      if (line.isSubRental && line.subRentalCostHT) {
        const res = computeSubRentalMargin(totalHT, line.subRentalCostHT);
        marginHT = res.marginHT;
        marginPercent = res.marginPercent;
      }

      const updated = [...prev];
      updated[index] = {
        ...line,
        totalHT,
        marginHT,
        marginPercent,
      };
      return updated;
    });
  };

  // Studios lines
  const handleAddStudioLine = () => {
    const defaultStudio = studios[0];
    const newLine: QuoteStudioLine = {
      studioId: defaultStudio?.id || "studio-1",
      studioName: defaultStudio?.name || "Plateau Principal",
      rateType: "daily",
      unitRate: defaultStudio?.dailyRate || 1200,
      quantityUnits: 1,
      totalHT: defaultStudio?.dailyRate || 1200,
    };
    setStudioRentals((prev) => [...prev, newLine]);
  };

  const handleUpdateStudioLine = (index: number, updates: Partial<QuoteStudioLine>) => {
    setStudioRentals((prev) => {
      const line = { ...prev[index], ...updates };
      const totalHT = line.unitRate * line.quantityUnits;
      const updated = [...prev];
      updated[index] = { ...line, totalHT };
      return updated;
    });
  };

  // Crew staff lines
  const handleAddCrewLine = () => {
    const defaultTech = technicians[0];
    const newLine: QuoteCrewLine = {
      technicianId: defaultTech?.id || `tech-${Date.now()}`,
      technicianName: defaultTech?.name || "Régisseur Général",
      role: "Régisseur Général / Cadreur",
      rateType: "daily",
      unitRate: defaultTech?.dailyRate || 450,
      quantityUnits: 1,
      totalHT: defaultTech?.dailyRate || 450,
    };
    setCrewStaff((prev) => [...prev, newLine]);
  };

  const handleUpdateCrewLine = (index: number, updates: Partial<QuoteCrewLine>) => {
    setCrewStaff((prev) => {
      const line = { ...prev[index], ...updates };
      const totalHT = line.unitRate * line.quantityUnits;
      const updated = [...prev];
      updated[index] = { ...line, totalHT };
      return updated;
    });
  };

  // Load sample Locasyst template
  const handleLoadLocasystEventTemplate = () => {
    setProjectName(SAMPLE_LUMENS_QUOTE.projectName);
    setClientCompany(SAMPLE_LUMENS_QUOTE.clientCompany);
    setClientName(SAMPLE_LUMENS_QUOTE.clientName);
    setClientEmail(SAMPLE_LUMENS_QUOTE.clientEmail);
    setClientPhone(SAMPLE_LUMENS_QUOTE.clientPhone);
    setClientAddress(SAMPLE_LUMENS_QUOTE.clientAddress);
    setEventLocation(SAMPLE_LUMENS_QUOTE.eventLocation || "Palais des Congrès, Paris");
    setProjectManager(SAMPLE_LUMENS_QUOTE.projectManager || "Bertrand BROT");
    setProjectManagerPhone(SAMPLE_LUMENS_QUOTE.projectManagerPhone || "06 11 60 78 77");
    setTechnicalDirector(SAMPLE_LUMENS_QUOTE.technicalDirector || "Marc Dubois");
    setTechnicalDirectorPhone(SAMPLE_LUMENS_QUOTE.technicalDirectorPhone || "06 45 78 90 12");
    setDepartureDate(SAMPLE_LUMENS_QUOTE.departureDate);
    setDepartureTimeSlot(SAMPLE_LUMENS_QUOTE.departureTimeSlot || "Matin (09h-12h)");
    setShootStartDate(SAMPLE_LUMENS_QUOTE.shootStartDate);
    setShootEndDate(SAMPLE_LUMENS_QUOTE.shootEndDate);
    setReturnDate(SAMPLE_LUMENS_QUOTE.returnDate);
    setReturnTimeSlot(SAMPLE_LUMENS_QUOTE.returnTimeSlot || "Après-midi (14h-18h)");
    setSetupSchedule(SAMPLE_LUMENS_QUOTE.setupSchedule || "Montage : Samedi 8h00");
    setExploitationSchedule(SAMPLE_LUMENS_QUOTE.exploitationSchedule || "Exploitation : Samedi 18h-02h");
    setTeardownSchedule(SAMPLE_LUMENS_QUOTE.teardownSchedule || "Démontage : Dimanche 10h00");
    setCoeffPreset("auto");
    setRentalItems((SAMPLE_LUMENS_QUOTE.rentalItems || []).map((l: any) => ({
      ...l,
      days: 1,
      category: l.category || "Matériel",
      chapterCategory: l.chapterCategory || "videoprojection",
      isSubRental: Boolean(l.isSubRental),
    })));
    setStudioRentals([]);
    setCrewStaff([]);
    setDiscountGlobal(SAMPLE_LUMENS_QUOTE.discountGlobalPercent || 0);
  };

  // Subtotals
  const equipmentSubTotalHT = useMemo(() => {
    return rentalItems.reduce((sum, item) => sum + (item.totalHT || 0), 0);
  }, [rentalItems]);

  const studioSubTotalHT = useMemo(() => {
    return studioRentals.reduce((sum, item) => sum + (item.totalHT || 0), 0);
  }, [studioRentals]);

  const crewSubTotalHT = useMemo(() => {
    return crewStaff.reduce((sum, item) => sum + (item.totalHT || 0), 0);
  }, [crewStaff]);

  const subTotalHT = useMemo(() => {
    return equipmentSubTotalHT + studioSubTotalHT + crewSubTotalHT;
  }, [equipmentSubTotalHT, studioSubTotalHT, crewSubTotalHT]);

  const totalHT = useMemo(() => {
    const disc = (subTotalHT * (discountGlobal || 0)) / 100;
    return Math.max(0, Math.round((subTotalHT - disc) * 100) / 100);
  }, [subTotalHT, discountGlobal]);

  const totalTVA = useMemo(() => {
    return Math.round((totalHT * (taxRate / 100)) * 100) / 100;
  }, [totalHT, taxRate]);

  const totalTTC = useMemo(() => {
    return Math.round((totalHT + totalTVA) * 100) / 100;
  }, [totalHT, totalTVA]);

  // Acompte calcul
  const computedDepositAmount = useMemo(() => {
    if (isCustomDepositAmount) return depositAmount;
    return Math.round((totalTTC * (depositPercent / 100)) * 100) / 100;
  }, [isCustomDepositAmount, depositAmount, totalTTC, depositPercent]);

  const computedRemainingBalance = useMemo(() => {
    return Math.max(0, Math.round((totalTTC - computedDepositAmount) * 100) / 100);
  }, [totalTTC, computedDepositAmount]);

  // Caution calcul
  const calculatedTotalReplacementValue = useMemo(() => {
    return rentalItems.reduce((acc, line) => {
      const val = line.replacementValue || line.unitPricePerDay * 20 || 500;
      return acc + val * line.quantity;
    }, 0);
  }, [rentalItems]);

  const computedGuaranteeAmount = useMemo(() => {
    if (isCustomGuaranteeAmount) return depositGuaranteeAmount;
    return Math.round(Math.min(calculatedTotalReplacementValue * 0.25, 25000));
  }, [isCustomGuaranteeAmount, depositGuaranteeAmount, calculatedTotalReplacementValue]);

  // Logistics metrics
  const currentLogisticsMetrics = useMemo(() => {
    return calculateQuoteLogistics(rentalItems, inventoryItems);
  }, [rentalItems, inventoryItems]);

  // Handle Save Quote
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<ClientQuote> = {
      clientId: selectedClientId || undefined,
      clientName: clientName.trim() || clientCompany.trim() || "Client Pro",
      clientCompany: clientCompany.trim() || "Société Partenaire",
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim(),
      projectName: projectName.trim() || "Prestation Audiovisuelle",
      clientProjectRef: clientProjectRef.trim() || undefined,
      eventLocation: eventLocation.trim() || undefined,
      shippingAddress: eventLocation.trim() || undefined,
      projectManager: projectManager.trim() || undefined,
      projectManagerPhone: projectManagerPhone.trim() || undefined,
      accountManager: projectManager.trim() || undefined,
      accountManagerPhone: projectManagerPhone.trim() || undefined,
      technicalDirector: technicalDirector.trim() || undefined,
      technicalDirectorPhone: technicalDirectorPhone.trim() || undefined,
      onSiteContactName: onSiteContactName.trim() || undefined,
      onSiteContactPhone: onSiteContactPhone.trim() || undefined,

      date: editingQuote?.date || new Date().toISOString().split("T")[0],
      validityDate:
        editingQuote?.validityDate ||
        new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      startDate: departureDate || shootStartDate,
      endDate: returnDate || shootEndDate,
      durationDays: computedShootDays,

      departureDate,
      departureTimeSlot,
      shootStartDate,
      shootEndDate,
      shootDaysCount: computedShootDays,
      returnDate,
      returnTimeSlot,
      setupSchedule,
      exploitationSchedule,
      teardownSchedule,

      appliedCoeffPreset: coeffPreset,
      globalRentalCoefficient: activeCoefficient,
      status: quoteStatus,

      rentalItems,
      studioRentals,
      crewStaff,
      discountGlobalPercent: discountGlobal,
      taxRate,
      totalHT,
      totalTVA,
      totalTTC,

      depositPercent,
      depositAmount: computedDepositAmount,
      depositStatus,
      depositPaymentMethod,

      totalReplacementValue: calculatedTotalReplacementValue,
      depositGuaranteeAmount: computedGuaranteeAmount,
      depositGuaranteeType,
      depositGuaranteeStatus: "pending",

      paymentTermsDays,
      paymentMode,
    };

    await onSave(payload);
    onClose();
  };

  return (
    <div
      id="modal-quote-builder"
      className="quote-builder-backdrop fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="quote-builder-modal relative bg-[#0e111d] border border-[#232a48] rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e243d] flex items-center justify-between bg-[#121626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                {editingQuote ? `Modifier le devis ${editingQuote.quoteNumber}` : "Nouveau devis"}
              </h2>
              <p className="text-xs text-slate-400">
                Saisie commerciale · projet, lignes de location et conditions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMaterialImporterOpen(true)}
              className="quote-builder-import-button py-1.5 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Package className="w-3.5 h-3.5" />
              Importer du matériel
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#1b213b] hover:bg-[#252e52] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METIER NAVIGATION BAR */}
        <div className="quote-builder-tabs px-5 py-3 bg-[#0a0d17] border-b border-[#1e243d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Step 1 Button */}
            <button
              type="button"
              onClick={() => setBuilderStep(1)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                builderStep === 1
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-[#141a2e] text-slate-400 hover:text-white hover:bg-[#1b223d]"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${builderStep === 1 ? "bg-white text-indigo-600" : "bg-slate-700 text-slate-300"}`}>
                1
              </span>
              <span>Affaire & dates</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />

            {/* Step 2 Button */}
            <button
              type="button"
              onClick={() => setBuilderStep(2)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                builderStep === 2
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-[#141a2e] text-slate-400 hover:text-white hover:bg-[#1b223d]"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${builderStep === 2 ? "bg-white text-indigo-600" : "bg-slate-700 text-slate-300"}`}>
                2
              </span>
              <span>Matériel & ressources ({rentalItems.length})</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:block" />

            {/* Step 3 Button */}
            <button
              type="button"
              onClick={() => setBuilderStep(3)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                builderStep === 3
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-[#141a2e] text-slate-400 hover:text-white hover:bg-[#1b223d]"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${builderStep === 3 ? "bg-white text-indigo-600" : "bg-slate-700 text-slate-300"}`}>
                3
              </span>
              <span>Conditions & documents</span>
            </button>
          </div>

          {/* Real-time Subtotal badge */}
          <div className="flex items-center gap-2 bg-[#121729] px-3.5 py-1.5 rounded-xl border border-[#232a48]">
            <span className="text-[11px] text-slate-400">Total estimé :</span>
            <span className="text-xs font-black font-mono text-emerald-400">
              {totalTTC.toLocaleString("fr-FR")} € TTC
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="quote-builder-form p-5 sm:p-6 overflow-y-auto flex-1 text-xs space-y-6">
          <div className="quote-builder-form-main">
          {/* ============================================================= */}
          {/* STEP 1: PROJET, CLIENT & PLANNING                             */}
          {/* ============================================================= */}
          {builderStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Card 1: Client & Intitulé */}
              <div className="p-5 rounded-2xl bg-[#121626] border border-[#232a48] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e243d] pb-3">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Informations Client & Affaire
                  </h3>

                  {clients.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Sélectionner un Client Enregistré :</span>
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleSelectClient(e.target.value)}
                        className="bg-[#181d33] border border-indigo-500/40 text-indigo-300 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
                      >
                        <option value="">-- Nouveau Client / Saisie Libre --</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.companyName} {c.contactPerson ? `(${c.contactPerson})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-300 block mb-1 font-bold">
                      Intitulé de l'Affaire / Événement *
                    </label>
                    <input
                      type="text"
                      required
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Ex: Soirée Gala Annuelle / Convention 500p / Tournage Publicité"
                      className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-bold">
                      Société Cliente / Organisateur *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      placeholder="Ex: Agence Horizon Events"
                      className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-bold">Nom du Contact Principal</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Sophie Martin"
                      className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-bold">Email du Contact</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="contact@agence.com"
                      className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-bold">Téléphone</label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-300 block mb-1 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      Lieu de Prestation / Livraison Matériel
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Ex: Palais des Congrès, Paris - Hall 3 / Quai de Déchargement"
                      className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-bold">Statut du Devis</label>
                    <select
                      value={quoteStatus}
                      onChange={(e) => setQuoteStatus(e.target.value as any)}
                      className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-bold"
                    >
                      <option value="draft">Brouillon</option>
                      <option value="sent">Envoyé au client</option>
                      <option value="accepted">Accepté / Signé</option>
                      <option value="invoiced">Facturé</option>
                      <option value="paid">Payé</option>
                      <option value="rejected">Refusé</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Planning & Dégressif */}
              <div className="p-5 rounded-2xl bg-[#121626] border border-[#232a48] space-y-4">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-[#1e243d] pb-2">
                  <Calendar className="w-4 h-4" />
                  Période de Location & Barème Dégressif
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-bold">Départ Matériel</label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-bold">Début Événement / Exploitation</label>
                    <input
                      type="date"
                      value={shootStartDate}
                      onChange={(e) => setShootStartDate(e.target.value)}
                      className="w-full bg-[#181d33] border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-indigo-200 font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-bold">Fin Événement</label>
                    <input
                      type="date"
                      value={shootEndDate}
                      onChange={(e) => setShootEndDate(e.target.value)}
                      className="w-full bg-[#181d33] border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-indigo-200 font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1 font-bold">Retour Matériel</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Barème Dégressif Buttons */}
                <div className="p-3.5 rounded-xl bg-[#0d101c] border border-[#1e243d] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">
                      Choix rapide du Barème Dégressif :
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      Coefficient appliqué : x{activeCoefficient} ({computedShootDays} jour(s) facturable(s))
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCoeffPreset("auto")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        coeffPreset === "auto"
                          ? "bg-indigo-600 text-white"
                          : "bg-[#181d33] text-slate-400 hover:text-white"
                      }`}
                    >
                      Auto ({computedShootDays}j = x{activeCoefficient})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoeffPreset("1j")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        coeffPreset === "1j"
                          ? "bg-indigo-600 text-white"
                          : "bg-[#181d33] text-slate-400 hover:text-white"
                      }`}
                    >
                      1 Jour (x1.0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoeffPreset("2j")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        coeffPreset === "2j"
                          ? "bg-indigo-600 text-white"
                          : "bg-[#181d33] text-slate-400 hover:text-white"
                      }`}
                    >
                      2 Jours (x1.5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoeffPreset("3j")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        coeffPreset === "3j"
                          ? "bg-indigo-600 text-white"
                          : "bg-[#181d33] text-slate-400 hover:text-white"
                      }`}
                    >
                      3 Jours (x2.0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoeffPreset("weekend")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        coeffPreset === "weekend"
                          ? "bg-indigo-600 text-white"
                          : "bg-[#181d33] text-slate-400 hover:text-white"
                      }`}
                    >
                      Forfait Week-end (x1.2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoeffPreset("week")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        coeffPreset === "week"
                          ? "bg-indigo-600 text-white"
                          : "bg-[#181d33] text-slate-400 hover:text-white"
                      }`}
                    >
                      1 Semaine (x3.0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoeffPreset("custom")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        coeffPreset === "custom"
                          ? "bg-indigo-600 text-white"
                          : "bg-[#181d33] text-slate-400 hover:text-white"
                      }`}
                    >
                      Personnalisé
                    </button>
                  </div>

                  {coeffPreset === "custom" && (
                    <div className="pt-2 flex items-center gap-3">
                      <label className="text-[11px] text-slate-300 font-bold">Coefficient personnalisé :</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={customCoeffValue}
                        onChange={(e) => setCustomCoeffValue(Number(e.target.value))}
                        className="w-24 bg-[#181d33] border border-[#273052] rounded-lg px-2 py-1 text-xs text-white font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible: Advanced Plannings & Contacts */}
              <div className="p-4 rounded-2xl bg-[#0a0d17] border border-[#1e243d] space-y-3">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-indigo-300 transition"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                    Options Avancées & Responsables Techniques (Locasyst)
                  </span>
                  <span className="text-[11px] text-indigo-400 underline">
                    {showAdvancedOptions ? "Masquer ▲" : "Afficher les détails ▼"}
                  </span>
                </button>

                {showAdvancedOptions && (
                  <div className="pt-3 border-t border-[#1e243d] grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Chargé d'Affaires</label>
                      <input
                        type="text"
                        value={projectManager}
                        onChange={(e) => setProjectManager(e.target.value)}
                        className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Régisseur Général / Directeur Tech.</label>
                      <input
                        type="text"
                        value={technicalDirector}
                        onChange={(e) => setTechnicalDirector(e.target.value)}
                        placeholder="Ex: Marc Dubois"
                        className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Planning Montage</label>
                      <input
                        type="text"
                        value={setupSchedule}
                        onChange={(e) => setSetupSchedule(e.target.value)}
                        placeholder="Montage: Samedi 8h00"
                        className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Planning Démontage</label>
                      <input
                        type="text"
                        value={teardownSchedule}
                        onChange={(e) => setTeardownSchedule(e.target.value)}
                        placeholder="Démontage: Dimanche 22h00"
                        className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1">Conditions de Paiement</label>
                      <input
                        type="text"
                        value={paymentTermsDays}
                        onChange={(e) => setPaymentTermsDays(e.target.value)}
                        placeholder="Comptant à réception ou 30 jours fin de mois"
                        className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 1 Next Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setBuilderStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
                >
                  <span>Passer au Choix du Matériel (Étape 2)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 2: MATÉRIEL, CATALOGUE & PRESTATIONS                      */}
          {/* ============================================================= */}
          {builderStep === 2 && (
            <>
            <div className="quote-document-view animate-fadeIn">
              <div className="quote-document-toolbar"><div><span className="quote-document-kicker">DOCUMENT DE LOCATION</span><h3>{projectName.trim() || "Nouvelle affaire"}</h3></div><button type="button" onClick={() => setIsMaterialImporterOpen(true)} className="quote-document-add"><Package size={15} /> Ajouter du matériel</button></div>
              <div className="quote-document-head">
                <div><span>CLIENT</span><strong>{clientCompany.trim() || clientName.trim() || "Client à renseigner"}</strong><small>{clientName || "Contact non renseigné"}</small></div>
                <div><span>CHARGÉ D’AFFAIRES</span><strong>{projectManager || "Commercial non renseigné"}</strong><small>{projectManagerPhone || "Téléphone non renseigné"}</small></div>
                <div><span>RÉFÉRENCE</span><strong>{clientProjectRef || "—"}</strong><small>{editingQuote?.quoteNumber || "Nouveau devis"}</small></div>
              </div>
              <div className="quote-document-table-wrap"><table className="quote-document-table"><thead><tr><th>Code</th><th>Désignation / produit</th><th>Qté</th><th>Jours</th><th>Prix / jour HT</th><th>Rem. %</th><th>Total HT</th><th /></tr></thead><tbody>
                {rentalItems.map((line, index) => <tr key={`${line.itemId}-${index}`}><td className="quote-line-code">{line.itemId || "—"}</td><td><strong>{line.name}</strong><small>{line.brand || line.category || "Matériel audiovisuel"}</small></td><td>{line.quantity}</td><td>{line.days || computedShootDays}</td><td>{(line.unitPricePerDay || 0).toLocaleString("fr-FR")} €</td><td>{line.discountPercent || 0}</td><td className="quote-line-total">{line.totalHT.toLocaleString("fr-FR")} €</td><td><button type="button" onClick={() => setRentalItems((prev) => prev.filter((_, i) => i !== index))} className="quote-line-delete"><Trash2 size={14} /></button></td></tr>)}
                {Array.from({ length: Math.max(5, 9 - rentalItems.length) }).map((_, index) => <tr className="quote-empty-line" key={`empty-${index}`}><td> </td><td> </td><td> </td><td> </td><td> </td><td> </td><td> </td><td> </td></tr>)}
              </tbody><tfoot><tr><td colSpan={6}>Sous-total matériel HT</td><td>{equipmentSubTotalHT.toLocaleString("fr-FR")} €</td><td /></tr></tfoot></table></div>
              <div className="quote-document-bottom"><div className="quote-document-logistics"><div><span>DÉPART MATÉRIEL</span><strong>{departureDate || "—"}</strong><small>{departureTimeSlot} · {settings?.warehouseName || "Dépôt principal"}</small></div><div><span>RETOUR PRÉVU</span><strong>{returnDate || "—"}</strong><small>{returnTimeSlot}</small></div><div><span>LIEU / LIVRAISON</span><strong>{eventLocation || "—"}</strong><small>{eventLocation || clientAddress || "Adresse à renseigner"}</small></div></div><div className="quote-document-total"><span>TOTAL ESTIMÉ TTC</span><strong>{totalTTC.toLocaleString("fr-FR")} €</strong><small>HT : {totalHT.toLocaleString("fr-FR")} € · TVA {taxRate}%</small></div></div>
              <div className="quote-document-actions"><button type="button" onClick={() => setBuilderStep(1)} className="quote-document-back"><ChevronLeft size={15} /> Modifier l’affaire</button><button type="button" onClick={() => setBuilderStep(3)} className="quote-document-next">Continuer vers Conditions & Totaux <ChevronRight size={15} /></button></div>
            </div>
            {false && (             <div className="space-y-4 animate-fadeIn">
              {/* Quick Preset Packs Bar */}
              <div className="quote-builder-preset-packs p-3.5 rounded-2xl bg-[#121626] border border-[#232a48] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Packs Prêts à l'Emploi (Ajout en 1 clic) :
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPresetPack("conference")}
                    className="p-2.5 rounded-xl bg-[#181d33] hover:bg-[#202744] border border-[#273052] text-left transition flex items-center gap-2 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white group-hover:text-sky-300">Pack Conférence</div>
                      <div className="text-[10px] text-slate-400">Micros HF + Sonorisation</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPresetPack("interview")}
                    className="p-2.5 rounded-xl bg-[#181d33] hover:bg-[#202744] border border-[#273052] text-left transition flex items-center gap-2 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white group-hover:text-indigo-300">Pack Interview</div>
                      <div className="text-[10px] text-slate-400">2 Caméras + Éclairage</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPresetPack("lighting")}
                    className="p-2.5 rounded-xl bg-[#181d33] hover:bg-[#202744] border border-[#273052] text-left transition flex items-center gap-2 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white group-hover:text-amber-300">Pack Éclairage LED</div>
                      <div className="text-[10px] text-slate-400">Projecteurs & Ambiance</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPresetPack("cinema")}
                    className="p-2.5 rounded-xl bg-[#181d33] hover:bg-[#202744] border border-[#273052] text-left transition flex items-center gap-2 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                      <Clapperboard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white group-hover:text-rose-300">Pack Fiction Cinéma</div>
                      <div className="text-[10px] text-slate-400">Caméra cinéma & Optiques</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs (Matériel, Studios, Techniciens) */}
              <div className="quote-builder-resource-tabs flex items-center gap-2 border-b border-[#1e243d] pb-2">
                <button
                  type="button"
                  onClick={() => setActiveItemTab("equipment")}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                    activeItemTab === "equipment"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-[#141a2e] text-slate-400 hover:text-white"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Matériel Audiovisuel ({rentalItems.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveItemTab("studios")}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                    activeItemTab === "studios"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-[#141a2e] text-slate-400 hover:text-white"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Plateaux Studios ({studioRentals.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveItemTab("technicians")}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                    activeItemTab === "technicians"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-[#141a2e] text-slate-400 hover:text-white"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Équipe Technique / Régie ({crewStaff.length})</span>
                </button>
              </div>

              {/* TAB 1: EQUIPMENT (DROPDOWN SELECTOR + 2-COLUMN CATALOG & SELECTION) */}
              {activeItemTab === "equipment" && (
                <div className="space-y-4">
                  {/* MAIN DROPDOWN SELECTION BANNER (Requested by User) */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#171c36] via-[#14182e] to-[#111528] border-2 border-indigo-500/60 shadow-xl shadow-indigo-950/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
                          <ListFilter className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                            Importer du matériel
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                              {safeCatalogList.length} articles disponibles
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Sélectionnez une référence puis ajoutez-la directement au devis
                          </p>
                        </div>
                      </div>
                      {dropdownSuccessToast && (
                        <div className="animate-bounce text-xs font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{dropdownSuccessToast}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      {/* Dropdown Select (7 cols) */}
                      <div className="md:col-span-7 space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                          1. Déroulez la liste et choisissez le matériel :
                        </label>
                        <div className="relative">
                          <select
                            value={selectedDropdownItemId}
                            onChange={(e) => setSelectedDropdownItemId(e.target.value)}
                            className="w-full bg-[#0d101d] border-2 border-indigo-500/60 hover:border-indigo-400 text-white rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner appearance-none cursor-pointer"
                          >
                            <option value="" className="text-slate-400 bg-[#0d101d]">
                              -- Cliquez ici pour ouvrir la liste déroulante du matériel ({safeCatalogList.length} articles) --
                            </option>
                            {(Object.entries(groupedCatalogItems) as [string, InventoryItem[]][]).map(([groupName, items]) => {
                              if (items.length === 0) return null;
                              return (
                                <optgroup key={groupName} label={groupName} className="font-bold text-indigo-300 bg-[#161a2e]">
                                  {items.map((item) => (
                                    <option key={item.id} value={item.id} className="text-white bg-[#0d101d] py-1 font-normal">
                                      {item.name} {item.brand ? `[${item.brand}]` : ""} — {item.rentalRatePerDay || 25} €/j (Dispo: {item.availableQuantity ?? 1})
                                    </option>
                                  ))}
                                </optgroup>
                              );
                            })}
                          </select>
                          <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Quantity Stepper (2 cols) */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                          2. Quantité :
                        </label>
                        <div className="flex items-center bg-[#0d101d] border border-[#273052] rounded-xl overflow-hidden h-[42px]">
                          <button
                            type="button"
                            onClick={() => setDropdownQuantity((q) => Math.max(1, q - 1))}
                            className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={dropdownQuantity}
                            onChange={(e) => setDropdownQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-transparent text-center text-xs font-mono font-bold text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setDropdownQuantity((q) => q + 1)}
                            className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Add button (3 cols) */}
                      <div className="md:col-span-3">
                        <button
                          type="button"
                          disabled={!selectedDropdownItemId}
                          onClick={() => {
                            const item = safeCatalogList.find((i) => i.id === selectedDropdownItemId);
                            if (item) {
                              handleAddItemWithQuantity(item, dropdownQuantity);
                            }
                          }}
                          className={`w-full h-[42px] px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                            selectedDropdownItemId
                              ? "bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-indigo-600/30 cursor-pointer"
                              : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Ajouter au Devis</span>
                        </button>
                      </div>
                    </div>

                    {/* Live preview banner for selected item in dropdown */}
                    {selectedDropdownItemId && (() => {
                      const item = safeCatalogList.find((i) => i.id === selectedDropdownItemId);
                      if (!item) return null;
                      const rate = item.rentalRatePerDay || 25;
                      const totalEst = Math.round(dropdownQuantity * rate * activeCoefficient * 100) / 100;
                      return (
                        <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="font-bold text-white">{item.name}</span>
                            <span className="text-[10px] text-slate-400">({item.brand || item.category})</span>
                            {item.technicalSubDesignation && (
                              <span className="text-[10px] text-indigo-300 truncate max-w-xs">
                                • {item.technicalSubDesignation}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-mono">
                            <span className="text-slate-300">
                              {dropdownQuantity}x à {rate} €/j
                            </span>
                            <span className="text-indigo-300">
                              (Coeff {activeCoefficient})
                            </span>
                            <span className="font-bold text-emerald-400 text-xs">
                              = {totalEst.toLocaleString("fr-FR")} € HT
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 2-COLUMN SECTION: CATALOG BROWSER & CURRENT SELECTION */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left: Inventory Catalog (5 cols) */}
                    <div className="lg:col-span-5 p-4 rounded-2xl bg-[#121626] border border-[#232a48] flex flex-col space-y-3 max-h-[500px]">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4" />
                          Catalogue Visuel
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {filteredCatalogItems.length} article(s)
                        </span>
                      </div>

                      {/* Search & Category Filter */}
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                            placeholder="Rechercher par nom, marque..."
                            className="w-full bg-[#181d33] border border-[#273052] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                          {catalogSearch && (
                            <button
                              type="button"
                              onClick={() => setCatalogSearch("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {["all", "Camera", "Lumière", "Son", "Video", "Optique", "Machinerie"].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCatalogCategoryFilter(cat)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                                catalogCategoryFilter === cat
                                  ? "bg-indigo-600 text-white"
                                  : "bg-[#181d33] text-slate-400 hover:text-white"
                              }`}
                            >
                              {cat === "all" ? "Tous" : cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Catalog Items Scrollable List */}
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                        {filteredCatalogItems.length > 0 ? (
                          filteredCatalogItems.map((item) => {
                          const alreadyAdded = rentalItems.some((l) => l.itemId === item.id);
                            const available = Math.max(0, item.availableQuantity ?? 0);
                            return (
                              <div
                                key={item.id}
                                className="p-2 rounded-xl bg-[#181d33] hover:bg-[#1f2642] border border-[#273052] flex items-center justify-between gap-2 transition"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-white truncate">{item.name}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                    <span>{item.brand || item.category}</span>
                                    <span className="text-emerald-400 font-mono font-bold">
                                      {item.rentalRatePerDay || 25} €/j
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded ${available > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                      Dispo: {available}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddItemFromCatalog(item)}
                                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition ${
                                    alreadyAdded
                                      ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30"
                                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>{alreadyAdded ? "+1" : "Ajouter"}</span>
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-8 text-center text-slate-500 italic text-xs">
                            Aucun matériel trouvé dans le stock.
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#1e243d] flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => handleAddEquipmentLine()}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          + Ligne Manuelle Libre
                        </button>
                      </div>
                    </div>

                    {/* Right: Selected Equipment Lines (7 cols) */}
                    <div className="lg:col-span-7 p-4 rounded-2xl bg-[#121626] border border-[#232a48] flex flex-col space-y-3 max-h-[500px]">
                      <div className="flex items-center justify-between border-b border-[#1e243d] pb-2">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Matériel Sélectionné ({rentalItems.length} ligne(s))
                        </h4>
                        <span className="text-xs font-mono font-bold text-white">
                          Sous-total : {equipmentSubTotalHT.toLocaleString("fr-FR")} € HT
                        </span>
                      </div>

                      {/* Selected lines list */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {rentalItems.length > 0 ? (
                          rentalItems.map((line, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-xl border transition ${
                                line.isSubRental
                                  ? "bg-[#181a2e] border-amber-500/40"
                                  : "bg-[#181d33] border-[#273052]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  {(() => {
                                    const stockItem = safeCatalogList.find((item) => item.id === line.itemId);
                                    const available = Math.max(0, stockItem?.availableQuantity ?? 0);
                                    const shortage = Math.max(0, line.quantity - available);
                                    return shortage > 0 ? (
                                      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold text-amber-700">
                                        <span className="rounded bg-amber-50 px-2 py-1">Manque : {shortage}</span>
                                        <span className="font-normal text-slate-500">À arbitrer par le commercial</span>
                                      </div>
                                    ) : null;
                                  })()}
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white">{line.name}</span>
                                    {line.brand && (
                                      <span className="text-[10px] text-slate-400">({line.brand})</span>
                                    )}
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                                      {line.chapterCategory || "Divers"}
                                    </span>
                                    {line.isSubRental && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                        Sous-Location
                                      </span>
                                    )}
                                  </div>

                                  {/* Line Price breakdown */}
                                  <div className="mt-1 text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                                    <span>
                                      Tarif base:{" "}
                                      <span className="font-mono text-slate-200">
                                        {line.unitPricePerDay} €/j
                                      </span>
                                    </span>
                                    <span>
                                      Coeff:{" "}
                                      <span className="font-mono text-indigo-300">
                                        x{line.rentalCoefficient ?? activeCoefficient}
                                      </span>
                                    </span>
                                    <span className="text-emerald-400 font-mono font-bold">
                                      Total : {line.totalHT.toLocaleString("fr-FR")} € HT
                                    </span>
                                  </div>

                                  {/* Dropdown in line to quickly swap equipment */}
                                  <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                                    <span className="text-slate-400">Remplacer par :</span>
                                    <select
                                      value={safeCatalogList.some((i) => i.id === line.itemId) ? line.itemId : ""}
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleReplaceEquipmentInLine(index, e.target.value);
                                        }
                                      }}
                                      className="bg-[#0f1222] border border-[#273052] text-indigo-300 text-[10px] rounded-lg px-2 py-0.5 max-w-[220px] outline-none cursor-pointer"
                                    >
                                      <option value="" className="text-slate-500">
                                        -- Choisir dans le menu déroulant --
                                      </option>
                                      {safeCatalogList.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name} ({item.rentalRatePerDay || 25} €/j)
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Quantity Controls & Delete */}
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center bg-[#101424] border border-[#273052] rounded-lg overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustQuantity(index, -1)}
                                      className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="px-2.5 py-1 text-xs font-bold font-mono text-white">
                                      {line.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustQuantity(index, 1)}
                                      className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRentalItems((prev) => prev.filter((_, i) => i !== index))
                                    }
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Sous-location inline toggle */}
                              <div className="mt-2 pt-2 border-t border-[#232a48] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(line.isSubRental)}
                                    onChange={(e) =>
                                      handleUpdateEquipmentLine(index, {
                                        isSubRental: e.target.checked,
                                        subRentalCostHT: e.target.checked
                                          ? line.subRentalCostHT || Math.round(line.totalHT * 0.6)
                                          : undefined,
                                      })
                                    }
                                    className="rounded bg-[#101424] border-slate-700 text-amber-500"
                                  />
                                  <span>Sous-louer auprès d'un confrère</span>
                                </label>

                                {line.isSubRental && (
                                  <div className="flex items-center gap-2 animate-fadeIn">
                                    <span className="text-slate-400">Fournisseur :</span>
                                    <select
                                      value={line.subRentalSupplier || ""}
                                      onChange={(e) =>
                                        handleUpdateEquipmentLine(index, {
                                          subRentalSupplier: e.target.value || undefined,
                                        })
                                      }
                                      className="w-36 bg-[#101424] border border-amber-500/40 rounded px-2 py-0.5 text-xs text-amber-300"
                                    >
                                      <option value="">À choisir</option>
                                      {suppliers
                                        .filter((supplier) => supplier.supplierType === "confrere_sous_location")
                                        .map((supplier) => (
                                          <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                                        ))}
                                    </select>
                                    <span className="text-slate-400">Coût Achat HT :</span>
                                    <input
                                      type="number"
                                      value={line.subRentalCostHT || 0}
                                      onChange={(e) =>
                                        handleUpdateEquipmentLine(index, {
                                          subRentalCostHT: Number(e.target.value),
                                        })
                                      }
                                      className="w-20 bg-[#101424] border border-amber-500/40 rounded px-2 py-0.5 text-xs text-amber-300 font-mono font-bold"
                                    />
                                    {line.marginHT !== undefined && (
                                      <span className="text-[10px] font-bold text-emerald-400 font-mono">
                                        Marge: +{line.marginHT} €
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-slate-500 space-y-2">
                            <Box className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                            <div className="text-xs font-bold text-slate-400">Aucun matériel sélectionné</div>
                            <div className="text-[11px] text-slate-500">
                              Utilisez le menu déroulant ci-dessus ou cliquez sur "+ Ajouter" dans le catalogue.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STUDIOS */}
              {activeItemTab === "studios" && (
                <div className="p-5 rounded-2xl bg-[#121626] border border-[#232a48] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1e243d] pb-2">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Plateaux de Tournage & Espaces Inclus
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddStudioLine}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Ajouter un Plateau
                    </button>
                  </div>

                  {studioRentals.length > 0 ? (
                    <div className="space-y-2">
                      {studioRentals.map((line, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-xl bg-[#181d33] border border-[#273052] grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
                        >
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Plateau / Studio</label>
                            <select
                              value={line.studioId}
                              onChange={(e) => {
                                const s = studios.find((st) => st.id === e.target.value);
                                if (s) {
                                  handleUpdateStudioLine(index, {
                                    studioId: s.id,
                                    studioName: s.name,
                                    unitRate: s.dailyRate,
                                  });
                                }
                              }}
                              className="w-full bg-[#101424] border border-[#273052] rounded-lg px-2 py-1.5 text-xs text-white"
                            >
                              {studios.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.surface}m²)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Tarif Unitaire HT</label>
                            <input
                              type="number"
                              value={line.unitRate}
                              onChange={(e) =>
                                handleUpdateStudioLine(index, { unitRate: Number(e.target.value) })
                              }
                              className="w-full bg-[#101424] border border-[#273052] rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Nombre de Journées</label>
                            <input
                              type="number"
                              min="1"
                              value={line.quantityUnits}
                              onChange={(e) =>
                                handleUpdateStudioLine(index, { quantityUnits: Number(e.target.value) })
                              }
                              className="w-full bg-[#101424] border border-[#273052] rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-3 sm:pt-0">
                            <span className="font-mono font-bold text-emerald-400 text-xs">
                              Total: {line.totalHT.toLocaleString("fr-FR")} € HT
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setStudioRentals((prev) => prev.filter((_, i) => i !== index))
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500 italic text-xs">
                      Aucun studio inclus dans ce devis (optionnel).
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TECHNICIANS */}
              {activeItemTab === "technicians" && (
                <div className="p-5 rounded-2xl bg-[#121626] border border-[#232a48] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1e243d] pb-2">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Personnel Technique & Régie Événementielle
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddCrewLine}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Ajouter un Technicien
                    </button>
                  </div>

                  {crewStaff.length > 0 ? (
                    <div className="space-y-2">
                      {crewStaff.map((line, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-xl bg-[#181d33] border border-[#273052] grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
                        >
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Rôle / Technicien</label>
                            <input
                              type="text"
                              value={line.role}
                              onChange={(e) =>
                                handleUpdateCrewLine(index, { role: e.target.value })
                              }
                              placeholder="Ex: Régisseur Son / Cadreur"
                              className="w-full bg-[#101424] border border-[#273052] rounded-lg px-2 py-1.5 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Tarif Journalier HT</label>
                            <input
                              type="number"
                              value={line.unitRate}
                              onChange={(e) =>
                                handleUpdateCrewLine(index, { unitRate: Number(e.target.value) })
                              }
                              className="w-full bg-[#101424] border border-[#273052] rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Nombre de Journées</label>
                            <input
                              type="number"
                              min="1"
                              value={line.quantityUnits}
                              onChange={(e) =>
                                handleUpdateCrewLine(index, { quantityUnits: Number(e.target.value) })
                              }
                              className="w-full bg-[#101424] border border-[#273052] rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                            />
                          </div>

                          <div className="flex items-center justify-between pt-3 sm:pt-0">
                            <span className="font-mono font-bold text-emerald-400 text-xs">
                              Total: {line.totalHT.toLocaleString("fr-FR")} € HT
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setCrewStaff((prev) => prev.filter((_, i) => i !== index))
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500 italic text-xs">
                      Aucun technicien ou régisseur inclus (optionnel).
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 Navigation Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setBuilderStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-[#141a2e] hover:bg-[#1c233d] text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour : Projet & Dates</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBuilderStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
                >
                  <span>Continuer vers Conditions & Totaux (Étape 3)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>)}
            </>
          )}

          {/* ============================================================= */}
          {/* STEP 3: CONDITIONS FINANCIÈRES, ACOMPTE & FINALISATION         */}
          {/* ============================================================= */}
          {builderStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#121626] border border-[#232a48]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Sous-total Matériel & Services
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono text-white block mt-1">
                    {subTotalHT.toLocaleString("fr-FR")} € HT
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#121626] border border-[#232a48]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Remise Commerciale (%)
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountGlobal}
                      onChange={(e) => setDiscountGlobal(Number(e.target.value))}
                      className="w-16 bg-[#181d33] border border-[#273052] rounded-lg px-2 py-0.5 text-xs text-indigo-300 font-bold font-mono"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#121626] border border-[#232a48]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Net HT</span>
                  <span className="text-sm sm:text-base font-black font-mono text-indigo-400 block mt-1">
                    {totalHT.toLocaleString("fr-FR")} € HT
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#121626] border border-emerald-500/40 bg-emerald-950/10">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                    Total TTC Facturable (TVA 20%)
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-400 block mt-1">
                    {totalTTC.toLocaleString("fr-FR")} € TTC
                  </span>
                </div>
              </div>

              {/* Card: Acompte (Déductible) */}
              <div className="p-5 rounded-2xl bg-[#121626] border border-[#232a48] space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#1e243d] pb-2">
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Conditions d'Acompte à la Réservation (Déductible)
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Acompte dû : {computedDepositAmount.toLocaleString("fr-FR")} € TTC
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-bold">Pourcentage d'acompte :</span>
                  {[0, 30, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setIsCustomDepositAmount(false);
                        setDepositPercent(pct);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        !isCustomDepositAmount && depositPercent === pct
                          ? "bg-indigo-600 text-white"
                          : "bg-[#181d33] text-slate-400 hover:text-white"
                      }`}
                    >
                      {pct === 0 ? "Sans acompte (0%)" : `${pct}%`}
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-[#0a0d17] border border-[#1e243d] flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Solde restant dû à la livraison :</span>
                    <span className="font-mono font-bold text-slate-200">
                      {computedRemainingBalance.toLocaleString("fr-FR")} € TTC
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Mode de règlement acompte :</span>
                    <select
                      value={depositPaymentMethod}
                      onChange={(e) => setDepositPaymentMethod(e.target.value as any)}
                      className="bg-[#181d33] border border-[#273052] rounded-lg px-2.5 py-1 text-xs text-white"
                    >
                      <option value="virement">Virement bancaire</option>
                      <option value="cb">Carte Bancaire (En ligne)</option>
                      <option value="cheque">Chèque d'acompte</option>
                      <option value="especes">Espèces</option>
                      <option value="traite">Traite LCR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card: Caution & Garantie Financière (Restituée au retour) */}
              <div className="p-5 rounded-2xl bg-[#121626] border border-[#232a48] space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#1e243d] pb-2">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Caution & Garantie Matériel (Non encaissée / Restituée au retour)
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Caution requise : {computedGuaranteeAmount.toLocaleString("fr-FR")} €
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Type de Garantie</label>
                    <select
                      value={depositGuaranteeType}
                      onChange={(e) => setDepositGuaranteeType(e.target.value as any)}
                      className="w-full bg-[#181d33] border border-[#273052] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="imprint_cb">Empreinte Carte Bancaire (PLBS non débité)</option>
                      <option value="check">Chèque de Caution non encaissé</option>
                      <option value="insurance_letter">Attestation d'Assurance Tournage / Événement</option>
                      <option value="bank_transfer">Virement bloqué de garantie</option>
                      <option value="none">Aucune caution exigée (Compte Pro Validé)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Valeur Assurée Matériel Estimée</label>
                    <div className="px-3 py-2 rounded-xl bg-[#181d33] border border-[#273052] font-mono text-slate-300">
                      {calculatedTotalReplacementValue.toLocaleString("fr-FR")} € (Valeur à neuf)
                    </div>
                  </div>
                </div>
              </div>

              {/* Logistics Summary */}
              <div className="p-4 rounded-2xl bg-[#0a0d17] border border-[#1e243d] space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-400" />
                  Bilan Logistique & Transport Automatique :
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-[#121626] border border-[#232a48]">
                    <span className="text-[10px] text-slate-400 block">Poids Total</span>
                    <span className="font-bold text-white font-mono">{currentLogisticsMetrics.totalWeightKg} kg</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#121626] border border-[#232a48]">
                    <span className="text-[10px] text-slate-400 block">Volume Estimé</span>
                    <span className="font-bold text-white font-mono">{currentLogisticsMetrics.totalVolumeM3} m³</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#121626] border border-[#232a48]">
                    <span className="text-[10px] text-slate-400 block">Puissance Recommandée</span>
                    <span className="font-bold text-emerald-400 font-mono">{currentLogisticsMetrics.recommendedGeneratorOrCircuit}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#121626] border border-[#232a48]">
                    <span className="text-[10px] text-slate-400 block">Véhicule Conseillé</span>
                    <span className="font-bold text-indigo-300 truncate block">{currentLogisticsMetrics.recommendedVehicle}</span>
                  </div>
                </div>
              </div>

              {/* Step 3 Final Navigation Buttons */}
              <div className="pt-3 border-t border-[#1e243d] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setBuilderStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-[#141a2e] hover:bg-[#1c233d] text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour : Matériel</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-[#181d33] text-xs font-bold transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingQuote ? "Mettre à jour le Devis" : "Valider et Enregistrer le Devis"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>

          <aside className="quote-builder-summary" aria-label="Résumé du devis">
            <div className="quote-summary-kicker">SYNTHÈSE EN DIRECT</div>
            <div className="quote-summary-status">{quoteStatus === "draft" ? "Brouillon" : quoteStatus === "sent" ? "Envoyé" : quoteStatus === "accepted" ? "Accepté" : quoteStatus}</div>
            <h3>{projectName.trim() || "Nouvelle affaire"}</h3>
            <p>{clientCompany.trim() || "Client à renseigner"}</p>
            <div className="quote-summary-divider" />
            <div className="quote-summary-metrics">
              <div><span>Matériel</span><strong>{rentalItems.length} ligne(s)</strong></div>
              <div><span>Durée</span><strong>{computedShootDays} jour(s)</strong></div>
              <div><span>Total HT</span><strong>{totalHT.toLocaleString("fr-FR")} €</strong></div>
              <div><span>Total TTC</span><strong className="is-total">{totalTTC.toLocaleString("fr-FR")} €</strong></div>
            </div>
            <div className="quote-summary-divider" />
            <div className="quote-summary-progress">
              {[
                [1, "Affaire"],
                [2, "Ressources"],
                [3, "Conditions"],
              ].map(([step, label]) => (
                <button type="button" key={String(step)} onClick={() => setBuilderStep(step as 1 | 2 | 3)} className={builderStep >= step ? "is-done" : ""}>
                  <span>{builderStep > step ? "✓" : step}</span>{label}
                </button>
              ))}
            </div>
            <p className="quote-summary-hint">Les montants et la disponibilité se recalculent automatiquement à chaque modification.</p>
          </aside>
        </form>

        {isMaterialImporterOpen && (
          <div className="material-importer-overlay" role="dialog" aria-label="Ajouter du matériel">
            <div className="material-importer-panel">
              <div className="material-importer-header">
                <div><div className="material-importer-kicker">CATALOGUE MATÉRIEL</div><h3>Ajouter du matériel</h3><p>Recherchez une référence puis ajoutez-la au devis. Vous pouvez continuer à ajouter plusieurs articles.</p></div>
                <button type="button" onClick={() => setIsMaterialImporterOpen(false)} className="material-importer-close"><X size={20} /></button>
              </div>
              <div className="material-importer-filters">
                <div className="material-importer-search"><Search size={17} /><input value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} placeholder="Rechercher par nom, type, catégorie ou marque..." autoFocus /></div>
                <select value={catalogTypeFilter} onChange={(e) => setCatalogTypeFilter(e.target.value)}><option value="all">Tous les types</option><option value="serialized">À l’unité</option><option value="bulk_quantity">Quantitatif</option><option value="consumable">Consommable</option></select>
                <select value={catalogCategoryFilter} onChange={(e) => setCatalogCategoryFilter(e.target.value)}><option value="all">Toutes les catégories</option>{[...new Set(safeCatalogList.map((item) => item.category))].map((category) => <option key={category} value={category}>{category}</option>)}</select>
              </div>
              <div className="material-importer-count">{filteredCatalogItems.length} article(s) trouvé(s) · Cliquez sur Ajouter pour constituer le devis</div>
              <div className="material-importer-grid">
                {filteredCatalogItems.map((item) => { const selected = rentalItems.some((line) => line.itemId === item.id); const available = item.availableQuantity ?? 0; const quantity = catalogQuantities[item.id] || 1; return <article className="material-card" key={item.id}>
                  <div className="material-card-image">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <Package size={30} />}</div>
                  <div className="material-card-body"><div className="material-card-category">{item.category} · {item.brand}</div><h4>{item.name}</h4><p>{item.description || item.technicalSubDesignation || "Matériel audiovisuel"}</p><div className="material-card-meta"><span>{item.rentalRatePerDay || 25} €/jour</span><span className={available > 0 ? "is-available" : "is-unavailable"}>{available > 0 ? `${available} disponible(s)` : "Indisponible"}</span></div><div className="material-card-actions"><div className="material-quantity-stepper"><button type="button" onClick={() => setCatalogQuantities((prev) => ({ ...prev, [item.id]: Math.max(1, quantity - 1) }))}>−</button><input aria-label={`Quantité de ${item.name}`} type="number" min={1} value={quantity} onChange={(e) => setCatalogQuantities((prev) => ({ ...prev, [item.id]: Math.max(1, Number(e.target.value) || 1) }))} /><button type="button" onClick={() => setCatalogQuantities((prev) => ({ ...prev, [item.id]: quantity + 1 }))}>+</button></div><button type="button" onClick={() => handleAddItemWithQuantity(item, quantity)} className={selected ? "material-card-add is-added" : "material-card-add"}><Plus size={15} /> {selected ? "Ajouter encore" : "Ajouter"}</button></div></div>
                </article>; })}
              </div>
              {filteredCatalogItems.length === 0 && <div className="material-importer-empty"><Package size={34} /><strong>Aucun matériel trouvé</strong><span>Essayez un nom, un type ou une autre catégorie.</span></div>}
              <div className="material-importer-footer"><span>{rentalItems.length} ligne(s) déjà ajoutée(s) au devis</span><button type="button" onClick={() => setIsMaterialImporterOpen(false)} className="material-importer-done"><Check size={16} /> Terminer les ajouts</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
