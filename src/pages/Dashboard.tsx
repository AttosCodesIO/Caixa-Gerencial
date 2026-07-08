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
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getProjects, getClassifications, getBalance } from '../lib/api';
import { Project, Classification, DateFilterState } from '../types';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.dataInicio, dateRange.dataFim]);

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

  const projectChartData = Object.entries(data.expensesByProject || {}).map(
    ([projectId, amount], index) => {
      const project = projects.find((p) => p.id === Number(projectId));
      return {
        name: project ? project.name : 'Sem Projeto',
        value: amount,
        color: COLORS[index % COLORS.length],
      };
    },
  );

  const classificationChartData = Object.entries(data.expensesByClassification || {}).map(
    ([classId, amount], index) => {
      const classification = classifications.find((c) => c.id === Number(classId));
      return {
        name: classification ? classification.name : 'Sem Classificação',
        value: amount,
        color: COLORS_ALT[index % COLORS_ALT.length],
      };
    },
  );

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
                  >
                    {projectChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
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
                  >
                    {classificationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
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
    </div>
  );
}
