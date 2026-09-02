export interface DepotWarehouse {
  id: string; // e.g. "DEP-01"
  code: string; // e.g. "PARIS-NORD"
  name: string; // e.g. "Dépôt Central Paris-Nord (Siège)"
  address?: string;
  city?: string;
  phone?: string;
  isDefault?: boolean;
  colorBadge?: string;
  description?: string;
}

export interface RentalPriceCoefficients {
  day1: number; // 1.0
  days2: number; // 1.5
  days3: number; // 2.0
  days4: number; // 2.5
  weekend: number; // 1.2 ou 1.5 (Vendredi soir au Lundi matin)
  week: number; // 3.0 (5 à 7 jours)
  twoWeeks: number; // 5.0 (14 jours)
  threeWeeks: number; // 7.0 (21 jours)
  month: number; // 8.0 (30 jours)
}

export type AudiovisualChapter =
  | 'videoprojection'        // 📺 Vidéoprojection, Murs LED & Écrans
  | 'reprise_camera'         // 🎥 Reprise Caméra, Plateau & Tourelles
  | 'eclairage_scene'        // 💡 Éclairage Face Scène & Projecteurs
  | 'sound_hf'               // 🟣 Sonorisation, Façade & Retours HF
  | 'structure_levage'       // 🏗️ Structure, Pont & Scène
  | 'distribution_electrique'// ⚡ Distribution Électrique & Blocs
  | 'cablage'                // 🔌 Câblage, Fibres & Liaisons
  | 'camera_optics'          // 🔴 Prise de Vue & Caméras
  | 'lenses_filters'         // 🔵 Optiques & Filtres
  | 'lighting_grip'          // 🟡 Éclairage Scénique
  | 'machinery_grip'         // 🟢 Machinerie, Pieds & Supports
  | 'power_energy'           // 🔷 Régie, Énergie & Groupes
  | 'consumables_sales'      // 📦 Consommables (Vente ferme / Gaffer)
  | 'studios_spaces'         // 🏢 Plateaux & Lieux d'Événements
  | 'crew_technicians'       // 👥 Personnel Technique & Régie
  | 'transport_logistics'    // 🚚 Transport, Chauffeurs & Livraison
  | 'logistics_fees';        // 📦 Frais Annexes & Assurance Bris de Machine

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  technicalSubDesignation?: string; // Désignation 2 (spécifications techniques imprimées en sous-ligne)
  category: string;
  chapterCategory?: AudiovisualChapter; // Famille / Chapitre Locasyst
  brand: string;
  model?: string;
  serialNumber?: string;
  description: string;
  totalQuantity: number;
  availableQuantity: number;
  rentedQuantity: number;
  reservedQuantity?: number;
  maintenanceQuantity?: number;
  minStockAlert: number;
  unitPrice: number; // Prix catalogue brut journalier
  rentalRatePerDay: number;
  replacementValue?: number; // Valeur à neuf / caution de remplacement
  maxDiscountPercent?: number; // Remise max autorisée sans accord
  managementMode?: 'serialized' | 'bulk_quantity' | 'consumable'; // Unitaire N° série / Quantitatif lot masse / Consommable
  location: string;
  depotId?: string; // Dépôt de rattachement
  depotName?: string;
  condition: 'Neuf' | 'Très bon état' | 'Bon état' | 'Usé' | 'À réviser';
  imageUrl: string;
  barcode: string;
  tags: string[];
  // Pack kit & accessoires inclus
  includedAccessories?: string[]; // Accessoires inclus dans le pack de location
  weightKg?: number;
  volumeM3?: number; // Volume en m³
  dimensions?: string;
  powerWatts?: number;
  powerAmps?: number;
  flightCaseReference?: string;
  isSubRentable?: boolean;
  technicalNotes?: string;
  rentalCoefficients?: Partial<RentalPriceCoefficients>;
  createdAt: string;
  updatedAt: string;
  aiConfidence?: number;
  aiAnalysisNotes?: string;
}

// Fiche Client Professionnel (Agences Event, Productions, Entreprises, Collectivités)
export interface ClientRecord {
  id: string;
  companyName: string; // Raison Sociale
  contactPerson: string; // Contact Principal / Commercial
  clientType: 'agence_event' | 'production_event' | 'collectivite' | 'corporate' | 'association' | 'particulier';
  email: string;
  phone: string;
  mobile?: string;
  siret?: string;
  tvaIntra?: string;
  billingAddress: string;
  deliveryAddress?: string;
  billingContactName?: string;
  billingContactEmail?: string;
  billingContactPhone?: string;
  onSiteContactName?: string; // Contact direct sur événement
  onSiteContactPhone?: string;
  defaultDiscountPercent?: number; // Remise standard négociée
  paymentTermsDays?: string; // ex: "Comptant à réception", "30 jours fin de mois"
  paymentMode?: string; // "Virement bancaire", "Carte", "Traite"
  creditLimit?: number; // Plafond d'encours autorisé
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Fiche Lieu & Salle de Réception (Standard Locasyst Événementiel)
export interface VenueRecord {
  id: string;
  name: string; // Ex: "Palais des Congrès de Paris - Hall Maillot", "Pavillon Gabriel"
  venueType: 'palais_congres' | 'salle_spectacle' | 'parc_expos' | 'hotel_chateau' | 'plein_air' | 'studio_plateau' | 'salle_fetes' | 'autre';
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
  capacity?: number; // Capacité max de personnes
  ceilingHeightMeters?: number; // Hauteur sous plafond / grill (m)
  riggingCapacityKg?: number; // Charge max élingage par point (kg)
  
