import React from "react";
import { X, Calendar, Clock, MapPin, AlignLeft, Trash2 } from "lucide-react";
import { eventTypeMeta } from "../../modules/calendario/calendarioData";
import { EventoCalendario, TipoEventoKey } from "../../modules/calendario/calendario.types";
import { COLORS, INK_OVERLAY } from "../../config/colors";

interface EventoDetalhesModalProps {
  open: boolean;
  evento: EventoCalendario | null;
  onClose: () => void;
  onDelete?: (evento: EventoCalendario) => void;
}

export const EventoDetalhesModal: React.FC<EventoDetalhesModalProps> = ({
  open,
  evento,
  onClose,
  onDelete,
}) => {
  if (!open || !evento) return null;

  const meta = eventTypeMeta[evento.tipo as TipoEventoKey] || {
    label: "Evento",
    color: COLORS.orange,
  };

  const formatDisplayDate = (isoStr: string) => {
    try {
      const [year, month, day] = isoStr.split("-").map(Number);
      if (year && month && day) {
        const d = new Date(year, month - 1, day);
        return new Intl.DateTimeFormat("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(d);
      }
    } catch {
      return isoStr;
    }
    return isoStr;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4"
      style={{ background: INK_OVERLAY }}
      onClick={onClose}
    >
      <div
        className="w-[480px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl"
        style={{ border: `1px solid ${COLORS.line}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b"
          style={{ borderColor: COLORS.line }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: meta.color }}
            />
            <span
              className="px-2.5 py-0.5 rounded text-xs font-semibold"
              style={{
                background: `${meta.color}18`,
                color: meta.color,
                border: `1px solid ${meta.color}40`,
              }}
            >
              {meta.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 transition-colors"
          >
            <X size={16} color={COLORS.slate} />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-4">
          <div>
            <h2
              className="text-lg sm:text-xl font-bold leading-snug break-words"
              style={{ color: COLORS.ink }}
            >
              {evento.titulo}
            </h2>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-3.5 rounded-lg border bg-slate-50/70"
            style={{ borderColor: COLORS.line }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{ background: `${COLORS.orange}15` }}
              >
                <Calendar size={15} color={COLORS.orange} />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] uppercase font-bold tracking-wider text-slate-400">
                  Data
                </p>
                <p className="text-xs sm:text-[13px] font-semibold text-slate-700 capitalize truncate">
                  {formatDisplayDate(evento.data)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{ background: `${meta.color}15` }}
              >
                <Clock size={15} color={meta.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] uppercase font-bold tracking-wider text-slate-400">
                  Horário
                </p>
                <p className="text-xs sm:text-[13px] font-semibold text-slate-700">
                  {evento.hora}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:col-span-2 pt-1 border-t border-slate-200/60">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-slate-200/70"
              >
                <MapPin size={15} className="text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] uppercase font-bold tracking-wider text-slate-400">
                  Local / Setor
                </p>
                <p className="text-xs sm:text-[13px] font-medium text-slate-700">
                  Ala UTI 2 · Hospital Geral
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-slate-600">
              <AlignLeft size={14} />
              <span className="text-[11.5px] font-semibold">
                Observações
              </span>
            </div>
            <div
              className="p-3 rounded border text-xs sm:text-[13px] text-slate-700 whitespace-pre-wrap min-h-[60px]"
              style={{
                borderColor: COLORS.line,
                background: COLORS.bg,
              }}
            >
              {evento.descricao ? evento.descricao : "Nenhuma observação informada para este evento."}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: COLORS.line }}>
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(evento);
                  onClose();
                }}
                className="h-9 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 rounded flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs sm:text-[13px] font-semibold rounded border hover:bg-slate-100 transition-colors"
              style={{
                borderColor: COLORS.line,
                color: COLORS.ink,
                background: COLORS.bg,
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
