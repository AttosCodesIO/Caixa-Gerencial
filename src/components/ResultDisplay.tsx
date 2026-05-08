import React from 'react';
import { CalculationEntry } from '../types';
import { formatCurrency } from '../utils/finance';
import { Trash2, FileSpreadsheet, FileText, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ResultDisplayProps {
  entries: CalculationEntry[];
  onRemove?: (id: string) => void;
  onEdit?: (entry: CalculationEntry) => void;
}

export function ResultDisplay({ entries, onRemove, onEdit }: ResultDisplayProps) {
  if (entries.length === 0) return null;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Correção Monetária', 14, 15);

    const tableData = entries.map((entry) => [
      format(parseISO(entry.startDate), 'dd/MM/yyyy'),
      format(parseISO(entry.endDate), 'dd/MM/yyyy'),
      entry.indexType,
      formatCurrency(entry.originalValue),
      formatCurrency(entry.correctedValue || 0),
      formatCurrency(entry.interestValue || 0),
    ]);

    autoTable(doc, {
      head: [
        ['Data Inicial', 'Data Final', 'Índice', 'Valor Original', 'Valor Corrigido', 'Juros'],
      ],
      body: tableData,
      startY: 20,
    });

    doc.save('correcao-monetaria.pdf');
  };

  const exportExcel = () => {
    const wsData = entries.map((entry) => ({
      'Data Inicial': format(parseISO(entry.startDate), 'dd/MM/yyyy'),
      'Data Final': format(parseISO(entry.endDate), 'dd/MM/yyyy'),
      Índice: entry.indexType,
      'Juros Ad. (%)': entry.additionalInterestRate,
      'Valor Original': entry.originalValue,
      'Valor Corrigido': entry.correctedValue || 0,
      Juros: entry.interestValue || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
    XLSX.writeFile(wb, 'correcao-monetaria.xlsx');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/50">
        <h3 className="text-lg font-bold text-neutral-900">Resultados Analíticos</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <FileText className="w-4 h-4 text-red-500" />
            PDF
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-600">
          <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Período</th>
              <th className="px-6 py-3 font-semibold">Índice / Juros Ad.</th>
              <th className="px-6 py-3 font-semibold text-right">Valor Original</th>
              <th className="px-6 py-3 font-semibold text-right">Valor Corrigido</th>
              <th className="px-6 py-3 font-semibold text-right">Juros Totais</th>
              {(onRemove || onEdit) && <th className="px-6 py-3 text-center">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-neutral-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-neutral-900">
                      {format(parseISO(entry.startDate), 'dd/MM/yy')}
                    </span>
                    <span className="text-xs">a {format(parseISO(entry.endDate), 'dd/MM/yy')}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-neutral-900">{entry.indexType}</span>
                    {entry.additionalInterestRate > 0 && (
                      <span className="text-xs">+ {entry.additionalInterestRate}% a.m.</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">{formatCurrency(entry.originalValue)}</td>
                <td className="px-6 py-4 text-right font-medium text-emerald-600">
                  {entry.status === 'CALCULATING'
                    ? '...'
                    : formatCurrency(entry.correctedValue || 0)}
                </td>
                <td className="px-6 py-4 text-right">
                  {entry.status === 'CALCULATING'
                    ? '...'
                    : formatCurrency(entry.interestValue || 0)}
                  {entry.status === 'SUCCESS' && (
                    <div className="text-xs text-neutral-400">
                      ({entry.totalPercentage?.toFixed(2)}%)
                    </div>
                  )}
                </td>
                {(onRemove || onEdit) && (
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(entry)}
                          title="Editar"
                          className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {onRemove && (
                        <button
                          onClick={() => onRemove(entry.id)}
                          title="Excluir"
                          className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