  // Accès Quai & Déchargement Camions
  dockType: 'quai_niveleur' | 'plain_pied' | 'monte_charge' | 'acces_difficile';
  truckAccess: 'semi_remorque_38t' | 'porteur_19t' | 'fourgon_20m3' | 'vl_uniquement';
  maxVehicleHeightMeters?: number; // Hauteur max passage sous porche / portique
  dockContactName?: string;
  dockContactPhone?: string;
  dockAccessHours?: string; // Ex: "06h00 - 22h00 (sur réservation quai)"
  elevatorDimensions?: string; // Ex: "2.5m x 3.5m - 2000 kg"

  // Puissance Électrique & TGBT
  powerTotalKVA?: number; // Puissance dispo en kVA (ex: 63 kVA, 125 kVA, 250 kVA)
  sockets32ATri?: number; // Nb prises P17 32A Triphasé
  sockets63ATri?: number; // Nb prises P17 63A Triphasé
  sockets125ATri?: number; // Nb prises P17 125A Triphasé
  hasPowerlock?: boolean; // Prises Powerlock mono-pôles 400A
  hasMarechal?: boolean; // Prises Maréchal
  sockets16AMono?: number; // Nb PC 16A confort
  tgbtLocation?: string; // Emplacement armoire / TGBT (ex: "Coulisse Cour / Fond de scène")

  // Contact Régie & Technique du Lieu
  technicalDirectorName?: string; // Régisseur Général du lieu / DT Résident
  technicalDirectorPhone?: string;
  technicalDirectorEmail?: string;
  soundLimiterDBSPL?: number; // Limiteur sonore (ex: 95 dB SPL, 102 dB)
  soundLimiterNotes?: string;
  hasDmxNetwork?: boolean;
  hasFiberNetwork?: boolean;

