import { useState, useRef, useEffect } from 'react';
import type { ChatMessagePayload } from '@whisperlink/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  messages: ChatMessagePayload[];
  onSend: (text: string) => void;
  localPeerId: string;
}

export function ChatPanel({ messages, onSend, localPeerId }: ChatPanelProps) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-soft-cyan/60 bg-glass shadow-ambient backdrop-blur-xl">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-display text-sm text-foreground">Chat</h3>
        <p className="text-xs text-subtle">Messages are not stored</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-subtle">No messages yet</p>
        )}
        {messages.map((msg) => {
          const isLocal = msg.peerId === localPeerId;
          return (
            <div
              key={`${msg.peerId}-${msg.timestamp}`}
              className={isLocal ? 'text-right' : 'text-left'}
            >
              <p className="text-xs font-semibold tracking-label text-subtle">
                {isLocal ? 'You' : msg.displayName}
              </p>
              <p
                className={cn(
                  'mt-0.5 inline-block max-w-[85%] rounded-lg px-3 py-1.5 text-sm',
                  isLocal
                    ? 'bg-soft-cyan/50 text-foreground'
                    : 'bg-mist-pink/40 text-foreground',
                )}
              >
                {msg.text}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          maxLength={500}
          className="border-b-0 bg-surface-dim/40 px-3 focus-visible:ring-offset-0"
        />
        <Button type="submit" size="icon" aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
