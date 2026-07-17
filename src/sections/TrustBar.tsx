import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { useCounter } from '@/hooks/useCounter';
import { useParallax } from '@/hooks/useParallax';
import { statsApi, type PublicStats } from '@/services/statsApi';

function formatK(n: number) {
  return n >= 1000 ? `${Math.floor(n / 1000)}K` : `${n}`;
}

function formatCrores(paise: number) {
  const rupees = paise / 100;
  return rupees >= 10000000 ? (rupees / 10000000).toFixed(1) : (rupees / 100000).toFixed(1);
}

const DUMMY_STATS: PublicStats = {
  sessionsBooked: 8400,
  activeCreators: 1200,
  activeBrands: 350,
  totalPaidOut: 8500000000, // ₹85L, in paise
};

export function TrustBar() {
  const { ref: parallaxRef, y } = useParallax(10);
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    statsApi
      .getPublic()
      .then((data) => {
        const allZero = !data.sessionsBooked && !data.activeCreators && !data.activeBrands && !data.totalPaidOut;
        setStats(allZero ? DUMMY_STATS : data);
      })
      .catch(() => setStats(DUMMY_STATS));
  }, []);

  if (!stats) return null;

  const items = [
    { target: stats.sessionsBooked, suffix: '+', prefix: '', display: formatK, label: 'Sessions booked' },
    { target: stats.activeCreators, suffix: '+', prefix: '', display: formatK, label: 'Active creators' },
    { target: stats.activeBrands, suffix: '+', prefix: '', display: formatK, label: 'Brands hiring' },
    {
      target: stats.totalPaidOut,
      suffix: stats.totalPaidOut / 100 >= 10000000 ? 'Cr+' : 'L+',
      prefix: '₹',
      display: (n: number) => formatCrores(n),
      label: 'Paid out to creators',
    },
  ];

  return (
    <section ref={parallaxRef} className="border-y border-white/10 bg-navy-800/45 py-8">
      <Container>
        <motion.div style={{ y }} className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((stat, i) => (
            <StatItem key={stat.label} stat={stat} index={i} />
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

function StatItem({
  stat,
  index,
}: {
  stat: { target: number; suffix: string; prefix: string; display: (n: number) => string; label: string };
  index: number;
}) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 100 + index * 80);
    return () => clearTimeout(t);
  }, [index]);

  const count = useCounter(stat.target, started, 1400);

  return (
    <div className="text-center">
      <p className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {stat.prefix}
        {stat.display(count)}
        {stat.suffix}
      </p>
      <p className="mt-1 text-xs font-medium text-white/60 sm:text-sm">{stat.label}</p>
    </div>
  );
}