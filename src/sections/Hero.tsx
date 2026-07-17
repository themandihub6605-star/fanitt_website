import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
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

/** Mobile-only app splash screen shown to logged-out visitors — matches the
 * reference app's first screen (logo, tagline, Create Account / Log In).
 * No Google button here — role picker lives on the Signup page. */
function MobileSplash() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden px-6 pb-10 pt-10 lg:hidden">
      <img
        src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1200&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0A0A0A]/50 to-[#0A0A0A]" />

      <div className="relative flex flex-col items-center text-center">
        <Logo className="h-14 w-auto" />
        <p className="mt-2 text-sm font-medium text-white/70">Live This Life</p>
      </div>

      <div className="relative mt-auto text-center">
        <h1 className="text-3xl font-bold leading-tight text-white">
          Where Creators
          <br />
          <span className="brand-gradient-text">Live. Connect. Earn.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-white/60">
          Join a community that celebrates talent and turns passion into income.
        </p>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-5 rounded-full bg-orange-500" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        </div>

        <div className="mt-8 space-y-3">
          <Button as="a" href="/signup" size="lg" className="w-full justify-center">
            Continue with Google <ArrowRight size={18} />
          </Button>
          <Button as="a" href="/login" variant="outline" size="lg" className="w-full justify-center !border-white/20">
            I already have an account
          </Button>
        </div>

        <p className="mt-6 text-xs text-white/40">
          By continuing, you agree to our{' '}
          <a href="#" className="text-orange-400">Terms of Service</a> and{' '}
          <a href="#" className="text-orange-400">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export function Hero() {
  const [active, setActive] = useState(0);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

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

  return (
    <>
      {!isAuthenticated && <MobileSplash />}

      <section className={`relative isolate overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28 ${!isAuthenticated ? 'hidden lg:block' : ''}`}>
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
              className="mt-8 flex flex-wrap justify-center gap-4 xl:justify-start"
            >
              <Button size="lg" as="a" href="/signup">
                Start My Page <ArrowRight size={18} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                as="a"
                href="/campaigns/new"
                className="!border-white/20 !text-cream hover:!border-orange-400 hover:!text-orange-300"
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
    </>
  );
}
