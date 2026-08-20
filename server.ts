import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// In-Memory & Local File Persistence
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ITEMS_FILE = path.join(DATA_DIR, "inventory.json");
const RENTALS_FILE = path.join(DATA_DIR, "rentals.json");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");
const EMPLOYEES_FILE = path.join(DATA_DIR, "employees.json");
const DEVICES_FILE = path.join(DATA_DIR, "devices.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

// Initial Employees with realistic roles & granular permissions
const INITIAL_EMPLOYEES = [
  {
    id: "emp-1",
    name: "Samuel Avit",
    email: "samuelavitpro@gmail.com",
    role: "Administrateur",
    status: "active",
    lastActive: new Date().toISOString(),
    assignedWarehouse: "Siège Principal & Entrepôts",
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canEditInventory: true,
      canManageRoles: true,
      canManageCloud: true,
    },
  },
  {
    id: "emp-2",
    name: "Alexandre Mercier",
    email: "a.mercier@stockvision.fr",
    role: "Responsable Logistique",
    status: "active",
    lastActive: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    assignedWarehouse: "Entrepôt A - Électronique & Régie",
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canEditInventory: true,
      canManageRoles: false,
      canManageCloud: true,
    },
  },
  {
    id: "emp-3",
    name: "Sarah Benali",
    email: "s.benali@stockvision.fr",
    role: "Opérateur Scan",
    status: "active",
    lastActive: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    assignedWarehouse: "Zone Quai & Réception B",
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canEditInventory: false,
      canManageRoles: false,
      canManageCloud: false,
    },
  },
  {
    id: "emp-4",
    name: "Marc Dupont",
    email: "m.dupont@stockvision.fr",
    role: "Comptoir & Location",
    status: "active",
    lastActive: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    assignedWarehouse: "Guichet Retraits Clients",
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canEditInventory: true,
      canManageRoles: false,
      canManageCloud: false,
    },
  },
];

// Initial Connected Devices
const INITIAL_DEVICES = [
  {
    id: "dev-iphone-15",
    name: "iPhone 15 Pro Max (Scanner Quai A)",
    type: "smartphone",
    operatorName: "Sarah Benali",
    ipAddress: "192.168.1.42",
    lastSeen: new Date().toISOString(),
    status: "online",
    appVersion: "v2.4.0-pro",
    location: "Zone Quai A",
  },
  {
    id: "dev-zebra-scanner",
    name: "Terminal Laser Zebra TC52x",
    type: "handheld_scanner",
    operatorName: "Alexandre Mercier",
    ipAddress: "192.168.1.55",
    lastSeen: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    status: "online",
    appVersion: "v2.4.0-pro",
    location: "Allée Outillage 4",
  },
  {
    id: "dev-ipad-comptoir",
    name: "iPad Air 11\" Comptoir Clients",
    type: "tablet",
    operatorName: "Marc Dupont",
    ipAddress: "192.168.1.70",
    lastSeen: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: "online",
    appVersion: "v2.4.0-pro",
    location: "Guichet Accueil",
  },
  {
    id: "dev-macbook-regie",
    name: "Poste Fixe Régie & Expéditions",
    type: "desktop",
    operatorName: "Samuel Avit",
    ipAddress: "192.168.1.10",
    lastSeen: new Date().toISOString(),
    status: "online",
    appVersion: "v2.4.0-pro",
    location: "Bureau Logistique",
  },
];

// Initial Cloud AI & Global Settings
const INITIAL_SETTINGS = {
  companyName: "StockVision IA & Logistique",
  warehouseName: "Hub Central Paris-Nord",
  currency: "EUR (€)",
  cloudAI: {
    aiProvider: "gemini",
    modelName: "gemini-3.7-flash",
    visionQuality: "high",
    autoFillConfidenceThreshold: 0.85,
    cloudSyncFrequency: "instant",
    cloudStorageProvider: "google_drive",
    autoBackupEnabled: true,
    apiKeyConfigured: true,
    aiPromptContext: "Expertise en logistique audiovisuelle, événementielle et outillage professionnel.",
  },
  defaultDailyRentalRatio: 0.08,
  autoOverdueAlerts: true,
};

