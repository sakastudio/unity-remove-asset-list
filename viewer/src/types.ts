export interface AssetDetail {
  asset: string;
  publisher: string;
  url: string;
  packageId: string;
  thumbnail: string | null;
  thumbnailUrl: string | null;
  price: string | null;
  priceCurrency: string | null;
  category: string[];
  rating: number | null;
  reviewCount: number;
  favorites: number;
  description: string;
  keywords: string[];
  fileSize: string | null;
  latestVersion: string | null;
  unityVersion: string | null;
  releaseDate: string | null;
  license: string | null;
}

export interface CategoryNode {
  name: string;
  count: number;
  children: CategoryNode[];
}

export interface Filters {
  categories: string[];
  subcategories: string[];
  priceType: 'all' | 'free' | 'paid';
  priceMin: number | null;
  priceMax: number | null;
  minRating: number | null;
  unityVersions: string[];
}

export type SortField = 'name' | 'price' | 'rating' | 'reviewCount' | 'favorites' | 'releaseDate';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface LoadedData {
  assets: AssetDetail[];
  categoryTree: CategoryNode[];
  unityMajorVersions: string[];
  priceRange: { min: number; max: number };
  publisherList: string[];
}

export const DEFAULT_FILTERS: Filters = {
  categories: [],
  subcategories: [],
  priceType: 'all',
  priceMin: null,
  priceMax: null,
  minRating: null,
  unityVersions: [],
};
