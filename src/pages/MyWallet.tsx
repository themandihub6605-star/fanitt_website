import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Crown, Star, Loader2, AlertCircle, ArrowDownLeft, ArrowUpRight, Send, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { walletApi, type WalletData, type Withdrawal } from '@/services/walletApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

const STATUS_STYLE: Record<Withdrawal['status'], { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: 'bg-yellow-500/15 text-yellow-300' },
  paid: { icon: CheckCircle2, color: 'bg-emerald-500/15 text-emerald-300' },
  rejected: { icon: XCircle, color: 'bg-red-500/15 text-red-300' },
};

export default function MyWallet() {
  const [data, setData] = useState<WalletData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useAppSelector((s) => s.auth.user);

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadAll = () => {
    Promise.all([walletApi.getMy(), walletApi.getMyWithdrawals()])
      .then(([wallet, w]) => {
        setData(wallet);
        setWithdrawals(w);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const amountPaise = Math.round(Number(amount) * 100);
    if (!amountPaise || amountPaise <= 0) {
      setFormError('Enter a valid amount');
      return;
    }
    if (!details.trim()) {
      setFormError(method === 'upi' ? 'Enter your UPI ID' : 'Enter your bank details');
      return;
    }
    setSubmitting(true);
    try {
      await walletApi.requestWithdrawal({ amount: amountPaise, payoutMethod: method, payoutDetails: details.trim() });
      setShowForm(false);
      setAmount('');
      setDetails('');
      loadAll();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading your wallet...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center text-white/60">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm">Couldn't load your wallet — {error}</p>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24">
      <Container className="max-w-2xl">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">My Wallet</h1>
        <p className="mt-1 text-sm text-white/60">{user?.name}'s balance and recent activity.</p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-orange-500/15 to-transparent p-8 text-center"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
            <Wallet size={24} />
          </span>
          <p className="mt-4 text-4xl font-bold text-white">{formatRupees(data.balance)}</p>
          <p className="mt-1 text-sm text-white/50">Available balance</p>

          {(data.isPlusMember || data.isFoundingMember) && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {data.isPlusMember && (
                <span className="flex items-center gap-1.5 rounded-full bg-yellow-400/15 px-3 py-1.5 text-xs font-bold text-yellow-300">
                  <Crown size={13} /> Fanitt Plus
                </span>
              )}
              {data.isFoundingMember && (
                <span className="flex items-center gap-1.5 rounded-full bg-purple-400/15 px-3 py-1.5 text-xs font-bold text-purple-300">
                  <Star size={13} /> Founding Circle
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => setShowForm((v) => !v)}
            className="mx-auto mt-6 flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] px-6 py-2.5 text-sm font-bold text-white"
          >
            <Send size={14} /> Request Withdrawal
          </button>
        </motion.div>

        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleSubmitWithdrawal}
            className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-navy-800/60 p-5"
          >
            {formError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="shrink-0" /> {formError}
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Amount (₹)</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-400"
              />
            </label>
            <div className="flex gap-2">
              {(['upi', 'bank'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold uppercase',
                    method === m ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-white/10 text-white/50'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">{method === 'upi' ? 'UPI ID' : 'Bank details'}</span>
              <input
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={method === 'upi' ? 'yourname@upi' : 'Account no., IFSC, bank name'}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-400"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Submit Request'}
            </button>
          </motion.form>
        )}

        {withdrawals.length > 0 && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-navy-800/60 p-6">
            <h2 className="text-lg font-bold text-white">Withdrawal requests</h2>
            <div className="mt-4 divide-y divide-white/10">
              {withdrawals.map((w) => {
                const s = STATUS_STYLE[w.status];
                return (
                  <div key={w._id} className="flex items-center gap-3 py-3.5">
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', s.color)}>
                      <s.icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{formatRupees(w.amount)}</p>
                      <p className="text-xs capitalize text-white/50">
                        {w.status} · {new Date(w.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-white/10 bg-navy-800/60 p-6">
          <h2 className="text-lg font-bold text-white">Recent activity</h2>
          {data.recentTransactions.length === 0 ? (
            <p className="mt-4 text-sm text-white/50">No transactions yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-white/10">
              {data.recentTransactions.map((t) => {
                const isCredit = t.netAmount > 0;
                return (
                  <div key={t._id} className="flex items-center gap-3 py-3.5">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isCredit ? 'bg-teal-500/15 text-teal-300' : 'bg-white/10 text-white/60'}`}>
                      {isCredit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold capitalize text-white">{t.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-white/50">{new Date(t.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${isCredit ? 'text-teal-300' : 'text-white/70'}`}>
                      {isCredit ? '+' : ''}{formatRupees(t.netAmount || t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}