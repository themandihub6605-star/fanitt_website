import type { PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  className?: string;
  variant?: 'solid' | 'glass' | 'dark' | 'outline';
  hover?: boolean;
}

export function Card({ children, className, variant = 'solid', hover = true }: PropsWithChildren<CardProps>) {
  const variants = {
    solid: 'bg-navy-800/80 border border-white/[0.08] shadow-card',
    glass: 'glass shadow-card',
    dark: 'bg-navy-900 border border-white/[0.06] text-cream shadow-lifted',
    outline: 'bg-transparent border border-white/[0.1]',
  };

  return (
    <div
      className={cn(
        'group/card relative overflow-hidden rounded-2xl p-6 md:p-8 transition-all duration-300 ease-out',
        variants[variant],
        hover &&
          'hover:-translate-y-1.5 hover:border-orange-500/30 hover:shadow-lifted hover:scale-[1.01]',
        className
      )}
    >
      {hover && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-400 transition-transform duration-300 ease-out group-hover/card:scale-x-100" />
      )}
      {children}
    </div>
  );
}
