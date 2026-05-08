import { valorPorExtenso } from '../lib/valorPorExtenso';
import { Transaction } from '../types';

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

// Extrai dia/mês/ano da string YYYY-MM-DD sem depender do fuso do navegador
// Garante que a data exibida é sempre a data registrada (fuso Brasília-DF)
export function parseDateBRT(dateStr: string) {
  const [ano, mes, dia] = dateStr.split('-');
  return { dia, mesIdx: parseInt(mes, 10) - 1, mesNome: MESES[parseInt(mes, 10) - 1], ano };
}

// =================== RECIBO: PAGAMENTO DE SALÁRIO ===================
export function gerarReciboSalario(
  t: Transaction,
  formatCurrency: (v: number) => string,
  localizacao: string,
) {
  const { dia, mesIdx, mesNome, ano } = parseDateBRT(t.date);
  const valorAbs = Math.abs(t.amount);

  // Referência = mês anterior ao lançamento (nunca o mês atual)
  const refMesIdx = mesIdx === 0 ? 11 : mesIdx - 1;
  const refAno = mesIdx === 0 ? String(parseInt(ano, 10) - 1) : ano;
  const refMesNome = MESES[refMesIdx];

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
    .header img { height: 50px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto; }
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
      <div class="field"><strong>Referente ao mês/ano:</strong> ${refMesNome} / ${refAno}</div>
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
export function gerarReciboServicos(
  t: Transaction,
  formatCurrency: (v: number) => string,
  localizacao: string,
) {
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
export function gerarRelatorioPeriodo(
  transactions: Transaction[],
  balanceData: Record<string, unknown>,
  periodLabel: string,
  formatCurrency: (v: number) => string,
) {
  // Filtro de Entradas e Saídas para o resumo
  const entradas = transactions.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const saidas = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const trs = transactions
    .map((t) => {
      const data = parseDateBRT(t.date);
      const dateStr = `${data.dia}/${String(data.mesIdx + 1).padStart(2, '0')}/${data.ano}`;
      const isNegative = t.amount < 0;
      const cor = isNegative ? '#ef4444' : '#16a34a';
      const formattedValue = isNegative
        ? `-R$ ${Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      return `
      <tr>
        <td style="white-space: nowrap;">${dateStr}</td>
        <td>${t.payee_name || '-'}</td>
        <td>${t.project_name || '-'}</td>
        <td style="color: ${cor}; text-align: right; font-weight: 500; white-space: nowrap;">${formattedValue}</td>
        <td>${t.description}</td>
      </tr>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Lançamentos</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 11px; margin: 0; }
    .page-container { max-width: 900px; margin: 0 auto; background: #fff; }
    
    .header { text-align: center; margin-bottom: 25px; padding-bottom: 10px; }
    .header img { height: 60px; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 800; color: #000; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 500; }
    
    .divider { border-bottom: 3px solid #000; margin-bottom: 30px; }

    .summary-grid { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 35px; }
    .summary-box { flex: 1; border: 1px solid #e2e8f0; padding: 15px 10px; border-radius: 12px; text-align: center; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .summary-box .label { font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 10px; font-weight: 700; letter-spacing: 0.5px; }
    .summary-box .val { font-size: 18px; font-weight: 800; color: #0f172a; }
    .val.green { color: #16a34a; }
    .val.red { color: #ef4444; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 10.5px; border: 1px solid #f1f5f9; }
    thead th { background: #f8fafc; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; padding: 12px 14px; text-align: left; }
    tbody td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tbody tr:last-child td { border-bottom: none; }
    
    .footer { margin-top: 40px; text-align: right; color: #94a3b8; font-size: 9px; }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header">
      <img src="/logoAttos.jpeg" alt="Logo" style="display: block; margin-left: auto; margin-right: auto; height: 60px; margin-bottom: 15px;" />
      <h1>Relatório de Lançamentos</h1>
      <p>Período: ${periodLabel}</p>
    </div>

    <div class="divider"></div>
    
    <div class="summary-grid">
      <div class="summary-box">
        <div class="label">Saldo Inicial</div>
        <div class="val">${formatCurrency((balanceData?.initialBalance as number) || 0)}</div>
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
        <div class="val">${formatCurrency((balanceData?.finalBalance as number) || 0)}</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th style="width: 80px;">Data</th>
          <th style="width: 180px;">Favorecido</th>
          <th style="width: 180px;">Projeto</th>
          <th style="width: 110px; text-align: right;">Valor</th>
          <th>Histórico / Descrição</th>
        </tr>
      </thead>
      <tbody>
        ${trs.length ? trs : '<tr><td colspan="5" style="text-align:center; padding: 30px; color: #94a3b8;">Nenhum lançamento registrado neste período.</td></tr>'}
      </tbody>
    </table>

    <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
  </div>
</body>
</html>`;
}
