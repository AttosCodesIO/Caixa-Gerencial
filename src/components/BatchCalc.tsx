import React, { useState } from 'react';
import { IndexType, CalculationEntry } from '../types';
import { Upload, Calculator, X, TableProperties } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BatchCalcProps {
  onCalculate: (entries: Partial<CalculationEntry>[]) => void;
  isProcessing: boolean;
  progress: number;
  progressTotal: number;
}

const parseExcelDate = (val: string | number) => {
  if (!val) return '';
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    if (date)
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    if (val.includes('/')) {
      const parts = val.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    try {
      return new Date(val).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  }
  return '';
};

export function BatchCalc({ onCalculate, isProcessing, progress, progressTotal }: BatchCalcProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'batch'>('manual');

  // Manual State
  const [originalValue, setOriginalValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [indexType, setIndexType] = useState<IndexType>('SELIC');
  const [additionalInterest, setAdditionalInterest] = useState('0');

  // Batch Mapping State
  const [fileData, setFileData] = useState<Record<string, unknown>[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [showMapper, setShowMapper] = useState(false);
  const [batchIndexType, setBatchIndexType] = useState<IndexType>('SELIC');
  const [batchAdditionalInterest, setBatchAdditionalInterest] = useState('0');

  const [columnMap, setColumnMap] = useState<
    Record<'startDate' | 'endDate' | 'originalValue', string>
  >({
    startDate: '',
    endDate: '',
    originalValue: '',
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate([
      {
        originalValue: parseFloat(originalValue),
        startDate,
        endDate,
        indexType,
        additionalInterestRate: parseFloat(additionalInterest) || 0,
      },
    ]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      if (json.length === 0) {
        alert('A planilha está vazia!');
        return;
      }

      const cols = Object.keys(json[0]);
      setFileColumns(cols);
      setFileData(json);

      // Simple Auto-mapping heuristic
      const autoMap = { startDate: '', endDate: '', originalValue: '' };
      cols.forEach((c) => {
        const lower = c.toLowerCase();
        if (lower.includes('data inicial') || lower.includes('inicio') || lower.includes('início'))
          autoMap.startDate = c;
        if (lower.includes('data final') || lower.includes('fim')) autoMap.endDate = c;
        if (lower.includes('valor')) autoMap.originalValue = c;
      });

      setColumnMap(autoMap);
      setShowMapper(true);
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar o arquivo. Verifique se é um arquivo Excel ou CSV válido.');
    }

    e.target.value = ''; // Reset input to allow picking the same file again if needed
  };

  const clearMapping = () => {
    setShowMapper(false);
    setFileData([]);
    setFileColumns([]);
  };

  const handleConfirmMapping = () => {
    if (!columnMap.startDate || !columnMap.endDate || !columnMap.originalValue) {
      alert('Selecione as colunas correspondentes para Data Inicial, Data Final e Valor Original.');
      return;
    }

    const entries: Partial<CalculationEntry>[] = [];

    for (const row of fileData) {
      const valorRaw = row[columnMap.originalValue];
      const dataInicialRaw = row[columnMap.startDate];
      const dataFinalRaw = row[columnMap.endDate];

      let valOriginal = 0;
      if (typeof valorRaw === 'number') valOriginal = valorRaw;
      else if (typeof valorRaw === 'string') {
        valOriginal = parseFloat(valorRaw.replace(/[R$\s.]/g, '').replace(',', '.'));
      }

      const parsedStart = parseExcelDate(dataInicialRaw);
      const parsedEnd = parseExcelDate(dataFinalRaw);

      if (valOriginal > 0 && parsedStart && parsedEnd) {
        entries.push({
          originalValue: valOriginal,
          startDate: parsedStart,
          endDate: parsedEnd,
          indexType: batchIndexType,
          additionalInterestRate: parseFloat(batchAdditionalInterest) || 0,
        });
      }
    }

    if (entries.length > 0) {
      onCalculate(entries);
      clearMapping();
    } else {
      alert(
        'Não foi possível processar nenhuma linha válida com as colunas selecionadas. Verifique a formatação dos dados.',
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden mb-6 relative">
      <div className="flex border-b border-neutral-200 bg-neutral-50/50">
        <button
          onClick={() => {
            setActiveTab('manual');
            clearMapping();
          }}
          className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'manual'
            ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
            : 'text-neutral-500 hover:text-neutral-700'
            }`}
        >
          Lançamento Manual
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'batch'
            ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
            : 'text-neutral-500 hover:text-neutral-700'
            }`}
        >
          Processamento em Lote
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Valor Original (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={originalValue}
                  onChange={(e) => setOriginalValue(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Data Inicial</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Data Final</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Índice</label>
                <select
                  value={indexType}
                  onChange={(e) => setIndexType(e.target.value as IndexType)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="SELIC">SELIC</option>
                  <option value="IPCA">IPCA</option>
                  <option value="IGPM">IGP-M</option>
                  <option value="INCC">INCC</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Juros Ad. (% a.m.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={additionalInterest}
                  onChange={(e) => setAdditionalInterest(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  placeholder="Ex: 1.0"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {isProcessing ? (
                  'Calculando...'
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    Calcular Valor
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {!showMapper ? (
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 flex flex-col items-center justify-center bg-neutral-50/50 hover:bg-neutral-50 hover:border-blue-400 transition-all">
                <Upload className="w-10 h-10 text-neutral-400 mb-4" />
                <h4 className="text-sm font-semibold text-neutral-900 mb-1">Upload de Planilha</h4>
                <p className="text-sm text-neutral-500 mb-4 text-center max-w-sm">
                  Arraste um arquivo .xlsx ou .csv contendo as colunas: Valor, Data Inicial, Data
                  Final.
                </p>
                <label className="bg-white border border-neutral-200 text-neutral-700 px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-neutral-50 hover:text-blue-600 transition-colors shadow-sm">
                  Selecionar Arquivo
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.csv"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl mx-auto">
                <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900">
                    <TableProperties className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-lg">Parametrização de Layout</h3>
                  </div>
                  <button
                    onClick={clearMapping}
                    className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 bg-slate-50">
                  <p className="text-sm text-neutral-600 mb-6">
                    Mapeie as colunas do seu arquivo para garantir que a importação seja feita
                    corretamente. Você visualizará as colunas encontradas na planilha.
                  </p>

                  <div className="space-y-4 mb-6 relative">
                    {/* Index Global Inputs for Batch */}
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-200">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                          Índice a Aplicar
                        </label>
                        <select
                          value={batchIndexType}
                          onChange={(e) => setBatchIndexType(e.target.value as IndexType)}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm"
                        >
                          <option value="SELIC">SELIC</option>
                          <option value="IPCA">IPCA</option>
                          <option value="IGPM">IGP-M</option>
                          <option value="INCC">INCC</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                          Juros Ad. Global (% a.m.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={batchAdditionalInterest}
                          onChange={(e) => setBatchAdditionalInterest(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm"
                          placeholder="0.0"
                        />
                      </div>
                    </div>

                    {/* Validation Map */}
                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-neutral-200 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          Obrigatório
                        </span>
                        <span className="text-sm font-medium text-neutral-900">Data Inicial</span>
                      </div>
                      <select
                        value={columnMap.startDate}
                        onChange={(e) => setColumnMap({ ...columnMap, startDate: e.target.value })}
                        className="w-48 px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">-- Selecione --</option>
                        {fileColumns.map((c) => (
                          <option key={`start-${c}`} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-neutral-200 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          Obrigatório
                        </span>
                        <span className="text-sm font-medium text-neutral-900">Data Final</span>
                      </div>
                      <select
                        value={columnMap.endDate}
                        onChange={(e) => setColumnMap({ ...columnMap, endDate: e.target.value })}
                        className="w-48 px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">-- Selecione --</option>
                        {fileColumns.map((c) => (
                          <option key={`end-${c}`} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-neutral-200 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          Obrigatório
                        </span>
                        <span className="text-sm font-medium text-neutral-900">Valor Original</span>
                      </div>
                      <select
                        value={columnMap.originalValue}
                        onChange={(e) =>
                          setColumnMap({ ...columnMap, originalValue: e.target.value })
                        }
                        className="w-48 px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">-- Selecione --</option>
                        {fileColumns.map((c) => (
                          <option key={`val-${c}`} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end pt-4 border-t border-neutral-200">
                    <button
                      onClick={clearMapping}
                      className="px-4 py-2 font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmMapping}
                      disabled={isProcessing}
                      className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isProcessing ? 'Processando...' : 'Confirmar Layout'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isProcessing && progressTotal > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Processando registros...</span>
              <span>{progress} / {progressTotal}</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressTotal > 0 ? (progress / progressTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
