import { CategoriaAgregada, Linha, SeriePonto } from './types';

// Paleta cíclica de categorias (spec Apêndice B.1) — atribuída por posição no
// ranking, não por identidade da categoria (P5).
export const PALETA_CATEGORIAS = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#d69300',
  '#e0559a',
  '#4a3aa7',
  '#0ea5e9',
  '#65a30d',
  '#c026d3',
  '#b45309',
];

function rotuloDDMM(dataIso: string): string {
  const [, m, d] = dataIso.split('-');
  return `${d}/${m}`;
}

// Spec 3.6.1 — série diária ordenada cronologicamente, um ponto por dia com lançamento.
export function calcularSerieDiaria(linhas: Linha[]): SeriePonto[] {
  const mapaPorDia = new Map<string, number>();
  for (const linha of linhas) {
    mapaPorDia.set(linha.dataIso, (mapaPorDia.get(linha.dataIso) ?? 0) + linha.valor);
  }
  const dias = Array.from(mapaPorDia.keys()).sort();
  let acumulado = 0;
  return dias.map((dia) => {
    const valor = mapaPorDia.get(dia)!;
    acumulado += valor;
    return { chave: dia, rotulo: rotuloDDMM(dia), valor, acumulado };
  });
}

// Spec 3.5 — breakdown por Projeto (categoria), ordenado por valor desc.
export function calcularCategoriasAgregadas(linhas: Linha[]): CategoriaAgregada[] {
  const mapa = new Map<string, number>();
  for (const linha of linhas) {
    mapa.set(linha.categoria, (mapa.get(linha.categoria) ?? 0) + linha.valor);
  }
  const totalGeral = linhas.reduce((sum, l) => sum + l.valor, 0);
  const lista = Array.from(mapa.entries())
    .map(([categoria, valorTotal]) => ({ categoria, valorTotal }))
    .sort((a, b) => b.valorTotal - a.valorTotal);

  return lista.map((item, i) => ({
    categoria: item.categoria,
    valorTotal: item.valorTotal,
    percentualDoTotal: totalGeral > 0 ? Math.round((item.valorTotal / totalGeral) * 1000) / 10 : 0,
    corIndice: i % 10,
  }));
}

export function larguraBarra(valor: number, maior: number): number {
  const base = maior > 0 ? maior : 1;
  return Math.max(3, (valor / base) * 100);
}
