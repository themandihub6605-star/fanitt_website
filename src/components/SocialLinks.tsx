import { Instagram, Facebook, Linkedin, Youtube, Globe } from 'lucide-react';
import type { Creator } from '@/types';

const SOCIAL_ICON_MAP = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  website: Globe,
} as const;

interface SocialLinksProps {
  socials?: Creator['socials'];
  className?: string;
}

/** Renders only the platforms the creator actually has — clicking opens their real external profile in a new tab. */
export function SocialLinks({ socials, className }: SocialLinksProps) {
  if (!socials) return null;
  const entries = Object.entries(socials).filter(([, url]) => Boolean(url)) as [keyof NonNullable<Creator['socials']>, string][];
  if (entries.length === 0) return null;

  return (
    <div className={className}>
      {entries.map(([platform, url]) => {
        if (platform === 'behance') {
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Behance profile"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-navy-800/70 text-[11px] font-bold text-white/70 transition-colors hover:border-orange-400 hover:text-orange-400"
            >
              Be
            </a>
          );
        }
        const Icon = SOCIAL_ICON_MAP[platform as keyof typeof SOCIAL_ICON_MAP];
        if (!Icon) return null;
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${platform} profile`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-navy-800/70 text-white/70 transition-colors hover:border-orange-400 hover:text-orange-400"
          >
            <Icon size={16} />
          </a>
        );
      })}
    </div>
  );
}
