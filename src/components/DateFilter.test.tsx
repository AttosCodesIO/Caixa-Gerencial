import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DateFilter from './DateFilter';
import { DateFilterState } from '../types';

const renderDateFilter = (overrides?: Partial<DateFilterState>, error: string | null = null) => {
  const state: DateFilterState = {
    mode: 'mes',
    selectedDay: '2026-07-08',
    periodStart: '',
    periodEnd: '',
    activePreset: null,
    monthDate: new Date(2026, 6, 8),
    monthViewMode: 'month',
    ...overrides,
  };
  const onChange = vi.fn();
  const onPrevMonth = vi.fn();
  const onNextMonth = vi.fn();

  render(
    <BrowserRouter>
      <DateFilter
        state={state}
        onChange={onChange}
        error={error}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
    </BrowserRouter>,
  );

  return { onChange, onPrevMonth, onNextMonth };
};

describe('Componente de Filtro de Data (DateFilter)', () => {
  describe('Alternância de Modo', () => {
    it('deve renderizar o modo "Mês" como padrão', () => {
      renderDateFilter();
      expect(screen.getByText('Mensal')).toBeInTheDocument();
    });

    it('deve trocar para o painel "Dia" ao clicar na aba Dia', () => {
      const { onChange } = renderDateFilter();
      fireEvent.click(screen.getByRole('button', { name: 'Dia' }));
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mode: 'dia' }));
    });

    it('deve trocar para o painel "Período" ao clicar na aba Período', () => {
      const { onChange } = renderDateFilter();
      fireEvent.click(screen.getByRole('button', { name: 'Período' }));
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mode: 'periodo' }));
    });
  });

  describe('Modo Dia', () => {
    it('deve chamar onChange com o novo selectedDay ao alterar o input de data', () => {
      const { onChange } = renderDateFilter({ mode: 'dia' });
      const input = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '2026-07-10' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ selectedDay: '2026-07-10' }));
    });
  });

  describe('Modo Período - Pills de Preset', () => {
    it('deve destacar visualmente o pill "Hoje" quando ele é o preset ativo', () => {
      renderDateFilter({ mode: 'periodo', activePreset: 'hoje', periodStart: '2026-07-08', periodEnd: '2026-07-08' });
      const pill = screen.getByRole('button', { name: 'Hoje' });
      expect(pill.className).toContain('bg-neutral-900');
    });

    it('deve chamar onChange com dataInicio igual a dataFim ao clicar em "Hoje"', () => {
      const { onChange } = renderDateFilter({ mode: 'periodo' });
      fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));
      const call = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(call.periodStart).toBe(call.periodEnd);
      expect(call.activePreset).toBe('hoje');
    });

    it('deve chamar onChange com um intervalo de 7 dias ao clicar em "Últimos 7 dias"', () => {
      const { onChange } = renderDateFilter({ mode: 'periodo' });
      fireEvent.click(screen.getByRole('button', { name: 'Últimos 7 dias' }));
      const call = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(call.activePreset).toBe('ultimos7');
      expect(call.periodStart).not.toBe(call.periodEnd);
    });

    it('deve desmarcar o preset ativo ao editar manualmente a data inicial', () => {
      const { onChange } = renderDateFilter({
        mode: 'periodo',
        activePreset: 'hoje',
        periodStart: '2026-07-08',
        periodEnd: '2026-07-08',
      });
      const inputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(inputs[0], { target: { value: '2026-07-01' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ activePreset: null, periodStart: '2026-07-01' }));
    });

    it('deve desmarcar o preset ativo ao editar manualmente a data final', () => {
      const { onChange } = renderDateFilter({
        mode: 'periodo',
        activePreset: 'hoje',
        periodStart: '2026-07-08',
        periodEnd: '2026-07-08',
      });
      const inputs = document.querySelectorAll('input[type="date"]');
      fireEvent.change(inputs[1], { target: { value: '2026-07-15' } });
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ activePreset: null, periodEnd: '2026-07-15' }));
    });
  });

  describe('Modo Mês (comportamento preservado)', () => {
    it('deve chamar onPrevMonth ao clicar no botão de seta esquerda', () => {
      const { onPrevMonth } = renderDateFilter({ mode: 'mes' });
      const buttons = screen.getAllByRole('button');
      const prevBtn = buttons.find((b) => b.querySelector('svg.lucide-chevron-left'));
      fireEvent.click(prevBtn as HTMLButtonElement);
      expect(onPrevMonth).toHaveBeenCalled();
    });

    it('deve chamar onNextMonth ao clicar no botão de seta direita', () => {
      const { onNextMonth } = renderDateFilter({ mode: 'mes' });
      const buttons = screen.getAllByRole('button');
      const nextBtn = buttons.find((b) => b.querySelector('svg.lucide-chevron-right'));
      fireEvent.click(nextBtn as HTMLButtonElement);
      expect(onNextMonth).toHaveBeenCalled();
    });

    it('deve exibir o mês e ano formatados quando viewMode é "month"', () => {
      renderDateFilter({ mode: 'mes', monthViewMode: 'month', monthDate: new Date(2026, 6, 8) });
      expect(screen.getByText(/julho 2026/i)).toBeInTheDocument();
    });

    it('deve exibir apenas o ano quando viewMode é "year"', () => {
      renderDateFilter({ mode: 'mes', monthViewMode: 'year', monthDate: new Date(2026, 6, 8) });
      expect(screen.getByText('2026')).toBeInTheDocument();
    });
  });

  describe('Validação', () => {
    it('deve exibir mensagem de erro quando a prop error não é nula', () => {
      renderDateFilter({}, 'Informe a data inicial.');
      expect(screen.getByText('Informe a data inicial.')).toBeInTheDocument();
    });

    it('não deve exibir mensagem de erro quando a prop error é nula', () => {
      renderDateFilter({}, null);
      expect(screen.queryByText('Informe a data inicial.')).not.toBeInTheDocument();
    });
  });
});
