import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Printer, Wallet, Landmark, Scale } from 'lucide-react';
import '../print.css';
import {
  RelatorioSaldoBancarioPayload,
  SESSION_STORAGE_KEY_SALDO_BANCARIO,
  TODAS_CONTAS,
} from './types';
import { brl } from '../format';
import SaldoBancarioTable from './components/SaldoBancarioTable';
import SaldoBancarioTableImpressao from './components/SaldoBancarioTableImpressao';

function lerPayload(): RelatorioSaldoBancarioPayload | null {
  try {
    const bruto = sessionStorage.getItem(SESSION_STORAGE_KEY_SALDO_BANCARIO);
    if (!bruto) return null;
    const raw = JSON.parse(bruto) as RelatorioSaldoBancarioPayload;
    if (!raw || !Array.isArray(raw.linhas)) return null;
    return raw;
  } catch {
    return null;
  }
}

export default function RelatorioSaldoBancario() {
  const [raw] = useState<RelatorioSaldoBancarioPayload | null>(() => lerPayload());

  const linhas = useMemo(() => raw?.linhas ?? [], [raw]);

  const { saldoRealTotal, saldoExtratoTotal, quantidade } = useMemo(() => {
    const saldoRealTotal = linhas.reduce((sum, l) => sum + l.saldoReal, 0);
    const saldoExtratoTotal = linhas.reduce((sum, l) => sum + l.saldoExtrato, 0);
    return { saldoRealTotal, saldoExtratoTotal, quantidade: linhas.length };
  }, [linhas]);

  const backLink = '/relatorios/saldo-bancario';

  if (!raw) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <h1 className="text-xl font-bold text-neutral-900">Nenhum relatório carregado</h1>
        <p className="text-neutral-500">
          Gere um novo relatório na tela de parâmetros para visualizar os dados aqui.
        </p>
        <Link
          to={backLink}
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Novos parâmetros
        </Link>
      </div>
    );
  }

  const dataBaseLabel = format(parseISO(raw.dataBase), 'dd/MM/yyyy');
  const contaLabel = !raw.conta || raw.conta === TODAS_CONTAS ? 'Todas as contas' : `Conta ${raw.conta}`;
  const empresa = raw.empresa || '—';
  const geradoEm = raw.geradoEm ? parseISO(raw.geradoEm) : new Date();
  const geradoEmLabel = format(geradoEm, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <div className="rel-report-page space-y-6">
      {/* Capa — somente impressão */}
      <div className="rel-print-only rel-print-cover">
        <img src="/logoAttos.jpeg" alt="Attos" className="rel-cover-logo" />
        <h1 className="rel-cover-title">Relatório de Saldo Bancário</h1>
        <div className="rel-cover-divider" />
        <p className="rel-cover-sub">{empresa}</p>
        <p className="rel-cover-sub">{contaLabel}</p>
        <p className="rel-cover-sub">Data Base: {dataBaseLabel}</p>
        <p className="rel-cover-footer">Gerado em {geradoEmLabel} · Uso interno</p>
      </div>

      {/* Hero — somente tela */}
      <div className="rel-print-hide space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={backLink}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Novos parâmetros
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Printer className="w-5 h-5" /> Exportar
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Relatório de Saldo Bancário</h1>
          <p className="text-neutral-500 mt-1">
            {empresa} · {contaLabel} · Data Base: {dataBaseLabel}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-500">Saldo Extrato Total</p>
              <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900 mt-4">{brl(saldoExtratoTotal)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-500">Contas Financeiras</p>
              <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                <Landmark className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900 mt-4">{quantidade}</p>
          </div>
          <div className="bg-neutral-900 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-400">Saldo Real Total</p>
              <div className="p-2 bg-neutral-800 rounded-lg text-white">
                <Scale className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-4">{brl(saldoRealTotal)}</p>
          </div>
        </div>
      </div>

      <div className="rel-print-hide">
        <SaldoBancarioTable linhas={linhas} />
      </div>

      <div className="rel-print-only">
        <SaldoBancarioTableImpressao linhas={linhas} />
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 rel-print-hide">
        <span>Gerado em {geradoEmLabel}</span>
      </div>
    </div>
  );
}
