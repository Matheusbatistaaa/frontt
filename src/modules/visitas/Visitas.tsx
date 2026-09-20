import React, { useState } from "react";
import { Info, UserCheck, Clock, UserX, Plus } from "lucide-react";
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
  const [localVisitas, setLocalVisitas] = useState<Visita[]>(MOCK_VISITAS);

  const visitasData: Visita[] = (supabaseVisitas && supabaseVisitas.length > 0)
    ? supabaseVisitas.map((dbVisita: any) => {
        const formatTime = (ts: string | null) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "??:??";
        return {
          leito: dbVisita.leito?.numero || "402",
          paciente: dbVisita.paciente?.nome || "M. Silva",
          visitante: dbVisita.nome_visitante || "Visitante",
          parentesco: dbVisita.parentesco || "Familiar",
          entrada: formatTime(dbVisita.data_entrada),
          saida: formatTime(dbVisita.data_saida) === "??:??" ? "---" : formatTime(dbVisita.data_saida),
          status: dbVisita.status === "concluida" ? "finalizada" : (dbVisita.data_saida ? "agendada" : "em-andamento"),
          id: dbVisita.id,
        };
      })
    : localVisitas;

  const handleAddVisita = async (visita: Visita) => {
    setLocalVisitas(prev => [visita, ...prev]);
    setModalOpen(false);
  };

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10">
        <TopBar title="Visitas" subtitle="Controle de acesso de visitantes · Ala UTI 2" />
      </div>

      {/* Botão nova visita */}
      <div className="flex justify-end px-8 mt-5">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 text-[12.5px] font-semibold text-white px-4 py-2.5"
          style={styles.addButton}
        >
          <Plus size={15} /> Nova Visita
        </button>
      </div>

      <div className="flex items-center gap-2 mx-8 mt-4 px-4 py-2.5 border border-l-[3px]" style={styles.infoBanner}>
        <Info size={15} color={styles.infoIconColor} />
        <p className="text-[12.5px] font-medium" style={styles.infoText}>
          Horário de visitas da ala: 13h–13h30 e 15h–15h30. Máximo 1 acompanhante por leito.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 px-8 py-6">
        {visitasData.map((v, i) => {
          const cfg = statusCfg[v.status];
          const Icon = statusIconMap[v.status];
          return (
            <div key={i} className="bg-white border p-5" style={styles.card}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="kicker" style={styles.leitoLabel}>
                    Leito {v.leito}
                  </span>
                </div>
                <span
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5"
                  style={getStatusBadgeStyle(cfg.bg, cfg.fg)}
                >
                  <Icon size={12} />
                  {cfg.label}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <WireframeAvatar color={styles.avatarColor} />
                <div>
                  <p className="text-[13px] font-semibold" style={styles.visitanteNome}>
                    {v.visitante}
                  </p>
                  <p className="text-[11.5px]" style={styles.visitanteParentesco}>
                    {v.parentesco}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t" style={styles.footer}>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} color={styles.footerIconColor} />
                  <span className="text-[12px] mono" style={styles.footerTime}>
                    {v.entrada} — {v.saida}
                  </span>
                </div>
                {v.status === "agendada" && (
                  <button className="text-[11px] font-semibold px-3 py-1.5 text-white" style={styles.checkinButton}>
                    Check-in
                  </button>
                )}
                {v.status === "em-andamento" && (
                  <button className="text-[11px] font-semibold px-3 py-1.5 border" style={styles.checkoutButton}>
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