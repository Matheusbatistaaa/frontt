import { useMemo, useState } from "react";
import { Search, X, User, ChevronRight } from "lucide-react";
import { Paciente } from "../../modules/prontuario/Prontuario.types";
import { useInternacoes } from "../../hooks";
import {
  selecionarPacienteStyles as styles,
  getPatientRowStyle,
} from "./styles/SelecionarPacienteModal.styles";

interface SelecionarPacienteModalProps {
  onSelect: (paciente: Paciente) => void;
  onClose?: () => void;
}

// Mantém o protótipo navegável em apresentações sem conexão com o Supabase
const PACIENTES_DEMO: Paciente[] = [
  { id: "1", nome: "Maria Silva", idade: 28, leito: "12A", sexo: "F", condicao: "Pós-operatório" },
  { id: "2", nome: "João Pereira", idade: 64, leito: "07B", sexo: "M", condicao: "Insuficiência respiratória" },
  { id: "3", nome: "Ana Costa", idade: 45, leito: "03A", sexo: "F", condicao: "Sepse" },
  { id: "4", nome: "Carlos Mendes", idade: 71, leito: "09C", sexo: "M", condicao: "AVC isquêmico" },
  { id: "5", nome: "Beatriz Santos", idade: 33, leito: "05A", sexo: "F", condicao: "Observação clínica" },
  { id: "6", nome: "Roberto Lima", idade: 58, leito: "11B", sexo: "M", condicao: "Politrauma" },
];

const calcularIdade = (dataNascimento?: string | null) => {
  if (!dataNascimento) return 0;
  const nascimento = new Date(dataNascimento);
  if (Number.isNaN(nascimento.getTime())) return 0;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const diferencaMes = hoje.getMonth() - nascimento.getMonth();
  if (diferencaMes < 0 || (diferencaMes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade -= 1;
  }
  return idade > 0 ? idade : 0;
};

export function SelecionarPacienteModal({
  onSelect,
  onClose,
}: SelecionarPacienteModalProps) {
  const [busca, setBusca] = useState("");
  const { data: internacoes = [], isLoading } = useInternacoes();

  const pacientes = useMemo<Paciente[]>(() => {
    if (internacoes.length === 0) return PACIENTES_DEMO;

    return internacoes.map((int: any) => {
      const genero = int.paciente?.genero;
      return {
        id: String(int.id),
        internacaoId: String(int.id),
        nome: int.paciente?.nome || "Paciente sem nome",
        idade: calcularIdade(int.paciente?.data_nascimento),
        leito: String(int.leito?.numero ?? "—"),
        sexo: genero === "F" ? "F" : genero === "M" ? "M" : undefined,
        condicao: int.diagnostico_principal ?? undefined,
        diagnostico: int.diagnostico_principal ?? undefined,
        dataNascimento: int.paciente?.data_nascimento ?? undefined,
      } satisfies Paciente;
    });
  }, [internacoes]);

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
                      Leito {paciente.leito}
                      {paciente.idade > 0 ? ` • ${paciente.idade} anos` : ""}
                      {paciente.condicao ? ` • ${paciente.condicao}` : ""}
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
