import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { pageStaggerContainer, pageStaggerItem } from '@/lib/motion';

interface AnimatedPageProps {
  children: ReactNode;
}

export function AnimatedPage({ children }: AnimatedPageProps) {
  return (
    <motion.div
      variants={pageStaggerContainer}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedPageSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={pageStaggerItem} className={className}>
      {children}
    </motion.div>
  );
}
