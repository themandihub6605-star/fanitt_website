import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Wallet, Megaphone, Users2, ShieldCheck, Plus, Loader2, AlertCircle, Camera, ChevronRight, TrendingUp, ShieldAlert, Clock } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { brandApi, type BrandDashboardData, type ApiBrand } from '@/services/brandApi';
import { getApiErrorMessage, getUploadUrl } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';

const toneClasses = {
  orange: 'bg-orange-500/15 text-orange-400',
  teal: 'bg-teal-500/15 text-teal-300',
  yellow: 'bg-yellow-400/15 text-yellow-300',
  navy: 'bg-white/10 text-white',
};

const toneBorderClasses = {
  orange: 'border-l-orange-500',
  teal: 'border-l-teal-500',
  yellow: 'border-l-yellow-400',
  navy: 'border-l-white/30',
};

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

// Same donut treatment as the Creator dashboard's "Earnings breakdown" —
// real spendBreakdown data from the API, just visualized instead of left
// as an unused fetch.
const SPEND_COLORS = ['#FF5A1F', '#EC2A78', '#FFD65C', '#2DD4BF', '#38BDF8'];

function SpendBreakdownCard({ breakdown }: { breakdown: { _id: string; total: number }[] }) {
  const total = breakdown.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-6 shadow-card transition-all duration-300 ease-out hover:border-white/20">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-teal-400" />
        <h2 className="text-lg font-bold text-white">Spend breakdown</h2>
      </div>

      {breakdown.length === 0 ? (
        <p className="mt-4 text-sm text-white/50">No spend yet.</p>
      ) : (
        <div className="mt-4 flex items-center gap-5">
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdown} dataKey="total" nameKey="_id" innerRadius="65%" outerRadius="100%" paddingAngle={3} stroke="none">
                  {breakdown.map((_, i) => (
                    <Cell key={i} fill={SPEND_COLORS[i % SPEND_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-white">{formatRupees(total)}</span>
              <span className="text-[10px] text-white/40">total</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-2.5">
            {breakdown.map((row, i) => {
              const pct = total ? Math.round((row.total / total) * 100) : 0;
              return (
                <div key={row._id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5 truncate capitalize text-white/60">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SPEND_COLORS[i % SPEND_COLORS.length] }} />
                    <span className="truncate">{row._id.replace(/_/g, ' ')}</span>
                  </span>
                  <span className="shrink-0 font-bold text-white">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Same pattern as CreatorDashboard's StatusGate / AgencyDashboard's — keeps
 * all three roles' approval-gate behavior consistent. */
function StatusGate({ profile }: { profile: ApiBrand }) {
  if (profile.verificationStatus === 'unverified') {
    return (
      <div className="mx-auto max-w-md text-center">
        <ShieldAlert size={32} className="mx-auto text-yellow-400" />
        <h1 className="mt-4 text-xl font-bold text-white">Finish your brand profile</h1>
        <p className="mt-2 text-sm text-white/60">Your account was created but your details weren't submitted for review yet.</p>
        <Link to="/dashboard/brand/edit">
          <Button className="mt-6">Complete Profile</Button>
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
          <b className="text-white">{profile.companyName}</b> is in the review queue. You'll get full dashboard access once an admin approves it.
        </p>
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
        <Link to="/dashboard/brand/edit">
          <Button className="mt-6">Edit &amp; Resubmit</Button>
        </Link>
      </div>
    );
  }

  return null;
}

export default function BrandDashboard() {
  const [data, setData] = useState<BrandDashboardData | null>(null);
  const [profile, setProfile] = useState<ApiBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    brandApi
      .getMyDashboard()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(getApiErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    brandApi
      .getMyProfile()
      .then((p) => !cancelled && setProfile(p))
      .catch(() => !cancelled && setProfile(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    setLogoUploading(true);
    try {
      const { logoUrl: uploadedUrl } = await brandApi.uploadLogo(file);
      setLogoUrl(uploadedUrl);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLogoUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center text-white/60">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm">Couldn't load your dashboard — {error}</p>
      </div>
    );
  }

  if (profile && profile.verificationStatus && profile.verificationStatus !== 'verified') {
    return (
      <div className="flex min-h-[70vh] items-center pt-8">
        <Container>
          <StatusGate profile={profile} />
        </Container>
      </div>
    );
  }

  const inEscrow = data.spendBreakdown.find((s) => s._id === 'in_escrow')?.total || 0;

  const STATS = [
    { icon: Wallet, label: 'Total spent', value: formatRupees(data.stats.totalSpent), tone: 'orange' as const },
    { icon: Megaphone, label: 'Total campaigns', value: String(data.stats.totalCampaigns), tone: 'teal' as const },
    { icon: Users2, label: 'Active campaigns', value: String(data.campaigns.filter((c) => c.status === 'open' || c.status === 'in_progress').length), tone: 'yellow' as const },
    { icon: ShieldCheck, label: 'In escrow', value: formatRupees(inEscrow), tone: 'navy' as const },
  ];

  return (
    <div className="pt-8 pb-14">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-orange-500/20 text-lg font-bold text-orange-300 ring-2 ring-orange-500/30 ring-offset-2 ring-offset-[#0A0A0A] transition-transform duration-300 ease-out hover:scale-105"
              >
                {logoUploading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : logoUrl ? (
                  <img src={getUploadUrl(logoUrl)} alt="" className="h-full w-full object-cover" />
                ) : user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  user?.name.charAt(0).toUpperCase()
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={16} className="text-white" />
                </span>
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">Brand</span> Dashboard
              </h1>
              <p className="mt-1 text-sm text-white/60">{user?.name} · click your logo to upload</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard/brand/edit"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-orange-400/50 hover:bg-orange-500/10 hover:text-orange-300 hover:shadow-card"
            >
              Edit Profile
            </Link>
            <Link to="/campaigns/new">
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button>
                  <Plus size={16} /> Post a requirement
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={`flex items-center gap-3.5 rounded-2xl border border-l-4 border-white/10 bg-navy-800/60 p-4 shadow-card sm:p-5 ${toneBorderClasses[stat.tone]}`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${toneClasses[stat.tone]}`}>
                <stat.icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold leading-tight text-white">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-white/15" />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-white/10 bg-navy-800/60 p-6 shadow-card transition-all duration-300 ease-out hover:border-white/20"
          >
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <Megaphone size={17} className="text-orange-400" /> Your campaigns
            </h2>
            {data.campaigns.length === 0 ? (
              <p className="mt-4 text-sm text-white/50">No campaigns yet — post your first requirement.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[440px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wide text-white/40">
                      <th className="pb-3 pr-4 font-bold">Campaign</th>
                      <th className="pb-3 pr-4 font-bold">Applicants</th>
                      <th className="pb-3 pr-4 font-bold">Budget</th>
                      <th className="pb-3 pr-4 text-right font-bold">Status</th>
                      <th className="w-6 pb-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.campaigns.map((c) => (
                      <tr
                        key={c._id}
                        onClick={() => navigate(c.status === 'open' && c.applicantCount > 0 ? `/campaigns/${c._id}/applications` : `/campaigns/${c._id}`)}
                        className="group cursor-pointer transition-colors duration-200 hover:bg-white/[0.04]"
                      >
                        <td className="max-w-[180px] py-3 pr-4">
                          <span className="flex items-center gap-3">
                            <img src={c.campaignImageUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-inset ring-white/10" />
                            <span className="truncate font-semibold text-white transition-colors group-hover:text-orange-300">{c.title}</span>
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-white/60">{c.applicantCount}</td>
                        <td className="whitespace-nowrap py-3 pr-4 text-white/50">{formatRupees(c.budget)}</td>
                        <td className="py-3 pr-4 text-right">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3">
                          <ChevronRight size={16} className="text-white/20 transition-colors group-hover:text-orange-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          <div className="space-y-6">
            <SpendBreakdownCard breakdown={data.spendBreakdown} />
          </div>
        </div>
      </Container>
    </div>
  );
}