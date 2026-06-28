import { Switch } from '@/components/ui/switch';

interface AccessToggleProps {
  isProtected: boolean;
  onChange: (isProtected: boolean) => void;
}

export function AccessToggle({ isProtected, onChange }: AccessToggleProps) {
  return (
    <div className="space-y-2">
      <label className="label-md">Access</label>
      <div className="flex items-center justify-between rounded-lg border border-mist-pink/40 bg-mist-pink/20 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {isProtected ? 'Password protected' : 'Public'}
          </p>
          <p className="text-xs text-subtle">
            {isProtected
              ? 'Passcode required to join'
              : 'Anyone with the link can join'}
          </p>
        </div>
        <Switch checked={isProtected} onCheckedChange={onChange} aria-label="Toggle password protection" />
      </div>
    </div>
  );
}
