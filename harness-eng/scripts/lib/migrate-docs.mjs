/**
 * 0.7.44: structured truth-doc migration for upgrade strictness (ready-regress).
 * Default AUTO on upgrade; opt-out via --no-migrate-docs.
 * Safe scope: path / field / task / schedule / key append-or-align.
 * Never auto-deletes user docs; coverage / covered_gt → skipped handoff only.
 * 0.7.47: optional --migrate-coverage=append|dry-run (default off) may append
 * missing pages/sections only. covered_gt never produces a delete op.
 * 0.7.48: thick truths → default dry-run; API path-prefix match; skip hollow ## 字段
 * when CREATE TABLE already covers columns.
 */
import fs from "fs";
import path from "path";
import {
  detectDbFieldDrift,
  detectApiFieldDrift,
  detectJobsTaskDrift,
  detectRedisKeyDrift,
  collectDocApiPaths,
  docCreateCoversColumns,
} from "./field-drift.mjs";
import { loadDomainInventory } from "./inventory-paths.mjs";
import { truthsPath, loadDomainRegistry } from "./domains.mjs";
import { endpointToMarkdown } from "./fill-auto-api.mjs";

export const MIGRATE_REPORT_REL = path.join(
  "docs",
  "harness-eng",
  "migrate-docs-report.json"
);

const SKIP_PREFIXES = [
  "coverage_ready",
  "covered_gt",
  "inventory_undercount",
];

function isSkipBlocker(b) {
  const s = String(b || "");
  return SKIP_PREFIXES.some((p) => s === p || s.includes(p));
}

/**
 * 0.7.48: thick / MATURE-ish truths — any contract NN-*.md with real body.
 * @param {string} root
 * @param {{ mature?: boolean }} [opts]
 * @returns {boolean}
 */
export function detectThickTruths(root, opts = {}) {
  if (opts.mature === true) return true;
  const abs = path.resolve(root);
  const reg = loadDomainRegistry();
  const domains = ["api", "db", "redis", "jobs", "func"];
  for (const d of domains) {
    let dir;
    try {
      dir = truthsPath(abs, d, reg);
    } catch {
      continue;
    }
    if (!dir || !fs.existsSync(dir)) continue;
    const files = [];
    function walk(p, depth = 0) {
      if (depth > 6 || !fs.existsSync(p)) return;
      for (const n of fs.readdirSync(p)) {
        if (/^README/i.test(n) || n === ".fill-work") continue;
        const fp = path.join(p, n);
        let st;
        try {
          st = fs.statSync(fp);
        } catch {
          continue;
        }
        if (st.isDirectory()) walk(fp, depth + 1);
        else if (/^\d+-.*\.md$/i.test(n)) files.push(fp);
      }
    }
    walk(dir);
    for (const f of files) {
      let text;
      try {
        text = fs.readFileSync(f, "utf8");
      } catch {
        continue;
      }
      if (/TODO\(harness-eng\)/i.test(text) && text.length < 800) continue;
      if (/CREATE\s+TABLE\s+/i.test(text)) return true;
      if (/\*\*接口地址[：:]?\*\*/i.test(text) && /`\/[^`]+`/.test(text)) return true;
      if (/^\|\s*`[^`]+`\s*\|/m.test(text) && /Key|TTL|前缀/i.test(text)) return true;
      const stripped = text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/^#+\s.*$/gm, "")
        .replace(/^\|.*\|$/gm, "")
        .trim();
      if (stripped.length > 400) return true;
    }
  }
  return false;
}

/**
 * Pick best api md for an endpoint path: longest shared prefix with documented paths,
 * else filename slug overlap; null → caller should create new file.
 * @param {string} epPath
 * @param {{ file: string, paths: Set<string>, slug: string }[]} indexed
 * @returns {string|null} abs file path
 */
export function pickApiDocForPath(epPath, indexed) {
  const p = String(epPath || "").trim();
  if (!p || !indexed?.length) return null;
  let best = null;
  let bestScore = 0;
  for (const item of indexed) {
    let score = 0;
    for (const dp of item.paths) {
      const pure = String(dp).includes(":")
        ? String(dp).slice(String(dp).indexOf(":") + 1)
        : String(dp);
      if (!pure.startsWith("/")) continue;
      // shared prefix length (segment-aware); ignore lone "api"/"v1" root
      const a = pure.split("/").filter(Boolean);
      const b = p.split("/").filter(Boolean);
      let i = 0;
      while (i < a.length && i < b.length && a[i] === b[i]) i++;
      const meaningful = i >= 2 || (i === 1 && !/^(api|v\d+|rest)$/i.test(a[0]));
      if (meaningful) score = Math.max(score, i);
    }
    const slugParts = String(item.slug || "")
      .toLowerCase()
      .split(/[-_]/)
      .filter((x) => x.length > 2 && !/^(api|module|modules)$/i.test(x));
    for (const s of slugParts) {
      if (p.toLowerCase().includes(s)) score = Math.max(score, 2);
    }
    if (score > bestScore) {
      bestScore = score;
      best = item.file;
    }
  }
  // require meaningful match (not just /api)
  return bestScore >= 2 ? best : null;
}

function indexApiDocs(apiFiles) {
  return apiFiles.map((f) => {
    const text = fs.readFileSync(f, "utf8");
    const { paths } = collectDocApiPaths(text);
    const slug = path.basename(f).replace(/^\d+-/, "").replace(/\.md$/i, "");
    return { file: f, paths, slug };
  });
}

function listMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  function walk(d, depth = 0) {
    if (depth > 6 || !fs.existsSync(d)) return;
    for (const n of fs.readdirSync(d)) {
      if (/^README/i.test(n) || n === ".fill-work") continue;
      const p = path.join(d, n);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(p, depth + 1);
      else if (/\.md$/i.test(n)) out.push(p);
    }
  }
  walk(dir);
  return out.sort();
}

