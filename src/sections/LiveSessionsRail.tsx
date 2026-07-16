import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Zap, Check, Star, IndianRupee } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { useParallax } from '@/hooks/useParallax';
import { creatorApi, type ApiCreator } from '@/services/creatorApi';

const TAG_COLORS = ['bg-navy-700', 'bg-teal-500', 'bg-yellow-400', 'bg-navy-300'];

const NOTIFICATIONS = [
  { icon: IndianRupee, text: 'New session booked · ₹149', tone: 'teal' as const },
  { icon: Star, text: 'New 5-star review', tone: 'yellow' as const },
  { icon: Check, text: 'Payment released · ₹12,000', tone: 'navy' as const },
];

const notifToneClasses = {
  teal: 'bg-teal-500/15 text-teal-300',
  yellow: 'bg-yellow-400/15 text-yellow-300',
  navy: 'bg-white/10 text-white/80',
};

export function LiveSessionsRail() {
  const { ref: parallaxRef, y } = useParallax(18);
  const [featured, setFeatured] = useState<ApiCreator | null>(null);

  useEffect(() => {
    creatorApi
      .list({ page: 1 })
      .then((d) => setFeatured(d.creators[0] || null))
      .catch(() => setFeatured(null));
  }, []);

  return (
    <section id="live-sessions" ref={parallaxRef} className="py-section-mobile md:py-section">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[2rem] bg-white/[0.06] backdrop-blur-xl border border-white/10 p-5 shadow-lifted sm:rounded-[2.5rem] sm:p-12 md:p-16"
        >
          <motion.div
            style={{ y }}
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl"
          />
          <motion.div
            style={{ y }}
            className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-navy-300/10 blur-3xl"
          />

          <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
            {/* left: pitch */}
            <div>
              <Badge tone="teal">For Creators</Badge>
              <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white sm:mt-4 sm:text-3xl md:text-4xl">
                Create your Fanitt page in a flash
              </h2>
              <p className="mt-2 max-w-md text-sm text-white/60 sm:mt-3 sm:text-base">
                Start earning by the time you finish reading this page — a portfolio, a booking
                calendar, and a payout account, live in minutes.
              </p>

              <motion.a
                href="#for-creators"
                whileHover={{ x: 4 }}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold sm:mt-7 sm:text-base text-white underline decoration-teal-400 decoration-2 underline-offset-4"
              >
                Launch your page <ArrowUpRight size={18} />
              </motion.a>
            </div>

            {/* right: page mockup, Topmate-style */}
            <div className="relative">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3.5 shadow-card sm:rounded-[1.75rem] sm:p-5"
              >
                <div className="flex items-center gap-2.5 rounded-2xl bg-white/[0.06] p-3 shadow-soft sm:gap-3 sm:p-4">
                  {featured?.user.avatarUrl ? (
                    <img src={featured.user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover sm:h-12 sm:w-12" width={48} height={48} />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-300 sm:h-12 sm:w-12">
                      {(featured?.user.name || 'Y').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{featured?.user.name || 'Your Name'}</p>
                    <p className="truncate text-xs text-white/60">fanitt.com/{featured?.slug || 'you'}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    {TAG_COLORS.map((c, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', stiffness: 350, damping: 14, delay: 0.2 + i * 0.08 }}
                        className={`h-2.5 w-2.5 rounded-full ${c}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2.5 sm:mt-4 sm:gap-4">
                  <motion.div
                    animate={{ boxShadow: ['0 0 0 0 rgba(20,184,166,0.35)', '0 0 0 14px rgba(20,184,166,0)'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy-700 sm:h-24 sm:w-24"
                  >
                    <Zap size={22} className="text-teal-400" fill="currentColor" />
                  </motion.div>

                  <div className="flex-1 space-y-2">
                    {NOTIFICATIONS.map((n, i) => (
                      <motion.div
                        key={n.text}
                        initial={{ opacity: 0, x: 24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.4 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold sm:gap-2 sm:px-3 sm:py-2 sm:text-xs ${notifToneClasses[n.tone]}`}
                      >
                        <n.icon size={13} />
                        {n.text}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
