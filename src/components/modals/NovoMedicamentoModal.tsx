import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { NovoMedicamentoInput } from "../../modules/medicamentos/medicamentos.types";
import { useInternacoes } from "../../hooks";
import { COLORS } from "../../config/colors";
import { novoMedicamentoModalStyles as styles } from "./styles/NovoMedicamentoModal.styles";

interface NovoMedicamentoModalProps {
  onClose: () => void;
  onSubmit: (medicamento: NovoMedicamentoInput) => Promise<boolean>;
}

interface InternacaoDisponivel {
  id: string | number;
  leito_id: string | number | null;
  paciente: { nome: string | null } | null;
  leito: { numero: string | number | null } | null;
}

const VIA_OPTIONS = ["EV", "VO", "SC", "IM"];

export const NovoMedicamentoModal: React.FC<NovoMedicamentoModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const internacoesQuery = useInternacoes();
  const [pacienteValue, setPacienteValue] = useState("");
  const [nome, setNome] = useState("");
  const [via, setVia] = useState(VIA_OPTIONS[0]!);
  const [horario, setHorario] = useState("");
  const [recorrente, setRecorrente] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const internacoes = (internacoesQuery.data ??
    []) as unknown as InternacaoDisponivel[];
  const pacientesDisponiveis = internacoes.flatMap((internacao) => {
    const paciente = internacao.paciente?.nome;
    if (!paciente) return [];

    return [
      {
        value: String(internacao.id),
        internacaoId: internacao.id,
        leito: String(internacao.leito?.numero ?? internacao.leito_id ?? "—"),
        nome: paciente,
      },
    ];
  });

  const selecionado = pacientesDisponiveis.find(
    (paciente) => paciente.value === pacienteValue,
  );

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!selecionado || !nome.trim() || !via || !horario) {
      toast.error(
        "Selecione uma internação e preencha todos os campos obrigatórios.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const sucesso = await onSubmit({
        internacaoId: selecionado.internacaoId,
        leito: selecionado.leito,
        paciente: selecionado.nome,
        nome: nome.trim(),
        via,
        horario,
        recorrente,
      });
      if (sucesso) onClose();
    } catch {
      toast.error("Não foi possível cadastrar o medicamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4"
      style={styles.overlay}
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto border p-4 sm:p-6 bg-white"
        style={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4 sm:mb-5">
          <div>
            <p
              className="display text-[1.15rem] sm:text-[1.25rem] font-semibold"
              style={styles.modalTitle}
            >
              Novo Medicamento
            </p>
            <p
              className="text-[11.5px] sm:text-[12px] mt-0.5"
              style={styles.modalSubtitle}
            >
              Cadastre um medicamento e horário de administração
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar"
            className="p-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={18} color={styles.modalCloseColor} />
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <label
              className="text-[12px] sm:text-[12.5px] font-semibold"
              style={styles.fieldLabel}
            >
              Paciente / Leito
            </label>
            <select
              value={pacienteValue}
              onChange={(event) => setPacienteValue(event.target.value)}
              disabled={
                isSubmitting ||
                internacoesQuery.isPending ||
                internacoesQuery.isError
              }
              className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5 disabled:opacity-60"
              style={styles.fieldInput}
            >
              <option value="">
                {internacoesQuery.isPending
                  ? "Carregando pacientes..."
                  : "Selecione o paciente"}
              </option>
              {pacientesDisponiveis.map((paciente) => (
                <option key={paciente.value} value={paciente.value}>
                  {paciente.nome} — Leito {paciente.leito}
                </option>
              ))}
            </select>

            {internacoesQuery.isError && (
              <div role="alert" className="mt-2">
                <p
                  className="text-[11.5px] font-semibold"
                  style={{ color: COLORS.red }}
                >
                  Não foi possível carregar as internações ativas.
                </p>
                <button
                  type="button"
                  onClick={() => void internacoesQuery.refetch()}
                  className="mt-1 text-[11.5px] font-semibold underline"
                  style={{ color: COLORS.red }}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!internacoesQuery.isPending &&
              !internacoesQuery.isError &&
              pacientesDisponiveis.length === 0 && (
                <p
                  className="mt-2 text-[11.5px]"
                  style={{ color: COLORS.slateSoft }}
                >
                  Nenhuma internação ativa encontrada.
                </p>
              )}
          </div>

          <div>
            <label
              className="text-[12px] sm:text-[12.5px] font-semibold"
              style={styles.fieldLabel}
            >
              Medicamento
            </label>
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex.: Dipirona 1g"
              className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
              style={styles.fieldInput}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="text-[12px] sm:text-[12.5px] font-semibold"
                style={styles.fieldLabel}
              >
                Via
              </label>
              <select
                value={via}
                onChange={(event) => setVia(event.target.value)}
                className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
                style={styles.fieldInput}
              >
                {VIA_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-[12px] sm:text-[12.5px] font-semibold"
                style={styles.fieldLabel}
              >
                Horário
              </label>
              <input
                type="time"
                value={horario}
                onChange={(event) => setHorario(event.target.value)}
                className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
                style={styles.fieldInput}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 mt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={recorrente}
              onChange={(event) => setRecorrente(event.target.checked)}
            />
            <span
              className="text-xs sm:text-[13px]"
              style={styles.checkboxLabel}
            >
              Repetir todos os dias neste horário
            </span>
          </label>
        </div>

        <div className="flex gap-2.5 sm:gap-3 mt-5 sm:mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-10 sm:h-11 border text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={styles.cancelButton}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={
              isSubmitting ||
              internacoesQuery.isPending ||
              internacoesQuery.isError ||
              pacientesDisponiveis.length === 0
            }
            className="flex-1 h-10 sm:h-11 text-xs sm:text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
            style={styles.confirmButton}
          >
            {isSubmitting ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
};
