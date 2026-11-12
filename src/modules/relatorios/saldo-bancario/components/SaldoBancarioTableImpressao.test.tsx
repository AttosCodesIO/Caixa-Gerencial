import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SaldoBancarioTableImpressao from './SaldoBancarioTableImpressao';
import { LinhaSaldoBancario } from '../types';
import { brl } from '../../format';

const criarLinha = (overrides: Partial<LinhaSaldoBancario>): LinhaSaldoBancario => ({
  agente: 868,
  banco: 'ATTOS - BRADESCO - C/C',
  saldoExtrato: 42823.73,
  docGerados: 0,
  docAgendado: 127.5,
  debitos: 270000,
  creditos: 0,
  saldoReal: -227303.77,
  ...overrides,
});

describe('SaldoBancarioTableImpressao', () => {
  it('fecha a tabela com uma única linha Total Geral somando cada coluna de valor', () => {
    const linhas = [
      criarLinha({}),
      criarLinha({
        agente: 1149,
        banco: 'ATTOS - CAIXA INTERNO',
        saldoExtrato: 167.93,
        docGerados: 10,
        docAgendado: 0,
        debitos: 0,
        creditos: 5,
        saldoReal: 167.93,
      }),
    ];
    const { container } = render(<SaldoBancarioTableImpressao linhas={linhas} />);

    const totais = container.querySelectorAll('tr.rel-saldo-total-geral');
    expect(totais).toHaveLength(1);
    expect(container.querySelector('thead')?.textContent).not.toContain('Total Geral');

    // A linha de total é a última da tabela.
    const ultimaLinha = [...container.querySelectorAll('tr')].at(-1);
    expect(ultimaLinha).toBe(totais[0]);

    const celulas = [...totais[0].querySelectorAll('td')].map((td) => td.textContent);
    expect(celulas).toEqual([
      'Total Geral',
      brl(42823.73 + 167.93),
      brl(10),
      brl(127.5),
      brl(270000),
      brl(5),
      brl(-227303.77 + 167.93),
    ]);
  });

  it('pinta de vermelho o Saldo Real total quando negativo', () => {
    const { container } = render(<SaldoBancarioTableImpressao linhas={[criarLinha({})]} />);
    const saldoRealTotal = container.querySelector('tr.rel-saldo-total-geral td:last-child') as HTMLElement;
    expect(saldoRealTotal.style.color).toBe('rgb(220, 38, 38)');
  });

  it('não imprime linha de total sem contas', () => {
    const { container } = render(<SaldoBancarioTableImpressao linhas={[]} />);
    expect(container.querySelector('tr.rel-saldo-total-geral')).toBeNull();
  });
});
