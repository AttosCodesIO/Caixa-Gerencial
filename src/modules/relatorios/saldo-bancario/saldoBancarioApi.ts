import { supabase } from '../../../lib/supabase';
import { ContaFinanceira, LinhaSaldoBancario, ParametrosSaldoBancario } from './types';

async function authHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export async function getContasFinanceiras(filial: string): Promise<ContaFinanceira[]> {
  const res = await fetch(
    `/api/relatorios/saldo-bancario/contas?filial=${encodeURIComponent(filial)}`,
    { headers: await authHeaders() },
  );
  if (!res.ok) throw new Error('Falha ao carregar contas financeiras.');
  const data = await res.json();
  return data.contas as ContaFinanceira[];
}

interface RelatorioSaldoBancarioResponse {
  linhas: LinhaSaldoBancario[];
  quantidade: number;
  geradoEm: string;
}

export async function gerarRelatorioSaldoBancario(
  params: ParametrosSaldoBancario,
): Promise<RelatorioSaldoBancarioResponse> {
  const res = await fetch('/api/relatorios/saldo-bancario/dados', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const erro = await res.json().catch(() => ({ error: 'Falha ao gerar o relatório.' }));
    throw new Error(erro.error ?? 'Falha ao gerar o relatório.');
  }
  return res.json();
}
