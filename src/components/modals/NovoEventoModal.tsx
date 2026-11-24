import React, { useState } from "react";
import { X, CalendarPlus } from "lucide-react";
import { eventTypeMeta } from "../../modules/calendario/calendarioData";
import { TipoEventoKey } from "../../modules/calendario/calendario.types";
import {
  novoEventoModalStyles as styles,
  getTypeChipStyle,
} from "./styles/NovoEventoModal.styles";

export interface NovoEventoFormData {
  tipo: TipoEventoKey;
  titulo: string;
  data: string;
  hora: string;
  observacoes: string;
}

interface NovoEventoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (evento: NovoEventoFormData) => void;
}

const tipoKeys = Object.keys(eventTypeMeta) as TipoEventoKey[];

export const NovoEventoModal: React.FC<NovoEventoModalProps> = ({ open, onClose, onSave }) => {
  const [tipo, setTipo] = useState<TipoEventoKey>(tipoKeys[0]!);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!titulo.trim() || !hora.trim()) return;

    setIsSubmitting(true);
    onSave({ tipo, titulo, data, hora, observacoes });

    setTipo(tipoKeys[0]!);
    setTitulo("");
    setData(new Date().toISOString().slice(0, 10));
    setHora("");
    setObservacoes("");
    onClose();
    setIsSubmitting(false);
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
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center p-1">
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
                value={hora}
                onChange={(e) => setHora(e.target.value)}
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
            <button type="button" onClick={onClose} className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold" style={styles.cancelButton}>
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