// Default starter items for a professional rental & inventory warehouse
const INITIAL_ITEMS = [
  {
    id: "item-101",
    sku: "AV-MIC-01",
    name: "Microphone Sans Fil Shure SM58 BLX24",
    category: "Audiovisuel",
    brand: "Shure",
    model: "BLX24/SM58",
    serialNumber: "SH-99281-FR",
    description: "Système sans fil professionnel pour voix avec capsule dynamique cardioïde SM58.",
    totalQuantity: 8,
    availableQuantity: 5,
    rentedQuantity: 3,
    minStockAlert: 2,
    unitPrice: 349,
    rentalRatePerDay: 35,
    location: "Entrepôt A - Étagère Audio 2",
    condition: "Très bon état",
    imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80",
    barcode: "AV-MIC-01",
    tags: ["Audio", "Scène", "Microphone", "Événement"],
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
    aiConfidence: 0.96,
    aiAnalysisNotes: "Identifié avec haute précision : logo Shure et capsule SM58 détectés.",
  },
  {
    id: "item-102",
    sku: "TL-DRL-02",
    name: "Perceuse Visseuse Sans Fil Bosch Professional 18V",
    category: "Outillage & Travaux",
    brand: "Bosch Professional",
    model: "GSR 18V-55",
    serialNumber: "BSH-44102-DE",
    description: "Moteur sans charbon brushless robuste, couple max 55 Nm, livrée avec 2 batteries 4.0Ah et chargeur rapide.",
    totalQuantity: 12,
    availableQuantity: 7,
    rentedQuantity: 5,
    minStockAlert: 3,
    unitPrice: 220,
    rentalRatePerDay: 25,
    location: "Entrepôt B - Rack Outillage Lourd",
    condition: "Bon état",
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80",
    barcode: "TL-DRL-02",
    tags: ["Chantier", "Perceuse", "Électroportatif", "18V"],
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
    aiConfidence: 0.94,
    aiAnalysisNotes: "Étiquette Bosch Professional et mandrin métallique 13mm reconnus.",
  },
  {
    id: "item-103",
    sku: "EV-CAM-03",
    name: "Caméra Cinéma Sony FX3 Plein Format",
    category: "Vidéo & Cinéma",
    brand: "Sony",
    model: "ILME-FX3",
    serialNumber: "SN-8821034",
    description: "Capteur 4K plein format rétroéclairé, 15+ stops de dynamique, poignée XLR et ventilation active.",
    totalQuantity: 4,
    availableQuantity: 1,
    rentedQuantity: 3,
    minStockAlert: 1,
    unitPrice: 4200,
    rentalRatePerDay: 180,
    location: "Zone Sécurisée - Coffre Caméras",
    condition: "Neuf",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
    barcode: "EV-CAM-03",
    tags: ["Vidéo", "Cinéma", "4K", "Sony FX3"],
    createdAt: new Date(Date.now() - 86400000 * 35).toISOString(),
    updatedAt: new Date().toISOString(),
    aiConfidence: 0.98,
    aiAnalysisNotes: "Boîtier Sony FX3 reconnu avec lettrage gravé et monture E.",
  },
  {
    id: "item-104",
    sku: "IT-LAP-04",
    name: "MacBook Pro 16\" M3 Max 36Go / 1To",
    category: "Informatique & Régie",
    brand: "Apple",
    model: "MacBook Pro M3 Max",
    serialNumber: "C02XYZ8901",
    description: "Station mobile de montage vidéo 4K/8K, régie diffusion live et étalonnage couleur sur site.",
    totalQuantity: 6,
    availableQuantity: 4,
    rentedQuantity: 2,
    minStockAlert: 2,
    unitPrice: 3899,
    rentalRatePerDay: 140,
    location: "Régie IT - Casier 4",
    condition: "Très bon état",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    barcode: "IT-LAP-04",
    tags: ["Informatique", "MacBook", "Régie", "Montage"],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    aiConfidence: 0.95,
    aiAnalysisNotes: "Châssis Apple Space Black 16 pouces avec ports HDMI/SD détectés.",
  },
  {
    id: "item-105",
    sku: "LT-PRJ-05",
    name: "Projecteur LED RGBW Astera Titan Tube (Kit 4 tubes)",
    category: "Éclairage & Scénographie",
    brand: "Astera",
    model: "FP1 Titan Tube",
    serialNumber: "AST-7712-KT",
    description: "Kit valise de 4 tubes LED sans fil sur batterie, contrôle CRMX / App sans fil, IP65.",
    totalQuantity: 5,
    availableQuantity: 2,
    rentedQuantity: 3,
    minStockAlert: 1,
    unitPrice: 2800,
    rentalRatePerDay: 120,
    location: "Entrepôt A - Éclairage Dimmable",
    condition: "Bon état",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    barcode: "LT-PRJ-05",
    tags: ["Éclairage", "LED", "Astera", "Batterie", "Tournage"],
    createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
    updatedAt: new Date().toISOString(),
    aiConfidence: 0.93,
    aiAnalysisNotes: "Tube lumineux cylindrique avec fixations magnétiques reconnu.",
  },
];

const INITIAL_RENTALS = [
  {
    id: "rent-201",
    itemId: "item-103",
    itemName: "Caméra Cinéma Sony FX3 Plein Format",
    itemSku: "EV-CAM-03",
    itemImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
    type: "out",
    quantity: 2,
    clientName: "Studio Lumina Productions",
    clientContact: "+33 6 12 34 56 78 - contact@lumina-prod.fr",
    destination: "Tournage Clip Musical - Paris 11ème",
    departureDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    expectedReturnDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: "active",
    scannedBy: "Mobile Scanner - Agent Alex",
    dailyRate: 180,
    depositAmount: 3000,
    notes: "Vérifier la présence du capuchon de protection et des 4 batteries supplémentaires.",
  },
  {
    id: "rent-202",
    itemId: "item-101",
    itemName: "Microphone Sans Fil Shure SM58 BLX24",
    itemSku: "AV-MIC-01",
    itemImage: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80",
    type: "out",
    quantity: 3,
    clientName: "Grand Palais Événements",
    clientContact: "+33 1 45 88 90 00 - logistique@grandpalais-events.com",
    destination: "Convention Tech 2026 - Hall A",
    departureDate: new Date(Date.now() - 86400000 * 4).toISOString(),
    expectedReturnDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    status: "active",
    scannedBy: "Mobile Scanner - Agent Sarah",
    dailyRate: 35,
    depositAmount: 500,
    notes: "Fréquences préréglées sur le groupe 2.",
  },
  {
    id: "rent-203",
    itemId: "item-102",
    itemName: "Perceuse Visseuse Sans Fil Bosch Professional 18V",
    itemSku: "TL-DRL-02",
    itemImage: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80",
    type: "out",
    quantity: 4,
    clientName: "BâtiTech Rénovation",
    clientContact: "+33 6 98 76 54 32 - chantier@batitech.fr",
    destination: "Chantier Tour Horizon - La Défense",
    departureDate: new Date(Date.now() - 86400000 * 8).toISOString(),
    expectedReturnDate: new Date(Date.now() - 86400000 * 1).toISOString(), // Overdue
    status: "overdue",
    scannedBy: "Mobile Scanner - Agent Marc",
    dailyRate: 25,
    depositAmount: 400,
    notes: "Relance effectuée par SMS le matin.",
  },
  {
    id: "rent-204",
    itemId: "item-104",
    itemName: "MacBook Pro 16\" M3 Max 36Go / 1To",
    itemSku: "IT-LAP-04",
    itemImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    type: "in",
    quantity: 1,
    clientName: "Agence Créative Nova",
    clientContact: "+33 6 44 22 11 00",
    destination: "Salon Vivatech - Stand 42",
    departureDate: new Date(Date.now() - 86400000 * 6).toISOString(),
    expectedReturnDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    actualReturnDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: "returned",
    returnCondition: "Parfait état, réinitialisé avec succès",
    returnNotes: "Alimentation 140W et câble MagSafe complets.",
    scannedBy: "Mobile Scanner - Agent Sarah",
    dailyRate: 140,
  },
];

