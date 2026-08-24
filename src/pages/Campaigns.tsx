import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Users2, Plus, Loader2, AlertCircle, Instagram, Search, SlidersHorizontal, X, Building2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { campaignApi, type ApiCampaign, type CampaignType, type GenderTarget, type LocationType } from '@/services/campaignApi';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

const FILTER_SECTIONS = ['Category', 'Campaign Type', 'Deliverables', 'Amount', 'Location', 'Followers Count', 'Gender'] as const;
type FilterSection = (typeof FILTER_SECTIONS)[number];

interface FilterState {
  categories: string[];
  campaignTypes: CampaignType[];
  deliverables: ('reel' | 'story' | 'post')[];
  minBudget: string;
  maxBudget: string;
  locationTypes: LocationType[];
  minFollowers: string;
  maxFollowers: string;
  genders: GenderTarget[];
}

const EMPTY_FILTERS: FilterState = {
  categories: [],
  campaignTypes: [],
  deliverables: [],
  minBudget: '',
  maxBudget: '',
  locationTypes: [],
  minFollowers: '',
  maxFollowers: '',
  genders: [],
};

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function FilterModal({
  open,
  onClose,
  categories,
  draft,
  setDraft,
  onApply,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  categories: ApiCategory[];
  draft: FilterState;
  setDraft: React.Dispatch<React.SetStateAction<FilterState>>;
  onApply: () => void;
  onClear: () => void;
}) {
  const [activeSection, setActiveSection] = useState<FilterSection>('Category');

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
            className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-navy-900 sm:max-w-lg sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-bold text-orange-400">Filter</h2>
              <button onClick={onClose} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-32 shrink-0 overflow-y-auto border-r border-white/10 py-2 sm:w-40">
                {FILTER_SECTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSection(s)}
                    className={cn(
                      'block w-full border-l-2 px-4 py-3 text-left text-xs font-semibold sm:text-sm',
                      activeSection === s ? 'border-orange-500 bg-white/5 text-orange-300' : 'border-transparent text-white/60 hover:text-white/80'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-white/40">Filter by</p>

                {activeSection === 'Category' && (
                  <div className="space-y-3">
                    {categories.map((c) => (
                      <label key={c._id} className="flex cursor-pointer items-center gap-2.5 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={draft.categories.includes(c._id)}
                          onChange={() => setDraft((d) => ({ ...d, categories: toggleInArray(d.categories, c._id) }))}
                          className="h-4 w-4 accent-orange-500"
                        />
                        {c.label}
                      </label>
                    ))}
                    {categories.length === 0 && <p className="text-sm text-white/40">No categories yet.</p>}
                  </div>
                )}

                {activeSection === 'Campaign Type' && (
                  <div className="space-y-3">
                    {(['paid', 'barter'] as CampaignType[]).map((t) => (
                      <label key={t} className="flex cursor-pointer items-center gap-2.5 text-sm capitalize text-white/80">
                        <input
                          type="checkbox"
                          checked={draft.campaignTypes.includes(t)}
                          onChange={() => setDraft((d) => ({ ...d, campaignTypes: toggleInArray(d.campaignTypes, t) }))}
                          className="h-4 w-4 accent-orange-500"
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                )}

                {activeSection === 'Deliverables' && (
                  <div className="space-y-3">
                    {(['reel', 'story', 'post'] as const).map((d) => (
                      <label key={d} className="flex cursor-pointer items-center gap-2.5 text-sm capitalize text-white/80">
                        <input
                          type="checkbox"
                          checked={draft.deliverables.includes(d)}
                          onChange={() => setDraft((s) => ({ ...s, deliverables: toggleInArray(s.deliverables, d) }))}
                          className="h-4 w-4 accent-orange-500"
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                )}

                {activeSection === 'Amount' && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs text-white/50">Min (₹)</span>
                      <input
                        type="number"
                        value={draft.minBudget}
                        onChange={(e) => setDraft((d) => ({ ...d, minBudget: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white focus:border-orange-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-white/50">Max (₹)</span>
                      <input
                        type="number"
                        value={draft.maxBudget}
                        onChange={(e) => setDraft((d) => ({ ...d, maxBudget: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white focus:border-orange-400"
                      />
                    </label>
                  </div>
                )}

                {activeSection === 'Location' && (
                  <div className="space-y-3">
                    {(['pan_india', 'state', 'city'] as LocationType[]).map((lt) => (
                      <label key={lt} className="flex cursor-pointer items-center gap-2.5 text-sm text-white/80">
                        <input
                          type="checkbox"
                          checked={draft.locationTypes.includes(lt)}
                          onChange={() => setDraft((d) => ({ ...d, locationTypes: toggleInArray(d.locationTypes, lt) }))}
                          className="h-4 w-4 accent-orange-500"
                        />
                        {lt === 'pan_india' ? 'Pan India' : lt === 'state' ? 'State-specific' : 'City-specific'}
                      </label>
                    ))}
                  </div>
                )}

                {activeSection === 'Followers Count' && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs text-white/50">Min followers</span>
                      <input
                        type="number"
                        value={draft.minFollowers}
                        onChange={(e) => setDraft((d) => ({ ...d, minFollowers: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white focus:border-orange-400"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-white/50">Max followers</span>
                      <input
                        type="number"
                        value={draft.maxFollowers}
                        onChange={(e) => setDraft((d) => ({ ...d, maxFollowers: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white focus:border-orange-400"
                      />
                    </label>
                  </div>
                )}

                {activeSection === 'Gender' && (
                  <div className="space-y-3">
                    {(['male', 'female', 'other'] as GenderTarget[]).map((g) => (
                      <label key={g} className="flex cursor-pointer items-center gap-2.5 text-sm capitalize text-white/80">
                        <input
                          type="checkbox"
                          checked={draft.genders.includes(g)}
                          onChange={() => setDraft((d) => ({ ...d, genders: toggleInArray(d.genders, g) }))}
                          className="h-4 w-4 accent-orange-500"
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t border-white/10 p-5">
              <button
                type="button"
                onClick={onClear}
                className="flex-1 rounded-full border border-orange-400/40 py-3 text-sm font-semibold text-orange-300 hover:bg-orange-500/10"
              >
                Clear Filter
              </button>
              <button
                type="button"
                onClick={onApply}
                className="flex-1 rounded-full bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isBrand = useAppSelector((s) => s.auth.user?.role === 'brand');

  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(EMPTY_FILTERS);

  const activeFilterCount =
    appliedFilters.categories.length +
    appliedFilters.campaignTypes.length +
    appliedFilters.deliverables.length +
    appliedFilters.locationTypes.length +
    appliedFilters.genders.length +
    (appliedFilters.minBudget ? 1 : 0) +
    (appliedFilters.maxBudget ? 1 : 0) +
    (appliedFilters.minFollowers ? 1 : 0) +
    (appliedFilters.maxFollowers ? 1 : 0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [campaignData, categoryData] = await Promise.all([
          campaignApi.list({
            category: appliedFilters.categories.join(',') || undefined,
            campaignType: appliedFilters.campaignTypes.join(',') || undefined,
            deliverables: appliedFilters.deliverables.join(',') || undefined,
            minBudget: appliedFilters.minBudget ? Number(appliedFilters.minBudget) : undefined,
            maxBudget: appliedFilters.maxBudget ? Number(appliedFilters.maxBudget) : undefined,
            locationType: appliedFilters.locationTypes.join(',') || undefined,
            location: search || undefined,
            minFollowers: appliedFilters.minFollowers ? Number(appliedFilters.minFollowers) : undefined,
            maxFollowers: appliedFilters.maxFollowers ? Number(appliedFilters.maxFollowers) : undefined,
            gender: appliedFilters.genders.join(',') || undefined,
          }),
          categories.length === 0 ? categoryApi.list() : Promise.resolve(categories),
        ]);
        if (!cancelled) {
          setCampaigns(campaignData.campaigns);
          if (categories.length === 0) setCategories(categoryData);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timeout = setTimeout(load, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, search]);

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setFilterOpen(false);
  };

  return (
    <div className="pt-28 pb-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-300">
              Brand Requirements
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Open campaigns</h1>
            <p className="mt-2 max-w-xl text-white/60">
              You can see all campaigns here, but you can apply only if your subscription and profile match the campaign.
            </p>
          </div>
          {isBrand && (
            <Link to="/campaigns/new">
              <Button>
                <Plus size={16} /> Post a requirement
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by location, title..."
              className="w-full rounded-full border border-white/10 bg-navy-800/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>
          <button
            onClick={openFilters}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-navy-800/60 text-white/70 hover:border-orange-400/50 hover:text-orange-300"
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {activeFilterCount > 0 && (
          <button onClick={handleClearFilters} className="mt-3 text-xs font-semibold text-orange-400 hover:underline">
            Clear all filters
          </button>
        )}

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading campaigns...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/60">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">Couldn't load campaigns — {error}</p>
          </div>
        )}

     {!loading && !error && (
  <div className="mt-8 space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
    {campaigns.map((campaign, i) => {
              const hasDeliverables = campaign.deliverables && (campaign.deliverables.reel || campaign.deliverables.story || campaign.deliverables.post);
              return (
                <motion.div
                  key={campaign._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.35, delay: (i % 6) * 0.05 }}
                >
                  {/* Card is a clickable div (goes to campaign detail) — the
                      brand name inside is its own Link to the brand profile,
                      with stopPropagation so it doesn't also trigger the
                      card's navigation. */}
                  <div
                    onClick={() => navigate(`/campaigns/${campaign._id}`)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/campaigns/${campaign._id}`);
                    }}
                    className="flex cursor-pointer gap-4 rounded-2xl border border-white/10 bg-navy-800/60 p-4 backdrop-blur-xl transition-colors hover:border-orange-400/40"
                  >
                  <div className="relative w-28 shrink-0 self-stretch overflow-hidden rounded-lg bg-white/5 lg:w-32">
                      {campaign.campaignImageUrl ? (
                        <img src={campaign.campaignImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white/20">
                          <Building2 size={22} />
                        </div>
                      )}
                      <span
                        className={cn(
                          'absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold text-white',
                          campaign.campaignType === 'paid' ? 'bg-emerald-500' : 'bg-sky-500'
                        )}
                      >
                        {campaign.campaignType === 'paid' ? 'Paid' : 'Barter'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">{campaign.title}</p>
                                          <p className="mt-0.5 truncate text-xs text-orange-300">By {campaign.brand.companyName}</p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                        <Briefcase size={13} className="text-orange-400" />
                        {campaign.campaignType === 'paid' ? formatRupees(campaign.budget) : `${campaign.products.length} product(s)`}
                      </p>

                      <div className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                        <Instagram size={11} /> {campaign.applicantCount} Creators Applied
                      </div>

                      {hasDeliverables && (
                        <div className="mt-2 flex divide-x divide-white/10 overflow-hidden rounded-lg border border-white/10 text-center">
                          <div className="flex-1 py-1">
                            <p className="text-xs font-bold text-white">{campaign.deliverables.reel}</p>
                            <p className="text-[9px] text-white/40">Reel</p>
                          </div>
                          <div className="flex-1 py-1">
                            <p className="text-xs font-bold text-white">{campaign.deliverables.story}</p>
                            <p className="text-[9px] text-white/40">Story</p>
                          </div>
                          <div className="flex-1 py-1">
                            <p className="text-xs font-bold text-white">{campaign.deliverables.post}</p>
                            <p className="text-[9px] text-white/40">Post</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && !error && campaigns.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center text-white/50">
            <Users2 size={32} className="mb-3" />
            <p>No campaigns match your filters.</p>
          </div>
        )}
      </Container>

      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories}
        draft={draftFilters}
        setDraft={setDraftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </div>
  );
}