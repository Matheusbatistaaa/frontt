import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ExpressaoInfoIA } from '../modules/info-ia/info-ia.types';

export function useExpressoes(internacaoId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!internacaoId) return;

    const channel = supabase
      .channel(`expressoes_faciais_${internacaoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'expressoes_faciais',
          
          filter: `internacao_id=eq.${internacaoId}`,
        },
        (payload) => {
          queryClient.setQueryData<ExpressaoInfoIA[]>(
            ['expressoes_faciais', internacaoId],
            (old) => {
              const registro = payload.new as ExpressaoInfoIA;
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

  return useQuery<ExpressaoInfoIA[]>({
    queryKey: ['expressoes_faciais', internacaoId],
    queryFn: async () => {
      if (!internacaoId) return [];

      const { data, error } = await supabase
        .from('expressoes_faciais')
        .select('*')
        .eq('internacao_id', internacaoId)
        .order('timestamp', { ascending: true })
        .limit(100);

      if (error) {
        console.error('[useExpressoes] erro Supabase:', error.message, error.details, error.hint);
        throw error;
      }
      return data;
    },
    enabled: !!internacaoId,
  });
}
