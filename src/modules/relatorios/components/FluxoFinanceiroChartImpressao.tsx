import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { SeriePonto } from '../types';
import { axisCompact } from '../format';

interface Props {
  serie: SeriePonto[];
}

const LARGURA = 480;
const ALTURA = 170;

// Versão de impressão do Fluxo Financeiro. A versão de tela usa
// <ResponsiveContainer>, que mede o container via ResizeObserver — essa
// medição é assíncrona e não tem garantia de terminar antes do navegador
// capturar a página para impressão/PDF, o que fazia o gráfico sair em branco.
// Aqui o SVG usa largura/altura fixas, calculadas em tempo de render (sem
// depender de nenhuma medição de layout), por isso é seguro mantê-lo sempre
// montado (mesmo oculto via CSS) e ele aparece corretamente ao imprimir.
export default function FluxoFinanceiroChartImpressao({ serie }: Props) {
  if (serie.length === 0) {
    return <p className="rel-chart-vazio">Nenhum lançamento no período.</p>;
  }

  return (
    <ComposedChart
      width={LARGURA}
      height={ALTURA}
      data={serie}
      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
    >
      <defs>
        <linearGradient id="relBarraGradienteImpressao" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 4" stroke="#e5e5e5" />
      <XAxis dataKey="rotulo" tick={{ fontSize: 8, fill: '#737373' }} />
      <YAxis
        yAxisId="left"
        tick={{ fontSize: 8, fill: '#737373' }}
        tickFormatter={(v: number) => axisCompact(v)}
        width={36}
      />
      <YAxis
        yAxisId="right"
        orientation="right"
        tick={{ fontSize: 8, fill: '#737373' }}
        tickFormatter={(v: number) => axisCompact(v)}
        width={36}
      />
      <Legend
        wrapperStyle={{ fontSize: '8pt' }}
        formatter={(value: string) => (value === 'valor' ? 'Valor do dia' : 'Acumulado')}
      />
      <Bar
        yAxisId="left"
        dataKey="valor"
        name="valor"
        fill="url(#relBarraGradienteImpressao)"
        radius={[3, 3, 0, 0]}
        maxBarSize={26}
      />
      <Line
        yAxisId="right"
        type="linear"
        dataKey="acumulado"
        name="acumulado"
        stroke="#059669"
        strokeWidth={2}
        dot={{ r: 2.5, fill: '#059669' }}
      />
    </ComposedChart>
  );
}
