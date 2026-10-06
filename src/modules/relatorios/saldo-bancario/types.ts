export interface ContaFinanceira {
  codigo: string;
  nome: string;
  banco: string;
}

export interface LinhaSaldoBancario {
  agente: number;
  banco: string;
  saldoExtrato: number;
  docGerados: number;
  docAgendado: number;
  debitos: number;
  creditos: number;
  saldoReal: number;
}

export interface ParametrosSaldoBancario {
  filial: string;
  dataBase: string;
  conta: string; // '' ou 'TODAS' => todas as contas
}

export interface RelatorioSaldoBancarioPayload {
  linhas: LinhaSaldoBancario[];
  dataBase: string;
  empresa?: string;
  conta?: string;
  geradoEm?: string;
}

export const TODAS_CONTAS = 'TODAS';
export const SESSION_STORAGE_KEY_SALDO_BANCARIO = 'relatorioSaldoBancario';
