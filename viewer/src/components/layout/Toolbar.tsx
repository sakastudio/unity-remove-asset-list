import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Filters, SortConfig, SortField, SortDirection } from '../../types';

interface Props {
  filters: Filters;
  sort: SortConfig | null;
  unityMajorVersions: string[];
  priceRange: { min: number; max: number };
  pageSize: number;
  onUpdateFilters: (update: Partial<Filters>) => void;
  onSortChange: (sort: SortConfig | null) => void;
  onPageSizeChange: (size: number) => void;
}

const SORT_KEYS: { key: string; field: SortField; direction: SortDirection }[] = [
  { key: 'sort.nameAsc', field: 'name', direction: 'asc' },
  { key: 'sort.nameDesc', field: 'name', direction: 'desc' },
  { key: 'sort.priceAsc', field: 'price', direction: 'asc' },
  { key: 'sort.priceDesc', field: 'price', direction: 'desc' },
  { key: 'sort.ratingDesc', field: 'rating', direction: 'desc' },
  { key: 'sort.reviewsDesc', field: 'reviewCount', direction: 'desc' },
  { key: 'sort.favoritesDesc', field: 'favorites', direction: 'desc' },
  { key: 'sort.newest', field: 'releaseDate', direction: 'desc' },
  { key: 'sort.oldest', field: 'releaseDate', direction: 'asc' },
];

const PAGE_SIZE_VALUES = [50, 100, 200, 0];

const btnClass = 'border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700 cursor-pointer flex items-center gap-1';
const selectClass = 'border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700 cursor-pointer';

const chevron = (
  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onClose]);
}

/* ── Price Dropdown ── */

function PriceDropdown({
  priceType,
  priceMin,
  priceMax,
  priceRange,
  onChange,
}: {
  priceType: 'all' | 'free' | 'paid';
  priceMin: number | null;
  priceMax: number | null;
  priceRange: { min: number; max: number };
  onChange: (update: Partial<Filters>) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, useCallback(() => setOpen(false), []));

  const options: { value: 'all' | 'free' | 'paid'; label: string }[] = [
    { value: 'all', label: t('toolbar.all') },
    { value: 'free', label: t('toolbar.free') },
    { value: 'paid', label: t('toolbar.paid') },
  ];

  let label = t('toolbar.all');
  if (priceType === 'free') label = t('toolbar.free');
  if (priceType === 'paid') {
    if (priceMin !== null || priceMax !== null) {
      const minStr = priceMin !== null ? `$${priceMin}` : '';
      const maxStr = priceMax !== null ? `$${priceMax}` : '';
      label = `${t('toolbar.paid')} (${minStr}–${maxStr})`;
    } else {
      label = t('toolbar.paid');
    }
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className={`${btnClass} min-w-[80px]`}>
        <span className="truncate">{label}</span>
        {chevron}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[220px] py-1">
          {options.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name="priceType"
                checked={priceType === opt.value}
                onChange={() => onChange({
                  priceType: opt.value,
                  priceMin: opt.value === 'paid' ? priceMin : null,
                  priceMax: opt.value === 'paid' ? priceMax : null,
                })}
                className="text-blue-600"
              />
              {opt.label}
            </label>
          ))}

          {priceType === 'paid' && (
            <div className="px-3 py-2 border-t border-gray-100 mt-1">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={priceRange.min}
                  max={priceRange.max}
                  step="0.01"
                  value={priceMin ?? ''}
                  onChange={e => onChange({ priceMin: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder={`$${priceRange.min.toFixed(0)}`}
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  min={priceRange.min}
                  max={priceRange.max}
                  step="0.01"
                  value={priceMax ?? ''}
                  onChange={e => onChange({ priceMax: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder={`$${priceRange.max.toFixed(0)}`}
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Unity Version Dropdown ── */

function UnityVersionDropdown({
  versions,
  selected,
  onChange,
}: {
  versions: string[];
  selected: string[];
  onChange: (versions: string[]) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, useCallback(() => setOpen(false), []));

  const toggle = (v: string) => {
    if (selected.includes(v)) {
      onChange(selected.filter(s => s !== v));
    } else {
      onChange([...selected, v]);
    }
  };

  const label = selected.length === 0
    ? t('toolbar.all')
    : selected.length === 1
      ? selected[0]
      : t('toolbar.unitySelected', { n: selected.length });

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className={`${btnClass} min-w-[100px]`}>
        <span className="truncate">{label}</span>
        {chevron}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[160px]">
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-gray-50 border-b border-gray-100"
            >
              {t('filters.clearAll')}
            </button>
          )}
          {versions.map(v => (
            <label
              key={v}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(v)}
                onChange={() => toggle(v)}
                className="rounded text-blue-600"
              />
              {v}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Toolbar ── */

export function Toolbar({
  filters,
  sort,
  unityMajorVersions,
  priceRange,
  pageSize,
  onUpdateFilters,
  onSortChange,
  onPageSizeChange,
}: Props) {
  const { t } = useTranslation();
  const sortValue = sort ? `${sort.field}-${sort.direction}` : '';

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2 text-sm text-gray-600">
      {/* Left: Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Price */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">{t('toolbar.price')}</span>
          <PriceDropdown
            priceType={filters.priceType}
            priceMin={filters.priceMin}
            priceMax={filters.priceMax}
            priceRange={priceRange}
            onChange={onUpdateFilters}
          />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">{t('toolbar.rating')}</span>
          <select
            value={filters.minRating ?? ''}
            onChange={e => onUpdateFilters({
              minRating: e.target.value ? parseInt(e.target.value) : null,
            })}
            className={selectClass}
          >
            <option value="">{t('rating.all')}</option>
            {[1, 2, 3, 4].map(n => (
              <option key={n} value={n}>{t('rating.nStarsUp', { n })}</option>
            ))}
            <option value="5">{t('rating.fiveStars')}</option>
          </select>
        </div>

        {/* Unity Version (multi-select) */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">{t('toolbar.unity')}</span>
          <UnityVersionDropdown
            versions={unityMajorVersions}
            selected={filters.unityVersions}
            onChange={versions => onUpdateFilters({ unityVersions: versions })}
          />
        </div>
      </div>

      {/* Right: Sort + Display count */}
      <div className="flex items-center gap-x-5 gap-y-2 ml-auto">
        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">{t('toolbar.sort')}</span>
          <select
            value={sortValue}
            onChange={e => {
              if (!e.target.value) {
                onSortChange(null);
                return;
              }
              const opt = SORT_KEYS.find(o => `${o.field}-${o.direction}` === e.target.value);
              if (opt) onSortChange({ field: opt.field, direction: opt.direction });
            }}
            className={selectClass}
          >
            <option value="">{t('toolbar.default')}</option>
            {SORT_KEYS.map(opt => (
              <option key={`${opt.field}-${opt.direction}`} value={`${opt.field}-${opt.direction}`}>
                {t(opt.key)}
              </option>
            ))}
          </select>
        </div>

        {/* Display count */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">{t('toolbar.display')}</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(parseInt(e.target.value))}
            className={selectClass}
          >
            {PAGE_SIZE_VALUES.map(v => (
              <option key={v} value={v}>
                {v === 0 ? t('pageSize.showAll') : t('pageSize.items', { n: v })}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
