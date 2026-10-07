import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Linha } from '../types';
import { brl } from '../format';

type SortKey = 'dataIso' | 'agente' | 'valor';
type SortDir = 'asc' | 'desc';

interface Props {
  linhas: Linha[];
}

const PAGE_SIZE = 10;

const COLUNAS: { key: SortKey | 'historico'; label: string; ordenavel: boolean; align?: 'right' }[] = [
  { key: 'dataIso', label: 'Data', ordenavel: true },
  { key: 'agente', label: 'Agente', ordenavel: true },
  { key: 'historico', label: 'Histórico', ordenavel: false },
  { key: 'valor', label: 'Valor', ordenavel: true, align: 'right' },
];

const FILTRO_INPUT =
  'form-control text-xs font-normal border border-neutral-300 rounded px-2 py-1 outline-none focus:border-neutral-400';

// Tabela de Detalhamento (spec 3.8/3.9/3.10/3.11) — somente tela: ordenação
// por Data/Agente/Valor (Histórico não é ordenável), paginação de 10, e lista
// de cards abaixo de 640px com os mesmos 4 campos da tabela. A impressão usa
// DetalhamentoPorFilialImpressao (agrupado por filial), não este componente.
// Os filtros de coluna seguem o mesmo padrão (visual e regras) da tela de
// Lançamentos (useTransactions) e atuam só sobre esta tabela.
export default function DetalhamentoTable({ linhas }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('dataIso');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  const [filterDay, setFilterDay] = useState('');
  const [filterAgente, setFilterAgente] = useState('');
  const [filterHistorico, setFilterHistorico] = useState('');
  const [filterAmount, setFilterAmount] = useState('');

  const linhasFiltradas = useMemo(
    () =>
      linhas.filter((l) => {
        let match = true;
        if (filterDay && filterDay !== l.dataIso.split('-')[2]) match = false;
        if (filterAgente && !l.agente.toLowerCase().includes(filterAgente.toLowerCase()))
          match = false;
        if (filterHistorico && !l.historico.toLowerCase().includes(filterHistorico.toLowerCase()))
          match = false;
        if (filterAmount) {
          const amountStr = Math.abs(l.valor).toString();
          const formattedAmount = brl(Math.abs(l.valor)).replace(/[R$\s]/g, '');
          if (!amountStr.includes(filterAmount) && !formattedAmount.includes(filterAmount))
            match = false;
        }
        return match;
      }),
    [linhas, filterDay, filterAgente, filterHistorico, filterAmount],
  );

  const filtroAtivo = Boolean(filterDay || filterAgente || filterHistorico || filterAmount);
  const mensagemVazio = filtroAtivo
    ? 'Nenhum lançamento encontrado para os filtros aplicados.'
    : 'Nenhum lançamento.';

  const clearFilters = () => {
    setFilterDay('');
    setFilterAgente('');
    setFilterHistorico('');
    setFilterAmount('');
  };

  useEffect(() => {
    setPage(1);
  }, [filterDay, filterAgente, filterHistorico, filterAmount]);

  const linhasOrdenadas = useMemo(() => {
    const copia = [...linhasFiltradas];
    copia.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'valor') {
        cmp = a.valor - b.valor;
      } else {
        cmp = a[sortKey].toLowerCase().localeCompare(b[sortKey].toLowerCase());
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copia;
  }, [linhasFiltradas, sortKey, sortDir]);

  const totalPaginas = Math.max(1, Math.ceil(linhasOrdenadas.length / PAGE_SIZE));
  const paginaAtual = Math.min(Math.max(1, page), totalPaginas);

  useEffect(() => {
    if (page !== paginaAtual) setPage(paginaAtual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPaginas]);

  const linhasPagina = linhasOrdenadas.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'valor' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="p-6 pb-0">
        <h3 className="font-bold text-neutral-900">Detalhamento de Registros</h3>
      </div>

      {/* Tabela — >= 640px */}
      <div className="hidden sm:block overflow-x-auto p-6">
        <table className="w-full text-left border-collapse">
          <colgroup>
            <col style={{ width: '8%' }} />
            <col style={{ width: '22%' }} />
            <col />
            <col style={{ width: '10%' }} />
            <col style={{ width: '7%' }} />
          </colgroup>
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-sm">
              {COLUNAS.map((coluna) => (
                <th
                  key={coluna.key}
                  className={`p-3 font-medium ${coluna.align === 'right' ? 'text-right' : ''} ${
                    coluna.ordenavel ? 'cursor-pointer select-none hover:text-neutral-800' : ''
                  }`}
                  onClick={coluna.ordenavel ? () => handleSort(coluna.key as SortKey) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {coluna.label}
                    {coluna.ordenavel &&
                      sortKey === coluna.key &&
                      (sortDir === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ))}
                  </span>
                </th>
              ))}
              <th className="p-3 font-medium" />
            </tr>
            {/* Filtros Dinâmicos — mesmo padrão da tela de Lançamentos */}
            <tr className="bg-white border-b border-neutral-200 text-sm">
              <th className="p-2">
                <input
                  type="text"
                  className={`${FILTRO_INPUT} w-16 text-center`}
                  placeholder="Dia..."
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                />
              </th>
              <th className="p-2">
                <input
                  type="text"
                  className={`${FILTRO_INPUT} w-full`}
                  placeholder="Filtrar agente..."
                  value={filterAgente}
                  onChange={(e) => setFilterAgente(e.target.value)}
                />
              </th>
              <th className="p-2">
                <input
                  type="text"
                  className={`${FILTRO_INPUT} w-full`}
                  placeholder="Filtrar histórico..."
                  value={filterHistorico}
                  onChange={(e) => setFilterHistorico(e.target.value)}
                />
              </th>
              <th className="p-2">
                <div className="flex justify-end">
                  <input
                    type="text"
                    className={`${FILTRO_INPUT} w-20 text-right`}
                    placeholder="Valor..."
                    value={filterAmount}
                    onChange={(e) => setFilterAmount(e.target.value)}
                  />
                </div>
              </th>
              <th className="p-2 text-right">
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium underline px-2 py-1"
                  title="Limpar Filtros"
                >
                  Limpar
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {linhasPagina.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">
                  {mensagemVazio}
                </td>
              </tr>
            ) : (
              linhasPagina.map((l, i) => (
                <tr key={`${l.dataIso}-${i}`} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-3 text-neutral-600 whitespace-nowrap">{l.data}</td>
                  <td className="p-3 text-neutral-700 font-semibold">{l.agente}</td>
                  <td className="p-3 text-neutral-600">{l.historico}</td>
                  <td className="p-3 text-right font-bold text-neutral-900 whitespace-nowrap">
                    {brl(l.valor)}
                  </td>
                  <td className="p-3" />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lista de cards — < 640px */}
      <div className="sm:hidden divide-y divide-neutral-100 px-4">
        {linhasPagina.length === 0 ? (
          <p className="p-8 text-center text-neutral-500">{mensagemVazio}</p>
        ) : (
          linhasPagina.map((l, i) => (
            <div key={`${l.dataIso}-${i}`} className="py-3 space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-neutral-800">{l.agente}</span>
                <span className="font-bold text-neutral-900">{brl(l.valor)}</span>
              </div>
              <p className="text-sm text-neutral-600">{l.historico}</p>
              <p className="text-xs text-neutral-400">{l.data}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between p-4 border-t border-neutral-100 text-sm">
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={paginaAtual <= 1}
          aria-label="Página anterior"
          className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-neutral-500">
          Página {paginaAtual} de {totalPaginas}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={paginaAtual >= totalPaginas}
          aria-label="Próxima página"
          className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
