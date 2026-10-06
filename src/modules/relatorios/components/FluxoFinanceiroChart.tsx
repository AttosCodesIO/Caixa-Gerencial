import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SeriePonto } from '../types';
import { brl, axisCompact } from '../format';

interface Props {
  serie: SeriePonto[];
  visivel: boolean;
  onToggle: () => void;
}

// Fluxo Financeiro (spec 3.6) — somente tela: barras = valor do dia (eixo
// esquerdo), linha = acumulado (eixo direito), escalas independentes de
// propósito (3.6.3). A responsividade real (P4/3.6.2) é delegada ao
// ResponsiveContainer do recharts, que mede o container via ResizeObserver;
// por isso o gráfico só é montado quando `visivel` é true. Esse componente
// nunca aparece na impressão (ver FluxoFinanceiroChartImpressao, que usa
// dimensões fixas em vez de medição em runtime, incompatível com impressão).
export default function FluxoFinanceiroChart({ serie, visivel, onToggle }: Props) {
  const mostrarConteudo = visivel;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 rel-chart-card rel-print-hide">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-neutral-900">Fluxo Financeiro</h3>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={visivel}
        aria-controls="rel-fluxo-financeiro-container"
        className="rel-print-hide flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors mb-4"
      >
        {visivel ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {visivel ? 'Ocultar gráfico' : 'Exibir gráfico'}
      </button>

      <div id="rel-fluxo-financeiro-container">
        {mostrarConteudo &&
          (serie.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-neutral-500 text-sm">
              Nenhum lançamento no período.
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serie} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="relBarraGradiente" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4338ca" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" stroke="#e5e5e5" />
                  <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: '#737373' }} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#737373' }}
                    tickFormatter={(v: number) => axisCompact(v)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#737373' }}
                    tickFormatter={(v: number) => axisCompact(v)}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      brl(value),
                      name === 'valor' ? 'Dia' : 'Acum.',
                    ]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend
                    formatter={(value: string) => (value === 'valor' ? 'Valor do dia' : 'Acumulado')}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="valor"
                    name="valor"
                    fill="url(#relBarraGradiente)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Line
                    yAxisId="right"
                    type="linear"
                    dataKey="acumulado"
                    name="acumulado"
                    stroke="#059669"
                    strokeWidth={2.4}
                    dot={{ r: 3, fill: '#059669' }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ))}
      </div>
    </div>
  );
}
