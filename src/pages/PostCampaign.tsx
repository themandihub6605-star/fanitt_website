import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { campaignApi } from '@/services/campaignApi';
import { getApiErrorMessage } from '@/services/apiClient';

export default function PostCampaign() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [posted, setPosted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    category: '',
    budget: '',
    durationLabel: '',
    location: 'Remote',
    creatorRequirement: '',
    description: '',
  });

  useEffect(() => {
    categoryApi.list().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setForm((f) => ({ ...f, category: cats[0]._id }));
    });
  }, []);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const budgetInPaise = Math.round(parseFloat(form.budget) * 100);
    if (!budgetInPaise || budgetInPaise <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    setSubmitting(true);
    try {
      await campaignApi.create({
        title: form.title,
        description: form.description,
        category: form.category,
        budget: budgetInPaise,
        durationLabel: form.durationLabel,
        location: form.location,
        creatorRequirement: form.creatorRequirement,
      });
      setPosted(true);
      setTimeout(() => navigate('/campaigns'), 1600);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-24">
      <Container className="max-w-2xl">
        <Link to="/campaigns" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-orange-400">
          <ArrowLeft size={15} /> Back to campaigns
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 rounded-[2rem] border border-white/10 bg-navy-800/70 p-8 backdrop-blur-xl"
        >
          <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-300">
            For Brands
          </span>
          <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">Post a requirement</h1>
          <p className="mt-2 text-white/60">
            Describe what you need — creators who fit will see it and apply. Brand accounts can only post requirements,
            not general content.
          </p>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!posted ? (
              <motion.form key="form" exit={{ opacity: 0 }} className="mt-7 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-white/80">Campaign title</span>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={handleChange('title')}
                    placeholder="e.g. Summer Skincare Drop — Reel Collab"
                    className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-white/80">Category</span>
                    <select
                      value={form.category}
                      onChange={handleChange('category')}
                      className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-3 text-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                    >
                      {categories.map((c) => (
                        <option key={c._id} value={c._id} className="bg-[#141414]">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-white/80">Budget (₹)</span>
                    <input
                      required
                      type="number"
                      min="1"
                      value={form.budget}
                      onChange={handleChange('budget')}
                      placeholder="e.g. 30000"
                      className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-white/80">Duration</span>
                    <input
                      type="text"
                      value={form.durationLabel}
                      onChange={handleChange('durationLabel')}
                      placeholder="e.g. 2-week campaign"
                      className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-white/80">Location</span>
                    <input
                      type="text"
                      value={form.location}
                      onChange={handleChange('location')}
                      className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-white/80">Who are you looking for?</span>
                  <input
                    type="text"
                    value={form.creatorRequirement}
                    onChange={handleChange('creatorRequirement')}
                    placeholder="e.g. Fitness creators, 20K+ followers"
                    className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-white/80">Requirement details</span>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={handleChange('description')}
                    placeholder="What do you need delivered? Any specifics on usage rights, format, tone..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/55 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  />
                </label>

                <Button type="submit" disabled={submitting} className="w-full justify-center">
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Post requirement'}
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-7 flex flex-col items-center gap-3 rounded-xl bg-teal-500/15 py-8 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 text-white">
                  <Check size={22} />
                </span>
                <p className="font-bold text-teal-200">Requirement posted — redirecting to campaigns...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Container>
    </div>
  );
}
