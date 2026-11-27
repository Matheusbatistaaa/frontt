import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Activity,
  Stethoscope,
  ClipboardList,
  Pill,
  FlaskConical,
  Plus,
  Trash2,
  Save,
  UserCog,
} from "lucide-react";
import { TopBar } from "../../shared/components";
import {
  prontuarioStyles as styles,
  getRemoveButtonStyle,
} from "./Prontuario.styles";
import {
  Paciente,
  SinaisVitais,
  PrescricaoItem,
  ExameItem,
  ProntuarioFormData,
} from "./Prontuario.types";
import { SelecionarPacienteModal } from "../../components/modals/SelecionarPacienteModal";
import { useProntuario, useSalvarProntuario } from "../../hooks";
import { formatDateInBrazil } from "../../lib/dateTime";
import { Bed } from "../../types";

const criarPrescricaoVazia = (): PrescricaoItem => ({
  id: crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
  medicamento: "",
  dose: "",
  frequencia: "",
  duracao: "",
  observacoes: "",
});

const criarExameVazio = (): ExameItem => ({
  id: crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
  nome: "",
  tipo: "",
  urgencia: "",
  observacoes: "",
});

interface ProntuarioProps {
  bed?: Bed | null;
}

const calcularIdade = (dataNascimento?: string | null) => {
  if (!dataNascimento) return undefined;
  const somenteData = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataNascimento);
  const data = somenteData
    ? new Date(Number(somenteData[1]), Number(somenteData[2]) - 1, Number(somenteData[3]))
    : new Date(dataNascimento);
  if (Number.isNaN(data.getTime())) return undefined;
  const hoje = new Date();
  let idade = hoje.getFullYear() - data.getFullYear();
  const aniversario = hoje.getMonth() - data.getMonth();
  if (aniversario < 0 || (aniversario === 0 && hoje.getDate() < data.getDate())) idade -= 1;
  return idade >= 0 ? idade : undefined;
};

const criarPaciente = (bed?: Bed | null): Paciente | null => {
  if (!bed?.pacienteId) return null;

  const genero = bed.ficha?.genero;
  return {
    id: bed.pacienteId,
    nome: bed.name,
    idade: calcularIdade(bed.ficha?.dataNascimento),
    leito: bed.id,
    sexo: genero === "M" || genero === "F" ? genero : undefined,
    condicao: bed.ficha?.diagnostico ?? undefined,
    internacaoId: bed.internacaoId,
  };
};

const criarFormularioInicial = (paciente?: Paciente | null): ProntuarioFormData => ({
  queixaPrincipal: "",
  historiaDoenca: "",
  avaliacao: paciente?.condicao ?? "",
  orientacoes: "",
  sinaisVitais: { pa: "", fc: "", fr: "", temp: "" },
  prescricoes: [criarPrescricaoVazia()],
  exames: [criarExameVazio()],
});

