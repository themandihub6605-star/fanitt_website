import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { bookingApi } from '@/services/bookingApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { openRazorpayCheckout } from '@/utils/razorpay';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';
import type { ApiSession } from '@/services/sessionApi';

interface RealBookingModalProps {
  session: ApiSession;
  open: boolean;
  onClose: () => void;
}

export function RealBookingModal({ session, open, onClose }: RealBookingModalProps) {
  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
  const [errorMessage, setErrorMessage] = useState('');
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('confirm');
      setErrorMessage('');
    }, 250);
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      setErrorMessage('Please log in to book a session');
      setStep('error');
      return;
    }

    setStep('processing');
    try {
      const { booking, requiresPayment, order } = await bookingApi.create(session._id);

      if (!requiresPayment || !order) {
        setStep('success');
        return;
      }

      const paymentResponse = await openRazorpayCheckout({
        orderId: order.id,
        amount: order.amount,
        name: 'Fanitt',
        description: session.title,
        prefillName: user?.name,
        prefillEmail: user?.email,
      });

      await bookingApi.verifyPayment({
        bookingId: booking._id,
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      setStep('success');
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err) || 'Payment was cancelled or failed');
      setStep('error');
    }
  };

  const isFree = session.type === 'free';
  const creatorName = session.creator?.user?.name || 'Creator';

  return (
    <Modal open={open} onClose={handleClose} title={step === 'success' ? undefined : 'Book this session'}>
      <AnimatePresence mode="wait">
        {(step === 'confirm' || step === 'processing') && (
          <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-navy-800/60 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{session.title}</p>
                <p className="text-xs text-white/60">with {creatorName}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-navy-800/60 px-4 py-3 text-sm">
              <span className="flex items-center gap-1.5 text-white/60">
                <Clock size={14} /> {new Date(session.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
              <span className={cn('font-bold', isFree ? 'text-teal-400' : 'text-white')}>
                {isFree ? 'Free' : `₹${(session.price / 100).toLocaleString('en-IN')}`}
              </span>
            </div>

            <Button className="mt-6 w-full" disabled={step === 'processing'} onClick={handleBook}>
              {step === 'processing' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isFree ? (
                'Confirm free booking'
              ) : (
                `Pay ₹${(session.price / 100).toLocaleString('en-IN')} & book`
              )}
            </Button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-4 text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-white"
            >
              <Check size={26} />
            </motion.span>
            <h3 className="mt-4 text-xl font-bold text-white">You're booked!</h3>
            <p className="mt-2 max-w-xs text-sm text-white/60">
              {session.title} with {creatorName} is confirmed. Check "My Bookings" for the join link once it's live.
            </p>
            <Button variant="outline" className="mt-6" onClick={handleClose}>
              Done
            </Button>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-4 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <AlertCircle size={26} />
            </span>
            <h3 className="mt-4 text-xl font-bold text-white">Booking failed</h3>
            <p className="mt-2 max-w-xs text-sm text-white/60">{errorMessage}</p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleClose}>Close</Button>
              <Button onClick={() => setStep('confirm')}>Try again</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
