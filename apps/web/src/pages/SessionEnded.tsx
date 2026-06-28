import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function SessionEndedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="headline-lg">This session has ended</h1>
      <p className="mt-3 max-w-sm text-sm text-muted">
        The conversation is no longer available.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => navigate('/', { replace: true })}>
          Go home
        </Button>
        <Button variant="secondary" onClick={() => navigate('/start', { replace: true })}>
          Start new session
        </Button>
      </div>
    </div>
  );
}
