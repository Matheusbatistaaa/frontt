import React from "react";
import { ChevronRight } from "lucide-react";
import { DoctorCardProps } from "../modules/dashboard/dashboard.types";
import { doctorCardStyles as styles, getPlantaoToggleStyle } from "./styles/DoctorCard.styles";
import { COLORS } from "../config/colors";

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, beds, onOpenModal }) => {
  const pacientesDoMedico = beds.filter((bed) =>
    Boolean(bed.internacaoId) && doctor.pacientes.includes(bed.internacaoId!) && bed.status === "internado"
  );

  return (
    <button
      onClick={() => onOpenModal(doctor)}
      className="text-left p-3.5 sm:p-5 w-full transition-opacity hover:opacity-95"
      style={{
        ...styles.card,
        borderLeft: `5px solid ${doctor.plantao ? COLORS.orange : COLORS.line}`,
      }}
    >
      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
        <div className="min-w-0 flex-1 pr-1">
          <p className="display font-semibold text-sm sm:text-[1.15rem] leading-tight truncate" style={styles.doctorName}>
            {doctor.nome}
          </p>
          <p className="text-[11.5px] sm:text-xs truncate" style={styles.specialty}>
            {doctor.especialidade}
          </p>
          <p className="text-[11px] sm:text-xs truncate" style={styles.crm}>
            CRM {doctor.crm}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className="text-[9.5px] sm:text-[10px] font-semibold px-2 py-0.5 rounded"
            style={getPlantaoToggleStyle(doctor.plantao)}
          >
            {doctor.plantao ? "De plantão" : "Fora de plantão"}
          </span>
          <span className="text-[10.5px] sm:text-xs px-2 py-0.5" style={styles.turnoBadge}>
            {doctor.horarioInicio} - {doctor.horarioFim}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs font-semibold" style={styles.patientsTitle}>
          {pacientesDoMedico.length} paciente{pacientesDoMedico.length !== 1 ? "s" : ""} sob cuidado
        </p>
        <ChevronRight size={16} />
      </div>
    </button>
  );
};
