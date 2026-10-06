import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileBarChart, Loader2 } from 'lucide-react';
import { Filial, ParametrosBusca, RelatorioExecutivoPayload, SESSION_STORAGE_KEY } from './types';
import { getFiliais, gerarRelatorio } from './relatoriosApi';

const RANGE_ABERTO_INICIO = '0';
const RANGE_ABERTO_FIM = '99999999999';

const CAMPO_CLASSES =
  'w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none';

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/(^|\s)([a-zà-úãõâêîôûáéíóúç])/gi, (m) => m.toUpperCase());
}

export default function ParametrosRelatorio() {
  const navigate = useNavigate();
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loadingFiliais, setLoadingFiliais] = useState(true);
  const [erroFiliais, setErroFiliais] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erroGerar, setErroGerar] = useState<string | null>(null);
  const [avancadoAberto, setAvancadoAberto] = useState(false);

  const [form, setForm] = useState<ParametrosBusca>({
    filial: '',
    dataInicio: '',
    dataFim: '',
    projetoInicio: RANGE_ABERTO_INICIO,
    projetoFim: RANGE_ABERTO_FIM,
    agenteInicio: RANGE_ABERTO_INICIO,
    agenteFim: RANGE_ABERTO_FIM,
    classeInicio: RANGE_ABERTO_INICIO,
    classeFim: RANGE_ABERTO_FIM,
    centroCustoInicio: RANGE_ABERTO_INICIO,
    centroCustoFim: RANGE_ABERTO_FIM,
  });

  useEffect(() => {
    getFiliais()
      .then((lista) => {
        setFiliais(lista);
        if (lista.length > 0) {
          setForm((prev) => ({ ...prev, filial: prev.filial || lista[0].codigo }));
        }
      })
      .catch(() => setErroFiliais('Não foi possível carregar as filiais do Oracle.'))
      .finally(() => setLoadingFiliais(false));
  }, []);

  const handleChange = (campo: keyof ParametrosBusca, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErroGerar(null);
    setGerando(true);
    try {
      const resultado = await gerarRelatorio(form);
      const filialSelecionada = filiais.find((f) => f.codigo === form.filial);
      const empresa = filialSelecionada ? toTitleCase(filialSelecionada.nome) : '—';

      const payload: RelatorioExecutivoPayload = {
        linhas: resultado.linhas,
        empresa,
        parametro: empresa,
        geradoEm: resultado.geradoEm,
        origem: 'oracle',
      };

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
      navigate('/relatorios/executivo');
    } catch (error) {
      setErroGerar(error instanceof Error ? error.message : 'Falha ao gerar o relatório.');
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Relatório Financeiro por Projeto</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Filial</label>
            <select
              required
              disabled={loadingFiliais || filiais.length === 0}
              value={form.filial}
              onChange={(e) => handleChange('filial', e.target.value)}
              className={CAMPO_CLASSES}
            >
              {loadingFiliais && <option value="">Carregando...</option>}
              {!loadingFiliais && filiais.length === 0 && <option value="">Nenhuma filial</option>}
              {filiais.map((f) => (
                <option key={f.codigo} value={f.codigo}>
                  {toTitleCase(f.nome)}
                </option>
              ))}
            </select>
            {erroFiliais && <p className="text-xs text-red-600 mt-1">{erroFiliais}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              required
              value={form.dataInicio}
              onChange={(e) => handleChange('dataInicio', e.target.value)}
              className={CAMPO_CLASSES}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Data Fim</label>
            <input
              type="date"
              required
              value={form.dataFim}
              onChange={(e) => handleChange('dataFim', e.target.value)}
              className={CAMPO_CLASSES}
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setAvancadoAberto((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            {avancadoAberto ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Filtros avançados (faixas de código)
          </button>

          {avancadoAberto && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-100">
              {(
                [
                  ['projetoInicio', 'projetoFim', 'Projeto'],
                  ['agenteInicio', 'agenteFim', 'Agente'],
                  ['classeInicio', 'classeFim', 'Classe Financeira'],
                  ['centroCustoInicio', 'centroCustoFim', 'Centro de Custo'],
                ] as [keyof ParametrosBusca, keyof ParametrosBusca, string][]
              ).map(([campoInicio, campoFim, label]) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {label} (código)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form[campoInicio]}
                      onChange={(e) => handleChange(campoInicio, e.target.value)}
                      className={CAMPO_CLASSES}
                      placeholder="Início"
                    />
                    <span className="text-neutral-400 text-sm">–</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form[campoFim]}
                      onChange={(e) => handleChange(campoFim, e.target.value)}
                      className={CAMPO_CLASSES}
                      placeholder="Fim"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <FileBarChart className="w-5 h-5" />
            )}
            {gerando ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>
      </form>
    </div>
  );
}
