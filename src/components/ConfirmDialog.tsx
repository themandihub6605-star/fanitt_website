import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-lifted"
          >
            <div className="flex items-start justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${danger ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400'}`}>
                <AlertTriangle size={18} />
              </span>
              <button onClick={onCancel} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
            <p className="mt-1.5 text-sm text-white/60">{description}</p>
            <div className="mt-6 flex gap-3">
              <button onClick={onCancel} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5">
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}