import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, className, id, icon, ...props }, ref) => {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold text-white/80">{label}</span>}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/40',
            'transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20',
            icon && 'pl-11',
            className
          )}
          {...props}
        />
      </div>
    </label>
  );
});
Input.displayName = 'Input';
