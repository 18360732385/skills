/**
 * Default inventory locations under target repo (no npm deps).
 */
import fs from "fs";
import path from "path";

export function defaultInventoryPath(root, domain, moduleName = null) {
  const base = path.join(root, "docs", domain, ".fill-work");
  if (domain === "api" && moduleName) {
    return path.join(base, `inventory-${moduleName}.json`);
  }
  return path.join(base, "inventory.json");
}

/** Discover inventory JSON files for a domain. */
export function discoverInventories(root, domain) {
  const dir = path.join(root, "docs", domain, ".fill-work");
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (!/^inventory(-[\w.-]+)?\.json$/i.test(name)) continue;
    out.push(path.join(dir, name));
  }
  return out.sort();
}

export function loadJsonSafe(p) {
  if (!p || !fs.existsSync(p)) return null;
  try {
    let raw = fs.readFileSync(p, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Dedupe key for an API inventory endpoint (0.2.29+). */
export function endpointDedupeKey(ep) {
  if (!ep || typeof ep !== "object") return "";
  const ev = String(ep.evidence || "")
    .replace(/\\/g, "/")
    .trim();
  if (ev) return `ev:${ev}`;
  const method = String(ep.method || ep.httpMethod || "").toUpperCase();
  const p = String(ep.path || ep.url || "").trim();
  return `mp:${method}:${p}`;
}

/** Merge api inventories (multi-module) into one endpoints list; dedupe by evidence (0.2.29+). */
export function mergeApiInventories(root) {
  const files = discoverInventories(root, "api");
  if (!files.length) return null;
  const endpoints = [];
  const shards = [];
  const seen = new Set();
  let module = null;
  let dupSkipped = 0;
  for (const f of files) {
    const j = loadJsonSafe(f);
    if (!j || !Array.isArray(j.endpoints)) continue;
    if (!module && j.module) module = j.module;
    for (const ep of j.endpoints) {
      const k = endpointDedupeKey(ep);
      if (k && seen.has(k)) {
        dupSkipped++;
        continue;
      }
      if (k) seen.add(k);
      endpoints.push(ep);
    }
    if (Array.isArray(j.shards)) shards.push(...j.shards);
  }
  if (!endpoints.length) return null;
  return {
    ok: true,
    root,
    module,
    endpoints,
    shards,
    deduped: true,
    dup_skipped: dupSkipped,
    sources: files.map((f) => path.relative(root, f).replace(/\\/g, "/")),
  };
}

export function loadDomainInventory(root, domain) {
  if (domain === "api") return mergeApiInventories(root);
  const files = discoverInventories(root, domain);
  if (!files.length) return null;
  // Prefer merged inventory.json; else merge module inventories for func
  const preferred = files.find((f) => /inventory\.json$/i.test(path.basename(f)));
  if (preferred) return loadJsonSafe(preferred);
  if (domain === "func" && files.length > 1) {
    const modules = [];
    for (const f of files) {
      const j = loadJsonSafe(f);
      if (!j) continue;
      if (Array.isArray(j.modules)) modules.push(...j.modules);
    }
    if (modules.length) {
      return {
        ok: true,
        root,
        modules,
        stats: {
          modules: modules.length,
          services: modules.reduce((n, m) => n + (m.services?.length || 0), 0),
        },
      };
    }
  }
  if (domain === "jobs" && files.length > 1) {
    const tasks = [];
    for (const f of files) {
      const j = loadJsonSafe(f);
      if (j && Array.isArray(j.tasks)) tasks.push(...j.tasks);
    }
    if (tasks.length) return { ok: true, root, tasks, stats: { tasks: tasks.length } };
  }
  return loadJsonSafe(files[0]);
}
