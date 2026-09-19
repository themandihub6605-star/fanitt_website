import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ApiSessionCard } from '@/components/ApiSessionCard';
import { HeroBackdrop } from '@/components/HeroBackdrop';
import { CATEGORIES } from '@/constants/content';
import { sessionApi, type ApiSession } from '@/services/sessionApi';
import { resolveIcon } from '@/utils/icons';
import { useAppSelector } from '@/store/hooks';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] },
  }),
};

const CARD_STYLES = [
  { rotate: 0, scale: 1, x: 0, z: 10 },
  { rotate: 10, scale: 0.86, x: 130, z: 5 },
  { rotate: -10, scale: 0.86, x: -130, z: 5 },
];

// Where a logged-in user's own dashboard lives, by role — Fan has no
// dashboard of its own, so it falls back to the get-started flow same as
// a logged-out visitor would.
function dashboardHrefFor(role?: string) {
  if (role === 'creator') return '/dashboard/creator';
  if (role === 'brand') return '/dashboard/brand';
  if (role === 'agency') return '/dashboard/agency';
  return '/get-started';
}

export function Hero() {
  const [active, setActive] = useState(0);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    sessionApi
      .list({ page: 1 })
      .then((d) => setSessions(d.sessions.slice(0, 3)))
      .catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    if (sessions.length < 2) return;
    const id = setInterval(() => setActive((p) => (p + 1) % sessions.length), 3200);
    return () => clearInterval(id);
  }, [sessions.length]);

  // Logged-in: always land on the person's own dashboard, whatever their
  // role — never re-enter the get-started/signup flow they've already
  // completed. Logged-out: behaves exactly as before.
  const primaryHref = isAuthenticated ? dashboardHrefFor(user?.role) : '/get-started';
  const secondaryHref = isAuthenticated ? dashboardHrefFor(user?.role) : '/get-started';

  const goToPrimary = () => navigate(primaryHref);
  const goToSecondary = () => navigate(secondaryHref);

  return (
    <section className="relative isolate overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      <HeroBackdrop />

      <Container className="relative">
        <div className="grid items-center gap-14 xl:grid-cols-2 xl:gap-10">
          {/* text */}
          <div className="text-center xl:text-left">
            <motion.h1
              custom={0}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="text-4xl font-bold leading-[1.1] tracking-tight text-cream drop-shadow-[0_2px_12px_rgba(16,17,32,0.5)] sm:text-5xl lg:text-6xl"
            >
              Fanitt<span className="text-orange-400">.</span> Where creators, brands
              <span className="relative inline-block px-2">
                <span className="relative z-10">& fans</span>
                <span className="absolute inset-x-1 bottom-1 -z-0 h-3 rounded-full bg-pink-400/40" />
              </span>
              collaborate.
            </motion.h1>

            <motion.p
              custom={1}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-cream/90 drop-shadow-[0_1px_8px_rgba(16,17,32,0.5)] xl:mx-0"
            >
              Book live sessions with real creators, support them directly, or launch a brand
              campaign — with every payment protected until the work is done.
            </motion.p>

            <motion.div
              custom={2}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center xl:justify-start"
            >
                           <Button
                size="lg"
                onClick={goToPrimary}
                className="!bg-orange-500 hover:!bg-orange-400 !bg-none !px-5 !py-2.5 !text-sm sm:!px-8 sm:!py-3.5 sm:!text-base w-full sm:w-auto sm:min-w-[220px] justify-center"
              >
                Start My Page <ArrowRight size={18} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={goToSecondary}
                className="!border-white/20 !text-cream hover:!border-orange-400 hover:!text-orange-300 !px-5 !py-2.5 !text-sm sm:!px-8 sm:!py-3.5 sm:!text-base w-full sm:w-auto sm:min-w-[220px] justify-center"
              >
                Launch a brand campaign
              </Button>
            </motion.div>
          </div>

          {/* fanned session cards — real, bookable sessions once any exist */}
          {sessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex h-[320px] items-center justify-center sm:h-[420px] xl:justify-end xl:pr-6"
            >
              {sessions.map((session, i) => {
                const offset = (i - active + sessions.length) % sessions.length;
                const style = CARD_STYLES[offset] ?? CARD_STYLES[0];
                return (
                  <motion.div
                    key={session._id}
                    className="absolute origin-bottom"
                    animate={{ rotate: style.rotate, scale: style.scale, x: style.x, zIndex: style.z }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ApiSessionCard session={session} className="shadow-lifted" />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* category pills — desktop/tablet only, hidden on mobile */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-14 hidden flex-wrap justify-center gap-3 md:flex"
        >
          {CATEGORIES.map((cat) => {
            const Icon = resolveIcon(cat.icon);
            return (
              <span
                key={cat.label}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-navy-800/70 px-4 py-2 text-sm font-semibold text-cream/80 backdrop-blur-sm transition-transform hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Icon size={15} className="text-orange-400" />
                {cat.label}
              </span>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}