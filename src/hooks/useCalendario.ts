import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { EventoCalendario } from '../modules/calendario/calendario.types';

export function useCalendario() {
  return useQuery<EventoCalendario[]>({
    queryKey: ['calendario_eventos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendario_eventos')
        .select('*');

      if (error) {
        console.error('[useCalendario] Supabase error:', error);
        throw error;
      }

      return (data ?? []).map((row: any) => {
        const rawDate = row.data_inicio || row.data_hora_inicio || row.criado_em || new Date().toISOString();
        const inicio = new Date(rawDate);
        const validDate = isNaN(inicio.getTime()) ? new Date() : inicio;

        return {
          id: String(row.id),
          data: validDate.toISOString().split('T')[0] ?? '',
          hora: validDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tipo: row.tipo || 'consulta',
          titulo: row.titulo || 'Evento',
          descricao: row.descricao || '',
          dataHoraFim: row.data_hora_fim,
        };
      });
    },
    retry: 1,
  });
}
