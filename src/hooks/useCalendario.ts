import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  formatTimeInBrazil,
  getDateInBrazil,
  parseTimestamp,
  zonedDateTimeToUtc,
} from '../lib/dateTime';
import type {
  EventoCalendario,
  NovoEventoFormData,
  TipoEventoKey,
} from '../modules/calendario/calendario.types';

const CALENDARIO_QUERY_KEY = ['calendario_eventos'] as const;

interface CalendarioEventoRow {
  id: number;
  tipo: string | null;
  titulo: string | null;
  descricao: string | null;
  data_hora_inicio: string;
  data_hora_fim: string | null;
  local: string | null;
}

function isTipoEvento(value: string | null): value is TipoEventoKey {
  return value === 'plantao' || value === 'procedimento' || value === 'consulta' || value === 'reuniao';
}

export function useCalendario() {
  return useQuery<EventoCalendario[]>({
    queryKey: CALENDARIO_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendario_eventos')
        .select('id, tipo, titulo, descricao, data_hora_inicio, data_hora_fim, local')
        .order('data_hora_inicio', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row: CalendarioEventoRow) => {
        const inicio = parseTimestamp(row.data_hora_inicio);
        if (Number.isNaN(inicio.getTime())) {
          throw new Error('Evento com data de início inválida no banco.');
        }
        if (!isTipoEvento(row.tipo)) {
          throw new Error('Evento com tipo não suportado no banco.');
        }

        return {
          id: String(row.id),
          data: getDateInBrazil(inicio),
          hora: formatTimeInBrazil(inicio),
          tipo: row.tipo,
          titulo: row.titulo ?? 'Título não informado',
          descricao: row.descricao,
          dataHoraInicio: row.data_hora_inicio,
          dataHoraFim: row.data_hora_fim,
          horaFim: row.data_hora_fim ? formatTimeInBrazil(row.data_hora_fim) : null,
          local: row.local,
        };
      });
    },
    retry: 1,
  });
}

export function useCriarEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: NovoEventoFormData) => {
      const dataHoraInicio = zonedDateTimeToUtc(form.data, form.hora);
      const dataHoraFim = zonedDateTimeToUtc(form.dataFim, form.horaFim);

      if (new Date(dataHoraFim).getTime() <= new Date(dataHoraInicio).getTime()) {
        throw new Error('O término do evento deve ser posterior ao início.');
      }

      const { data, error } = await supabase
        .from('calendario_eventos')
        .insert({
          tipo: form.tipo,
          titulo: form.titulo.trim(),
          descricao: form.observacoes.trim(),
          data_hora_inicio: dataHoraInicio,
          data_hora_fim: dataHoraFim,
        })
        .select('id')
        .single();

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: CALENDARIO_QUERY_KEY });
      return data;
    },
  });
}

export function useExcluirEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventoId: string) => {
      const id = Number(eventoId);
      if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error('Identificador de evento inválido.');
      }

      const { data, error } = await supabase
        .from('calendario_eventos')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Evento não encontrado para exclusão.');

      await queryClient.invalidateQueries({ queryKey: CALENDARIO_QUERY_KEY });
    },
  });
}
