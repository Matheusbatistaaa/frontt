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
import { useSinaisVitais, useExpressoes, useInternacoes } from "../../hooks";
import {
  ExpressaoInfoIA,
  InfoIAInternacao,
  InternacaoMonitorada,
  SinalVitalInfoIA,
  confiancaReal,
  emocaoReal,
  frequenciaCardiacaReal,
  normalizarConfianca,
  numeroReal,
  ordenarPorTimestamp,
  textoReal,
  timestampReal,
  toInternacaoMonitorada,
  ultimoPorTimestamp,
} from "./info-ia.types";
import { getExpressionMeta, infoIAStyles as styles } from "./InfoIA.styles";
import { COLORS } from "../../config/colors";
import { detectEmotion, captureFrame, dataUrlToBase64 } from "../../lib/detection";
import {
  formatDateInBrazil,
  formatTimeInBrazil,
  getDateInBrazil,
  parseTimestamp,
} from "../../lib/dateTime";
import { TestAiModal } from "../../components/modals/TestAiModal";
import { InfoIAProps } from "./info-ia.types";

type CameraState = "idle" | "starting" | "active" | "error";

type VitalsChartPoint = {
  t: string;
  date: string;
  hr: number | null;
  spo2: number | null;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toBed(internacao: InternacaoMonitorada): Bed {
  const paciente = internacao.paciente;

  return {
    id: internacao.numeroLeito,
    pacienteId: internacao.pacienteId,
    leitoId: internacao.leitoId,
    internacaoId: internacao.id,
    name: textoReal(paciente?.nome) ?? "Paciente não identificado",
    hr: 0,
    hrSeries: [],
    mood: "neutro",
    conf: 0,
    risk: internacao.risco ?? "normal",
    acordado: false,
    ts: "",
    status: "internado",
    ficha: {
      cpf: textoReal(paciente?.cpf),
      dataNascimento: textoReal(paciente?.data_nascimento),
      genero: textoReal(paciente?.genero),
      convenio: textoReal(paciente?.convenio),
      telefone: textoReal(paciente?.telefone),
      contatoEmergencia: textoReal(paciente?.contato_emergencia),
      numeroEmergencia: textoReal(paciente?.numero_emergencia),
      alergias: textoReal(paciente?.alergias),
      diagnostico: internacao.diagnosticoPrincipal,
      dataInternacao: internacao.dataInternacao,
      medico: internacao.medicoNome,
      observacoes: internacao.observacoes,
    },
  };
}

function calcularIdade(dataNascimento?: string | null): number | null {
  if (!dataNascimento) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataNascimento);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const birthDate = new Date(Date.UTC(year, month - 1, day));
  if (
    birthDate.getUTCFullYear() !== year ||
    birthDate.getUTCMonth() !== month - 1 ||
    birthDate.getUTCDate() !== day
  ) {
    return null;
  }

  const [currentYear, currentMonth, currentDay] = getDateInBrazil().split("-").map(Number);
  let age = currentYear! - year;
  if (currentMonth! < month || (currentMonth === month && currentDay! < day)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function formatDateTimeInBrazil(value?: string | Date | null): string {
  if (!value) return "Horário não informado";
  const date = value instanceof Date ? value : parseTimestamp(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return `${formatDateInBrazil(date)} ${formatTimeInBrazil(date)}`;
}

export const InfoIA: React.FC<InfoIAProps> = ({ bed, onBack, onSelectBed }) => {
  const {
    data: internacoes = [],
    isLoading,
    isError,
    refetch,
  } = useInternacoes();

  const monitoredInternacoes = useMemo(
    () =>
      (internacoes as InfoIAInternacao[])
        .map(toInternacaoMonitorada)
        .filter((internacao): internacao is InternacaoMonitorada => internacao !== null),
    [internacoes]
  );

  const availableBeds = useMemo(
    () => monitoredInternacoes.map(toBed),
    [monitoredInternacoes]
  );

  const [selectedInternacaoId, setSelectedInternacaoId] = useState<string | null>(
    bed.internacaoId ?? null
  );

  useEffect(() => {
    setSelectedInternacaoId(bed.internacaoId ?? null);
  }, [bed.internacaoId]);

  useEffect(() => {
    if (isLoading) return;
    if (monitoredInternacoes.length === 0) {
      setSelectedInternacaoId(null);
      return;
    }
    if (!monitoredInternacoes.some((internacao) => internacao.id === selectedInternacaoId)) {
      setSelectedInternacaoId(monitoredInternacoes[0]!.id);
    }
  }, [isLoading, monitoredInternacoes, selectedInternacaoId]);

  const currentBed = availableBeds.find((item) => item.internacaoId === selectedInternacaoId) ?? null;
  const currentInternacao =
    monitoredInternacoes.find((internacao) => internacao.id === selectedInternacaoId) ?? null;
  const currentInternacaoId = currentBed?.internacaoId;

  const {
    data: sinaisVitais = [],
    isLoading: isLoadingSinaisVitais,
    isError: isErrorSinaisVitais,
  } = useSinaisVitais(currentInternacaoId);
  const {
    data: expressoesFaciais = [],
    isLoading: isLoadingExpressoes,
    isError: isErrorExpressoes,
  } = useExpressoes(currentInternacaoId);

  const vitals = useMemo(() => sinaisVitais as SinalVitalInfoIA[], [sinaisVitais]);
  const expressions = useMemo(
    () => expressoesFaciais as ExpressaoInfoIA[],
    [expressoesFaciais]
  );
  const sortedVitals = useMemo(() => ordenarPorTimestamp(vitals), [vitals]);
  const sortedExpressions = useMemo(() => ordenarPorTimestamp(expressions), [expressions]);
  const latestDbExpression = ultimoPorTimestamp(sortedExpressions);
  const expressionHistory = useMemo(() => sortedExpressions.slice(-10).reverse(), [sortedExpressions]);

  const vitalsChartData = useMemo<VitalsChartPoint[]>(() => {
    const cutoff = Date.now() - DAY_IN_MS;
    return sortedVitals.flatMap((vital) => {
      const timestamp = timestampReal(vital);
      if (!timestamp) return [];
      const date = parseTimestamp(timestamp);
      if (Number.isNaN(date.getTime()) || date.getTime() < cutoff) return [];

      const hr = frequenciaCardiacaReal(vital);
      const spo2 = numeroReal(vital.spo2);
      if (hr === null && spo2 === null) return [];

      return [
        {
          t: formatTimeInBrazil(date),
          date: formatDateInBrazil(date),
          hr,
          spo2,
        },
      ];
    });
  }, [sortedVitals]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const cameraRequestRef = useRef(0);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cameraError, setCameraError] = useState("");
  const [detectionError, setDetectionError] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [detectedConf, setDetectedConf] = useState<number | null>(null);
  const [lastDetectionTs, setLastDetectionTs] = useState<string | null>(null);
  const [showTestAiModal, setShowTestAiModal] = useState(false);

  const stopCamera = useCallback(() => {
    cameraRequestRef.current += 1;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
    setIsDetecting(false);
    setDetectedEmotion(null);
    setDetectedConf(null);
    setLastDetectionTs(null);
    setDetectionError("");
  }, []);

  const previousInternacaoIdRef = useRef(currentInternacaoId);
  useEffect(() => {
    if (previousInternacaoIdRef.current !== currentInternacaoId) {
      previousInternacaoIdRef.current = currentInternacaoId;
      stopCamera();
    }
  }, [currentInternacaoId, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleSwitchBed = (newBed: Bed) => {
    if (!newBed.internacaoId) return;
    if (!monitoredInternacoes.some((internacao) => internacao.id === newBed.internacaoId)) return;
    stopCamera();
    setSelectedInternacaoId(newBed.internacaoId);
    onSelectBed?.(newBed);
  };

  const handlePrevBed = () => {
    if (availableBeds.length === 0) return;
    const currentIndex = availableBeds.findIndex((item) => item.internacaoId === currentInternacaoId);
    const previous = availableBeds[currentIndex <= 0 ? availableBeds.length - 1 : currentIndex - 1];
    if (previous) handleSwitchBed(previous);
  };

  const handleNextBed = () => {
    if (availableBeds.length === 0) return;
    const currentIndex = availableBeds.findIndex((item) => item.internacaoId === currentInternacaoId);
    const next = availableBeds[currentIndex < 0 || currentIndex >= availableBeds.length - 1 ? 0 : currentIndex + 1];
    if (next) handleSwitchBed(next);
  };

  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !currentInternacaoId || inFlightRef.current) return;
    if (video.readyState < 2) return;

    const requestId = cameraRequestRef.current;
    inFlightRef.current = true;
    setIsDetecting(true);
    try {
      const dataUrl = await captureFrame(video);
      const base64 = dataUrlToBase64(dataUrl);
      const result = await detectEmotion(base64, currentInternacaoId);
      if (requestId !== cameraRequestRef.current) return;

      const emotion = textoReal(result.Emotion);
      if (!emotion) throw new Error("A IA não retornou uma expressão facial.");
      const resultDate = result.Timestamp ? parseTimestamp(result.Timestamp) : null;

      setDetectedEmotion(emotion);
      setDetectedConf(normalizarConfianca(result.Confidence));
      setLastDetectionTs(
        resultDate && !Number.isNaN(resultDate.getTime())
          ? result.Timestamp
          : new Date().toISOString()
      );
      setDetectionError("");
    } catch (err: unknown) {
      if (requestId !== cameraRequestRef.current) return;
      setDetectionError(err instanceof Error ? err.message : "Falha ao consultar a IA");
    } finally {
      inFlightRef.current = false;
      setIsDetecting(false);
    }
  }, [currentInternacaoId]);

  const startCamera = useCallback(async () => {
    if (!currentInternacaoId) return;
    const requestId = ++cameraRequestRef.current;
    setCameraError("");
    setDetectionError("");
    setCameraState("starting");

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      if (requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");
      intervalRef.current = setInterval(runDetection, 3000);
    } catch (err: unknown) {
      if (requestId !== cameraRequestRef.current) return;
      stream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraState("error");
      setCameraError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Permissão de câmera negada."
          : "Não foi possível acessar a câmera."
      );
    }
  }, [currentInternacaoId, runDetection]);

  const latestEmotion = emocaoReal(latestDbExpression);
  const latestConfidence = confiancaReal(latestDbExpression);
  const liveMood = detectedEmotion ? getExpressionMeta(detectedEmotion) : null;
  const LiveMoodIcon = liveMood?.icon ?? null;
  const mood = getExpressionMeta(detectedEmotion ?? latestEmotion);
  const MoodIcon = mood.icon;
  const currentConfidence = detectedEmotion ? detectedConf : latestConfidence;
  const hasExpression = Boolean(detectedEmotion ?? latestEmotion);
  const moodTimestamp = detectedEmotion ? lastDetectionTs : timestampReal(latestDbExpression);

  const clinical = useMemo(() => {
    const ficha = currentBed?.ficha;
    return {
      idade: calcularIdade(ficha?.dataNascimento),
      internacao: formatDateInBrazil(ficha?.dataInternacao),
      diagnostico: textoReal(ficha?.diagnostico) ?? "Diagnóstico não informado",
      medico: textoReal(ficha?.medico) ?? "Médico não informado",
      diagnosticoSecundario: currentInternacao?.diagnosticoSecundario ?? null,
    };
  }, [currentBed, currentInternacao]);

  const currentRisk = currentInternacao?.risco ?? null;
  const riskLabel =
    currentRisk === "critical"
      ? "Crítico"
      : currentRisk === "attention"
      ? "Atenção"
      : currentRisk === "normal"
      ? "Estável"
      : "Risco não informado";
  const riskColor =
    currentRisk === "critical"
      ? COLORS.red
      : currentRisk === "attention"
      ? COLORS.orange
      : currentRisk === "normal"
      ? COLORS.green
      : COLORS.slateSoft;
  const riskBackground =
    currentRisk === "critical"
      ? `${COLORS.red}18`
      : currentRisk === "attention"
      ? `${COLORS.orange}18`
      : currentRisk === "normal"
      ? `${COLORS.green}18`
      : COLORS.bg;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <TopBar
        title={currentBed ? `${currentBed.name} (Leito ${currentBed.id})` : "Monitoramento InfoIA"}
        subtitle={currentBed ? "Análise IA e histórico clínico" : "Dados clínicos do Supabase"}
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
              disabled={availableBeds.length === 0}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border rounded hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Leito anterior"
              style={{ borderColor: COLORS.line }}
            >
              <ChevronLeft size={15} />
            </button>

            <select
              value={currentBed?.internacaoId ?? ""}
              onChange={(event) => {
                const selected = availableBeds.find((item) => item.internacaoId === event.target.value);
                if (selected) handleSwitchBed(selected);
              }}
              disabled={isLoading || isError || availableBeds.length === 0}
              className="h-7 sm:h-8 px-2 text-xs sm:text-[13px] font-semibold border rounded bg-white text-slate-800 outline-none cursor-pointer hover:border-slate-400 transition-colors max-w-[190px] sm:max-w-[260px] truncate disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: COLORS.line }}
            >
              <option value="" disabled>
                Nenhuma internação ativa
              </option>
              {availableBeds.map((item) => (
                <option key={item.internacaoId} value={item.internacaoId}>
                  Leito {item.id} — {item.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextBed}
              disabled={availableBeds.length === 0}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border rounded hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Próximo leito"
              style={{ borderColor: COLORS.line }}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {currentBed && (
            <span
              className="px-2 py-0.5 rounded text-[11px] font-semibold"
              style={{ background: riskBackground, color: riskColor }}
            >
              {riskLabel}
            </span>
          )}
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
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center gap-2 py-10 text-sm" style={styles.patientInfoLabel}>
            <Loader2 size={18} className="animate-spin" />
            Carregando internações ativas…
          </div>
        ) : isError ? (
          <div className="col-span-full py-10 text-center">
            <p className="text-sm" style={{ color: COLORS.red }}>
              Não foi possível carregar as internações do Supabase.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 text-xs font-semibold underline"
              style={{ color: COLORS.orange }}
            >
              Tentar novamente
            </button>
          </div>
        ) : !currentBed || !currentInternacao ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-2 py-10 text-center" style={styles.patientInfoLabel}>
            <BedSingle size={28} />
            <p className="text-sm font-semibold">Nenhuma internação ativa encontrada</p>
            <p className="text-xs">Os pacientes exibidos vêm exclusivamente do Supabase.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 overflow-y-auto">
              <div className="bg-white border p-3.5 sm:p-4" style={styles.card}>
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-xs" style={styles.patientInfoLabel}>
                      Idade: {clinical.idade ?? "não informada"} | Internação: {clinical.internacao}
                    </p>
                    <p className="font-semibold text-xs sm:text-sm" style={styles.patientInfoTitle}>
                      {clinical.diagnostico}
                    </p>
                    {clinical.diagnosticoSecundario && (
                      <p className="text-xs mt-1" style={styles.patientInfoLabel}>
                        Diagnóstico secundário: {clinical.diagnosticoSecundario}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={styles.patientInfoLabel}>
                      Médico: {clinical.medico}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 sm:p-3 shrink-0"
                    style={styles.moodBox}
                    title={moodTimestamp ? formatDateTimeInBrazil(moodTimestamp) : undefined}
                  >
                    <MoodIcon size={16} color={mood.color} />
                    <span className="text-[11px] sm:text-xs font-semibold" style={styles.moodText}>
                      {mood.label}
                      {hasExpression && currentConfidence !== null ? ` (${currentConfidence}%)` : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border p-3.5 sm:p-4" style={styles.card}>
                <p className="kicker mb-3 text-xs" style={styles.chartTitle}>
                  Sinais Vitais (24h)
                </p>
                {isLoadingSinaisVitais ? (
                  <div
                    className="flex items-center justify-center gap-2 text-center"
                    style={{ height: 180, color: styles.chartAxis }}
                  >
                    <Loader2 size={18} className="animate-spin" />
                    <p className="text-xs">Carregando sinais vitais…</p>
                  </div>
                ) : isErrorSinaisVitais ? (
                  <div
                    className="flex items-center justify-center text-center"
                    style={{ height: 180, color: COLORS.red }}
                  >
                    <p className="text-xs">Não foi possível carregar os sinais vitais.</p>
                  </div>
                ) : vitalsChartData.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center gap-2 text-center"
                    style={{ height: 180, color: styles.chartAxis }}
                  >
                    <Activity size={24} />
                    <p className="text-xs">Nenhum sinal vital nas últimas 24 horas.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={vitalsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={styles.chartGrid} />
                      <XAxis dataKey="t" stroke={styles.chartAxis} style={{ fontSize: 11 }} minTickGap={24} />
                      <YAxis stroke={styles.chartAxis} style={{ fontSize: 11 }} domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={styles.chartTooltip}
                        labelFormatter={(label) => {
                          const point = vitalsChartData.find((item) => item.t === String(label));
                          return point ? `${point.date} ${point.t}` : String(label);
                        }}
                      />
                      {vitalsChartData.some((point) => point.hr !== null) && (
                        <Line
                          type="monotone"
                          dataKey="hr"
                          stroke={styles.chartLineHr}
                          name="FC"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          connectNulls={false}
                          isAnimationActive={false}
                        />
                      )}
                      {vitalsChartData.some((point) => point.spo2 !== null) && (
                        <Line
                          type="monotone"
                          dataKey="spo2"
                          stroke={styles.chartLineSpo2}
                          name="SpO2"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          connectNulls={false}
                          isAnimationActive={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white border p-3.5 sm:p-4" style={styles.card}>
                <p className="kicker mb-3 text-xs" style={styles.chartTitle}>
                  Histórico de Expressões
                </p>
                {isLoadingExpressoes ? (
                  <p className="text-xs" style={styles.patientInfoLabel}>
                    Carregando expressões…
                  </p>
                ) : isErrorExpressoes ? (
                  <p className="text-xs" style={{ color: COLORS.red }}>
                    Não foi possível carregar o histórico de expressões.
                  </p>
                ) : expressionHistory.length === 0 ? (
                  <p className="text-xs" style={styles.patientInfoLabel}>
                    Nenhuma expressão facial registrada para esta internação.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {expressionHistory.map((expression, index) => {
                      const emotion = emocaoReal(expression);
                      const meta = getExpressionMeta(emotion);
                      const confidence = confiancaReal(expression);
                      const ExpressionIcon = meta.icon;
                      const timestamp = timestampReal(expression);

                      return (
                        <div
                          key={expression.id != null ? String(expression.id) : `expressao-${index}`}
                          className="flex items-center gap-2 p-2"
                          style={styles.eventRow}
                        >
                          <ExpressionIcon size={14} color={meta.color} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold" style={styles.eventTitle}>
                              {meta.label}
                              {confidence !== null ? ` • ${confidence}%` : ""}
                            </p>
                            {textoReal(expression.descricao_detalhada) && (
                              <p className="text-[11px] mt-0.5 truncate" style={styles.eventTime}>
                                {expression.descricao_detalhada}
                              </p>
                            )}
                            <p className="text-[11px]" style={styles.eventTime}>
                              {timestamp ? formatDateTimeInBrazil(timestamp) : "Horário não informado"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                      disabled={!currentInternacaoId}
                      className="flex-1 py-2 sm:py-2.5 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    style={{ background: COLORS.bg, borderLeftColor: liveMood.color }}
                  >
                    <LiveMoodIcon size={18} color={liveMood.color} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold" style={{ color: COLORS.ink }}>
                        IA Detectou: {liveMood.label}
                        {detectedConf !== null ? ` (${detectedConf}%)` : ""}
                      </p>
                      {lastDetectionTs && (
                        <p className="text-[11px] mt-0.5" style={{ color: COLORS.slateSoft }}>
                          {formatDateTimeInBrazil(lastDetectionTs)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {detectionError && (
                  <p className="text-[11px]" style={{ color: COLORS.red }}>
                    Erro na detecção: {detectionError}
                  </p>
                )}
              </div>

            </div>
          </>
        )}
      </div>

      {showTestAiModal && (
        <TestAiModal open={showTestAiModal} onClose={() => setShowTestAiModal(false)} />
      )}
    </div>
  );
};
