import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import * as cheerio from "cheerio";

// ── Types ──

interface InputEntry {
  asset: string;
  publisher: string;
  url: string;
}

interface AssetDetail {
  asset: string;
  publisher: string;
  url: string;
  packageId: string;
  thumbnail: string | null;
  thumbnailUrl: string | null;
  price: string | null;
  priceCurrency: string | null;
  category: string[];
  rating: number | null;
  reviewCount: number;
  favorites: number;
  description: string;
  keywords: string[];
  fileSize: string | null;
  latestVersion: string | null;
  unityVersion: string | null;
  releaseDate: string | null;
  license: string | null;
}

interface FailedEntry {
  asset: string;
  publisher: string;
  url: string;
  packageId: string;
  error: string;
  httpStatus?: number;
}

interface ScrapeProgress {
  completed: AssetDetail[];
  failed: FailedEntry[];
  processedIds: string[];
  thumbnailsDone: string[];
  startedAt: string;
  lastUpdatedAt: string;
}

// ── Config ──

const CONCURRENCY = 5;
const DELAY_MS = 200;
const CHECKPOINT_INTERVAL = 20;
const PROGRESS_FILE = "scrape-progress.json";
const OUTPUT_FILE = "asset-details.json";
const INPUT_FILE = "results.json";
const THUMBNAILS_DIR = "thumbnails";

// ── Helpers ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractPackageId(url: string): string {
  const match = url.match(/(\d+)$/);
  if (!match) throw new Error(`Cannot extract ID from: ${url}`);
  return match[1];
}

function extractMeta(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1] : null;
}

// React SSR pattern: >Label<!-- /react-text --></h4><div class="SoNzt" ...>VALUE</div>
function extractReactMeta(html: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    escaped + "[^<]*<[^>]*><\\/h4>\\s*<div[^>]*>([^<]+)<\\/div>",
    "i"
  );
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

// ── Progress management ──

let progress: ScrapeProgress = {
  completed: [],
  failed: [],
  processedIds: [],
  thumbnailsDone: [],
  startedAt: new Date().toISOString(),
  lastUpdatedAt: new Date().toISOString(),
};

async function loadProgress(): Promise<void> {
  if (existsSync(PROGRESS_FILE)) {
    try {
      const data = JSON.parse(await readFile(PROGRESS_FILE, "utf-8"));
      progress = data;
      console.log(
        `Resumed: ${progress.completed.length} completed, ${progress.failed.length} failed, ${progress.processedIds.length} processed`
      );
    } catch {
      console.log("Could not parse progress file, starting fresh.");
    }
  }
}

async function saveProgress(p: ScrapeProgress): Promise<void> {
  p.lastUpdatedAt = new Date().toISOString();
  await writeFile(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

// ── SIGINT handler ──

let shuttingDown = false;
process.on("SIGINT", async () => {
  if (shuttingDown) process.exit(1);
  shuttingDown = true;
  console.log("\n[Interrupted] Saving progress...");
  await saveProgress(progress);
  console.log("[Interrupted] Progress saved. Safe to exit.");
  process.exit(0);
});

// ── Fetch with retry ──

async function fetchAssetPage(url: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (shuttingDown) throw new Error("SHUTDOWN");

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (response.status === 429) {
        console.log(`  Rate limited, waiting 60s... (attempt ${attempt + 1})`);
        await sleep(60000);
        continue;
      }

      if (response.status === 404) {
        throw new Error("NOT_FOUND");
      }

      if (!response.ok) {
        if (response.status >= 500 && attempt < 2) {
          const backoff = Math.pow(2, attempt) * 1000;
          console.log(`  HTTP ${response.status}, retrying in ${backoff}ms...`);
          await sleep(backoff);
          continue;
        }
        throw new Error(`HTTP_${response.status}`);
      }

      return await response.text();
    } catch (err: any) {
      if (err.message === "NOT_FOUND" || err.message === "SHUTDOWN") throw err;
      if (err.message?.startsWith("HTTP_")) throw err;
      if (attempt < 2) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.log(`  Network error, retrying in ${backoff}ms... (${err.message})`);
        await sleep(backoff);
        continue;
      }
      throw new Error(`NETWORK_ERROR: ${err.message}`);
    }
  }
  throw new Error("MAX_RETRIES");
}

