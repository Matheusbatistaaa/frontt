import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TopBar } from "../../../shared/components";
import { Bed, Doctor } from "../../../types";
import { useInternacoes, useMedicos } from "../../../hooks";
import { supabase } from "../../../lib/supabase";
import { COLORS } from "../../../config/colors";
import { DoctorCard } from "../../../components/DoctorCard";
import { DoctorModal } from "../../../components/modals/DoctorModal";
import { SearchInput } from "../../../components/SearchInput";

interface DashMedicosProps {
  onOpenBed: (bed: Bed) => void;
}

export const DashMedicos: React.FC<DashMedicosProps> = ({ onOpenBed }) => {
  const queryClient = useQueryClient();
  const { data: medicos = [], isLoading, isError, refetch } = useMedicos();
  const { data: internacoes = [] } = useInternacoes();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const beds = useMemo<Bed[]>(() => internacoes.map((int) => ({
    id: String(int.leito?.numero ?? "??"),
    pacienteId: int.paciente?.id != null ? String(int.paciente.id) : undefined,
    leitoId: int.leito?.id != null ? String(int.leito.id) : undefined,
    internacaoId: String(int.id),
    name: int.paciente?.nome || "Desconhecido",
    hr: 0,
    hrSeries: [],
    mood: "neutro",
    conf: 0,
    risk: (typeof int.risco === "string" && ["normal", "attention", "critical"].includes(int.risco) ? int.risco : "normal") as Bed["risk"],
    acordado: true,
    ts: "—",
    status: "internado",
    ficha: {
      cpf: int.paciente?.cpf,
      dataNascimento: int.paciente?.data_nascimento,
      genero: int.paciente?.genero,
      convenio: int.paciente?.convenio,
      telefone: int.paciente?.telefone,
      contatoEmergencia: int.paciente?.contato_emergencia,
      numeroEmergencia: int.paciente?.numero_emergencia,
      alergias: int.paciente?.alergias,
      diagnostico: int.diagnostico_principal,
      dataInternacao: int.data_internacao,
      medico: int.medico?.nome,
      observacoes: int.observacoes,
    },
  })), [internacoes]);

  const handleSaveDoctor = async (updatedDoctor: Doctor) => {
    const atual = medicos.find((medico) => medico.id === updatedDoctor.id);
    const pacientesAtuais = atual?.pacientes ?? [];
    const removidos = pacientesAtuais.filter((id) => !updatedDoctor.pacientes.includes(id));
    const adicionados = updatedDoctor.pacientes.filter((id) => !pacientesAtuais.includes(id));

    const { error } = await supabase.from("usuarios").update({
      turno: updatedDoctor.turno,
      horario_inicio: updatedDoctor.horarioInicio && updatedDoctor.horarioInicio !== "—" ? updatedDoctor.horarioInicio : null,
      horario_fim: updatedDoctor.horarioFim && updatedDoctor.horarioFim !== "—" ? updatedDoctor.horarioFim : null,
      plantao: updatedDoctor.plantao,
    }).eq("id", updatedDoctor.id);
    if (error) throw error;

    if (removidos.length > 0) {
      const { error: erroRemocao } = await supabase
        .from("internacoes")
        .update({ medico_responsavel_id: null })
        .in("id", removidos);
      if (erroRemocao) throw erroRemocao;
    }

    if (adicionados.length > 0) {
      const { error: erroAdicao } = await supabase
        .from("internacoes")
        .update({ medico_responsavel_id: updatedDoctor.id })
        .in("id", adicionados);
      if (erroAdicao) throw erroAdicao;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["medicos"] }),
      queryClient.invalidateQueries({ queryKey: ["internacoes"] }),
      queryClient.invalidateQueries({ queryKey: ["pacientes"] }),
    ]);
    toast.success("Dados do médico atualizados com sucesso.");
  };

  const emPlantao = medicos.filter((doctor) => doctor.plantao).length;
  const filteredDoctors = medicos.filter((doctor) =>
    doctor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.especialidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Dashboard Médicos" subtitle={`${emPlantao} de ${medicos.length} médicos de plantão`} />

      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-7 space-y-4 sm:space-y-5">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar médico ou especialidade..."
        />

        {isLoading ? (
          <p className="text-sm" style={{ color: COLORS.slateSoft }}>Carregando médicos...</p>
        ) : isError ? (
          <div>
            <p className="text-sm" style={{ color: COLORS.red }}>Não foi possível carregar os médicos.</p>
            <button type="button" onClick={() => refetch()} className="mt-2 text-xs font-semibold underline" style={{ color: COLORS.orange }}>
              Tentar novamente
            </button>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <p className="text-sm" style={{ color: COLORS.slateSoft }}>Nenhum médico encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                beds={beds}
                onOpenModal={setSelectedDoctor}
              />
            ))}
          </div>
        )}
      </div>

      {selectedDoctor && (
        <DoctorModal
          key={selectedDoctor.id}
          doctor={selectedDoctor}
          allBeds={beds}
          onClose={() => setSelectedDoctor(null)}
          onSave={handleSaveDoctor}
          onSelectPatient={(bed) => {
            setSelectedDoctor(null);
            onOpenBed(bed);
          }}
        />
      )}
    </div>
  );
};
