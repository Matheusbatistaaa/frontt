import React, { useState, useEffect } from "react";
import { Info, UserCheck, Clock, UserX, Plus } from "lucide-react";
import { toast } from "sonner";
import { TopBar, WireframeAvatar } from "../../shared/components";
import { Visita } from "./visitas.types";
import { NovaVisitaModal } from "../../components/modals/NovaVisitaModal";
import {
  visitasStyles as styles,
  statusCfg,
  getStatusBadgeStyle,
} from "./Visitas.styles";
import { useVisitas } from "../../hooks";
import { supabase } from "../../lib/supabase";

const statusIconMap = {
  "em-andamento": UserCheck,
  "agendada": Clock,
  "finalizada": UserX,
};

const MOCK_VISITAS: Visita[] = [
  { id: "v1", leito: "402", paciente: "M. Silva", visitante: "Carlos Silva", parentesco: "Filho", entrada: "13:30", saida: "---", status: "em-andamento" },
  { id: "v2", leito: "403", paciente: "J. Andrade", visitante: "Mariana Andrade", parentesco: "Esposa", entrada: "14:00", saida: "---", status: "em-andamento" },
  { id: "v3", leito: "404", paciente: "R. Costa", visitante: "Lucas Costa", parentesco: "Irmão", entrada: "10:15", saida: "11:30", status: "finalizada" },
  { id: "v4", leito: "406", paciente: "C. Prado", visitante: "Fernanda Prado", parentesco: "Filha", entrada: "16:00", saida: "17:00", status: "agendada" },
  { id: "v5", leito: "407", paciente: "L. Ferreira", visitante: "Renata Ferreira", parentesco: "Mãe", entrada: "17:30", saida: "18:30", status: "agendada" },
];

export const Visitas: React.FC = () => {
  const { data: supabaseVisitas = [], refetch } = useVisitas();
  const [modalOpen, setModalOpen] = useState(false);
  const [visitasList, setVisitasList] = useState<Visita[]>(MOCK_VISITAS);

  useEffect(() => {
    if (supabaseVisitas && supabaseVisitas.length > 0) {
      setVisitasList(supabaseVisitas);
    }
  }, [supabaseVisitas]);

  const handleAddVisita = async (visita: Visita) => {
    const novaVisita: Visita = {
      ...visita,
      id: visita.id || `v-${Date.now()}`,
    };

    setVisitasList((prev) => [novaVisita, ...prev]);
    setModalOpen(false);

    try {
      const { error } = await supabase
        .from("visitantes")
        .insert({
          paciente_id: 1,
          nome_visitante: visita.visitante,
          parentesco: visita.parentesco,
          data_entrada: new Date().toISOString(),
          status: "agendada",
        });

      if (error) {
        console.warn("Aviso ao salvar no banco:", error);
      } else {
        refetch();
      }
    } catch (err) {
      console.warn("Visita registrada localmente:", err);
    }
  };

  const handleCheckIn = async (visitaId: string) => {
    const agora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setVisitasList((prev) =>
      prev.map((v) =>
        v.id === visitaId
          ? { ...v, status: "em-andamento", entrada: agora }
          : v
      )
    );

    const numericId = Number(visitaId);
    if (!isNaN(numericId)) {
      try {
        await supabase
          .from("visitantes")
          .update({
            status: "em-andamento",
            data_entrada: new Date().toISOString(),
          })
          .eq("id", numericId);
        refetch();
      } catch {}
    }

    toast.success("Check-in de visitante realizado com sucesso!");
  };

  const handleCheckOut = async (visitaId: string) => {
    const agora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setVisitasList((prev) =>
      prev.map((v) =>
        v.id === visitaId
          ? { ...v, status: "finalizada", saida: agora }
          : v
      )
    );

    const numericId = Number(visitaId);
    if (!isNaN(numericId)) {
      try {
        await supabase
          .from("visitantes")
          .update({
            status: "finalizada",
            data_saida: new Date().toISOString(),
          })
          .eq("id", numericId);
        refetch();
      } catch {}
    }

    toast.success("Check-out de visitante registrado!");
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
        {visitasList.map((v, i) => {
          const cfg = statusCfg[v.status] || statusCfg["agendada"];
          const Icon = statusIconMap[v.status] || Clock;
          return (
            <div key={v.id || i} className="bg-white border p-3.5 sm:p-5 flex flex-col justify-between" style={styles.card}>
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
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock size={13} color={styles.footerIconColor} className="shrink-0" />
                  <span className="text-[11.5px] sm:text-[12px] mono truncate" style={styles.footerTime}>
                    {v.entrada} — {v.saida}
                  </span>
                </div>
                {v.status === "agendada" && (
                  <button
                    onClick={() => handleCheckIn(v.id || "")}
                    className="text-[11px] font-semibold px-3 py-1.5 text-white transition-opacity hover:opacity-90"
                    style={styles.checkinButton}
                  >
                    Check-in
                  </button>
                )}
                {v.status === "em-andamento" && (
                  <button
                    onClick={() => handleCheckOut(v.id || "")}
                    className="text-[11px] font-semibold px-3 py-1.5 border transition-opacity hover:opacity-80"
                    style={styles.checkoutButton}
                  >
                    Check-out
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
