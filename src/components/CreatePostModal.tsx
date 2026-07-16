import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2, ImagePlus, Video, X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { postApi } from '@/services/postApi';
import { getApiErrorMessage } from '@/services/apiClient';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreatePostModal({ open, onClose, onCreated }: CreatePostModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const isImage = selected.type.startsWith('image/');
    const isVideo = selected.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setError('Please select a photo or video file');
      return;
    }
    if (selected.size > 100 * 1024 * 1024) {
      setError('File must be under 100MB');
      return;
    }

    setError('');
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setFile(null);
      setPreviewUrl('');
      setCaption('');
      setError('');
      setSuccess(false);
    }, 250);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please choose a photo or reel first');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await postApi.create(file, caption || undefined);
      setSuccess(true);
      onCreated?.();
      setTimeout(handleClose, 1300);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isVideo = file?.type.startsWith('video/');

  return (
    <Modal open={open} onClose={handleClose} title={success ? undefined : 'New post'}>
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />

            {!previewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-white/50 transition-colors hover:border-orange-400/40 hover:text-white/70"
              >
                <div className="flex gap-3">
                  <ImagePlus size={22} />
                  <Video size={22} />
                </div>
                <span className="text-xs">Click to upload a photo or reel</span>
              </button>
            ) : (
              <div className="relative h-64 w-full overflow-hidden rounded-xl bg-black">
                {isVideo ? (
                  <video src={previewUrl} className="h-full w-full object-contain" controls />
                ) : (
                  <img src={previewUrl} alt="" className="h-full w-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl('');
                  }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Caption (optional)</span>
              <textarea
                rows={2}
                maxLength={500}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Say something about this post..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
              />
            </label>

            <Button className="w-full justify-center" disabled={submitting || !file} onClick={handleSubmit}>
              {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Post'}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-4 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-white">
              <Check size={26} />
            </span>
            <h3 className="mt-4 text-xl font-bold text-white">Posted!</h3>
            <p className="mt-2 text-sm text-white/60">It's now live on your profile.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}