import React from "react";
import { ChevronRight } from "lucide-react";
import { RiskLevel, MoodType } from "../types";
import { BedCardProps } from "../modules/dashboard/dashboard.types";
import { useSinaisVitais, useExpressoes } from "../hooks";
import { moodMeta } from "../config/mockData";
import { COLORS } from "../config/colors";
import {
  bedCardStyles as styles,
  getRiskBadgeStyle,
  getRiskStripe,
  getAcordadoStyle,
  getHrBarStyle,
  getStatusToggleStyle,
} from "./styles/BedCard.styles";

const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "attention", label: "Atenção" },
  { value: "critical", label: "Crítico" },
];

export const BedCard: React.FC<BedCardProps> = ({ bed, onSelect, onChangeRisk, onToggleStatus }) => {
  const isInternado = bed.status === "internado";
  const internacaoId = isInternado ? bed.internacaoId : undefined;

  const { data: vitals = [] } = useSinaisVitais(internacaoId);
  const { data: expressions = [] } = useExpressoes(internacaoId);

  const latestVital = vitals[vitals.length - 1];
  const hr = latestVital?.hr ?? bed.hr;

  const latestExpression = expressions[expressions.length - 1];
  const moodName = (latestExpression?.mood ?? bed.mood) as MoodType;
  const mood = moodMeta[moodName] ?? moodMeta["neutro"]!;
  const MoodIcon = mood.icon;
  const conf = latestExpression?.confianca ?? bed.conf;
  const acordado = moodName !== "dormindo";
  const hrSeries = vitals.length > 0 ? vitals.map((v) => v.hr ?? 0) : bed.hrSeries;
  const ts = latestVital ? new Date(latestVital.registrado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : bed.ts;

  const validRisk = (["normal", "attention", "critical"] as const).includes(bed.risk) ? bed.risk : "normal";

  return (
    <div
      className="w-full text-left p-3.5 sm:p-5 pl-3 sm:pl-4 border"
      style={{
        ...styles.button,
        opacity: isInternado ? 1 : 0.55,
        borderLeft: `5px solid ${isInternado ? getRiskStripe(validRisk) : COLORS.line}`,
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
              value={validRisk}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onChangeRisk(bed.id, e.target.value as RiskLevel)}
              className="text-[10.5px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 border-none outline-none rounded"
              style={getRiskBadgeStyle(validRisk)}
            >
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
                {mood.label} • {conf}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs truncate" style={styles.statLabel}>
                FC
              </p>
              <p className="font-semibold text-xs sm:text-sm truncate" style={styles.statValue}>
                {hr}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs truncate" style={styles.statLabel}>
                Consciência
              </p>
              <p className="font-semibold text-xs sm:text-sm truncate" style={getAcordadoStyle(acordado)}>
                {acordado ? "Acordado" : "Dormindo"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs truncate" style={styles.statLabel}>
                Atualização
              </p>
              <p className="font-semibold text-[10.5px] sm:text-xs truncate" style={styles.statValue}>
                {ts}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1">
              {hrSeries.slice(-3).map((h, i) => (
                <div key={i} className="w-2 rounded-full" style={getHrBarStyle(h)} />
              ))}
            </div>
            <ChevronRight
              size={16}
              color={styles.chevronColor}
              onClick={() => onSelect(bed)}
              className="cursor-pointer"
            />
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
