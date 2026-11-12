import { useMemo } from 'react';
import { LinhaSaldoBancario } from '../types';
import { brl } from '../../format';

interface Props {
  linhas: LinhaSaldoBancario[];
}

type ColunaValor = 'saldoExtrato' | 'docGerados' | 'docAgendado' | 'debitos' | 'creditos' | 'saldoReal';

const COLUNAS_VALOR: ColunaValor[] = ['saldoExtrato', 'docGerados', 'docAgendado', 'debitos', 'creditos', 'saldoReal'];

const COR_NEGATIVO = { color: '#dc2626' };

// Nenhuma célula quebra linha (print.css): valores em fonte menor e
// alinhados à direita; o Banco que não couber na coluna é cortado com "…".
// Depois da última conta vem a linha "Total Geral", com a soma de cada
// coluna de valor — impressa uma única vez, no fim da tabela.
export default function SaldoBancarioTableImpressao({ linhas }: Props) {
  const linhasOrdenadas = useMemo(
    () => [...linhas].sort((a, b) => a.banco.localeCompare(b.banco, 'pt-BR')),
    [linhas],
  );

  const totais = useMemo(() => {
    const soma = Object.fromEntries(COLUNAS_VALOR.map((c) => [c, 0])) as Record<ColunaValor, number>;
    for (const l of linhas) {
      for (const c of COLUNAS_VALOR) soma[c] += l[c];
    }
    return soma;
  }, [linhas]);

  return (
    <table className="rel-tabela-saldo">
      <colgroup>
        <col style={{ width: '6%' }} />
        <col style={{ width: '31%' }} />
        <col />
        <col />
        <col />
        <col />
        <col />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th>Agente</th>
          <th>Banco</th>
          <th className="rel-col-valor-head">Saldo Extrato</th>
          <th className="rel-col-valor-head">Doc. Gerados</th>
          <th className="rel-col-valor-head">Doc. Agendado</th>
          <th className="rel-col-valor-head">Débitos</th>
          <th className="rel-col-valor-head">Créditos</th>
          <th className="rel-col-valor-head">Saldo Real</th>
        </tr>
      </thead>
      <tbody>
        {linhasOrdenadas.map((l) => (
          <tr key={l.agente} className="rel-linha-tabela">
            <td>{l.agente}</td>
            <td className="rel-col-banco">{l.banco}</td>
            <td className="rel-col-valor">{brl(l.saldoExtrato)}</td>
            <td className="rel-col-valor">{brl(l.docGerados)}</td>
            <td className="rel-col-valor">{brl(l.docAgendado)}</td>
            <td className="rel-col-valor">{brl(l.debitos)}</td>
            <td className="rel-col-valor">{brl(l.creditos)}</td>
            <td
              className="rel-col-valor"
              style={l.saldoReal < 0 ? COR_NEGATIVO : undefined}
            >
              {brl(l.saldoReal)}
            </td>
          </tr>
        ))}
      </tbody>
      {linhas.length > 0 && (
        <tbody>
          <tr className="rel-linha-tabela rel-saldo-total-geral">
            <td colSpan={2}>Total Geral</td>
            {COLUNAS_VALOR.map((c) => (
              <td
                key={c}
                className="rel-col-valor"
                style={c === 'saldoReal' && totais.saldoReal < 0 ? COR_NEGATIVO : undefined}
              >
                {brl(totais[c])}
              </td>
            ))}
          </tr>
        </tbody>
      )}
    </table>
  );
}
