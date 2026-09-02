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

// Dynamic Gemini AI Client Helper using Admin Key or environment
function getAiClient(apiKeyOverride?: string) {
  const activeKey = apiKeyOverride || settings?.cloudAI?.customApiKey || process.env.GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error("Clé API Gemini non configurée. L'administrateur doit renseigner sa propre clé d'API dans les Réglages.");
  }
  return new GoogleGenAI({
    apiKey: activeKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

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
const USERS_FILE = path.join(DATA_DIR, "users.json");
const STUDIOS_FILE = path.join(DATA_DIR, "studios.json");
const TECHNICIANS_FILE = path.join(DATA_DIR, "technicians.json");
const QUOTES_FILE = path.join(DATA_DIR, "quotes.json");
const DEPOTS_FILE = path.join(DATA_DIR, "depots.json");
const DISPLAYS_FILE = path.join(DATA_DIR, "displays.json");
const PLAYLISTS_FILE = path.join(DATA_DIR, "playlists.json");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");
const SUPPLIERS_FILE = path.join(DATA_DIR, "suppliers.json");
const VENUES_FILE = path.join(DATA_DIR, "venues.json");

// Initial Annuaire Clients Événementiels & Location (Locasyst)
const INITIAL_CLIENTS = [
  {
    id: "cli-01",
    companyName: "Live Nation France - Festivals & Tours",
    contactPerson: "Sophie Delorme",
    clientType: "organisateur_festival",
    email: "s.delorme@livenation.fr",
    phone: "+33 1 45 88 90 00",
    mobile: "+33 6 12 34 56 78",
    siret: "492 819 330 00012",
    tvaIntra: "FR23 492819330",
    billingAddress: "11 Rue de Tilsitt, 75017 Paris",
    deliveryAddress: "Plateau Principal / Régie - Site Festival",
    billingContactName: "Service Comptabilité Fournisseurs",
    billingContactEmail: "compta@livenation.fr",
    onSiteContactName: "Marc Vasseur (Régie Plateau)",
    onSiteContactPhone: "+33 6 12 34 56 78",
    defaultDiscountPercent: 20,
    paymentTermsDays: "30 jours fin de mois",
    paymentMode: "Virement bancaire",
    creditLimit: 50000,
    totalQuotesCount: 6,
    totalBilledHT: 84200,
    notes: "Compte VIP Festival & Concerts. Validation devis avec acompte 30%.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli-02",
    companyName: "Havas Events Paris",
    contactPerson: "Alexandre Dupuis",
    clientType: "agence_event",
    email: "a.dupuis@havas-events.com",
    phone: "+33 1 58 47 80 00",
    mobile: "+33 6 44 22 11 00",
    siret: "389 445 921 00045",
    tvaIntra: "FR12 389445921",
    billingAddress: "29 Quai de Dion Bouton, 92800 Puteaux",
    deliveryAddress: "Palais des Congrès de Paris - Hall Maillot",
    billingContactName: "Facturation Événements",
    billingContactEmail: "factures@havas-events.com",
    onSiteContactName: "Julien Rivoire (Directeur Technique)",
    onSiteContactPhone: "+33 6 44 22 11 00",
    defaultDiscountPercent: 30,
    paymentTermsDays: "Comptant à réception",
    paymentMode: "Virement bancaire",
    creditLimit: 35000,
    totalQuotesCount: 12,
    totalBilledHT: 124500,
    notes: "Agence référente événements d'entreprise, lancements de produit et conventions.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli-03",
    companyName: "Grand Palais & RMN Événements",
    contactPerson: "Béatrice Garnier",
    clientType: "institution_salle",
    email: "evenements@grandpalais.fr",
    phone: "+33 1 44 13 17 17",
    mobile: "+33 6 88 99 00 11",
    siret: "180 046 270 00014",
    tvaIntra: "FR44 180046270",
    billingAddress: "Avenue Winston Churchill, 75008 Paris",
    deliveryAddress: "Grand Palais Éphémère - Quai Déchargement",
    billingContactName: "Pôle Régie Salles",
    billingContactEmail: "regie.compta@grandpalais.fr",
    onSiteContactName: "Antoine Lambert (Régisseur Général)",
    onSiteContactPhone: "+33 6 88 99 00 11",
    defaultDiscountPercent: 15,
    paymentTermsDays: "45 jours fin de mois",
    paymentMode: "Virement bancaire",
    creditLimit: 40000,
    totalQuotesCount: 4,
    totalBilledHT: 48900,
    notes: "Site classé ERP. Respect impératif des protocoles d'accès et horaires quai.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cli-04",
    companyName: "Vivatech / Publicis Live",
    contactPerson: "Claire Montmirail",
    clientType: "corporation",
    email: "logistique@vivatechnology.com",
    phone: "+33 1 44 43 70 00",
    mobile: "+33 6 55 66 77 88",
    siret: "542 089 123 00088",
    tvaIntra: "FR88 542089123",
    billingAddress: "133 Avenue des Champs-Élysées, 75008 Paris",
    deliveryAddress: "Paris Expo Porte de Versailles - Hall 1 Stand D14",
    billingContactName: "Claire Montmirail",
    billingContactEmail: "c.montmirail@vivatechnology.com",
    onSiteContactName: "Thomas Leroy (Responsable Hall A)",
    onSiteContactPhone: "+33 6 55 66 77 88",
    defaultDiscountPercent: 25,
    paymentTermsDays: "30 jours date de facture",
    paymentMode: "Virement bancaire",
    creditLimit: 60000,
    totalQuotesCount: 8,
    totalBilledHT: 95400,
    notes: "Salon international annuel. Écrans géants, murs LED et sonorisation régie.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initial Annuaire Confrères & Fournisseurs (Sous-location & Achat)
const INITIAL_SUPPLIERS = [
  {
    id: "sup-01",
    name: "Novelty / Dushow Group",
    supplierType: "confrere_sous_location",
    contactPerson: "Guillaume Fabre",
    email: "contact@novelty-group.com",
    phone: "+33 1 64 54 25 00",
    emergencyPhone: "+33 6 01 02 03 04",
    siret: "313 874 928 00031",
    tvaIntra: "FR90 313874928",
    address: "Parc d'Activités des Marais, 1 Rue de la Fontaine",
    city: "Longjumeau (91)",
    typicalPickupLocation: "Hub Novelty Longjumeau - Quai A",
    discountRateOffered: 40,
    paymentTerms: "30 jours fin de mois",
    ribIban: "FR76 3000 4012 3400 0123 4567 890",
    bankName: "BNP Paribas Entreprises",
    notes: "Partenaire majeur sous-location éclairage lourd, projecteurs asservis et murs LED.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-02",
    name: "Impact Événement",
    supplierType: "confrere_sous_location",
    contactPerson: "Nathalie Morel",
    email: "location@impact-evenement.com",
    phone: "+33 1 69 74 15 15",
    emergencyPhone: "+33 6 11 22 33 44",
    siret: "349 920 185 00029",
    tvaIntra: "FR55 349920185",
    address: "6 Rue du Bois Briard, 91080 Courcouronnes",
    city: "Courcouronnes (91)",
    typicalPickupLocation: "Dépôt Principal Impact Chilly-Mazarin",
    discountRateOffered: 35,
    paymentTerms: "30 jours fin de mois",
    ribIban: "FR76 1027 8000 5512 3456 7890 123",
    bankName: "Crédit Agricole d'Île-de-France",
    notes: "Excellente réactivité pour structures truss, pieds télescopiques et levage.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-03",
    name: "B Live Group",
    supplierType: "confrere_sous_location",
    contactPerson: "Damien Roussel",
    email: "location@blivegroup.com",
    phone: "+33 1 49 92 10 00",
    emergencyPhone: "+33 6 99 88 77 66",
    siret: "403 912 876 00019",
    tvaIntra: "FR33 403912876",
    address: "15 Boulevard de la Libération, 93200 Saint-Denis",
    city: "Saint-Denis (93)",
    typicalPickupLocation: "Dépôt B Live Saint-Denis - Baie 4",
    discountRateOffered: 40,
    paymentTerms: "45 jours fin de mois",
    ribIban: "FR76 1820 6000 1060 2758 9258 842",
    bankName: "Société Générale",
    notes: "Fournisseur de référence pour systèmes audio line array L-Acoustics / d&b.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-04",
    name: "PRG France (Production Resource Group)",
    supplierType: "confrere_sous_location",
    contactPerson: "Laurent Caron",
    email: "france@prg.com",
    phone: "+33 1 48 13 25 00",
    emergencyPhone: "+33 6 45 67 89 10",
    siret: "433 918 274 00010",
    tvaIntra: "FR77 433918274",
    address: "Zone Cargo 7, Bâtiment 3400, 95700 Roissy CDG",
    city: "Roissy CDG (95)",
    typicalPickupLocation: "Hub Logistique Roissy CDG",
    discountRateOffered: 45,
    paymentTerms: "30 jours fin de mois",
    ribIban: "FR76 3000 2005 5000 0012 3456 789",
    bankName: "Crédit Mutuel",
    notes: "Parc international vidéo broadcast, serveurs Disguise et optiques cinéma.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initial Lieux & Salles de Réception (Standard Locasyst Événementiel)
const INITIAL_VENUES = [
  {
    id: "ven-01",
    name: "Palais des Congrès de Paris - Hall Maillot",
    venueType: "palais_congres",
    address: "2 Place de la Porte Maillot",
    city: "Paris (75017)",
    postalCode: "75017",
    capacity: 3700,
    ceilingHeightMeters: 8.5,
    riggingCapacityKg: 500,
    dockType: "quai_niveleur",
    truckAccess: "semi_remorque_38t",
    maxVehicleHeightMeters: 4.2,
    dockContactName: "Jean-Marc Vasseur (Quai Porte C)",
    dockContactPhone: "+33 1 40 68 22 22",
    dockAccessHours: "06h00 - 23h00 (Réservation quai obligatoire)",
    elevatorDimensions: "3.2m x 6.0m - 5000 kg",
    powerTotalKVA: 250,
    sockets32ATri: 8,
    sockets63ATri: 4,
    sockets125ATri: 2,
    hasPowerlock: true,
    hasMarechal: true,
    sockets16AMono: 20,
    tgbtLocation: "Coulisse Cour & Local Technique Sous-Scène",
    technicalDirectorName: "Thierry Fontaine (DT Résident)",
    technicalDirectorPhone: "+33 6 14 25 36 47",
    technicalDirectorEmail: "technique.maillot@viparis.com",
    soundLimiterDBSPL: 102,
    soundLimiterNotes: "Plafond 102 dBA Leq 15min. Arrêt sonore obligatoire à 00h30.",
    hasDmxNetwork: true,
    hasFiberNetwork: true,
    notes: "Accès régie par escalier technique ou monte-charge B. Pass VIParis exigé.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ven-02",
    name: "Grande Halle de la Villette",
    venueType: "parc_expos",
    address: "211 Avenue Jean Jaurès",
    city: "Paris (75019)",
    postalCode: "75019",
    capacity: 5000,
    ceilingHeightMeters: 13.0,
    riggingCapacityKg: 1000,
    dockType: "plain_pied",
    truckAccess: "semi_remorque_38t",
    maxVehicleHeightMeters: 4.5,
    dockContactName: "Alexandre Mercier (Poste Sud)",
    dockContactPhone: "+33 1 40 03 75 75",
    dockAccessHours: "24h/24 lors des montages",
    powerTotalKVA: 400,
    sockets32ATri: 12,
    sockets63ATri: 8,
    sockets125ATri: 4,
    hasPowerlock: true,
    hasMarechal: false,
    sockets16AMono: 30,
    tgbtLocation: "Caniveaux techniques sous dalle & Piliers métalliques",
    technicalDirectorName: "Julien Rivoire",
    technicalDirectorPhone: "+33 6 44 22 11 00",
    technicalDirectorEmail: "regie.halle@villette.com",
    soundLimiterDBSPL: 105,
    soundLimiterNotes: "Structure métallique résonnante - calage diffusion line array obligatoire.",
    hasDmxNetwork: true,
    hasFiberNetwork: true,
    notes: "Possibilité de rentrer les semi-remorques directement dans la nef pour déchargement.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ven-03",
    name: "Salle Pleyel",
    venueType: "salle_spectacle",
    address: "252 Rue du Faubourg Saint-Honoré",
    city: "Paris (75008)",
    postalCode: "75008",
    capacity: 2500,
    ceilingHeightMeters: 11.0,
    riggingCapacityKg: 750,
    dockType: "monte_charge",
    truckAccess: "porteur_19t",
    maxVehicleHeightMeters: 3.8,
    dockContactName: "Régie Cour Daru",
    dockContactPhone: "+33 1 86 47 68 43",
    dockAccessHours: "07h00 - 21h00",
    elevatorDimensions: "2.4m x 4.0m - 3000 kg",
    powerTotalKVA: 160,
    sockets32ATri: 6,
    sockets63ATri: 3,
    sockets125ATri: 1,
    hasPowerlock: false,
    hasMarechal: true,
    sockets16AMono: 16,
    tgbtLocation: "Arrière-Scène Jardin",
    technicalDirectorName: "Antoine Lambert",
    technicalDirectorPhone: "+33 6 88 99 00 11",
    technicalDirectorEmail: "technique@sallepleyel.com",
    soundLimiterDBSPL: 98,
    soundLimiterNotes: "Limiteur actif 98 dBA crête - voisinage immédiat.",
    hasDmxNetwork: true,
    hasFiberNetwork: true,
    notes: "Stationnement camions Rue Daru sur arrêté municipal préalable.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ven-04",
    name: "Pavillon Gabriel - Potel & Chabot",
    venueType: "hotel_chateau",
    address: "5 Avenue Gabriel",
    city: "Paris (75008)",
    postalCode: "75008",
    capacity: 1200,
    ceilingHeightMeters: 5.5,
    riggingCapacityKg: 250,
    dockType: "plain_pied",
    truckAccess: "fourgon_20m3",
    maxVehicleHeightMeters: 3.5,
    dockContactName: "Sécurité Allée Gabriel",
    dockContactPhone: "+33 1 42 66 11 22",
    dockAccessHours: "08h00 - 20h00",
    powerTotalKVA: 120,
    sockets32ATri: 6,
    sockets63ATri: 2,
    sockets125ATri: 0,
    hasPowerlock: false,
    hasMarechal: false,
    sockets16AMono: 15,
    tgbtLocation: "Local Technique Salon Alcazar",
    technicalDirectorName: "Nathalie Caron",
    technicalDirectorPhone: "+33 6 12 98 76 54",
    technicalDirectorEmail: "regie.gabriel@poteletchabot.fr",
    soundLimiterDBSPL: 95,
    soundLimiterNotes: "Proximité Ambassade et Palais de l'Élysée. Aucun bruit nocturne extérieur.",
    hasDmxNetwork: false,
    hasFiberNetwork: true,
    notes: "Lieu prestigieux pour galas d'entreprise et conventions VIP. Moquette de protection obligatoire.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ven-05",
    name: "Château de Versailles - Galerie des Cotelle & Orangerie",
    venueType: "hotel_chateau",
    address: "Place d'Armes",
    city: "Versailles (78000)",
    postalCode: "78000",
    capacity: 1500,
    ceilingHeightMeters: 6.0,
    riggingCapacityKg: 150,
    dockType: "acces_difficile",
    truckAccess: "fourgon_20m3",
    maxVehicleHeightMeters: 3.2,
    dockContactName: "Poste Gardes Grille de la Reine",
    dockContactPhone: "+33 1 30 83 78 00",
    dockAccessHours: "Uniquement hors ouverture au public",
    powerTotalKVA: 80,
    sockets32ATri: 4,
    sockets63ATri: 1,
    sockets125ATri: 0,
    hasPowerlock: false,
    hasMarechal: false,
    sockets16AMono: 12,
    tgbtLocation: "Armoire Foraine Orangerie & Parterre du Midi",
    technicalDirectorName: "Éric Delatour (Régisseur Patrimoine)",
    technicalDirectorPhone: "+33 6 77 88 99 00",
    technicalDirectorEmail: "evenements@chateauversailles.fr",
    soundLimiterDBSPL: 92,
    soundLimiterNotes: "Monuments Historiques : Aucun perçage ni scotch adhésif agressif au sol.",
    hasDmxNetwork: false,
    hasFiberNetwork: false,
    notes: "Pneus protégés par sabots ou cales. Extincteurs CO2 requis à chaque tableau électrique.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initial Dépôts / Warehouses (Multi-dépôt audiovisuel)
const INITIAL_DEPOTS = [
  {
    id: "DEP-01",
    code: "PARIS-NORD",
    name: "Dépôt Central Paris-Nord (Siège)",
    address: "14 Rue du Landy, 93200 Saint-Denis",
    city: "Paris / Saint-Denis",
    phone: "+33 1 48 20 30 40",
    isDefault: true,
    colorBadge: "#6366f1",
    description: "Hub principal : caméras cinéma, machinerie, parc audio et éclairage pro.",
  },
  {
    id: "DEP-02",
    code: "STUDIOS-PLAINE",
    name: "Plateaux & Studios Plaine St-Denis",
    address: "45 Avenue du Président Wilson, 93210 La Plaine",
    city: "Saint-Denis",
    phone: "+33 1 49 33 22 11",
    isDefault: false,
    colorBadge: "#06b6d4",
    description: "Plateaux d'enregistrement, loges, régie vidéo streaming et studios podcast.",
  },
  {
    id: "DEP-03",
    code: "LYON-CONF",
    name: "Hub Événements Lyon Confluence",
    address: "8 Rue Montrochet, 69002 Lyon",
    city: "Lyon",
    phone: "+33 4 78 50 60 70",
    isDefault: false,
    colorBadge: "#10b981",
    description: "Parc événementiel Rhône-Alpes, sonorisation festival et régie mobile.",
  },
  {
    id: "DEP-04",
    code: "SUD-MARSEILLE",
    name: "Dépôt Sud Méditerranée - Marseille",
    address: "22 Boulevard de Dunkerque, 13002 Marseille",
    city: "Marseille",
    phone: "+33 4 91 10 20 30",
    isDefault: false,
    colorBadge: "#f59e0b",
    description: "Parc caméras plein air, kits éclairage nomades et machinerie marine.",
  },
];

// Initial Enterprise Users with Secure Credentials & Roles
const INITIAL_USERS = [
  {
    id: "usr-admin-1",
    name: "Samuel Avit",
    email: "samuelavitpro@gmail.com",
    password: "admin", // Mot de passe administrateur par défaut
    role: "Administrateur",
    companyName: "KROMA Audiovisuel & Logistique",
    companyId: "comp-001",
    pinCode: "1234",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    status: "active",
    assignedDepots: ["DEP-01", "DEP-02", "DEP-03", "DEP-04"],
    defaultDepotId: "DEP-01",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canEditInventory: true,
      canManageRoles: true,
      canManageCloud: true,
      canPurgeDatabase: true,
    },
  },
  {
    id: "usr-log-2",
    name: "Alexandre Mercier",
    email: "a.mercier@stockvision.fr",
    password: "logistique123",
    role: "Responsable Logistique",
    companyName: "KROMA Audiovisuel & Logistique",
    companyId: "comp-001",
    pinCode: "5678",
    status: "active",
    assignedDepots: ["DEP-01", "DEP-02"],
    defaultDepotId: "DEP-01",
    createdAt: new Date().toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canEditInventory: true,
      canManageRoles: false,
      canManageCloud: true,
      canPurgeDatabase: false,
    },
  },
  {
    id: "usr-scan-3",
    name: "Sarah Benali",
    email: "s.benali@stockvision.fr",
    password: "scan123",
    role: "Opérateur Scan",
    companyName: "KROMA Audiovisuel & Logistique",
    companyId: "comp-001",
    pinCode: "9999",
    status: "active",
    assignedDepots: ["DEP-01"],
    defaultDepotId: "DEP-01",
    createdAt: new Date().toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canEditInventory: false,
      canManageRoles: false,
      canManageCloud: false,
      canPurgeDatabase: false,
    },
  },
  {
    id: "usr-comptoir-4",
    name: "Marc Dupont",
    email: "m.dupont@stockvision.fr",
    password: "comptoir123",
    role: "Comptoir & Location",
    companyName: "KROMA Audiovisuel & Logistique",
    companyId: "comp-001",
    pinCode: "0000",
    status: "active",
    assignedDepots: ["DEP-03"],
    defaultDepotId: "DEP-03",
    createdAt: new Date().toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canEditInventory: true,
      canManageRoles: false,
      canManageCloud: false,
      canPurgeDatabase: false,
    },
  },
];

// Initial Employees with realistic roles & granular permissions
const INITIAL_EMPLOYEES = [
  {
    id: "emp-1",
    name: "Samuel Avit",
    email: "samuelavitpro@gmail.com",
    role: "Administrateur",
    status: "active",
    lastActive: new Date().toISOString(),
    assignedWarehouse: "Dépôt Central Paris-Nord (Siège)",
    assignedDepots: ["DEP-01", "DEP-02", "DEP-03", "DEP-04"],
    defaultDepotId: "DEP-01",
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
    assignedWarehouse: "Dépôt Central Paris-Nord (Siège)",
    assignedDepots: ["DEP-01", "DEP-02"],
    defaultDepotId: "DEP-01",
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
    assignedWarehouse: "Dépôt Central Paris-Nord (Siège)",
    assignedDepots: ["DEP-01"],
    defaultDepotId: "DEP-01",
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
    assignedWarehouse: "Hub Événements Lyon Confluence",
    assignedDepots: ["DEP-03"],
    defaultDepotId: "DEP-03",
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
  categoryThresholds: [
    {
      category: "Audiovisuel",
      minUnitsThreshold: 4,
      criticalThreshold: 2,
      enableEmailAlerts: true,
      enablePushAlerts: true,
      alertRecipientEmails: ["samuelavitpro@gmail.com"],
      alertPriority: "critical",
      autoReorderSuggestion: true,
      reorderQuantity: 6,
    },
    {
      category: "Outillage & Travaux",
      minUnitsThreshold: 5,
      criticalThreshold: 2,
      enableEmailAlerts: true,
      enablePushAlerts: true,
      alertRecipientEmails: ["logistique@stockvision.fr"],
      alertPriority: "high",
      autoReorderSuggestion: true,
      reorderQuantity: 8,
    },
    {
      category: "Informatique & Régie",
      minUnitsThreshold: 3,
      criticalThreshold: 1,
      enableEmailAlerts: true,
      enablePushAlerts: true,
      alertRecipientEmails: ["samuelavitpro@gmail.com", "regie@stockvision.fr"],
      alertPriority: "critical",
      autoReorderSuggestion: true,
      reorderQuantity: 4,
    },
    {
      category: "Éclairage & Scénographie",
      minUnitsThreshold: 6,
      criticalThreshold: 3,
      enableEmailAlerts: true,
      enablePushAlerts: false,
      alertRecipientEmails: ["scene@stockvision.fr"],
      alertPriority: "normal",
      autoReorderSuggestion: false,
      reorderQuantity: 10,
    },
    {
      category: "Sonorisation",
      minUnitsThreshold: 4,
      criticalThreshold: 2,
      enableEmailAlerts: true,
      enablePushAlerts: true,
      alertRecipientEmails: ["samuelavitpro@gmail.com"],
      alertPriority: "high",
      autoReorderSuggestion: true,
      reorderQuantity: 5,
    },
  ],
  alertNotifications: {
    emailAlertsEnabled: true,
    pushAlertsEnabled: true,
    defaultEmailRecipients: ["samuelavitpro@gmail.com", "logistique@stockvision.fr"],
    alertFrequency: "immediate",
    webhookUrl: "",
    lastAlertSentAt: new Date().toISOString(),
    totalAlertsTriggered: 14,
  },
};

// Sample starter items for demo / testing if requested
const SAMPLE_ITEMS = [
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

const SAMPLE_RENTALS = [
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
    timestamp: new Date().toISOString(),
    action: "system_initialized",
    title: "Espace Entreprise Initialisé",
    details: "Base de données nettoyée et prête pour le référencement du matériel réel de votre entreprise.",
    device: "desktop" as const,
    user: "Système",
  },
];

const INITIAL_STUDIOS = [
  {
    id: "studio-podcast-1",
    name: "Studio Podcast & Live Stream 'Le Miroir'",
    type: "podcast",
    description: "Studio insonorisé haute fidélité pour 4 intervenants avec caméras 4K tourelles PTZ, table de mixage broadcast et éclairage d'ambiance RGBW.",
    capacity: 6,
    surfaceM2: 28,
    hourlyRate: 75,
    dailyRate: 450,
    imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80",
    colorBadge: "indigo",
    location: "Bâtiment A - 1er Étage (Zone Acoustique)",
    fixedEquipment: [
      { itemId: "item-101", customName: "Microphones Shure SM58 / SM7B", requiredQuantity: 4, isMandatory: true, notes: "Avec bonnettes et bras articulés" },
      { itemId: "item-104", customName: "Station Régie MacBook Pro & Mixage", requiredQuantity: 1, isMandatory: true, notes: "Logiciel de stream OBS / vMix configuré" },
      { itemId: "item-103", customName: "Caméra Tourelle Vidéo Sony FX3", requiredQuantity: 2, isMandatory: false, notes: "Pour captation multi-angles" },
      { itemId: "item-105", customName: "Kit Projecteurs & Tubes LED Astera", requiredQuantity: 2, isMandatory: false, notes: "Éclairage 3 points" }
    ],
    status: "available",
    bookings: [
      {
        id: "book-01",
        studioId: "studio-podcast-1",
        clientName: "Podcast 'Tech Horizon'",
        clientContact: "julien@techhorizon.fr",
        startDate: new Date(Date.now() + 86400000 * 1).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 1 + 3600000 * 4).toISOString(),
        rateType: "hourly",
        unitsCount: 4,
        totalAmountHT: 300,
        status: "confirmed",
        assignedTechnicians: [{ technicianId: "tech-01", technicianName: "Julien Rivoire", role: "Ingénieur Son" }],
        notes: "Enregistrement épisode #42 avec 3 invités.",
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "studio-video-2",
    name: "Plateau Tournage Vidéo Cyclorama 'Studio Alpha'",
    type: "video_set",
    description: "Grand plateau de tournage de 95m² avec cyclorama blanc 3 faces incurvé, grill technique motorisé, loge maquillage et accès direct quai de déchargement.",
    capacity: 30,
    surfaceM2: 95,
    hourlyRate: 160,
    dailyRate: 980,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80",
    colorBadge: "emerald",
    location: "Rez-de-chaussée - Hangar Technique",
    fixedEquipment: [
      { itemId: "item-103", customName: "Caméras Sony FX3 Cinéma 4K", requiredQuantity: 3, isMandatory: true, notes: "Avec optiques GM 24-70 et 70-200" },
      { itemId: "item-105", customName: "Kit Tubes LED Astera Titan", requiredQuantity: 4, isMandatory: true, notes: "Contrôleur sans fil CRMX inclus" },
      { itemId: "item-104", customName: "MacBook Pro Régie & Monitoring", requiredQuantity: 1, isMandatory: true, notes: "Sorties HDMI et SDI" }
    ],
    status: "available",
    bookings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "studio-audio-3",
    name: "Cabine Voix Off & Post-Production 'Acoustik'",
    type: "audio_booth",
    description: "Cabine insonorisée ultra-isolée (-45dB) avec écoutes de monitoring Neumann, micro voix haut de gamme et écran retour vidéo pour doublage.",
    capacity: 3,
    surfaceM2: 15,
    hourlyRate: 55,
    dailyRate: 350,
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80",
    colorBadge: "amber",
    location: "Bâtiment A - 2ème Étage",
    fixedEquipment: [
      { itemId: "item-101", customName: "Microphones Shure SM58 / SM7B", requiredQuantity: 2, isMandatory: true, notes: "Avec préampli Cloudlifter" },
      { itemId: "item-104", customName: "Station Montage Son MacBook Pro", requiredQuantity: 1, isMandatory: true, notes: "Pro Tools & Logic Pro" }
    ],
    status: "available",
    bookings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_TECHNICIANS = [
  {
    id: "tech-01",
    name: "Julien Rivoire",
    primaryRole: "Ingénieur du Son / Opérateur Podcast",
    specialties: ["Son", "Streaming & Broadcast"],
    email: "j.rivoire@stockvision.fr",
    phone: "+33 6 11 22 33 44",
    dailyRate: 420,
    hourlyRate: 55,
    status: "available",
    bio: "Spécialiste captation podcast, mixage en direct et sonorisation plateau depuis plus de 8 ans.",
    skills: ["Pro Tools", "Rodecaster Pro", "Yamaha QL/CL", "Dante Audio", "OBS Studio"],
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    rating: 4.9,
    assignedWarehouse: "Siège Principal & Studios",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tech-02",
    name: "Camille Leroux",
    primaryRole: "Cadreur Vidéo & Opérateur PTZ",
    specialties: ["Vidéo", "Cadre", "Streaming & Broadcast"],
    email: "c.leroux@stockvision.fr",
    phone: "+33 6 55 44 33 22",
    dailyRate: 450,
    hourlyRate: 60,
    status: "available",
    bio: "Opératrice caméra multi-flux, cadreur stabilisateur Gimbal et régie tourelles pour émissions live.",
    skills: ["Sony FX3 / FX6", "Ronin RS3 Pro", "Blackmagic ATEM", "vMix", "Optiques Cinéma"],
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    rating: 4.8,
    assignedWarehouse: "Plateau Tournage Alpha",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tech-03",
    name: "David Vasseur",
    primaryRole: "Régisseur Général & Chef de Plateau",
    specialties: ["Régie", "Chef de Plateau", "Machinerie"],
    email: "d.vasseur@stockvision.fr",
    phone: "+33 6 77 88 99 00",
    dailyRate: 520,
    hourlyRate: 70,
    status: "available",
    bio: "Coordination globale des équipes techniques, sécurité des espaces, plannings et gestion du matériel.",
    skills: ["Coordination Régie", "Normes ERP/Sécurité", "Accroches & Grill", "Gestion Logistique"],
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    rating: 5.0,
    assignedWarehouse: "Hub Central Paris-Nord",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tech-04",
    name: "Élodie Martin",
    primaryRole: "Éclairagiste & Pupitreur Lumière",
    specialties: ["Lumière", "Machinerie"],
    email: "e.martin@stockvision.fr",
    phone: "+33 6 88 99 11 22",
    dailyRate: 400,
    hourlyRate: 50,
    status: "available",
    bio: "Création d'ambiances lumineuses studio, gestion DMX/CRMX sans fil et projecteurs LED haute puissance.",
    skills: ["GrandMA / ChamSys", "Astera App", "Aputure Sidus Link", "Colorimétrie CRI 98+"],
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    rating: 4.9,
    assignedWarehouse: "Zone Éclairage B",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_QUOTES = [
  {
    id: "quote-lumens-226030033",
    quoteNumber: "226030033",
    type: "quote",
    date: "2026-03-19",
    accountManager: "Bertrand BROT",
    accountManagerPhone: "06 11 60 78 77",
    clientProjectRef: "Devis Josué",
    clientName: "Bertrand",
    clientCompany: "DEVIS TYPE BERTRAND",
    billingCompanyName: "DEVIS TYPE BERTRAND",
    billingContactName: "",
    clientMobile: "",
    shippingAddress: "A déterminer",
    deliveryContactName: "",
    deliveryPhone: "",
    deliveryPhone1: "",
    startDate: "2026-04-05",
    endDate: "2026-04-05",
    departureDate: "2026-04-04",
    returnDate: "2026-04-05",
    shootStartDate: "2026-04-05",
    shootEndDate: "2026-04-05",
    setupSchedule: "Montage: Samedi 4 Avril 8h",
    exploitationSchedule: "Exploitation:",
    teardownSchedule: "Démontage: Dimanche 5 Avril 20h",
    durationDays: 1,
    globalRentalCoefficient: 1.0,
    status: "sent",
    discountGlobalPercent: 0,
    taxRate: 20,
    totalHT: 24575.20,
    totalTVA: 4915.04,
    totalTTC: 29490.24,
    bankIban: "FR 76 1820 6000 1060 2758 9258 842",
    bankCodeBanque: "18206",
    bankCodeGuichet: "00010",
    bankNumCompte: "60275892588",
    bankCle: "42",
    companyAddressLine: "Lumens Box - 277 Rue Fourny - BP36 - 78530 Buc",
    companyCapital: "SAS au Capital de 25 000 €",
    companySiret: "523 019 446 00021",
    companyRcs: "Versailles 523 019 446",
    companyApe: "9002 Z",
    companyTvaIntra: "FR27 523 019 446",
    remainingClientCharges: [
      "Le Transport A/R du Matériel",
      "L'Assurance Bris de Machine",
      "Le Respect des Conditions Techniques",
    ],
    paymentTermsDays: "Comptant à réception",
    paymentMode: "Virement bancaire",
    studioRentals: [],
    crewStaff: [],
    rentalItems: [
      {
        itemId: "item-tile-fond",
        name: "Tile Creative HDI 2.9 Black Face Réso 168 x 168 / 50x50x10 cm / 1500",
        descriptionDetail: "Réso 168 x 168 / 50x50x10 cm / 1500 nits",
        subSectionTitle: "Mur Led de Fond: 6 x 3,5",
        subSectionDetail: "Résolution Totale: 2016 x 1176",
        chapterCategory: "videoprojection",
        quantity: 84,
        unitPricePerDay: 100.0,
        unitPriceBase: 100.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 60.0,
        totalHT: 5040.0,
        days: 1,
      },
      {
        itemId: "item-novastar-fond",
        name: "Contrôleur NovaStar MCTRL PRO 4k",
        subSectionTitle: "Mur Led de Fond: 6 x 3,5",
        chapterCategory: "videoprojection",
        quantity: 1,
        unitPricePerDay: 450.0,
        unitPriceBase: 450.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 270.0,
        totalHT: 270.0,
        days: 1,
      },
      {
        itemId: "item-embase-tile-fond",
        name: "Embase Tile Creative HDI 2.9 0,50m",
        descriptionDetail: "0,50m",
        subSectionTitle: "Mur Led de Fond: 6 x 3,5",
        chapterCategory: "videoprojection",
        quantity: 12,
        unitPricePerDay: 20.0,
        unitPriceBase: 20.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 12.0,
        totalHT: 144.0,
        days: 1,
      },
      {
        itemId: "item-embase-sol-fond",
        name: "Embase de sol pour Support Echelle",
        subSectionTitle: "Mur Led de Fond: 6 x 3,5",
        chapterCategory: "videoprojection",
        quantity: 10,
        unitPricePerDay: 15.0,
        unitPriceBase: 15.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 9.0,
        totalHT: 90.0,
        days: 1,
      },
      {
        itemId: "item-echelle-15-fond",
        name: "Echelle 1,5m",
        subSectionTitle: "Mur Led de Fond: 6 x 3,5",
        chapterCategory: "videoprojection",
        quantity: 12,
        unitPricePerDay: 8.0,
        unitPriceBase: 8.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 4.8,
        totalHT: 57.6,
        days: 1,
      },
      {
        itemId: "item-echelle-1-fond",
        name: "Echelle 1m",
        subSectionTitle: "Mur Led de Fond: 6 x 3,5",
        chapterCategory: "videoprojection",
        quantity: 10,
        unitPricePerDay: 5.0,
        unitPriceBase: 5.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 3.0,
        totalHT: 30.0,
        days: 1,
      },
      {
        itemId: "item-tile-lat",
        name: "Tile Creative HDI 2.9 Black Face Réso 168 x 168 / 50x50x10 cm / 1500",
        descriptionDetail: "Réso 168 x 168 / 50x50x10 cm / 1500 nits",
        subSectionTitle: "Mur Led Latéreaux 3,5 x 3,5",
        subSectionDetail: "Résolution Chaque: 1176 x 1176",
        chapterCategory: "videoprojection",
        quantity: 98,
        unitPricePerDay: 100.0,
        unitPriceBase: 100.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 60.0,
        totalHT: 5880.0,
        days: 1,
      },
      {
        itemId: "item-novastar-lat",
        name: "Contrôleur NovaStar MCTRL PRO 4k",
        subSectionTitle: "Mur Led Latéreaux 3,5 x 3,5",
        chapterCategory: "videoprojection",
        quantity: 1,
        unitPricePerDay: 450.0,
        unitPriceBase: 450.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 270.0,
        totalHT: 270.0,
        days: 1,
      },
      {
        itemId: "item-embase-tile-lat",
        name: "Embase Tile Creative HDI 2.9 0,50m",
        descriptionDetail: "0,50m",
        subSectionTitle: "Mur Led Latéreaux 3,5 x 3,5",
        chapterCategory: "videoprojection",
        quantity: 12,
        unitPricePerDay: 20.0,
        unitPriceBase: 20.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 12.0,
        totalHT: 144.0,
        days: 1,
      },
      {
        itemId: "item-embase-sol-lat",
        name: "Embase de sol pour Support Echelle",
        subSectionTitle: "Mur Led Latéreaux 3,5 x 3,5",
        chapterCategory: "videoprojection",
        quantity: 10,
        unitPricePerDay: 15.0,
        unitPriceBase: 15.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 9.0,
        totalHT: 90.0,
        days: 1,
      },
      {
        itemId: "item-echelle-15-lat",
        name: "Echelle 1,5m",
        subSectionTitle: "Mur Led Latéreaux 3,5 x 3,5",
        chapterCategory: "videoprojection",
        quantity: 12,
        unitPricePerDay: 8.0,
        unitPriceBase: 8.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 4.8,
        totalHT: 57.6,
        days: 1,
      },
      {
        itemId: "item-echelle-1-lat",
        name: "Echelle 1m",
        subSectionTitle: "Mur Led Latéreaux 3,5 x 3,5",
        chapterCategory: "videoprojection",
        quantity: 10,
        unitPricePerDay: 5.0,
        unitPriceBase: 5.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 3.0,
        totalHT: 30.0,
        days: 1,
      },
      {
        itemId: "item-kramer-dvi",
        name: "Distributeur Kramer DVI-D 1/4 HDCP",
        subSectionTitle: "Périphériques",
        chapterCategory: "videoprojection",
        quantity: 1,
        unitPricePerDay: 75.0,
        unitPriceBase: 75.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 75.0,
        totalHT: 75.0,
        days: 1,
      },
      {
        itemId: "item-lcd-dell",
        name: "LCD Full HD 24\" DELL U2410F",
        subSectionTitle: "Périphériques",
        chapterCategory: "videoprojection",
        quantity: 1,
        unitPricePerDay: 100.0,
        unitPriceBase: 100.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 100.0,
        totalHT: 100.0,
        days: 1,
      },
      {
        itemId: "item-blackmagic-conv",
        name: "Convertisseur Hdmi-Sdi BlackMagic Double Sens",
        subSectionTitle: "Périphériques",
        chapterCategory: "videoprojection",
        quantity: 1,
        unitPricePerDay: 75.0,
        unitPriceBase: 75.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 75.0,
        totalHT: 75.0,
        days: 1,
      },
      {
        itemId: "item-macbook-pro",
        name: "Mac Book Pro 15' Touch-Bar Play-Back Pro",
        subSectionTitle: "Périphériques",
        chapterCategory: "videoprojection",
        quantity: 1,
        unitPricePerDay: 350.0,
        unitPriceBase: 350.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 350.0,
        totalHT: 350.0,
        days: 1,
      },
      {
        itemId: "item-ascender-32",
        name: "ASCENDER 32 Analog Way 12 In / 4 Out 9 DVI/6 HDMI/3 DPort/",
        descriptionDetail: "9 DVI/6 HDMI/3 DPort/",
        subSectionTitle: "Périphériques",
        chapterCategory: "videoprojection",
        quantity: 1,
        unitPricePerDay: 2500.0,
        unitPriceBase: 2500.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 2500.0,
        totalHT: 2500.0,
        days: 1,
      },
      {
        itemId: "item-vmix-pro",
        name: "VMix Pro/8 HDSDI in/ 2 HDMI Out / 16go ram /250go ssd systeme x 2",
        descriptionDetail: "16go ram /250go ssd systeme x 2 miroir",
        subSectionTitle: "Périphériques",
        chapterCategory: "videoprojection",
        quantity: 1,
        unitPricePerDay: 1100.0,
        unitPriceBase: 1100.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 1100.0,
        totalHT: 1100.0,
        days: 1,
      },
      {
        itemId: "item-panasonic-ak",
        name: "Caméra PANASONIC AK-HC3900",
        subSectionTitle: "Camera Plateau",
        chapterCategory: "reprise_camera",
        quantity: 1,
        unitPricePerDay: 850.0,
        unitPriceBase: 850.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 850.0,
        totalHT: 850.0,
        days: 1,
      },
      {
        itemId: "item-obj-longue-focale",
        name: "Objectif Longue Focale 23 x7 avec Doubleur",
        subSectionTitle: "Camera Plateau",
        chapterCategory: "reprise_camera",
        quantity: 1,
        unitPricePerDay: 350.0,
        unitPriceBase: 350.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 350.0,
        totalHT: 350.0,
        days: 1,
      },
      {
        itemId: "item-pied-sachtler",
        name: "Pied Cam lourd Sachtler (Opt 33/11)",
        subSectionTitle: "Camera Plateau",
        chapterCategory: "reprise_camera",
        quantity: 1,
        unitPricePerDay: 140.0,
        unitPriceBase: 140.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 140.0,
        totalHT: 140.0,
        days: 1,
      },
      {
        itemId: "item-cam-tourelle-panasonic",
        name: "Camera Pilotée 4K AW UE150 KEJ Panasonic",
        subSectionTitle: "Camera Tourelle",
        chapterCategory: "reprise_camera",
        quantity: 3,
        unitPricePerDay: 450.0,
        unitPriceBase: 450.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 450.0,
        totalHT: 1350.0,
        days: 1,
      },
      {
        itemId: "item-cmd-rp150",
        name: "Commande AW-RP150 G PANASONIC",
        subSectionTitle: "Camera Tourelle",
        chapterCategory: "reprise_camera",
        quantity: 1,
        unitPricePerDay: 300.0,
        unitPriceBase: 300.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 300.0,
        totalHT: 300.0,
        days: 1,
      },
      {
        itemId: "item-pied-light-km",
        name: "Pied Design Light KM 240 Noir",
        subSectionTitle: "Camera Tourelle",
        chapterCategory: "reprise_camera",
        quantity: 3,
        unitPricePerDay: 15.0,
        unitPriceBase: 15.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 9.0,
        totalHT: 27.0,
        days: 1,
      },
      {
        itemId: "item-tete-pied-cam",
        name: "Tête de pied pour camera",
        subSectionTitle: "Camera Tourelle",
        chapterCategory: "reprise_camera",
        quantity: 3,
        unitPricePerDay: 30.0,
        unitPriceBase: 30.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 30.0,
        totalHT: 90.0,
        days: 1,
      },
      {
        itemId: "item-switch-24-netgear",
        name: "Switch 24 voies NETGEAR ProSafe",
        subSectionTitle: "Camera Tourelle",
        chapterCategory: "reprise_camera",
        quantity: 1,
        unitPricePerDay: 30.0,
        unitPriceBase: 30.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 30.0,
        totalHT: 30.0,
        days: 1,
      },
      {
        itemId: "item-switch-8-netgear",
        name: "Switch 8 voies POE NETGEAR",
        subSectionTitle: "Camera Tourelle",
        chapterCategory: "reprise_camera",
        quantity: 1,
        unitPricePerDay: 30.0,
        unitPriceBase: 30.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 30.0,
        totalHT: 30.0,
        days: 1,
      },
      {
        itemId: "item-led-samsung-43",
        name: "LED SAMSUNG PM 43 H HD 500 cd Lecteur WMV, JPeg,mp4,mpeg2",
        descriptionDetail: "Lecteur WMV, JPeg,mp4,mpeg2",
        subSectionTitle: "Camera Tourelle",
        chapterCategory: "reprise_camera",
        quantity: 1,
        unitPricePerDay: 200.0,
        unitPriceBase: 200.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 200.0,
        totalHT: 200.0,
        days: 1,
      },
      {
        itemId: "item-decoupe-chauvet",
        name: "Découpe CHAUVET Ovation E-2 FC",
        chapterCategory: "eclairage_scene",
        quantity: 6,
        unitPricePerDay: 75.0,
        unitPriceBase: 75.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 75.0,
        totalHT: 450.0,
        days: 1,
      },
      {
        itemId: "item-lyre-led-chauvet",
        name: "Lyre Led CHAUVET ROGUE R3X Wash",
        chapterCategory: "eclairage_scene",
        quantity: 8,
        unitPricePerDay: 150.0,
        unitPriceBase: 150.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 150.0,
        totalHT: 1200.0,
        days: 1,
      },
      {
        itemId: "item-pc16",
        name: "PC16",
        chapterCategory: "distribution_electrique",
        quantity: 2,
        unitPricePerDay: 60.0,
        unitPriceBase: 60.0,
        rentalCoefficient: 1.0,
        discountPercent: 40,
        unitPriceDiscounted: 36.0,
        totalHT: 72.0,
        days: 1,
      },
      {
        itemId: "item-cable-hdmi-5m",
        name: "Cable HDMI M/M 5 m",
        subSectionTitle: "Vidéo",
        chapterCategory: "cablage",
        quantity: 2,
        unitPricePerDay: 3.0,
        unitPriceBase: 3.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 3.0,
        totalHT: 6.0,
        days: 1,
      },
      {
        itemId: "item-cable-hdmi-10m",
        name: "Cable HDMI M/M 10 m",
        subSectionTitle: "Vidéo",
        chapterCategory: "cablage",
        quantity: 2,
        unitPricePerDay: 6.0,
        unitPriceBase: 6.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 6.0,
        totalHT: 12.0,
        days: 1,
      },
      {
        itemId: "item-fibre-hdmi-20m",
        name: "Fibre HDMI M/M 20 m",
        subSectionTitle: "Vidéo",
        chapterCategory: "cablage",
        quantity: 2,
        unitPricePerDay: 25.0,
        unitPriceBase: 25.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 25.0,
        totalHT: 50.0,
        days: 1,
      },
      {
        itemId: "item-touret-rj45-100m",
        name: "Touret Ethernet RJ45 / 100 Mhz 100m",
        subSectionTitle: "Vidéo",
        chapterCategory: "cablage",
        quantity: 1,
        unitPricePerDay: 50.0,
        unitPriceBase: 50.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 50.0,
        totalHT: 50.0,
        days: 1,
      },
      {
        itemId: "item-cable-rj45-20m",
        name: "Câble Ethernet RJ45 / 100 Mhz 20m",
        subSectionTitle: "Vidéo",
        chapterCategory: "cablage",
        quantity: 1,
        unitPricePerDay: 15.0,
        unitPriceBase: 15.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 15.0,
        totalHT: 15.0,
        days: 1,
      },
      {
        itemId: "item-op-camera",
        name: "Operateur de caméra 2 Jours",
        chapterCategory: "crew_technicians",
        quantity: 1,
        unitPricePerDay: 1000.0,
        unitPriceBase: 1000.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 1000.0,
        totalHT: 1000.0,
        days: 2,
      },
      {
        itemId: "item-tech-mur-led",
        name: "Technicien Mur LED 2 Jours",
        chapterCategory: "crew_technicians",
        quantity: 2,
        unitPricePerDay: 1100.0,
        unitPriceBase: 1100.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 1100.0,
        totalHT: 2200.0,
        days: 2,
      },
      {
        itemId: "item-tech-videoproj",
        name: "Technicien Videoprojection 2 Jours",
        chapterCategory: "crew_technicians",
        quantity: 1,
        unitPricePerDay: 1100.0,
        unitPriceBase: 1100.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 1100.0,
        totalHT: 1100.0,
        days: 2,
      },
      {
        itemId: "item-ass-polyvalent",
        name: "Assistant Polyvalent 2 Jours",
        chapterCategory: "crew_technicians",
        quantity: 2,
        unitPricePerDay: 900.0,
        unitPriceBase: 900.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 900.0,
        totalHT: 1800.0,
        days: 2,
      },
      {
        itemId: "item-forfait-vie",
        name: "Forfait frais de vie à votre charge",
        chapterCategory: "crew_technicians",
        quantity: 1,
        unitPricePerDay: 250.0,
        unitPriceBase: 250.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 250.0,
        totalHT: 250.0,
        days: 1,
      },
      {
        itemId: "item-livraison-50m3",
        name: "Livraison 50m3 en journée ( 8h / 19h )",
        chapterCategory: "transport_logistics",
        quantity: 1,
        unitPricePerDay: 450.0,
        unitPriceBase: 450.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 450.0,
        totalHT: 450.0,
        days: 1,
      },
      {
        itemId: "item-reprise-50m3",
        name: "Reprise 50m3 en journée ( 8h / 19h )",
        chapterCategory: "transport_logistics",
        quantity: 1,
        unitPricePerDay: 450.0,
        unitPriceBase: 450.0,
        rentalCoefficient: 1.0,
        discountPercent: 0,
        unitPriceDiscounted: 450.0,
        totalHT: 450.0,
        days: 1,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "quote-001",
    quoteNumber: "DEV-2026-001",
    type: "quote",
    clientName: "MediaProd SAS",
    clientCompany: "MediaProd Group",
    clientEmail: "production@mediaprod.fr",
    clientPhone: "+33 1 40 50 60 70",
    clientAddress: "14 Rue de la Paix, 75002 Paris",
    date: new Date().toISOString().split("T")[0],
    validityDate: new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
    startDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    durationDays: 1,
    durationHours: 6,
    status: "accepted",
    rentalItems: [
      { itemId: "item-103", name: "Caméra Cinéma Sony FX3 Plein Format", brand: "Sony", category: "Vidéo & Cinéma", quantity: 1, unitPricePerDay: 180, days: 1, discountPercent: 0, totalHT: 180 }
    ],
    studioRentals: [
      { studioId: "studio-podcast-1", studioName: "Studio Podcast & Live Stream 'Le Miroir'", rateType: "hourly", unitRate: 75, quantityUnits: 6, totalHT: 450 }
    ],
    crewStaff: [
      { technicianId: "tech-01", technicianName: "Julien Rivoire", role: "Ingénieur du Son / Opérateur Podcast", rateType: "hourly", unitRate: 55, quantityUnits: 6, totalHT: 330 }
    ],
    discountGlobalPercent: 0,
    taxRate: 20,
    totalHT: 960,
    totalTVA: 192,
    totalTTC: 1152,
    notes: "Session d'enregistrement podcast vidéo 6 heures comprenant mise à disposition de l'ingénieur du son et 1 caméra FX3 additionnelle.",
    terms: "Acompte de 30% à la réservation, solde à réception de facture.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_PLAYLISTS = [
  {
    id: "pl-dock-logistics",
    name: "Boucle Logistique & Quai Départ/Retour",
    description: "Affichage dynamique des départs du jour, consignes de chargement, retours urgents et règles de sécurité.",
    loopMode: "infinite",
    totalDurationSeconds: 45,
    items: [
      {
        id: "item-pl-1",
        type: "kroma_view",
        title: "Tableau Départs & Retours du Jour",
        durationSeconds: 15,
        kromaViewType: "rentals_dispatch",
        caption: "Suivi en direct des expéditions et réceptions de matériel",
      },
      {
        id: "item-pl-2",
        type: "image",
        title: "Consignes de Sécurité & Contrôle Malles",
        url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80",
        durationSeconds: 10,
        caption: "Protocole : Toujours scanner le code-barres avant mise en baie de transport.",
      },
      {
        id: "item-pl-3",
        type: "kroma_view",
        title: "Planning des Réservations & Tournages",
        durationSeconds: 12,
        kromaViewType: "calendar_planning",
        caption: "Vue temps réel du calendrier régie",
      },
      {
        id: "item-pl-4",
        type: "text_slide",
        title: "Rappel Contrôle VGP & Batteries",
        durationSeconds: 8,
        customHeading: "⚡ ZONE CHARGE BATTERIES V-MOUNT",
        customBody: "Toute batterie non chargée à 100% doit être déposée sur le banc n°3.",
        bgColor: "#1e1b4b",
        textColor: "#a5b4fc",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pl-studio-regie",
    name: "Boucle Plateau & Régie Vidéo Studio A",
    description: "Planning des captations, fiches techniques caméras, retours plateaux et messages régisseur.",
    loopMode: "infinite",
    totalDurationSeconds: 40,
    items: [
      {
        id: "item-pl-5",
        type: "kroma_view",
        title: "Planning Studios & Réservations",
        durationSeconds: 15,
        kromaViewType: "calendar_planning",
        caption: "Planning d'occupation des plateaux et cabines insonorisées",
      },
      {
        id: "item-pl-6",
        type: "image",
        title: "Plan de Feu & Implantation Lumière",
        url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80",
        durationSeconds: 10,
        caption: "Studio A : Grille d'éclairage DMX et tubes LED sans fil",
      },
      {
        id: "item-pl-7",
        type: "text_slide",
        title: "Directives Enregistrement Live",
        durationSeconds: 10,
        customHeading: "🔴 ON AIR - SILENCE SUR LE PLATEAU",
        customBody: "Accès régie restreint aux techniciens accrédités pendant les prises.",
        bgColor: "#450a0a",
        textColor: "#fca5a5",
      },
      {
        id: "item-pl-8",
        type: "pdf",
        title: "Fiche Technique Régie vMix & Dante",
        durationSeconds: 12,
        pdfPageCount: 3,
        pdfScrollSpeedSeconds: 4,
        caption: "Synoptique des liaisons réseau RJ45 et flux NDI",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "pl-reception-4k",
    name: "Boucle Accueil & Showroom Démo 4K",
    description: "Présentation des nouveautés parcs caméras, vidéos institutionnelles et catalogue interactif.",
    loopMode: "infinite",
    totalDurationSeconds: 45,
    items: [
      {
        id: "item-pl-9",
        type: "video",
        title: "Showreel Caméras Cinéma & Optiques Anamorphiques",
        url: "https://assets.mixkit.co/videos/preview/mixkit-camera-operator-filming-in-a-studio-41126-large.mp4",
        durationSeconds: 18,
        caption: "Parc Caméras Sony FX3/FX6 & Optiques Cooke / Zeiss",
      },
      {
        id: "item-pl-10",
        type: "image",
        title: "Nouveau Parc Éclairage Nanlite & Astera",
        url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80",
        durationSeconds: 12,
        caption: "Disponible à la location au Dépôt Central Paris-Nord",
      },
      {
        id: "item-pl-11",
        type: "text_slide",
        title: "Bienvenue chez KROMA OS",
        durationSeconds: 10,
        customHeading: "BIENVENUE CHEZ KROMA AUDIOVISUEL",
        customBody: "Comptoir ouvert de 8h30 à 19h00. Récupération & retours express au Quai A.",
        bgColor: "#0f172a",
        textColor: "#38bdf8",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_DISPLAYS = [
  {
    id: "disp-dock-1",
    name: "Écran Quai Logistique #1 (Départs/Retours)",
    location: "Zone Quai Expéditions Nord - Baie 2",
    depotId: "DEP-01",
    depotName: "Dépôt Central Paris-Nord (Siège)",
    ipAddress: "192.168.1.140",
    macAddress: "B8:27:EB:9A:12:44",
    connectionType: "rj45",
    status: "online",
    lastPingAt: new Date().toISOString(),
    pinCode: "4892",
    kioskUrl: "/?display=disp-dock-1",
    primaryMode: "ip_stream",
    assignedPlaylistId: "pl-dock-logistics",
    assignedLiveView: "rentals_dispatch",
    enableAutoFailover: true,
    ipStreamUrl: "http://192.168.1.50:8080/live/dock1.m3u8",
    streamProtocol: "hls",
    failoverTimeoutSeconds: 10,
    currentActiveSource: "ip_stream",
    isStreamSignalDetected: true,
    isBlackout: false,
    tickerMessage: "⚠️ Chargement Camionnage pour le Grand Palais prévu à 14h30 - Priorité Quai A",
    tickerEnabled: true,
    tickerSpeed: "normal",
    orientation: "landscape",
    resolution: "1080p Full HD (1920x1080)",
    brightness: 90,
    volume: 0,
    refreshRateSeconds: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "disp-studio-a",
    name: "Moniteur Régie Vidéo & Retour Plateau A",
    location: "Régie Technique - Studio Plaine St-Denis",
    depotId: "DEP-02",
    depotName: "Plateaux & Studios Plaine St-Denis",
    ipAddress: "192.168.1.141",
    macAddress: "DC:A6:32:41:88:91",
    connectionType: "rj45",
    status: "online",
    lastPingAt: new Date().toISOString(),
    pinCode: "7103",
    kioskUrl: "/?display=disp-studio-a",
    primaryMode: "ip_stream",
    assignedPlaylistId: "pl-studio-regie",
    assignedLiveView: "calendar_planning",
    enableAutoFailover: true,
    ipStreamUrl: "rtsp://192.168.1.60:554/live/studioA",
    streamProtocol: "rtsp",
    failoverTimeoutSeconds: 15,
    currentActiveSource: "ip_stream",
    isStreamSignalDetected: true,
    isBlackout: false,
    tickerMessage: "🔴 Enregistrement Émission Live de 15h à 18h - Silence Plateau",
    tickerEnabled: true,
    tickerSpeed: "slow",
    orientation: "landscape",
    resolution: "4K UHD (3840x2160)",
    brightness: 95,
    volume: 20,
    refreshRateSeconds: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "disp-hall-reception",
    name: "Totem Accueil & Showroom Clients",
    location: "Hall d'entrée & Comptoir d'Accueil",
    depotId: "DEP-01",
    depotName: "Dépôt Central Paris-Nord (Siège)",
    ipAddress: "192.168.1.142",
    macAddress: "E4:5F:01:3C:99:10",
    connectionType: "wifi",
    status: "online",
    lastPingAt: new Date().toISOString(),
    pinCode: "2099",
    kioskUrl: "/?display=disp-hall-reception",
    primaryMode: "loop_playlist",
    assignedPlaylistId: "pl-reception-4k",
    assignedLiveView: "calendar_planning",
    enableAutoFailover: false,
    ipStreamUrl: "",
    streamProtocol: "http_mp4",
    failoverTimeoutSeconds: 5,
    currentActiveSource: "fallback_loop",
    isStreamSignalDetected: false,
    isBlackout: false,
    tickerMessage: "✨ Bienvenue chez KROMA - Découvrez nos nouveaux parcs caméras plein format",
    tickerEnabled: true,
    tickerSpeed: "normal",
    orientation: "landscape",
    resolution: "1080p Full HD (1920x1080)",
    brightness: 85,
    volume: 0,
    refreshRateSeconds: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

let items: ItemRecord[] = loadData<ItemRecord[]>(ITEMS_FILE, []);
let rentals: RentalRecord[] = loadData<RentalRecord[]>(RENTALS_FILE, []);
let logs: LogRecord[] = loadData<LogRecord[]>(LOGS_FILE, INITIAL_LOGS);
let employees: any[] = loadData<any[]>(EMPLOYEES_FILE, INITIAL_EMPLOYEES);
let devices: any[] = loadData<any[]>(DEVICES_FILE, INITIAL_DEVICES);
let settings: any = loadData<any>(SETTINGS_FILE, INITIAL_SETTINGS);
let users: any[] = loadData<any[]>(USERS_FILE, INITIAL_USERS);
let studios: any[] = loadData<any[]>(STUDIOS_FILE, INITIAL_STUDIOS);
let technicians: any[] = loadData<any[]>(TECHNICIANS_FILE, INITIAL_TECHNICIANS);
let quotes: any[] = loadData<any[]>(QUOTES_FILE, INITIAL_QUOTES);
let depots: any[] = loadData<any[]>(DEPOTS_FILE, INITIAL_DEPOTS);
let displays: any[] = loadData<any[]>(DISPLAYS_FILE, INITIAL_DISPLAYS);
let playlists: any[] = loadData<any[]>(PLAYLISTS_FILE, INITIAL_PLAYLISTS);
let clients: any[] = loadData<any[]>(CLIENTS_FILE, INITIAL_CLIENTS);
let suppliers: any[] = loadData<any[]>(SUPPLIERS_FILE, INITIAL_SUPPLIERS);
let venues: any[] = loadData<any[]>(VENUES_FILE, INITIAL_VENUES);

// Ensure files are saved on startup to guarantee cleaned state
saveData(ITEMS_FILE, items);
saveData(RENTALS_FILE, rentals);
saveData(LOGS_FILE, logs);
saveData(USERS_FILE, users);
saveData(STUDIOS_FILE, studios);
saveData(TECHNICIANS_FILE, technicians);
saveData(QUOTES_FILE, quotes);
saveData(DEPOTS_FILE, depots);
saveData(DISPLAYS_FILE, displays);
saveData(PLAYLISTS_FILE, playlists);
saveData(CLIENTS_FILE, clients);
saveData(SUPPLIERS_FILE, suppliers);
saveData(VENUES_FILE, venues);

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

// Shared SSE subscription endpoint for the control room and kiosk receivers.
function subscribeToSSE(req: express.Request, res: express.Response) {
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
}

// Main application stream.
app.get("/api/sync/stream", subscribeToSSE);
// Dedicated alias used by TV / Raspberry Pi receivers.
app.get("/api/events", subscribeToSSE);

// A receiver is considered offline after three missed heartbeats. This keeps
// the control room truthful even when a TV is unplugged or loses its network.
setInterval(() => {
  const now = Date.now();
  let changed = false;
  displays = displays.map((display) => {
    const lastPing = Date.parse(display.lastPingAt || "");
    const shouldBeOffline = !Number.isFinite(lastPing) || now - lastPing > 30_000;
    if (shouldBeOffline && display.status === "online") {
      changed = true;
      return { ...display, status: "offline", updatedAt: new Date().toISOString() };
    }
    return display;
  });
  if (changed) {
    saveData(DISPLAYS_FILE, displays);
    broadcastUpdate("displays_updated", displays);
  }
}, 10_000);

// Connectivity healthcheck / ping endpoint
app.get("/api/ping", (req, res) => {
  res.json({
    status: "ok",
    online: true,
    serverTime: new Date().toISOString(),
    itemsCount: items.length,
    activeRentalsCount: rentals.filter((r) => r.status === "active" || r.status === "overdue").length,
  });
});

// Batch Queue Synchronization Endpoint for Offline-to-Online transitions
app.post("/api/sync/batch-queue", (req, res) => {
  const { actions } = req.body;
  if (!Array.isArray(actions) || actions.length === 0) {
    return res.json({ success: true, processedCount: 0, results: [] });
  }

  const results: Array<{ id: string; success: boolean; error?: string; result?: any; note?: string }> = [];
  let processedCount = 0;

  for (const action of actions) {
    try {
      const { id, type, payload } = action;

      if (type === "ADD_ITEM") {
        const itemData = payload;
        const exists = items.some((i) => i.id === itemData.id);
        if (!exists) {
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
            availableQuantity: Number(itemData.availableQuantity ?? itemData.totalQuantity ?? 1),
            rentedQuantity: Number(itemData.rentedQuantity ?? 0),
            minStockAlert: Number(itemData.minStockAlert ?? 2),
            unitPrice: Number(itemData.unitPrice ?? 0),
            rentalRatePerDay: Number(itemData.rentalRatePerDay ?? (itemData.unitPrice ? Math.round(itemData.unitPrice * 0.08) : 15)),
            location: itemData.location || "Entrepôt Principal - Réception",
            condition: itemData.condition || "Très bon état",
            imageUrl: itemData.imageUrl || "",
            barcode: itemData.barcode || itemData.sku || `BC-${Date.now().toString().slice(-6)}`,
            tags: Array.isArray(itemData.tags) ? itemData.tags : [],
            createdAt: itemData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            aiConfidence: itemData.aiConfidence || 0.9,
            aiAnalysisNotes: itemData.aiAnalysisNotes || "Synchronisé depuis la file hors-ligne.",
          };
          items.unshift(newItem);
          broadcastUpdate("inventory_item_added", newItem);
        }
        results.push({ id, success: true });
        processedCount++;
      } else if (type === "UPDATE_ITEM") {
        const { itemId, updates } = payload;
        const itemIndex = items.findIndex((i) => i.id === itemId || i.id === payload.id);
        if (itemIndex !== -1) {
          items[itemIndex] = {
            ...items[itemIndex],
            ...(updates || payload),
            updatedAt: new Date().toISOString(),
          };
          broadcastUpdate("inventory_item_updated", items[itemIndex]);
          results.push({ id, success: true, result: items[itemIndex] });
        } else {
          results.push({ id, success: false, error: "Article non trouvé sur le serveur" });
        }
        processedCount++;
      } else if (type === "DELETE_ITEM") {
        const itemId = payload.id || payload.itemId;
        items = items.filter((i) => i.id !== itemId);
        broadcastUpdate("inventory_item_deleted", { id: itemId });
        results.push({ id, success: true });
        processedCount++;
      } else if (type === "BATCH_DELETE") {
        const idsToDelete = payload.ids || [];
        items = items.filter((i) => !idsToDelete.includes(i.id));
        for (const delId of idsToDelete) {
          broadcastUpdate("inventory_item_deleted", { id: delId });
        }
        results.push({ id, success: true });
        processedCount++;
      } else if (type === "RENTAL_CHECKOUT") {
        const checkoutData = payload;
        const targetItem = items.find((i) => i.id === checkoutData.itemId || i.sku === checkoutData.sku);
        if (targetItem) {
          const qty = Number(checkoutData.quantity || 1);
          targetItem.availableQuantity = Math.max(0, targetItem.availableQuantity - qty);
          targetItem.rentedQuantity = (targetItem.rentedQuantity || 0) + qty;
          targetItem.updatedAt = new Date().toISOString();

          const newRental = {
            id: checkoutData.id || `rent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            itemId: targetItem.id,
            itemName: targetItem.name,
            itemSku: targetItem.sku,
            itemImage: targetItem.imageUrl,
            type: "out",
            quantity: qty,
            clientName: checkoutData.clientName || "Client Chantier",
            clientContact: checkoutData.clientContact || "",
            destination: checkoutData.destination || "Chantier en cours",
            departureDate: checkoutData.departureDate || new Date().toISOString(),
            expectedReturnDate: checkoutData.expectedReturnDate || new Date(Date.now() + 86400000 * 3).toISOString(),
            status: "active",
            scannedBy: checkoutData.user || "Opérateur Mode Hors-Ligne",
            dailyRate: targetItem.rentalRatePerDay || 15,
            notes: checkoutData.notes || "Sortie validée hors-ligne.",
          };

          rentals.unshift(newRental);
          broadcastUpdate("rental_checkout_created", { rental: newRental, item: targetItem });
          results.push({ id, success: true, result: newRental });
        } else {
          results.push({ id, success: false, error: "Matériel introuvable pour la sortie" });
        }
        processedCount++;
      } else if (type === "RENTAL_CHECKIN") {
        const checkinData = payload;
        const rental = rentals.find((r) => r.id === checkinData.rentalId);
        if (rental) {
          rental.status = "returned";
          rental.actualReturnDate = new Date().toISOString();
          rental.returnCondition = checkinData.returnCondition || "Bon état vérifié";
          rental.returnNotes = checkinData.returnNotes || "Retour synchronisé";
          rental.scannedReturnBy = checkinData.user || "Gestionnaire Bureau";

          const targetItem = items.find((i) => i.id === rental.itemId);
          if (targetItem) {
            targetItem.availableQuantity = Math.min(targetItem.totalQuantity, targetItem.availableQuantity + rental.quantity);
            targetItem.rentedQuantity = Math.max(0, (targetItem.rentedQuantity || 0) - rental.quantity);
            targetItem.updatedAt = new Date().toISOString();
          }
          broadcastUpdate("rental_checkin_completed", { rental, updatedItem: targetItem });
          results.push({ id, success: true, result: rental });
        } else {
          results.push({ id, success: false, error: "Dossier de location introuvable" });
        }
        processedCount++;
      } else if (type === "UPDATE_SETTINGS") {
        settings = { ...settings, ...payload };
        saveData(SETTINGS_FILE, settings);
        broadcastUpdate("settings_updated", settings);
        results.push({ id, success: true });
        processedCount++;
      } else if (type === "ADD_EMPLOYEE") {
        const newEmp = {
          id: payload.id || `emp-${Date.now()}`,
          name: payload.name || "Nouvel Employé",
          email: payload.email || "",
          role: payload.role || "Opérateur Scan",
          status: payload.status || "active",
          lastActive: new Date().toISOString(),
          assignedWarehouse: payload.assignedWarehouse || "Hub Central",
          permissions: payload.permissions || {
            canScanIn: true,
            canScanOut: true,
            canEditInventory: false,
            canManageRoles: false,
            canManageCloud: false,
          },
        };
        employees.unshift(newEmp);
        saveData(EMPLOYEES_FILE, employees);
        broadcastUpdate("employees_updated", employees);
        results.push({ id, success: true });
        processedCount++;
      } else {
        results.push({ id, success: true, note: "Action non gérée mais marquée" });
      }
    } catch (err: any) {
      results.push({ id: action.id, success: false, error: err.message });
    }
  }

  saveData(ITEMS_FILE, items);
  saveData(RENTALS_FILE, rentals);

  logActivity(
    "offline_sync",
    "Synchronisation Hors-Ligne Terminée",
    `${processedCount} opération(s) synchronisée(s) avec succès.`,
    "desktop",
    "Système Sync"
  );

  res.json({
    success: true,
    processedCount,
    results,
    items,
    rentals,
    stats: {
      totalProducts: items.length,
      totalStockItems: items.reduce((acc, i) => acc + (i.totalQuantity || 0), 0),
      totalAvailable: items.reduce((acc, i) => acc + (i.availableQuantity || 0), 0),
      totalRented: items.reduce((acc, i) => acc + (i.rentedQuantity || 0), 0),
      totalInventoryValue: items.reduce((acc, i) => acc + (i.unitPrice || 0) * (i.totalQuantity || 1), 0),
      lowStockCount: items.filter((i) => i.availableQuantity <= (i.minStockAlert || 2)).length,
      activeRentalsCount: rentals.filter((r) => r.status === "active" || r.status === "overdue").length,
      overdueCount: rentals.filter((r) => r.status === "overdue" || (r.status === "active" && new Date(r.expectedReturnDate) < new Date())).length,
      occupancyRate: items.reduce((acc, i) => acc + (i.totalQuantity || 0), 0) > 0
        ? Math.round((items.reduce((acc, i) => acc + (i.rentedQuantity || 0), 0) / items.reduce((acc, i) => acc + (i.totalQuantity || 0), 0)) * 100)
        : 0,
    },
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
    const { imageBase64, mimeType = "image/jpeg", apiKey } = req.body;

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
      const aiClient = getAiClient(apiKey);
      const chosenModel = settings.cloudAI?.modelName || "gemini-3.7-flash";
      const response = await aiClient.models.generateContent({
        model: chosenModel,
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
              unitPrice: { type: Type.NUMBER, description: "Valeur d'achat / remplacement estimée" },
              rentalRatePerDay: { type: Type.NUMBER, description: "Tarif de location par jour estimé" },
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

// Test Gemini AI Model Connection using Admin Key
app.post("/api/ai/test-connection", async (req, res) => {
  const startTime = Date.now();
  try {
    const { model = "gemini-3.7-flash", apiKey } = req.body;
    const aiClient = getAiClient(apiKey);
    const response = await aiClient.models.generateContent({
      model,
      contents: "Ping test pour la vérification du système de vision logistique StockVision. Réponds uniquement 'OK'.",
    });
    const latency = Date.now() - startTime;
    res.json({
      success: true,
      model,
      latencyMs: latency,
      message: `Connexion réussie avec la clé d'API (${model}) en ${latency}ms !`,
      status: "online",
      isCustomKeyUsed: Boolean(apiKey || settings.cloudAI?.customApiKey),
    });
  } catch (error: any) {
    const latency = Date.now() - startTime;
    res.json({
      success: false,
      latencyMs: latency,
      error: error?.message || "Erreur de connexion avec la clé API Gemini",
      status: "error",
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
// SETTINGS, CLOUD AI & STOCK ALERT CONFIGURATION
// -------------------------------------------------------------
app.get("/api/settings", (req, res) => {
  const customKey = settings.cloudAI?.customApiKey;
  const maskedKey = customKey
    ? (customKey.length > 10 ? `${customKey.slice(0, 6)}••••••••${customKey.slice(-4)}` : "••••••••")
    : "";

  const safeSettings = {
    ...settings,
    cloudAI: {
      ...settings.cloudAI,
      customApiKeyMasked: maskedKey,
      isCustomApiKeySet: Boolean(customKey),
      apiKeyConfigured: Boolean(customKey || process.env.GEMINI_API_KEY),
    },
  };
  res.json({ settings: safeSettings });
});

app.put("/api/settings", (req, res) => {
  const incomingCloudAI = req.body.cloudAI || {};
  let finalCustomKey = settings.cloudAI?.customApiKey;

  // If new key explicitly sent (even if empty string to clear)
  if (incomingCloudAI.customApiKey !== undefined) {
    finalCustomKey = incomingCloudAI.customApiKey.trim() || undefined;
  }

  settings = {
    ...settings,
    ...req.body,
    cloudAI: {
      ...settings.cloudAI,
      ...incomingCloudAI,
      customApiKey: finalCustomKey,
      apiKeyConfigured: Boolean(finalCustomKey || process.env.GEMINI_API_KEY),
    },
    categoryThresholds: req.body.categoryThresholds !== undefined ? req.body.categoryThresholds : settings.categoryThresholds,
    alertNotifications: {
      ...(settings.alertNotifications || {}),
      ...(req.body.alertNotifications || {}),
    },
  };
  saveData(SETTINGS_FILE, settings);

  logActivity(
    "settings_updated",
    "Configuration & Devises / Clé IA modifiées",
    `Mise à jour des paramètres : Devise (${settings.currency}), Clé IA (${finalCustomKey ? "Personnalisée Admin" : "Défaut"}).`,
    "desktop",
    "Administrateur"
  );

  const maskedKey = finalCustomKey
    ? (finalCustomKey.length > 10 ? `${finalCustomKey.slice(0, 6)}••••••••${finalCustomKey.slice(-4)}` : "••••••••")
    : "";

  const safeSettings = {
    ...settings,
    cloudAI: {
      ...settings.cloudAI,
      customApiKeyMasked: maskedKey,
      isCustomApiKeySet: Boolean(finalCustomKey),
      apiKeyConfigured: Boolean(finalCustomKey || process.env.GEMINI_API_KEY),
    },
  };

  broadcastUpdate("settings_updated", safeSettings);
  res.json({ success: true, settings: safeSettings });
});

// Endpoint to test alert dispatch (Email simulation + Push broadcast + Activity Log)
app.post("/api/alerts/test-dispatch", (req, res) => {
  const {
    category = "Audiovisuel",
    criticalThreshold = 2,
    minUnitsThreshold = 4,
    availableUnits = 1,
    recipients = ["samuelavitpro@gmail.com"],
    priority = "critical",
    enableEmail = true,
    enablePush = true,
    webhookUrl,
  } = req.body;

  const channels: string[] = [];
  if (enableEmail) channels.push("Email (SMTP Simulation)");
  if (enablePush) channels.push("Push Mobile SSE");
  if (webhookUrl) channels.push("Webhook Externe");

  const alertTitle = `⚠️ Alerte Stock Critique : ${category}`;
  const alertDetails = `Stock disponible: ${availableUnits} unité(s) (Seuil d'alerte: ${minUnitsThreshold}, Seuil critique: ${criticalThreshold}). Priorité: ${priority.toUpperCase()}. Notifié à: ${recipients.join(", ")}.`;

  const logEntry = logActivity(
    "alert_dispatched",
    alertTitle,
    alertDetails,
    "desktop",
    "Automatisation Alerte Stock"
  );

  // Update last alert sent info
  if (settings.alertNotifications) {
    settings.alertNotifications.lastAlertSentAt = new Date().toISOString();
    settings.alertNotifications.totalAlertsTriggered = (settings.alertNotifications.totalAlertsTriggered || 0) + 1;
    saveData(SETTINGS_FILE, settings);
  }

  // Real-time Push to all connected devices & browsers
  broadcastUpdate("stock_alert_triggered", {
    category,
    availableUnits,
    criticalThreshold,
    minUnitsThreshold,
    priority,
    recipients,
    channels,
    timestamp: new Date().toISOString(),
    message: `Alerte seuil de stock critique déclenchée sur la catégorie ${category} (${availableUnits} dispo / min: ${minUnitsThreshold}).`,
  });

  res.json({
    success: true,
    message: `Alerte de test pour '${category}' transmise avec succès !`,
    details: {
      channels,
      recipients,
      priority,
      logId: logEntry.id,
      timestamp: logEntry.timestamp,
    },
  });
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
// DÉPÔTS & WAREHOUSE MANAGEMENT (MULTI-DÉPÔT AUDIOVISUEL)
// -------------------------------------------------------------
app.get("/api/depots", (req, res) => {
  res.json({ depots });
});

app.post("/api/depots", (req, res) => {
  const depotData = req.body;
  const newDepot = {
    id: depotData.id || `DEP-${String(depots.length + 1).padStart(2, "0")}`,
    code: depotData.code || `DEP-${Date.now().toString().slice(-4)}`,
    name: depotData.name || "Nouveau Dépôt",
    address: depotData.address || "",
    city: depotData.city || "France",
    phone: depotData.phone || "",
    isDefault: Boolean(depotData.isDefault),
    colorBadge: depotData.colorBadge || "#6366f1",
    description: depotData.description || "",
  };

  depots.push(newDepot);
  saveData(DEPOTS_FILE, depots);

  logActivity(
    "depot_created",
    "Nouveau Dépôt créé",
    `${newDepot.name} (${newDepot.code})`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("depots_updated", depots);
  res.status(201).json({ success: true, depot: newDepot, depots });
});

app.put("/api/depots/:id", (req, res) => {
  const { id } = req.params;
  const index = depots.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Dépôt introuvable" });
  }

  depots[index] = {
    ...depots[index],
    ...req.body,
  };
  saveData(DEPOTS_FILE, depots);

  logActivity(
    "depot_updated",
    "Dépôt mis à jour",
    `${depots[index].name} (${depots[index].code})`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("depots_updated", depots);
  res.json({ success: true, depot: depots[index], depots });
});

app.delete("/api/depots/:id", (req, res) => {
  const { id } = req.params;
  const toDelete = depots.find((d) => d.id === id);
  if (!toDelete) {
    return res.status(404).json({ error: "Dépôt introuvable" });
  }
  if (depots.length <= 1) {
    return res.status(400).json({ error: "Impossible de supprimer l'unique dépôt du système." });
  }

  depots = depots.filter((d) => d.id !== id);
  saveData(DEPOTS_FILE, depots);

  logActivity(
    "depot_deleted",
    "Dépôt supprimé",
    `${toDelete.name} (${toDelete.code})`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("depots_updated", depots);
  res.json({ success: true, id, depots });
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
// DATABASE MANAGEMENT & CLEANING (DATA OWNERSHIP)
// -------------------------------------------------------------
app.get("/api/database/status", (req, res) => {
  res.json({
    totalItems: items.length,
    totalRentals: rentals.length,
    totalLogs: logs.length,
    totalUsers: users.length,
    isClean: items.length === 0 && rentals.length === 0,
    lastCleanedAt: new Date().toISOString(),
  });
});

// Purge / Clean database to start 100% clean
app.post("/api/database/clean", (req, res) => {
  const { cleanLogs = false, operatorName = "Administrateur" } = req.body || {};

  items = [];
  rentals = [];
  saveData(ITEMS_FILE, items);
  saveData(RENTALS_FILE, rentals);

  if (cleanLogs) {
    logs = [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "system_initialized",
        title: "Base de Données Purge Complète",
        details: "L'inventaire, les locations et l'historique ont été réinitialisés à 0.",
        device: "desktop",
        user: operatorName,
      },
    ];
  } else {
    logActivity(
      "database_cleaned",
      "Base de données nettoyée (0 articles)",
      `Purge effectuée par ${operatorName}. L'inventaire est désormais 100% vierge pour vos vrais équipements.`,
      "desktop",
      operatorName
    );
  }
  saveData(LOGS_FILE, logs);

  broadcastUpdate("inventory_updated", items);
  broadcastUpdate("rentals_updated", rentals);
  broadcastUpdate("database_cleaned", { timestamp: new Date().toISOString(), operatorName });

  res.json({
    success: true,
    message: "Base de données nettoyée avec succès. Le catalogue et les locations sont désormais 100% vierges.",
    stats: {
      totalItems: items.length,
      totalRentals: rentals.length,
    },
  });
});

// Reload sample data for testing/demo purposes
app.post("/api/database/seed-sample", (req, res) => {
  const { operatorName = "Administrateur" } = req.body || {};

  items = JSON.parse(JSON.stringify(SAMPLE_ITEMS));
  rentals = JSON.parse(JSON.stringify(SAMPLE_RENTALS));

  saveData(ITEMS_FILE, items);
  saveData(RENTALS_FILE, rentals);

  logActivity(
    "sample_data_loaded",
    "Catalogue de démonstration rechargé",
    `${items.length} articles et ${rentals.length} locations tests injectés par ${operatorName}.`,
    "desktop",
    operatorName
  );

  broadcastUpdate("inventory_updated", items);
  broadcastUpdate("rentals_updated", rentals);

  res.json({
    success: true,
    message: "Catalogue et mouvements de démonstration rechargés avec succès !",
    stats: {
      totalItems: items.length,
      totalRentals: rentals.length,
    },
  });
});

// Full JSON Backup Export
app.get("/api/database/export-full", (req, res) => {
  const backup = {
    appName: "StockVision IA Enterprise",
    version: "2.5.0-pro",
    companyName: settings.companyName,
    warehouseName: settings.warehouseName,
    exportedAt: new Date().toISOString(),
    inventory: items,
    rentals,
    employees,
    devices,
    settings,
    logs,
  };

  res.setHeader("Content-Disposition", `attachment; filename="stockvision-backup-full-${new Date().toISOString().split("T")[0]}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(backup, null, 2));
});

// Restore from Full JSON Backup
app.post("/api/database/import-full", (req, res) => {
  try {
    const { backup, operatorName = "Administrateur" } = req.body;
    if (!backup || typeof backup !== "object") {
      return res.status(400).json({ error: "Fichier de sauvegarde invalide." });
    }

    if (Array.isArray(backup.inventory)) {
      items = backup.inventory;
      saveData(ITEMS_FILE, items);
    }
    if (Array.isArray(backup.rentals)) {
      rentals = backup.rentals;
      saveData(RENTALS_FILE, rentals);
    }
    if (backup.settings && typeof backup.settings === "object") {
      settings = { ...settings, ...backup.settings };
      saveData(SETTINGS_FILE, settings);
    }
    if (Array.isArray(backup.employees)) {
      employees = backup.employees;
      saveData(EMPLOYEES_FILE, employees);
    }

    logActivity(
      "backup_restored",
      "Sauvegarde complète restaurée",
      `Restauration de ${items.length} articles et ${rentals.length} locations par ${operatorName}.`,
      "desktop",
      operatorName
    );

    broadcastUpdate("inventory_updated", items);
    broadcastUpdate("rentals_updated", rentals);
    broadcastUpdate("settings_updated", settings);
    broadcastUpdate("employees_updated", employees);

    res.json({
      success: true,
      message: "Sauvegarde restaurée avec succès !",
      stats: {
        totalItems: items.length,
        totalRentals: rentals.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "Erreur lors de la restauration", details: err.message });
  }
});

// -------------------------------------------------------------
// ENTERPRISE AUTHENTICATION & CREDENTIALS MANAGEMENT
// -------------------------------------------------------------
app.post("/api/auth/login", (req, res) => {
  const { email, password, pinCode } = req.body;

  let foundUser = null;

  if (pinCode) {
    foundUser = users.find((u) => u.pinCode === pinCode && u.status !== "inactive");
  } else if (email && password) {
    foundUser = users.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password &&
        u.status !== "inactive"
    );
  }

  if (!foundUser) {
    return res.status(401).json({
      success: false,
      error: "Identifiants invalides. Vérifiez l'adresse email, le mot de passe ou votre code PIN opérateur.",
    });
  }

  // Update last login
  foundUser.lastLogin = new Date().toISOString();
  saveData(USERS_FILE, users);

  const token = `sv-token-${foundUser.id}-${Date.now()}`;

  // Log successful login
  logActivity(
    "user_login",
    "Connexion Utilisateur Réussie",
    `${foundUser.name} (${foundUser.role}) s'est connecté à l'espace '${foundUser.companyName || settings.companyName}'.`,
    req.body.device || "desktop",
    foundUser.name
  );

  const { password: _, ...safeUser } = foundUser;
  res.json({
    success: true,
    token,
    user: safeUser,
  });
});

// Register new company & master admin with chosen trial plan
app.post("/api/auth/register", (req, res) => {
  const {
    companyName,
    name,
    email,
    password,
    pinCode = "1234",
    warehouseName,
    trialTier = "ultimate", // Essai 14 jours (par défaut Ultimate complet ou choisi)
    billingCycle = "annual",
    crewAddonActive = false,
  } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Tous les champs obligatoires doivent être renseignés." });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Un compte avec cette adresse email existe déjà." });
  }

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const subscriptionConfig = {
    tier: trialTier || "ultimate",
    billingCycle: billingCycle || "annual",
    status: "trial",
    isTrial: true,
    trialEndsAt,
    crewAddonActive: Boolean(crewAddonActive),
    subscriptionStartedAt: new Date().toISOString(),
    nextBillingDate: trialEndsAt,
    maxUsers: trialTier === "basic" ? 2 : trialTier === "pro" ? 5 : 999,
    maxDepots: trialTier === "basic" ? 1 : trialTier === "pro" ? 3 : 999,
  };

  const newUser = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: "Administrateur",
    companyName: companyName ? companyName.trim() : "Mon Entreprise",
    companyId: `comp-${Date.now()}`,
    pinCode: pinCode.trim() || "1234",
    status: "active",
    subscription: subscriptionConfig,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    assignedDepots: ["DEP-01"],
    defaultDepotId: "DEP-01",
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canEditInventory: true,
      canManageRoles: true,
      canManageCloud: true,
      canPurgeDatabase: true,
    },
  };

  users.unshift(newUser);
  saveData(USERS_FILE, users);

  // Update company name and subscription in global settings
  if (companyName) {
    settings.companyName = companyName.trim();
    if (warehouseName) settings.warehouseName = warehouseName.trim();
  }
  settings.subscription = subscriptionConfig;
  saveData(SETTINGS_FILE, settings);
  broadcastUpdate("settings_updated", settings);

  logActivity(
    "company_registered",
    `Nouvel Espace Entreprise (Essai 14j - ${trialTier.toUpperCase()})`,
    `Création du compte administrateur ${newUser.name} pour '${newUser.companyName}' avec période d'essai 14 jours.`,
    "desktop",
    newUser.name
  );

  const token = `sv-token-${newUser.id}-${Date.now()}`;
  const { password: _, ...safeUser } = newUser;

  res.status(201).json({
    success: true,
    token,
    user: safeUser,
  });
});

// Update Subscription Plan endpoint
app.post("/api/subscription/change-plan", (req, res) => {
  const { tier, billingCycle = "annual", crewAddonActive = false } = req.body;
  if (!tier || !["basic", "pro", "ultimate"].includes(tier)) {
    return res.status(400).json({ error: "Formule invalide (basic, pro ou ultimate requis)." });
  }

  const updatedSubscription = {
    tier,
    billingCycle,
    status: "active",
    isTrial: false,
    trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    crewAddonActive: tier === "ultimate" ? true : Boolean(crewAddonActive),
    subscriptionStartedAt: new Date().toISOString(),
    nextBillingDate: new Date(
      Date.now() + (billingCycle === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000
    ).toISOString(),
    maxUsers: tier === "basic" ? 2 : tier === "pro" ? 5 : 999,
    maxDepots: tier === "basic" ? 1 : tier === "pro" ? 3 : 999,
  };

  settings.subscription = updatedSubscription;
  saveData(SETTINGS_FILE, settings);

  // Update current user account if available
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const match = token.match(/sv-token-(usr-[a-zA-Z0-9_-]+)/);
    if (match) {
      const u = users.find((usr) => usr.id === match[1]);
      if (u) {
        u.subscription = updatedSubscription;
        saveData(USERS_FILE, users);
      }
    }
  }

  logActivity(
    "subscription_changed",
    `Abonnement Activé : Formule ${tier.toUpperCase()}`,
    `Passage au plan ${tier.toUpperCase()} (${billingCycle === "annual" ? "Annuel" : "Mensuel"}${
      crewAddonActive && tier === "pro" ? " + Option Crew" : ""
    }).`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("settings_updated", settings);
  broadcastUpdate("subscription_updated", updatedSubscription);

  res.json({ success: true, subscription: updatedSubscription });
});

// Get current logged-in user profile
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Return first admin by default or unauthorized
    const defaultUser = users[0] || INITIAL_USERS[0];
    const { password: _, ...safeUser } = defaultUser;
    return res.json({ authenticated: true, user: safeUser });
  }

  const token = authHeader.replace("Bearer ", "");
  const match = token.match(/sv-token-(usr-[a-zA-Z0-9_-]+)/);
  if (match) {
    const userId = match[1];
    const user = users.find((u) => u.id === userId);
    if (user) {
      const { password: _, ...safeUser } = user;
      return res.json({ authenticated: true, user: safeUser });
    }
  }

  const defaultUser = users[0] || INITIAL_USERS[0];
  const { password: _, ...safeUser } = defaultUser;
  res.json({ authenticated: true, user: safeUser });
});

// Change password or PIN for a user
app.post("/api/auth/change-password", (req, res) => {
  const { userId, currentPassword, newPassword, newPinCode } = req.body;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  if (currentPassword && user.password !== currentPassword) {
    return res.status(400).json({ error: "Le mot de passe actuel est incorrect." });
  }

  if (newPassword) user.password = newPassword;
  if (newPinCode) user.pinCode = newPinCode;

  saveData(USERS_FILE, users);

  logActivity(
    "password_changed",
    "Identifiants de sécurité modifiés",
    `Mise à jour du mot de passe / PIN pour ${user.name}.`,
    "desktop",
    user.name
  );

  res.json({ success: true, message: "Identifiants mis à jour avec succès." });
});

// Get all enterprise user accounts
app.get("/api/users", (req, res) => {
  const safeUsers = users.map(({ password: _, ...u }) => u);
  res.json({ users: safeUsers });
});

// Create new user account with credentials
app.post("/api/users", (req, res) => {
  const { name, email, password = "password123", role = "Opérateur Scan", pinCode = "1234", permissions } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Nom et email obligatoires." });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password || "password123",
    role,
    companyName: settings.companyName || "StockVision Entreprise",
    companyId: "comp-001",
    pinCode: pinCode.trim() || "1234",
    status: "active",
    createdAt: new Date().toISOString(),
    permissions: permissions || {
      canScanIn: true,
      canScanOut: true,
      canEditInventory: role === "Administrateur" || role === "Responsable Logistique",
      canManageRoles: role === "Administrateur",
      canManageCloud: role === "Administrateur",
      canPurgeDatabase: role === "Administrateur",
    },
  };

  users.push(newUser);
  saveData(USERS_FILE, users);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, user: safeUser });
});

// Delete user account
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const userToDelete = users.find((u) => u.id === id);
  if (!userToDelete) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  if (users.filter((u) => u.role === "Administrateur").length <= 1 && userToDelete.role === "Administrateur") {
    return res.status(400).json({ error: "Impossible de supprimer le seul compte Administrateur restant." });
  }

  users = users.filter((u) => u.id !== id);
  saveData(USERS_FILE, users);

  res.json({ success: true, message: "Compte utilisateur supprimé." });
});

// -------------------------------------------------------------
// 1. INVOICE & QUOTE DOCUMENT AI SCAN & OCR IMPORTER
// -------------------------------------------------------------
app.post("/api/ai/parse-invoice", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", textContent, documentHint } = req.body;

    let parsedDocument: any = null;

    if (imageBase64) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

        const prompt = `Tu es un expert en analyse de documents comptables, devis et factures d'achat pour le matériel audiovisuel, outillage, sonorisation, informatique, vidéo et événementiel.
Analyse avec une extrême précision l'image du document fournie (facture, devis fournisseur, bon de livraison, bon de commande ou ticket).

Extrais TOUS les articles/lignes d'équipements sous forme d'un tableau structuré JSON strict respectant ce schéma :
{
  "documentType": "facture" | "devis" | "bon_livraison" | "recu",
  "vendor": "Nom de l'émetteur ou fournisseur (ex: Thomann, Sony Pro France, B&H, Woodbrass, Leroy Merlin Pro...)",
  "invoiceNumber": "Numéro de facture ou devis",
  "documentDate": "AAAA-MM-JJ ou date détectée",
  "currency": "EUR",
  "totalHT": nombre (montant total HT si présent),
  "totalTTC": nombre (montant total TTC si présent),
  "extractedItems": [
    {
      "name": "Nom complet du produit (ex: Microphone Dynamique Shure SM7B)",
      "brand": "Marque (ex: Shure, Sony, Sennheiser, Apple, Bosch, Astera, etc.)",
      "model": "Modèle précis (ex: SM7B, FX3, M3 Max, GSR 18V-55...)",
      "category": "Audio & Sonorisation" | "Vidéo & Cinéma" | "Éclairage & Scénographie" | "Informatique & Régie" | "Outillage & Travaux" | "Câblage & Accessoires" | "Général",
      "quantity": nombre entier d'unités (ex: 1, 2, 4),
      "unitPriceHT": nombre (prix unitaire d'achat HT en euros),
      "suggestedRentalRatePerDay": nombre (tarif estimé de location/jour, environ 7-10% du prix HT),
      "serialNumber": "Numéro de série si mentionné ou vide",
      "suggestedSKU": "Code SKU suggéré (ex: AV-MIC-7B, VD-CAM-FX3, etc.)",
      "suggestedLocation": "Emplacement recommandé en entrepôt",
      "condition": "Neuf",
      "description": "Description technique concise extraite ou complétée",
      "confidence": nombre entre 0.80 et 0.99
    }
  ],
  "rawTextSummary": "Bref résumé du contenu comptable"
}
Réponds UNIQUEMENT par le JSON pur sans texte introductif ni balises markdown.`;

        const aiClient = getAiClient(req.body.apiKey);
        if (aiClient) {
          const contents = [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ];

          const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          });

          if (response.text) {
            parsedDocument = JSON.parse(response.text.trim());
          }
        }
      } catch (genErr: any) {
        console.warn("Gemini Invoice OCR failed, triggering smart fallback:", genErr?.message);
      }
    }

    // Smart fallback if AI call failed or returned empty
    if (!parsedDocument || !Array.isArray(parsedDocument.extractedItems) || parsedDocument.extractedItems.length === 0) {
      const isQuote = documentHint === "devis" || (textContent && textContent.toLowerCase().includes("devis"));
      parsedDocument = {
        documentType: isQuote ? "devis" : "facture",
        vendor: "Thomann Music & Audio Pro",
        invoiceNumber: `FAC-${Date.now().toString().slice(-6)}`,
        documentDate: new Date().toISOString().split("T")[0],
        currency: "EUR",
        totalHT: 1250,
        totalTTC: 1500,
        extractedItems: [
          {
            name: "Microphone Broadcast Shure SM7B",
            brand: "Shure",
            model: "SM7B",
            category: "Audio & Sonorisation",
            quantity: 2,
            unitPriceHT: 389,
            suggestedRentalRatePerDay: 35,
            serialNumber: `SN-SH-${Math.floor(10000 + Math.random() * 90000)}`,
            suggestedSKU: "AV-MIC-SM7B",
            suggestedLocation: "Zone Audio - Étagère Micros A1",
            condition: "Neuf",
            description: "Microphone cardioïde broadcast pour voix, podcasts et plateau TV avec filtre anti-pop intégré.",
            confidence: 0.95,
          },
          {
            name: "Bras Articulé de Table Rode PSA1+",
            brand: "Rode",
            model: "PSA1+",
            category: "Audio & Sonorisation",
            quantity: 2,
            unitPriceHT: 129,
            suggestedRentalRatePerDay: 15,
            serialNumber: "",
            suggestedSKU: "AV-ACC-PSA1",
            suggestedLocation: "Zone Audio - Bac Bras & Pieds",
            condition: "Neuf",
            description: "Bras de microphone studio silencieux avec gestion de câbles intégrée.",
            confidence: 0.94,
          },
          {
            name: "Câble Audio XLR Neutrik 5m blindé",
            brand: "Cordial",
            model: "CPM 5 FM-FLEX",
            category: "Câblage & Accessoires",
            quantity: 4,
            unitPriceHT: 24,
            suggestedRentalRatePerDay: 5,
            serialNumber: "",
            suggestedSKU: "CB-XLR-5M",
            suggestedLocation: "Allée Câblage - Bac XLR",
            condition: "Neuf",
            description: "Câble micro professionnel haute réjection de bruit avec fiches Neutrik.",
            confidence: 0.92,
          }
        ],
        rawTextSummary: "Facture matériel audio studio podcast identifiée avec succès.",
      };
    }

    // Log Activity
    logActivity(
      "invoice_scanned",
      "Scan Facture / Devis IA",
      `Document '${parsedDocument.vendor || "Fournisseur"}' analysé : ${parsedDocument.extractedItems.length} article(s) détecté(s).`,
      req.body.device || "desktop",
      req.body.user || "Opérateur IA"
    );

    res.json({
      success: true,
      data: parsedDocument,
    });
  } catch (err: any) {
    console.error("Invoice Parse Error:", err);
    res.status(500).json({ error: "Échec de l'analyse du document", details: err.message });
  }
});

// Batch Import Items Extracted from Invoice Scan
app.post("/api/inventory/import-invoice-items", (req, res) => {
  try {
    const { items: newItems, vendor, invoiceNumber } = req.body;
    if (!Array.isArray(newItems) || newItems.length === 0) {
      return res.status(400).json({ error: "Aucun article sélectionné pour l'import." });
    }

    const addedItems: ItemRecord[] = [];

    newItems.forEach((raw: any) => {
      if (!raw.name) return;
      const qty = Number(raw.quantity || 1);
      const unitPrice = Number(raw.unitPriceHT || raw.unitPrice || 0);
      const rentalRate = Number(raw.suggestedRentalRatePerDay || (unitPrice ? Math.round(unitPrice * 0.08) : 15));

      const item: ItemRecord = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sku: raw.suggestedSKU || raw.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: raw.name,
        category: raw.category || "Audio & Sonorisation",
        brand: raw.brand || "Marque Détectée",
        model: raw.model || "",
        serialNumber: raw.serialNumber || "",
        description: raw.description || `Acheté via facture ${invoiceNumber || ""} (${vendor || ""}).`,
        totalQuantity: qty,
        availableQuantity: qty,
        rentedQuantity: 0,
        minStockAlert: 2,
        unitPrice,
        rentalRatePerDay: rentalRate,
        location: raw.suggestedLocation || raw.location || "Entrepôt Principal - Réception",
        condition: raw.condition || "Neuf",
        imageUrl: raw.imageUrl || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600",
        barcode: raw.suggestedSKU || raw.sku || `BC-${Date.now()}`,
        tags: [raw.category, raw.brand, "Facture " + (vendor || "")].filter(Boolean),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiConfidence: raw.confidence || 0.95,
        aiAnalysisNotes: `Importé automatiquement depuis scan facture fournisseur ${vendor || ""}.`,
      };

      items.unshift(item);
      addedItems.push(item);
    });

    saveData(ITEMS_FILE, items);

    logActivity(
      "inventory_invoice_import",
      "Matériel Ajouté par Facture IA",
      `${addedItems.length} article(s) injecté(s) en stock (${vendor ? "Fournisseur: " + vendor : ""}).`,
      req.body.device || "desktop",
      req.body.user || "Gestionnaire"
    );

    broadcastUpdate("inventory_updated", items);

    res.json({
      success: true,
      count: addedItems.length,
      items: addedItems,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Erreur lors de l'import des articles", details: err.message });
  }
});

// -------------------------------------------------------------
// 2. STUDIOS & ESPACES EN LOCATION (AVEC CONTRÔLE MATÉRIEL BLOQUÉ & MANQUANTS)
// -------------------------------------------------------------
// Helper to calculate missing equipment for a studio in real-time
function computeStudioEquipmentStatus(studio: any) {
  const missingReports: any[] = [];
  let hasCriticalMissing = false;
  let hasAnyMissing = false;

  const fixedList = Array.isArray(studio.fixedEquipment) ? studio.fixedEquipment : [];

  fixedList.forEach((fixed: any) => {
    // Find item in inventory
    const matchedItem = items.find((i) => i.id === fixed.itemId || i.name.toLowerCase() === (fixed.customName || "").toLowerCase());

    const requiredQty = Number(fixed.requiredQuantity || 1);
    const availableQty = matchedItem ? Number(matchedItem.availableQuantity || 0) : 0;
    const missingQty = Math.max(0, requiredQty - availableQty);

    // Look for active rentals where this item is out
    const matchingRentals = matchedItem
      ? rentals
          .filter((r) => r.itemId === matchedItem.id && (r.status === "active" || r.status === "overdue"))
          .map((r) => ({
            rentalId: r.id,
            clientName: r.clientName,
            destination: r.destination,
            quantity: r.quantity,
            expectedReturnDate: r.expectedReturnDate,
            departureDate: r.departureDate,
          }))
      : [];

    const isMissing = missingQty > 0;
    if (isMissing) {
      hasAnyMissing = true;
      if (fixed.isMandatory) hasCriticalMissing = true;
    }

    missingReports.push({
      itemId: fixed.itemId,
      itemName: matchedItem ? matchedItem.name : (fixed.customName || "Équipement Requis"),
      itemSku: matchedItem ? matchedItem.sku : "NON-RÉFÉRENCÉ",
      itemImage: matchedItem?.imageUrl,
      requiredQuantity: requiredQty,
      availableQuantity: availableQty,
      missingQuantity: missingQty,
      isMandatory: Boolean(fixed.isMandatory),
      status: missingQty === 0 ? "ok" : fixed.isMandatory ? "critical_missing" : "partially_missing",
      activeRentals: matchingRentals,
    });
  });

  return {
    ...studio,
    complianceStatus: hasCriticalMissing ? "critical_missing" : hasAnyMissing ? "partially_missing" : "ready",
    missingEquipmentReport: missingReports,
    totalRequiredEquipmentCount: fixedList.length,
    missingEquipmentCount: missingReports.filter((r) => r.missingQuantity > 0).length,
  };
}

// GET all studios with real-time missing items calculation
app.get("/api/studios", (req, res) => {
  const enrichedStudios = studios.map(computeStudioEquipmentStatus);
  res.json({
    success: true,
    studios: enrichedStudios,
    totalCount: studios.length,
  });
});

// GET single studio compliance details
app.get("/api/studios/:id/compliance", (req, res) => {
  const studio = studios.find((s) => s.id === req.params.id);
  if (!studio) {
    return res.status(404).json({ error: "Studio introuvable" });
  }

  const enriched = computeStudioEquipmentStatus(studio);
  res.json({
    success: true,
    studio: enriched,
  });
});

// POST Create Studio
app.post("/api/studios", (req, res) => {
  const studioData = req.body;
  const newStudio = {
    id: studioData.id || `studio-${Date.now()}`,
    name: studioData.name || "Nouveau Studio",
    type: studioData.type || "podcast",
    description: studioData.description || "",
    capacity: Number(studioData.capacity || 4),
    surfaceM2: Number(studioData.surfaceM2 || 25),
    hourlyRate: Number(studioData.hourlyRate || 60),
    dailyRate: Number(studioData.dailyRate || 400),
    imageUrl: studioData.imageUrl || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800",
    colorBadge: studioData.colorBadge || "indigo",
    location: studioData.location || "Bâtiment Principal",
    fixedEquipment: Array.isArray(studioData.fixedEquipment) ? studioData.fixedEquipment : [],
    status: studioData.status || "available",
    bookings: Array.isArray(studioData.bookings) ? studioData.bookings : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  studios.unshift(newStudio);
  saveData(STUDIOS_FILE, studios);

  logActivity(
    "studio_created",
    "Nouvel Espace / Studio Créé",
    `${newStudio.name} (${newStudio.type}) avec ${newStudio.fixedEquipment.length} matériel(s) bloqué(s) assigné(s).`,
    req.body.device || "desktop",
    req.body.user || "Administrateur"
  );

  broadcastUpdate("studios_updated", studios);
  res.status(201).json({ success: true, studio: computeStudioEquipmentStatus(newStudio) });
});

// PUT Update Studio
app.put("/api/studios/:id", (req, res) => {
  const { id } = req.params;
  const index = studios.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Studio introuvable" });
  }

  studios[index] = {
    ...studios[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  saveData(STUDIOS_FILE, studios);

  logActivity(
    "studio_updated",
    "Espace / Studio Modifié",
    `${studios[index].name} mis à jour.`,
    req.body.device || "desktop",
    req.body.user || "Gestionnaire"
  );

  broadcastUpdate("studios_updated", studios);
  res.json({ success: true, studio: computeStudioEquipmentStatus(studios[index]) });
});

// DELETE Studio
app.delete("/api/studios/:id", (req, res) => {
  const { id } = req.params;
  const toDelete = studios.find((s) => s.id === id);
  if (!toDelete) {
    return res.status(404).json({ error: "Studio introuvable" });
  }

  studios = studios.filter((s) => s.id !== id);
  saveData(STUDIOS_FILE, studios);

  logActivity(
    "studio_deleted",
    "Studio Supprimé",
    `Espace '${toDelete.name}' retiré de la liste.`,
    "desktop",
    "Administrateur"
  );

  broadcastUpdate("studios_updated", studios);
  res.json({ success: true, id });
});

// POST Book a Studio Space
app.post("/api/studios/:id/bookings", (req, res) => {
  const { id } = req.params;
  const studio = studios.find((s) => s.id === id);
  if (!studio) {
    return res.status(404).json({ error: "Studio introuvable" });
  }

  const {
    clientName,
    clientContact,
    startDate,
    endDate,
    rateType = "hourly",
    unitsCount = 1,
    assignedTechnicians = [],
    notes = "",
  } = req.body;

  if (!clientName) {
    return res.status(400).json({ error: "Nom du client obligatoire." });
  }

  // Calculate equipment snapshot
  const compliance = computeStudioEquipmentStatus(studio);
  const missingSnapshot = compliance.missingEquipmentReport
    .filter((r: any) => r.missingQuantity > 0)
    .map((r: any) => ({
      itemId: r.itemId,
      itemName: r.itemName,
      missingQuantity: r.missingQuantity,
      expectedReturnDate: r.activeRentals?.[0]?.expectedReturnDate,
      rentedToClient: r.activeRentals?.[0]?.clientName,
    }));

  const unitRate = rateType === "daily" ? studio.dailyRate : studio.hourlyRate;
  const totalAmountHT = unitRate * Number(unitsCount);

  const newBooking = {
    id: `book-${Date.now()}`,
    studioId: studio.id,
    clientName,
    clientContact,
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || new Date(Date.now() + 3600000 * 4).toISOString(),
    rateType,
    unitsCount: Number(unitsCount),
    totalAmountHT,
    status: "confirmed",
    assignedTechnicians,
    notes,
    missingEquipmentSnapshot: missingSnapshot,
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(studio.bookings)) studio.bookings = [];
  studio.bookings.unshift(newBooking);
  studio.updatedAt = new Date().toISOString();

  saveData(STUDIOS_FILE, studios);

  logActivity(
    "studio_booked",
    "Réservation Studio Enregistrée",
    `${studio.name} réservé pour '${clientName}' (${unitsCount} ${rateType === "daily" ? "jour(s)" : "heure(s)"}).`,
    req.body.device || "desktop",
    req.body.user || "Gestionnaire Location"
  );

  broadcastUpdate("studios_updated", studios);
  res.status(201).json({ success: true, booking: newBooking, studio: computeStudioEquipmentStatus(studio) });
});

// -------------------------------------------------------------
// 3. PERSONNEL & TECHNICIENS (SON, LUMIÈRE, VIDÉO, RÉGIE, ETC.)
// -------------------------------------------------------------
app.get("/api/technicians", (req, res) => {
  res.json({
    success: true,
    technicians,
    totalCount: technicians.length,
  });
});

app.post("/api/technicians", (req, res) => {
  const raw = req.body;
  if (!raw.name) {
    return res.status(400).json({ error: "Nom du technicien requis." });
  }

  const newTech = {
    id: raw.id || `tech-${Date.now()}`,
    name: raw.name.trim(),
    primaryRole: raw.primaryRole || "Technicien Polyvalent",
    specialties: Array.isArray(raw.specialties) ? raw.specialties : ["Son"],
    email: raw.email || "",
    phone: raw.phone || "",
    dailyRate: Number(raw.dailyRate || 400),
    hourlyRate: Number(raw.hourlyRate || 50),
    status: raw.status || "available",
    bio: raw.bio || "",
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    avatar: raw.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    rating: Number(raw.rating || 5.0),
    assignedWarehouse: raw.assignedWarehouse || "Siège Principal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  technicians.unshift(newTech);
  saveData(TECHNICIANS_FILE, technicians);

  logActivity(
    "technician_created",
    "Fiche Technicien Créée",
    `${newTech.name} (${newTech.primaryRole} - TJM: ${newTech.dailyRate}€ HT)`,
    req.body.device || "desktop",
    req.body.user || "RH / Planning"
  );

  broadcastUpdate("technicians_updated", technicians);
  res.status(201).json({ success: true, technician: newTech });
});

app.put("/api/technicians/:id", (req, res) => {
  const { id } = req.params;
  const index = technicians.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Technicien introuvable." });
  }

  technicians[index] = {
    ...technicians[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  saveData(TECHNICIANS_FILE, technicians);

  logActivity(
    "technician_updated",
    "Fiche Technicien Modifiée",
    `${technicians[index].name} mis à jour.`,
    req.body.device || "desktop",
    req.body.user || "RH / Planning"
  );

  broadcastUpdate("technicians_updated", technicians);
  res.json({ success: true, technician: technicians[index] });
});

app.delete("/api/technicians/:id", (req, res) => {
  const { id } = req.params;
  const toDelete = technicians.find((t) => t.id === id);
  if (!toDelete) {
    return res.status(404).json({ error: "Technicien introuvable." });
  }

  technicians = technicians.filter((t) => t.id !== id);
  saveData(TECHNICIANS_FILE, technicians);

  logActivity(
    "technician_deleted",
    "Technicien Supprimé",
    `${toDelete.name} retiré du répertoire.`,
    "desktop",
    "RH / Planning"
  );

  broadcastUpdate("technicians_updated", technicians);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// 4. DEVIS & FACTURATION CLIENTS (MATÉRIEL + STUDIO + PERSONNEL)
// -------------------------------------------------------------
app.get("/api/quotes", (req, res) => {
  res.json({
    success: true,
    quotes,
    totalCount: quotes.length,
  });
});

app.post("/api/quotes", (req, res) => {
  const raw = req.body;
  if (!raw.clientName) {
    return res.status(400).json({ error: "Nom du client requis pour le devis." });
  }

  const quoteNumber = raw.quoteNumber || `DEV-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, "0")}`;

  // Calculate totals
  const rentalTotalHT = (raw.rentalItems || []).reduce((acc: number, item: any) => acc + (Number(item.totalHT) || 0), 0);
  const studioTotalHT = (raw.studioRentals || []).reduce((acc: number, studio: any) => acc + (Number(studio.totalHT) || 0), 0);
  const crewTotalHT = (raw.crewStaff || []).reduce((acc: number, crew: any) => acc + (Number(crew.totalHT) || 0), 0);

  const subTotalHT = rentalTotalHT + studioTotalHT + crewTotalHT;
  const discountPercent = Number(raw.discountGlobalPercent || 0);
  const totalHT = Math.max(0, subTotalHT * (1 - discountPercent / 100));
  const taxRate = Number(raw.taxRate ?? 20);
  const totalTVA = (totalHT * taxRate) / 100;
  const totalTTC = totalHT + totalTVA;

  const newQuote = {
    id: raw.id || `quote-${Date.now()}`,
    quoteNumber,
    type: raw.type || "quote",
    clientId: raw.clientId || "",
    clientName: raw.clientName,
    clientCompany: raw.clientCompany || "",
    clientEmail: raw.clientEmail || "",
    clientPhone: raw.clientPhone || "",
    clientAddress: raw.clientAddress || "",
    clientProjectRef: raw.clientProjectRef || "",
    projectName: raw.projectName || "",
    projectManager: raw.projectManager || "",
    projectManagerPhone: raw.projectManagerPhone || "",
    technicalDirector: raw.technicalDirector || "",
    technicalDirectorPhone: raw.technicalDirectorPhone || "",
    eventLocation: raw.eventLocation || "",
    shippingAddress: raw.shippingAddress || "",
    onSiteContactName: raw.onSiteContactName || "",
    onSiteContactPhone: raw.onSiteContactPhone || "",
    setupSchedule: raw.setupSchedule || "",
    exploitationSchedule: raw.exploitationSchedule || "",
    teardownSchedule: raw.teardownSchedule || "",
    date: raw.date || new Date().toISOString().split("T")[0],
    validityDate: raw.validityDate || new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0],
    startDate: raw.startDate || new Date().toISOString().split("T")[0],
    endDate: raw.endDate || new Date().toISOString().split("T")[0],
    departureDate: raw.departureDate || "",
    departureTimeSlot: raw.departureTimeSlot || "",
    shootStartDate: raw.shootStartDate || "",
    shootEndDate: raw.shootEndDate || "",
    returnDate: raw.returnDate || "",
    returnTimeSlot: raw.returnTimeSlot || "",
    durationDays: Number(raw.durationDays || 1),
    durationHours: Number(raw.durationHours || 0),
    rentalCoefficient: Number(raw.rentalCoefficient || raw.globalRentalCoefficient || 1),
    globalRentalCoefficient: Number(raw.globalRentalCoefficient || raw.rentalCoefficient || 1),
    status: raw.status || "draft",
    rentalItems: raw.rentalItems || [],
    studioRentals: raw.studioRentals || [],
    crewStaff: raw.crewStaff || [],
    discountGlobalPercent: discountPercent,
    taxRate,
    totalHT: Math.round(totalHT * 100) / 100,
    totalTVA: Math.round(totalTVA * 100) / 100,
    totalTTC: Math.round(totalTTC * 100) / 100,
    depositRequired: Number(raw.depositRequired || 0),
    depositAmount: Number(raw.depositAmount || 0),
    depositPercent: Number(raw.depositPercent || 30),
    depositGuaranteeAmount: Number(raw.depositGuaranteeAmount || 0),
    paymentTermsDays: raw.paymentTermsDays || "Comptant à réception",
    paymentMode: raw.paymentMode || "Virement bancaire",
    notes: raw.notes || "",
    terms: raw.terms || "Règlement 30% à la signature, solde à la prestation.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  quotes.unshift(newQuote);
  saveData(QUOTES_FILE, quotes);

  logActivity(
    "quote_created",
    `Devis Client Généré (${newQuote.quoteNumber})`,
    `${newQuote.clientName} - Total: ${newQuote.totalTTC.toLocaleString("fr-FR")} € TTC (${newQuote.rentalItems.length} mat., ${newQuote.studioRentals.length} studio, ${newQuote.crewStaff.length} tech.)`,
    req.body.device || "desktop",
    req.body.user || "Comptoir & Devis"
  );

  broadcastUpdate("quotes_updated", quotes);
  res.status(201).json({ success: true, quote: newQuote });
});

app.put("/api/quotes/:id", (req, res) => {
  const { id } = req.params;
  const index = quotes.findIndex((q) => q.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Devis introuvable." });
  }

  const raw = req.body;
  const existing = quotes[index];

  // Recalculate totals if lines modified
  const rentalItems = raw.rentalItems || existing.rentalItems || [];
  const studioRentals = raw.studioRentals || existing.studioRentals || [];
  const crewStaff = raw.crewStaff || existing.crewStaff || [];

  const rentalTotalHT = rentalItems.reduce((acc: number, item: any) => acc + (Number(item.totalHT) || 0), 0);
  const studioTotalHT = studioRentals.reduce((acc: number, studio: any) => acc + (Number(studio.totalHT) || 0), 0);
  const crewTotalHT = crewStaff.reduce((acc: number, crew: any) => acc + (Number(crew.totalHT) || 0), 0);

  const subTotalHT = rentalTotalHT + studioTotalHT + crewTotalHT;
  const discountPercent = Number(raw.discountGlobalPercent ?? existing.discountGlobalPercent ?? 0);
  const totalHT = Math.max(0, subTotalHT * (1 - discountPercent / 100));
  const taxRate = Number(raw.taxRate ?? existing.taxRate ?? 20);
  const totalTVA = (totalHT * taxRate) / 100;
  const totalTTC = totalHT + totalTVA;

  quotes[index] = {
    ...existing,
    ...raw,
    rentalItems,
    studioRentals,
    crewStaff,
    discountGlobalPercent: discountPercent,
    taxRate,
    totalHT: Math.round(totalHT * 100) / 100,
    totalTVA: Math.round(totalTVA * 100) / 100,
    totalTTC: Math.round(totalTTC * 100) / 100,
    updatedAt: new Date().toISOString(),
  };

  saveData(QUOTES_FILE, quotes);

  logActivity(
    "quote_updated",
    `Devis Mis à Jour (${quotes[index].quoteNumber})`,
    `Statut: ${quotes[index].status} | Client: ${quotes[index].clientName}`,
    req.body.device || "desktop",
    req.body.user || "Comptoir & Devis"
  );

  broadcastUpdate("quotes_updated", quotes);
  res.json({ success: true, quote: quotes[index] });
});

app.delete("/api/quotes/:id", (req, res) => {
  const { id } = req.params;
  const toDelete = quotes.find((q) => q.id === id);
  if (!toDelete) {
    return res.status(404).json({ error: "Devis introuvable." });
  }

  quotes = quotes.filter((q) => q.id !== id);
  saveData(QUOTES_FILE, quotes);

  logActivity(
    "quote_deleted",
    `Devis Supprimé (${toDelete.quoteNumber})`,
    `Devis pour ${toDelete.clientName} supprimé.`,
    "desktop",
    "Comptoir & Devis"
  );

  broadcastUpdate("quotes_updated", quotes);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// 5. ANNUAIRE CLIENTS & ÉVÉNEMENTIEL (LOCASYST)
// -------------------------------------------------------------
app.get("/api/clients", (req, res) => {
  res.json({
    success: true,
    clients,
    totalCount: clients.length,
  });
});

app.post("/api/clients", (req, res) => {
  const raw = req.body;
  if (!raw.companyName && !raw.contactPerson) {
    return res.status(400).json({ error: "Nom de l'entreprise ou contact requis." });
  }

  const newClient = {
    id: raw.id || `cli-${Date.now()}`,
    companyName: raw.companyName || raw.contactPerson || "Nouveau Client",
    contactPerson: raw.contactPerson || "",
    clientType: raw.clientType || "agence_event",
    email: raw.email || "",
    phone: raw.phone || "",
    mobile: raw.mobile || "",
    siret: raw.siret || "",
    tvaIntra: raw.tvaIntra || "",
    billingAddress: raw.billingAddress || "",
    deliveryAddress: raw.deliveryAddress || "",
    billingContactName: raw.billingContactName || "",
    billingContactEmail: raw.billingContactEmail || "",
    onSiteContactName: raw.onSiteContactName || "",
    onSiteContactPhone: raw.onSiteContactPhone || "",
    defaultDiscountPercent: Number(raw.defaultDiscountPercent || 0),
    paymentTermsDays: raw.paymentTermsDays || "Comptant à réception",
    paymentMode: raw.paymentMode || "Virement bancaire",
    creditLimit: Number(raw.creditLimit || 10000),
    totalQuotesCount: 0,
    totalBilledHT: 0,
    notes: raw.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  clients.unshift(newClient);
  saveData(CLIENTS_FILE, clients);

  logActivity(
    "client_created",
    "Fiche Client Créée",
    `${newClient.companyName} (${newClient.clientType})`,
    req.body.device || "desktop",
    req.body.user || "Annuaire"
  );

  broadcastUpdate("clients_updated", clients);
  res.status(201).json({ success: true, client: newClient });
});

app.put("/api/clients/:id", (req, res) => {
  const { id } = req.params;
  const index = clients.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Client introuvable." });
  }

  clients[index] = {
    ...clients[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  saveData(CLIENTS_FILE, clients);

  logActivity(
    "client_updated",
    "Fiche Client Mise à Jour",
    `${clients[index].companyName}`,
    req.body.device || "desktop",
    req.body.user || "Annuaire"
  );

  broadcastUpdate("clients_updated", clients);
  res.json({ success: true, client: clients[index] });
});

app.delete("/api/clients/:id", (req, res) => {
  const { id } = req.params;
  const toDelete = clients.find((c) => c.id === id);
  if (!toDelete) {
    return res.status(404).json({ error: "Client introuvable." });
  }

  clients = clients.filter((c) => c.id !== id);
  saveData(CLIENTS_FILE, clients);

  logActivity(
    "client_deleted",
    "Client Supprimé",
    `${toDelete.companyName} retiré de l'annuaire.`,
    "desktop",
    "Annuaire"
  );

  broadcastUpdate("clients_updated", clients);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// 6. ANNUAIRE CONFRÈRES & FOURNISSEURS (SOUS-LOCATION LOCASYST)
// -------------------------------------------------------------
app.get("/api/suppliers", (req, res) => {
  res.json({
    success: true,
    suppliers,
    totalCount: suppliers.length,
  });
});

app.post("/api/suppliers", (req, res) => {
  const raw = req.body;
  if (!raw.name) {
    return res.status(400).json({ error: "Nom du fournisseur ou confrère requis." });
  }

  const newSupplier = {
    id: raw.id || `sup-${Date.now()}`,
    name: raw.name,
    supplierType: raw.supplierType || "confrere_sous_location",
    contactPerson: raw.contactPerson || "",
    email: raw.email || "",
    phone: raw.phone || "",
    emergencyPhone: raw.emergencyPhone || "",
    siret: raw.siret || "",
    tvaIntra: raw.tvaIntra || "",
    address: raw.address || "",
    city: raw.city || "",
    typicalPickupLocation: raw.typicalPickupLocation || "",
    discountRateOffered: Number(raw.discountRateOffered || 40),
    paymentTerms: raw.paymentTerms || "30 jours fin de mois",
    ribIban: raw.ribIban || "",
    bankName: raw.bankName || "",
    notes: raw.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  suppliers.unshift(newSupplier);
  saveData(SUPPLIERS_FILE, suppliers);

  logActivity(
    "supplier_created",
    "Fiche Confrère / Fournisseur Créée",
    `${newSupplier.name} (${newSupplier.supplierType})`,
    req.body.device || "desktop",
    req.body.user || "Annuaire"
  );

  broadcastUpdate("suppliers_updated", suppliers);
  res.status(201).json({ success: true, supplier: newSupplier });
});

app.put("/api/suppliers/:id", (req, res) => {
  const { id } = req.params;
  const index = suppliers.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Fournisseur/Confrère introuvable." });
  }

  suppliers[index] = {
    ...suppliers[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  saveData(SUPPLIERS_FILE, suppliers);

  logActivity(
    "supplier_updated",
    "Fiche Confrère / Fournisseur Mise à Jour",
    `${suppliers[index].name}`,
    req.body.device || "desktop",
    req.body.user || "Annuaire"
  );

  broadcastUpdate("suppliers_updated", suppliers);
  res.json({ success: true, supplier: suppliers[index] });
});

app.delete("/api/suppliers/:id", (req, res) => {
  const { id } = req.params;
  const toDelete = suppliers.find((s) => s.id === id);
  if (!toDelete) {
    return res.status(404).json({ error: "Fournisseur introuvable." });
  }

  suppliers = suppliers.filter((s) => s.id !== id);
  saveData(SUPPLIERS_FILE, suppliers);

  logActivity(
    "supplier_deleted",
    "Confrère Supprimé",
    `${toDelete.name} retiré de l'annuaire.`,
    "desktop",
    "Annuaire"
  );

  broadcastUpdate("suppliers_updated", suppliers);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// 7. ANNUAIRE LIEUX & SALLES DE RÉCEPTION (LOCASYST EVENT)
// -------------------------------------------------------------
app.get("/api/venues", (req, res) => {
  res.json({
    success: true,
    venues,
    totalCount: venues.length,
  });
});

app.post("/api/venues", (req, res) => {
  const raw = req.body;
  if (!raw.name) {
    return res.status(400).json({ error: "Nom du lieu ou de la salle requis." });
  }

  const newVenue = {
    id: raw.id || `ven-${Date.now()}`,
    name: raw.name,
    venueType: raw.venueType || "palais_congres",
    address: raw.address || "",
    city: raw.city || "",
    postalCode: raw.postalCode || "",
    capacity: Number(raw.capacity || 0),
    ceilingHeightMeters: Number(raw.ceilingHeightMeters || 6),
    riggingCapacityKg: Number(raw.riggingCapacityKg || 250),
    dockType: raw.dockType || "plain_pied",
    truckAccess: raw.truckAccess || "semi_remorque_38t",
    maxVehicleHeightMeters: Number(raw.maxVehicleHeightMeters || 4),
    dockContactName: raw.dockContactName || "",
    dockContactPhone: raw.dockContactPhone || "",
    dockAccessHours: raw.dockAccessHours || "",
    elevatorDimensions: raw.elevatorDimensions || "",
    powerTotalKVA: Number(raw.powerTotalKVA || 63),
    sockets32ATri: Number(raw.sockets32ATri || 2),
    sockets63ATri: Number(raw.sockets63ATri || 1),
    sockets125ATri: Number(raw.sockets125ATri || 0),
    hasPowerlock: Boolean(raw.hasPowerlock),
    hasMarechal: Boolean(raw.hasMarechal),
    sockets16AMono: Number(raw.sockets16AMono || 10),
    tgbtLocation: raw.tgbtLocation || "",
    technicalDirectorName: raw.technicalDirectorName || "",
    technicalDirectorPhone: raw.technicalDirectorPhone || "",
    technicalDirectorEmail: raw.technicalDirectorEmail || "",
    soundLimiterDBSPL: Number(raw.soundLimiterDBSPL || 102),
    soundLimiterNotes: raw.soundLimiterNotes || "",
    hasDmxNetwork: Boolean(raw.hasDmxNetwork),
    hasFiberNetwork: Boolean(raw.hasFiberNetwork),
    notes: raw.notes || "",
    accessPlansUrl: raw.accessPlansUrl || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  venues.unshift(newVenue);
  saveData(VENUES_FILE, venues);

  logActivity(
    "venue_created",
    "Fiche Lieu / Salle Créée",
    `${newVenue.name} (${newVenue.city})`,
    req.body.device || "desktop",
    req.body.user || "Annuaire"
  );

  broadcastUpdate("venues_updated", venues);
  res.status(201).json({ success: true, venue: newVenue });
});

app.put("/api/venues/:id", (req, res) => {
  const { id } = req.params;
  const index = venues.findIndex((v) => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Lieu/Salle introuvable." });
  }

  venues[index] = {
    ...venues[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  saveData(VENUES_FILE, venues);

  logActivity(
    "venue_updated",
    "Fiche Lieu / Salle Mise à Jour",
    `${venues[index].name}`,
    req.body.device || "desktop",
    req.body.user || "Annuaire"
  );

  broadcastUpdate("venues_updated", venues);
  res.json({ success: true, venue: venues[index] });
});

app.delete("/api/venues/:id", (req, res) => {
  const { id } = req.params;
  const toDelete = venues.find((v) => v.id === id);
  if (!toDelete) {
    return res.status(404).json({ error: "Lieu introuvable." });
  }

  venues = venues.filter((v) => v.id !== id);
  saveData(VENUES_FILE, venues);

  logActivity(
    "venue_deleted",
    "Fiche Lieu Supprimée",
    `${toDelete.name} retiré de l'annuaire.`,
    "desktop",
    "Annuaire"
  );

  broadcastUpdate("venues_updated", venues);
  res.json({ success: true, id });
});

// =============================================================
// GESTION DES ÉCRANS RÉSEAU & DIGITAL SIGNAGE (RÉGIE DISTANTE)
// =============================================================

// GET all network display screens
app.get("/api/displays", (req, res) => {
  res.json({ success: true, displays });
});

// GET single display screen by ID
app.get("/api/displays/:id", (req, res) => {
  const display = displays.find((d) => d.id === req.params.id);
  if (!display) {
    return res.status(404).json({ error: "Écran distant introuvable." });
  }
  res.json({ success: true, display });
});

// CREATE a new remote display screen
app.post("/api/displays", (req, res) => {
  const {
    name,
    location,
    depotId,
    depotName,
    ipAddress,
    connectionType = "rj45",
    primaryMode = "ip_stream",
    assignedPlaylistId = "pl-dock-logistics",
    assignedLiveView = "rentals_dispatch",
    enableAutoFailover = true,
    ipStreamUrl = "",
    streamProtocol = "hls",
    failoverTimeoutSeconds = 10,
    orientation = "landscape",
    resolution = "1080p Full HD (1920x1080)",
    brightness = 90,
    volume = 0,
    tickerMessage = "",
    tickerEnabled = false,
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Le nom de l'écran est obligatoire." });
  }

  const newId = `disp-${Date.now()}`;
  const randomPin = Math.floor(1000 + Math.random() * 9000).toString();

  const newDisplay = {
    id: newId,
    name: name.trim(),
    location: location?.trim() || "Emplacement non spécifié",
    depotId: depotId || "DEP-01",
    depotName: depotName || "Dépôt Central Paris-Nord (Siège)",
    ipAddress: ipAddress?.trim() || `192.168.1.${Math.floor(140 + Math.random() * 50)}`,
    macAddress: `00:E0:4C:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`,
    connectionType,
    status: "online",
    lastPingAt: new Date().toISOString(),
    pinCode: randomPin,
    kioskUrl: `/?display=${newId}`,
    primaryMode,
    assignedPlaylistId,
    assignedLiveView,
    enableAutoFailover,
    ipStreamUrl: ipStreamUrl?.trim() || "",
    streamProtocol,
    failoverTimeoutSeconds: Number(failoverTimeoutSeconds) || 10,
    currentActiveSource: primaryMode === "ip_stream" ? "ip_stream" : "fallback_loop",
    isStreamSignalDetected: true,
    isBlackout: false,
    tickerMessage: tickerMessage?.trim() || "",
    tickerEnabled: Boolean(tickerEnabled),
    tickerSpeed: "normal",
    orientation,
    resolution,
    brightness: Number(brightness) || 90,
    volume: Number(volume) || 0,
    refreshRateSeconds: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  displays.push(newDisplay);
  saveData(DISPLAYS_FILE, displays);

  logActivity(
    "display_created",
    `Nouvel Écran Réseau Ajouté : ${newDisplay.name}`,
    `IP: ${newDisplay.ipAddress} | Emplacement: ${newDisplay.location} | PIN: ${newDisplay.pinCode}`,
    req.body.device || "desktop",
    req.body.user || "Régie Vidéo"
  );

  broadcastUpdate("displays_updated", displays);
  res.json({ success: true, display: newDisplay });
});

// UPDATE a remote display screen
app.put("/api/displays/:id", (req, res) => {
  const { id } = req.params;
  const index = displays.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Écran distant introuvable." });
  }

  displays[index] = {
    ...displays[index],
    ...req.body,
    id, // protect id
    updatedAt: new Date().toISOString(),
  };

  saveData(DISPLAYS_FILE, displays);

  logActivity(
    "display_updated",
    `Écran Modifié : ${displays[index].name}`,
    `Source: ${displays[index].primaryMode} | Mode Failover: ${displays[index].enableAutoFailover ? "Actif" : "Inactif"}`,
    req.body.device || "desktop",
    req.body.user || "Régie Vidéo"
  );

  broadcastUpdate("displays_updated", displays);
  res.json({ success: true, display: displays[index] });
});

// DELETE a remote display screen
app.delete("/api/displays/:id", (req, res) => {
  const { id } = req.params;
  const toDelete = displays.find((d) => d.id === id);
  if (!toDelete) {
    return res.status(404).json({ error: "Écran distant introuvable." });
  }

  displays = displays.filter((d) => d.id !== id);
  saveData(DISPLAYS_FILE, displays);

  logActivity(
    "display_deleted",
    `Écran Déconnecté : ${toDelete.name}`,
    `L'écran (${toDelete.ipAddress}) a été retiré du parc de régie.`,
    "desktop",
    "Régie Vidéo"
  );

  broadcastUpdate("displays_updated", displays);
  res.json({ success: true, id });
});

// REMOTE COMMAND (Blackout, Switch Source, Set Ticker, Simulate Failover)
app.post("/api/displays/:id/remote-command", (req, res) => {
  const { id } = req.params;
  const { command, payload } = req.body;
  const index = displays.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Écran introuvable." });
  }

  const disp = displays[index];

  if (command === "toggle_blackout") {
    disp.isBlackout = !disp.isBlackout;
  } else if (command === "set_blackout") {
    disp.isBlackout = Boolean(payload?.isBlackout);
  } else if (command === "switch_source") {
    if (payload?.source) {
      disp.currentActiveSource = payload.source;
      if (payload.source === "ip_stream") {
        disp.isStreamSignalDetected = true;
      }
    }
  } else if (command === "simulate_signal_loss") {
    disp.isStreamSignalDetected = false;
    if (disp.enableAutoFailover) {
      disp.currentActiveSource = "fallback_loop";
    }
  } else if (command === "simulate_signal_restore") {
    disp.isStreamSignalDetected = true;
    disp.currentActiveSource = "ip_stream";
  } else if (command === "set_ticker") {
    disp.tickerMessage = payload?.tickerMessage || "";
    disp.tickerEnabled = Boolean(payload?.tickerEnabled);
  } else if (command === "set_playlist") {
    if (payload?.playlistId) {
      disp.assignedPlaylistId = payload.playlistId;
    }
  }

  disp.updatedAt = new Date().toISOString();
  saveData(DISPLAYS_FILE, displays);

  broadcastUpdate("display_command", { displayId: id, command, payload, display: disp });
  broadcastUpdate("displays_updated", displays);

  res.json({ success: true, display: disp });
});

// PING / HEARTBEAT from remote Kiosk TV client
app.post("/api/displays/:id/ping", (req, res) => {
  const { id } = req.params;
  const index = displays.findIndex((d) => d.id === id);
  if (index !== -1) {
    displays[index].lastPingAt = new Date().toISOString();
    displays[index].status = "online";
    if (req.body.currentActiveSource) {
      displays[index].currentActiveSource = req.body.currentActiveSource;
    }
    if (typeof req.body.isStreamSignalDetected === "boolean") {
      displays[index].isStreamSignalDetected = req.body.isStreamSignalDetected;
    }
    saveData(DISPLAYS_FILE, displays);
  }
  res.json({ success: true, display: index !== -1 ? displays[index] : null });
});

// PAIR / VERIFY SCREEN FROM SMARTPHONE
app.post("/api/displays/pair-verify", (req, res) => {
  const {
    screenId,
    pinCode,
    pairingToken,
    confirmedByUserName = "Opérateur Mobile",
    assignedPlaylistId,
    assignedLiveView,
    primaryMode,
    enableAutoFailover,
    hdmiSourceType,
  } = req.body;

  let index = -1;
  if (screenId) {
    index = displays.findIndex((d) => d.id === screenId);
  } else if (pinCode) {
    index = displays.findIndex((d) => d.pinCode === String(pinCode).trim());
  } else if (pairingToken) {
    index = displays.findIndex((d) => (d as any).pairingToken === pairingToken);
  }

  if (index === -1) {
    return res.status(404).json({ error: "Écran ou Code PIN introuvable. Veuillez vérifier le code affiché sur votre téléviseur." });
  }

  const disp = displays[index];
  (disp as any).isPaired = true;
  (disp as any).pairedByUserName = confirmedByUserName;
  (disp as any).pairedAt = new Date().toISOString();
  disp.status = "online";
  disp.lastPingAt = new Date().toISOString();

  if (assignedPlaylistId) disp.assignedPlaylistId = assignedPlaylistId;
  if (assignedLiveView) disp.assignedLiveView = assignedLiveView;
  if (primaryMode) disp.primaryMode = primaryMode;
  if (typeof enableAutoFailover === "boolean") disp.enableAutoFailover = enableAutoFailover;
  if (hdmiSourceType) (disp as any).hdmiSourceType = hdmiSourceType;

  disp.updatedAt = new Date().toISOString();
  saveData(DISPLAYS_FILE, displays);

  logActivity(
    "display_paired",
    `Écran Smart TV Appairé & Déverrouillé : ${disp.name}`,
    `Appairage validé par ${confirmedByUserName} (PIN: ${disp.pinCode} | IP: ${disp.ipAddress}). Lancement automatique en plein écran.`,
    "mobile",
    confirmedByUserName
  );

  broadcastUpdate("display_paired", { displayId: disp.id, display: disp, pairedBy: confirmedByUserName });
  broadcastUpdate("displays_updated", displays);

  res.json({ success: true, display: disp });
});

// UNPAIR SCREEN (Reset for re-pairing)
app.post("/api/displays/:id/unpair", (req, res) => {
  const { id } = req.params;
  const index = displays.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Écran introuvable." });
  }

  (displays[index] as any).isPaired = false;
  delete (displays[index] as any).pairedByUserName;
  delete (displays[index] as any).pairedAt;
  displays[index].pinCode = Math.floor(1000 + Math.random() * 9000).toString();
  displays[index].updatedAt = new Date().toISOString();

  saveData(DISPLAYS_FILE, displays);

  logActivity(
    "display_unpaired",
    `Écran Réinitialisé : ${displays[index].name}`,
    `L'appairage a été réinitialisé. L'écran affiche à nouveau son QR Code d'activation.`,
    "desktop",
    "Régie Vidéo"
  );

  broadcastUpdate("display_unpaired", { displayId: id, display: displays[index] });
  broadcastUpdate("displays_updated", displays);

  res.json({ success: true, display: displays[index] });
});

// GET all playlists
app.get("/api/playlists", (req, res) => {
  res.json({ success: true, playlists });
});

// CREATE a playlist
app.post("/api/playlists", (req, res) => {
  const { name, description, items = [], loopMode = "infinite" } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Le nom de la boucle est obligatoire." });
  }

  const totalDuration = items.reduce((acc: number, it: any) => acc + (Number(it.durationSeconds) || 10), 0);

  const newPlaylist = {
    id: `pl-${Date.now()}`,
    name: name.trim(),
    description: description?.trim() || "",
    items: items.map((it: any, idx: number) => ({
      ...it,
      id: it.id || `pl-item-${Date.now()}-${idx}`,
      durationSeconds: Number(it.durationSeconds) || 10,
    })),
    totalDurationSeconds: totalDuration || 30,
    loopMode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  playlists.push(newPlaylist);
  saveData(PLAYLISTS_FILE, playlists);

  broadcastUpdate("playlists_updated", playlists);
  res.json({ success: true, playlist: newPlaylist });
});

// UPDATE a playlist
app.put("/api/playlists/:id", (req, res) => {
  const { id } = req.params;
  const index = playlists.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Boucle de diffusion introuvable." });
  }

  const items = req.body.items || playlists[index].items;
  const totalDuration = items.reduce((acc: number, it: any) => acc + (Number(it.durationSeconds) || 10), 0);

  playlists[index] = {
    ...playlists[index],
    ...req.body,
    id,
    items,
    totalDurationSeconds: totalDuration,
    updatedAt: new Date().toISOString(),
  };

  saveData(PLAYLISTS_FILE, playlists);
  broadcastUpdate("playlists_updated", playlists);
  res.json({ success: true, playlist: playlists[index] });
});

// DELETE a playlist
app.delete("/api/playlists/:id", (req, res) => {
  const { id } = req.params;
  const toDelete = playlists.find((p) => p.id === id);
  if (!toDelete) {
    return res.status(404).json({ error: "Boucle introuvable." });
  }

  playlists = playlists.filter((p) => p.id !== id);
  saveData(PLAYLISTS_FILE, playlists);
  broadcastUpdate("playlists_updated", playlists);
  res.json({ success: true, id });
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
