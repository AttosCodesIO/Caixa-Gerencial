import React, { useEffect, useState } from 'react';
import { SavedTable, CalculationEntry, IndexType } from '../types';
import { getSavedTables, getTableResults, updateTableResults, deleteCalculationTable } from '../services/supabaseService';
import { Clock, FolderOpen, Loader2, X, ArrowLeft, Save, Plus, Trash2, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResultDisplay } from './ResultDisplay';
import { BatchCalc } from './BatchCalc';
import { fetchBcbData } from '../services/bcbService';
import { calculateCorrection } from '../utils/finance';

interface SavedTablesProps {
  userId: string;
}

export function SavedTables({ userId }: SavedTablesProps) {
  const [tables, setTables] = useState<SavedTable[]>([]);
  const [loading, setLoading] = useState(true);

  // State
  const [selectedTable, setSelectedTable] = useState<SavedTable | null>(null);
  const [tableData, setTableData] = useState<CalculationEntry[] | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CalculationEntry | null>(null);
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSavedTables(userId);
        setTables(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const handleOpenTable = async (table: SavedTable) => {
    setSelectedTable(table);
    setLoadingDetails(true);
    setTableData(null);
    setEditingEntry(null);
    setIsAddingEntry(false);
    try {
      const result = await getTableResults(table.id);
      if (result) {
        setTableData(result.data as unknown as CalculationEntry[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseTable = () => {
    setSelectedTable(null);
    setTableData(null);
    setEditingEntry(null);
    setIsAddingEntry(false);
  };

  const handleRemoveEntry = async (entryId: string) => {
    if (!tableData || !selectedTable) return;
    if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;

    const updatedData = tableData.filter(e => e.id !== entryId);
    setTableData(updatedData);

    const success = await updateTableResults(selectedTable.id, updatedData as unknown as Record<string, unknown>[]);
    if (!success) {
      alert('Erro ao excluir lançamento. Tente novamente.');
    }
  };

  const handleAddEntries = async (newEntries: Partial<CalculationEntry>[]) => {
    if (!selectedTable || !tableData) return;

    setLoadingDetails(true);
    const results: CalculationEntry[] = [];

    for (const entry of newEntries) {
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

        results.push({
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
        } as CalculationEntry);
      } catch (error) {
        console.error(error);
        results.push({
          id,
          originalValue: entry.originalValue!,
          startDate: entry.startDate!,
          endDate: entry.endDate!,
          indexType: entry.indexType || 'SELIC',
          additionalInterestRate: entry.additionalInterestRate || 0,
          status: 'ERROR',
          errorMessage: 'Erro ao buscar índice',
        } as CalculationEntry);
      }
    }

    const updatedData = [...tableData, ...results];
    const success = await updateTableResults(selectedTable.id, updatedData as unknown as Record<string, unknown>[]);

    if (success) {
      setTableData(updatedData);
      setIsAddingEntry(false);
    } else {
      alert('Erro ao salvar novos lançamentos. Tente novamente.');
    }

    setLoadingDetails(false);
  };

  const handleRecalculateAll = async () => {
    if (!selectedTable || !tableData) return;
    setLoadingDetails(true);

    const recalculated: CalculationEntry[] = [];
    for (const entry of tableData) {
      try {
        const factors = await fetchBcbData(
          entry.indexType || 'SELIC',
          entry.startDate,
          entry.endDate,
        );
        const { correctedValue, interestValue, totalPercentage } = calculateCorrection(
          entry.originalValue || 0,
          factors,
          entry.indexType || 'SELIC',
          entry.additionalInterestRate || 0,
          entry.startDate,
          entry.endDate,
        );
        recalculated.push({ ...entry, correctedValue, interestValue, totalPercentage, status: 'SUCCESS' });
      } catch {
        recalculated.push({ ...entry, status: 'ERROR', errorMessage: 'Erro ao buscar índice' });
      }
    }

    const success = await updateTableResults(selectedTable.id, recalculated as unknown as Record<string, unknown>[]);
    if (success) {
      setTableData(recalculated);
    } else {
      alert('Erro ao salvar os dados recalculados. Tente novamente.');
    }
    setLoadingDetails(false);
  };

  const handleDeleteTable = async (table: SavedTable) => {
    if (!window.confirm(`Tem certeza que deseja excluir a tabela "${table.name}"? Esta ação não pode ser desfeita.`)) return;

    const success = await deleteCalculationTable(table.id);
    if (success) {
      setTables((prev) => prev.filter((t) => t.id !== table.id));
      if (selectedTable?.id === table.id) handleCloseTable();
    } else {
      alert('Erro ao excluir tabela. Tente novamente.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableData || !selectedTable || !editingEntry) return;

    setLoadingDetails(true);

    try {
      const factors = await fetchBcbData(
        editingEntry.indexType || 'SELIC',
        editingEntry.startDate,
        editingEntry.endDate,
      );

      const { correctedValue, interestValue, totalPercentage } = calculateCorrection(
        editingEntry.originalValue || 0,
        factors,
        editingEntry.indexType || 'SELIC',
        editingEntry.additionalInterestRate || 0,
        editingEntry.startDate,
        editingEntry.endDate,
      );

      const updatedEntry: CalculationEntry = {
        ...editingEntry,
        correctedValue,
        interestValue,
        totalPercentage,
        status: 'SUCCESS',
      };

      const updatedData = tableData.map(entry =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      );

      const success = await updateTableResults(selectedTable.id, updatedData as unknown as Record<string, unknown>[]);

      if (success) {
        setTableData(updatedData);
        setEditingEntry(null);
      } else {
        alert('Erro ao salvar edição. Tente novamente.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao recalcular os valores. Verifique se os dados inseridos são válidos (ex: datas com cotação existente).');
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) {
    return <div className="text-neutral-500 text-sm">Carregando tabelas salvas...</div>;
  }

  if (tables.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center flex flex-col items-center">
        <FolderOpen className="w-10 h-10 text-neutral-300 mb-3" />
        <h3 className="text-neutral-900 font-medium">Nenhum histórico</h3>
        <p className="text-neutral-500 text-sm mt-1">
          Você ainda não salvou nenhuma tabela de correção.
        </p>
      </div>
    );
  }

  if (selectedTable) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCloseTable}
              className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors flex-shrink-0"
              title="Voltar"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h3 className="text-xl font-bold text-neutral-900 uppercase tracking-tight">
                {selectedTable.name}
              </h3>
              <p className="text-sm text-neutral-500">
                Salva em{' '}
                {format(parseISO(selectedTable.created_at), "dd 'de' MMMM, yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRecalculateAll}
              disabled={loadingDetails}
              className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Recalcular Tudo
            </button>
            <button
              onClick={() => handleDeleteTable(selectedTable)}
              className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Tabela
            </button>
            <button
              onClick={() => setIsAddingEntry(!isAddingEntry)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className={`w-4 h-4 transition-transform ${isAddingEntry ? 'rotate-45' : ''}`} />
              {isAddingEntry ? 'Cancelar Lançamento' : 'Novo Lançamento'}
            </button>
          </div>
        </div>

        {loadingDetails ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500 bg-white rounded-2xl shadow-sm border border-neutral-200">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p>Processando...</p>
          </div>
        ) : tableData && tableData.length > 0 ? (
          <div className="space-y-6">
            {isAddingEntry && (
              <div className="animate-in slide-in-from-top-4 duration-300">
                <BatchCalc onCalculate={handleAddEntries} isProcessing={loadingDetails} progress={0} progressTotal={0} />
              </div>
            )}

            {editingEntry && (
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-neutral-900">Editar Lançamento</h4>
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Valor Original (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingEntry.originalValue || ''}
                      onChange={(e) => setEditingEntry({ ...editingEntry, originalValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      required
                      value={editingEntry.startDate}
                      onChange={(e) => setEditingEntry({ ...editingEntry, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Data Final
                    </label>
                    <input
                      type="date"
                      required
                      value={editingEntry.endDate}
                      onChange={(e) => setEditingEntry({ ...editingEntry, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Índice / Juros a.m.
                    </label>
                    <div className="flex flex-col gap-2">
                      <select
                        value={editingEntry.indexType}
                        onChange={(e) => setEditingEntry({ ...editingEntry, indexType: e.target.value as IndexType })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                      >
                        <option value="SELIC">SELIC</option>
                        <option value="IPCA">IPCA</option>
                        <option value="IGPM">IGP-M</option>
                        <option value="INCC">INCC</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 1.0"
                        value={editingEntry.additionalInterestRate !== undefined ? editingEntry.additionalInterestRate : ''}
                        onChange={(e) => setEditingEntry({ ...editingEntry, additionalInterestRate: parseFloat(e.target.value) || 0 })}
                        title="Juros Moratórios (% ao mês)"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>
                  <div className="h-full flex items-end">
                    <button
                      type="submit"
                      disabled={loadingDetails}
                      className="w-full h-20 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            )}
            <ResultDisplay entries={tableData} onRemove={handleRemoveEntry} onEdit={setEditingEntry} />
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500 border-2 border-dashed border-neutral-200 rounded-xl bg-white">
            <p className="font-medium">Nenhum dado encontrado.</p>
            <p className="text-sm mt-1">Essa tabela pode estar corrompida ou vazia.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      <ul className="divide-y divide-neutral-200">
        {tables.map((table) => (
          <li
            key={table.id}
            className="p-4 hover:bg-neutral-50 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-900">{table.name}</h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Salva em{' '}
                  {format(parseISO(table.created_at), "dd 'de' MMMM, yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDeleteTable(table)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir tabela"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenTable(table)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Abrir
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
