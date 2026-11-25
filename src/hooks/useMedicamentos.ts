import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useMedicamentos() {
  return useQuery({
    queryKey: ['medicamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicamentos')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });
}

export function usePrescricoes(internacaoId?: string) {
  return useQuery({
    queryKey: ['prescricoes', internacaoId],
    queryFn: async () => {
      if (!internacaoId) return [];

      const { data, error } = await supabase
        .from('prescricoes_medicamentos')
        .select('*, medicamento:medicamentos(nome, forma_farmaceutica)')
        .eq('internacao_id', internacaoId)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!internacaoId,
  });
}
