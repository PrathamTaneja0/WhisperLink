import { motion, AnimatePresence } from 'framer-motion';
import { slideInRight } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  visible: boolean;
  variant?: 'default' | 'error';
}

export function Toast({ message, visible, variant = 'default' }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          {...slideInRight}
          className={cn(
            'fixed bottom-6 right-6 z-50 rounded-lg border px-4 py-3 text-sm shadow-elevated backdrop-blur-xl',
            variant === 'error'
              ? 'border-error/30 bg-error-bg text-error'
              : 'border-soft-cyan/60 bg-glass text-foreground',
          )}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
