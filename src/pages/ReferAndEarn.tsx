import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  Check,
  Copy,
  Gift,
  IndianRupee,
  Link2,
  Loader2,
  MessageCircle,
  Share2,
  UserPlus,
  Users2,
  Wallet,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { referralApi, type MyReferralsData } from '@/services/referralApi';
import { agencyApi } from '@/services/agencyApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { inviteLinkFor, isValidReferralCode, normalizeReferralInput, REFERRAL_CODE_LENGTH } from '@/utils/referral';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STEPS = [
  { icon: Share2, title: 'Share your code', text: 'Send your invite link or 8-character code to creators and brands.' },
  { icon: UserPlus, title: 'They join Fanitt', text: 'They sign up with your code — it’s added automatically from your link.' },
  { icon: Wallet, title: 'You earn', text: 'You get a commission in your wallet whenever they earn or pay on Fanitt.' },
];

export default function ReferAndEarn() {
  const user = useAppSelector((s) => s.auth.user);
  const [data, setData] = useState<MyReferralsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    referralApi
      .getMyReferrals()
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const code = data?.referralCode || '';
  const link = code ? inviteLinkFor(code) : '';
  const shareText = `Join me on Fanitt — where creators and brands work together with escrow-protected payments. Use my code ${code} to sign up: ${link}`;

  const copy = async (what: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(what === 'code' ? code : link);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setError('Couldn’t copy — select the text and copy it manually.');
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join me on Fanitt', text: shareText, url: link });
      } catch {
        // user cancelled
      }
    } else {
      copy('link');
    }
  };

  return (
    <div className="overflow-x-hidden pt-24 pb-24 sm:pt-28">
      <Container className="!max-w-5xl">
        {/* Hero with code */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-orange-500/20 via-navy-800/70 to-pink-500/15 p-5 sm:p-10"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/25 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
              <Gift size={13} /> Refer & earn
            </span>
            <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-white sm:text-4xl">Invite people, earn on their activity</h1>
            <p className="mt-2 max-w-xl text-sm text-white/65 sm:text-base">
              Everyone who joins Fanitt with your code is linked to you. You earn a commission every time they earn or pay on the platform.
            </p>

            {loading ? (
              <div className="mt-8 flex items-center gap-2 text-white/60">
                <Loader2 size={18} className="animate-spin" /> Loading your code…
              </div>
            ) : code ? (
              <div className="mt-6 grid gap-3 sm:mt-8 lg:grid-cols-[auto_minmax(0,1fr)]">
                {/* Code */}
                <div className="min-w-0 rounded-2xl border border-white/15 bg-black/25 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Your code</p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-3 lg:justify-start">
                    <p className="break-all font-mono text-2xl font-bold tracking-[0.15em] text-white sm:text-3xl sm:tracking-[0.25em]">{code}</p>
                    <button
                      onClick={() => copy('code')}
                      className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                    >
                      {copied === 'code' ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                      {copied === 'code' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Link + share */}
                <div className="min-w-0 rounded-2xl border border-white/15 bg-black/25 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Invite link</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <p className="min-w-0 flex-1 basis-full break-all text-xs text-white/80 sm:basis-auto sm:truncate sm:text-sm">{link}</p>
                    <button
                      onClick={() => copy('link')}
                      className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                    >
                      {copied === 'link' ? <Check size={14} className="text-emerald-300" /> : <Link2 size={14} />}
                      {copied === 'link' ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 sm:px-4 sm:py-2"
                    >
                      <MessageCircle size={15} className="shrink-0" /> <span className="truncate">WhatsApp</span>
                    </a>
                    <button
                      onClick={nativeShare}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-orange-600 sm:px-4 sm:py-2"
                    >
                      <Share2 size={15} className="shrink-0" /> Share
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {error && (
              <p className="mt-4 flex items-center gap-1.5 text-sm text-red-400">
                <AlertCircle size={14} /> {error}
              </p>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        {data && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard icon={Users2} label="People you referred" value={data.referredUsers.length.toLocaleString('en-IN')} />
            <StatCard icon={IndianRupee} label="Total earned" value={formatRupees(data.totalEarned)} highlight />
          </div>
        )}

        {/* How it works */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="min-w-0 rounded-2xl border border-white/10 bg-navy-800/60 p-4 sm:p-5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
                <s.icon size={18} />
              </span>
              <p className="mt-3 font-bold text-white">
                {i + 1}. {s.title}
              </p>
              <p className="mt-1 text-sm text-white/55">{s.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Join an agency (creators & brands) */}
        {(user?.role === 'creator' || user?.role === 'brand') && <JoinAgencyCard role={user.role} />}

        {/* Lists */}
        {data && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
            <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
              <h2 className="font-bold text-white">People you referred</h2>
              {data.referredUsers.length === 0 ? (
                <p className="mt-3 text-sm text-white/45">Nobody yet — share your link to get started.</p>
              ) : (
                <div className="mt-3 divide-y divide-white/[0.06]">
                  {data.referredUsers.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 py-2.5">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-sm font-bold text-orange-300">
                          {u.name.trim()[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                        <p className="text-xs capitalize text-white/45">
                          {u.role} · joined {formatDate(u.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
              <h2 className="font-bold text-white">Recent earnings</h2>
              {data.recentCommissions.length === 0 ? (
                <p className="mt-3 text-sm text-white/45">Your commissions will show up here.</p>
              ) : (
                <div className="mt-3 divide-y divide-white/[0.06]">
                  {data.recentCommissions.map((t) => (
                    <div key={t._id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{t.from?.name ? `From ${t.from.name}` : 'Referral commission'}</p>
                        <p className="text-xs text-white/45">{formatDate(t.createdAt)}</p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-emerald-300">+{formatRupees(t.referralCommission || t.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }: { icon: typeof Users2; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn('min-w-0 rounded-2xl border p-4 sm:p-5', highlight ? 'border-emerald-500/25 bg-emerald-500/[0.07]' : 'border-white/10 bg-navy-800/60')}>
      <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', highlight ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-white/70')}>
        <Icon size={18} />
      </span>
      <p className="mt-3 truncate text-xl font-bold text-white sm:text-2xl">{value}</p>
      <p className="text-xs text-white/50 sm:text-sm">{label}</p>
    </div>
  );
}

/** Creators and brands can join an agency's network with its code. */
function JoinAgencyCard({ role }: { role: 'creator' | 'brand' }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setDone('');
    if (!isValidReferralCode(code)) {
      setError(`Agency codes are exactly ${REFERRAL_CODE_LENGTH} characters (e.g. AGK7F3QX).`);
      return;
    }
    setBusy(true);
    try {
      if (role === 'creator') await agencyApi.linkCreator(code);
      else await agencyApi.linkBrand(code);
      setDone('You’re now part of this agency’s network.');
      setCode('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-navy-800/60 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
          <Building2 size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-white">Working with an agency?</h2>
          <p className="mt-0.5 text-sm text-white/55">Enter your agency’s code to join their network.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(normalizeReferralInput(e.target.value))}
              maxLength={REFERRAL_CODE_LENGTH}
              placeholder="Agency code (e.g. AGK7F3QX)"
              className="w-full min-w-0 rounded-xl border border-white/10 bg-navy-900/40 px-4 py-2.5 font-mono sm:w-60 text-sm uppercase tracking-[0.15em] text-white placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-white/30 focus:border-orange-400 focus:outline-none"
            />
            <button
              onClick={submit}
              disabled={busy || code.length === 0}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50 sm:w-auto"
            >
              {busy && <Loader2 size={14} className="animate-spin" />} Join agency
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-white/35">
            {code.length}/{REFERRAL_CODE_LENGTH} characters
          </p>
          {done && <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-300"><Check size={14} /> {done}</p>}
          {error && <p className="mt-2 flex items-center gap-1.5 text-sm text-red-400"><AlertCircle size={14} /> {error}</p>}
        </div>
      </div>
    </div>
  );
}