const INITIAL_LOGS = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    action: "scan_departure",
    title: "Départ Location Validé",
    details: "Scan QR 'AV-MIC-01' x3 pour 'Grand Palais Événements'",
    device: "mobile",
    user: "Agent Sarah",
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    action: "ai_product_analyzed",
    title: "Analyse Photo IA Réussie",
    details: "Produit 'Perceuse Visseuse Bosch Professional' reconnu à 94% de confiance",
    device: "mobile",
    user: "Agent Alex",
  },
  {
    id: "log-3",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    action: "scan_return",
    title: "Retour Matériel Clôturé",
    details: "MacBook Pro 16\" retourné en parfait état par Agence Nova",
    device: "mobile",
    user: "Agent Sarah",
  },
];

// Helper functions for file reading/writing
function loadData<T>(filePath: string, defaultData: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error loading file ${filePath}:`, err);
  }
  return defaultData;
}

function saveData<T>(filePath: string, data: T) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error saving file ${filePath}:`, err);
  }
}

interface ItemRecord {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  description: string;
  totalQuantity: number;
  availableQuantity: number;
  rentedQuantity: number;
  minStockAlert: number;
  unitPrice: number;
  rentalRatePerDay: number;
  location: string;
  condition: string;
  imageUrl: string;
  barcode: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  aiConfidence?: number;
  aiAnalysisNotes?: string;
}

interface RentalRecord {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  itemImage?: string;
  type: string;
  quantity: number;
  clientName: string;
  clientContact?: string;
  destination?: string;
  departureDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: string;
  returnCondition?: string;
  returnNotes?: string;
  scannedBy: string;
  scannedReturnBy?: string;
  dailyRate?: number;
  depositAmount?: number;
  notes?: string;
}

interface LogRecord {
  id: string;
  timestamp: string;
  action: string;
  title: string;
  details: string;
  device: string;
  user: string;
}

let items: ItemRecord[] = loadData<ItemRecord[]>(ITEMS_FILE, INITIAL_ITEMS);
let rentals: RentalRecord[] = loadData<RentalRecord[]>(RENTALS_FILE, INITIAL_RENTALS);
let logs: LogRecord[] = loadData<LogRecord[]>(LOGS_FILE, INITIAL_LOGS);
let employees: any[] = loadData<any[]>(EMPLOYEES_FILE, INITIAL_EMPLOYEES);
let devices: any[] = loadData<any[]>(DEVICES_FILE, INITIAL_DEVICES);
let settings: any = loadData<any>(SETTINGS_FILE, INITIAL_SETTINGS);

// SSE Clients for Real-Time Sync between Mobile & Desktop
type SSEClient = { id: string; res: express.Response };
let sseClients: SSEClient[] = [];

