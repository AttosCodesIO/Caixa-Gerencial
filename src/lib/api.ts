import { supabase } from './supabase';

// ==================== PAYEES ====================

export async function getPayees() {
  const { data, error } = await supabase
    .from('payees')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createPayee(payee: { name: string; type: string; document?: string; cargo?: string; endereco?: string }) {
  const { data, error } = await supabase
    .from('payees')
    .insert(payee)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePayee(id: number, payee: { name: string; type: string; document?: string; cargo?: string; endereco?: string }) {
  const { error } = await supabase
    .from('payees')
    .update(payee)
    .eq('id', id);
  if (error) throw error;
}

export async function deletePayee(id: number) {
  const { error } = await supabase
    .from('payees')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ==================== PROJECTS ====================

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createProject(project: { name: string; description?: string }) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: number, project: { name: string; description?: string }) {
  const { error } = await supabase
    .from('projects')
    .update(project)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: number) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ==================== CLASSIFICATIONS ====================

export async function getClassifications() {
  const { data, error } = await supabase
    .from('classifications')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function createClassification(classification: { name: string; description?: string }) {
  const { data, error } = await supabase
    .from('classifications')
    .insert(classification)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClassification(id: number, classification: { name: string; description?: string }) {
  const { error } = await supabase
    .from('classifications')
    .update(classification)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteClassification(id: number) {
  const { error } = await supabase
    .from('classifications')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ==================== TRANSACTIONS ====================

export async function getTransactions(period?: string) {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      payees ( name, document, cargo, endereco ),
      projects ( name ),
      classifications ( name )
    `)
    .order('date', { ascending: true })
    .order('id', { ascending: true });

  if (period) {
    if (period.length === 4) {
      // Ano: YYYY
      query = query.gte('date', `${period}-01-01`).lte('date', `${period}-12-31`);
    } else {
      // Mês: YYYY-MM
      const [year, month] = period.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      query = query.gte('date', `${period}-01`).lte('date', `${period}-${String(lastDay).padStart(2, '0')}`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  // Formatar para manter compatibilidade com o frontend atual
  return (data || []).map((t: any) => ({
    ...t,
    payee_name: t.payees?.name || null,
    payee_document: t.payees?.document || null,
    payee_cargo: t.payees?.cargo || null,
    payee_endereco: t.payees?.endereco || null,
    project_name: t.projects?.name || null,
    classification_name: t.classifications?.name || null,
  }));
}

export async function createTransaction(transaction: {
  date: string;
  payee_id: number | null;
  project_id: number | null;
  classification_id: number | null;
  amount: number;
  description: string;
}) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransaction(id: number, transaction: {
  date: string;
  payee_id: number | null;
  project_id: number | null;
  classification_id: number | null;
  amount: number;
  description: string;
}) {
  const { error } = await supabase
    .from('transactions')
    .update(transaction)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTransaction(id: number) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ==================== BALANCE (calculado no frontend) ====================

export async function getBalance(period: string) {
  const isYear = period.length === 4;

  // Buscar TODAS as transações até o final do período para calcular saldos
  let endDate: string;
  let startDate: string;

  if (isYear) {
    startDate = `${period}-01-01`;
    endDate = `${period}-12-31`;
  } else {
    const [year, month] = period.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    startDate = `${period}-01`;
    endDate = `${period}-${String(lastDay).padStart(2, '0')}`;
  }

  // Saldo inicial: soma de tudo ANTES do período
  const { data: beforeData, error: e1 } = await supabase
    .from('transactions')
    .select('amount')
    .lt('date', startDate);
  if (e1) throw e1;

  const initialBalance = (beforeData || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  // Transações do período
  const { data: periodData, error: e2 } = await supabase
    .from('transactions')
    .select('amount, project_id, classification_id')
    .gte('date', startDate)
    .lte('date', endDate);
  if (e2) throw e2;

  let income = 0;
  let expense = 0;
  const expensesByProject: Record<number, number> = {};
  const expensesByClassification: Record<number, number> = {};

  for (const t of periodData || []) {
    const amount = Number(t.amount);
    if (amount > 0) {
      income += amount;
    } else {
      expense += Math.abs(amount);
      if (t.project_id) {
        expensesByProject[t.project_id] = (expensesByProject[t.project_id] || 0) + Math.abs(amount);
      }
      if (t.classification_id) {
        expensesByClassification[t.classification_id] = (expensesByClassification[t.classification_id] || 0) + Math.abs(amount);
      }
    }
  }

  const finalBalance = initialBalance + income - expense;

  return {
    initialBalance,
    income,
    expense,
    finalBalance,
    expensesByProject,
    expensesByClassification,
  };
}