function rel(root, abs) {
  return path.relative(root, abs).replace(/\\/g, "/");
}

function nextIndexedName(dir, slug, prefixDigits = 2) {
  fs.mkdirSync(dir, { recursive: true });
  const existing = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((n) => /^\d+-.*\.md$/i.test(n))
    : [];
  let max = 0;
  for (const n of existing) {
    const m = n.match(/^(\d+)-/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const idx = String(max + 1).padStart(prefixDigits, "0");
  const safe = String(slug || "item")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "item";
  return path.join(dir, `${idx}-${safe}.md`);
}

function appendFieldRows(md, colNames, colMeta = {}) {
  const names = [...new Set((colNames || []).map(String).filter(Boolean))];
  if (!names.length) return { text: md, added: [] };
  const secRe = /(##\s*字段\s*\n)([\s\S]*?)(?=\n##\s+|$)/i;
  const m = md.match(secRe);
  if (!m) {
    const rows = names
      .map((n) => {
        const meta = colMeta[n] || colMeta[n.toLowerCase()] || {};
        return `| ${n} | ${meta.type || "—"} | — | — | ${meta.comment || "TODO(harness-eng) migrate-docs"} |`;
      })
      .join("\n");
    const block = `\n## 字段\n\n| 字段名 | 类型 | 非空 | 默认值 | 说明 |\n|---|---|---|---|---|\n${rows}\n`;
    return { text: md.replace(/\s*$/, "\n") + block, added: names };
  }
  let body = m[2];
  const hasTable = /^\|/.test(body.trim());
  const existing = new Set(
    [...body.matchAll(/^\|\s*`?([A-Za-z_][\w]*)`?\s*\|/gm)].map((x) =>
      x[1].toLowerCase()
    )
  );
  const toAdd = names.filter((n) => !existing.has(n.toLowerCase()));
  if (!toAdd.length) return { text: md, added: [] };
  const newRows = toAdd
    .map((n) => {
      const meta = colMeta[n] || colMeta[n.toLowerCase()] || {};
      if (hasTable && /字段名/.test(body.split("\n")[0] || "")) {
        const cols = (body.split("\n")[0].match(/\|/g) || []).length - 1;
        if (cols <= 2) return `| ${n} | ${meta.type || "—"} |`;
      }
      return `| ${n} | ${meta.type || "—"} | — | — | ${meta.comment || "TODO(harness-eng) migrate-docs"} |`;
    })
    .join("\n");
  if (!hasTable || /TODO\(harness-eng\)/i.test(body.trim())) {
    body = `| 字段名 | 类型 | 非空 | 默认值 | 说明 |\n|---|---|---|---|---|\n${newRows}\n`;
  } else {
    body = body.replace(/\s*$/, "\n") + newRows + "\n";
  }
  const text = md.replace(secRe, `${m[1]}${body}`);
  return { text, added: toAdd };
}

function shellTableDoc(tableName, columns) {
  const cols = (columns || []).map((c) =>
    typeof c === "string" ? { name: c } : c
  );
  const rows =
    cols.length > 0
      ? cols
          .map(
            (c) =>
              `| ${c.name} | ${c.type || c.typ || "—"} | — | — | ${c.comment || "TODO(harness-eng) migrate-docs"} |`
          )
          .join("\n")
      : "| id | — | — | — | TODO(harness-eng) migrate-docs |";
  return `# 表 \`${tableName}\`

> **真相文档（SSOT）** · quality: heuristic — migrate-docs 自动骨架  
> 索引见 [\`../db.md\`](../db.md)。冲突以本文为准。

表名：\`${tableName}\`

## 建表语句

\`\`\`sql
-- TODO(harness-eng): CREATE TABLE \`${tableName}\` …
\`\`\`

## 字段

| 字段名 | 类型 | 非空 | 默认值 | 说明 |
|---|---|---|---|---|
${rows}

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | migrate-docs | 自动骨架 | harness-eng | ${new Date().toISOString().slice(0, 10)} |
`;
}

function shellJobTask(taskCode, scheduler = {}) {
  const tokens = [
    scheduler.cron,
    scheduler.fixedRate,
    scheduler.fixedDelay,
    scheduler.fixedRateString,
    scheduler.fixedDelayString,
  ]
    .map((x) => (x == null ? "" : String(x).trim()))
    .filter(Boolean);
  const schedLines = tokens.length
    ? tokens.map((t) => `- \`${t}\``).join("\n")
    : "- TODO(harness-eng) schedule";
  return `# ${taskCode}

> quality: heuristic — migrate-docs 自动骨架

task_code: ${taskCode}

## 调度

${schedLines}

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | migrate-docs | 自动骨架 | harness-eng | ${new Date().toISOString().slice(0, 10)} |
`;
}

function shellRedisKey(pattern) {
  return `# ${pattern}

> quality: heuristic — migrate-docs 自动骨架

## Key 模式

| 项 | 说明 |
|---|---|
| 模式 | \`${pattern}\` |
| 示例 | — |
| 数据结构 | — |

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | migrate-docs | 自动骨架 | harness-eng | ${new Date().toISOString().slice(0, 10)} |
`;
}

/**
 * @param {string} root
 * @param {{ blockers?: string[], inventories?: object }} [opts]
 * @returns {{ ops: object[], skipped: object[], inventories: object }}
 */
export function planMigrateDocs(root, opts = {}) {
  const absRoot = path.resolve(root);
  const reg = loadDomainRegistry();
  const inventories = {
    api: opts.inventories?.api ?? loadDomainInventory(absRoot, "api"),
    db: opts.inventories?.db ?? loadDomainInventory(absRoot, "db"),
    jobs: opts.inventories?.jobs ?? loadDomainInventory(absRoot, "jobs"),
    redis: opts.inventories?.redis ?? loadDomainInventory(absRoot, "redis"),
  };
  const blockers = (opts.blockers || []).map(String);
  const ops = [];
  const skipped = [];

  for (const b of blockers) {
    if (isSkipBlocker(b)) {
      skipped.push({ blocker: b, reason: "coverage/covered_gt — handoff only, never delete docs" });
    }
  }

  const wantStructural =
    !blockers.length ||
    blockers.some(
      (b) =>
        !isSkipBlocker(b) &&
        /doc_(path|field|task|schedule|key)_drift/.test(b)
    );

  if (!wantStructural && blockers.length) {
    return { ops, skipped, inventories };
  }

  // --- DB field drift ---
  const dbDrift = detectDbFieldDrift(absRoot, inventories.db);
  for (const g of dbDrift.gaps || []) {
    if (!g.file) {
      const dir = truthsPath(absRoot, "db", reg);
      const dest = nextIndexedName(dir, g.table);
      const cols = (inventories.db?.tables || [])
        .find((t) => String(t.name || "").toLowerCase() === String(g.table).toLowerCase())
        ?.columns;
      ops.push({
        kind: "db_create_table",
        blocker: `doc_field_drift:${g.table}:no_doc`,
        file: rel(absRoot, dest),
        table: g.table,
        columns: (cols || g.missing_in_doc || []).map((c) =>
          typeof c === "string" ? { name: c } : c
        ),
      });
    } else {
      // 0.7.48: skip hollow ## 字段 when CREATE TABLE already covers inventory cols
      const absDoc = path.isAbsolute(g.file) ? g.file : path.join(absRoot, g.file);
      let md = "";
      try {
        md = fs.readFileSync(absDoc, "utf8");
      } catch {
        md = "";
      }
      const wantCols = g.missing_in_doc || [];
      const invCols = (inventories.db?.tables || []).find(
        (t) => String(t.name || "").toLowerCase() === String(g.table).toLowerCase()
      );
      const allInv = [
        ...(invCols?.columns || []).map((c) => (typeof c === "string" ? c : c.name)),
        ...wantCols,
      ].filter(Boolean);
      if (docCreateCoversColumns(md, allInv)) {
        skipped.push({
          blocker: `doc_field_drift:${g.table}:${wantCols.join("+")}`,
          reason: "CREATE TABLE already covers columns — skip hollow ## 字段 append",
        });
        continue;
      }
      ops.push({
        kind: "db_append_fields",
        blocker: `doc_field_drift:${g.table}:${(g.missing_in_doc || []).join("+")}`,
        file: g.file,
        table: g.table,
        fields: g.missing_in_doc || [],
      });
    }
  }

  // --- API path / field drift ---
  const apiDrift = detectApiFieldDrift(absRoot, inventories.api || { endpoints: [] });
  const apiDir = truthsPath(absRoot, "api", reg);
  const apiFiles = listMdFiles(apiDir);
  const apiIndex = indexApiDocs(apiFiles);
  const missingPaths = [];
  for (const g of apiDrift.gaps || []) {
    if (g.missing_paths_in_doc) missingPaths.push(...g.missing_paths_in_doc);
  }
  if (missingPaths.length && inventories.api?.endpoints?.length) {
    const docText = apiFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
    const docPathCount = (docText.match(/\*\*接口地址[：:]?\*\*/gi) || []).length;
    const eps = [];
    for (const key of missingPaths) {
      const [method, p] = String(key).includes(":")
        ? [String(key).split(":")[0], String(key).slice(String(key).indexOf(":") + 1)]
        : ["", String(key)];
      const ep = (inventories.api.endpoints || []).find((e) => {
        const em = String(e.method || e.httpMethod || "").toUpperCase();
        const epth = String(e.path || e.url || "").trim();
        if (method && p) return em === method.toUpperCase() && epth === p;
        return epth === key || epth === p;
      });
      if (ep) eps.push(ep);
      else eps.push({ method: method || "GET", path: p || key, http: method || "GET" });
    }
    // 1:1 rename: single doc path line + single missing endpoint → rewrite path
    if (eps.length === 1 && docPathCount === 1 && apiFiles.length >= 1) {
      ops.push({
        kind: "api_rewrite_path",
        blocker: `doc_path_drift:api:${missingPaths.slice(0, 8).join("+")}`,
        file: rel(absRoot, apiFiles[0]),
        path: String(eps[0].path || eps[0].url || "").trim(),
        method: String(eps[0].method || eps[0].httpMethod || eps[0].http || "GET").toUpperCase(),
      });
    } else {
      // 0.7.48: group endpoints by best-matching doc; unmatched → new page
      const byFile = new Map();
      const unmatched = [];
      for (const ep of eps) {
        const epth = String(ep.path || ep.url || "").trim();
        const hit = pickApiDocForPath(epth, apiIndex);
        if (hit) {
          if (!byFile.has(hit)) byFile.set(hit, []);
          byFile.get(hit).push(ep);
        } else {
          unmatched.push(ep);
        }
      }
      for (const [file, group] of byFile) {
        ops.push({
          kind: "api_append_endpoints",
          blocker: `doc_path_drift:api:${missingPaths.slice(0, 8).join("+")}`,
          file: rel(absRoot, file),
          endpoints: group,
        });
      }
      if (unmatched.length) {
        const slug =
          String(unmatched[0].path || unmatched[0].url || "migrate-endpoints")
            .replace(/^\//, "")
            .replace(/\//g, "-")
            .slice(0, 40) || "migrate-endpoints";
        ops.push({
          kind: "api_append_endpoints",
          blocker: `doc_path_drift:api:${missingPaths.slice(0, 8).join("+")}`,
          file: rel(absRoot, nextIndexedName(apiDir, slug)),
          endpoints: unmatched,
        });
      }
    }
  }
  for (const g of apiDrift.gaps || []) {
    const fields = g.missing_annotation_params || g.missing_in_doc;
    if (!fields?.length) continue;
    // field-only gaps lack a path; prefer new page over dumping into first md
    const dest = nextIndexedName(apiDir, "migrate-fields");
    ops.push({
      kind: "api_append_fields",
      blocker: `doc_field_drift:api:${fields.slice(0, 8).join("+")}`,
      file: rel(absRoot, dest),
      fields: fields.slice(0, 40),
    });
  }

  // --- Jobs task / schedule ---
  const jobsDrift = detectJobsTaskDrift(absRoot, inventories.jobs);
  const jobsDir = truthsPath(absRoot, "jobs", reg);
  const jobsFiles = listMdFiles(jobsDir);
  const taskByCode = new Map(
    (inventories.jobs?.tasks || []).map((t) => [
      String(t.task_code || t.slug || t.id || "").trim(),
      t,
    ])
  );
  for (const g of jobsDrift.gaps || []) {
    if (g.missing_in_doc) {
      for (const code of g.missing_in_doc) {
        const t = taskByCode.get(code) || { task_code: code };
        ops.push({
          kind: "jobs_create_task",
          blocker: `doc_task_drift:jobs:${code}`,
          file: rel(absRoot, nextIndexedName(jobsDir, code)),
          task_code: code,
          scheduler: t.scheduler || {},
        });
      }
    }
    if (g.missing_schedule_in_doc) {
      for (const item of g.missing_schedule_in_doc) {
        const [code, ...rest] = String(item).split(":");
        const tok = rest.join(":");
        let file = jobsFiles.find((f) => {
          const txt = fs.readFileSync(f, "utf8").toLowerCase();
          return txt.includes(String(code).toLowerCase());
        });
        if (!file) {
          file = nextIndexedName(jobsDir, code || "task");
          ops.push({
            kind: "jobs_create_task",
            blocker: `doc_schedule_drift:jobs:${item}`,
            file: rel(absRoot, file),
            task_code: code,
            scheduler: { cron: tok },
          });
        } else {
          ops.push({
            kind: "jobs_append_schedule",
            blocker: `doc_schedule_drift:jobs:${item}`,
            file: rel(absRoot, file),
            task_code: code,
            token: tok,
          });
        }
      }
    }
  }

  // --- Redis key drift ---
  const redisDrift = detectRedisKeyDrift(absRoot, inventories.redis);
  const redisDir = truthsPath(absRoot, "redis", reg);
  for (const g of redisDrift.gaps || []) {
    for (const pattern of g.missing_in_doc || []) {
      ops.push({
        kind: "redis_create_key",
        blocker: `doc_key_drift:redis:${pattern}`,
        file: rel(absRoot, nextIndexedName(redisDir, pattern.replace(/[^\w.-]+/g, "-"))),
        pattern,
      });
    }
  }

  // Deduplicate ops by kind+file+primary key
  const seen = new Set();
  const deduped = [];
  for (const op of ops) {
    const k = `${op.kind}|${op.file}|${op.table || op.task_code || op.pattern || op.path || ""}|${(op.fields || []).join(",")}|${op.token || ""}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(op);
  }

  return { ops: deduped, skipped, inventories };
}

/**
 * @param {string} root
 * @param {{ ops: object[], skipped?: object[] }} plan
 * @param {{ dryRun?: boolean }} [opts]
 */
export function applyMigrateDocs(root, plan, opts = {}) {
  const absRoot = path.resolve(root);
  const dryRun = !!opts.dryRun;
  const applied = [];
  const errors = [];
  const ops = plan?.ops || [];

  for (const op of ops) {
    try {
      const abs = path.join(absRoot, op.file);
      if (op.kind === "db_create_table") {
        const text = shellTableDoc(op.table, op.columns);
        if (!dryRun) {
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, text, "utf8");
        }
        applied.push({ ...op, action: dryRun ? "dry-run" : "created" });
        continue;
      }
      if (op.kind === "db_append_fields") {
        const cur = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
        const { text, added } = appendFieldRows(cur, op.fields);
        if (!added.length) {
          applied.push({ ...op, action: "noop" });
          continue;
        }
        if (!dryRun) {
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, text, "utf8");
        }
        applied.push({ ...op, action: dryRun ? "dry-run" : "patched", added });
        continue;
      }
      if (op.kind === "api_rewrite_path") {
        let cur = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
        const nextPath = op.path.startsWith("/") ? op.path : `/${op.path}`;
        const replaced = cur.replace(
          /(\*\*接口地址[：:]?\*\*[：:]?\s*)`?[^\s`*\n]+`?/,
          `$1${nextPath}`
        );
        if (op.method) {
          cur = replaced.replace(
            /(\*\*请求方式[：:]?\*\*[：:]?\s*)`?[A-Z]+`?/,
            `$1${op.method}`
          );
        } else {
          cur = replaced;
        }
        if (!dryRun) {
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, cur, "utf8");
        }
        applied.push({ ...op, action: dryRun ? "dry-run" : "patched" });
        continue;
      }
      if (op.kind === "api_append_endpoints") {
        let cur = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
        const startIdx =
          (cur.match(/^##\s+\d+\./gm) || []).length + 1;
        const parts = (op.endpoints || []).map((ep, i) =>
          endpointToMarkdown(
            {
              ...ep,
              http: ep.http || ep.method || ep.httpMethod || "GET",
              path: ep.path || ep.url,
            },
            startIdx + i,
            absRoot
          )
        );
        const body = (cur ? cur.replace(/\s*$/, "\n\n") : "") + parts.join("\n");
        if (!dryRun) {
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, body, "utf8");
        }
        applied.push({
          ...op,
          action: dryRun ? "dry-run" : fs.existsSync(abs) && cur ? "appended" : "created",
          count: parts.length,
        });
        continue;
      }
      if (op.kind === "api_append_fields") {
        let cur = fs.existsSync(abs)
          ? fs.readFileSync(abs, "utf8")
          : "# migrate-docs api fields\n";
        const rows = (op.fields || [])
          .map(
            (f) =>
              `| ${f} | — | 否 | TODO(harness-eng) migrate-docs | — | — | 未知 |`
          )
          .join("\n");
        if (/###\s*请求参数/i.test(cur)) {
          cur = cur.replace(
            /(###\s*请求参数\s*\n)([\s\S]*?)(?=\n###\s*|\n##\s+|$)/i,
            (full, h, body) => {
              if (/^\|/.test(body.trim())) {
                return `${h}${body.replace(/\s*$/, "\n")}${rows}\n`;
              }
              return `${h}| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |\n|---|---|---|---|---|---|---|\n${rows}\n`;
            }
          );
        } else {
          cur =
            cur.replace(/\s*$/, "\n\n") +
            `### 请求参数\n\n| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |\n|---|---|---|---|---|---|---|\n${rows}\n`;
        }
        if (!dryRun) {
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, cur, "utf8");
        }
        applied.push({ ...op, action: dryRun ? "dry-run" : "patched" });
        continue;
      }
      if (op.kind === "jobs_create_task") {
        const text = shellJobTask(op.task_code, op.scheduler);
        if (!dryRun) {
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, text, "utf8");
        }
        applied.push({ ...op, action: dryRun ? "dry-run" : "created" });
        continue;
      }
      if (op.kind === "jobs_append_schedule") {
        let cur = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
        if (cur.toLowerCase().includes(String(op.token).toLowerCase())) {
          applied.push({ ...op, action: "noop" });
          continue;
        }
        if (/##\s*调度/i.test(cur)) {
          cur = cur.replace(
            /(##\s*调度\s*\n)([\s\S]*?)(?=\n##\s+|$)/i,
            `$1$2\n- \`${op.token}\`\n`
          );
        } else {
          cur =
            cur.replace(/\s*$/, "\n\n") +
            `## 调度\n\n- \`${op.token}\`\n`;
        }
        if (!dryRun) {
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, cur, "utf8");
        }
        applied.push({ ...op, action: dryRun ? "dry-run" : "patched" });
        continue;
      }
      if (op.kind === "redis_create_key") {
        const text = shellRedisKey(op.pattern);
        if (!dryRun) {
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, text, "utf8");
        }
        applied.push({ ...op, action: dryRun ? "dry-run" : "created" });
        continue;
      }
      errors.push({ op, error: `unknown kind ${op.kind}` });
    } catch (e) {
      errors.push({ op, error: String(e && e.message ? e.message : e) });
    }
  }

  const report = {
    ok: errors.length === 0,
    dry_run: dryRun,
    ops: plan?.ops || [],
    applied,
    skipped: plan?.skipped || [],
    errors,
    out_path: MIGRATE_REPORT_REL,
  };

  if (!dryRun) {
    try {
      const outAbs = path.join(absRoot, MIGRATE_REPORT_REL);
      fs.mkdirSync(path.dirname(outAbs), { recursive: true });
      fs.writeFileSync(outAbs, JSON.stringify(report, null, 2), "utf8");
    } catch (e) {
      report.ok = false;
      report.errors.push({ error: `write report: ${e.message}` });
    }
  }

  return report;
}

const SKELETON_LINE =
  /^(?:#+\s|>>?\s|\|)|TODO\(harness-eng\)|quality:\s*heuristic|自动骨架|请人工补|真相文档|SSOT|索引见|表名：|task_code:|\*\*接口地址|\*\*请求方式|^```|^-\s*`/;

/**
 * Placeholder / TODO(harness-eng) only — safe to append a coverage section.
 * Non-empty business prose → not a placeholder.
 * Rules:
 * 1. Append only when the target md is missing or body is placeholder / TODO(harness-eng).
 * 2. Existing non-empty business text → skip reason "user content present".
 * 3. Skeleton titles carry TODO(harness-eng) migrate-coverage. Never delete docs.
 * @param {string} text
 */
export function isCoveragePlaceholder(text) {
  const raw = String(text || "").trim();
  if (!raw) return true;
  if (!/TODO\(harness-eng\)/i.test(raw)) {
    const stripped = raw
      .replace(/^#+\s+[^\n]*$/gm, "")
      .replace(/^\s*[-|`\s]+$/gm, "")
      .trim();
    return stripped.length === 0;
  }
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    if (SKELETON_LINE.test(t)) continue;
    if (/^[-*]\s+`[^`]+`$/.test(t)) continue;
    return false;
  }
  return true;
}

/**
 * @param {string|boolean|null|undefined} v
 * @returns {'off'|'append'|'dry-run'}
 */
export function normalizeCoverageMode(v) {
  if (v == null || v === false || v === "off" || v === "false" || v === "no" || v === "")
    return "off";
  if (v === "dry-run" || v === "dryrun" || v === "dry_run") return "dry-run";
  if (v === "append" || v === "on" || v === true || v === "true") return "append";
  throw new Error(`Unknown migrate-coverage value: ${v} (use off|append|dry-run)`);
}

function coverageBlockersOf(blockers) {
  return (blockers || []).map(String).filter((b) => /coverage_ready|covered_gt/.test(b));
}

function endpointRows(endpoints) {
  return (endpoints || [])
    .map((ep) => ({
      method: String(ep.method || ep.http || ep.httpMethod || "GET").toUpperCase(),
      path: String(ep.path || ep.url || "").trim(),
    }))
    .filter((e) => e.path);
}

function shellCoverageApiPage(endpoints) {
  const sections = endpointRows(endpoints)
    .map((ep, i) => {
      const p = ep.path.startsWith("/") ? ep.path : `/${ep.path}`;
      return `## ${i + 1}. ${p}

> TODO(harness-eng) migrate-coverage

**接口地址：** ${p}
**请求方式：** ${ep.method}

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| — | — | 否 | TODO(harness-eng) migrate-coverage | — | — | 未知 |
`;
    })
    .join("\n");
  return `# API 覆盖

> quality: heuristic — TODO(harness-eng) migrate-coverage
> 自动骨架，请人工补业务说明。

${sections}`;
}

function shellCoverageApiSection(endpoints, startIdx) {
  return endpointRows(endpoints)
    .map((ep, i) => {
      const p = ep.path.startsWith("/") ? ep.path : `/${ep.path}`;
      return `## ${startIdx + i}. ${p}

> TODO(harness-eng) migrate-coverage

**接口地址：** ${p}
**请求方式：** ${ep.method}

### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |
|---|---|---|---|---|---|---|
| — | — | 否 | TODO(harness-eng) migrate-coverage | — | — | 未知 |
`;
    })
    .join("\n");
}

function shellCoverageDb(table, columns) {
  const cols = (columns || []).map((c) => (typeof c === "string" ? { name: c } : c));
  const rows = cols.length
    ? cols
        .map(
          (c) =>
            `| ${c.name} | ${c.type || c.typ || "—"} | — | — | TODO(harness-eng) migrate-coverage |`
        )
        .join("\n")
    : "| id | — | — | — | TODO(harness-eng) migrate-coverage |";
  return `# 表 \`${table}\`

> quality: heuristic — TODO(harness-eng) migrate-coverage

表名：\`${table}\`

## 字段

| 字段名 | 类型 | 非空 | 默认值 | 说明 |
|---|---|---|---|---|
${rows}
`;
}

function shellCoverageJob(taskCode) {
  return `# ${taskCode}

> quality: heuristic — TODO(harness-eng) migrate-coverage

task_code: ${taskCode}

## 调度

- TODO(harness-eng) migrate-coverage
`;
}

function shellCoverageRedis(patterns) {
  const rows = (patterns || [])
    .map(
      (p) =>
        `| \`${p}\` | — | — | TODO(harness-eng) migrate-coverage |`
    )
    .join("\n");
  return `# Redis Key

> quality: heuristic — TODO(harness-eng) migrate-coverage

## Key 模式

| 模式 | 示例 | 数据结构 | 说明 |
|---|---|---|---|
${rows || "| `TODO` | — | — | TODO(harness-eng) migrate-coverage |"}
`;
}

function shellCoverageFunc(services) {
  const sections = (services || [])
    .map(
      (name, i) => `## ${i + 1}. ${name}

> TODO(harness-eng) migrate-coverage

Service：\`${name}\`
`
    )
    .join("\n");
  return `# Service 覆盖

> quality: heuristic — TODO(harness-eng) migrate-coverage

${sections}`;
}

function readText(abs) {
  try {
    return fs.readFileSync(abs, "utf8");
  } catch {
    return "";
  }
}

/**
 * Append-only coverage plan. Never emits a delete op.
 * covered_gt is always skipped (handoff). coverage_ready may add a missing
 * page or a section on a placeholder / TODO(harness-eng) stub.
 * @param {{ blockers?: string[], inventories?: object, docsRoot?: string }} opts
 * @returns {{ ops: object[], skipped: object[] }}
 */
export function planCoverageAppend(opts = {}) {
  const blockers = (opts.blockers || []).map(String);
  const ops = [];
  const skipped = [];
  const docsRoot = opts.docsRoot ? path.resolve(opts.docsRoot) : null;
  let sawReady = false;
  for (const b of blockers) {
    if (!/coverage_ready|covered_gt/.test(b)) continue;
    // covered_gt: never delete — always skipped with reason
    if (b.includes("covered_gt")) {
      skipped.push({
        blocker: b,
        reason: "covered_gt — handoff only, never delete/trim docs",
      });
      continue;
    }
    if (/coverage_ready/.test(b)) sawReady = true;
  }
  if (!sawReady || !docsRoot) {
    return { ops, skipped };
  }

  const reg = loadDomainRegistry();
  const inventories = {
    api: opts.inventories?.api ?? loadDomainInventory(docsRoot, "api"),
    func: opts.inventories?.func ?? loadDomainInventory(docsRoot, "func"),
    db: opts.inventories?.db ?? loadDomainInventory(docsRoot, "db"),
    redis: opts.inventories?.redis ?? loadDomainInventory(docsRoot, "redis"),
    jobs: opts.inventories?.jobs ?? loadDomainInventory(docsRoot, "jobs"),
  };

  // api: one page when modules md is missing; section when only a stub exists
  const apiEps = endpointRows(inventories.api?.endpoints || []);
  if (apiEps.length) {
    const dir = truthsPath(docsRoot, "api", reg);
    const files = listMdFiles(dir);
    const allText = files.map((f) => readText(f)).join("\n");
    const missing = apiEps.filter((ep) => !allText.includes(ep.path));
    if (!missing.length) {
      /* already represented */
    } else if (files.some((f) => !isCoveragePlaceholder(readText(f)))) {
      skipped.push({
        blocker: "coverage_ready",
        domain: "api",
        reason: "user content present",
      });
    } else if (!files.length) {
      const dest = nextIndexedName(dir, "migrate-coverage");
      ops.push({
        kind: "coverage_append_page",
        blocker: "coverage_ready",
        domain: "api",
        file: rel(docsRoot, dest),
        content: shellCoverageApiPage(missing),
      });
    } else {
      const startIdx = (readText(files[0]).match(/^##\s+\d+\./gm) || []).length + 1;
      ops.push({
        kind: "coverage_append_section",
        blocker: "coverage_ready",
        domain: "api",
        file: rel(docsRoot, files[0]),
        content: shellCoverageApiSection(missing, startIdx),
      });
    }
  }

  const dbTables = inventories.db?.tables || [];
  if (dbTables.length) {
    const dir = truthsPath(docsRoot, "db", reg);
    const files = listMdFiles(dir);
    for (const t of dbTables) {
      const name = String(t.name || "").trim();
      if (!name) continue;
      const hit = files.find((f) => {
        const base = path.basename(f).toLowerCase();
        const text = readText(f).toLowerCase();
        return base.includes(name.toLowerCase()) || text.includes(name.toLowerCase());
      });
      if (!hit) {
        const dest = nextIndexedName(dir, name);
        ops.push({
          kind: "coverage_append_page",
          blocker: "coverage_ready",
          domain: "db",
          file: rel(docsRoot, dest),
          table: name,
          content: shellCoverageDb(name, t.columns),
        });
      } else if (isCoveragePlaceholder(readText(hit))) {
        ops.push({
          kind: "coverage_append_section",
          blocker: "coverage_ready",
          domain: "db",
          file: rel(docsRoot, hit),
          table: name,
          content: `\n## 字段\n\n| 字段名 | 类型 | 非空 | 默认值 | 说明 |\n|---|---|---|---|---|\n| id | — | — | — | TODO(harness-eng) migrate-coverage |\n`,
        });
      } else {
        skipped.push({
          blocker: "coverage_ready",
          domain: "db",
          table: name,
          reason: "user content present",
        });
      }
    }
  }

  const tasks = inventories.jobs?.tasks || [];
  if (tasks.length) {
    const dir = truthsPath(docsRoot, "jobs", reg);
    const files = listMdFiles(dir);
    for (const task of tasks) {
      const code = String(task.task_code || task.id || task.name || "").trim();
      if (!code) continue;
      const hit = files.find((f) => readText(f).includes(code) || path.basename(f).includes(code));
      if (!hit) {
        const dest = nextIndexedName(dir, code);
        ops.push({
          kind: "coverage_append_page",
          blocker: "coverage_ready",
          domain: "jobs",
          file: rel(docsRoot, dest),
          task_code: code,
          content: shellCoverageJob(code),
        });
      } else if (!isCoveragePlaceholder(readText(hit))) {
        skipped.push({
          blocker: "coverage_ready",
          domain: "jobs",
          task_code: code,
          reason: "user content present",
        });
      }
    }
  }

  const redisPatterns = [
    ...new Set(
      (inventories.redis?.keys || [])
        .filter((k) => k && k.redis !== false)
        .map((k) => String(k.pattern || "").trim())
        .filter(Boolean)
    ),
  ];
  if (redisPatterns.length) {
    const dir = truthsPath(docsRoot, "redis", reg);
    const files = listMdFiles(dir);
    const allText = files.map((f) => readText(f)).join("\n");
    const missing = redisPatterns.filter((p) => !allText.includes(p));
    if (missing.length) {
      if (files.some((f) => !isCoveragePlaceholder(readText(f)))) {
        skipped.push({
          blocker: "coverage_ready",
          domain: "redis",
          reason: "user content present",
        });
      } else if (!files.length) {
        const dest = nextIndexedName(dir, "migrate-coverage");
        ops.push({
          kind: "coverage_append_page",
          blocker: "coverage_ready",
          domain: "redis",
          file: rel(docsRoot, dest),
          content: shellCoverageRedis(missing),
        });
      } else {
        const rows = missing
          .map((p) => `| \`${p}\` | — | — | TODO(harness-eng) migrate-coverage |`)
          .join("\n");
        ops.push({
          kind: "coverage_append_section",
          blocker: "coverage_ready",
          domain: "redis",
          file: rel(docsRoot, files[0]),
          content: `\n${rows}\n`,
        });
      }
    }
  }

  const services = [];
  for (const mod of inventories.func?.modules || []) {
    for (const svc of mod.services || []) {
      const name = svc.class || svc.name || svc.service;
      if (name) services.push(String(name));
    }
  }
  if (services.length) {
    const dir = truthsPath(docsRoot, "func", reg);
    const files = listMdFiles(dir);
    const allText = files.map((f) => readText(f)).join("\n");
    const missing = services.filter((n) => !allText.includes(n));
    if (missing.length) {
      if (files.some((f) => !isCoveragePlaceholder(readText(f)))) {
        skipped.push({
          blocker: "coverage_ready",
          domain: "func",
          reason: "user content present",
        });
      } else if (!files.length) {
        const dest = nextIndexedName(dir, "migrate-coverage");
        ops.push({
          kind: "coverage_append_page",
          blocker: "coverage_ready",
          domain: "func",
          file: rel(docsRoot, dest),
          content: shellCoverageFunc(missing),
        });
      } else {
        const startIdx = (readText(files[0]).match(/^##\s+\d+\./gm) || []).length + 1;
        const block = missing
          .map(
            (name, i) => `## ${startIdx + i}. ${name}

> TODO(harness-eng) migrate-coverage

Service：\`${name}\`
`
          )
          .join("\n");
        ops.push({
          kind: "coverage_append_section",
          blocker: "coverage_ready",
          domain: "func",
          file: rel(docsRoot, files[0]),
          content: block,
        });
      }
    }
  }

  if (!ops.length && !skipped.some((s) => s.reason === "user content present")) {
    skipped.push({
      blocker: "coverage_ready",
      reason: "no missing page/section",
    });
  }
  return { ops, skipped };
}

/**
 * Apply coverage append ops. Refuses any delete kind. Does not rewrite user prose.
 * @param {string} root
 * @param {{ ops?: object[], skipped?: object[] }} plan
 * @param {{ dryRun?: boolean }} [opts]
 */
export function applyCoverageAppend(root, plan, opts = {}) {
  const absRoot = path.resolve(root);
  const dryRun = !!opts.dryRun;
  const applied = [];
  const errors = [];
  const skipped = [...(plan?.skipped || [])];
  for (const op of plan?.ops || []) {
    const kind = String(op?.kind || "");
    if (/delete|trim|unlink|overwrite/i.test(kind)) {
      skipped.push({ ...op, reason: "covered_gt — handoff only, never delete/trim docs" });
      continue;
    }
    if (kind !== "coverage_append_page" && kind !== "coverage_append_section") {
      errors.push({ op, error: `unknown coverage kind ${kind}` });
      continue;
    }
    const relFile = op.file;
    if (!relFile || typeof op.content !== "string") {
      errors.push({ op, error: "coverage op missing file/content" });
      continue;
    }
    const abs = path.join(absRoot, relFile);
    const exists = fs.existsSync(abs);
    const cur = exists ? readText(abs) : "";
    if (exists && !isCoveragePlaceholder(cur)) {
      skipped.push({ ...op, reason: "user content present" });
      continue;
    }
    const fragment = String(op.content);
    if (exists && cur.includes(fragment.trim().slice(0, 80))) {
      applied.push({ ...op, content: undefined, action: "noop" });
      continue;
    }
    if (!dryRun) {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      const next = exists ? cur.replace(/\s*$/, "\n") + "\n" + fragment : fragment;
      fs.writeFileSync(abs, next, "utf8");
    }
    applied.push({
      ...op,
      content: undefined,
      action: dryRun ? "dry-run" : exists ? "appended" : "created",
    });
  }
  return { applied, skipped, errors };
}

function writeCoverageReport(absRoot, report) {
  const outAbs = path.join(absRoot, MIGRATE_REPORT_REL);
  let disk = {};
  if (fs.existsSync(outAbs)) {
    try {
      disk = JSON.parse(fs.readFileSync(outAbs, "utf8"));
    } catch {
      disk = {};
    }
  }
  const next = {
    ...disk,
    ok: report.ok !== false && disk.ok !== false,
    dry_run: report.dry_run === true || disk.dry_run === true,
    ops: report.ops || disk.ops || report.plan?.ops || [],
    applied: report.applied || disk.applied || [],
    skipped: report.skipped || disk.skipped || [],
    errors: [...(disk.errors || []), ...(report.errors || [])],
    coverage_mode: report.coverage_mode,
    coverage_ops: report.coverage_ops || [],
    coverage_skipped: report.coverage_skipped || [],
    coverage_applied: (report.coverage_applied || []).map((a) => {
      const { content, ...rest } = a;
      void content;
      return rest;
    }),
    out_path: MIGRATE_REPORT_REL,
  };
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, JSON.stringify(next, null, 2), "utf8");
}

/**
 * Plan + apply in one shot.
 * coverageMode defaults off and does not write coverage pages (0.7.44–46).
 * @param {string} root
 * @param {{ mode?: 'auto'|'off'|'dry-run', coverageMode?: 'off'|'append'|'dry-run', blockers?: string[], inventories?: object }} [opts]
 */
export function runMigrateDocs(root, opts = {}) {
  const mode = opts.mode || "auto";
  const coverageMode = normalizeCoverageMode(opts.coverageMode);
  const absRoot = path.resolve(root);
  let report;
  if (mode === "off") {
    report = {
      ok: true,
      mode,
      applied: [],
      skipped: [{ reason: "migrate-docs off" }],
      errors: [],
      ops: [],
      plan: { ops: [], skipped: [] },
    };
  } else {
    const plan = planMigrateDocs(absRoot, {
      blockers: opts.blockers,
      inventories: opts.inventories,
    });
    report = applyMigrateDocs(absRoot, plan, { dryRun: mode === "dry-run" });
    report = { ...report, mode, plan };
  }

  let covPlan;
  let appliedCov = [];
  if (coverageMode === "off") {
    covPlan = {
      ops: [],
      skipped: coverageBlockersOf(opts.blockers).map((b) => ({
        blocker: b,
        reason: "migrate-coverage off",
      })),
    };
  } else {
    covPlan = planCoverageAppend({
      blockers: opts.blockers,
      inventories: opts.inventories,
      docsRoot: absRoot,
    });
    const applied = applyCoverageAppend(absRoot, covPlan, {
      dryRun: coverageMode === "dry-run",
    });
    appliedCov = applied.applied || [];
    if (applied.skipped?.length) {
      covPlan = { ...covPlan, skipped: applied.skipped };
    }
    if (applied.errors?.length) {
      report.ok = false;
      report.errors = [...(report.errors || []), ...applied.errors];
    }
  }
  report.coverage_mode = coverageMode;
  report.coverage_ops = covPlan.ops || [];
  report.coverage_skipped = covPlan.skipped || [];
  report.coverage_applied = appliedCov;
  if (coverageMode !== "off") {
    try {
      writeCoverageReport(absRoot, report);
    } catch (e) {
      report.ok = false;
      report.errors = [
        ...(report.errors || []),
        { error: `write coverage report: ${e.message}` },
      ];
    }
  }
  return report;
}
