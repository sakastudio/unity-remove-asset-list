import { useState, useEffect, useMemo, useCallback } from 'react';
import type { AssetDetail, Filters, SortConfig, LoadedData, CategoryNode } from '../types';
import { DEFAULT_FILTERS } from '../types';
import { loadAssets } from '../data/loader';
import { filterAndSort } from '../data/search';
import { useDebounce } from './useDebounce';
import { useUrlParams } from './useUrlParams';

const DEFAULT_PAGE_SIZE = 50;

export function useAssets() {
  const { initialState, updateUrl } = useUrlParams();

  const [data, setData] = useState<LoadedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQueryRaw] = useState(initialState.query);
  const [filters, setFilters] = useState<Filters>(initialState.filters);
  const [sort, setSort] = useState<SortConfig | null>(initialState.sort);
  const [page, setPageRaw] = useState(initialState.page);
  const [pageSize, setPageSizeRaw] = useState(initialState.pageSize ?? DEFAULT_PAGE_SIZE);
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
      pageSize,
      assetId: selectedAssetId,
    });
  }, [debouncedQuery, filters, sort, page, pageSize, selectedAssetId, updateUrl]);

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

  // pageSize=0 means show all
  const effectivePageSize = pageSize === 0 ? searchResult.totalCount || 1 : pageSize;
  const pageCount = Math.max(1, Math.ceil(searchResult.totalCount / effectivePageSize));
  const safePage = Math.min(page, pageCount);

  const pageAssets = useMemo(() => {
    if (pageSize === 0) return searchResult.assets;
    const start = (safePage - 1) * effectivePageSize;
    return searchResult.assets.slice(start, start + effectivePageSize);
  }, [searchResult.assets, safePage, pageSize, effectivePageSize]);

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

  const setPageSize = useCallback((size: number) => {
    setPageSizeRaw(size);
    setPageRaw(1);
  }, []);

  const openAsset = useCallback((asset: AssetDetail) => {
    setSelectedAssetIdRaw(asset.packageId);
    updateUrl({
      query: debouncedQuery,
      filters,
      sort,
      page,
      pageSize,
      assetId: asset.packageId,
    }, true);
  }, [debouncedQuery, filters, sort, page, pageSize, updateUrl]);

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
    pageSize,
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
    setPageSize,
    openAsset,
    closeAsset,
    clearFilters,
  };
}
