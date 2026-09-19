import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

type Tone = 'orange' | 'teal' | 'navy' | 'yellow';

const toneClasses: Record<Tone, string> = {
  orange: 'bg-orange-500/15 text-orange-400 ring-1 ring-inset ring-orange-500/20',
  teal: 'bg-teal-500/15 text-teal-300 ring-1 ring-inset ring-teal-500/20',
  navy: 'bg-white/10 text-white ring-1 ring-inset ring-white/10',
  yellow: 'bg-yellow-400/15 text-yellow-300 ring-1 ring-inset ring-yellow-400/20',
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
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3',
        dims,
        toneClasses[tone],
        className
      )}
    >
      <Icon size={iconSize} strokeWidth={2.2} />
    </span>
  );
}
