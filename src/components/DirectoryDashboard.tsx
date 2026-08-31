import React, { useState } from "react";
import {
  Building2,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Truck,
  Percent,
  CreditCard,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Building,
  UserCheck,
  X,
  Clock,
  ArrowRight,
  Zap,
  Anchor,
  Volume2,
  ShieldAlert,
  Navigation,
  FileSpreadsheet,
  KeyRound,
  Wrench,
  HelpCircle,
  Eye,
  Info
} from "lucide-react";
import { ClientRecord, SupplierRecord, VenueRecord } from "../types";

interface DirectoryDashboardProps {
  clients: ClientRecord[];
  suppliers: SupplierRecord[];
  venues?: VenueRecord[];
  onAddClient: (client: Partial<ClientRecord>) => Promise<boolean>;
  onUpdateClient: (id: string, updates: Partial<ClientRecord>) => Promise<boolean>;
  onDeleteClient: (id: string) => Promise<boolean>;
  onAddSupplier: (supplier: Partial<SupplierRecord>) => Promise<boolean>;
  onUpdateSupplier: (id: string, updates: Partial<SupplierRecord>) => Promise<boolean>;
  onDeleteSupplier: (id: string) => Promise<boolean>;
  onAddVenue?: (venue: Partial<VenueRecord>) => Promise<boolean>;
  onUpdateVenue?: (id: string, updates: Partial<VenueRecord>) => Promise<boolean>;
  onDeleteVenue?: (id: string) => Promise<boolean>;
  onDraftQuoteForClient?: (client: ClientRecord) => void;
  onDraftQuoteForVenue?: (venue: VenueRecord) => void;
}

