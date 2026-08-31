import React, { useRef, useState, useEffect } from "react";
import {
  PenTool,
  RotateCcw,
  CheckCircle2,
  X,
  Smartphone,
  UserCheck,
  ShieldCheck,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { ClientQuote, DocumentSignature } from "../types";

export type SignatureTargetType =
  | "client_departure"
  | "operator_departure"
  | "client_return"
  | "operator_return";

interface SignaturePadModalProps {
  quote: ClientQuote;
  defaultTarget?: SignatureTargetType;
  onSaveSignature: (
    quoteId: string,
    signature: DocumentSignature,
    target: SignatureTargetType
  ) => Promise<boolean> | void;
  onClose: () => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  quote,
  defaultTarget = "client_departure",
  onSaveSignature,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [target, setTarget] = useState<SignatureTargetType>(defaultTarget);

  // Form fields
  const [signerName, setSignerName] = useState<string>(() => {
    if (defaultTarget.includes("operator")) {
      return "Responsable Dépôt / Opérateur Logistique";
    }
    return (
      quote.deliveryContactName ||
      quote.clientName ||
      quote.clientCompany ||
      "Client Réceptionnaire"
    );
  });

  const [signerRole, setSignerRole] = useState<string>(() => {
    if (defaultTarget.includes("operator")) {
      return "Chef de Dépôt / Contrôleur Qualité";
    }
    return defaultTarget.includes("departure")
      ? "Preneur / Mandataire / Chauffeur"
      : "Client / Restituant";
  });

  const [validationMethod, setValidationMethod] = useState<
    "touch_screen" | "paper_printed_verified"
  >("touch_screen");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize defaults when target changes
  const handleTargetChange = (newTarget: SignatureTargetType) => {
    setTarget(newTarget);
    if (newTarget.includes("operator")) {
      setSignerName("Responsable Dépôt / Opérateur");
      setSignerRole("Chef de Dépôt / Contrôleur Stock");
    } else {
      setSignerName(
        quote.deliveryContactName ||
          quote.clientName ||
          quote.clientCompany ||
          "Client Réceptionnaire"
      );
      setSignerRole(
        newTarget.includes("departure")
          ? "Preneur / Mandataire / Chauffeur"
          : "Client / Restituant"
      );
    }
    handleClearCanvas();
  };

  // Canvas Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high resolution for canvas
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = "#1e293b"; // Deep slate / navy ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleStartDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (validationMethod === "paper_printed_verified") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const handleDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || validationMethod === "paper_printed_verified") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
  };

  const handleSave = async () => {
    if (!signerName.trim()) {
      alert("Veuillez renseigner le nom du signataire.");
      return;
    }

    if (validationMethod === "touch_screen" && !hasDrawn) {
      alert("Veuillez apposer votre signature sur l'écran tactile ou choisir la validation opérateur.");
      return;
    }

    setIsSubmitting(true);
    try {
      let signatureDataUrl: string | undefined = undefined;
      if (validationMethod === "touch_screen" && canvasRef.current) {
        signatureDataUrl = canvasRef.current.toDataURL("image/png");
      }

      const signatureObject: DocumentSignature = {
        signatureDataUrl,
        signerName: signerName.trim(),
        signerRole: signerRole.trim() || undefined,
        signedAt: new Date().toISOString(),
        isOperatorValidated: target.includes("operator") || validationMethod === "paper_printed_verified",
        validationMethod: validationMethod === "touch_screen" ? "touch_screen" : "paper_printed_verified",
      };

      await onSaveSignature(quote.id, signatureObject, target);
      onClose();
    } catch (err) {
      console.error("Error saving signature:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if target already has a signature in quote
  const existingSignature =
    target === "client_departure"
      ? quote.departureSignature
      : target === "operator_departure"
      ? quote.operatorDepartureSignature
      : target === "client_return"
      ? quote.returnSignature
      : quote.operatorReturnSignature;

  return (
    <div
      id="modal-signature-pad"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-[#0e111d] text-white border border-[#232a48] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-[#121626] border-b border-[#1e243d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Émargement & Signature Mobile</h3>
              <p className="text-[11px] text-slate-400 font-mono">Dossier : {quote.quoteNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-[#1b213b] hover:bg-[#252e52] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Selectors */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-400">
              Type d'émargement / Bon ciblé :
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTargetChange("client_departure")}
                className={`p-2.5 rounded-xl text-xs font-bold text-left border flex items-center gap-2 transition ${
                  target === "client_departure"
                    ? "bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm"
                    : "bg-[#161b2e] text-slate-400 border-[#242c4b] hover:text-slate-200"
                }`}
              >
                <Smartphone className="w-4 h-4 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs">Client - Départ</div>
                  <div className="text-[10px] opacity-70 font-normal">BL / Location</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTargetChange("client_return")}
                className={`p-2.5 rounded-xl text-xs font-bold text-left border flex items-center gap-2 transition ${
                  target === "client_return"
                    ? "bg-emerald-600/20 text-emerald-300 border-emerald-500 shadow-sm"
                    : "bg-[#161b2e] text-slate-400 border-[#242c4b] hover:text-slate-200"
                }`}
              >
                <FileCheck className="w-4 h-4 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs">Client - Retour</div>
                  <div className="text-[10px] opacity-70 font-normal">Bon de Retour</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTargetChange("operator_departure")}
                className={`p-2.5 rounded-xl text-xs font-bold text-left border flex items-center gap-2 transition ${
                  target === "operator_departure"
                    ? "bg-blue-600/20 text-blue-300 border-blue-500 shadow-sm"
                    : "bg-[#161b2e] text-slate-400 border-[#242c4b] hover:text-slate-200"
                }`}
              >
                <UserCheck className="w-4 h-4 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs">Opérateur - Sortie</div>
                  <div className="text-[10px] opacity-70 font-normal">Validation Dépôt</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTargetChange("operator_return")}
                className={`p-2.5 rounded-xl text-xs font-bold text-left border flex items-center gap-2 transition ${
                  target === "operator_return"
                    ? "bg-cyan-600/20 text-cyan-300 border-cyan-500 shadow-sm"
                    : "bg-[#161b2e] text-slate-400 border-[#242c4b] hover:text-slate-200"
                }`}
              >
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-xs">Opérateur - Réception</div>
                  <div className="text-[10px] opacity-70 font-normal">Contrôle retour</div>
                </div>
              </button>
            </div>
          </div>

          {/* Validation Mode Selector */}
          <div className="flex items-center gap-3 p-1 bg-[#14182b] border border-[#242b4a] rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setValidationMethod("touch_screen")}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                validationMethod === "touch_screen"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Tracé tactile (Doigt/Stylet)</span>
            </button>
            <button
              type="button"
              onClick={() => setValidationMethod("paper_printed_verified")}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                validationMethod === "paper_printed_verified"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Validation papier imprimé</span>
            </button>
          </div>

          {/* Signer inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                Nom & Prénom du Signataire *
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full bg-[#161b2e] border border-[#242c4b] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Alexandre Dupont"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Qualité / Rôle</label>
              <input
                type="text"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                className="w-full bg-[#161b2e] border border-[#242c4b] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Mandataire / Chauffeur"
              />
            </div>
          </div>

          {/* Touch Canvas Pad */}
          {validationMethod === "touch_screen" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                  Zone de signature tactile :
                </span>
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Effacer</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-white p-2 border-2 border-slate-300 shadow-inner overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleStartDrawing}
                  onMouseMove={handleDraw}
                  onMouseUp={handleStopDrawing}
                  onMouseLeave={handleStopDrawing}
                  onTouchStart={handleStartDrawing}
                  onTouchMove={handleDraw}
                  onTouchEnd={handleStopDrawing}
                  className="w-full h-36 sm:h-44 bg-white touch-none cursor-crosshair rounded-xl block"
                  style={{ touchAction: "none" }}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
                    <Smartphone className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-xs font-semibold">Signez ici avec le doigt ou un stylet</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      (Matériel remis en main propre sans prix apparent)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-indigo-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Validation de retour / départ sur émargement papier imprimé
              </div>
              <p className="text-[11px] text-slate-300">
                Le document papier imprimé (sans affichage de prix) a été paraphé et signé physiquement par le preneur ou le transporteur. Cette validation certifie l'enregistrement dans le système informatique.
              </p>
            </div>
          )}

          {/* Existing signature notice */}
          {existingSignature && (
            <div className="p-3 rounded-xl bg-[#14182b] border border-[#242b4a] flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-white">Signature déjà enregistrée :</span>{" "}
                {existingSignature.signerName} (le{" "}
                {new Date(existingSignature.signedAt).toLocaleDateString("fr-FR")} à{" "}
                {new Date(existingSignature.signedAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                ). En validant, vous remplacerez la signature existante.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#121626] border-t border-[#1e243d] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1c223a] hover:bg-[#252e50] text-slate-300 text-xs font-bold transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? "Enregistrement..." : "Valider & Enregistrer l'Émargement"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
