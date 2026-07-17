import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ParallaxItem } from '@/components/ParallaxItem';
import { ApiSessionCard } from '@/components/ApiSessionCard';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { sessionApi, type ApiSession } from '@/services/sessionApi';

export function LiveSessionsShowcase() {
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    sessionApi
      .list({ page: 1 })
      .then((d) => setSessions(d.sessions.slice(0, 8)))
      .catch(() => setSessions([]))
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && sessions.length === 0) return null;
  if (!loaded) return null;

  return (
    <section id="live-sessions" className="py-section-mobile md:py-section">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-300">
              Live Sessions
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Every session happening on Fanitt
            </h2>
          </div>
          <Link to="/sessions">
            <Button variant="outline" size="sm">
              View all <ArrowRight size={15} />
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex gap-4 overflow-x-auto pb-3 pr-6 sm:gap-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sessions.map((session, i) => (
            <ParallaxItem key={session._id} speed={i % 2 === 0 ? 10 : -10}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
              >
                <ApiSessionCard session={session} />
              </motion.div>
            </ParallaxItem>
          ))}
        </div>
      </Container>
    </section>
  );
}