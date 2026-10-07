import { useEffect, useRef, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileBarChart, Loader2 } from 'lucide-react';
import { Filial, ParametrosBusca, RelatorioExecutivoPayload, SESSION_STORAGE_KEY } from './types';
import { getFiliais, gerarRelatorio } from './relatoriosApi';

const RANGE_ABERTO_INICIO = '0';
const RANGE_ABERTO_FIM = '99999999999';

const CAMPO_CLASSES =
  'w-full border border-neutral-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none';

type CampoTexto = Exclude<keyof ParametrosBusca, 'filiais'>;

// Até este número de filiais, o cabeçalho do relatório mostra os nomes; acima
// disso mostra só a quantidade, para não estourar o título e a capa.
const MAX_FILIAIS_NO_ROTULO = 3;

function rotuloFiliais(selecionadas: Filial[]): string {
  if (selecionadas.length === 0) return '—';
  if (selecionadas.length > MAX_FILIAIS_NO_ROTULO) {
    return `${selecionadas.length} filiais selecionadas`;
  }
  return selecionadas.map((f) => toTitleCase(f.nome)).join(' · ');
}

// Texto do campo fechado: o nome quando há uma só filial marcada, a
// quantidade quando há várias.
function resumoSelecao(selecionadas: Filial[]): string {
  if (selecionadas.length === 0) return 'Selecione as filiais';
  if (selecionadas.length === 1) return toTitleCase(selecionadas[0].nome);
  return `${selecionadas.length} filiais selecionadas`;
}

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
  const [filiaisAberto, setFiliaisAberto] = useState(false);
  const filiaisRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<ParametrosBusca>({
    filiais: [],
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
          setForm((prev) => ({
            ...prev,
            filiais: prev.filiais.length > 0 ? prev.filiais : [lista[0].codigo],
          }));
        }
      })
      .catch(() => setErroFiliais('Não foi possível carregar as filiais do Oracle.'))
      .finally(() => setLoadingFiliais(false));
  }, []);

  useEffect(() => {
    if (!filiaisAberto) return;
    const aoClicarFora = (e: MouseEvent) => {
      if (!filiaisRef.current?.contains(e.target as Node)) setFiliaisAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiliaisAberto(false);
    };
    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [filiaisAberto]);

  const handleChange = (campo: CampoTexto, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const toggleFilial = (codigo: string) => {
    setForm((prev) => ({
      ...prev,
      filiais: prev.filiais.includes(codigo)
        ? prev.filiais.filter((c) => c !== codigo)
        : [...prev.filiais, codigo],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErroGerar(null);
    if (form.filiais.length === 0) {
      setErroGerar('Selecione ao menos uma filial.');
      return;
    }
    setGerando(true);
    try {
      const resultado = await gerarRelatorio(form);
      // Na ordem da lista (código da filial), não na ordem dos cliques.
      const selecionadas = filiais.filter((f) => form.filiais.includes(f.codigo));
      const empresa = rotuloFiliais(selecionadas);

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
          <div ref={filiaisRef} className="relative">
            <label id="filiais-label" className="block text-sm font-medium text-neutral-700 mb-1">
              Filiais
            </label>
            <button
              type="button"
              aria-labelledby="filiais-label"
              aria-haspopup="true"
              aria-expanded={filiaisAberto}
              disabled={loadingFiliais || filiais.length === 0}
              onClick={() => setFiliaisAberto((v) => !v)}
              className={`${CAMPO_CLASSES} flex items-center justify-between gap-2 text-left bg-white disabled:opacity-50`}
            >
              <span className={`truncate ${form.filiais.length === 0 ? 'text-neutral-400' : ''}`}>
                {loadingFiliais
                  ? 'Carregando...'
                  : filiais.length === 0
                    ? 'Nenhuma filial'
                    : resumoSelecao(filiais.filter((f) => form.filiais.includes(f.codigo)))}
              </span>
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-neutral-500" />
            </button>
            {filiaisAberto && (
              <div className="absolute z-10 mt-1 w-full md:w-[28rem] max-w-[calc(100vw-4rem)] bg-white border border-neutral-300 rounded-xl shadow-lg px-3 py-2 max-h-64 overflow-y-auto">
                {filiais.map((f) => (
                  <label
                    key={f.codigo}
                    className="flex items-center gap-2 py-1 text-sm text-neutral-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.filiais.includes(f.codigo)}
                      onChange={() => toggleFilial(f.codigo)}
                      className="w-4 h-4 accent-neutral-900"
                    />
                    {toTitleCase(f.nome)}
                  </label>
                ))}
              </div>
            )}
            {erroFiliais && <p className="text-xs text-red-600 mt-1">{erroFiliais}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Data Início</label>
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
                ] as [CampoTexto, CampoTexto, string][]
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
