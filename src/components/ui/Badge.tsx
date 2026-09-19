import type { PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

type Tone = 'orange' | 'yellow' | 'navy' | 'teal' | 'cream' | 'green' | 'purple' | 'red' | 'blue';

const tones: Record<Tone, string> = {
  orange: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  yellow: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30',
  navy: 'bg-white/10 text-white border-white/20',
  teal: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  cream: 'bg-white/10 text-white border-white/10',
  green: 'bg-success/15 text-emerald-400 border-success/30',
  purple: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  red: 'bg-danger/20 text-red-400 border-danger/30',
  blue: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

export function Badge({ children, tone = 'orange', className }: PropsWithChildren<{ tone?: Tone; className?: string }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
