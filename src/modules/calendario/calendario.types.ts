export type TipoEventoKey = "plantao" | "procedimento" | "consulta";

export interface EventoCalendario {
  id?: string;
  data: string;
  hora: string;
  tipo: TipoEventoKey;
  titulo: string;
  descricao?: string;
  dataHoraFim?: string;
}

export interface TipoEvento {
  label: string;
  color: string;
}
