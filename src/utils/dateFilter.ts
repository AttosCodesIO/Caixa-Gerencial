import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  parseISO,
  isValid,
  isBefore,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateFilterState, DateRange, DatePresetKey } from '../types';

const ISO = 'yyyy-MM-dd';

export const DATE_PRESETS: { key: DatePresetKey; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'ontem', label: 'Ontem' },
  { key: 'ultimos7', label: 'Últimos 7 dias' },
  { key: 'ultimos30', label: 'Últimos 30 dias' },
  { key: 'esteMes', label: 'Este mês' },
  { key: 'mesPassado', label: 'Mês passado' },
  { key: 'personalizado', label: 'Personalizado' },
];

export function getPresetRange(
  preset: Exclude<DatePresetKey, 'personalizado'>,
  today: Date = new Date(),
): DateRange {
  switch (preset) {
    case 'hoje':
      return { dataInicio: format(today, ISO), dataFim: format(today, ISO) };
    case 'ontem': {
      const yesterday = subDays(today, 1);
      return { dataInicio: format(yesterday, ISO), dataFim: format(yesterday, ISO) };
    }
    case 'ultimos7':
      return { dataInicio: format(subDays(today, 6), ISO), dataFim: format(today, ISO) };
    case 'ultimos30':
      return { dataInicio: format(subDays(today, 29), ISO), dataFim: format(today, ISO) };
    case 'esteMes':
      return { dataInicio: format(startOfMonth(today), ISO), dataFim: format(endOfMonth(today), ISO) };
    case 'mesPassado': {
      const lastMonth = subMonths(today, 1);
      return { dataInicio: format(startOfMonth(lastMonth), ISO), dataFim: format(endOfMonth(lastMonth), ISO) };
    }
    default:
      throw new Error(
        'getPresetRange: "personalizado" não possui range computável, use periodStart/periodEnd diretamente.',
      );
  }
}

export function resolveDateRange(state: DateFilterState): DateRange {
  switch (state.mode) {
    case 'dia':
      return { dataInicio: state.selectedDay, dataFim: state.selectedDay };
    case 'periodo':
      return { dataInicio: state.periodStart, dataFim: state.periodEnd };
    case 'mes':
    default: {
      const isYear = state.monthViewMode === 'year';
      const start = isYear ? startOfYear(state.monthDate) : startOfMonth(state.monthDate);
      const end = isYear ? endOfYear(state.monthDate) : endOfMonth(state.monthDate);
      return { dataInicio: format(start, ISO), dataFim: format(end, ISO) };
    }
  }
}

export function formatPeriodLabel(state: DateFilterState): string {
  switch (state.mode) {
    case 'dia': {
      if (!state.selectedDay || !isValid(parseISO(state.selectedDay))) return '';
      return format(parseISO(state.selectedDay), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    case 'periodo': {
      if (!state.periodStart || !state.periodEnd) return '';
      const start = format(parseISO(state.periodStart), 'dd/MM/yyyy');
      const end = format(parseISO(state.periodEnd), 'dd/MM/yyyy');
      return start === end ? start : `${start} a ${end}`;
    }
    case 'mes':
    default:
      return state.monthViewMode === 'month'
        ? format(state.monthDate, 'MMMM yyyy', { locale: ptBR })
        : format(state.monthDate, 'yyyy');
  }
}

export function validateDateFilter(state: DateFilterState): string | null {
  if (state.mode === 'dia') {
    if (!state.selectedDay || !isValid(parseISO(state.selectedDay))) {
      return 'Selecione um dia válido.';
    }
    return null;
  }

  if (state.mode === 'periodo') {
    if (!state.periodStart || !isValid(parseISO(state.periodStart))) {
      return 'Informe a data inicial.';
    }
    if (!state.periodEnd || !isValid(parseISO(state.periodEnd))) {
      return 'Informe a data final.';
    }
    if (isBefore(parseISO(state.periodEnd), parseISO(state.periodStart))) {
      return 'A data final deve ser maior ou igual à data inicial.';
    }
    return null;
  }

  return null;
}
