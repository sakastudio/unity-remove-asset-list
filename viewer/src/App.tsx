import { useState, useCallback } from 'react';
import { useAssets } from './hooks/useAssets';
import { Header } from './components/layout/Header';
import { Toolbar } from './components/layout/Toolbar';
import { Sidebar } from './components/layout/Sidebar';
import { FilterDrawer } from './components/layout/FilterDrawer';
import { ActiveFilters } from './components/filters/ActiveFilters';
import { AssetGrid } from './components/grid/AssetGrid';
import { Pagination } from './components/grid/Pagination';
import { AssetModal } from './components/detail/AssetModal';

export default function App() {
  const {
    assets,
    totalCount,
    allCount,
    pageCount,
    page,
    pageSize,
    loading,
    selectedAsset,
    categoryTree,
    unityMajorVersions,
    priceRange,
    query,
    filters,
    sort,
    hasActiveFilters,
    setQuery,
    updateFilters,
    setSort,
    setPage,
    setPageSize,
    openAsset,
    closeAsset,
    clearFilters,
  } = useAssets();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleCategoryClick = useCallback((cat: string) => {
    // Check if it's a top-level category
    const isTopLevel = categoryTree.some(n => n.name === cat);
    if (isTopLevel) {
      updateFilters({ categories: [cat], subcategories: [] });
    } else {
      updateFilters({ subcategories: [cat] });
    }
    closeAsset();
  }, [categoryTree, updateFilters, closeAsset]);

  const handleKeywordClick = useCallback((keyword: string) => {
    setQuery(keyword);
    closeAsset();
  }, [setQuery, closeAsset]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        query={query}
        onQueryChange={setQuery}
        totalCount={totalCount}
        allCount={allCount}
        onToggleFilters={() => setDrawerOpen(true)}
      />

      <div className="max-w-screen-2xl mx-auto w-full px-4 flex-1">
        {/* Toolbar */}
        <div className="hidden lg:block border-b">
          <Toolbar
            filters={filters}
            sort={sort}
            unityMajorVersions={unityMajorVersions}
            pageSize={pageSize}
            onUpdateFilters={updateFilters}
            onSortChange={setSort}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Active filters */}
        {(hasActiveFilters || query) && (
          <div className="pt-3">
            <ActiveFilters
              query={query}
              filters={filters}
              onRemoveQuery={() => setQuery('')}
              onUpdateFilters={updateFilters}
              onClearAll={clearFilters}
            />
          </div>
        )}

        <div className="flex gap-6 pt-4">
          {/* Sidebar (desktop) - category only */}
          <Sidebar
            filters={filters}
            categoryTree={categoryTree}
            onUpdateFilters={updateFilters}
          />

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-8">
            <AssetGrid
              assets={assets}
              loading={loading}
              onAssetClick={openAsset}
            />
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </main>
        </div>
      </div>

      {/* Filter drawer (mobile) */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        sort={sort}
        categoryTree={categoryTree}
        unityMajorVersions={unityMajorVersions}
        priceRange={priceRange}
        onUpdateFilters={updateFilters}
        onSortChange={setSort}
      />

      {/* Detail modal */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          onClose={closeAsset}
          onCategoryClick={handleCategoryClick}
          onKeywordClick={handleKeywordClick}
        />
      )}
    </div>
  );
}
