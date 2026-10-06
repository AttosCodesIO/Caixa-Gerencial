import { createClient } from '@supabase/supabase-js';
import type { ApiRequest } from './http.js';

/**
 * Reautentica a requisição usando o mesmo token de sessão Supabase já usado
 * pelo restante do app (Authorization: Bearer <access_token>). Este módulo
 * só faz leitura no Oracle, mas expõe dados financeiros — por isso exige o
 * mesmo login do app, sem introduzir um mecanismo de auth novo.
 */
export async function requireUser(req: ApiRequest) {
  const header = req.headers.authorization;
  const token = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : null;
  if (!token) return null;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
