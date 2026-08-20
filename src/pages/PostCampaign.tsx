import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, AlertCircle, Loader2, Plus, X, ImagePlus, Minus } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { campaignApi, type ApiCampaign, type CampaignType, type LocationType, type GenderTarget } from '@/services/campaignApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

const STEPS = ['Basics', 'Budget', 'Targeting', 'Media', 'Preview'] as const;
type Step = (typeof STEPS)[number];

const DEFAULT_DOS = [
  'Maintain high-quality visuals, good lighting and clear audio.',
  "Collab or tag the brand's official account in the content & caption.",
  'Reply to comments for at least the first 24 hours to boost engagement.',
  'Share the content for pre-approval before uploading.',
];

const DEFAULT_DONTS = [
  'Do not use offensive, political, or unrelated content in the post.',
  'Do not delete the content within 30 days of posting.',
];

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-white/80">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
      />
    </label>
  );
}

function Stepper({ label, value, onChange, min = 0, max = 999 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-navy-800/50 px-4 py-3">
      <span className="text-sm font-semibold text-white/80">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 hover:border-orange-400/50 hover:text-orange-300">
          <Minus size={13} />
        </button>
        <span className="w-6 text-center font-bold text-white">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 hover:border-orange-400/50 hover:text-orange-300">
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

function TagInput({ label, tags, onAdd, onRemove, placeholder }: { label: string; tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    const v = draft.trim();
    if (v && !tags.includes(v)) onAdd(v);
    setDraft('');
  };
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-white/80">{label}</span>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
        />
        <button type="button" onClick={submit} className="shrink-0 rounded-xl bg-orange-500/15 px-4 text-sm font-bold text-orange-300 hover:bg-orange-500/25">
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1.5 rounded-full bg-navy-700 px-3 py-1 text-xs font-semibold text-white/80">
              {t}
              <button type="button" onClick={() => onRemove(t)} className="text-white/40 hover:text-white">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckList({ label, options, selected, onToggle, customItems, onAddCustom, onRemoveCustom }: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  customItems: string[];
  onAddCustom: (v: string) => void;
  onRemoveCustom: (v: string) => void;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div className="rounded-2xl border border-white/10 bg-navy-800/50 p-4">
      <p className="text-sm font-bold text-white">{label}</p>
      <div className="mt-3 space-y-2.5">
        {options.map((opt) => (
          <label key={opt} className="flex cursor-pointer items-start gap-2.5 text-sm text-white/70">
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => onToggle(opt)} className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500" />
            {opt}
          </label>
        ))}
        {customItems.map((opt) => (
          <div key={opt} className="flex items-start justify-between gap-2 text-sm text-white/70">
            <span className="flex items-start gap-2.5">
              <input type="checkbox" checked readOnly className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500" />
              {opt}
            </span>
            <button type="button" onClick={() => onRemoveCustom(opt)} className="shrink-0 text-white/30 hover:text-red-400">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Add custom ${label.toLowerCase()}`}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-navy-800/70 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-orange-400"
        />
        <button
          type="button"
          onClick={() => {
            const v = draft.trim();
            if (v) {
              onAddCustom(v);
              setDraft('');
            }
          }}
          className="shrink-0 rounded-lg bg-white/10 px-3 text-xs font-bold text-white/70 hover:bg-white/15"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

interface LocalProduct {
  _id?: string;
  name: string;
  description: string;
  quantity: number;
  price: string;
  imageFile: File | null;
  imagePreview: string;
  imageUrl?: string;
}

export default function PostCampaign() {
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = STEPS[stepIndex];

  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<ApiCategory[]>([]);

  // step 1
  const [title, setTitle] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('paid');
  const [locationType, setLocationType] = useState<LocationType>('pan_india');
  const [locationValue, setLocationValue] = useState('');

  // step 2 — budget
  const [reelCount, setReelCount] = useState(1);
  const [postCount, setPostCount] = useState(0);
  const [storyCount, setStoryCount] = useState(1);
  const [maxInfluencers, setMaxInfluencers] = useState(1);
  const [minFollowersK, setMinFollowersK] = useState(1);
  const [costPerInfluencer, setCostPerInfluencer] = useState('');
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productDraft, setProductDraft] = useState<LocalProduct>({
    name: '',
    description: '',
    quantity: 1,
    price: '',
    imageFile: null,
    imagePreview: '',
  });

  // step 3 — targeting
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [durationLabel, setDurationLabel] = useState('');
  const [influencerCategories, setInfluencerCategories] = useState<string[]>([]);
  const [genderTarget, setGenderTarget] = useState<GenderTarget[]>([]);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(35);
  const [dosSelected, setDosSelected] = useState<string[]>(DEFAULT_DOS);
  const [dosCustom, setDosCustom] = useState<string[]>([]);
  const [dontsSelected, setDontsSelected] = useState<string[]>(DEFAULT_DONTS);
  const [dontsCustom, setDontsCustom] = useState<string[]>([]);

  // step 4
  const [campaignImageFile, setCampaignImageFile] = useState<File | null>(null);
  const [campaignImagePreview, setCampaignImagePreview] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  // step 5
  const [previewCampaign, setPreviewCampaign] = useState<ApiCampaign | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    categoryApi.list().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategory(cats[0]._id);
    });
  }, []);

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const totalBudgetPreview = Math.round((parseFloat(costPerInfluencer) || 0) * 100) * maxInfluencers;

  const handleAddProduct = async () => {
    if (!campaignId) return;
    if (!productDraft.name.trim() || !productDraft.price) {
      setError('Product name and price are required');
      return;
    }
    setError('');
    try {
      const saved = await campaignApi.addProduct(
        campaignId,
        {
          name: productDraft.name,
          description: productDraft.description,
          quantity: productDraft.quantity,
          price: Math.round(parseFloat(productDraft.price) * 100),
        },
        productDraft.imageFile
      );
      setProducts((p) => [
        ...p,
        { _id: saved._id, name: saved.name, description: saved.description, quantity: saved.quantity, price: String(saved.price / 100), imageFile: null, imagePreview: '', imageUrl: saved.imageUrl },
      ]);
      setProductDraft({ name: '', description: '', quantity: 1, price: '', imageFile: null, imagePreview: '' });
      setShowAddProduct(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleRemoveProduct = async (product: LocalProduct) => {
    if (!campaignId || !product._id) return;
    try {
      await campaignApi.removeProduct(campaignId, product._id);
      setProducts((p) => p.filter((x) => x._id !== product._id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleStepOneNext = async () => {
    setError('');
    if (!title.trim()) {
      setError('Campaign name is required');
      return;
    }
    setLoading(true);
    try {
      if (!campaignId) {
        const draft = await campaignApi.createDraft({ title, campaignType, locationType, locationValue: locationType === 'pan_india' ? undefined : locationValue });
        setCampaignId(draft._id);
      } else {
        await campaignApi.updateDraft(campaignId, { title, campaignType, locationType, locationValue: locationType === 'pan_india' ? undefined : locationValue });
      }
      setStepIndex(1);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStepTwoNext = async () => {
    if (!campaignId) return;
    setError('');

    if (campaignType === 'paid') {
      const paise = Math.round((parseFloat(costPerInfluencer) || 0) * 100);
      if (!paise || paise <= 0) {
        setError('Please enter a valid cost per influencer');
        return;
      }
    } else if (products.length === 0) {
      setError('Add at least one barter product');
      return;
    }

    setLoading(true);
    try {
      await campaignApi.updateDraft(campaignId, {
        costPerInfluencer: campaignType === 'paid' ? Math.round((parseFloat(costPerInfluencer) || 0) * 100) : 0,
        maxInfluencers,
        minFollowers: minFollowersK * 1000,
        deliverables: { reel: reelCount, story: storyCount, post: postCount },
      });
      setStepIndex(2);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStepThreeNext = async () => {
    if (!campaignId) return;
    setError('');
    if (description.trim().length < 10) {
      setError('Description should be at least 10 characters');
      return;
    }
    setLoading(true);
    try {
      await campaignApi.updateDraft(campaignId, {
        description,
        category: category || undefined,
        durationLabel,
        influencerCategories,
        genderTarget,
        ageRange: { min: ageMin, max: ageMax },
        dos: [...dosSelected, ...dosCustom],
        donts: [...dontsSelected, ...dontsCustom],
      });
      setStepIndex(3);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStepFourNext = async () => {
    if (!campaignId) return;
    setError('');
    setLoading(true);
    try {
      if (campaignImageFile || mediaFiles.length > 0) {
        await campaignApi.uploadMedia(campaignId, { campaignImage: campaignImageFile, media: mediaFiles });
      }
      const fresh = await campaignApi.getDraft(campaignId);
      setPreviewCampaign(fresh);
      setStepIndex(4);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = () => {
    navigate('/dashboard/brand');
  };

  const handlePublish = async () => {
    if (!campaignId) return;
    setPublishing(true);
    setError('');
    try {
      await campaignApi.publish(campaignId);
      setPublished(true);
      setTimeout(() => navigate('/campaigns'), 1600);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  };

  const toggleGender = (g: GenderTarget) => {
    setGenderTarget((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  return (
    <div className="pt-28 pb-24">
      <Container className="max-w-2xl">
        <Link to="/campaigns" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-orange-400">
          <ArrowLeft size={15} /> Back to campaigns
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6 rounded-[2rem] border border-white/10 bg-navy-800/70 p-6 backdrop-blur-xl sm:p-8">
          <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-300">For Brands</span>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Create Campaign</h1>
            {!published && <span className="text-xs font-semibold text-white/40">Step {stepIndex + 1}/{STEPS.length}</span>}
          </div>

          {!published && (
            <div className="mt-4 flex items-center gap-1.5">
              {STEPS.map((s, i) => (
                <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.span className="block h-full rounded-full bg-orange-500" initial={false} animate={{ width: i <= stepIndex ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
                </span>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {published ? (
              <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-7 flex flex-col items-center gap-3 rounded-xl bg-teal-500/15 py-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-white">
                  <Check size={22} />
                </span>
                <p className="font-bold text-teal-200">Campaign published — redirecting...</p>
              </motion.div>
            ) : (
              <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-7 space-y-4">
                {step === 'Basics' && (
                  <>
                    <TextField label="Campaign Name" value={title} onChange={setTitle} placeholder="e.g. Collection launch alert" required />

                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">Influencer's Location</span>
                      <div className="space-y-2 rounded-xl border border-white/10 bg-navy-800/50 p-3">
                        {(['pan_india', 'state', 'city'] as LocationType[]).map((lt) => (
                          <label key={lt} className="flex cursor-pointer items-center gap-2.5 text-sm text-white/70">
                            <input type="radio" checked={locationType === lt} onChange={() => setLocationType(lt)} className="h-4 w-4 shrink-0 accent-orange-500" />
                            {lt === 'pan_india' ? 'Pan India' : lt === 'state' ? 'Choose a particular State' : 'Choose a particular City'}
                          </label>
                        ))}
                        {locationType !== 'pan_india' && (
                          <input
                            value={locationValue}
                            onChange={(e) => setLocationValue(e.target.value)}
                            placeholder={locationType === 'state' ? 'Enter state' : 'Enter city'}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">Campaign Type</span>
                      <div className="flex flex-wrap gap-4 rounded-xl border border-white/10 bg-navy-800/50 p-3">
                        {(['paid', 'barter'] as CampaignType[]).map((ct) => (
                          <label key={ct} className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                            <input type="radio" checked={campaignType === ct} onChange={() => setCampaignType(ct)} className="h-4 w-4 shrink-0 accent-orange-500" />
                            {ct === 'paid' ? 'Paid' : 'Barter'}
                          </label>
                        ))}
                      </div>
                    </div>

                    <Button disabled={loading} className="w-full justify-center" onClick={handleStepOneNext}>
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <>Next <ArrowRight size={16} /></>}
                    </Button>
                  </>
                )}

                {step === 'Budget' && (
                  <>
                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">Deliverables Per Influencer</span>
                      <div className="space-y-2">
                        <Stepper label="Reel" value={reelCount} onChange={setReelCount} />
                        <Stepper label="Post" value={postCount} onChange={setPostCount} />
                        <Stepper label="Story" value={storyCount} onChange={setStoryCount} />
                      </div>
                    </div>

                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">Number of Influencers Required</span>
                      <div className="rounded-xl border border-white/10 bg-navy-800/50 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <button type="button" onClick={() => setMaxInfluencers((v) => Math.max(1, v - 1))} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 hover:border-orange-400/50 hover:text-orange-300">
                            <Minus size={14} />
                          </button>
                          <span className="text-center text-sm font-semibold text-white">{maxInfluencers} Influencer{maxInfluencers === 1 ? '' : 's'}</span>
                          <button type="button" onClick={() => setMaxInfluencers((v) => Math.min(50, v + 1))} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 hover:border-orange-400/50 hover:text-orange-300">
                            <Plus size={14} />
                          </button>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={50}
                          value={maxInfluencers}
                          onChange={(e) => setMaxInfluencers(Number(e.target.value))}
                          className="mt-3 w-full accent-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">Minimum Followers Required</span>
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-800/50 p-4">
                        <input
                          type="range"
                          min={0}
                          max={1000}
                          value={minFollowersK}
                          onChange={(e) => setMinFollowersK(Number(e.target.value))}
                          className="min-w-0 flex-1 accent-orange-500"
                        />
                        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-navy-800/70 px-2.5 py-1.5">
                          <input
                            type="number"
                            min={0}
                            value={minFollowersK}
                            onChange={(e) => setMinFollowersK(Math.max(0, Number(e.target.value)))}
                            className="w-12 bg-transparent text-center text-sm text-white outline-none"
                          />
                          <span className="text-xs font-semibold text-white/50">K</span>
                        </div>
                      </div>
                    </div>

                    {campaignType === 'paid' && (
                      <div>
                        <TextField label="Cost Per Influencer (₹)" type="number" value={costPerInfluencer} onChange={setCostPerInfluencer} placeholder="e.g. 5000" required />
                        <p className="mt-1.5 text-xs text-white/40">Total Budget: {formatRupees(totalBudgetPreview)}</p>
                      </div>
                    )}

                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">
                        {campaignType === 'barter' ? 'Barter Products' : 'Add Free Products (optional)'}
                      </span>
                      <div className="space-y-3">
                        {products.map((p) => (
                          <div key={p._id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-800/50 p-3">
                            {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/30"><ImagePlus size={16} /></div>}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-white">{p.name}</p>
                              <p className="text-xs text-white/50">Qty {p.quantity} · ₹{p.price}</p>
                            </div>
                            <button type="button" onClick={() => handleRemoveProduct(p)} className="shrink-0 text-white/30 hover:text-red-400">
                              <X size={16} />
                            </button>
                          </div>
                        ))}

                        {showAddProduct ? (
                          <div className="space-y-3 rounded-xl border border-orange-400/30 bg-navy-800/60 p-4">
                            <TextField label="Product Name" value={productDraft.name} onChange={(v) => setProductDraft((d) => ({ ...d, name: v }))} placeholder="Printed T-shirt" />
                            <label className="block">
                              <span className="mb-1.5 block text-sm font-semibold text-white/80">Product Description</span>
                              <textarea
                                rows={2}
                                value={productDraft.description}
                                onChange={(e) => setProductDraft((d) => ({ ...d, description: e.target.value }))}
                                placeholder="Premium 240gsm T-shirt"
                                className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                              />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <TextField label="Quantity" type="number" value={String(productDraft.quantity)} onChange={(v) => setProductDraft((d) => ({ ...d, quantity: Math.max(1, Number(v) || 1) }))} />
                              <TextField label="Price (₹)" type="number" value={productDraft.price} onChange={(v) => setProductDraft((d) => ({ ...d, price: v }))} placeholder="700" />
                            </div>
                            <label className="block">
                              <span className="mb-1.5 block text-sm font-semibold text-white/80">Add Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setProductDraft((d) => ({ ...d, imageFile: file, imagePreview: URL.createObjectURL(file) }));
                                }}
                                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-orange-300"
                              />
                              {productDraft.imagePreview && <img src={productDraft.imagePreview} alt="" className="mt-2 h-20 w-20 rounded-lg object-cover" />}
                            </label>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 rounded-full border border-white/15 py-2.5 text-sm font-semibold text-white/70 hover:border-white/30">
                                Cancel
                              </button>
                              <button type="button" onClick={handleAddProduct} className="flex-1 rounded-full bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowAddProduct(true)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-3 text-sm font-semibold text-white/50 hover:border-orange-400/50 hover:text-orange-300"
                          >
                            <Plus size={15} /> Add Product
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={goBack} className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white/70 hover:border-white/30">
                        <ArrowLeft size={15} /> Back
                      </button>
                      <Button disabled={loading} className="flex-1 justify-center" onClick={handleStepTwoNext}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <>Next <ArrowRight size={16} /></>}
                      </Button>
                    </div>
                  </>
                )}

                {step === 'Targeting' && (
                  <>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">Category</span>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-3 text-white focus:border-orange-400">
                        {categories.map((c) => (
                          <option key={c._id} value={c._id} className="bg-[#141414]">{c.label}</option>
                        ))}
                      </select>
                    </label>

                    <TagInput label="Influencer Category" tags={influencerCategories} onAdd={(t) => setInfluencerCategories((p) => [...p, t])} onRemove={(t) => setInfluencerCategories((p) => p.filter((x) => x !== t))} placeholder="e.g. Content Creator" />

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">Campaign Description</span>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter description"
                        className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/55 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400"
                      />
                    </label>

                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">Gender</span>
                      <div className="flex flex-wrap gap-3">
                        {(['male', 'female', 'other'] as GenderTarget[]).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleGender(g)}
                            className={cn(
                              'rounded-full border px-4 py-1.5 text-xs font-semibold capitalize',
                              genderTarget.includes(g) ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-white/10 text-white/60'
                            )}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">Select Age Range</span>
                      <div className="flex items-center gap-3">
                        <input type="number" value={ageMin} onChange={(e) => setAgeMin(Number(e.target.value))} className="w-20 shrink-0 rounded-lg border border-white/10 bg-navy-800/70 px-3 py-2 text-center text-sm text-white focus:border-orange-400" />
                        <span className="shrink-0 text-white/40">to</span>
                        <input type="number" value={ageMax} onChange={(e) => setAgeMax(Number(e.target.value))} className="w-20 shrink-0 rounded-lg border border-white/10 bg-navy-800/70 px-3 py-2 text-center text-sm text-white focus:border-orange-400" />
                      </div>
                    </div>

                    <TextField label="Duration (optional)" value={durationLabel} onChange={setDurationLabel} placeholder="e.g. 2-week campaign" />

                    <CheckList label="Do's" options={DEFAULT_DOS} selected={dosSelected} onToggle={(v) => setDosSelected((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))} customItems={dosCustom} onAddCustom={(v) => setDosCustom((p) => [...p, v])} onRemoveCustom={(v) => setDosCustom((p) => p.filter((x) => x !== v))} />
                    <CheckList label="Dont's" options={DEFAULT_DONTS} selected={dontsSelected} onToggle={(v) => setDontsSelected((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]))} customItems={dontsCustom} onAddCustom={(v) => setDontsCustom((p) => [...p, v])} onRemoveCustom={(v) => setDontsCustom((p) => p.filter((x) => x !== v))} />

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={goBack} className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white/70 hover:border-white/30">
                        <ArrowLeft size={15} /> Back
                      </button>
                      <Button disabled={loading} className="flex-1 justify-center" onClick={handleStepThreeNext}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <>Next <ArrowRight size={16} /></>}
                      </Button>
                    </div>
                  </>
                )}

                {step === 'Media' && (
                  <>
                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">Add Campaign Image (Optional)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCampaignImageFile(file);
                            setCampaignImagePreview(URL.createObjectURL(file));
                          }
                        }}
                        className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-orange-300"
                      />
                      {campaignImagePreview && <img src={campaignImagePreview} alt="" className="mt-3 h-40 w-full rounded-xl object-cover" />}
                    </div>

                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">Add Sample Media (Optional)</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setMediaFiles((prev) => [...prev, ...files]);
                        }}
                        className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-xs text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-orange-300"
                      />
                      {mediaFiles.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {mediaFiles.map((f, i) => (
                            <span key={i} className="flex items-center gap-1.5 rounded-full bg-navy-700 px-3 py-1 text-xs text-white/70">
                              {f.name}
                              <button type="button" onClick={() => setMediaFiles((prev) => prev.filter((_, idx) => idx !== i))} className="text-white/40 hover:text-white">
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={goBack} className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white/70 hover:border-white/30">
                        <ArrowLeft size={15} /> Back
                      </button>
                      <Button disabled={loading} className="flex-1 justify-center" onClick={handleStepFourNext}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Preview & Publish'}
                      </Button>
                    </div>
                  </>
                )}

                {step === 'Preview' && previewCampaign && (
                  <>
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-navy-800/50">
                      {previewCampaign.campaignImageUrl && <img src={previewCampaign.campaignImageUrl} alt="" className="h-40 w-full object-cover" />}
                      <div className="p-4">
                        <p className="font-bold text-white">{previewCampaign.title}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {previewCampaign.campaignType === 'paid'
                            ? `${formatRupees(previewCampaign.budget)} for ${previewCampaign.maxInfluencers} influencer${previewCampaign.maxInfluencers === 1 ? '' : 's'}`
                            : `${previewCampaign.products.length} barter product(s)`}
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-navy-800/70 p-3 text-center">
                          <div><p className="font-bold text-white">{previewCampaign.deliverables.reel}</p><p className="text-[10px] text-white/40">Reel</p></div>
                          <div><p className="font-bold text-white">{previewCampaign.deliverables.story}</p><p className="text-[10px] text-white/40">Story</p></div>
                          <div><p className="font-bold text-white">{previewCampaign.deliverables.post}</p><p className="text-[10px] text-white/40">Post</p></div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-navy-800/50 p-4">
                      <p className="text-sm font-bold text-white">About Campaign</p>
                      <p className="mt-1 text-xs text-white/50">{previewCampaign.location}</p>
                      <p className="mt-2 text-sm text-white/70">{previewCampaign.description}</p>
                    </div>

                    {previewCampaign.products.length > 0 && (
                      <div className="rounded-2xl border border-white/10 bg-navy-800/50 p-4">
                        <p className="text-sm font-bold text-white">{previewCampaign.campaignType === 'barter' ? 'Barter Products' : 'Free Products'}</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {previewCampaign.products.map((p) => (
                            <div key={p._id} className="w-20 text-center">
                              {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 text-white/30"><ImagePlus size={16} /></div>}
                              <p className="mt-1 truncate text-[10px] text-white/60">{p.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-white/10 bg-navy-800/50 p-4">
                      <p className="text-sm font-bold text-white">Influencer Requirement</p>
                      <div className="mt-2 flex flex-wrap gap-6 text-center">
                        {previewCampaign.minFollowers ? (
                          <div><p className="font-bold text-white">{previewCampaign.minFollowers.toLocaleString('en-IN')}+</p><p className="text-[10px] text-white/40">Followers</p></div>
                        ) : null}
                        <div><p className="font-bold text-white">{previewCampaign.ageRange.min} - {previewCampaign.ageRange.max}</p><p className="text-[10px] text-white/40">Age</p></div>
                        <div><p className="font-bold text-white">{previewCampaign.genderTarget.map((g) => g[0].toUpperCase()).join('/') || 'Any'}</p><p className="text-[10px] text-white/40">Gender</p></div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                      <button type="button" onClick={handleSaveAsDraft} className="flex-1 rounded-2xl border border-white/15 py-3 text-sm font-semibold text-white/70 hover:border-white/30">
                        Save As Draft
                      </button>
                      <button type="button" onClick={goBack} className="flex-1 rounded-2xl border border-white/15 py-3 text-sm font-semibold text-white/70 hover:border-white/30">
                        Edit
                      </button>
                      <Button className="flex-1 justify-center rounded-2xl" disabled={publishing} onClick={handlePublish}>
                        {publishing ? <Loader2 size={18} className="animate-spin" /> : 'Publish'}
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Container>
    </div>
  );
}