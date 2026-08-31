import { AudiovisualChapter, InventoryItem, RentalPriceCoefficients } from "../types";

// Grille standard des coefficients de location audiovisuelle (Barème Locasyst / Manatís)
export const DEFAULT_RENTAL_COEFFICIENTS: RentalPriceCoefficients = {
  day1: 1.0,
  days2: 1.5,
  days3: 2.0,
  days4: 2.5,
  weekend: 1.2,
  week: 3.0,
  twoWeeks: 5.0,
  threeWeeks: 7.0,
  month: 8.0,
};

// Liste des confrères / loueurs partenaires récurrents pour la sous-location (Sub-Rental Événement & Audiovisuel)
export const SUB_RENTAL_SUPPLIERS = [
  { id: "novelty", name: "Novelty Paris / Régions", contact: "planning@novelty-group.com - 01 49 35 35 35" },
  { id: "dushow", name: "Dushow / B-Live (Live & Événement)", contact: "booking@dushow.com - 01 41 83 50 00" },
  { id: "eurogroup", name: "Eurogroup Audio / Vidéo", contact: "contact@eurogroup.fr - 01 48 13 00 00" },
  { id: "impact", name: "Impact Événement", contact: "contact@impact-evenement.com - 01 69 74 12 12" },
  { id: "prg", name: "PRG France (Production Resource Group)", contact: "france@prg.com - 01 49 35 49 35" },
  { id: "rvz", name: "RVZ Audiovisuel", contact: "planning@rvz.fr - 01 48 40 40 40" },
  { id: "photocinerent", name: "PhotoCineRent Paris", contact: "loc@photocinerent.com - 01 40 38 00 00" },
  { id: "autre", name: "Autre Loueur Confrère Partenaire", contact: "comptoir@confrere-loc.fr" },
];

// Configuration et métadonnées des Chapitres Métiers Audiovisuels & Événementiels (Locasyst)
export interface ChapterDefinition {
  id: AudiovisualChapter;
  label: string;
  shortLabel: string;
  iconName: string;
  colorClass: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
  order: number;
}

