import { withOracleConnection } from './oracleClient.js';

// Resolve o universo real de filiais de um "grupo economico"/consolidadora
// para o Relatorio de Saldo Bancario.
//
// Diferente do relatorio Financeiro por Projeto (resolveFiliais.ts), que
// resolve uma filial pela arvore de PAI_AGN_IN_CODIGO (organograma
// societario), aqui essa arvore NAO reflete corretamente o agrupamento --
// confirmado com um caso real: a conta "FOCO - BRADESCO - C/C" aparece no
// relatorio de referencia do Grupo Brasil Sul (filial 2), mas a empresa dona
// dessa conta (FOCO CONSULTORIA E PROJETOS LTDA, filial 1676) tem como
// PAI_AGN_IN_CODIGO a filial 1668 ("GRUPO DE EMPRESAS - SOCIOS"), nao a 2 --
// entao a caminhada pela arvore nunca a alcanca.
//
// O agrupamento real usado pelo MEGA para saber "quais filiais fazem parte
// deste grupo consolidado" vive em GLO_FILIAL_ATIVA: cada linha associa uma
// filial a uma estacao+usuario MEGA que a tem ativa. Um usuario de
// tesouraria com acesso ao grupo inteiro tem, na pratica, todas as filiais
// do grupo ativas sob a mesma (estacao, usuario) -- entao a lista completa e
// correta do grupo e a maior lista de filiais que aparece junto com a filial
// escolhida sob uma unica (estacao, usuario). Verificado contra o relatorio
// de referencia: a combinacao mais ampla que inclui a filial 2 (45 filiais)
// bate exatamente com a lista de empresas do PDF, incluindo a FOCO.
export async function resolveFiliaisConsolidado(filialCodigo: number): Promise<number[]> {
  const rows = await withOracleConnection(async (connection) => {
    const result = await connection.execute<{ FIL_IN_CODIGO: number }>(
      `SELECT FIL_IN_CODIGO
         FROM ATTOS.GLO_FILIAL_ATIVA@ATTOS2
        WHERE (COMP_ST_NOME, USU_IN_CODIGO) = (
                SELECT COMP_ST_NOME, USU_IN_CODIGO FROM (
                  SELECT g.COMP_ST_NOME, g.USU_IN_CODIGO
                    FROM ATTOS.GLO_FILIAL_ATIVA@ATTOS2 g,
                         (SELECT COMP_ST_NOME, USU_IN_CODIGO, COUNT(*) N
                            FROM ATTOS.GLO_FILIAL_ATIVA@ATTOS2
                           GROUP BY COMP_ST_NOME, USU_IN_CODIGO) cnt
                   WHERE g.FIL_IN_CODIGO = :filial
                     AND g.COMP_ST_NOME = cnt.COMP_ST_NOME
                     AND g.USU_IN_CODIGO = cnt.USU_IN_CODIGO
                   ORDER BY cnt.N DESC, g.COMP_ST_NOME, g.USU_IN_CODIGO
                ) WHERE ROWNUM = 1
              )`,
      { filial: filialCodigo },
    );
    return result.rows ?? [];
  });

  const filiais = new Set<number>(rows.map((r) => Number(r.FIL_IN_CODIGO)));
  filiais.add(filialCodigo);
  return Array.from(filiais);
}
