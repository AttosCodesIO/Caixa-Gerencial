import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { requireUser } from '../_lib/auth.js';
import { consultarSaldoBancario } from '../_lib/saldoBancario.js';

interface Body {
  dataBase?: string;
  conta?: string;
  filial?: string;
}

// POST /api/relatorios/saldo-bancario/dados
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

  const body = (req.body ?? {}) as Body;
  if (!body.dataBase) {
    res.status(400).json({ error: 'Campo obrigatório ausente: dataBase.' });
    return;
  }
  if (!body.filial) {
    res.status(400).json({ error: 'Campo obrigatório ausente: filial.' });
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dataBase)) {
    res.status(400).json({ error: 'dataBase inválida.' });
    return;
  }

  const filial = Number(body.filial);
  if (Number.isNaN(filial)) {
    res.status(400).json({ error: 'Campo filial inválido.' });
    return;
  }

  const todasContas = !body.conta || body.conta === 'TODAS';
  const conta = todasContas ? null : Number(body.conta);
  if (conta !== null && Number.isNaN(conta)) {
    res.status(400).json({ error: 'Campo conta inválido.' });
    return;
  }

  try {
    const linhas = await consultarSaldoBancario({ filial, dataBase: body.dataBase, conta });

    res.status(200).json({
      linhas,
      quantidade: linhas.length,
      geradoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[relatorios/saldo-bancario/dados]', error);
    res.status(502).json({ error: 'Falha ao consultar o relatório no Oracle.' });
  }
}
