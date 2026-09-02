/**
 * Contract domain registry loader (0.3.5+).
 * SSOT: templates/_meta/domains.yaml + domain-packs.yaml（L1 文件包）
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_PATH = path.join(SKILL_ROOT, "templates/_meta/domains.yaml");
const DEFAULT_PACKS_PATH = path.join(SKILL_ROOT, "templates/_meta/domain-packs.yaml");

const FALLBACK_CORE = ["api", "func", "db", "redis"];

/** Minimal YAML subset for domains.yaml (no npm). */
export function parseDomainsYaml(raw) {
  const domains = {};
  let cur = null;
  let inDomains = false;
  let inPacks = false;
  for (const line of String(raw || "").split(/\r?\n/)) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    if (/^domains:\s*$/.test(line)) {
      inDomains = true;
      inPacks = false;
      continue;
    }
    if (/^packs:\s*$/.test(line)) {
      inDomains = false;
      inPacks = true;
      cur = null;
      continue;
    }
    if (inPacks) continue;
    if (!inDomains) continue;
    const head = line.match(/^  ([a-z0-9_-]+):\s*$/);
    if (head) {
      cur = head[1];
      domains[cur] = { id: cur };
      continue;
    }
    if (!cur) continue;
    const kv = line.match(/^    ([a-z0-9_]+):\s*(.+)\s*$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (val === "true" || val === "false") {
      val = val === "true";
    } else if (/^-?\d+(\.\d+)?$/.test(val)) {
      val = Number(val);
    } else {
      val = val.replace(/^["']|["']$/g, "");
    }
    domains[cur][key] = val;
  }
  return domains;
}

/**
 * Parse domain-packs.yaml → { domainId: [ {id,ladder,domain,template,target,placeholders[]} ] }
 */
export function parseDomainPacksYaml(raw) {
  const out = {};
  let curDomain = null;
  let curItem = null;
  for (const line of String(raw || "").split(/\r?\n/)) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    if (/^version:/.test(line)) continue;
    const dom = line.match(/^([a-z0-9_-]+):\s*$/);
    if (dom) {
      curDomain = dom[1];
      out[curDomain] = out[curDomain] || [];
      curItem = null;
      continue;
    }
    const item = line.match(/^  - id:\s*(.+)\s*$/);
    if (item && curDomain) {
      curItem = { id: item[1].trim().replace(/^["']|["']$/g, "") };
      out[curDomain].push(curItem);
      continue;
    }
    if (!curItem) continue;
    const kv = line.match(/^    ([a-z0-9_]+):\s*(.+)\s*$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, "");
    }
    curItem[key] = val;
  }
  return out;
}

export function loadDomainRegistry(registryPath = DEFAULT_PATH) {
  if (!fs.existsSync(registryPath)) {
    return Object.fromEntries(
      FALLBACK_CORE.map((id) => [
        id,
        {
          id,
          kind: "contract",
          index: `${id}.md`,
          truths_dir: id === "db" ? "table" : id === "redis" ? "keys" : "modules",
          weight: { api: 0.35, func: 0.25, db: 0.25, redis: 0.15 }[id],
          morph_cap: { api: 75, func: 70, db: 80, redis: 75 }[id],
          optional: id === "redis",
        },
      ])
    );
  }
  return parseDomainsYaml(fs.readFileSync(registryPath, "utf8"));
}

export function loadDomainPacks(packsPath = DEFAULT_PACKS_PATH) {
  if (!fs.existsSync(packsPath)) return {};
  return parseDomainPacksYaml(fs.readFileSync(packsPath, "utf8"));
}

/**
 * Expand L1 pack entries for selected domains (ladder-aware).
 * @returns {Array} same shape as manifest file entries
 */
export function expandDomainPackEntries(selectedDomains, { ladder = "L1" } = {}) {
  const LADDER_ORD = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4, L5: 5 };
  const maxOrd = LADDER_ORD[ladder] ?? 1;
  if (maxOrd < 1) return [];
  const packs = loadDomainPacks();
  const files = [];
  for (const d of selectedDomains || []) {
    const list = packs[d] || [];
    for (const e of list) {
      const ord = LADDER_ORD[e.ladder || "L1"];
      if (ord == null || ord > maxOrd) continue;
      files.push({
        id: String(e.id),
        ladder: e.ladder || "L1",
        template: e.template,
        target: e.target,
        domain: e.domain || d,
        optional: false,
        placeholders: Array.isArray(e.placeholders) ? e.placeholders : undefined,
        when: {},
      });
    }
  }
  return files;
}

export function knownContractDomainIds(registry = loadDomainRegistry()) {
  return Object.keys(registry).filter((id) => {
    const k = registry[id]?.kind;
    return !k || k === "contract";
  });
}

/** Default CLI / init domain list = registry contract ids (no hardcoded tuple). */
export function defaultContractDomains(registry = loadDomainRegistry()) {
  const ids = knownContractDomainIds(registry);
  return ids.length ? ids : [...FALLBACK_CORE];
}

/** docs/<domain>/<truths_dir> under target root */
export function truthsPath(root, domain, registry = loadDomainRegistry()) {
  return path.join(root, "docs", domain, truthsSubdir(domain, registry));
}

/** docs/<domain>/.fill-work */
export function fillWorkPath(root, domain) {
  return path.join(root, "docs", domain, ".fill-work");
}

/** Human label for merge headers / reports */
export function domainLabel(domain, registry = loadDomainRegistry()) {
  const meta = registry[domain];
  if (meta?.label) return String(meta.label);
  const fallback = {
    api: "API",
    func: "Service",
    db: "DB Table",
    redis: "Redis Key",
    jobs: "Job Task",
  };
  return fallback[domain] || domain;
}

/** Detect contract domain from a file path under docs/ */
export function detectDomainFromPath(filePath, registry = loadDomainRegistry()) {
  const n = String(filePath || "").replace(/\\/g, "/");
  for (const d of knownContractDomainIds(registry)) {
    if (n.includes(`/docs/${d}/`)) return d;
  }
  return null;
}

/**
 * Resolve which domains to score / seed.
 * Priority: CLI --domains > meta.domains > disk docs/{id} ∩ registry
 */
export function resolveScoreDomains({
  cliDomains,
  metaDomains,
  root,
  registry = loadDomainRegistry(),
} = {}) {
  const known = knownContractDomainIds(registry);
  if (Array.isArray(cliDomains) && cliDomains.length) {
    return cliDomains.filter((d) => known.includes(d));
  }
  if (Array.isArray(metaDomains) && metaDomains.length) {
    return metaDomains.filter((d) => known.includes(d));
  }
  if (root) {
    const present = known.filter((d) => {
      const idx = registry[d]?.index || `${d}.md`;
      return fs.existsSync(path.join(root, "docs", d, idx));
    });
    if (present.length) return present;
  }
  return FALLBACK_CORE.filter((d) => known.includes(d));
}

/** Renormalize weights for the active domain set. */
export function weightsForDomains(domainIds, registry = loadDomainRegistry()) {
  const raw = {};
  let sum = 0;
  for (const d of domainIds) {
    const w = Number(registry[d]?.weight);
    raw[d] = Number.isFinite(w) && w > 0 ? w : 0.1;
    sum += raw[d];
  }
  if (sum <= 0) {
    const eq = 1 / Math.max(1, domainIds.length);
    return Object.fromEntries(domainIds.map((d) => [d, eq]));
  }
  return Object.fromEntries(domainIds.map((d) => [d, raw[d] / sum]));
}

export function morphCapsForDomains(domainIds, registry = loadDomainRegistry()) {
  const out = {};
  for (const d of domainIds) {
    const c = Number(registry[d]?.morph_cap);
    out[d] = Number.isFinite(c) ? c : 75;
  }
  return out;
}

export function indexFileName(domain, registry = loadDomainRegistry()) {
  return registry[domain]?.index || `${domain}.md`;
}

export function truthsSubdir(domain, registry = loadDomainRegistry()) {
  return registry[domain]?.truths_dir || "modules";
}

/** Parse domains: list from harness-meta.yaml */
export function parseMetaDomains(raw) {
  if (!raw) return [];
  const flow = raw.match(/domains:\s*\[([^\]]*)\]/);
  if (flow) {
    return flow[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  const block = [];
  let inDom = false;
  for (const line of String(raw).split(/\r?\n/)) {
    if (/^domains:\s*$/.test(line)) {
      inDom = true;
      continue;
    }
    if (inDom) {
      const m = line.match(/^\s*-\s*["']?([a-z0-9_-]+)["']?\s*$/);
      if (m) block.push(m[1]);
      else if (/^\S/.test(line) && !/^\s*#/.test(line)) break;
    }
  }
  return block;
}
