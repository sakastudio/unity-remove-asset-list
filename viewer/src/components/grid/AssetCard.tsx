import type { AssetDetail } from '../../types';
import { Thumbnail } from '../common/Thumbnail';
import { PriceBadge } from '../common/Badge';
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
        <div className="absolute top-2 right-2">
          <PriceBadge price={asset.price} />
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
          {asset.asset}
        </h3>
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
