import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

type Tone = 'orange' | 'teal' | 'navy' | 'yellow';

const toneClasses: Record<Tone, string> = {
  orange: 'bg-orange-500/15 text-orange-400',
  teal: 'bg-teal-500/15 text-teal-300',
  navy: 'bg-white/10 text-white',
  yellow: 'bg-yellow-400/15 text-yellow-300',
};

interface IconTileProps {
  icon: LucideIcon;
  tone?: Tone;
  size?: 'sm' | 'md';
  className?: string;
}

/** Consistent icon-badge treatment used across feature/step lists site-wide. */
export function IconTile({ icon: Icon, tone = 'orange', size = 'md', className }: IconTileProps) {
  const dims = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  const iconSize = size === 'sm' ? 16 : 20;
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-xl', dims, toneClasses[tone], className)}>
      <Icon size={iconSize} strokeWidth={2.2} />
    </span>
  );
}
