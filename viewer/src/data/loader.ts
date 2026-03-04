import type { AssetDetail, LoadedData } from '../types';
import { buildCategoryTree } from './categories';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&apos;/g, "'");
}

function getUnityMajorVersion(version: string | null): string | null {
  if (!version) return null;
  if (version.startsWith('6000')) return 'Unity 6';
  const match = version.match(/^(\d{4})/);
  return match ? match[1] : null;
}

export async function loadAssets(): Promise<LoadedData> {
  const res = await fetch(`${import.meta.env.BASE_URL}asset-details.json`);
  const raw: AssetDetail[] = await res.json();

  // Decode HTML entities
  const assets = raw.map(a => ({
    ...a,
    asset: decodeHtmlEntities(a.asset),
    publisher: decodeHtmlEntities(a.publisher),
    description: decodeHtmlEntities(a.description),
    keywords: a.keywords.map(decodeHtmlEntities),
    category: a.category.map(decodeHtmlEntities),
  }));

  // Build category tree
  const categoryTree = buildCategoryTree(assets.map(a => a.category));

  // Unity major versions
  const versionSet = new Set<string>();
  for (const a of assets) {
    const v = getUnityMajorVersion(a.unityVersion);
    if (v) versionSet.add(v);
  }
  const versionOrder = ['2019', '2020', '2021', '2022', '2023', 'Unity 6'];
  const unityMajorVersions = versionOrder.filter(v => versionSet.has(v));

  // Price range (paid only)
  let priceMin = Infinity;
  let priceMax = -Infinity;
  for (const a of assets) {
    if (a.price !== null && parseFloat(a.price) > 0) {
      const p = parseFloat(a.price);
      if (p < priceMin) priceMin = p;
      if (p > priceMax) priceMax = p;
    }
  }

  // Publisher list
  const pubSet = new Set<string>();
  for (const a of assets) pubSet.add(a.publisher);
  const publisherList = [...pubSet].sort();

  return {
    assets,
    categoryTree,
    unityMajorVersions,
    priceRange: { min: priceMin === Infinity ? 0 : priceMin, max: priceMax === -Infinity ? 0 : priceMax },
    publisherList,
  };
}
