import { Instagram, Facebook, Linkedin, Youtube, MessageCircle, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import { Container } from './ui/Container';
import { useParallax } from '@/hooks/useParallax';
import { CATEGORIES, NAV_LINKS, SITE } from '@/constants/content';

const SOCIAL_LINKS = [
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: MessageCircle, label: 'WhatsApp', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
];

export function Footer() {
  const { ref: parallaxRef, y } = useParallax(14);

  return (
    <footer ref={parallaxRef} className="relative overflow-hidden bg-navy-800 pt-16 pb-8 text-cream/70">
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl"
      />
      <Container className="relative">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo dark />
            <p className="mt-4 text-sm leading-relaxed">
              The platform where creators, brands and fans collaborate — live sessions, donations
              and brand deals, all protected in one place.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={`Fanitt on ${social.label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-orange-500"
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/40">Platform</p>
              <ul className="space-y-2 text-sm">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="hover:text-orange-400">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/40">Popular Categories</p>
              <ul className="space-y-2 text-sm">
                {CATEGORIES.slice(0, 5).map((c) => (
                  <li key={c.label}>
                    <a href="#categories" className="hover:text-orange-400">{c.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-cream/40">Company</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-400">About Us</a></li>
                <li><a href="#" className="hover:text-orange-400">Contact Us</a></li>
                <li><a href="#" className="hover:text-orange-400">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-orange-400">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-cream/40">Get the app</p>
          <div className="flex gap-3">
            <a href="#" className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/20">
              <Smartphone size={16} /> App Store
            </a>
            <a href="#" className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/20">
              <Smartphone size={16} /> Google Play
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Fanitt. All rights reserved.</p>
          <p>{SITE.url}</p>
        </div>
      </Container>
    </footer>
  );
}
