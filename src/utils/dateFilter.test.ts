import { describe, it, expect } from 'vitest';
import { getPresetRange, resolveDateRange, validateDateFilter, formatPeriodLabel } from './dateFilter';
import { DateFilterState } from '../types';

const baseState: DateFilterState = {
  mode: 'mes',
  selectedDay: '2026-07-08',
  periodStart: '',
  periodEnd: '',
  activePreset: null,
  monthDate: new Date(2026, 6, 8), // Julho de 2026
  monthViewMode: 'month',
};

describe('dateFilter - getPresetRange', () => {
  it('deve retornar o dia de hoje para o preset "hoje"', () => {
    const today = new Date(2026, 6, 8);
    const range = getPresetRange('hoje', today);
    expect(range).toEqual({ dataInicio: '2026-07-08', dataFim: '2026-07-08' });
  });

  it('deve retornar o dia anterior para o preset "ontem"', () => {
    const today = new Date(2026, 6, 8);
    const range = getPresetRange('ontem', today);
    expect(range).toEqual({ dataInicio: '2026-07-07', dataFim: '2026-07-07' });
  });

  it('deve retornar um intervalo de 7 dias terminando hoje para "ultimos7"', () => {
    const today = new Date(2026, 6, 8);
    const range = getPresetRange('ultimos7', today);
    expect(range).toEqual({ dataInicio: '2026-07-02', dataFim: '2026-07-08' });
  });

  it('deve retornar um intervalo de 30 dias terminando hoje para "ultimos30"', () => {
    const today = new Date(2026, 6, 8);
    const range = getPresetRange('ultimos30', today);
    expect(range).toEqual({ dataInicio: '2026-06-09', dataFim: '2026-07-08' });
  });

  it('deve retornar o primeiro e último dia do mês atual para "esteMes"', () => {
    const today = new Date(2026, 6, 8);
    const range = getPresetRange('esteMes', today);
    expect(range).toEqual({ dataInicio: '2026-07-01', dataFim: '2026-07-31' });
  });

  it('deve retornar o primeiro e último dia do mês anterior para "mesPassado"', () => {
    const today = new Date(2026, 6, 8);
    const range = getPresetRange('mesPassado', today);
    expect(range).toEqual({ dataInicio: '2026-06-01', dataFim: '2026-06-30' });
  });

  it('deve calcular corretamente "mesPassado" em janeiro, retornando dezembro do ano anterior', () => {
    const today = new Date(2026, 0, 15); // Janeiro de 2026
    const range = getPresetRange('mesPassado', today);
    expect(range).toEqual({ dataInicio: '2025-12-01', dataFim: '2025-12-31' });
  });

  it('deve lançar erro ao chamar getPresetRange com "personalizado"', () => {
    // 'personalizado' é excluído do tipo do parâmetro (checado em compile-time);
    // este teste cobre o fallback defensivo em runtime para chamadores não-TS.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => getPresetRange('personalizado' as any)).toThrow();
  });
});

describe('dateFilter - resolveDateRange', () => {
  it('deve resolver dataInicio igual a dataFim no modo "dia"', () => {
    const state: DateFilterState = { ...baseState, mode: 'dia', selectedDay: '2026-07-05' };
    expect(resolveDateRange(state)).toEqual({ dataInicio: '2026-07-05', dataFim: '2026-07-05' });
  });

  it('deve resolver dataInicio e dataFim a partir de periodStart/periodEnd no modo "periodo"', () => {
    const state: DateFilterState = {
      ...baseState,
      mode: 'periodo',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-08',
    };
    expect(resolveDateRange(state)).toEqual({ dataInicio: '2026-07-01', dataFim: '2026-07-08' });
  });

  it('deve resolver os limites do mês corretamente no modo "mes" com viewMode "month"', () => {
    const state: DateFilterState = { ...baseState, mode: 'mes', monthViewMode: 'month' };
    expect(resolveDateRange(state)).toEqual({ dataInicio: '2026-07-01', dataFim: '2026-07-31' });
  });

  it('deve resolver os limites do ano corretamente no modo "mes" com viewMode "year"', () => {
    const state: DateFilterState = { ...baseState, mode: 'mes', monthViewMode: 'year' };
    expect(resolveDateRange(state)).toEqual({ dataInicio: '2026-01-01', dataFim: '2026-12-31' });
  });
});

