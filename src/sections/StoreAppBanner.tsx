import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Smartphone } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { storeConfigApi, type StoreWebBanner } from '@/services/storeConfigApi';

// Fanitt Store banner on the home page. Image, text, links and on/off all
// come from the admin panel (Fanitt Store → Settings → Website banner).
//
// The image is always shown in full at its own shape (no cropping) on
// every screen size — admins usually upload a designed banner. Title,
// subtitle and button only appear (in a strip under the image) when the
// admin fills them in.

const DEFAULT_PLAY_URL = 'https://play.google.com/store/apps/details?id=fanitt.comapp.fanittapp';

function packageFrom(playUrl: string) {
  try {
    return new URL(playUrl).searchParams.get('id') || 'fanitt.comapp.fanittapp';
  } catch {
    return 'fanitt.comapp.fanittapp';
  }
}

/** Android: open the app if installed, else Google Play. Elsewhere: Google Play. */
function openApp(banner: StoreWebBanner) {
  const playUrl = banner.playStoreUrl || DEFAULT_PLAY_URL;
  const isAndroid = /android/i.test(navigator.userAgent);
  const match = (banner.appDeepLink || '').match(/^([a-z][a-z0-9+.-]*):\/\/(.*)$/i);

  if (isAndroid && match) {
    const [, scheme, path] = match;
    window.location.href = `intent://${path}#Intent;scheme=${scheme};package=${packageFrom(playUrl)};S.browser_fallback_url=${encodeURIComponent(playUrl)};end`;
    return;
  }
  window.open(playUrl, '_blank', 'noopener,noreferrer');
}

export function StoreAppBanner() {
  const [banner, setBanner] = useState<StoreWebBanner | null>(null);

  useEffect(() => {
    let alive = true;
    storeConfigApi
      .get()
      .then((config) => {
        if (alive) setBanner(config.webBanner && config.webBanner.enabled && config.webBanner.imageUrl ? config.webBanner : null);
      })
      .catch(() => {
        // No banner if settings can't load — the page stays as it was.
      });
    return () => {
      alive = false;
    };
  }, []);

  // Off, no image, or not loaded: render nothing and take no space.
  if (!banner) return null;

  const hasText = Boolean(banner.title || banner.subtitle || banner.buttonText);
  const label = banner.title || banner.buttonText || 'Open Fanitt Store in the app';

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <motion.button
          type="button"
          onClick={() => openApp(banner)}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.99 }}
          aria-label={label}
          className="group block w-full overflow-hidden rounded-2xl border border-white/10 bg-navy-900 text-left shadow-[0_18px_50px_-22px_rgba(244,81,30,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:rounded-3xl"
        >
          {/* Full image at its natural shape — never cropped, on any screen. */}
          <img
            src={banner.imageUrl}
            alt={banner.title || 'Fanitt Store'}
            loading="lazy"
            className="block h-auto w-full transition-transform duration-700 group-hover:scale-[1.015]"
          />

          {hasText && (
            <div className="flex flex-col gap-3 border-t border-white/10 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="min-w-0">
                {banner.title && <p className="break-words text-lg font-bold text-white sm:text-2xl">{banner.title}</p>}
                {banner.subtitle && <p className="mt-1 break-words text-sm text-white/70 sm:text-base">{banner.subtitle}</p>}
              </div>
              <span className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-colors group-hover:bg-orange-600 sm:w-auto">
                <Smartphone size={16} />
                {banner.buttonText || 'Get the app'}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          )}
        </motion.button>
      </Container>
    </section>
  );
}