  notes?: string;
  accessPlansUrl?: string; // Lien plan d'implantation
  createdAt: string;
  updatedAt?: string;
}

// Fiche Fournisseur & Confrère (Sous-location confrère / Achats / Consommables)
export interface SupplierRecord {
  id: string;
  name: string; // Raison Sociale
  supplierType: 'confrere_sous_location' | 'fabricant_materiel' | 'consommables' | 'transport_fret' | 'maintenance_sav';
  contactPerson: string;
  email: string;
  phone: string;
  emergencyPhone?: string; // Astreinte week-end
  siret?: string;
  tvaIntra?: string;
  address: string;
  city?: string;
  typicalPickupLocation?: string; // Dépôt d'enlèvement confrère
  discountRateOffered?: number; // Taux de remise pro accordé (ex: 40%)
  paymentTerms?: string;
  ribIban?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RentalMovement {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  itemImage?: string;
  type: 'out' | 'in';
  quantity: number;
  clientName: string;
  clientContact?: string;
  destination?: string;
  departureDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'active' | 'returned' | 'overdue' | 'damaged';
  returnCondition?: string;
  returnNotes?: string;
  scannedBy: string;
  scannedReturnBy?: string;
  dailyRate?: number;
  depositAmount?: number;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  title: string;
  details: string;
  device: 'mobile' | 'desktop';
  user: string;
}

export interface WarehouseStats {
  totalProducts: number;
  totalStockItems: number;
  totalAvailable: number;
  totalRented: number;
  totalInventoryValue: number;
  lowStockCount: number;
  activeRentalsCount: number;
  overdueCount: number;
  occupancyRate: number;
}

export interface AIAnalysisResult {
  name: string;
  brand: string;
  model: string;
  category: string;
  sku: string;
  description: string;
  suggestedQuantity: number;
  condition: 'Neuf' | 'Très bon état' | 'Bon état' | 'Usé' | 'À réviser';
  unitPrice: number;
  rentalRatePerDay: number;
  suggestedLocation: string;
  detectedTextOrBarcode?: string;
  tags: string[];
  confidence: number;
  aiNotes?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'Administrateur' | 'Responsable Logistique' | 'Opérateur Scan' | 'Comptoir & Location';
  avatar?: string;
  status: 'active' | 'inactive';
  lastActive: string;
  assignedWarehouse: string;
  assignedDepots?: string[]; // IDs of authorized depots
  defaultDepotId?: string;
  permissions: {
    canScanIn: boolean;
    canScanOut: boolean;
    canEditInventory: boolean;
    canManageRoles: boolean;
    canManageCloud: boolean;
  };
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'smartphone' | 'tablet' | 'desktop' | 'handheld_scanner';
  operatorName: string;
  ipAddress: string;
  lastSeen: string;
  status: 'online' | 'offline';
  appVersion: string;
  location: string;
}

export interface CloudAISettings {
  aiProvider: 'gemini' | 'openai' | 'custom';
  modelName: string;
  visionQuality: 'fast' | 'high' | 'ultra';
  autoFillConfidenceThreshold: number;
  cloudSyncFrequency: 'instant' | 'hourly' | 'daily';
  cloudStorageProvider: 'google_drive' | 'firestore' | 'local_cloud';
  autoBackupEnabled: boolean;
  apiKeyConfigured: boolean;
  aiPromptContext: string;
  customApiKey?: string;
  customApiKeyMasked?: string;
  isCustomApiKeySet?: boolean;
}

export interface DetectedScreen {
  id: string;
  name: string;
  width: number;
  height: number;
  availWidth?: number;
  availHeight?: number;
  isPrimary: boolean;
  isInternal?: boolean;
  left?: number;
  top?: number;
  devicePixelRatio?: number;
}

export interface CategoryThreshold {
  category: string;
  minUnitsThreshold: number;
  criticalThreshold: number;
  enableEmailAlerts: boolean;
  enablePushAlerts: boolean;
  alertRecipientEmails?: string[];
  alertPriority: 'normal' | 'high' | 'critical';
  autoReorderSuggestion: boolean;
  reorderQuantity: number;
}

export interface AlertNotificationSettings {
  emailAlertsEnabled: boolean;
  pushAlertsEnabled: boolean;
  defaultEmailRecipients: string[];
  alertFrequency: 'immediate' | 'daily_digest' | 'shift_change';
  webhookUrl?: string;
  lastAlertSentAt?: string;
  totalAlertsTriggered?: number;
}

export type SubscriptionTier = 'basic' | 'pro' | 'ultimate';
export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionConfig {
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  status: 'active' | 'trial' | 'past_due' | 'canceled';
  trialEndsAt: string; // ISO String for 14-day trial
  isTrial: boolean;
  crewAddonActive?: boolean; // Option Crew pour offre PRO (+35€/m ou +350€/an)
  subscriptionStartedAt: string;
  nextBillingDate: string;
  maxUsers: number;
  maxDepots: number;
}

export interface AppSettings {
  companyName: string;
  warehouseName: string;
  currency: string;
  depots?: DepotWarehouse[];
  requireEnterpriseLogin?: boolean;
  cloudAI: CloudAISettings;
  subscription?: SubscriptionConfig;
  defaultDailyRentalRatio: number;
  autoOverdueAlerts: boolean;
  categoryThresholds?: CategoryThreshold[];
  alertNotifications?: AlertNotificationSettings;
}

export type AppMode = 'desktop' | 'mobile-scanner' | 'calendar-broadcast' | 'kiosk-display';
export type MobileScanTab = 'ai-capture' | 'rental-out' | 'rental-in' | 'quick-lookup' | 'dossiers-signatures' | 'tv-pairing';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'Administrateur' | 'Responsable Logistique' | 'Opérateur Scan' | 'Comptoir & Location';
  companyName: string;
  companyId?: string;
  pinCode?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  subscription?: SubscriptionConfig;
  assignedDepots?: string[]; // IDs of assigned depots (e.g. ["DEP-01", "DEP-02"])
  defaultDepotId?: string;
  activeDepotId?: string; // Currently active depot in session
  permissions: {
    canScanIn: boolean;
    canScanOut: boolean;
    canEditInventory: boolean;
    canManageRoles: boolean;
    canManageCloud: boolean;
    canPurgeDatabase: boolean;
  };
}

export interface AuthSession {
  token: string;
  user: UserAccount;
  expiresAt?: string;
}

export interface DatabaseStatus {
  totalItems: number;
  totalRentals: number;
  totalLogs: number;
  totalUsers: number;
  isClean: boolean;
  lastCleanedAt?: string;
}

export type OfflineActionType =
  | 'ADD_ITEM'
  | 'UPDATE_ITEM'
  | 'DELETE_ITEM'
  | 'BATCH_DELETE'
  | 'RENTAL_CHECKOUT'
  | 'RENTAL_CHECKIN'
  | 'UPDATE_SETTINGS'
  | 'ADD_EMPLOYEE'
  | 'UPDATE_EMPLOYEE'
  | 'DELETE_EMPLOYEE';

export interface QueuedOfflineAction {
  id: string;
  type: OfflineActionType;
  description: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  retryCount?: number;
}

export interface ConnectivityState {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  lastChecked: string;
  pendingCount: number;
}

// ==========================================
// 1. SCAN DEVIS / FACTURE FOURNISSEUR & MATÉRIEL
// ==========================================
export interface ExtractedInvoiceItem {
  id?: string;
  name: string;
  brand: string;
  model?: string;
  category: string;
  quantity: number;
  unitPriceHT: number;
  suggestedRentalRatePerDay: number;
  serialNumber?: string;
  suggestedSKU: string;
  suggestedLocation: string;
  condition: 'Neuf' | 'Très bon état' | 'Bon état';
  description?: string;
  confidence?: number;
  selected?: boolean;
}

export interface InvoiceParseResult {
  documentType: 'facture' | 'devis' | 'bon_livraison' | 'recu';
  vendor: string;
  invoiceNumber: string;
  documentDate: string;
  currency: string;
  totalHT: number;
  totalTTC: number;
  extractedItems: ExtractedInvoiceItem[];
  rawTextSummary?: string;
}

// ==========================================
// 2. ESPACES & STUDIOS EN LOCATION
// ==========================================
export type StudioType =
  | 'podcast'
  | 'video_set'
  | 'audio_booth'
  | 'photo_stage'
  | 'streaming'
  | 'rehearsal'
  | 'event_hall'
  | 'other';

export interface StudioFixedEquipment {
  itemId: string; // ID of inventory item
  customName?: string;
  requiredQuantity: number;
  isMandatory: boolean; // Si true, alerte bloquante si absent
  notes?: string;
}

export interface StudioBooking {
  id: string;
  studioId: string;
  clientName: string;
  clientContact?: string;
  startDate: string;
  endDate: string;
  rateType: 'hourly' | 'daily';
  unitsCount: number;
  totalAmountHT: number;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  assignedTechnicians?: Array<{ technicianId: string; technicianName: string; role: string }>;
  notes?: string;
  missingEquipmentSnapshot?: Array<{
    itemId: string;
    itemName: string;
    missingQuantity: number;
    expectedReturnDate?: string;
    rentedToClient?: string;
  }>;
  createdAt: string;
}

export interface StudioSpace {
  id: string;
  name: string;
  type: StudioType;
  description: string;
  capacity: number;
  surfaceM2?: number;
  hourlyRate: number;
  dailyRate: number;
  imageUrl: string;
  colorBadge?: string;
  location: string;
  fixedEquipment: StudioFixedEquipment[];
  status: 'available' | 'booked' | 'maintenance';
  bookings?: StudioBooking[];
  createdAt: string;
  updatedAt: string;
}

export interface MissingEquipmentReport {
  itemId: string;
  itemName: string;
  itemSku: string;
  itemImage?: string;
  requiredQuantity: number;
  availableQuantity: number;
  missingQuantity: number;
  isMandatory: boolean;
  status: 'ok' | 'partially_missing' | 'critical_missing';
  activeRentals: Array<{
    rentalId: string;
    clientName: string;
    destination?: string;
    quantity: number;
    expectedReturnDate: string;
  }>;
}

// ==========================================
// 3. PERSONNEL & TECHNICIENS
// ==========================================
export type TechnicianSpecialty =
  | 'Son'
  | 'Lumière'
  | 'Vidéo'
  | 'Régie'
  | 'Cadre'
  | 'Streaming & Broadcast'
  | 'Montage Direct'
  | 'Machinerie'
  | 'Chef de Plateau'
  | 'Autre';

export interface TechnicianProfile {
  id: string;
  name: string;
  primaryRole: string;
  specialties: TechnicianSpecialty[];
  contractType?: 'intermittent' | 'permanent' | 'freelance';
  congesSpectaclesNumber?: string;
  gusoNumber?: string;
  habilitations?: string[]; // CACES 1B/3B, Habilitation Électrique BR/B2V, Rigger Hauteur, etc.
  email: string;
  phone: string;
  dailyRate: number; // TJM HT
  hourlyRate: number; // Taux horaire HT
  overtimeHourlyRate?: number; // Taux heures supplémentaires HT
  mealAllowancePerDiem?: number; // Indemnité repas / panier
  nightRateMultiplier?: number; // Majoration nuit (ex: 1.5)
  status: 'available' | 'on_mission' | 'unavailable';
  bio?: string;
  skills: string[];
  avatar?: string;
  rating?: number;
  assignedWarehouse?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. DEVIS, FACTURATION & DOSSIERS DE LOCATION MATÉRIEL & STUDIOS
// ==========================================
export type MainAppNavTab =
  | 'dashboard'
  | 'quotes'
  | 'directory'
  | 'invoices'
  | 'rentals'
  | 'inventory'
  | 'flightcases'
  | 'maintenance'
  | 'studios'
  | 'technicians'
  | 'calendar'
  | 'displays'
  | 'logs'
  | 'settings';

export type ItemReturnCondition = 'returned_ok' | 'damaged' | 'lost' | 'stolen' | 'pending' | 'incomplete';

export interface RentalItemCheckinRecord {
  itemId: string;
  name: string;
  brand?: string;
  sku?: string;
  quantityOut: number;
  quantityReturnedOk: number;
  quantityMissing?: number;
  quantityDamaged: number;
  quantityLost: number;
  quantityStolen: number;
  condition: ItemReturnCondition;
  missingAccessories?: string[];
  notes?: string;
  damageCharge?: number;
  replacementCharge?: number;
  inspectedAt?: string;
  inspectedBy?: string;
}

export type RentalOrderStatus = 'preparing' | 'in_rental' | 'overdue' | 'returned' | 'incomplete_return' | 'disputed' | 'cancelled';

export type DocumentPrintType = 
  | 'devis' 
  | 'bon_location' 
  | 'bon_livraison' 
  | 'bon_sous_location' 
  | 'bon_retour' 
  | 'facture';

export interface RentalDossier {
  id: string;
  orderNumber: string; // e.g. "LOC-2026-0042"
  quoteId?: string;
  clientName: string;
  clientCompany?: string;
  clientPhone?: string;
  clientEmail?: string;
  destination?: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  status: RentalOrderStatus;
  items: RentalItemCheckinRecord[];
  studioBookings?: QuoteStudioLine[];
  assignedTechnicians?: QuoteCrewLine[];
  depositAmount?: number;
  depositStatus?: 'pending' | 'held' | 'refunded' | 'retained';
  notes?: string;
  departureScannedBy?: string;
  returnScannedBy?: string;
  totalDamageOrLossPenalty?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItemLine {
  itemId: string;
  name: string;
  brand?: string;
  category?: string;
  quantity: number;
  shortageQuantity?: number; // Quantité non couverte par le parc propre, à sous-louer
  unitPricePerDay: number;
  days: number;
  discountPercent?: number; // Taux de remise R %
  unitPriceBase?: number; // Prix unitaire catalogue
  unitPriceDiscounted?: number; // P.U.HT net remisé
  totalHT: number;
  serialNumber?: string;
  replacementValue?: number;
  includedAccessories?: string[];
  
  // Spécificités audiovisuelles Locasyst / Manatís
  rentalCoefficient?: number; // Ex: 1.0 (1j), 1.5 (2j), 3.0 (semaine)
  chapterCategory?: AudiovisualChapter; // Chapitre métier d'affichage
  subSectionTitle?: string; // Ex: "Mur Led de Fond: 6 x 3,5", "Camera Plateau", "Périphériques"
  subSectionDetail?: string; // Ex: "Résolution Totale: 2016 x 1176"
  descriptionDetail?: string; // Multi-line technical notes / specs
  
  // Sous-location confrère (Sub-Rental)
  isSubRental?: boolean; // True si sous-loué auprès d'un confrère
  subRentalSupplier?: string; // Ex: "RVZ", "TSF", "PhotoCineRent", "Next Shot", "Panavision", "Autre"
  subRentalCostHT?: number; // Coût d'achat HT sous-loc
  subRentalOrderNumber?: string; // N° bon de commande confrère
  marginHT?: number; // Marge nette HT
  marginPercent?: number; // % Marge
  
  // Flight case parent/enfant
  isFlightCaseParent?: boolean;
  flightCaseBarcode?: string;
  flightCaseChildrenSkus?: string[];

  // Pointage départ et retour contradictoire
  returnStatus?: ItemReturnCondition;
  returnedOkQty?: number;
  missingQty?: number;
  damagedQty?: number;
  lostQty?: number;
  stolenQty?: number;
  missingAccessories?: string[];
  inspectionNotes?: string;
  repairCostEstimate?: number;
  replacementCostEstimate?: number;
}

export interface QuoteStudioLine {
  studioId: string;
  studioName: string;
  rateType: 'hourly' | 'daily';
  unitRate: number;
  quantityUnits: number;
  totalHT: number;
  hasMissingWarning?: boolean;
}

export interface QuoteCrewLine {
  technicianId: string;
  technicianName: string;
  role: string;
  rateType: 'hourly' | 'daily';
  unitRate: number;
  quantityUnits: number;
  totalHT: number;
}

export interface ClientQuote {
  id: string;
  quoteNumber: string; // e.g. "DEV-2026-001"
  type: 'quote' | 'invoice' | 'contract';
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  shippingAddress?: string;
  deliveryContactName?: string;
  deliveryContactPhone?: string;
  deliveryPhone?: string;
  deliveryPhone1?: string;
  driverOrCarrier?: string;
  vehiclePlate?: string;
  depotId?: string; // Dépôt d'enlèvement / départ
  depotName?: string;

