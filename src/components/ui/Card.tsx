import type { PropsWithChildren } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  className?: string;
  variant?: 'solid' | 'glass' | 'dark' | 'outline';
  hover?: boolean;
}

export function Card({ children, className, variant = 'solid', hover = true }: PropsWithChildren<CardProps>) {
  const variants = {
    solid: 'bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-card',
    glass: 'glass shadow-card',
    dark: 'glass-dark text-cream shadow-lifted',
    outline: 'bg-transparent border border-white/15',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-6 md:p-8 transition-all duration-300 ease-out',
        variants[variant],
        hover && 'hover:-translate-y-1.5 hover:shadow-lifted',
        className
      )}
    >
      {children}
    </div>
  );
}
