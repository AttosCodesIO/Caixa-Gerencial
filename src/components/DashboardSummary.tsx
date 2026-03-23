import React from 'react';
import { CalculationEntry } from '../types';
import { formatCurrency } from '../utils/finance';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

interface DashboardSummaryProps {
  data: CalculationEntry[];
}

export function DashboardSummary({ data }: DashboardSummaryProps) {
  const totalOriginal = data.reduce((acc, curr) => acc + curr.originalValue, 0);
  const totalCorrected = data.reduce((acc, curr) => acc + (curr.correctedValue || 0), 0);
  const totalInterest = data.reduce((acc, curr) => acc + (curr.interestValue || 0), 0);

  const chartData = data.map((entry, index) => ({
    name: `Lançamento ${index + 1}`,
    Original: entry.originalValue,
    Corrigido: entry.correctedValue || entry.originalValue,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Valor Original Total</p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">{formatCurrency(totalOriginal)}</h3>
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
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">{formatCurrency(totalCorrected)}</h3>
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
              <h3 className="text-2xl font-bold text-neutral-900 mt-1">{formatCurrency(totalInterest)}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {data.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Evolução dos Valores</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="Original" stroke="#9ca3af" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Corrigido" stroke="#10b981" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
