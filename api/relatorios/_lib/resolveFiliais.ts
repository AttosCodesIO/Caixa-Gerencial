import { withOracleConnection } from './oracleClient.js';

export interface FilialRow {
  codigo: number;
  nome: string;
  pai: number | null;
}

// Query A.1 da spec (query filiaisSql de server.js), reproduzida sem alteração.
const FILIAIS_SQL = `
SELECT DISTINCT F.FIL_IN_CODIGO AS CODIGO, A.AGN_ST_NOME AS NOME,
       A.PAI_AGN_IN_CODIGO AS PAI
  FROM ATTOS.GLO_FILIAL_ATIVA@ATTOS2 F, ATTOS.GLO_AGENTES@ATTOS2 A
 WHERE A.AGN_TAB_IN_CODIGO = F.FIL_TAB_IN_CODIGO
   AND A.AGN_PAD_IN_CODIGO = F.FIL_PAD_IN_CODIGO
   AND A.AGN_IN_CODIGO = F.FIL_IN_CODIGO
 ORDER BY F.FIL_IN_CODIGO
`;

export async function fetchFiliais(): Promise<FilialRow[]> {
  const rows = await withOracleConnection(async (connection) => {
    const result = await connection.execute<{ CODIGO: number; NOME: string; PAI: number | null }>(
      FILIAIS_SQL,
    );
    return result.rows ?? [];
  });

  const filiais = rows.map((r) => ({
    codigo: Number(r.CODIGO),
    nome: (r.NOME ?? '').trim(),
    pai: r.PAI != null ? Number(r.PAI) : null,
  }));

  // Salvaguarda redundante ao ORDER BY do banco (mesma regra aplicada em index.html na spec original).
  filiais.sort((a, b) => a.codigo - b.codigo);
  return filiais;
}

/**
 * Expande um código de filial para toda a árvore hierárquica: a própria filial
 * + todas as filiais que a têm (direta ou indiretamente) como consolidadora pai
 * (PAI_AGN_IN_CODIGO). Busca em largura, conforme resolveFiliaisAlvo() da spec.
 */
export function resolveFiliaisAlvo(filiais: FilialRow[], filialCodigo: number): number[] {
  const filhosPorPai = new Map<number, number[]>();
  for (const f of filiais) {
    if (f.pai == null) continue;
    if (!filhosPorPai.has(f.pai)) filhosPorPai.set(f.pai, []);
    filhosPorPai.get(f.pai)!.push(f.codigo);
  }

  const resultado = new Set<number>([filialCodigo]);
  const fila = [filialCodigo];
  while (fila.length > 0) {
    const atual = fila.shift()!;
    for (const filho of filhosPorPai.get(atual) ?? []) {
      if (!resultado.has(filho)) {
        resultado.add(filho);
        fila.push(filho);
      }
    }
  }
  return Array.from(resultado);
}
