import { supabase } from '../../lib/supabase';
import { Filial, Linha, ParametrosBusca } from './types';

async function authHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export async function getFiliais(): Promise<Filial[]> {
  const res = await fetch('/api/relatorios/filiais', { headers: await authHeaders() });
  if (!res.ok) throw new Error('Falha ao carregar filiais.');
  const data = await res.json();
  return data.filiais as Filial[];
}

interface RelatorioResponse {
  linhas: Linha[];
  total: number;
  quantidade: number;
  geradoEm: string;
}

export async function gerarRelatorio(params: ParametrosBusca): Promise<RelatorioResponse> {
  const res = await fetch('/api/relatorios/dados', {
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
