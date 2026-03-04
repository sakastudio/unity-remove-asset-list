import type { AssetDetail as AssetDetailType } from '../../types';
import { Thumbnail } from '../common/Thumbnail';
import { PriceBadge } from '../common/Badge';
import { StarRating } from '../common/StarRating';

interface Props {
  asset: AssetDetailType;
  onCategoryClick: (cat: string) => void;
  onKeywordClick: (keyword: string) => void;
}

export function AssetDetail({ asset, onCategoryClick, onKeywordClick }: Props) {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="sm:w-[320px] flex-shrink-0">
          <Thumbnail src={asset.thumbnail} alt={asset.asset} className="rounded-lg" />
        </div>
        <div className="flex-1 space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">{asset.asset}</h2>
          <p className="text-gray-600">{asset.publisher}</p>
          {asset.url && (
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              Asset Store で見る ↗
            </a>
          )}
          <div className="flex items-center gap-3">
            <StarRating rating={asset.rating} reviewCount={asset.reviewCount} size="md" />
          </div>
          {asset.favorites > 0 && (
            <p className="text-sm text-gray-500">
              ♡ {asset.favorites.toLocaleString()} favorites
            </p>
          )}
          <div className="pt-2">
            <PriceBadge price={asset.price} />
          </div>
        </div>
      </div>

      {/* Category breadcrumb */}
      {asset.category.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-500">Category:</span>
          {asset.category.map((cat, i) => {
            const path = asset.category.slice(0, i + 1).join('/');
            return (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-400">›</span>}
                <button
                  onClick={() => onCategoryClick(path)}
                  className="text-blue-600 hover:underline"
                >
                  {cat}
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Description */}
      {asset.description && (
        <div>
          <h3 className="font-semibold text-gray-700 border-b pb-1 mb-2">Description</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
            {asset.description}
          </p>
        </div>
      )}

      {/* Technical specs */}
      <div>
        <h3 className="font-semibold text-gray-700 border-b pb-1 mb-2">Technical Details</h3>
        <table className="text-sm w-full">
          <tbody>
            {[
              ['File Size', asset.fileSize],
              ['Unity Version', asset.unityVersion],
              ['Latest Version', asset.latestVersion],
              ['Release Date', asset.releaseDate],
              ['License', asset.license],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <tr key={label as string} className="border-b border-gray-100">
                  <td className="py-1.5 text-gray-500 w-40">{label}</td>
                  <td className="py-1.5 text-gray-900">{value}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Keywords */}
      {asset.keywords.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 border-b pb-1 mb-2">Keywords</h3>
          <div className="flex flex-wrap gap-1.5">
            {asset.keywords.map(kw => (
              <button
                key={kw}
                onClick={() => onKeywordClick(kw)}
                className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
