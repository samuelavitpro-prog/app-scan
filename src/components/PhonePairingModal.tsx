import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Smartphone, X, Check, Copy, ExternalLink, Sparkles } from "lucide-react";

interface PhonePairingModalProps {
  onClose: () => void;
  onSimulateMobile: () => void;
}

export const PhonePairingModal: React.FC<PhonePairingModalProps> = ({
  onClose,
  onSimulateMobile,
}) => {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    // Generate QR with URL with mobile parameter
    const mobileLink = `${currentUrl.split("?")[0]}?mode=mobile`;
    QRCode.toDataURL(mobileLink, {
      width: 280,
      margin: 1.5,
      color: {
        dark: "#1e1b4b",
        light: "#ffffff",
      },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error(err));
  }, [currentUrl]);

  const copyLink = () => {
    const mobileLink = `${currentUrl.split("?")[0]}?mode=mobile`;
    navigator.clipboard.writeText(mobileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="phone-pairing-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e111d] border border-[#1e233b] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e233b]">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <span className="text-slate-100">Connecter un Smartphone / Scanner</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#161b2e] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center">
          <div className="p-3.5 bg-white rounded-2xl border border-[#1e233b] shadow-xl">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Pairing" className="w-52 h-52 object-contain" />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
                Génération...
              </div>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-200 mt-4">
            Scannez ce QR Code avec l'appareil photo de votre smartphone
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mt-1">
            L'interface mobile s'ouvrira avec la caméra prête pour l'analyse IA et la synchronisation en temps réel.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="flex-1 py-2.5 px-3 rounded-xl border border-[#1e233b] bg-[#161b2e] hover:bg-[#202742] text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Lien copié !" : "Copier le lien"}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onSimulateMobile();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Smartphone className="w-4 h-4" />
              Basculer en Mode Mobile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
