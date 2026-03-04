interface Props {
  priceType: 'all' | 'free' | 'paid';
  priceMin: number | null;
  priceMax: number | null;
  priceRange: { min: number; max: number };
  onChange: (update: { priceType?: 'all' | 'free' | 'paid'; priceMin?: number | null; priceMax?: number | null }) => void;
}

export function PriceFilter({ priceType, priceMin, priceMax, priceRange, onChange }: Props) {
  const options: { value: 'all' | 'free' | 'paid'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'free', label: 'Free' },
    { value: 'paid', label: 'Paid' },
  ];

  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-700 mb-2">Price</h3>
      <div className="flex gap-1 mb-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange({
              priceType: opt.value,
              priceMin: opt.value === 'paid' ? priceMin : null,
              priceMax: opt.value === 'paid' ? priceMax : null,
            })}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              priceType === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {priceType === 'paid' && (
        <div className="space-y-2 mt-3">
          <div className="flex gap-2 items-center text-sm">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Min</label>
              <input
                type="number"
                min={priceRange.min}
                max={priceRange.max}
                step="0.01"
                value={priceMin ?? ''}
                onChange={e => onChange({ priceMin: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder={`$${priceRange.min.toFixed(2)}`}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <span className="text-gray-400 mt-4">—</span>
            <div className="flex-1">
              <label className="text-xs text-gray-500">Max</label>
              <input
                type="number"
                min={priceRange.min}
                max={priceRange.max}
                step="0.01"
                value={priceMax ?? ''}
                onChange={e => onChange({ priceMax: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder={`$${priceRange.max.toFixed(2)}`}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
