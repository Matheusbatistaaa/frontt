import React, { useState } from "react";
import { Pill, Clock, AlertCircle, CheckCircle2, Syringe, Plus } from "lucide-react";
import { TopBar } from "../../shared/components";
import { COLORS } from "../../config/colors";
import { Medicamento } from "./medicamentos.types";
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

const MOCK_MEDICAMENTOS: Medicamento[] = [
  { id: "m1", leito: "402", paciente: "M. Silva", nome: "Morfina 10mg IV", via: "Intravenosa", horario: "14:00", status: "atrasado", recorrente: false },
  { id: "m2", leito: "403", paciente: "J. Andrade", nome: "Dipirona 1g EV", via: "Endovenosa", horario: "14:30", status: "pendente", recorrente: true },
  { id: "m3", leito: "404", paciente: "R. Costa", nome: "Fentanil 50mcg", via: "Bomba de Infusão", horario: "12:00", status: "administrado", recorrente: false },
  { id: "m4", leito: "405", paciente: "A. Nunes", nome: "Ceftriaxona 1g IV", via: "Intravenosa", horario: "15:00", status: "pendente", recorrente: true },
  { id: "m5", leito: "406", paciente: "C. Prado", nome: "Omeprazol 40mg EV", via: "Endovenosa", horario: "08:00", status: "administrado", recorrente: false },
  { id: "m6", leito: "407", paciente: "L. Ferreira", nome: "Midazolam 5mg IV", via: "Intravenosa", horario: "16:00", status: "pendente", recorrente: false },
  { id: "m7", leito: "408", paciente: "P. Martins", nome: "Salbutamol Spray", via: "Inalatória", horario: "13:30", status: "administrado", recorrente: true },
];

export const Medicamentos: React.FC = () => {
  const { data: administracoes = [] } = useAdministracoes();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localItems, setLocalItems] = useState<Medicamento[]>(MOCK_MEDICAMENTOS);

  const items: Medicamento[] = (administracoes && administracoes.length > 0)
    ? administracoes.map((admin: any) => ({
        id: admin.id,
        leito: admin.prescricao?.internacao?.leito?.numero || "402",
        paciente: admin.prescricao?.internacao?.paciente?.nome || "M. Silva",
        nome: admin.prescricao?.medicamento?.nome || "Medicamento",
        via: admin.prescricao?.via_administracao || admin.prescricao?.medicamento?.forma_farmaceutica || "Oral",
        horario: admin.data_hora_planejada ? new Date(admin.data_hora_planejada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "14:00",
        status: admin.status as any,
        recorrente: false,
      }))
    : localItems;

  const toggleAdministrado = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "administrado" ? "pendente" : "administrado";

    setLocalItems((prev) => prev.map((m) => (m.id === id ? { ...m, status: newStatus as any } : m)));

    queryClient.setQueryData(['administracoes', undefined], (old: any) => {
      if (!old) return old;
      return old.map((m: any) => (m.id === id ? { ...m, status: newStatus } : m));
    });

    try {
      await supabase
        .from('administracoes_medicamento')
        .update({ status: newStatus })
        .eq('id', id);
    } catch {}  };

  const handleAddMedicamento = (novo: Omit<Medicamento, "id" | "status">) => {
    setLocalItems((prev) => [...prev, { ...novo, id: `m${Date.now()}`, status: "pendente" }]);
    setIsModalOpen(false);
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
            {items.sort((a, b) => a.horario.localeCompare(b.horario)).map((m) => {
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
                      onClick={() => toggleAdministrado(m.id as unknown as string, m.status)}
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
