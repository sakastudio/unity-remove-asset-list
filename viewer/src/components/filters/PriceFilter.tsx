import { useTranslation } from 'react-i18next';

interface Props {
  priceType: 'all' | 'free' | 'paid';
  priceMin: number | null;
  priceMax: number | null;
  priceRange: { min: number; max: number };
  onChange: (update: { priceType?: 'all' | 'free' | 'paid'; priceMin?: number | null; priceMax?: number | null }) => void;
}

export function PriceFilter({ priceType, priceMin, priceMax, priceRange, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-700 mb-2">{t('filters.price')}</h3>
      <select
        value={priceType}
        onChange={e => {
          const val = e.target.value as 'all' | 'free' | 'paid';
          onChange({
            priceType: val,
            priceMin: val === 'paid' ? priceMin : null,
            priceMax: val === 'paid' ? priceMax : null,
          });
        }}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
      >
        <option value="all">{t('filters.priceAll')}</option>
        <option value="free">{t('filters.priceFree')}</option>
        <option value="paid">{t('filters.pricePaid')}</option>
      </select>

      {priceType === 'paid' && (
        <div className="space-y-2 mt-3">
          <div className="flex gap-2 items-center text-sm">
            <div className="flex-1">
              <label className="text-xs text-gray-500">{t('filters.priceMin')}</label>
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
              <label className="text-xs text-gray-500">{t('filters.priceMax')}</label>
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
