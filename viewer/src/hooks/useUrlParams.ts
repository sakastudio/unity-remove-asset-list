import { useCallback, useEffect, useRef } from 'react';
import type { Filters, SortConfig, SortField, SortDirection } from '../types';
import { DEFAULT_FILTERS } from '../types';

interface UrlState {
  query: string;
  filters: Filters;
  sort: SortConfig | null;
  page: number;
  assetId: string | null;
}

function parseParams(): UrlState {
  const params = new URLSearchParams(window.location.search);

  const cats = params.get('cat');
  const subs = params.get('sub');
  const priceType = params.get('price') as 'free' | 'paid' | null;
  const pmin = params.get('pmin');
  const pmax = params.get('pmax');
  const rating = params.get('rating');
  const unity = params.get('unity');
  const sortParam = params.get('sort');
  const page = params.get('page');

  let sort: SortConfig | null = null;
  if (sortParam) {
    const lastDash = sortParam.lastIndexOf('-');
    if (lastDash > 0) {
      const field = sortParam.slice(0, lastDash) as SortField;
      const dir = sortParam.slice(lastDash + 1) as SortDirection;
      if (['name', 'price', 'rating', 'reviewCount', 'favorites', 'releaseDate'].includes(field) &&
          ['asc', 'desc'].includes(dir)) {
        sort = { field, direction: dir };
      }
    }
  }

  return {
    query: params.get('q') || '',
    filters: {
      categories: cats ? cats.split(',').filter(Boolean) : [],
      subcategories: subs ? subs.split(',').filter(Boolean) : [],
      priceType: priceType === 'free' || priceType === 'paid' ? priceType : 'all',
      priceMin: pmin ? parseFloat(pmin) : null,
      priceMax: pmax ? parseFloat(pmax) : null,
      minRating: rating ? parseInt(rating) : null,
      unityVersions: unity ? unity.split(',').filter(Boolean) : [],
    },
    sort,
    page: page ? Math.max(1, parseInt(page)) : 1,
    assetId: params.get('asset') || null,
  };
}

function buildSearch(state: UrlState): string {
  const params = new URLSearchParams();

  if (state.query) params.set('q', state.query);
  if (state.filters.categories.length) params.set('cat', state.filters.categories.join(','));
  if (state.filters.subcategories.length) params.set('sub', state.filters.subcategories.join(','));
  if (state.filters.priceType !== 'all') params.set('price', state.filters.priceType);
  if (state.filters.priceMin !== null) params.set('pmin', String(state.filters.priceMin));
  if (state.filters.priceMax !== null) params.set('pmax', String(state.filters.priceMax));
  if (state.filters.minRating !== null) params.set('rating', String(state.filters.minRating));
  if (state.filters.unityVersions.length) params.set('unity', state.filters.unityVersions.join(','));
  if (state.sort) params.set('sort', `${state.sort.field}-${state.sort.direction}`);
  if (state.page > 1) params.set('page', String(state.page));
  if (state.assetId) params.set('asset', state.assetId);

  const s = params.toString();
  return s ? `?${s}` : '';
}

export function useUrlParams() {
  const stateRef = useRef<UrlState>(parseParams());

  const updateUrl = useCallback((newState: Partial<UrlState>, push = false) => {
    const current = stateRef.current;
    const merged = { ...current, ...newState };
    stateRef.current = merged;
    const search = buildSearch(merged);
    const url = window.location.pathname + search;

    if (push) {
      window.history.pushState(null, '', url);
    } else {
      window.history.replaceState(null, '', url);
    }
  }, []);

  // Handle popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      stateRef.current = parseParams();
      // Force re-render by dispatching custom event
      window.dispatchEvent(new CustomEvent('urlchange'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    getState: useCallback(() => stateRef.current, []),
    initialState: parseParams(),
    updateUrl,
  };
}

export { DEFAULT_FILTERS };
export type { UrlState };
