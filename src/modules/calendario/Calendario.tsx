import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "../../shared/components";
import { COLORS } from "../../config/colors";
import { useCalendario } from "../../hooks";
import { supabase } from "../../lib/supabase";
import { eventTypeMeta, calendarEvents } from "./calendarioData";
import type { TipoEventoKey, EventoCalendario } from "./calendario.types";
import { NovoEventoModal, NovoEventoFormData } from "../../components/modals/NovoEventoModal";
import { EventoDetalhesModal } from "../../components/modals/EventoDetalhesModal";
import {
  getWeekDays,
  getMonthGridDays,
  WEEKDAY_NAMES,
  addDays,
  addMonths,
  isSameDay,
  formatDayLabel,
  formatWeekRangeLabel,
  formatMonthLabel,
  toISODate,
} from "./calendarioUtils";
import {
  calendarioStyles as styles,
  getDayLabelStyle,
  getLegendDotStyle,
  getEventCardStyle,
  getToggleButtonStyle,
} from "./calendario.styles";

type ViewMode = "semana" | "mes";

export const Calendario: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventoCalendario | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("semana");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [localEvents, setLocalEvents] = useState<EventoCalendario[]>(calendarEvents);

  const { data: supabaseEvents, refetch } = useCalendario();

  const events = (supabaseEvents && supabaseEvents.length > 0) ? supabaseEvents : localEvents;

  const weekDays = useMemo(() => getWeekDays(referenceDate), [referenceDate]);
  const monthDays = useMemo(() => getMonthGridDays(referenceDate), [referenceDate]);

  const rangeLabel = viewMode === "semana" ? formatWeekRangeLabel(weekDays) : formatMonthLabel(referenceDate);

  const handlePrev = () => {
    setReferenceDate((prev) => (viewMode === "semana" ? addDays(prev, -7) : addMonths(prev, -1)));
  };

  const handleNext = () => {
    setReferenceDate((prev) => (viewMode === "semana" ? addDays(prev, 7) : addMonths(prev, 1)));
  };

  const handleSaveEvento = async (data: NovoEventoFormData) => {
    const novo: EventoCalendario = {
      data: data.data,
      hora: data.hora,
      titulo: data.titulo,
      tipo: data.tipo,
      descricao: data.observacoes || "",
    };
    try {
      const inicio = `${data.data}T${data.hora}:00`;
      const fim = `${data.data}T${data.hora}:00`;
      const payload = {
        titulo: data.titulo,
        tipo: data.tipo,
        data_hora_inicio: inicio,
        data_hora_fim: fim,
        descricao: data.observacoes || "",
      };
      const { error } = await supabase.from("calendario_eventos").insert(payload);
      if (error) throw error;
      setLocalEvents((prev) => [...prev, novo]);
      toast.success("Evento adicionado ao calendário");
      setModalOpen(false);
      refetch();
    } catch (err) {
      console.warn("Evento salvo localmente:", err);
      setLocalEvents((prev) => [...prev, novo]);
      toast.success("Evento adicionado ao calendário");
      setModalOpen(false);
    }
  };

  const handleDeleteEvento = async (evento: EventoCalendario) => {
    try {
      if (evento.id) {
        const { error } = await supabase.from("calendario_eventos").delete().eq("id", evento.id);
        if (error) throw error;
      }
      setLocalEvents((prev) =>
        prev.filter((e) => !(e.data === evento.data && e.hora === evento.hora && e.titulo === evento.titulo))
      );
      toast.success("Evento excluído com sucesso");
      refetch();
    } catch (err) {
      console.warn("Erro ao excluir evento:", err);
      setLocalEvents((prev) =>
        prev.filter((e) => !(e.data === evento.data && e.hora === evento.hora && e.titulo === evento.titulo))
      );
      toast.success("Evento removido localmente");
    }
  };

  const today = new Date();
  const isMonthView = viewMode === "mes";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Calendário" subtitle="Plantões, consultas e procedimentos · Ala UTI 2" />

      <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-6 md:px-8 pt-3.5 sm:pt-5">
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
          <button onClick={handlePrev} className="w-8 h-8 sm:w-9 sm:h-9 border flex items-center justify-center rounded" style={styles.navButton}>
            <ChevronLeft size={16} color={styles.navIconColor} />
          </button>
          <p className="display text-xs sm:text-[1.05rem] font-semibold min-w-0" style={styles.weekLabel}>
            {rangeLabel}
          </p>
          <button onClick={handleNext} className="w-8 h-8 sm:w-9 sm:h-9 border flex items-center justify-center rounded" style={styles.navButton}>
            <ChevronRight size={16} color={styles.navIconColor} />
          </button>

          <div className="flex items-center gap-1 border p-0.5 ml-1 sm:ml-2 rounded" style={styles.toggleWrap}>
            {(["semana", "mes"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="h-6 sm:h-7 px-2 sm:px-3 rounded-md text-[11px] sm:text-[12px] font-semibold capitalize"
                style={getToggleButtonStyle(viewMode === mode)}
              >
                {mode === "semana" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="hidden sm:flex items-center gap-3">
            {Object.entries(eventTypeMeta).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={getLegendDotStyle(v.color)} />
                <span className="text-[11px] sm:text-[11.5px]" style={styles.legendLabel}>
                  {v.label}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="h-8 sm:h-9 px-3 sm:px-3.5 rounded flex items-center gap-1.5 text-xs sm:text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: COLORS.orange }}
          >
            <Plus size={14} />
            Novo Evento
          </button>
        </div>
      </div>

      <div
        className="flex-1 mx-3 sm:mx-6 md:mx-8 my-3 sm:my-5 bg-white border overflow-x-auto flex flex-col rounded-lg shadow-xs"
        style={styles.gridBorder}
      >
        {isMonthView ? (
          <div className="flex-1 flex flex-col min-w-[700px]">
            <div className="grid grid-cols-7 border-b bg-slate-50/80 shrink-0" style={{ borderColor: COLORS.line }}>
              {WEEKDAY_NAMES.map((name, i) => (
                <div
                  key={name}
                  className={`h-9 flex items-center justify-center font-semibold text-xs text-slate-600 ${
                    i < 6 ? "border-r" : ""
                  }`}
                  style={{ borderColor: COLORS.line }}
                >
                  {name}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
              {monthDays.map((day, idx) => {
                const iso = toISODate(day);
                const isCurrentMonth = day.getMonth() === referenceDate.getMonth();
                const isToday = isSameDay(day, today);
                const dayEvents = events.filter((e) => e.data === iso);
                const isLastCol = (idx + 1) % 7 === 0;

                return (
                  <div
                    key={iso + idx}
                    className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 border-b flex flex-col gap-1 transition-colors hover:bg-slate-50/60 ${
                      !isLastCol ? "border-r" : ""
                    } ${!isCurrentMonth ? "bg-slate-50/40" : "bg-white"}`}
                    style={{ borderColor: COLORS.line }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          isToday
                            ? "w-6 h-6 rounded-full bg-[#E05A47] text-white flex items-center justify-center font-bold text-[11px]"
                            : isCurrentMonth
                            ? "text-slate-700"
                            : "text-slate-400"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                      {dayEvents.map((e, j) => {
                        const meta = eventTypeMeta[e.tipo as TipoEventoKey] || Object.values(eventTypeMeta)[0]!;
                        return (
                          <div
                            key={j}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setSelectedEvent(e);
                            }}
                            className="px-1.5 py-0.5 rounded text-[10.5px] font-medium truncate border-l-[3px] transition-all hover:brightness-95 flex items-center gap-1 cursor-pointer"
                            style={{
                              background: `${meta.color}18`,
                              borderLeftColor: meta.color,
                              color: meta.color,
                            }}
                            title={`${e.hora} - ${e.titulo}`}
                          >
                            <span className="font-bold text-[10px] shrink-0">{e.hora}</span>
                            <span className="truncate text-slate-800 text-[10.5px] font-medium">{e.titulo}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-7 min-w-[620px]">
            {weekDays.map((day, idx) => {
              const iso = toISODate(day);
              const isToday = isSameDay(day, today);
              const isLastCol = idx === 6;
              const dayEvents = events.filter((e) => e.data === iso);

              return (
                <div
                  key={iso}
                  className={`flex flex-col overflow-y-auto ${!isLastCol ? "border-r" : ""}`}
                  style={{ borderColor: COLORS.line }}
                >
                  <div
                    className="h-10 sm:h-11 flex items-center justify-center border-b shrink-0"
                    style={styles.dayHeader}
                  >
                    <span
                      className="text-[11px] sm:text-[12px] font-semibold"
                      style={getDayLabelStyle(isToday)}
                    >
                      {formatDayLabel(day)}
                    </span>
                  </div>

                  <div className="flex-1 p-1.5 sm:p-2 flex flex-col gap-1.5 sm:gap-2">
                    {dayEvents.map((e, j) => {
                      const meta = eventTypeMeta[e.tipo as TipoEventoKey] || Object.values(eventTypeMeta)[0]!;
                      return (
                        <div
                          key={j}
                          onClick={() => setSelectedEvent(e)}
                          className="p-1.5 sm:p-2 border-l-[3px] cursor-pointer rounded-r transition-all hover:shadow-xs"
                          style={getEventCardStyle(meta.color)}
                        >
                          <p className="mono text-[10px] sm:text-[10.5px] font-semibold" style={styles.eventTime(meta.color)}>
                            {e.hora}
                          </p>
                          <p className="text-[10.5px] sm:text-[11px] font-medium leading-snug mt-0.5 break-words" style={styles.eventTitle}>
                            {e.titulo}
                          </p>
                          {e.descricao && (
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                              {e.descricao}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NovoEventoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvento}
      />

      <EventoDetalhesModal
        open={Boolean(selectedEvent)}
        evento={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onDelete={handleDeleteEvento}
      />
    </div>
  );
};
