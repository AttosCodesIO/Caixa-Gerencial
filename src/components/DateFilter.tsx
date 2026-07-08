import { AnimatePresence, motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { DateFilterState, DateFilterMode, DatePresetKey } from '../types';
import { getPresetRange } from '../utils/dateFilter';
import DatePresetPills from './DatePresetPills';

interface DateFilterProps {
  state: DateFilterState;
  onChange: (next: DateFilterState) => void;
  error: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const MODE_TABS: { key: DateFilterMode; label: string }[] = [
  { key: 'dia', label: 'Dia' },
  { key: 'periodo', label: 'Período' },
  { key: 'mes', label: 'Mês' },
];

export default function DateFilter({ state, onChange, error, onPrevMonth, onNextMonth }: DateFilterProps) {
  const handlePresetClick = (preset: DatePresetKey) => {
    if (preset === 'personalizado') {
      onChange({ ...state, activePreset: null });
      return;
    }
    const range = getPresetRange(preset);
    onChange({ ...state, activePreset: preset, periodStart: range.dataInicio, periodEnd: range.dataFim });
  };

  const handleModeChange = (mode: DateFilterMode) => {
    if (mode === 'periodo' && !state.periodStart && !state.periodEnd) {
      const range = getPresetRange('esteMes');
      onChange({ ...state, mode, activePreset: 'esteMes', periodStart: range.dataInicio, periodEnd: range.dataFim });
      return;
    }
    onChange({ ...state, mode });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg w-fit">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleModeChange(tab.key)}
            className={clsx(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors',
              state.mode === tab.key
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-neutral-200 flex-wrap">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.mode}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 flex-wrap"
          >
            {state.mode === 'dia' && (
              <input
                type="date"
                value={state.selectedDay}
                onChange={(e) => onChange({ ...state, selectedDay: e.target.value })}
                className="border border-neutral-300 rounded-lg px-2 py-1 text-sm text-neutral-700 outline-none focus:border-neutral-400"
              />
            )}

            {state.mode === 'periodo' && (
              <div className="flex flex-col gap-2">
                <DatePresetPills activePreset={state.activePreset} onSelect={handlePresetClick} />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={state.periodStart}
                    onChange={(e) => onChange({ ...state, activePreset: null, periodStart: e.target.value })}
                    className="border border-neutral-300 rounded-lg px-2 py-1 text-sm text-neutral-700 outline-none focus:border-neutral-400"
                  />
                  <span className="text-neutral-400 text-sm">até</span>
                  <input
                    type="date"
                    value={state.periodEnd}
                    onChange={(e) => onChange({ ...state, activePreset: null, periodEnd: e.target.value })}
                    className="border border-neutral-300 rounded-lg px-2 py-1 text-sm text-neutral-700 outline-none focus:border-neutral-400"
                  />
                </div>
              </div>
            )}

            {state.mode === 'mes' && (
              <>
                <select
                  value={state.monthViewMode}
                  onChange={(e) => onChange({ ...state, monthViewMode: e.target.value as 'month' | 'year' })}
                  className="bg-transparent border-none text-sm font-medium text-neutral-600 focus:ring-0 cursor-pointer outline-none"
                >
                  <option value="month">Mensal</option>
                  <option value="year">Anual</option>
                </select>
                <div className="w-px h-4 bg-neutral-200 mx-1"></div>
                <button onClick={onPrevMonth} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium text-neutral-700 min-w-[120px] text-center capitalize">
                  {state.monthViewMode === 'month'
                    ? format(state.monthDate, 'MMMM yyyy', { locale: ptBR })
                    : format(state.monthDate, 'yyyy')}
                </span>
                <button onClick={onNextMonth} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-600">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
