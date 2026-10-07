import { useMemo } from 'react';
import { Linha } from '../types';
import { agruparPorProjetoEFilial } from '../derive';
import { brl } from '../format';

interface Props {
  linhas: Linha[];
}

// Aproximação calibrada para a coluna Histórico no layout de impressão (fonte
// 7pt, coluna ~52% da largura útil da página em A4 — o restante foi cedido
// para a coluna Agente não truncar). Acima disso o texto não cabe em uma
// única linha e é truncado com nota de rodapé numerada (tooltip não é viável
// no PDF impresso/gerado pelo navegador). Agente e Valor nunca são truncados:
// Agente quebra em múltiplas linhas se necessário, Valor sempre é exibido por
// completo (ver .rel-col-agente/.rel-col-valor em print.css).
const HISTORICO_MAX_CHARS = 80;

function truncarHistorico(texto: string): { exibido: string; truncado: boolean } {
  if (texto.length <= HISTORICO_MAX_CHARS) return { exibido: texto, truncado: false };
  return { exibido: `${texto.slice(0, HISTORICO_MAX_CHARS - 1).trimEnd()}…`, truncado: true };
}

// Impressão do Detalhamento agrupado por Projeto e, dentro dele, por Filial —
// cada projeto ganha um título com o seu total; abaixo, cada filial com
// lançamentos naquele projeto ganha seu próprio título (com o total da filial
// no projeto ao lado) + tabela (Data | Agente | Histórico | Valor), nessa
// ordem fixa. Histórico truncado vira nota de rodapé numerada, reiniciada a
// cada filial. Depois do último projeto vem a linha "Total Geral", com a soma
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
          {projeto.filiais.map((grupo) => {
            const notas: string[] = [];
            return (
              <div key={grupo.filial} className="rel-filial-grupo">
                <div className="rel-filial-heading-row">
                  <h4 className="rel-filial-heading">{grupo.nomeFilial}</h4>
                  <span className="rel-filial-heading-valor">{brl(grupo.total)}</span>
                </div>
                <table className="rel-tabela-filial">
                  <colgroup>
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '28%' }} />
                    <col />
                    <col style={{ width: '12%' }} />
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
                    {grupo.linhas.map((l, i) => {
                      const { exibido, truncado } = truncarHistorico(l.historico);
                      let notaNumero: number | null = null;
                      if (truncado) {
                        notas.push(l.historico);
                        notaNumero = notas.length;
                      }
                      return (
                        <tr key={`${l.dataIso}-${i}`} className="rel-linha-tabela">
                          <td className="rel-col-data">{l.data}</td>
                          <td className="rel-col-agente">{l.agente}</td>
                          <td className="rel-col-historico">
                            {exibido}
                            {notaNumero != null && <sup>{notaNumero}</sup>}
                          </td>
                          <td className="rel-col-valor">{brl(l.valor)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {notas.length > 0 && (
                  <ol className="rel-notas-rodape">
                    {notas.map((texto, i) => (
                      <li key={i}>{texto}</li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
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
