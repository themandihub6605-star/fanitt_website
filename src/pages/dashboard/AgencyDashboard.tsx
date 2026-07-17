import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users2,
  Building2,
  Wallet,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { agencyApi, type AgencyDashboardData, type ApiAgency, type ApiReferral } from '@/services/agencyApi';
import { getApiErrorMessage } from '@/services/apiClient';

function formatRupees(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

const PIE_COLORS: Record<string, string> = {
  Session: '#22D3EE',
  Campaign: '#A78BFA',
  Other: '#F97316',
};

/** Shown while the agency's registration hasn't been submitted, is pending
 * admin review, or was rejected — real verificationStatus from the backend,
 * not a placeholder. */
function StatusGate({ profile, onReload }: { profile: ApiAgency; onReload: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(Boolean(profile.documentUrl));
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await agencyApi.uploadDocument(file);
      setUploaded(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  if (profile.verificationStatus === 'unverified') {
    return (
      <div className="mx-auto max-w-md text-center">
        <ShieldAlert size={32} className="mx-auto text-yellow-400" />
        <h1 className="mt-4 text-xl font-bold text-white">Finish your agency registration</h1>
        <p className="mt-2 text-sm text-white/60">
          Your account was created but your agency details weren't submitted yet.
        </p>
        <Link to="/dashboard/agency/edit">
          <Button className="mt-6">Complete Registration</Button>
        </Link>
      </div>
    );
  }

  if (profile.verificationStatus === 'pending') {
    return (
      <div className="mx-auto max-w-md text-center">
        <Clock size={32} className="mx-auto text-orange-400" />
        <h1 className="mt-4 text-xl font-bold text-white">Waiting for admin approval</h1>
        <p className="mt-2 text-sm text-white/60">
          <b className="text-white">{profile.agencyName}</b> is in the review queue. You'll get full dashboard access
          once an admin approves your agency.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-800/50 p-5 text-left">
          <p className="text-sm font-semibold text-white">ID / Address proof</p>
          {uploaded ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-400">
              <Check size={14} /> Document uploaded
            </p>
          ) : (
            <>
              <p className="mt-1 text-xs text-white/50">Speeds up your review — optional but recommended.</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-3 flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 hover:border-orange-400/40 disabled:opacity-50"
              >
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                Upload document
              </button>
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </>
          )}
        </div>
      </div>
    );
  }

  if (profile.verificationStatus === 'rejected') {
    return (
      <div className="mx-auto max-w-md text-center">
        <AlertCircle size={32} className="mx-auto text-red-400" />
        <h1 className="mt-4 text-xl font-bold text-white">Application not approved</h1>
        {profile.rejectionReason && <p className="mt-2 text-sm text-white/60">Reason: {profile.rejectionReason}</p>}
        <p className="mt-2 text-sm text-white/60">Update your details and resubmit for another review.</p>
        <Link to="/dashboard/agency/edit">
          <Button className="mt-6" onClick={onReload}>
            Edit &amp; Resubmit
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}

export default function AgencyDashboard() {
  const [profile, setProfile] = useState<ApiAgency | null>(null);
  const [data, setData] = useState<AgencyDashboardData | null>(null);
  const [referrals, setReferrals] = useState<ApiReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    agencyApi
      .getMyProfile()
      .then((p) => {
        setProfile(p);
        if (p.verificationStatus === 'verified') {
          return Promise.all([agencyApi.getMyDashboard(), agencyApi.getMyReferrals()]).then(([d, r]) => {
            setData(d);
            setReferrals(r);
          });
        }
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const copyReferralCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.stats.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading your agency...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center text-white/60">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm">Couldn't load your agency — {error}</p>
      </div>
    );
  }

  if (profile.verificationStatus !== 'verified' || !data) {
    return (
      <div className="flex min-h-[70vh] items-center pt-8">
        <Container>
          <StatusGate profile={profile} onReload={load} />
        </Container>
      </div>
    );
  }

  const pieData = data.earningsBreakdown
    .map((row) => ({
      name: row._id === 'Session' ? 'Creator Earnings' : row._id === 'Campaign' ? 'Brand Earnings' : 'Other',
      value: row.total,
      color: PIE_COLORS[row._id || 'Other'] || PIE_COLORS.Other,
    }))
    .filter((row) => row.value > 0);

  return (
    <div className="pt-8 pb-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Welcome back, {profile.agencyName} 👋</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-400">
              <ShieldCheck size={14} /> Verified agency
            </p>
          </div>
          <Link to="/dashboard/agency/edit" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 hover:border-orange-400 hover:text-orange-300">
            Edit Profile
          </Link>
        </div>

        {/* Referral code */}
        <button
          onClick={copyReferralCode}
          className="mt-6 flex w-full items-center justify-between rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-4 text-left"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Your referral code</p>
            <p className="mt-1 text-xl font-bold tracking-wide text-white">{data.stats.referralCode}</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-xs font-bold text-white/70">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </span>
        </button>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400"><Users2 size={17} /></span>
            <p className="mt-4 text-2xl font-bold text-white">{data.stats.totalReferrals}</p>
            <p className="text-xs text-white/50">Total Referrals</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300"><Users2 size={17} /></span>
            <p className="mt-4 text-2xl font-bold text-white">{data.stats.referredCreatorCount}</p>
            <p className="text-xs text-white/50">Creators Referred</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300"><Building2 size={17} /></span>
            <p className="mt-4 text-2xl font-bold text-white">{data.stats.referredBrandCount}</p>
            <p className="text-xs text-white/50">Brands Onboarded</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300"><Wallet size={17} /></span>
            <p className="mt-4 text-2xl font-bold text-white">{formatRupees(data.stats.totalCommissionEarned)}</p>
            <p className="text-xs text-white/50">Total Earnings</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/15 text-yellow-300"><Wallet size={17} /></span>
            <p className="mt-4 text-2xl font-bold text-white">{formatRupees(data.stats.walletBalance)}</p>
            <p className="text-xs text-white/50">Wallet Balance</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Referrals table */}
          <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-6">
            <h2 className="text-lg font-bold text-white">Recent Referrals</h2>
            {referrals.length === 0 ? (
              <p className="mt-4 text-sm text-white/50">
                No referrals yet — share your referral code with creators and brands to get started.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-white/10">
                {referrals.slice(0, 8).map((r) => (
                  <div key={r._id} className="flex items-center gap-3 py-3">
                    {r.avatarUrl ? (
                      <img src={r.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
                        {r.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{r.name}</p>
                      <p className="text-xs capitalize text-white/40">{r.type} &middot; {new Date(r.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    {r.totalEarnings !== null && (
                      <span className="shrink-0 text-sm font-bold text-white">{formatRupees(r.totalEarnings)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Earnings breakdown */}
          <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-6">
            <h2 className="text-lg font-bold text-white">Earnings Breakup</h2>
            {pieData.length === 0 ? (
              <p className="mt-4 text-sm text-white/50">No commission earnings yet.</p>
            ) : (
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatRupees(v)} contentStyle={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
