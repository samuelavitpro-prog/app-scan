import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Building2,
  Calendar,
  X,
  CreditCard,
  Percent,
  Check,
  ChevronRight,
  HelpCircle,
  Clock,
  Layers,
  Wrench,
  Radio,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { SubscriptionConfig, SubscriptionTier, BillingCycle } from "../types";
import { PLAN_PRICING } from "../utils/subscriptionPlans";

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription?: SubscriptionConfig;
  targetFeatureName?: string;
  recommendedTier?: SubscriptionTier;
  onSelectPlan: (tier: SubscriptionTier, cycle: BillingCycle, crewAddon?: boolean) => Promise<void>;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentSubscription,
  targetFeatureName,
  recommendedTier = "pro",
  onSelectPlan,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    currentSubscription?.billingCycle || "annual"
  );
  const [includeCrewAddon, setIncludeCrewAddon] = useState<boolean>(
    Boolean(currentSubscription?.crewAddonActive)
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChoose = async (tier: SubscriptionTier) => {
    setIsProcessing(true);
    try {
      await onSelectPlan(tier, billingCycle, tier === "pro" ? includeCrewAddon : undefined);
      setSuccessMessage(`Félicitations ! Votre abonnement est maintenant activé en formule ${tier.toUpperCase()}.`);
      setTimeout(() => {
        setIsProcessing(false);
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (e) {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl my-8 bg-[#0b0e1b] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Tarifs & Abonnements KROMA OS
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {targetFeatureName ? (
              <>
                Débloquez le module <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">{targetFeatureName}</span>
              </>
            ) : (
              "Choisissez la formule adaptée à votre parc audiovisuel"
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Une tarification transparente, sans engagement contraignant, taillée pour les loueurs, prestataires et studios.
          </p>

          {/* Billing cycle Switcher (Monthly vs Annual with 2.5 months free) */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  billingCycle === "monthly"
                    ? "bg-slate-800 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Facturation Mensuelle
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  billingCycle === "annual"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Paiement Annuel</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                  ~2,5 Mois Offerts
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-sm font-semibold flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* 1. BASIC (90€/m) */}
          <div
            className={`p-6 rounded-3xl bg-[#111628] border ${
              recommendedTier === "basic" ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-slate-800"
            } flex flex-col justify-between relative transition hover:border-slate-700`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  🥉 {PLAN_PRICING.basic.badge}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{PLAN_PRICING.basic.name}</h3>
              <p className="text-xs text-slate-400 mt-1 min-h-[36px]">
                {PLAN_PRICING.basic.description}
              </p>

              {/* Price */}
              <div className="my-5 pb-5 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    {billingCycle === "annual" ? "900 €" : "90 €"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {billingCycle === "annual" ? "/ an HT" : "/ mois HT"}
                  </span>
                </div>
                {billingCycle === "annual" && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    Soit 75 € / mois (économisez 180 € / an)
                  </p>
                )}
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>2 Utilisateurs</strong> inclus</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>1 Dépôt physique</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Catalogue & Inventaire complet</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Moteur de Devis & Jours Dégressifs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Planning des réservations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Départs / Retours & Scan QR Code</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-through">Malles Flight Cases & RFID</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-through">Atelier SAV & Refacturation Casse</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-through">Calculateur Poids / Énergie</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleChoose("basic")}
              disabled={isProcessing}
              className="mt-6 w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700 shadow"
            >
              {currentSubscription?.tier === "basic" && !currentSubscription?.isTrial
                ? "Formule Actuelle"
                : "Choisir l'offre Basic"}
            </button>
          </div>

          {/* 2. PRO (150€/m ou 1350€/an) - MOST POPULAR */}
          <div
            className={`p-6 rounded-3xl bg-gradient-to-b from-[#151c36] to-[#0f1426] border-2 ${
              recommendedTier === "pro" ? "border-indigo-500 shadow-xl shadow-indigo-500/20" : "border-indigo-600/60"
            } flex flex-col justify-between relative`}
          >
            {/* Top popular pill */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] font-black uppercase tracking-wider shadow">
              ⭐ Recommandé Tournage & Loueurs
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                  🥈 {PLAN_PRICING.pro.badge}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{PLAN_PRICING.pro.name}</h3>
              <p className="text-xs text-slate-300 mt-1 min-h-[36px]">
                {PLAN_PRICING.pro.description}
              </p>

              {/* Price */}
              <div className="my-5 pb-5 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-indigo-300">
                    {billingCycle === "annual" ? "1 350 €" : "150 €"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {billingCycle === "annual" ? "/ an HT" : "/ mois HT"}
                  </span>
                </div>
                {billingCycle === "annual" ? (
                  <p className="text-[11px] text-emerald-400 font-bold mt-1">
                    Soit 112,50 € / mois (2,5 mois offerts — 450 € d'économie)
                  </p>
                ) : (
                  <p className="text-[11px] text-indigo-400 font-medium mt-1">
                    1 350 € si payé annuellement
                  </p>
                )}
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>5 Utilisateurs</strong> inclus</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>Jusqu'à 3 Dépôts / Hubs</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>Malles & Flight Cases (Master QR / RFID)</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>Atelier SAV, Réparations & Casse</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>Calculateur Logistique (Poids, Volume, Ampérage)</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>Sous-Location Confrère (Sub-Rental) & Marge</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Suggestions d'Équivalences IA en Rupture</span>
                </li>
              </ul>

              {/* OPTION SUPPLÉMENT CREW & TECHNICIENS POUR PRO */}
              <div className="mt-4 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCrewAddon}
                    onChange={(e) => setIncludeCrewAddon(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white block">
                      + Option Crew & Intermittents ({billingCycle === "annual" ? "350 €/an" : "35 €/mois"})
                    </span>
                    <span className="text-[11px] text-slate-400 block leading-tight">
                      Planning techniciens, salaires, TJM et déclarations d'équipes.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={() => handleChoose("pro")}
              disabled={isProcessing}
              className="mt-6 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30"
            >
              {currentSubscription?.tier === "pro" && !currentSubscription?.isTrial
                ? "Formule Pro Active"
                : "Activer KROMA Pro"}
            </button>
          </div>

          {/* 3. ULTIMATE (220€/m ou 2000€/an) */}
          <div
            className={`p-6 rounded-3xl bg-gradient-to-b from-[#1b1428] to-[#100d1a] border ${
              recommendedTier === "ultimate" ? "border-pink-500 ring-2 ring-pink-500/30 shadow-xl shadow-pink-600/20" : "border-pink-500/50"
            } flex flex-col justify-between relative transition hover:border-pink-400`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-pink-950 text-pink-300 border border-pink-500/40">
                  👑 {PLAN_PRICING.ultimate.badge}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{PLAN_PRICING.ultimate.name}</h3>
              <p className="text-xs text-slate-300 mt-1 min-h-[36px]">
                {PLAN_PRICING.ultimate.description}
              </p>

              {/* Price */}
              <div className="my-5 pb-5 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-pink-300">
                    {billingCycle === "annual" ? "2 000 €" : "220 €"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {billingCycle === "annual" ? "/ an HT" : "/ mois HT"}
                  </span>
                </div>
                {billingCycle === "annual" ? (
                  <p className="text-[11px] text-emerald-400 font-bold mt-1">
                    Soit 166,60 € / mois (2,4 mois offerts — 640 € d'économie)
                  </p>
                ) : (
                  <p className="text-[11px] text-pink-400 font-medium mt-1">
                    2 000 € si payé annuellement
                  </p>
                )}
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 shrink-0" />
                  <span><strong>Utilisateurs Illimités</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 shrink-0" />
                  <span><strong>Multi-Dépôts Illimités</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 shrink-0" />
                  <span><strong>Tout le pack KROMA Pro inclus</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 shrink-0" />
                  <span><strong>Plateaux & Studios de Tournage</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 shrink-0" />
                  <span><strong>Personnel, Crew & Intermittents (Inclus sans supplément)</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 shrink-0" />
                  <span><strong>Portail Client Extranet & Signature en Ligne</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 shrink-0" />
                  <span><strong>Facturation Factur-X & Scanner IA de Factures</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Blocages Réglementaires Calendrier (VGP / Inventaire)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleChoose("ultimate")}
              disabled={isProcessing}
              className="mt-6 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-pink-600/30"
            >
              {currentSubscription?.tier === "ultimate" && !currentSubscription?.isTrial
                ? "Formule Ultimate Active"
                : "Débloquer KROMA Ultimate"}
            </button>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Paiement sécurisé • Facturation avec TVA récupérable • Support réactif cinéma & régie</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            Fermer sans changer
          </button>
        </div>
      </div>
    </div>
  );
};
