import { useEffect, useRef, useState } from "react";
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
} from "./Prontuario.types";
import { SelecionarPacienteModal } from "../../components/modals/SelecionarPacienteModal";
import { usePrescricoes, useSinaisVitais } from "../../hooks";
import { Bed } from "../../types";

interface ProntuarioProps {
  initialBed?: Bed | null | undefined;
  onBack?: (() => void) | undefined;
}

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

const pacienteFromBed = (bed: Bed): Paciente => {
  const genero = bed.ficha?.genero;
  return {
    id: bed.internacaoId ?? bed.id,
    internacaoId: bed.internacaoId,
    nome: bed.name,
    idade: calcularIdade(bed.ficha?.dataNascimento),
    leito: bed.id,
    sexo: genero === "F" ? "F" : genero === "M" ? "M" : undefined,
    condicao: bed.ficha?.diagnostico ?? undefined,
    diagnostico: bed.ficha?.diagnostico ?? undefined,
    dataNascimento: bed.ficha?.dataNascimento ?? undefined,
  };
};

const formatarData = (valor?: string | null) => {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR");
};

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

export function Prontuario({ initialBed, onBack }: ProntuarioProps) {
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(
    () => (initialBed ? pacienteFromBed(initialBed) : null)
  );
  const [modalTrocarAberto, setModalTrocarAberto] = useState(false);

  const [queixaPrincipal, setQueixaPrincipal] = useState("");
  const [historiaDoenca, setHistoriaDoenca] = useState("");
  const [avaliacao, setAvaliacao] = useState("");
  const [orientacoes, setOrientacoes] = useState("");
  const [sinaisVitais, setSinaisVitais] = useState<SinaisVitais>({
    pa: "",
    fc: "",
    fr: "",
    temp: "",
  });
  const [prescricoes, setPrescricoes] = useState<PrescricaoItem[]>([criarPrescricaoVazia()]);
  const [exames, setExames] = useState<ExameItem[]>([criarExameVazio()]);

  const internacaoId = pacienteSelecionado?.internacaoId;
  const { data: vitais = [] } = useSinaisVitais(internacaoId);
  const { data: prescricoesDb = [] } = usePrescricoes(internacaoId);
  const vitaisSemeadosRef = useRef<string | null>(null);
  const prescricoesSemeadasRef = useRef<string | null>(null);

  useEffect(() => {
    setPacienteSelecionado(initialBed ? pacienteFromBed(initialBed) : null);
  }, [initialBed]);

  useEffect(() => {
    setAvaliacao(pacienteSelecionado?.diagnostico ?? "");
    vitaisSemeadosRef.current = null;
    prescricoesSemeadasRef.current = null;
  }, [pacienteSelecionado?.id]);

  useEffect(() => {
    if (!internacaoId || vitaisSemeadosRef.current === internacaoId) return;

    const ultimo: any = vitais[vitais.length - 1];
    if (!ultimo) return;

    const temPressao =
      ultimo.pressao_arterial_sistolica != null && ultimo.pressao_arterial_diastolica != null;
    setSinaisVitais({
      pa: temPressao
        ? `${ultimo.pressao_arterial_sistolica}/${ultimo.pressao_arterial_diastolica}`
        : "",
      fc: ultimo.frequencia_cardiaca != null ? String(ultimo.frequencia_cardiaca) : "",
      fr: ultimo.frequencia_respiratoria != null ? String(ultimo.frequencia_respiratoria) : "",
      temp: ultimo.temperatura_corporal != null ? String(ultimo.temperatura_corporal) : "",
    });
    vitaisSemeadosRef.current = internacaoId;
  }, [internacaoId, vitais]);

  useEffect(() => {
    if (!internacaoId || prescricoesSemeadasRef.current === internacaoId) return;
    if (prescricoesDb.length === 0) return;

    setPrescricoes(
      prescricoesDb.map((p: any) => ({
        id: `db-${p.id}`,
        medicamento: p.medicamento?.nome ?? "Medicamento",
        dose: p.dosagem ?? "",
        frequencia: p.frequencia ?? "",
        duracao: p.data_fim ? formatarData(p.data_fim) : "Em andamento",
        observacoes: p.observacoes ?? p.via_administracao ?? "",
      }))
    );
    prescricoesSemeadasRef.current = internacaoId;
  }, [internacaoId, prescricoesDb]);

  const dataAtual = new Date().toLocaleDateString("pt-BR");

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
    resetarFormulario();
    setAvaliacao(paciente.diagnostico ?? "");
    setPacienteSelecionado(paciente);
    setModalTrocarAberto(false);
  };

  const handleTrocarPaciente = () => {
    resetarFormulario();
    setModalTrocarAberto(true);
  };

  const handleSalvar = () => {
    toast.success("Prontuário atualizado e salvo com sucesso!");
  };

  if (!pacienteSelecionado) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Prontuário Médico"
          subtitle="Selecione um paciente para continuar"
          onBack={onBack}
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
        onBack={onBack}
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
            <span>
              {pacienteSelecionado.idade > 0
                ? `${pacienteSelecionado.idade} anos`
                : "Idade não informada"}
            </span>
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
                      onChange={(e) => atualizarExame(item.id, "tipo", e.target.value as any)}
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
                      onChange={(e) => atualizarExame(item.id, "urgencia", e.target.value as any)}
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
      </div>

      <div
        className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 px-3 sm:px-6 md:px-8 py-3 sm:py-4 border-t shrink-0"
        style={styles.footer}
      >
        <button
          onClick={resetarFormulario}
          className="px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-[13px] font-semibold border"
          style={styles.cancelButton}
        >
          Limpar
        </button>
        <button
          onClick={handleSalvar}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
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
