import { LucideIcon } from "lucide-react";

export type MoodType = "dor" | "medo" | "tristeza" | "enjoo" | "sono" | "dormindo" | "acordado" | "neutro";
export type RiskLevel = "normal" | "attention" | "critical";
export type PatientStatus = "internado" | "alta";

export interface FichaPaciente {
  cpf?: string | null | undefined;
  dataNascimento?: string | null | undefined;
  genero?: string | null | undefined;
  convenio?: string | null | undefined;
  telefone?: string | null | undefined;
  contatoEmergencia?: string | null | undefined;
  numeroEmergencia?: string | null | undefined;
  alergias?: string | null | undefined;
  diagnostico?: string | null | undefined;
  dataInternacao?: string | null | undefined;
  medico?: string | null | undefined;
  observacoes?: string | null | undefined;
}

export interface Bed {
  id: string; 
  internacaoId?: string; 
  name: string;
  hr: number;
  hrSeries: number[];
  mood: MoodType;
  conf: number;
  risk: RiskLevel;
  acordado: boolean;
  ts: string;
  status: PatientStatus;
  ficha?: FichaPaciente | undefined;
}

export interface ClinicalData {
  idade: number;
  diagnostico: string;
  medico: string;
  internacao: string;
  spo2: number;
}

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

export interface VitalData {
  t: string;
  hr: number;
  spo2: number;
}

export interface PainData {
  t: string;
  intensidade: number;
}

export interface TremorEvent {
  t: string;
  tipo: string;
}

export interface RoomPosition {
  id: string;
  x: number;
  y: number;
  status: RiskLevel;
}

export interface Equipment {
  label: string;
  x: number;
  y: number;
  icon: LucideIcon;
  ts: string;
}

export interface MoodMeta {
  label: string;
  icon: LucideIcon;
  color: string;
}

export interface RecentPatient {
  nome: string;
  leito: string;
  risco: RiskLevel;
}

export interface Doctor {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
  turno: "manhã" | "tarde" | "noite";
  horarioInicio: string; 
  horarioFim: string;    
  plantao: boolean;
  pacientes: string[];
}