import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { giftApi } from '@/services/giftApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { openRazorpayCheckout } from '@/utils/razorpay';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

interface SendGiftModalProps {
  creatorId: string;
  creatorName: string;
  open: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [49, 99, 199, 499];

export function SendGiftModal({ creatorId, creatorName, open, onClose }: SendGiftModalProps) {
  const [amount, setAmount] = useState(99);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const finalAmount = customAmount ? Math.round(parseFloat(customAmount)) : amount;

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSuccess(false);
      setError('');
      setMessage('');
      setCustomAmount('');
      setAmount(99);
    }, 250);
  };

  const handleSend = async () => {
    if (!isAuthenticated) {
      setError('Please log in to send a gift');
      return;
    }
    if (!finalAmount || finalAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSending(true);
    setError('');
    try {
      const amountInPaise = finalAmount * 100;
      const { order } = await giftApi.createOrder({ creatorId, amount: amountInPaise, message: message || undefined });

      const paymentResponse = await openRazorpayCheckout({
        orderId: order.id,
        amount: order.amount,
        name: 'Fanitt',
        description: `Gift to ${creatorName}`,
        prefillName: user?.name,
        prefillEmail: user?.email,
      });

      await giftApi.verify({
        creatorId,
        amount: amountInPaise,
        message: message || undefined,
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Payment was cancelled or failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={success ? undefined : `Send a gift to ${creatorName}`}>
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount('');
                  }}
                  className={cn(
                    'rounded-xl border py-2.5 text-sm font-bold transition-colors',
                    amount === preset && !customAmount
                      ? 'border-orange-400/60 bg-orange-500/15 text-orange-300'
                      : 'border-white/10 bg-navy-800/45 text-white/70 hover:border-white/20'
                  )}
                >
                  ₹{preset}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-white/70">Or enter a custom amount (₹)</span>
              <input
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="e.g. 250"
                className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-white/70">Message (optional)</span>
              <textarea
                rows={2}
                maxLength={200}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say something nice..."
                className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
              />
            </label>

            <Button className="w-full justify-center" disabled={sending} onClick={handleSend}>
              {sending ? <Loader2 size={18} className="animate-spin" /> : `Send ₹${finalAmount || 0} gift`}
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
              <Gift size={24} />
            </span>
            <h3 className="mt-4 text-xl font-bold text-white">Gift sent!</h3>
            <p className="mt-2 text-sm text-white/60">{creatorName} will be notified right away.</p>
            <Button variant="outline" className="mt-6" onClick={handleClose}>
              <Check size={15} /> Done
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}