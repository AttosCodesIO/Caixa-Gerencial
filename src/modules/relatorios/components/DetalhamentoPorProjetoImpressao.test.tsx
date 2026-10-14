import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DetalhamentoPorProjetoImpressao from './DetalhamentoPorProjetoImpressao';
import { Linha } from '../types';

const criarLinha = (overrides: Partial<Linha>): Linha => ({
  data: '09/10/2026',
  dataIso: '2026-10-09',
  agente: 'FORNECEDOR ALFA',
  historico: 'PAGAMENTO VALE TRANSPORTE',
  valor: 677.6,
  categoria: '10 - PROJETO A',
  projetoCodigo: 10,
  filial: 1,
  nomeFilial: 'FILIAL EXEMPLO',
  ...overrides,
});

const HISTORICO_LONGO =
  'Prestação de serviços de instalações da infra para os ar condicionados e escadas pressurizadas 5ª medição';

describe('DetalhamentoPorProjetoImpressao', () => {
  it('imprime o histórico longo inteiro dentro da própria linha, sem cortar', () => {
    const { container } = render(
      <DetalhamentoPorProjetoImpressao linhas={[criarLinha({ historico: HISTORICO_LONGO })]} />,
    );

    const celulas = container.querySelectorAll('tbody td.rel-col-historico');
    expect(celulas).toHaveLength(1);
    expect(celulas[0].textContent).toBe(HISTORICO_LONGO);
    expect(container.textContent).not.toContain('…');
  });

  // Regressão: o histórico completo era repetido numa lista abaixo da tabela
  // da filial, que aparecia no PDF solta, sem vínculo visível com o registro.
  it('não imprime nenhum texto fora das linhas da tabela, títulos e total', () => {
    const linhas = [
      criarLinha({ historico: HISTORICO_LONGO }),
      criarLinha({
        historico: `Ref.: retenção do nfs 94 ${'x'.repeat(100)}`,
        agente: 'CONSTRUTORA BETA',
      }),
      criarLinha({
        filial: 2,
        nomeFilial: 'OUTRA FILIAL',
        categoria: '20 - PROJETO B',
        projetoCodigo: 20,
      }),
    ];
    const { container } = render(<DetalhamentoPorProjetoImpressao linhas={linhas} />);

    expect(container.querySelector('ol, ul, sup')).toBeNull();
    container.querySelectorAll('.rel-filial-grupo').forEach((grupo) => {
      const filhos = Array.from(grupo.children).map((el) => el.className);
      expect(filhos).toEqual(['rel-filial-heading-row', 'rel-tabela-filial']);
    });
    expect(container.querySelectorAll('tbody tr')).toHaveLength(linhas.length);
    linhas.forEach((l) => {
      const ocorrencias = container.textContent!.split(l.historico).length - 1;
      expect(ocorrencias).toBe(1);
    });
  });
});
