import { useMemo, useState } from "react";
import { Search, X, User, ChevronRight } from "lucide-react";
import { Paciente } from "../../modules/prontuario/Prontuario.types";
import { usePacientes } from "../../hooks";
import {
  selecionarPacienteStyles as styles,
  getPatientRowStyle,
} from "./styles/SelecionarPacienteModal.styles";

interface SelecionarPacienteModalProps {
  onSelect: (paciente: Paciente) => void;
  onClose?: () => void;
}

export function SelecionarPacienteModal({
  onSelect,
  onClose,
}: SelecionarPacienteModalProps) {
  const [busca, setBusca] = useState("");
  const { data: pacientes = [], isLoading, isError, refetch } = usePacientes();

  const pacientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return pacientes;
    return pacientes.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        p.leito.toLowerCase().includes(termo)
    );
  }, [busca, pacientes]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4" style={styles.overlay}>
      <div
        className="w-full max-w-md max-h-[90vh] bg-white border flex flex-col overflow-hidden"
        style={styles.modalCard}
      >
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b shrink-0" style={styles.header}>
          <div className="min-w-0 flex-1">
            <h2 className="display text-base sm:text-[1.25rem] font-semibold truncate" style={styles.title}>
              Selecionar paciente
            </h2>
            <p className="text-[11px] sm:text-[12px] truncate" style={styles.subtitle}>
              Escolha o paciente para abrir o prontuário
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 shrink-0" style={styles.closeButton}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 shrink-0">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              color={styles.searchIconColor as string}
            />
            <input
              autoFocus
              className="w-full border pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 text-xs sm:text-[13px] outline-none"
              style={styles.searchInput}
              placeholder="Buscar por nome ou leito..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 sm:px-3 pb-3">
          {isLoading ? (
            <p className="text-center text-xs sm:text-[13px] py-8" style={styles.emptyText}>
              Carregando pacientes...
            </p>
          ) : isError ? (
            <div className="text-center py-8" style={styles.emptyText}>
              <p className="text-xs sm:text-[13px]">Não foi possível carregar os pacientes.</p>
              <button type="button" onClick={() => refetch()} className="mt-3 px-3 py-2 border text-xs font-semibold">
                Tentar novamente
              </button>
            </div>
          ) : pacientesFiltrados.length === 0 ? (
            <p className="text-center text-xs sm:text-[13px] py-8" style={styles.emptyText}>
              Nenhum paciente encontrado.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {pacientesFiltrados.map((paciente) => (
                <button
                  key={paciente.id}
                  onClick={() => onSelect(paciente)}
                  className="flex items-center gap-2.5 sm:gap-3 w-full text-left px-2.5 sm:px-3 py-2 sm:py-2.5 border"
                  style={getPatientRowStyle()}
                >
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0"
                    style={styles.avatar}
                  >
                    <User size={16} color={styles.avatarIconColor as string} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-[13px] font-semibold truncate" style={styles.patientName}>
                      {paciente.nome}
                    </p>
                    <p className="text-[10.5px] sm:text-[11.5px] truncate" style={styles.patientMeta}>
                      Leito {paciente.leito} • {paciente.idade !== undefined ? `${paciente.idade} anos` : "Idade não informada"} • {paciente.condicao}
                    </p>
                  </div>
                  <ChevronRight size={15} color={styles.chevronColor as string} className="shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
