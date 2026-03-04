import type { AssetDetail } from '../../types';
import { AssetCard } from './AssetCard';

interface Props {
  assets: AssetDetail[];
  loading: boolean;
  onAssetClick: (asset: AssetDetail) => void;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export function AssetGrid({ assets, loading, onAssetClick }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 24 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">該当するアセットがありません</p>
        <p className="text-gray-400 text-sm mt-1">検索条件やフィルターを変更してください</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {assets.map(asset => (
        <AssetCard
          key={asset.packageId}
          asset={asset}
          onClick={() => onAssetClick(asset)}
        />
      ))}
    </div>
  );
}
