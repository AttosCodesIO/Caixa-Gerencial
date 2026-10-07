import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Printer, Wallet, Hash, Calculator } from 'lucide-react';
import './print.css';
import { RelatorioExecutivoPayload, SESSION_STORAGE_KEY } from './types';
import { calcularCategoriasAgregadas, calcularSerieDiaria } from './derive';
import { brl } from './format';
import FluxoFinanceiroChart from './components/FluxoFinanceiroChart';
import FluxoFinanceiroChartImpressao from './components/FluxoFinanceiroChartImpressao';
import ProjetoBreakdown from './components/ProjetoBreakdown';
import DetalhamentoTable from './components/DetalhamentoTable';
import DetalhamentoPorProjetoImpressao from './components/DetalhamentoPorProjetoImpressao';

function lerPayload(): RelatorioExecutivoPayload | null {
  try {
    const bruto = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!bruto) return null;
    const raw = JSON.parse(bruto) as RelatorioExecutivoPayload;
    if (!raw || !Array.isArray(raw.linhas) || raw.linhas.length === 0) return null;
    // Relatório gerado antes de a API devolver projetoCodigo (aba antiga ainda
    // aberta): o código é o prefixo numérico de "código - descrição".
    const linhas = raw.linhas.map((l) =>
      typeof l.projetoCodigo === 'number'
        ? l
        : { ...l, projetoCodigo: Number.parseInt(l.categoria, 10) || 0 },
    );
    return { ...raw, linhas };
  } catch {
    return null;
  }
}

export default function RelatorioExecutivo() {
  const [raw] = useState<RelatorioExecutivoPayload | null>(() => lerPayload());
  const [chartVisivel, setChartVisivel] = useState(false);

  const linhas = useMemo(() => raw?.linhas ?? [], [raw]);

  const { total, quantidade, ticketMedio, periodo } = useMemo(() => {
    const total = linhas.reduce((sum, l) => sum + l.valor, 0);
    const quantidade = linhas.length;
    const ticketMedio = quantidade > 0 ? total / quantidade : 0;
    let periodo = '—';
    if (linhas.length > 0) {
      const datasIso = linhas.map((l) => l.dataIso).sort();
      const min = format(parseISO(datasIso[0]), 'dd/MM/yyyy');
      const max = format(parseISO(datasIso[datasIso.length - 1]), 'dd/MM/yyyy');
      periodo = `${min} – ${max}`;
    }
    return { total, quantidade, ticketMedio, periodo };
  }, [linhas]);

  const serie = useMemo(() => calcularSerieDiaria(linhas), [linhas]);
  const categorias = useMemo(() => calcularCategoriasAgregadas(linhas), [linhas]);

  const geradoEm = raw?.geradoEm ? parseISO(raw.geradoEm) : new Date();
  const geradoEmLabel = format(geradoEm, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const empresa = raw?.empresa || '—';
  const tituloComposto = `Relatório Executivo de Baixas${raw?.parametro ? ` - ${raw.parametro}` : ''}`;
  const backLink = '/relatorios';

  if (!raw) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <h1 className="text-xl font-bold text-neutral-900">Nenhum relatório carregado</h1>
        <p className="text-neutral-500">
          Gere um novo relatório na tela de parâmetros para visualizar os dados aqui.
        </p>
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Novos parâmetros
        </Link>
      </div>
    );
  }

  return (
    <div className="rel-report-page space-y-6">
      {/* Capa — somente impressão (3.4) */}
      <div className="rel-print-only rel-print-cover">
        <img src="/logoAttos.jpeg" alt="Attos" className="rel-cover-logo" />
        <h1 className="rel-cover-title">Despesas Financeiras Por Projeto</h1>
        <div className="rel-cover-divider" />
        <p className="rel-cover-sub">{empresa}</p>
        <p className="rel-cover-sub">Período: {periodo}</p>
        <p className="rel-cover-footer">Gerado em {geradoEmLabel} · Uso interno</p>
      </div>

      {/* Hero — somente tela */}
      <div className="rel-print-hide space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={backLink}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Novos parâmetros
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Printer className="w-5 h-5" /> Exportar
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{tituloComposto}</h1>
          <p className="text-neutral-500 mt-1">
            {empresa} · Período: {periodo}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-500">Valor Total Baixado</p>
              <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900 mt-4">{brl(total)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-500">Quantidade de Títulos</p>
              <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                <Hash className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900 mt-4">{quantidade}</p>
          </div>
          <div className="bg-neutral-900 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-400">Ticket Médio</p>
              <div className="p-2 bg-neutral-800 rounded-lg text-white">
                <Calculator className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-4">{brl(ticketMedio)}</p>
          </div>
        </div>
      </div>

      <div className="rel-body space-y-6">
        <div className="rel-charts-block space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 rel-print-hide">
            Comparativos por Período
          </h2>
          <FluxoFinanceiroChart
            serie={serie}
            visivel={chartVisivel}
            onToggle={() => setChartVisivel((v) => !v)}
          />
          <div className="rel-print-only rel-chart-card rel-fluxo-print-card bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h3 className="font-bold text-neutral-900 mb-4">Fluxo Financeiro</h3>
            <FluxoFinanceiroChartImpressao serie={serie} />
          </div>
          <ProjetoBreakdown categorias={categorias} />
        </div>

        <div className="rel-detalhamento-block rel-print-hide">
          <DetalhamentoTable linhas={linhas} />
        </div>

        <div className="rel-detalhamento-impressao-block rel-print-only">
          <DetalhamentoPorProjetoImpressao linhas={linhas} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-400 pt-2">
        <span>Gerado em {geradoEmLabel}</span>
      </div>
    </div>
  );
}
