import { motion } from 'framer-motion';
import { Badge } from './Badge';
import { cn } from '@/utils/cn';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  light?: boolean;
  className?: string;
}

export function SectionTitle({ eyebrow, title, description, align = 'left', light = false, className }: SectionTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}
    >
      {eyebrow && <Badge tone={light ? 'yellow' : 'orange'}>{eyebrow}</Badge>}
      <h2 className={cn('mt-4 text-3xl md:text-4xl font-bold leading-tight', light ? 'text-cream' : 'text-white')}>
        {title}
      </h2>
      {description && (
        <p className={cn('mt-3 text-base md:text-lg leading-relaxed', light ? 'text-cream/70' : 'text-white/60')}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
