import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, Loader2 } from 'lucide-react';
import { Filial } from '../types';
import { getFiliais } from '../relatoriosApi';
import {
  ContaFinanceira,
  ParametrosSaldoBancario as ParametrosSaldoBancarioType,
  RelatorioSaldoBancarioPayload,
  SESSION_STORAGE_KEY_SALDO_BANCARIO,
  TODAS_CONTAS,
} from './types';
import { getContasFinanceiras, gerarRelatorioSaldoBancario } from './saldoBancarioApi';

const CAMPO_CLASSES =
  'w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none';

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/(^|\s)([a-zà-úãõâêîôûáéíóúç])/gi, (m) => m.toUpperCase());
}

export default function ParametrosSaldoBancario() {
  const navigate = useNavigate();
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loadingFiliais, setLoadingFiliais] = useState(true);
  const [erroFiliais, setErroFiliais] = useState<string | null>(null);

  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [loadingContas, setLoadingContas] = useState(false);
  const [erroContas, setErroContas] = useState<string | null>(null);

  const [gerando, setGerando] = useState(false);
  const [erroGerar, setErroGerar] = useState<string | null>(null);

  const [form, setForm] = useState<ParametrosSaldoBancarioType>({
    filial: '',
    dataBase: new Date().toISOString().slice(0, 10),
    conta: TODAS_CONTAS,
  });

  useEffect(() => {
    getFiliais()
      .then((lista) => {
        setFiliais(lista);
        if (lista.length > 0) {
          setForm((prev) => ({ ...prev, filial: prev.filial || lista[0].codigo }));
        }
      })
      .catch(() => setErroFiliais('Não foi possível carregar as empresas/grupos do Oracle.'))
      .finally(() => setLoadingFiliais(false));
  }, []);

  useEffect(() => {
    if (!form.filial) return;
    setLoadingContas(true);
    setErroContas(null);
    getContasFinanceiras(form.filial)
      .then(setContas)
      .catch(() => setErroContas('Não foi possível carregar as contas financeiras do Oracle.'))
      .finally(() => setLoadingContas(false));
  }, [form.filial]);

  const handleChange = (campo: keyof ParametrosSaldoBancarioType, valor: string) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
      ...(campo === 'filial' ? { conta: TODAS_CONTAS } : {}),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErroGerar(null);
    setGerando(true);
    try {
      const resultado = await gerarRelatorioSaldoBancario(form);
      const filialSelecionada = filiais.find((f) => f.codigo === form.filial);
      const empresa = filialSelecionada ? toTitleCase(filialSelecionada.nome) : '—';

      const payload: RelatorioSaldoBancarioPayload = {
        linhas: resultado.linhas,
        dataBase: form.dataBase,
        empresa,
        conta: form.conta,
        geradoEm: resultado.geradoEm,
      };

      sessionStorage.setItem(SESSION_STORAGE_KEY_SALDO_BANCARIO, JSON.stringify(payload));
      navigate('/relatorios/saldo-bancario/resultado');
    } catch (error) {
      setErroGerar(error instanceof Error ? error.message : 'Falha ao gerar o relatório.');
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Relatório de Saldo Bancário</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Empresa/Grupo
            </label>
            <select
              required
              disabled={loadingFiliais || filiais.length === 0}
              value={form.filial}
              onChange={(e) => handleChange('filial', e.target.value)}
              className={CAMPO_CLASSES}
            >
              {loadingFiliais && <option value="">Carregando...</option>}
              {!loadingFiliais && filiais.length === 0 && <option value="">Nenhuma empresa</option>}
              {filiais.map((f) => (
                <option key={f.codigo} value={f.codigo}>
                  {toTitleCase(f.nome)}
                </option>
              ))}
            </select>
            {erroFiliais && <p className="text-xs text-red-600 mt-1">{erroFiliais}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Data Base</label>
            <input
              type="date"
              required
              value={form.dataBase}
              onChange={(e) => handleChange('dataBase', e.target.value)}
              className={CAMPO_CLASSES}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Conta Financeira
            </label>
            <select
              disabled={loadingContas}
              value={form.conta}
              onChange={(e) => handleChange('conta', e.target.value)}
              className={CAMPO_CLASSES}
            >
              <option value={TODAS_CONTAS}>Todas as contas</option>
              {loadingContas && <option value="">Carregando...</option>}
              {contas.map((c) => (
                <option key={c.codigo} value={c.codigo}>
                  {toTitleCase(c.nome)} — {toTitleCase(c.banco)}
                </option>
              ))}
            </select>
            {erroContas && <p className="text-xs text-red-600 mt-1">{erroContas}</p>}
          </div>
        </div>

        {erroGerar && <p className="text-sm text-red-600">{erroGerar}</p>}

        <div className="flex justify-end pt-2 border-t border-neutral-100">
          <button
            type="submit"
            disabled={gerando || loadingFiliais}
            className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {gerando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Landmark className="w-5 h-5" />
            )}
            {gerando ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>
      </form>
    </div>
  );
}
