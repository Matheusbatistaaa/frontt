export type VisitaStatus = "em-andamento" | "agendada" | "finalizada";

export interface Visita {
  id: string;
  pacienteId: number;
  leito: string;
  paciente: string;
  visitante: string;
  parentesco: string;
  entrada: string;
  saida: string;
  dataEntrada: string | null;
  dataSaida: string | null;
  status: VisitaStatus;
}

export interface NovaVisitaFormData {
  pacienteId: number;
  visitante: string;
  parentesco: string;
  data: string;
  hora: string;
  dataSaida: string;
  horaSaida: string;
}
