import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useEstoque() {
  return useQuery({
    queryKey: ['estoque'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('estoque')
          .select(`
            id,
            medicamento_id,
            quantidade_atual,
            quantidade_minima,
            medicamento:medicamentos(id, nome, categoria, unidade_medida)
          `);

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: String(row.id),
            medicamentoId: row.medicamento_id,
            nome: row.medicamento?.nome || 'Medicamento ' + row.id,
            categoria: row.medicamento?.categoria || 'Insumos',
            quantidade: Number(row.quantidade_atual ?? 0),
            minimo: Number(row.quantidade_minima ?? 0),
            unidade: row.medicamento?.unidade_medida || 'un',
          }));
        }
      } catch (err) {
        console.warn('[useEstoque] Falha ao carregar medicamentos com join:', err);
      }

      const { data, error } = await supabase.from('estoque').select('*');
      if (error) {
        console.error('[useEstoque] Supabase error:', error);
        throw error;
      }

      return (data ?? []).map((row: any) => ({
        id: String(row.id),
        medicamentoId: row.medicamento_id,
        nome: row.item || row.nome || 'Item ' + row.id,
        categoria: row.categoria || 'Medicamentos',
        quantidade: Number(row.quantidade_atual ?? row.quantidade ?? 0),
        minimo: Number(row.quantidade_minima ?? row.minimo ?? 0),
        unidade: row.unidade || 'un',
      }));
    },
    retry: 1,
  });
}
