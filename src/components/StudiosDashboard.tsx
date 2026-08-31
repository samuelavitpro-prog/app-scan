import React, { useState } from "react";
import {
  Building2,
  Mic,
  Video,
  Radio,
  Plus,
  Calendar,
  Clock,
  Euro,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Users,
  Maximize2,
  Lock,
  ArrowRight,
  UserCheck,
  Tag,
  MapPin,
  Sparkles,
  Info,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Edit,
  Package
} from "lucide-react";
import { StudioSpace, StudioBooking, InventoryItem, TechnicianProfile } from "../types";

interface StudiosDashboardProps {
  studios?: StudioSpace[];
  inventoryItems?: InventoryItem[];
  technicians?: TechnicianProfile[];
  onAddStudio?: (studio: Partial<StudioSpace>) => Promise<boolean>;
  onUpdateStudio?: (id: string, updates: Partial<StudioSpace>) => Promise<boolean>;
  onDeleteStudio?: (id: string) => Promise<boolean>;
  onBookStudio?: (studioId: string, bookingData: any) => Promise<boolean>;
  onOpenQuoteWithStudio?: (studio: StudioSpace) => void;
}

export const StudiosDashboard: React.FC<StudiosDashboardProps> = ({
  studios = [],
  inventoryItems = [],
  technicians = [],
  onAddStudio = async (_studio: any) => false,
  onUpdateStudio = async (_id: string, _updates: any) => false,
  onDeleteStudio = async (_id: string) => false,
  onBookStudio = async (_studioId: string, _bookingData: any) => false,
  onOpenQuoteWithStudio,
}) => {
  const safeStudios = studios || [];
  const safeInventoryItems = inventoryItems || [];
  const safeTechnicians = technicians || [];
  const [selectedStudioForBooking, setSelectedStudioForBooking] = useState<StudioSpace | null>(null);
  const [showAddStudioModal, setShowAddStudioModal] = useState<boolean>(false);
  const [editingStudio, setEditingStudio] = useState<StudioSpace | null>(null);
  const [expandedStudioId, setExpandedStudioId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Booking Form State
  const [bookingClientName, setBookingClientName] = useState("");
  const [bookingClientContact, setBookingClientContact] = useState("");
  const [bookingStartDate, setBookingStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [bookingEndDate, setBookingEndDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [bookingRateType, setBookingRateType] = useState<"hourly" | "daily">("hourly");
  const [bookingUnitsCount, setBookingUnitsCount] = useState<number>(4);
  const [bookingSelectedTechs, setBookingSelectedTechs] = useState<string[]>([]);
  const [bookingNotes, setBookingNotes] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add/Edit Studio Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"podcast" | "video_set" | "audio_booth" | "live_stream" | "other">("podcast");
  const [formDescription, setFormDescription] = useState("");
  const [formHourlyRate, setFormHourlyRate] = useState(75);
  const [formDailyRate, setFormDailyRate] = useState(450);
  const [formCapacity, setFormCapacity] = useState(6);
  const [formSurface, setFormSurface] = useState(30);
  const [formLocation, setFormLocation] = useState("Bâtiment A - 1er Étage");
  const [formImageUrl, setFormImageUrl] = useState("https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800");
  const [formFixedEquipment, setFormFixedEquipment] = useState<
    Array<{ itemId: string; customName: string; requiredQuantity: number; isMandatory: boolean; notes: string }>
  >([]);

  const handleOpenBookingModal = (studio: StudioSpace) => {
    setSelectedStudioForBooking(studio);
    setBookingClientName("");
    setBookingClientContact("");
    setBookingRateType("hourly");
    setBookingUnitsCount(4);
    setBookingSelectedTechs([]);
    setBookingNotes("");
    setBookingFeedback(null);
  };

  const handleOpenCreateModal = () => {
    setEditingStudio(null);
    setFormName("");
    setFormType("podcast");
    setFormDescription("");
    setFormHourlyRate(75);
    setFormDailyRate(450);
    setFormCapacity(6);
    setFormSurface(30);
    setFormLocation("Bâtiment Principal");
    setFormImageUrl("https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800");
    setFormFixedEquipment([]);
    setShowAddStudioModal(true);
  };

  const handleOpenEditModal = (studio: StudioSpace) => {
    setEditingStudio(studio);
    setFormName(studio.name);
    setFormType(studio.type);
    setFormDescription(studio.description || "");
    setFormHourlyRate(studio.hourlyRate);
    setFormDailyRate(studio.dailyRate);
    setFormCapacity(studio.capacity);
    setFormSurface(studio.surfaceM2);
    setFormLocation(studio.location || "");
    setFormImageUrl(studio.imageUrl || "");
    setFormFixedEquipment(studio.fixedEquipment || []);
    setShowAddStudioModal(true);
  };

  const handleAddFixedGearRow = () => {
    const firstItem = safeInventoryItems[0];
    setFormFixedEquipment((prev) => [
      ...prev,
      {
        itemId: firstItem ? firstItem.id : "",
        customName: firstItem ? firstItem.name : "Nouvel équipement fixe",
        requiredQuantity: 1,
        isMandatory: true,
        notes: "",
      },
    ]);
  };

  const handleRemoveFixedGearRow = (index: number) => {
    setFormFixedEquipment((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveStudioForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload: Partial<StudioSpace> = {
      name: formName.trim(),
      type: formType,
      description: formDescription,
      hourlyRate: Number(formHourlyRate),
      dailyRate: Number(formDailyRate),
      capacity: Number(formCapacity),
      surfaceM2: Number(formSurface),
      location: formLocation,
      imageUrl: formImageUrl,
      fixedEquipment: formFixedEquipment,
    };

    if (editingStudio) {
      await onUpdateStudio(editingStudio.id, payload);
    } else {
      await onAddStudio(payload);
    }
    setShowAddStudioModal(false);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudioForBooking || !bookingClientName.trim()) return;

    setIsSubmittingBooking(true);
    setBookingFeedback(null);

    const assignedTechnicians = bookingSelectedTechs.map((techId) => {
      const tech = safeTechnicians.find((t) => t.id === techId);
      return {
        technicianId: techId,
        technicianName: tech ? tech.name : "Technicien",
        role: tech ? tech.primaryRole : "Technicien",
      };
    });

    const bookingPayload = {
      clientName: bookingClientName.trim(),
      clientContact: bookingClientContact.trim(),
      startDate: bookingStartDate,
      endDate: bookingEndDate,
      rateType: bookingRateType,
      unitsCount: Number(bookingUnitsCount),
      assignedTechnicians,
      notes: bookingNotes,
    };

    const success = await onBookStudio(selectedStudioForBooking.id, bookingPayload);
    setIsSubmittingBooking(false);

    if (success) {
      setBookingFeedback({
        type: "success",
        message: "Réservation confirmée avec succès ! Le créneau et le matériel fixe sont verrouillés.",
      });
      setTimeout(() => {
        setSelectedStudioForBooking(null);
      }, 1800);
    } else {
      setBookingFeedback({
        type: "error",
        message: "Erreur lors de la réservation du studio.",
      });
    }
  };

  const filteredStudios = safeStudios.filter((s) => {
    if (typeFilter === "all") return true;
    return s.type === typeFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "podcast":
        return <Mic className="w-5 h-5 text-indigo-400" />;
      case "video_set":
        return <Video className="w-5 h-5 text-emerald-400" />;
      case "audio_booth":
        return <Radio className="w-5 h-5 text-amber-400" />;
      default:
        return <Building2 className="w-5 h-5 text-purple-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "podcast":
        return "Studio Podcast & Live";
      case "video_set":
        return "Plateau Tournage Vidéo";
      case "audio_booth":
        return "Cabine Voix Off & Post-Prod";
      case "live_stream":
        return "Régie Live Streaming";
      default:
        return "Espace Technique";
    }
  };

  return (
    <div id="studios-dashboard" className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">Studios & Espaces en Location</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
              Matériel Bloqué & Contrôle Manquants
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Gérez vos espaces de captation (studios podcast, plateaux vidéo, cabines voix). Le matériel affecté à un espace est verrouillé en base et surveillé en temps réel pour détecter les manquants.
          </p>
        </div>

        <button
          id="btn-add-new-studio"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Ajouter un Espace / Studio
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setTypeFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            typeFilter === "all"
              ? "bg-slate-800 text-slate-100 border border-slate-700 shadow"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          Tous les espaces ({studios.length})
        </button>
        <button
          onClick={() => setTypeFilter("podcast")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            typeFilter === "podcast"
              ? "bg-indigo-950/60 text-indigo-300 border border-indigo-800"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-indigo-400" />
          Studios Podcast
        </button>
        <button
          onClick={() => setTypeFilter("video_set")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            typeFilter === "video_set"
              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <Video className="w-3.5 h-3.5 text-emerald-400" />
          Plateaux Vidéo
        </button>
        <button
          onClick={() => setTypeFilter("audio_booth")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            typeFilter === "audio_booth"
              ? "bg-amber-950/60 text-amber-300 border border-amber-800"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          Cabines Audio
        </button>
      </div>

      {/* Studios Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStudios.map((studio) => {
          const compliance = studio.complianceStatus || "ready";
          const missingReports = studio.missingEquipmentReport || [];
          const missingCount = missingReports.filter((r) => r.missingQuantity > 0).length;
          const isExpanded = expandedStudioId === studio.id;

          return (
            <div
              key={studio.id}
              id={`studio-card-${studio.id}`}
              className={`rounded-2xl border bg-slate-900/90 overflow-hidden shadow-xl transition-all flex flex-col ${
                compliance === "critical_missing"
                  ? "border-rose-500/40 shadow-rose-950/20"
                  : compliance === "partially_missing"
                  ? "border-amber-500/40 shadow-amber-950/20"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Card Image Banner & Status */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                <img
                  src={studio.imageUrl || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800"}
                  alt={studio.name}
                  className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                {/* Badges Top Left */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900/90 backdrop-blur-md text-slate-100 border border-slate-700">
                    {getTypeIcon(studio.type)}
                    {getTypeLabel(studio.type)}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700/80">
                    {studio.surfaceM2} m² • max {studio.capacity} pers.
                  </span>
                </div>

                {/* Compliance Badge Top Right */}
                <div className="absolute top-3 right-3">
                  {compliance === "critical_missing" ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-lg animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {missingCount} Matériel(s) Manquant(s)
                    </span>
                  ) : compliance === "partially_missing" ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-slate-950 shadow">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Manquants Optionnels ({missingCount})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Studio 100% Équipé
                    </span>
                  )}
                </div>

                {/* Studio Title on Banner */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-xl font-bold text-slate-100 drop-shadow-md">
                    {studio.name}
                  </h3>
                  <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    {studio.location || "Siège Principal"}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {studio.description || "Studio professionnel équipé avec régie et insonorisation."}
                </p>

                {/* Rates & Capacity Row */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-medium">Tarif Horaire</span>
                    <p className="text-base font-bold text-indigo-300">
                      {studio.hourlyRate} € <span className="text-xs text-slate-400 font-normal">HT/h</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-medium">Forfait Journée</span>
                    <p className="text-base font-bold text-emerald-400">
                      {studio.dailyRate} € <span className="text-xs text-slate-400 font-normal">HT/jour</span>
                    </p>
                  </div>
                </div>

                {/* Fixed Gear Summary Accordion Trigger */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
                  <button
                    id={`btn-toggle-fixed-gear-${studio.id}`}
                    onClick={() => setExpandedStudioId(isExpanded ? null : studio.id)}
                    className="w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      <span>
                        Matériel bloqué assigné ({studio.fixedEquipment?.length || 0} équipements)
                      </span>
                      {missingCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                          {missingCount} sorti(s)
                        </span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {/* Expanded Fixed Gear Breakdown */}
                  {isExpanded && (
                    <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/60">
                      {studio.fixedEquipment && studio.fixedEquipment.length > 0 ? (
                        studio.fixedEquipment.map((eq, idx) => {
                          const itemReport = missingReports.find((r) => r.itemId === eq.itemId);
                          const isMissing = itemReport ? itemReport.missingQuantity > 0 : false;
                          const activeRental = itemReport?.activeRentals?.[0];

                          return (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 ${
                                isMissing
                                  ? eq.isMandatory
                                    ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                                    : "bg-amber-950/30 border-amber-500/40 text-amber-200"
                                  : "bg-slate-900 border-slate-800 text-slate-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <Package className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{eq.customName || "Matériel"}</span>
                                  {eq.isMandatory && (
                                    <span className="text-[10px] px-1 py-0.2 bg-rose-500/20 text-rose-300 rounded font-semibold">
                                      Obligatoire
                                    </span>
                                  )}
                                </div>
                                <span className="font-bold">
                                  Qté: {eq.requiredQuantity}
                                </span>
                              </div>

                              {/* Rental Out Info Alert */}
                              {isMissing && (
                                <div className="mt-1 p-2 rounded bg-slate-900/90 border border-rose-500/30 text-[11px] text-slate-200 space-y-0.5">
                                  <div className="flex items-center gap-1 text-rose-400 font-semibold">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Actuellement sorti en location externe ({itemReport?.missingQuantity} manquant(s))</span>
                                  </div>
                                  {activeRental && (
                                    <div className="text-slate-400 text-[10px]">
                                      Client : <strong className="text-slate-200">{activeRental.clientName}</strong> • Retour prévu le :{" "}
                                      <strong className="text-amber-400 font-semibold">
                                        {new Date(activeRental.expectedReturnDate).toLocaleDateString("fr-FR")}
                                      </strong>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-500 italic text-center py-2">
                          Aucun matériel fixe configuré pour cet espace.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Active Bookings Mini-List */}
                {studio.bookings && studio.bookings.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-indigo-400" />
                      <span>
                        <strong className="text-indigo-300">{studio.bookings.length}</strong> réservation(s) planifiée(s)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Dernier: {studio.bookings[0].clientName}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    id={`btn-rent-studio-${studio.id}`}
                    onClick={() => handleOpenBookingModal(studio)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    Louer / Réserver ce studio
                  </button>

                  <button
                    id={`btn-edit-studio-${studio.id}`}
                    onClick={() => handleOpenEditModal(studio)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Modifier l'espace"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    id={`btn-delete-studio-${studio.id}`}
                    onClick={() => {
                      if (window.confirm(`Supprimer définitivement l'espace '${studio.name}' ?`)) {
                        onDeleteStudio(studio.id);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: STUDIO BOOKING & MISSING EQUIPMENT AUDIT ALERT       */}
      {/* ------------------------------------------------------------- */}
      {selectedStudioForBooking && (
        <div
          id="modal-studio-booking"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Location & Réservation : {selectedStudioForBooking.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Enregistrement de créneau avec vérification instantanée du matériel bloqué.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudioForBooking(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Missing Equipment Prominent Alert Window */}
            {selectedStudioForBooking.complianceStatus !== "ready" && (
              <div className="p-5 bg-rose-950/40 border-b border-rose-500/30 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-200">
                      Alerte Matériel Bloqué : Équipements actuellement manquants !
                    </h4>
                    <p className="text-xs text-rose-300/80 mt-0.5">
                      Des équipements indispensables affectés à cet espace sont actuellement sortis en location externe.
                    </p>
                  </div>
                </div>

                {/* List of missing items with return dates */}
                <div className="space-y-2 pt-1">
                  {selectedStudioForBooking.missingEquipmentReport
                    ?.filter((r) => r.missingQuantity > 0)
                    .map((item, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/40 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-100">{item.itemName}</p>
                          <p className="text-[11px] text-slate-400">
                            Manquant : <strong className="text-rose-400">{item.missingQuantity} unité(s)</strong>
                            {item.isMandatory && " • Requis obligatoire"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase block">Date de retour prévue</span>
                          <span className="font-bold text-amber-400">
                            {item.activeRentals?.[0]?.expectedReturnDate
                              ? new Date(item.activeRentals[0].expectedReturnDate).toLocaleDateString("fr-FR", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })
                              : "Non spécifiée"}
                          </span>
                          {item.activeRentals?.[0]?.clientName && (
                            <span className="text-[10px] text-slate-400 block">
                              Par : {item.activeRentals[0].clientName}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Booking Form Body */}
            <form onSubmit={handleSubmitBooking} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nom du Client / Production *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingClientName}
                    onChange={(e) => setBookingClientName(e.target.value)}
                    placeholder="Ex: Podcast Studio Digital"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Contact / Téléphone / Email
                  </label>
                  <input
                    type="text"
                    value={bookingClientContact}
                    onChange={(e) => setBookingClientContact(e.target.value)}
                    placeholder="Ex: contact@studiodigital.fr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dates & Package */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Formule de Facturation
                  </label>
                  <select
                    value={bookingRateType}
                    onChange={(e) => setBookingRateType(e.target.value as "hourly" | "daily")}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="hourly">À l'heure ({selectedStudioForBooking.hourlyRate} €/h)</option>
                    <option value="daily">À la journée ({selectedStudioForBooking.dailyRate} €/j)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {bookingRateType === "hourly" ? "Nombre d'heures" : "Nombre de jours"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bookingUnitsCount}
                    onChange={(e) => setBookingUnitsCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Date de la session
                  </label>
                  <input
                    type="date"
                    value={bookingStartDate}
                    onChange={(e) => setBookingStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Assign Technicians Option */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Assigner des Techniciens / Personnel (Optionnel)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {safeTechnicians.map((tech) => {
                    const isSelected = bookingSelectedTechs.includes(tech.id);
                    return (
                      <div
                        key={tech.id}
                        onClick={() => {
                          setBookingSelectedTechs((prev) =>
                            isSelected ? prev.filter((id) => id !== tech.id) : [...prev, tech.id]
                          );
                        }}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-950/80 border-indigo-500 text-indigo-200"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
                          <span className="font-semibold">{tech.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{tech.primaryRole}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Location Espace HT :</span>
                <span className="text-base font-bold text-emerald-400">
                  {(
                    (bookingRateType === "hourly"
                      ? selectedStudioForBooking.hourlyRate
                      : selectedStudioForBooking.dailyRate) * Number(bookingUnitsCount)
                  ).toLocaleString("fr-FR")}{" "}
                  € HT
                </span>
              </div>

              {bookingFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    bookingFeedback.type === "success"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {bookingFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{bookingFeedback.message}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudioForBooking(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  id="btn-confirm-studio-booking"
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  <CalendarCheck className="w-4 h-4" />
                  {isSubmittingBooking ? "Enregistrement..." : "Confirmer la Réservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: ADD / EDIT STUDIO CONFIGURATION                      */}
      {/* ------------------------------------------------------------- */}
      {showAddStudioModal && (
        <div
          id="modal-add-edit-studio"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    {editingStudio ? "Modifier le Studio / Espace" : "Créer un Nouvel Espace / Studio"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configurez les caractéristiques, tarifs et matériel bloqué affecté à ce lieu.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStudioModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveStudioForm} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nom du Studio / Plateau *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Studio Podcast 'Le Miroir'"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Type d'Espace
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="podcast">Studio Podcast & Stream</option>
                    <option value="video_set">Plateau Tournage Vidéo Cyclo</option>
                    <option value="audio_booth">Cabine Voix Off & Post-Production</option>
                    <option value="live_stream">Régie Live Stream</option>
                    <option value="other">Autre Espace Technique</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Description Technique
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Insonorisation, éclairage, caméras fixes..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Pricing & Surface */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Tarif Horaire HT (€)</label>
                  <input
                    type="number"
                    min="0"
                    value={formHourlyRate}
                    onChange={(e) => setFormHourlyRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Tarif Journée HT (€)</label>
                  <input
                    type="number"
                    min="0"
                    value={formDailyRate}
                    onChange={(e) => setFormDailyRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Surface (m²)</label>
                  <input
                    type="number"
                    min="1"
                    value={formSurface}
                    onChange={(e) => setFormSurface(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Capacité (pers.)</label>
                  <input
                    type="number"
                    min="1"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Fixed Equipment Block List Configurator */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Matériel Bloqué dans cet Espace
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Ce matériel ne peut être sorti sans générer d'alerte manquant pour ce studio.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFixedGearRow}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Ajouter un équipement
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formFixedEquipment.map((eq, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs"
                    >
                      {/* Select inventory item */}
                      <div className="flex-1">
                        <select
                          value={eq.itemId}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const matched = safeInventoryItems.find((i) => i.id === selectedId);
                            setFormFixedEquipment((prev) => {
                              const copy = [...prev];
                              copy[idx].itemId = selectedId;
                              if (matched) copy[idx].customName = matched.name;
                              return copy;
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                          {safeInventoryItems.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} ({inv.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Required Qty */}
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          value={eq.requiredQuantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormFixedEquipment((prev) => {
                              const copy = [...prev];
                              copy[idx].requiredQuantity = val;
                              return copy;
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-bold text-slate-100"
                        />
                      </div>

                      {/* Mandatory Toggle */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={eq.isMandatory}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setFormFixedEquipment((prev) => {
                              const copy = [...prev];
                              copy[idx].isMandatory = val;
                              return copy;
                            });
                          }}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px]">Obligatoire</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveFixedGearRow(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudioModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {editingStudio ? "Enregistrer les Modifications" : "Créer le Studio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
