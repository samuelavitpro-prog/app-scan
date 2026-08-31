import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Mic,
  Video,
  Sun,
  ShieldAlert,
  Sliders,
  Phone,
  Mail,
  Euro,
  Star,
  Tag,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Plus,
  X,
  Search,
  Filter,
  FilePlus,
  Briefcase
} from "lucide-react";
import { TechnicianProfile, TechnicianSpecialty } from "../types";

interface TechniciansDashboardProps {
  technicians?: TechnicianProfile[];
  onAddTechnician?: (tech: Partial<TechnicianProfile>) => Promise<boolean>;
  onUpdateTechnician?: (id: string, updates: Partial<TechnicianProfile>) => Promise<boolean>;
  onDeleteTechnician?: (id: string) => Promise<boolean>;
  onDraftQuoteWithTech?: (tech: TechnicianProfile) => void;
  onAddTechToQuote?: (tech: TechnicianProfile) => void;
  onRefresh?: () => void;
}

const ALL_SPECIALTIES: TechnicianSpecialty[] = [
  "Son",
  "Lumière",
  "Vidéo",
  "Régie",
  "Machinerie",
  "Cadre",
  "Chef de Plateau",
  "Streaming & Broadcast",
  "Montage Direct",
  "Autre",
];

export const TechniciansDashboard: React.FC<TechniciansDashboardProps> = ({
  technicians = [],
  onAddTechnician = async (_tech: any) => false,
  onUpdateTechnician = async (_id: string, _updates: any) => false,
  onDeleteTechnician = async (_id: string) => false,
  onDraftQuoteWithTech,
  onAddTechToQuote,
}) => {
  const safeTechnicians = technicians || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTech, setEditingTech] = useState<TechnicianProfile | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPrimaryRole, setFormPrimaryRole] = useState("Régisseur Général");
  const [formSpecialties, setFormSpecialties] = useState<TechnicianSpecialty[]>(["Régie", "Son"]);
  const [formContractType, setFormContractType] = useState<TechnicianProfile["contractType"]>("intermittent");
  const [formHabilitationsText, setFormHabilitationsText] = useState("CACES Nacelle R486, Habilitation Électrique BR, Accroche & Levage");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDailyRate, setFormDailyRate] = useState(450);
  const [formHourlyRate, setFormHourlyRate] = useState(55);
  const [formOvertimeRate, setFormOvertimeRate] = useState(75);
  const [formPerDiem, setFormPerDiem] = useState(25);
  const [formBio, setFormBio] = useState("");
  const [formSkillsText, setFormSkillsText] = useState("GrandMA3, Dante Audio, Yamaha QL5, Shure Axient, Rigging");
  const [formWarehouse, setFormWarehouse] = useState("Dépôt Principal");
  const [formStatus, setFormStatus] = useState<"available" | "busy" | "on_leave">("available");

  const handleOpenCreateModal = () => {
    setEditingTech(null);
    setFormName("");
    setFormPrimaryRole("Régisseur Général / Chef de Projet Event");
    setFormSpecialties(["Régie", "Son"]);
    setFormContractType("intermittent");
    setFormHabilitationsText("CACES Nacelle R486, Habilitation Électrique BR, Travail en Hauteur");
    setFormEmail("");
    setFormPhone("");
    setFormDailyRate(450);
    setFormHourlyRate(55);
    setFormOvertimeRate(75);
    setFormPerDiem(25);
    setFormBio("Expérimenté en direction technique d'événements, régie générale et coordination plateau.");
    setFormSkillsText("GrandMA3, Dante Audio, Yamaha QL5, Shure Axient, Accroche & Rigging");
    setFormWarehouse("Dépôt Principal");
    setFormStatus("available");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (tech: TechnicianProfile) => {
    setEditingTech(tech);
    setFormName(tech.name);
    setFormPrimaryRole(tech.primaryRole);
    setFormSpecialties(tech.specialties);
    setFormContractType(tech.contractType || "intermittent");
    setFormHabilitationsText((tech.habilitations || []).join(", "));
    setFormEmail(tech.email || "");
    setFormPhone(tech.phone || "");
    setFormDailyRate(tech.dailyRate);
    setFormHourlyRate(tech.hourlyRate);
    setFormOvertimeRate(tech.overtimeHourlyRate || Math.round(tech.hourlyRate * 1.35));
    setFormPerDiem(tech.mealAllowancePerDiem || 25);
    setFormBio(tech.bio || "");
    setFormSkillsText((tech.skills || []).join(", "));
    setFormWarehouse(tech.assignedWarehouse || "Dépôt Principal");
    setFormStatus(tech.status);
    setShowAddModal(true);
  };

  const toggleSpecialty = (spec: TechnicianSpecialty) => {
    setFormSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSaveTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const skills = formSkillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const habilitations = formHabilitationsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Partial<TechnicianProfile> = {
      name: formName.trim(),
      primaryRole: formPrimaryRole.trim(),
      specialties: formSpecialties.length > 0 ? formSpecialties : ["Régie"],
      contractType: formContractType,
      habilitations,
      email: formEmail.trim(),
      phone: formPhone.trim(),
      dailyRate: Number(formDailyRate),
      hourlyRate: Number(formHourlyRate),
      overtimeHourlyRate: Number(formOvertimeRate),
      mealAllowancePerDiem: Number(formPerDiem),
      bio: formBio.trim(),
      skills,
      assignedWarehouse: formWarehouse,
      status: formStatus,
      avatar: editingTech?.avatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 90000000)}?w=200`,
    };

    if (editingTech) {
      await onUpdateTechnician(editingTech.id, payload);
    } else {
      await onAddTechnician(payload);
    }
    setShowAddModal(false);
  };

  const filteredTechs = safeTechnicians.filter((tech) => {
    const matchesQuery =
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.primaryRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tech.skills && tech.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesSpecialty =
      specialtyFilter === "all" || tech.specialties.includes(specialtyFilter as any);

    return matchesQuery && matchesSpecialty;
  });

  const getRoleIcon = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes("son") || lower.includes("audio")) return <Mic className="w-4 h-4 text-indigo-400" />;
    if (lower.includes("vidéo") || lower.includes("cadre")) return <Video className="w-4 h-4 text-emerald-400" />;
    if (lower.includes("lumière") || lower.includes("éclairage")) return <Sun className="w-4 h-4 text-amber-400" />;
    if (lower.includes("régie") || lower.includes("plateau")) return <Sliders className="w-4 h-4 text-purple-400" />;
    return <Users className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div id="technicians-dashboard" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100">Personnel & Techniciens</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
              Régie • Son • Lumière • Vidéo
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Répertoire des techniciens qualifiés (ingénieurs son, cadreurs, régisseurs, éclairagistes). Ajoutez-les directement à vos devis clients ou assignez-les aux locations de studios.
          </p>
        </div>

        <button
          id="btn-add-technician"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          Créer Fiche Technicien
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par nom, rôle, compétence (ex: Dante, OBS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Specialty Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSpecialtyFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              specialtyFilter === "all"
                ? "bg-slate-800 text-slate-100 border border-slate-700"
                : "text-slate-400 hover:bg-slate-900"
            }`}
          >
            Tous ({technicians.length})
          </button>
          {["Son", "Vidéo", "Lumière", "Régie", "Streaming & Broadcast"].map((spec) => (
            <button
              key={spec}
              onClick={() => setSpecialtyFilter(spec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                specialtyFilter === spec
                  ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                  : "text-slate-400 hover:bg-slate-900"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTechs.map((tech) => {
          return (
            <div
              key={tech.id}
              id={`tech-card-${tech.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Header with Avatar, Role & Status */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={tech.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
                      alt={tech.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md"
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                        {tech.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                        {getRoleIcon(tech.primaryRole)}
                        <span>{tech.primaryRole}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      tech.status === "available"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : tech.status === "busy"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tech.status === "available" ? "Disponible" : tech.status === "busy" ? "En prestation" : "En congé"}
                  </span>
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                  {tech.bio || "Technicien audiovisuel certifié disponible pour tournage, studio et régie."}
                </p>

                {/* Specialties Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {tech.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-slate-950 text-slate-300 border border-slate-800 font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Skills Pills */}
                {tech.skills && tech.skills.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1">
                    {tech.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-950/40 text-indigo-300 border border-indigo-900/40"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing and Footer Actions */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                {/* Rates Row */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">TJM (Journée HT)</span>
                    <strong className="text-sm font-bold text-emerald-400">
                      {tech.dailyRate} € <span className="text-[10px] text-slate-500 font-normal">/j</span>
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Taux Horaire HT</span>
                    <strong className="text-sm font-bold text-indigo-300">
                      {tech.hourlyRate} € <span className="text-[10px] text-slate-500 font-normal">/h</span>
                    </strong>
                  </div>
                </div>

                {/* Contact quick info */}
                {(tech.phone || tech.email) && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    {tech.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {tech.phone}
                      </span>
                    )}
                    {tech.email && (
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {tech.email}
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {(onAddTechToQuote || onDraftQuoteWithTech) && (
                    <button
                      id={`btn-add-tech-to-quote-${tech.id}`}
                      onClick={() => {
                        if (onAddTechToQuote) onAddTechToQuote(tech);
                        else if (onDraftQuoteWithTech) onDraftQuoteWithTech(tech);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      Ajouter au devis
                    </button>
                  )}

                  <button
                    id={`btn-edit-tech-${tech.id}`}
                    onClick={() => handleOpenEditModal(tech)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Modifier la fiche"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`btn-delete-tech-${tech.id}`}
                    onClick={() => {
                      if (window.confirm(`Supprimer la fiche de ${tech.name} ?`)) {
                        onDeleteTechnician(tech.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT TECHNICIAN PROFILE                       */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <div
          id="modal-technician-form"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    {editingTech ? "Modifier la Fiche Technicien" : "Créer une Fiche Technicien"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Renseignez les compétences, tarifs et coordonnées du membre d'équipe.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveTechnician} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nom & Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Julien Rivoire"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Rôle Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPrimaryRole}
                    onChange={(e) => setFormPrimaryRole(e.target.value)}
                    placeholder="Ex: Ingénieur du Son / Régisseur"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Specialties Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Spécialités Techniques
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SPECIALTIES.map((spec) => {
                    const isSelected = formSpecialties.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialty(spec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white font-semibold shadow"
                            : "bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contract Type & Habilitations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Statut / Type de Contrat
                  </label>
                  <select
                    value={formContractType}
                    onChange={(e) => setFormContractType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="intermittent">Intermittent du Spectacle (GUSO / Congés Sp.)</option>
                    <option value="freelance">Auto-entrepreneur / Facturation HT</option>
                    <option value="permanent_employee">Salarié Permanent (CDI / CDD)</option>
                    <option value="subcontractor">Prestataire Externe / Agence Intérim</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Habilitations & Certificats (séparés par virgules)
                  </label>
                  <input
                    type="text"
                    value={formHabilitationsText}
                    onChange={(e) => setFormHabilitationsText(e.target.value)}
                    placeholder="Ex: CACES R486, Habilitation BR, Rigging"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    TJM (Journée HT €) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formDailyRate}
                    onChange={(e) => setFormDailyRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Taux Horaire (€) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formHourlyRate}
                    onChange={(e) => setFormHourlyRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-indigo-300 font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Heures Sup (€/h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formOvertimeRate}
                    onChange={(e) => setFormOvertimeRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Per Diem (€/repas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formPerDiem}
                    onChange={(e) => setFormPerDiem(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Disponibilité Actuelle
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="available">Disponible</option>
                  <option value="busy">En prestation</option>
                  <option value="on_leave">En congé</option>
                </select>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="technicien@stockvision.fr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Skills list comma separated */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Logiciels & Compétences Clés (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={formSkillsText}
                  onChange={(e) => setFormSkillsText(e.target.value)}
                  placeholder="Ex: Pro Tools, OBS Studio, Sony FX3, Dante, GrandMA"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Présentation / Expérience
                </label>
                <textarea
                  rows={2}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Parcours, types d'émissions ou plateaux maîtrisés..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {editingTech ? "Enregistrer" : "Créer le Profil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
