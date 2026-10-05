import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, ChevronDown, Clock, FileText, Loader2, Mail, Search, ShieldCheck, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { legalApi, type LegalBlock, type LegalDoc, type LegalSection } from '@/services/legalApi';

const LEGAL_EMAIL = 'support@fanitt.com';

/** Bold a leading "Defined term" or a short "Label:" prefix. */
function rich(text: string): ReactNode {
  const quoted = text.match(/^("[^"]+"(?:\s+and\s+"[^"]+")?)/);
  if (quoted) {
    return (
      <>
        <strong className="font-semibold text-white">{quoted[1]}</strong>
        {text.slice(quoted[1].length)}
      </>
    );
  }
  const colon = text.indexOf(':');
  if (colon > 0 && colon < 48 && !text.slice(0, colon).includes('.')) {
    return (
      <>
        <strong className="font-semibold text-white">{text.slice(0, colon + 1)}</strong>
        {text.slice(colon + 1)}
      </>
    );
  }
  return text;
}

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-white/70">
      {blocks.map((b, i) => {
        if (b.type === 'h') return <h3 key={i} className="pt-2 text-sm font-bold text-orange-400">{b.text}</h3>;
        if (b.type === 'li')
          return (
            <div key={i} className="flex gap-3">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
              <p>{rich(b.text)}</p>
            </div>
          );
        if (b.type === 'ol')
          return (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-400">{b.n}</span>
              <p>{rich(b.text)}</p>
            </div>
          );
        return <p key={i}>{rich(b.text)}</p>;
      })}
    </div>
  );
}

function SectionCard({ section, open, onToggle }: { section: LegalSection; open: boolean; onToggle: () => void }) {
  const annexure = section.number.toLowerCase().startsWith('annexure');
  return (
    <div id={section.id} className={`scroll-mt-28 overflow-hidden rounded-2xl border bg-white/[0.03] transition-colors ${open ? 'border-orange-500/40' : 'border-white/10'}`}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-white/[0.03] sm:px-5">
        <span
          className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-2 text-sm font-bold ${
            open ? 'bg-gradient-to-br from-orange-500 to-pink-600 text-white' : 'bg-white/10 text-white/60'
          }`}
        >
          {annexure ? section.number.replace(/annexure/i, '').trim() : section.number}
        </span>
        <span className="min-w-0 flex-1">
          {annexure && <span className="block text-[10px] font-bold uppercase tracking-widest text-orange-400">Annexure</span>}
          <span className="block font-semibold text-white">{section.title}</span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
            <div className="border-t border-white/10 px-4 pb-5 pt-4 sm:px-5">
              <Blocks blocks={section.blocks} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A legal document with search, expand-all and a contents sidebar. */
export default function LegalDocument({ slug }: { slug: 'privacy-policy' | 'terms-of-use' }) {
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDoc(null);
    setError('');
    legalApi
      .get(slug)
      .then((d) => {
        setDoc(d);
        setOpen(new Set(d.sections.length ? [d.sections[0].id] : []));
        document.title = `${d.title} · Fanitt`;
      })
      .catch(() => setError('Couldn’t load this page. Please try again.'));
  }, [slug]);

  const q = query.trim().toLowerCase();
  const sections = useMemo(() => {
    if (!doc) return [];
    if (!q) return doc.sections;
    return doc.sections.filter((s) => `${s.title} ${s.blocks.map((b) => b.text).join(' ')}`.toLowerCase().includes(q));
  }, [doc, q]);

  const words = useMemo(() => (doc ? [...doc.intro, ...doc.sections.flatMap((s) => s.blocks)].map((b) => b.text).join(' ').split(/\s+/).length : 0), [doc]);
  const allOpen = sections.length > 0 && sections.every((s) => open.has(s.id));

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const jumpTo = (id: string) => {
    setQuery('');
    setOpen((prev) => new Set(prev).add(id));
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const Icon = slug === 'terms-of-use' ? FileText : ShieldCheck;

  return (
    <div className="pb-24 pt-28">
      <Container className="max-w-6xl">
        {!doc ? (
          <div className="flex min-h-[40vh] items-center justify-center text-white/50">
            {error ? (
              <p>{error}</p>
            ) : (
              <Loader2 className="animate-spin" />
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#14141F] to-[#2A1320] p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Legal</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 text-white">
                  <Icon size={22} />
                </span>
                <h1 className="text-3xl font-bold text-white sm:text-4xl">{doc.title}</h1>
              </div>
              {doc.subtitle && <p className="mt-4 max-w-3xl text-sm text-white/50">{doc.subtitle}</p>}
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-white/80">
                {doc.updated && (
                  <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                    <CalendarDays size={13} className="text-orange-300" /> Updated {doc.updated}
                  </span>
                )}
                {doc.effective && (
                  <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                    <CheckCircle2 size={13} className="text-orange-300" /> Effective {doc.effective}
                  </span>
                )}
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                  <FileText size={13} className="text-orange-300" /> {doc.sections.length} sections
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                  <Clock size={13} className="text-orange-300" /> ~{Math.ceil(words / 200)} min read
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
              {/* Contents */}
              <aside className="hidden lg:block">
                <nav className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">Contents</p>
                  <ul className="space-y-1">
                    {doc.sections.map((s) => (
                      <li key={s.id}>
                        <button onClick={() => jumpTo(s.id)} className="flex w-full gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-white/60 hover:bg-white/5 hover:text-white">
                          <span className="w-8 shrink-0 text-white/30">{s.number.replace(/annexure/i, '').trim()}</span>
                          <span className="line-clamp-2">{s.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>

              <div>
                {/* Search + expand */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search this document"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-10 text-sm text-white outline-none placeholder:text-white/30 focus:border-orange-500/60"
                    />
                    {query && (
                      <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white" aria-label="Clear">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setOpen(allOpen ? new Set() : new Set(sections.map((s) => s.id)))}
                    className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/80 hover:border-orange-500/50 hover:text-white"
                  >
                    {allOpen ? 'Collapse all' : 'Expand all'}
                  </button>
                </div>

                {doc.intro.length > 0 && !q && (
                  <div className="mt-4 rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] p-5">
                    <Blocks blocks={doc.intro} />
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {sections.length === 0 && <p className="py-12 text-center text-sm text-white/50">Nothing matches “{query}”.</p>}
                  {sections.map((s) => (
                    <SectionCard key={s.id} section={s} open={!!q || open.has(s.id)} onToggle={() => toggle(s.id)} />
                  ))}
                </div>

                {/* Contact + other doc */}
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <a href={`mailto:${LEGAL_EMAIL}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-orange-500/40">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                      <Mail size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">Questions about this?</span>
                      <span className="block text-xs text-white/50">{LEGAL_EMAIL}</span>
                    </span>
                  </a>
                  <Link
                    to={slug === 'terms-of-use' ? '/privacy-policy' : '/terms'}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-orange-500/40"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                      {slug === 'terms-of-use' ? <ShieldCheck size={18} /> : <FileText size={18} />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{slug === 'terms-of-use' ? 'Privacy Policy' : 'Terms of Use'}</span>
                      <span className="block text-xs text-white/50">Read our other legal document</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}