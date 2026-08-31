import React from "react";
import { Lock, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Zap } from "lucide-react";
import { SubscriptionTier } from "../types";
import { PLAN_PRICING } from "../utils/subscriptionPlans";

interface PlanGateGuardProps {
  moduleName: string;
  requiredTier: SubscriptionTier;
  reason?: string;
  canBuyAddon?: boolean;
  onOpenUpgradeModal: (recommendedTier?: SubscriptionTier) => void;
  children: React.ReactNode;
  hasAccess: boolean;
}

export const PlanGateGuard: React.FC<PlanGateGuardProps> = ({
  moduleName,
  requiredTier,
  reason,
  canBuyAddon,
  onOpenUpgradeModal,
  children,
  hasAccess,
}) => {
  if (hasAccess) {
    return <>{children}</>;
  }

  const targetPlan = PLAN_PRICING[requiredTier] || PLAN_PRICING.pro;

  return (
    <div className="p-8 sm:p-12 rounded-3xl bg-[#0c1020] border border-indigo-900/40 text-center flex flex-col items-center justify-center space-y-6 animate-fadeIn shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Lock Icon */}
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shadow-lg shadow-indigo-600/20">
        <Lock className="w-8 h-8 text-indigo-400" />
      </div>

      <div className="max-w-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Formule {targetPlan.name} requise
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-white">
          Module <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">{moduleName}</span> Verrouillé
        </h3>

        <p className="text-sm text-slate-300">
          {reason || `Ce module à forte valeur ajoutée est disponible à partir de la formule ${targetPlan.name}.`}
        </p>
      </div>

      {/* Pricing Pill */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 max-w-md w-full text-left space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Tarif KROMA {targetPlan.badge}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-black">
            2,5 mois offerts en annuel
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-white">{targetPlan.monthlyPrice} €</span>
          <span className="text-xs text-slate-400">/ mois HT ou {targetPlan.annualPrice} € / an</span>
        </div>
        {canBuyAddon && (
          <p className="text-[11px] text-indigo-300 border-t border-slate-800/80 pt-2 font-medium">
            💡 Ou activez l'<strong>Option Crew Intermittent (+35€/mois)</strong> sur votre forfait Pro.
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={() => onOpenUpgradeModal(requiredTier)}
          className="py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition flex items-center gap-2"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Débloquer ce module (ou Changer de plan)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Activation instantanée sans interruption de service</span>
      </div>
    </div>
  );
};
