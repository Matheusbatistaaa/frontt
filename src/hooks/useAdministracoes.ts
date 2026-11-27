import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface AdministracaoComPrescricao {
  id: string | number;
  status: string;
  data_hora_planejada: string | null;
  prescricao: {
    internacao_id: string | number;
    via_administracao: string | null;
    medicamento: { nome: string | null } | null;
    internacao: {
      paciente: { nome: string | null } | null;
      leito: { numero: string | null } | null;
    } | null;
  } | null;
}

export function useAdministracoes(internacaoId?: string) {
  return useQuery<AdministracaoComPrescricao[]>({
    queryKey: ['administracoes', internacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('administracoes_medicamento')
        .select(`
          id,
          status,
          data_hora_planejada,
          prescricao:prescricoes_medicamentos(
            internacao_id,
            via_administracao,
            medicamento:medicamentos(nome),
            internacao:internacoes(
              paciente:pacientes(nome),
              leito:leitos(numero)
            )
          )
        `)
        .order('data_hora_planejada', { ascending: true })
        .returns<AdministracaoComPrescricao[]>();

      if (error) throw error;
      const administracoes = data ?? [];
      return internacaoId
        ? administracoes.filter(
            (administracao) =>
              String(administracao.prescricao?.internacao_id) === internacaoId,
          )
        : administracoes;
    },
    retry: 1,
  });
}
