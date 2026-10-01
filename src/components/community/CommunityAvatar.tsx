import { Users2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { initialsOf, type CommunityUser } from '@/services/communityApi';

export function UserAvatar({ user, size = 36, className }: { user?: CommunityUser | null; size?: number; className?: string }) {
  const name = user?.name || '?';
  return user?.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={name}
      style={{ width: size, height: size }}
      className={cn('shrink-0 rounded-full object-cover ring-1 ring-white/10', className)}
    />
  ) : (
    <span
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn('flex shrink-0 items-center justify-center rounded-full bg-orange-500/15 font-bold text-orange-300 ring-1 ring-orange-500/20', className)}
    >
      {initialsOf(name)}
    </span>
  );
}

export function CommunityIcon({ iconUrl, name, size = 48, className }: { iconUrl?: string; name: string; size?: number; className?: string }) {
  return iconUrl ? (
    <img
      src={iconUrl}
      alt={name}
      style={{ width: size, height: size }}
      className={cn('shrink-0 rounded-2xl object-cover ring-1 ring-white/10', className)}
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className={cn('flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/30 to-pink-500/20 text-orange-200 ring-1 ring-orange-500/20', className)}
    >
      {name ? <span style={{ fontSize: size * 0.4 }} className="font-bold">{name.trim()[0]?.toUpperCase()}</span> : <Users2 size={size * 0.45} />}
    </span>
  );
}

/**
 * Community cover: the photo fills the whole banner (no empty space) and the
 * bottom fades into the card, so the icon and any text below sit on a
 * smooth, readable edge. Tap-to-view on the community page shows the full
 * uncropped image. Best upload size: 1500 × 500 (3:1).
 */
export function CommunityCover({
  url,
  className,
  children,
  fade = true,
}: {
  url?: string;
  className?: string;
  children?: React.ReactNode;
  /** Bottom fade into the card background. */
  fade?: boolean;
}) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-orange-500/25 via-pink-500/15 to-navy-800', className)}>
      {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />}
      {fade && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-navy-800 via-navy-800/50 to-transparent" />
      )}
      {children}
    </div>
  );
}

/** Full-screen view of an image (community logo or cover), uncropped. */
export function ImageLightbox({ url, alt, onClose }: { url: string; alt: string; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/20"
      >
        ✕
      </button>
      <img
        src={url}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
      />
    </div>
  );
}