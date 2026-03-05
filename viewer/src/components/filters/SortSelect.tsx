import { useTranslation } from 'react-i18next';
import type { SortConfig, SortField, SortDirection } from '../../types';

interface Props {
  sort: SortConfig | null;
  onChange: (sort: SortConfig | null) => void;
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

export function SortSelect({ sort, onChange }: Props) {
  const { t } = useTranslation();
  const currentValue = sort ? `${sort.field}-${sort.direction}` : '';

  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-700 mb-2">{t('filters.sort')}</h3>
      <select
        value={currentValue}
        onChange={e => {
          if (!e.target.value) {
            onChange(null);
            return;
          }
          const opt = SORT_KEYS.find(o => `${o.field}-${o.direction}` === e.target.value);
          if (opt) onChange({ field: opt.field, direction: opt.direction });
        }}
        className="w-full border rounded px-2 py-1.5 text-sm bg-white"
      >
        <option value="">{t('toolbar.default')}</option>
        {SORT_KEYS.map(opt => (
          <option key={`${opt.field}-${opt.direction}`} value={`${opt.field}-${opt.direction}`}>
            {t(opt.key)}
          </option>
        ))}
      </select>
    </div>
  );
}
