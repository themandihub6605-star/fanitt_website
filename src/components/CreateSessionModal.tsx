import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2, ImagePlus, X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { sessionApi } from '@/services/sessionApi';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { getApiErrorMessage, getUploadUrl } from '@/services/apiClient';
import { cn } from '@/utils/cn';

interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const TYPES = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
  { value: 'one_to_one', label: '1-to-1' },
] as const;

export function CreateSessionModal({ open, onClose, onCreated }: CreateSessionModalProps) {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    type: 'free' as (typeof TYPES)[number]['value'],
    price: '',
    date: '',
    time: '',
    durationMinutes: '30',
    maxParticipants: '100',
  });

  useEffect(() => {
    if (open && categories.length === 0) {
      categoryApi.list().then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setForm((f) => ({ ...f, category: cats[0]._id }));
      });
    }
  }, [open, categories.length]);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setBannerError('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setBannerError('Image must be under 10MB');
      return;
    }

    setBannerError('');
    setBannerUploading(true);
    try {
      const { coverImageUrl } = await sessionApi.uploadBanner(file);
      setBannerUrl(coverImageUrl);
    } catch (err) {
      setBannerError(getApiErrorMessage(err));
    } finally {
      setBannerUploading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSuccess(false);
      setError('');
      setBannerUrl('');
      setBannerError('');
      setForm((f) => ({ ...f, title: '', description: '', price: '', date: '', time: '' }));
    }, 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.date || !form.time) {
      setError('Please pick a date and time');
      return;
    }

    const scheduledAt = new Date(`${form.date}T${form.time}:00`).toISOString();
    const priceInPaise = form.type === 'free' ? 0 : Math.round(parseFloat(form.price || '0') * 100);

    if (form.type !== 'free' && (!priceInPaise || priceInPaise <= 0)) {
      setError('Please enter a valid price for a paid session');
      return;
    }

    setSubmitting(true);
    try {
      await sessionApi.create({
        title: form.title,
        description: form.description,
        category: form.category,
        type: form.type,
        price: priceInPaise,
        scheduledAt,
        durationMinutes: Number(form.durationMinutes),
        maxParticipants: Number(form.maxParticipants),
        coverImageUrl: bannerUrl || undefined,
      });
      setSuccess(true);
      onCreated?.();
      setTimeout(handleClose, 1400);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={success ? undefined : 'Create a new session'}>
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Session banner (optional)</span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBannerSelect} className="hidden" />

              {!bannerUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={bannerUploading}
                  className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] text-white/50 transition-colors hover:border-orange-400/40 hover:text-white/70"
                >
                  {bannerUploading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <ImagePlus size={20} />
                      <span className="text-xs">Click to upload a cover image</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="relative h-32 w-full overflow-hidden rounded-xl">
                  <img src={getUploadUrl(bannerUrl)} alt="Session banner" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setBannerUrl('')}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {bannerError && <p className="mt-1.5 text-xs text-red-400">{bannerError}</p>}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Title</span>
              <input
                required
                value={form.title}
                onChange={handleChange('title')}
                placeholder="e.g. Mobility Reset for Desk Workers"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/80">Category</span>
                <select
                  value={form.category}
                  onChange={handleChange('category')}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-orange-400"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id} className="bg-[#0d1120]">
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/80">Type</span>
                <div className="flex gap-1.5">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                      className={cn(
                        'flex-1 rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors',
                        form.type === t.value ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-white/10 bg-white/[0.03] text-white/60'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            {form.type !== 'free' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/80">Price (₹)</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.price}
                  onChange={handleChange('price')}
                  placeholder="e.g. 149"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                />
              </label>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/80">Date</span>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={handleChange('date')}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-orange-400 [color-scheme:dark]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/80">Time</span>
                <input
                  required
                  type="time"
                  value={form.time}
                  onChange={handleChange('time')}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-orange-400 [color-scheme:dark]"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/80">Duration (min)</span>
                <input
                  required
                  type="number"
                  min="5"
                  value={form.durationMinutes}
                  onChange={handleChange('durationMinutes')}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-orange-400"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/80">Max participants</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.maxParticipants}
                  onChange={handleChange('maxParticipants')}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white focus:border-orange-400"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Description</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={handleChange('description')}
                placeholder="What will you cover in this session?"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
              />
            </label>

            <Button type="submit" disabled={submitting || bannerUploading} className="w-full justify-center">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Create session'}
            </Button>
          </motion.form>
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
            <h3 className="mt-4 text-xl font-bold text-white">Session created!</h3>
            <p className="mt-2 text-sm text-white/60">Fans can now discover and book it.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}