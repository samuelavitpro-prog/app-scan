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
  Fingerprint,
  MapPin,
  Warehouse,
  Boxes,
  Film,
  Calendar,
  Layers,
} from "lucide-react";
import { UserAccount, DepotWarehouse } from "../types";

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount, token: string) => void;
  availableDepots?: DepotWarehouse[];
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  availableDepots = [],
}) => {
  const [authMode, setAuthMode] = useState<"login" | "pin" | "register">("login");
  const [email, setEmail] = useState<string>("samuelavitpro@gmail.com");
  const [password, setPassword] = useState<string>("admin");
  const [pinCode, setPinCode] = useState<string>("");

  // Register form state with Trial & Plan Selection
  const [regCompanyName, setRegCompanyName] = useState<string>("KROMA Production & Location");
  const [regWarehouseName, setRegWarehouseName] = useState<string>("Dépôt Central Paris");
  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regPinCode, setRegPinCode] = useState<string>("1234");
  const [regTrialTier, setRegTrialTier] = useState<"basic" | "pro" | "ultimate">("ultimate");
  const [regBillingCycle, setRegBillingCycle] = useState<"monthly" | "annual">("annual");
  const [regCrewAddon, setRegCrewAddon] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Demo Profiles with assigned depots
  const DEMO_ACCOUNTS = [
    {
      name: "Samuel Avit",
      role: "Administrateur",
      email: "samuelavitpro@gmail.com",
      pass: "admin",
      pin: "1234",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      depotsSummary: "Tous les 4 dépôts (Accès Total)",
      defaultDepot: "DEP-01",
      badgeColor: "border-indigo-500/50 text-indigo-300 bg-indigo-950/40",
    },
    {
      name: "Alexandre Mercier",
      role: "Responsable Logistique",
      email: "a.mercier@stockvision.fr",
      pass: "logistique123",
      pin: "5678",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      depotsSummary: "Paris-Nord & Studios Plaine",
      defaultDepot: "DEP-01",
      badgeColor: "border-cyan-500/50 text-cyan-300 bg-cyan-950/40",
    },
    {
      name: "Sarah Benali",
      role: "Opérateur Scan",
      email: "s.benali@stockvision.fr",
      pass: "scan123",
      pin: "9999",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      depotsSummary: "Dépôt Central Paris-Nord uniquement",
      defaultDepot: "DEP-01",
      badgeColor: "border-emerald-500/50 text-emerald-300 bg-emerald-950/40",
    },
    {
      name: "Marc Dupont",
      role: "Comptoir & Location",
      email: "m.dupont@stockvision.fr",
      pass: "comptoir123",
      pin: "0000",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      depotsSummary: "Hub Événements Lyon Confluence",
      defaultDepot: "DEP-03",
      badgeColor: "border-amber-500/50 text-amber-300 bg-amber-950/40",
    },
  ];

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
        // Set active depot based on user's default depot or assigned depots
        const userObj: UserAccount = {
          ...data.user,
          assignedDepots: data.user.assignedDepots || ["DEP-01"],
          defaultDepotId: data.user.defaultDepotId || "DEP-01",
          activeDepotId: data.user.defaultDepotId || (data.user.assignedDepots && data.user.assignedDepots[0]) || "DEP-01",
        };
        localStorage.setItem("sv_auth_token", data.token);
        localStorage.setItem("stockvision_user", JSON.stringify(userObj));
        onLoginSuccess(userObj, data.token);
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
        const userObj: UserAccount = {
          ...data.user,
          assignedDepots: data.user.assignedDepots || ["DEP-01"],
          defaultDepotId: data.user.defaultDepotId || "DEP-01",
          activeDepotId: data.user.defaultDepotId || (data.user.assignedDepots && data.user.assignedDepots[0]) || "DEP-01",
        };
        localStorage.setItem("sv_auth_token", data.token);
        localStorage.setItem("stockvision_user", JSON.stringify(userObj));
        onLoginSuccess(userObj, data.token);
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
          trialTier: regTrialTier,
          billingCycle: regBillingCycle,
          crewAddonActive: regTrialTier === "pro" ? regCrewAddon : false,
        }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        const userObj: UserAccount = {
          ...data.user,
          assignedDepots: ["DEP-01"],
          defaultDepotId: "DEP-01",
          activeDepotId: "DEP-01",
        };
        localStorage.setItem("sv_auth_token", data.token);
        localStorage.setItem("stockvision_user", JSON.stringify(userObj));
        onLoginSuccess(userObj, data.token);
      } else {
        setErrorMessage(data.error || "Erreur lors de la création de l'espace entreprise.");
      }
    } catch {
      setErrorMessage("Erreur lors de l'enregistrement de l'entreprise.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectQuickAccount = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setPinCode(demo.pin);
    setErrorMessage(null);
  };

  return (
    <div className="login-page-shell min-h-screen w-full bg-[#080a10] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background glowing gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-6 py-4 border-b border-slate-800/80 bg-[#0c0f1a]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-white">KROMA</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                PRO OS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Gestion Audiovisuelle, Studios, Devis & Multi-Dépôts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden sm:flex items-center gap-2 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>Multi-Dépôts Intelligent</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Serveur Opérationnel
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Quick Accounts & Depot Overview */}
          <div className="lg:col-span-5 bg-[#0f1322]/90 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-xl shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Rattachement Multi-Dépôts</h3>
                </div>
                <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60 font-semibold">
                  Accès Salariés
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Chaque collaborateur est automatiquement affecté à son dépôt par défaut lors de la connexion. Les salariés autorisés sur plusieurs sites peuvent changer de dépôt en 1 clic.
              </p>

              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Sélectionnez un profil préconfiguré :
                </p>

                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => selectQuickAccount(acc)}
                      className={`w-full p-3 rounded-2xl border transition text-left flex items-center gap-3 relative group ${
                        isSelected
                          ? "bg-indigo-950/50 border-indigo-500/70 shadow-lg shadow-indigo-900/30"
                          : "bg-[#14182a]/70 border-slate-800 hover:bg-[#1a2037] hover:border-slate-700"
                      }`}
                    >
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-sm text-white truncate group-hover:text-indigo-300 transition">
                            {acc.name}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${acc.badgeColor} shrink-0`}>
                            {acc.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{acc.depotsSummary}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom info banner */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Boxes className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                  <span className="font-semibold text-slate-300 block">Parc Matériel</span>
                  <span>Fiches Matériel</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Calendar className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <span className="font-semibold text-slate-300 block">Planning Régie</span>
                  <span>Multi-écrans</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Layers className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <span className="font-semibold text-slate-300 block">Locations</span>
                  <span>Check-in/out</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-7 bg-[#0d101c] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* Tab navigation */}
            <div className="flex border-b border-slate-800 bg-[#090c16] px-6 pt-4 gap-3">
              <button
                type="button"
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
                <LogIn className="w-4 h-4" />
                Connexion Email
              </button>

              <button
                type="button"
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
                <Fingerprint className="w-4 h-4" />
                Code PIN Rapide
              </button>

              <button
                type="button"
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
                <Building className="w-4 h-4" />
                Nouvelle Entreprise
              </button>
            </div>

            {/* Form Area */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center">
              {errorMessage && (
                <div className="mb-6 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* EMAIL & PASSWORD LOGIN */}
              {authMode === "login" && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Identifiant / Adresse Email Professionnelle
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        id="login-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nom@entreprise.com"
                        className="w-full bg-[#141829] border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">Mot de passe</label>
                      <span className="text-[11px] text-slate-400">Mot de passe par défaut : admin</span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        id="login-password-input"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#141829] border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 text-[11px] text-indigo-300 flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                    <span>
                      Le système initialisera automatiquement votre interface sur votre dépôt principal attribué par l'administrateur.
                    </span>
                  </div>

                  <button
                    id="btn-login-submit"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Vérification des droits d'accès...</span>
                    ) : (
                      <>
                        <span>Ouvrir ma Session & Mon Dépôt</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* PIN CODE LOGIN */}
              {authMode === "pin" && (
                <div className="space-y-5 text-center">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Authentification Rapide par PIN</h4>
                    <p className="text-xs text-slate-400">
                      Entrez votre code à 4 chiffres pour accéder instantanément à vos outils et dépôts.
                    </p>
                  </div>

                  <div className="flex justify-center my-2">
                    <input
                      id="login-pin-input"
                      type="password"
                      maxLength={4}
                      value={pinCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setPinCode(val);
                        if (val.length === 4) {
                          handlePinLogin(val);
                        }
                      }}
                      placeholder="••••"
                      className="w-48 text-center tracking-[16px] text-3xl font-mono py-3 bg-[#141829] border-2 border-indigo-500/70 rounded-2xl text-white focus:outline-none focus:border-indigo-400 shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          if (pinCode.length < 4) {
                            const next = pinCode + n;
                            setPinCode(next);
                            if (next.length === 4) handlePinLogin(next);
                          }
                        }}
                        className="py-3 bg-[#14182a] hover:bg-[#1f2642] text-white font-bold rounded-2xl border border-slate-700/80 transition text-lg"
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPinCode("")}
                      className="py-3 bg-[#14182a] hover:bg-red-950/40 text-red-400 font-bold rounded-2xl border border-slate-700/80 transition text-xs"
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
                      className="py-3 bg-[#14182a] hover:bg-[#1f2642] text-white font-bold rounded-2xl border border-slate-700/80 transition text-lg"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinLogin()}
                      className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition text-xs flex items-center justify-center shadow-lg shadow-indigo-600/30"
                    >
                      Valider
                    </button>
                  </div>
                </div>
              )}

              {/* REGISTER NEW COMPANY */}
              {authMode === "register" && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nom de l'Entreprise / Agence
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={regCompanyName}
                        onChange={(e) => setRegCompanyName(e.target.value)}
                        placeholder="ex: KROMA Studios, LocaLight Event..."
                        className="w-full bg-[#141829] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nom de l'Administrateur
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Prénom Nom"
                        className="w-full bg-[#141829] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Premier Dépôt Principal
                      </label>
                      <input
                        type="text"
                        value={regWarehouseName}
                        onChange={(e) => setRegWarehouseName(e.target.value)}
                        placeholder="ex: Dépôt Central"
                        className="w-full bg-[#141829] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email de Connexion Maître
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="admin@votre-entreprise.com"
                      className="w-full bg-[#141829] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Mot de passe
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#141829] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Code PIN Opérateur (4 ch.)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={regPinCode}
                        onChange={(e) => setRegPinCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="1234"
                        className="w-full bg-[#141829] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono text-center"
                      />
                    </div>
                  </div>

                  {/* 14-DAY TRIAL PLAN SELECTION */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-200">
                        🎁 Formule d'Essai Gratuit (14 Jours Sans Engagement)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-black">
                        14 JOURS OFFERTS
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Basic */}
                      <button
                        type="button"
                        onClick={() => setRegTrialTier("basic")}
                        className={`p-2 rounded-xl text-left border transition ${
                          regTrialTier === "basic"
                            ? "bg-slate-800 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500"
                            : "bg-[#111526] border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-[11px] font-black text-slate-200">KROMA Basic</div>
                        <div className="text-[10px] text-slate-400">90 € / mois</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">2 Users • 1 Dépôt</div>
                      </button>

                      {/* Pro */}
                      <button
                        type="button"
                        onClick={() => setRegTrialTier("pro")}
                        className={`p-2 rounded-xl text-left border transition relative ${
                          regTrialTier === "pro"
                            ? "bg-indigo-950/60 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500"
                            : "bg-[#111526] border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span className="absolute -top-1.5 right-1 px-1.5 py-0.2 rounded bg-indigo-500 text-white text-[8px] font-bold">
                          POPULAIRE
                        </span>
                        <div className="text-[11px] font-black text-indigo-300">KROMA Pro</div>
                        <div className="text-[10px] text-indigo-200">150 € / mois</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Malles + SAV + Confrère</div>
                      </button>

                      {/* Ultimate */}
                      <button
                        type="button"
                        onClick={() => setRegTrialTier("ultimate")}
                        className={`p-2 rounded-xl text-left border transition ${
                          regTrialTier === "ultimate"
                            ? "bg-pink-950/60 border-pink-500 text-white shadow-md ring-1 ring-pink-500"
                            : "bg-[#111526] border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-[11px] font-black text-pink-300">Ultimate</div>
                        <div className="text-[10px] text-pink-200">220 € / mois</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Tout inclus + Studios</div>
                      </button>
                    </div>

                    {/* If Pro selected, allow trial Crew addon */}
                    {regTrialTier === "pro" && (
                      <div className="mt-2 p-2 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={regCrewAddon}
                            onChange={(e) => setRegCrewAddon(e.target.checked)}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 bg-slate-900"
                          />
                          <span className="text-[11px] text-slate-300">
                            Tester aussi l'option <strong>Crew & Techniciens Intermittents</strong> (+35€/m)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/40 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Essai gratuit 14 jours activé automatiquement avec accès à la formule{" "}
                      <strong className="text-white">{regTrialTier.toUpperCase()}</strong>.
                    </span>
                  </p>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? "Création en cours..." : "Démarrer mon Essai 14 Jours KROMA"}
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Footer */}
            <div className="bg-[#080a14] border-t border-slate-800/80 px-6 py-3.5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Chiffrement local & souveraineté des données
              </span>
              <span className="text-slate-400 font-mono">v2.6.0-pro</span>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 w-full py-3 px-6 text-center text-xs text-slate-400 border-t border-slate-800/60 bg-[#0a0d17]/60">
        KROMA Audiovisuel & Logistique • Système d'exploitation professionnel pour la production audiovisuelle et événementielle
      </footer>
    </div>
  );
};