  // En-tête Production, Événement & Locasyst
  productionCompany?: string;
  projectName?: string; // Nom de l'Événement / Affaire / Film / Projet
  eventLocation?: string; // Lieu de l'Événement / Site / Salle (Locasyst)
  venueId?: string; // Référence de la fiche lieu enregistrée
  venueSnapshot?: VenueRecord; // Données techniques du lieu
  projectManager?: string; // Chargé d'Affaires / Dossier suivi par (Locasyst)
  projectManagerPhone?: string; // Tél Chargé d'Affaires direct
  technicalDirector?: string; // Directeur Technique / Régisseur Général Event
  technicalDirectorPhone?: string; // Tél Directeur Technique
  onSiteContactName?: string; // Contact Régie / Plateau sur place
  onSiteContactPhone?: string; // Tél Contact sur place
  clientId?: string; // Référence fiche client Locasyst
  directorOfPhotography?: string; // Chef Opérateur (DOP)
  chiefElectrician?: string; // Chef Électricien (Gaffer)
  generalRegisseur?: string; // Régisseur Général / DirProd
  onSetContactPhone?: string; // Contact direct sur plateau
  accountManager?: string; // Dossier suivi par (ex: "Bertrand BROT")
  accountManagerPhone?: string; // Tél chargé d'affaires (ex: "06 11 60 78 77")
  clientProjectRef?: string; // Vos références (ex: "Devis Josué")
  clientPhone1?: string; // Tél.1
  clientMobile?: string; // Mobile
  billingCompanyName?: string;
  billingContactName?: string;
  deliveryCity?: string;

