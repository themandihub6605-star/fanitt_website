import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ParallaxItem } from '@/components/ParallaxItem';
import { ApiSessionCard } from '@/components/ApiSessionCard';
import { Container } from '@/components/ui/Container';
import { sessionApi, type ApiSession } from '@/services/sessionApi';

export function FreeSessions() {
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    sessionApi
      .list({ free: true, page: 1 })
      .then((d) => setSessions(d.sessions.slice(0, 6)))
      .catch(() => setSessions([]))
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && sessions.length === 0) return null;
  if (!loaded) return null;

  return (
    <section className="py-section-mobile md:py-section">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Your free introduction session is ready
          </h2>
          <a href="/campaigns" className="text-sm font-semibold text-orange-400 underline-offset-4 hover:underline">
            View all
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sessions.map((session, i) => (
            <ParallaxItem key={session._id} speed={i % 3 === 0 ? 12 : i % 3 === 1 ? -12 : 6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <ApiSessionCard session={session} className="w-full" />
              </motion.div>
            </ParallaxItem>
          ))}
        </div>
      </Container>
    </section>
  );
}
