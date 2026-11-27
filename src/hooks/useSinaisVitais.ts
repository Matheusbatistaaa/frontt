import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SinalVitalInfoIA } from '../modules/info-ia/info-ia.types';

export function useSinaisVitais(internacaoId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!internacaoId) return;

    const channel = supabase
      .channel(`sinais_vitais_${internacaoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sinais_vitais',
          filter: `internacao_id=eq.${internacaoId}`,
        },
        (payload) => {
          queryClient.setQueryData<SinalVitalInfoIA[]>(
            ['sinais_vitais', internacaoId],
            (old) => {
              const registro = payload.new as SinalVitalInfoIA;
              return [...(old ?? []), registro].slice(-100);
            },
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [internacaoId, queryClient]);

  return useQuery<SinalVitalInfoIA[]>({
    queryKey: ['sinais_vitais', internacaoId],
    queryFn: async () => {
      if (!internacaoId) return [];

      const { data, error } = await supabase
        .from('sinais_vitais')
        .select('*')
        .eq('internacao_id', internacaoId)
        .order('timestamp', { ascending: true })
        .limit(100);

      if (error) {
        console.error('[useSinaisVitais] erro Supabase:', error.message, error.details, error.hint);
        throw error;
      }
      return data;
    },
    enabled: !!internacaoId,
  });
}
