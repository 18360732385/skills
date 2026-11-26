/**
 * Frontend + inventory-scan domain helpers (0.8.0+).
 *
 * Official coverage_by_domain includes design/prototype/pages/components/client-api.
 * 0.8.5: gate ratio = truths/assets when `mapped` is omitted.
 * 0.8.6: fill-score passes `mapped` (assets cited by a truth). Scaffold templates
 * under /templates/ are excluded from the numerator; business filenames
 * containing "template" still count.
 */
export const FRONTEND_COVERAGE_DOMAINS = [
  "design",
  "prototype",
  "pages",
  "components",
  "client-api",
];

export const INVENTORY_SCAN_DOMAINS = [
  "api",
  "func",
  "db",
  "redis",
  "jobs",
  ...FRONTEND_COVERAGE_DOMAINS,
];

/** Filter active contract domains down to those with an inventory scanner. */
export function inventoryScanDomains(activeDomains = INVENTORY_SCAN_DOMAINS) {
  const allow = new Set(INVENTORY_SCAN_DOMAINS);
  return (activeDomains || []).filter((d) => allow.has(d));
}

export function isFrontendCoverageDomain(domain) {
  return FRONTEND_COVERAGE_DOMAINS.includes(domain);
}

/**
 * Truth files that count toward frontend coverage numerator.
 * Skip README, docs/<domain>/templates/* scaffolds, and *-template.md scaffold names.
 * Business names like 19-desc-template-import.md still count.
 */
export function isFrontendTruthFile(filePath) {
  const norm = String(filePath || "").replace(/\\/g, "/");
  const base = norm.split("/").pop() || "";
  if (!/\.md$/i.test(base)) return false;
  if (/^README(?:\.[A-Za-z0-9]+)?\.md$/i.test(base)) return false;
  if (/\/templates\//i.test(norm)) return false;
  // scaffold basename only: template.md / foo-template.md (not mid-token business e.g. *-template-import.md)
  if (/^(?:.+-)?template\.md$/i.test(base)) return false;
  return true;
}

export function countFrontendTruths(files) {
  return (files || []).filter(isFrontendTruthFile).length;
}

function stripChangelogSections(text) {
  const parts = String(text || "").split(/(?=^##\s)/m);
  return parts.filter((p) => !/^##[^\n]*变更记录/m.test(p)).join("");
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Boundary match so `/home` does not hit `/homepage` and `arco` does not hit `barcode`. */
export function textHasNeedle(text, needle) {
  const n = String(needle || "").trim().replace(/\\/g, "/");
  if (n.length < 2) return false;
  const normText = String(text || "").replace(/\\/g, "/");
  const re = new RegExp(`(^|[^A-Za-z0-9_@./-])${escapeRe(n)}(?![A-Za-z0-9_@./-])`);
  return re.test(normText);
}

/** Needles a truth must cite for the asset to count as covered. */
export function assetNeedles(asset) {
  const a = asset || {};
  const out = [];
  if (a.path) out.push(String(a.path));
  if (a.route) out.push(String(a.route));
  if (a.url) out.push(String(a.url));
  if (a.dep) out.push(String(a.dep));
  return out.map((s) => s.trim()).filter((s) => s.length >= 2);
}

/**
 * @param {object[]} assets
 * @param {string[]} truthTexts
 * @returns {{ covered: number, unmatched: string[] }}
 */
export function countMappedAssets(assets, truthTexts) {
  const texts = (truthTexts || []).map((t) => stripChangelogSections(t));
  let covered = 0;
  const unmatched = [];
  for (const asset of assets || []) {
    const needles = assetNeedles(asset);
    const hit = needles.some((n) => texts.some((t) => textHasNeedle(t, n)));
    if (hit) covered++;
    else if (asset && asset.id) unmatched.push(String(asset.id));
  }
  return { covered, unmatched };
}

/**
 * @param {{ truths: number, assets: number, mapped?: number }} input
 * `mapped` omitted → ratio is truths/assets (0.8.5). `mapped` set → mapped/assets (0.8.6).
 * @returns {object|null} coverage row, or null when the domain has no assets
 */
export function buildFrontendCoverageRow({ truths, assets, mapped }) {
  const truthCount = Number(truths) || 0;
  const assetCount = Number(assets) || 0;
  if (!(assetCount > 0)) return null;
  const useMapped = mapped != null && mapped !== "";
  const coveredCount = useMapped ? Number(mapped) || 0 : truthCount;
  const ratio = Math.min(coveredCount / assetCount, 1);
  const rounded = Math.round(ratio * 1000) / 1000;
  const row = {
    covered: coveredCount,
    code: assetCount,
    ratio: rounded,
    percent: Math.round(rounded * 100),
    unit: "asset",
    truths: truthCount,
    inventory_assets: assetCount,
    asset_ratio: rounded,
    source: useMapped ? "mapped_assets" : "asset_ratio",
    note: useMapped
      ? "frontend coverage is mapped assets/assets; a truth counts only when it cites the asset path, route, url, or dep"
      : "frontend coverage is truths/assets; gold target 1.0 requires full asset docs",
  };
  if (useMapped) {
    row.mapped = coveredCount;
    row.unmapped = Math.max(assetCount - coveredCount, 0);
  }
  return row;
}
