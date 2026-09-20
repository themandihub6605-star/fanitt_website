import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

function sortByPrefixPriority(list: string[], query: string): string[] {
  const q = query.toLowerCase();
  const starts: string[] = [];
  const contains: string[] = [];
  for (const item of list) {
    (item.toLowerCase().startsWith(q) ? starts : contains).push(item);
  }
  starts.sort((a, b) => a.localeCompare(b));
  contains.sort((a, b) => a.localeCompare(b));
  return [...starts, ...contains];
}

function dedupeCap(list: string[], cap = 10): string[] {
  return Array.from(new Set(list)).slice(0, cap);
}

// In-memory cache across the whole component's lifetime (module scope) —
// re-searching something already fetched this session (e.g. backspacing
// then retyping the same letters) returns instantly with no network call.
const cityApiCache = new Map<string, string[]>();

// Typeahead for state/city.
// - State (`mode="static"`): filters the fixed, already-exhaustive
//   36-state/UT list below — no need for an API, India only has 36 of
//   these, full stop.
// - City (`mode="api"`): India has no fixed, hardcodable list of
//   cities/towns/villages — searching a static list would always leave
//   something out. Instead this queries India Post's free, keyless
//   Pincode API (api.postalpincode.in/postoffice/<query>), which covers
//   every post office in the country — town, city, or village — so
//   nothing is missing. Debounced 300ms, cancels any in-flight request
//   when a newer keystroke arrives (AbortController) so a slow response
//   for an old query can never overwrite a newer one, and caches results
//   per query for the rest of the session so repeated searches are
//   instant. Falls back to freeform typing if the API is slow/offline —
//   the field never blocks entry either way.
export function LocationAutocomplete({
  value,
  onChange,
  mode,
  options,
  placeholder,
  icon: Icon,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  mode: 'static' | 'api';
  options?: string[];
  placeholder: string;
  // Optional — lets this render like Signup's TextField (icon + larger
  // padding) instead of PostCampaign's compact style, so the exact same
  // autosuggest logic can drop into either form without looking out of place.
  icon?: LucideIcon;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== 'api') return;
    const query = value.trim();
    if (query.length < 2) {
      setApiSuggestions([]);
      return;
    }

    const cached = cityApiCache.get(query.toLowerCase());
    if (cached) {
      setApiSuggestions(sortByPrefixPriority(cached, query));
      return; // instant — no network call, no debounce wait
    }

    const controller = new AbortController();
    setLoading(true);
    const timeout = setTimeout(() => {
      fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          const postOffices = data?.[0]?.Status === 'Success' ? data[0].PostOffice || [] : [];
          const names = dedupeCap(postOffices.map((po: { Name: string }) => po.Name), 20);
          cityApiCache.set(query.toLowerCase(), names);
          setApiSuggestions(sortByPrefixPriority(names, query).slice(0, 10));
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setApiSuggestions([]); // offline/slow — falls back to freeform typing
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort(); // cancel this request if the user keeps typing before it resolves
    };
  }, [value, mode]);

  const staticSuggestions =
    mode === 'static'
      ? value.trim().length > 0
        ? sortByPrefixPriority(
            (options || []).filter((o) => o.toLowerCase().includes(value.trim().toLowerCase())),
            value.trim()
          ).slice(0, 8)
        : (options || []).slice(0, 8)
      : [];

  const suggestions = mode === 'api' ? apiSuggestions : staticSuggestions;

  return (
    <div className="relative">
      {Icon && <Icon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)} // delay so the click on a suggestion registers before the list unmounts
        placeholder={placeholder}
        required={required}
        className={
          Icon
            ? 'w-full rounded-xl border border-white/10 bg-navy-800/70 py-3.5 pl-11 pr-4 text-white placeholder:text-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20'
            : 'mt-1 w-full rounded-lg border border-white/10 bg-navy-800/70 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400'
        }
      />
      {mode === 'api' && loading && focused && (
        <p className="mt-1 text-[11px] text-white/30">Searching...</p>
      )}
      {focused && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-navy-900 shadow-lifted">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()} // keep focus so onBlur's setTimeout still fires cleanly
              onClick={() => {
                onChange(s);
                setFocused(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-orange-500/15 hover:text-orange-300"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { sortByPrefixPriority };