  // Planning technique & Événementiel
  setupSchedule?: string; // e.g. "Montage: Samedi 4 Avril 8h"
  exploitationSchedule?: string; // e.g. "Exploitation:"
  teardownSchedule?: string; // e.g. "Démontage: Dimanche 5 Avril 20h"
  remainingClientCharges?: string[]; // e.g. ["Le Transport A/R du Matériel", "L'Assurance Bris de Machine", "Le Respect des Conditions Techniques"]

  // Modalités de règlement & Banque (RIB)
  paymentTermsDays?: string; // Délai de règlement (ex: "Comptant à réception" / "30 jours")
  paymentMode?: string; // Mode de règlement (ex: "Virement bancaire")
  bankIban?: string; // ex: "FR 76 1820 6000 1060 2758 9258 842"
  bankCodeBanque?: string; // ex: "18206"
  bankCodeGuichet?: string; // ex: "00010"
  bankNumCompte?: string; // ex: "60275892588"
  bankCle?: string; // ex: "42"

  // Mentions juridiques société & Locasyst
  companyCapital?: string; // ex: "25 000 €"
  companySiret?: string; // ex: "523 019 446 00021"
  companyRcs?: string; // ex: "Versailles 523 019 446"
  companyApe?: string; // ex: "9002 Z"
  companyTvaIntra?: string; // ex: "FR27 523 019 446"
  companyAddressLine?: string; // ex: "277 Rue Fourny - BP36 - 78530 Buc"

