import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Megaphone, Users2, ShieldCheck, Plus, Loader2, AlertCircle, Camera } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { brandApi, type BrandDashboardData } from '@/services/brandApi';
import { getApiErrorMessage, getUploadUrl } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';

const toneClasses = {
  orange: 'bg-orange-500/15 text-orange-400',
  teal: 'bg-teal-500/15 text-teal-300',
  yellow: 'bg-yellow-400/15 text-yellow-300',
  navy: 'bg-white/10 text-white',
};

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function BrandDashboard() {
  const [data, setData] = useState<BrandDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    let cancelled = false;
    brandApi
      .getMyDashboard()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(getApiErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
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

  const inEscrow = data.spendBreakdown.find((s) => s._id === 'in_escrow')?.total || 0;

  const STATS = [
    { icon: Wallet, label: 'Total spent', value: formatRupees(data.stats.totalSpent), tone: 'orange' as const },
    { icon: Megaphone, label: 'Total campaigns', value: String(data.stats.totalCampaigns), tone: 'teal' as const },
    { icon: Users2, label: 'Active campaigns', value: String(data.campaigns.filter((c) => c.status === 'open' || c.status === 'in_progress').length), tone: 'yellow' as const },
    { icon: ShieldCheck, label: 'In escrow', value: formatRupees(inEscrow), tone: 'navy' as const },
  ];

  return (
    <div className="pt-8 pb-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-orange-500/20 text-lg font-bold text-orange-300"
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
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Brand Dashboard</h1>
              <p className="text-sm text-white/60">{user?.name} · click your logo to upload</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/brand/edit" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 hover:border-orange-400 hover:text-orange-300">
              Edit Profile
            </Link>
            <Link to="/campaigns/new">
              <Button>
                <Plus size={16} /> Post a requirement
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-navy-800/60 p-5"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[stat.tone]}`}>
                <stat.icon size={17} />
              </span>
              <p className="mt-4 text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/50">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-navy-800/60 p-6">
          <h2 className="text-lg font-bold text-white">Your campaigns</h2>
          {data.campaigns.length === 0 ? (
            <p className="mt-4 text-sm text-white/50">No campaigns yet — post your first requirement.</p>
          ) : (
            <div className="mt-4 divide-y divide-white/10">
              {data.campaigns.map((c) => (
                <Link
                  key={c._id}
                  to={c.status === 'open' && c.applicantCount > 0 ? `/campaigns/${c._id}/applications` : `/campaigns/${c._id}`}
                  className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3.5 transition-colors hover:bg-navy-800/45"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{c.title}</p>
                    <p className="text-xs text-white/50">{c.applicantCount} applicants · {formatRupees(c.budget)}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}