// ── Parse ──

function parseAssetPage(html: string, entry: InputEntry): AssetDetail {
  const $ = cheerio.load(html);

  // JSON-LD extraction
  const jsonLdScripts = $('script[type="application/ld+json"]');
  let productData: any = null;
  let breadcrumbData: any = null;

  jsonLdScripts.each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "");
      if (data["@type"] === "Product") productData = data;
      if (data["@type"] === "BreadcrumbList") breadcrumbData = data;
    } catch {}
  });

  // Price
  const price = productData?.offers?.price?.toString() || null;
  const priceCurrency = productData?.offers?.priceCurrency || null;

  // Thumbnail URL
  let thumbnailUrl: string | null = null;
  if (productData?.image) {
    const img = Array.isArray(productData.image)
      ? productData.image[0]
      : productData.image;
    thumbnailUrl = img?.startsWith("//") ? "https:" + img : img || null;
  }

  // Category from BreadcrumbList
  const category: string[] = [];
  if (breadcrumbData?.itemListElement) {
    const items = [...breadcrumbData.itemListElement].sort(
      (a: any, b: any) => a.position - b.position
    );
    for (const item of items) {
      const name = item.item?.name || item.name || "";
      if (name && name !== "Home" && name !== productData?.name) {
        category.push(name);
      }
    }
  }

  // Rating
  const rating = productData?.aggregateRating?.ratingValue
    ? parseFloat(productData.aggregateRating.ratingValue)
    : null;
  const reviewCount = productData?.aggregateRating?.reviewCount
    ? parseInt(productData.aggregateRating.reviewCount)
    : 0;

  // Favorites
  let favorites = 0;
  const favMatch =
    html.match(/(\d+)\s*users?\s*have\s*favourit/i) ||
    html.match(/(\d+)\s*users?\s*have\s*favorit/i);
  if (favMatch) favorites = parseInt(favMatch[1]);

  // Description
  let description = productData?.description || "";
  // Try to get full description from controller data
  const controllerMatch = html.match(
    /window\["Product_ProductDetailController"\]\s*=\s*(\{[\s\S]*?\});/
  );
  if (controllerMatch) {
    try {
      const controllerData = JSON.parse(controllerMatch[1]);
      if (
        controllerData.description &&
        controllerData.description.length > description.length
      ) {
        description = controllerData.description;
      }
    } catch {}
  }
  // Fallback: try meta description or .description class
  if (!description) {
    description =
      $('meta[name="description"]').attr("content") ||
      $(".description").first().text().trim() ||
      "";
  }

  // Keywords - pattern: href="/?q=keyword">keyword</a>
  const keywords: string[] = [];
  const keywordMatches = html.matchAll(
    /href="\/\?q=[^"]*"[^>]*>([^<]+)</g
  );
  for (const m of keywordMatches) {
    const kw = m[1].trim();
    if (kw && !keywords.includes(kw)) keywords.push(kw);
  }
  // Fallback: meta keywords
  if (keywords.length === 0) {
    const metaKw = $('meta[name="keywords"]').attr("content");
    if (metaKw) {
      for (const kw of metaKw.split(",")) {
        const trimmed = kw.trim();
        if (trimmed && !keywords.includes(trimmed)) keywords.push(trimmed);
      }
    }
  }

  // Metadata - React SSR format: >Label<!-- /react-text --></h4><div class="SoNzt" ...>VALUE</div>
  const fileSize = extractReactMeta(html, "File size");
  const latestVersion = extractReactMeta(html, "Latest version");
  const releaseDate = extractReactMeta(html, "Latest release date")
    || extractReactMeta(html, "Release date");

  // Unity version is in a table: data-label="Unity Version" ...>2020.3.37f1</td>
  const unityVersionMatch = html.match(
    /data-label="Unity Version"[^>]*>([^<]+)</i
  );
  const unityVersion = unityVersionMatch ? unityVersionMatch[1].trim() : null;

  // License: <strong ...>License type: Single Entity</strong>
  const licenseMatch = html.match(/License type:\s*([^<]+)/i);
  const license = licenseMatch ? licenseMatch[1].trim() : null;

  return {
    asset: entry.asset,
    publisher: entry.publisher,
    url: entry.url,
    packageId: extractPackageId(entry.url),
    thumbnail: null,
    thumbnailUrl,
    price,
    priceCurrency,
    category,
    rating,
    reviewCount,
    favorites,
    description,
    keywords,
    fileSize: fileSize || null,
    latestVersion: latestVersion || null,
    unityVersion,
    releaseDate: releaseDate || null,
    license,
  };
}

