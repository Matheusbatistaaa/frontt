import React, { useState, useRef, useCallback } from "react";
import { X, Camera, CameraOff, Loader2, Trash2, Terminal } from "lucide-react";
import { COLORS } from "../../config/colors";
import { testAi, dataUrlToBase64, captureFrame } from "../../lib/detection";
import { moodMeta } from "../../config/mockData";
import { MoodType } from "../../types";

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
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            setTimeout(() => {
              video.play().then(resolve).catch(reject);
            }, 100);
          };
          const onError = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video load failed'));
          };
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
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
    if (!videoRef.current || isTesting) return;

    try {
      setIsTesting(true);
      addLog("Capturando frame...");
      const dataUrl = await captureFrame(videoRef.current);
      const base64 = dataUrlToBase64(dataUrl);
      setCapturedImage(base64);

      addLog("Enviando para /api/detection/test-frame...");
      const result = await testAi(base64);

      setTestResult(result);
      addLog(`Resultado: ${result.estadoFisiologico} | ${result.estadoEmocional ?? "N/A"}`);
    } catch (err: any) {
      addLog(`Erro no teste: ${err?.message || err}`);
    } finally {
      setIsTesting(false);
    }
  }, [addLog, isTesting]);

  const clearResult = useCallback(() => {
    setTestResult(null);
    setCapturedImage(null);
    setLogs([]);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-[900px] max-w-[95vw] max-h-[90vh] bg-white overflow-y-auto flex flex-col" style={{ borderRadius: 12 }}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b shrink-0" style={{ borderColor: COLORS.line }}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 rounded" style={{ background: `${COLORS.orange}18` }}>
              <Terminal size={18} color={COLORS.orange} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-base sm:text-lg truncate" style={{ color: COLORS.ink }}>Testar IA</p>
              <p className="text-[11px] sm:text-xs truncate" style={{ color: COLORS.slate }}>Capture uma imagem e veja a análise completa</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 p-1 shrink-0">
            <X size={18} color={COLORS.slate} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3" style={{ minWidth: 0 }}>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold" style={{ color: COLORS.ink }}>
                {cameraActive ? "Câmera Ativa" : "Câmera Inativa"}
              </span>
              <div className="flex items-center gap-2">
                {cameraActive && (
                  <span className="flex items-center gap-1 text-[11px] sm:text-xs font-medium" style={{ color: COLORS.green }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: COLORS.green }} />
                    AO VIVO
                  </span>
                )}
              </div>
            </div>

            <div
              className="flex-1 relative overflow-hidden rounded-lg flex items-center justify-center"
              style={{ background: COLORS.orangePainel, minHeight: 220 }}
            >
              {!cameraActive && !capturedImage && (
                <div className="text-center p-4" style={{ color: COLORS.orangeSoft }}>
                  <Camera size={40} className="mx-auto mb-2" />
                  <p className="text-xs sm:text-sm">Clique em "Abrir Câmera" para começar</p>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
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
                <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/70 px-2.5 sm:px-3 py-1.5 rounded">
                  <Loader2 size={16} color="white" className="animate-spin" />
                  <span className="text-[11px] sm:text-xs text-white font-medium">Analisando...</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                disabled={isTesting}
                className="flex-1 min-w-[130px] h-9 sm:h-10 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 rounded transition-opacity"
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
                  className="flex-1 min-w-[140px] h-9 sm:h-10 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 rounded transition-opacity"
                  style={{
                    background: '#2563eb',
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
                  className="h-9 sm:h-10 px-3 sm:px-4 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 rounded"
                  style={{ background: COLORS.line, color: COLORS.slate }}
                >
                  <Trash2 size={16} /> Novo
                </button>
              )}
            </div>

            {cameraError && (
              <p className="text-xs text-center break-words" style={{ color: COLORS.red }}>{cameraError}</p>
            )}
          </div>

          <div className="w-full md:w-[360px] flex flex-col border-t md:border-t-0 md:border-l p-3 sm:p-4 gap-3 overflow-y-auto" style={{ borderColor: COLORS.line }}>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold" style={{ color: COLORS.ink }}>Resultado</span>
              {testResult && (
                <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{
                  background: testResult.estadoFisiologico === "dormindo" ? `${COLORS.red}18` : `${COLORS.orange}18`,
                  color: testResult.estadoFisiologico === "dormindo" ? COLORS.red : COLORS.orange,
                }}>
                  {testResult.estadoFisiologico.toUpperCase()}
                </span>
              )}
            </div>

            {testResult ? (
              <div className="flex flex-col gap-3">
                <div className="p-2.5 sm:p-3 rounded" style={{ background: "#fafafa", border: `1px solid ${COLORS.line}` }}>
                  <p className="text-[11px] font-semibold mb-1" style={{ color: COLORS.slate }}>Estado Fisiológico</p>
                  <p className="font-semibold text-base sm:text-lg" style={{
                    color: testResult.estadoFisiologico === "dormindo" ? COLORS.red : COLORS.orange,
                  }}>
                    {testResult.estadoFisiologico} ({(testResult.confiancaFisiologica * 100).toFixed(1)}%)
                  </p>
                </div>

                <div className="p-2.5 sm:p-3 rounded" style={{ background: "#fafafa", border: `1px solid ${COLORS.line}` }}>
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
                        <span className="font-semibold text-base sm:text-lg" style={{ color: moodMeta[testResult.estadoEmocional! as MoodType]?.color || COLORS.orange }}>
                          {moodMeta[testResult.estadoEmocional! as MoodType]?.label || testResult.estadoEmocional}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm" style={{ color: COLORS.slate }}>
                        Confiança: {(testResult.confiancaEmocional! * 100).toFixed(1)}%
                      </p>
                    </>
                  ) : (
                    <p className="text-xs sm:text-sm" style={{ color: COLORS.slate }}>N/A (dormindo)</p>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold mb-2" style={{ color: COLORS.slate }}>Todas as Probabilidades</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {Object.entries(testResult.allProbabilities)
                      .sort(([, a], [, b]) => b - a)
                      .map(([key, value]) => {
                        const m = moodMeta[key as MoodType];
                        return (
                          <div key={key} className="flex items-center justify-between text-xs px-2 py-1.5 rounded" style={{ background: "#f5f5f5" }}>
                            <span style={{ color: m?.color || COLORS.ink, fontWeight: 600 }}>
                              {m?.label || key}
                            </span>
                            <span className="font-mono text-[11px]" style={{ color: COLORS.slate }}>{(value * 100).toFixed(1)}%</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 flex items-center justify-center text-center" style={{ color: COLORS.slate }}>
                <p className="text-xs sm:text-sm">Capture uma imagem para ver o resultado</p>
              </div>
            )}

            <div className="border-t pt-3" style={{ borderColor: COLORS.line }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: COLORS.slate }}>Logs</span>
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{ background: COLORS.line, color: COLORS.slate }}
                  >
                    Limpar
                  </button>
                )}
              </div>
              <div className="h-32 sm:h-44 overflow-y-auto font-mono text-[10px] p-2 sm:p-3 rounded" style={{ background: "#0d1117", color: "#e6edf3" }}>
                {logs.length === 0 ? (
                  <div className="text-center" style={{ color: "#8b949e" }}>
                    Nenhum log ainda
                  </div>
                ) : (
                  <div className="space-y-1">
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
