/**
 * Frontend + inventory-scan domain helpers (0.8.1 patch).
 *
 * Official coverage_by_domain includes design/prototype/pages/components/client-api.
 * 0.8.1 frontend truths are domain-level pages (shell / core flows), not one
 * markdown file per inventory asset. The gold gate therefore uses a domain-
 * documented ratio (truths exist when assets exist). Asset counts stay on the
 * row as inventory_assets / truths / asset_ratio so the gap is visible.
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

/** Skip index-adjacent README and templates under docs/<domain>/modules/. */
export function isFrontendTruthFile(filePath) {
  const base = String(filePath || "").replace(/\\/g, "/").split("/").pop() || "";
  if (/^README(?:\.[A-Za-z0-9]+)?\.md$/i.test(base)) return false;
  if (/template/i.test(base)) return false;
  return /\.md$/i.test(base);
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
  const covered = truthCount > 0 ? 1 : 0;
  const assetRatio = assetCount ? truthCount / assetCount : 0;
  return {
    covered,
    code: 1,
    ratio: covered,
    percent: covered * 100,
    unit: "domain",
    truths: truthCount,
    inventory_assets: assetCount,
    asset_ratio: Math.round(Math.min(assetRatio, 1) * 1000) / 1000,
    source: "domain_documented",
    note: "frontend coverage is domain-level truths, not 1:1 inventory assets",
  };
}
