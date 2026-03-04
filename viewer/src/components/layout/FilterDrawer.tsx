import { useEffect } from 'react';
import type { Filters, SortConfig, CategoryNode } from '../../types';
import { CategoryFilter } from '../filters/CategoryFilter';
import { PriceFilter } from '../filters/PriceFilter';
import { RatingFilter } from '../filters/RatingFilter';
import { UnityVersionFilter } from '../filters/UnityVersionFilter';
import { SortSelect } from '../filters/SortSelect';

interface Props {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  sort: SortConfig | null;
  categoryTree: CategoryNode[];
  unityMajorVersions: string[];
  priceRange: { min: number; max: number };
  onUpdateFilters: (update: Partial<Filters>) => void;
  onSortChange: (sort: SortConfig | null) => void;
}

export function FilterDrawer({
  open,
  onClose,
  filters,
  sort,
  categoryTree,
  unityMajorVersions,
  priceRange,
  onUpdateFilters,
  onSortChange,
}: Props) {
  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-[300px] bg-white shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Filters</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          <SortSelect sort={sort} onChange={onSortChange} />

          <CategoryFilter
            tree={categoryTree}
            selectedCategories={filters.categories}
            selectedSubcategories={filters.subcategories}
            onCategoryChange={cats => onUpdateFilters({ categories: cats })}
            onSubcategoryChange={subs => onUpdateFilters({ subcategories: subs })}
          />

          <PriceFilter
            priceType={filters.priceType}
            priceMin={filters.priceMin}
            priceMax={filters.priceMax}
            priceRange={priceRange}
            onChange={update => onUpdateFilters(update as Partial<Filters>)}
          />

          <RatingFilter
            minRating={filters.minRating}
            onChange={rating => onUpdateFilters({ minRating: rating })}
          />

          <UnityVersionFilter
            versions={unityMajorVersions}
            selected={filters.unityVersions}
            onChange={versions => onUpdateFilters({ unityVersions: versions })}
          />
        </div>
      </div>
    </div>
  );
}
