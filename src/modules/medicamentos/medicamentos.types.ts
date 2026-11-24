export interface Medicamento {
  id: string | number;
  leito: string;
  paciente: string;
  nome: string;
  via: string;
  horario: string;
  status: "administrado" | "pendente" | "atrasado";
  recorrente: boolean;
}
