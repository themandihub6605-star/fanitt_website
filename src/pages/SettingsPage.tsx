import { useState } from 'react';
import { Lock, Loader2, AlertCircle, CheckCircle2, LogOut, Eye, EyeOff } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/services/authApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <Container className="!max-w-2xl">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-white/60">Manage your account.</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-white/40">Account</p>
          <div className="mt-3 flex items-center justify-between border-b border-white/5 py-2.5 text-sm">
            <span className="text-white/50">Name</span>
            <span className="font-semibold text-white">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 py-2.5 text-sm">
            <span className="text-white/50">Email</span>
            <span className="font-semibold text-white">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-white/50">Role</span>
            <span className="font-semibold capitalize text-white">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-white/40">Change Password</p>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0" /> Password changed successfully.
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-white/80">Current Password</span>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                required
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-11 text-white focus:border-orange-400"
              />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-white/80">New Password</span>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                required
                minLength={8}
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-11 text-white placeholder:text-white/30 focus:border-orange-400"
              />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <Button type="submit" disabled={saving} className="w-full justify-center">
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
          </Button>
        </form>

        <button
          onClick={logout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={16} /> Log Out
        </button>
      </Container>
    </div>
  );
}
