import {
  Mic,
  MicOff,
  Copy,
  PhoneOff,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ControlBarProps {
  micEnabled: boolean;
  hasMediaStream: boolean;
  isHost: boolean;
  chatOpen: boolean;
  onToggleMic: () => void;
  onToggleChat: () => void;
  onCopyLink: () => void;
  onEndSession: () => void;
  onLeave: () => void;
}

export function ControlBar({
  micEnabled,
  hasMediaStream,
  isHost,
  chatOpen,
  onToggleMic,
  onToggleChat,
  onCopyLink,
  onEndSession,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="glass-panel mx-auto flex max-w-4xl items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-2">
        <Button
          variant={micEnabled ? 'secondary' : 'destructive'}
          size="icon"
          onClick={onToggleMic}
          disabled={!hasMediaStream}
          aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
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
      </div>

      {isHost ? (
        <Button variant="destructive" size="sm" onClick={onEndSession}>
          <PhoneOff className="h-4 w-4" />
          End Session
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={onLeave}>
          <LogOut className="h-4 w-4" />
          Leave
        </Button>
      )}
    </div>
  );
}
