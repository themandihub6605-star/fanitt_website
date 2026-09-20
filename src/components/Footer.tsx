import { Link } from 'react-router-dom';
import { Instagram, Facebook, Linkedin, MessageCircle, Youtube, Twitter, LayoutGrid, Star, Building2, Crown, Apple, PlayCircle, ArrowRight, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { Container } from './ui/Container';
import { useParallax } from '@/hooks/useParallax';
import { CATEGORIES, NAV_LINKS, SITE } from '@/constants/content';

// NOTE: Discord and X don't have confirmed live Fanitt accounts in the
// codebase yet (the other links below all point to real, verified profile
// URLs) — these two use a placeholder handle pattern matching the others
// until the real links are confirmed, rather than guessing wrong ones.
const SOCIAL_LINKS = [
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/fanitt.live/' },
  { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61591263694235' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/142918157' },
  { icon: MessageCircle, label: 'Discord', href: 'https://discord.gg/fanitt' },
  { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@FanittLive' },
  { icon: Twitter, label: 'X', href: 'https://x.com/fanittlive' },
];

export function Footer() {
  const { ref: parallaxRef, y } = useParallax(14);

  return (
    <footer ref={parallaxRef} className="relative overflow-hidden bg-navy-800 pt-16 pb-8 text-cream/70">
      {/* Decorative flowing orange arcs, top-left and bottom-right corners */}
      <svg className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 text-orange-500/40" viewBox="0 0 200 200" fill="none">
        <path d="M0 60C50 60 60 0 120 0" stroke="currentColor" strokeWidth="1.5" />
        <path d="M0 90C70 90 85 10 160 10" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      </svg>
      <svg className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 text-orange-500/40" viewBox="0 0 200 200" fill="none">
        <path d="M200 140C150 140 140 200 80 200" stroke="currentColor" strokeWidth="1.5" />
        <path d="M200 110C130 110 115 190 40 190" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      </svg>

      <motion.div
        style={{ y }}
        className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl"
      />
      <Container className="relative">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <Logo dark />
            <h3 className="mt-4 text-xl font-bold text-white">
              Creators. Brands. <span className="text-orange-400">Bigger Together.</span>
            </h3>
            <p className="mt-3 text-sm leading-relaxed">
              The platform where creators, brands and fans collaborate — live sessions, donations
              and brand deals, all protected in one place.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Fanitt on ${social.label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-500/40 text-white transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-110 hover:border-orange-500 hover:bg-orange-500 hover:shadow-glow"
                >
                  <social.icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 divide-white/10 sm:grid-cols-3 sm:divide-x">
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-400">
                <LayoutGrid size={13} /> Platform
              </p>
              <ul className="space-y-2.5 text-sm">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link to={l.href} className="transition-colors hover:text-orange-400">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:pl-8">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-400">
                <Star size={13} /> Popular Categories
              </p>
              <ul className="space-y-2.5 text-sm">
                {CATEGORIES.slice(0, 5).map((c) => (
                  <li key={c.label}>
                    <a href="#categories" className="transition-colors hover:text-orange-400">{c.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:pl-8">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-400">
                <Building2 size={13} /> Company
              </p>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/contact" className="transition-colors hover:text-orange-400">Contact Us</Link></li>
                <li><Link to="/faq" className="transition-colors hover:text-orange-400">FAQ</Link></li>
                <li><Link to="/privacy-policy" className="transition-colors hover:text-orange-400">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="shrink-0 lg:w-64">
            <div className="flex items-center gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/5 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
                <Crown size={16} />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Get the Fanitt App</p>
                <p className="text-xs text-white/40">Create. Connect. Grow.</p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2.5 sm:flex-row lg:flex-col">
              <a
                href="#"
                className="group flex flex-1 items-center gap-2 rounded-xl border border-orange-500/30 bg-navy-900/60 px-3.5 py-2.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-orange-400/60 hover:shadow-card"
              >
                <Apple size={20} className="shrink-0 text-white" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] leading-tight text-white/50">Download on the</span>
                  <span className="block text-sm font-bold leading-tight text-white">App Store</span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-white/40 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#"
                className="group flex flex-1 items-center gap-2 rounded-xl border border-orange-500/30 bg-navy-900/60 px-3.5 py-2.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-orange-400/60 hover:shadow-card"
              >
                <PlayCircle size={20} className="shrink-0 text-white" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] leading-tight text-white/50">GET IT ON</span>
                  <span className="block text-sm font-bold leading-tight text-white">Google Play</span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-white/40 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Fanitt. All rights reserved.</p>
          <p className="flex items-center gap-1.5"><Globe size={13} /> {SITE.url}</p>
        </div>
      </Container>
    </footer>
  );
}