export const DirectoryDashboard: React.FC<DirectoryDashboardProps> = ({
  clients = [],
  suppliers = [],
  venues = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddVenue = async (_v?: Partial<VenueRecord>) => false,
  onUpdateVenue = async (_id?: string, _u?: Partial<VenueRecord>) => false,
  onDeleteVenue = async (_id?: string) => false,
  onDraftQuoteForClient,
  onDraftQuoteForVenue,
}) => {
  const [activeTab, setActiveTab] = useState<"clients" | "venues" | "suppliers">("clients");
  const [searchQuery, setSearchQuery] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all");
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<string>("all");
  const [venueTypeFilter, setVenueTypeFilter] = useState<string>("all");

  // Modal states
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);

  const [showVenueModal, setShowVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<VenueRecord | null>(null);
  const [viewingVenueDetails, setViewingVenueDetails] = useState<VenueRecord | null>(null);

  // Client form state
  const [cCompanyName, setCCompanyName] = useState("");
  const [cContactPerson, setCContactPerson] = useState("");
  const [cClientType, setCClientType] = useState<ClientRecord["clientType"]>("agence_event");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cMobile, setCMobile] = useState("");
  const [cSiret, setCSiret] = useState("");
  const [cTvaIntra, setCTvaIntra] = useState("");
  const [cBillingAddress, setCBillingAddress] = useState("");
  const [cDeliveryAddress, setCDeliveryAddress] = useState("");
  const [cBillingContactName, setCBillingContactName] = useState("");
  const [cBillingContactEmail, setCBillingContactEmail] = useState("");
  const [cOnSiteContactName, setCOnSiteContactName] = useState("");
  const [cOnSiteContactPhone, setCOnSiteContactPhone] = useState("");
  const [cDefaultDiscountPercent, setCDefaultDiscountPercent] = useState<number>(0);
  const [cPaymentTermsDays, setCPaymentTermsDays] = useState("Comptant à réception");
  const [cPaymentMode, setCPaymentMode] = useState("Virement bancaire");
  const [cCreditLimit, setCCreditLimit] = useState<number>(10000);
  const [cNotes, setCNotes] = useState("");

  // Supplier form state
  const [sName, setSName] = useState("");
  const [sSupplierType, setSSupplierType] = useState<SupplierRecord["supplierType"]>("confrere_sous_location");
  const [sContactPerson, setSContactPerson] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sEmergencyPhone, setSEmergencyPhone] = useState("");
  const [sSiret, setSSiret] = useState("");
  const [sTvaIntra, setSTvaIntra] = useState("");
  const [sAddress, setSAddress] = useState("");
  const [sCity, setSCity] = useState("");
  const [sTypicalPickupLocation, setSTypicalPickupLocation] = useState("");
  const [sDiscountRateOffered, setSDiscountRateOffered] = useState<number>(40);
  const [sPaymentTerms, setSPaymentTerms] = useState("30 jours fin de mois");
  const [sRibIban, setSRibIban] = useState("");
  const [sNotes, setSNotes] = useState("");

  // Venue form state
  const [vName, setVName] = useState("");
  const [vVenueType, setVVenueType] = useState<VenueRecord["venueType"]>("palais_congres");
  const [vAddress, setVAddress] = useState("");
  const [vCity, setVCity] = useState("");
  const [vPostalCode, setVPostalCode] = useState("");
  const [vCountry, setVCountry] = useState("France");
  const [vCapacity, setVCapacity] = useState<number | undefined>(1000);
  const [vCeilingHeight, setVCeilingHeight] = useState<number | undefined>(8.5);
  const [vRiggingCapacity, setVRiggingCapacity] = useState<number | undefined>(500);
  const [vDockType, setVDockType] = useState<VenueRecord["dockType"]>("quai_niveleur");
  const [vTruckAccess, setVTruckAccess] = useState<VenueRecord["truckAccess"]>("semi_remorque_38t");
  const [vMaxVehicleHeight, setVMaxVehicleHeight] = useState<number | undefined>(4.2);
  const [vDockContactName, setVDockContactName] = useState("");
  const [vDockContactPhone, setVDockContactPhone] = useState("");
  const [vDockAccessHours, setVDockAccessHours] = useState("06h00 - 23h00 (sur réservation)");
  const [vElevatorDimensions, setVElevatorDimensions] = useState("");
  const [vPowerTotalKVA, setVPowerTotalKVA] = useState<number | undefined>(125);
  const [vSockets32ATri, setVSockets32ATri] = useState<number | undefined>(4);
  const [vSockets63ATri, setVSockets63ATri] = useState<number | undefined>(2);
  const [vSockets125ATri, setVSockets125ATri] = useState<number | undefined>(1);
  const [vHasPowerlock, setVHasPowerlock] = useState<boolean>(true);
  const [vHasMarechal, setVHasMarechal] = useState<boolean>(false);
  const [vSockets16AMono, setVSockets16AMono] = useState<number | undefined>(12);
  const [vTgbtLocation, setVTgbtLocation] = useState("Coulisses Cour / Fond de Scène");
  const [vTechnicalDirectorName, setVTechnicalDirectorName] = useState("");
  const [vTechnicalDirectorPhone, setVTechnicalDirectorPhone] = useState("");
  const [vTechnicalDirectorEmail, setVTechnicalDirectorEmail] = useState("");
  const [vSoundLimiterDBSPL, setVSoundLimiterDBSPL] = useState<number | undefined>(102);
  const [vSoundLimiterNotes, setVSoundLimiterNotes] = useState("Coupure automatique à 105 dB(A) sur 15 min");
  const [vHasDmxNetwork, setVHasDmxNetwork] = useState<boolean>(true);
  const [vHasFiberNetwork, setVHasFiberNetwork] = useState<boolean>(true);
  const [vNotes, setVNotes] = useState("");
  const [vAccessPlansUrl, setVAccessPlansUrl] = useState("");

  // Handle open client modal
  const handleOpenClientModal = (client?: ClientRecord) => {
    if (client) {
      setEditingClient(client);
      setCCompanyName(client.companyName);
      setCContactPerson(client.contactPerson);
      setCClientType(client.clientType);
      setCEmail(client.email);
      setCPhone(client.phone);
      setCMobile(client.mobile || "");
      setCSiret(client.siret || "");
      setCTvaIntra(client.tvaIntra || "");
      setCBillingAddress(client.billingAddress);
      setCDeliveryAddress(client.deliveryAddress || "");
      setCBillingContactName(client.billingContactName || "");
      setCBillingContactEmail(client.billingContactEmail || "");
      setCOnSiteContactName(client.onSiteContactName || "");
      setCOnSiteContactPhone(client.onSiteContactPhone || "");
      setCDefaultDiscountPercent(client.defaultDiscountPercent || 0);
      setCPaymentTermsDays(client.paymentTermsDays || "Comptant à réception");
      setCPaymentMode(client.paymentMode || "Virement bancaire");
      setCCreditLimit(client.creditLimit || 10000);
      setCNotes(client.notes || "");
    } else {
      setEditingClient(null);
      setCCompanyName("");
      setCContactPerson("");
      setCClientType("agence_event");
      setCEmail("");
      setCPhone("");
      setCMobile("");
      setCSiret("");
      setCTvaIntra("");
      setCBillingAddress("");
      setCDeliveryAddress("");
      setCBillingContactName("");
      setCBillingContactEmail("");
      setCOnSiteContactName("");
      setCOnSiteContactPhone("");
      setCDefaultDiscountPercent(0);
      setCPaymentTermsDays("Comptant à réception");
      setCPaymentMode("Virement bancaire");
      setCCreditLimit(10000);
      setCNotes("");
    }
    setShowClientModal(true);
  };

  // Handle open supplier modal
  const handleOpenSupplierModal = (supplier?: SupplierRecord) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSName(supplier.name);
      setSSupplierType(supplier.supplierType);
      setSContactPerson(supplier.contactPerson);
      setSEmail(supplier.email);
      setSPhone(supplier.phone);
      setSEmergencyPhone(supplier.emergencyPhone || "");
      setSSiret(supplier.siret || "");
      setSTvaIntra(supplier.tvaIntra || "");
      setSAddress(supplier.address);
      setSCity(supplier.city || "");
      setSTypicalPickupLocation(supplier.typicalPickupLocation || "");
      setSDiscountRateOffered(supplier.discountRateOffered || 40);
      setSPaymentTerms(supplier.paymentTerms || "30 jours fin de mois");
      setSRibIban(supplier.ribIban || "");
      setSNotes(supplier.notes || "");
    } else {
      setEditingSupplier(null);
      setSName("");
      setSSupplierType("confrere_sous_location");
      setSContactPerson("");
      setSEmail("");
      setSPhone("");
      setSEmergencyPhone("");
      setSSiret("");
      setSTvaIntra("");
      setSAddress("");
      setSCity("");
      setSTypicalPickupLocation("");
      setSDiscountRateOffered(40);
      setSPaymentTerms("30 jours fin de mois");
      setSRibIban("");
      setSNotes("");
    }
    setShowSupplierModal(true);
  };

  // Handle open venue modal
  const handleOpenVenueModal = (venue?: VenueRecord) => {
    if (venue) {
      setEditingVenue(venue);
      setVName(venue.name);
      setVVenueType(venue.venueType);
      setVAddress(venue.address);
      setVCity(venue.city);
      setVPostalCode(venue.postalCode || "");
      setVCountry(venue.country || "France");
      setVCapacity(venue.capacity);
      setVCeilingHeight(venue.ceilingHeightMeters);
      setVRiggingCapacity(venue.riggingCapacityKg);
      setVDockType(venue.dockType);
      setVTruckAccess(venue.truckAccess);
      setVMaxVehicleHeight(venue.maxVehicleHeightMeters);
      setVDockContactName(venue.dockContactName || "");
      setVDockContactPhone(venue.dockContactPhone || "");
      setVDockAccessHours(venue.dockAccessHours || "");
      setVElevatorDimensions(venue.elevatorDimensions || "");
      setVPowerTotalKVA(venue.powerTotalKVA);
      setVSockets32ATri(venue.sockets32ATri);
      setVSockets63ATri(venue.sockets63ATri);
      setVSockets125ATri(venue.sockets125ATri);
      setVHasPowerlock(venue.hasPowerlock ?? false);
      setVHasMarechal(venue.hasMarechal ?? false);
      setVSockets16AMono(venue.sockets16AMono);
      setVTgbtLocation(venue.tgbtLocation || "");
      setVTechnicalDirectorName(venue.technicalDirectorName || "");
      setVTechnicalDirectorPhone(venue.technicalDirectorPhone || "");
      setVTechnicalDirectorEmail(venue.technicalDirectorEmail || "");
      setVSoundLimiterDBSPL(venue.soundLimiterDBSPL);
      setVSoundLimiterNotes(venue.soundLimiterNotes || "");
      setVHasDmxNetwork(venue.hasDmxNetwork ?? false);
      setVHasFiberNetwork(venue.hasFiberNetwork ?? false);
      setVNotes(venue.notes || "");
      setVAccessPlansUrl(venue.accessPlansUrl || "");
    } else {
      setEditingVenue(null);
      setVName("");
      setVVenueType("palais_congres");
      setVAddress("");
      setVCity("");
      setVPostalCode("");
      setVCountry("France");
      setVCapacity(800);
      setVCeilingHeight(8);
      setVRiggingCapacity(500);
      setVDockType("quai_niveleur");
      setVTruckAccess("semi_remorque_38t");
      setVMaxVehicleHeight(4.2);
      setVDockContactName("");
      setVDockContactPhone("");
      setVDockAccessHours("06h00 - 22h00");
      setVElevatorDimensions("");
      setVPowerTotalKVA(125);
      setVSockets32ATri(4);
      setVSockets63ATri(2);
      setVSockets125ATri(1);
      setVHasPowerlock(true);
      setVHasMarechal(false);
      setVSockets16AMono(10);
      setVTgbtLocation("Coulisse Cour / Fond de scène");
      setVTechnicalDirectorName("");
      setVTechnicalDirectorPhone("");
      setVTechnicalDirectorEmail("");
      setVSoundLimiterDBSPL(102);
      setVSoundLimiterNotes("");
      setVHasDmxNetwork(true);
      setVHasFiberNetwork(true);
      setVNotes("");
      setVAccessPlansUrl("");
    }
    setShowVenueModal(true);
  };

  // Save client
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cCompanyName.trim()) return;

    const payload: Partial<ClientRecord> = {
      companyName: cCompanyName.trim(),
      contactPerson: cContactPerson.trim(),
      clientType: cClientType,
      email: cEmail.trim(),
      phone: cPhone.trim(),
      mobile: cMobile.trim(),
      siret: cSiret.trim(),
      tvaIntra: cTvaIntra.trim(),
      billingAddress: cBillingAddress.trim(),
      deliveryAddress: cDeliveryAddress.trim() || cBillingAddress.trim(),
      billingContactName: cBillingContactName.trim(),
      billingContactEmail: cBillingContactEmail.trim(),
      onSiteContactName: cOnSiteContactName.trim(),
      onSiteContactPhone: cOnSiteContactPhone.trim(),
      defaultDiscountPercent: Number(cDefaultDiscountPercent) || 0,
      paymentTermsDays: cPaymentTermsDays,
      paymentMode: cPaymentMode,
      creditLimit: Number(cCreditLimit) || 0,
      notes: cNotes.trim(),
    };

    if (editingClient) {
      await onUpdateClient(editingClient.id, payload);
    } else {
      await onAddClient(payload);
    }
    setShowClientModal(false);
  };

  // Save supplier
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName.trim()) return;

    const payload: Partial<SupplierRecord> = {
      name: sName.trim(),
      supplierType: sSupplierType,
      contactPerson: sContactPerson.trim(),
      email: sEmail.trim(),
      phone: sPhone.trim(),
      emergencyPhone: sEmergencyPhone.trim(),
      siret: sSiret.trim(),
      tvaIntra: sTvaIntra.trim(),
      address: sAddress.trim(),
      city: sCity.trim(),
      typicalPickupLocation: sTypicalPickupLocation.trim(),
      discountRateOffered: Number(sDiscountRateOffered) || 0,
      paymentTerms: sPaymentTerms,
      ribIban: sRibIban.trim(),
      notes: sNotes.trim(),
    };

    if (editingSupplier) {
      await onUpdateSupplier(editingSupplier.id, payload);
    } else {
      await onAddSupplier(payload);
    }
    setShowSupplierModal(false);
  };

  // Save venue
  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) return;

    const payload: Partial<VenueRecord> = {
      name: vName.trim(),
      venueType: vVenueType,
      address: vAddress.trim(),
      city: vCity.trim(),
      postalCode: vPostalCode.trim(),
      country: vCountry.trim(),
      capacity: vCapacity ? Number(vCapacity) : undefined,
      ceilingHeightMeters: vCeilingHeight ? Number(vCeilingHeight) : undefined,
      riggingCapacityKg: vRiggingCapacity ? Number(vRiggingCapacity) : undefined,
      dockType: vDockType,
      truckAccess: vTruckAccess,
      maxVehicleHeightMeters: vMaxVehicleHeight ? Number(vMaxVehicleHeight) : undefined,
      dockContactName: vDockContactName.trim(),
      dockContactPhone: vDockContactPhone.trim(),
      dockAccessHours: vDockAccessHours.trim(),
      elevatorDimensions: vElevatorDimensions.trim(),
      powerTotalKVA: vPowerTotalKVA ? Number(vPowerTotalKVA) : undefined,
      sockets32ATri: vSockets32ATri ? Number(vSockets32ATri) : undefined,
      sockets63ATri: vSockets63ATri ? Number(vSockets63ATri) : undefined,
      sockets125ATri: vSockets125ATri ? Number(vSockets125ATri) : undefined,
      hasPowerlock: vHasPowerlock,
      hasMarechal: vHasMarechal,
      sockets16AMono: vSockets16AMono ? Number(vSockets16AMono) : undefined,
      tgbtLocation: vTgbtLocation.trim(),
      technicalDirectorName: vTechnicalDirectorName.trim(),
      technicalDirectorPhone: vTechnicalDirectorPhone.trim(),
      technicalDirectorEmail: vTechnicalDirectorEmail.trim(),
      soundLimiterDBSPL: vSoundLimiterDBSPL ? Number(vSoundLimiterDBSPL) : undefined,
      soundLimiterNotes: vSoundLimiterNotes.trim(),
      hasDmxNetwork: vHasDmxNetwork,
      hasFiberNetwork: vHasFiberNetwork,
      notes: vNotes.trim(),
      accessPlansUrl: vAccessPlansUrl.trim(),
    };

    if (editingVenue) {
      await onUpdateVenue(editingVenue.id, payload);
    } else {
      await onAddVenue(payload);
    }
    setShowVenueModal(false);
  };

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesQuery =
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.billingAddress || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      clientTypeFilter === "all" || client.clientType === clientTypeFilter;

    return matchesQuery && matchesType;
  });

  // Filter venues
  const filteredVenues = venues.filter((venue) => {
    const matchesQuery =
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (venue.address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (venue.technicalDirectorName || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      venueTypeFilter === "all" || venue.venueType === venueTypeFilter;

    return matchesQuery && matchesType;
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesQuery =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.city || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      supplierTypeFilter === "all" || supplier.supplierType === supplierTypeFilter;

    return matchesQuery && matchesType;
  });

  const getClientTypeBadge = (type: ClientRecord["clientType"]) => {
    switch (type) {
      case "agence_event":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">Agence Événementielle</span>;
      case "production_event":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">Production Événement</span>;
      case "corporate":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">Entreprise / Corporate</span>;
      case "collectivite":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Collectivité / Mairie</span>;
      case "association":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">Association / Festival</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">Particulier</span>;
    }
  };

  const getVenueTypeBadge = (type: VenueRecord["venueType"]) => {
    switch (type) {
      case "palais_congres":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">Palais des Congrès</span>;
      case "salle_spectacle":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">Salle de Spectacle & Arena</span>;
      case "parc_expos":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">Parc des Expositions</span>;
      case "hotel_chateau":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">Hôtel & Château Réception</span>;
      case "studio_plateau":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">Studio & Plateau TV</span>;
      case "plein_air":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Site Plein Air / Festival</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">Salle Événementielle</span>;
    }
  };

  const getSupplierTypeBadge = (type: SupplierRecord["supplierType"]) => {
    switch (type) {
      case "confrere_sous_location":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">Confrère Sous-Location</span>;
      case "fabricant_materiel":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">Fabricant / Constructeur</span>;
      case "consommables":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">Consommables & Gaffer</span>;
      case "transport_fret":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Transport & Fret</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">Maintenance / SAV</span>;
    }
  };

  return (
    <div id="directory-dashboard" className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111422] p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Annuaire & Carnet d'Adresses
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                Standard Locasyst ERP
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Fiches centralisées : <strong>Clients & Agences</strong> (remises négociées, encours), <strong>Lieux & Salles</strong> (accès quai, puissance, régie salle), et <strong>Confrères</strong> (sous-location).
            </p>
          </div>
        </div>

        {/* 3 Main Locasyst Navigation Tabs & Create Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#161a2b] p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              id="tab-directory-clients"
              onClick={() => setActiveTab("clients")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "clients"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clients ({clients.length})</span>
            </button>

            <button
              type="button"
              id="tab-directory-venues"
              onClick={() => setActiveTab("venues")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "venues"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Lieux & Salles ({venues.length})</span>
            </button>

            <button
              type="button"
              id="tab-directory-suppliers"
              onClick={() => setActiveTab("suppliers")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "suppliers"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Confrères & Fournisseurs ({suppliers.length})</span>
            </button>
          </div>

          {activeTab === "clients" && (
            <button
              type="button"
              id="btn-create-client"
              onClick={() => handleOpenClientModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Client</span>
            </button>
          )}

          {activeTab === "venues" && (
            <button
              type="button"
              id="btn-create-venue"
              onClick={() => handleOpenVenueModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Fiche Lieu / Salle</span>
            </button>
          )}

          {activeTab === "suppliers" && (
            <button
              type="button"
              id="btn-create-supplier"
              onClick={() => handleOpenSupplierModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Confrère / Fournisseur</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111422] p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === "clients"
                ? "Rechercher par raison sociale, contact, ville..."
                : activeTab === "venues"
                ? "Rechercher par nom de salle, ville, régisseur..."
                : "Rechercher par confrère, contact, ville..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#161a2b] border border-slate-700/70 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {activeTab === "clients" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium">Type :</span>
            <select
              value={clientTypeFilter}
              onChange={(e) => setClientTypeFilter(e.target.value)}
              className="bg-[#161a2b] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tous les types ({clients.length})</option>
              <option value="agence_event">Agences Événementielles</option>
              <option value="production_event">Productions d'Événements</option>
              <option value="corporate">Entreprises / Corporate</option>
              <option value="collectivite">Collectivités & Mairies</option>
              <option value="association">Associations & Festivals</option>
              <option value="particulier">Particuliers</option>
            </select>
          </div>
        )}

        {activeTab === "venues" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium">Type de Salle :</span>
            <select
              value={venueTypeFilter}
              onChange={(e) => setVenueTypeFilter(e.target.value)}
              className="bg-[#161a2b] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tous les types de lieux ({venues.length})</option>
              <option value="palais_congres">Palais des Congrès</option>
              <option value="salle_spectacle">Salles de Spectacle / Arena</option>
              <option value="parc_expos">Parcs des Expositions</option>
              <option value="hotel_chateau">Hôtels & Châteaux</option>
              <option value="studio_plateau">Studios & Plateaux TV</option>
              <option value="plein_air">Sites Plein Air / Festivals</option>
              <option value="autre">Autres Espaces</option>
            </select>
          </div>
        )}

        {activeTab === "suppliers" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium">Catégorie :</span>
            <select
              value={supplierTypeFilter}
              onChange={(e) => setSupplierTypeFilter(e.target.value)}
              className="bg-[#161a2b] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Toutes les catégories ({suppliers.length})</option>
              <option value="confrere_sous_location">Confrères Sous-Location</option>
              <option value="fabricant_materiel">Fabricants & Distributeurs</option>
              <option value="consommables">Consommables & Gaffer</option>
              <option value="transport_fret">Transport & Fret</option>
              <option value="maintenance_sav">Maintenance & SAV</option>
            </select>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. CLIENTS & AGENCES TAB */}
      {/* ========================================================= */}
      {activeTab === "clients" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-[#111422] border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition">
                      {client.companyName}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{client.contactPerson}</span>
                    </p>
                  </div>
                  {getClientTypeBadge(client.clientType)}
                </div>

                {/* Coordonnées */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{client.email || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{client.phone} {client.mobile ? `(Mob: ${client.mobile})` : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{client.billingAddress}</span>
                  </div>
                </div>

                {/* Régie & Contact Site */}
                {client.onSiteContactName && (
                  <div className="p-2.5 rounded-xl bg-[#161a2b] border border-slate-800 text-[11px] text-slate-300">
                    <span className="text-[10px] text-amber-400 font-bold uppercase block">Contact Régie sur place :</span>
                    <div className="font-semibold text-white mt-0.5">{client.onSiteContactName} ({client.onSiteContactPhone || "Tél non renseigné"})</div>
                  </div>
                )}

                {/* Commercial specs */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-[#161a2b] border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Remise Négociée</span>
                    <span className="font-bold text-emerald-400">{client.defaultDiscountPercent || 0}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#161a2b] border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Plafond d'En-cours</span>
                    <span className="font-bold text-slate-200 truncate block">{client.creditLimit ? `${client.creditLimit.toLocaleString()} €` : "10 000 €"}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                {onDraftQuoteForClient && (
                  <button
                    type="button"
                    onClick={() => onDraftQuoteForClient(client)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition"
                    title="Créer un nouveau devis pour ce client"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Créer Devis</span>
                  </button>
                )}

                <div className="flex items-center gap-1 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenClientModal(client)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Modifier la fiche client"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Supprimer la fiche client "${client.companyName}" ?`)) {
                        onDeleteClient(client.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    title="Supprimer le client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="col-span-full p-12 text-center bg-[#111422] rounded-3xl border border-slate-800 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-sm text-slate-300">Aucun client trouvé</p>
              <p className="text-xs text-slate-500 mt-1">Créez votre première fiche client ou ajustez votre recherche.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LIEUX & SALLES DE RÉCEPTION (FICHES TECHNIQUES EVENT) */}
      {/* ========================================================= */}
      {activeTab === "venues" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVenues.map((venue) => (
            <div
              key={venue.id}
              className="bg-[#111422] border border-slate-800 rounded-3xl p-5 hover:border-amber-500/50 transition flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition">
                      {venue.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{venue.city} {venue.postalCode ? `(${venue.postalCode})` : ""}</span>
                    </p>
                  </div>
                  {getVenueTypeBadge(venue.venueType)}
                </div>

                {/* Logistics Badges (Quai & Truck Access) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-[#161a2b] border border-slate-800 flex flex-col justify-between">
                    <span className="text-slate-400 text-[10px] flex items-center gap-1">
                      <Truck className="w-3 h-3 text-amber-400" />
                      Accès Camion
                    </span>
                    <span className="font-bold text-white capitalize mt-0.5 truncate">
                      {venue.truckAccess?.replace(/_/g, " ") || "Porteur 19T"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#161a2b] border border-slate-800 flex flex-col justify-between">
                    <span className="text-slate-400 text-[10px] flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-400" />
                      Type de Quai
                    </span>
                    <span className="font-bold text-amber-300 capitalize mt-0.5 truncate">
                      {venue.dockType?.replace(/_/g, " ") || "Quai niveleur"}
                    </span>
                  </div>
                </div>

                {/* Electrical & Rigging Technical Specs */}
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <div className="p-2 rounded-xl bg-[#161a2b] border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Puissance</span>
                    <span className="font-black text-amber-400 text-xs">{venue.powerTotalKVA || 63} kVA</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#161a2b] border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Haut. Grill</span>
                    <span className="font-black text-cyan-400 text-xs">{venue.ceilingHeightMeters || 6} m</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#161a2b] border border-slate-800 text-center">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Rigging/Pt</span>
                    <span className="font-black text-emerald-400 text-xs">{venue.riggingCapacityKg || 250} kg</span>
                  </div>
                </div>

                {/* Power details / Sockets & TGBT */}
                <div className="p-2.5 rounded-xl bg-[#161a2b]/80 border border-slate-800/80 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Prises P17 & TGBT :</span>
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      {venue.sockets125ATri ? <span className="px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">125A ({venue.sockets125ATri})</span> : null}
                      {venue.sockets63ATri ? <span className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">63A ({venue.sockets63ATri})</span> : null}
                      {venue.sockets32ATri ? <span className="px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">32A ({venue.sockets32ATri})</span> : null}
                      {venue.hasPowerlock && <span className="px-1 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">Powerlock</span>}
                    </div>
                  </div>
                  {venue.tgbtLocation && (
                    <div className="text-[10px] text-slate-400 truncate">
                      <span className="text-slate-500">TGBT :</span> {venue.tgbtLocation}
                    </div>
                  )}
                </div>

                {/* Technical Director & Stage Contact */}
                {venue.technicalDirectorName ? (
                  <div className="p-2.5 rounded-xl bg-[#141829] border border-slate-800 text-[11px]">
                    <span className="text-[10px] text-amber-400 font-bold uppercase block">Régie Salle & DT :</span>
                    <div className="font-semibold text-white mt-0.5 flex items-center justify-between">
                      <span>{venue.technicalDirectorName}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{venue.technicalDirectorPhone || ""}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 italic px-1">
                    Contact régie salle non renseigné
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingVenueDetails(venue)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
                    title="Voir toute la fiche technique"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Détails</span>
                  </button>
                  {onDraftQuoteForVenue && (
                    <button
                      type="button"
                      onClick={() => onDraftQuoteForVenue(venue)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-semibold transition"
                      title="Créer une affaire / devis sur ce lieu"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Devis</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenVenueModal(venue)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Modifier la fiche lieu"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Supprimer la fiche salle "${venue.name}" ?`)) {
                        onDeleteVenue(venue.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    title="Supprimer la salle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredVenues.length === 0 && (
            <div className="col-span-full p-12 text-center bg-[#111422] rounded-3xl border border-slate-800 text-slate-400">
              <Building className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-sm text-slate-300">Aucun lieu ou salle de réception enregistré</p>
              <p className="text-xs text-slate-500 mt-1">Créez votre première fiche technique de salle (accès quai, puissance, contacts régie).</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CONFRÈRES & FOURNISSEURS TAB */}
      {/* ========================================================= */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-[#111422] border border-slate-800 rounded-3xl p-5 hover:border-cyan-500/50 transition flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition">
                      {supplier.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <Truck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{supplier.contactPerson}</span>
                    </p>
                  </div>
                  {getSupplierTypeBadge(supplier.supplierType)}
                </div>

                {/* Coordonnées */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{supplier.email || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{supplier.phone} {supplier.emergencyPhone ? `(Astreinte 24/7: ${supplier.emergencyPhone})` : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{supplier.address} {supplier.city ? `(${supplier.city})` : ""}</span>
                  </div>
                </div>

                {/* Enlèvement quai confrère */}
                {supplier.typicalPickupLocation && (
                  <div className="p-2.5 rounded-xl bg-[#161a2b] border border-slate-800 text-[11px] text-slate-300">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase block">Quai d'enlèvement sous-location :</span>
                    <div className="font-medium text-white mt-0.5">{supplier.typicalPickupLocation}</div>
                  </div>
                )}

                {/* Conditions sous-location */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-[#161a2b] border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Remise Confrère</span>
                    <span className="font-bold text-cyan-400">{supplier.discountRateOffered || 0}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#161a2b] border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Règlement</span>
                    <span className="font-bold text-slate-200 truncate block">{supplier.paymentTerms || "30j fin de mois"}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">ID: {supplier.id}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenSupplierModal(supplier)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Modifier la fiche fournisseur"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Supprimer le fournisseur "${supplier.name}" ?`)) {
                        onDeleteSupplier(supplier.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    title="Supprimer le fournisseur"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredSuppliers.length === 0 && (
            <div className="col-span-full p-12 text-center bg-[#111422] rounded-3xl border border-slate-800 text-slate-400">
              <Truck className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-sm text-slate-300">Aucun fournisseur ou confrère trouvé</p>
              <p className="text-xs text-slate-500 mt-1">Créez votre première fiche confrère sous-location ou fournisseur.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VENUE DETAIL MODAL (FICHE TECHNIQUE COMPLÈTE) */}
      {/* ========================================================= */}
      {viewingVenueDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111422] border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-scaleUp">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between text-white bg-[#0e111d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{viewingVenueDetails.name}</h3>
                    {getVenueTypeBadge(viewingVenueDetails.venueType)}
                  </div>
                  <p className="text-xs text-slate-400">{viewingVenueDetails.address}, {viewingVenueDetails.postalCode} {viewingVenueDetails.city}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingVenueDetails(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Section 1: Logistique & Accès Quai */}
              <div className="p-4 rounded-2xl bg-[#161a2b] border border-slate-800 space-y-3">
                <h4 className="font-bold text-amber-400 uppercase text-[11px] tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  1. Logistique, Déchargement & Accès Quai
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Accès Camion</span>
                    <span className="font-bold text-white capitalize">{viewingVenueDetails.truckAccess?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Type de Quai</span>
                    <span className="font-bold text-white capitalize">{viewingVenueDetails.dockType?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Hauteur Max Véhicule</span>
                    <span className="font-bold text-white">{viewingVenueDetails.maxVehicleHeightMeters ? `${viewingVenueDetails.maxVehicleHeightMeters} m` : "Illimitée"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Horaires Quai</span>
                    <span className="font-bold text-white">{viewingVenueDetails.dockAccessHours || "Non restreint"}</span>
                  </div>
                </div>
                {viewingVenueDetails.dockContactName && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    <strong className="text-white">Contact Responsable Quai :</strong> {viewingVenueDetails.dockContactName} ({viewingVenueDetails.dockContactPhone || "Tél non renseigné"})
                  </div>
                )}
                {viewingVenueDetails.elevatorDimensions && (
                  <div className="text-[11px] text-slate-400">
                    <strong className="text-white">Dimensions Monte-Charge :</strong> {viewingVenueDetails.elevatorDimensions}
                  </div>
                )}
              </div>

              {/* Section 2: Puissance Électrique & TGBT */}
              <div className="p-4 rounded-2xl bg-[#161a2b] border border-slate-800 space-y-3">
                <h4 className="font-bold text-cyan-400 uppercase text-[11px] tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  2. Bilan Électrique, Prises & TGBT
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Puissance Disponible</span>
                    <span className="font-black text-amber-400 text-sm">{viewingVenueDetails.powerTotalKVA || 63} kVA</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Prises 125A Tétra</span>
                    <span className="font-bold text-white">{viewingVenueDetails.sockets125ATri || 0} prise(s)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Prises 63A Tétra</span>
                    <span className="font-bold text-white">{viewingVenueDetails.sockets63ATri || 0} prise(s)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Prises 32A Tétra</span>
                    <span className="font-bold text-white">{viewingVenueDetails.sockets32ATri || 0} prise(s)</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Prises Spécifiques :</span>
                    <span className="font-medium text-white">
                      {viewingVenueDetails.hasPowerlock ? "✓ Powerlock 400A dispo" : "✗ Pas de Powerlock"} -{" "}
                      {viewingVenueDetails.hasMarechal ? "✓ Maréchal dispo" : "✗ Pas de Maréchal"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Emplacement Armoire / TGBT :</span>
                    <span className="font-medium text-amber-300">{viewingVenueDetails.tgbtLocation || "Coulisses"}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Rigging, Hauteur & Sonorisation */}
              <div className="p-4 rounded-2xl bg-[#161a2b] border border-slate-800 space-y-3">
                <h4 className="font-bold text-emerald-400 uppercase text-[11px] tracking-wider flex items-center gap-2">
                  <Anchor className="w-4 h-4" />
                  3. Structure, Accroches (Rigging) & Limiteur Sonore
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Hauteur sous Grill</span>
                    <span className="font-bold text-white">{viewingVenueDetails.ceilingHeightMeters || 6} m</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Charge Max / Point</span>
                    <span className="font-bold text-white">{viewingVenueDetails.riggingCapacityKg || 250} kg</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Limiteur Sonore</span>
                    <span className="font-bold text-rose-400">{viewingVenueDetails.soundLimiterDBSPL ? `${viewingVenueDetails.soundLimiterDBSPL} dB SPL` : "Aucun"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Capacité Public</span>
                    <span className="font-bold text-white">{viewingVenueDetails.capacity ? `${viewingVenueDetails.capacity} pers.` : "Non spécifié"}</span>
                  </div>
                </div>
                {viewingVenueDetails.soundLimiterNotes && (
                  <div className="text-[11px] text-amber-300/90 bg-amber-950/20 p-2.5 rounded-xl border border-amber-800/40">
                    <strong>Contrainte Sonore :</strong> {viewingVenueDetails.soundLimiterNotes}
                  </div>
                )}
              </div>

              {/* Section 4: Régie Salle & Contacts Techniques Résidents */}
              <div className="p-4 rounded-2xl bg-[#161a2b] border border-slate-800 space-y-3">
                <h4 className="font-bold text-purple-400 uppercase text-[11px] tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  4. Contact Régie Salle, SSI & Réseau
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Régisseur Général Lieu</span>
                    <span className="font-bold text-white">{viewingVenueDetails.technicalDirectorName || "Non renseigné"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Téléphone Régie</span>
                    <span className="font-bold text-white">{viewingVenueDetails.technicalDirectorPhone || "Non renseigné"}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111422] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Email Régie</span>
                    <span className="font-bold text-white truncate block">{viewingVenueDetails.technicalDirectorEmail || "Non renseigné"}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-4 pt-1">
                  <span>Réseau DMX résiduel : <strong className="text-white">{viewingVenueDetails.hasDmxNetwork ? "Oui" : "Non"}</strong></span>
                  <span>Lignes Fibre Optique : <strong className="text-white">{viewingVenueDetails.hasFiberNetwork ? "Oui" : "Non"}</strong></span>
                </div>
              </div>

              {viewingVenueDetails.notes && (
                <div className="p-4 rounded-2xl bg-[#111422] border border-slate-800 text-[11px] text-slate-300">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Notes & Consignes Particulières :</span>
                  <p className="whitespace-pre-line">{viewingVenueDetails.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0e111d] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setViewingVenueDetails(null);
                  handleOpenVenueModal(viewingVenueDetails);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Modifier cette fiche lieu</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingVenueDetails(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VENUE CREATE/EDIT MODAL */}
      {/* ========================================================= */}
      {showVenueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111422] border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between text-white bg-[#0e111d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingVenue ? "Modifier la Fiche Lieu & Salle" : "Créer une Fiche Technique de Salle (Locasyst)"}
                  </h3>
                  <p className="text-xs text-slate-400">Accès quai, puissance électrique, accroches & régie salle</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVenueModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVenue} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Informations Générales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Nom de la Salle / Site *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Palais des Congrès - Grand Amphithéâtre"
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Typologie du Lieu *</label>
                  <select
                    value={vVenueType}
                    onChange={(e) => setVVenueType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="palais_congres">Palais des Congrès</option>
                    <option value="salle_spectacle">Salle de Spectacle & Arena</option>
                    <option value="parc_expos">Parc des Expositions</option>
                    <option value="hotel_chateau">Hôtel & Château Réception</option>
                    <option value="studio_plateau">Studio & Plateau TV</option>
                    <option value="plein_air">Site Plein Air / Festival</option>
                    <option value="salle_fetes">Salle Polyvalente</option>
                    <option value="autre">Autre Espace Événementiel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-semibold mb-1 block">Adresse Complète</label>
                  <input
                    type="text"
                    placeholder="ex: 2 Place de la Porte Maillot"
                    value={vAddress}
                    onChange={(e) => setVAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Ville *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Paris"
                    value={vCity}
                    onChange={(e) => setVCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Logistique & Accès Quai */}
              <div className="p-3 rounded-2xl bg-[#0e111d] border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  Accès Quai, Déchargement & Gabarit Camion
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Gabarit Camion Max</label>
                    <select
                      value={vTruckAccess}
                      onChange={(e) => setVTruckAccess(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="semi_remorque_38t">Semi-Remorque 38T / 44T</option>
                      <option value="porteur_19t">Porteur 19T</option>
                      <option value="fourgon_20m3">Fourgon 20m3 avec Hayon</option>
                      <option value="vl_uniquement">VL / Utilitaire Uniquement</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Type de Quai</label>
                    <select
                      value={vDockType}
                      onChange={(e) => setVDockType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="quai_niveleur">Quai niveleur réglable</option>
                      <option value="plain_pied">Plain-pied (RDC)</option>
                      <option value="monte_charge">Monte-charge obligatoire</option>
                      <option value="acces_difficile">Accès difficile / escaliers</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Hauteur Sous Porche (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="ex: 4.2"
                      value={vMaxVehicleHeight || ""}
                      onChange={(e) => setVMaxVehicleHeight(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Responsable Quai / Contact direct</label>
                    <input
                      type="text"
                      placeholder="ex: Ahmed (Chef de Quai - 06 12 34 56 78)"
                      value={vDockContactName}
                      onChange={(e) => setVDockContactName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Horaires d'Accès Quai</label>
                    <input
                      type="text"
                      placeholder="ex: 06h00 - 23h00 (sur réservation)"
                      value={vDockAccessHours}
                      onChange={(e) => setVDockAccessHours(e.target.value)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Puissance Électrique & TGBT */}
              <div className="p-3 rounded-2xl bg-[#0e111d] border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Puissance Électrique Disponible & Prises P17
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Puissance (kVA)</label>
                    <input
                      type="number"
                      placeholder="ex: 125"
                      value={vPowerTotalKVA || ""}
                      onChange={(e) => setVPowerTotalKVA(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Nb Prises 125A</label>
                    <input
                      type="number"
                      value={vSockets125ATri || 0}
                      onChange={(e) => setVSockets125ATri(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Nb Prises 63A</label>
                    <input
                      type="number"
                      value={vSockets63ATri || 0}
                      onChange={(e) => setVSockets63ATri(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Nb Prises 32A</label>
                    <input
                      type="number"
                      value={vSockets32ATri || 0}
                      onChange={(e) => setVSockets32ATri(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Emplacement TGBT / Armoire</label>
                    <input
                      type="text"
                      placeholder="ex: Coulisse Cour / Fond de Scène"
                      value={vTgbtLocation}
                      onChange={(e) => setVTgbtLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={vHasPowerlock}
                        onChange={(e) => setVHasPowerlock(e.target.checked)}
                        className="rounded bg-[#161a2b] border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>Prises Powerlock 400A</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={vHasMarechal}
                        onChange={(e) => setVHasMarechal(e.target.checked)}
                        className="rounded bg-[#161a2b] border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>Prises Maréchal</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Hauteur, Accroches & Sonorisation */}
              <div className="p-3 rounded-2xl bg-[#0e111d] border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5" />
                  Hauteur sous Grill, Rigging & Limiteur Sonore
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Hauteur sous Grill (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="ex: 8.5"
                      value={vCeilingHeight || ""}
                      onChange={(e) => setVCeilingHeight(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Charge Max / Point (kg)</label>
                    <input
                      type="number"
                      placeholder="ex: 500"
                      value={vRiggingCapacity || ""}
                      onChange={(e) => setVRiggingCapacity(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Limiteur Sonore (dB SPL)</label>
                    <input
                      type="number"
                      placeholder="ex: 102"
                      value={vSoundLimiterDBSPL || ""}
                      onChange={(e) => setVSoundLimiterDBSPL(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Régie & Technique du Lieu */}
              <div className="p-3 rounded-2xl bg-[#0e111d] border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Régisseur Général du Lieu & Contacts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Nom du DT Résident</label>
                    <input
                      type="text"
                      placeholder="ex: Marc MOREAU (DT Lieu)"
                      value={vTechnicalDirectorName}
                      onChange={(e) => setVTechnicalDirectorName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Téléphone Régie</label>
                    <input
                      type="text"
                      placeholder="ex: 06 20 30 40 50"
                      value={vTechnicalDirectorPhone}
                      onChange={(e) => setVTechnicalDirectorPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Email Régie</label>
                    <input
                      type="email"
                      placeholder="ex: regie@palaisdescongres.fr"
                      value={vTechnicalDirectorEmail}
                      onChange={(e) => setVTechnicalDirectorEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Notes Techniques & Consignes Particulières</label>
                <textarea
                  rows={2}
                  placeholder="ex: Port des EPI obligatoire sur le quai. Réservation de la place camion 48h à l'avance."
                  value={vNotes}
                  onChange={(e) => setVNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVenueModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-lg shadow-amber-600/30"
                >
                  Enregistrer la Fiche Salle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CLIENT MODAL */}
      {/* ========================================================= */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111422] border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between text-white bg-[#0e111d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingClient ? "Modifier la Fiche Client" : "Créer une Fiche Client Professionnel"}
                  </h3>
                  <p className="text-xs text-slate-400">Locasyst Event & Location Matériel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Raison Sociale / Société *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: LIVE NATION EVENTS SAS"
                    value={cCompanyName}
                    onChange={(e) => setCCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Type de Client *</label>
                  <select
                    value={cClientType}
                    onChange={(e) => setCClientType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="agence_event">Agence Événementielle</option>
                    <option value="production_event">Production d'Événements</option>
                    <option value="corporate">Entreprise / Corporate</option>
                    <option value="collectivite">Collectivité & Mairie</option>
                    <option value="association">Association / Festival</option>
                    <option value="particulier">Particulier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Contact Commercial Principal</label>
                  <input
                    type="text"
                    placeholder="ex: Jean DUPONT (Directeur de Prod)"
                    value={cContactPerson}
                    onChange={(e) => setCContactPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Email Devis & Facturation</label>
                  <input
                    type="email"
                    placeholder="ex: prod@livenation.fr"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Téléphone Fixe</label>
                  <input
                    type="text"
                    placeholder="ex: 01 42 68 00 00"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Mobile Direct</label>
                  <input
                    type="text"
                    placeholder="ex: 06 12 34 56 78"
                    value={cMobile}
                    onChange={(e) => setCMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">N° SIRET</label>
                  <input
                    type="text"
                    placeholder="ex: 812 345 678 00012"
                    value={cSiret}
                    onChange={(e) => setCSiret(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">N° TVA Intracommunautaire</label>
                  <input
                    type="text"
                    placeholder="ex: FR 12 812345678"
                    value={cTvaIntra}
                    onChange={(e) => setCTvaIntra(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Adresse de Facturation (Siège)</label>
                <input
                  type="text"
                  placeholder="ex: 12 Rue de la Paix, 75002 Paris"
                  value={cBillingAddress}
                  onChange={(e) => setCBillingAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#0e111d] border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">
                  Contact Régie / Plateau (Sur l'événement)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Nom Régisseur / Contact direct</label>
                    <input
                      type="text"
                      placeholder="ex: Marc LEFEVRE (Régisseur Général)"
                      value={cOnSiteContactName}
                      onChange={(e) => setCOnSiteContactName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Téléphone mobile sur site</label>
                    <input
                      type="text"
                      placeholder="ex: 06 99 88 77 66"
                      value={cOnSiteContactPhone}
                      onChange={(e) => setCOnSiteContactPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Remise Négociée (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={cDefaultDiscountPercent}
                    onChange={(e) => setCDefaultDiscountPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Plafond d'En-cours (€)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10000"
                    value={cCreditLimit}
                    onChange={(e) => setCCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Conditions de Règlement</label>
                  <select
                    value={cPaymentTermsDays}
                    onChange={(e) => setCPaymentTermsDays(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Comptant à réception">Comptant à réception</option>
                    <option value="30 jours date de facture">30 jours date de facture</option>
                    <option value="30 jours fin de mois">30 jours fin de mois</option>
                    <option value="45 jours fin de mois">45 jours fin de mois</option>
                    <option value="Acompte 50% + Solde fin">Acompte 50% + Solde fin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Notes Internes & Consignes Particulières</label>
                <textarea
                  rows={2}
                  placeholder="ex: Demander systématiquement le bon de commande signé avant départ quai."
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  Enregistrer la Fiche Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUPPLIER MODAL */}
      {/* ========================================================= */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111422] border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between text-white bg-[#0e111d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingSupplier ? "Modifier la Fiche Confrère / Fournisseur" : "Créer une Fiche Confrère Sous-Location & Fournisseur"}
                  </h3>
                  <p className="text-xs text-slate-400">Locasyst Sous-location & Achats</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Raison Sociale Fournisseur / Confrère *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: NOVELTY PARIS"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Typologie *</label>
                  <select
                    value={sSupplierType}
                    onChange={(e) => setSSupplierType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="confrere_sous_location">Confrère Sous-Location (Sub-Rental)</option>
                    <option value="fabricant_materiel">Fabricant / Constructeur Matériel</option>
                    <option value="consommables">Consommables (Gaffer, Piles, Poudres)</option>
                    <option value="transport_fret">Transport & Fret Événementiel</option>
                    <option value="maintenance_sav">Atelier de Maintenance & SAV</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Contact Commercial / Planning</label>
                  <input
                    type="text"
                    placeholder="ex: Service Planning / Réservation"
                    value={sContactPerson}
                    onChange={(e) => setSContactPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Email de Commande</label>
                  <input
                    type="email"
                    placeholder="ex: planning@confrere.fr"
                    value={sEmail}
                    onChange={(e) => setSEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Téléphone Quai / Comptoir</label>
                  <input
                    type="text"
                    placeholder="ex: 01 49 35 35 35"
                    value={sPhone}
                    onChange={(e) => setSPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Astreinte Week-end (Urgences)</label>
                  <input
                    type="text"
                    placeholder="ex: 06 00 11 22 33"
                    value={sEmergencyPhone}
                    onChange={(e) => setSEmergencyPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Adresse du Quai d'Enlèvement</label>
                  <input
                    type="text"
                    placeholder="ex: 15 Rue de l'Industrie, 93200 Saint-Denis"
                    value={sAddress}
                    onChange={(e) => setSAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Horaires / Accès Quai</label>
                  <input
                    type="text"
                    placeholder="ex: Ouvert 07h-20h - Quai Poids Lourds"
                    value={sTypicalPickupLocation}
                    onChange={(e) => setSTypicalPickupLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Remise Confrère Accordée (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={sDiscountRateOffered}
                    onChange={(e) => setSDiscountRateOffered(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Conditions de Règlement Fournisseur</label>
                  <input
                    type="text"
                    value={sPaymentTerms}
                    onChange={(e) => setSPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Notes & Références</label>
                <textarea
                  rows={2}
                  placeholder="ex: Toujours préciser le nom du technicien qui vient charger au quai."
                  value={sNotes}
                  onChange={(e) => setSNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161a2b] border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-lg shadow-cyan-600/30"
                >
                  Enregistrer la Fiche Fournisseur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
