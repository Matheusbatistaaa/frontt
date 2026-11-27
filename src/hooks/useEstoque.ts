import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { EstoqueItem } from '../modules/estoque/estoque.types';

interface EstoqueRow {
  id: string | number;
  medicamento_id: string | number | null;
  quantidade_atual: number | string | null;
  quantidade_minima: number | string | null;
  quantidade_maxima: number | string | null;
  preco_unitario: number | string | null;
  medicamento: {
    nome: string | null;
    categoria: string | null;
    unidade_medida: string | null;
    preco_unitario: number | string | null;
  } | null;
}

export function useEstoque() {
  return useQuery<EstoqueItem[]>({
    queryKey: ['estoque'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque')
        .select(`
          id,
          medicamento_id,
          quantidade_atual,
          quantidade_minima,
          quantidade_maxima,
          preco_unitario,
          medicamento:medicamentos(nome, categoria, unidade_medida, preco_unitario)
        `)
        .order('id', { ascending: true })
        .returns<EstoqueRow[]>();

      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: String(row.id),
        medicamentoId: row.medicamento_id,
        nome: row.medicamento?.nome ?? 'Medicamento não identificado',
        categoria: row.medicamento?.categoria ?? 'Sem categoria',
        quantidade: Number(row.quantidade_atual ?? 0),
        minimo: Number(row.quantidade_minima ?? 0),
        quantidadeMaxima: Number(row.quantidade_maxima ?? 0),
        unidade: row.medicamento?.unidade_medida ?? 'un',
        preco: Number(row.medicamento?.preco_unitario ?? row.preco_unitario ?? 0),
      }));
    },
    retry: 1,
  });
}
