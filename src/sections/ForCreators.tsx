import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getAvatar } from '@/utils/avatar';
import { useInView } from '@/hooks/useInView';
import { useCounter } from '@/hooks/useCounter';
import { FOR_CREATORS_POINTS } from '@/constants/content';

const listContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
};

const listItem = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export function ForCreators() {
  const { ref: cardRef, inView } = useInView<HTMLDivElement>(0.4);
  const earnings = useCounter(86400, inView, 1400);
  const sessions = useCounter(312, inView, 1200);
  const followers = useCounter(48, inView, 1000);

  return (
    <section id="for-creators" className="py-section-mobile md:py-section">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <Badge tone="orange">For Creators</Badge>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight text-white">
              Turn your following into a business
            </h2>
            <p className="mt-3 max-w-md text-white/60">
              A portfolio, a booking page, and a payout account — all in one profile your fans can find.
            </p>

            <motion.ul
              variants={listContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              className="mt-6 space-y-3"
            >
              {FOR_CREATORS_POINTS.map((point) => (
                <motion.li key={point} variants={listItem} className="flex items-start gap-3 text-sm text-white/80">
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white"
                  >
                    <Check size={12} />
                  </motion.span>
                  {point}
                </motion.li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <Button as="a" href="/signup" className="mt-7">Become a creator</Button>
            </motion.div>
          </motion.div>

          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[2rem] bg-sunrise-gradient opacity-15 blur-2xl" />

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.02 }}
              className="rounded-[2rem] bg-navy-800/70 backdrop-blur-xl border border-white/10 p-6 shadow-lifted transition-shadow hover:shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <img src={getAvatar('rhea-kapoor')} alt="" className="h-14 w-14 rounded-full bg-white/10" width={56} height={56} />
                <div>
                  <p className="font-bold text-white">Rhea Kapoor</p>
                  <p className="text-xs text-white/60">Strength & Mobility Coach</p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-1 text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0, rotate: -30 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 300, damping: 12 }}
                  >
                    <Star size={14} fill="currentColor" />
                  </motion.span>
                ))}
                <span className="ml-2 text-xs font-semibold text-white/70">4.9 (312 sessions)</span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-navy-800/60 p-3">
                  <p className="font-display text-lg font-bold text-white">₹{earnings.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-white/60">This month</p>
                </div>
                <div className="rounded-xl bg-navy-800/60 p-3">
                  <p className="font-display text-lg font-bold text-white">{sessions}</p>
                  <p className="text-[11px] text-white/60">Sessions</p>
                </div>
                <div className="rounded-xl bg-navy-800/60 p-3">
                  <p className="font-display text-lg font-bold text-white">{followers}K</p>
                  <p className="text-[11px] text-white/60">Followers</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