  // Dates détaillées & Prep Day (Cinéma)
  date: string;
  validityDate?: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  durationHours?: number;

  departureDate?: string; // Date enlèvement magasin
  departureTimeSlot?: string; // "Matin (09h-12h)" | "Après-midi (14h-18h)" | "Soirée"
  shootStartDate?: string; // Date début tournage effectif
  shootEndDate?: string; // Date fin tournage effectif
  shootDaysCount?: number; // Nb jours de tournage facturables
  hasPrepDay?: boolean; // Journée d'essais caméra au dépôt
  prepDate?: string; // Date journée d'essais caméra
  prepDiscountPercent?: number; // % remise prep day (ex: 100% offert)
  travelDaysCount?: number; // Jours de transport/route
  returnDate?: string; // Date retour magasin
  returnTimeSlot?: string; // "Matin (09h-12h)" | "Après-midi (14h-18h)"

  // Grille de coefficients de location appliquée
  appliedCoeffPreset?: 'auto' | '1j' | '2j' | '3j' | '4j' | 'weekend' | 'week' | '2weeks' | '3weeks' | 'month' | 'custom';
  globalRentalCoefficient?: number; // Coeff global par défaut

  status: 'draft' | 'sent' | 'accepted' | 'invoiced' | 'paid' | 'rejected';
  
  // Lines
  rentalItems: QuoteItemLine[];
  studioRentals: QuoteStudioLine[];
  crewStaff: QuoteCrewLine[];
  
  // Totals
  discountGlobalPercent: number;
  taxRate: number; // e.g. 20
  totalHT: number;
  totalTVA: number;
  totalTTC: number;

  // Sous-location & Marges globales
  totalSubRentalCostHT?: number;
  totalMarginHT?: number;
  totalMarginPercent?: number;

  // Acompte réglable par l'utilisateur (déductible de la facture)
  depositPercent?: number; // Ex: 30 pour 30%
  depositAmount?: number; // Montant calculé ou fixé de l'acompte (TTC)
  depositStatus?: 'pending' | 'received' | 'not_required'; // Statut de l'acompte
  depositPaymentDate?: string;
  depositPaymentMethod?: 'cb' | 'virement' | 'cheque' | 'especes' | 'traite';
  depositNotes?: string;

  // Caution & Garantie Financière (Séparée de l'acompte, restituée au retour)
  totalReplacementValue?: number; // Valeur assurée totale du parc loué
  depositGuaranteeAmount?: number; // Montant de la caution demandée
  depositGuaranteeType?: 'imprint_cb' | 'check' | 'insurance_letter' | 'bank_transfer' | 'none';
  depositGuaranteeStatus?: 'pending' | 'received_held' | 'released' | 'partially_retained';
  depositGuaranteeNotes?: string;
  insuranceCompany?: string; // Ex: "Gras Savoye", "Rubini & Associés", "Hiscox", "Allianz Cinéma"
  insurancePolicyNumber?: string;
  
  // Rental check-in status (when accepted / converted into rental dossier)
  rentalStatus?: RentalOrderStatus;
  actualReturnDate?: string;
  returnType?: 'complete' | 'incomplete';
  incompleteReturnNotes?: string;
  missingItemsSummary?: string;
  disputeNotes?: string;
  penaltyCharges?: number;
  
