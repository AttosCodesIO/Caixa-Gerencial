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
  categoria: 'PROJETO A',
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
// (< 640px) ficam ambas no DOM; as contagens olham só as linhas da tabela.
const linhasDaTabela = (container: HTMLElement) => container.querySelectorAll('tbody tr');

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
});
