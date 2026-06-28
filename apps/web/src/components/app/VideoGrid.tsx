import { cn } from '@/lib/utils';

interface VideoTile {
  peerId: string;
  displayName: string;
  stream: MediaStream | null;
  isLocal?: boolean;
}

interface VideoGridProps {
  tiles: VideoTile[];
}

function VideoTileComponent({ tile }: { tile: VideoTile }) {
  const videoRef = (el: HTMLVideoElement | null) => {
    if (el && tile.stream) {
      el.srcObject = tile.stream;
    }
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface shadow-ambient">
      {tile.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={tile.isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-surface-dim/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lavender/60 font-display text-xl text-primary-brand">
            {tile.displayName.charAt(0)}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded-md bg-white/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
        {tile.isLocal ? 'You' : tile.displayName}
      </div>
    </div>
  );
}

export function VideoGrid({ tiles }: VideoGridProps) {
  const count = tiles.length;
  const gridClass = cn(
    'grid gap-3',
    count <= 1 && 'grid-cols-1',
    count === 2 && 'grid-cols-1 sm:grid-cols-2',
    count >= 3 && count <= 4 && 'grid-cols-1 sm:grid-cols-2',
    count >= 5 && 'grid-cols-2 sm:grid-cols-3',
  );

  return (
    <div className={gridClass}>
      {tiles.map((tile) => (
        <VideoTileComponent key={tile.peerId} tile={tile} />
      ))}
    </div>
  );
}
