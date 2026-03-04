import type { Filters, CategoryNode } from '../../types';
import { CategoryFilter } from '../filters/CategoryFilter';

interface Props {
  filters: Filters;
  categoryTree: CategoryNode[];
  onUpdateFilters: (update: Partial<Filters>) => void;
}

export function Sidebar({ filters, categoryTree, onUpdateFilters }: Props) {
  return (
    <aside className="hidden lg:block w-[280px] flex-shrink-0">
      <div className="sticky top-[65px] overflow-y-auto max-h-[calc(100vh-80px)] pr-2 pb-8">
        <CategoryFilter
          tree={categoryTree}
          selectedCategory={filters.category}
          onCategoryChange={cat => onUpdateFilters({ category: cat })}
        />
      </div>
    </aside>
  );
}