interface SectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, children }: SectionProps) {
  return (
    <div
      className="bg-white border p-3.5 sm:p-5 h-full flex flex-col"
      style={styles.sectionCard}
    >
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <Icon size={16} color={styles.sectionIconColor as string} />
        <h3 className="kicker text-xs" style={styles.sectionTitle}>
          {title}
        </h3>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}

export function Prontuario({ bed }: ProntuarioProps) {
  const initialPaciente = criarPaciente(bed);
  const initialForm = criarFormularioInicial(initialPaciente);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(initialPaciente);
  const [modalTrocarAberto, setModalTrocarAberto] = useState(false);

  const [queixaPrincipal, setQueixaPrincipal] = useState(initialForm.queixaPrincipal);
  const [historiaDoenca, setHistoriaDoenca] = useState(initialForm.historiaDoenca);
  const [avaliacao, setAvaliacao] = useState(initialForm.avaliacao);
  const [orientacoes, setOrientacoes] = useState(initialForm.orientacoes);
  const [sinaisVitais, setSinaisVitais] = useState<SinaisVitais>(initialForm.sinaisVitais);
  const [prescricoes, setPrescricoes] = useState<PrescricaoItem[]>(initialForm.prescricoes);
  const [exames, setExames] = useState<ExameItem[]>(initialForm.exames);
  const [loadedPatientId, setLoadedPatientId] = useState<string | null>(null);

  const {
    data: registro,
    isLoading,
    isError,
    refetch,
  } = useProntuario(pacienteSelecionado?.id);
  const salvarProntuario = useSalvarProntuario();
  const carregandoProntuario = Boolean(pacienteSelecionado) &&
    (isLoading || loadedPatientId !== pacienteSelecionado?.id);

  useEffect(() => {
    if (!pacienteSelecionado || isLoading) return;

    const form: ProntuarioFormData = registro
      ? {
          queixaPrincipal: registro.queixa_principal ?? "",
          historiaDoenca: registro.historia_doenca ?? "",
          avaliacao: registro.avaliacao ?? "",
          orientacoes: registro.orientacoes ?? "",
          sinaisVitais: {
            pa: registro.sinais_vitais?.pa ?? "",
            fc: registro.sinais_vitais?.fc ?? "",
            fr: registro.sinais_vitais?.fr ?? "",
            temp: registro.sinais_vitais?.temp ?? "",
          },
          prescricoes: registro.prescricoes?.length ? registro.prescricoes : [criarPrescricaoVazia()],
          exames: registro.exames?.length ? registro.exames : [criarExameVazio()],
        }
      : criarFormularioInicial(pacienteSelecionado);

    setQueixaPrincipal(form.queixaPrincipal);
    setHistoriaDoenca(form.historiaDoenca);
    setAvaliacao(form.avaliacao);
    setOrientacoes(form.orientacoes);
    setSinaisVitais(form.sinaisVitais);
    setPrescricoes(form.prescricoes);
    setExames(form.exames);
    setLoadedPatientId(pacienteSelecionado.id);
  }, [pacienteSelecionado, isLoading, registro]);

  const dataAtual = formatDateInBrazil(new Date());

  const atualizarSinalVital = (campo: keyof SinaisVitais, valor: string) => {
    setSinaisVitais((prev) => ({ ...prev, [campo]: valor }));
  };

  const atualizarPrescricao = (
    id: string,
    campo: keyof Omit<PrescricaoItem, "id">,
    valor: string
  ) => {
    setPrescricoes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );
  };

  const adicionarPrescricao = () => {
    setPrescricoes((prev) => [...prev, criarPrescricaoVazia()]);
  };

  const removerPrescricao = (id: string) => {
    setPrescricoes((prev) =>
      prev.length > 1 ? prev.filter((p) => p.id !== id) : prev
    );
  };

