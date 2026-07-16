import { Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';
import type { Creator } from '@/types';

const SOCIAL_ICON_MAP = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
} as const;

interface SocialLinksProps {
  socials?: Creator['socials'];
  className?: string;
}

/** Renders only the platforms the creator actually has — clicking opens their real external profile in a new tab. */
export function SocialLinks({ socials, className }: SocialLinksProps) {
  if (!socials) return null;
  const entries = Object.entries(socials).filter(([, url]) => Boolean(url)) as [keyof typeof SOCIAL_ICON_MAP, string][];
  if (entries.length === 0) return null;

  return (
    <div className={className}>
      {entries.map(([platform, url]) => {
        const Icon = SOCIAL_ICON_MAP[platform];
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${platform} profile`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/70 transition-colors hover:border-orange-400 hover:text-orange-400"
          >
            <Icon size={16} />
          </a>
        );
      })}
    </div>
  );
}