export const AUDIOVISUAL_CHAPTERS: Record<AudiovisualChapter, ChapterDefinition> = {
  videoprojection: {
    id: "videoprojection",
    label: "VIDEOPROJECTION & MURS LED",
    shortLabel: "Murs LED & Vidéo",
    iconName: "Tv",
    colorClass: "text-blue-400 bg-blue-950/40 border-blue-800",
    badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    borderColor: "border-blue-700/50",
    textColor: "text-blue-400",
    order: 1,
  },
  reprise_camera: {
    id: "reprise_camera",
    label: "REPRISE CAMERA & PLATEAU",
    shortLabel: "Reprise Caméra",
    iconName: "Camera",
    colorClass: "text-rose-400 bg-rose-950/40 border-rose-800",
    badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    borderColor: "border-rose-700/50",
    textColor: "text-rose-400",
    order: 2,
  },
  eclairage_scene: {
    id: "eclairage_scene",
    label: "ECLAIRAGE FACE SCENE & EFFETS",
    shortLabel: "Éclairage Scène",
    iconName: "Sun",
    colorClass: "text-amber-400 bg-amber-950/40 border-amber-800",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    borderColor: "border-amber-700/50",
    textColor: "text-amber-400",
    order: 3,
  },
  sound_hf: {
    id: "sound_hf",
    label: "SONORISATION, FAÇADE & RETOURS",
    shortLabel: "Sonorisation",
    iconName: "Mic",
    colorClass: "text-purple-400 bg-purple-950/40 border-purple-800",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    borderColor: "border-purple-700/50",
    textColor: "text-purple-400",
    order: 4,
  },
  structure_levage: {
    id: "structure_levage",
    label: "STRUCTURE, PONT & SCÈNE",
    shortLabel: "Structure & Levage",
    iconName: "Layers",
    colorClass: "text-emerald-400 bg-emerald-950/40 border-emerald-800",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    borderColor: "border-emerald-700/50",
    textColor: "text-emerald-400",
    order: 5,
  },
  distribution_electrique: {
    id: "distribution_electrique",
    label: "DISTRIBUTION ELECTRIQUE",
    shortLabel: "Distri Élec",
    iconName: "Zap",
    colorClass: "text-yellow-400 bg-yellow-950/40 border-yellow-800",
    badgeBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    borderColor: "border-yellow-700/50",
    textColor: "text-yellow-400",
    order: 6,
  },
  cablage: {
    id: "cablage",
    label: "CABLAGE & LIAISONS",
    shortLabel: "Câblage",
    iconName: "Layers",
    colorClass: "text-cyan-400 bg-cyan-950/40 border-cyan-800",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    borderColor: "border-cyan-700/50",
    textColor: "text-cyan-400",
    order: 7,
  },
  camera_optics: {
    id: "camera_optics",
    label: "PRISE DE VUE & CAMÉRAS",
    shortLabel: "Caméras",
    iconName: "Camera",
    colorClass: "text-rose-400 bg-rose-950/40 border-rose-800",
    badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    borderColor: "border-rose-700/50",
    textColor: "text-rose-400",
    order: 8,
  },
  lenses_filters: {
    id: "lenses_filters",
    label: "OPTIQUES & FILTRES",
    shortLabel: "Optiques",
    iconName: "CircleDot",
    colorClass: "text-sky-400 bg-sky-950/40 border-sky-800",
    badgeBg: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    borderColor: "border-sky-700/50",
    textColor: "text-sky-400",
    order: 9,
  },
  lighting_grip: {
    id: "lighting_grip",
    label: "ÉCLAIRAGE D'AMBIANCE & PROJECTEURS",
    shortLabel: "Lumière",
    iconName: "Sun",
    colorClass: "text-amber-400 bg-amber-950/40 border-amber-800",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    borderColor: "border-amber-700/50",
    textColor: "text-amber-400",
    order: 10,
  },
  machinery_grip: {
    id: "machinery_grip",
    label: "MACHINERIE, PIEDS & SUPPORTS",
    shortLabel: "Supports & Pieds",
    iconName: "Move",
    colorClass: "text-emerald-400 bg-emerald-950/40 border-emerald-800",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    borderColor: "border-emerald-700/50",
    textColor: "text-emerald-400",
    order: 11,
  },
  power_energy: {
    id: "power_energy",
    label: "RÉGIE, ÉNERGIE & GROUPES",
    shortLabel: "Régie & Groupes",
    iconName: "Zap",
    colorClass: "text-cyan-400 bg-cyan-950/40 border-cyan-800",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    borderColor: "border-cyan-700/50",
    textColor: "text-cyan-400",
    order: 12,
  },
  consumables_sales: {
    id: "consumables_sales",
    label: "CONSOMMABLES (VENTE FERME)",
    shortLabel: "Consommables",
    iconName: "Package",
    colorClass: "text-slate-400 bg-slate-900 border-slate-700",
    badgeBg: "bg-slate-800 text-slate-300 border-slate-700",
    borderColor: "border-slate-700",
    textColor: "text-slate-300",
    order: 13,
  },
  studios_spaces: {
    id: "studios_spaces",
    label: "ESPACES & LIEUX D'ÉVÉNEMENTS",
    shortLabel: "Espaces",
    iconName: "Building2",
    colorClass: "text-indigo-400 bg-indigo-950/40 border-indigo-800",
    badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    borderColor: "border-indigo-700/50",
    textColor: "text-indigo-400",
    order: 14,
  },
  crew_technicians: {
    id: "crew_technicians",
    label: "PERSONNEL TECHNIQUE",
    shortLabel: "Personnel",
    iconName: "Users",
    colorClass: "text-orange-400 bg-orange-950/40 border-orange-800",
    badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    borderColor: "border-orange-700/50",
    textColor: "text-orange-400",
    order: 15,
  },
  transport_logistics: {
    id: "transport_logistics",
    label: "TRANSPORT & LOGISTIQUE",
    shortLabel: "Transport",
    iconName: "Truck",
    colorClass: "text-zinc-400 bg-zinc-900 border-zinc-700",
    badgeBg: "bg-zinc-800 text-zinc-300 border-zinc-700",
    borderColor: "border-zinc-700",
    textColor: "text-zinc-300",
    order: 16,
  },
  logistics_fees: {
    id: "logistics_fees",
    label: "FRAIS ANNEXES & ASSURANCE",
    shortLabel: "Frais & Assurance",
    iconName: "Truck",
    colorClass: "text-zinc-400 bg-zinc-900 border-zinc-700",
    badgeBg: "bg-zinc-800 text-zinc-300 border-zinc-700",
    borderColor: "border-zinc-700",
    textColor: "text-zinc-300",
    order: 17,
  },
};

