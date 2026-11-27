/**
 * Gold identity: inventory unit ids must match primary-slot citations in SSOT.
 * Prose mentions outside those slots are ignored. Func stops at class names.
 */
import { loadDomainInventory } from "./inventory-paths.mjs";
import {
  isFrontendCoverageDomain,
  assetNeedles,
  textHasNeedle,
  stripChangelogSections,
} from "./frontend-coverage.mjs";

/** Service / Component / Manager / Handler, optional Spring Impl suffix (0.8.9). */
export function newFuncClassRe() {
  return /\b([A-Z][A-Za-z0-9]+(?:Service|Component|Manager|Handler)(?:Impl)?)\b/g;
}

export function textMentionsUnits(domain, text, units, assets) {
  if (!units) return true;
  if (!units.length) return false;
  if (isFrontendCoverageDomain(domain)) {
    const wanted = (assets || []).filter((a) => a && units.includes(String(a.id)));
    return wanted.some((a) => assetNeedles(a).some((n) => textHasNeedle(text, n)));
  }
  const cited = citedUnitIds(domain, text);
  if (domain === "db") {
    const allow = new Set(units.map((u) => String(u).toLowerCase()));
    return cited.some((id) => allow.has(String(id).toLowerCase()));
  }
  return cited.some((id) => units.includes(id));
}

export function apiUnitId(http, rawPath) {
  const method = String(http || "GET").trim().toUpperCase();
  let p = String(rawPath || "").trim().replace(/\\/g, "/");
  p = p.replace(/[),.;]+$/g, "");
  const q = p.indexOf("?");
  if (q >= 0) p = p.slice(0, q);
  if (p && !p.startsWith("/")) p = "/" + p;
  if (!p) return "";
  return `${method} ${p}`;
}

function stripChangelog(text) {
  return stripChangelogSections(text);
}

