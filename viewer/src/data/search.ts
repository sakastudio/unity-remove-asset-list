import type { AssetDetail, Filters, SortConfig } from '../types';

function getUnityMajorVersion(version: string | null): string | null {
  if (!version) return null;
  if (version.startsWith('6000')) return 'Unity 6';
  const match = version.match(/^(\d{4})/);
  return match ? match[1] : null;
}

function computeSearchScore(asset: AssetDetail, query: string): number {
  const q = query.toLowerCase();
  let score = 0;

  if (asset.asset.toLowerCase().includes(q)) score += 100;
  if (asset.publisher.toLowerCase().includes(q)) score += 50;
  if (asset.keywords.some(k => k.toLowerCase().includes(q))) score += 50;
  if (asset.description.toLowerCase().includes(q)) score += 10;

  return score;
}

function getPrice(asset: AssetDetail): number {
  if (asset.price === null) return 0;
  return parseFloat(asset.price);
}

function parseReleaseDate(dateStr: string | null): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function matchesFilters(asset: AssetDetail, filters: Filters): boolean {
  // Category filter: check if asset's category path starts with the selected path
  if (filters.category) {
    const filterParts = filters.category.split('/');
    if (asset.category.length < filterParts.length) return false;
    for (let i = 0; i < filterParts.length; i++) {
      if (asset.category[i] !== filterParts[i]) return false;
    }
  }

  // Price filter
  const price = getPrice(asset);
  if (filters.priceType === 'free' && price > 0) return false;
  if (filters.priceType === 'paid' && price === 0) return false;
  if (filters.priceType === 'paid') {
    if (filters.priceMin !== null && price < filters.priceMin) return false;
    if (filters.priceMax !== null && price > filters.priceMax) return false;
  }

  // Rating filter
  if (filters.minRating !== null) {
    if (asset.rating === null || asset.rating < filters.minRating) return false;
  }

  // Unity version filter
  if (filters.unityVersions.length > 0) {
    const major = getUnityMajorVersion(asset.unityVersion);
    if (!major || !filters.unityVersions.includes(major)) return false;
  }

  return true;
}

export interface SearchResult {
  assets: AssetDetail[];
  totalCount: number;
}

export function filterAndSort(
  allAssets: AssetDetail[],
  query: string,
  filters: Filters,
  sort: SortConfig | null,
): SearchResult {
  let results: { asset: AssetDetail; score: number }[];

  if (query.trim()) {
    // Search with scoring
    results = [];
    for (const asset of allAssets) {
      const score = computeSearchScore(asset, query.trim());
      if (score > 0 && matchesFilters(asset, filters)) {
        results.push({ asset, score });
      }
    }
  } else {
    // No search, just filter
    results = allAssets
      .filter(a => matchesFilters(a, filters))
      .map(a => ({ asset: a, score: 0 }));
  }

  // Sort
  if (sort) {
    results.sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      switch (sort.field) {
        case 'name':
          return dir * a.asset.asset.localeCompare(b.asset.asset);
        case 'price':
          return dir * (getPrice(a.asset) - getPrice(b.asset));
        case 'rating':
          return dir * ((a.asset.rating ?? -1) - (b.asset.rating ?? -1));
        case 'reviewCount':
          return dir * (a.asset.reviewCount - b.asset.reviewCount);
        case 'favorites':
          return dir * (a.asset.favorites - b.asset.favorites);
        case 'releaseDate':
          return dir * (parseReleaseDate(a.asset.releaseDate) - parseReleaseDate(b.asset.releaseDate));
        default:
          return 0;
      }
    });
  } else if (query.trim()) {
    // Sort by score descending, then favorites descending
    results.sort((a, b) => b.score - a.score || b.asset.favorites - a.asset.favorites);
  } else {
    // Default: favorites descending
    results.sort((a, b) => b.asset.favorites - a.asset.favorites);
  }

  return {
    assets: results.map(r => r.asset),
    totalCount: results.length,
  };
}
