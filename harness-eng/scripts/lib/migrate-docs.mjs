/**
 * 0.7.44: structured truth-doc migration for upgrade strictness (ready-regress).
 * Default AUTO on upgrade; opt-out via --no-migrate-docs.
 * Safe scope: path / field / task / schedule / key append-or-align.
 * Never auto-deletes user docs; coverage / covered_gt → skipped handoff only.
 */
import fs from "fs";
import path from "path";
import {
  detectDbFieldDrift,
  detectApiFieldDrift,
  detectJobsTaskDrift,
  detectRedisKeyDrift,
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
      const dest =
        apiFiles[0] || nextIndexedName(apiDir, "migrate-endpoints");
      ops.push({
        kind: "api_append_endpoints",
        blocker: `doc_path_drift:api:${missingPaths.slice(0, 8).join("+")}`,
        file: rel(absRoot, dest),
        endpoints: eps,
      });
    }
  }
  for (const g of apiDrift.gaps || []) {
    const fields = g.missing_annotation_params || g.missing_in_doc;
    if (!fields?.length) continue;
    const dest = apiFiles[0] || nextIndexedName(apiDir, "migrate-fields");
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

/**
 * Plan + apply in one shot.
 * @param {string} root
 * @param {{ mode?: 'auto'|'off'|'dry-run', blockers?: string[], inventories?: object }} [opts]
 */
export function runMigrateDocs(root, opts = {}) {
  const mode = opts.mode || "auto";
  if (mode === "off") {
    return {
      ok: true,
      mode,
      applied: [],
      skipped: [{ reason: "migrate-docs off" }],
      errors: [],
      plan: { ops: [], skipped: [] },
    };
  }
  const plan = planMigrateDocs(root, {
    blockers: opts.blockers,
    inventories: opts.inventories,
  });
  const report = applyMigrateDocs(root, plan, { dryRun: mode === "dry-run" });
  return { ...report, mode, plan };
}
