import { MainAppNavTab } from "../types";

export type WorkspaceProfileId = "production" | "cinema" | "wedding";

export interface WorkspaceProfile {
  id: WorkspaceProfileId;
  label: string;
  shortLabel: string;
  description: string;
  theme: {
    accent: string;
    accentSoft: string;
    surface: string;
  };
  copy: {
    dashboardEyebrow: string;
    dashboardTitle: string;
    dashboardDescription: string;
    activeEntity: string;
    quotesTitle: string;
    quotesDescription: string;
    itemLabel: string;
  };
  quoteTemplate: "production" | "cinema" | "wedding";
  visibleTabs: MainAppNavTab[];
}

const commonTabs: MainAppNavTab[] = [
  "dashboard",
  "quotes",
  "directory",
  "invoices",
  "rentals",
  "inventory",
  "calendar",
  "displays",
  "logs",
  "settings",
];

export const WORKSPACE_PROFILES: Record<WorkspaceProfileId, WorkspaceProfile> = {
  production: {
    id: "production",
    label: "Production événementielle",
    shortLabel: "Production",
    description: "Location, régie, livraison et logistique événementielle.",
    theme: {
      accent: "indigo",
      accentSoft: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
      surface: "bg-[#121a31]",
    },
    copy: {
      dashboardEyebrow: "PRODUCTION ÉVÉNEMENTIELLE",
      dashboardTitle: "Pilotage de production",
      dashboardDescription: "Affaires, moyens techniques et logistique terrain.",
      activeEntity: "Événement actif",
      quotesTitle: "Affaires & devis",
      quotesDescription: "Chiffrage, validation et suivi des dossiers événementiels.",
      itemLabel: "Parc technique",
    },
    quoteTemplate: "production",
    visibleTabs: [...commonTabs, "flightcases", "maintenance", "technicians"],
  },
  cinema: {
    id: "cinema",
    label: "Cinéma & audiovisuel",
    shortLabel: "Cinéma",
    description: "Tournages, départements techniques, matériel et équipes.",
    theme: {
      accent: "rose",
      accentSoft: "bg-rose-500/10 border-rose-500/30 text-rose-300",
      surface: "bg-[#241522]",
    },
    copy: {
      dashboardEyebrow: "CINÉMA & AUDIOVISUEL",
      dashboardTitle: "Pilotage de tournage",
      dashboardDescription: "Dossiers de tournage, départements techniques et matériel.",
      activeEntity: "Tournage actif",
      quotesTitle: "Devis de tournage",
      quotesDescription: "Chiffrage des départements, préparation et suivi du tournage.",
      itemLabel: "Matériel de tournage",
    },
    quoteTemplate: "cinema",
    visibleTabs: [...commonTabs, "flightcases", "maintenance", "studios", "technicians"],
  },
  wedding: {
    id: "wedding",
    label: "Wedding & mariage",
    shortLabel: "Wedding",
    description: "Cérémonies, mobilier, décoration, lieux et déroulé de journée.",
    theme: {
      accent: "amber",
      accentSoft: "bg-amber-500/10 border-amber-500/30 text-amber-200",
      surface: "bg-[#271d18]",
    },
    copy: {
      dashboardEyebrow: "WEDDING & MARIAGE",
      dashboardTitle: "Pilotage de cérémonie",
      dashboardDescription: "Prestations, lieux, décoration et déroulé de la journée.",
      activeEntity: "Cérémonie active",
      quotesTitle: "Prestations & devis",
      quotesDescription: "Chiffrage des prestations, lieux et besoins de la cérémonie.",
      itemLabel: "Matériel & décoration",
    },
    quoteTemplate: "wedding",
    visibleTabs: [...commonTabs, "maintenance", "studios"],
  },
};

export const DEFAULT_WORKSPACE_PROFILE: WorkspaceProfileId = "production";

export function getWorkspaceProfile(id?: string | null): WorkspaceProfile {
  return WORKSPACE_PROFILES[(id as WorkspaceProfileId) || DEFAULT_WORKSPACE_PROFILE] || WORKSPACE_PROFILES[DEFAULT_WORKSPACE_PROFILE];
}

export function isTabVisible(profileId: WorkspaceProfileId, tab: MainAppNavTab): boolean {
  return WORKSPACE_PROFILES[profileId].visibleTabs.includes(tab);
}
