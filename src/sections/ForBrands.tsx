import { motion } from 'framer-motion';
import { Check, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getAvatar } from '@/utils/avatar';
import { useParallax } from '@/hooks/useParallax';
import { useInView } from '@/hooks/useInView';
import { useCounter } from '@/hooks/useCounter';
import { FOR_BRANDS_POINTS } from '@/constants/content';

const CREW = [
  { name: 'Rhea Kapoor', status: 'Approved' },
  { name: 'Ananya Iyer', status: 'Approved' },
  { name: 'Meher Chawla', status: 'In escrow' },
];

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const listItem = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export function ForBrands() {
  const { ref: parallaxRef, y } = useParallax(20);
  const { ref: cardRef, inView } = useInView<HTMLDivElement>(0.4);
  const budget = useCounter(150000, inView, 1400);

  return (
    <section id="for-brands" ref={parallaxRef} className="py-section-mobile md:py-section">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative -mx-gutter overflow-hidden rounded-none bg-navy-gradient p-8 sm:mx-0 sm:rounded-[2.5rem] sm:p-12 md:p-16"
        >
          <motion.div style={{ y }} className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
          <motion.div style={{ y }} className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="relative grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <motion.div
                ref={cardRef}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[1.75rem] bg-white/[0.06] p-6 backdrop-blur-xl border border-white/10"
              >
                <div className="flex items-center gap-2 text-cream">
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ShieldCheck size={18} className="text-yellow-300" />
                  </motion.span>
                  <p className="text-sm font-bold">Campaign: Summer Skincare Drop</p>
                </div>

                <motion.div
                  variants={listContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.4 }}
                  className="mt-4 space-y-2.5"
                >
                  {CREW.map((person) => (
                    <motion.div
                      key={person.name}
                      variants={listItem}
                      className="flex items-center gap-3 rounded-xl bg-white/5 p-3"
                    >
                      <img src={getAvatar(person.name)} alt="" className="h-9 w-9 rounded-full object-cover bg-white/10" width={36} height={36} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-cream">{person.name}</p>
                        <p className="text-[11px] text-cream/50">Work submitted</p>
                      </div>
                      <motion.span
                        initial={{ opacity: 0, scale: 0.6 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 15 }}
                        className="rounded-full bg-teal-500/20 px-2.5 py-1 text-[10px] font-bold text-teal-300"
                      >
                        {person.status}
                      </motion.span>
                    </motion.div>
                  ))}
                </motion.div>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                  <span className="text-cream/60">Budget deposited</span>
                  <span className="font-bold text-cream">₹{budget.toLocaleString('en-IN')}</span>
                </div>
              </motion.div>
            </div>

            <div className="order-1 lg:order-2">
              <Badge tone="yellow">For Brands</Badge>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight tracking-tight text-cream">
                Find, hire and pay creators — without the risk
              </h2>
              <p className="mt-3 max-w-md text-cream/70">
                No business email or website needed. Just the right creators, a protected budget, and clear results.
              </p>

              <motion.ul
                variants={listContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                className="mt-6 space-y-3"
              >
                {FOR_BRANDS_POINTS.map((point) => (
                  <motion.li key={point} variants={listItem} className="flex items-start gap-3 text-sm text-cream/80">
                    <motion.span
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-navy-800"
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
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <Button as="a" href="/campaigns/new" variant="secondary" className="mt-7 !bg-orange-500 hover:!bg-orange-600">
                  Launch a campaign
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
