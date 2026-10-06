import type { ApiRequest, ApiResponse } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';
import { consultarRelatorioExecutivo } from './_lib/relatorioExecutivo.js';

const REQUIRED_FIELDS = [
  'filial',
  'dataInicio',
  'dataFim',
  'projetoInicio',
  'projetoFim',
  'agenteInicio',
  'agenteFim',
  'classeInicio',
  'classeFim',
  'centroCustoInicio',
  'centroCustoFim',
] as const;

type Body = Record<(typeof REQUIRED_FIELDS)[number], string>;

// AAAA-MM-DD de uma data de calendário real (rejeita, p.ex., 2026-02-31).
function isDataIsoValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

// POST /api/relatorios/dados — espelha POST /api/relatorio do Apêndice A.2.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  const body = (req.body ?? {}) as Partial<Body>;
  const missing = REQUIRED_FIELDS.filter((field) => !body[field] && body[field] !== '0');
  if (missing.length > 0) {
    res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(', ')}` });
    return;
  }

  const numericFields = {
    filial: Number(body.filial),
    projetoInicio: Number(body.projetoInicio),
    projetoFim: Number(body.projetoFim),
    agenteInicio: Number(body.agenteInicio),
    agenteFim: Number(body.agenteFim),
    classeInicio: Number(body.classeInicio),
    classeFim: Number(body.classeFim),
    centroCustoInicio: Number(body.centroCustoInicio),
    centroCustoFim: Number(body.centroCustoFim),
  };
  const invalidNumeric = Object.entries(numericFields).filter(([, v]) => Number.isNaN(v));
  if (invalidNumeric.length > 0) {
    res.status(400).json({
      error: `Campos numéricos inválidos: ${invalidNumeric.map(([k]) => k).join(', ')}`,
    });
    return;
  }

  const dataInicio = String(body.dataInicio);
  const dataFim = String(body.dataFim);
  if (!isDataIsoValida(dataInicio) || !isDataIsoValida(dataFim)) {
    res.status(400).json({ error: 'dataInicio/dataFim inválidas.' });
    return;
  }
  if (dataInicio > dataFim) {
    res.status(400).json({ error: 'dataInicio deve ser menor ou igual a dataFim.' });
    return;
  }

  try {
    const linhas = await consultarRelatorioExecutivo({ ...numericFields, dataInicio, dataFim });
    const total = linhas.reduce((sum, l) => sum + l.valor, 0);

    res.status(200).json({
      linhas,
      total,
      quantidade: linhas.length,
      geradoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[relatorios/dados]', error);
    res.status(502).json({ error: 'Falha ao consultar o relatório no Oracle.' });
  }
}
