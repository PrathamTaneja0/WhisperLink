import { useEffect, useRef } from 'react';

interface RemoteAudioSinkProps {
  peerId: string;
  stream: MediaStream | null;
}

export function RemoteAudioSink({ peerId, stream }: RemoteAudioSinkProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!stream) {
      audio.pause();
      audio.srcObject = null;
      return;
    }

    audio.srcObject = stream;
    void audio.play().catch(() => {
      // Autoplay may be blocked until user gesture; room join click should unblock.
    });

    return () => {
      audio.pause();
      audio.srcObject = null;
    };
  }, [stream]);

  return (
    <audio
      ref={audioRef}
      data-peer-id={peerId}
      autoPlay
      playsInline
      className="sr-only"
      aria-hidden="true"
    />
  );
}

interface RemoteAudioSinksProps {
  streams: Map<string, MediaStream | null>;
}

export function RemoteAudioSinks({ streams }: RemoteAudioSinksProps) {
  return (
    <>
      {Array.from(streams.entries()).map(([peerId, stream]) => (
        <RemoteAudioSink key={peerId} peerId={peerId} stream={stream} />
      ))}
    </>
  );
}
