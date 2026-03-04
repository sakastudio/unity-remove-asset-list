import type { Filters, SortConfig, SortField, SortDirection } from '../../types';

interface Props {
  filters: Filters;
  sort: SortConfig | null;
  unityMajorVersions: string[];
  pageSize: number;
  onUpdateFilters: (update: Partial<Filters>) => void;
  onSortChange: (sort: SortConfig | null) => void;
  onPageSizeChange: (size: number) => void;
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

const RATING_OPTIONS = [
  { value: '', label: 'すべて' },
  { value: '1', label: '★1以上' },
  { value: '2', label: '★2以上' },
  { value: '3', label: '★3以上' },
  { value: '4', label: '★4以上' },
  { value: '5', label: '★5' },
];

const PAGE_SIZE_OPTIONS = [
  { value: 50, label: '50件' },
  { value: 100, label: '100件' },
  { value: 200, label: '200件' },
  { value: 0, label: '全部' },
];

const selectClass = 'border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700 cursor-pointer';

export function Toolbar({
  filters,
  sort,
  unityMajorVersions,
  pageSize,
  onUpdateFilters,
  onSortChange,
  onPageSizeChange,
}: Props) {
  const sortValue = sort ? `${sort.field}-${sort.direction}` : '';

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2 text-sm text-gray-600">
      {/* Left: Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Price */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">価格:</span>
          <select
            value={filters.priceType}
            onChange={e => onUpdateFilters({
              priceType: e.target.value as 'all' | 'free' | 'paid',
              priceMin: null,
              priceMax: null,
            })}
            className={selectClass}
          >
            <option value="all">すべて</option>
            <option value="free">無料</option>
            <option value="paid">有料</option>
          </select>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">評価:</span>
          <select
            value={filters.minRating ?? ''}
            onChange={e => onUpdateFilters({
              minRating: e.target.value ? parseInt(e.target.value) : null,
            })}
            className={selectClass}
          >
            {RATING_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Unity Version */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Unity:</span>
          <select
            value={filters.unityVersions.length === 1 ? filters.unityVersions[0] : ''}
            onChange={e => onUpdateFilters({
              unityVersions: e.target.value ? [e.target.value] : [],
            })}
            className={selectClass}
          >
            <option value="">すべて</option>
            {unityMajorVersions.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Sort + Display count */}
      <div className="flex items-center gap-x-5 gap-y-2 ml-auto">
        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">ソート:</span>
          <select
            value={sortValue}
            onChange={e => {
              if (!e.target.value) {
                onSortChange(null);
                return;
              }
              const opt = SORT_OPTIONS.find(o => `${o.field}-${o.direction}` === e.target.value);
              if (opt) onSortChange({ field: opt.field, direction: opt.direction });
            }}
            className={selectClass}
          >
            <option value="">デフォルト</option>
            {SORT_OPTIONS.map(opt => (
              <option key={`${opt.field}-${opt.direction}`} value={`${opt.field}-${opt.direction}`}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Display count */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">表示:</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(parseInt(e.target.value))}
            className={selectClass}
          >
            {PAGE_SIZE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
