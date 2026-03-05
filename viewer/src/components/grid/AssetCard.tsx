import type { AssetDetail } from '../../types';
import { Thumbnail } from '../common/Thumbnail';
import { StarRating } from '../common/StarRating';

interface Props {
  asset: AssetDetail;
  onClick: () => void;
}

export function AssetCard({ asset, onClick }: Props) {
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
        <div className="mt-1">
          <StarRating rating={asset.rating} reviewCount={asset.reviewCount} />
        </div>
      </div>
    </button>
  );
}
