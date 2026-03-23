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
  metadata?: any;
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
