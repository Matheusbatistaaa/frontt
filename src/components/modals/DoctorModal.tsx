import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Bed, Doctor } from "../../types";
import { DoctorModalProps } from "../../modules/dashboard/dashboard.types";
import { doctorModalStyles as styles, getPlantaoToggleStyle } from "./styles/DoctorModal.styles";

export const DoctorModal: React.FC<DoctorModalProps> = ({ doctor, allBeds, onClose, onSave, onSelectPatient }) => {
  const [plantao, setPlantao] = useState(doctor.plantao);
  const [turno, setTurno] = useState(doctor.turno);
  const [horarioInicio, setHorarioInicio] = useState(doctor.horarioInicio);
  const [horarioFim, setHorarioFim] = useState(doctor.horarioFim);
  const [pacientesSelecionados, setPacientesSelecionados] = useState<string[]>(doctor.pacientes);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setPlantao(doctor.plantao);
    setTurno(doctor.turno);
    setHorarioInicio(doctor.horarioInicio);
    setHorarioFim(doctor.horarioFim);
    setPacientesSelecionados(doctor.pacientes);
  }, [doctor.id, doctor.plantao, doctor.turno, doctor.horarioInicio, doctor.horarioFim, doctor.pacientes]);

  const internados = allBeds.filter((bed): bed is Bed & { internacaoId: string } =>
    bed.status === "internado" && Boolean(bed.internacaoId)
  );

  const togglePaciente = (bedId: string) => {
    setPacientesSelecionados((prev) =>
      prev.includes(bedId) ? prev.filter((id) => id !== bedId) : [...prev, bedId]
    );
  };

  const handleSave = async () => {
    if (salvando) return;
    setSalvando(true);
    try {
      await onSave({
        ...doctor,
        plantao,
        turno,
        horarioInicio,
        horarioFim,
        pacientes: pacientesSelecionados,
      });
      onClose();
    } catch (error) {
      toast.error(`Não foi possível salvar os dados do médico: ${error instanceof Error ? error.message : "erro inesperado"}`);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-2.5 sm:p-4"
      style={styles.overlay}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto border p-3.5 sm:p-6 bg-white"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-2 mb-4">
          <div className="min-w-0 flex-1">
            <p className="display text-base sm:text-[1.35rem] font-semibold leading-tight truncate" style={styles.title}>
              {doctor.nome}
            </p>
            <p className="text-xs sm:text-sm truncate" style={styles.subtitle}>
              {doctor.especialidade} • CRM {doctor.crm}
            </p>
          </div>
          <button onClick={onClose} style={styles.closeButton} className="p-1 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={styles.label}>
            Status
          </p>
          <button
            type="button"
            onClick={() => setPlantao((prev) => !prev)}
            className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded"
            style={getPlantaoToggleStyle(plantao)}
          >
            {plantao ? "De plantão" : "Fora de plantão"}
          </button>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={styles.label}>
            Turno
          </p>
          <select
            value={turno}
            onChange={(e) => setTurno(e.target.value as Doctor["turno"])}
            className="w-full px-3 py-2 border text-xs sm:text-sm outline-none"
            style={styles.input}
          >
            <option value="manhã">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
            <option value="nao-definido">Não definido</option>
          </select>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={styles.label}>
            Horário
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="time"
              value={horarioInicio === "—" ? "" : horarioInicio}
              onChange={(e) => setHorarioInicio(e.target.value)}
              className="flex-1 min-w-[100px] px-3 py-2 border text-xs sm:text-sm outline-none"
              style={styles.input}
            />
            <span style={styles.label} className="text-xs">até</span>
            <input
              type="time"
              value={horarioFim === "—" ? "" : horarioFim}
              onChange={(e) => setHorarioFim(e.target.value)}
              className="flex-1 min-w-[100px] px-3 py-2 border text-xs sm:text-sm outline-none"
              style={styles.input}
            />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={styles.label}>
            Pacientes sob os cuidados ({pacientesSelecionados.length})
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {internados.map((bed) => {
              const isChecked = pacientesSelecionados.includes(bed.internacaoId);
              return (
                <div
                  key={bed.id}
                  className="flex items-center justify-between p-2 gap-2"
                  style={styles.patientRow}
                >
                  <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePaciente(bed.internacaoId)}
                      className="shrink-0"
                    />
                    <span className="text-xs sm:text-sm truncate" style={styles.patientName}>
                      {bed.name} — Leito {bed.id}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onSelectPatient(bed)}
                    className="text-xs underline shrink-0"
                    style={styles.label}
                  >
                    Ver ficha
                  </button>
                </div>
              );
            })}
            {internados.length === 0 && (
              <p className="text-xs italic" style={styles.label}>
                Nenhum paciente internado no momento
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end mt-5 sm:mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 sm:px-4 py-2 border text-xs sm:text-sm font-semibold"
            style={styles.cancelButton}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={salvando}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={styles.saveButton}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
};
