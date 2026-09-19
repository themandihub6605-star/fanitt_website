import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Percent } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { referralApi, type ReferralConfig } from '@/services/referralApi';
import { getApiErrorMessage } from '@/services/apiClient';

const FIELDS: { key: keyof ReferralConfig; label: string; description: string }[] = [
  { key: 'agentToAgentPercent', label: 'Agent → Agent', description: 'When an Agency refers another Agency' },
  { key: 'agentToBrandOrCreatorPercent', label: 'Agent → Brand/Creator', description: 'When an Agency refers a Brand or Creator' },
  { key: 'creatorToCreatorPercent', label: 'Creator → Creator', description: 'When a Creator refers another Creator' },
  { key: 'creatorToBrandPercent', label: 'Creator → Brand', description: 'When a Creator refers a Brand' },
];

export default function AdminReferralConfig() {
  const [config, setConfig] = useState<ReferralConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    referralApi
      .getConfig()
      .then(setConfig)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof ReferralConfig, value: string) => {
    if (!config) return;
    setConfig({ ...config, [key]: value === '' ? 0 : Number(value) });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const updated = await referralApi.updateConfig(config);
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <Container className="!max-w-2xl">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Referral Commission Settings</h1>
        <p className="mt-1 text-sm text-white/60">
          Set what percentage of earnings gets paid out as referral commission for each relationship type. Applies across
          all 4 account types.
        </p>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading config...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {!loading && config && (
          <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
            {FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="block text-sm font-semibold text-white/80">{f.label}</span>
                <span className="mb-1.5 block text-xs text-white/40">{f.description}</span>
                <div className="relative max-w-[160px]">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={config[f.key]}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-2.5 pl-4 pr-9 text-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  />
                  <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
                </div>
              </label>
            ))}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                  <CheckCircle2 size={16} /> Saved
                </span>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}