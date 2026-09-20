import { COLORS } from "../../config/colors";
import { EventoCalendario, TipoEvento, TipoEventoKey } from "./calendario.types";

export const eventTypeMeta: Record<TipoEventoKey, TipoEvento> = {
  plantao: { label: "Plantão", color: COLORS.orange },
  consulta: { label: "Consulta", color: COLORS.green },
  procedimento: { label: "Procedimento", color: COLORS.red },
};

const toYMD = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
};

export const calendarEvents: EventoCalendario[] = [
  { data: toYMD(0), hora: "07:00", titulo: "Plantão UTI 2 — Dra. Ferraz", tipo: "plantao" },
  { data: toYMD(0), hora: "14:00", titulo: "Visita Multidisciplinar — Leito 402", tipo: "consulta" },
  { data: toYMD(1), hora: "09:30", titulo: "Extubação Programada — Leito 404", tipo: "procedimento" },
  { data: toYMD(2), hora: "11:00", titulo: "Avaliação Neurológica — Leito 403", tipo: "consulta" },
  { data: toYMD(3), hora: "07:00", titulo: "Plantão UTI 2 — Dr. Almeida", tipo: "plantao" },
  { data: toYMD(-1), hora: "15:00", titulo: "Coleta de Gasometria Geral", tipo: "procedimento" },
  { data: toYMD(4), hora: "16:00", titulo: "Troca de Curativos Centrais", tipo: "procedimento" },
];