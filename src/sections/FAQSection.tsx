import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { FAQ } from '@/components/ui/FAQ';
import { useParallax } from '@/hooks/useParallax';
import { FAQ_ITEMS } from '@/constants/content';

export function FAQSection() {
  const { ref: parallaxRef, y } = useParallax(18);

  return (
    <section ref={parallaxRef} className="relative overflow-hidden py-section-mobile md:py-section">
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute -bottom-16 left-[-8%] h-64 w-64 rounded-full bg-teal-300/15 blur-3xl"
      />
      <Container className="relative max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <Badge tone="orange">FAQ</Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight tracking-tight text-white">
            Frequently asked questions
          </h2>
        </motion.div>

        <div className="mt-10">
          <FAQ items={FAQ_ITEMS} />
        </div>
      </Container>
    </section>
  );
}
