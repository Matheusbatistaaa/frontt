import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Activity,
  Camera,
  CameraOff,
  AlertTriangle,
  Loader2,
  Terminal,
  BedSingle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TopBar } from "../../shared/components";
import { Bed } from "../../types";
import { tremorEvents, moodMeta, clinicalData, vitalsData, beds as mockBeds } from "../../config/mockData";
import { useSinaisVitais, useExpressoes, useInternacoes } from "../../hooks";
import { infoIAStyles as styles } from "./InfoIA.styles";
import { COLORS } from "../../config/colors";
import { detectEmotion, captureFrame, dataUrlToBase64 } from "../../lib/detection";
import { TestAiModal } from "../../components/modals/TestAiModal";
import { InfoIAProps } from "./info-ia.types";

type CameraState = "idle" | "starting" | "active" | "error";

export const InfoIA: React.FC<InfoIAProps> = ({ bed, onBack, onSelectBed }) => {
  const [currentBed, setCurrentBed] = useState<Bed>(bed);

  const { data: internacoes = [] } = useInternacoes();

  const availableBeds = useMemo(() => {
    if (internacoes && internacoes.length > 0) {
      const dbBeds = internacoes.map((int: any) => ({
        id: String(int.leito?.numero ?? "??"),
        internacaoId: String(int.id),
        name: int.paciente?.nome || "Desconhecido",
        hr: 78,
        hrSeries: [72, 75, 76, 78, 80, 78],
        mood: "neutro" as import("../../types").MoodType,
        conf: 90,
        risk: (int.risco || "normal") as import("../../types").RiskLevel,
        acordado: true,
        ts: "agora",
        status: (int.ativo ? "internado" : "alta") as import("../../types").PatientStatus,
      }));
      if (!dbBeds.some((b) => b.id === currentBed.id)) {
        return [currentBed, ...dbBeds];
      }
      return dbBeds;
    }
    return mockBeds;
  }, [internacoes, currentBed]);

  useEffect(() => {
    setCurrentBed(bed);
  }, [bed]);

  const { data: vitals = [] } = useSinaisVitais(currentBed.internacaoId);
  const { data: expressions = [] } = useExpressoes(currentBed.internacaoId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cameraError, setCameraError] = useState<string>("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [detectedConf, setDetectedConf] = useState<number>(0);
  const [, setLastDetectionTs] = useState<string>("");
  const [showTestAiModal, setShowTestAiModal] = useState(false);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
    setIsDetecting(false);
    setDetectedEmotion(null);
    setDetectedConf(0);
  }, []);

  const handleSwitchBed = (newBed: Bed) => {
    if (cameraState === "active" || cameraState === "starting") {
      stopCamera();
    }
    setCurrentBed(newBed);
    onSelectBed?.(newBed);
  };

  const handlePrevBed = () => {
    const currentIndex = availableBeds.findIndex((b) => b.id === currentBed.id);
    if (currentIndex <= 0) {
      handleSwitchBed(availableBeds[availableBeds.length - 1]!);
    } else {
      handleSwitchBed(availableBeds[currentIndex - 1]!);
    }
  };

  const handleNextBed = () => {
    const currentIndex = availableBeds.findIndex((b) => b.id === currentBed.id);
    if (currentIndex < 0 || currentIndex >= availableBeds.length - 1) {
      handleSwitchBed(availableBeds[0]!);
    } else {
      handleSwitchBed(availableBeds[currentIndex + 1]!);
    }
  };

  const runDetection = useCallback(async () => {
    if (!videoRef.current || !currentBed.internacaoId || isDetecting) return;
    const video = videoRef.current;
    if (video.readyState < 2) return;

    try {
      setIsDetecting(true);
      const dataUrl = await captureFrame(video);
      const base64 = dataUrlToBase64(dataUrl);
      const result = await detectEmotion(base64, currentBed.internacaoId);
      setDetectedEmotion(result.Emotion);
      setDetectedConf(Math.round(result.Confidence * 100));
      setLastDetectionTs(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    } catch {} finally {
      setIsDetecting(false);
    }
  }, [currentBed.internacaoId, isDetecting]);

  const startCamera = useCallback(async () => {
    setCameraError("");
    setCameraState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");
      intervalRef.current = setInterval(runDetection, 3000);
    } catch (err: any) {
      setCameraState("error");
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Permissão de câmera negada."
          : "Não foi possível acessar a câmera."
      );
    }
  }, [runDetection]);

  const liveMood = detectedEmotion
    ? (moodMeta[detectedEmotion] ?? moodMeta["neutro"]!)
    : null;
  const LiveMoodIcon = liveMood?.icon ?? null;

  // Com a câmera ativa, o card mostra o resultado da IA em tempo real. O histórico do
  // Supabase só entra quando não há detecção ao vivo (ex.: gravação indisponível).
  const latestDbMood = expressions[0]?.mood;
  const mood = liveMood ?? moodMeta[latestDbMood ?? currentBed.mood] ?? moodMeta["neutro"]!;
  const MoodIcon = mood.icon;
  const currentConf = detectedEmotion
    ? detectedConf
    : expressions[0]?.confianca
      ? Math.round(expressions[0].confianca * 100)
      : currentBed.conf;

  const vitalsChartData = vitals.length > 0
    ? vitals.map((v) => ({
        t: new Date(v.registrado_em).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        hr: v.hr ?? 0,
        spo2: v.spo2 ?? 0,
      }))
    : vitalsData;

  const clinical = clinicalData[currentBed.id] ?? {
    idade: 0,
    internacao: "Desconhecida",
    diagnostico: "Sem dados",
    medico: "Sem Médico",
    spo2: 0,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <TopBar
        title={`${currentBed.name} (Leito ${currentBed.id})`}
        subtitle="Análise IA e histórico clínico"
        onBack={onBack}
      />

      <div
        className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-white border-b shrink-0"
        style={{ borderColor: COLORS.line }}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <BedSingle size={16} color={COLORS.orange} />
            <span className="hidden sm:inline">Trocar Leito:</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevBed}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border rounded hover:bg-slate-50 text-slate-600 transition-colors"
              title="Leito anterior"
              style={{ borderColor: COLORS.line }}
            >
              <ChevronLeft size={15} />
            </button>

            <select
              value={currentBed.id}
              onChange={(e) => {
                const selected = availableBeds.find((b) => b.id === e.target.value);
                if (selected) handleSwitchBed(selected);
              }}
              className="h-7 sm:h-8 px-2 text-xs sm:text-[13px] font-semibold border rounded bg-white text-slate-800 outline-none cursor-pointer hover:border-slate-400 transition-colors max-w-[190px] sm:max-w-[260px] truncate"
              style={{ borderColor: COLORS.line }}
            >
              {availableBeds.map((b) => (
                <option key={b.id} value={b.id}>
                  Leito {b.id} — {b.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextBed}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border rounded hover:bg-slate-50 text-slate-600 transition-colors"
              title="Próximo leito"
              style={{ borderColor: COLORS.line }}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <span
            className="px-2 py-0.5 rounded text-[11px] font-semibold capitalize"
            style={{
              background:
                currentBed.risk === "critical"
                  ? `${COLORS.red}18`
                  : currentBed.risk === "attention"
                  ? `${COLORS.orange}18`
                  : `${COLORS.green}18`,
              color:
                currentBed.risk === "critical"
                  ? COLORS.red
                  : currentBed.risk === "attention"
                  ? COLORS.orange
                  : COLORS.green,
            }}
          >
            {currentBed.risk === "critical"
              ? "Crítico"
              : currentBed.risk === "attention"
              ? "Atenção"
              : "Estável"}
          </span>
        </div>

        <button
          onClick={() => setShowTestAiModal(true)}
          className="h-7 sm:h-8 px-3 text-xs sm:text-[12.5px] font-semibold rounded flex items-center gap-1.5 text-white transition-opacity hover:opacity-90 ml-auto"
          style={{ background: COLORS.orange }}
          title="Testar IA com imagem"
        >
          <Terminal size={13} />
          Testar IA
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6 px-3 sm:px-6 md:px-8 py-4 sm:py-7 overflow-y-auto lg:overflow-hidden">
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white border p-3.5 sm:p-4" style={styles.card}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs" style={styles.patientInfoLabel}>
                  Idade: {clinical.idade} | Internação: {clinical.internacao}
                </p>
                <p className="font-semibold text-xs sm:text-sm" style={styles.patientInfoTitle}>
                  {clinical.diagnostico}
                </p>
                <p className="text-xs mt-1" style={styles.patientInfoLabel}>
                  Médico: {clinical.medico}
                </p>
              </div>
              <div className="flex items-center gap-2 p-2 sm:p-3" style={styles.moodBox}>
                <MoodIcon size={16} color={mood.color} />
                <span className="text-[11px] sm:text-xs font-semibold" style={styles.moodText}>
                  {mood.label} ({currentConf}%)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border p-3.5 sm:p-4" style={styles.card}>
            <p className="kicker mb-3 text-xs" style={styles.chartTitle}>
              Sinais Vitais (24h)
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={vitalsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} />
                <XAxis dataKey="t" stroke={styles.chartAxis} style={{ fontSize: 11 }} />
                <YAxis stroke={styles.chartAxis} style={{ fontSize: 11 }} />
                <Tooltip contentStyle={styles.chartTooltip} />
                <Line
                  type="monotone"
                  dataKey="hr"
                  stroke={styles.chartLineHr}
                  name="FC"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="spo2"
                  stroke={styles.chartLineSpo2}
                  name="SpO2"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border p-3.5 sm:p-4" style={styles.card}>
            <p className="kicker mb-3 text-xs" style={styles.chartTitle}>
              Eventos Neurológicos
            </p>
            <div className="space-y-2">
              {tremorEvents.map((evt, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2"
                  style={styles.eventRow}
                >
                  <Activity size={14} color={styles.eventIconColor} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={styles.eventTitle}>
                      {evt.tipo}
                    </p>
                    <p className="text-[11px]" style={styles.eventTime}>
                      {evt.t}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white border p-3.5 sm:p-4 flex flex-col gap-3" style={styles.card}>
            <div className="flex items-center justify-between">
              <p className="kicker text-xs" style={styles.chartTitle}>
                Monitoramento em Tempo Real
              </p>
              <div className="flex items-center gap-1.5">
                {cameraState === "active" && (
                  <>
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: COLORS.orange }}
                    />
                    <span className="text-[11px] font-semibold" style={{ color: COLORS.orange }}>
                      AO VIVO
                    </span>
                  </>
                )}
                {cameraState === "starting" && (
                  <span className="text-[11px]" style={{ color: COLORS.orange }}>
                    Iniciando…
                  </span>
                )}
                {cameraState === "idle" && (
                  <span className="text-[11px]" style={styles.patientInfoLabel}>
                    Câmera inativa
                  </span>
                )}
                {cameraState === "error" && (
                  <span className="text-[11px] font-semibold" style={{ color: COLORS.red }}>
                    Erro
                  </span>
                )}
              </div>
            </div>

            <div
              className="relative w-full overflow-hidden flex items-center justify-center rounded"
              style={{ aspectRatio: "4/3", minHeight: 180, background: COLORS.orangePainel }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  display: cameraState === "active" ? "block" : "none",
                  transform: "scaleX(-1)",
                }}
              />

              {cameraState !== "active" && (
                <div className="flex flex-col items-center gap-2" style={{ color: COLORS.orangeSoft }}>
                  {cameraState === "starting" ? (
                    <Loader2 size={28} className="animate-spin" />
                  ) : cameraState === "error" ? (
                    <AlertTriangle size={28} color={COLORS.red} />
                  ) : (
                    <CameraOff size={28} />
                  )}
                  <span className="text-xs text-center px-4">
                    {cameraState === "error"
                      ? cameraError
                      : cameraState === "starting"
                      ? "Acessando câmera…"
                      : "Câmera desligada"}
                  </span>
                </div>
              )}

              {cameraState === "active" && isDetecting && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
                  <Loader2 size={12} color="white" className="animate-spin" />
                  <span className="text-[10px] text-white">Analisando…</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {cameraState === "idle" || cameraState === "error" ? (
                <button
                  onClick={startCamera}
                  className="flex-1 py-2 sm:py-2.5 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: COLORS.orange }}
                >
                  <Camera size={15} /> Ligar Câmera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex-1 py-2 sm:py-2.5 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border transition-colors hover:bg-black/5"
                  style={{ borderColor: COLORS.line, color: COLORS.ink }}
                >
                  <CameraOff size={15} /> Desligar Câmera
                </button>
              )}
            </div>

            {liveMood && LiveMoodIcon && (
              <div
                className="flex items-center gap-2 p-2.5 sm:p-3 border border-l-4"
                style={{
                  background: COLORS.bg,
                  borderLeftColor: liveMood.color,
                }}
              >
                <LiveMoodIcon size={18} color={liveMood.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold" style={{ color: COLORS.ink }}>
                    IA Detectou: {liveMood.label}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTestAiModal && (
        <TestAiModal open={showTestAiModal} onClose={() => setShowTestAiModal(false)} />
      )}
    </div>
  );
};
