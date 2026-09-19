import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CalendarCheck, Video, ShieldCheck, Check, Radio, MessageCircle, Heart } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { IconTile } from '@/components/ui/IconTile';
import { getAvatar } from '@/utils/avatar';
import { cn } from '@/utils/cn';
import logoUrl from '@/assets/brand/fanittLogoNew.png';

const STEPS = [
  {
    icon: Search,
    tone: 'orange' as const,
    title: 'Discover the right creator',
    description: 'Filter by category, location, followers and availability to find exactly who you need.',
  },
  {
    icon: CalendarCheck,
    tone: 'teal' as const,
    title: 'Book in one click',
    description: 'Pick a free or paid slot. Confirmations and reminders go out automatically, on web and mobile.',
  },
  {
    icon: Video,
    tone: 'navy' as const,
    title: 'Go live, together',
    description: "HD video, chat, reactions and live donations — powered by Zoom Video SDK under the hood.",
  },
  {
    icon: ShieldCheck,
    tone: 'orange' as const,
    title: 'Get paid, safely',
    description: 'Brand budgets sit in escrow and release the moment work is approved. No chasing invoices.',
  },
];

const STEP_DURATION = 4000;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const fadeUpItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export function ProductShowcase() {
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setActive((p) => (p + 1) % STEPS.length), STEP_DURATION);
    return () => clearTimeout(id);
  }, [active, cycle]);

  const goTo = (i: number) => {
    setActive(i);
    setCycle((c) => c + 1);
  };

  const step = STEPS[active];

  return (
    <section className="py-section-mobile md:py-section">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="orange">How Fanitt Works</Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight tracking-tight text-white">
            From discovery to payout, in four steps
          </h2>
        </div>

        {/* auto-advancing tabs with animated progress bar */}
        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              onClick={() => goTo(i)}
              className={cn(
                'group relative overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-colors',
                active === i ? 'border-orange-400/50 bg-orange-500/15' : 'border-white/10 bg-navy-800/70 hover:border-white/15'
              )}
            >
              <span className="flex items-center gap-2">
                <s.icon size={14} className={active === i ? 'text-orange-500' : 'text-white/60'} />
                <span className={cn('text-xs font-bold leading-snug', active === i ? 'text-white' : 'text-white/60')}>
                  {s.title}
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
                {active === i && (
                  <motion.span
                    key={cycle}
                    className="absolute inset-y-0 left-0 bg-orange-500"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: STEP_DURATION / 1000, ease: 'linear' }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        {/* content panel — compact, fixed height, no scroll-runway needed */}
        <div className="relative mt-6">
          <div className="pointer-events-none absolute -top-10 -left-10 h-64 w-64 rounded-full bg-orange-200/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-teal-200/25 blur-3xl" />

          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-navy-800/55 backdrop-blur-xl shadow-lifted">
            <div className="flex items-center gap-2 border-b border-white/10 bg-navy-800/55 px-6 py-3.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-teal-300" />
              <img src={logoUrl} alt="" className="ml-3 h-5 w-auto opacity-70" />
              <span className="text-xs font-medium text-white/50">fanitt.com — {step.title.toLowerCase()}</span>
            </div>

            <div className="grid md:grid-cols-2">
              <div className="relative flex min-h-[300px] items-center p-6 sm:min-h-[440px] sm:p-12 md:p-16">
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: 'radial-gradient(circle, #1A1A1A 1px, transparent 1px)', backgroundSize: '22px 22px' }}
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="relative"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                      Step {active + 1} of {STEPS.length}
                    </span>
                    <motion.div
                      initial={{ scale: 0.6, rotate: -8 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.05 }}
                      className="mt-3"
                    >
                      <IconTile icon={step.icon} tone={step.tone} className="!h-12 !w-12 shadow-card sm:!h-16 sm:!w-16 [&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-7 sm:[&>svg]:w-7" />
                    </motion.div>
                    <h3 className="mt-3 text-xl font-bold text-white sm:mt-5 sm:text-2xl md:text-3xl">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60 sm:mt-3 sm:text-lg">{step.description}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative min-h-[260px] border-t border-white/10 bg-white/[0.02] p-6 sm:min-h-[440px] sm:p-12 md:border-l md:border-t-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex h-full items-center"
                  >
                    {active === 0 && <DiscoverMock />}
                    {active === 1 && <BookMock />}
                    {active === 2 && <LiveMock />}
                    {active === 3 && <PayMock />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function DiscoverMock() {
  const creators = [
    { seed: 'rhea-kapoor', name: 'Rhea Kapoor', tag: 'Fitness Coach' },
    { seed: 'aarav-mehta', name: 'Aarav Mehta', tag: 'Music Producer' },
    { seed: 'kabir-anand', name: 'Kabir Anand', tag: 'Illustrator' },
    { seed: 'devika-rao', name: 'Devika Rao', tag: 'Comedian' },
  ];
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full">
      <motion.div variants={fadeUpItem} className="flex flex-wrap gap-2">
        {['Fitness', 'Music', 'Art', 'Comedy'].map((c, i) => (
          <span
            key={c}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold',
              i === 0 ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/70'
            )}
          >
            {c}
          </span>
        ))}
      </motion.div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-2.5">
        {creators.map((c) => (
          <motion.div
            key={c.seed}
            variants={fadeUpItem}
            className="flex items-center gap-2.5 rounded-xl bg-white/10 p-2.5 shadow-soft"
          >
            <img src={getAvatar(c.seed)} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" width={36} height={36} />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">{c.name}</p>
              <p className="truncate text-[10px] text-white/60">{c.tag}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function BookMock() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full">
      <motion.p variants={fadeUpItem} className="text-sm font-bold text-white">
        Select a time — Wed, 9 Jul
      </motion.p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {['9:00', '9:30', '10:00', '10:30', '11:00', '11:30'].map((t, i) => (
          <motion.span
            key={t}
            variants={fadeUpItem}
            className={cn(
              'rounded-lg py-2 text-center text-xs font-semibold',
              i === 3 ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/70'
            )}
          >
            {t}
          </motion.span>
        ))}
      </div>
      <motion.div
        variants={fadeUpItem}
        className="mt-4 flex items-center justify-between rounded-xl bg-teal-500/10 p-3"
      >
        <span className="text-xs font-semibold text-teal-700">Confirmed for 10:30 AM</span>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.6 }}
        >
          <Check size={16} className="text-teal-400" />
        </motion.span>
      </motion.div>
      <motion.div variants={fadeUpItem} className="mt-3 flex items-center justify-between rounded-xl bg-white/10 p-3 shadow-soft">
        <span className="text-xs text-white/60">Duration</span>
        <span className="text-xs font-bold text-white">20 minutes</span>
      </motion.div>
      <motion.div variants={fadeUpItem} className="mt-2 flex items-center justify-between rounded-xl bg-white/10 p-3 shadow-soft">
        <span className="text-xs text-white/60">Price</span>
        <span className="text-xs font-bold text-white">₹149</span>
      </motion.div>
    </motion.div>
  );
}

