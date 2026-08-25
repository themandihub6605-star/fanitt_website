import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { subscriptionApi, type ApiSubscriptionPlan, type ApiUserSubscription } from '@/services/subscriptionApi';
import { openRazorpaySubscriptionCheckout } from '@/utils/razorpay';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function Pricing() {
  const user = useAppSelector((s) => s.auth.user);
  const isBrand = user?.role === 'brand';
  const audience: 'creator' | 'brand' = isBrand ? 'brand' : 'creator';

  const [plans, setPlans] = useState<ApiSubscriptionPlan[]>([]);
  const [mySubscription, setMySubscription] = useState<ApiUserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgradingId, setUpgradingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    const calls: Promise<unknown>[] = [subscriptionApi.listPlans(audience)];
    if (user && (user.role === 'creator' || user.role === 'brand')) {
      calls.push(subscriptionApi.getMySubscription());
    }

    Promise.all(calls)
      .then(([plansResult, subResult]) => {
        setPlans(plansResult as ApiSubscriptionPlan[]);
        if (subResult) setMySubscription(subResult as ApiUserSubscription);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience, user?.role]);

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
          <div className={cn('mt-12 grid grid-cols-1 gap-6', plans.length === 2 ? 'sm:grid-cols-2 sm:max-w-2xl sm:mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3')}>
            {plans.map((plan, i) => {
              const isCurrent = plan._id === currentPlanId;
              const isHighlighted = plan.price > 0 && !plan.isDefault && (plans.length < 3 || i === Math.floor(plans.length / 2));

              return (
                <motion.div
                  key={plan._id}
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
        )}
      </Container>
    </div>
  );
}