// ── Thumbnail download ──

async function downloadThumbnail(
  thumbnailUrl: string,
  packageId: string
): Promise<string | null> {
  try {
    const response = await fetch(thumbnailUrl);
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = thumbnailUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
    const filePath = `${THUMBNAILS_DIR}/${packageId}.${ext}`;
    await writeFile(filePath, buffer);
    return filePath;
  } catch {
    return null;
  }
}

// ── Parallel worker pool ──

async function processInParallel<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number,
  delayMs: number
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    while (nextIndex < items.length) {
      if (shuttingDown) return;
      const index = nextIndex++;
      const result = await worker(items[index], index);
      results[index] = result;
      if (delayMs > 0) await sleep(delayMs);
    }
  }

  const workers = Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(() => runNext());
  await Promise.all(workers);

  return results;
}

// ── Main ──

async function main() {
  console.log("=== Unity Asset Store Detail Scraper ===\n");

  // 1. Load input
  const entries: InputEntry[] = JSON.parse(await readFile(INPUT_FILE, "utf-8"));
  console.log(`Input: ${entries.length} assets`);

  // 2. Load progress
  await loadProgress();

  // 3. Create thumbnails directory
  await mkdir(THUMBNAILS_DIR, { recursive: true });

  // 4. Build processing lists
  const processedSet = new Set(progress.processedIds);
  const failedIds = new Set(progress.failed.map((f) => f.packageId));

  // Items to process: not yet processed OR previously failed
  const toProcess = entries.filter((e) => {
    const id = extractPackageId(e.url);
    return !processedSet.has(id) || failedIds.has(id);
  });

  // Remove previously failed entries that will be retried
  if (failedIds.size > 0) {
    progress.failed = progress.failed.filter(
      (f) => !entries.some((e) => extractPackageId(e.url) === f.packageId)
    );
  }

  console.log(`\nPhase 1: Fetch & Parse (${toProcess.length} remaining)\n`);

  // 5. Phase 1: Fetch pages
  let processedCount = 0;
  const lastCheckpoint = { count: 0 };

  await processInParallel(
    toProcess,
    async (entry, _index) => {
      if (shuttingDown) return;

      const packageId = extractPackageId(entry.url);
      const num = ++processedCount;
      const total = toProcess.length;

      try {
        const html = await fetchAssetPage(entry.url);
        const detail = parseAssetPage(html, entry);

        // Remove from failed if it was there
        progress.failed = progress.failed.filter((f) => f.packageId !== packageId);

        // Add to completed (replace if exists)
        progress.completed = progress.completed.filter(
          (c) => c.packageId !== packageId
        );
        progress.completed.push(detail);

        if (!progress.processedIds.includes(packageId)) {
          progress.processedIds.push(packageId);
        }

        console.log(
          `  [${num}/${total}] ${entry.asset} - OK (price: ${detail.price || "free"})`
        );
      } catch (err: any) {
        const failedEntry: FailedEntry = {
          asset: entry.asset,
          publisher: entry.publisher,
          url: entry.url,
          packageId,
          error: err.message,
        };
        const statusMatch = err.message.match(/HTTP_(\d+)/);
        if (statusMatch) failedEntry.httpStatus = parseInt(statusMatch[1]);

        progress.failed.push(failedEntry);
        if (!progress.processedIds.includes(packageId)) {
          progress.processedIds.push(packageId);
        }

        console.log(`  [${num}/${total}] ${entry.asset} - FAILED: ${err.message}`);
      }

      // Checkpoint
      if (processedCount - lastCheckpoint.count >= CHECKPOINT_INTERVAL) {
        lastCheckpoint.count = processedCount;
        await saveProgress(progress);
      }
    },
    CONCURRENCY,
    DELAY_MS
  );

  await saveProgress(progress);
  console.log(
    `\nPhase 1 done: ${progress.completed.length} completed, ${progress.failed.length} failed\n`
  );

  // 6. Phase 2: Download thumbnails
  const thumbnailsDoneSet = new Set(progress.thumbnailsDone);
  const thumbnailsToDownload = progress.completed.filter(
    (d) => d.thumbnailUrl && !thumbnailsDoneSet.has(d.packageId)
  );

  console.log(
    `Phase 2: Download Thumbnails (${thumbnailsToDownload.length} remaining)\n`
  );

  let thumbCount = 0;
  const thumbCheckpoint = { count: 0 };

  await processInParallel(
    thumbnailsToDownload,
    async (detail, _index) => {
      if (shuttingDown) return;

      const num = ++thumbCount;
      const total = thumbnailsToDownload.length;

      const localPath = await downloadThumbnail(
        detail.thumbnailUrl!,
        detail.packageId
      );
      detail.thumbnail = localPath;

      if (!progress.thumbnailsDone.includes(detail.packageId)) {
        progress.thumbnailsDone.push(detail.packageId);
      }

      if (localPath) {
        console.log(`  [${num}/${total}] ${detail.packageId} - saved`);
      } else {
        console.log(`  [${num}/${total}] ${detail.packageId} - download failed`);
      }

      // Checkpoint
      if (thumbCount - thumbCheckpoint.count >= CHECKPOINT_INTERVAL) {
        thumbCheckpoint.count = thumbCount;
        await saveProgress(progress);
      }
    },
    CONCURRENCY,
    0
  );

  await saveProgress(progress);
  console.log(`\nPhase 2 done.\n`);

  // 7. Phase 3: Output
  // Also set thumbnail paths for already-downloaded thumbnails
  for (const detail of progress.completed) {
    if (!detail.thumbnail && thumbnailsDoneSet.has(detail.packageId)) {
      // Check what extension was used
      for (const ext of ["jpg", "jpeg", "png", "webp"]) {
        const path = `${THUMBNAILS_DIR}/${detail.packageId}.${ext}`;
        if (existsSync(path)) {
          detail.thumbnail = path;
          break;
        }
      }
    }
  }

  // Sort by publisher then asset name
  const sorted = progress.completed.sort((a, b) => {
    const pubCmp = a.publisher.localeCompare(b.publisher);
    if (pubCmp !== 0) return pubCmp;
    return a.asset.localeCompare(b.asset);
  });

  await writeFile(OUTPUT_FILE, JSON.stringify(sorted, null, 2));

  // Stats
  console.log("=== Results ===");
  console.log(`Total completed: ${progress.completed.length}`);
  console.log(`Total failed: ${progress.failed.length}`);
  console.log(
    `Thumbnails downloaded: ${progress.thumbnailsDone.length}`
  );

  const withPrice = progress.completed.filter((d) => d.price && d.price !== "0" && d.price !== "0.00");
  const free = progress.completed.filter((d) => !d.price || d.price === "0" || d.price === "0.00");
  console.log(`Paid assets: ${withPrice.length}`);
  console.log(`Free assets: ${free.length}`);

  const withRating = progress.completed.filter((d) => d.rating !== null);
  console.log(`With ratings: ${withRating.length}`);

  console.log(`\nOutput: ${OUTPUT_FILE}`);

  if (progress.failed.length > 0) {
    console.log(`\nFailed entries:`);
    const errorGroups = new Map<string, number>();
    for (const f of progress.failed) {
      const key = f.error;
      errorGroups.set(key, (errorGroups.get(key) || 0) + 1);
    }
    for (const [error, count] of errorGroups) {
      console.log(`  ${error}: ${count}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