function LiveMock() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full">
      <motion.div variants={fadeUpItem} className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-bold text-danger">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Radio size={11} />
          </motion.span>
          LIVE
        </span>
        <span className="text-xs text-white/60">32 watching</span>
      </motion.div>

      <motion.div
        variants={fadeUpItem}
        className="mt-4 flex h-28 items-center justify-center rounded-xl bg-navy-800"
      >
        <motion.div
          animate={{ boxShadow: ['0 0 0 0 rgba(45,212,191,0.5)', '0 0 0 10px rgba(45,212,191,0)'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          className="rounded-full"
        >
          <img src={getAvatar('devika-rao')} alt="" className="h-14 w-14 rounded-full object-cover ring-4 ring-white/10" width={56} height={56} />
        </motion.div>
      </motion.div>

      <div className="mt-4 space-y-2">
        <motion.div variants={fadeUpItem} className="flex items-center gap-2 text-xs text-white/70">
          <MessageCircle size={13} className="text-orange-500" /> "This is so helpful!"
        </motion.div>
        <motion.div variants={fadeUpItem} className="flex items-center gap-2 text-xs text-white/70">
          <Heart size={13} className="text-orange-500" /> 214 reactions
        </motion.div>
      </div>
    </motion.div>
  );
}

function PayMock() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full">
      <motion.p variants={fadeUpItem} className="text-sm font-bold text-white">
        Campaign budget
      </motion.p>
      <motion.div variants={fadeUpItem} className="mt-3 h-2.5 w-full rounded-full bg-white/10">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '80%' }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="h-2.5 rounded-full bg-orange-500"
        />
      </motion.div>
      <motion.div variants={fadeUpItem} className="mt-3 flex items-center justify-between text-xs text-white/60">
        <span>₹1,20,000 released</span>
        <span>₹1,50,000 total</span>
      </motion.div>
      <motion.div
        variants={fadeUpItem}
        className="mt-4 flex items-center gap-3 rounded-xl bg-teal-500/10 p-3"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.8 }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-white"
        >
          <Check size={14} />
        </motion.span>
        <span className="text-xs font-semibold text-teal-700">Payment released to creator</span>
      </motion.div>
    </motion.div>
  );
}
