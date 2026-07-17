import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Loader2, AlertCircle, CheckCircle2, Wallet, CalendarCheck, MessageSquare, Heart, ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { userApi } from '@/services/userApi';
import { walletApi } from '@/services/walletApi';
import { bookingApi, type ApiBooking } from '@/services/bookingApi';
import { chatApi } from '@/services/chatApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';

/** Real account hub for Fan users — the destination "their own profile" links
 * to after signup/login. Everything here is live data, nothing static. */
export default function FanProfilePage() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    setLoadingStats(true);
    Promise.all([
      walletApi.getMy().then((w) => setWalletBalance(w.balance)).catch(() => setWalletBalance(null)),
      bookingApi.myBookings().then(setBookings).catch(() => setBookings([])),
      chatApi
        .listConversations()
        .then((c) => setUnreadMessages(c.reduce((sum, x) => sum + (x.unreadCount || 0), 0)))
        .catch(() => setUnreadMessages(0)),
    ]).finally(() => setLoadingStats(false));
  }, []);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const { avatarUrl } = await userApi.uploadAvatar(file);
      dispatch(updateUser({ avatarUrl }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const updated = await userApi.updateMe({ name, phone: phone || undefined });
      dispatch(updateUser({ name: updated.name, phone: updated.phone }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const upcomingCount = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length;

  return (
    <div className="pt-28 pb-20">
      <Container className="!max-w-2xl">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">My Profile</h1>
        <p className="mt-1 text-sm text-white/60">Your Fanitt account.</p>

        {/* Real stats row */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Link to="/wallet" className="rounded-2xl border border-white/10 bg-navy-800/50 p-4 text-center hover:border-orange-400/40">
            <Wallet size={18} className="mx-auto text-orange-400" />
            <p className="mt-2 text-lg font-bold text-white">
              {loadingStats ? '—' : walletBalance !== null ? `₹${Math.round(walletBalance / 100).toLocaleString('en-IN')}` : '—'}
            </p>
            <p className="text-[11px] text-white/40">Wallet</p>
          </Link>
          <Link to="/bookings" className="rounded-2xl border border-white/10 bg-navy-800/50 p-4 text-center hover:border-orange-400/40">
            <CalendarCheck size={18} className="mx-auto text-teal-400" />
            <p className="mt-2 text-lg font-bold text-white">{loadingStats ? '—' : upcomingCount}</p>
            <p className="text-[11px] text-white/40">Bookings</p>
          </Link>
          <Link to="/messages" className="rounded-2xl border border-white/10 bg-navy-800/50 p-4 text-center hover:border-orange-400/40">
            <MessageSquare size={18} className="mx-auto text-sky-400" />
            <p className="mt-2 text-lg font-bold text-white">{loadingStats ? '—' : unreadMessages}</p>
            <p className="text-[11px] text-white/40">Unread</p>
          </Link>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        {saved && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> Profile saved.
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
          <div className="flex items-center gap-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-white/15 bg-navy-800/60 text-white/40 hover:border-orange-400/50"
            >
              {uploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Camera size={18} />
              )}
            </button>
            <div>
              <p className="text-sm font-semibold text-white">Profile photo</p>
              <p className="text-xs text-white/50">Tap to change</p>
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-white/80">Full Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-white/80">Phone Number</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91"
              className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-white/80">Email</span>
            <input disabled value={user?.email || ''} className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-navy-800/40 px-4 py-3 text-white/50" />
          </label>

          <Button type="submit" disabled={saving} className="w-full justify-center">
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
          </Button>
        </form>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link to="/explore" className="flex items-center justify-between rounded-2xl border border-white/10 bg-navy-800/50 p-4 hover:border-orange-400/40">
            <span className="flex items-center gap-2 text-sm font-semibold text-white"><Heart size={16} className="text-pink-400" /> Discover Creators</span>
            <ArrowRight size={15} className="text-white/40" />
          </Link>
          <Link to="/settings" className="flex items-center justify-between rounded-2xl border border-white/10 bg-navy-800/50 p-4 hover:border-orange-400/40">
            <span className="text-sm font-semibold text-white">Account Settings</span>
            <ArrowRight size={15} className="text-white/40" />
          </Link>
        </div>
      </Container>
    </div>
  );
}
