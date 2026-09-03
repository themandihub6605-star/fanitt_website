import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, X, Loader2, AlertCircle } from 'lucide-react';
import { reviewApi, type CreateReviewPayload } from '@/services/reviewApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

/** Post-campaign-completion review form (bidirectional — used by both
 * the brand reviewing the creator and the creator reviewing the brand).
 * A 409 from the backend (Review model's unique fromUser+toUser+
 * relatedModel+relatedId constraint) means they've already reviewed
 * this — treated as success by the caller (see CampaignDetail.tsx),
 * not as an error to retry. */
export function ReviewModal({
  open,
  onClose,
  revieweeName,
  payload,
  onSubmitted,
  onAlreadyReviewed,
}: {
  open: boolean;
  onClose: () => void;
  revieweeName: string;
  payload: Omit<CreateReviewPayload, 'rating' | 'comment'>;
  onSubmitted: () => void;
  onAlreadyReviewed: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await reviewApi.create({ ...payload, rating, comment: comment.trim() || undefined });
      onSubmitted();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        onAlreadyReviewed();
      } else {
        setError(getApiErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-navy-900 p-6 sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Review {revieweeName}</h2>
              <button onClick={onClose} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="mt-1 text-sm text-white/50">How was your experience on this project?</p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}

            <div className="mt-5 flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    size={32}
                    className={cn(
                      'transition-colors',
                      n <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'
                    )}
                  />
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-xs font-semibold text-white/70">Comment (optional)</span>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share more about how it went..."
                className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
              />
            </label>

            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Review'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}