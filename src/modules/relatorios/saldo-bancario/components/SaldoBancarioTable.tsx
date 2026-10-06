import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { LinhaSaldoBancario } from '../types';
import { brl } from '../../format';

type SortKey = 'agente' | 'banco' | 'saldoExtrato' | 'docGerados' | 'docAgendado' | 'debitos' | 'creditos' | 'saldoReal';
type SortDir = 'asc' | 'desc';

interface Props {
  linhas: LinhaSaldoBancario[];
}

const PAGE_SIZE = 15;

const COLUNAS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'agente', label: 'Código do Agente' },
  { key: 'banco', label: 'Banco' },
  { key: 'saldoExtrato', label: 'Saldo Extrato', align: 'right' },
  { key: 'docGerados', label: 'Doc. Gerados', align: 'right' },
  { key: 'docAgendado', label: 'Doc. Agendado', align: 'right' },
  { key: 'debitos', label: 'Débitos', align: 'right' },
  { key: 'creditos', label: 'Créditos', align: 'right' },
  { key: 'saldoReal', label: 'Saldo Real', align: 'right' },
];

export default function SaldoBancarioTable({ linhas }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('agente');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  const linhasOrdenadas = useMemo(() => {
    const copia = [...linhas];
    copia.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'banco') {
        cmp = a.banco.toLowerCase().localeCompare(b.banco.toLowerCase());
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copia;
  }, [linhas, sortKey, sortDir]);

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
      setSortDir(key === 'banco' || key === 'agente' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="p-6 pb-0">
        <h3 className="font-bold text-neutral-900">Contas Financeiras</h3>
      </div>

      <div className="overflow-x-auto p-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-sm">
              {COLUNAS.map((coluna) => (
                <th
                  key={coluna.key}
                  className={`p-3 font-medium whitespace-nowrap cursor-pointer select-none hover:text-neutral-800 ${
                    coluna.align === 'right' ? 'text-right' : ''
                  }`}
                  onClick={() => handleSort(coluna.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {coluna.label}
                    {sortKey === coluna.key &&
                      (sortDir === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {linhasPagina.length === 0 ? (
              <tr>
                <td colSpan={COLUNAS.length} className="p-8 text-center text-neutral-500">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            ) : (
              linhasPagina.map((l) => (
                <tr key={l.agente} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-3 text-neutral-700 font-semibold whitespace-nowrap">{l.agente}</td>
                  <td className="p-3 text-neutral-600">{l.banco}</td>
                  <td className="p-3 text-right text-neutral-700 whitespace-nowrap">{brl(l.saldoExtrato)}</td>
                  <td className="p-3 text-right text-neutral-700 whitespace-nowrap">{brl(l.docGerados)}</td>
                  <td className="p-3 text-right text-neutral-700 whitespace-nowrap">{brl(l.docAgendado)}</td>
                  <td className="p-3 text-right text-neutral-700 whitespace-nowrap">{brl(l.debitos)}</td>
                  <td className="p-3 text-right text-neutral-700 whitespace-nowrap">{brl(l.creditos)}</td>
                  <td className="p-3 text-right font-bold text-neutral-900 whitespace-nowrap">
                    {brl(l.saldoReal)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
