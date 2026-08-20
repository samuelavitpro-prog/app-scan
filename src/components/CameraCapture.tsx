import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  RefreshCw,
  Upload,
  Sparkles,
  Check,
  X,
  FlipHorizontal,
  Zap,
  ZapOff,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  isAnalyzing: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, isAnalyzing }) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Support paste image from clipboard (Ctrl+V / Command+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Caméra non disponible sur cet appareil. Utilisez l'importation de photo.");
        setCameraActive(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        setCameraActive(true);

        const videoTrack = stream.getVideoTracks()[0];
        trackRef.current = videoTrack;

        // Check if flashlight / torch capability exists
        const capabilities = (videoTrack.getCapabilities && (videoTrack.getCapabilities() as any)) || {};
        if (capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      }
    } catch (err: any) {
      console.warn("Camera init notification:", err);
      setCameraError("Accès caméra non disponible ou refusé. Vous pouvez glisser-déposer ou importer une photo.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    trackRef.current = null;
    setCameraActive(false);
  };

  const toggleTorch = async () => {
    if (!trackRef.current) return;
    try {
      const nextTorch = !torchOn;
      await (trackRef.current as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn("Flashlight control not supported on this device:", err);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPreviewImage(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewImage(result);
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmPhoto = () => {
    if (previewImage) {
      onCapture(previewImage);
    }
  };

  const retakePhoto = () => {
    setPreviewImage(null);
    if (!cameraActive) {
      startCamera();
    }
  };

  return (
    <div id="camera-capture-container" className="flex flex-col items-center w-full">
      {/* Viewfinder Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#0a0c16] border ${
          isDragOver ? "border-indigo-500 ring-2 ring-indigo-500/50" : "border-[#1e233b]"
        } shadow-2xl flex items-center justify-center transition-all`}
      >
        {previewImage ? (
          <div className="relative w-full h-full">
            <img src={previewImage} alt="Aperçu produit à analyser" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute top-3 left-3 bg-emerald-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-md">
              <Check className="w-3.5 h-3.5" /> Cliché capturé
            </div>
            <button
              type="button"
              onClick={retakePhoto}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-md"
              title="Annuler"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />

            {!cameraActive && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 text-center text-slate-300 cursor-pointer hover:opacity-90 transition w-full h-full"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#161b2e] flex items-center justify-center mb-3 text-indigo-400 border border-[#1e233b] shadow-md group-hover:scale-105 transition">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-100">
                  {cameraError ? "Mode Importation Image" : "Démarrage du flux caméra..."}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
                  Cliquez ou glissez-déposez une photo de votre matériel, ou collez une image (Ctrl+V)
                </p>
                <span className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Sélectionner un fichier
                </span>
              </div>
            )}

            {/* Target reticle guides */}
            {cameraActive && (
              <>
                <div className="absolute inset-5 pointer-events-none border border-white/15 rounded-xl">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400 -mt-0.5 -ml-0.5" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400 -mt-0.5 -mr-0.5" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400 -mb-0.5 -ml-0.5" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400 -mb-0.5 -mr-0.5" />
                </div>

                {/* AI Scanning Beam Overlay */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
              </>
            )}
          </>
        )}

        {/* Camera Control Overlays */}
        {cameraActive && !previewImage && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl backdrop-blur-md border transition ${
                  torchOn
                    ? "bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30"
                    : "bg-[#0a0c16]/80 text-white border-[#1e233b] hover:bg-[#161b2e]"
                }`}
                title={torchOn ? "Éteindre le flash" : "Allumer le flash"}
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            <button
              id="switch-camera-btn"
              type="button"
              onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
              className="p-2 rounded-xl bg-[#0a0c16]/80 text-white hover:bg-[#161b2e] transition-colors backdrop-blur-md border border-[#1e233b]"
              title="Changer de caméra (avant/arrière)"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Control Action Bar */}
      <div className="w-full mt-4 flex flex-col gap-2.5">
        {previewImage ? (
          <div className="flex gap-2">
            <button
              id="retake-photo-btn"
              type="button"
              onClick={retakePhoto}
              disabled={isAnalyzing}
              className="flex-1 py-3 px-4 rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-200 font-semibold text-xs hover:bg-[#202742] transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reprendre
            </button>
            <button
              id="analyze-photo-btn"
              type="button"
              onClick={confirmPhoto}
              disabled={isAnalyzing}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              {isAnalyzing ? "Analyse IA Gemini..." : "Analyser ce Matériel"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {cameraActive ? (
              <button
                id="shutter-capture-btn"
                type="button"
                onClick={takeSnapshot}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Camera className="w-4 h-4" />
                Prendre la Photo
              </button>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 py-3 px-4 rounded-xl bg-[#161b2e] border border-[#232842] hover:bg-[#202742] text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-indigo-400" />
                Activer la Caméra
              </button>
            )}

            <button
              id="upload-photo-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-4 rounded-xl border border-[#1e233b] bg-[#161b2e] text-slate-200 hover:bg-[#202742] font-semibold text-xs transition flex items-center gap-1.5"
              title="Importer un fichier image depuis l'appareil"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              Importer Fichier
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
};
