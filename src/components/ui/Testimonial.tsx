import { Quote } from 'lucide-react';
import { Card } from './Card';

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  avatarInitial?: string;
}

/** Reusable testimonial card — available in the design system for future pages. */
export function Testimonial({ quote, name, role, avatarInitial }: TestimonialProps) {
  return (
    <Card variant="glass" className="max-w-md">
      <Quote className="text-orange-400" size={28} />
      <p className="mt-4 text-white/80 leading-relaxed">{quote}</p>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sunrise-gradient font-display text-sm font-bold text-white">
          {avatarInitial ?? name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-white/60">{role}</p>
        </div>
      </div>
    </Card>
  );
}
