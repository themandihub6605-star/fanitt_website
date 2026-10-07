import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Check, Crown, Loader2, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { communityApi, PLAN_SUFFIX, rupees, type ApiCommunity, type CommunityPlanOption } from '@/services/communityApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { openRazorpayCheckout } from '@/utils/razorpay';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

interface Props {
  open: boolean;
  community: ApiCommunity;
  onClose: () => void;
  /** Called after a successful payment — reload the community. */
  onJoined: () => void;
}

const HINT: Record<string, string> = {
  monthly: 'Billed every month — renew when it ends',
  yearly: '12 months of access',
  lifetime: 'Lifetime access, one payment',
};

/** Pick a plan of a paid community and pay with Razorpay (UPI / card / netbanking). */
export function PaidPlansModal({ open, community: c, onClose, onJoined }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const plans = useMemo(() => c.planOptions || [], [c.planOptions]);
  const [selected, setSelected] = useState<CommunityPlanOption | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setSelected(plans.find((p) => p.key === 'yearly') || plans[0] || null);
  }, [open, plans]);

  // "Save 17%" on yearly vs 12 × monthly.
  const yearlySaving = useMemo(() => {
    const m = plans.find((p) => p.key === 'monthly');
    const y = plans.find((p) => p.key === 'yearly');
    if (!m || !y || m.price <= 0) return null;
    const pct = Math.round(((m.price * 12 - y.price) / (m.price * 12)) * 100);
    return pct > 0 ? pct : null;
  }, [plans]);

  const renewing = c.membership?.status === 'expired' || c.membership?.access === 'paid';

  const pay = async () => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const started = await communityApi.checkout(c._id, selected.key);
      if (!started.paid) {
        if (!started.razorpay) throw new Error('Could not start the payment — please try again');
        const result = await openRazorpayCheckout({
          orderId: started.razorpay.orderId,
          amount: started.razorpay.amount,
          name: c.name,
          description: started.razorpay.description,
          prefillName: user?.name,
          prefillEmail: user?.email,
          prefillContact: user?.phone,
        });
        await communityApi.verifyPayment(started.order._id, {
          razorpayOrderId: result.razorpay_order_id,
          razorpayPaymentId: result.razorpay_payment_id,
          razorpaySignature: result.razorpay_signature,
        });
      }
      onJoined();
      onClose();
    } catch (err) {
      const message = err instanceof Error && err.message === 'Payment cancelled' ? '' : getApiErrorMessage(err);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={renewing ? 'Renew your membership' : `Join ${c.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-white/60">Pick a plan — posts, chat and lives unlock right after payment.</p>

        <div className="space-y-2.5">
          {plans.map((p, i) => {
            const on = selected?.key === p.key;
            const badge = p.key === 'yearly' && yearlySaving ? `Save ${yearlySaving}%` : p.key === 'lifetime' ? 'Pay once' : '';
            return (
              <motion.button
                key={p.key}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(p)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
                  on ? 'border-orange-400/70 bg-gradient-to-r from-orange-500/15 to-pink-500/10' : 'border-white/10 bg-navy-800/50 hover:border-white/25'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                    on ? 'bg-gradient-to-br from-[#F4511E] to-[#EC2A78]' : 'border-2 border-white/25'
                  )}
                >
                  {on && <Check size={12} className="text-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-white">{p.key === 'lifetime' ? 'One-time' : p.label}</span>
                    {badge && (
                      <span className="rounded-full bg-gradient-to-r from-[#F4511E] to-[#EC2A78] px-2 py-0.5 text-[10px] font-black text-white">{badge}</span>
                    )}
                  </span>
                  <span className="block text-xs text-white/50">{HINT[p.key]}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className={cn('text-lg font-black', on ? 'text-orange-300' : 'text-white')}>{rupees(p.price)}</span>
                  {p.key !== 'lifetime' && <span className="text-xs text-white/45">{PLAN_SUFFIX[p.key]}</span>}
                </span>
              </motion.button>
            );
          })}
        </div>

        <p className="flex items-start gap-2 text-xs text-white/50">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          {selected?.key === 'lifetime'
            ? 'One payment, access for as long as the community runs.'
            : 'No auto-debit. We’ll remind you before it ends — renew in one click.'}
        </p>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-400">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <button
          type="button"
          onClick={pay}
          disabled={!selected || busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F4511E] to-[#EC2A78] py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Crown size={16} />}
          {selected ? `Continue · ${rupees(selected.price)}` : 'Choose a plan'}
        </button>
      </div>
    </Modal>
  );
}