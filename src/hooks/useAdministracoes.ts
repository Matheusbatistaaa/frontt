import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useAdministracoes(internacaoId?: string) {
  return useQuery({
    queryKey: ['administracoes', internacaoId],
    queryFn: async () => {
      try {
        let query = supabase.from('administracoes_medicamento').select(`
          *,
          prescricao:prescricoes_medicamentos(
            *,
            medicamento:medicamentos(nome, forma_farmaceutica),
            internacao:internacoes(
              paciente:pacientes(nome),
              leito:leitos(numero)
            )
          )
        `);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          if (internacaoId) {
            return data.filter((d: any) => d.prescricao?.internacao_id?.toString() === String(internacaoId));
          }
          return data;
        }
      } catch (err) {
        console.warn('[useAdministracoes] Tentativa com prescricao falhou:', err);
      }

      try {
        let query = supabase.from('administracoes_medicamento').select(`
          *,
          medicamento:medicamentos(nome, forma),
          internacao:internacoes(
            paciente:pacientes(nome),
            leito:leitos(numero)
          )
        `);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            ...d,
            prescricao: {
              medicamento: d.medicamento,
              internacao: d.internacao,
              via_administracao: d.medicamento?.forma || 'Oral',
            },
            data_hora_planejada: d.horario_previsto,
          }));
        }
      } catch {}      try {
        const { data } = await supabase.from('administracoes_medicamento').select('*');
        if (data && data.length > 0) return data;
      } catch {}      return [];
    },
    retry: 1,
  });
}
