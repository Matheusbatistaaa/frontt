import React, { useState } from "react";
import { Pill, Clock, AlertCircle, CheckCircle2, Syringe, Plus } from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useAdministracoes } from "../../hooks";

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

const KPICard: React.FC<KPICardProps> = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-white border p-3.5 sm:p-4 flex items-center gap-3" style={styles.kpiCard}>
    <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0" style={getKpiIconBoxStyle(accent)}>
      <Icon size={18} color={accent} />
    </div>
    <div className="min-w-0">
      <p className="mono text-base sm:text-lg font-bold leading-none" style={styles.kpiValue}>{value}</p>
      <p className="text-[11px] sm:text-[11.5px] mt-1 truncate" style={styles.kpiLabel}>{label}</p>
    </div>
  </div>
);

const VIA_PARA_FORMA: Record<string, string> = {
  EV: "injecao",
  IM: "injecao",
  SC: "injecao",
  VO: "comprimido",
};

const deriveStatus = (status: string, planejada?: string | null): Medicamento["status"] => {
  if (status === "administrado") return "administrado";
  if (planejada && new Date(planejada).getTime() < Date.now()) return "atrasado";
  return "pendente";
};

export const Medicamentos: React.FC = () => {
  const { data: administracoes = [] } = useAdministracoes();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localItems, setLocalItems] = useState<Medicamento[]>([]);

  const remotos: Medicamento[] = (administracoes || []).map((admin: any) => {
    const planejada = admin.data_hora_planejada ?? admin.horario_previsto;
    return {
      id: admin.id,
      leito: String(admin.prescricao?.internacao?.leito?.numero ?? "—"),
      paciente: admin.prescricao?.internacao?.paciente?.nome || "Paciente",
      nome: admin.prescricao?.medicamento?.nome || "Medicamento",
      via: admin.prescricao?.via_administracao || admin.prescricao?.medicamento?.forma_farmaceutica || "Oral",
      horario: planejada ? new Date(planejada).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
      status: deriveStatus(admin.status, planejada),
      recorrente: false,
    };
  });

  const items: Medicamento[] = [...remotos, ...localItems];

  const toggleAdministrado = async (id: string | number, currentStatus: string) => {
    const newStatus = currentStatus === "administrado" ? "pendente" : "administrado";

    if (typeof id === "string" && id.startsWith("local-")) {
      setLocalItems((prev) => prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)));
      return;
    }

    queryClient.setQueryData(["administracoes", undefined], (old: any) => {
      if (!Array.isArray(old)) return old;
      return old.map((m: any) => (m.id === id ? { ...m, status: newStatus } : m));
    });

    const { error } = await supabase
      .from("administracoes_medicamento")
      .update({
        status: newStatus,
        data_hora_administrada: newStatus === "administrado" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Não foi possível atualizar a administração.");
      queryClient.invalidateQueries({ queryKey: ["administracoes"] });
      return;
    }

    toast.success(newStatus === "administrado" ? "Dose confirmada." : "Dose reaberta.");
    queryClient.invalidateQueries({ queryKey: ["administracoes"] });
  };

  const handleAddMedicamento = async (novo: NovoMedicamentoInput): Promise<boolean> => {
    if (!novo.internacaoId) {
      setLocalItems((prev) => [...prev, { ...novo, id: `local-${Date.now()}`, status: "pendente" }]);
      toast.success("Medicamento adicionado à lista.");
      return true;
    }

    let medicamentoId: number | null = null;
    let prescricaoId: number | null = null;

    try {
      const { data: medicamento, error: erroMedicamento } = await supabase
        .from("medicamentos")
        .insert({
          nome: novo.nome.trim(),
          principio_ativo: novo.nome.trim(),
          forma_farmaceutica: VIA_PARA_FORMA[novo.via] ?? "injecao",
        })
        .select("id")
        .single();

      if (erroMedicamento) throw erroMedicamento;
      medicamentoId = medicamento.id;

      const { data: prescricao, error: erroPrescricao } = await supabase
        .from("prescricoes_medicamentos")
        .insert({
          internacao_id: novo.internacaoId,
          medicamento_id: medicamento.id,
          prescrito_por_id: 1,
          dosagem: "—",
          via_administracao: novo.via,
          frequencia: novo.recorrente ? "diária" : "dose única",
          data_inicio: new Date().toISOString(),
          status: "ativa",
        })
        .select("id")
        .single();

      if (erroPrescricao) throw erroPrescricao;
      prescricaoId = prescricao.id;

      const [hora, minuto] = novo.horario.split(":").map(Number);
      const agora = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      // Coluna timestamp sem fuso: gravar a hora local "de parede" evita deslocamento.
      const planejada = `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}T${pad(hora || 0)}:${pad(minuto || 0)}:00`;

      const { error: erroAdministracao } = await supabase
        .from("administracoes_medicamento")
        .insert({
          prescricao_id: prescricao.id,
          data_hora_planejada: planejada,
          status: "pendente",
        });

      if (erroAdministracao) throw erroAdministracao;

      toast.success(
        novo.recorrente
          ? "Medicamento adicionado à rotina diária!"
          : "Medicamento agendado!"
      );
      await queryClient.invalidateQueries({ queryKey: ["administracoes"] });
      return true;
    } catch (err: any) {
      if (prescricaoId) await supabase.from("prescricoes_medicamentos").delete().eq("id", prescricaoId);
      if (medicamentoId) await supabase.from("medicamentos").delete().eq("id", medicamentoId);
      toast.error(`Falha ao cadastrar medicamento: ${err?.message ?? "erro inesperado"}`);
      return false;
    }
  };

  const pendentesOuAtrasados = items.filter((m) => m.status !== "administrado").length;

  return (
    <div className="flex flex-col flex-1 overflow-x-hidden">
      <div className="sticky top-0 z-10">
        <TopBar title="Medicamentos" subtitle="Administração e horários por leito · Ala UTI 2" />
      </div>

      <div className="flex items-center justify-between px-3 sm:px-6 md:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 flex-1">
          <KPICard icon={Pill} label="Doses programadas hoje" value={items.length} accent={COLORS.slate} />
          <KPICard icon={Clock} label="Pendentes / atrasadas" value={pendentesOuAtrasados} accent={COLORS.orange} />
          <KPICard icon={AlertCircle} label="Atrasadas" value={items.filter((m) => m.status === "atrasado").length} accent={COLORS.red} />
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

      <div className="mx-3 sm:mx-6 md:mx-8 my-4 sm:my-5 bg-white border overflow-x-auto flex flex-col" style={styles.tableCard}>
        <div className="min-w-[640px]">
          <div className="grid grid-cols-12 px-4 sm:px-5 h-11 items-center border-b shrink-0" style={styles.tableHeader}>
            {["Horário", "Leito", "Paciente", "Medicamento", "Via", "Status", ""].map((h, i) => (
              <span
                key={i}
                className={`text-[11px] font-semibold uppercase tracking-wide ${
                  ["col-span-1", "col-span-1", "col-span-2", "col-span-3", "col-span-2", "col-span-2", "col-span-1"][i]
                }`}
                style={styles.tableHeaderLabel}
              >
                {h}
              </span>
            ))}
          </div>
          <div>
            {items.length === 0 && (
              <p className="px-4 sm:px-5 py-6 text-xs sm:text-sm" style={{ color: COLORS.slateSoft }}>
                Nenhum medicamento cadastrado. Use "Novo Medicamento" para agendar a primeira dose.
              </p>
            )}
            {[...items].sort((a, b) => a.horario.localeCompare(b.horario)).map((m) => {
              const cfg = statusIcons[m.status] || statusIcons["pendente"];
              const StatusIcon = statusIconMap[m.status] || Clock;
              return (
                <div key={m.id} className="grid grid-cols-12 px-4 sm:px-5 h-16 items-center border-b last:border-0" style={styles.row}>
                  <span className="col-span-1 mono text-[12.5px] sm:text-[13px] font-semibold" style={styles.horario}>
                    {m.horario}
                  </span>
                  <span className="col-span-1 font-bold text-[12.5px] sm:text-[13px]" style={styles.leito}>
                    {m.leito}
                  </span>
                  <span className="col-span-2 text-[12px] sm:text-[12.5px] truncate pr-2" style={styles.paciente}>
                    {m.paciente}
                  </span>
                  <span className="col-span-3 text-[12.5px] sm:text-[13px] font-medium flex items-center gap-1.5 sm:gap-2 truncate pr-2" style={styles.nome}>
                    <Syringe size={14} color={styles.nomeIconColor} className="shrink-0" />
                    <span className="truncate">{m.nome}</span>
                    {m.recorrente && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={styles.via}>
                        diário
                      </span>
                    )}
                  </span>
                  <span className="col-span-2 text-[11.5px] sm:text-[12px] px-2 py-1 w-fit truncate" style={styles.via}>
                    {m.via}
                  </span>
                  <div className="col-span-2 flex items-center gap-1.5 px-2 py-1 w-fit" style={getStatusBadgeStyle(cfg.bg)}>
                    <StatusIcon size={13} color={cfg.fg} />
                    <span className="text-[11px] sm:text-[11.5px] font-semibold" style={getStatusLabelStyle(cfg.fg)}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => toggleAdministrado(m.id, m.status)}
                      className="text-[11px] font-semibold px-2.5 sm:px-3 py-1.5 border transition-opacity hover:opacity-80"
                      style={getToggleButtonStyle(m.status === "administrado")}
                    >
                      {m.status === "administrado" ? "Desfazer" : "Confirmar"}
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
