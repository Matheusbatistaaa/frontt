import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { NovaVisitaFormData } from "../../modules/visitas/visitas.types";
import { useInternacoes } from "../../hooks";
import {
  formatTimeInBrazil,
  getDateInBrazil,
  zonedDateTimeToUtc,
} from "../../lib/dateTime";
import { novaVisitaModalStyles as styles } from "./styles/NovaVisitaModal.styles";

interface NovaVisitaModalProps {
  onClose: () => void;
  onSubmit: (visita: NovaVisitaFormData) => Promise<void>;
}

type Relacao<T> = T | T[] | null | undefined;

interface InternacaoModalRow {
  id: number | string;
  paciente_id: number | string;
  ativo?: boolean | undefined;
  paciente?: Relacao<{ id: number | string; nome: string | null }>;
  leito?: Relacao<{ id: number | string; numero: string | null }>;
}

function firstRelation<T>(value: Relacao<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export const NovaVisitaModal: React.FC<NovaVisitaModalProps> = ({ onClose, onSubmit }) => {
  const { data: internacoes = [], isLoading, isError } = useInternacoes();
  const [pacienteId, setPacienteId] = useState("");
  const [visitante, setVisitante] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [data, setData] = useState(() => getDateInBrazil());
  const [hora, setHora] = useState(() => formatTimeInBrazil());
  const [dataSaida, setDataSaida] = useState("");
  const [horaSaida, setHoraSaida] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pacientesDisponiveis = internacoes.flatMap((internacao: InternacaoModalRow) => {
    const paciente = firstRelation(internacao.paciente);
    const leito = firstRelation(internacao.leito);
    if (!internacao.ativo || !paciente || !leito?.numero) return [];
    const id = Number(internacao.paciente_id);
    if (!Number.isSafeInteger(id) || id <= 0) return [];
    return [{
      id,
      value: String(id),
      name: paciente.nome ?? "Nome não informado",
      leito: String(leito.numero),
    }];
  });

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!pacienteId || !visitante.trim() || !parentesco.trim() || !data || !hora) {
      toast.error("Preencha o paciente, o visitante, o parentesco, a data e o horário de entrada.");
      return;
    }

    const temSaida = Boolean(dataSaida || horaSaida);
    if (temSaida && (!dataSaida || !horaSaida)) {
      toast.error("Informe a data e o horário de saída.");
      return;
    }

    const entrada = zonedDateTimeToUtc(data, hora);
    const saida = temSaida ? zonedDateTimeToUtc(dataSaida, horaSaida) : null;
    if (saida && new Date(saida).getTime() <= new Date(entrada).getTime()) {
      toast.error("A saída deve ser posterior à entrada.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        pacienteId: Number(pacienteId),
        visitante: visitante.trim(),
        parentesco: parentesco.trim(),
        data,
        hora,
        dataSaida,
        horaSaida,
      });
      setPacienteId("");
      setVisitante("");
      setParentesco("");
      setData(getDateInBrazil());
      setHora(formatTimeInBrazil());
      setDataSaida("");
      setHoraSaida("");
      onClose();
    } catch {
      // O componente responsável exibe o toast de erro e mantém o formulário aberto.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4" style={styles.overlay} onClick={() => !isSubmitting && onClose()}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto border p-4 sm:p-6 bg-white" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4 sm:mb-5">
          <div>
            <p className="display text-[1.15rem] sm:text-[1.25rem] font-semibold" style={styles.modalTitle}>
              Agendar Visita
            </p>
            <p className="text-[11.5px] sm:text-[12px] mt-0.5" style={styles.modalSubtitle}>
              Preencha os dados do visitante
            </p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 disabled:opacity-50">
            <X size={18} color={styles.modalCloseColor} />
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
              Paciente / Leito
            </label>
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              disabled={isLoading || isSubmitting}
              className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5 disabled:opacity-60"
              style={styles.fieldInput}
            >
              <option value="">{isLoading ? "Carregando pacientes..." : "Selecione o paciente"}</option>
              {pacientesDisponiveis.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.name} — Leito {p.leito}
                </option>
              ))}
            </select>
            {isError && (
              <p className="mt-1.5 text-[11px] text-red-600">Não foi possível carregar os pacientes internados.</p>
            )}
            {!isLoading && !isError && pacientesDisponiveis.length === 0 && (
              <p className="mt-1.5 text-[11px] text-slate-500">Nenhum paciente com internação ativa e leito foi encontrado.</p>
            )}
          </div>

          <div>
            <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
              Nome do visitante
            </label>
            <input
              type="text"
              value={visitante}
              onChange={(e) => setVisitante(e.target.value)}
              placeholder="Nome completo"
              className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
              style={styles.fieldInput}
            />
          </div>

          <div>
            <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
              Parentesco
            </label>
            <input
              type="text"
              value={parentesco}
              onChange={(e) => setParentesco(e.target.value)}
              placeholder="Ex.: Filho, Esposa"
              className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
              style={styles.fieldInput}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
                Data de entrada
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
                style={styles.fieldInput}
              />
            </div>
            <div>
              <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
                Horário de entrada
              </label>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
                style={styles.fieldInput}
              />
            </div>
            <div>
              <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
                Data de saída (opcional)
              </label>
              <input
                type="date"
                value={dataSaida}
                onChange={(e) => setDataSaida(e.target.value)}
                className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
                style={styles.fieldInput}
              />
            </div>
            <div>
              <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
                Horário de saída (opcional)
              </label>
              <input
                type="time"
                value={horaSaida}
                onChange={(e) => setHoraSaida(e.target.value)}
                className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
                style={styles.fieldInput}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 sm:gap-3 mt-5 sm:mt-6">
          <button onClick={onClose} disabled={isSubmitting} className="flex-1 h-10 sm:h-11 border text-xs sm:text-sm font-semibold disabled:opacity-50" style={styles.cancelButton}>
            Cancelar
          </button>
          <button onClick={() => void handleSubmit()} disabled={isSubmitting} className="flex-1 h-10 sm:h-11 text-xs sm:text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed" style={styles.confirmButton}>
            {isSubmitting ? "Agendando..." : "Agendar"}
          </button>
        </div>
      </div>
    </div>
  );
};
