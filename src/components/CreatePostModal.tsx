import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2, ImagePlus, Video, X, Plus } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { postApi, MAX_MEDIA_PER_POST } from '@/services/postApi';
import { getApiErrorMessage } from '@/services/apiClient';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

interface LocalMedia {
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

export function CreatePostModal({ open, onClose, onCreated }: CreatePostModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<LocalMedia[]>([]);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    if (items.length + selected.length > MAX_MEDIA_PER_POST) {
      setError(`You can add up to ${MAX_MEDIA_PER_POST} photos/videos per post`);
      return;
    }

    const validated: LocalMedia[] = [];
    for (const file of selected) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        setError('Please select photo or video files only');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError('Each file must be under 100MB');
        return;
      }
      validated.push({ file, previewUrl: URL.createObjectURL(file), isVideo });
    }

    setError('');
    setItems((prev) => [...prev, ...validated]);
    // allow re-selecting the same file again later
    e.target.value = '';
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setItems([]);
      setCaption('');
      setError('');
      setSuccess(false);
    }, 250);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      setError('Please choose at least one photo or reel');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await postApi.create(items.map((i) => i.file), caption || undefined);
      setSuccess(true);
      onCreated?.();
      setTimeout(handleClose, 1300);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

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

            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} className="hidden" />

            {items.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-navy-800/45 text-white/50 transition-colors hover:border-orange-400/40 hover:text-white/70"
              >
                <div className="flex gap-3">
                  <ImagePlus size={22} />
                  <Video size={22} />
                </div>
                <span className="text-xs">Click to upload up to {MAX_MEDIA_PER_POST} photos or reels</span>
              </button>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {items.map((item, i) => (
                  <div key={i} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-black">
                    {item.isVideo ? (
                      <video src={item.previewUrl} className="h-full w-full object-cover" />
                    ) : (
                      <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {items.length < MAX_MEDIA_PER_POST && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 bg-navy-800/45 text-white/40 hover:border-orange-400/40 hover:text-white/70"
                  >
                    <Plus size={18} />
                    <span className="text-[10px]">Add more</span>
                  </button>
                )}
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
                className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
              />
            </label>

            <Button className="w-full justify-center" disabled={submitting || items.length === 0} onClick={handleSubmit}>
              {submitting ? <Loader2 size={18} className="animate-spin" /> : `Post${items.length > 1 ? ` (${items.length})` : ''}`}
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