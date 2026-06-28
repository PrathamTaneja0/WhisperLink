import { cn } from '@/lib/utils';

interface WhisperLinkLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
};

export function WhisperLinkLogo({ size = 'md', className }: WhisperLinkLogoProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizes[size], className)}
      aria-hidden="true"
    >
      <circle cx="80" cy="100" r="50" fill="#f2a2a2" fillOpacity="0.9" />
      <path d="M45 135 L40 155 L65 145" fill="#f2a2a2" />
      <circle cx="120" cy="100" r="50" fill="#fdf2e9" fillOpacity="0.9" />
      <path d="M155 135 L160 155 L135 145" fill="#fdf2e9" />
      <defs>
        <clipPath id="logoOverlap">
          <circle cx="80" cy="100" r="50" />
        </clipPath>
      </defs>
      <circle cx="120" cy="100" r="50" fill="#f8c9c9" fillOpacity="0.5" clipPath="url(#logoOverlap)" />
    </svg>
  );
}
