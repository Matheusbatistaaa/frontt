import React, { useState, useRef, useCallback } from "react";
import { X, Camera, CameraOff, Loader2, Image, Trash2, Terminal } from "lucide-react";
import { COLORS } from "../../config/colors";
import { testAi, dataUrlToBase64, captureFrame } from "../../lib/detection";
import { moodMeta, MoodType } from "../../config/mockData";

interface TestAiModalProps {
  open: boolean;
  onClose: () => void;
}

export const TestAiModal: React.FC<TestAiModalProps> = ({ open, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    estadoFisiologico: string;
    confiancaFisiologica: number;
    estadoEmocional: string | null;
    confiancaEmocional: number | null;
    allProbabilities: Record<string, number>;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: "user"
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for metadata to load, then play - handles mobile "play() interrupted" error
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            // Small delay to ensure video is ready on mobile
            setTimeout(() => {
              video.play().then(resolve).catch(reject);
            }, 100);
          };
          const onError = (e: Event) => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video load failed'));
          };
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          // Fallback timeout
          setTimeout(() => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          }, 5000);
        });
      }
      setCameraActive(true);
      addLog("Câmera iniciada");
    } catch (err: any) {
      const msg =
        err?.name === "NotAllowedError"
          ? "Permissão de câmera negada. Permita acesso nas configurações do navegador."
          : err?.name === "NotFoundError"
          ? "Nenhuma câmera encontrada"
          : err?.name === "NotReadableError"
          ? "Câmera em uso por outro app"
          : err?.name === "AbortError"
          ? "Reprodução interrompida. Tente novamente."
          : "Erro ao acessar câmera: " + (err?.message || err?.name);
      setCameraError(msg);
      addLog(`Erro: ${msg}`);
    }
  }, [addLog]);

  const captureAndTest = useCallback(async () => {
    if (!videoRef.current || !cameraActive || isTesting) return;
    const video = videoRef.current;

    // Wait for video to be ready on mobile
    if (video.readyState < 2) {
      addLog("Aguardando vídeo carregar...");
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (video.readyState >= 2) {
            video.removeEventListener('canplay', checkReady);
            resolve();
          }
        };
        video.addEventListener('canplay', checkReady);
        // Timeout after 3 seconds
        setTimeout(() => {
          video.removeEventListener('canplay', checkReady);
          resolve();
        }, 3000);
      });
    }

    if (video.readyState < 2) {
      addLog("Vídeo não está pronto, tente novamente");
      return;
    }

    setIsTesting(true);
    addLog("Capturando frame...");

    try {
      const dataUrl = await captureFrame(video);
      const base64 = dataUrlToBase64(dataUrl);
      setCapturedImage(base64);
      addLog("Frame capturado, enviando para IA...");

      const result = await testAi(base64);
      setTestResult(result);
      addLog(`Resultado: ${result.estadoFisiologico} (${(result.confiancaFisiologica * 100).toFixed(1)}%)`);
      if (result.estadoEmocional) {
        addLog(`Emoção: ${result.estadoEmocional} (${(result.confiancaEmocional! * 100).toFixed(1)}%)`);
      }
    } catch (err: any) {
      addLog(`Erro no teste: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  }, [cameraActive, isTesting, addLog]);

  const clearResult = useCallback(() => {
    setTestResult(null);
    setCapturedImage(null);
    setLogs([]);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-[900px] max-w-[95vw] max-h-[90vh] bg-white overflow-hidden flex flex-col" style={{ borderRadius: 12 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: COLORS.line }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: `${COLORS.orange}18` }}>
              <Terminal size={20} color={COLORS.orange} />
            </div>
            <div>
              <p className="font-semibold text-lg" style={{ color: COLORS.ink }}>Testar IA</p>
              <p className="text-xs" style={{ color: COLORS.slate }}>Capture uma imagem e veja a análise completa</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100">
            <X size={18} color={COLORS.slate} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Camera & Capture */}
          <div className="flex-1 flex flex-col p-4 gap-3" style={{ minWidth: 0 }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                {cameraActive ? "Câmera Ativa" : "Câmera Inativa"}
              </span>
              <div className="flex items-center gap-2">
                {cameraActive && (
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: COLORS.green }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: COLORS.green }} />
                    AO VIVO
                  </span>
                )}
              </div>
            </div>

            <div
              className="flex-1 relative overflow-hidden rounded-lg flex items-center justify-center"
              style={{ background: COLORS.orangePainel, minHeight: 300 }}
            >
              {!cameraActive && !capturedImage && (
                <div className="text-center" style={{ color: COLORS.orangeSoft }}>
                  <Camera size={48} className="mx-auto mb-2" />
                  <p className="text-sm">Clique em "Abrir Câmera" para começar</p>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                webkit-playsinline="true"
                className={`w-full h-full object-cover ${cameraActive && !capturedImage ? "block" : "hidden"}`}
                style={{ transform: "scaleX(-1)" }}
              />

              {capturedImage && (
                <img
                  src={`data:image/jpeg;base64,${capturedImage}`}
                  alt="Captura"
                  className="w-full h-full object-cover"
                />
              )}

              {cameraActive && isTesting && (
                <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded">
                  <Loader2 size={16} color="white" className="animate-spin" />
                  <span className="text-xs text-white font-medium">Analisando...</span>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex gap-3">
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                disabled={isTesting}
                className="flex-1 h-10 font-semibold text-sm flex items-center justify-center gap-2 rounded"
                style={{
                  background: cameraActive ? COLORS.redSoft : COLORS.orange,
                  color: cameraActive ? COLORS.red : COLORS.card,
                  opacity: isTesting ? 0.5 : 1,
                }}
              >
                {cameraActive ? (
                  <> <CameraOff size={16} /> Fechar Câmera </>
                ) : (
                  <> <Camera size={16} /> Abrir Câmera </>
                )}
              </button>

              {cameraActive && !capturedImage && (
                <button
                  onClick={captureAndTest}
                  disabled={isTesting}
                  className="flex-1 h-10 font-semibold text-sm flex items-center justify-center gap-2 rounded"
                  style={{
                    background: COLORS.blue,
                    color: COLORS.card,
                    opacity: isTesting ? 0.5 : 1,
                  }}
                >
                  <Camera size={16} /> Capturar e Testar
                </button>
              )}

              {capturedImage && !isTesting && (
                <button
                  onClick={clearResult}
                  className="h-10 px-4 font-semibold text-sm flex items-center justify-center gap-2 rounded"
                  style={{ background: COLORS.graySoft, color: COLORS.slate }}
                >
                  <Trash2 size={16} /> Novo
                </button>
              )}
            </div>

            {cameraError && (
              <p className="text-xs text-center" style={{ color: COLORS.red }}>{cameraError}</p>
            )}
          </div>

          {/* Right: Results & Logs */}
          <div className="w-[380px] flex flex-col border-l p-4 gap-3 overflow-y-auto" style={{ borderColor: COLORS.line, minWidth: 340 }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: COLORS.ink }}>Resultado</span>
              {testResult && (
                <span className="text-xs px-2 py-0.5 rounded" style={{
                  background: testResult.estadoFisiologico === "dormindo" ? `${COLORS.red}18` : `${COLORS.orange}18`,
                  color: testResult.estadoFisiologico === "dormindo" ? COLORS.red : COLORS.orange,
                }}>
                  {testResult.estadoFisiologico.toUpperCase()}
                </span>
              )}
            </div>

            {testResult ? (
              <div className="flex flex-col gap-3">
                {/* Physiological */}
                <div className="p-3 rounded" style={{ background: "#fafafa", border: `1px solid ${COLORS.line}` }}>
                  <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.slate }}>Estado Fisiológico</p>
                  <p className="font-semibold text-lg" style={{
                    color: testResult.estadoFisiologico === "dormindo" ? COLORS.red : COLORS.orange,
                  }}>
                    {testResult.estadoFisiologico} ({(testResult.confiancaFisiologica * 100).toFixed(1)}%)
                  </p>
                </div>

                {/* Emotional */}
                <div className="p-3 rounded" style={{ background: "#fafafa", border: `1px solid ${COLORS.line}` }}>
                  <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.slate }}>Estado Emocional</p>
                  {testResult.estadoEmocional ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        {(() => {
                          const m = moodMeta[testResult.estadoEmocional! as MoodType];
                          if (!m) return null;
                          const Icon = m.icon;
                          return (
                            <Icon size={20} color={m.color} />
                          );
                        })()}
                        <span className="font-semibold text-lg" style={{ color: moodMeta[testResult.estadoEmocional! as MoodType]?.color || COLORS.orange }}>
                          {moodMeta[testResult.estadoEmocional! as MoodType]?.label || testResult.estadoEmocional}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: COLORS.slate }}>
                        Confiança: {(testResult.confiancaEmocional! * 100).toFixed(1)}%
                      </p>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: COLORS.slate }}>N/A (dormindo)</p>
                  )}
                </div>

                {/* All Probabilities */}
                <div>
                  <p className="text-[11px] font-semibold mb-2" style={{ color: COLORS.slate }}>Todas as Probabilidades</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {Object.entries(testResult.allProbabilities)
                      .sort(([, a], [, b]) => b - a)
                      .map(([key, value]) => {
                        const m = moodMeta[key as MoodType];
                        return (
                          <div key={key} className="flex items-center justify-between text-xs px-2 py-1.5 rounded" style={{ background: "#f5f5f5" }}>
                            <span style={{ color: m?.color || COLORS.ink, fontWeight: 600 }}>
                              {m?.label || key}
                            </span>
                            <span className="font-mono" style={{ color: COLORS.slate }}>{(value * 100).toFixed(1)}%</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center" style={{ color: COLORS.slate }}>
                <p className="text-sm">Capture uma imagem para ver o resultado</p>
              </div>
            )}

            {/* Logs */}
            <div className="border-t pt-3" style={{ borderColor: COLORS.line }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: COLORS.slate }}>Logs</span>
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{ background: COLORS.graySoft, color: COLORS.slate }}
                  >
                    Limpar
                  </button>
                )}
              </div>
              <div className="h-48 overflow-y-auto font-mono text-[10px]" style={{ background: "#0d1117", borderRadius: 6, color: "#e6edf3" }}>
                {logs.length === 0 ? (
                  <div className="p-3 text-center" style={{ color: "#8b949e" }}>
                    Nenhum log ainda
                  </div>
                ) : (
                  <div className="p-3 space-y-1">
                    {logs.map((log, i) => (
                      <div key={i} style={{ borderBottom: "1px solid #21262d", paddingBottom: 2 }}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};