import { useMemo } from 'react';
import { Linha } from '../types';
import { agruparPorProjetoEFilial } from '../derive';
import { brl } from '../format';

interface Props {
  linhas: Linha[];
}

// Impressão do Detalhamento agrupado por Projeto e, dentro dele, por Filial —
// cada projeto ganha um título com o seu total; abaixo, cada filial com
// lançamentos naquele projeto ganha seu próprio título (com o total da filial
// no projeto ao lado) + tabela (Data | Agente | Histórico | Valor), nessa
// ordem fixa. O Histórico ocupa uma linha só: o que não cabe na coluna é
// cortado com reticências pelo CSS (.rel-col-historico em print.css), para
// não esticar o relatório. Nada do registro é impresso fora da linha a que
// pertence (a antiga lista de notas de rodapé com o histórico completo,
// abaixo da tabela, aparecia solta no PDF e foi removida). Depois do último projeto vem a linha "Total Geral", com a soma
// de todos os projetos.
export default function DetalhamentoPorProjetoImpressao({ linhas }: Props) {
  const projetos = useMemo(() => agruparPorProjetoEFilial(linhas), [linhas]);
  const totalGeral = useMemo(() => linhas.reduce((soma, l) => soma + l.valor, 0), [linhas]);

  return (
    <div className="rel-detalhamento-impressao">
      {projetos.map((projeto) => (
        <div key={projeto.categoria} className="rel-projeto-grupo">
          <div className="rel-projeto-heading-row">
            <h3 className="rel-projeto-heading">{projeto.categoria}</h3>
            <span className="rel-projeto-heading-valor">{brl(projeto.total)}</span>
          </div>
          {projeto.filiais.map((grupo) => (
            <div key={grupo.filial} className="rel-filial-grupo">
              <div className="rel-filial-heading-row">
                <h4 className="rel-filial-heading">{grupo.nomeFilial}</h4>
                <span className="rel-filial-heading-valor">{brl(grupo.total)}</span>
              </div>
              <table className="rel-tabela-filial">
                <colgroup>
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '27%' }} />
                  <col />
                  <col style={{ width: '13%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Agente</th>
                    <th>Histórico</th>
                    <th className="rel-col-valor-head">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.linhas.map((l, i) => (
                    <tr key={`${l.dataIso}-${i}`} className="rel-linha-tabela">
                      <td className="rel-col-data">{l.data}</td>
                      <td className="rel-col-agente">{l.agente}</td>
                      <td className="rel-col-historico">{l.historico}</td>
                      <td className="rel-col-valor">{brl(l.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
      {projetos.length > 0 && (
        <div className="rel-total-geral-row">
          <span className="rel-total-geral">Total Geral</span>
          <span className="rel-total-geral-valor">{brl(totalGeral)}</span>
        </div>
      )}
    </div>
  );
}
