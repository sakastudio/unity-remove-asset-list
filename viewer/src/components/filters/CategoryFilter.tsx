import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { CategoryNode } from '../../types';

interface Props {
  tree: CategoryNode[];
  selectedCategory: string | null; // Full path like "3D/Characters/Humanoids"
  onCategoryChange: (category: string | null) => void;
}

export function CategoryFilter({ tree, selectedCategory, onCategoryChange }: Props) {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Auto-expand ancestors of selected category
    const set = new Set<string>();
    if (selectedCategory) {
      const parts = selectedCategory.split('/');
      for (let i = 1; i <= parts.length; i++) {
        set.add(parts.slice(0, i).join('/'));
      }
    }
    return set;
  });

  const toggleExpand = useCallback((path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const selectCategory = useCallback((path: string) => {
    if (selectedCategory === path) {
      onCategoryChange(null); // Deselect
    } else {
      onCategoryChange(path);
    }
  }, [selectedCategory, onCategoryChange]);

  const renderNode = (node: CategoryNode, parentPath: string, depth: number) => {
    const path = parentPath ? `${parentPath}/${node.name}` : node.name;
    const isSelected = selectedCategory === path;
    const isAncestorOfSelected = selectedCategory !== null && selectedCategory.startsWith(path + '/');
    const isExpanded = expanded.has(path);
    const hasChildren = node.children.length > 0;

    return (
      <div key={path}>
        <div
          className={`flex items-center gap-1 pr-2 rounded cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-50 text-blue-700 font-medium'
              : isAncestorOfSelected
                ? 'text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
        >
          {/* Expand/collapse arrow */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(path, e)}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <svg
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6 4l8 6-8 6V4z" />
              </svg>
            </button>
          ) : (
            <span className="flex-shrink-0 w-5" />
          )}

          {/* Category name */}
          <button
            onClick={() => selectCategory(path)}
            className="flex-1 flex items-center justify-between py-1.5 text-sm text-left min-w-0"
          >
            <span className="truncate">{t(`categories.${node.name}`, node.name)}</span>
            <span className="flex-shrink-0 ml-2 text-xs text-gray-400">{node.count}</span>
          </button>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderNode(child, path, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-700 mb-2">{t('filters.category')}</h3>
      <div className="space-y-0.5">
        {tree.map(node => renderNode(node, '', 0))}
      </div>
    </div>
  );
}