  // Signatures for departure and return
  departureSignature?: DocumentSignature; // Signature client bon départ (location / livraison)
  operatorDepartureSignature?: DocumentSignature; // Validation opérateur départ
  returnSignature?: DocumentSignature; // Signature client bon de retour (complet ou incomplet)
  operatorReturnSignature?: DocumentSignature; // Validation opérateur retour
  
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSignature {
  signatureDataUrl?: string; // Base64 PNG/JPEG
  signerName: string;
  signerRole?: string; // e.g. "Client / Réceptionnaire", "Transporteur / Chauffeur", "Responsable Dépôt"
  signedAt: string; // ISO date string
  isOperatorValidated?: boolean;
  validationMethod?: 'touch_screen' | 'mobile_signed' | 'paper_printed_verified';
}

export type SignatureTargetType =
  | 'client_departure'
  | 'operator_departure'
  | 'client_return'
  | 'operator_return';

export interface DetectedScreen {
  id: string;
  name: string;
  isPrimary: boolean;
  isInternal?: boolean;
  width: number;
  height: number;
  availWidth?: number;
  availHeight?: number;
  left?: number;
  top?: number;
  devicePixelRatio?: number;
  colorDepth?: number;
}

// ==========================================
// 5. ATELIER SAV, RÉPARATIONS & CARNET DE SANTÉ MATÉRIEL
// ==========================================
export type IncidentSeverity = 'minor' | 'medium' | 'critical';
export type IncidentType =
  | 'breakage_return'      // Casse constatée au retour de tournage
  | 'optical_scratch'      // Rayure lentille / champignons optique
  | 'electronic_failure'   // Panne capteur / carte mère / firmware
  | 'connector_damaged'    // Connecteur BNC / Lemo / XLR / HDMI tordu ou arraché
  | 'cable_cut'            // Câble sectionné / gaine abîmée
  | 'wear_and_tear'        // Usure normale & maintenance préventive
  | 'periodic_vgp'         // Contrôle périodique VGP Levage / Sécurité
  | 'firmware_calibration' // Recalibrage capteur / Mire / Flange optique
  | 'missing_part';        // Pièce ou accessoire manquant

export type MaintenanceTicketStatus =
  | 'diagnosing'           // Diagnostic en cours en atelier
  | 'waiting_parts'        // En attente de pièces détachées constructeur
  | 'in_repair_inhouse'    // En cours de réparation par technicien interne
  | 'sent_to_manufacturer' // Expédié chez le constructeur (ARRI, Sony, RED, Aputure...)
  | 'repaired_testing'     // Réparé, en banc de test / mire
  | 'completed_back_stock' // Réparé et réintégré au stock disponible
  | 'written_off';         // Déclassé / Irréparable (Rebut)

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string; // e.g. "SAV-2026-001"
  itemId: string;
  itemName: string;
  itemSku: string;
  serialNumber?: string;
  category?: string;
  brand?: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: MaintenanceTicketStatus;
  reportedDate: string; // ISO date
  reportedBy: string; // Technicien ou magasinier
  description: string;
  
  // Imputation & Refacturation Client (si casse en tournage)
  isClientResponsible?: boolean;
  relatedQuoteId?: string; // Dossier de location d'origine
  relatedQuoteNumber?: string;
  clientName?: string;
  clientCompany?: string;
  repairCostEstimatedHT?: number;
  repairCostFinalHT?: number;
  isBilledToClient?: boolean;
  billedInvoiceNumber?: string;

  // Suivi SAV Constructeur
  manufacturerRMA?: string; // Numéro RMA / dossier SAV constructeur
  estimatedReturnDate?: string;
  partsReplaced?: string[];
  technicianNotes?: string;
  resolvedDate?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 6. FLIGHT CASES & MALLES « MASTER QR / RFID » (PACKS SCELLÉS)
// ==========================================
export type FlightCaseCategory =
  | 'camera_flightcase'   // Malle Caméra & Valise Rigide Peli
  | 'lens_case'           // Malle Série Optiques & Mire
  | 'lighting_trunk'      // Cantine Éclairage & Malle Projecteurs
  | 'grip_bag_trunk'      // Fly Pieds & Machinerie
  | 'cable_trunk'         // Malle Câblage & Pieuvres
  | 'sound_rack_bag'      // Rack HF & Régie Son
  | 'distribution_box';   // Armoire & Coffret Électrique

export interface FlightCaseContainedItem {
  itemId: string;
  itemName: string;
  itemSku: string;
  requiredQty: number;
  serialNumber?: string;
  isChecked?: boolean; // Lors du contrôle de départ ou retour
  status?: 'ok' | 'missing' | 'damaged';
}

export interface FlightCaseMaster {
  id: string;
  code: string; // e.g. "FC-CAM-01", "MALLE-APUTURE-600C"
  name: string;
  category: FlightCaseCategory;
  barcode: string;
  rfidTag?: string;
  depotId?: string;
  depotName?: string;
  locationRack?: string; // e.g. "Allée B - Rack 04 - Niveau 2"
  dimensions?: string; // e.g. "60 x 40 x 35 cm"
  emptyWeightKg?: number;
  totalWeightKg?: number;
  
  // Statut de scellé
  sealStatus: 'sealed_ready' | 'opened_in_prep' | 'on_shoot' | 'maintenance' | 'incomplete';
  sealSecurityNumber?: string; // e.g. "SEAL-8921" (plomb numéroté)
  sealedBy?: string;
  sealedDate?: string;

