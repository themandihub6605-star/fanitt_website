import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  Clock,
  MapPin,
  Users2,
  ShieldCheck,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Instagram,
  ImagePlus,
  Calendar,
  Maximize2,
  X,
  ChevronDown,
  Link2,
  Timer,
  Building2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { campaignApi, type ApiCampaign } from '@/services/campaignApi';
import { subscriptionApi, type ApiUserSubscription } from '@/services/subscriptionApi';
import { getApiErrorMessage, getApiErrorCode } from '@/services/apiClient';
import { openRazorpayCheckout } from '@/utils/razorpay';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm)$/i.test(url);
}

function ExpandableImage({
  src,
  alt = '',
  className,
  onExpand,
  isVideo = false,
  roundedClassName = 'rounded-xl',
}: {
  src: string;
  alt?: string;
  className: string;
  onExpand: (url: string) => void;
  isVideo?: boolean;
  roundedClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onExpand(src)}
      className={cn('group relative block w-full overflow-hidden', roundedClassName)}
    >
      {isVideo ? (
        <video src={src} className={className} muted />
      ) : (
        <img src={src} alt={alt} className={className} />
      )}
      <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-80 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <Maximize2 size={13} />
      </span>
    </button>
  );
}

const DESCRIPTION_TRUNCATE_LENGTH = 220;

