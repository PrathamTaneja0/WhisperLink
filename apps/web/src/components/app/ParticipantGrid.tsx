import { cn } from '@/lib/utils';

export interface ParticipantTile {
  peerId: string;
  displayName: string;
  isLocal?: boolean;
}

interface ParticipantGridProps {
  participants: ParticipantTile[];
}

function ParticipantCard({ participant }: { participant: ParticipantTile }) {
  const initial = participant.displayName.trim().charAt(0).toUpperCase() || '?';
  const label = participant.isLocal ? 'You' : participant.displayName;

  return (
    <div
      className={cn(
        'flex aspect-square w-28 flex-col items-center justify-center gap-3 rounded-xl border border-soft-cyan/40 bg-surface p-4 shadow-ambient sm:w-32',
        participant.isLocal && 'border-primary-brand/30 bg-lavender/20',
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full font-display text-xl',
          participant.isLocal
            ? 'bg-primary-brand/15 text-primary-brand'
            : 'bg-mist-pink/50 text-primary-brand',
        )}
        aria-hidden="true"
      >
        {initial}
      </div>
      <span className="max-w-full truncate text-center text-sm font-medium text-foreground">
        {label}
      </span>
    </div>
  );
}

export function ParticipantGrid({ participants }: ParticipantGridProps) {
  return (
    <div className="card-session flex min-h-[240px] flex-wrap items-center justify-center gap-4 p-6 sm:gap-6 sm:p-8">
      {participants.map((participant) => (
        <ParticipantCard key={participant.peerId} participant={participant} />
      ))}
    </div>
  );
}
