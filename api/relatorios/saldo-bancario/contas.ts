import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { requireUser } from '../_lib/auth.js';
import { fetchContasFinanceiras } from '../_lib/contasFinanceiras.js';
import { resolveFiliaisConsolidado } from '../_lib/resolveGrupoConsolidado.js';

// GET /api/relatorios/saldo-bancario/contas?filial=<codigo>
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

  const filialParam = req.query.filial;
  const filial = Number(Array.isArray(filialParam) ? filialParam[0] : filialParam);
  if (!filialParam || Number.isNaN(filial)) {
    res.status(400).json({ error: 'Parâmetro obrigatório ausente ou inválido: filial.' });
    return;
  }

  try {
    const filiaisAlvo = await resolveFiliaisConsolidado(filial);
    const contas = await fetchContasFinanceiras(filiaisAlvo);
    res.status(200).json({
      contas: contas.map((c) => ({ codigo: String(c.codigo), nome: c.nome, banco: c.banco })),
    });
  } catch (error) {
    console.error('[relatorios/saldo-bancario/contas]', error);
    res.status(502).json({ error: 'Falha ao consultar contas financeiras no Oracle.' });
  }
}
