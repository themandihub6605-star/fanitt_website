import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FAQItem {
  question: string;
  answer: string;
}

/** Reusable FAQ accordion - flat, left-aligned list style. */
export function FAQ({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-white/10 border-t border-white/10">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={item.question}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 rounded-lg px-2 py-5 text-left transition-colors hover:bg-orange-50/50"
              aria-expanded={isOpen}
            >
              <span className={cn('font-semibold transition-colors', isOpen ? 'text-orange-400' : 'text-white')}>
                {item.question}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="shrink-0 text-orange-500"
              >
                <ChevronDown size={18} />
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
                    initial={{ x: -8, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    className="max-w-2xl px-2 pb-5 text-sm leading-relaxed text-white/60"
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
