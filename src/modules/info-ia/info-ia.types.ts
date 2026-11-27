import { Bed, RiskLevel } from "../../types";
import { parseTimestamp } from "../../lib/dateTime";

export interface InfoIAProps {
  bed: Bed;
  onBack: () => void;
  onSelectBed?: (bed: Bed) => void;
}

export interface CopilotMessage {
  text: string;
  timestamp: string;
}

export interface InfoIAPaciente {
  id?: string | number | null;
  nome?: string | null;
  cpf?: string | null;
  data_nascimento?: string | null;
  genero?: string | null;
  convenio?: string | null;
  telefone?: string | null;
  contato_emergencia?: string | null;
  numero_emergencia?: string | null;
  alergias?: string | null;
}

export interface InfoIALeito {
  id?: string | number | null;
  numero?: string | null;
}

export interface InfoIAInternacao {
  id: string | number;
  paciente_id: string | number;
  leito_id: string | number;
  ativo?: boolean | null;
  risco?: string | null;
  data_internacao?: string | null;
  diagnostico_principal?: string | null;
  diagnostico_secundario?: string | null;
  observacoes?: string | null;
  paciente?: InfoIAPaciente | null;
  leito?: InfoIALeito | null;
  medico?: { nome?: string | null } | null;
}

export interface InternacaoMonitorada {
  id: string;
  pacienteId: string;
  leitoId: string;
  numeroLeito: string;
  paciente: InfoIAPaciente | null;
  medicoNome: string | null;
  risco: RiskLevel | null;
  dataInternacao: string | null;
  diagnosticoPrincipal: string | null;
  diagnosticoSecundario: string | null;
  observacoes: string | null;
}

export interface SinalVitalInfoIA {
  id?: string | number | null;
  internacao_id?: string | number | null;
  frequencia_cardiaca?: number | string | null;
  hr?: number | string | null;
  spo2?: number | string | null;
  timestamp?: string | null;
  registrado_em?: string | null;
}

export interface ExpressaoInfoIA {
  id?: string | number | null;
  internacao_id?: string | number | null;
  emocao?: string | null;
  mood?: string | null;
  confianca?: number | string | null;
  descricao_detalhada?: string | null;
  timestamp?: string | null;
  registrado_em?: string | null;
}

interface RegistroComTimestamp {
  timestamp?: string | null;
  registrado_em?: string | null;
}

export function textoReal(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
}

export function identificacaoReal(value: unknown): string | null {
  if (typeof value === "string") return textoReal(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function isRiskLevel(value: unknown): value is RiskLevel {
  return value === "normal" || value === "attention" || value === "critical";
}

export function numeroReal(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizarConfianca(value: unknown): number | null {
  const confidence = numeroReal(value);
  if (confidence === null || confidence < 0) return null;
  return Math.round(confidence <= 1 ? confidence * 100 : confidence);
}

export function frequenciaCardiacaReal(vital?: SinalVitalInfoIA | null): number | null {
  return numeroReal(vital?.frequencia_cardiaca) ?? numeroReal(vital?.hr);
}

export function emocaoReal(expression?: ExpressaoInfoIA | null): string | null {
  return textoReal(expression?.emocao) ?? textoReal(expression?.mood);
}

export function confiancaReal(expression?: ExpressaoInfoIA | null): number | null {
  return numeroReal(expression?.confianca);
}

export function timestampReal(record?: RegistroComTimestamp | null): string | null {
  return textoReal(record?.timestamp) ?? textoReal(record?.registrado_em);
}

function timestampValido(record: RegistroComTimestamp): Date | null {
  const timestamp = timestampReal(record);
  if (!timestamp) return null;
  const date = parseTimestamp(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function ordenarPorTimestamp<T extends RegistroComTimestamp>(records: readonly T[]): T[] {
  return records
    .map((record, index) => ({ record, index, date: timestampValido(record) }))
    .sort((a, b) => {
      if (a.date && b.date) return a.date.getTime() - b.date.getTime() || a.index - b.index;
      if (a.date) return 1;
      if (b.date) return -1;
      return a.index - b.index;
    })
    .map(({ record }) => record);
}

export function ultimoPorTimestamp<T extends RegistroComTimestamp>(records: readonly T[]): T | undefined {
  let latest: T | undefined;
  let latestTime = Number.NEGATIVE_INFINITY;

  for (const record of records) {
    const date = timestampValido(record);
    if (date && date.getTime() >= latestTime) {
      latest = record;
      latestTime = date.getTime();
    }
  }

  return latest ?? records[records.length - 1];
}

export function maisRecenteTimestamp(...timestamps: (string | null | undefined)[]): string | null {
  let latest: string | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;

  for (const timestamp of timestamps) {
    const value = textoReal(timestamp);
    if (!value) continue;
    const date = parseTimestamp(value);
    const time = date.getTime();
    if (!Number.isNaN(time) && time >= latestTime) {
      latest = value;
      latestTime = time;
    }
  }

  return latest;
}

export function toInternacaoMonitorada(internacao: InfoIAInternacao): InternacaoMonitorada | null {
  if (internacao.ativo !== true) return null;

  const id = identificacaoReal(internacao.id);
  const pacienteId = identificacaoReal(internacao.paciente_id);
  const leitoId = identificacaoReal(internacao.leito_id);
  if (!id || !pacienteId || !leitoId) return null;

  return {
    id,
    pacienteId,
    leitoId,
    numeroLeito: textoReal(internacao.leito?.numero) ?? leitoId,
    paciente: internacao.paciente ?? null,
    medicoNome: textoReal(internacao.medico?.nome),
    risco: isRiskLevel(internacao.risco) ? internacao.risco : null,
    dataInternacao: textoReal(internacao.data_internacao),
    diagnosticoPrincipal: textoReal(internacao.diagnostico_principal),
    diagnosticoSecundario: textoReal(internacao.diagnostico_secundario),
    observacoes: textoReal(internacao.observacoes),
  };
}
