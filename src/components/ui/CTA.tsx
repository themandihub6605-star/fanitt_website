import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface CTAProps {
  title: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export function CTA({ title, description, primaryLabel = 'Get Started', secondaryLabel = 'Talk to us' }: CTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[2.25rem] bg-navy-gradient px-8 py-14 md:px-16 md:py-20 text-center"
    >
      <motion.div
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl"
        animate={{ x: [0, 30, -10, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl"
        animate={{ x: [0, -25, 15, 0], y: [0, -15, 10, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-2xl text-3xl md:text-4xl font-bold text-cream"
        >
          {title}
        </motion.h2>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-cream/70"
          >
            {description}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button variant="primary" size="lg">
              {primaryLabel} <ArrowRight size={18} />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button variant="ghost" size="lg" className="text-cream hover:bg-white/10">
              {secondaryLabel}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
