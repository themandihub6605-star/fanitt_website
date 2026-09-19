import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { useInView } from '@/hooks/useInView';
import flipBg from '@/assets/brand/flipbeg.png';
import flipBgMobile from '@/assets/brand/mobileviewcardflip.png';

interface CTAProps {
  title: string;
  description?: string;
  eyebrow?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  primaryVariant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  primaryClassName?: string;
}

export function CTA({
  title,
  description,
  eyebrow = "Let's go",
  primaryLabel = 'Get Started',
  secondaryLabel = 'Talk to us',
  onPrimaryClick,
  onSecondaryClick,
  primaryVariant = 'primary',
  primaryClassName,
}: CTAProps) {
  const [flipped, setFlipped] = useState(false);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>(0.5);

  // One-time auto demo: once the card scrolls into view, flip it to the
  // back and then back to the front on its own, so people notice it's
  // flippable — then it's purely manual via the icon from then on.
  useEffect(() => {
    if (!inView) return;
    const showBack = setTimeout(() => setFlipped(true), 700);
    const showFront = setTimeout(() => setFlipped(false), 2600);
    return () => {
      clearTimeout(showBack);
      clearTimeout(showFront);
    };
  }, [inView]);

  return (
    <motion.div
      ref={viewRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1800 }}
      className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-orange-500/50 via-pink-500/30 to-yellow-400/40 p-[1.5px] shadow-lifted"
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative min-h-[520px] rounded-[calc(2.25rem-1.5px)] sm:min-h-[420px]"
      >
        {/* ───────── FRONT ───────── */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[calc(2.25rem-1.5px)] bg-navy-gradient px-5 py-10 text-center sm:px-8 sm:py-14 md:px-16 md:py-20"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '26px 26px' }}
          />
          <motion.div
            className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-orange-500/25 blur-3xl"
            animate={{ x: [0, 30, -10, 0], y: [0, 20, -10, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-pink-500/15 blur-3xl"
            animate={{ x: [0, -25, 15, 0], y: [0, -15, 10, 0] }}
            transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.button
            type="button"
            onClick={() => setFlipped(true)}
            aria-label="Flip card"
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 shadow-soft backdrop-blur-sm transition-colors duration-300 hover:border-orange-400/40 hover:bg-orange-500/15 hover:text-orange-300"
          >
            <RefreshCw size={16} />
          </motion.button>

          <div className="relative w-full">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-orange-300">
              <Sparkles size={12} /> {eyebrow}
            </span>

            <h2 className="mx-auto mt-4 max-w-2xl break-words text-2xl font-bold text-cream sm:text-3xl md:text-4xl">{title}</h2>

            {description && <p className="mx-auto mt-3 max-w-xl break-words text-sm text-cream/70 sm:mt-4 sm:text-base">{description}</p>}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8 sm:gap-4">
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button variant={primaryVariant} size="lg" onClick={onPrimaryClick} className={primaryClassName}>
                  {primaryLabel} <ArrowRight size={18} />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="!border-white/20 !text-cream hover:!border-orange-400 hover:!bg-white/5 hover:!text-orange-300"
                  onClick={onSecondaryClick}
                >
                  {secondaryLabel}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ───────── BACK ───────── */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0 overflow-hidden rounded-[calc(2.25rem-1.5px)] bg-navy-900"
        >
          <img
            src={flipBgMobile}
            alt=""
            className="absolute inset-0 h-full w-full object-cover brightness-[1.05] contrast-[1.08] saturate-[1.25] sm:hidden"
          />
          <img
            src={flipBg}
            alt=""
            className="absolute inset-0 hidden h-full w-full object-cover brightness-[1.05] contrast-[1.08] saturate-[1.25] sm:block"
          />
          {/* Brand-color wash (blend, not a solid block) so the photo stays
              clearly visible instead of being buried under a dark panel. */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/35 via-transparent to-pink-600/25 mix-blend-overlay" />
          {/* Light bottom darkening — just enough to keep the button legible,
              no text on this face anymore so the wash stays minimal. */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-transparent to-transparent" />

          <motion.button
            type="button"
            onClick={() => setFlipped(false)}
            aria-label="Flip back"
            whileHover={{ scale: 1.1, rotate: -180 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 shadow-soft backdrop-blur-sm transition-colors duration-300 hover:border-orange-400/40 hover:bg-orange-500/15 hover:text-orange-300"
          >
            <RefreshCw size={16} />
          </motion.button>

          <div className="relative flex h-full flex-col items-center justify-end px-8 pb-12 md:px-16">
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Button variant="primary" size="lg" onClick={() => setFlipped(false)} className="!bg-orange-500 hover:!bg-orange-400 !bg-none">
                Back to details <RefreshCw size={16} />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}