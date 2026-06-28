import { motion } from 'framer-motion';

export function HeroIllustration() {
  return (
    <motion.div
      className="group relative mt-8 w-full max-w-md rounded-2xl p-4 transition-shadow duration-normal hover:shadow-elevated"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-mist-pink/30 via-transparent to-soft-cyan/25 opacity-0 transition-opacity duration-normal group-hover:opacity-100"
        aria-hidden="true"
      />
      <motion.img
        src="/illustrations/hero-communication.png"
        alt="Two people connecting remotely"
        className="relative w-full animate-hero-float"
        draggable={false}
      />
    </motion.div>
  );
}
