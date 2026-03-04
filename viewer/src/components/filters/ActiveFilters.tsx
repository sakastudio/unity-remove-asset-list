import type { Filters } from '../../types';

interface Props {
  query: string;
  filters: Filters;
  onRemoveQuery: () => void;
  onUpdateFilters: (update: Partial<Filters>) => void;
  onClearAll: () => void;
}

interface Chip {
  label: string;
  onRemove: () => void;
}

export function ActiveFilters({ query, filters, onRemoveQuery, onUpdateFilters, onClearAll }: Props) {
  const chips: Chip[] = [];

  if (query) {
    chips.push({
      label: `Search: "${query}"`,
      onRemove: onRemoveQuery,
    });
  }

  if (filters.category) {
    const displayPath = filters.category.split('/').join(' > ');
    chips.push({
      label: `Category: ${displayPath}`,
      onRemove: () => onUpdateFilters({ category: null }),
    });
  }

  if (filters.priceType === 'free') {
    chips.push({
      label: 'Price: Free',
      onRemove: () => onUpdateFilters({ priceType: 'all', priceMin: null, priceMax: null }),
    });
  } else if (filters.priceType === 'paid') {
    let label = 'Price: Paid';
    if (filters.priceMin !== null || filters.priceMax !== null) {
      const parts: string[] = [];
      if (filters.priceMin !== null) parts.push(`$${filters.priceMin}`);
      parts.push('—');
      if (filters.priceMax !== null) parts.push(`$${filters.priceMax}`);
      label += ` (${parts.join('')})`;
    }
    chips.push({
      label,
      onRemove: () => onUpdateFilters({ priceType: 'all', priceMin: null, priceMax: null }),
    });
  }

  if (filters.minRating !== null) {
    chips.push({
      label: `Rating: ${'★'.repeat(filters.minRating)}+`,
      onRemove: () => onUpdateFilters({ minRating: null }),
    });
  }

  for (const v of filters.unityVersions) {
    chips.push({
      label: `Unity: ${v}`,
      onRemove: () => onUpdateFilters({ unityVersions: filters.unityVersions.filter(u => u !== v) }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="ml-0.5 hover:text-blue-900 font-bold"
          >
            ×
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-gray-500 hover:text-gray-700 underline"
      >
        すべてクリア
      </button>
    </div>
  );
}
