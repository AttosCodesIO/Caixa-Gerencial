import { useState } from 'react';
import { CalculationEntry } from '../types';
import { formatCurrency } from '../utils/finance';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface DashboardSummaryProps {
  data: CalculationEntry[];
}

const MESES = [
  { value: 'all', label: 'Todos os meses' },
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const DEPTH = 6;

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const Bar3DShapeOriginal = ({ x = 0, y = 0, width = 0, height = 0 }: BarShapeProps) => {
  if (!height || height <= 0) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#3b82f6" />
      <polygon
        points={`${x},${y} ${x + DEPTH},${y - DEPTH} ${x + width + DEPTH},${y - DEPTH} ${x + width},${y}`}
        fill="#93c5fd"
      />
      <polygon
        points={`${x + width},${y} ${x + width + DEPTH},${y - DEPTH} ${x + width + DEPTH},${y + height - DEPTH} ${x + width},${y + height}`}
        fill="#1d4ed8"
      />
    </g>
  );
};

const Bar3DShapeCorrigido = ({ x = 0, y = 0, width = 0, height = 0 }: BarShapeProps) => {
  if (!height || height <= 0) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#10b981" />
      <polygon
        points={`${x},${y} ${x + DEPTH},${y - DEPTH} ${x + width + DEPTH},${y - DEPTH} ${x + width},${y}`}
        fill="#6ee7b7"
      />
      <polygon
        points={`${x + width},${y} ${x + width + DEPTH},${y - DEPTH} ${x + width + DEPTH},${y + height - DEPTH} ${x + width},${y + height}`}
        fill="#065f46"
      />
    </g>
  );
};

export function DashboardSummary({ data }: DashboardSummaryProps) {
  const [mesSelecionado, setMesSelecionado] = useState('all');

  const totalOriginal = data.reduce((acc, curr) => acc + curr.originalValue, 0);
  const totalCorrected = data.reduce((acc, curr) => acc + (curr.correctedValue || 0), 0);
  const totalInterest = data.reduce((acc, curr) => acc + (curr.interestValue || 0), 0);

  const dadosFiltrados =
    mesSelecionado === 'all'
      ? data
      : data.filter((e) => e.endDate.split('-')[1] === mesSelecionado);

  const porAno = dadosFiltrados.reduce(
    (acc, e) => {
      const ano = e.endDate.split('-')[0];
      if (!acc[ano]) acc[ano] = { ano, Original: 0, Corrigido: 0 };
      acc[ano].Original += e.originalValue;
      acc[ano].Corrigido += e.correctedValue || 0;
      return acc;
    },
    {} as Record<string, { ano: string; Original: number; Corrigido: number }>,
  );

  const chartData = Object.values(porAno).sort((a, b) => a.ano.localeCompare(b.ano));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Valor Original Total</p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                {formatCurrency(totalOriginal)}
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Valor Corrigido Total</p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                {formatCurrency(totalCorrected)}
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Juros Totais</p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                {formatCurrency(totalInterest)}
              </h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {data.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className="text-lg font-bold text-neutral-900">Evolução dos Valores por Ano</h3>
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-600 outline-none"
            >
              {MESES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 24, bottom: 5, left: 0 }}
                barCategoryGap="30%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis
                  dataKey="ano"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#737373', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#737373', fontSize: 12 }}
                  tickFormatter={(value) =>
                    value >= 1000 ? `R$${(value / 1000).toFixed(0)}k` : `R$${value}`
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
                  formatter={(value) => (
                    <span style={{ color: '#374151' }}>{value}</span>
                  )}
                />
                <Bar dataKey="Original" name="Original" shape={<Bar3DShapeOriginal />} />
                <Bar dataKey="Corrigido" name="Corrigido" shape={<Bar3DShapeCorrigido />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}