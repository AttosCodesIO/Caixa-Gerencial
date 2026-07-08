export type IndexType = 'SELIC' | 'IPCA' | 'IGPM' | 'INCC';

export interface CalculationEntry {
  id: string; // Row ID
  originalValue: number;
  startDate: string; // ISO format YYYY-MM-DD
  endDate: string; // ISO format YYYY-MM-DD
  indexType: IndexType;
  additionalInterestRate: number; // Percentage (e.g., 1 for 1%)
  correctedValue?: number;
  interestValue?: number;
  totalPercentage?: number;
  status: 'PENDING' | 'CALCULATING' | 'SUCCESS' | 'ERROR';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface SavedTable {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CalculationResult {
  id: string;
  table_id: string;
  data: CalculationEntry[];
  created_at: string;
  updated_at: string;
}

export interface BcbSeriesResponse {
  data: string; // Format: "dd/MM/yyyy"
  valor: string; // Percentage strings from BCB
}

export interface Payee {
  id: number;
  name: string;
  type: string;
  document?: string;
  cargo?: string;
  endereco?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface Classification {
  id: number;
  name: string;
  description?: string;
}

export interface Transaction {
  id: number;
  date: string;
  payee_id: number | null;
  project_id: number | null;
  classification_id: number | null;
  amount: number;
  description: string;
  payees?: Partial<Payee>;
  projects?: Partial<Project>;
  classifications?: Partial<Classification>;
  payee_name?: string | null;
  payee_document?: string | null;
  payee_cargo?: string | null;
  payee_endereco?: string | null;
  project_name?: string | null;
  classification_name?: string | null;
}

// ==================== FILTRO DE DATAS (Lançamentos) ====================

export type DateFilterMode = 'dia' | 'periodo' | 'mes';

export type DatePresetKey =
  | 'hoje'
  | 'ontem'
  | 'ultimos7'
  | 'ultimos30'
  | 'esteMes'
  | 'mesPassado'
  | 'personalizado';

export interface DateRange {
  dataInicio: string; // ISO yyyy-MM-dd
  dataFim: string; // ISO yyyy-MM-dd
}

export interface DateFilterState {
  mode: DateFilterMode;
  // modo 'dia'
  selectedDay: string; // yyyy-MM-dd
  // modo 'periodo'
  periodStart: string; // yyyy-MM-dd
  periodEnd: string; // yyyy-MM-dd
  activePreset: DatePresetKey | null;
  // modo 'mes' (legado)
  monthDate: Date;
  monthViewMode: 'month' | 'year';
}
