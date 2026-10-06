import { useMemo } from 'react';
import { LinhaSaldoBancario } from '../types';
import { brl } from '../../format';

interface Props {
  linhas: LinhaSaldoBancario[];
}

export default function SaldoBancarioTableImpressao({ linhas }: Props) {
  const linhasOrdenadas = useMemo(
    () => [...linhas].sort((a, b) => a.banco.localeCompare(b.banco, 'pt-BR')),
    [linhas],
  );

  return (
    <table className="rel-tabela-saldo">
      <colgroup>
        <col style={{ width: '10%' }} />
        <col style={{ width: '22%' }} />
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
            <td>{l.banco}</td>
            <td className="rel-col-valor">{brl(l.saldoExtrato)}</td>
            <td className="rel-col-valor">{brl(l.docGerados)}</td>
            <td className="rel-col-valor">{brl(l.docAgendado)}</td>
            <td className="rel-col-valor">{brl(l.debitos)}</td>
            <td className="rel-col-valor">{brl(l.creditos)}</td>
            <td className="rel-col-valor">{brl(l.saldoReal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
