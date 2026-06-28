import { Link } from 'react-router-dom';
import { Shield, Clock, Users } from 'lucide-react';
import { WhisperLinkLogo } from '@/components/app/WhisperLinkLogo';
import { HeroIllustration } from '@/components/app/HeroIllustration';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const features = [
  { icon: Shield, label: 'No accounts', color: 'bg-mist-pink/50 text-primary-brand' },
  { icon: Clock, label: 'Ephemeral', color: 'bg-soft-cyan/50 text-primary-brand' },
  { icon: Users, label: 'Instant join', color: 'bg-lavender/50 text-primary-brand' },
];

export function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center">
      <WhisperLinkLogo size="lg" className="mb-6" />
      <h1 className="headline-display text-center">Talk freely.</h1>
      <p className="body-lg mt-3 text-center">No strings attached.</p>

      <HeroIllustration />

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

      <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link to="/start">Start Session</Link>
        </Button>
        <Button asChild variant="secondary" size="lg" className="flex-1">
          <Link to="/join">Join Session</Link>
        </Button>
      </div>
    </div>
  );
}
