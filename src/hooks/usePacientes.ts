import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Paciente } from "../modules/prontuario/Prontuario.types";

interface InternacaoPacienteRow {
  id: string | number;
  ativo: boolean;
  diagnostico_principal: string | null;
  data_internacao: string | null;
  leito?: { numero: string } | null;
}

interface PacienteRow {
  id: string | number;
  nome: string;
  data_nascimento: string | null;
  genero: string | null;
  internacoes?: InternacaoPacienteRow[] | null;
}

function calcularIdade(dataNascimento?: string | null): number | undefined {
  if (!dataNascimento) return undefined;
  const data = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataNascimento);
  if (!data) return undefined;

  const hoje = new Date();
  let idade = hoje.getFullYear() - Number(data[1]);
  const mes = hoje.getMonth() - (Number(data[2]) - 1);
  if (mes < 0 || (mes === 0 && hoje.getDate() < Number(data[3]))) idade -= 1;
  return idade >= 0 ? idade : undefined;
}

export function usePacientes() {
  return useQuery<Paciente[]>({
    queryKey: ["pacientes"],
    queryFn: async () => {
      const pageSize = 1000;
      const rows: PacienteRow[] = [];

      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from("pacientes")
          .select(`
            id,
            nome,
            cpf,
            data_nascimento,
            genero,
            internacoes!left(
              id,
              ativo,
              diagnostico_principal,
              data_internacao,
              leito:leitos(numero)
            )
          `)
          .order("nome", { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        rows.push(...((data ?? []) as unknown as PacienteRow[]));
        if ((data?.length ?? 0) < pageSize) break;
      }

      return rows.map((row) => {
        const internacoes = Array.isArray(row.internacoes)
          ? [...row.internacoes].sort((a, b) =>
              String(b.data_internacao ?? "").localeCompare(String(a.data_internacao ?? ""))
            )
          : [];
        const internacao = internacoes.find((item) => item.ativo) ?? internacoes[0];
        const sexo = row.genero === "M" || row.genero === "F" ? row.genero : undefined;

        return {
          id: String(row.id),
          nome: row.nome,
          idade: calcularIdade(row.data_nascimento),
          leito: internacao?.leito?.numero ? String(internacao.leito.numero) : "—",
          sexo,
          condicao: internacao?.diagnostico_principal || "Sem diagnóstico informado",
          internacaoId: internacao?.id != null ? String(internacao.id) : undefined,
        };
      });
    },
    retry: 1,
  });
}
