export interface Filial {
  codigo: string;
  nome: string;
}

export interface Linha {
  data: string; // DD/MM/AAAA
  dataIso: string; // AAAA-MM-DD
  agente: string;
  historico: string;
  valor: number;
  categoria: string;
  filial: number;
  nomeFilial: string;
}

export interface RelatorioExecutivoPayload {
  linhas: Linha[];
  parametro?: string;
  empresa?: string;
  geradoEm?: string;
  origem?: 'oracle';
}

export interface SeriePonto {
  chave: string;
  rotulo: string;
  valor: number;
  acumulado: number;
}

export interface CategoriaAgregada {
  categoria: string;
  valorTotal: number;
  percentualDoTotal: number;
  corIndice: number;
}

export interface ParametrosBusca {
  filial: string;
  dataInicio: string;
  dataFim: string;
  projetoInicio: string;
  projetoFim: string;
  agenteInicio: string;
  agenteFim: string;
  classeInicio: string;
  classeFim: string;
  centroCustoInicio: string;
  centroCustoFim: string;
}

export const SESSION_STORAGE_KEY = 'relatorioExecutivo';
