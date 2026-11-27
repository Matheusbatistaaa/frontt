import React, { useState, useRef, useEffect, useMemo } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { TopBar } from "../../../shared/components";
import { BedCard } from "../../../components/BedCard";
import { AlertBanner } from "../../../components/AlertBanner";
import { SearchInput } from "../../../components/SearchInput";
import { useInternacoes } from "../../../hooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { Bed, RiskLevel } from "../../../types";
import { COLORS } from "../../../config/colors";
import { FichaPacienteModal } from "../../../components/modals/FichaPacienteModal";
import { dashboardStyles as styles, getRiskBadgeStyle, getFilterOptionStyle } from "./Dashboard.styles";

interface DashboardProps {
  onOpenBed: (bed: Bed) => void;
  onOpenProntuario: (bed: Bed) => void;
}

const FILTER_OPTIONS: { value: RiskLevel | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "critical", label: "Críticos" },
  { value: "attention", label: "Atenção" },
];

export const Dashboard: React.FC<DashboardProps> = ({ onOpenBed, onOpenProntuario }) => {
  const { data: internacoes = [], isLoading, isError, refetch } = useInternacoes();
  const queryClient = useQueryClient();

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
    risk: (typeof int.risco === "string" && ["normal", "attention", "critical"].includes(int.risco) ? int.risco : "normal") as RiskLevel,
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

  const [fichaBed, setFichaBed] = useState<Bed | null>(null);

  const [filter, setFilter] = useState<RiskLevel | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChangeRisk = async (bedId: string, risk: RiskLevel) => {
    const bed = beds.find((item) => item.id === bedId);
    if (!bed?.internacaoId) return;

    try {
      const { error } = await supabase
        .from("internacoes")
        .update({ risco: risk })
        .eq("id", bed.internacaoId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["internacoes"] });
      toast.success("Nível de risco atualizado.");
    } catch (error) {
      toast.error(`Não foi possível atualizar o risco: ${error instanceof Error ? error.message : "erro inesperado"}`);
    }
  };

  const handleToggleStatus = async (bedId: string) => {
    const bed = beds.find((item) => item.id === bedId);
    if (!bed?.internacaoId || !bed.leitoId) return;

    try {
      const { error } = await supabase
        .from("internacoes")
        .update({ ativo: false, data_saida: new Date().toISOString() })
        .eq("id", bed.internacaoId);
      if (error) throw error;

      const { error: erroLeito } = await supabase
        .from("leitos")
        .update({ status: "livre" })
        .eq("id", bed.leitoId);
      if (erroLeito) throw erroLeito;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["internacoes"] }),
        queryClient.invalidateQueries({ queryKey: ["pacientes"] }),
        queryClient.invalidateQueries({ queryKey: ["medicos"] }),
      ]);
      toast.success("Alta registrada e leito liberado.");
    } catch (error) {
      toast.error(`Não foi possível registrar a alta: ${error instanceof Error ? error.message : "erro inesperado"}`);
    }
  };

  const filteredBeds = beds.filter((bed) => {
    const matchesFilter = filter === "all" || bed.risk === filter;
    const matchesSearch = bed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bed.id.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const criticalCount = beds.filter((b) => b.risk === "critical" && b.status === "internado").length;
  const attentionCount = beds.filter((b) => b.risk === "attention" && b.status === "internado").length;
  const currentFilterLabel = FILTER_OPTIONS.find((opt) => opt.value === filter)?.label ?? "Todos";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Dashboard de Pacientes" subtitle={`${beds.length} leitos monitorados`} />

      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-7 space-y-4 sm:space-y-7">
        {criticalCount > 0 && (
          <AlertBanner
            variant="critical"
            title={`${criticalCount} paciente${criticalCount > 1 ? "s" : ""} em situação crítica`}
            subtitle="Requer atenção imediata"
          />
        )}

        <div className="flex flex-wrap items-end gap-3 sm:gap-4 pb-2" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar paciente ou leito..."
            />
          </div>

          <div className="relative shrink-0" ref={filterRef}>
            <button
              type="button"
              className="px-3 py-2 border flex items-center gap-2 text-xs sm:text-sm"
              style={styles.filterButton}
              onClick={() => setIsFilterOpen((prev) => !prev)}
            >
              <Filter size={15} color={styles.filterIconColor} />
              {currentFilterLabel}
              <ChevronDown
                size={14}
                color={styles.filterIconColor}
                className={`transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isFilterOpen && (
              <div
                className="absolute right-0 mt-1 w-40 border overflow-hidden z-20"
                style={styles.filterDropdownMenu}
              >
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs sm:text-sm flex items-center justify-between"
                    style={getFilterOptionStyle(filter === option.value)}
                    onClick={() => {
                      setFilter(option.value);
                      setIsFilterOpen(false);
                    }}
                  >
                    {option.label}
                    {option.value === "critical" && criticalCount > 0 && (
                      <span className="text-xs opacity-70">{criticalCount}</span>
                    )}
                    {option.value === "attention" && attentionCount > 0 && (
                      <span className="text-xs opacity-70">{attentionCount}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {isLoading ? (
            <p className="text-sm py-4" style={{ color: COLORS.slateSoft }}>Carregando pacientes...</p>
          ) : isError ? (
            <div className="col-span-full py-4">
              <p className="text-sm" style={{ color: COLORS.red }}>Não foi possível carregar os pacientes.</p>
              <button type="button" onClick={() => refetch()} className="mt-2 text-xs font-semibold underline" style={{ color: COLORS.orange }}>
                Tentar novamente
              </button>
            </div>
          ) : filteredBeds.length === 0 ? (
            <p className="col-span-full text-sm py-4" style={{ color: COLORS.slateSoft }}>
              Nenhum paciente encontrado com os filtros atuais.
            </p>
          ) : filteredBeds.map((bed, index) => (
            <BedCard
              key={bed.internacaoId || bed.id + "-" + index}
              bed={bed}
              onSelect={onOpenBed}
              onChangeRisk={handleChangeRisk}
              onToggleStatus={handleToggleStatus}
              onOpenFicha={setFichaBed}
              onOpenProntuario={onOpenProntuario}
            />
          ))}
        </div>

        <div className="border p-3.5 sm:p-5" style={styles.sectionCard}>
          <p className="kicker mb-3 sm:mb-4 text-xs" style={styles.sectionTitle}>
            Pacientes sob monitoramento intenso
          </p>
          <div className="space-y-2">
            {beds.filter((b) => b.risk === "critical" || b.risk === "attention").slice(0, 5).map((patient, i) => (
              <div key={patient.internacaoId || patient.id + "-" + i} className="flex items-center justify-between px-2.5 sm:px-3 py-2 sm:py-2.5 gap-2" style={styles.patientRow}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold truncate" style={styles.patientName}>
                    {patient.name}
                  </p>
                  <p className="text-[11px] sm:text-xs truncate" style={styles.patientBed}>
                    Leito {patient.id}
                  </p>
                </div>
                <div
                  className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 shrink-0"
                  style={getRiskBadgeStyle(patient.risk)}
                >
                  {patient.risk === "critical" ? "Crítico" : "Atenção"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {fichaBed && (
        <FichaPacienteModal bed={fichaBed} onClose={() => setFichaBed(null)} />
      )}
    </div>
  );
};
