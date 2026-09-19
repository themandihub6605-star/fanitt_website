import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FAQItem {
  question: string;
  answer: string;
}

/** Reusable FAQ accordion — bordered card list, dark-theme native. */
export function FAQ({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={item.question}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'overflow-hidden rounded-2xl border transition-colors duration-300 ease-out',
              isOpen
                ? 'border-orange-500/40 bg-gradient-to-br from-orange-500/[0.08] via-navy-800/70 to-navy-800/70 shadow-card'
                : 'border-white/10 bg-navy-800/50 hover:border-white/20 hover:bg-navy-800/70'
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
              aria-expanded={isOpen}
            >
              <span className={cn('text-sm font-bold transition-colors sm:text-base', isOpen ? 'text-orange-300' : 'text-white')}>
                {item.question}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 135 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
                  isOpen
                    ? 'border-orange-500/40 bg-orange-500 text-white'
                    : 'border-white/15 bg-white/5 text-white/60'
                )}
              >
                <Plus size={16} strokeWidth={2.5} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <motion.p
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    className="max-w-2xl px-5 pb-5 text-sm leading-relaxed text-white/60 sm:px-6"
                  >
                    {item.answer}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}