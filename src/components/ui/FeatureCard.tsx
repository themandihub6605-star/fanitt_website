import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/utils/cn';

interface FeatureCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  index?: number;
  accent?: 'orange' | 'teal' | 'navy';
}

const accentBg = {
  orange: 'bg-orange-500/15 text-orange-400 ring-1 ring-inset ring-orange-500/20',
  teal: 'bg-teal-500/15 text-teal-400 ring-1 ring-inset ring-teal-500/20',
  navy: 'bg-navy-700/5 text-white ring-1 ring-inset ring-white/10',
};

export function FeatureCard({ icon: Icon, title, description, index = 0, accent = 'orange' }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="group h-full">
        {Icon && (
          <div
            className={cn(
              'mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3',
              accentBg[accent]
            )}
          >
            <Icon size={20} strokeWidth={2.2} />
          </div>
        )}
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {description && <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>}
      </Card>
    </motion.div>
  );
}
