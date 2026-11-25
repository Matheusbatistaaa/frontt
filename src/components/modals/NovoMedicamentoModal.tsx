import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { NovoMedicamentoInput } from "../../modules/medicamentos/medicamentos.types";
import { beds } from "../../config/mockData";
import { useInternacoes } from "../../hooks";
import { novoMedicamentoModalStyles as styles } from "./styles/NovoMedicamentoModal.styles";

interface NovoMedicamentoModalProps {
  onClose: () => void;
  onSubmit: (medicamento: NovoMedicamentoInput) => Promise<boolean>;
}

const VIA_OPTIONS = ["EV", "VO", "SC", "IM", "Inalatória", "Tópica"];

export const NovoMedicamentoModal: React.FC<NovoMedicamentoModalProps> = ({ onClose, onSubmit }) => {
  const { data: internacoes = [] } = useInternacoes();
  const [pacienteValue, setPacienteValue] = useState("");
  const [nome, setNome] = useState("");
  const [via, setVia] = useState(VIA_OPTIONS[0]);
  const [horario, setHorario] = useState("");
  const [recorrente, setRecorrente] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pacientesDisponiveis = internacoes && internacoes.length > 0
    ? internacoes.map((int: any) => ({
        value: String(int.id),
        internacaoId: int.id as number | string,
        leito: String(int.leito?.numero ?? int.leito_id ?? "—"),
        nome: int.paciente?.nome || "Paciente",
      }))
    : beds.filter((b) => b.status === "internado").map((b) => ({
        value: b.id,
        internacaoId: undefined as number | string | undefined,
        leito: b.id,
        nome: b.name,
      }));

  const selecionado = pacientesDisponiveis.find((p) => p.value === pacienteValue);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!pacienteValue || !nome || !via || !horario) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    const sucesso = await onSubmit({
      internacaoId: selecionado?.internacaoId,
      leito: selecionado?.leito ?? "",
      paciente: selecionado?.nome ?? "Paciente",
      nome,
      via,
      horario,
      recorrente,
    });
    setIsSubmitting(false);

    if (sucesso) onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4" style={styles.overlay} onClick={onClose}>
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto border p-4 sm:p-6 bg-white" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4 sm:mb-5">
          <div>
            <p className="display text-[1.15rem] sm:text-[1.25rem] font-semibold" style={styles.modalTitle}>
              Novo Medicamento
            </p>
            <p className="text-[11.5px] sm:text-[12px] mt-0.5" style={styles.modalSubtitle}>
              Cadastre um medicamento e horário de administração
            </p>
          </div>
          <button onClick={onClose} className="p-1">
            <X size={18} color={styles.modalCloseColor} />
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
              Paciente / Leito
            </label>
            <select
              value={pacienteValue}
              onChange={(e) => setPacienteValue(e.target.value)}
              className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
              style={styles.fieldInput}
            >
              <option value="">Selecione o paciente</option>
              {pacientesDisponiveis.map((bed) => (
                <option key={bed.value} value={bed.value}>
                  {bed.nome} — Leito {bed.leito}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
              Medicamento
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Dipirona 1g"
              className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
              style={styles.fieldInput}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
                Via
              </label>
              <select
                value={via}
                onChange={(e) => setVia(e.target.value)}
                className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
                style={styles.fieldInput}
              >
                {VIA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
                Horário
              </label>
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
                style={styles.fieldInput}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 mt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={recorrente}
              onChange={(e) => setRecorrente(e.target.checked)}
            />
            <span className="text-xs sm:text-[13px]" style={styles.checkboxLabel}>
              Repetir todos os dias neste horário
            </span>
          </label>
        </div>

        <div className="flex gap-2.5 sm:gap-3 mt-5 sm:mt-6">
          <button onClick={onClose} className="flex-1 h-10 sm:h-11 border text-xs sm:text-sm font-semibold" style={styles.cancelButton}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 h-10 sm:h-11 text-xs sm:text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed" style={styles.confirmButton}>
            {isSubmitting ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
};
