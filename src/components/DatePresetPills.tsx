import { clsx } from 'clsx';
import { DatePresetKey } from '../types';
import { DATE_PRESETS } from '../utils/dateFilter';

interface DatePresetPillsProps {
  activePreset: DatePresetKey | null;
  onSelect: (preset: DatePresetKey) => void;
}

export default function DatePresetPills({ activePreset, onSelect }: DatePresetPillsProps) {
  const clickablePresets = DATE_PRESETS.filter((p) => p.key !== 'personalizado');

  return (
    <div className="flex flex-wrap items-center gap-2">
      {clickablePresets.map((preset) => (
        <button
          key={preset.key}
          type="button"
          onClick={() => onSelect(preset.key)}
          className={clsx(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
            activePreset === preset.key
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50',
          )}
        >
          {preset.label}
        </button>
      ))}
      {activePreset === null && (
        <span className="px-3 py-1.5 text-xs font-medium text-neutral-400">Personalizado</span>
      )}
    </div>
  );
}
