import { useState } from 'react';
import { DURATION_PRESETS, MAX_DURATION_MINUTES, MIN_DURATION_MINUTES } from '@whisperlink/shared';
import { cn } from '@/lib/utils';
import { FormError } from './FormError';

interface DurationPickerProps {
  value: number;
  onChange: (minutes: number) => void;
}

function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

const durationChipClass =
  'rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-normal';

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const [maxError, setMaxError] = useState<string>();
  const isCustomValue = !(DURATION_PRESETS as readonly number[]).includes(value);

  function handleCustomChange(raw: string) {
    const parsed = parseInt(raw, 10);

    if (raw === '' || Number.isNaN(parsed)) {
      setMaxError(undefined);
      onChange(MIN_DURATION_MINUTES);
      return;
    }

    if (parsed > MAX_DURATION_MINUTES) {
      setMaxError(`Maximum ${MAX_DURATION_MINUTES} min allowed`);
      onChange(MAX_DURATION_MINUTES);
      return;
    }

    setMaxError(undefined);
    onChange(Math.max(MIN_DURATION_MINUTES, parsed));
  }

  return (
    <div className="space-y-3 text-center">
      <label className="label-md">Duration</label>
      <div className="flex flex-wrap justify-center gap-2">
        {DURATION_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setMaxError(undefined);
              onChange(preset);
            }}
            className={cn(
              durationChipClass,
              value === preset
                ? 'border-primary-brand bg-lavender/40 text-primary-brand'
                : 'border-border bg-surface text-muted hover:border-border-variant hover:text-foreground',
            )}
          >
            {formatDuration(preset)}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-subtle">Custom:</span>
          <div
            className={cn(
              durationChipClass,
              'inline-flex items-center focus-within:ring-2 focus-within:ring-lavender/60',
              isCustomValue
                ? 'border-primary-brand bg-lavender/40 text-primary-brand'
                : 'border-border bg-surface text-muted',
            )}
          >
            <input
              type="number"
              min={MIN_DURATION_MINUTES}
              max={MAX_DURATION_MINUTES}
              value={value}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="w-6 bg-transparent p-0 text-center text-sm font-medium text-inherit outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-inherit"> min</span>
          </div>
        </div>
        <FormError message={maxError} />
      </div>
    </div>
  );
}