describe('dateFilter - validateDateFilter', () => {
  it('deve retornar erro se selectedDay estiver vazio no modo "dia"', () => {
    const state: DateFilterState = { ...baseState, mode: 'dia', selectedDay: '' };
    expect(validateDateFilter(state)).toBe('Selecione um dia válido.');
  });

  it('deve retornar null se selectedDay for uma data válida no modo "dia"', () => {
    const state: DateFilterState = { ...baseState, mode: 'dia', selectedDay: '2026-07-08' };
    expect(validateDateFilter(state)).toBeNull();
  });

  it('deve retornar erro se periodStart estiver vazio no modo "periodo"', () => {
    const state: DateFilterState = { ...baseState, mode: 'periodo', periodStart: '', periodEnd: '2026-07-08' };
    expect(validateDateFilter(state)).toBe('Informe a data inicial.');
  });

  it('deve retornar erro se periodEnd estiver vazio no modo "periodo"', () => {
    const state: DateFilterState = { ...baseState, mode: 'periodo', periodStart: '2026-07-01', periodEnd: '' };
    expect(validateDateFilter(state)).toBe('Informe a data final.');
  });

  it('deve retornar erro se periodEnd for anterior a periodStart no modo "periodo"', () => {
    const state: DateFilterState = {
      ...baseState,
      mode: 'periodo',
      periodStart: '2026-07-08',
      periodEnd: '2026-07-01',
    };
    expect(validateDateFilter(state)).toBe('A data final deve ser maior ou igual à data inicial.');
  });

  it('deve retornar null se periodEnd for igual a periodStart no modo "periodo"', () => {
    const state: DateFilterState = {
      ...baseState,
      mode: 'periodo',
      periodStart: '2026-07-08',
      periodEnd: '2026-07-08',
    };
    expect(validateDateFilter(state)).toBeNull();
  });

  it('deve sempre retornar null no modo "mes"', () => {
    const state: DateFilterState = { ...baseState, mode: 'mes' };
    expect(validateDateFilter(state)).toBeNull();
  });
});

describe('dateFilter - formatPeriodLabel', () => {
  it('deve formatar o rótulo por extenso no modo "dia"', () => {
    const state: DateFilterState = { ...baseState, mode: 'dia', selectedDay: '2026-07-08' };
    expect(formatPeriodLabel(state)).toBe('08 de julho de 2026');
  });

  it('deve formatar um único dia (sem intervalo) quando periodStart igual a periodEnd no modo "periodo"', () => {
    const state: DateFilterState = {
      ...baseState,
      mode: 'periodo',
      periodStart: '2026-07-08',
      periodEnd: '2026-07-08',
    };
    expect(formatPeriodLabel(state)).toBe('08/07/2026');
  });

  it('deve formatar um intervalo "de...a..." quando periodStart difere de periodEnd no modo "periodo"', () => {
    const state: DateFilterState = {
      ...baseState,
      mode: 'periodo',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-08',
    };
    expect(formatPeriodLabel(state)).toBe('01/07/2026 a 08/07/2026');
  });

  it('deve formatar mês e ano no modo "mes" com viewMode "month"', () => {
    const state: DateFilterState = { ...baseState, mode: 'mes', monthViewMode: 'month', monthDate: new Date(2026, 6, 8) };
    expect(formatPeriodLabel(state)).toBe('julho 2026');
  });

  it('deve formatar apenas o ano no modo "mes" com viewMode "year"', () => {
    const state: DateFilterState = { ...baseState, mode: 'mes', monthViewMode: 'year', monthDate: new Date(2026, 6, 8) };
    expect(formatPeriodLabel(state)).toBe('2026');
  });

  it('deve retornar string vazia se selectedDay estiver vazio no modo "dia"', () => {
    const state: DateFilterState = { ...baseState, mode: 'dia', selectedDay: '' };
    expect(formatPeriodLabel(state)).toBe('');
  });
});
