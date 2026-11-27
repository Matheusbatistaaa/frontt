import React, { useState } from "react";
import { X, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { eventTypeMeta } from "../../modules/calendario/calendarioData";
import type { NovoEventoFormData, TipoEventoKey } from "../../modules/calendario/calendario.types";
import {
  formatTimeInBrazil,
  getDateInBrazil,
  zonedDateTimeToUtc,
} from "../../lib/dateTime";
import {
  novoEventoModalStyles as styles,
  getTypeChipStyle,
} from "./styles/NovoEventoModal.styles";

export type { NovoEventoFormData } from "../../modules/calendario/calendario.types";

interface NovoEventoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (evento: NovoEventoFormData) => Promise<void>;
}

const tipoKeys = Object.keys(eventTypeMeta) as TipoEventoKey[];

const getDefaultSchedule = () => {
  const agora = new Date();
  const data = getDateInBrazil(agora);
  const hora = formatTimeInBrazil(agora);
  const fim = new Date(new Date(zonedDateTimeToUtc(data, hora)).getTime() + 60 * 60 * 1000);
  return { data, hora, dataFim: getDateInBrazil(fim), horaFim: formatTimeInBrazil(fim) };
};

export const NovoEventoModal: React.FC<NovoEventoModalProps> = ({ open, onClose, onSave }) => {
  const [tipo, setTipo] = useState<TipoEventoKey>(tipoKeys[0]!);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(() => getDefaultSchedule().data);
  const [hora, setHora] = useState(() => formatTimeInBrazil());
  const [dataFim, setDataFim] = useState(() => getDefaultSchedule().dataFim);
  const [horaFim, setHoraFim] = useState(() => getDefaultSchedule().horaFim);
  const [observacoes, setObservacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!titulo.trim() || !data || !hora || !dataFim || !horaFim) {
      toast.error("Preencha o título, o início e o término do evento.");
      return;
    }

    const inicio = new Date(zonedDateTimeToUtc(data, hora));
    const fim = new Date(zonedDateTimeToUtc(dataFim, horaFim));
    if (fim.getTime() <= inicio.getTime()) {
      toast.error("O término do evento deve ser posterior ao início.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ tipo, titulo: titulo.trim(), data, hora, dataFim, horaFim, observacoes });
      const defaults = getDefaultSchedule();
      setTipo(tipoKeys[0]!);
      setTitulo("");
      setData(defaults.data);
      setHora(defaults.hora);
      setDataFim(defaults.dataFim);
      setHoraFim(defaults.horaFim);
      setObservacoes("");
      onClose();
    } catch {
      // O componente responsável exibe o toast de erro e mantém o formulário aberto.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4" style={styles.overlay}>
      <div className="w-[440px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-white" style={styles.card}>
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3.5 sm:py-5 border-b" style={styles.header}>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0" style={styles.headerIconWrap}>
              <CalendarPlus size={16} color={styles.headerIconColor} />
            </div>
            <p className="display text-base sm:text-[1.25rem] font-semibold truncate" style={styles.title}>
              Novo Evento
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="w-7 h-7 flex items-center justify-center p-1 disabled:opacity-50">
            <X size={16} color={styles.closeIconColor} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-3.5 sm:px-6 py-3.5 sm:py-5 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <label className="text-[11.5px] font-semibold" style={styles.label}>
              Tipo de evento
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {tipoKeys.map((k) => {
                const meta = eventTypeMeta[k] || Object.values(eventTypeMeta)[0]!;
                const selected = tipo === k;
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setTipo(k)}
                    className="px-2.5 sm:px-3 h-7 sm:h-8 text-[11px] sm:text-[12px] font-semibold flex items-center gap-1.5 rounded"
                    style={getTypeChipStyle(meta.color, selected)}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-semibold" style={styles.label}>
              Título
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Consulta pós-operatória"
              className="h-9 sm:h-10 px-3 text-xs sm:text-[13px] border outline-none"
              style={styles.input}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-semibold" style={styles.label}>
                Data
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-9 sm:h-10 px-3 text-xs sm:text-[13px] border outline-none"
                style={styles.input}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-semibold" style={styles.label}>
                Horário
              </label>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="h-9 sm:h-10 px-3 text-xs sm:text-[13px] border outline-none"
                style={styles.input}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-semibold" style={styles.label}>
                Data de término
              </label>
              <input
                type="date"
                required
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="h-9 sm:h-10 px-3 text-xs sm:text-[13px] border outline-none"
                style={styles.input}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-semibold" style={styles.label}>
                Horário de término
              </label>
              <input
                type="time"
                required
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="h-9 sm:h-10 px-3 text-xs sm:text-[13px] border outline-none"
                style={styles.input}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-semibold" style={styles.label}>
              Observações (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Detalhes adicionais sobre o evento..."
              className="px-3 py-2 text-xs sm:text-[13px] border outline-none resize-none"
              style={styles.input}
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold disabled:opacity-50" style={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed" style={styles.saveButton}>
              Salvar evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
