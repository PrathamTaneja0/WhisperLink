import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}

export function EmptyState({ title, description, actionLabel = 'Go home', actionTo = '/' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="headline-lg">{title}</h2>
      {description && <p className="mt-3 max-w-sm text-sm text-muted">{description}</p>}
      <Button asChild variant="secondary" className="mt-8">
        <Link to={actionTo}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
