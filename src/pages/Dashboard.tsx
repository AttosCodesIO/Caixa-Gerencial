import { useState, useEffect, useMemo } from 'react';
import { format, subMonths, addMonths, subYears, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  X,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { getProjects, getClassifications, getBalance, getBalanceSeries, getTransactions } from '../lib/api';
import { Project, Classification, DateFilterState, Transaction } from '../types';
import { resolveDateRange } from '../utils/dateFilter';

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [data, setData] = useState<{
    initialBalance: number;
    income: number;
    expense: number;
    finalBalance: number;
    expensesByProject: Record<string, number>;
    expensesByClassification: Record<string, number>;
  } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [balanceSeries, setBalanceSeries] = useState<
    { label: string; income: number; expense: number; saldo: number }[]
  >([]);
  const [drillDown, setDrillDown] = useState<{
    type: 'project' | 'classification';
    name: string;
    loading: boolean;
    transactions: Transaction[];
  } | null>(null);

  const dateRange = useMemo(
    () =>
      resolveDateRange({
        mode: 'mes',
        monthDate: currentDate,
        monthViewMode: viewMode,
        selectedDay: '',
        periodStart: '',
        periodEnd: '',
        activePreset: null,
      } as DateFilterState),
    [currentDate, viewMode],
  );

  useEffect(() => {
    getProjects().then(setProjects);
    getClassifications().then(setClassifications);
  }, []);

  useEffect(() => {
    getBalance(dateRange).then(setData);
    getBalanceSeries(dateRange, viewMode === 'month' ? 'day' : 'month').then(setBalanceSeries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.dataInicio, dateRange.dataFim, viewMode]);

  const handleSliceClick = async (type: 'project' | 'classification', id: number, name: string) => {
    setDrillDown({ type, name, loading: true, transactions: [] });
    const all = await getTransactions(dateRange);
    const filtered = (all as Transaction[]).filter((t) =>
      type === 'project' ? t.project_id === id : t.classification_id === id,
    );
    setDrillDown({ type, name, loading: false, transactions: filtered });
  };

  const handlePrev = () => {
    setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subYears(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addYears(currentDate, 1));
  };

  if (!data) return <div className="p-8 text-center text-neutral-500">Carregando...</div>;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Paleta de cores vibrantes com alto contraste para melhorar acessibilidade
  const COLORS = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
  ];
  const COLORS_ALT = [
    '#8b5cf6',
    '#f59e0b',
    '#06b6d4',
    '#ec4899',
    '#10b981',
    '#ef4444',
    '#3b82f6',
    '#f97316',
  ];

  const projectChartData = Object.entries(
    data.expensesByProject || ({} as Record<string, number>),
  ).map(
    ([projectId, amount]: [string, number], index) => {
      const project = projects.find((p) => p.id === Number(projectId));
      return {
        id: Number(projectId),
        name: project ? project.name : 'Sem Projeto',
        value: amount,
        color: COLORS[index % COLORS.length],
      };
    },
  );

  const classificationChartData = Object.entries(
    data.expensesByClassification || ({} as Record<string, number>),
  ).map(
    ([classId, amount]: [string, number], index) => {
      const classification = classifications.find((c) => c.id === Number(classId));
      return {
        id: Number(classId),
        name: classification ? classification.name : 'Sem Classificação',
        value: amount,
        color: COLORS_ALT[index % COLORS_ALT.length],
      };
    },
  );

  const projectTotal = projectChartData.reduce((sum, d) => sum + d.value, 0);
  const classificationTotal = classificationChartData.reduce((sum, d) => sum + d.value, 0);
  const formatPercent = (value: number, total: number) =>
    total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard Gerencial</h1>
          <p className="text-neutral-500">Visão geral do caixa em espécie</p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-neutral-200">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'month' | 'year')}
            className="bg-transparent border-none text-sm font-medium text-neutral-600 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="month">Mensal</option>
            <option value="year">Anual</option>
          </select>
          <div className="w-px h-4 bg-neutral-200 mx-1"></div>
          <button
            onClick={handlePrev}
            className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-neutral-700 min-w-[120px] text-center capitalize">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy', { locale: ptBR })
              : format(currentDate, 'yyyy')}
          </span>
          <button
            onClick={handleNext}
            className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-500">Saldo Inicial</p>
            <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mt-4">
            {formatCurrency(data.initialBalance)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-500">Entradas</p>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-4">{formatCurrency(data.income)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-500">Saídas</p>
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-4">{formatCurrency(data.expense)}</p>
        </div>

        <div className="bg-neutral-900 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-400">Saldo Atual</p>
            <div className="p-2 bg-neutral-800 rounded-lg text-white">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-4">{formatCurrency(data.finalBalance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900 mb-6">Despesas por Projeto</h2>
          {projectChartData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    onClick={(entry) => {
                      const d = entry as unknown as { id: number; name: string };
                      handleSliceClick('project', d.id, d.name);
                    }}
                    cursor="pointer"
                  >
                    {projectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `${formatCurrency(value)} (${formatPercent(value, projectTotal)})`,
                      'Valor',
                    ]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-500">
              Nenhuma despesa registrada neste período.
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900 mb-6">Despesas por Classificação</h2>
          {classificationChartData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classificationChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    onClick={(entry) => {
                      const d = entry as unknown as { id: number; name: string };
                      handleSliceClick('classification', d.id, d.name);
                    }}
                    cursor="pointer"
                  >
                    {classificationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `${formatCurrency(value)} (${formatPercent(value, classificationTotal)})`,
                      'Valor',
                    ]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-500">
              Nenhuma despesa registrada neste período.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
        <h2 className="text-lg font-bold text-neutral-900 mb-6">Saldo (Receitas - Despesas)</h2>
        {balanceSeries.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceSeries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#737373' }}
                  tickFormatter={(label: string) =>
                    viewMode === 'month'
                      ? format(new Date(`${label}T00:00:00`), 'dd/MM')
                      : format(new Date(`${label}-01T00:00:00`), 'MMM', { locale: ptBR })
                  }
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#737373' }}
                  tickFormatter={(value: number) =>
                    new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(
                      value,
                    )
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label: string) =>
                    viewMode === 'month'
                      ? format(new Date(`${label}T00:00:00`), 'dd/MM/yyyy')
                      : format(new Date(`${label}-01T00:00:00`), 'MMMM yyyy', { locale: ptBR })
                  }
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-neutral-500">
            Nenhum lançamento registrado neste período.
          </div>
        )}
      </div>

      {drillDown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">{drillDown.name}</h2>
                <p className="text-sm text-neutral-500">
                  {drillDown.type === 'project' ? 'Projeto' : 'Classificação'} · Lançamentos do
                  período
                </p>
              </div>
              <button
                onClick={() => setDrillDown(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {drillDown.loading ? (
                <div className="text-center text-neutral-500 py-8">Carregando...</div>
              ) : drillDown.transactions.length === 0 ? (
                <div className="text-center text-neutral-500 py-8">
                  Nenhum lançamento encontrado.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-500 border-b border-neutral-100">
                      <th className="py-2 pr-4 font-medium">Data</th>
                      <th className="py-2 pr-4 font-medium">Beneficiário</th>
                      <th className="py-2 pr-4 font-medium">Descrição</th>
                      <th className="py-2 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillDown.transactions.map((t) => (
                      <tr key={t.id} className="border-b border-neutral-50">
                        <td className="py-2 pr-4 text-neutral-700">
                          {format(new Date(`${t.date}T00:00:00`), 'dd/MM/yyyy')}
                        </td>
                        <td className="py-2 pr-4 text-neutral-700">{t.payee_name || '-'}</td>
                        <td className="py-2 pr-4 text-neutral-700">{t.description}</td>
                        <td
                          className={`py-2 text-right font-medium ${
                            Number(t.amount) >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(Number(t.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
