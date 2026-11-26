/**
 * Frontend + inventory-scan domain helpers (0.8.0+).
 *
 * Official coverage_by_domain includes design/prototype/pages/components/client-api.
 * 0.8.5: gate ratio = truths/assets (real asset coverage). Do not treat one truth
 * page as domain-level 100%. Scaffold templates under /templates/ are excluded
 * from the numerator; business filenames containing "template" still count.
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

/**
 * @param {{ truths: number, assets: number }} input
 * @returns {object|null} coverage row, or null when the domain has no assets
 */
export function buildFrontendCoverageRow({ truths, assets }) {
  const truthCount = Number(truths) || 0;
  const assetCount = Number(assets) || 0;
  if (!(assetCount > 0)) return null;
  const ratio = Math.min(truthCount / assetCount, 1);
  const rounded = Math.round(ratio * 1000) / 1000;
  return {
    covered: truthCount,
    code: assetCount,
    ratio: rounded,
    percent: Math.round(rounded * 100),
    unit: "asset",
    truths: truthCount,
    inventory_assets: assetCount,
    asset_ratio: rounded,
    source: "asset_ratio",
    note: "frontend coverage is truths/assets; gold target 1.0 requires full asset docs",
  };
}
