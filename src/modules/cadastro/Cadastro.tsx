import React, { useState, useEffect, useCallback } from "react";
import { ClipboardList, Save, UserPlus, BedSingle } from "lucide-react";
import { TopBar } from "../../shared/components";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { cadastroStyles as styles, getSubmitButtonStyle } from "./cadastro.styles";

interface Leito {
  id: number;
  numero: string;
  status: string;
}

interface PacienteCadastrado {
  id: number;
  nome: string;
  leito?: string | null;
  criadoEm?: string;
}

const GENERO_OPTIONS = [
  { value: "F", label: "Feminino" },
  { value: "M", label: "Masculino" },
];

const FormField = ({ label, value, onChange, placeholder, type = "text", span = 1 }: any) => (
  <div className={span === 2 ? "col-span-1 sm:col-span-2" : "col-span-1"}>
    <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
      style={styles.fieldInput}
    />
  </div>
);

export const Cadastro: React.FC = () => {
  const queryClient = useQueryClient();
  const [leitos, setLeitos] = useState<Leito[]>([]);
  const [pacientes, setPacientes] = useState<PacienteCadastrado[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [lgpd, setLgpd] = useState(false);
  const [camera, setCamera] = useState(false);
  const podeSubmeter = lgpd && camera;

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [genero, setGenero] = useState("");
  const [convenio, setConvenio] = useState("");
  const [contatoEmergencia, setContatoEmergencia] = useState("");
  const [numeroEmergencia, setNumeroEmergencia] = useState("");
  const [alergias, setAlergias] = useState("");
  const [diagnostico, setDiagnostico] = useState("");

  const carregar = useCallback(async () => {
    const [leitosResp, internacoesResp] = await Promise.all([
      supabase.from("leitos").select("id, numero, status").order("numero"),
      supabase
        .from("internacoes")
        .select("id, data_internacao, paciente:pacientes(nome), leito:leitos(numero)")
        .eq("ativo", true)
        .order("id", { ascending: false })
        .limit(10),
    ]);

    if (leitosResp.data) setLeitos(leitosResp.data as Leito[]);
    if (internacoesResp.data) {
      setPacientes(
        internacoesResp.data.map((int: any) => ({
          id: int.id,
          nome: int.paciente?.nome ?? "Desconhecido",
          leito: int.leito?.numero ?? null,
          criadoEm: int.data_internacao,
        }))
      );
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const leitosLivresDb = leitos.filter((l) => l.status === "livre");

  const limparFormulario = () => {
    setNome("");
    setCpf("");
    setDataNascimento("");
    setGenero("");
    setConvenio("");
    setContatoEmergencia("");
    setNumeroEmergencia("");
    setAlergias("");
    setDiagnostico("");
    setLgpd(false);
    setCamera(false);
  };

  const handleCadastrar = async () => {
    if (!nome.trim() || !cpf.trim() || !dataNascimento || !genero) {
      toast.error("Preencha nome, CPF, data de nascimento e sexo");
      return;
    }

    if (leitosLivresDb.length === 0) {
      toast.error("Nenhum leito livre disponível no momento");
      return;
    }

    setSalvando(true);
    try {
      const { data: existente } = await supabase
        .from("pacientes")
        .select("id")
        .eq("cpf", cpf.trim())
        .maybeSingle();

      if (existente) {
        toast.error("Já existe um paciente cadastrado com este CPF");
        return;
      }

      const leito = leitosLivresDb[Math.floor(Math.random() * leitosLivresDb.length)]!;

      const { data: novoPaciente, error: erroPaciente } = await supabase
        .from("pacientes")
        .insert({
          nome: nome.trim(),
          cpf: cpf.trim(),
          data_nascimento: dataNascimento,
          genero,
          convenio: convenio.trim() || null,
          contato_emergencia: contatoEmergencia.trim() || null,
          numero_emergencia: numeroEmergencia.trim() || null,
          alergias: alergias.trim() || null,
        })
        .select("id")
        .single();

      if (erroPaciente) throw erroPaciente;

      const { error: erroInternacao } = await supabase.from("internacoes").insert({
        paciente_id: novoPaciente.id,
        leito_id: leito.id,
        diagnostico_principal: diagnostico.trim() || "A definir",
        medico_responsavel_id: 1,
        data_internacao: new Date().toISOString(),
        ativo: true,
      });

      if (erroInternacao) {
        await supabase.from("pacientes").delete().eq("id", novoPaciente.id);
        throw erroInternacao;
      }

      await supabase.from("leitos").update({ status: "ocupado" }).eq("id", leito.id);

      toast.success(`Paciente cadastrado no leito ${leito.numero}!`);
      limparFormulario();
      await Promise.all([
        carregar(),
        queryClient.invalidateQueries({ queryKey: ["internacoes"] }),
      ]);
    } catch (err: any) {
      toast.error(`Falha ao cadastrar paciente: ${err?.message ?? "erro inesperado"}`);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Cadastro de Pacientes" subtitle="Admissão e vinculação de leito · Ala UTI 2" />

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-5 gap-4 lg:gap-6 px-3 sm:px-6 md:px-8 py-4 sm:py-7 overflow-y-auto lg:overflow-hidden">
        <div className="col-span-1 lg:col-span-3 bg-white border p-3.5 sm:p-6 overflow-y-auto" style={styles.cardBorder}>
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <ClipboardList size={17} color={styles.cadastroIconColor} />
            <p className="display text-[1.1rem] sm:text-[1.15rem] font-semibold" style={styles.cardTitle}>
              Dados do paciente
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Nome completo" placeholder="Nome do paciente" span={2} value={nome} onChange={setNome} />
            <FormField label="CPF" placeholder="000.000.000-00" value={cpf} onChange={setCpf} />
            <FormField label="Data de nascimento" type="date" value={dataNascimento} onChange={setDataNascimento} />

            <div className="col-span-1">
              <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
                Sexo
              </label>
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
                className="w-full h-10 sm:h-11 border px-3 text-xs sm:text-sm outline-none mt-1.5"
                style={styles.fieldInput}
              >
                <option value="">Selecione</option>
                {GENERO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <FormField label="Convênio" placeholder="Ex.: SUS, Bradesco Saúde" value={convenio} onChange={setConvenio} />

            <div className="col-span-1 sm:col-span-2">
              <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
                Leito atribuído
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <div
                  className="flex-1 h-10 sm:h-11 border px-3 flex items-center text-xs sm:text-sm truncate"
                  style={styles.fieldInput}
                >
                  <BedSingle size={15} color={styles.bedIconColor} className="mr-2 shrink-0" />
                  <span className="truncate">
                    Atribuição automática
                    {leitosLivresDb.length > 0
                      ? ` — ${leitosLivresDb.length} ${leitosLivresDb.length > 1 ? "disponíveis" : "disponível"}`
                      : " — nenhum livre"}
                  </span>
                </div>
              </div>
              <p className="text-[10.5px] sm:text-[11px] mt-1" style={styles.fieldInput}>
                O leito é sorteado automaticamente dentre os disponíveis.
              </p>
            </div>

            <FormField
              label="Contato de emergência"
              placeholder="Nome do contato"
              value={contatoEmergencia}
              onChange={setContatoEmergencia}
            />
            <FormField
              label="Telefone de emergência"
              placeholder="(11) 90000-0000"
              value={numeroEmergencia}
              onChange={setNumeroEmergencia}
            />
            <FormField
              label="Alergias conhecidas"
              placeholder="Ex.: Dipirona, látex"
              span={2}
              value={alergias}
              onChange={setAlergias}
            />

            <div className="col-span-1 sm:col-span-2">
              <label className="text-[12px] sm:text-[12.5px] font-semibold" style={styles.fieldLabel}>
                Diagnóstico inicial
              </label>
              <textarea
                placeholder="Descreva o quadro clínico de admissão"
                rows={3}
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                className="w-full border px-3 py-2 sm:py-2.5 mt-1.5 text-xs sm:text-sm outline-none resize-none"
                style={styles.fieldInput}
              />
            </div>
          </div>

          <div className="mt-4 sm:mt-5 flex flex-col gap-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={lgpd}
                onChange={(e) => setLgpd(e.target.checked)}
                className="mt-0.5"
                style={styles.checkboxAccent}
              />
              <span className="text-[11.5px] sm:text-[12px] leading-relaxed" style={styles.checkboxText}>
                Confirmo que o paciente/responsável foi informado sobre o tratamento de dados pessoais e clínicos, conforme a LGPD (Lei 13.709/2018).
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={camera}
                onChange={(e) => setCamera(e.target.checked)}
                className="mt-0.5"
                style={styles.checkboxAccent}
              />
              <span className="text-[11.5px] sm:text-[12px] leading-relaxed" style={styles.checkboxText}>
                Autorizo o monitoramento por câmera com reconhecimento de expressão facial (IA PerceptAI) para fins clínicos.
              </span>
            </label>
          </div>

          <button
            onClick={handleCadastrar}
            disabled={!podeSubmeter || salvando}
            className="w-full h-11 sm:h-12 text-white font-semibold text-xs sm:text-sm mt-5 sm:mt-6 flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={getSubmitButtonStyle(podeSubmeter && !salvando)}
          >
            <Save size={16} /> {salvando ? "Cadastrando..." : "Cadastrar Paciente"}
          </button>
        </div>

        <div className="col-span-1 lg:col-span-2 flex flex-col gap-3.5 sm:gap-4 overflow-y-auto min-h-0">
          <div className="bg-white border p-3.5 sm:p-5" style={styles.cardBorder}>
            <p className="kicker mb-2.5 sm:mb-3 text-xs" style={styles.cardTitle}>
              Leitos disponíveis
            </p>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              {leitosLivresDb.map((l) => (
                <div key={l.id} className="flex items-center justify-between px-2.5 sm:px-3 py-2" style={styles.bedRow}>
                  <div className="flex items-center gap-2">
                    <BedSingle size={15} color={styles.bedIconColor} />
                    <span className="text-xs sm:text-[12.5px] font-semibold" style={styles.bedLabel}>
                      Leito {l.numero}
                    </span>
                  </div>
                  <span className="text-[10.5px] sm:text-[11px] font-semibold" style={styles.bedStatus}>
                    Livre
                  </span>
                </div>
              ))}
              {leitosLivresDb.length === 0 && (
                <p className="text-xs" style={styles.cadastroInfo}>Nenhum leito livre no momento.</p>
              )}
            </div>
          </div>

          <div className="bg-white border p-3.5 sm:p-5" style={styles.cardBorder}>
            <p className="kicker mb-2.5 sm:mb-3 text-xs" style={styles.cardTitle}>
              Cadastros recentes
            </p>
            <div className="flex flex-col gap-2.5 sm:gap-3 max-h-60 overflow-y-auto">
              {pacientes.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 border-b last:border-0" style={styles.cardBorder}>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0" style={styles.cadastroIconBox}>
                    <UserPlus size={15} color={styles.cadastroIconColor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-[12.5px] font-semibold truncate" style={styles.cadastroNome}>
                      {c.nome}
                    </p>
                    <p className="text-[10.5px] sm:text-[11px] truncate" style={styles.cadastroInfo}>
                      {c.leito ? `Leito ${c.leito} · ` : ""}
                      {c.criadoEm ? `Admissão: ${new Date(c.criadoEm).toLocaleDateString()}` : "Recente"}
                    </p>
                  </div>
                </div>
              ))}
              {pacientes.length === 0 && (
                <p className="text-xs" style={styles.cadastroInfo}>Nenhum cadastro ainda.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
