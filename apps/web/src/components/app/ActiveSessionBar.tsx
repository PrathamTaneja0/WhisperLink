import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';

export function ActiveSessionBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isActive,
    roomId,
    formatted,
    connected,
    participants,
    remainingSeconds,
  } = useSession();

  const onRoomPage = location.pathname.startsWith('/r/');

  if (!isActive || !roomId || onRoomPage) return null;

  const connectionVariant = connected ? 'success' : 'warning';

  return (
    <div className="sticky top-0 z-40 border-b border-soft-cyan/40 bg-glass px-4 py-2 shadow-ambient backdrop-blur-xl">
      <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={formatted} variant={remainingSeconds <= 30 ? 'warning' : 'system'} />
          <StatusBadge
            label={connected ? 'Connected' : 'Connecting…'}
            variant={connectionVariant}
          />
          <StatusBadge label={`${participants.length} online`} variant="success" />
        </div>
        <Button size="sm" onClick={() => navigate(`/r/${roomId}`)}>
          <ArrowLeft className="h-4 w-4" />
          Return to session
        </Button>
      </div>
    </div>
  );
}
