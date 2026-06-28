import { DISPLAY_NAME_MAX_LENGTH } from '@whisperlink/shared';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NameInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  centered?: boolean;
}

export function NameInput({
  id = 'display-name',
  value,
  onChange,
  className,
  centered = false,
}: NameInputProps) {
  return (
    <div className={cn(centered && 'text-center', className)}>
      <label htmlFor={id} className="label-md">
        Your name
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="How others will see you"
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        className={cn('mt-2', centered && 'text-center')}
        required
        autoComplete="nickname"
      />
    </div>
  );
}
