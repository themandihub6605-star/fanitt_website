import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Check, X, Building2, MapPin, Phone } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { adminApi } from '@/services/adminApi';
import type { ApiAgency } from '@/services/agencyApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
] as const;

export default function AdminAgencyApprovals() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('pending');
  const [agencies, setAgencies] = useState<ApiAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    adminApi
      .listAgencies(tab)
      .then(setAgencies)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]);

  const handleDecision = async (id: string, decision: 'verified' | 'rejected') => {
    setActingOn(id);
    try {
      await adminApi.verifyAgency(id, decision);
      setAgencies((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="pt-8 pb-16">
      <Container>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Agency Approval</h1>
        <p className="mt-1 text-sm text-white/60">Review and approve agency registration requests.</p>

        <div className="mt-6 flex gap-1 rounded-2xl border border-white/10 bg-navy-800/50 p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                tab === t.key ? 'bg-orange-500/15 text-orange-300' : 'text-white/50 hover:text-white/80'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading agencies...</p>
          </div>
        )}

        {!loading && agencies.length === 0 && (
          <p className="mt-16 text-center text-white/50">No {tab} agencies right now.</p>
        )}

        {!loading && agencies.length > 0 && (
          <div className="mt-6 space-y-3">
            {agencies.map((agency) => (
              <div key={agency._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-navy-800/60 p-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
                    <Building2 size={18} />
                  </span>
                  <div>
                    <p className="font-bold text-white">{agency.agencyName}</p>
                    <p className="text-sm text-white/50">Owner: {agency.ownerName || agency.user.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40">
                      {agency.mobile && (
                        <span className="flex items-center gap-1"><Phone size={11} /> {agency.mobile}</span>
                      )}
                      {agency.city && (
                        <span className="flex items-center gap-1"><MapPin size={11} /> {agency.city}{agency.state ? `, ${agency.state}` : ''}</span>
                      )}
                      {agency.documentUrl && <span className="text-emerald-400">Document uploaded</span>}
                    </div>
                  </div>
                </div>

                {tab === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision(agency._id, 'verified')}
                      disabled={actingOn === agency._id}
                      className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {actingOn === agency._id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                    </button>
                    <button
                      onClick={() => handleDecision(agency._id, 'rejected')}
                      disabled={actingOn === agency._id}
                      className="flex items-center gap-1.5 rounded-full border border-red-500/40 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