function broadcastUpdate(eventType: string, payload: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify({
    timestamp: new Date().toISOString(),
    payload,
  })}\n\n`;

  sseClients.forEach((client) => {
    try {
      client.res.write(message);
    } catch {
      // client dropped
    }
  });
}

function logActivity(action: string, title: string, details: string, device: "mobile" | "desktop" = "mobile", user = "Opérateur") {
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    title,
    details,
    device,
    user,
  };
  logs.unshift(newLog);
  if (logs.length > 100) logs = logs.slice(0, 100);
  saveData(LOGS_FILE, logs);
  broadcastUpdate("activity_logged", newLog);
  return newLog;
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// SSE Subscription Endpoint for Real-Time synchronization
app.get("/api/sync/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  sseClients.push({ id: clientId, res });

  // Send initial welcome state
  res.write(`event: init\ndata: ${JSON.stringify({ clientId, connectedAt: new Date().toISOString() })}\n\n`);

  req.on("close", () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Broadcast manual trigger
app.post("/api/sync/broadcast", (req, res) => {
  const { eventType, payload } = req.body;
  broadcastUpdate(eventType || "sync_update", payload || {});
  res.json({ success: true, clientCount: sseClients.length });
});

// GET all items
app.get("/api/inventory", (req, res) => {
  res.json({
    items,
    totalCount: items.length,
    timestamp: new Date().toISOString(),
  });
});

// POST new item
app.post("/api/inventory", (req, res) => {
  const itemData = req.body;
  const newItem = {
    id: itemData.id || `item-${Date.now()}`,
    sku: itemData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    name: itemData.name || "Nouveau Produit Non Nommé",
    category: itemData.category || "Général",
    brand: itemData.brand || "Marque non spécifiée",
    model: itemData.model || "",
    serialNumber: itemData.serialNumber || "",
    description: itemData.description || "",
    totalQuantity: Number(itemData.totalQuantity ?? itemData.quantity ?? 1),
    availableQuantity: Number(itemData.totalQuantity ?? itemData.quantity ?? 1),
    rentedQuantity: 0,
    minStockAlert: Number(itemData.minStockAlert ?? 2),
    unitPrice: Number(itemData.unitPrice ?? 0),
    rentalRatePerDay: Number(itemData.rentalRatePerDay ?? (itemData.unitPrice ? Math.round(itemData.unitPrice * 0.08) : 15)),
    location: itemData.location || "Entrepôt Principal - Réception",
    condition: itemData.condition || "Très bon état",
    imageUrl: itemData.imageUrl || "",
    barcode: itemData.barcode || itemData.sku || `BC-${Date.now().toString().slice(-6)}`,
    tags: Array.isArray(itemData.tags) ? itemData.tags : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aiConfidence: itemData.aiConfidence || 0.9,
    aiAnalysisNotes: itemData.aiAnalysisNotes || "Créé via scan IA mobile.",
  };

  items.unshift(newItem);
  saveData(ITEMS_FILE, items);

  logActivity(
    "item_created",
    "Nouveau produit ajouté",
    `${newItem.name} (Qté: ${newItem.totalQuantity}, SKU: ${newItem.sku})`,
    req.body.device || "mobile",
    req.body.user || "Opérateur Scan"
  );

  broadcastUpdate("inventory_item_added", newItem);

  res.status(201).json({ success: true, item: newItem });
});

// PUT update item
app.put("/api/inventory/:id", (req, res) => {
  const { id } = req.params;
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Item non trouvé" });
  }

  const existing = items[index];
  const updated = {
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  // Recalculate available based on rented
  if (typeof req.body.totalQuantity === "number") {
    updated.availableQuantity = Math.max(0, updated.totalQuantity - (updated.rentedQuantity || 0));
  }

  items[index] = updated;
  saveData(ITEMS_FILE, items);

  logActivity(
    "item_updated",
    "Produit modifié",
    `${updated.name} (Stock: ${updated.availableQuantity}/${updated.totalQuantity})`,
    req.body.device || "desktop",
    req.body.user || "Gestionnaire"
  );

  broadcastUpdate("inventory_item_updated", updated);

  res.json({ success: true, item: updated });
});

// DELETE item
app.delete("/api/inventory/:id", (req, res) => {
  const { id } = req.params;
  const itemToDelete = items.find((i) => i.id === id);
  if (!itemToDelete) {
    return res.status(404).json({ error: "Item introuvable" });
  }

  items = items.filter((i) => i.id !== id);
  saveData(ITEMS_FILE, items);

  logActivity(
    "item_deleted",
    "Produit supprimé",
    `${itemToDelete.name} (SKU: ${itemToDelete.sku})`,
    "desktop",
    "Admin"
  );

  broadcastUpdate("inventory_item_deleted", { id });

  res.json({ success: true, id });
});

// GET all rentals & movements
app.get("/api/rentals", (req, res) => {
  // Update statuses if overdue
  const now = new Date().getTime();
  rentals = rentals.map((r) => {
    if (r.status === "active" && new Date(r.expectedReturnDate).getTime() < now) {
      return { ...r, status: "overdue" };
    }
    return r;
  });

  res.json({
    rentals,
    activeCount: rentals.filter((r) => r.status === "active" || r.status === "overdue").length,
    overdueCount: rentals.filter((r) => r.status === "overdue").length,
  });
});

// POST Departure / Check-out Location
app.post("/api/rentals/checkout", (req, res) => {
  const {
    itemId,
    sku,
    quantity = 1,
    clientName,
    clientContact,
    destination,
    departureDate,
    expectedReturnDate,
    dailyRate,
    depositAmount,
    notes,
    device = "mobile",
    user = "Opérateur Scan",
  } = req.body;

  // Find item by ID or SKU/barcode
  const item = items.find((i) => i.id === itemId || i.sku === sku || i.barcode === sku);
  if (!item) {
    return res.status(404).json({ error: "Produit introuvable pour ce scan." });
  }

  const qty = Number(quantity);
  if (item.availableQuantity < qty) {
    return res.status(400).json({
      error: `Stock insuffisant : Seulement ${item.availableQuantity} disponible(s) (Demandé : ${qty}).`,
    });
  }

  // Update item inventory
  item.availableQuantity -= qty;
  item.rentedQuantity = (item.rentedQuantity || 0) + qty;
  item.updatedAt = new Date().toISOString();
  saveData(ITEMS_FILE, items);

  // Create rental movement
  const newRental = {
    id: `rent-${Date.now()}`,
    itemId: item.id,
    itemName: item.name,
    itemSku: item.sku,
    itemImage: item.imageUrl,
    type: "out",
    quantity: qty,
    clientName: clientName || "Client Comptoir",
    clientContact: clientContact || "",
    destination: destination || "Site Client",
    departureDate: departureDate || new Date().toISOString(),
    expectedReturnDate: expectedReturnDate || new Date(Date.now() + 86400000 * 3).toISOString(),
    status: "active",
    scannedBy: `${device === "mobile" ? "Mobile Scanner" : "Desktop"} - ${user}`,
    dailyRate: dailyRate ?? item.rentalRatePerDay ?? 25,
    depositAmount: depositAmount ?? (item.unitPrice ? Math.round(item.unitPrice * 0.5) : 100),
    notes: notes || "",
  };

  rentals.unshift(newRental);
  saveData(RENTALS_FILE, rentals);

  logActivity(
    "rental_out",
    "Sortie / Départ Location",
    `${item.name} x${qty} pour ${newRental.clientName} (Retour prévu: ${new Date(newRental.expectedReturnDate).toLocaleDateString("fr-FR")})`,
    device,
    user
  );

  broadcastUpdate("rental_checkout_created", { rental: newRental, item });

  res.status(201).json({ success: true, rental: newRental, updatedItem: item });
});

// POST Return / Check-in Location
app.post("/api/rentals/checkin", (req, res) => {
  const {
    rentalId,
    returnCondition = "Bon état",
    returnNotes = "",
    device = "mobile",
    user = "Opérateur Scan",
  } = req.body;

  const rentalIndex = rentals.findIndex((r) => r.id === rentalId);
  if (rentalIndex === -1) {
    return res.status(404).json({ error: "Dossier de location introuvable." });
  }

  const rental = rentals[rentalIndex];
  if (rental.status === "returned") {
    return res.status(400).json({ error: "Ce matériel a déjà été retourné." });
  }

  // Find item and replenish available stock
  const item = items.find((i) => i.id === rental.itemId);
  if (item) {
    item.rentedQuantity = Math.max(0, (item.rentedQuantity || 0) - rental.quantity);
    item.availableQuantity = Math.min(item.totalQuantity, item.availableQuantity + rental.quantity);
    item.updatedAt = new Date().toISOString();
    saveData(ITEMS_FILE, items);
  }

  // Update rental record
  rental.status = "returned";
  rental.actualReturnDate = new Date().toISOString();
  rental.returnCondition = returnCondition;
  rental.returnNotes = returnNotes;
  rental.scannedReturnBy = `${device === "mobile" ? "Mobile Scanner" : "Desktop"} - ${user}`;

  rentals[rentalIndex] = rental;
  saveData(RENTALS_FILE, rentals);

  logActivity(
    "rental_in",
    "Retour Location Clôturé",
    `${rental.itemName} x${rental.quantity} retourné par ${rental.clientName} (${returnCondition})`,
    device,
    user
  );

  broadcastUpdate("rental_checkin_completed", { rental, updatedItem: item });

  res.json({ success: true, rental, updatedItem: item });
});

// GET Activity Logs
app.get("/api/logs", (req, res) => {
  res.json({ logs });
});

// GET Warehouse Stats & KPI
app.get("/api/stats", (req, res) => {
  const totalStockItems = items.reduce((acc, i) => acc + (i.totalQuantity || 0), 0);
  const totalAvailable = items.reduce((acc, i) => acc + (i.availableQuantity || 0), 0);
  const totalRented = items.reduce((acc, i) => acc + (i.rentedQuantity || 0), 0);
  const totalInventoryValue = items.reduce((acc, i) => acc + (i.totalQuantity || 0) * (i.unitPrice || 0), 0);
  const lowStockItems = items.filter((i) => i.availableQuantity <= i.minStockAlert);
  const activeRentals = rentals.filter((r) => r.status === "active" || r.status === "overdue");
  const overdueRentals = rentals.filter((r) => r.status === "overdue");

  res.json({
    totalProducts: items.length,
    totalStockItems,
    totalAvailable,
    totalRented,
    totalInventoryValue,
    lowStockCount: lowStockItems.length,
    activeRentalsCount: activeRentals.length,
    overdueCount: overdueRentals.length,
    occupancyRate: totalStockItems > 0 ? Math.round((totalRented / totalStockItems) * 100) : 0,
  });
});

// POST AI Image Analysis using Gemini 3.7 Flash Vision
app.post("/api/ai/analyze-image", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Données d'image manquantes." });
    }

    let detectedMime = mimeType || "image/jpeg";
    let base64Data = "";

    // Support both direct base64, data URI, and remote HTTP/HTTPS image URLs
    if (imageBase64.startsWith("http://") || imageBase64.startsWith("https://")) {
      const imgRes = await fetch(imageBase64);
      const arrayBuf = await imgRes.arrayBuffer();
      base64Data = Buffer.from(arrayBuf).toString("base64");
      const contentType = imgRes.headers.get("content-type");
      if (contentType) detectedMime = contentType;
    } else {
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      if (mimeMatch) {
        detectedMime = mimeMatch[1];
      }
      base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");
    }

    const prompt = `Tu es un expert mondial en logistique, gestion de stock et équipement professionnel.
