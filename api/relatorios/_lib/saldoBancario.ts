import { withOracleConnection } from './oracleClient.js';
import { resolveFiliaisConsolidado } from './resolveGrupoConsolidado.js';
import { QUERY_SALDO_BANCARIO_SQL } from './querySaldoBancario.js';

export interface ParametrosSaldoBancario {
  filial: number;
  dataBase: string; // AAAA-MM-DD
  conta: number | null; // null => todas as contas
}

export interface LinhaSaldoBancario {
  agente: number;
  banco: string;
  saldoExtrato: number;
  docGerados: number;
  docAgendado: number;
  debitos: number;
  creditos: number;
  saldoReal: number;
}

// Colunas finais já computadas em SQL (ver querySaldoBancario.ts) — aqui os
// dados só são passados adiante, sem repetir a lógica de negócio em JS.
interface SaldoBancarioRow {
  AGENTE: number;
  BANCO: string | null;
  DOCGERADOS: number;
  DOCAGENDADO: number;
  DEBITOS: number;
  CREDITOS: number;
  SALDOEXTRATO: number;
  SALDOREAL: number;
}

export async function consultarSaldoBancario(
  params: ParametrosSaldoBancario,
): Promise<LinhaSaldoBancario[]> {
  // Mantida como string 'DD/MM/YYYY' (não Date) — ver nota sobre fuso horário
  // no cabeçalho de querySaldoBancario.ts.
  const [ano, mes, dia] = params.dataBase.split('-');
  const dataBaseStr = `${dia}/${mes}/${ano}`;

  const filiaisAlvo = await resolveFiliaisConsolidado(params.filial);

  // Substituição de string no texto SQL (não bind de lista), mesma técnica
  // de relatorioExecutivo.ts — a lista vem inteiramente da resolução acima
  // (códigos numéricos server-side), nunca de entrada direta do usuário.
  const sql = QUERY_SALDO_BANCARIO_SQL.split('/*FILIAIS_ALVO*/0').join(filiaisAlvo.join(','));

  const rows = await withOracleConnection(async (connection) => {
    const result = await connection.execute<SaldoBancarioRow>(sql, {
      dataBaseStr,
      todasContas: params.conta === null ? 1 : 0,
      agenteFiltro: params.conta ?? 0,
    });
    return result.rows ?? [];
  });

  return rows.map((r) => ({
    agente: r.AGENTE,
    banco: (r.BANCO ?? '-').trim() || '-',
    saldoExtrato: Number(r.SALDOEXTRATO),
    docGerados: Number(r.DOCGERADOS),
    docAgendado: Number(r.DOCAGENDADO),
    debitos: Number(r.DEBITOS),
    creditos: Number(r.CREDITOS),
    saldoReal: Number(r.SALDOREAL),
  }));
}
