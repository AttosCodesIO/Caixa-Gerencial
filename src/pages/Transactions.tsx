import { useState, useEffect, FormEvent } from 'react';
import { format, subMonths, addMonths, subYears, addYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, ChevronLeft, ChevronRight, Edit2, Printer, X, Wallet, DollarSign, FileText, Briefcase } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { valorPorExtenso } from '../lib/valorPorExtenso';
import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
  getPayees, getProjects, getClassifications, getBalance
} from '../lib/api';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Extrai dia/mês/ano da string YYYY-MM-DD sem depender do fuso do navegador
// Garante que a data exibida é sempre a data registrada (fuso Brasília-DF)
function parseDateBRT(dateStr: string) {
  const [ano, mes, dia] = dateStr.split('-');
  return { dia, mesIdx: parseInt(mes, 10) - 1, mesNome: MESES[parseInt(mes, 10) - 1], ano };
}

const CAPITAIS_BR: Record<string, string> = {
  'AC': 'Rio Branco', 'AL': 'Maceió', 'AP': 'Macapá', 'AM': 'Manaus',
  'BA': 'Salvador', 'CE': 'Fortaleza', 'DF': 'Brasília', 'ES': 'Vitória',
  'GO': 'Goiânia', 'MA': 'São Luís', 'MT': 'Cuiabá', 'MS': 'Campo Grande',
  'MG': 'Belo Horizonte', 'PA': 'Belém', 'PB': 'João Pessoa', 'PR': 'Curitiba',
  'PE': 'Recife', 'PI': 'Teresina', 'RJ': 'Rio de Janeiro', 'RN': 'Natal',
  'RS': 'Porto Alegre', 'RO': 'Porto Velho', 'RR': 'Boa Vista', 'SC': 'Florianópolis',
  'SP': 'São Paulo', 'SE': 'Aracaju', 'TO': 'Palmas'
};

