import React, { useState } from "react";
import {
  Lock,
  Building,
  User,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Layers,
  Fingerprint,
  Crown,
} from "lucide-react";
import { UserAccount, SubscriptionTier } from "../types";

interface EnterpriseAuthModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserAccount, token: string) => void;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const EnterpriseAuthModal: React.FC<EnterpriseAuthModalProps> = ({
  isOpen,
  onLoginSuccess,
  onClose,
  canDismiss = false,
}) => {
  const [authMode, setAuthMode] = useState<"login" | "pin" | "register">("login");
  const [email, setEmail] = useState<string>("samuelavitpro@gmail.com");
  const [password, setPassword] = useState<string>("admin");
  const [pinCode, setPinCode] = useState<string>("");

  // Register form state
  const [regCompanyName, setRegCompanyName] = useState<string>("");
  const [regWarehouseName, setRegWarehouseName] = useState<string>("Dépôt Central Paris");
  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regPinCode, setRegPinCode] = useState<string>("1234");
  const [regTier, setRegTier] = useState<SubscriptionTier>("pro");
  const [regBillingCycle, setRegBillingCycle] = useState<"monthly" | "annual">("monthly");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        localStorage.setItem("stockvision_auth_token", data.token);
        localStorage.setItem("stockvision_user", JSON.stringify(data.user));
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMessage(data.error || "Identifiants de connexion invalides.");
      }
    } catch {
      setErrorMessage("Erreur de communication avec le serveur d'authentification.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = async (pinToTest?: string) => {
    const pin = pinToTest || pinCode;
    if (!pin || pin.length < 4) {
      setErrorMessage("Veuillez saisir un code PIN à 4 chiffres.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinCode: pin }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        localStorage.setItem("stockvision_auth_token", data.token);
        localStorage.setItem("stockvision_user", JSON.stringify(data.user));
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMessage(data.error || "Code PIN invalide.");
        setPinCode("");
      }
    } catch {
      setErrorMessage("Erreur de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCompanyName || !regName || !regEmail || !regPassword) {
      setErrorMessage("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: regCompanyName,
          warehouseName: regWarehouseName,
          name: regName,
          email: regEmail,
          password: regPassword,
          pinCode: regPinCode || "1234",
          selectedTier: regTier,
          billingCycle: regBillingCycle,
        }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        localStorage.setItem("stockvision_auth_token", data.token);
        localStorage.setItem("stockvision_user", JSON.stringify(data.user));
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMessage(data.error || "Erreur lors de la création de l'espace entreprise.");
      }
    } catch {
      setErrorMessage("Erreur lors de l'enregistrement de l'entreprise.");
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickUser = (mail: string, pass: string, pin: string) => {
    setEmail(mail);
    setPassword(pass);
    setPinCode(pin);
    setErrorMessage(null);
  };

  return (
    <div
      id="enterprise-auth-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-[#0e111d] border border-[#232842] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Top Header Glow Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-pink-950 p-5 border-b border-[#202540] relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/20">
                <Lock className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800/60">
                    KROMA OS
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                    <ShieldCheck className="w-3 h-3" /> Données Chiffrées
                  </span>
                </div>
                <h2 className="text-base font-black text-white mt-1 flex items-center gap-2">
                  Portail Audiovisuel & Logistique Pro
                </h2>
              </div>
            </div>

            {canDismiss && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1c2138] bg-[#0a0d18] px-6 pt-3 gap-2 shrink-0">
          <button
            type="button"
            id="tab-auth-login"
            onClick={() => {
              setAuthMode("login");
              setErrorMessage(null);
            }}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              authMode === "login"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Connexion Email
          </button>

          <button
            type="button"
            id="tab-auth-pin"
            onClick={() => {
              setAuthMode("pin");
              setErrorMessage(null);
            }}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              authMode === "pin"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            Code PIN Opérateur
          </button>

          <button
            type="button"
            id="tab-auth-register"
            onClick={() => {
              setAuthMode("register");
              setErrorMessage(null);
            }}
            className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              authMode === "register"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Essai 14 Jours (Nouveau)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. EMAIL + PASSWORD LOGIN */}
          {authMode === "login" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Adresse Email Professionnelle
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="input-auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="samuelavitpro@gmail.com"
                    className="w-full bg-[#121626] border border-[#262b46] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Mot de passe</label>
                  <span className="text-[11px] text-slate-400">Défaut: admin</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="input-auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#121626] border border-[#262b46] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Quick Login Profiles */}
              <div className="pt-1">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Comptes de test pré-configurés :
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setQuickUser("samuelavitpro@gmail.com", "admin", "1234")}
                    className="p-1.5 rounded-lg bg-[#141829] border border-indigo-900/50 text-indigo-300 hover:bg-indigo-900/30 transition text-left"
                  >
                    <span className="font-bold block truncate">Samuel Avit</span>
                    <span className="text-slate-400">Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickUser("a.mercier@stockvision.fr", "logistique123", "5678")}
                    className="p-1.5 rounded-lg bg-[#141829] border border-[#242a45] text-slate-300 hover:bg-white/5 transition text-left"
                  >
                    <span className="font-bold block truncate">Alexandre M.</span>
                    <span className="text-slate-400">Logistique</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickUser("s.benali@stockvision.fr", "scan123", "9999")}
                    className="p-1.5 rounded-lg bg-[#141829] border border-[#242a45] text-slate-300 hover:bg-white/5 transition text-left"
                  >
                    <span className="font-bold block truncate">Sarah Benali</span>
                    <span className="text-slate-400">Opérateur</span>
                  </button>
                </div>
              </div>

              <button
                id="btn-auth-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Connexion en cours...</span>
                ) : (
                  <>
                    <span>Accéder à KROMA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. PIN CODE RAPIDE (KIOSK / MOBILE SCANNER) */}
          {authMode === "pin" && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-300">
                Saisissez votre code PIN à 4 chiffres pour ouvrir immédiatement la session opérateur sur ce terminal.
              </p>

              <div className="flex justify-center my-2">
                <input
                  type="password"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPinCode(val);
                    if (val.length === 4) handlePinLogin(val);
                  }}
                  placeholder="••••"
                  className="bg-[#121626] border-2 border-indigo-500 text-white text-3xl font-mono text-center tracking-widest py-3 px-6 rounded-2xl w-48 focus:outline-none shadow-inner"
                />
              </div>

              {/* Pin Pad Grid */}
              <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (pinCode.length < 4) {
                        const next = pinCode + num;
                        setPinCode(next);
                        if (next.length === 4) handlePinLogin(next);
                      }
                    }}
                    className="py-2.5 bg-[#141829] hover:bg-[#1f253d] text-white font-bold rounded-xl border border-[#262b46] transition text-base"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPinCode("")}
                  className="py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold rounded-xl border border-rose-800/40 transition text-xs"
                >
                  Effacer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pinCode.length < 4) {
                      const next = pinCode + "0";
                      setPinCode(next);
                      if (next.length === 4) handlePinLogin(next);
                    }
                  }}
                  className="py-2.5 bg-[#141829] hover:bg-[#1f253d] text-white font-bold rounded-xl border border-[#262b46] transition text-base"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handlePinLogin()}
                  className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-xs flex items-center justify-center"
                >
                  Valider
                </button>
              </div>

              <div className="text-[11px] text-slate-400 pt-2">
                Codes PIN de test : <span className="text-indigo-300 font-mono">1234</span> (Admin),{" "}
                <span className="text-indigo-300 font-mono">5678</span> (Logistique),{" "}
                <span className="text-indigo-300 font-mono">9999</span> (Scan)
              </div>
            </div>
          )}

          {/* 3. NOUVELLE ENTREPRISE / INSCRIPTION & ESSAI 14 JOURS */}
          {authMode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom de votre Entreprise / Studio
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={regCompanyName}
                    onChange={(e) => setRegCompanyName(e.target.value)}
                    placeholder="ex: Kroma Broadcast, Studio 24, Panavision Paris..."
                    className="w-full bg-[#121626] border border-[#262b46] rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom du Gestionnaire
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="w-full bg-[#121626] border border-[#262b46] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom du Dépôt Principal
                  </label>
                  <input
                    type="text"
                    value={regWarehouseName}
                    onChange={(e) => setRegWarehouseName(e.target.value)}
                    placeholder="Dépôt Central Paris"
                    className="w-full bg-[#121626] border border-[#262b46] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Administrateur
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="contact@votre-entreprise.com"
                  className="w-full bg-[#121626] border border-[#262b46] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mot de passe maître
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#121626] border border-[#262b46] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Code PIN Rapide (4 ch.)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={regPinCode}
                    onChange={(e) => setRegPinCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="1234"
                    className="w-full bg-[#121626] border border-[#262b46] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono text-center"
                  />
                </div>
              </div>

              {/* Formule de démarrage & Essai 14j */}
              <div className="pt-2 border-t border-[#1e243d]">
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>Choisir la formule KROMA :</span>
                  <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                    14 jours d'essai offerts
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegTier("basic")}
                    className={`p-2 rounded-xl border text-left transition ${
                      regTier === "basic"
                        ? "border-blue-500 bg-blue-950/40 text-white"
                        : "border-slate-800 bg-[#121626] text-slate-400"
                    }`}
                  >
                    <div className="font-black text-xs">BASIC</div>
                    <div className="text-[10px] font-bold text-blue-400">90 €/m</div>
                    <div className="text-[9px] opacity-70">Parc & Planning</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegTier("pro")}
                    className={`p-2 rounded-xl border text-left transition relative ${
                      regTier === "pro"
                        ? "border-indigo-500 bg-indigo-950/40 text-white"
                        : "border-slate-800 bg-[#121626] text-slate-400"
                    }`}
                  >
                    <span className="absolute -top-1.5 -right-1 bg-indigo-600 text-white text-[8px] font-black px-1 rounded">
                      POPULAIRE
                    </span>
                    <div className="font-black text-xs">PRO</div>
                    <div className="text-[10px] font-bold text-indigo-400">150 €/m</div>
                    <div className="text-[9px] opacity-70">RFID & SAV</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegTier("ultimate")}
                    className={`p-2 rounded-xl border text-left transition ${
                      regTier === "ultimate"
                        ? "border-purple-500 bg-purple-950/40 text-white"
                        : "border-slate-800 bg-[#121626] text-slate-400"
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" /> ULTIMATE
                    </div>
                    <div className="text-[10px] font-bold text-purple-400">220 €/m</div>
                    <div className="text-[9px] opacity-70">Tout illimité</div>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/40 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Accès instantané sans carte bancaire avec 14 jours d'accès complet.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                {isLoading ? "Création en cours..." : "Démarrer l'essai 14 jours gratuit"}
              </button>
            </form>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="bg-[#090b14] border-t border-[#181c2f] px-6 py-2.5 text-center shrink-0">
          <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            KROMA OS • Architecture Cloud Hybride & Données Souveraines
          </span>
        </div>
      </div>
    </div>
  );
};