  containedItems: FlightCaseContainedItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 7. MÉTRIQUES LOGISTIQUES, TRANSPORT & BILAN ÉNERGÉTIQUE
// ==========================================
export interface QuoteLogisticsMetrics {
  totalWeightKg: number;
  totalVolumeM3: number;
  totalPowerWatts: number;
  totalAmperage230V: number; // Watts / 230V (Arrondi)
  suggestedVehicleType: 'utilitaire_compact' | 'fourgon_moyen' | 'grand_fourgon_hayon' | 'poids_lourd';
  vehicleDescription: string;
  electricalTier: 'mono_16A' | 'mono_32A' | 'tri_32A' | 'tri_63A_plus';
  electricalDescription: string;
  isGeneratorRequired: boolean;
  truckPayloadWarning?: boolean;
}

// ==========================================
// 8. PORTAIL CLIENT SÉCURISÉ & SIGNATURE EN LIGNE
// ==========================================
// Blocage d'inventaire / Maintenance dans le calendrier
export interface CalendarInventoryBlock {
  id: string;
  title: string; // Ex: "Grand Inventaire Annuel Parc Caméras", "Vérification Périodique VGP Levage", "Comptage Dépôt Central"
  type: 'general_inventory' | 'partial_inventory' | 'maintenance_vgp' | 'depot_closure';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  depotId?: string; // 'ALL' or ID
  depotName?: string;
  affectedCategory?: string; // 'ALL' or category name
  assignedTechnicians?: string[];
  blockRentals: boolean; // Si true, bloque et avertit sur les départs matériels
  notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  createdAt: string;
}

// ==========================================
// 8. PORTAIL CLIENT SÉCURISÉ & SIGNATURE EN LIGNE
// ==========================================
export interface ClientPortalShare {
  token: string;
  quoteId: string;
  quoteNumber: string;
  clientName: string;
  clientCompany?: string;
  projectName?: string;
  totalTTC: number;
  depositAmountRequired?: number;
  validityDate?: string;
  isSignedOnline: boolean;
  signedOnlineAt?: string;
  signedByPersonName?: string;
  clientComment?: string;
  isDepositPaidOnline?: boolean;
  paidOnlineAmount?: number;
  downloadsCount: number;
  createdAt: string;
}

// ==========================================
// 9. GESTION DES ÉCRANS RÉSEAU & DIGITAL SIGNAGE (RÉGIE DISTANTE)
// ==========================================
export type DisplaySourceMode = 'loop_playlist' | 'ip_stream' | 'kroma_live_view' | 'emergency_message' | 'hdmi_direct';

export type KromaLiveViewKey = 
  | 'calendar_planning'
  | 'rentals_dispatch'
  | 'overdue_urgencies'
  | 'sav_maintenance'
  | 'live_scan_stream';

export type DisplayMediaType = 'image' | 'video' | 'pdf' | 'kroma_view' | 'text_slide';

export interface DisplayMediaItem {
  id: string;
  type: DisplayMediaType;
  title: string;
  url?: string;
  durationSeconds: number; // e.g. 10s for images, or video duration
  kromaViewType?: KromaLiveViewKey;
  pdfPageCount?: number;
  pdfScrollSpeedSeconds?: number;
  caption?: string;
  bgColor?: string;
  textColor?: string;
  customHeading?: string;
  customBody?: string;
}

export interface DisplayPlaylist {
  id: string;
  name: string;
  description?: string;
  items: DisplayMediaItem[];
  totalDurationSeconds: number;
  loopMode: 'infinite' | 'scheduled';
  createdAt: string;
  updatedAt: string;
}

export interface NetworkDisplayScreen {
  id: string;
  name: string;
  location: string;
  depotId?: string;
  depotName?: string;
  ipAddress: string;
  macAddress?: string;
  connectionType: 'rj45' | 'wifi';
  status: 'online' | 'offline' | 'standby';
  lastPingAt: string;
  pinCode: string; // 4-digit PIN for instant Smart TV pairing
  pairingToken?: string;
  isPaired?: boolean;
  pairedByUserName?: string;
  pairedAt?: string;
  kioskUrl: string;

  // Source & Content Configuration
  primaryMode: DisplaySourceMode;
  assignedPlaylistId?: string;
  assignedLiveView?: KromaLiveViewKey;

  // HDMI Direct & Capture Configuration
  hdmiSourceType?: 'encoder_ip' | 'usb_capture_card' | 'hardware_switcher' | 'none';
  hdmiCaptureDeviceName?: string;

  // Smart IP Stream Failover Configuration
  enableAutoFailover: boolean;
  ipStreamUrl?: string; // RTSP, HLS (m3u8), WebRTC, or HTTP MP4 live feed
  streamProtocol: 'rtsp' | 'hls' | 'webrtc' | 'http_mp4';
  failoverTimeoutSeconds: number; // 5, 10, 15, 30, 60s delay on signal loss before web loop
  currentActiveSource: 'ip_stream' | 'fallback_loop' | 'blackout' | 'hdmi_direct';
  isStreamSignalDetected: boolean;

  // Remote Overrides & Controls
  isBlackout: boolean; // Standby energy saver
  tickerMessage?: string;
  tickerEnabled: boolean;
  tickerSpeed: 'slow' | 'normal' | 'fast';
  orientation: 'landscape' | 'portrait';
  resolution?: string; // e.g. "1080p Full HD", "4K UHD"
  brightness: number; // 0 to 100%
  volume: number; // 0 to 100%
  refreshRateSeconds: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}