function ApplyModal({
  open,
  onClose,
  campaign,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  campaign: ApiCampaign;
  onSubmitted: () => void;
}) {
  const [quotedAmount, setQuotedAmount] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['']);
  const [deliveryTimeline, setDeliveryTimeline] = useState('');
  const [pitch, setPitch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [mySubscription, setMySubscription] = useState<ApiUserSubscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  const MAX_LINKS = 3;

  // Load the creator's current plan + usage whenever the modal opens, so
  // "X of Y proposals left" reflects the real count instead of going
  // stale between opens.
  useEffect(() => {
    if (!open) return;
    setSubLoading(true);
    subscriptionApi
      .getMySubscription()
      .then(setMySubscription)
      .catch(() => setMySubscription(null))
      .finally(() => setSubLoading(false));
  }, [open]);

  const updateLink = (index: number, value: string) => {
    setPortfolioLinks((links) => links.map((l, i) => (i === index ? value : l)));
  };

  const addLinkField = () => {
    if (portfolioLinks.length < MAX_LINKS) setPortfolioLinks((links) => [...links, '']);
  };

  const removeLinkField = (index: number) => {
    setPortfolioLinks((links) => links.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    setQuotaExceeded(false);
    try {
      const parsedQuote = quotedAmount.trim() ? Math.round(parseFloat(quotedAmount) * 100) : NaN;
      await campaignApi.apply(campaign._id, {
        pitch: pitch || undefined,
        quotedAmount: Number.isFinite(parsedQuote) ? parsedQuote : undefined,
        portfolioLinks: portfolioLinks.map((l) => l.trim()).filter(Boolean),
        deliveryTimeline: deliveryTimeline.trim() || undefined,
      });
      onSubmitted();
    } catch (err) {
      if (getApiErrorCode(err) === 'PROPOSAL_QUOTA_EXCEEDED') {
        setQuotaExceeded(true);
      } else {
        setError(getApiErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const limit = mySubscription?.plan.proposalLimit ?? null;
  const used = mySubscription?.proposalsUsedThisCycle ?? 0;
  const remaining = limit == null ? null : Math.max(0, limit - used);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-navy-900 p-6 sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Apply to this opportunity</h2>
              <button onClick={onClose} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="mt-1 truncate text-sm text-white/50">{campaign.title}</p>

            {!subLoading && limit != null && !quotaExceeded && (
              <p className="mt-2 text-xs font-semibold text-white/50">
                {remaining} of {limit} proposal{limit === 1 ? '' : 's'} left this cycle
              </p>
            )}

            {quotaExceeded && (
              <div className="mt-4 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-orange-300">
                  <Sparkles size={14} /> You're out of proposals for this cycle
                </p>
                <p className="mt-1.5 text-sm text-white/60">
                  Upgrade your plan to send more proposals — or wait for your usage to reset next cycle.
                </p>
                <Link
                  to="/pricing"
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
                >
                  View plans
                </Link>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}

            {!quotaExceeded && (
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">
                    Your quote (₹, optional — leave blank to accept posted budget)
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    placeholder={campaign.budget ? `e.g. ${campaign.budget / 100}` : undefined}
                    className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                  />
                </label>

                <div>
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/70">
                    <Link2 size={12} /> Portfolio link(s) (optional, up to {MAX_LINKS})
                  </span>
                  <div className="space-y-2">
                    {portfolioLinks.map((link, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={link}
                          onChange={(e) => updateLink(i, e.target.value)}
                          placeholder="https://instagram.com/reel/..."
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                        />
                        {portfolioLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLinkField(i)}
                            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:border-red-400/50 hover:text-red-400"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {portfolioLinks.length < MAX_LINKS && (
                    <button
                      type="button"
                      onClick={addLinkField}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:underline"
                    >
                      <Plus size={13} /> Add another link
                    </button>
                  )}
                </div>

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/70">
                    <Timer size={12} /> Delivery timeline (optional)
                  </span>
                  <input
                    type="text"
                    value={deliveryTimeline}
                    onChange={(e) => setDeliveryTimeline(e.target.value)}
                    placeholder="e.g. 3 days"
                    className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">Pitch (optional)</span>
                  <textarea
                    rows={3}
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder="Why you're a great fit for this..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                  />
                </label>

                <Button className="w-full justify-center" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Send proposal'}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<ApiCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  const [funding, setFunding] = useState(false);

  const [workUrl, setWorkUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [approving, setApproving] = useState(false);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    campaignApi
      .getById(id)
      .then(setCampaign)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const isBrandOwner = campaign && user?.role === 'brand' && campaign.brand.user._id === user._id;
  const isAssignedCreator = campaign?.assignedCreator?.user._id === user?._id;
  const canApply = user?.role === 'creator' && campaign?.status === 'open';

  const openApplyModal = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/campaigns/${id}` } });
      return;
    }
    setApplyModalOpen(true);
  };

  const handleFundEscrow = async () => {
    if (!id || !campaign) return;
    setFunding(true);
    setError('');
    try {
      const { order } = await campaignApi.initiateEscrowFunding(id);
      const paymentResponse = await openRazorpayCheckout({
        orderId: order.id,
        amount: order.amount,
        name: 'Fanitt',
        description: `Escrow for "${campaign.title}"`,
        prefillName: user?.name,
        prefillEmail: user?.email,
      });
      await campaignApi.verifyEscrowPayment(id, {
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setFunding(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!id || !workUrl.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await campaignApi.submitWork(id, workUrl.trim());
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setApproving(true);
    setError('');
    try {
      await campaignApi.approveWork(id);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="pt-32 pb-24 text-center">
        <Container>
          <AlertCircle size={28} className="mx-auto mb-3 text-red-400" />
          <p className="text-white/60">{error || 'Campaign not found.'}</p>
          <Link to="/campaigns" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400">
            <ArrowLeft size={15} /> Back to campaigns
          </Link>
        </Container>
      </div>
    );
  }

  const hasDeliverables = campaign.deliverables && (campaign.deliverables.reel || campaign.deliverables.story || campaign.deliverables.post);
  const hasProducts = campaign.products && campaign.products.length > 0;
  const hasSampleMedia = campaign.sampleMedia && campaign.sampleMedia.length > 0;
  const descriptionIsLong = campaign.description.length > DESCRIPTION_TRUNCATE_LENGTH;

  return (
    <div className="pt-24 pb-24 sm:pt-28">
      <Container className="max-w-3xl">
        <Link to="/campaigns" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-orange-400">
          <ArrowLeft size={15} /> Back to campaigns
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-4 space-y-4"
        >
          {/* Hero card — image + brand/price/applied count side-by-side, purple accent card, matching reference layout */}
          <div className="rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 via-navy-800/60 to-navy-800/60 p-4 sm:p-5">
            <div className="flex gap-4">
              {campaign.campaignImageUrl ? (
                <div className="relative w-28 shrink-0 sm:w-36">
                  <ExpandableImage
                    src={campaign.campaignImageUrl}
                    className="aspect-square w-full rounded-2xl object-cover"
                    onExpand={setLightboxUrl}
                    roundedClassName="rounded-2xl"
                  />
                  {campaign.campaignType && (
                    <span
                      className={cn(
                        'absolute inset-x-1.5 bottom-1.5 rounded-full py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white',
                        campaign.campaignType === 'paid' ? 'bg-emerald-500' : 'bg-purple-500'
                      )}
                    >
                      {campaign.campaignType === 'paid' ? 'Paid' : 'Barter'}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex aspect-square w-28 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/30 sm:w-36">
                  <ImagePlus size={22} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h1 className="line-clamp-2 text-lg font-bold leading-tight text-white sm:text-xl">{campaign.title}</h1>

                {campaign.brand.slug ? (
                  <Link
                    to={`/brand/${campaign.brand.slug}`}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-purple-300 hover:opacity-80"
                  >
                    By {campaign.brand.companyName} <ExternalLink size={11} className="shrink-0" />
                  </Link>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-white/70">By {campaign.brand.companyName}</p>
                )}

                <div className="mt-2.5 flex items-center gap-1.5 text-lg font-bold text-white">
                  <Briefcase size={16} className="text-emerald-400" />
                  {campaign.campaignType === 'paid'
                    ? formatRupees(campaign.budget)
                    : `${campaign.products.length} item${campaign.products.length === 1 ? '' : 's'}`}
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 w-fit">
                  <Instagram size={13} /> Creators Applied · {campaign.applicantCount}
                </div>
              </div>
            </div>

            {/* Deliverables row — purple divided bar, matching reference */}
            {hasDeliverables && (
              <div className="mt-4 grid grid-cols-3 divide-x divide-purple-300/20 rounded-2xl bg-purple-500/15 py-3.5 text-center">
                <div>
                  <p className="text-lg font-bold text-white">{campaign.deliverables.reel}</p>
                  <p className="text-[11px] text-purple-200/70">Reel</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{campaign.deliverables.story}</p>
                  <p className="text-[11px] text-purple-200/70">Story</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{campaign.deliverables.post}</p>
                  <p className="text-[11px] text-purple-200/70">Post</p>
                </div>
              </div>
            )}
          </div>

          {/* Category tag, if any */}
          {campaign.category && (
            <div className="px-1">
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white/70">
                {campaign.category.label}
              </span>
            </div>
          )}

          {/* About Campaign — light accent card with left bar, matching reference */}
          <div className="rounded-2xl border-l-4 border-purple-400 bg-navy-800/60 p-5">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-white">About Campaign</p>
            {campaign.location && (
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-white/60">
                <MapPin size={12} className="text-orange-400" /> {campaign.location}
              </p>
            )}
            <p className={cn('leading-relaxed text-white/70', !descExpanded && descriptionIsLong && 'line-clamp-4')}>
              {campaign.description}
            </p>
            {descriptionIsLong && (
              <button
                onClick={() => setDescExpanded((v) => !v)}
                className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-orange-400 hover:underline"
              >
                {descExpanded ? 'See less' : 'Read more'}
                <ChevronDown size={14} className={cn('transition-transform', descExpanded && 'rotate-180')} />
              </button>
            )}
          </div>

          {/* Duration — kept as its own small stat row so nothing from the original page is lost */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-navy-800/45 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-400">
                <Clock size={16} />
              </span>
              <div>
                <p className="text-sm font-bold text-white">{campaign.durationLabel || 'Flexible'}</p>
                <p className="text-[11px] text-white/50">Duration</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-navy-800/45 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400">
                <MapPin size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{campaign.location}</p>
                <p className="text-[11px] text-white/50">Location</p>
              </div>
            </div>
          </div>

          {/* Creator Requirement — light accent card, matching reference */}
          {(campaign.minFollowers || campaign.ageRange || campaign.genderTarget?.length > 0) && (
            <div className="rounded-2xl border-l-4 border-purple-400 bg-navy-800/60 p-5">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-white">
                <Users2 size={14} className="text-white/50" /> Creator Requirement
              </p>
              <div className="flex flex-wrap justify-around gap-6 divide-x divide-white/10 text-center">
                {campaign.minFollowers ? (
                  <div className="flex-1 min-w-[80px]">
                    <p className="font-bold text-white">{campaign.minFollowers.toLocaleString('en-IN')}+</p>
                    <p className="text-[10px] text-white/40">Followers</p>
                  </div>
                ) : null}
                <div className="flex-1 min-w-[80px]">
                  <p className="font-bold text-white">{campaign.ageRange.min} - {campaign.ageRange.max}</p>
                  <p className="text-[10px] text-white/40">Age</p>
                </div>
                {campaign.genderTarget?.length > 0 && (
                  <div className="flex-1 min-w-[80px]">
                    <p className="font-bold text-white">{campaign.genderTarget.map((g) => g[0].toUpperCase()).join('/')}</p>
                    <p className="text-[10px] text-white/40">Gender</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Everything below stays inside the same rounded card shell as before */}
          <div className="space-y-6 rounded-3xl border border-white/10 bg-navy-800/70 p-5 text-left backdrop-blur-xl sm:p-6">
            {/* Influencer categories */}
            {campaign.influencerCategories?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {campaign.influencerCategories.map((c) => (
                  <span key={c} className="rounded-full bg-navy-700 px-3 py-1 text-xs font-semibold text-white/70">
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Dos & Don'ts */}
            {(campaign.dos?.length > 0 || campaign.donts?.length > 0) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {campaign.dos?.length > 0 && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-300">Do's</p>
                    <ul className="space-y-1.5 text-xs text-white/60">
                      {campaign.dos.map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {campaign.donts?.length > 0 && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-300">Dont's</p>
                    <ul className="space-y-1.5 text-xs text-white/60">
                      {campaign.donts.map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Products */}
            {hasProducts && (
              <div>
                <p className="mb-3 text-sm font-bold text-white">{campaign.campaignType === 'barter' ? 'Barter Products' : 'Free Products'}</p>
                <div className="flex flex-wrap gap-3">
                  {campaign.products.map((p) => (
                    <div key={p._id} className="w-24 rounded-2xl border border-white/10 bg-navy-800/45 p-2 text-center">
                      {p.imageUrl ? (
                        <ExpandableImage src={p.imageUrl} className="h-16 w-full rounded-xl object-cover" onExpand={setLightboxUrl} roundedClassName="rounded-xl" />
                      ) : (
                        <div className="flex h-16 w-full items-center justify-center rounded-xl bg-white/10 text-white/30">
                          <ImagePlus size={16} />
                        </div>
                      )}
                      <p className="mt-1.5 truncate text-[10px] font-semibold text-white/70">{p.name}</p>
                      <p className="text-[10px] text-white/40">Qty {p.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample media */}
            {hasSampleMedia && (
              <div>
                <p className="mb-3 text-sm font-bold text-white">Sample Media</p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {campaign.sampleMedia.map((url, i) => (
                    <div key={i} className="h-24 w-24 shrink-0">
                      <ExpandableImage
                        src={url}
                        className="h-24 w-24 rounded-xl object-cover"
                        onExpand={setLightboxUrl}
                        isVideo={isVideoUrl(url)}
                        roundedClassName="rounded-xl"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Escrow note */}
            {campaign.campaignType === 'paid' && (
              <div className="flex items-start gap-3 rounded-2xl border border-teal-500/20 bg-teal-500/10 p-4">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-teal-400" />
                <p className="text-sm text-teal-200">
                  This budget is held in Fanitt escrow the moment a creator is accepted and funded, and released the moment
                  their work is approved.
                </p>
              </div>
            )}

            {/* Created date */}
            <p className="flex items-center gap-1.5 text-xs text-white/40">
              <Calendar size={12} /> Campaign created on {formatDate(campaign.createdAt)}
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}

            {/* Apply */}
            {!applied && canApply && (
              <div className="border-t border-white/10 pt-5">
                <Button className="w-full justify-center" onClick={openApplyModal}>
                  Apply to this opportunity
                </Button>
              </div>
            )}

            {applied && (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-teal-500/15 py-3.5 text-sm font-bold text-teal-300">
                <Check size={16} /> Proposal sent — track it under "My Proposals".
              </div>
            )}

            {/* Brand owner actions */}
            {isBrandOwner && (
              <div className="space-y-3 border-t border-white/10 pt-5">
                {campaign.status === 'open' && (
                  <Link to={`/campaigns/${id}/applications`}>
                    <Button className="w-full justify-center" variant="outline">
                      View {campaign.applicantCount} applicant{campaign.applicantCount === 1 ? '' : 's'}
                    </Button>
                  </Link>
                )}

                {campaign.status === 'open' && campaign.assignedCreator && (
                  <Button className="w-full justify-center" disabled={funding} onClick={handleFundEscrow}>
                    {funding ? <Loader2 size={18} className="animate-spin" /> : `Fund escrow — ${formatRupees(campaign.budget)}`}
                  </Button>
                )}

                {campaign.status === 'submitted' && (
                  <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                    <p className="text-sm font-bold text-yellow-200">Work submitted for review</p>
                    {campaign.submittedWorkUrl && (
                      <a
                        href={campaign.submittedWorkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-300 hover:underline"
                      >
                        View submission <ExternalLink size={13} />
                      </a>
                    )}
                    <Button className="mt-4 w-full justify-center" disabled={approving} onClick={handleApprove}>
                      {approving ? <Loader2 size={18} className="animate-spin" /> : 'Approve & release payment'}
                    </Button>
                  </div>
                )}

                {campaign.status === 'completed' && (
                  <div className="flex items-center justify-center gap-2 rounded-2xl bg-teal-500/15 py-3.5 text-sm font-bold text-teal-300">
                    <Check size={16} /> Completed — payment released to the creator.
                  </div>
                )}
              </div>
            )}

            {/* Assigned creator actions */}
            {isAssignedCreator && campaign.status === 'in_progress' && (
              <div className="space-y-3 border-t border-white/10 pt-5">
                <h3 className="text-sm font-bold text-white">Submit your work</h3>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">Link to your deliverable (Drive, Dropbox, etc.)</span>
                  <input
                    type="text"
                    value={workUrl}
                    onChange={(e) => setWorkUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                  />
                </label>
                <Button className="w-full justify-center" disabled={submitting || !workUrl.trim()} onClick={handleSubmitWork}>
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit work'}
                </Button>
              </div>
            )}

            {isAssignedCreator && campaign.status === 'submitted' && (
              <div className="rounded-2xl bg-yellow-400/10 py-3.5 text-center text-sm font-bold text-yellow-200">
                Waiting for the brand to review your submission.
              </div>
            )}

            {isAssignedCreator && campaign.status === 'completed' && (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-teal-500/15 py-3.5 text-sm font-bold text-teal-300">
                <Check size={16} /> Paid — this campaign is complete.
              </div>
            )}
          </div>
        </motion.div>
      </Container>

      {campaign && (
        <ApplyModal
          open={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          campaign={campaign}
          onSubmitted={() => {
            setApplyModalOpen(false);
            setApplied(true);
          }}
        />
      )}

      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            {isVideoUrl(lightboxUrl!) ? (
              <video
                src={lightboxUrl!}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                src={lightboxUrl!}
                alt=""
                className="max-h-[85vh] max-w-full rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}