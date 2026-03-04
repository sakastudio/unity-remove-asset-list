import { chromium, type Browser, type Page } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InputAsset {
  asset: string;
  publisher: string;
}

interface ResolvedAsset {
  asset: string;
  publisher: string;
  url: string;
}

interface FailedAsset {
  asset: string;
  publisher: string;
  error: string;
}

interface Progress {
  resolved: ResolvedAsset[];
  failed: FailedAsset[];
  processedPublishers: string[];
  coveoUrl?: string;
  coveoToken?: string;
  coveoBodyTemplate?: any;
  startedAt: string;
  lastUpdatedAt: string;
}

interface CoveoSession {
  url: string;
  token: string;
  bodyTemplate: any;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const INPUT_FILE = "assets_being_removed_march_31st.json";
const PROGRESS_FILE = "progress.json";
const RESULTS_FILE = "results.json";
const REQUEST_DELAY_MS = 250;
const MAX_RETRIES = 3;
const COVEO_RESULTS_PER_PAGE = 200;

// ─── Progress Management ────────────────────────────────────────────────────

async function loadProgress(): Promise<Progress> {
  if (existsSync(PROGRESS_FILE)) {
    const data = await readFile(PROGRESS_FILE, "utf-8");
    return JSON.parse(data);
  }
  return {
    resolved: [],
    failed: [],
    processedPublishers: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

async function saveProgress(progress: Progress): Promise<void> {
  progress.lastUpdatedAt = new Date().toISOString();
  await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ─── Coveo Session Extraction ───────────────────────────────────────────────

async function extractCoveoSession(): Promise<CoveoSession> {
  console.log("[Coveo] Launching browser to extract API session...");
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  let session: CoveoSession | null = null;

  page.on("request", (request) => {
    const url = request.url();
    if (url.includes(".coveo.com/rest/search")) {
      const headers = request.headers();
      const authHeader = headers["authorization"] || "";
      const token = authHeader.replace("Bearer ", "");

      try {
        const bodyTemplate = JSON.parse(request.postData() || "{}");
        if (token && bodyTemplate.context) {
          session = { url, token, bodyTemplate };
          console.log(`[Coveo] Captured API URL: ${url}`);
          console.log(`[Coveo] Token: ${token.substring(0, 20)}...`);
        }
      } catch {}
    }
  });

  try {
    await page.goto("https://assetstore.unity.com/?q=test", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    if (!session) {
      await page.waitForTimeout(5000);
    }
  } catch {
    console.log("[Coveo] Page load timeout, checking if session was captured...");
  }

  await browser.close();

  if (!session) {
    throw new Error("Failed to extract Coveo session.");
  }

  return session;
}

// ─── Coveo Search ───────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function coveoSearch(
  session: CoveoSession,
  query: string,
  advancedQuery: string,
  numberOfResults: number = 10
): Promise<any[]> {
  // Clone the template and override search-specific fields
  const body = {
    ...session.bodyTemplate,
    q: query,
    aq: advancedQuery || undefined,
    numberOfResults,
    firstResult: 0,
    enableQuerySyntax: advancedQuery ? true : false,
  };
  // Remove facets to speed up response
  delete body.facets;
  delete body.facetOptions;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(session.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("TOKEN_EXPIRED");
      }

      if (response.status === 429) {
        console.log("[Coveo] Rate limited, waiting 60 seconds...");
        await sleep(60000);
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (e: any) {
      if (e.message === "TOKEN_EXPIRED") throw e;
      if (attempt === MAX_RETRIES - 1) throw e;
      const backoff = Math.pow(2, attempt) * 1000;
      console.log(`[Coveo] Retry ${attempt + 1}/${MAX_RETRIES} after ${backoff}ms...`);
      await sleep(backoff);
    }
  }
  return [];
}

// ─── Matching ───────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s\u3000-\u9fff\uf900-\ufaff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titlesMatch(expected: string, found: string): boolean {
  const a = normalize(expected);
  const b = normalize(found);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aNoSpace = a.replace(/\s/g, "");
  const bNoSpace = b.replace(/\s/g, "");
  if (aNoSpace === bNoSpace) return true;
  return false;
}

function extractUrl(result: any): string | null {
  const clickUri = result.clickUri || "";
  if (clickUri.includes("assetstore.unity.com/packages/")) {
    return clickUri;
  }
  const productId =
    result.raw?.ec_product_id?.[0] || result.raw?.permanentid || "";
  if (productId) {
    return `https://assetstore.unity.com/packages/package/${productId}`;
  }
  return null;
}

// ─── Publisher Processing ───────────────────────────────────────────────────

async function processPublisher(
  session: CoveoSession,
  publisher: string,
  assets: InputAsset[],
  progress: Progress
): Promise<void> {
  const resolvedSet = new Set(
    progress.resolved.map((r) => `${r.asset}|||${r.publisher}`)
  );

  // Batch search by publisher name
  const aq = `@publisher_name=="${publisher}"`;
  const results = await coveoSearch(session, "", aq, COVEO_RESULTS_PER_PAGE);
  await sleep(REQUEST_DELAY_MS);

  const unmatched: InputAsset[] = [];

  for (const asset of assets) {
    const key = `${asset.asset}|||${asset.publisher}`;
    if (resolvedSet.has(key)) continue;

    let found = false;
    for (const result of results) {
      const title = result.title || "";
      if (titlesMatch(asset.asset, title)) {
        const url = extractUrl(result);
        if (url) {
          progress.resolved.push({ asset: asset.asset, publisher: asset.publisher, url });
          resolvedSet.add(key);
          console.log(`  OK: "${asset.asset}" -> ${url}`);
          found = true;
          break;
        }
      }
    }

    if (!found) {
      unmatched.push(asset);
    }
  }

  // Individual search for unmatched
  for (const asset of unmatched) {
    const key = `${asset.asset}|||${asset.publisher}`;
    if (resolvedSet.has(key)) continue;

    // Search with asset name + publisher filter
    const individualResults = await coveoSearch(session, asset.asset, aq, 10);
    await sleep(REQUEST_DELAY_MS);

    let found = false;
    for (const result of individualResults) {
      const title = result.title || "";
      if (titlesMatch(asset.asset, title)) {
        const url = extractUrl(result);
        if (url) {
          progress.resolved.push({ asset: asset.asset, publisher: asset.publisher, url });
          resolvedSet.add(key);
          console.log(`  OK: "${asset.asset}" -> ${url}`);
          found = true;
          break;
        }
      }
    }

    if (!found) {
      // Broad search without publisher filter
      const broadResults = await coveoSearch(session, asset.asset, "", 10);
      await sleep(REQUEST_DELAY_MS);

      for (const result of broadResults) {
        const title = result.title || "";
        const resultPub = result.raw?.publisher_name || "";
        if (titlesMatch(asset.asset, title) && normalize(resultPub).includes(normalize(publisher))) {
          const url = extractUrl(result);
          if (url) {
            progress.resolved.push({ asset: asset.asset, publisher: asset.publisher, url });
            resolvedSet.add(key);
            console.log(`  OK: "${asset.asset}" -> ${url} (broad)`);
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      console.log(`  MISS: "${asset.asset}"`);
      progress.failed.push({ asset: asset.asset, publisher: asset.publisher, error: "No match" });
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Unity Asset Store URL Finder ===\n");

  const inputData: InputAsset[] = JSON.parse(await readFile(INPUT_FILE, "utf-8"));
  console.log(`Input: ${inputData.length} assets`);

  const progress = await loadProgress();
  const resolvedSet = new Set(progress.resolved.map((r) => `${r.asset}|||${r.publisher}`));
  console.log(`Progress: ${progress.resolved.length} resolved, ${progress.failed.length} failed`);

  // Deduplicate
  const seen = new Set<string>();
  const uniqueAssets = inputData.filter((item) => {
    const key = `${item.asset}|||${item.publisher}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`Unique assets: ${uniqueAssets.length}`);

  // Group by publisher, skip resolved
  const publisherGroups = new Map<string, InputAsset[]>();
  for (const item of uniqueAssets) {
    if (resolvedSet.has(`${item.asset}|||${item.publisher}`)) continue;
    const group = publisherGroups.get(item.publisher) || [];
    group.push(item);
    publisherGroups.set(item.publisher, group);
  }

  // Skip fully processed publishers
  const processedSet = new Set(progress.processedPublishers);
  for (const pub of processedSet) {
    const group = publisherGroups.get(pub);
    if (group) {
      const unresolved = group.filter((a) => !resolvedSet.has(`${a.asset}|||${a.publisher}`));
      if (unresolved.length === 0) publisherGroups.delete(pub);
    }
  }

  const remainingPublishers = Array.from(publisherGroups.keys());
  const remainingCount = Array.from(publisherGroups.values()).reduce((s, g) => s + g.length, 0);
  console.log(`Remaining: ${remainingCount} assets across ${remainingPublishers.length} publishers\n`);

  if (remainingCount === 0) {
    console.log("All assets already processed!");
    await writeResults(progress);
    return;
  }

  // Get Coveo session
  let session: CoveoSession;
  if (progress.coveoToken && progress.coveoUrl && progress.coveoBodyTemplate) {
    session = {
      url: progress.coveoUrl,
      token: progress.coveoToken,
      bodyTemplate: progress.coveoBodyTemplate,
    };
    console.log("[Coveo] Reusing cached session");

    // Validate token is still valid
    try {
      const test = await coveoSearch(session, "test", "", 1);
      if (test.length === 0) throw new Error("Empty result");
    } catch {
      console.log("[Coveo] Cached token invalid, refreshing...");
      session = await extractCoveoSession();
      progress.coveoUrl = session.url;
      progress.coveoToken = session.token;
      progress.coveoBodyTemplate = session.bodyTemplate;
      await saveProgress(progress);
    }
  } else {
    session = await extractCoveoSession();
    progress.coveoUrl = session.url;
    progress.coveoToken = session.token;
    progress.coveoBodyTemplate = session.bodyTemplate;
    await saveProgress(progress);
  }

  // Process publishers
  let processedCount = 0;
  const totalPublishers = remainingPublishers.length;

  for (const publisher of remainingPublishers) {
    const assets = publisherGroups.get(publisher)!;
    processedCount++;
    console.log(`[${processedCount}/${totalPublishers}] Publisher: "${publisher}" (${assets.length} assets)`);

    try {
      await processPublisher(session, publisher, assets, progress);
    } catch (e: any) {
      if (e.message === "TOKEN_EXPIRED") {
        console.log("[Coveo] Token expired, refreshing...");
        try {
          session = await extractCoveoSession();
          progress.coveoUrl = session.url;
          progress.coveoToken = session.token;
          progress.coveoBodyTemplate = session.bodyTemplate;
          await processPublisher(session, publisher, assets, progress);
        } catch (e2: any) {
          console.error(`[Coveo] Refresh failed: ${e2.message}`);
          for (const asset of assets) {
            progress.failed.push({ asset: asset.asset, publisher: asset.publisher, error: "Token refresh failed" });
          }
        }
      } else {
        console.error(`  Error: ${e.message}`);
        for (const asset of assets) {
          if (!resolvedSet.has(`${asset.asset}|||${asset.publisher}`)) {
            progress.failed.push({ asset: asset.asset, publisher: asset.publisher, error: e.message });
          }
        }
      }
    }

    progress.processedPublishers.push(publisher);
    await saveProgress(progress);
  }

  // Retry failed with individual search (no publisher filter)
  const failedToRetry = [...progress.failed];
  if (failedToRetry.length > 0) {
    console.log(`\n=== Retrying ${failedToRetry.length} failed assets ===\n`);
    progress.failed = [];

    for (let i = 0; i < failedToRetry.length; i++) {
      const item = failedToRetry[i];
      console.log(`  [${i + 1}/${failedToRetry.length}] "${item.asset}" by "${item.publisher}"`);

      try {
        const results = await coveoSearch(session, item.asset, "", 20);
        let found = false;

        // Strict: title + publisher match
        for (const result of results) {
          const title = result.title || "";
          const pub = result.raw?.publisher_name || "";
          if (titlesMatch(item.asset, title) && normalize(pub).includes(normalize(item.publisher))) {
            const url = extractUrl(result);
            if (url) {
              progress.resolved.push({ asset: item.asset, publisher: item.publisher, url });
              console.log(`    -> ${url}`);
              found = true;
              break;
            }
          }
        }

        // Loose: title only
        if (!found) {
          for (const result of results) {
            if (titlesMatch(item.asset, result.title || "")) {
              const url = extractUrl(result);
              if (url) {
                progress.resolved.push({ asset: item.asset, publisher: item.publisher, url });
                console.log(`    -> ${url} (fuzzy)`);
                found = true;
                break;
              }
            }
          }
        }

        if (!found) progress.failed.push(item);
      } catch (e: any) {
        if (e.message === "TOKEN_EXPIRED") {
          session = await extractCoveoSession();
          progress.coveoToken = session.token;
          progress.coveoUrl = session.url;
          progress.coveoBodyTemplate = session.bodyTemplate;
          i--;
          continue;
        }
        progress.failed.push({ ...item, error: e.message });
      }

      await sleep(REQUEST_DELAY_MS);
      if ((i + 1) % 50 === 0) await saveProgress(progress);
    }
    await saveProgress(progress);
  }

  await writeResults(progress);

  console.log("\n=== Done ===");
  console.log(`Resolved: ${progress.resolved.length}`);
  console.log(`Failed: ${progress.failed.length}`);
  if (progress.failed.length > 0) {
    console.log(`Failed assets are in ${PROGRESS_FILE}`);
  }
}

async function writeResults(progress: Progress): Promise<void> {
  const results = [...progress.resolved].sort((a, b) => {
    const c = a.publisher.localeCompare(b.publisher);
    return c !== 0 ? c : a.asset.localeCompare(b.asset);
  });

  const output = results.map(({ asset, publisher, url }) => ({ asset, publisher, url }));
  await writeFile(RESULTS_FILE, JSON.stringify(output, null, 2));
  console.log(`\nResults written to ${RESULTS_FILE} (${output.length} entries)`);
}

// ─── Entry Point ────────────────────────────────────────────────────────────

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
