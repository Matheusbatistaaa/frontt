import React, { useState } from "react";
import {
  Pill,
  Clock,
  AlertCircle,
  CheckCircle2,
  Syringe,
  Plus,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TopBar } from "../../shared/components";
import { COLORS } from "../../config/colors";
import { Medicamento, NovoMedicamentoInput } from "./medicamentos.types";
import { NovoMedicamentoModal } from "../../components/modals/NovoMedicamentoModal";
import {
  medicamentosStyles as styles,
  statusCfg as statusIcons,
  getKpiIconBoxStyle,
  getStatusBadgeStyle,
  getStatusLabelStyle,
  getToggleButtonStyle,
} from "./Medicamentos.styles";
import { supabase } from "../../lib/supabase";
import { getCurrentProfessionalId } from "../../lib/professional";
import {
  formatTimeInBrazil,
  getDateInBrazil,
  parseTimestamp,
  zonedDateTimeToUtc,
} from "../../lib/dateTime";

const statusIconMap = {
  administrado: CheckCircle2,
  pendente: Clock,
  atrasado: AlertCircle,
};

interface KPICardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}

interface AdministracaoRow {
  id: string | number;
  status: string;
  data_hora_planejada: string | null;
  prescricao: {
    via_administracao: string | null;
    frequencia: string | null;
    medicamento: { nome: string | null } | null;
    internacao: {
      paciente: { nome: string | null } | null;
      leito: { numero: string | number | null } | null;
    } | null;
  } | null;
}

const KPICard: React.FC<KPICardProps> = ({
  icon: Icon,
  label,
  value,
  accent,
}) => (
  <div
    className="bg-white border p-3.5 sm:p-4 flex items-center gap-3"
    style={styles.kpiCard}
  >
    <div
      className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0"
      style={getKpiIconBoxStyle(accent)}
    >
      <Icon size={18} color={accent} />
    </div>
    <div className="min-w-0">
      <p
        className="mono text-base sm:text-lg font-bold leading-none"
        style={styles.kpiValue}
      >
        {value}
      </p>
      <p
        className="text-[11px] sm:text-[11.5px] mt-1 truncate"
        style={styles.kpiLabel}
      >
        {label}
      </p>
    </div>
  </div>
);

const VIA_PARA_FORMA: Record<string, string> = {
  EV: "injecao",
  IM: "injecao",
  SC: "injecao",
  VO: "comprimido",
};

