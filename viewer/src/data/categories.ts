import type { CategoryNode } from '../types';

export function buildCategoryTree(allCategories: string[][]): CategoryNode[] {
  const root: CategoryNode[] = [];

  for (const path of allCategories) {
    if (path.length === 0) continue;
    let level = root;
    for (const segment of path) {
      let node = level.find(n => n.name === segment);
      if (!node) {
        node = { name: segment, count: 0, children: [] };
        level.push(node);
      }
      node.count++;
      level = node.children;
    }
  }

  // Sort top-level by count descending
  root.sort((a, b) => b.count - a.count);
  // Sort children recursively
  const sortChildren = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => b.count - a.count);
    for (const node of nodes) {
      sortChildren(node.children);
    }
  };
  for (const node of root) {
    sortChildren(node.children);
  }

  return root;
}

export function getTopLevelCategories(tree: CategoryNode[]): string[] {
  return tree.map(n => n.name);
}
