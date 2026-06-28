import { DURATION_PRESETS, MAX_DURATION_MINUTES, MIN_DURATION_MINUTES } from '@whisperlink/shared';
import { cn } from '@/lib/utils';

interface DurationPickerProps {
  value: number;
  onChange: (minutes: number) => void;
}

function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  return (
    <div className="space-y-3 text-center">
      <label className="label-md">Duration</label>
      <div className="flex flex-wrap justify-center gap-2">
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
            {formatDuration(preset)}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-subtle">Custom:</span>
        <input
          type="number"
          min={MIN_DURATION_MINUTES}
          max={MAX_DURATION_MINUTES}
          value={value}
          onChange={(e) =>
            onChange(
              Math.min(
                MAX_DURATION_MINUTES,
                Math.max(MIN_DURATION_MINUTES, parseInt(e.target.value, 10) || MIN_DURATION_MINUTES),
              ),
            )
          }
          className="h-9 w-20 rounded-md border border-border bg-surface px-2 text-sm text-foreground [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-lavender/60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-sm text-subtle">min</span>
      </div>
    </div>
  );
}