const deriveStatus = (
  status: string,
  planejada?: string | null,
): Medicamento["status"] => {
  if (status === "administrado") return "administrado";
  if (status === "atrasado") return "atrasado";
  if (planejada && parseTimestamp(planejada).getTime() < Date.now())
    return "atrasado";
  return "pendente";
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "erro inesperado";

export const Medicamentos: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const administracoesQuery = useQuery<AdministracaoRow[]>({
    queryKey: ["administracoes", undefined],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("administracoes_medicamento")
        .select(
          `
          id,
          status,
          data_hora_planejada,
          prescricao:prescricoes_medicamentos(
            via_administracao,
            frequencia,
            medicamento:medicamentos(nome),
            internacao:internacoes(
              paciente:pacientes(nome),
              leito:leitos(numero)
            )
          )
        `,
        )
        .order("data_hora_planejada", { ascending: true })
        .returns<AdministracaoRow[]>();

      if (error) throw error;
      return data ?? [];
    },
  });

  const items: Medicamento[] = (administracoesQuery.data ?? []).flatMap(
    (admin) => {
      if (admin.status === "cancelado") return [];

      const prescricao = admin.prescricao;
      const paciente = prescricao?.internacao?.paciente?.nome;
      const medicamento = prescricao?.medicamento?.nome;

      if (!prescricao || !paciente || !medicamento) return [];

      const frequencia = prescricao.frequencia?.trim() ?? "";
      return [
        {
          id: admin.id,
          leito: String(prescricao.internacao?.leito?.numero ?? "—"),
          paciente,
          nome: medicamento,
          via: prescricao.via_administracao ?? "—",
          horario: formatTimeInBrazil(admin.data_hora_planejada),
          status: deriveStatus(admin.status, admin.data_hora_planejada),
          recorrente:
            frequencia.length > 0 && !/dose\s+única/i.test(frequencia),
        },
      ];
    },
  );

  const toggleAdministrado = async (
    id: string | number,
    currentStatus: string,
  ) => {
    if (updatingId !== null) return;
    const newStatus =
      currentStatus === "administrado" ? "pendente" : "administrado";
    setUpdatingId(id);

    try {
      let administradoPorId: string | number | null = null;
      let dataHoraAdministrada: string | null = null;

      if (newStatus === "administrado") {
        administradoPorId = await getCurrentProfessionalId();
        if (administradoPorId === null) {
          throw new Error("O profissional autenticado não foi encontrado.");
        }
        dataHoraAdministrada = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("administracoes_medicamento")
        .update({
          status: newStatus,
          data_hora_administrada: dataHoraAdministrada,
          administrado_por_id: administradoPorId,
        })
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error(
          "A administração não foi encontrada ou não pode ser atualizada.",
        );

      await queryClient.invalidateQueries({ queryKey: ["administracoes"] });
      toast.success(
        newStatus === "administrado" ? "Dose confirmada." : "Dose reaberta.",
      );
    } catch (err) {
      await queryClient.invalidateQueries({ queryKey: ["administracoes"] });
      toast.error(
        `Não foi possível atualizar a administração: ${getErrorMessage(err)}`,
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddMedicamento = async (
    novo: NovoMedicamentoInput,
  ): Promise<boolean> => {
    const internacaoId = Number(novo.internacaoId);
    if (!Number.isSafeInteger(internacaoId) || internacaoId <= 0) {
      toast.error("Selecione uma internação ativa válida.");
      return false;
    }
    if (
      !novo.nome.trim() ||
      !novo.via ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(novo.horario)
    ) {
      toast.error("Preencha o medicamento, a via e um horário válido.");
      return false;
    }

    let medicamentoId: string | number | null = null;
    let prescricaoId: string | number | null = null;
    let administracaoId: string | number | null = null;

    try {
      const profissionalId = await getCurrentProfessionalId();
      if (profissionalId === null) {
        throw new Error("O profissional autenticado não foi encontrado.");
      }

      const { data: internacao, error: internacaoError } = await supabase
        .from("internacoes")
        .select("id")
        .eq("id", internacaoId)
        .eq("ativo", true)
        .maybeSingle();

      if (internacaoError) throw internacaoError;
      if (!internacao)
        throw new Error("A internação selecionada não está mais ativa.");

      const { data: medicamento, error: medicamentoError } = await supabase
        .from("medicamentos")
        .insert({
          nome: novo.nome.trim(),
          principio_ativo: novo.nome.trim(),
          forma_farmaceutica: VIA_PARA_FORMA[novo.via] ?? "injecao",
          concentracao: "—",
          unidade_medida: novo.via === "VO" ? "comprimido" : "ampola",
        })
        .select("id")
        .single();

      if (medicamentoError) throw medicamentoError;
      if (
        !medicamento ||
        medicamento.id === null ||
        medicamento.id === undefined
      ) {
        throw new Error("O medicamento não foi retornado após a gravação.");
      }
      medicamentoId = medicamento.id;

      const { data: prescricao, error: prescricaoError } = await supabase
        .from("prescricoes_medicamentos")
        .insert({
          internacao_id: internacaoId,
          medicamento_id: medicamentoId,
          prescrito_por_id: profissionalId,
          dosagem: "—",
          via_administracao: novo.via,
          frequencia: novo.recorrente ? "diária" : "dose única",
          data_inicio: new Date().toISOString(),
          status: "ativa",
        })
        .select("id")
        .single();

      if (prescricaoError) throw prescricaoError;
      if (
        !prescricao ||
        prescricao.id === null ||
        prescricao.id === undefined
      ) {
        throw new Error("A prescrição não foi retornada após a gravação.");
      }
      prescricaoId = prescricao.id;

      const planejada = zonedDateTimeToUtc(getDateInBrazil(), novo.horario);
      const { data: administracao, error: administracaoError } = await supabase
        .from("administracoes_medicamento")
        .insert({
          prescricao_id: prescricaoId,
          data_hora_planejada: planejada,
          status: "pendente",
        })
        .select("id")
        .single();

      if (administracaoError) throw administracaoError;
      if (
        !administracao ||
        administracao.id === null ||
        administracao.id === undefined
      ) {
        throw new Error("A administração não foi retornada após a gravação.");
      }
      administracaoId = administracao.id;
    } catch (err) {
      let falhaLimpeza = "";

      if (administracaoId !== null) {
        const { data, error: cleanupError } = await supabase
          .from("administracoes_medicamento")
          .delete()
          .eq("id", administracaoId)
          .select("id")
          .maybeSingle();
        if (cleanupError || !data) {
          console.error(
            "[Medicamentos] Falha ao remover administração temporária:",
            cleanupError,
          );
          falhaLimpeza =
            " Não foi possível concluir a limpeza dos registros temporários.";
        }
      }

      if (prescricaoId !== null) {
        const { data, error: cleanupError } = await supabase
          .from("prescricoes_medicamentos")
          .delete()
          .eq("id", prescricaoId)
          .select("id")
          .maybeSingle();
        if (cleanupError || !data) {
          console.error(
            "[Medicamentos] Falha ao remover prescrição temporária:",
            cleanupError,
          );
          falhaLimpeza =
            " Não foi possível concluir a limpeza dos registros temporários.";
        }
      }

      if (medicamentoId !== null) {
        const { data, error: cleanupError } = await supabase
          .from("medicamentos")
          .delete()
          .eq("id", medicamentoId)
          .select("id")
          .maybeSingle();
        if (cleanupError || !data) {
          console.error(
            "[Medicamentos] Falha ao remover medicamento temporário:",
            cleanupError,
          );
          falhaLimpeza =
            " Não foi possível concluir a limpeza dos registros temporários.";
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["administracoes"] }),
        queryClient.invalidateQueries({ queryKey: ["medicamentos"] }),
      ]);
      toast.error(
        `Falha ao cadastrar medicamento: ${getErrorMessage(err)}${falhaLimpeza}`,
      );
      return false;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["administracoes"] }),
      queryClient.invalidateQueries({ queryKey: ["medicamentos"] }),
    ]);
    toast.success(
      novo.recorrente
        ? "Medicamento adicionado à rotina diária!"
        : "Medicamento agendado!",
    );
    return true;
  };

  const pendentesOuAtrasados = items.filter(
    (item) => item.status !== "administrado",
  ).length;

  return (
    <div className="flex flex-col flex-1 overflow-x-hidden">
      <div className="sticky top-0 z-10">
        <TopBar
          title="Medicamentos"
          subtitle="Administração e horários por leito"
        />
      </div>

      <div className="flex items-center justify-between px-3 sm:px-6 md:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 flex-1">
          <KPICard
            icon={Pill}
            label="Doses programadas"
            value={items.length}
            accent={COLORS.slate}
          />
          <KPICard
            icon={Clock}
            label="Pendentes / atrasadas"
            value={pendentesOuAtrasados}
            accent={COLORS.orange}
          />
          <KPICard
            icon={AlertCircle}
            label="Atrasadas"
            value={items.filter((item) => item.status === "atrasado").length}
            accent={COLORS.red}
          />
        </div>
      </div>

      <div className="flex justify-end px-3 sm:px-6 md:px-8 mt-3 sm:mt-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={styles.addButton}
        >
          <Plus size={16} />
          Novo Medicamento
        </button>
      </div>

      <div
        className="mx-3 sm:mx-6 md:mx-8 my-4 sm:my-5 bg-white border overflow-x-auto flex flex-col"
        style={styles.tableCard}
      >
        <div className="min-w-[640px]">
          <div
            className="grid grid-cols-12 px-4 sm:px-5 h-11 items-center border-b shrink-0"
            style={styles.tableHeader}
          >
            {[
              "Horário",
              "Leito",
              "Paciente",
              "Medicamento",
              "Via",
              "Status",
              "",
            ].map((header, index) => (
              <span
                key={index}
                className={`text-[11px] font-semibold uppercase tracking-wide ${
                  [
                    "col-span-1",
                    "col-span-1",
                    "col-span-2",
                    "col-span-3",
                    "col-span-2",
                    "col-span-2",
                    "col-span-1",
                  ][index]
                }`}
                style={styles.tableHeaderLabel}
              >
                {header}
              </span>
            ))}
          </div>
          <div>
            {administracoesQuery.isPending && (
              <p
                className="px-4 sm:px-5 py-6 text-xs sm:text-sm"
                style={{ color: COLORS.slateSoft }}
              >
                Carregando prescrições...
              </p>
            )}

            {administracoesQuery.isError && (
              <div
                role="alert"
                className="px-4 sm:px-5 py-6"
                style={{ background: COLORS.redSoft }}
              >
                <p
                  className="text-xs sm:text-sm font-semibold"
                  style={{ color: COLORS.red }}
                >
                  Não foi possível carregar as prescrições:{" "}
                  {getErrorMessage(administracoesQuery.error)}
                </p>
                <button
                  type="button"
                  onClick={() => void administracoesQuery.refetch()}
                  className="mt-2 text-xs sm:text-sm font-semibold underline"
                  style={{ color: COLORS.red }}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {!administracoesQuery.isPending &&
              !administracoesQuery.isError &&
              items.length === 0 && (
                <p
                  className="px-4 sm:px-5 py-6 text-xs sm:text-sm"
                  style={{ color: COLORS.slateSoft }}
                >
                  Nenhuma administração cadastrada. Use "Novo Medicamento" para
                  agendar a primeira dose.
                </p>
              )}

            {[...items]
              .sort((a, b) => a.horario.localeCompare(b.horario))
              .map((item) => {
                const cfg = statusIcons[item.status] || statusIcons.pendente;
                const StatusIcon = statusIconMap[item.status] || Clock;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 px-4 sm:px-5 h-16 items-center border-b last:border-0"
                    style={styles.row}
                  >
                    <span
                      className="col-span-1 mono text-[12.5px] sm:text-[13px] font-semibold"
                      style={styles.horario}
                    >
                      {item.horario}
                    </span>
                    <span
                      className="col-span-1 font-bold text-[12.5px] sm:text-[13px]"
                      style={styles.leito}
                    >
                      {item.leito}
                    </span>
                    <span
                      className="col-span-2 text-[12px] sm:text-[12.5px] truncate pr-2"
                      style={styles.paciente}
                    >
                      {item.paciente}
                    </span>
                    <span
                      className="col-span-3 text-[12.5px] sm:text-[13px] font-medium flex items-center gap-1.5 sm:gap-2 truncate pr-2"
                      style={styles.nome}
                    >
                      <Syringe
                        size={14}
                        color={styles.nomeIconColor}
                        className="shrink-0"
                      />
                      <span className="truncate">{item.nome}</span>
                      {item.recorrente && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                          style={styles.via}
                        >
                          diário
                        </span>
                      )}
                    </span>
                    <span
                      className="col-span-2 text-[11.5px] sm:text-[12px] px-2 py-1 w-fit truncate"
                      style={styles.via}
                    >
                      {item.via}
                    </span>
                    <div
                      className="col-span-2 flex items-center gap-1.5 px-2 py-1 w-fit"
                      style={getStatusBadgeStyle(cfg.bg)}
                    >
                      <StatusIcon size={13} color={cfg.fg} />
                      <span
                        className="text-[11px] sm:text-[11.5px] font-semibold"
                        style={getStatusLabelStyle(cfg.fg)}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          void toggleAdministrado(item.id, item.status)
                        }
                        disabled={updatingId !== null}
                        className="text-[11px] font-semibold px-2.5 sm:px-3 py-1.5 border transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={getToggleButtonStyle(
                          item.status === "administrado",
                        )}
                      >
                        {updatingId === item.id
                          ? "Salvando..."
                          : item.status === "administrado"
                            ? "Desfazer"
                            : "Confirmar"}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <NovoMedicamentoModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddMedicamento}
        />
      )}
    </div>
  );
};
