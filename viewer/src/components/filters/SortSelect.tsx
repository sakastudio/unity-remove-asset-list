import type { SortConfig, SortField, SortDirection } from '../../types';

interface Props {
  sort: SortConfig | null;
  onChange: (sort: SortConfig | null) => void;
}

const SORT_OPTIONS: { label: string; field: SortField; direction: SortDirection }[] = [
  { label: '名前（A→Z）', field: 'name', direction: 'asc' },
  { label: '名前（Z→A）', field: 'name', direction: 'desc' },
  { label: '価格（安い順）', field: 'price', direction: 'asc' },
  { label: '価格（高い順）', field: 'price', direction: 'desc' },
  { label: '評価（高い順）', field: 'rating', direction: 'desc' },
  { label: 'レビュー数順', field: 'reviewCount', direction: 'desc' },
  { label: 'お気に入り順', field: 'favorites', direction: 'desc' },
  { label: '新しい順', field: 'releaseDate', direction: 'desc' },
  { label: '古い順', field: 'releaseDate', direction: 'asc' },
];

export function SortSelect({ sort, onChange }: Props) {
  const currentValue = sort ? `${sort.field}-${sort.direction}` : '';

  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-700 mb-2">Sort</h3>
      <select
        value={currentValue}
        onChange={e => {
          if (!e.target.value) {
            onChange(null);
            return;
          }
          const opt = SORT_OPTIONS.find(o => `${o.field}-${o.direction}` === e.target.value);
          if (opt) onChange({ field: opt.field, direction: opt.direction });
        }}
        className="w-full border rounded px-2 py-1.5 text-sm bg-white"
      >
        <option value="">デフォルト</option>
        {SORT_OPTIONS.map(opt => (
          <option key={`${opt.field}-${opt.direction}`} value={`${opt.field}-${opt.direction}`}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
