import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type {
  ProntuarioFormData,
  SinaisVitais,
  PrescricaoItem,
  ExameItem,
} from "../modules/prontuario/Prontuario.types";

export interface ProntuarioRecord {
  id: string;
  paciente_id: string;
  internacao_id: string | null;
  queixa_principal: string;
  historia_doenca: string;
  avaliacao: string;
  orientacoes: string;
  sinais_vitais: SinaisVitais;
  prescricoes: PrescricaoItem[];
  exames: ExameItem[];
  atualizado_em: string;
}

interface SalvarProntuarioInput {
  pacienteId: string;
  internacaoId?: string | undefined;
  form: ProntuarioFormData;
}

export function useProntuario(pacienteId?: string) {
  return useQuery<ProntuarioRecord | null>({
    queryKey: ["prontuarios", pacienteId],
    enabled: Boolean(pacienteId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prontuarios")
        .select("*")
        .eq("paciente_id", pacienteId)
        .maybeSingle();

      if (error) throw error;
      return data as ProntuarioRecord | null;
    },
    retry: 1,
  });
}

export function useSalvarProntuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pacienteId, internacaoId, form }: SalvarProntuarioInput) => {
      const { data: authData } = await supabase.auth.getUser();
      const { error } = await supabase.from("prontuarios").upsert(
        {
          paciente_id: pacienteId,
          internacao_id: internacaoId ?? null,
          queixa_principal: form.queixaPrincipal,
          historia_doenca: form.historiaDoenca,
          avaliacao: form.avaliacao,
          orientacoes: form.orientacoes,
          sinais_vitais: form.sinaisVitais,
          prescricoes: form.prescricoes,
          exames: form.exames,
          atualizado_por: authData.user?.id ?? null,
        },
        { onConflict: "paciente_id" }
      );

      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["prontuarios", input.pacienteId] });
    },
  });
}
