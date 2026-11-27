import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Doctor } from "../types";

interface MedicoRow {
  id: string | number;
  nome: string;
  especialidade: string | null;
  crm_coren: string | null;
  turno: string | null;
  horario_inicio: string | null;
  horario_fim: string | null;
  plantao: boolean | null;
  internacoes?: { id: string | number; ativo: boolean }[] | null;
}

function inferirTurno(horario?: string | null): Doctor["turno"] {
  if (!horario) return "nao-definido";
  const hora = Number(horario.slice(0, 2));
  if (hora < 12) return "manhã";
  if (hora < 19) return "tarde";
  return "noite";
}

export function useMedicos() {
  return useQuery<Doctor[]>({
    queryKey: ["medicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select(`
          id,
          nome,
          especialidade,
          crm_coren,
          turno,
          horario_inicio,
          horario_fim,
          plantao,
          internacoes!left(id, ativo)
        `)
        .eq("role", "medico")
        .order("nome", { ascending: true });

      if (error) throw error;

      return ((data ?? []) as unknown as MedicoRow[]).map((row) => {
        const horarioInicio = row.horario_inicio ? String(row.horario_inicio).slice(0, 5) : "—";
        const horarioFim = row.horario_fim ? String(row.horario_fim).slice(0, 5) : "—";
        const turno: Doctor["turno"] =
          typeof row.turno === "string" && ["manhã", "tarde", "noite", "nao-definido"].includes(row.turno)
            ? row.turno as Doctor["turno"]
            : inferirTurno(row.horario_inicio);
        const internacoes = Array.isArray(row.internacoes) ? row.internacoes : [];

        return {
          id: String(row.id),
          nome: row.nome,
          especialidade: row.especialidade || "Especialidade não informada",
          crm: row.crm_coren || "—",
          turno,
          horarioInicio,
          horarioFim,
          plantao: Boolean(row.plantao),
          pacientes: internacoes.filter((item) => item.ativo).map((item) => String(item.id)),
        };
      });
    },
    retry: 1,
  });
}
