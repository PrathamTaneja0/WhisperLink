/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-primary)',
        surface: 'var(--bg-surface)',
        'surface-hover': 'var(--bg-surface-hover)',
        'surface-dim': 'var(--bg-surface-dim)',
        glass: 'var(--bg-glass)',
        foreground: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-brand': 'var(--primary-brand)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'mist-pink': 'var(--mist-pink)',
        'soft-cyan': 'var(--soft-cyan)',
        lavender: 'var(--lavender)',
        'dusk-slate': 'var(--dusk-slate)',
        border: 'var(--border)',
        'border-variant': 'var(--border-variant)',
        error: 'var(--error)',
        'error-bg': 'var(--error-bg)',
        success: 'var(--success)',
        'success-bg': 'var(--success-bg)',
        warning: 'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      fontFamily: {
        sans: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        display: ['Libre Caslon Text', 'Georgia', 'serif'],
      },
      boxShadow: {
        ambient: 'var(--shadow-ambient)',
        elevated: 'var(--shadow-elevated)',
      },
      maxWidth: {
        container: 'var(--container-max)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
      },
      letterSpacing: {
        label: '0.05em',
      },
    },
  },
  plugins: [],
};
