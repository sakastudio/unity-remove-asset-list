import type { AssetDetail } from '../../types';
import { Thumbnail } from '../common/Thumbnail';
import { StarRating } from '../common/StarRating';
import { useTranslation } from 'react-i18next';

interface Props {
  asset: AssetDetail;
  onClick: () => void;
}

export function AssetCard({ asset, onClick }: Props) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left w-full"
    >
      <div className="relative">
        <Thumbnail src={asset.thumbnail} alt={asset.asset} />
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug min-w-0">
            {asset.asset}
          </h3>
          <span className={`text-base font-bold whitespace-nowrap shrink-0 ${
            asset.price === null || parseFloat(asset.price) === 0
              ? 'text-green-600'
              : 'text-gray-900'
          }`}>
            {asset.price === null || parseFloat(asset.price) === 0
              ? 'FREE'
              : `$${parseFloat(asset.price!).toFixed(0)}`}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate">
          {asset.publisher}
        </p>
        <div className="flex items-end justify-between mt-1">
          <StarRating rating={asset.rating} reviewCount={asset.reviewCount} />
          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors shrink-0"
          >
            <span>{t('detail.viewOnStore')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </a>
        </div>
      </div>
    </button>
  );
}
