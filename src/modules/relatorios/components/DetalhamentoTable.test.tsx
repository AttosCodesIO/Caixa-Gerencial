import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DetalhamentoTable from './DetalhamentoTable';
import { Linha } from '../types';

const criarLinha = (overrides: Partial<Linha>): Linha => ({
  data: '01/09/2026',
  dataIso: '2026-09-01',
  agente: 'FORNECEDOR ALFA',
  historico: 'NF 1001 - MATERIAL',
  valor: 350,
  categoria: '10 - PROJETO A',
  projetoCodigo: 10,
  filial: 1,
  nomeFilial: 'FILIAL EXEMPLO',
  ...overrides,
});

const LINHAS: Linha[] = [
  criarLinha({}),
  criarLinha({ agente: 'CONSTRUTORA BETA', historico: 'NF 2040 - LOCACAO', valor: 2786.75 }),
  criarLinha({
    data: '02/09/2026',
    dataIso: '2026-09-02',
    agente: 'FORNECEDOR ALFA',
    historico: 'ENERGIA ELETRICA',
    valor: 12533.75,
  }),
];

// O jsdom não aplica CSS, então a tabela (>= 640px) e a lista de cards
// (< 640px) ficam ambas no DOM; as contagens olham só as linhas de registro
// da tabela (os títulos de grupo Projeto/Filial são marcados com data-grupo).
const linhasDaTabela = (container: HTMLElement) =>
  container.querySelectorAll('tbody tr:not([data-grupo])');

const titulosDeGrupo = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('tbody tr[data-grupo]')).map(
    (tr) =>
      `${tr.getAttribute('data-grupo')}: ${Array.from(tr.querySelectorAll('td'))
        .map((td) => (td.textContent ?? '').replace(/\s/g, ' '))
        .filter(Boolean)
        .join(' | ')}`,
  );

const digitar = (placeholder: string, valor: string) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value: valor } });

