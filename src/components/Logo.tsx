import logoUrl from '@/assets/brand/fanittLogoNew.png';

interface LogoProps {
  className?: string;
  dark?: boolean;
}

/** Real brand logo (uploaded artwork) — used everywhere the logo appears.
 * Pass a className to fully control sizing for a specific spot (e.g. the
 * navbar); otherwise it falls back to the default large size.
 *
 * The wrapping span's `ml-1.5 sm:ml-0` nudges the logo slightly right on
 * mobile only (Point 6) — it sat a touch too close to the screen edge on
 * small viewports. Desktop is untouched (ml-0). This margin lives on the
 * wrapper, not the <img>, so it always applies even when a caller passes
 * a className that fully overrides the image's own sizing classes. */
export function Logo({ className }: LogoProps) {
  return (
    <span className="ml-1.5 inline-flex sm:ml-0">
      <img src={logoUrl} alt="Fanitt — Live This Life" className={className || 'h-9 w-auto sm:h-10'} />
    </span>
  );
}