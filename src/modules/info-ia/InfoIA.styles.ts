import {
  AlertTriangle,
  BedSingle,
  CloudRain,
  Frown,
  Meh,
  Minus,
  Moon,
  Sun,
} from "lucide-react";
import { MoodMeta } from "../../types";
import { COLORS } from "../../config/colors";

const expressionMeta: Record<string, MoodMeta> = {
  dor: { label: "Dor", icon: AlertTriangle, color: COLORS.red },
  medo: { label: "Medo", icon: Frown, color: COLORS.red },
  tristeza: { label: "Tristeza", icon: CloudRain, color: COLORS.orange },
  enjoo: { label: "Enjoo", icon: Meh, color: COLORS.orange },
  sono: { label: "Sonolência", icon: Moon, color: COLORS.slate },
  dormindo: { label: "Dormindo", icon: BedSingle, color: COLORS.slate },
  acordado: { label: "Acordado", icon: Sun, color: COLORS.green },
  neutro: { label: "Neutro", icon: Minus, color: COLORS.slate },
};

const emptyExpressionMeta: MoodMeta = {
  label: "Sem expressão",
  icon: Minus,
  color: COLORS.slate,
};

export function getExpressionMeta(emotion?: string | null): MoodMeta {
  const normalized = emotion?.trim().toLowerCase();
  if (!normalized) return emptyExpressionMeta;

  return (
    expressionMeta[normalized] ?? {
      label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
      icon: Minus,
      color: COLORS.slate,
    }
  );
}

export const infoIAStyles = {
  card: {
    borderColor: COLORS.line,
  },
  patientInfoLabel: {
    color: COLORS.slateSoft,
  },
  patientInfoTitle: {
    color: COLORS.ink,
  },
  moodBox: {
    background: COLORS.orangeSoft,
  },
  moodText: {
    color: COLORS.ink,
  },
  chartTitle: {
    color: COLORS.ink,
  },
  chartGrid: COLORS.line,
  chartAxis: COLORS.slateSoft,
  chartTooltip: {
    background: COLORS.card,
    border: `1px solid ${COLORS.line}`,
  },
  chartLineHr: COLORS.red,
  chartLineSpo2: COLORS.orangeDark,
  chartBarPain: COLORS.orange,
  eventRow: {
    background: COLORS.bg,
  },
  eventIconColor: COLORS.orange,
  eventTitle: {
    color: COLORS.ink,
  },
  eventTime: {
    color: COLORS.slateSoft,
  },
  copilotPanel: {
    borderColor: COLORS.line,
    background: COLORS.card,
  },
  copilotHeader: {
    borderColor: COLORS.line,
  },
  copilotTitle: {
    color: COLORS.ink,
  },
  copilotSubtitle: {
    color: COLORS.slateSoft,
  },
  message: {
    background: COLORS.bg,
    color: COLORS.slate,
    borderLeft: `3px solid ${COLORS.orange}`,
  },
  suggestionsFooter: {
    borderColor: COLORS.line,
  },
  suggestionsLabel: {
    color: COLORS.slateSoft,
  },
  suggestionButton: {
    background: COLORS.bg,
    color: COLORS.slate,
  },
  inputFooter: {
    borderColor: COLORS.line,
  },
  input: {
    borderColor: COLORS.line,
    background: COLORS.bg,
  },
  sendButton: {
    background: COLORS.orange,
  },
};