describe('Tabela de Detalhamento (DetalhamentoTable)', () => {
  describe('Filtros de coluna', () => {
    it('deve exibir todos os registros quando nenhum filtro está preenchido', () => {
      const { container } = render(<DetalhamentoTable linhas={LINHAS} />);
      expect(linhasDaTabela(container)).toHaveLength(3);
    });

    it('deve filtrar pelo dia exato da data', () => {
      const { container } = render(<DetalhamentoTable linhas={LINHAS} />);
      digitar('Dia...', '02');
      expect(linhasDaTabela(container)).toHaveLength(1);
      expect(linhasDaTabela(container)[0]).toHaveTextContent('ENERGIA ELETRICA');
    });

    it('deve filtrar por agente sem diferenciar maiúsculas de minúsculas', () => {
      const { container } = render(<DetalhamentoTable linhas={LINHAS} />);
      digitar('Filtrar agente...', 'alfa');
      expect(linhasDaTabela(container)).toHaveLength(2);
    });

    it('deve filtrar por histórico', () => {
      const { container } = render(<DetalhamentoTable linhas={LINHAS} />);
      digitar('Filtrar histórico...', 'locacao');
      expect(linhasDaTabela(container)).toHaveLength(1);
      expect(linhasDaTabela(container)[0]).toHaveTextContent('CONSTRUTORA BETA');
    });

    it('deve filtrar por valor digitado com ou sem a formatação brasileira', () => {
      const { container } = render(<DetalhamentoTable linhas={LINHAS} />);
      digitar('Valor...', '12.533');
      expect(linhasDaTabela(container)).toHaveLength(1);
      digitar('Valor...', '2786.75');
      expect(linhasDaTabela(container)).toHaveLength(1);
      expect(linhasDaTabela(container)[0]).toHaveTextContent('CONSTRUTORA BETA');
    });

    it('deve combinar os filtros preenchidos', () => {
      const { container } = render(<DetalhamentoTable linhas={LINHAS} />);
      digitar('Filtrar agente...', 'alfa');
      digitar('Dia...', '01');
      expect(linhasDaTabela(container)).toHaveLength(1);
      expect(linhasDaTabela(container)[0]).toHaveTextContent('NF 1001 - MATERIAL');
    });

    it('deve avisar quando nenhum registro atende aos filtros', () => {
      render(<DetalhamentoTable linhas={LINHAS} />);
      digitar('Filtrar histórico...', 'inexistente');
      expect(
        screen.getAllByText('Nenhum lançamento encontrado para os filtros aplicados.').length,
      ).toBeGreaterThan(0);
    });

    it('deve restaurar todos os registros ao clicar em "Limpar"', () => {
      const { container } = render(<DetalhamentoTable linhas={LINHAS} />);
      digitar('Filtrar agente...', 'beta');
      expect(linhasDaTabela(container)).toHaveLength(1);
      fireEvent.click(screen.getByTitle('Limpar Filtros'));
      expect(linhasDaTabela(container)).toHaveLength(3);
      expect(screen.getByPlaceholderText('Filtrar agente...')).toHaveValue('');
    });

    it('deve voltar para a primeira página ao filtrar', () => {
      const muitas = Array.from({ length: 25 }, (_, i) =>
        criarLinha({ historico: `REGISTRO ${i + 1}`, valor: i + 1 }),
      );
      render(<DetalhamentoTable linhas={muitas} />);
      fireEvent.click(screen.getByLabelText('Próxima página'));
      expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
      digitar('Filtrar agente...', 'alfa');
      expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    });
  });

  describe('Agrupamento por Projeto e Filial', () => {
    const projetoB = { categoria: '20 - PROJETO B', projetoCodigo: 20 };
    const filialDois = { filial: 2, nomeFilial: 'FILIAL DOIS' };
    const AGRUPADAS: Linha[] = [
      criarLinha({ ...projetoB, ...filialDois, valor: 100 }),
      criarLinha({ ...filialDois, valor: 40 }),
      criarLinha({ nomeFilial: 'FILIAL UM', valor: 10 }),
      criarLinha({ nomeFilial: 'FILIAL UM', valor: 5 }),
    ];

    it('deve exibir o projeto acima da filial, em ordem de código, com os totais', () => {
      const { container } = render(<DetalhamentoTable linhas={AGRUPADAS} />);
      expect(titulosDeGrupo(container)).toEqual([
        'projeto: 10 - PROJETO A | R$ 55,00',
        'filial: FILIAL UM | R$ 15,00',
        'filial: FILIAL DOIS | R$ 40,00',
        'projeto: 20 - PROJETO B | R$ 100,00',
        'filial: FILIAL DOIS | R$ 100,00',
      ]);
      expect(linhasDaTabela(container)).toHaveLength(4);
    });

    it('deve recalcular os totais dos grupos conforme os filtros', () => {
      const { container } = render(<DetalhamentoTable linhas={AGRUPADAS} />);
      digitar('Valor...', '40');
      expect(titulosDeGrupo(container)).toEqual([
        'projeto: 10 - PROJETO A | R$ 40,00',
        'filial: FILIAL DOIS | R$ 40,00',
      ]);
    });

    it('deve exibir o Total Geral depois do último grupo, somando todos os projetos', () => {
      const { container } = render(<DetalhamentoTable linhas={AGRUPADAS} />);
      const total = container.querySelector('tfoot tr[data-grupo="total"]');
      expect(total).toHaveTextContent('Total Geral');
      expect((total?.textContent ?? '').replace(/\s/g, ' ')).toContain('R$ 155,00');
    });

    it('deve recalcular o Total Geral conforme os filtros e mantê-lo em todas as páginas', () => {
      const muitas = Array.from({ length: 12 }, (_, i) =>
        criarLinha({ historico: `REGISTRO ${i + 1}`, valor: 1 }),
      );
      const { container } = render(<DetalhamentoTable linhas={muitas} />);
      const texto = () =>
        (container.querySelector('tfoot tr[data-grupo="total"]')?.textContent ?? '').replace(
          /\s/g,
          ' ',
        );
      expect(texto()).toContain('R$ 12,00');
      fireEvent.click(screen.getByLabelText('Próxima página'));
      expect(texto()).toContain('R$ 12,00');
      digitar('Filtrar histórico...', 'REGISTRO 12');
      expect(texto()).toContain('R$ 1,00');
    });

    it('não deve exibir o Total Geral quando não há registros', () => {
      const { container } = render(<DetalhamentoTable linhas={AGRUPADAS} />);
      digitar('Filtrar histórico...', 'inexistente');
      expect(container.querySelector('tfoot')).toBeNull();
    });

    it('deve repetir os títulos do grupo no topo da página seguinte', () => {
      const muitas = Array.from({ length: 12 }, (_, i) =>
        criarLinha({ historico: `REGISTRO ${i + 1}`, valor: 1 }),
      );
      const { container } = render(<DetalhamentoTable linhas={muitas} />);
      fireEvent.click(screen.getByLabelText('Próxima página'));
      expect(titulosDeGrupo(container)).toEqual([
        'projeto: 10 - PROJETO A | R$ 12,00',
        'filial: FILIAL EXEMPLO | R$ 12,00',
      ]);
      expect(linhasDaTabela(container)).toHaveLength(2);
    });
  });
});
