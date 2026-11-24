import React, { useState, useRef, useEffect, useMemo } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { TopBar } from "../../../shared/components";
import { BedCard } from "../../../components/BedCard";
import { AlertBanner } from "../../../components/AlertBanner";
import { SearchInput } from "../../../components/SearchInput";
import { useInternacoes } from "../../../hooks";
import { Bed, RiskLevel } from "../../../types";
import { beds as mockBeds } from "../../../config/mockData";
import { COLORS } from "../../../config/colors";
import { dashboardStyles as styles, getRiskBadgeStyle, getFilterOptionStyle } from "./Dashboard.styles";

interface DashboardProps {
  onOpenBed: (bed: Bed) => void;
}

const FILTER_OPTIONS: { value: RiskLevel | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "critical", label: "Críticos" },
  { value: "attention", label: "Atenção" },
];

export const Dashboard: React.FC<DashboardProps> = ({ onOpenBed }) => {
  const { data: internacoes = [], isLoading } = useInternacoes();

  const initialBeds = useMemo(() => {
    if (internacoes && internacoes.length > 0) {
      return internacoes.map((int: any) => ({
        id: String(int.leito?.numero ?? "??"),
        internacaoId: String(int.id),
        name: int.paciente?.nome || "Desconhecido",
        hr: 78,
        hrSeries: [72, 75, 76, 78, 80, 78],
        mood: "neutro" as import("../../../types").MoodType,
        conf: 90,
        risk: (int.risco || "normal") as import("../../../types").RiskLevel,
        acordado: true,
        ts: "agora",
        status: (int.ativo ? "internado" : "alta") as import("../../../types").PatientStatus,
      }));
    }
    return mockBeds;
  }, [internacoes]);

  const [bedsState, setBedsState] = useState<Bed[]>(initialBeds);

  useEffect(() => {
    const hasChanged = initialBeds.some((newBed, i) => {
      const oldBed = bedsState[i];
      return !oldBed || oldBed.internacaoId !== newBed.internacaoId || oldBed.risk !== newBed.risk || oldBed.status !== newBed.status;
    });
    if (hasChanged || initialBeds.length !== bedsState.length) {
      setBedsState(initialBeds);
    }
  }, [initialBeds]);

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

  const handleChangeRisk = (bedId: string, risk: RiskLevel) => {
    setBedsState((prev) => prev.map((bed) =>
      bed.id === bedId ? { ...bed, risk } : bed
    ));
  };

  const handleToggleStatus = (bedId: string) => {
    setBedsState((prev) => prev.map((bed) =>
      bed.id === bedId ? { ...bed, status: bed.status === "internado" ? "alta" : "internado" } : bed
    ));
  };

  const filteredBeds = bedsState.filter((bed) => {
    const matchesFilter = filter === "all" || bed.risk === filter;
    const matchesSearch = bed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bed.id.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const criticalCount = bedsState.filter((b) => b.risk === "critical" && b.status === "internado").length;
  const attentionCount = bedsState.filter((b) => b.risk === "attention" && b.status === "internado").length;
  const currentFilterLabel = FILTER_OPTIONS.find((opt) => opt.value === filter)?.label ?? "Todos";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Dashboard de Pacientes" subtitle={`${bedsState.length} leitos monitorados`} />

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
          ) : filteredBeds.map((bed, index) => (
            <BedCard
              key={bed.internacaoId || bed.id + "-" + index}
              bed={bed}
              onSelect={onOpenBed}
              onChangeRisk={handleChangeRisk}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>

        <div className="border p-3.5 sm:p-5" style={styles.sectionCard}>
          <p className="kicker mb-3 sm:mb-4 text-xs" style={styles.sectionTitle}>
            Pacientes sob monitoramento intenso
          </p>
          <div className="space-y-2">
            {bedsState.filter((b) => b.risk === "critical" || b.risk === "attention").slice(0, 5).map((patient, i) => (
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
    </div>
  );
};
