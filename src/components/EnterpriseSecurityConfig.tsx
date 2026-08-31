import React, { useState, useEffect } from "react";
import {
  Shield,
  KeyRound,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Building,
  UserCheck,
  Fingerprint,
  Database,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";
import { AppSettings, UserAccount, DatabaseStatus } from "../types";

interface EnterpriseSecurityConfigProps {
  settings: AppSettings;
  currentUser: UserAccount | null;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  onRefreshData: () => Promise<void>;
  onTriggerAuthModal: () => void;
}

export const EnterpriseSecurityConfig: React.FC<EnterpriseSecurityConfigProps> = ({
  settings,
  currentUser,
  onUpdateSettings,
  onRefreshData,
  onTriggerAuthModal,
}) => {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Purge Confirmation Modal
  const [showPurgeConfirm, setShowPurgeConfirm] = useState<boolean>(false);
  const [purgeInputText, setPurgeInputText] = useState<string>("");
  const [isPurging, setIsPurging] = useState<boolean>(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [newPinCode, setNewPinCode] = useState<string>(currentUser?.pinCode || "1234");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUpdatingCreds, setIsUpdatingCreds] = useState<boolean>(false);

  // Users List State
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<UserAccount["role"]>("Opérateur Scan");
  const [newUserPassword, setNewUserPassword] = useState<string>("pass123");
  const [newUserPin, setNewUserPin] = useState<string>("1234");

  const fetchStatusAndUsers = async () => {
    setIsLoadingStatus(true);
    try {
      const [resStatus, resUsers] = await Promise.all([
        fetch("/api/database/status"),
        fetch("/api/users"),
      ]);
      const dataStatus = await resStatus.json();
      const dataUsers = await resUsers.json();
      setDbStatus(dataStatus);
      if (Array.isArray(dataUsers.users)) {
        setUsersList(dataUsers.users);
      }
    } catch {
      console.warn("Failed to load db status");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatusAndUsers();
  }, []);

  const handleCleanDatabase = async () => {
    if (purgeInputText.trim().toUpperCase() !== "PURGER") {
      setActionErrorMessage("Veuillez saisir le mot 'PURGER' pour confirmer l'effacement définitif.");
      return;
    }

    setIsPurging(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const res = await fetch("/api/database/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanLogs: false,
          operatorName: currentUser?.name || "Administrateur",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage("Base de données nettoyée avec succès ! L'inventaire est désormais 100% vierge.");
        setShowPurgeConfirm(false);
        setPurgeInputText("");
        await onRefreshData();
        await fetchStatusAndUsers();
      } else {
        setActionErrorMessage(data.error || "Erreur lors de la purge.");
      }
    } catch {
      setActionErrorMessage("Impossible de joindre le serveur pour nettoyer la base.");
    } finally {
      setIsPurging(false);
    }
  };

  const handleSeedSample = async () => {
    setActionErrorMessage(null);
    setActionSuccessMessage(null);
    try {
      const res = await fetch("/api/database/seed-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorName: currentUser?.name || "Administrateur" }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage("Catalogue et locations de démonstration rechargés avec succès !");
        await onRefreshData();
        await fetchStatusAndUsers();
      }
    } catch {
      setActionErrorMessage("Erreur lors de l'injection des données d'exemple.");
    }
  };

  const handleExportBackup = () => {
    window.location.href = "/api/database/export-full";
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch("/api/database/import-full", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ backup: json, operatorName: currentUser?.name || "Administrateur" }),
        });
        const data = await res.json();
        if (data.success) {
          setActionSuccessMessage("Sauvegarde restaurée avec succès !");
          await onRefreshData();
          await fetchStatusAndUsers();
        } else {
          setActionErrorMessage(data.error || "Erreur lors de la restauration.");
        }
      } catch {
        setActionErrorMessage("Format de fichier JSON de sauvegarde invalide.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdatingCreds(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword,
          newPassword: newPassword || undefined,
          newPinCode: newPinCode || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage("Identifiants et code PIN mis à jour avec succès !");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setActionErrorMessage(data.error || "Erreur lors du changement d'identifiants.");
      }
    } catch {
      setActionErrorMessage("Erreur de connexion.");
    } finally {
      setIsUpdatingCreds(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          pinCode: newUserPin,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage(`Utilisateur '${newUserName}' créé avec succès.`);
        setShowAddUserModal(false);
        setNewUserName("");
        setNewUserEmail("");
        await fetchStatusAndUsers();
      }
    } catch {
      setActionErrorMessage("Erreur lors de la création de l'utilisateur.");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement l'accès pour ${name} ?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage(`Accès révoqué pour ${name}.`);
        await fetchStatusAndUsers();
      } else {
        setActionErrorMessage(data.error || "Erreur de suppression.");
      }
    } catch {
      setActionErrorMessage("Impossible de supprimer l'utilisateur.");
    }
  };

  return (
    <div id="enterprise-security-config-panel" className="space-y-6 animate-fade-in">
      {/* Alert Messages */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-sm flex items-center justify-between shadow-lg shadow-emerald-950/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-xs bg-emerald-900/40 hover:bg-emerald-900 px-2.5 py-1 rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-center justify-between shadow-lg shadow-red-950/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="font-medium">{actionErrorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionErrorMessage(null)}
            className="text-xs bg-red-900/40 hover:bg-red-900 px-2.5 py-1 rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      )}

      {/* SECTION 1: DATA SOVEREIGNTY & DATABASE CLEANING */}
      <div className="p-6 rounded-3xl bg-[#111422] border border-[#20253c] relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1d2238] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Maîtrise & Nettoyage de la Base de Données
                </h3>
                {dbStatus?.isClean ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Base 100% Vierge
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-400">
                    {dbStatus?.totalItems ?? 0} article(s) • {dbStatus?.totalRentals ?? 0} location(s)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Purgez les articles tests pour partir avec un inventaire 100% vierge, ou sauvegardez l'intégralité de vos données.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchStatusAndUsers}
              disabled={isLoadingStatus}
              className="p-2.5 rounded-xl bg-[#161a2e] hover:bg-[#1f243f] text-slate-300 hover:text-white border border-[#262b45] transition text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? "animate-spin text-blue-400" : ""}`} />
              <span>Actualiser l'état</span>
            </button>
          </div>
        </div>

        {/* Database Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Action 1: Purge / Clean Database */}
          <div className="p-5 rounded-2xl bg-red-950/20 border border-red-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                <h4 className="text-sm font-bold text-red-300">Purger / Nettoyer la Base</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supprime instantanément tous les articles et mouvements de test pour démarrer à 0 avec vos vrais équipements.
              </p>
            </div>
            <button
              id="btn-purge-database-open"
              type="button"
              onClick={() => setShowPurgeConfirm(true)}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-900/30 transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Nettoyer la base (0 articles)</span>
            </button>
          </div>

          {/* Action 2: Backup Export & Restore */}
          <div className="p-5 rounded-2xl bg-[#14182a] border border-[#232842] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Download className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-bold text-white">Sauvegarde & Restauration</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Téléchargez un export JSON complet de votre catalogue et de vos locations pour conserver vos données.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter JSON</span>
              </button>
              <label className="py-2.5 px-2 rounded-xl bg-[#1b2038] hover:bg-[#252c4d] text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-[#2b3353] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurer</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action 3: Reload Demo Catalogue */}
          <div className="p-5 rounded-2xl bg-[#14182a] border border-[#232842] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-amber-300">Données de Démonstration</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Injecte le catalogue d'exemple (caméras, projecteurs, perceuses) pour tester ou faire une démonstration.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedSample}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-900/30 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recharger les données de test</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: ENTERPRISE ACCESS & MASTER CREDENTIALS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Admin Password & Operator PIN */}
        <div className="p-6 rounded-3xl bg-[#111422] border border-[#20253c] shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#1d2238] pb-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Identifiants de Sécurité Master</h3>
              <p className="text-xs text-slate-400">
                Connecté en tant que <span className="text-purple-300 font-semibold">{currentUser?.name || "Administrateur"}</span> ({currentUser?.email})
              </p>
            </div>
          </div>

          <form onSubmit={handleChangeCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mot de passe Actuel
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Saisissez votre mot de passe actuel"
                  className="w-full bg-[#161a2e] border border-[#262b45] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nouveau Mot de Passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  className="w-full bg-[#161a2e] border border-[#262b45] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Code PIN Rapide (4 chiffres)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={newPinCode}
                  onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="1234"
                  className="w-full bg-[#161a2e] border border-[#262b45] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono text-center"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onTriggerAuthModal}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Lock className="w-3.5 h-3.5" />
                Changer d'espace entreprise
              </button>

              <button
                type="submit"
                disabled={isUpdatingCreds}
                className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
              >
                {isUpdatingCreds ? "Mise à jour..." : "Enregistrer les identifiants"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: User Accounts & Operator PINs */}
        <div className="p-6 rounded-3xl bg-[#111422] border border-[#20253c] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1d2238] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Comptes Utilisateurs & Opérateurs</h3>
                  <p className="text-xs text-slate-400">{usersList.length} compte(s) enregistrés</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>

            {/* List of Users */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {usersList.map((user) => (
                <div
                  key={user.id}
                  className="p-3 rounded-2xl bg-[#161a2e] border border-[#242944] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{user.name}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-950 text-blue-300 font-semibold border border-blue-800/40">
                          {user.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">{user.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">PIN Kiosk</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{user.pinCode || "—"}</span>
                    </div>

                    {user.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition"
                        title="Supprimer ce compte"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1d2238] mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Contrôle d'accès par rôle (RBAC) activé
            </span>
            <span className="font-semibold text-slate-300">{settings.companyName}</span>
          </div>
        </div>
      </div>

      {/* MODAL: PURGE CONFIRMATION */}
      {showPurgeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#101322] border border-red-800/80 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-700/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirmation de Nettoyage</h3>
                <p className="text-xs text-red-300">Action irréversible sur l'inventaire</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#161a2d] p-3 rounded-xl border border-[#232844]">
              Vous êtes sur le point d'effacer <strong className="text-white">tous les articles et mouvements de locations</strong>. Votre base sera réinitialisée à 0 pour accueillir votre propre inventaire.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tapez <span className="text-red-400 font-mono font-bold">PURGER</span> ci-dessous pour valider :
              </label>
              <input
                id="input-confirm-purge"
                type="text"
                value={purgeInputText}
                onChange={(e) => setPurgeInputText(e.target.value)}
                placeholder="PURGER"
                className="w-full bg-[#181d33] border border-red-700/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPurgeConfirm(false);
                  setPurgeInputText("");
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#1c2138] hover:bg-[#252c4a] text-slate-300 font-semibold text-xs transition"
              >
                Annuler
              </button>
              <button
                id="btn-confirm-purge-submit"
                type="button"
                disabled={isPurging || purgeInputText.trim().toUpperCase() !== "PURGER"}
                onClick={handleCleanDatabase}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-red-700/30 transition flex items-center justify-center gap-2"
              >
                {isPurging ? "Nettoyage en cours..." : "Purger définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#101322] border border-[#262b48] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1d2238] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Créer un Compte Collaborateur
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="ex: Thomas Martin"
                  className="w-full bg-[#161a2e] border border-[#262b45] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email professionnel</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="t.martin@entreprise.com"
                  className="w-full bg-[#161a2e] border border-[#262b45] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rôle</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full bg-[#161a2e] border border-[#262b45] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Opérateur Scan">Opérateur Scan</option>
                    <option value="Responsable Logistique">Resp. Logistique</option>
                    <option value="Comptoir & Location">Comptoir & Location</option>
                    <option value="Administrateur">Administrateur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Code PIN Kiosk</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="1234"
                    className="w-full bg-[#161a2e] border border-[#262b45] rounded-xl px-3 py-2 text-xs text-white font-mono text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mot de passe temporaire</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#161a2e] border border-[#262b45] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1c2138] hover:bg-[#252c4a] text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  Créer l'utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
