import React, { useMemo } from "react";
import { ChevronRight, ClipboardList, FileText } from "lucide-react";
import { RiskLevel } from "../types";
import { BedCardProps } from "../modules/dashboard/dashboard.types";
import { useSinaisVitais, useExpressoes } from "../hooks";
import {
  ExpressaoInfoIA,
  SinalVitalInfoIA,
  confiancaReal,
  emocaoReal,
  frequenciaCardiacaReal,
  isRiskLevel,
  maisRecenteTimestamp,
  ordenarPorTimestamp,
  timestampReal,
  ultimoPorTimestamp,
} from "../modules/info-ia/info-ia.types";
import { getExpressionMeta } from "../modules/info-ia/InfoIA.styles";
import { formatDateInBrazil, formatTimeInBrazil } from "../lib/dateTime";
import { COLORS } from "../config/colors";
import {
  bedCardStyles as styles,
  getRiskBadgeStyle,
  getRiskStripe,
  getAcordadoStyle,
  getHrBarStyle,
  getStatusToggleStyle,
  getFichaButtonStyle,
} from "./styles/BedCard.styles";

const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "attention", label: "Atenção" },
  { value: "critical", label: "Crítico" },
];

export const BedCard: React.FC<BedCardProps> = ({ bed, onSelect, onChangeRisk, onToggleStatus, onOpenFicha, onOpenProntuario }) => {
  const isInternado = bed.status === "internado";
  const internacaoId = isInternado ? bed.internacaoId || undefined : undefined;

  const { data: sinaisVitais = [] } = useSinaisVitais(internacaoId);
  const { data: expressoesFaciais = [] } = useExpressoes(internacaoId);

  const vitals = useMemo(() => sinaisVitais as SinalVitalInfoIA[], [sinaisVitais]);
  const expressions = useMemo(
    () => expressoesFaciais as ExpressaoInfoIA[],
    [expressoesFaciais]
  );
  const sortedVitals = useMemo(() => ordenarPorTimestamp(vitals), [vitals]);
  const sortedExpressions = useMemo(() => ordenarPorTimestamp(expressions), [expressions]);
  const latestVital = ultimoPorTimestamp(sortedVitals);
  const latestExpression = ultimoPorTimestamp(sortedExpressions);

  const hr = frequenciaCardiacaReal(latestVital);
  const emotion = emocaoReal(latestExpression);
  const mood = getExpressionMeta(emotion);
  const MoodIcon = mood.icon;
  const confidence = confiancaReal(latestExpression);
  const consciousness =
    emotion?.toLowerCase() === "dormindo"
      ? "Dormindo"
      : emotion?.toLowerCase() === "acordado"
      ? "Acordado"
      : "Não informado";
  const hrSeries = sortedVitals
    .map(frequenciaCardiacaReal)
    .filter((value): value is number => value !== null);
  const latestTimestamp = maisRecenteTimestamp(
    timestampReal(latestVital),
    timestampReal(latestExpression)
  );
  const ts = latestTimestamp ? formatTimeInBrazil(latestTimestamp) : "—";
  const fullTimestamp = latestTimestamp
    ? `${formatDateInBrazil(latestTimestamp)} ${formatTimeInBrazil(latestTimestamp)}`
    : "Horário não informado";

  const validRisk = isRiskLevel(bed.risk) ? bed.risk : null;

  return (
    <div
      className="w-full text-left p-3.5 sm:p-5 pl-3 sm:pl-4 border"
      style={{
        ...styles.button,
        opacity: isInternado ? 1 : 0.55,
        borderLeft: `5px solid ${
          isInternado ? (validRisk ? getRiskStripe(validRisk) : COLORS.line) : COLORS.line
        }`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <button onClick={() => onSelect(bed)} className="text-left flex-1 min-w-0 pr-1">
          <p className="kicker mb-0.5 sm:mb-1 text-[10.5px] sm:text-xs truncate" style={styles.bedLabel}>
            Leito {bed.id}
          </p>
          <p className="display font-semibold text-sm sm:text-[1.05rem] leading-tight truncate" style={styles.bedName}>
            {bed.name}
          </p>
        </button>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(bed.id);
            }}
            className="text-[9.5px] sm:text-[10px] font-semibold px-2 py-0.5 rounded"
            style={getStatusToggleStyle(isInternado)}
          >
            {isInternado ? "Internado" : "Alta"}
          </button>

          {isInternado && (
            <select
              value={validRisk ?? ""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onChangeRisk(bed.id, e.target.value as RiskLevel)}
              className="text-[10.5px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 border-none outline-none rounded"
              style={
                validRisk
                  ? getRiskBadgeStyle(validRisk)
                  : { background: COLORS.bg, color: COLORS.slateSoft }
              }
            >
              {!validRisk && (
                <option value="" disabled>
                  Não informado
                </option>
              )}
              {RISK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isInternado ? (
        <>
          <div className="flex items-center gap-2 mb-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0" style={styles.moodIconBox}>
              <MoodIcon size={16} color={mood.color} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs truncate" style={styles.moodLabel}>
                {mood.label}
                {emotion && confidence !== null ? ` • ${confidence}%` : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs truncate" style={styles.statLabel}>
                FC
              </p>
              <p className="font-semibold text-xs sm:text-sm truncate" style={styles.statValue}>
                {hr ?? "—"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs truncate" style={styles.statLabel}>
                Consciência
              </p>
              <p className="font-semibold text-xs sm:text-sm truncate" style={getAcordadoStyle(consciousness === "Acordado")}>
                {consciousness}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs truncate" style={styles.statLabel}>
                Atualização
              </p>
              <p
                className="font-semibold text-[10.5px] sm:text-xs truncate"
                style={styles.statValue}
                title={fullTimestamp}
              >
                {ts}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {hrSeries.length > 0 ? (
              <div className="flex gap-1">
                {hrSeries.slice(-3).map((value, index) => (
                  <div
                    key={`fc-${index}`}
                    className="w-2 rounded-full"
                    style={getHrBarStyle(value)}
                  />
                ))}
              </div>
            ) : (
              <span className="text-[10px] sm:text-[11px]" style={styles.statLabel}>
                Sem histórico de FC
              </span>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {onOpenFicha && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFicha(bed);
                  }}
                  className="flex items-center gap-1 text-[10.5px] sm:text-[11px] font-semibold px-2 py-1 border transition-opacity hover:opacity-80"
                  style={getFichaButtonStyle()}
                >
                  <FileText size={12} />
                  Ficha
                </button>
              )}
              {onOpenProntuario && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenProntuario(bed);
                  }}
                  className="flex items-center gap-1 text-[10.5px] sm:text-[11px] font-semibold px-2 py-1 border transition-opacity hover:opacity-80"
                  style={getFichaButtonStyle()}
                >
                  <ClipboardList size={12} />
                  Prontuário
                </button>
              )}
              <ChevronRight
                size={16}
                color={styles.chevronColor}
                onClick={() => onSelect(bed)}
                className="cursor-pointer"
              />
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs italic py-3 sm:py-4" style={styles.statLabel}>
          Leito disponível — sem paciente internado
        </p>
      )}
    </div>
  );
};
