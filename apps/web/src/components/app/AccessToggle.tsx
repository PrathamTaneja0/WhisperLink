import { cn } from '@/lib/utils';

interface AccessToggleProps {
  isProtected: boolean;
  onChange: (isProtected: boolean) => void;
}

export function AccessToggle({ isProtected, onChange }: AccessToggleProps) {
  return (
    <div className="space-y-3 text-center">
      <label className="label-md">Access</label>
      <div className="flex justify-center rounded-xl bg-surface-dim/60 p-1">
        {(['public', 'private'] as const).map((mode) => {
          const selected = mode === 'private' ? isProtected : !isProtected;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode === 'private')}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize transition-all duration-normal',
                selected
                  ? 'bg-surface text-foreground shadow-ambient'
                  : 'text-subtle hover:text-muted',
              )}
            >
              {mode}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-subtle">
        {isProtected ? 'Passcode required to join' : 'Anyone with the link can join'}
      </p>
    </div>
  );
}