  const atualizarExame = (
    id: string,
    campo: keyof Omit<ExameItem, "id">,
    valor: string
  ) => {
    setExames((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [campo]: valor } : e))
    );
  };

  const adicionarExame = () => {
    setExames((prev) => [...prev, criarExameVazio()]);
  };

  const removerExame = (id: string) => {
    setExames((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));
  };

  const resetarFormulario = () => {
    setQueixaPrincipal("");
    setHistoriaDoenca("");
    setAvaliacao("");
    setOrientacoes("");
    setSinaisVitais({ pa: "", fc: "", fr: "", temp: "" });
    setPrescricoes([criarPrescricaoVazia()]);
    setExames([criarExameVazio()]);
  };

  const handleSelecionarPaciente = (paciente: Paciente) => {
    setLoadedPatientId(null);
    setPacienteSelecionado(paciente);
    setModalTrocarAberto(false);
  };

  const handleTrocarPaciente = () => {
    setModalTrocarAberto(true);
  };

  const handleSalvar = async () => {
    if (!pacienteSelecionado || carregandoProntuario || isError) return;

    try {
      await salvarProntuario.mutateAsync({
        pacienteId: pacienteSelecionado.id,
        internacaoId: pacienteSelecionado.internacaoId,
        form: {
          queixaPrincipal,
          historiaDoenca,
          avaliacao,
          orientacoes,
          sinaisVitais,
          prescricoes,
          exames,
        },
      });
      toast.success("Prontuário atualizado e salvo com sucesso!");
    } catch (error) {
      toast.error(`Não foi possível salvar o prontuário: ${error instanceof Error ? error.message : "erro inesperado"}`);
    }
  };

  if (!pacienteSelecionado) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Prontuário Médico"
          subtitle="Selecione um paciente para continuar"
        />
        <SelecionarPacienteModal onSelect={handleSelecionarPaciente} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar
        title="Prontuário Médico"
        subtitle="Histórico clínico do paciente"
      />

      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6">
        <div
          className="flex flex-wrap items-center justify-between gap-2.5 bg-white border px-3 sm:px-5 py-2.5 sm:py-3 mb-4 sm:mb-5"
          style={styles.patientBar}
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} color={styles.sectionIconColor as string} className="shrink-0" />
            <span className="display text-base sm:text-[1.2rem] font-semibold truncate" style={styles.patientName}>
              {pacienteSelecionado.nome}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-[12.5px]" style={styles.patientMeta}>
            <span>Leito {pacienteSelecionado.leito}</span>
            <span style={styles.divider}>|</span>
            <span>{pacienteSelecionado.idade !== undefined ? `${pacienteSelecionado.idade} anos` : "Idade não informada"}</span>
            <span style={styles.divider}>|</span>
            <span>{dataAtual}</span>
            <button
              onClick={handleTrocarPaciente}
              className="flex items-center gap-1.5 ml-1 sm:ml-2 px-2.5 py-1 border text-[11px] sm:text-[11.5px] font-semibold"
              style={styles.trocarPacienteButton}
            >
              <UserCog size={13} />
              Trocar
            </button>
          </div>
        </div>

        {carregandoProntuario ? (
        <div className="flex flex-1 items-center justify-center text-sm" style={styles.patientMeta}>
          Carregando prontuário...
        </div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-semibold" style={styles.patientName}>
            Não foi possível carregar o prontuário.
          </p>
          <p className="text-xs" style={styles.patientMeta}>
            Verifique a conexão com o banco e tente novamente.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-semibold text-white"
            style={styles.saveButton}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-stretch">
          <Section icon={ClipboardList} title="Queixa principal">
            <textarea
              className="w-full flex-1 min-h-[96px] sm:min-h-[112px] border p-2.5 sm:p-3 text-xs sm:text-[13px] resize-none outline-none"
              style={styles.textarea}
              placeholder="Digite aqui..."
              value={queixaPrincipal}
              onChange={(e) => setQueixaPrincipal(e.target.value)}
            />
          </Section>

          <Section icon={Stethoscope} title="História da doença / Anamnese">
            <textarea
              className="w-full flex-1 min-h-[96px] sm:min-h-[112px] border p-2.5 sm:p-3 text-xs sm:text-[13px] resize-none outline-none"
              style={styles.textarea}
              placeholder="Digite aqui..."
              value={historiaDoenca}
              onChange={(e) => setHistoriaDoenca(e.target.value)}
            />
          </Section>

          <Section icon={Activity} title="Sinais vitais">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {(
                [
                  { key: "pa", label: "PA", placeholder: "--/--", unit: "mmHg" },
                  { key: "fc", label: "FC", placeholder: "--", unit: "bpm" },
                  { key: "fr", label: "FR", placeholder: "--", unit: "irpm" },
                  { key: "temp", label: "Temp.", placeholder: "--", unit: "°C" },
                ] as const
              ).map((campo) => (
                <div key={campo.key} className="flex flex-col gap-1">
                  <label className="text-[10.5px] sm:text-[11px] font-semibold" style={styles.fieldLabel}>
                    {campo.label}
                  </label>
                  <input
                    className="w-full border px-2 py-1.5 sm:px-2.5 sm:py-2 text-xs sm:text-[13px] text-center outline-none mono"
                    style={styles.input}
                    placeholder={campo.placeholder}
                    value={sinaisVitais[campo.key]}
                    onChange={(e) => atualizarSinalVital(campo.key, e.target.value)}
                  />
                  <span className="text-[10px] sm:text-[10.5px] text-center" style={styles.fieldUnit}>
                    {campo.unit}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={FileText} title="Avaliação / Hipótese diagnóstica">
            <textarea
              className="w-full flex-1 min-h-[96px] sm:min-h-[112px] border p-2.5 sm:p-3 text-xs sm:text-[13px] resize-none outline-none"
              style={styles.textarea}
              placeholder="Digite aqui..."
              value={avaliacao}
              onChange={(e) => setAvaliacao(e.target.value)}
            />
          </Section>
        </div>

        <div className="bg-white border p-3.5 sm:p-5 mt-4 sm:mt-5" style={styles.sectionCard}>
          <div className="flex items-center gap-2 mb-3">
            <Pill size={16} color={styles.sectionIconColor as string} />
            <h3 className="kicker text-xs" style={styles.sectionTitle}>
              Prescrição
            </h3>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[580px]">
              <div
                className="grid grid-cols-12 gap-3 px-1 pb-2 text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wide"
                style={styles.tableHeaderLabel}
              >
                <span className="col-span-3">Medicamento</span>
                <span className="col-span-2">Dose</span>
                <span className="col-span-2">Frequência</span>
                <span className="col-span-2">Duração</span>
                <span className="col-span-2">Observações</span>
                <span className="col-span-1" />
              </div>

              <div className="flex flex-col gap-2">
                {prescricoes.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                    <input
                      className="col-span-3 border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-[13px] outline-none"
                      style={styles.input}
                      placeholder="Nome do medicamento"
                      value={item.medicamento}
                      onChange={(e) =>
                        atualizarPrescricao(item.id, "medicamento", e.target.value)
                      }
                    />
                    <input
                      className="col-span-2 border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-[13px] outline-none"
                      style={styles.input}
                      placeholder="Ex: 500 mg"
                      value={item.dose}
                      onChange={(e) => atualizarPrescricao(item.id, "dose", e.target.value)}
                    />
                    <input
                      className="col-span-2 border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-[13px] outline-none"
                      style={styles.input}
                      placeholder="Ex: 8/8h"
                      value={item.frequencia}
                      onChange={(e) =>
                        atualizarPrescricao(item.id, "frequencia", e.target.value)
                      }
                    />
                    <input
                      className="col-span-2 border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-[13px] outline-none"
                      style={styles.input}
                      placeholder="Ex: 5 dias"
                      value={item.duracao}
                      onChange={(e) =>
                        atualizarPrescricao(item.id, "duracao", e.target.value)
                      }
                    />
                    <input
                      className="col-span-2 border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-[13px] outline-none"
                      style={styles.input}
                      placeholder="Opcional"
                      value={item.observacoes}
                      onChange={(e) =>
                        atualizarPrescricao(item.id, "observacoes", e.target.value)
                      }
                    />
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => removerPrescricao(item.id)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border"
                        style={getRemoveButtonStyle(prescricoes.length === 1)}
                        disabled={prescricoes.length === 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={adicionarPrescricao}
            className="flex items-center gap-2 mt-3 px-3 py-2 text-xs sm:text-[12.5px] font-semibold border transition-opacity hover:opacity-90"
            style={styles.addMedButton}
          >
            <Plus size={14} />
            Adicionar medicamento
          </button>
        </div>

        <div className="bg-white border p-3.5 sm:p-5 mt-4 sm:mt-5" style={styles.sectionCard}>
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={16} color={styles.sectionIconColor as string} />
            <h3 className="kicker text-xs" style={styles.sectionTitle}>
              Solicitação de exames
            </h3>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[580px]">
              <div
                className="grid grid-cols-12 gap-3 px-1 pb-2 text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wide"
                style={styles.tableHeaderLabel}
              >
                <span className="col-span-4">Exame</span>
                <span className="col-span-2">Tipo</span>
                <span className="col-span-2">Urgência</span>
                <span className="col-span-3">Observações</span>
                <span className="col-span-1" />
              </div>

              <div className="flex flex-col gap-2">
                {exames.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                    <input
                      className="col-span-4 border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-[13px] outline-none"
                      style={styles.input}
                      placeholder="Ex: Hemograma completo"
                      value={item.nome}
                      onChange={(e) => atualizarExame(item.id, "nome", e.target.value)}
                    />
                    <select
                      className="col-span-2 border px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-[13px] outline-none"
                      style={styles.input}
                      value={item.tipo}
                      onChange={(e) => atualizarExame(item.id, "tipo", e.target.value as ExameItem["tipo"])}
                    >
                      <option value="">Selecione</option>
                      <option value="laboratorial">Laboratorial</option>
                      <option value="imagem">Imagem</option>
                      <option value="funcional">Funcional</option>
                      <option value="outro">Outro</option>
                    </select>
                    <select
                      className="col-span-2 border px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-[13px] outline-none"
                      style={styles.input}
                      value={item.urgencia}
                      onChange={(e) => atualizarExame(item.id, "urgencia", e.target.value as ExameItem["urgencia"])}
                    >
                      <option value="">Selecione</option>
                      <option value="rotina">Rotina</option>
                      <option value="urgente">Urgente</option>
                      <option value="emergencia">Emergência</option>
                    </select>
                    <input
                      className="col-span-3 border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-[13px] outline-none"
                      style={styles.input}
                      placeholder="Opcional"
                      value={item.observacoes}
                      onChange={(e) =>
                        atualizarExame(item.id, "observacoes", e.target.value)
                      }
                    />
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => removerExame(item.id)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border"
                        style={getRemoveButtonStyle(exames.length === 1)}
                        disabled={exames.length === 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={adicionarExame}
            className="flex items-center gap-2 mt-3 px-3 py-2 text-xs sm:text-[12.5px] font-semibold border transition-opacity hover:opacity-90"
            style={styles.addMedButton}
          >
            <Plus size={14} />
            Adicionar exame
          </button>
        </div>

        <div className="mt-4 sm:mt-5">
          <Section icon={ClipboardList} title="Orientações / Conduta">
            <textarea
              className="w-full flex-1 min-h-[80px] sm:min-h-[96px] border p-2.5 sm:p-3 text-xs sm:text-[13px] resize-none outline-none"
              style={styles.textarea}
              placeholder="Digite aqui..."
              value={orientacoes}
              onChange={(e) => setOrientacoes(e.target.value)}
            />
          </Section>
        </div>
        </>
      )}
      </div>

      <div
        className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 px-3 sm:px-6 md:px-8 py-3 sm:py-4 border-t shrink-0"
        style={styles.footer}
      >
        <button
          onClick={resetarFormulario}
          disabled={carregandoProntuario || isError || salvarProntuario.isPending}
          className="px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-[13px] font-semibold border disabled:cursor-not-allowed disabled:opacity-50"
          style={styles.cancelButton}
        >
          Limpar
        </button>
        <button
          onClick={handleSalvar}
          disabled={!pacienteSelecionado || carregandoProntuario || isError || salvarProntuario.isPending}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={styles.saveButton}
        >
          <Save size={16} />
          Salvar prontuário
        </button>
      </div>

      {modalTrocarAberto && (
        <SelecionarPacienteModal
          onSelect={handleSelecionarPaciente}
          onClose={() => setModalTrocarAberto(false)}
        />
      )}
    </div>
  );
}
