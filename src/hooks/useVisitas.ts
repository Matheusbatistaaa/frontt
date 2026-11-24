import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Visita } from '../modules/visitas/visitas.types';

export function useVisitas() {
  return useQuery<Visita[]>({
    queryKey: ['visitantes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visitantes')
        .select(`
          id,
          paciente_id,
          nome_visitante,
          parentesco,
          data_entrada,
          data_saida,
          status,
          paciente:pacientes(nome)
        `)
        .order('id', { ascending: false });

      if (error) {
        console.warn('[useVisitas] Erro na consulta de visitantes:', error);
        throw error;
      }

      return (data ?? []).map((v: any, index: number) => {
        const formatTime = (ts: string | null) =>
          ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---';

        return {
          id: String(v.id),
          leito: String(401 + ((v.paciente_id || index) % 8)),
          paciente: v.paciente?.nome || 'Paciente',
          visitante: v.nome_visitante || 'Visitante',
          parentesco: v.parentesco || 'Familiar',
          entrada: formatTime(v.data_entrada),
          saida: formatTime(v.data_saida),
          status: (v.status === 'em-andamento' || v.status === 'agendada' || v.status === 'finalizada')
            ? v.status
            : 'agendada',
        };
      });
    },
    retry: 1,
  });
}
