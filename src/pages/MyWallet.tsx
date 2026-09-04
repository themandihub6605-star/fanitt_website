import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Send, X, Loader2, AlertCircle, CheckCircle2, Clock, Truck, XCircle, Info } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { walletApi, type WalletData, type Withdrawal, type WithdrawalPreview } from '@/services/walletApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Record<string, ...> (not keyed to Withdrawal['status']) so legacy
// documents created before the initiated/processing/completed/rejected
// rename — which still have status: 'pending' or 'paid' in the DB —
// don't crash the lookup below.
const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  initiated: { label: 'Initiated', icon: Clock, className: 'bg-sky-500/15 text-sky-300' },
  processing: { label: 'Processing', icon: Truck, className: 'bg-yellow-400/15 text-yellow-300' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-300' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-500/15 text-red-300' },
  // Legacy values from before the status rename — map to their closest
  // new equivalent so old withdrawal history still renders correctly.
  pending: { label: 'Initiated', icon: Clock, className: 'bg-sky-500/15 text-sky-300' },
  paid: { label: 'Completed', icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-300' },
};

// UPI: name@bank, 2-256 chars before/after @. Basic but catches the most
// common "forgot the @bank part" / stray-space mistakes.
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/;
// IFSC: 4 letters (bank code) + 0 + 6 alphanumeric (branch code) — the
// standard RBI format.
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function WithdrawModal({
  open,
  onClose,
  availableBalance,
  onRequested,
}: {
  open: boolean;
  onClose: () => void;
  availableBalance: number;
  onRequested: (message: string) => void;
}) {
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [amountInput, setAmountInput] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const [preview, setPreview] = useState<WithdrawalPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const amountPaise = Math.round((parseFloat(amountInput) || 0) * 100);

  // Debounced live fee preview whenever the amount changes.
  useEffect(() => {
    if (!open || amountPaise <= 0) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    const t = setTimeout(() => {
      walletApi
        .previewWithdrawal(amountPaise)
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [amountPaise, open]);

  const resetForm = () => {
    setAmountInput('');
    setUpiId('');
    setAccountHolder('');
    setAccountNumber('');
    setConfirmAccountNumber('');
    setIfsc('');
    setPreview(null);
    setError('');
    setFieldErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!amountInput.trim()) errs.amount = 'Enter an amount';
    else if (amountPaise <= 0) errs.amount = 'Enter a valid amount';
    else if (amountPaise > availableBalance) errs.amount = "You don't have this much available";

    if (method === 'upi') {
      if (!upiId.trim()) errs.upiId = 'Enter your UPI ID';
      else if (!UPI_REGEX.test(upiId.trim())) errs.upiId = 'Enter a valid UPI ID, e.g. name@bank';
    } else {
      if (!accountHolder.trim()) errs.accountHolder = 'Enter the account holder name';
      if (!accountNumber.trim()) errs.accountNumber = 'Enter the account number';
      else if (!/^\d{9,18}$/.test(accountNumber.trim())) errs.accountNumber = 'Account number should be 9-18 digits';
      if (confirmAccountNumber.trim() !== accountNumber.trim()) errs.confirmAccountNumber = 'Account numbers do not match';
      if (!ifsc.trim()) errs.ifsc = 'Enter the IFSC code';
      else if (!IFSC_REGEX.test(ifsc.trim().toUpperCase())) errs.ifsc = 'Enter a valid IFSC code, e.g. HDFC0001234';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validate()) return;

    const payoutDetails =
      method === 'upi'
        ? upiId.trim()
        : `Bank: ${accountHolder.trim()}, Acc: ${accountNumber.trim()}, IFSC: ${ifsc.trim().toUpperCase()}`;

    setSubmitting(true);
    try {
      const result = await walletApi.requestWithdrawal({ amount: amountPaise, payoutMethod: method, payoutDetails });
      onRequested(result.message || 'Withdrawal requested — funds will be sent within 48 hours.');
      resetForm();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
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
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-navy-900 p-6 sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Request Withdrawal</h2>
              <button onClick={handleClose} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="mt-1 text-sm text-white/50">Available balance: {formatRupees(availableBalance)}</p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-white/70">Amount (₹)</span>
                <input
                  type="number"
                  min="1"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="e.g. 500"
                  className={cn(
                    'w-full rounded-xl border bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400',
                    fieldErrors.amount ? 'border-red-500/50' : 'border-white/10'
                  )}
                />
                {fieldErrors.amount && <p className="mt-1 text-xs text-red-400">{fieldErrors.amount}</p>}
              </label>

              {/* Live fee preview */}
              {amountPaise > 0 && (
                <div className="rounded-xl border border-white/10 bg-navy-800/40 p-3.5">
                  {previewLoading ? (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Loader2 size={13} className="animate-spin" /> Calculating fee...
                    </div>
                  ) : preview ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-white/60">
                        <span>Requested amount</span>
                        <span className="font-semibold text-white">{formatRupees(preview.amount)}</span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>Platform fee ({preview.platformFeePercent}%)</span>
                        <span className="font-semibold text-red-300">− {formatRupees(preview.platformFee)}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-1.5 text-sm">
                        <span className="font-bold text-white">You'll receive</span>
                        <span className="font-bold text-emerald-300">{formatRupees(preview.netPayoutAmount)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-white/70">Payout method</span>
                <div className="flex gap-2">
                  {(['upi', 'bank'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={cn(
                        'flex-1 rounded-xl border py-2.5 text-sm font-bold uppercase transition-colors',
                        method === m ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-white/10 text-white/60 hover:border-white/20'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {method === 'upi' ? (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">UPI ID</span>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className={cn(
                      'w-full rounded-xl border bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400',
                      fieldErrors.upiId ? 'border-red-500/50' : 'border-white/10'
                    )}
                  />
                  {fieldErrors.upiId && <p className="mt-1 text-xs text-red-400">{fieldErrors.upiId}</p>}
                </label>
              ) : (
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-white/70">Account holder name</span>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="As per bank records"
                      className={cn(
                        'w-full rounded-xl border bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400',
                        fieldErrors.accountHolder ? 'border-red-500/50' : 'border-white/10'
                      )}
                    />
                    {fieldErrors.accountHolder && <p className="mt-1 text-xs text-red-400">{fieldErrors.accountHolder}</p>}
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-white/70">Account number</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456789012"
                      className={cn(
                        'w-full rounded-xl border bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400',
                        fieldErrors.accountNumber ? 'border-red-500/50' : 'border-white/10'
                      )}
                    />
                    {fieldErrors.accountNumber && <p className="mt-1 text-xs text-red-400">{fieldErrors.accountNumber}</p>}
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-white/70">Confirm account number</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                      onPaste={(e) => e.preventDefault()} // force re-typing to catch typos, same as most banking UIs
                      placeholder="Re-enter account number"
                      className={cn(
                        'w-full rounded-xl border bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400',
                        fieldErrors.confirmAccountNumber ? 'border-red-500/50' : 'border-white/10'
                      )}
                    />
                    {fieldErrors.confirmAccountNumber && <p className="mt-1 text-xs text-red-400">{fieldErrors.confirmAccountNumber}</p>}
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-white/70">IFSC code</span>
                    <input
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      maxLength={11}
                      className={cn(
                        'w-full rounded-xl border bg-navy-800/55 px-4 py-2.5 text-sm uppercase text-white placeholder:text-white/30 focus:border-orange-400',
                        fieldErrors.ifsc ? 'border-red-500/50' : 'border-white/10'
                      )}
                    />
                    {fieldErrors.ifsc && <p className="mt-1 text-xs text-red-400">{fieldErrors.ifsc}</p>}
                  </label>
                </div>
              )}

              <p className="flex items-start gap-1.5 text-[11px] text-white/40">
                <Info size={13} className="mt-0.5 shrink-0" />
                Withdrawals are processed manually and typically take up to 48 hours after the platform fee shown above.
              </p>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Withdrawal'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function MyWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([walletApi.getMy(), walletApi.getMyWithdrawals()])
      .then(([w, wd]) => {
        setWallet(w);
        setWithdrawals(wd);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRequested = (message: string) => {
    setSuccessMessage(message);
    load();
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 pt-20 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 sm:pt-28">
      <Container className="max-w-2xl">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">My Wallet</h1>
        <p className="mt-1 text-sm text-white/50">Your balance and recent activity.</p>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> {successMessage}
          </div>
        )}

        {wallet && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 via-navy-800/60 to-navy-800/60 p-6 text-center"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
              <Wallet size={26} />
            </span>
            <p className="mt-4 text-3xl font-bold text-white">{formatRupees(wallet.balance)}</p>
            <p className="mt-1 text-sm text-white/50">Available balance</p>
            <p className="mt-1 text-[11px] text-white/30">Platform fee is calculated only when you withdraw — see the breakdown before confirming.</p>

            <button
              onClick={() => setModalOpen(true)}
              disabled={wallet.balance <= 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40 sm:w-auto sm:px-8"
            >
              <Send size={15} /> Request Withdrawal
            </button>
          </motion.div>
        )}

        {/* Withdrawal requests */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-800/60 p-5">
          <h2 className="text-sm font-bold text-white">Withdrawal requests</h2>
          {withdrawals.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">No withdrawal requests yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-white/5">
              {withdrawals.map((w) => {
                const config = STATUS_CONFIG[w.status] || STATUS_CONFIG.initiated;
                const StatusIcon = config.icon;
                return (
                  <div key={w._id} className="py-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', config.className)}>
                          <StatusIcon size={15} />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white">{formatRupees(w.amount)} requested</p>
                          <p className="text-xs text-white/40">{formatDate(w.createdAt)} · {w.payoutMethod.toUpperCase()}</p>
                        </div>
                      </div>
                      <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', config.className)}>{config.label}</span>
                    </div>

                    <div className="mt-2.5 ml-12 grid grid-cols-3 gap-2 rounded-lg bg-navy-900/40 p-2.5 text-[11px]">
                      <div>
                        <p className="text-white/40">Requested</p>
                        <p className="font-semibold text-white">{formatRupees(w.amount)}</p>
                      </div>
                      <div>
                        <p className="text-white/40">Platform fee ({w.platformFeePercent}%)</p>
                        <p className="font-semibold text-red-300">− {formatRupees(w.platformFee)}</p>
                      </div>
                      <div>
                        <p className="text-white/40">Net payout</p>
                        <p className="font-semibold text-emerald-300">{formatRupees(w.netPayoutAmount)}</p>
                      </div>
                    </div>

                    {w.status !== 'completed' && w.status !== 'rejected' && (
                      <p className="ml-12 mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
                        <Info size={12} className="shrink-0" />
                        Processed manually — takes up to 48 hours.
                      </p>
                    )}

                    {w.status === 'rejected' && w.adminNote && (
                      <p className="ml-12 mt-2 text-xs text-red-300">Reason: {w.adminNote}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-800/60 p-5">
          <h2 className="text-sm font-bold text-white">Recent activity</h2>
          {!wallet || wallet.recentTransactions.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">No transactions yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-white/5">
              {wallet.recentTransactions.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                      <Wallet size={15} />
                    </span>
                    <div>
                      <p className="text-sm font-bold capitalize text-white">{tx.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-white/40">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-300">+{formatRupees(tx.netAmount || tx.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>

      {wallet && (
        <WithdrawModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          availableBalance={wallet.balance}
          onRequested={handleRequested}
        />
      )}
    </div>
  );
}