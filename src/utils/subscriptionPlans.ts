export type SubscriptionTier = "basic" | "pro" | "ultimate";
export type BillingCycle = "monthly" | "annual";

export interface PlanAddon {
  id: "crew_addon";
  name: "Module Crew & Personnel Intermittent";
  description: "Planning techniciens, fiches de paie, déclarations et TJM intermittent";
  monthlyPrice: 35; // 35€/mois en option pour l'offre Pro
  annualPrice: 350; // 350€/an en option
}

export interface SubscriptionConfig {
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  status: "active" | "trial" | "past_due" | "canceled";
  trialEndsAt: string; // ISO String
  isTrial: boolean;
  crewAddonActive?: boolean; // Option Crew pour offre PRO
  subscriptionStartedAt: string;
  nextBillingDate: string;
  maxUsers: number;
  maxDepots: number;
}

export interface PlanFeatureDefinition {
  id: string;
  label: string;
  description: string;
  minTier: SubscriptionTier;
  allowAddonInPro?: boolean;
}

export const PLAN_PRICING = {
  basic: {
    name: "KROMA Basic",
    badge: "Essentiel",
    monthlyPrice: 90,
    annualPrice: 900, // ou mensuel uniquement
    annualEquivalentPerMonth: 75,
    maxUsers: 2,
    maxDepots: 1,
    color: "from-slate-700 to-slate-900",
    border: "border-slate-700",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    description: "Idéal pour loueur indépendant, artisan vidéo ou petite régie mono-dépôt.",
  },
  pro: {
    name: "KROMA Pro",
    badge: "Populaire & Standard Cinéma",
    monthlyPrice: 150,
    annualPrice: 1350, // 1350€/an (2,5 mois offerts)
    annualEquivalentPerMonth: 112.5,
    maxUsers: 5,
    maxDepots: 3,
    color: "from-indigo-600 to-blue-700",
    border: "border-indigo-500",
    badgeColor: "bg-indigo-950 text-indigo-300 border-indigo-500/40",
    description: "Le standard de l'industrie pour les loueurs dynamiques (Caméra / Lumière / Son).",
  },
  ultimate: {
    name: "KROMA Ultimate",
    badge: "Puissance Complète & Studios",
    monthlyPrice: 220,
    annualPrice: 2000, // 2000€/an (2,4 mois offerts)
    annualEquivalentPerMonth: 166.6,
    maxUsers: 999, // Illimité
    maxDepots: 999, // Illimité
    color: "from-purple-600 via-pink-600 to-indigo-700",
    border: "border-pink-500",
    badgeColor: "bg-pink-950 text-pink-300 border-pink-500/40",
    description: "La suite broadcast totale pour gros prestataires, studios multi-plateaux et régies complexes.",
  },
} as const;

/**
 * Matrice complète des droits d'accès aux modules selon le plan
 */