// Devine automatiquement le chapitre métier à partir de la catégorie ou du nom d'un article
export function inferAudiovisualChapter(category?: string, name?: string): AudiovisualChapter {
  const text = `${category || ""} ${name || ""}`.toLowerCase();
  
  if (text.includes("led") || text.includes("mur") || text.includes("tile") || text.includes("novastar") || text.includes("videoproj") || text.includes("vidéo-proj") || text.includes("vmix") || text.includes("ascender") || text.includes("écran") || text.includes("lcd")) {
    return "videoprojection";
  }
  if (text.includes("tourelle") || text.includes("plateau") || text.includes("commande aw") || text.includes("panasonic ak") || text.includes("reprise cam")) {
    return "reprise_camera";
  }
  if (text.includes("découpe") || text.includes("lyre") || text.includes("ovation") || text.includes("chauvet") || text.includes("face")) {
    return "eclairage_scene";
  }
  if (text.includes("pc16") || text.includes("passage de câble") || text.includes("distribution") || text.includes("armoire élec") || text.includes("capa")) {
    return "distribution_electrique";
  }
  if (text.includes("hdmi") || text.includes("fibre") || text.includes("ethernet") || text.includes("rj45") || text.includes("touret") || text.includes("cablage") || text.includes("câble") || text.includes("neutrik")) {
    return "cablage";
  }
  if (text.includes("opérateur") || text.includes("technicien") || text.includes("assistant") || text.includes("personnel") || text.includes("forfait frais")) {
    return "crew_technicians";
  }
  if (text.includes("livraison") || text.includes("reprise") || text.includes("transport") || text.includes("50m3") || text.includes("camion")) {
    return "transport_logistics";
  }
  if (text.includes("optique") || text.includes("objectif") || text.includes("lens") || text.includes("zoom") || text.includes("prime") || text.includes("filtre")) {
    return "lenses_filters";
  }
  if (text.includes("caméra") || text.includes("camera") || text.includes("arri") || text.includes("red") || text.includes("fx6") || text.includes("fx9") || text.includes("c70") || text.includes("ursa") || text.includes("corps") || text.includes("boitier")) {
    return "camera_optics";
  }
  if (text.includes("lumière") || text.includes("projecteur") || text.includes("aputure") || text.includes("nanlite") || text.includes("skypanel") || text.includes("spot") || text.includes("hmi") || text.includes("softbox")) {
    return "lighting_grip";
  }
  if (text.includes("pied") || text.includes("machinerie") || text.includes("trépied") || text.includes("tripod") || text.includes("ronin") || text.includes("gimbal") || text.includes("grue") || text.includes("dolly") || text.includes("slider") || text.includes("c-stand")) {
    return "machinery_grip";
  }
  if (text.includes("micro") || text.includes("son") || text.includes("audio") || text.includes("hf") || text.includes("sennheiser") || text.includes("rode") || text.includes("sound devices") || text.includes("mixette") || text.includes("casque")) {
    return "sound_hf";
  }
  if (text.includes("gaffer") || text.includes("pile") || text.includes("gélatine") || text.includes("scotch") || text.includes("spray") || text.includes("bombe") || text.includes("consommable")) {
    return "consumables_sales";
  }
  if (text.includes("batterie") || text.includes("v-mount") || text.includes("générateur") || text.includes("secteur") || text.includes("régie") || text.includes("talkie") || text.includes("véhicule")) {
    return "power_energy";
  }

  return "videoprojection";
}

// Calcule le coefficient de durée standard en fonction du nombre de jours de tournage ou d'enlèvement
export function computeAudiovisualCoefficient(
  daysCount: number,
  isWeekend: boolean = false,
  customCoeffs: RentalPriceCoefficients = DEFAULT_RENTAL_COEFFICIENTS
): number {
  if (isWeekend) return customCoeffs.weekend;
  if (daysCount <= 1) return customCoeffs.day1;
  if (daysCount === 2) return customCoeffs.days2;
  if (daysCount === 3) return customCoeffs.days3;
  if (daysCount === 4) return customCoeffs.days4;
  if (daysCount >= 5 && daysCount <= 7) return customCoeffs.week;
  if (daysCount > 7 && daysCount <= 14) return customCoeffs.twoWeeks;
  if (daysCount > 14 && daysCount <= 21) return customCoeffs.threeWeeks;
  if (daysCount > 21) return customCoeffs.month;
  return daysCount;
}

// Calcul de la marge nette sous-location
export function computeSubRentalMargin(
  clientPriceHT: number,
  supplierCostHT: number
): { marginHT: number; marginPercent: number } {
  const marginHT = Math.round((clientPriceHT - (supplierCostHT || 0)) * 100) / 100;
  const marginPercent =
    clientPriceHT > 0
      ? Math.round((marginHT / clientPriceHT) * 1000) / 10
      : 0;
  return { marginHT, marginPercent };
}
