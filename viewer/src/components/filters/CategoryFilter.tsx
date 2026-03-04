import { useState } from 'react';
import type { CategoryNode } from '../../types';

interface Props {
  tree: CategoryNode[];
  selectedCategories: string[];
  selectedSubcategories: string[];
  onCategoryChange: (cats: string[]) => void;
  onSubcategoryChange: (subs: string[]) => void;
}

export function CategoryFilter({
  tree,
  selectedCategories,
  selectedSubcategories,
  onCategoryChange,
  onSubcategoryChange,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(selectedCategories));

  const toggleExpand = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        // Remove from selected categories
        onCategoryChange(selectedCategories.filter(c => c !== name));
        // Remove all subcategories under this top-level
        const node = tree.find(n => n.name === name);
        if (node) {
          const subNames = getAllDescendantNames(node);
          onSubcategoryChange(selectedSubcategories.filter(s => !subNames.has(s)));
        }
      } else {
        next.add(name);
        // Add to selected categories
        if (!selectedCategories.includes(name)) {
          onCategoryChange([...selectedCategories, name]);
        }
      }
      return next;
    });
  };

  const toggleSubcategory = (sub: string) => {
    if (selectedSubcategories.includes(sub)) {
      onSubcategoryChange(selectedSubcategories.filter(s => s !== sub));
    } else {
      onSubcategoryChange([...selectedSubcategories, sub]);
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-700 mb-2">Category</h3>
      <div className="space-y-0.5">
        {tree.map(node => (
          <div key={node.name}>
            <button
              onClick={() => toggleExpand(node.name)}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors ${
                selectedCategories.includes(node.name) ? 'text-blue-600 font-medium' : 'text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1">
                <span className={`text-xs transition-transform ${expanded.has(node.name) ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                {node.name}
              </span>
              <span className="text-xs text-gray-400">{node.count}</span>
            </button>

            {expanded.has(node.name) && node.children.length > 0 && (
              <div className="ml-5 space-y-0.5">
                {node.children.map(child => (
                  <label
                    key={child.name}
                    className="flex items-center gap-2 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubcategories.includes(child.name)}
                      onChange={() => toggleSubcategory(child.name)}
                      className="rounded text-blue-600"
                    />
                    <span className="flex-1">{child.name}</span>
                    <span className="text-xs text-gray-400">{child.count}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getAllDescendantNames(node: CategoryNode): Set<string> {
  const names = new Set<string>();
  for (const child of node.children) {
    names.add(child.name);
    for (const name of getAllDescendantNames(child)) {
      names.add(name);
    }
  }
  return names;
}
