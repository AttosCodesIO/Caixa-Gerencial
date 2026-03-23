import { supabase } from '../lib/supabase';
import { SavedTable, CalculationResult } from '../types';

export async function saveCalculationTable(
  userId: string,
  name: string,
  data: any[]
): Promise<{ table: SavedTable; result: CalculationResult } | null> {
  const { data: tableData, error: tableError } = await supabase
    .from('monetary_saved_tables')
    .insert([{ user_id: userId, name }])
    .select()
    .single();

  if (tableError) {
    console.error('save table error', tableError);
    return null;
  }

  const { data: resultData, error: resultError } = await supabase
    .from('monetary_calculation_results')
    .insert([{ table_id: tableData.id, data }])
    .select()
    .single();

  if (resultError) {
    console.error('save result error', resultError);
    return null;
  }

  return { table: tableData, result: resultData };
}

export async function getSavedTables(userId: string): Promise<SavedTable[]> {
  const { data, error } = await supabase
    .from('monetary_saved_tables')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('get tables error', error);
    return [];
  }
  return data as SavedTable[];
}

export async function getTableResults(tableId: string): Promise<CalculationResult | null> {
  const { data, error } = await supabase
    .from('monetary_calculation_results')
    .select('*')
    .eq('table_id', tableId)
    .single();

  if (error) {
    console.error('get results error', error);
    return null;
  }
  return data as CalculationResult;
}
