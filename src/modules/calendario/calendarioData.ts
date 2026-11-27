import { COLORS } from "../../config/colors";
import { TipoEvento, TipoEventoKey } from "./calendario.types";

export const eventTypeMeta: Record<TipoEventoKey, TipoEvento> = {
  plantao: { label: "Plantão", color: COLORS.orange },
  consulta: { label: "Consulta", color: COLORS.green },
  procedimento: { label: "Procedimento", color: COLORS.red },
  reuniao: { label: "Reunião", color: COLORS.slate },
};
