import {
  Mic,
  MicOff,
  Copy,
  PhoneOff,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EphemeralTimer } from './EphemeralTimer';

interface ControlBarProps {
  micEnabled: boolean;
  isHost: boolean;
  chatOpen: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  onToggleMic: () => void;
  onToggleChat: () => void;
  onCopyLink: () => void;
  onEndSession: () => void;
  onLeave: () => void;
}

export function ControlBar({
  micEnabled,
  isHost,
  chatOpen,
  remainingSeconds,
  totalSeconds,
  onToggleMic,
  onToggleChat,
  onCopyLink,
  onEndSession,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="glass-panel mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 p-3">
      <Button variant="secondary" size="icon" onClick={onToggleMic} aria-label={micEnabled ? 'Mute' : 'Unmute'}>
        {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>
      <Button
        variant={chatOpen ? 'primary' : 'secondary'}
        size="icon"
        onClick={onToggleChat}
        aria-label="Toggle chat"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
      <Button variant="secondary" size="sm" onClick={onCopyLink}>
        <Copy className="h-4 w-4" />
        <span className="hidden sm:inline">Copy Link</span>
      </Button>
      <div className="hidden flex-1 sm:block" />
      {isHost ? (
        <EphemeralTimer remainingSeconds={remainingSeconds} totalSeconds={totalSeconds}>
          <Button variant="destructive" size="sm" onClick={onEndSession}>
            <PhoneOff className="h-4 w-4" />
            End Session
          </Button>
        </EphemeralTimer>
      ) : (
        <Button variant="secondary" size="sm" onClick={onLeave}>
          <LogOut className="h-4 w-4" />
          Leave
        </Button>
      )}
    </div>
  );
}
