import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe2, Lock, Loader2, Plus, Trash2, ImagePlus, AlertCircle, Crown } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import {
  communityApi,
  rupees,
  type ApiCommunity,
  type CommunityConfig,
  type CommunityPlanKey,
  type CommunityVisibility,
  type PostPermission,
} from '@/services/communityApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';
import { CommunityCover } from './CommunityAvatar';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pass to edit; omit to create. */
  community?: ApiCommunity | null;
  onSaved: (community: ApiCommunity) => void;
}

const PLAN_ROWS: { key: CommunityPlanKey; title: string; hint: string; suffix: string }[] = [
  { key: 'monthly', title: 'Monthly', hint: 'Members pay every month', suffix: '/month' },
  { key: 'yearly', title: 'Yearly', hint: 'Members pay once a year', suffix: '/year' },
  { key: 'lifetime', title: 'One-time', hint: 'Pay once, access forever', suffix: 'once' },
];

type PlanState = Record<CommunityPlanKey, { enabled: boolean; price: string }>;

const inputClass =
  'w-full rounded-xl border border-white/10 bg-navy-800/55 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none';

/** Create a community, or edit one (owner sees every setting, moderators
 * only description / rules / images / category). */
export function CommunityFormModal({ open, onClose, community, onSaved }: Props) {
  const isEdit = Boolean(community);
  const ownerFields = !isEdit || Boolean(community?.isOwner);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<CommunityVisibility>('public');
  const [postPermission, setPostPermission] = useState<PostPermission>('all');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [rules, setRules] = useState<string[]>([]);
  const [ruleDraft, setRuleDraft] = useState('');
  const [icon, setIcon] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Paid community
  const [config, setConfig] = useState<CommunityConfig | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [plans, setPlans] = useState<PlanState>({
    monthly: { enabled: true, price: '' },
    yearly: { enabled: false, price: '' },
    lifetime: { enabled: false, price: '' },
  });

  useEffect(() => {
    if (!open) return;
    categoryApi.list().then(setCategories).catch(() => setCategories([]));
    setName(community?.name || '');
    setDescription(community?.description || '');
    setCategory(community?.category?._id || '');
    setVisibility(community?.visibility || 'public');
    setPostPermission(community?.postPermission || 'all');
    setChatEnabled(community?.chatEnabled ?? true);
    setRules(community?.rules || []);
    setRuleDraft('');
    setIcon(null);
    setCover(null);
    setError('');
    setIsPaid(Boolean(community?.isPaid));
    const hasPlans = (community?.planOptions || []).length > 0;
    setPlans({
      monthly: { enabled: hasPlans ? Boolean(community?.plans?.monthly?.enabled) : true, price: community?.plans?.monthly?.price ? String(community.plans.monthly.price / 100) : '' },
      yearly: { enabled: Boolean(community?.plans?.yearly?.enabled), price: community?.plans?.yearly?.price ? String(community.plans.yearly.price / 100) : '' },
      lifetime: { enabled: Boolean(community?.plans?.lifetime?.enabled), price: community?.plans?.lifetime?.price ? String(community.plans.lifetime.price / 100) : '' },
    });
    communityApi.config().then(setConfig).catch(() => setConfig(null));
  }, [open, community]);

  const blocked = !isEdit && Boolean(config?.requireSubscription && !config?.hasSubscription);
  const showPaid = ownerFields && Boolean(config?.paidCommunitiesEnabled) && (Boolean(config?.canSell) || Boolean(community?.isPaid));
  const setPlan = (key: CommunityPlanKey, patch: Partial<PlanState[CommunityPlanKey]>) =>
    setPlans((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const addRule = () => {
    const value = ruleDraft.trim();
    if (!value || rules.length >= 10) return;
    setRules((prev) => [...prev, value.slice(0, 300)]);
    setRuleDraft('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerFields && name.trim().length < 3) {
      setError('Community name must be at least 3 characters');
      return;
    }
    if (showPaid && isPaid) {
      const on = PLAN_ROWS.filter((r) => plans[r.key].enabled);
      if (on.length === 0) {
        setError('Turn on at least one plan — monthly, yearly or one-time');
        return;
      }
      const min = (config?.minPrice ?? 1000) / 100;
      const max = (config?.maxPrice ?? 10000000) / 100;
      const bad = on.find((r) => {
        const n = Number(plans[r.key].price);
        return !Number.isFinite(n) || n < min || n > max;
      });
      if (bad) {
        setError(`${bad.title} price must be between ₹${min} and ₹${max.toLocaleString('en-IN')}`);
        return;
      }
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...(ownerFields ? { name: name.trim(), visibility, postPermission, chatEnabled } : {}),
        ...(showPaid
          ? {
              isPaid,
              plans: {
                monthly: { enabled: isPaid && plans.monthly.enabled, price: Math.round(Number(plans.monthly.price || 0) * 100) },
                yearly: { enabled: isPaid && plans.yearly.enabled, price: Math.round(Number(plans.yearly.price || 0) * 100) },
                lifetime: { enabled: isPaid && plans.lifetime.enabled, price: Math.round(Number(plans.lifetime.price || 0) * 100) },
              },
            }
          : {}),
        description: description.trim(),
        category,
        rules,
        icon,
        cover,
      };
      const saved = isEdit ? await communityApi.update(community!._id, payload) : await communityApi.create(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const coverPreview = cover ? URL.createObjectURL(cover) : community?.coverImageUrl;
  const iconPreview = icon ? URL.createObjectURL(icon) : community?.iconUrl;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Community settings' : 'Create a community'}>
      <form onSubmit={submit} className="space-y-5">
        {/* Cover + icon */}
        <div className="relative">
          <label className="group block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-white/15 bg-navy-800/50">
            {coverPreview ? (
              <CommunityCover url={coverPreview} className="aspect-[3/1] w-full transition-opacity group-hover:opacity-80" />
            ) : (
              <span className="flex aspect-[3/1] w-full flex-col items-center justify-center gap-1 text-xs font-semibold text-white/40">
                <span className="flex items-center gap-2">
                  <ImagePlus size={16} /> Add a cover image
                </span>
                <span className="font-normal text-white/30">Best size 1500 × 500</span>
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setCover(e.target.files?.[0] || null)} />
          </label>
          <label className="absolute -bottom-6 left-4 block h-16 w-16 cursor-pointer overflow-hidden rounded-2xl border-4 border-[#161616] bg-navy-800">
            {iconPreview ? (
              <img src={iconPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-white/40">
                <ImagePlus size={18} />
              </span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setIcon(e.target.files?.[0] || null)} />
          </label>
        </div>

        <div className="pt-4 space-y-4">
          {ownerFields && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-white/60">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Indore Food Creators" className={inputClass} />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">About</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="What is this community about and who is it for?"
              className={cn(inputClass, 'resize-none')}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {ownerFields && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/60">Who can join</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: 'public', icon: Globe2, title: 'Public', hint: 'Anyone can join and read' },
                      { value: 'private', icon: Lock, title: 'Private', hint: 'You approve every member' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibility(opt.value)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition-colors',
                        visibility === opt.value ? 'border-orange-400/60 bg-orange-500/10' : 'border-white/10 bg-navy-800/40 hover:border-white/20'
                      )}
                    >
                      <opt.icon size={16} className={visibility === opt.value ? 'text-orange-300' : 'text-white/50'} />
                      <p className="mt-1.5 text-sm font-bold text-white">{opt.title}</p>
                      <p className="text-[11px] text-white/45">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/60">Who can post</label>
                  <select value={postPermission} onChange={(e) => setPostPermission(e.target.value as PostPermission)} className={inputClass}>
                    <option value="all">All members</option>
                    <option value="moderators">Only owner & moderators</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/60">Group chat</label>
                  <button
                    type="button"
                    onClick={() => setChatEnabled((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-navy-800/55 px-3.5 py-2.5 text-sm text-white"
                  >
                    {chatEnabled ? 'On' : 'Off'}
                    <span className={cn('relative h-5 w-9 rounded-full transition-colors', chatEnabled ? 'bg-orange-500' : 'bg-white/15')}>
                      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', chatEnabled ? 'left-[18px]' : 'left-0.5')} />
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {showPaid && (
            <div className={cn('rounded-2xl p-[1.5px]', isPaid ? 'bg-gradient-to-r from-[#F4511E] to-[#EC2A78]' : 'bg-white/10')}>
              <div className="rounded-[15px] bg-[#161616] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F4511E] to-[#EC2A78]">
                    <Crown size={17} className="text-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">Paid community</p>
                    <p className="text-[11px] text-white/45">Members pay to join — money goes to your Fanitt wallet</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPaid}
                    onClick={() => setIsPaid((v) => !v)}
                    className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', isPaid ? 'bg-orange-500' : 'bg-white/15')}
                  >
                    <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all', isPaid ? 'left-[22px]' : 'left-0.5')} />
                  </button>
                </div>

                {isPaid && (
                  <div className="mt-4 space-y-3">
                    {PLAN_ROWS.map((r) => {
                      const p = plans[r.key];
                      const price = Number(p.price || 0);
                      const youGet = config?.feePercent ? price * (1 - config.feePercent / 100) : price;
                      return (
                        <div key={r.key} className="rounded-xl border border-white/10 bg-navy-800/40 p-3">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white">{r.title}</p>
                              <p className="text-[11px] text-white/45">{r.hint}</p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={p.enabled}
                              onClick={() => setPlan(r.key, { enabled: !p.enabled })}
                              className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', p.enabled ? 'bg-orange-500' : 'bg-white/15')}
                            >
                              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', p.enabled ? 'left-[18px]' : 'left-0.5')} />
                            </button>
                          </div>
                          {p.enabled && (
                            <>
                              <div className="mt-2.5 flex items-center gap-2">
                                <span className="text-sm font-bold text-white/60">₹</span>
                                <input
                                  inputMode="numeric"
                                  value={p.price}
                                  onChange={(e) => setPlan(r.key, { price: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
                                  placeholder="Price"
                                  className={inputClass}
                                />
                                <span className="shrink-0 text-xs text-white/45">{r.suffix}</span>
                              </div>
                              {price > 0 && (config?.feePercent ?? 0) > 0 && (
                                <p className="mt-1.5 text-[11px] font-semibold text-emerald-400">
                                  You get about {rupees(Math.round(youGet * 100))} after Fanitt’s {config?.feePercent}% fee
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                    <p className="text-[11px] text-white/45">
                      People who are already members keep free access. Renewals are manual — members get a reminder before their plan ends.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Rules ({rules.length}/10)</label>
            <div className="space-y-1.5">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-white/80">
                  <span className="mt-0.5 text-xs font-bold text-orange-300">{i + 1}.</span>
                  <span className="flex-1">{rule}</span>
                  <button type="button" onClick={() => setRules((prev) => prev.filter((_, idx) => idx !== i))} className="text-white/40 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {rules.length < 10 && (
              <div className="mt-2 flex gap-2">
                <input
                  value={ruleDraft}
                  onChange={(e) => setRuleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRule();
                    }
                  }}
                  placeholder="e.g. Be respectful — no spam or self-promotion"
                  className={inputClass}
                />
                <button type="button" onClick={addRule} className="shrink-0 rounded-xl bg-white/10 px-3 text-white/80 hover:bg-white/15">
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {blocked && (
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#F4511E] to-[#EC2A78] p-4">
            <Crown size={22} className="shrink-0 text-white" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">Fanitt plan needed</p>
              <p className="text-xs text-white/85">Pick a monthly or yearly plan to create communities.</p>
            </div>
            <Link to="/pricing" onClick={onClose} className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-orange-600">
              See plans
            </Link>
          </div>
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-400">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || blocked}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {isEdit ? 'Save changes' : 'Create community'}
        </button>
      </form>
    </Modal>
  );
}