export function apiUnitsFromText(text) {
  const ids = [];
  const parts = stripChangelog(text).split(/(?=^##\s)/m);
  for (const sec of parts) {
    if (/^##(?!#)[^\n]*变更记录/.test(sec)) continue;
    const pathM = sec.match(/接口地址[^\n]{0,80}?(\/[A-Za-z0-9_./{}*-]+)/);
    if (!pathM) continue;
    const methodM = sec.match(/请求方式[^\n]{0,40}?(GET|POST|PUT|DELETE|PATCH)\b/i);
    const id = apiUnitId(methodM ? methodM[1] : "GET", pathM[1]);
    if (id) ids.push(id);
  }
  return ids;
}

function classNamesFromFunc(text) {
  const body = stripChangelog(text);
  const names = new Set();
  const sec = body.match(/###\s*服务类[\s\S]*?(?=\n###\s|\n##\s|$)/);
  const scope = sec ? sec[0] : "";
  const CLASS_RE = newFuncClassRe();
  for (const line of scope.split(/\n/)) {
    if (!line.trim().startsWith("|")) continue;
    CLASS_RE.lastIndex = 0;
    for (const m of line.matchAll(CLASS_RE)) names.add(m[1]);
  }
  for (const line of body.split(/\n/)) {
    if (!/^\*\*[A-Z]/.test(line.trim()) && !/^###\s+/.test(line)) continue;
    CLASS_RE.lastIndex = 0;
    for (const m of line.matchAll(CLASS_RE)) names.add(m[1]);
  }
  return [...names];
}

function tableNamesFromDb(text) {
  const body = stripChangelog(text);
  const ids = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?([A-Za-z_][A-Za-z0-9_]*)[`"]?/gi;
  for (const m of body.matchAll(re)) {
    if (/^(?:IF|NOT|EXISTS)$/i.test(m[1])) continue;
    ids.push(m[1]);
  }
  return ids;
}

function redisPatternsFromText(text) {
  const body = stripChangelog(text);
  const sec = body.match(/##\s*Key 模式[\s\S]*?(?=\n##\s|$)/i);
  if (!sec) return [];
  const ids = [];
  for (const line of sec[0].split(/\n/)) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c && !/^:?-{2,}:?$/.test(c));
    if (!cells.length) continue;
    if (/^模式$/.test(cells[0])) {
      for (const t of cells.slice(1).join(" ").matchAll(/`([^`]+)`/g)) {
        const v = t[1].trim();
        if (v && v !== "—" && v !== "…" && !/^TODO/i.test(v)) ids.push(v);
      }
    } else {
      const m = cells[0].match(/^`([^`]+)`$/);
      if (m && m[1] !== "—" && m[1] !== "…") ids.push(m[1]);
    }
  }
  return ids;
}

function jobCodesFromText(text) {
  const body = stripChangelog(text);
  const sec = body.match(/##\s*标识[\s\S]*?(?=\n##\s|$)/);
  const scope = sec ? sec[0] : body;
  const ids = [];
  for (const line of scope.split(/\n/)) {
    const m = line.match(/\|\s*task_code\s*\|\s*`?([^|`]+)`?\s*\|/i);
    if (!m) continue;
    const v = m[1].trim();
    if (v && !/^\{/.test(v) && v !== "—" && !/^TODO/i.test(v)) ids.push(v);
  }
  return ids;
}

function frontendCited(assets, texts) {
  const cited = [];
  const extras = [];
  const needles = [];
  for (const asset of assets || []) {
    for (const n of assetNeedles(asset)) {
      needles.push(String(n).replace(/\\/g, "/"));
    }
  }
  const needleSet = new Set(needles);
  const joined = (texts || []).map((t) => stripChangelog(t.text || t)).join("\n");
  for (const asset of assets || []) {
    const ns = assetNeedles(asset);
    if (ns.some((n) => textHasNeedle(joined, n))) cited.push(String(asset.id));
  }
  for (const t of texts || []) {
    const raw = stripChangelog(t.text || t);
    const loc = raw.match(
      /##\s*(?:资产定位|页面定位|组件定位|端点消费)[\s\S]*?(?=\n##\s|$)/
    );
    if (!loc) continue;
    for (const m of loc[0].matchAll(/`([^`]+)`/g)) {
      const v = m[1].trim().replace(/\\/g, "/");
      if (v.length < 2 || v.startsWith("docs/")) continue;
      if (!v.includes("/") && !v.startsWith("@")) continue;
      const known = [...needleSet].some(
        (n) => v === n || v.endsWith("/" + n) || n.endsWith("/" + v) || n === v
      );
      if (!known) extras.push(v);
    }
  }
  return { cited, extras };
}

export function citedUnitIds(domain, text) {
  if (domain === "api") return apiUnitsFromText(text);
  if (domain === "func") return classNamesFromFunc(text);
  if (domain === "db") return tableNamesFromDb(text);
  if (domain === "redis") return redisPatternsFromText(text);
  if (domain === "jobs") return jobCodesFromText(text);
  return [];
}

function normId(domain, id) {
  const s = String(id || "").trim();
  if (domain === "db") return s.toLowerCase();
  if (domain === "api") return s.replace(/\s+/g, " ");
  return s;
}

export function inventoryUnitRows(domain, inv) {
  if (!inv || typeof inv !== "object") return [];
  if (domain === "api" && Array.isArray(inv.endpoints)) {
    return inv.endpoints
      .map((e) => {
        const id = apiUnitId(e.http || e.method, e.path);
        if (!id) return null;
        return {
          id,
          moduleHint: [e.module, e.package, e.evidence, e.controller].filter(Boolean).join(" "),
        };
      })
      .filter(Boolean);
  }
  if (domain === "func" && Array.isArray(inv.modules)) {
    const rows = [];
    for (const m of inv.modules) {
      for (const s of m.services || []) {
        const n = s.class || s.name || s.className;
        if (!n) continue;
        rows.push({ id: String(n), moduleHint: m.name || "" });
      }
    }
    return rows;
  }
  if (domain === "db" && Array.isArray(inv.tables)) {
    return inv.tables
      .map((t) => {
        const name = t.name || t.table;
        return name ? { id: String(name), moduleHint: "" } : null;
      })
      .filter(Boolean);
  }
  if (domain === "redis" && Array.isArray(inv.keys)) {
    return inv.keys
      .filter((k) => k && k.redis !== false)
      .map((k) => {
        const id = k.pattern || k.key;
        return id ? { id: String(id), moduleHint: "" } : null;
      })
      .filter(Boolean);
  }
  if (domain === "jobs" && Array.isArray(inv.tasks)) {
    return inv.tasks
      .map((t) => {
        const id = t.task_code || t.id;
        return id ? { id: String(id), moduleHint: "" } : null;
      })
      .filter(Boolean);
  }
  if (isFrontendCoverageDomain(domain) && Array.isArray(inv.assets)) {
    let assets = inv.assets;
    if (domain === "client-api") {
      assets = assets.filter((a) => a && a.kind !== "type_export");
    }
    return assets
      .map((a) => (a && a.id ? { id: String(a.id), moduleHint: a.path || a.route || "" } : null))
      .filter(Boolean);
  }
  return [];
}

function uniqueIds(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows || []) {
    const id = String(r && r.id != null ? r.id : "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function inventoryUnitIds(domain, inv) {
  return uniqueIds(inventoryUnitRows(domain, inv));
}

/** Map unit_id → inventory evidence path when the domain has a stable file path. */
export function inventoryExpectedEvidence(domain, inv) {
  const out = {};
  if (!inv || typeof inv !== "object") return out;
  if (isFrontendCoverageDomain(domain) && Array.isArray(inv.assets)) {
    let assets = inv.assets;
    if (domain === "client-api") {
      assets = assets.filter((a) => a && a.kind !== "type_export");
    }
    for (const a of assets) {
      if (!a || !a.id || !a.path) continue;
      const id = String(a.id);
      if (!out[id]) out[id] = String(a.path).replace(/\\/g, "/").replace(/^\.\//, "");
    }
  }
  return out;
}

export function listOrderedUnitIds(root, domain, modules) {
  const inv = loadDomainInventory(root, domain);
  if (!inv) return null;
  return uniqueIds(filterUnitRows(inventoryUnitRows(domain, inv), modules));
}

export function filterUnitRows(rows, modules) {
  if (!modules || !modules.length) return rows;
  const keys = modules
    .map((m) => String(m || "").trim())
    .filter((m) => m && !m.startsWith("("));
  if (!keys.length) return rows;
  const hit = rows.filter((r) => {
    const hay = `${r.moduleHint || ""} ${r.id}`.toLowerCase();
    return keys.some((m) => {
      const key = m.replace(/^sms-/, "").toLowerCase();
      return hay.includes(m.toLowerCase()) || (key && hay.includes(key));
    });
  });
  return hit.length ? hit : rows;
}

/**
 * @param {{ domain: string, inventory: object|null, files: {file?: string, text: string}[], units?: string[]|null }} input
 * @returns {{ id: string, domain: string, file: string, detail: string }[]}
 */
export function collectIdentityBlockers(input) {
  const domain = input.domain;
  const inv = input.inventory;
  if (!inv) return [];
  const files = input.files || [];
  const scope = Array.isArray(input.units) ? input.units.map((u) => normId(domain, u)) : null;
  const scopeSet = scope ? new Set(scope) : null;
  const invRows = inventoryUnitRows(domain, inv);
  const invIds = invRows.map((r) => normId(domain, r.id));
  const invSet = new Set(invIds);

  let cited = [];
  let extraNeedles = [];
  if (isFrontendCoverageDomain(domain)) {
    let assets = Array.isArray(inv.assets) ? inv.assets : [];
    if (domain === "client-api") {
      assets = assets.filter((a) => a && a.kind !== "type_export");
    }
    const inScopeFiles = scopeSet
      ? files.filter((f) => {
          const hit = assets.some((a) => {
            if (!scopeSet.has(normId(domain, a.id))) return false;
            return assetNeedles(a).some((n) => textHasNeedle(stripChangelog(f.text), n));
          });
          return hit;
        })
      : files;
    const mapped = frontendCited(assets, inScopeFiles.length ? inScopeFiles : files);
    cited = mapped.cited.map((id) => normId(domain, id));
    extraNeedles = scopeSet ? [] : mapped.extras;
    if (scopeSet) {
      const fromScoped = frontendCited(assets, inScopeFiles);
      extraNeedles = fromScoped.extras;
      cited = frontendCited(assets, files).cited.map((id) => normId(domain, id));
    }
  } else {
    const perFile = files.map((f) => ({
      file: f.file || "",
      ids: citedUnitIds(domain, f.text).map((id) => normId(domain, id)),
    }));
    const scopedFiles = scopeSet
      ? perFile.filter((f) => f.ids.some((id) => scopeSet.has(id)))
      : perFile;
    cited = perFile.flatMap((f) => f.ids);
    const extraFrom = scopeSet ? scopedFiles : perFile;
    for (const f of extraFrom) {
      for (const id of f.ids) {
        if (!invSet.has(id)) extraNeedles.push(id);
      }
    }
  }

  const citedSet = new Set(cited);
  const missingSource = scopeSet ? scope : invIds;
  const blockers = [];
  for (const id of missingSource) {
    if (scopeSet && !invSet.has(id)) {
      blockers.push({
        id: "coverage-identity-extra",
        domain,
        file: "(batch)",
        detail: `${id} is not in inventory`,
      });
      continue;
    }
    if (!citedSet.has(id)) {
      blockers.push({
        id: "coverage-identity-missing",
        domain,
        file: "(inventory)",
        detail: `${id} is not cited in SSOT`,
      });
    }
  }
  const seenExtra = new Set();
  for (const id of extraNeedles) {
    const key = normId(domain, id);
    if (seenExtra.has(key)) continue;
    if (invSet.has(key)) continue;
    seenExtra.add(key);
    blockers.push({
      id: "coverage-identity-extra",
      domain,
      file: "(ssot)",
      detail: `${id} is cited but not in inventory`,
    });
  }
  return blockers;
}
