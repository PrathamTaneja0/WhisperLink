import { DURATION_PRESETS } from '@whisperlink/shared';
import { cn } from '@/lib/utils';

interface DurationPickerProps {
  value: number;
  onChange: (minutes: number) => void;
}

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  return (
    <div className="space-y-3">
      <label className="label-md">Duration</label>
      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-normal',
              value === preset
                ? 'border-primary-brand bg-lavender/40 text-primary-brand'
                : 'border-border bg-surface text-muted hover:border-border-variant hover:text-foreground',
            )}
          >
            {preset}m
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-subtle">Custom:</span>
        <input
          type="number"
          min={1}
          max={120}
          value={value}
          onChange={(e) => onChange(Math.min(120, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          className="h-9 w-20 rounded-md border border-border bg-surface px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-lavender/60"
        />
        <span className="text-sm text-subtle">min</span>
      </div>
    </div>
  );
}
