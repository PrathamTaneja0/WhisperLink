import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, Users } from 'lucide-react';
import { AppShell } from '@/components/app/AppShell';
import { WhisperLinkLogo } from '@/components/app/WhisperLinkLogo';
import { CreatePanel } from '@/components/app/CreatePanel';
import { JoinPanel } from '@/components/app/JoinPanel';
import { panelSwitch } from '@/lib/motion';
import { cn } from '@/lib/utils';

type Panel = 'start' | 'join';

const features = [
  { icon: Shield, label: 'No accounts', color: 'bg-mist-pink/50 text-primary-brand' },
  { icon: Clock, label: 'Ephemeral', color: 'bg-soft-cyan/50 text-primary-brand' },
  { icon: Users, label: 'Instant join', color: 'bg-lavender/50 text-primary-brand' },
];

export function HomePage() {
  const [activePanel, setActivePanel] = useState<Panel>('start');

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-lg flex-col items-center">
        <WhisperLinkLogo size="lg" className="mb-6" />
        <h1 className="headline-display text-center">Talk freely.</h1>
        <p className="body-lg mt-3 text-center">No strings attached.</p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {features.map(({ icon: Icon, label, color }) => (
            <span
              key={label}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-label',
                color,
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>

        <div className="mt-10 w-full">
          <div className="mb-6 flex rounded-xl bg-surface-dim/60 p-1">
            {(['start', 'join'] as const).map((panel) => (
              <button
                key={panel}
                type="button"
                onClick={() => setActivePanel(panel)}
                className={cn(
                  'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-normal',
                  activePanel === panel
                    ? 'bg-surface text-foreground shadow-ambient'
                    : 'text-subtle hover:text-muted',
                )}
              >
                {panel === 'start' ? 'Start Session' : 'Join Session'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activePanel} {...panelSwitch}>
              {activePanel === 'start' ? <CreatePanel /> : <JoinPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
