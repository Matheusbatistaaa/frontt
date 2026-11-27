import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface InternacaoRow {
  id: string | number;
  paciente_id: string | number;
  leito_id: string | number;
  medico_responsavel_id: string | number | null;
  diagnostico_principal: string | null;
  data_internacao: string;
  observacoes: string | null;
  ativo: boolean;
  risco?: string | null;
  data_saida?: string | null;
  paciente?: {
    id: string | number;
    nome: string;
    cpf: string | null;
    data_nascimento: string | null;
    genero: string | null;
    convenio: string | null;
    telefone: string | null;
    contato_emergencia: string | null;
    numero_emergencia: string | null;
    alergias: string | null;
  } | null;
  leito?: {
    id: string | number;
    numero: string;
    status: string;
  } | null;
  medico?: {
    nome: string;
  } | null;
}

export function useInternacoes() {
  return useQuery<InternacaoRow[]>({
    queryKey: ["internacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internacoes")
        .select(`
          *,
          paciente:pacientes(id, nome, cpf, data_nascimento, genero, convenio, telefone, contato_emergencia, numero_emergencia, alergias),
          leito:leitos(id, numero, status),
          medico:usuarios(nome)
        `)
        .eq("ativo", true)
        .order("data_internacao", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as InternacaoRow[];
    },
  });
}
