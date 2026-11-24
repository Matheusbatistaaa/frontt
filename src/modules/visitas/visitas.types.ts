export interface Visita {
  id?: string;
  leito: string;
  paciente: string;
  visitante: string;
  parentesco: string;
  entrada: string;
  saida: string;
  status: "em-andamento" | "agendada" | "finalizada";
}
