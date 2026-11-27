import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatTimeInBrazil, zonedDateTimeToUtc } from '../lib/dateTime';
import type { NovaVisitaFormData, Visita, VisitaStatus } from '../modules/visitas/visitas.types';

const VISITAS_QUERY_KEY = ['visitantes'] as const;

type Relacao<T> = T | T[] | null;

interface InternacaoRelacionada {
  id: number;
  ativo: boolean | null;
  data_internacao: string | null;
  leito: Relacao<{ id: number; numero: string | null }>;
}

interface VisitaRow {
  id: number;
  paciente_id: number;
  nome_visitante: string | null;
  parentesco: string | null;
  data_entrada: string | null;
  data_saida: string | null;
  status: string | null;
  paciente: Relacao<{
    nome: string | null;
    internacoes: InternacaoRelacionada[] | null;
  }>;
}

function firstRelation<T>(value: Relacao<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function isVisitaStatus(value: string | null): value is VisitaStatus {
  return value === 'em-andamento' || value === 'agendada' || value === 'finalizada';
}

function getLeitoReal(internacoes: InternacaoRelacionada[] | null): string {
  const ordenadas = [...(internacoes ?? [])].sort((a, b) =>
    String(b.data_internacao ?? '').localeCompare(String(a.data_internacao ?? ''))
  );
  const internacao = ordenadas.find((item) => item.ativo) ?? ordenadas[0];
  const leito = internacao ? firstRelation(internacao.leito) : null;
  return leito?.numero ? String(leito.numero) : 'Sem leito';
}

function validarId(id: string): number {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new Error('Identificador de visita inválido.');
  }
  return numericId;
}

async function validarPacienteComLeito(pacienteId: number) {
  if (!Number.isSafeInteger(pacienteId) || pacienteId <= 0) {
    throw new Error('Selecione um paciente válido.');
  }

  const { data, error } = await supabase
    .from('internacoes')
    .select('id, paciente_id, leito:leitos(id, numero)')
    .eq('paciente_id', pacienteId)
    .eq('ativo', true)
    .order('data_internacao', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const leito = data ? firstRelation(data.leito) : null;
  if (!leito?.numero) {
    throw new Error('O paciente selecionado não possui internação ativa com leito.');
  }
  return data;
}

export function useVisitas() {
  return useQuery<Visita[]>({
    queryKey: VISITAS_QUERY_KEY,
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
          paciente:pacientes(
            nome,
            internacoes(id, ativo, data_internacao, leito:leitos(id, numero))
          )
        `)
        .order('data_entrada', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row: VisitaRow) => {
        const paciente = firstRelation(row.paciente);
        if (!paciente) {
          throw new Error('Visita vinculada a um paciente não encontrado.');
        }
        if (!isVisitaStatus(row.status)) {
          throw new Error('Visita com status não suportado no banco.');
        }

        return {
          id: String(row.id),
          pacienteId: row.paciente_id,
          leito: getLeitoReal(paciente.internacoes),
          paciente: paciente.nome ?? 'Nome não informado',
          visitante: row.nome_visitante ?? 'Visitante não informado',
          parentesco: row.parentesco ?? 'Parentesco não informado',
          entrada: formatTimeInBrazil(row.data_entrada),
          saida: formatTimeInBrazil(row.data_saida),
          dataEntrada: row.data_entrada,
          dataSaida: row.data_saida,
          status: row.status,
        };
      });
    },
    retry: 1,
  });
}

export function useCriarVisita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: NovaVisitaFormData) => {
      await validarPacienteComLeito(form.pacienteId);

      const dataEntrada = zonedDateTimeToUtc(form.data, form.hora);
      const temSaida = Boolean(form.dataSaida || form.horaSaida);
      if (temSaida && (!form.dataSaida || !form.horaSaida)) {
        throw new Error('Informe a data e o horário de saída.');
      }
      const dataSaida = temSaida ? zonedDateTimeToUtc(form.dataSaida, form.horaSaida) : null;

      if (dataSaida && new Date(dataSaida).getTime() <= new Date(dataEntrada).getTime()) {
        throw new Error('A saída deve ser posterior à entrada.');
      }

      const { data, error } = await supabase
        .from('visitantes')
        .insert({
          paciente_id: form.pacienteId,
          nome_visitante: form.visitante.trim(),
          parentesco: form.parentesco.trim(),
          data_entrada: dataEntrada,
          data_saida: dataSaida,
          status: 'agendada',
        })
        .select('id')
        .single();

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: VISITAS_QUERY_KEY });
      return data;
    },
  });
}

export function useCheckInVisita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitaId: string) => {
      const { data, error } = await supabase
        .from('visitantes')
        .update({ status: 'em-andamento', data_entrada: new Date().toISOString() })
        .eq('id', validarId(visitaId))
        .eq('status', 'agendada')
        .select('id')
        .single();

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: VISITAS_QUERY_KEY });
      return data;
    },
  });
}

export function useCheckOutVisita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitaId: string) => {
      const { data, error } = await supabase
        .from('visitantes')
        .update({ status: 'finalizada', data_saida: new Date().toISOString() })
        .eq('id', validarId(visitaId))
        .eq('status', 'em-andamento')
        .select('id')
        .single();

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: VISITAS_QUERY_KEY });
      return data;
    },
  });
}
