import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Building2, Download, Image, Package, Smartphone, Store, Users, UserRound, Video, type LucideIcon } from 'lucide-react';
import { Container } from '@/components/ui/Container';

// Shared links: https://fanitt.com/open/<type>/<id>
// Normally Android opens these straight in the Fanitt app (verified via
// /.well-known/assetlinks.json). If a browser shows this page anyway, it
// hands the link to the app — or to the Play Store when the app isn't
// installed. It never sends people to a website page.

const PACKAGE = 'fanitt.comapp.fanittapp';
const PLAY_URL = `https://play.google.com/store/apps/details?id=${PACKAGE}`;

const TYPES: Record<string, { label: string; icon: LucideIcon }> = {
  campaign: { label: 'campaign', icon: Briefcase },
  session: { label: 'live session', icon: Video },
  meet: { label: 'live session', icon: Video },
  brand: { label: 'brand', icon: Building2 },
  creator: { label: 'creator', icon: UserRound },
  community: { label: 'community', icon: Users },
  product: { label: 'digital product', icon: Package },
  store: { label: 'creator store', icon: Store },
  post: { label: 'post', icon: Image },
};

export default function OpenLink() {
  const { type = '', id = '' } = useParams();
  const meta = TYPES[type];
  const isAndroid = /android/i.test(navigator.userAgent);

  // Opens the app at this item; if it isn't installed, the Play Store.
  const appIntent = useMemo(
    () => `intent://fanitt.com/open/${type}/${encodeURIComponent(id)}#Intent;scheme=fanitt;package=${PACKAGE};S.browser_fallback_url=${encodeURIComponent(PLAY_URL)};end`,
    [type, id]
  );

  useEffect(() => {
    document.title = 'Open in Fanitt';
    if (isAndroid) window.location.replace(meta ? appIntent : PLAY_URL);
  }, [isAndroid, meta, appIntent]);

  const Icon = meta?.icon ?? Smartphone;

  return (
    <div className="flex min-h-[80vh] items-center pb-16 pt-28">
      <Container className="max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#14141F] to-[#2A1320] p-8 text-center"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-lg shadow-orange-500/30">
            <Icon size={30} />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-white">{meta ? `Open this ${meta.label} in the Fanitt app` : 'Open the Fanitt app'}</h1>
          <p className="mt-2 text-sm text-white/60">Tap below to continue in the app. Don’t have it yet? Get it free on Google Play.</p>

          <div className="mt-7 space-y-3">
            {isAndroid && (
              <a href={meta ? appIntent : PLAY_URL} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 px-5 py-3.5 font-semibold text-white">
                <Smartphone size={18} /> Open in the app
              </a>
            )}
            <a href={PLAY_URL} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3.5 font-semibold text-white hover:border-orange-500/50">
              <Download size={18} /> Get Fanitt on Google Play
            </a>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}