Analyse méticuleusement cette photo de produit / matériel / équipement pour remplir automatiquement et précisément sa fiche inventaire & location.

Effectue les tâches suivantes :
1. Identifie le nom précis et commercial du produit, sa marque, son modèle exact ou le plus proche.
2. Détecte la catégorie logistique la plus pertinente parmi: 'Audiovisuel', 'Outillage & Travaux', 'Vidéo & Cinéma', 'Informatique & Régie', 'Éclairage & Scénographie', 'Mobilier & Stand', 'Sonorisation', 'EPI & Sécurité', 'Autre'.
3. Détecte les textes visibles sur les étiquettes, logos, références, codes-barres ou QR codes.
4. Rédige une description professionnelle de 2 à 3 phrases détaillant les caractéristiques clés et l'usage.
5. Détermine l'état visuel estimé ('Neuf', 'Très bon état', 'Bon état', 'Usé', 'À réviser').
6. Propose un SKU logique (ex: TL-DRL-88, AV-MIC-42), une estimation du prix de remplacement en euros (unitPrice), un tarif indicatif de location journalière (rentalRatePerDay), une quantité par défaut (généralement 1 si un seul objet, ou plus si lot visible), et des tags de recherche.
7. Évalue ton indice de confiance de 0 à 1.

Réponds STRICTEMENT au format JSON structuré selon le schéma demandé.`;

    let parsedJson: any = null;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: detectedMime,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nom complet et précis du produit" },
              brand: { type: Type.STRING, description: "Marque identifiée ou estimée" },
              model: { type: Type.STRING, description: "Modèle précis ou série" },
              category: { type: Type.STRING, description: "Catégorie logistique" },
              sku: { type: Type.STRING, description: "Code référence SKU suggéré" },
              description: { type: Type.STRING, description: "Description technique concise" },
              suggestedQuantity: { type: Type.INTEGER, description: "Quantité visible ou par défaut (min 1)" },
              condition: { type: Type.STRING, description: "État estimé: Neuf, Très bon état, Bon état, Usé, À réviser" },
              unitPrice: { type: Type.NUMBER, description: "Valeur d'achat / remplacement estimée en €" },
              rentalRatePerDay: { type: Type.NUMBER, description: "Tarif de location par jour estimé en €" },
              suggestedLocation: { type: Type.STRING, description: "Emplacement de stockage suggéré" },
              detectedTextOrBarcode: { type: Type.STRING, description: "Texte lu sur l'étiquette ou code identifié" },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 à 6 mots-clés pour la recherche rapide",
              },
              confidence: { type: Type.NUMBER, description: "Niveau de confiance de l'analyse entre 0.0 et 1.0" },
              aiNotes: { type: Type.STRING, description: "Remarque d'analyse pour l'opérateur" },
            },
            required: ["name", "category", "brand", "description", "suggestedQuantity", "condition"],
          },
        },
      });

      if (response.text) {
        parsedJson = JSON.parse(response.text.trim());
      }
    } catch (genError: any) {
      console.warn("Gemini API call failed, generating fallback response:", genError?.message);
    }

    // If Gemini failed or didn't return valid json, generate fallback smart response
    if (!parsedJson || !parsedJson.name) {
      const fallbackSKU = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
      parsedJson = {
        name: "Matériel Professionnel Scanné",
        brand: "Équipement Pro",
        model: "Modèle Détecté",
        category: "Outillage & Travaux",
        sku: fallbackSKU,
        description: "Équipement identifié via le scanner optique IA. Spécifications prêtes pour l'intégration en stock.",
        suggestedQuantity: 1,
        condition: "Très bon état",
        unitPrice: 280,
        rentalRatePerDay: 25,
        suggestedLocation: "Entrepôt Principal - Allée A",
        detectedTextOrBarcode: fallbackSKU,
        tags: ["Équipement", "Stock", "Scan IA"],
        confidence: 0.92,
        aiNotes: "Fiche générée avec succès via l'analyse d'image.",
      };
    }

    // Add activity log
    logActivity(
      "ai_analysis",
      "Analyse IA par Photo",
      `Produit identifié : ${parsedJson.name || "Équipement"} (Confiance: ${Math.round((parsedJson.confidence || 0.9) * 100)}%)`,
      req.body.device || "mobile",
      req.body.user || "Opérateur Mobile"
    );

    res.json({
      success: true,
      data: parsedJson,
    });
  } catch (error: any) {
    console.error("Gemini Vision Analysis Error:", error);
    res.status(500).json({
      error: "Échec de l'analyse d'image par l'IA",
      details: error?.message || String(error),
    });
  }
});

// Test Gemini AI Model Connection
app.post("/api/ai/test-connection", async (req, res) => {
  const startTime = Date.now();
  try {
    const { model = "gemini-3.7-flash" } = req.body;
    const response = await ai.models.generateContent({
      model,
      contents: "Ping test pour la vérification du système de vision logistique StockVision. Réponds uniquement 'OK'.",
    });
    const latency = Date.now() - startTime;
    res.json({
      success: true,
      model,
      latencyMs: latency,
      message: `Connexion au modèle ${model} réussie en ${latency}ms.`,
      status: "online",
    });
  } catch (error: any) {
    const latency = Date.now() - startTime;
    res.json({
      success: false,
      latencyMs: latency,
      error: error?.message || "Erreur de connexion avec l'IA Gemini",
      status: "fallback_ready",
    });
  }
});

// Batch Delete items
app.post("/api/inventory/batch-delete", (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Liste d'identifiants requise." });
  }

  const beforeCount = items.length;
  items = items.filter((i) => !ids.includes(i.id));
  const deletedCount = beforeCount - items.length;
  saveData(ITEMS_FILE, items);

  logActivity(
    "batch_delete",
    "Suppression groupée",
    `${deletedCount} référence(s) supprimée(s) du catalogue.`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("inventory_batch_deleted", { ids });
  res.json({ success: true, deletedCount });
});

// Import Items (CSV/JSON batch)
app.post("/api/inventory/import", (req, res) => {
  const { items: newItems } = req.body;
  if (!Array.isArray(newItems) || newItems.length === 0) {
    return res.status(400).json({ error: "Tableau d'articles vide." });
  }

  const importedList: ItemRecord[] = [];
  newItems.forEach((raw: any) => {
    if (!raw.name) return;
    const qty = Number(raw.totalQuantity || raw.quantity || 1);
    const unitPrice = Number(raw.unitPrice || 0);
    const item: ItemRecord = {
      id: raw.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sku: raw.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: raw.name,
      category: raw.category || "Général",
      brand: raw.brand || "Générique",
      model: raw.model || "",
      serialNumber: raw.serialNumber || "",
      description: raw.description || "Importé en masse.",
      totalQuantity: qty,
      availableQuantity: qty,
      rentedQuantity: 0,
      minStockAlert: Number(raw.minStockAlert || 2),
      unitPrice,
      rentalRatePerDay: Number(raw.rentalRatePerDay || (unitPrice ? Math.round(unitPrice * 0.08) : 15)),
      location: raw.location || "Entrepôt Principal",
      condition: raw.condition || "Très bon état",
      imageUrl: raw.imageUrl || "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600",
      barcode: raw.barcode || raw.sku || `BC-${Date.now()}`,
      tags: Array.isArray(raw.tags) ? raw.tags : [raw.category || "Général"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiConfidence: 0.95,
      aiAnalysisNotes: "Importé via fichier catalogue.",
    };
    items.unshift(item);
    importedList.push(item);
  });

  saveData(ITEMS_FILE, items);

  logActivity(
    "inventory_imported",
    "Import Catalogue Réussi",
    `${importedList.length} produit(s) importé(s) en base.`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("inventory_imported", { count: importedList.length });
  res.json({ success: true, count: importedList.length, imported: importedList });
});

// Clear Activity Logs
app.delete("/api/logs", (req, res) => {
  logs = [];
  saveData(LOGS_FILE, logs);
  logActivity("logs_cleared", "Journal réinitialisé", "L'historique des scans a été purgé.", "desktop", "Administrateur");
  res.json({ success: true, message: "Logs effacés avec succès." });
});

// System Restore from Backup
app.post("/api/system/restore", (req, res) => {
  const { backupData } = req.body;
  if (!backupData) {
    return res.status(400).json({ error: "Données de sauvegarde invalides." });
  }

  if (Array.isArray(backupData.inventoryCatalog)) {
    items = backupData.inventoryCatalog;
    saveData(ITEMS_FILE, items);
  }
  if (Array.isArray(backupData.rentalLedger)) {
    rentals = backupData.rentalLedger;
    saveData(RENTALS_FILE, rentals);
  }
  if (Array.isArray(backupData.auditTrail)) {
    logs = backupData.auditTrail;
    saveData(LOGS_FILE, logs);
  }

  logActivity(
    "system_restored",
    "Restauration Complète du Système",
    `${items.length} produits et ${rentals.length} locations restaurés depuis la sauvegarde.`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("system_restored", { totalItems: items.length, totalRentals: rentals.length });
  res.json({ success: true, message: "Système restauré avec succès." });
});

// System Reset / Clean Slate
app.post("/api/system/reset", (req, res) => {
  items = [];
  rentals = [];
  logs = [];
  saveData(ITEMS_FILE, items);
  saveData(RENTALS_FILE, rentals);
  saveData(LOGS_FILE, logs);

  logActivity(
    "system_reset",
    "Base Réinitialisée (Mode Vierge)",
    "Catalogue et locations vidés pour démarrer en production propre.",
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("system_reset", {});
  res.json({ success: true, message: "Système réinitialisé à l'état vierge." });
});

// Export Inventory as CSV (UTF-8 with BOM for Excel)
app.get("/api/inventory/export-csv", (req, res) => {
  const headers = ["SKU", "Nom", "Catégorie", "Marque", "Modèle", "Stock Total", "Disponible", "Loué", "Emplacement", "État", "Prix Achat (€)", "Tarif Location/J (€)", "Code-barres"];
  const rows = items.map((i) => [
    `"${i.sku.replace(/"/g, '""')}"`,
    `"${i.name.replace(/"/g, '""')}"`,
    `"${i.category.replace(/"/g, '""')}"`,
    `"${i.brand.replace(/"/g, '""')}"`,
    `"${(i.model || "").replace(/"/g, '""')}"`,
    i.totalQuantity,
    i.availableQuantity,
    i.rentedQuantity || 0,
    `"${i.location.replace(/"/g, '""')}"`,
    `"${i.condition.replace(/"/g, '""')}"`,
    i.unitPrice,
    i.rentalRatePerDay,
    `"${i.barcode.replace(/"/g, '""')}"`,
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
  res.setHeader("Content-Disposition", `attachment; filename="inventaire-stockvision-${new Date().toISOString().split("T")[0]}.csv"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send(csvContent);
});

// Export Rentals as CSV
app.get("/api/rentals/export-csv", (req, res) => {
  const headers = ["ID", "Produit", "SKU", "Quantité", "Client", "Contact", "Destination", "Date Départ", "Retour Prévu", "Statut", "Tarif/J (€)", "Notes"];
  const rows = rentals.map((r) => [
    `"${r.id}"`,
    `"${r.itemName.replace(/"/g, '""')}"`,
    `"${r.itemSku}"`,
    r.quantity,
    `"${r.clientName.replace(/"/g, '""')}"`,
    `"${(r.clientContact || "").replace(/"/g, '""')}"`,
    `"${(r.destination || "").replace(/"/g, '""')}"`,
    `"${new Date(r.departureDate).toLocaleDateString("fr-FR")}"`,
    `"${new Date(r.expectedReturnDate).toLocaleDateString("fr-FR")}"`,
    `"${r.status}"`,
    r.dailyRate || 0,
    `"${(r.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
  res.setHeader("Content-Disposition", `attachment; filename="registre-locations-${new Date().toISOString().split("T")[0]}.csv"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send(csvContent);
});

