import { describe, it, expect } from 'vitest';
import { agruparPorProjetoEFilial } from './derive';
import { Linha } from './types';

const criarLinha = (overrides: Partial<Linha>): Linha => ({
  data: '01/09/2026',
  dataIso: '2026-09-01',
  agente: 'FORNECEDOR ALFA',
  historico: 'NF 1001 - MATERIAL',
  valor: 100,
  categoria: '10 - PROJETO A',
  projetoCodigo: 10,
  filial: 1,
  nomeFilial: 'FILIAL UM',
  ...overrides,
});

const projetoB = { categoria: '20 - PROJETO B', projetoCodigo: 20 };
const filialDois = { filial: 2, nomeFilial: 'FILIAL DOIS' };

describe('agruparPorProjetoEFilial', () => {
  it('deve agrupar por projeto e, dentro dele, por filial, em ordem de código', () => {
    const grupos = agruparPorProjetoEFilial([
      criarLinha({ ...projetoB, ...filialDois }),
      criarLinha({ ...filialDois }),
      criarLinha({ ...projetoB }),
      criarLinha({}),
    ]);

    expect(grupos.map((p) => [p.categoria, p.filiais.map((f) => f.nomeFilial)])).toEqual([
      ['10 - PROJETO A', ['FILIAL UM', 'FILIAL DOIS']],
      ['20 - PROJETO B', ['FILIAL UM', 'FILIAL DOIS']],
    ]);
  });

  it('deve ordenar projetos pelo código numérico, não pelo texto', () => {
    const grupos = agruparPorProjetoEFilial([
      criarLinha({ categoria: '100 - PROJETO C', projetoCodigo: 100 }),
      criarLinha({ ...projetoB }),
      criarLinha({ categoria: '3 - ADMINISTRAÇÃO', projetoCodigo: 3 }),
    ]);

    expect(grupos.map((p) => p.projetoCodigo)).toEqual([3, 20, 100]);
  });

  it('deve somar o total de cada filial e de cada projeto', () => {
    const grupos = agruparPorProjetoEFilial([
      criarLinha({ valor: 10 }),
      criarLinha({ valor: 5.5 }),
      criarLinha({ ...filialDois, valor: 40 }),
      criarLinha({ ...projetoB, valor: 100 }),
    ]);

    expect(grupos[0].total).toBeCloseTo(55.5);
    expect(grupos[0].filiais.map((f) => f.total)).toEqual([15.5, 40]);
    expect(grupos[1].total).toBe(100);
    const totalGeral = grupos.reduce((soma, p) => soma + p.total, 0);
    expect(totalGeral).toBeCloseTo(155.5);
  });

  it('deve manter todas as linhas, em ordem de data dentro da filial', () => {
    const linhas = [
      criarLinha({ dataIso: '2026-09-03', historico: 'C' }),
      criarLinha({ dataIso: '2026-09-01', historico: 'A' }),
      criarLinha({ dataIso: '2026-09-01', historico: 'B' }),
    ];
    const grupos = agruparPorProjetoEFilial(linhas);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].filiais[0].linhas.map((l) => l.historico)).toEqual(['A', 'B', 'C']);
  });

  it('deve devolver o mesmo resultado para a mesma entrada em qualquer ordem', () => {
    const linhas = [
      criarLinha({ ...projetoB, ...filialDois, historico: '1' }),
      criarLinha({ ...filialDois, historico: '2' }),
      criarLinha({ ...projetoB, historico: '3' }),
      criarLinha({ historico: '4' }),
    ];
    const resumo = (entrada: Linha[]) =>
      agruparPorProjetoEFilial(entrada).map((p) => [
        p.categoria,
        p.total,
        p.filiais.map((f) => [f.filial, f.total, f.linhas.length]),
      ]);

    expect(resumo([...linhas].reverse())).toEqual(resumo(linhas));
  });
});
