import { useState, useEffect, useMemo, useCallback } from 'react';
import type { AssetDetail, Filters, SortConfig, LoadedData, CategoryNode } from '../types';
import { DEFAULT_FILTERS } from '../types';
import { loadAssets } from '../data/loader';
import { filterAndSort } from '../data/search';
import { useDebounce } from './useDebounce';
import { useUrlParams } from './useUrlParams';

const PAGE_SIZE = 24;

export function useAssets() {
  const { initialState, updateUrl } = useUrlParams();

  const [data, setData] = useState<LoadedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQueryRaw] = useState(initialState.query);
  const [filters, setFilters] = useState<Filters>(initialState.filters);
  const [sort, setSort] = useState<SortConfig | null>(initialState.sort);
  const [page, setPageRaw] = useState(initialState.page);
  const [selectedAssetId, setSelectedAssetIdRaw] = useState<string | null>(initialState.assetId);

  const debouncedQuery = useDebounce(query);

  // Load data
  useEffect(() => {
    loadAssets().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  // Sync URL on state changes
  useEffect(() => {
    updateUrl({
      query: debouncedQuery,
      filters,
      sort,
      page,
      assetId: selectedAssetId,
    });
  }, [debouncedQuery, filters, sort, page, selectedAssetId, updateUrl]);

  // Handle browser back/forward
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const assetId = params.get('asset') || null;
      setSelectedAssetIdRaw(assetId);
    };
    window.addEventListener('urlchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('urlchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Filter and sort
  const searchResult = useMemo(() => {
    if (!data) return { assets: [], totalCount: 0 };
    return filterAndSort(data.assets, debouncedQuery, filters, sort);
  }, [data, debouncedQuery, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(searchResult.totalCount / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  const pageAssets = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return searchResult.assets.slice(start, start + PAGE_SIZE);
  }, [searchResult.assets, safePage]);

  const selectedAsset = useMemo(() => {
    if (!selectedAssetId || !data) return null;
    return data.assets.find(a => a.packageId === selectedAssetId) || null;
  }, [selectedAssetId, data]);

  // Setters that reset page
  const setQuery = useCallback((q: string) => {
    setQueryRaw(q);
    setPageRaw(1);
  }, []);

  const updateFilters = useCallback((partial: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...partial }));
    setPageRaw(1);
  }, []);

  const setSort_ = useCallback((s: SortConfig | null) => {
    setSort(s);
    setPageRaw(1);
  }, []);

  const setPage = useCallback((p: number) => {
    setPageRaw(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openAsset = useCallback((asset: AssetDetail) => {
    setSelectedAssetIdRaw(asset.packageId);
    updateUrl({
      query: debouncedQuery,
      filters,
      sort,
      page,
      assetId: asset.packageId,
    }, true);
  }, [debouncedQuery, filters, sort, page, updateUrl]);

  const closeAsset = useCallback(() => {
    setSelectedAssetIdRaw(null);
    // Go back if we pushed
    if (window.history.state !== null) {
      window.history.back();
    }
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setQueryRaw('');
    setSort(null);
    setPageRaw(1);
  }, []);

  const hasActiveFilters = useMemo(() => {
    const f = filters;
    return f.categories.length > 0 ||
      f.subcategories.length > 0 ||
      f.priceType !== 'all' ||
      f.priceMin !== null ||
      f.priceMax !== null ||
      f.minRating !== null ||
      f.unityVersions.length > 0;
  }, [filters]);

  return {
    // Data
    assets: pageAssets,
    totalCount: searchResult.totalCount,
    allCount: data?.assets.length ?? 0,
    pageCount,
    page: safePage,
    loading,
    selectedAsset,

    // Metadata
    categoryTree: data?.categoryTree ?? [] as CategoryNode[],
    unityMajorVersions: data?.unityMajorVersions ?? [],
    priceRange: data?.priceRange ?? { min: 0, max: 0 },

    // State
    query,
    filters,
    sort,
    hasActiveFilters,

    // Actions
    setQuery,
    updateFilters,
    setSort: setSort_,
    setPage,
    openAsset,
    closeAsset,
    clearFilters,
  };
}
