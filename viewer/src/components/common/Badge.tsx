import { useTranslation } from 'react-i18next';

interface PriceBadgeProps {
  price: string | null;
}

export function PriceBadge({ price }: PriceBadgeProps) {
  const { t } = useTranslation();
  const isFree = price === null || parseFloat(price) === 0;

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-semibold ${
        isFree
          ? 'bg-green-500 text-white'
          : 'bg-gray-800 text-white'
      }`}
    >
      {isFree ? t('badge.free') : `$${parseFloat(price!).toFixed(2)}`}
    </span>
  );
}

interface CategoryBadgeProps {
  category: string;
  onClick?: () => void;
}

export function CategoryBadge({ category, onClick }: CategoryBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
    >
      {category}
    </button>
  );
}
