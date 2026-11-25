import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useInternacoes() {
  return useQuery({
    queryKey: ['internacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internacoes')
        .select(`
          *,
          paciente:pacientes(nome, cpf, data_nascimento, genero, convenio, telefone, contato_emergencia, numero_emergencia, alergias),
          leito:leitos(numero, status),
          medico:usuarios(nome)
        `)
        .eq('ativo', true)
        .order('data_internacao', { ascending: false });
      
      if (error) throw error;

      // Internações duplicadas para o mesmo paciente/leito: mantém a original (menor id)
      const porPacienteLeito = new Map<string, any>();
      for (const internacao of data ?? []) {
        const chave = `${internacao.paciente_id}:${internacao.leito_id}`;
        const atual = porPacienteLeito.get(chave);
        if (!atual || Number(internacao.id) < Number(atual.id)) {
          porPacienteLeito.set(chave, internacao);
        }
      }

      return [...porPacienteLeito.values()].sort(
        (a, b) => new Date(b.data_internacao).getTime() - new Date(a.data_internacao).getTime()
      );
    },
  });
}
