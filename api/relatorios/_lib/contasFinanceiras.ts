import { withOracleConnection } from './oracleClient.js';

export interface ContaFinanceira {
  codigo: number;
  nome: string;
  banco: string;
}

// Mesmo universo de contas considerado por ATTOS.PRC_FT_CONCILIACAOSALDOS
// (AGN_TAB_IN_CODIGO = 53) -- ver query_saldo_bancario.sql. Restrita às
// contas com pelo menos um movimento em alguma filial da lista informada
// (GLO_CONTASFIN não guarda filial/empresa própria da conta — a única forma
// confiável de saber a qual empresa/grupo uma conta pertence é olhar a
// filial dos movimentos que já passaram por ela).
// O join com GLO_CATEGORIA (cat) reproduz o mesmo join da procedure original
// e é essencial: GLO_AGENTES_ID tem uma linha por "papel" do agente para a
// mesma conta, e só o papel com categoria preenchida casa com GLO_CATEGORIA
// — sem esse join a lista viria duplicada (uma vez por papel).
// GLO_CONTASFIN (tab=53) também inclui registros que não são contas
// bancárias reais (agentes de pessoa física sem banco, e o próprio
// agente-filial/empresa) — excluídos via INNER JOIN com GLO_BANCO (só
// contas com banco de fato) e via AGN_IN_CODIGO NOT IN (lista de filiais).
// As contas 5749/8329 são uma exceção empírica documentada em
// query_saldo_bancario.sql — mantidas fora daqui também para consistência
// com a lista "todas as contas" do relatório.
function contasFinanceirasSql(filiaisAlvo: number[]): string {
  return `
SELECT ctf.AGN_IN_CODIGO AS CODIGO, agn.AGN_ST_NOME AS NOME,
       NVL(ban.BAN_ST_NOME, '-') AS BANCO
  FROM ATTOS.GLO_CONTASFIN@ATTOS2 ctf, ATTOS.GLO_AGENTES@ATTOS2 agn, ATTOS.GLO_AGENTES_ID@ATTOS2 agd,
       ATTOS.GLO_CATEGORIA@ATTOS2 cat, ATTOS.GLO_BANCO@ATTOS2 ban
 WHERE agn.AGN_TAB_IN_CODIGO = ctf.AGN_TAB_IN_CODIGO
   AND agn.AGN_PAD_IN_CODIGO = ctf.AGN_PAD_IN_CODIGO
   AND agn.AGN_IN_CODIGO = ctf.AGN_IN_CODIGO
   AND agd.AGN_TAB_IN_CODIGO = ctf.AGN_TAB_IN_CODIGO
   AND agd.AGN_PAD_IN_CODIGO = ctf.AGN_PAD_IN_CODIGO
   AND agd.AGN_IN_CODIGO = ctf.AGN_IN_CODIGO
   AND agd.CAT_TAB_IN_CODIGO = cat.CAT_TAB_IN_CODIGO
   AND agd.CAT_PAD_IN_CODIGO = cat.CAT_PAD_IN_CODIGO
   AND agd.CAT_IDE_ST_CODIGO = cat.CAT_IDE_ST_CODIGO
   AND agd.CAT_IN_REDUZIDO = cat.CAT_IN_REDUZIDO
   AND ban.BAN_IN_NUMERO = ctf.BAN_IN_NUMERO
   AND agd.AGN_CH_STATUS <> 'I'
   AND ctf.AGN_TAB_IN_CODIGO = 53
   AND ctf.AGN_IN_CODIGO NOT IN (${filiaisAlvo.join(',')})
   AND ctf.AGN_IN_CODIGO NOT IN (5749, 8329)
   AND EXISTS (
         SELECT 1
           FROM ATTOS.FIN_MOVIMENTO@ATTOS2 m
          WHERE m.AGN_TAB_IN_CODIGO = 53
            AND m.AGN_PAD_IN_CODIGO = ctf.AGN_PAD_IN_CODIGO
            AND m.AGN_IN_CODIGO = ctf.AGN_IN_CODIGO
            AND m.FIL_IN_CODIGO IN (${filiaisAlvo.join(',')})
       )
 ORDER BY agn.AGN_ST_NOME
`;
}

export async function fetchContasFinanceiras(filiaisAlvo: number[]): Promise<ContaFinanceira[]> {
  const rows = await withOracleConnection(async (connection) => {
    const result = await connection.execute<{ CODIGO: number; NOME: string; BANCO: string }>(
      contasFinanceirasSql(filiaisAlvo),
    );
    return result.rows ?? [];
  });

  return rows.map((r) => ({
    codigo: Number(r.CODIGO),
    nome: (r.NOME ?? '').trim(),
    banco: (r.BANCO ?? '').trim(),
  }));
}
