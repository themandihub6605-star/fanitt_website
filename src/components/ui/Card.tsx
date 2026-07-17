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
        'rounded-2xl p-6 md:p-8 transition-all duration-300 ease-out',
        variants[variant],
        hover && 'hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-lifted',
        className
      )}
    >
      {children}
    </div>
  );
}
