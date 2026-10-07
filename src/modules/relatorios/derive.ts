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

export interface GrupoFilial {
  filial: number;
  nomeFilial: string;
  total: number;
  linhas: Linha[];
}

export interface GrupoProjeto {
  projetoCodigo: number;
  categoria: string;
  total: number;
  filiais: GrupoFilial[];
}

// Ordem fixa dos grupos do Detalhamento: Projeto (código, depois nome) e,
// dentro dele, Filial (código). Usada também para ordenar as linhas da tabela
// da tela, para que tela e impressão mostrem os grupos na mesma sequência.
export function compararProjetoEFilial(a: Linha, b: Linha): number {
  return (
    a.projetoCodigo - b.projetoCodigo ||
    a.categoria.localeCompare(b.categoria) ||
    a.filial - b.filial
  );
}

// Detalhamento agrupado por Projeto e, dentro de cada projeto, por Filial
// (uma filial pode ter lançamentos em vários projetos, então ela se repete
// sob cada projeto em que aparece). Dentro da filial, as linhas ficam em
// ordem de data, preservando a ordem de chegada para datas iguais.
export function agruparPorProjetoEFilial(linhas: Linha[]): GrupoProjeto[] {
  const ordenadas = [...linhas].sort(
    (a, b) => compararProjetoEFilial(a, b) || a.dataIso.localeCompare(b.dataIso),
  );

  const projetos: GrupoProjeto[] = [];
  for (const linha of ordenadas) {
    let projeto = projetos[projetos.length - 1];
    if (!projeto || projeto.categoria !== linha.categoria) {
      projeto = {
        projetoCodigo: linha.projetoCodigo,
        categoria: linha.categoria,
        total: 0,
        filiais: [],
      };
      projetos.push(projeto);
    }
    let filial = projeto.filiais[projeto.filiais.length - 1];
    if (!filial || filial.filial !== linha.filial) {
      filial = {
        filial: linha.filial,
        nomeFilial: linha.nomeFilial || '—',
        total: 0,
        linhas: [],
      };
      projeto.filiais.push(filial);
    }
    filial.linhas.push(linha);
    filial.total += linha.valor;
    projeto.total += linha.valor;
  }
  return projetos;
}