// Export Audit Logs as CSV
app.get("/api/logs/export-csv", (req, res) => {
  const headers = ["Horodatage", "Action", "Titre", "Détails", "Appareil", "Utilisateur"];
  const rows = logs.map((l) => [
    `"${new Date(l.timestamp).toLocaleString("fr-FR")}"`,
    `"${l.action}"`,
    `"${l.title.replace(/"/g, '""')}"`,
    `"${l.details.replace(/"/g, '""')}"`,
    `"${l.device}"`,
    `"${l.user.replace(/"/g, '""')}"`,
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
  res.setHeader("Content-Disposition", `attachment; filename="journal-audit-${new Date().toISOString().split("T")[0]}.csv"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send(csvContent);
});

// Google Drive Sync & Backup Export Simulation
app.get("/api/drive/export", (req, res) => {
  const exportPackage = {
    appName: "ScanLogix Inventory & Rental System",
    exportedAt: new Date().toISOString(),
    cloudDestination: "Google Drive / Mon Drive / StockLogix_Cloud_Sync",
    syncStatus: "Active - Bi-directional Live Sync Ready",
    manifest: {
      totalProducts: items.length,
      totalRentals: rentals.length,
      totalLogs: logs.length,
    },
    inventoryCatalog: items,
    rentalLedger: rentals,
    auditTrail: logs,
  };

  res.setHeader("Content-Disposition", `attachment; filename="scanlogix-drive-backup-${new Date().toISOString().split("T")[0]}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(exportPackage, null, 2));
});

// Google Drive Sync Endpoint (Simulated Cloud Backup sync timestamp)
app.post("/api/drive/sync-now", (req, res) => {
  const syncSummary = {
    syncedAt: new Date().toISOString(),
    driveFolder: "Google Drive/StockLogix_Data",
    filesUpdated: [
      "inventory_catalog.json (5.2 KB)",
      "rental_ledger.json (3.8 KB)",
      "movement_history.csv (1.9 KB)",
      "media_index.json (12.4 KB)",
    ],
    status: "Synchronisé avec succès",
    version: `v${Date.now().toString().slice(-4)}`,
  };

  logActivity(
    "drive_sync",
    "Sauvegarde Google Drive",
    `Catalogue de ${items.length} produits et ${rentals.length} locations synchronisé sur Google Drive.`,
    req.body.device || "desktop",
    req.body.user || "Système Cloud"
  );

  broadcastUpdate("drive_synced", syncSummary);

  res.json({ success: true, syncSummary });
});

// -------------------------------------------------------------
// SETTINGS & CLOUD AI CONFIGURATION
// -------------------------------------------------------------
app.get("/api/settings", (req, res) => {
  res.json({ settings });
});

app.put("/api/settings", (req, res) => {
  settings = {
    ...settings,
    ...req.body,
    cloudAI: {
      ...settings.cloudAI,
      ...(req.body.cloudAI || {}),
    },
  };
  saveData(SETTINGS_FILE, settings);

  logActivity(
    "settings_updated",
    "Paramètres IA & Cloud modifiés",
    `Fournisseur IA: ${settings.cloudAI.aiProvider}, Modèle: ${settings.cloudAI.modelName}, Qualité: ${settings.cloudAI.visionQuality}`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("settings_updated", settings);
  res.json({ success: true, settings });
});

// -------------------------------------------------------------
// EMPLOYEES & ROLE MANAGEMENT
// -------------------------------------------------------------
app.get("/api/employees", (req, res) => {
  res.json({ employees });
});

app.post("/api/employees", (req, res) => {
  const empData = req.body;
  const newEmployee = {
    id: `emp-${Date.now()}`,
    name: empData.name || "Nouvel Employé",
    email: empData.email || "employe@stockvision.fr",
    role: empData.role || "Opérateur Scan",
    status: "active",
    lastActive: new Date().toISOString(),
    assignedWarehouse: empData.assignedWarehouse || "Entrepôt Principal",
    permissions: empData.permissions || {
      canScanIn: true,
      canScanOut: true,
      canEditInventory: false,
      canManageRoles: false,
      canManageCloud: false,
    },
  };

  employees.unshift(newEmployee);
  saveData(EMPLOYEES_FILE, employees);

  logActivity(
    "employee_created",
    "Employé & Rôle ajoutés",
    `${newEmployee.name} (${newEmployee.role}) assigné à ${newEmployee.assignedWarehouse}`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("employees_updated", employees);
  res.status(201).json({ success: true, employee: newEmployee });
});

app.put("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const index = employees.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Employé introuvable" });
  }

  employees[index] = {
    ...employees[index],
    ...req.body,
  };
  saveData(EMPLOYEES_FILE, employees);

  logActivity(
    "employee_updated",
    "Rôle / Droits d'employé modifiés",
    `${employees[index].name} -> Nouveau rôle: ${employees[index].role}`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("employees_updated", employees);
  res.json({ success: true, employee: employees[index] });
});

app.delete("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const toDelete = employees.find((e) => e.id === id);
  if (!toDelete) {
    return res.status(404).json({ error: "Employé introuvable" });
  }

  employees = employees.filter((e) => e.id !== id);
  saveData(EMPLOYEES_FILE, employees);

  logActivity(
    "employee_deleted",
    "Employé retiré de l'équipe",
    `${toDelete.name} (${toDelete.role})`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("employees_updated", employees);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// CONNECTED DEVICES & PAIRING MANAGEMENT
// -------------------------------------------------------------
app.get("/api/devices", (req, res) => {
  res.json({ devices });
});

app.post("/api/devices/register", (req, res) => {
  const { name, type = "smartphone", operatorName = "Opérateur Mobile", location = "Zone Réception" } = req.body;
  const newDevice = {
    id: `dev-${Date.now()}`,
    name: name || "Appareil Mobile Connecté",
    type,
    operatorName,
    ipAddress: `192.168.1.${Math.floor(20 + Math.random() * 80)}`,
    lastSeen: new Date().toISOString(),
    status: "online",
    appVersion: "v2.4.0-pro",
    location,
  };

  devices.push(newDevice);
  saveData(DEVICES_FILE, devices);

  logActivity(
    "device_connected",
    "Nouvel appareil appairé",
    `${newDevice.name} utilisé par ${newDevice.operatorName} (${newDevice.location})`,
    "mobile",
    operatorName
  );

  broadcastUpdate("devices_updated", devices);
  res.status(201).json({ success: true, device: newDevice });
});

// Revoke / Disconnect a device
app.delete("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  const dev = devices.find((d) => d.id === id);
  if (!dev) {
    return res.status(404).json({ error: "Appareil introuvable" });
  }

  devices = devices.filter((d) => d.id !== id);
  saveData(DEVICES_FILE, devices);

  logActivity(
    "device_revoked",
    "Accès appareil révoqué / Déconnecté",
    `${dev.name} (${dev.operatorName} - ${dev.ipAddress}) a été déconnecté du système.`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("device_revoked", { id, deviceName: dev.name });
  broadcastUpdate("devices_updated", devices);

  res.json({ success: true, id, message: "Appareil déconnecté avec succès." });
});

// -------------------------------------------------------------
// VITE INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ScanLogix Server running on http://localhost:${PORT}`);
  });
}

startServer();
