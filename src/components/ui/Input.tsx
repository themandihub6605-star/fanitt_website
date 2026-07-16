import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, className, id, ...props }, ref) => {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold text-white/80">{label}</span>}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/50',
          'transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100',
          className
        )}
        {...props}
      />
    </label>
  );
});
Input.displayName = 'Input';
