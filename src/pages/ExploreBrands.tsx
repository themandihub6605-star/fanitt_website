import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Search, BadgeCheck, MapPin, Building2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { brandApi, type ApiBrand } from '@/services/brandApi';
import { getApiErrorMessage } from '@/services/apiClient';

export default function ExploreBrands() {
  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const timeout = setTimeout(() => {
      brandApi
        .list({ search: search || undefined })
        .then((d) => setBrands(d.brands))
        .catch((err) => setError(getApiErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 300); // debounce search typing
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="pt-8 pb-16">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Home &gt; Brands</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Discover <span className="brand-gradient-text">Brands</span>
        </h1>
        <p className="mt-2 max-w-xl text-white/60">Find brands running campaigns and looking to collaborate with creators.</p>

        <div className="relative mt-6 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brand name..."
            className="w-full rounded-full border border-white/10 bg-navy-800/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
          />
        </div>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading brands...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/60">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">Couldn't load brands — {error}</p>
          </div>
        )}

        {!loading && !error && brands.length === 0 && (
          <p className="mt-16 text-center text-white/50">No brands found{search ? ` matching "${search}"` : ''}.</p>
        )}

        {!loading && !error && brands.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand, i) => (
              <motion.div key={brand._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}>
                <Link
                  to={`/brand/${brand.slug}`}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-navy-800/60 p-4 transition-colors hover:border-orange-400/40"
                >
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
                      <Building2 size={22} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-bold text-white">{brand.companyName}</p>
                      {brand.isTopBrand && <BadgeCheck size={15} className="shrink-0 text-sky-400" />}
                    </div>
                    {brand.tagline && <p className="mt-0.5 truncate text-xs text-white/50">{brand.tagline}</p>}
                    {brand.location && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-white/40">
                        <MapPin size={11} /> {brand.location}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}