import { useState, FormEvent } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Printer,
  Copy,
  X,
  Wallet,
  DollarSign,
  FileText,
  Briefcase,
  Sheet,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { gerarReciboSalario, gerarReciboServicos, gerarRelatorioPeriodo } from '../utils/pdfGenerators';
import {
  createTransaction,
  updateTransaction,
} from '../lib/api';
import { useTransactions } from '../hooks/useTransactions';



// =================== COMPONENTE PRINCIPAL ===================

const maskCurrency = (value: string) => {
  let v = value.replace(/\D/g, '');
  if (!v) return '';
  v = parseInt(v, 10).toString();
  if (v.length === 1) v = '0.0' + v;
  else if (v.length === 2) v = '0.' + v;
  else v = v.substring(0, v.length - 2) + '.' + v.substring(v.length - 2);
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrency = (value: string) => {
  if (!value) return 0;
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  return Number(cleanValue);
};

export default function Transactions() {
  const {
    transactions,
    payees,
    projects,
    classifications,
    currentDate,
    viewMode,
    setViewMode,
    balanceData,
    localizacao,
    filterDay, setFilterDay,
    filterDescription, setFilterDescription,
    filterPayee, setFilterPayee,
    filterProject, setFilterProject,
    filterAmount, setFilterAmount,
    filteredTransactions,
    clearFilters,
    fetchData,
    handlePrev,
    handleNext,
    handleDelete,
    formatCurrency,
  } = useTransactions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Estados para o Relatório
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportScope, setReportScope] = useState<'filtered' | 'complete'>('filtered');

  // Estado para o seletor de tipo de recibo
  const [receiptSelectorTransaction, setReceiptSelectorTransaction] = useState<Transaction | null>(null);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense',
    amount: '',
    payee_id: '',
    project_id: '',
    classification_id: '',
    description: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = parseCurrency(formData.amount);
    const amount = formData.type === 'expense' ? -Math.abs(numericAmount) : Math.abs(numericAmount);

    const payload = {
      date: formData.date,
      payee_id: formData.payee_id ? Number(formData.payee_id) : null,
      project_id: formData.project_id ? Number(formData.project_id) : null,
      classification_id: formData.classification_id ? Number(formData.classification_id) : null,
      amount,
      description: formData.description,
    };

    if (editingId) {
      await updateTransaction(editingId, payload);
    } else {
      await createTransaction(payload);
    }

    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      ...formData,
      amount: '',
      description: '',
      payee_id: '',
      project_id: '',
      classification_id: '',
    });
    fetchData();
  };

  const handleEdit = (t: Transaction) => {
    setFormData({
      date: t.date,
      type: t.amount < 0 ? 'expense' : 'income',
      amount: maskCurrency(Math.abs(t.amount).toFixed(2).replace('.', '')),
      payee_id: t.payee_id?.toString() || '',
      project_id: t.project_id?.toString() || '',
      classification_id: t.classification_id?.toString() || '',
      description: t.description,
    });
    setEditingId(t.id);
    setIsModalOpen(true);
  };

  const handleDuplicate = (t: Transaction) => {
    setFormData({
      date: t.date,
      type: t.amount < 0 ? 'expense' : 'income',
      amount: maskCurrency(Math.abs(t.amount).toFixed(2).replace('.', '')),
      payee_id: t.payee_id?.toString() || '',
      project_id: t.project_id?.toString() || '',
      classification_id: t.classification_id?.toString() || '',
      description: t.description,
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handlePrintReceipt = (type: 'salario' | 'servicos') => {
    if (!receiptSelectorTransaction) return;
    const t = receiptSelectorTransaction;
    const html =
      type === 'salario'
        ? gerarReciboSalario(t, formatCurrency, localizacao)
        : gerarReciboServicos(t, formatCurrency, localizacao);

    const win = window.open('', '', 'width=800,height=900');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => {
        win.print();
      }, 600);
    }
    setReceiptSelectorTransaction(null);
  };

  const executePrintBrowser = () => {
    const dataToPrint = reportScope === 'filtered' ? filteredTransactions : transactions;
    const periodLabel =
      viewMode === 'month'
        ? format(currentDate, 'MMMM yyyy', { locale: ptBR })
        : format(currentDate, 'yyyy');

    const html = gerarRelatorioPeriodo(
      dataToPrint,
      balanceData as Record<string, unknown>,
      periodLabel.toUpperCase(),
      formatCurrency,
    );
    const win = window.open('', '', 'width=900,height=900');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => {
        win.print();
      }, 800);
    }
    setIsReportModalOpen(false);
  };

  const executeExportPDF = () => {
    const dataToExport = reportScope === 'filtered' ? filteredTransactions : transactions;
    const periodLabel =
      viewMode === 'month'
        ? format(currentDate, 'MMMM yyyy', { locale: ptBR })
        : format(currentDate, 'yyyy');

    const html = gerarRelatorioPeriodo(
      dataToExport,
      balanceData as Record<string, unknown>,
      periodLabel.toUpperCase(),
      formatCurrency,
    );

    const element = document.createElement('div');
    element.innerHTML = html;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    document.body.appendChild(element);

    const container = (element.querySelector('.page-container') ?? element) as HTMLElement;

    html2canvas(container, { scale: 2, useCORS: true, logging: false }).then((canvas) => {
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const margin = 10;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const availableWidth = pdfWidth - margin * 2;
      const availableHeight = pdfHeight - margin * 2;
      const mmPerPx = availableWidth / canvas.width;
      const pageHeightPx = Math.floor(availableHeight / mmPerPx);

      let yOffset = 0;
      while (yOffset < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - yOffset);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d')!;
        ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const imgData = pageCanvas.toDataURL('image/jpeg', 0.98);
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, margin, availableWidth, sliceHeight * mmPerPx);
        yOffset += pageHeightPx;
      }

      pdf.save(`relatorio_lancamentos_${periodLabel.replace(' ', '_')}.pdf`);
      document.body.removeChild(element);
    });

    setIsReportModalOpen(false);
  };

  const executeExportExcel = () => {
    const dataToExport = reportScope === 'filtered' ? filteredTransactions : transactions;
    const periodLabel =
      viewMode === 'month'
        ? format(currentDate, 'MMMM yyyy', { locale: ptBR })
        : format(currentDate, 'yyyy');

    const rows = dataToExport.map((t: Transaction) => ({
      Data: format(parseISO(t.date), 'dd/MM/yyyy'),
      Favorecido: t.payee_name || '',
      Projeto: t.project_name || '',
      Valor: t.amount,
      Histórico: t.description,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 40 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');
    XLSX.writeFile(wb, `relatorio_lancamentos_${periodLabel.replace(' ', '_')}.xlsx`);

    setIsReportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Lançamentos</h1>
          <p className="text-neutral-500">Gerencie as entradas e saídas do caixa</p>
        </div>

        <div className="flex items-center gap-4">
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

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
            title="Configurar Relatório"
          >
            <Printer className="w-5 h-5" />
            <span className="hidden sm:inline">Relatório</span>
          </button>

          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                ...formData,
                amount: '',
                description: '',
                payee_id: '',
                project_id: '',
                classification_id: '',
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Balances Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-neutral-500 font-medium">Saldo Inicial do Período</span>
          </div>
          <span className="text-xl font-bold text-neutral-900">
            {formatCurrency(balanceData?.initialBalance || 0)}
          </span>
        </div>
        <div className="bg-neutral-900 p-4 rounded-xl shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-800 rounded-lg text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-neutral-400 font-medium">Saldo Final do Período</span>
          </div>
          <span className="text-xl font-bold text-white">
            {formatCurrency(balanceData?.finalBalance || 0)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-sm">
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Favorecido</th>
                <th className="p-4 font-medium">Projeto</th>
                <th className="p-4 font-medium text-right">Valor</th>
                <th className="p-4 font-medium">Histórico</th>
                <th className="p-4 font-medium w-32 text-right">Ações</th>
              </tr>
              {/* Filtros Dinâmicos (Bootstrap like) */}
              <tr className="bg-white border-b border-neutral-200 text-sm">
                <th className="p-2">
                  <input
                    type="text"
                    className="form-control text-xs font-normal border border-neutral-300 rounded px-2 py-1 w-16 text-center outline-none focus:border-neutral-400"
                    placeholder="Dia..."
                    value={filterDay}
                    onChange={(e) => setFilterDay(e.target.value)}
                  />
                </th>
                <th className="p-2">
                  <input
                    type="text"
                    className="form-control text-xs font-normal border border-neutral-300 rounded px-2 py-1 w-full outline-none focus:border-neutral-400"
                    placeholder="Filtrar favorecido..."
                    value={filterPayee}
                    onChange={(e) => setFilterPayee(e.target.value)}
                  />
                </th>
                <th className="p-2">
                  <input
                    type="text"
                    className="form-control text-xs font-normal border border-neutral-300 rounded px-2 py-1 w-full outline-none focus:border-neutral-400"
                    placeholder="Filtrar projeto..."
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                  />
                </th>
                <th className="p-2">
                  <div className="flex justify-end">
                    <input
                      type="text"
                      className="form-control text-xs font-normal border border-neutral-300 rounded px-2 py-1 w-20 text-right outline-none focus:border-neutral-400"
                      placeholder="Valor..."
                      value={filterAmount}
                      onChange={(e) => setFilterAmount(e.target.value)}
                    />
                  </div>
                </th>
                <th className="p-2">
                  <input
                    type="text"
                    className="form-control text-xs font-normal border border-neutral-300 rounded px-2 py-1 w-full outline-none focus:border-neutral-400"
                    placeholder="Filtrar histórico..."
                    value={filterDescription}
                    onChange={(e) => setFilterDescription(e.target.value)}
                  />
                </th>
                <th className="p-2 text-right">
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium underline px-2 py-1"
                    title="Limpar Filtros"
                  >
                    Limpar
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    Nenhum lançamento encontrado para os filtros aplicados neste período.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="p-4 text-neutral-600 whitespace-nowrap">
                      {format(parseISO(t.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4 text-neutral-600">{t.payee_name || '-'}</td>
                    <td className="p-4 text-neutral-600">
                      {t.project_name ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                          {t.project_name}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td
                      className={`p-4 text-right whitespace-nowrap font-medium ${t.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}
                    >
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="p-4 text-neutral-900 font-medium">{t.description}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => setReceiptSelectorTransaction(t)}
                          className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Emitir Recibo"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(t)}
                          className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(t)}
                          className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Seletor de Tipo de Recibo */}
      {receiptSelectorTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-neutral-900">Selecione o Tipo de Recibo</h2>
              <button
                onClick={() => setReceiptSelectorTransaction(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-neutral-500 mb-4">
                Lançamento:{' '}
                <strong className="text-neutral-800">
                  {receiptSelectorTransaction.description}
                </strong>
                <br />
                Valor:{' '}
                <strong className="text-neutral-800">
                  {formatCurrency(Math.abs(receiptSelectorTransaction.amount))}
                </strong>
              </p>

              <button
                onClick={() => handlePrintReceipt('salario')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all group"
              >
                <div className="p-3 bg-neutral-100 rounded-xl group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-neutral-900">Pagamento de Salário</p>
                  <p className="text-sm text-neutral-500">
                    Recibo para pagamento de funcionários CLT
                  </p>
                </div>
              </button>

              <button
                onClick={() => handlePrintReceipt('servicos')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all group"
              >
                <div className="p-3 bg-neutral-100 rounded-xl group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-neutral-900">Prestação de Serviços</p>
                  <p className="text-sm text-neutral-500">
                    Recibo para serviços prestados por terceiros
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Relatórios (Bootstrap inspired) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <h2 className="text-lg font-bold text-neutral-900">Configuração do Relatório</h2>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-3">
                  Escopo dos Dados
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                    <input
                      type="radio"
                      name="reportScope"
                      className="form-check-input w-4 h-4 text-neutral-900 focus:ring-neutral-900"
                      checked={reportScope === 'filtered'}
                      onChange={() => setReportScope('filtered')}
                    />
                    <div>
                      <span className="block text-sm font-medium text-neutral-900">
                        Dados Filtrados
                      </span>
                      <span className="block text-xs text-neutral-500">
                        Apenas o que está visível na tabela ({filteredTransactions.length})
                      </span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                    <input
                      type="radio"
                      name="reportScope"
                      className="form-check-input w-4 h-4 text-neutral-900 focus:ring-neutral-900"
                      checked={reportScope === 'complete'}
                      onChange={() => setReportScope('complete')}
                    />
                    <div>
                      <span className="block text-sm font-medium text-neutral-900">
                        Relatório Completo
                      </span>
                      <span className="block text-xs text-neutral-500">
                        Base total do período atual ({transactions.length})
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-neutral-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={executeExportPDF}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors shadow-sm order-2 sm:order-1"
              >
                <FileText className="w-5 h-5" /> PDF (jsPDF)
              </button>
              <button
                onClick={executePrintBrowser}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl font-medium transition-colors shadow-sm order-1 sm:order-2"
              >
                <Printer className="w-5 h-5" /> Browser
              </button>
              <button
                onClick={executeExportExcel}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-sm order-3"
              >
                <Sheet className="w-5 h-5" /> Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-neutral-900">
                {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                    >
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Data</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: maskCurrency(e.target.value) })
                    }
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Histórico
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                    placeholder="Descrição do lançamento"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Favorecido
                  </label>
                  <select
                    value={formData.payee_id}
                    onChange={(e) => setFormData({ ...formData, payee_id: e.target.value })}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {payees.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Projeto</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Classificação
                  </label>
                  <select
                    value={formData.classification_id}
                    onChange={(e) =>
                      setFormData({ ...formData, classification_id: e.target.value })
                    }
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {classifications.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-200 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="transaction-form"
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors shadow-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