export function canAccessModule(
  moduleKey:
    | "dashboard"
    | "inventory"
    | "quotes"
    | "rentals"
    | "calendar"
    | "logistics_calculator"
    | "sub_rental"
    | "flightcases"
    | "maintenance"
    | "ai_equivalences"
    | "technicians"
    | "studios"
    | "invoices"
    | "client_portal"
    | "audit_logs"
    | "multi_depot"
    | "displays",
  subConfig?: SubscriptionConfig | null
): { allowed: boolean; requiredTier: SubscriptionTier; reason?: string; canBuyAddon?: boolean } {
  // Mode d'essai actif -> Accès total sans restriction
  if (subConfig?.isTrial) {
    const trialEnd = new Date(subConfig.trialEndsAt).getTime();
    if (trialEnd > Date.now()) {
      return { allowed: true, requiredTier: "basic" };
    }
  }

  const currentTier: SubscriptionTier = subConfig?.tier || "ultimate"; // Par défaut fallback ultimate si non configuré

  switch (moduleKey) {
    // Modules Inclus dans BASIC (90€/m)
    case "dashboard":
    case "inventory":
    case "quotes":
    case "rentals":
    case "calendar":
    case "audit_logs":
      return { allowed: true, requiredTier: "basic" };

    // Modules PRO (150€/m ou 1350€/an)
    case "logistics_calculator":
    case "sub_rental":
    case "flightcases":
    case "maintenance":
    case "ai_equivalences":
      if (currentTier === "pro" || currentTier === "ultimate") {
        return { allowed: true, requiredTier: "pro" };
      }
      return {
        allowed: false,
        requiredTier: "pro",
        reason: "Ce module nécessite la formule KROMA PRO (150€/mois ou 1350€/an) pour automatiser vos malles, logistique et SAV.",
      };

    // Module Régie & Écrans Réseau Distants :
    // - Basic: 0 écran (Non inclus)
    // - Pro: 2 écrans max
    // - Ultimate: Illimité
    case "displays":
      if (currentTier === "pro" || currentTier === "ultimate") {
        return { allowed: true, requiredTier: "pro" };
      }
      return {
        allowed: false,
        requiredTier: "pro",
        reason: "Le module Régie & Écrans Distants nécessite la formule KROMA PRO (jusqu'à 2 écrans) ou ULTIMATE (écrans illimités).",
      };

    // Module Crew / Techniciens : Inclus en Ultimate, optionnel avec supplément en Pro (+35€/m)
    case "technicians":
      if (currentTier === "ultimate") {
        return { allowed: true, requiredTier: "ultimate" };
      }
      if (currentTier === "pro") {
        if (subConfig?.crewAddonActive) {
          return { allowed: true, requiredTier: "pro" };
        }
        return {
          allowed: false,
          requiredTier: "ultimate",
          canBuyAddon: true,
          reason: "Le module Crew & Personnel Intermittent est inclus dans l'offre ULTIMATE ou disponible avec l'option Crew Pro (+35€/mois).",
        };
      }
      return {
        allowed: false,
        requiredTier: "pro",
        canBuyAddon: true,
        reason: "Le module Techniciens & Intermittents nécessite l'offre KROMA Pro (avec option Crew) ou Ultimate.",
      };

    // Modules ULTIMATE (220€/m ou 2000€/an)
    case "studios":
    case "invoices":
    case "client_portal":
      if (currentTier === "ultimate") {
        return { allowed: true, requiredTier: "ultimate" };
      }
      return {
        allowed: false,
        requiredTier: "ultimate",
        reason: "Ce module (Plateaux, Facturation Factur-X & Portail Extranet Client) est réservé à la formule KROMA ULTIMATE (220€/mois ou 2000€/an).",
      };

    case "multi_depot":
      if (currentTier === "ultimate") return { allowed: true, requiredTier: "ultimate" };
      if (currentTier === "pro") return { allowed: true, requiredTier: "pro" }; // Pro gère jusqu'à 3 dépôts
      return {
        allowed: false,
        requiredTier: "pro",
        reason: "La formule Basic est limitée à 1 dépôt. Passez à KROMA Pro ou Ultimate pour gérer plusieurs sites physiques.",
      };

    default:
      return { allowed: true, requiredTier: "basic" };
  }
}

/**
 * Retourne le nombre maximum d'écrans distants autorisés par le plan :
 * - Basic: 0 écran
 * - Pro: 2 écrans
 * - Ultimate: Illimité (999)
 */
export function getMaxAllowedScreens(subConfig?: SubscriptionConfig | null): number {
  if (subConfig?.isTrial) {
    const trialEnd = new Date(subConfig.trialEndsAt).getTime();
    if (trialEnd > Date.now()) {
      return 999; // Période d'essai : illimité
    }
  }

  const currentTier: SubscriptionTier = subConfig?.tier || "ultimate";
  if (currentTier === "ultimate") return 999;
  if (currentTier === "pro") return 2;
  return 0; // basic
}

