import React from "react";
import { X, FileText, BedSingle } from "lucide-react";
import { Bed } from "../../types";
import { COLORS, INK_OVERLAY } from "../../config/colors";

interface FichaPacienteModalProps {
  bed: Bed;
  onClose: () => void;
}

const formatarData = (valor?: string | null) => {
  if (!valor) return "—";
  const somenteData = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (somenteData) return `${somenteData[3]}/${somenteData[2]}/${somenteData[1]}`;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleDateString("pt-BR");
};

const formatarGenero = (valor?: string | null) => {
  if (!valor) return "—";
  if (valor === "F") return "Feminino";
  if (valor === "M") return "Masculino";
  if (valor === "O") return "Outro";
  return valor;
};

const Campo: React.FC<{ label: string; value?: string | null | undefined }> = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: COLORS.slateSoft }}>
      {label}
    </p>
    <p className="text-[12px] sm:text-[12.5px] font-medium break-words mt-0.5" style={{ color: COLORS.ink }}>
      {value && String(value).trim() ? value : "—"}
    </p>
  </div>
);

export const FichaPacienteModal: React.FC<FichaPacienteModalProps> = ({ bed, onClose }) => {
  const ficha = bed.ficha;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4"
      style={{ background: INK_OVERLAY }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto border p-4 sm:p-6 bg-white"
        style={{ background: COLORS.card, borderColor: COLORS.line }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
          <div className="min-w-0">
            <p className="kicker text-[10.5px] mb-1" style={{ color: COLORS.orange }}>
              Ficha do paciente · Leito {bed.id}
            </p>
            <p className="display text-[1.15rem] sm:text-[1.25rem] font-semibold truncate" style={{ color: COLORS.ink }}>
              {bed.name}
            </p>
            <p className="text-[11.5px] sm:text-[12px] mt-0.5 flex items-center gap-1.5" style={{ color: COLORS.slateSoft }}>
              <BedSingle size={13} />
              {bed.status === "internado" ? "Internado" : "Alta"}
            </p>
          </div>
          <button onClick={onClose} className="p-1 shrink-0" aria-label="Fechar ficha">
            <X size={18} color={COLORS.slateSoft} />
          </button>
        </div>

        {!ficha ? (
          <p className="text-xs sm:text-[13px] py-4" style={{ color: COLORS.slateSoft }}>
            Dados cadastrais não disponíveis para este paciente.
          </p>
        ) : (
          <>
            <div
              className="flex items-center gap-2 px-3 py-2 mb-4"
              style={{ background: COLORS.orangeSoft }}
            >
              <FileText size={15} color={COLORS.orange} />
              <span className="text-[11.5px] sm:text-[12px] font-semibold" style={{ color: COLORS.orangeDark }}>
                Dados informados no cadastro
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
              <Campo label="CPF" value={ficha.cpf} />
              <Campo label="Data de nascimento" value={formatarData(ficha.dataNascimento)} />
              <Campo label="Sexo" value={formatarGenero(ficha.genero)} />
              <Campo label="Convênio" value={ficha.convenio} />
              <Campo label="Telefone" value={ficha.telefone} />
              <Campo label="Contato de emergência" value={ficha.contatoEmergencia} />
              <Campo label="Telefone de emergência" value={ficha.numeroEmergencia} />
              <Campo label="Alergias conhecidas" value={ficha.alergias} />
              <Campo label="Internado desde" value={formatarData(ficha.dataInternacao)} />
              <Campo label="Médico responsável" value={ficha.medico} />
              <div className="sm:col-span-2">
                <Campo label="Diagnóstico inicial" value={ficha.diagnostico} />
              </div>
              {ficha.observacoes && (
                <div className="sm:col-span-2">
                  <Campo label="Observações" value={ficha.observacoes} />
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full h-10 sm:h-11 border text-xs sm:text-sm font-semibold mt-5 sm:mt-6"
          style={{ borderColor: COLORS.line, color: COLORS.slate }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
