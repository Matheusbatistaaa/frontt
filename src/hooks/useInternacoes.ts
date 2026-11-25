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
      return data;
    },
  });
}
