import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Visita } from "../../modules/visitas/visitas.types";
import { beds } from "../../config/mockData";
import { useInternacoes } from "../../hooks";
import { novaVisitaModalStyles as styles } from "./styles/NovaVisitaModal.styles";

interface NovaVisitaModalProps {
  onClose: () => void;
  onSubmit: (visita: Visita) => void;
}

export const NovaVisitaModal: React.FC<NovaVisitaModalProps> = ({ onClose, onSubmit }) => {
  const { data: internacoes = [] } = useInternacoes();
  const [leito, setLeito] = useState("");
  const [visitante, setVisitante] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [entrada, setEntrada] = useState("");
  const [saida, setSaida] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pacientesDisponiveis = internacoes && internacoes.length > 0
    ? internacoes.map((int: any) => ({
        id: String(int.leito?.numero || int.leito_id || "402"),
        name: int.paciente?.nome || "Paciente",
      }))
    : beds.filter((b) => b.status === "internado").map((b) => ({
        id: b.id,
        name: b.name,
      }));

  const pacienteSelecionado = pacientesDisponiveis.find((p) => p.id === leito);

  const handleSubmit = () => {
    if (isSubmitting) return;
    if (!leito || !visitante || !parentesco) {
      toast.error("Preencha os campos obrigatórios (Leito, Visitante e Parentesco).");
      return;
    }

    const agora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const horaEntrada = entrada || agora;
    const horaSaida = saida || "---";

    setIsSubmitting(true);
    onSubmit({
      leito,
      paciente: pacienteSelecionado?.name ?? "Paciente",
      visitante,
      parentesco,
      entrada: horaEntrada,
      saida: horaSaida,
      status: "agendada",
    });

    toast.success("Visita agendada com sucesso!");
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4" style={styles.overlay} onClick={onClose}>
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
              value={leito}
              onChange={(e) => setLeito(e.target.value)}
              className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
              style={styles.fieldInput}
            >
              <option value="">Selecione o paciente</option>
              {pacientesDisponiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — Leito {p.id}
                </option>
              ))}
            </select>
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
                Entrada
              </label>
              <input
                type="time"
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
                style={styles.fieldInput}
              />
            </div>
            <div>
              <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
                Saída
              </label>
              <input
                type="time"
                value={saida}
                onChange={(e) => setSaida(e.target.value)}
                className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
                style={styles.fieldInput}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 sm:gap-3 mt-5 sm:mt-6">
          <button onClick={onClose} className="flex-1 h-10 sm:h-11 border text-xs sm:text-sm font-semibold" style={styles.cancelButton}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 h-10 sm:h-11 text-xs sm:text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed" style={styles.confirmButton}>
            Agendar
          </button>
        </div>
      </div>
    </div>
  );
};
