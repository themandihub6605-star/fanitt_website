import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Instagram, Facebook, Linkedin, Youtube, AtSign } from 'lucide-react';
import { Container } from '@/components/ui/Container';

const CONTACT_DETAILS = [
  { icon: Phone, label: 'Phone', value: '+91 92014 69274', href: 'tel:+919201469274' },
  { icon: Mail, label: 'Email', value: 'info@fanitt.com', href: 'mailto:info@fanitt.com' },
  { icon: MapPin, label: 'Address', value: 'Bhopal, Madhya Pradesh', href: undefined },
];

const SOCIAL_LINKS = [
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/fanitt.live/' },
  { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61591263694235' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/142918157' },
  { icon: AtSign, label: 'Threads', href: 'https://www.threads.com/@fanitt.live' },
  { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@FanittLive' },
];

export default function ContactUs() {
  return (
    <div className="pt-28 pb-24">
      <Container className="max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Get in touch</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Contact <span className="brand-gradient-text">Us</span>
          </h1>
          <p className="mt-3 max-w-xl text-white/60">
            Questions, feedback, or need help with your account? We're happy to hear from you.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CONTACT_DETAILS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="rounded-2xl border border-white/10 bg-navy-800/60 p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
                <item.icon size={20} />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/40">{item.label}</p>
              {item.href ? (
                <a href={item.href} className="mt-1 block font-semibold text-white hover:text-orange-300">
                  {item.value}
                </a>
              ) : (
                <p className="mt-1 font-semibold text-white">{item.value}</p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-10 rounded-2xl border border-white/10 bg-navy-800/40 p-6"
        >
          <p className="text-sm font-semibold text-white/80">Follow us</p>
          <div className="mt-4 flex gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Fanitt on ${social.label}`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-orange-500 hover:text-white"
              >
                <social.icon size={18} />
              </a>
            ))}
          </div>
        </motion.div>
      </Container>
    </div>
  );
}