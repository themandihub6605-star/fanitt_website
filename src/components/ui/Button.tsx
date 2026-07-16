import { forwardRef, type ReactNode, type MouseEventHandler, type Ref } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-body font-semibold rounded-full transition-all duration-200 ease-out select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]';

const variants: Record<Variant, string> = {
  primary: 'bg-orange-500 text-white shadow-card hover:bg-orange-600 hover:shadow-glow',
  secondary: 'bg-navy-700 text-cream hover:bg-navy-800 shadow-card',
  ghost: 'bg-transparent text-white hover:bg-white/10',
  outline: 'border-2 border-white/20 text-white hover:border-orange-500 hover:text-orange-400',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-base px-6 py-3',
  lg: 'text-lg px-8 py-4',
};

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  as?: 'button' | 'a';
  className?: string;
  children?: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  'aria-label'?: string;
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', as = 'button', className, href, target, rel, type, disabled, onClick, children, ...rest }, ref) => {
    const classes = cn(base, variants[variant], sizes[size], className);

    if (as === 'a') {
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={rel}
          onClick={onClick as MouseEventHandler<HTMLAnchorElement>}
          className={classes}
          {...rest}
        >
          {children}
        </a>
      );
    }

    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type ?? 'button'}
        disabled={disabled}
        onClick={onClick as MouseEventHandler<HTMLButtonElement>}
        className={classes}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
