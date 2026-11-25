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

export interface NovoMedicamentoInput {
  internacaoId?: number | string | undefined;
  leito: string;
  paciente: string;
  nome: string;
  via: string;
  horario: string;
  recorrente: boolean;
}
