import { withOracleConnection } from './oracleClient.js';
import { fetchFiliais, resolveFiliaisAlvo } from './resolveFiliais.js';
import { titleCase, sentenceCase } from './format.js';
import { QUERY_RELATORIO_SQL } from './queryRelatorio.js';

export interface ParametrosRelatorioExecutivo {
  filial: number;
  dataInicio: string; // AAAA-MM-DD
  dataFim: string; // AAAA-MM-DD, inclusiva
  projetoInicio: number;
  projetoFim: number;
  agenteInicio: number;
  agenteFim: number;
  classeInicio: number;
  classeFim: number;
  centroCustoInicio: number;
  centroCustoFim: number;
}

export interface LinhaRelatorioExecutivo {
  data: string; // DD/MM/AAAA
  dataIso: string; // AAAA-MM-DD
  agente: string;
  historico: string;
  valor: number;
  categoria: string;
  filial: number;
  nomeFilial: string;
}

interface RelatorioRow {
  DATAISO: string;
  FILIAL: number;
  NOMEFIL: string | null;
  AGNORIGINALNOME: string | null;
  MOVHISTORICO: string | null;
  VALORORIGINAL: number;
  PROJETOS: string | null;
}

function brDate(dataIso: string): string {
  const [y, m, day] = dataIso.split('-');
  return `${day}/${m}/${y}`;
}

export async function consultarRelatorioExecutivo(
  params: ParametrosRelatorioExecutivo,
): Promise<LinhaRelatorioExecutivo[]> {
  const { filial, ...binds } = params;
  const filiais = await fetchFiliais();
  const filiaisAlvo = resolveFiliaisAlvo(filiais, filial);

  // Substituição de string no texto SQL (não bind de lista), conforme A.2 —
  // a lista vem inteiramente da resolução hierárquica acima (códigos numéricos
  // server-side), nunca de entrada direta do usuário.
  const sql = QUERY_RELATORIO_SQL.split('/*FILIAIS_ALVO*/0').join(filiaisAlvo.join(','));

  const rows = await withOracleConnection(async (connection) => {
    const result = await connection.execute<RelatorioRow>(sql, binds);
    return result.rows ?? [];
  });

  return rows.map((r) => ({
    data: brDate(r.DATAISO),
    dataIso: r.DATAISO,
    agente: titleCase((r.AGNORIGINALNOME ?? '').trim()),
    historico: sentenceCase((r.MOVHISTORICO ?? '').trim()),
    valor: Number(r.VALORORIGINAL),
    categoria: (r.PROJETOS ?? '').trim() || 'Sem Projeto',
    filial: r.FILIAL,
    nomeFilial: (r.NOMEFIL ?? '').trim(),
  }));
}
