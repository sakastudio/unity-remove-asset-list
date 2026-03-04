import type { Filters, SortConfig, CategoryNode } from '../../types';
import { CategoryFilter } from '../filters/CategoryFilter';
import { PriceFilter } from '../filters/PriceFilter';
import { RatingFilter } from '../filters/RatingFilter';
import { UnityVersionFilter } from '../filters/UnityVersionFilter';
import { SortSelect } from '../filters/SortSelect';

interface Props {
  filters: Filters;
  sort: SortConfig | null;
  categoryTree: CategoryNode[];
  unityMajorVersions: string[];
  priceRange: { min: number; max: number };
  onUpdateFilters: (update: Partial<Filters>) => void;
  onSortChange: (sort: SortConfig | null) => void;
}

export function Sidebar({ filters, sort, categoryTree, unityMajorVersions, priceRange, onUpdateFilters, onSortChange }: Props) {
  return (
    <aside className="hidden lg:block w-[280px] flex-shrink-0">
      <div className="sticky top-[65px] space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] pr-2 pb-8">
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
    </aside>
  );
}
