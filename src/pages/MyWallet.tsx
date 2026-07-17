import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Crown, Star, Loader2, AlertCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { walletApi, type WalletData } from '@/services/walletApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function MyWallet() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    walletApi
      .getMy()
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

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
        </motion.div>

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