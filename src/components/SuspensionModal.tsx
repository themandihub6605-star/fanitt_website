import { AnimatePresence, motion } from 'framer-motion';
import { ShieldOff, Mail, LogOut } from 'lucide-react';

const SUPPORT_EMAIL = 'fanittlive@gmail.com'; // same address already used across Contact Us / footer

export function SuspensionModal({ message, onLogout }: { message: string | null; onLogout: () => void }) {
  // Pull "Reason: ..." out of the backend's combined message, if present,
  // so it can be shown as its own highlighted line instead of buried in
  // one long sentence.
  const reasonMatch = message?.match(/Reason:\s*(.+)$/);
  const reason = reasonMatch?.[1];

  return (
    <AnimatePresence>
      {message !== null && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-[2rem] border border-red-500/20 bg-navy-800 p-8 text-center shadow-lifted"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <ShieldOff size={28} />
            </span>
            <h1 className="mt-5 text-2xl font-bold text-white">Your account has been suspended</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              An admin has restricted access to your Fanitt account, so you can't use the platform right now.
            </p>

            {reason && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-red-300">Reason given</p>
                <p className="mt-1 text-sm text-white/80">{reason}</p>
              </div>
            )}

            <p className="mt-4 text-sm leading-relaxed text-white/60">
              If you believe this is a mistake, contact the Fanitt team and we'll look into it.
            </p>

            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Account%20suspension%20appeal`}
              className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-orange-500 py-3 text-sm font-bold text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-orange-400 hover:shadow-glow"
            >
              <span className="shine-sweep" />
              <Mail size={16} /> Email {SUPPORT_EMAIL}
            </a>

            <button
              type="button"
              onClick={onLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white"
            >
              <LogOut size={15} /> Log out
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}