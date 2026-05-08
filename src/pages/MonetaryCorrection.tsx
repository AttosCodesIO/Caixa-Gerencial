import React, { useState } from 'react';
import { BatchCalc } from '../components/BatchCalc';
import { DashboardSummary } from '../components/DashboardSummary';
import { ResultDisplay } from '../components/ResultDisplay';
import { CalculationEntry } from '../types';
import { fetchBcbData } from '../services/bcbService';
import { calculateCorrection } from '../utils/finance';
import { saveCalculationTable } from '../services/supabaseService';
import { useAuth } from '../lib/AuthContext';
import { Save } from 'lucide-react';

export default function MonetaryCorrection() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CalculationEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [tableName, setTableName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const CONCURRENCY = 3;

  const handleCalculate = async (newEntries: Partial<CalculationEntry>[]) => {
    setIsProcessing(true);
    setProgress(0);
    setProgressTotal(newEntries.length);

    const processEntry = async (entry: Partial<CalculationEntry>): Promise<CalculationEntry> => {
      const id = crypto.randomUUID();
      try {
        const factors = await fetchBcbData(
          entry.indexType || 'SELIC',
          entry.startDate!,
          entry.endDate!,
        );
        const { correctedValue, interestValue, totalPercentage } = calculateCorrection(
          entry.originalValue || 0,
          factors,
          entry.indexType || 'SELIC',
          entry.additionalInterestRate || 0,
          entry.startDate!,
          entry.endDate!,
        );
        return {
          id,
          originalValue: entry.originalValue!,
          startDate: entry.startDate!,
          endDate: entry.endDate!,
          indexType: entry.indexType || 'SELIC',
          additionalInterestRate: entry.additionalInterestRate || 0,
          correctedValue,
          interestValue,
          totalPercentage,
          status: 'SUCCESS',
        } as CalculationEntry;
      } catch (error) {
        console.error(error);
        return {
          id,
          originalValue: entry.originalValue!,
          startDate: entry.startDate!,
          endDate: entry.endDate!,
          indexType: entry.indexType || 'SELIC',
          additionalInterestRate: entry.additionalInterestRate || 0,
          status: 'ERROR',
          errorMessage: 'Erro ao buscar índice',
        } as CalculationEntry;
      }
    };

    const results: CalculationEntry[] = [];
    for (let i = 0; i < newEntries.length; i += CONCURRENCY) {
      const batch = newEntries.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(processEntry));
      results.push(...batchResults);
      setProgress(Math.min(i + CONCURRENCY, newEntries.length));
    }

    setEntries((prev) => [...prev, ...results]);
    setIsProcessing(false);
  };

  const handleRemove = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || entries.length === 0 || !tableName) return;

    setIsSaving(true);
    await saveCalculationTable(user.id, tableName, entries);
    setIsSaving(false);
    setTableName('');
    alert('Tabela salva com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Correção Monetária</h1>
          <p className="text-neutral-500 mt-1">
            Cálculo e atualização de valores com base em índices oficiais do BCB.
          </p>
        </div>

        {entries.length > 0 && (
          <form onSubmit={handleSave} className="flex items-center gap-2">
            <input
              type="text"
              required
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Nome da Tabela"
              className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Tabela'}
            </button>
          </form>
        )}
      </div>

      <BatchCalc onCalculate={handleCalculate} isProcessing={isProcessing} progress={progress} progressTotal={progressTotal} />

      {entries.length > 0 && (
        <>
          <DashboardSummary data={entries.filter((e) => e.status === 'SUCCESS')} />
          <ResultDisplay entries={entries} onRemove={handleRemove} />
        </>
      )}
    </div>
  );
}