// =================== RECIBO: PAGAMENTO DE SALÁRIO ===================
function gerarReciboSalario(t: any, formatCurrency: (v: number) => string, localizacao: string) {
  const { dia, mesNome, ano } = parseDateBRT(t.date);
  const valorAbs = Math.abs(t.amount);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Recibo de Pagamento de Salário</title>
  <style>
    @page { size: A4; margin: 30mm 25mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; font-size: 14px; }
    .container { max-width: 700px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 18px; font-weight: 700; letter-spacing: 1px; margin: 0 0 15px 0; text-transform: uppercase; }
    .header img { height: 50px; margin-bottom: 15px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #444; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 12px; }
    .field { margin-bottom: 6px; }
    .field strong { display: inline-block; min-width: 160px; }
    .highlight { background: #f5f5f5; padding: 15px 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin: 20px 0; }
    .highlight .valor { font-size: 22px; font-weight: 700; color: #1a1a1a; }
    .highlight .extenso { font-size: 13px; color: #555; font-style: italic; margin-top: 4px; }
    .texto-legal { font-size: 13px; color: #333; text-align: justify; margin: 25px 0; line-height: 1.7; }
    .pagamento { font-size: 13px; font-weight: 600; color: #333; margin: 15px 0; }
    .data-local { text-align: right; margin: 30px 0 60px 0; font-size: 14px; }
    .assinatura { text-align: center; margin-top: 80px; }
    .assinatura .linha { border-top: 1px solid #1a1a1a; width: 350px; margin: 0 auto 8px auto; }
    .assinatura .nome { font-weight: 600; font-size: 14px; }
    .assinatura .cargo { font-size: 12px; color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="/logoAttos.jpeg" alt="Attos" />
      <h1>Recibo de Pagamento de Salário</h1>
    </div>
    <div class="section">
      <div class="section-title">Empregador</div>
      <div class="field"><strong>Empresa:</strong> ATTOS EMPREENDIMENTOS IMOBILIARIOS SA</div>
      <div class="field"><strong>CNPJ:</strong> 05.579.210/0001-08</div>
    </div>
    <div class="section">
      <div class="section-title">Empregado</div>
      <div class="field"><strong>Nome:</strong> ${t.payee_name || 'Não informado'}</div>
      <div class="field"><strong>CPF:</strong> ${t.payee_document || 'Não informado'}</div>
      <div class="field"><strong>Cargo:</strong> ${t.payee_cargo || 'Não informado'}</div>
    </div>
    <div class="section">
      <div class="section-title">Especificação do Pagamento</div>
      <div class="highlight">
        <div class="valor">${formatCurrency(valorAbs)}</div>
        <div class="extenso">(${valorPorExtenso(valorAbs)})</div>
      </div>
      <div class="field"><strong>Referente ao mês/ano:</strong> ${mesNome} / ${ano}</div>
    </div>
    <div class="texto-legal">
      Recebi da empresa/empregador acima identificado a importância líquida discriminada neste recibo, referente ao pagamento do meu salário do período mencionado, para o qual dou plena e geral quitação.
    </div>
    <div class="pagamento">FORMA DE PAGAMENTO: Efetuado integralmente em espécie (moeda corrente).</div>
    <div class="data-local" style="text-align: right; margin-top: 30px; margin-bottom: 50px;">${localizacao}, ${dia} de ${mesNome} de ${ano}.</div>
    <div class="assinatura">
      <div class="linha"></div>
      <div class="nome">${t.payee_name || 'Funcionário'}</div>
      <div class="cargo">${t.payee_cargo || ''}</div>
    </div>
  </div>
</body>
</html>`;
}

// =================== RECIBO: PRESTAÇÃO DE SERVIÇOS ===================
function gerarReciboServicos(t: any, formatCurrency: (v: number) => string, localizacao: string) {
  const { dia, mesNome, ano } = parseDateBRT(t.date);
  const valorAbs = Math.abs(t.amount);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Recibo de Prestação de Serviços</title>
  <style>
    @page { size: A4; margin: 30mm 25mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; font-size: 14px; }
    .container { max-width: 700px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 18px; font-weight: 700; letter-spacing: 1px; margin: 0 0 15px 0; text-transform: uppercase; }
    .header img { height: 50px; margin-bottom: 15px; }
    .header-info { display: flex; justify-content: space-between; font-size: 13px; color: #555; margin-top: 10px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #444; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 12px; }
    .field { margin-bottom: 6px; }
    .field strong { display: inline-block; min-width: 180px; }
    .texto-legal { font-size: 13px; color: #333; text-align: justify; margin: 25px 0; line-height: 1.7; }
    .historico-box { background: #f5f5f5; padding: 15px 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin: 15px 0; font-size: 14px; min-height: 60px; }
    .highlight { background: #f5f5f5; padding: 15px 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin: 15px 0; }
    .highlight .valor { font-size: 22px; font-weight: 700; color: #1a1a1a; }
    .highlight .extenso { font-size: 13px; color: #555; font-style: italic; margin-top: 4px; }
    .data-local { text-align: right; margin: 30px 0 60px 0; font-size: 14px; }
    .assinatura { text-align: center; margin-top: 80px; }
    .assinatura .linha { border-top: 1px solid #1a1a1a; width: 350px; margin: 0 auto 8px auto; }
    .assinatura .nome { font-weight: 600; font-size: 14px; }
    .assinatura .doc { font-size: 12px; color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="/logoAttos.jpeg" alt="Attos" />
      <h1>Recibo de Prestação de Serviços</h1>
      <div class="header-info">
        <span>Nº DO LANÇAMENTO: ${t.id}</span>
        <span>VALOR: ${formatCurrency(valorAbs)}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">1. Identificação do Prestador</div>
      <div class="field"><strong>Nome / Razão Social:</strong> ${t.payee_name || 'Não informado'}</div>
      <div class="field"><strong>CPF / CNPJ:</strong> ${t.payee_document || 'Não informado'}</div>
      <div class="field"><strong>Endereço:</strong> ${t.payee_endereco || 'Não informado'}</div>
    </div>

    <div class="section">
      <div class="section-title">2. Declaração de Recebimento</div>
      <div class="texto-legal">
        Recebi de <strong>ATTOS EMPREENDIMENTOS IMOBILIARIOS SA</strong>, inscrita no CNPJ sob o nº <strong>05.579.210/0001-08</strong>, a importância líquida de:
      </div>
      <div class="highlight">
        <div class="valor">${formatCurrency(valorAbs)}</div>
        <div class="extenso">(${valorPorExtenso(valorAbs)})</div>
      </div>
      <p style="font-size: 13px; color: #333; margin: 15px 0;">Referente aos serviços descritos abaixo:</p>
      <div style="font-size: 13px; font-weight: 600; color: #444; margin-bottom: 8px;">HISTÓRICO DO LANÇAMENTO:</div>
      <div class="historico-box">${t.description || 'Não informado'}</div>
      <div class="texto-legal">
        Pela clareza e exatidão do que acima consta, dou plena, rasa e geral quitação pelo serviço prestado, nada mais tendo a reclamar a qualquer título.
      </div>
    </div>

    <div class="section">
      <div class="section-title">3. Local e Data</div>
      <div class="data-local" style="text-align: left; margin: 10px 0 60px 0;">
        ${localizacao}, ${dia} de ${mesNome} de ${ano}.
      </div>
    </div>

    <div class="assinatura">
      <div class="linha"></div>
      <div class="nome">${t.payee_name || 'Prestador de Serviço'}</div>
      <div class="doc">${t.payee_document ? 'CPF/CNPJ: ' + t.payee_document : ''}</div>
    </div>
  </div>
</body>
</html>`;
}

// =================== RELATÓRIO DO PERÍODO ===================
function gerarRelatorioPeriodo(transactions: any[], balanceData: any, periodLabel: string, formatCurrency: (v: number) => string) {
  const entradas = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const saidas = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
  
  // Agrupar por categoria
  const categorias: Record<string, number> = {};
  const projetos: Record<string, number> = {};
  
  transactions.forEach(t => {
    const cat = t.classification?.name || 'Sem Classificação';
    categorias[cat] = (categorias[cat] || 0) + Math.abs(t.amount);
    
    const proj = t.project?.name || 'Sem Projeto';
    projetos[proj] = (projetos[proj] || 0) + Math.abs(t.amount);
  });
  
  const sortAndMap = (obj: Record<string, number>) => {
    const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    const maxVal = entries[0]?.[1] || 1;
    return entries.map(([name, val]) => {
      const pct = Math.max(1, Math.round((val / maxVal) * 100));
      return `
        <div class="bar-row">
          <div class="bar-label"><span>${name}</span> <span>${formatCurrency(val)}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width: ${pct}%;"></div></div>
        </div>
      `;
    }).join('');
  };

  const trs = transactions.map(t => {
    const data = parseDateBRT(t.date);
    const dateStr = `${data.dia}/${String(data.mesIdx + 1).padStart(2, '0')}/${data.ano}`;
    const cor = t.amount >= 0 ? '#16a34a' : '#ef4444';
    return `
      <tr>
        <td>${dateStr}</td>
        <td>${t.description}</td>
        <td>${t.payee_name || '-'}</td>
        <td style="color: ${cor}; text-align: right; font-weight: 500;">${formatCurrency(t.amount)}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Lançamentos</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.4; font-size: 12px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 15px; }
    .header img { height: 40px; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; font-weight: 700; }
    .header p { margin: 5px 0 0; color: #555; font-size: 13px; }
    
    .summary-grid { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 25px; }
    .summary-box { flex: 1; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; text-align: center; background: #fff; }
    .summary-box .label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; font-weight: 600; }
    .summary-box .val { font-size: 16px; font-weight: bold; color: #111827; }
    .val.green { color: #16a34a; }
    .val.red { color: #ef4444; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; text-transform: uppercase; color: #4b5563; }
    tr:nth-child(even) { background: #f9fafb; }
    
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; page-break-inside: avoid; }
    .chart-container { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; background: #fff; }
    .chart-title { font-weight: 600; font-size: 13px; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; color: #374151; }
    
    .bar-row { margin-bottom: 12px; font-size: 11px; }
    .bar-label { display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: 500; color: #4b5563; }
    .bar-track { height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; width: 100%; }
    .bar-fill { height: 100%; background: #374151; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <img src="/logoAttos.jpeg" alt="Logo" />
    <h1>Relatório de Lançamentos</h1>
    <p>Período: ${periodLabel}</p>
  </div>
  
  <div class="summary-grid">
    <div class="summary-box">
      <div class="label">Saldo Inicial</div>
      <div class="val">${formatCurrency(balanceData?.initialBalance || 0)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Entradas</div>
      <div class="val green">${formatCurrency(entradas)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Saídas</div>
      <div class="val red">${formatCurrency(saidas)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Saldo Final</div>
      <div class="val">${formatCurrency(balanceData?.finalBalance || 0)}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 80px;">Data</th>
        <th>Histórico / Descrição</th>
        <th>Favorecido</th>
        <th style="width: 100px; text-align: right;">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${trs.length ? trs : '<tr><td colspan="4" style="text-align:center; padding: 20px;">Nenhum lançamento no período</td></tr>'}
    </tbody>
  </table>
  
  <div class="charts-grid">
    <div class="chart-container">
      <div class="chart-title">Totais por Classificação</div>
      ${sortAndMap(categorias) || '<div style="color: #999; text-align:center; padding:10px;">Sem dados</div>'}
    </div>
    <div class="chart-container">
      <div class="chart-title">Totais por Projeto</div>
      ${sortAndMap(projetos) || '<div style="color: #999; text-align:center; padding:10px;">Sem dados</div>'}
    </div>
  </div>
</body>
</html>`;
}

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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payees, setPayees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [balanceData, setBalanceData] = useState<any>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Estados para o Relatório
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportScope, setReportScope] = useState<'filtered' | 'complete'>('filtered');
  
  // Estados para os filtros
  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [filterPayee, setFilterPayee] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterClassification, setFilterClassification] = useState('');
  const [filterAmount, setFilterAmount] = useState('');

  
  // Estado para o seletor de tipo de recibo
  const [receiptSelectorTransaction, setReceiptSelectorTransaction] = useState<any | null>(null);

  const [localizacao, setLocalizacao] = useState('Brasília - DF');

  useEffect(() => {
    // Buscar localização por IP para preencher a cidade/UF no recibo
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.region_code && CAPITAIS_BR[data.region_code]) {
          setLocalizacao(`${CAPITAIS_BR[data.region_code]} - ${data.region_code}`);
        }
      })
      .catch(err => console.error('Erro ao buscar localização:', err));
  }, []);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense',
    amount: '',
    payee_id: '',
    project_id: '',
    classification_id: '',
    description: ''
  });

  const periodStr = viewMode === 'month' ? format(currentDate, 'yyyy-MM') : format(currentDate, 'yyyy');

  useEffect(() => {
    fetchData();
    getPayees().then(setPayees);
    getProjects().then(setProjects);
    getClassifications().then(setClassifications);
  }, [periodStr]);

  const fetchData = async () => {
    const [txns, balance] = await Promise.all([
      getTransactions(periodStr),
      getBalance(periodStr)
    ]);
    setTransactions(txns);
    setBalanceData(balance);
  };

  const handlePrev = () => {
    setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subYears(currentDate, 1));
  };
  
  const handleNext = () => {
    setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addYears(currentDate, 1));
  };

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
      description: formData.description
    };

    if (editingId) {
      await updateTransaction(editingId, payload);
    } else {
      await createTransaction(payload);
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ ...formData, amount: '', description: '', payee_id: '', project_id: '', classification_id: '' });
    fetchData();
  };

  const handleEdit = (t: any) => {
    setFormData({
      date: t.date,
      type: t.amount < 0 ? 'expense' : 'income',
      amount: maskCurrency(Math.abs(t.amount).toFixed(2).replace('.', '')),
      payee_id: t.payee_id?.toString() || '',
      project_id: t.project_id?.toString() || '',
      classification_id: t.classification_id?.toString() || '',
      description: t.description
    });
    setEditingId(t.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      await deleteTransaction(id);
      fetchData();
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handlePrintReceipt = (type: 'salario' | 'servicos') => {
    if (!receiptSelectorTransaction) return;
    const t = receiptSelectorTransaction;
    const html = type === 'salario' 
      ? gerarReciboSalario(t, formatCurrency, localizacao) 
      : gerarReciboServicos(t, formatCurrency, localizacao);

    const win = window.open('', '', 'width=800,height=900');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 600);
    }
    setReceiptSelectorTransaction(null);
  };

  const executePrintBrowser = () => {
    const dataToPrint = reportScope === 'filtered' ? filteredTransactions : transactions;
    const periodLabel = viewMode === 'month' 
      ? format(currentDate, 'MMMM yyyy', { locale: ptBR }) 
      : format(currentDate, 'yyyy');
    
    const html = gerarRelatorioPeriodo(dataToPrint, balanceData, periodLabel.toUpperCase(), formatCurrency);
    const win = window.open('', '', 'width=900,height=900');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 800);
    }
    setIsReportModalOpen(false);
  };

  const executeExportPDF = () => {
    const dataToExport = reportScope === 'filtered' ? filteredTransactions : transactions;
    const doc = new jsPDF();
    
    const periodLabel = viewMode === 'month' 
      ? format(currentDate, 'MMMM yyyy', { locale: ptBR }) 
      : format(currentDate, 'yyyy');
      
    doc.setFontSize(16);
    doc.text('Relatório de Lançamentos', 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Período: ${periodLabel.toUpperCase()}`, 14, 28);
    
    const tableData = dataToExport.map(t => [
      format(parseISO(t.date), 'dd/MM/yyyy'),
      t.description,
      t.payee_name || '-',
      t.project_name || '-',
      t.classification_name || '-',
      formatCurrency(Math.abs(t.amount))
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Data', 'Histórico', 'Favorecido', 'Projeto', 'Classificação', 'Valor']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 9 },
      columnStyles: {
        5: { halign: 'right' }
      }
    });

    doc.save(`relatorio_lancamentos_${periodLabel.replace(' ', '_')}.pdf`);
    setIsReportModalOpen(false);
  };

  const filteredTransactions = transactions.filter(t => {
    let match = true;
    if (filterDay || filterMonth || filterYear) {
      const [y, m, d] = t.date.split('-');
      if (filterYear && filterYear !== y) match = false;
      if (filterMonth && filterMonth !== m) match = false;
      if (filterDay && filterDay !== d) match = false;
    }
    if (filterDescription && !t.description.toLowerCase().includes(filterDescription.toLowerCase())) match = false;
    if (filterPayee) {
      const payeeName = t.payee_name || '';
      if (!payeeName.toLowerCase().includes(filterPayee.toLowerCase())) match = false;
    }
    if (filterProject) {
      const projectName = t.project_name || '';
      if (!projectName.toLowerCase().includes(filterProject.toLowerCase())) match = false;
    }
    if (filterClassification) {
      const className = t.classification_name || '';
      if (!className.toLowerCase().includes(filterClassification.toLowerCase())) match = false;
    }
    if (filterAmount) {
      const amountStr = Math.abs(t.amount).toString();
      const formattedAmount = formatCurrency(Math.abs(t.amount)).replace(/[R$\s]/g, '');
      if (!amountStr.includes(filterAmount) && !formattedAmount.includes(filterAmount)) match = false;
    }
    return match;
  });

  const clearFilters = () => {
    setFilterDay('');
    setFilterMonth('');
    setFilterYear('');
    setFilterDescription('');
    setFilterPayee('');
    setFilterProject('');
    setFilterClassification('');
    setFilterAmount('');
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
            <button onClick={handlePrev} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-neutral-700 min-w-[120px] text-center capitalize">
              {viewMode === 'month' ? format(currentDate, 'MMMM yyyy', { locale: ptBR }) : format(currentDate, 'yyyy')}
            </span>
            <button onClick={handleNext} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600">
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
              setFormData({ ...formData, amount: '', description: '', payee_id: '', project_id: '', classification_id: '' });
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
          <span className="text-xl font-bold text-neutral-900">{formatCurrency(balanceData?.initialBalance || 0)}</span>
        </div>
        <div className="bg-neutral-900 p-4 rounded-xl shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-800 rounded-lg text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-neutral-400 font-medium">Saldo Final do Período</span>
          </div>
          <span className="text-xl font-bold text-white">{formatCurrency(balanceData?.finalBalance || 0)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-sm">
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Histórico</th>
                <th className="p-4 font-medium">Favorecido</th>
                <th className="p-4 font-medium">Projeto</th>
                <th className="p-4 font-medium">Classificação</th>
                <th className="p-4 font-medium text-right">Valor</th>
                <th className="p-4 font-medium w-32 text-right">Ações</th>
              </tr>
              {/* Filtros Dinâmicos (Bootstrap like) */}
              <tr className="bg-white border-b border-neutral-200 text-sm">
                <th className="p-2">
                  <div className="flex gap-1 justify-center">
                    <select className="form-select text-xs border border-neutral-300 rounded px-1 py-1 bg-white outline-none focus:border-neutral-400" value={filterDay} onChange={e => setFilterDay(e.target.value)}>
                      <option value="">Dia</option>
                      {Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select className="form-select text-xs border border-neutral-300 rounded px-1 py-1 bg-white outline-none focus:border-neutral-400" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                      <option value="">Mês</option>
                      {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select className="form-select text-xs border border-neutral-300 rounded px-1 py-1 bg-white outline-none focus:border-neutral-400" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                      <option value="">Ano</option>
                      {Array.from({length: 10}, (_, i) => String(new Date().getFullYear() - 5 + i)).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </th>
                <th className="p-2">
                  <input type="text" className="form-control text-xs font-normal border border-neutral-300 rounded px-2 py-1 w-full outline-none focus:border-neutral-400" placeholder="Filtrar histórico..." value={filterDescription} onChange={e => setFilterDescription(e.target.value)} />
                </th>
                <th className="p-2">
                  <input type="text" className="form-control text-xs font-normal border border-neutral-300 rounded px-2 py-1 w-full outline-none focus:border-neutral-400" placeholder="Filtrar favorecido..." value={filterPayee} onChange={e => setFilterPayee(e.target.value)} />
                </th>
                <th className="p-2">
                  <input type="text" className="form-control text-xs font-normal border border-neutral-300 rounded px-2 py-1 w-full outline-none focus:border-neutral-400" placeholder="Filtrar projeto..." value={filterProject} onChange={e => setFilterProject(e.target.value)} />
                </th>
                <th className="p-2">
                  <input type="text" className="form-control text-xs font-normal border border-neutral-300 rounded px-2 py-1 w-full outline-none focus:border-neutral-400" placeholder="Filtrar cla..." value={filterClassification} onChange={e => setFilterClassification(e.target.value)} />
                </th>
                <th className="p-2">
                  <div className="flex justify-end">
                    <input type="text" className="form-control text-xs font-normal border border-neutral-300 rounded px-2 py-1 w-20 text-right outline-none focus:border-neutral-400" placeholder="Valor..." value={filterAmount} onChange={e => setFilterAmount(e.target.value)} />
                  </div>
                </th>
                <th className="p-2 text-right">
                  <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800 font-medium underline px-2 py-1" title="Limpar Filtros">
                    Limpar
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    Nenhum lançamento encontrado para os filtros aplicados neste período.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="p-4 text-neutral-600 whitespace-nowrap">
                      {format(parseISO(t.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4 text-neutral-900 font-medium">{t.description}</td>
                    <td className="p-4 text-neutral-600">{t.payee_name || '-'}</td>
                    <td className="p-4 text-neutral-600">
                      {t.project_name ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                          {t.project_name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-neutral-600">
                      {t.classification_name ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-200 text-neutral-800 border border-neutral-300">
                          {t.classification_name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className={`p-4 text-right font-medium ${t.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(t.amount)}
                    </td>
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
              <button onClick={() => setReceiptSelectorTransaction(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-neutral-500 mb-4">
                Lançamento: <strong className="text-neutral-800">{receiptSelectorTransaction.description}</strong>
                <br />
                Valor: <strong className="text-neutral-800">{formatCurrency(Math.abs(receiptSelectorTransaction.amount))}</strong>
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
                  <p className="text-sm text-neutral-500">Recibo para pagamento de funcionários CLT</p>
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
                  <p className="text-sm text-neutral-500">Recibo para serviços prestados por terceiros</p>
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
              <button onClick={() => setIsReportModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-3">Escopo dos Dados</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                    <input type="radio" name="reportScope" className="form-check-input w-4 h-4 text-neutral-900 focus:ring-neutral-900" 
                      checked={reportScope === 'filtered'} onChange={() => setReportScope('filtered')} />
                    <div>
                      <span className="block text-sm font-medium text-neutral-900">Dados Filtrados</span>
                      <span className="block text-xs text-neutral-500">Apenas o que está visível na tabela ({filteredTransactions.length})</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                    <input type="radio" name="reportScope" className="form-check-input w-4 h-4 text-neutral-900 focus:ring-neutral-900" 
                      checked={reportScope === 'complete'} onChange={() => setReportScope('complete')} />
                    <div>
                      <span className="block text-sm font-medium text-neutral-900">Relatório Completo</span>
                      <span className="block text-xs text-neutral-500">Base total do período atual ({transactions.length})</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-neutral-100 flex flex-col sm:flex-row gap-3">
              <button onClick={executeExportPDF} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors shadow-sm order-2 sm:order-1">
                <FileText className="w-5 h-5" /> PDF (jsPDF)
              </button>
              <button onClick={executePrintBrowser} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl font-medium transition-colors shadow-sm order-1 sm:order-2">
                <Printer className="w-5 h-5" /> Browser
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
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none">
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Data</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Valor (R$)</label>
                  <input type="text" required value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: maskCurrency(e.target.value)})}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none" placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Histórico</label>
                  <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none" placeholder="Descrição do lançamento" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Favorecido</label>
                  <select value={formData.payee_id} onChange={e => setFormData({...formData, payee_id: e.target.value})}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none">
                    <option value="">Selecione...</option>
                    {payees.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Projeto</label>
                  <select value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none">
                    <option value="">Selecione...</option>
                    {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Classificação</label>
                  <select value={formData.classification_id} onChange={e => setFormData({...formData, classification_id: e.target.value})}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none">
                    <option value="">Selecione...</option>
                    {classifications.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-200 rounded-xl font-medium transition-colors">Cancelar</button>
              <button type="submit" form="transaction-form" className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors shadow-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
