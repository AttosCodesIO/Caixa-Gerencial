import type { ApiRequest, ApiResponse } from './_lib/http.js';
import { requireUser } from './_lib/auth.js';
import { fetchFiliais } from './_lib/resolveFiliais.js';

// GET /api/relatorios/filiais — espelha o endpoint GET /api/filiais do Apêndice A.1.
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  try {
    const filiais = await fetchFiliais();
    res.status(200).json({
      filiais: filiais.map((f) => ({ codigo: String(f.codigo), nome: f.nome })),
    });
  } catch (error) {
    console.error('[relatorios/filiais]', error);
    res.status(502).json({ error: 'Falha ao consultar filiais no Oracle.' });
  }
}
