import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle, Sparkles, Calendar, TrendingUp } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { subscriptionApi, type ApiSubscriptionPlan, type ApiUserSubscription, type BillingCycle } from '@/services/subscriptionApi';
import { openRazorpaySubscriptionCheckout } from '@/utils/razorpay';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// "Your current plan" summary — shows what plan they're on, how much of
// their quota they've used this cycle, and when it resets. Works for
// both creators (proposal quota) and brands (campaign quota) since the
// relevant limit/usage field is picked based on which one is present.
function CurrentUsageCard({ subscription, isBrand }: { subscription: ApiUserSubscription; isBrand: boolean }) {
  const { plan } = subscription;
  const limit = isBrand ? plan.campaignPostLimit : plan.proposalLimit;
  const used = isBrand ? subscription.campaignsPostedThisCycle : subscription.proposalsUsedThisCycle;
  const unitLabel = isBrand ? 'campaign' : 'proposal';
  const remaining = limit == null ? null : Math.max(0, limit - used);
  const percentUsed = limit == null || limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto mt-8 max-w-2xl rounded-3xl border border-white/10 bg-navy-800/60 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
            <Sparkles size={16} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Your current plan</p>
            <p className="text-lg font-bold text-white">{plan.name}</p>
          </div>
        </div>
        {subscription.cancelAtPeriodEnd && (
          <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[11px] font-bold text-yellow-300">
            Cancels at period end
          </span>
        )}
      </div>

      <div className="mt-5">
        {limit == null ? (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
            <TrendingUp size={14} /> Unlimited {unitLabel}s this cycle
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white/80">
                {used} of {limit} {unitLabel}
                {limit === 1 ? '' : 's'} used
              </span>
              <span className="font-semibold text-white/50">{remaining} left</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentUsed}%` }}
                transition={{ duration: 0.5 }}
                className={cn('h-full rounded-full', percentUsed >= 100 ? 'bg-red-500' : percentUsed >= 75 ? 'bg-yellow-500' : 'bg-orange-500')}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-white/40">
        <Calendar size={12} />
        {subscription.cancelAtPeriodEnd ? 'Access ends' : 'Usage resets'} on {formatDate(subscription.currentPeriodEnd)}
      </div>
    </motion.div>
  );
}

// Monthly/Yearly segmented toggle. Only rendered when the fetched plans
// actually contain both cycles for at least one paid tier — otherwise
// there's nothing to toggle and it would just confuse people.
function BillingCycleToggle({ value, onChange }: { value: BillingCycle; onChange: (v: BillingCycle) => void }) {
  return (
    <div className="mx-auto mt-6 flex w-fit items-center gap-1 rounded-full border border-white/10 bg-navy-800/60 p-1">
      {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
        <button
          key={cycle}
          type="button"
          onClick={() => onChange(cycle)}
          className={cn(
            'rounded-full px-4 py-1.5 text-xs font-bold capitalize transition-colors',
            value === cycle ? 'bg-orange-500 text-white' : 'text-white/50 hover:text-white/80'
          )}
        >
          {cycle}
        </button>
      ))}
    </div>
  );
}

export default function Pricing() {
  const user = useAppSelector((s) => s.auth.user);
  const isBrand = user?.role === 'brand';
  const audience: 'creator' | 'brand' = isBrand ? 'brand' : 'creator';

  const [allPlans, setAllPlans] = useState<ApiSubscriptionPlan[]>([]);
  const [mySubscription, setMySubscription] = useState<ApiUserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgradingId, setUpgradingId] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  useEffect(() => {
    setLoading(true);
    setError('');
    const calls: Promise<unknown>[] = [subscriptionApi.listPlans(audience)];
    if (user && (user.role === 'creator' || user.role === 'brand')) {
      calls.push(subscriptionApi.getMySubscription());
    }

    Promise.all(calls)
      .then(([plansResult, subResult]) => {
        const plans = plansResult as ApiSubscriptionPlan[];
        setAllPlans(plans);
        if (subResult) {
          const sub = subResult as ApiUserSubscription;
          setMySubscription(sub);
          // Default the toggle to whatever cycle their current plan is on,
          // so an existing yearly subscriber doesn't land on a monthly
          // view that doesn't even show their own plan.
          setBillingCycle(sub.plan.billingCycle);
        }
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience, user?.role]);

  // Group plans by billingGroupSlug (falling back to their own slug when
  // unset, so a plan with only one cycle always shows). Within a group
  // that has both cycles, only the selected cycle's row is shown; a
  // group with just one cycle shows that row regardless of the toggle.
  const { visiblePlans, hasBothCycles } = useMemo(() => {
    const groups = new Map<string, ApiSubscriptionPlan[]>();
    for (const plan of allPlans) {
      const key = plan.billingGroupSlug || plan.slug;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(plan);
    }

    let anyGroupHasBoth = false;
    const visible: ApiSubscriptionPlan[] = [];

    for (const group of groups.values()) {
      const cycles = new Set(group.map((p) => p.billingCycle));
      if (cycles.size > 1) anyGroupHasBoth = true;

      const match = group.find((p) => p.billingCycle === billingCycle);
      visible.push(match ?? group[0]);
    }

    visible.sort((a, b) => a.sortOrder - b.sortOrder || a.price - b.price);
    return { visiblePlans: visible, hasBothCycles: anyGroupHasBoth };
  }, [allPlans, billingCycle]);

  const handleUpgrade = async (plan: ApiSubscriptionPlan) => {
    if (plan.price === 0) return; // free plan — nothing to check out
    setUpgradingId(plan._id);
    setError('');
    try {
      const { razorpaySubscriptionId } = await subscriptionApi.createCheckout(plan._id);
      const response = await openRazorpaySubscriptionCheckout({
        subscriptionId: razorpaySubscriptionId,
        name: 'Fanitt',
        description: `${plan.name} — ${plan.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} subscription`,
        prefillName: user?.name,
        prefillEmail: user?.email,
      });
      const updated = await subscriptionApi.verifyCheckout({
        razorpaySubscriptionId: response.razorpay_subscription_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        planId: plan._id,
      });
      setMySubscription(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : getApiErrorMessage(err));
    } finally {
      setUpgradingId(null);
    }
  };

  const currentPlanId = mySubscription?.plan._id;

  return (
    <div className="pt-28 pb-24">
      <Container>
        <div className="text-center">
          <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-300">
            {isBrand ? 'For Brands' : 'For Creators'}
          </span>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Plans & Pricing</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            {isBrand
              ? 'Post campaigns, reach the right creators, and grow your brand collaborations.'
              : 'Send more proposals, unlock exclusive campaigns, and keep more of what you earn.'}
          </p>

          {hasBothCycles && <BillingCycleToggle value={billingCycle} onChange={setBillingCycle} />}
        </div>

        {error && (
          <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading plans...</p>
          </div>
        ) : (
          <>
            {mySubscription && <CurrentUsageCard subscription={mySubscription} isBrand={isBrand} />}

            <div className={cn('mt-12 grid grid-cols-1 gap-6', visiblePlans.length === 2 ? 'sm:grid-cols-2 sm:max-w-2xl sm:mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3')}>
              {visiblePlans.map((plan, i) => {
                const isCurrent = plan._id === currentPlanId;
                const isHighlighted = plan.price > 0 && !plan.isDefault && (visiblePlans.length < 3 || i === Math.floor(visiblePlans.length / 2));

                return (
                  <motion.div
                    key={plan.billingGroupSlug || plan.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className={cn(
                      'relative flex flex-col rounded-3xl border p-6',
                      isHighlighted ? 'border-orange-400/50 bg-gradient-to-b from-orange-500/10 to-navy-800/60' : 'border-white/10 bg-navy-800/50'
                    )}
                  >
                    {isHighlighted && (
                      <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase text-white">
                        <Sparkles size={11} /> Popular
                      </span>
                    )}

                    <p className="text-lg font-bold text-white">{plan.name}</p>
                    {plan.description && <p className="mt-1 text-sm text-white/50">{plan.description}</p>}

                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">{plan.price === 0 ? 'Free' : formatRupees(plan.price)}</span>
                      {plan.price > 0 && (
                        <span className="text-sm text-white/50">/{plan.billingCycle === 'yearly' ? 'year' : 'month'}</span>
                      )}
                    </div>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {plan.perks.map((perk, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                          <Check size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                          {perk}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(plan)}
                      disabled={isCurrent || upgradingId === plan._id || plan.price === 0}
                      className={cn(
                        'mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition-colors disabled:cursor-default',
                        isCurrent
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : plan.price === 0
                          ? 'bg-white/10 text-white/50'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      )}
                    >
                      {upgradingId === plan._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : plan.price === 0 ? (
                        'Free Plan'
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </Container>
    </div>
  );
}