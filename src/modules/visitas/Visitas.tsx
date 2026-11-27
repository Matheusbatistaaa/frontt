import React, { useState } from "react";
import { Info, UserCheck, Clock, UserX, Plus } from "lucide-react";
import { toast } from "sonner";
import { TopBar, WireframeAvatar } from "../../shared/components";
import type { NovaVisitaFormData } from "./visitas.types";
import { NovaVisitaModal } from "../../components/modals/NovaVisitaModal";
import {
  visitasStyles as styles,
  statusCfg,
  getStatusBadgeStyle,
} from "./Visitas.styles";
import {
  useCheckInVisita,
  useCheckOutVisita,
  useCriarVisita,
  useVisitas,
} from "../../hooks";
import { formatDateInBrazil, formatTimeInBrazil } from "../../lib/dateTime";

const statusIconMap = {
  "em-andamento": UserCheck,
  "agendada": Clock,
  "finalizada": UserX,
};

export const Visitas: React.FC = () => {
  const { data: visitasList = [], isLoading, isError, refetch } = useVisitas();
  const [modalOpen, setModalOpen] = useState(false);
  const criarVisita = useCriarVisita();
  const checkIn = useCheckInVisita();
  const checkOut = useCheckOutVisita();
  const visitaEmAtualizacao = checkIn.isPending
    ? checkIn.variables
    : checkOut.isPending
      ? checkOut.variables
      : null;

  const handleAddVisita = async (form: NovaVisitaFormData) => {
    try {
      await criarVisita.mutateAsync(form);
      toast.success("Visita agendada com sucesso!");
    } catch (err) {
      console.error("Erro ao agendar visita:", err);
      toast.error(err instanceof Error ? err.message : "Não foi possível agendar a visita.");
      throw err;
    }
  };

  const handleCheckIn = async (visitaId: string) => {
    try {
      await checkIn.mutateAsync(visitaId);
      toast.success("Check-in de visitante realizado com sucesso!");
    } catch (err) {
      console.error("Erro ao realizar check-in:", err);
      toast.error(err instanceof Error ? err.message : "Não foi possível realizar o check-in.");
    }
  };

  const handleCheckOut = async (visitaId: string) => {
    try {
      await checkOut.mutateAsync(visitaId);
      toast.success("Check-out de visitante registrado!");
    } catch (err) {
      console.error("Erro ao realizar check-out:", err);
      toast.error(err instanceof Error ? err.message : "Não foi possível realizar o check-out.");
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-x-hidden">
      <div className="sticky top-0 z-10">
        <TopBar title="Visitas" subtitle="Controle de acesso de visitantes · Ala UTI 2" />
      </div>

      <div className="flex justify-end px-3 sm:px-6 md:px-8 mt-3 sm:mt-5">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 text-[12px] sm:text-[12.5px] font-semibold text-white px-3 sm:px-4 py-2 sm:py-2.5 transition-opacity hover:opacity-90"
          style={styles.addButton}
        >
          <Plus size={15} /> Nova Visita
        </button>
      </div>

      <div className="flex items-center gap-2 mx-3 sm:mx-6 md:mx-8 mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-2.5 border border-l-[3px]" style={styles.infoBanner}>
        <Info size={15} color={styles.infoIconColor} className="shrink-0" />
        <p className="text-[11.5px] sm:text-[12.5px] font-medium leading-relaxed" style={styles.infoText}>
          Horário de visitas da ala: 13h–13h30 e 15h–15h30. Máximo 1 acompanhante por leito.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 px-3 sm:px-6 md:px-8 py-4 sm:py-6">
        {isLoading ? (
          <div className="col-span-full p-6 text-center text-sm text-slate-500">Carregando visitas...</div>
        ) : isError ? (
          <div className="col-span-full flex flex-col items-center gap-3 p-6 text-sm text-slate-600">
            <p>Não foi possível carregar as visitas.</p>
            <button type="button" onClick={() => void refetch()} className="px-3 py-2 border rounded text-xs font-semibold text-slate-600">
              Tentar novamente
            </button>
          </div>
        ) : visitasList.length === 0 ? (
          <div className="col-span-full p-6 text-center text-sm text-slate-500">Nenhuma visita cadastrada.</div>
        ) : visitasList.map((v) => {
          const cfg = statusCfg[v.status] || statusCfg["agendada"];
          const Icon = statusIconMap[v.status] || Clock;
          return (
            <div key={v.id} className="bg-white border p-3.5 sm:p-5 flex flex-col justify-between" style={styles.card}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="kicker" style={styles.leitoLabel}>
                    Leito {v.leito}
                  </span>
                  <span
                    className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-semibold px-2 py-0.5"
                    style={getStatusBadgeStyle(cfg.bg, cfg.fg)}
                  >
                    <Icon size={12} />
                    {cfg.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3 min-w-0">
                  <div className="shrink-0">
                    <WireframeAvatar color={styles.avatarColor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] sm:text-[13px] font-semibold truncate" style={styles.visitanteNome}>
                      {v.visitante}
                    </p>
                    <p className="text-[11px] sm:text-[11.5px] truncate" style={styles.visitanteParentesco}>
                      {v.parentesco} • Paciente: {v.paciente}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t mt-1" style={styles.footer}>
                <div className="flex items-start gap-1.5 min-w-0 flex-1">
                  <Clock size={13} color={styles.footerIconColor} className="shrink-0 mt-0.5" />
                  <span className="text-[11px] sm:text-[11.5px] mono leading-relaxed break-words" style={styles.footerTime}>
                    Entrada: {formatDateInBrazil(v.dataEntrada)} {formatTimeInBrazil(v.dataEntrada)}
                    <br />
                    Saída: {formatDateInBrazil(v.dataSaida)} {formatTimeInBrazil(v.dataSaida)}
                  </span>
                </div>
                {v.status === "agendada" && (
                  <button
                    onClick={() => void handleCheckIn(v.id)}
                    disabled={visitaEmAtualizacao !== null}
                    className="text-[11px] font-semibold px-3 py-1.5 text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={styles.checkinButton}
                  >
                    {visitaEmAtualizacao === v.id ? "Registrando..." : "Check-in"}
                  </button>
                )}
                {v.status === "em-andamento" && (
                  <button
                    onClick={() => void handleCheckOut(v.id)}
                    disabled={visitaEmAtualizacao !== null}
                    className="text-[11px] font-semibold px-3 py-1.5 border transition-opacity hover:opacity-80 disabled:opacity-60"
                    style={styles.checkoutButton}
                  >
                    {visitaEmAtualizacao === v.id ? "Registrando..." : "Check-out"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <NovaVisitaModal onClose={() => setModalOpen(false)} onSubmit={handleAddVisita} />
      )}
    </div>
  );
};
