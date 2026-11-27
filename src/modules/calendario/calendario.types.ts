export type TipoEventoKey = "plantao" | "procedimento" | "consulta" | "reuniao";

export interface EventoCalendario {
  id: string;
  data: string;
  hora: string;
  tipo: TipoEventoKey;
  titulo: string;
  descricao: string | null;
  dataHoraInicio: string;
  dataHoraFim: string | null;
  horaFim: string | null;
  local: string | null;
}

export interface NovoEventoFormData {
  tipo: TipoEventoKey;
  titulo: string;
  data: string;
  hora: string;
  dataFim: string;
  horaFim: string;
  observacoes: string;
}

export interface TipoEvento {
  label: string;
  color: string;
}
