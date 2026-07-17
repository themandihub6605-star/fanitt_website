import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, Building2, User, MapPin, FileText } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { agencyApi, type ApiAgency } from '@/services/agencyApi';
import { getApiErrorMessage } from '@/services/apiClient';

export default function EditAgencyProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<ApiAgency['verificationStatus']>('unverified');

  const [agencyName, setAgencyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  useEffect(() => {
    agencyApi
      .getMyProfile()
      .then((a) => {
        setAgencyName(a.agencyName || '');
        setOwnerName(a.ownerName || '');
        setMobile(a.mobile || '');
        setCity(a.city || '');
        setState(a.state || '');
        setGstNumber(a.gstNumber || '');
        setStatus(a.verificationStatus);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await agencyApi.updateMyProfile({
        agencyName,
        ownerName,
        mobile,
        city,
        state,
        gstNumber,
        submitForApproval: true,
      });
      setSaved(true);
      setStatus((s) => (s === 'unverified' ? 'pending' : s));
      setTimeout(() => navigate('/dashboard/agency'), 1200);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading your agency profile...</p>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-16">
      <Container className="!max-w-2xl">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          {status === 'unverified' ? 'Register Your Agency' : 'Edit Agency Profile'}
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {status === 'rejected'
            ? 'Update your details and resubmit for review.'
            : 'Saving submits (or resubmits) your details for admin approval.'}
        </p>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        {saved && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> Submitted — redirecting to your dashboard.
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-white/80">Agency name</span>
            <div className="relative">
              <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white focus:border-orange-400"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-white/80">Owner name</span>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white focus:border-orange-400"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-white/80">Mobile number</span>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+91"
              className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">City</span>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white focus:border-orange-400"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">State</span>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white focus:border-orange-400"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-white/80">GST number (optional)</span>
            <div className="relative">
              <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white focus:border-orange-400"
              />
            </div>
          </label>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1 justify-center">
              {saving ? <Loader2 size={18} className="animate-spin" /> : status === 'unverified' ? 'Submit for Approval' : 'Save & Resubmit'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/agency')}>
              Cancel
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}
