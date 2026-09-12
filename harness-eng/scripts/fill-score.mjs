#!/usr/bin/env node
/**
 * fill-score — harness contract completeness (no npm deps).
 * Usage:
 *   node scripts/fill-score.mjs --root <TARGET> [--modules a,b] [--threshold 80]
 *   node scripts/fill-score.mjs --root <TARGET> --inventory inv.json [--compare prev.json]
 *   [--quiet] [--write-progress] [--output score.json] [--json]
 *
 * 0.2.19: --output <path> writes JSON to file (stdout shows summary only)
 *          --json outputs only JSON to stdout (suppresses summary text)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { mergeApiInventories, loadDomainInventory } from "./lib/inventory-paths.mjs";
import { createProgress } from "./lib/progress-log.mjs";
import { writeProgress } from "./lib/progress-file.mjs";
import {
  apiExampleFillRatio,
  dbCommentFillRatio,
  funcMethodDescFillRatio,
  redisHasExampleOrUnknown,
  redisHasTtlContent,
} from "./lib/doc-density.mjs";
import {
  applyStrictGateDefaults,
  applyGoldGateDefaults,
  applyGoldCoverageDefaults,
  evaluateAiCodingGate,
} from "./lib/ai-coding-gate.mjs";
import {
  loadDomainRegistry,
  resolveScoreDomains,
  weightsForDomains,
  morphCapsForDomains,
  indexFileName,
  truthsSubdir,
  parseMetaDomains,
  knownContractDomainIds,
} from "./lib/domains.mjs";
import { loadMorphRequired } from "./lib/morph-required.mjs";
import { findHarnessMetaFile, findMcpUsageGuideFile } from "./lib/harness-meta.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOMAIN_REGISTRY = loadDomainRegistry();
const KNOWN_DOMAINS = knownContractDomainIds(DOMAIN_REGISTRY);

function runGoldAcceptance(root) {
  const apiMods = path.join(root, "docs", "api", "modules");
  if (!fs.existsSync(apiMods)) {
    return { gold_pass_ratio: null, blockers: null, status: null };
  }
  const script = path.join(__dirname, "acceptance-check.mjs");
  const r = spawnSync(
    process.execPath,
    [script, "--root", root, "--domain", "api"],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }
  );
  const stdout = r.stdout || "";
  try {
    const i = stdout.indexOf("{");
    const j = stdout.lastIndexOf("}");
    if (i >= 0 && j > i) {
      const parsed = JSON.parse(stdout.slice(i, j + 1));
      return {
        gold_pass_ratio: parsed.gold_pass_ratio,
        blockers: parsed.blockers?.length ?? 0,
        warnings: parsed.warnings?.length ?? 0,
        status: r.status,
      };
    }
  } catch {
    /* ignore */
  }
  return { gold_pass_ratio: null, blockers: null, status: r.status };
}

function parseArgs(argv) {
  const out = {
    root: null,
    modules: [],
    threshold: 80,
    inventory: null,
    compare: null,
    readyQuality: 80,
    readyCoverage: 0.8,
    readyQualitySet: false,
    readyCoverageSet: false,
    summaryOnly: false,
    verbose: false,
    quiet: false,
    writeProgress: false,
    output: null,
    json: false,
    focus: "full", // 0.3.1: morph | gate | full — 只裁剪中文摘要
    domains: [], // 0.3.4: CLI override; empty → meta / disk / core
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--modules" || a === "--module")
      out.modules = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a === "--domains")
      out.domains = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (a === "--threshold") out.threshold = Number(argv[++i]) || 80;
    else if (a === "--inventory") out.inventory = argv[++i];
    else if (a === "--compare") out.compare = argv[++i];
    else if (a === "--ready-quality") {
      out.readyQuality = Number(argv[++i]) || 80;
      out.readyQualitySet = true;
    } else if (a === "--ready-coverage") {
      out.readyCoverage = Number(argv[++i]) || 0.8;
      out.readyCoverageSet = true;
    } else if (a === "--summary-only") out.summaryOnly = true;
    else if (a === "--verbose") out.verbose = true;
    else if (a === "--quiet") out.quiet = true;
    else if (a === "--write-progress") out.writeProgress = true;
    else if (a === "--output") out.output = argv[++i];
    else if (a === "--json") out.json = true;
    else if (a === "--focus") {
      const f = String(argv[++i] || "full").toLowerCase();
      if (!["morph", "gate", "full"].includes(f))
        throw new Error("--focus must be morph|gate|full");
      out.focus = f;
    } else throw new Error(`Unknown arg: ${a}`);
  }
  if (!out.root) throw new Error("Required: --root <TARGET>");
  return out;
}

function buildSuggestUpgrade(report, metaLadder) {
  const ladder = metaLadder || null;
  const order = ["L0", "L1", "L2", "L3", "L4", "L5"];
  let next_ladder = null;
  if (ladder && order.includes(ladder)) {
    const i = order.indexOf(ladder);
    if (i >= 0 && i < order.length - 1) next_ladder = order[i + 1];
  } else if (report.ready?.ok) {
    next_ladder = "L3";
  }
  const nearCeiling =
    typeof report.overall === "number" &&
    typeof report.formula_ceiling === "number" &&
    report.overall >= report.formula_ceiling - 2;
  const tc = report.template_completeness?.overall;
  const tcLow = typeof tc === "number" && tc < 70;
  let reason = "继续补契约或跑 inventory / fill-truths-agents（hybrid）";
  if (report.ready?.ok && nearCeiling && tcLow) {
    reason =
      "ready 且贴 formula_ceiling，但 template_completeness 偏低 → 建议 fill-truths-agents，勿空追 overall≥80";
  } else if (report.ready?.ok && nearCeiling) {
    reason = "ready 且贴近公式上限；可升阶或人工精修，勿空追 overall";
  } else if (report.ready?.ok) {
    reason = "ready=true；可考虑 upgrade 下一阶或精修其它域";
  } else if (report.ready?.coverage_incomplete) {
    reason = "缺 inventory，先补清单再谈升阶";
  }
  return {
    next_ladder,
    skill_patch: "0.2.16",
    reason,
  };
}

function walkMd(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkMd(p, acc);
    else if (/\.md$/i.test(name) && name.toUpperCase() !== "README.MD") acc.push(p);
  }
  return acc;
}

/** Template-aligned: **接口地址：** /x | **接口地址：** `/x` | 接口地址： /x */
function hasRealApiPath(raw) {
  return (
    /\*\*接口地址[：:]\*\*\s*`?\/\S+/.test(raw) ||
    /\*\*接口地址\*\*[：:]\s*`?\/\S+/.test(raw) ||
    /\*\*接口地址\*\*\s*`?\/\S+/.test(raw) ||
    /接口地址[：:]\s*`?\/\S+/.test(raw)
  );
}

function hasHttpMethod(raw) {
  return (
    /\*\*请求方式[：:]\*\*\s*(GET|POST|PUT|DELETE|PATCH)\b/i.test(raw) ||
    /\*\*请求方式\*\*[：:]\s*(GET|POST|PUT|DELETE|PATCH)\b/i.test(raw) ||
    /请求方式[：:]\s*(GET|POST|PUT|DELETE|PATCH)\b/i.test(raw)
  );
}

function countDocEndpoints(raw) {
  const numbered = raw.match(/^##\s+\d+\.\s+/gm);
  if (numbered && numbered.length) return numbered.length;
  const paths = raw.match(/\*\*接口地址[：:]?\*\*\s*\/\S+|\*\*接口地址\*\*[：:]?\s*\/\S+/g);
  return paths ? paths.length : 0;
}

/** Field comment coverage from ## 字段 table (col 说明). */
function fieldCommentStats(raw) {
  const sec = raw.match(/##\s*字段[\s\S]*?(?=\n##\s+|$)/i);
  if (!sec) return { total: 0, filled: 0, ratio: 0 };
  const rows = sec[0].match(/^\|[^|\n]+\|[^|\n]+\|[^|\n]+\|[^|\n]+\|[^|\n]+\|/gm) || [];
  const data = rows.filter((r) => !/\|\s*---/.test(r) && !/\|\s*字段名\s*\|/.test(r));
  let filled = 0;
  for (const r of data) {
    const cells = r
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    const comment = cells[4] || "";
    if (comment && comment !== "—" && comment !== "-" && !/^TODO/i.test(comment)) filled++;
  }
  const total = data.length;
  return { total, filled, ratio: total ? filled / total : 0 };
}

function hasRedisValueEvidence(raw) {
  // 0.3.1: ## Value ≡ ## Value 结构；接受项|说明 / 字段|类型表，不单靠 backtick pattern 行
  const sec = raw.match(/##\s*Value(?:\s*结构)?[\s\S]*?(?=\n##\s+|$)/i);
  if (!sec) return false;
  const b = sec[0];
  if (/TODO\(harness-eng\)/i.test(b) && b.replace(/##\s*Value(?:\s*结构)?/i, "").trim().length < 40)
    return false;
  if (/\|\s*`[^`]+`\s*\|/.test(b)) return true;
  if (/\|\s*字段\s*\|\s*类型\s*\|/i.test(b) || /\|\s*项\s*\|\s*说明\s*\|/i.test(b))
    return true;
  if (/\|/.test(b) && /类型|说明|String|Hash|List|ZSet|JSON/i.test(b)) return true;
  return b.replace(/##\s*Value(?:\s*结构)?/i, "").trim().length > 20;
}

function hasRedisTtlEvidence(raw) {
  // 0.3.1: morph TTL ≡ dens redisHasTtlContent（模板「项|说明」也算）
  return redisHasTtlContent(raw);
}

function hasDbFieldEvidence(raw) {
  if (/##\s*字段/.test(raw)) return true;
  // DDL 列 COMMENT 同构 dens-comment 回退路径
  return (
    /CREATE\s+TABLE/i.test(raw) &&
    /COMMENT\s+'/i.test(raw) &&
    !/CREATE TABLE …/.test(raw)
  );
}

/** Named hooks for morph-required.yaml (kind: named). New hooks still require code. */
const NAMED_TESTS = {
  hasRealApiPath,
  hasHttpMethod,
  hasDbFieldEvidence,
  "dens-examples": (raw, policy) => {
    const min = policy?.density?.api_example_min_ratio ?? 0.9;
    const r = apiExampleFillRatio(raw);
    if (!r.hasColumn) return false;
    return r.ratio >= min;
  },
  "dens-method-desc": (raw, policy) => {
    const min = policy?.density?.func_method_desc_min_ratio ?? 0.7;
    const r = funcMethodDescFillRatio(raw);
    if (!r.total) return /方法清单|功能说明/.test(raw);
    return r.ratio >= min;
  },
  "req-ddl": (raw) =>
    (/CREATE\s+TABLE/i.test(raw) && !/CREATE TABLE …/.test(raw)) || /##\s*字段/.test(raw),
  "dens-comment": (raw, policy) => {
    const min = policy?.density?.db_comment_min_ratio ?? 0.5;
    const r = dbCommentFillRatio(raw);
    if (!r.total && /未知/.test(raw)) return true;
    return r.ratio >= min;
  },
  "dens-ttl": (raw, policy) => {
    if (policy?.density?.redis_ttl_required === false) return true;
    return redisHasTtlContent(raw);
  },
  "dens-example": (raw, policy) => {
    if (policy?.density?.redis_example_required === false) return true;
    return redisHasExampleOrUnknown(raw);
  },
  "forbid-openapi-dump": (raw) =>
    !(
      /###\s*请求参数/.test(raw) &&
      /\|\s*字段\s*\|\s*类型\s*\|/.test(raw) &&
      /OpenAPI|接口地址/.test(raw)
    ),
};

/** Required template sections from morph-required.yaml. Missing → missing-req-section. */
const TEMPLATE_REQUIRED = loadMorphRequired(NAMED_TESTS);

/** @returns {{ ratio: number, missing: string[], checks: {id:string,ok:boolean}[] }} */
function templateCompletenessForFile(text, domain, policy) {
  const raw = text || "";
  const reqs = TEMPLATE_REQUIRED[domain] || [];
  const checks = [];
  const missing = [];
  for (const r of reqs) {
    let ok = false;
    if (typeof r.test === "function") ok = !!r.test(raw, policy);
    else if (r.re) ok = r.re.test(raw);
    checks.push({ id: r.id, ok });
    if (!ok) missing.push(r.id);
  }
  const ratio = reqs.length ? checks.filter((c) => c.ok).length / reqs.length : 1;
  return { ratio, missing, checks };
}

/** Per-file check list for --verbose. */
function buildChecks(text, domain, policy) {
  const raw = text || "";
  const checks = [];
  const add = (id, ok) => checks.push({ id, ok });
  if (domain === "api") {
    add("has-api-path", hasRealApiPath(raw));
    add("has-http-method", hasHttpMethod(raw));
    add(
      "has-request-params",
      /###\s*请求参数/.test(raw) && !/请求参数\s*\n\s*TODO\(harness-eng\)/.test(raw)
    );
  }
  if (domain === "func") {
    add(
      "has-service-list",
      (/#{2,3}\s*服务类/.test(raw) && !/服务类\s*\n\s*TODO\(harness-eng\)/.test(raw)) ||
        /evidence:\s*`[^`]+`/.test(raw)
    );
    add("has-method-list", /#{2,3}\s*方法清单/.test(raw) || /\|\s*方法\s*\|\s*返回/.test(raw));
  }
  if (domain === "db") {
    add(
      "has-create-table",
      /CREATE\s+TABLE/i.test(raw) && !/CREATE TABLE …/.test(raw) && !/-- TODO/.test(raw)
    );
    add("has-field-list", hasDbFieldEvidence(raw));
    const fc = fieldCommentStats(raw);
    const dens = dbCommentFillRatio(raw);
    add(
      "has-field-comment",
      (fc.filled > 0 && fc.ratio >= 0.2) || (dens.total > 0 && dens.ratio >= 0.2)
    );
    add("has-business-desc", /业务说明|表说明|用途[：:]|表级/.test(raw));
  }
  if (domain === "redis") {
    add(
      "has-key-pattern",
      /##\s*Key 模式/.test(raw) && !/从业务调用方补全/.test(raw) && !/模式 \| TODO/i.test(raw)
    );
    add("has-value-structure", hasRedisValueEvidence(raw));
    add("has-ttl", hasRedisTtlEvidence(raw));
  }
  if (domain === "jobs") {
    add("has-task-id", /task_code|##\s*标识/i.test(raw));
    add("has-cron", /##\s*Cron|cronConfigKey|默认表达式/i.test(raw));
    add("has-scheduler", /Scheduler|调度入口/i.test(raw));
    add("has-code-anchors", /##\s*代码锚点|Registry/i.test(raw));
  }
  add("no-todo", !/TODO\(harness-eng\)/i.test(raw));
  const tc = templateCompletenessForFile(raw, domain, policy);
  for (const c of tc.checks) add(c.id, c.ok);
  if (tc.missing.length) add("missing-req-section", false);
  else add("missing-req-section", true);
  return checks;
}

function scoreTruthFile(text, domain, policy) {
  const raw = text || "";
  let score = 10;
  const issues = [];
  const checks = buildChecks(raw, domain, policy);

  if (/TODO\(harness-eng\)/i.test(raw)) {
    const n = (raw.match(/TODO\(harness-eng\)/gi) || []).length;
    score -= Math.min(40, n * 8);
    issues.push(`TODO(harness-eng)×${n}`);
  }
  if (/占位接口/.test(raw) || /接口地址[：:]\s*TODO/i.test(raw)) {
    score -= 25;
    issues.push("占位/TODO 接口地址");
  }
  if (domain === "api") {
    if (hasRealApiPath(raw)) score += 35;
    else issues.push("缺少真实接口路径");
    if (hasHttpMethod(raw)) score += 15;
    if (/###\s*请求参数/.test(raw) && !/请求参数\s*\n\s*TODO\(harness-eng\)/.test(raw))
      score += 10;
  }
  if (domain === "func") {
    const hasSvc =
      (/#{2,3}\s*服务类/.test(raw) && !/服务类\s*\n\s*TODO\(harness-eng\)/.test(raw)) ||
      (/evidence:\s*`[^`]+`/.test(raw) && /\|\s*方法\s*\|\s*返回/.test(raw));
    const hasMethods =
      /#{2,3}\s*方法清单/.test(raw) ||
      (/\|\s*方法\s*\|\s*返回/.test(raw) && !/方法清单\s*\n\s*TODO\(harness-eng\)/.test(raw));
    if (hasSvc) score += 30;
    else issues.push("缺少服务类清单");
    if (hasMethods) score += 25;
    else issues.push("缺少方法清单");
  }
  if (domain === "db") {
    if (/CREATE\s+TABLE/i.test(raw) && !/CREATE TABLE …/.test(raw) && !/-- TODO/.test(raw))
      score += 45;
    else if (/##\s*字段/.test(raw) && !/字段说明\s*\n\s*TODO\(harness-eng\)/.test(raw))
      score += 30;
    else issues.push("无有效建表/字段正文");
    const fc = fieldCommentStats(raw);
    const dens = dbCommentFillRatio(raw);
    if ((fc.filled > 0 && fc.ratio >= 0.2) || (dens.total > 0 && dens.ratio >= 0.2))
      score += 15;
    else issues.push("缺字段说明/COMMENT");
    if (fc.ratio >= 0.5 || dens.ratio >= 0.5) score += 5;
  }
  if (domain === "redis") {
    if (/##\s*Key 模式/.test(raw) && !/从业务调用方补全/.test(raw) && !/模式 \| TODO/i.test(raw))
      score += 40;
    else issues.push("Key 模式未填");
    if (hasRedisValueEvidence(raw)) score += 12;
    else issues.push("缺 Value 结构证据");
    if (hasRedisTtlEvidence(raw)) score += 8;
    else issues.push("缺 TTL 证据");
  }
  if (domain === "jobs") {
    if (/task_code|##\s*标识/i.test(raw)) score += 25;
    else issues.push("缺 task_code/标识");
    if (/##\s*Cron|cronConfigKey|默认表达式/i.test(raw)) score += 25;
    else issues.push("缺 Cron");
    if (/Scheduler|调度入口/i.test(raw)) score += 15;
    else issues.push("缺 Scheduler");
    if (/##\s*代码锚点|Registry/i.test(raw)) score += 15;
    else issues.push("缺代码锚点");
    if (
      /###\s*请求参数/.test(raw) &&
      /\|\s*字段\s*\|\s*类型\s*\|/.test(raw) &&
      /OpenAPI|接口地址/.test(raw)
    ) {
      score -= 20;
      issues.push("疑似把 OpenAPI 抄进 jobs");
    }
  }

  if (raw.length > 800) score += 5;
  score = Math.max(0, Math.min(100, score));
  return {
    score,
    issues,
    checks,
    shell: /TODO\(harness-eng\)/i.test(raw) && score < 40,
    endpoints: domain === "api" ? countDocEndpoints(raw) : undefined,
  };
}

function domainFiles(root, domain) {
  const base = path.join(root, "docs", domain);
  const sub = truthsSubdir(domain, DOMAIN_REGISTRY);
  if (domain === "api" || domain === "func") return walkMd(path.join(base, "modules"));
  if (domain === "db") return walkMd(path.join(base, "table"));
  if (domain === "redis") return walkMd(path.join(base, "keys"));
  if (domain === "jobs") return walkMd(path.join(base, sub || "tasks"));
  // registry-driven fallback
  if (sub) return walkMd(path.join(base, sub));
  return [];
}

function filterByModules(files, modules, domain) {
  if (!modules.length) return files;
  // db/redis/jobs 文件名通常不含模块名；按模块过滤会误伤
  if (domain === "db" || domain === "redis" || domain === "jobs") return files;
  return files.filter((f) => {
    const base = path.basename(f).toLowerCase();
    return modules.some((m) => {
      const key = m.replace(/^sms-/, "").toLowerCase();
      return base.includes(key) || base.includes(m.toLowerCase());
    });
  });
}

function avg(nums) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function loadJson(p) {
  if (!p) return null;
  const abs = path.resolve(p);
  if (!fs.existsSync(abs)) throw new Error(`file missing: ${abs}`);
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function coverageFromInventory(inventory, docEndpointCount) {
  if (!inventory || !inventory.endpoints) return null;
  const code = inventory.endpoints.length;
  const covered = Math.min(docEndpointCount, code);
  const ratio = code ? covered / code : 0;
  return {
    covered: docEndpointCount,
    code,
    ratio: Math.round(ratio * 1000) / 1000,
    percent: Math.round(ratio * 100),
  };
}

/** Count documented Redis key patterns in truth md (table rows with `pattern`). */
function countDocumentedRedisKeys(root) {
  let n = 0;
  for (const f of domainFiles(root, "redis")) {
    const text = fs.readFileSync(f, "utf8");
    // Prefer section under "## Key 模式" until next ##
    const sec = text.match(/##\s*Key 模式[\s\S]*?(?=\n##\s+|$)/i);
    const body = sec ? sec[0] : text;
    const rows = body.match(/^\|\s*`[^`]+`\s*\|/gm);
    if (rows) n += rows.filter((r) => !/\|\s*`—`\s*\|/.test(r)).length;
  }
  return n;
}

function coverageByDomain(root, apiCoverage) {
  const out = { api: apiCoverage };
  const dbInv = loadDomainInventory(root, "db");
  if (dbInv && Array.isArray(dbInv.tables)) {
    const code = dbInv.tables.length;
    const docs = domainFiles(root, "db").length;
    const ratio = code ? Math.min(docs, code) / code : 0;
    out.db = {
      covered: docs,
      code,
      ratio: Math.round(ratio * 1000) / 1000,
      percent: Math.round(ratio * 100),
    };
  }
  const redisInv = loadDomainInventory(root, "redis");
  if (redisInv && Array.isArray(redisInv.keys)) {
    const code =
      redisInv.keys.filter((k) => k.redis !== false).length || redisInv.keys.length;
    // 0.2.8+: count documented key patterns (not md file count)
    const docs = countDocumentedRedisKeys(root);
    const ratio = code ? Math.min(docs, code) / code : 0;
    out.redis = {
      covered: docs,
      code,
      ratio: Math.round(ratio * 1000) / 1000,
      percent: Math.round(ratio * 100),
      unit: "keys",
    };
  }
  const funcInv = loadDomainInventory(root, "func");
  if (funcInv && Array.isArray(funcInv.modules)) {
    const code = funcInv.modules.reduce(
      (n, m) => n + (m.services?.length || m.stats?.services || 0),
      0
    );
    const docs = domainFiles(root, "func").length;
    const ratio = code ? Math.min(docs, Math.max(code, 1)) / Math.max(code, 1) : 0;
    // func coverage: modules with truths / modules in inventory (fallback file count)
    const invMods = funcInv.modules.length;
    const coveredMods = Math.min(docs, invMods || docs);
    out.func = {
      covered: coveredMods,
      code: invMods || code,
      ratio: invMods
        ? Math.round((coveredMods / invMods) * 1000) / 1000
        : Math.round(ratio * 1000) / 1000,
      percent: invMods
        ? Math.round((coveredMods / invMods) * 100)
        : Math.round(ratio * 100),
      unit: "modules",
    };
  }
  // 0.3.5: jobs coverage prefers inventory.tasks vs docs
  const jobsInv = loadDomainInventory(root, "jobs");
  if (jobsInv && Array.isArray(jobsInv.tasks) && jobsInv.tasks.length) {
    const code = jobsInv.tasks.length;
    const docs = domainFiles(root, "jobs").filter(
      (f) => !/README/i.test(path.basename(f))
    ).length;
    const ratio = code ? Math.min(docs, code) / code : 0;
    out.jobs = {
      covered: docs,
      code,
      ratio: Math.round(ratio * 1000) / 1000,
      percent: Math.round(ratio * 100),
      unit: "tasks",
      source: "inventory",
    };
  } else {
    // fallback: jobs coverage = task md files vs index table rows
    const jobsIndex = path.join(root, "docs", "jobs", "jobs.md");
    if (fs.existsSync(jobsIndex)) {
      const idx = fs.readFileSync(jobsIndex, "utf8");
      const code = (idx.match(/^\|\s*\d{2}\s*\|/gm) || []).length;
      const docs = domainFiles(root, "jobs").filter(
        (f) => !/README/i.test(path.basename(f))
      ).length;
      if (code > 0 || docs > 0) {
        const denom = Math.max(code, docs, 1);
        const ratio = Math.min(docs, denom) / denom;
        out.jobs = {
          covered: docs,
          code: code || docs,
          ratio: Math.round(ratio * 1000) / 1000,
          percent: Math.round(ratio * 100),
          unit: "tasks",
        };
      }
    }
  }
  return out;
}

/** Nav-only API index (links to -part files, no real paths) — exclude from quality avg. */
function isApiNavIndexOnly(text, filePath) {
  const base = path.basename(filePath);
  if (/-part\d/i.test(base)) return false;
  if (hasRealApiPath(text)) return false;
  if (/-part\d/i.test(text) || /分页索引/i.test(text)) return true;
  return false;
}

function nextShardsFromInventory(inventory, limit = 8) {
  if (!inventory || !Array.isArray(inventory.shards)) return [];
  return inventory.shards.slice(0, limit).map((s) => {
    const eps = Array.isArray(s.endpoints) ? s.endpoints : [];
    const count = typeof s.count === "number" ? s.count : eps.length;
    // Serialize as id/path list — never dump full endpoint objects (was [object Object] + 200KB+)
    const ids = eps.slice(0, 40).map((e) => {
      if (typeof e === "string") return e;
      if (e && typeof e === "object") return e.id || e.path || `${e.http || ""} ${e.path || ""}`.trim();
      return String(e);
    });
    return {
      id: s.id,
      package: s.package || s.path || "",
      count,
      endpoints: ids,
    };
  });
}

const GENERIC_LOGIC_RE =
  /接收\s*HTTP[\s\S]{0,120}校验[\s\S]{0,120}(?:入参|参数)[\s\S]{0,120}调用\s*Service[\s\S]{0,120}返回/;

function readHarnessMeta(root) {
  try {
    const found = findHarnessMetaFile(root);
    if (!found) return {};
    const raw = fs.readFileSync(found.abs, "utf8");
    const out = {};
    const ladder = raw.match(/ladder:\s*["']?(L[0-5])["']?/);
    if (ladder) out.ladder = ladder[1];
    const rq = raw.match(/ready_quality:\s*([0-9.]+)/);
    if (rq) out.ready_quality = Number(rq[1]);
    const rc = raw.match(/ready_coverage:\s*([0-9.]+)/);
    if (rc) out.ready_coverage = Number(rc[1]);
    const fp = raw.match(/fill_mcp_profile:\s*["']?([A-Za-z0-9_-]+)["']?/);
    if (fp) out.fill_mcp_profile = fp[1];
    const domains = parseMetaDomains(raw);
    if (domains.length) out.domains = domains;
    const mt = raw.match(/mcp_tracking:\s*["']?([A-Za-z0-9_-]+)["']?/);
    if (mt) out.mcp_tracking = mt[1];
    return out;
  } catch {
    return {};
  }
}

function readMetaLadder(root) {
  return readHarnessMeta(root).ladder || null;
}

function defaultScorePolicy() {
  const coverage_targets = Object.fromEntries(KNOWN_DOMAINS.map((d) => [d, null]));
  return {
    version: "0.3.8",
    coverage_mode: "overall",
    coverage_targets,
    density: {
      api_example_min_ratio: 0.9,
      db_comment_min_ratio: 0.5,
      func_method_desc_min_ratio: 0.7,
      redis_ttl_required: true,
      redis_example_required: true,
    },
    // 无 score-policy 文件 → legacy；有文件但未写 gate_profile → 0.3.0 升 strict
    gate_profile: "legacy",
    gate: {
      morph_floor: null,
      template_completeness_min: null,
      forbid_harness_todo: false,
      todo_scan: null,
      gold_ratio_min: null,
      acceptance_blockers_max: null,
      acceptance_warnings_max: null,
      require_no_lagging_domain: false,
    },
  };
}

/** 0.3.0: strict 缺省门槛 — see lib/ai-coding-gate.mjs */

function loadScorePolicy(root) {
  const p = path.join(root, "docs", "harness-eng", "score-policy.yaml");
  const base = defaultScorePolicy();
  if (!fs.existsSync(p)) return { ...base, present: false, path: null };
  const raw = fs.readFileSync(p, "utf8");
  const mode = raw.match(/^\s*coverage_mode:\s*(\w+)/m);
  if (mode) base.coverage_mode = mode[1];
  for (const d of KNOWN_DOMAINS) {
    const m = raw.match(new RegExp(`^\\s*${d}:\\s*([0-9.]+)`, "m"));
    if (m) base.coverage_targets[d] = Number(m[1]);
  }
  const dens = {
    api_example_min_ratio: raw.match(/api_example_min_ratio:\s*([0-9.]+)/),
    db_comment_min_ratio: raw.match(/db_comment_min_ratio:\s*([0-9.]+)/),
    func_method_desc_min_ratio: raw.match(/func_method_desc_min_ratio:\s*([0-9.]+)/),
    redis_ttl_required: raw.match(/redis_ttl_required:\s*(true|false)/i),
    redis_example_required: raw.match(/redis_example_required:\s*(true|false)/i),
  };
  if (dens.api_example_min_ratio)
    base.density.api_example_min_ratio = Number(dens.api_example_min_ratio[1]);
  if (dens.db_comment_min_ratio)
    base.density.db_comment_min_ratio = Number(dens.db_comment_min_ratio[1]);
  if (dens.func_method_desc_min_ratio)
    base.density.func_method_desc_min_ratio = Number(
      dens.func_method_desc_min_ratio[1]
    );
  if (dens.redis_ttl_required)
    base.density.redis_ttl_required = dens.redis_ttl_required[1].toLowerCase() === "true";
  if (dens.redis_example_required)
    base.density.redis_example_required =
      dens.redis_example_required[1].toLowerCase() === "true";
  const gp = raw.match(/^\s*gate_profile:\s*(\w+)/m);
  // 0.3.0 破坏性：有 score-policy 但未写 gate_profile → strict（存量升档）
  base.gate_profile = gp ? gp[1] : "strict";
  const gate = base.gate || {};
  const explicit = {};
  const mf = raw.match(/morph_floor:\s*([0-9.]+|null)/);
  if (mf && mf[1] !== "null") gate.morph_floor = Number(mf[1]);
  const tc = raw.match(/template_completeness_min:\s*([0-9.]+|null)/);
  if (tc && tc[1] !== "null") gate.template_completeness_min = Number(tc[1]);
  const ft = raw.match(/forbid_harness_todo:\s*(true|false)/i);
  if (ft) {
    explicit.forbid_harness_todo = true;
    gate.forbid_harness_todo = ft[1].toLowerCase() === "true";
  }
  const ts = raw.match(/todo_scan:\s*(\w+|null)/);
  if (ts && ts[1] !== "null") {
    explicit.todo_scan = true;
    gate.todo_scan = ts[1];
  }
  const gr = raw.match(/gold_ratio_min:\s*([0-9.]+|null)/);
  if (gr && gr[1] !== "null") gate.gold_ratio_min = Number(gr[1]);
  const ab = raw.match(/acceptance_blockers_max:\s*([0-9]+|null)/);
  if (ab && ab[1] !== "null") gate.acceptance_blockers_max = Number(ab[1]);
  const aw = raw.match(/acceptance_warnings_max:\s*([0-9]+|null)/);
  if (aw) {
    explicit.acceptance_warnings_max = true;
    if (aw[1] !== "null") gate.acceptance_warnings_max = Number(aw[1]);
    else gate.acceptance_warnings_max = null;
  }
  const nl = raw.match(/require_no_lagging_domain:\s*(true|false)/i);
  if (nl) gate.require_no_lagging_domain = nl[1].toLowerCase() === "true";
  if (base.gate_profile === "gold") {
    base.gate = applyGoldGateDefaults(gate, explicit);
    base.coverage_targets = applyGoldCoverageDefaults(base.coverage_targets);
    if (!mode) base.coverage_mode = "all_domains";
  } else if (base.gate_profile === "strict") {
    base.gate = applyStrictGateDefaults(gate, explicit);
  } else {
    base.gate = gate;
  }
  return { ...base, present: true, path: path.relative(root, p).replace(/\\/g, "/") };
}

const DOMAIN_COV_WEIGHTS = weightsForDomains(KNOWN_DOMAINS, DOMAIN_REGISTRY);

/**
 * coverage_ready evaluation (0.2.27+).
 * @returns {{ ok: boolean, mode: string, targets: object, gaps: array, effective_ratio: number|null }}
 */
function evaluateCoverageReady(
  coverageByDomain,
  overallCoverage,
  readyCoverage,
  policy,
  activeDomains = KNOWN_DOMAINS
) {
  const targets = {};
  for (const d of activeDomains) {
    const t = policy.coverage_targets?.[d];
    targets[d] = typeof t === "number" && !Number.isNaN(t) ? t : readyCoverage;
  }
  const mode = policy.coverage_mode || "overall";
  const gaps = [];
  const domainsPresent = [];
  for (const d of activeDomains) {
    const row = coverageByDomain?.[d];
    if (!row || typeof row.ratio !== "number") continue;
    if (!(row.code > 0)) continue;
    domainsPresent.push(d);
    if (row.ratio + 1e-9 < targets[d]) {
      gaps.push({
        domain: d,
        ratio: row.ratio,
        target: targets[d],
        delta: Math.round((targets[d] - row.ratio) * 1000) / 1000,
      });
    }
  }

  let ok = false;
  let effective = overallCoverage?.ratio ?? null;
  if (mode === "all_domains") {
    ok = domainsPresent.length > 0 && gaps.length === 0;
    if (domainsPresent.length) {
      effective =
        domainsPresent.reduce((s, d) => s + (coverageByDomain[d].ratio || 0), 0) /
        domainsPresent.length;
    }
  } else if (mode === "weighted") {
    let wSum = 0;
    let acc = 0;
    for (const d of domainsPresent) {
      const w = DOMAIN_COV_WEIGHTS[d] || 0;
      wSum += w;
      acc += (coverageByDomain[d].ratio || 0) * w;
    }
    effective = wSum ? acc / wSum : null;
    ok = effective != null && effective + 1e-9 >= readyCoverage;
  } else {
    // overall (default): api / primary inventory coverage
    ok =
      overallCoverage != null &&
      typeof overallCoverage.ratio === "number" &&
      overallCoverage.ratio + 1e-9 >= readyCoverage;
    effective = overallCoverage?.ratio ?? null;
  }
  return {
    ok,
    mode,
    targets,
    gaps,
    effective_ratio: effective == null ? null : Math.round(effective * 1000) / 1000,
    domains_present: domainsPresent,
  };
}

function loadFillPlanSummary(root) {
  const p = path.join(root, "docs", "harness-eng", "fill-plan.yaml");
  if (!fs.existsSync(p)) return { present: false, open_total: null, all_closed: null, batch_count: 0 };
  const text = fs.readFileSync(p, "utf8");
  const statuses = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*status:\s*(\w+)/);
    if (m) statuses.push(m[1]);
  }
  const counts = { open: 0, in_progress: 0, closed: 0, blocked: 0 };
  for (const s of statuses) counts[s] = (counts[s] || 0) + 1;
  const open =
    (counts.open || 0) + (counts.in_progress || 0) + (counts.blocked || 0);
  return {
    present: true,
    open_total: open,
    all_closed: statuses.length > 0 && open === 0,
    batch_count: statuses.length,
    counts,
  };
}

function skeletonReady(root, ladder) {
  const need = ["AGENTS.md", "docs/api/api.md", "docs/func/func.md"];
  let filesOk = 0;
  for (const rel of need) {
    if (fs.existsSync(path.join(root, rel))) filesOk++;
  }
  if (findHarnessMetaFile(root)) filesOk++;
  let l4Ok = 0;
  if (fs.existsSync(path.join(root, ".cursor/mcp.json.example"))) l4Ok++;
  if (findMcpUsageGuideFile(root)) l4Ok++;
  const ladderOk = ladder === "L4" || ladder === "L5" || (ladder === "L3" && l4Ok >= 1);
  // Prefer explicit L4/L5; also accept files present even if meta lagging
  const ok =
    ((ladder === "L4" || ladder === "L5") && filesOk >= 3) ||
    (filesOk >= 3 && l4Ok >= 1);
  return { ok, ladder, files_ok: filesOk, l4_files: l4Ok, ladder_ok: ladderOk };
}

function scanSemanticApi(root) {
  const dir = path.join(root, "docs", "api", "modules");
  const miss = {
    "generic-logic-template": 0,
    "dto-unbound": 0,
  };
  if (!fs.existsSync(dir)) return { miss, files: 0 };
  const files = [];
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.md$/i.test(name)) files.push(p);
    }
  };
  walk(dir);
  let checked = 0;
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    if (isApiNavIndexOnly(text, f)) continue;
    checked++;
    const blocks = text.split(/^##\s+/m);
    for (let i = 1; i < blocks.length; i++) {
      const block = "## " + blocks[i];
      if (GENERIC_LOGIC_RE.test(block)) miss["generic-logic-template"]++;
      const allowed = new Set();
      for (const m of block.matchAll(/请求体类型：`([^`]+)`/g)) {
        const t = m[1].split(/[.<]/).pop();
        if (t) allowed.add(t);
      }
      for (const m of block.matchAll(/返回类型：`([^`]+)`/g)) {
        const t = m[1].split(/[.<]/).pop();
        if (t) allowed.add(t);
      }
      for (const m of block.matchAll(/bodyType["\s:]+([A-Za-z0-9_]+)/g)) {
        allowed.add(m[1]);
      }
      for (const m of block.matchAll(/<!--\s*dto:([A-Za-z0-9_]+)\s*-->/g)) {
        if (allowed.size && !allowed.has(m[1])) miss["dto-unbound"]++;
      }
    }
  }
  return { miss, files: checked };
}

function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(args.root);
  if (!fs.existsSync(root)) throw new Error(`root missing: ${root}`);
  const metaFull = readHarnessMeta(root);
  // 0.2.26: meta overrides defaults when CLI flag omitted
  if (!args.readyQualitySet && Number.isFinite(metaFull.ready_quality)) {
    args.readyQuality = metaFull.ready_quality;
  }
  if (!args.readyCoverageSet && Number.isFinite(metaFull.ready_coverage)) {
    args.readyCoverage = metaFull.ready_coverage;
  }
  const scorePolicy = loadScorePolicy(root);
  const progress = createProgress({ quiet: args.quiet, label: "fill-score" });
  progress.log("start");

  let inventory = loadJson(args.inventory);
  if (!inventory) {
    inventory = mergeApiInventories(root);
  }
  const prev = loadJson(args.compare);

  const domains = resolveScoreDomains({
    cliDomains: args.domains,
    metaDomains: metaFull.domains,
    root,
    registry: DOMAIN_REGISTRY,
  });
  const weights = weightsForDomains(domains, DOMAIN_REGISTRY);
  // 0.2.10: per-domain morphological caps under current scoreTruthFile rules
  // 0.2.26: domain_caps / formula_ceiling are MORPH axis only — NOT ai_coding_ready
  const domainCaps = morphCapsForDomains(domains, DOMAIN_REGISTRY);
  const formulaCeiling = Math.round(
    domains.reduce((s, d) => s + (domainCaps[d] || 75) * (weights[d] || 0), 0)
  );
  const report = {
    ok: true,
    root,
    modules: args.modules,
    scored_domains: domains,
    threshold: args.threshold,
    formula_ceiling: formulaCeiling,
    domain_caps: domainCaps,
    domains: {},
    gaps: [],
    quality: {},
    coverage: null,
    next_shards: [],
    diff: null,
    suggest_next: null,
    suggest_upgrade: null,
    miss_histogram: {},
    template_completeness: { overall: null, by_domain: {} },
  };

  let wSum = 0;
  let overall = 0;
  let apiDocEndpoints = 0;
  const filterNotes = [];
  const missHistogram = {};
  const tcByDomain = {};
  let tcWeighted = 0;
  let tcWSum = 0;

  for (const d of domains) {
    progress.step(domains.indexOf(d) + 1, domains.length, d);
    const allFiles = domainFiles(root, d);
    let files = filterByModules(allFiles, args.modules, d);
    const indexName = indexFileName(d, DOMAIN_REGISTRY);
    const indexPath = path.join(root, "docs", d, indexName);
    const hasIndex = fs.existsSync(indexPath);
    const filteredOut =
      args.modules.length > 0 &&
      allFiles.length > 0 &&
      files.length === 0 &&
      d !== "db" &&
      d !== "redis" &&
      d !== "jobs";
    if (filteredOut) {
      filterNotes.push(
        `${d}: 磁盘有 ${allFiles.length} 份真相，但 --modules 过滤后为 0（未匹配模块名，非「无真相」）`
      );
    }
    const fileScores = [];
    let skippedNav = 0;
    const domainMiss = {};
    const tcRatios = [];
    for (const f of files) {
      const text = fs.readFileSync(f, "utf8");
      if (d === "api" && isApiNavIndexOnly(text, f)) {
        skippedNav++;
        continue;
      }
      const r = scoreTruthFile(text, d, scorePolicy);
      const tc = templateCompletenessForFile(text, d, scorePolicy);
      r.template_completeness = Math.round(tc.ratio * 100);
      const rel = path.relative(root, f).replace(/\\/g, "/");
      fileScores.push({ path: rel, ...r });
      tcRatios.push(tc.ratio);
      if (d === "api" && r.endpoints) apiDocEndpoints += r.endpoints;
      if (r.score < 60) {
        report.gaps.push({
          domain: d,
          path: rel,
          score: r.score,
          issues: r.issues.slice(0, 5),
        });
      }
      for (const c of r.checks || []) {
        if (!c.ok) {
          domainMiss[c.id] = (domainMiss[c.id] || 0) + 1;
          missHistogram[c.id] = (missHistogram[c.id] || 0) + 1;
        }
      }
    }
    const domainScore = !hasIndex
      ? 0
      : fileScores.length === 0
        ? 15
        : Math.max(15, avg(fileScores.map((x) => x.score)));
    const domainTc = tcRatios.length
      ? Math.round((tcRatios.reduce((a, b) => a + b, 0) / tcRatios.length) * 100)
      : null;
    if (domainTc != null && (hasIndex || files.length)) {
      tcByDomain[d] = domainTc;
      tcWeighted += domainTc * weights[d];
      tcWSum += weights[d];
    }
    report.domains[d] = {
      score: domainScore,
      index: hasIndex,
      truths: fileScores.length,
      truths_unfiltered: allFiles.length,
      skipped_nav_indexes: skippedNav || undefined,
      module_filter_empty: filteredOut,
      shells: fileScores.filter((x) => x.shell).length,
      miss: domainMiss,
      template_completeness: domainTc,
      files: args.summaryOnly && !args.verbose ? undefined : fileScores,
    };
    if (hasIndex || files.length) {
      wSum += weights[d];
      overall += domainScore * weights[d];
    }
  }
  report.filter_notes = filterNotes;
  report.miss_histogram = missHistogram;
  report.template_completeness = {
    overall: tcWSum ? Math.round(tcWeighted / tcWSum) : null,
    by_domain: tcByDomain,
  };

  report.overall = wSum ? Math.round(overall / wSum) : 0;
  report.quality = { overall: report.overall, domains: Object.fromEntries(
    domains.map((d) => [d, report.domains[d].score])
  ) };
  report.coverage = coverageFromInventory(inventory, apiDocEndpoints);
  report.coverage_by_domain = coverageByDomain(root, report.coverage);
  report.next_shards = nextShardsFromInventory(inventory);

  const qOk = report.overall >= args.readyQuality;
  const covIncomplete = !report.coverage;
  const covEval = evaluateCoverageReady(
    report.coverage_by_domain,
    report.coverage,
    args.readyCoverage,
    scorePolicy,
    domains
  );
  // compat ready.ok still uses overall api coverage vs ready_coverage
  const covOkCompat = covIncomplete ? null : report.coverage.ratio >= args.readyCoverage;
  // 0.2.17: ready.ok = morph+coverage compat only (NOT ai coding gate)
  report.ready = {
    ok: qOk && (covIncomplete ? false : covOkCompat),
    quality_ok: qOk,
    coverage_ok: covOkCompat,
    coverage_incomplete: covIncomplete,
    rule: `quality>=${args.readyQuality} && coverage>=${args.readyCoverage} (compat; see ai_coding_ready)`,
    ready_quality: args.readyQuality,
    ready_coverage: args.readyCoverage,
  };

  const metaLadder = readMetaLadder(root);
  const skel = skeletonReady(root, metaLadder);
  const plan = loadFillPlanSummary(root);
  const semScan = scanSemanticApi(root);
  for (const [k, v] of Object.entries(semScan.miss)) {
    if (v > 0) missHistogram[k] = (missHistogram[k] || 0) + v;
  }
  report.miss_histogram = missHistogram;

  const genericN = semScan.miss["generic-logic-template"] || 0;
  const unboundN = semScan.miss["dto-unbound"] || 0;
  const tcOverall = report.template_completeness?.overall ?? 0;
  // 0.3.3: gold 语义收紧；strict/legacy 保持宽松噪声阈值
  const gateProfile = scorePolicy.gate_profile || "legacy";
  let semanticOk;
  let semanticRule;
  if (gateProfile === "gold") {
    semanticOk = genericN <= 0 && unboundN <= 0 && tcOverall >= 95;
    semanticRule =
      "gold: generic_logic<=0 && dto_unbound<=0 && template_completeness>=95";
  } else {
    semanticOk = genericN <= 5 && unboundN <= 3 && tcOverall >= 50;
    semanticRule =
      "generic_logic<=5 && dto_unbound<=3 && template_completeness>=50";
  }
  // 0.2.27: coverage_ready respects score-policy coverage_mode
  const coverageReady = !covIncomplete && !!covEval.ok;
  const planClosed = plan.present ? !!plan.all_closed : false;

  // 0.2.18/0.2.29: gold before gate so strict/gold can require acceptance_*_max
  const gold = runGoldAcceptance(root);
  report.gold_ratio = gold.gold_pass_ratio;
  report.acceptance = {
    blockers: gold.blockers,
    warnings: gold.warnings,
    status: gold.status,
  };
  report.draft_vs_ssot =
    "SSOT 须过 acceptance；heuristic draft 仅 .fill-work（见 truth-quality.md）";

  const baseAiOk =
    skel.ok && coverageReady && semanticOk && (plan.present ? planClosed : false);
  const gateEval = evaluateAiCodingGate(report, scorePolicy, gold);
  const aiCoding = baseAiOk && gateEval.ok;
  const baseBlockers = [
    !skel.ok && "skeleton_ready",
    !coverageReady && "coverage_ready",
    !semanticOk && "semantic_ready",
    !plan.present && "fill_plan_missing",
    plan.present && !planClosed && "fill_plan_open_batches",
  ].filter(Boolean);

  report.skeleton_ready = skel;
  report.coverage_ready = {
    ok: coverageReady,
    coverage_incomplete: covIncomplete,
    mode: covEval.mode,
    targets: covEval.targets,
    gaps: covEval.gaps,
    effective_ratio: covEval.effective_ratio,
  };
  report.score_policy = {
    present: !!scorePolicy.present,
    path: scorePolicy.path || null,
    coverage_mode: scorePolicy.coverage_mode,
    coverage_targets: scorePolicy.coverage_targets,
    density: scorePolicy.density,
    gate_profile: scorePolicy.gate_profile || "legacy",
    gate: scorePolicy.gate || null,
  };
  report.semantic_ready = {
    ok: semanticOk,
    generic_logic_template: genericN,
    dto_unbound: unboundN,
    api_files_scanned: semScan.files,
    rule: semanticRule,
  };
  report.fill_plan = plan;
  const gateLabel =
    gateProfile === "gold" ? "gate(gold)" : gateProfile === "strict" ? "gate(strict)" : null;
  report.ai_coding_ready = {
    ok: aiCoding,
    rule: gateEval.active
      ? `skeleton_ready && coverage_ready && semantic_ready && fill_plan.all_closed && ${gateLabel}`
      : "skeleton_ready && coverage_ready && semantic_ready && fill_plan.all_closed",
    blockers: [...baseBlockers, ...gateEval.blockers],
    gate: gateEval,
  };
  // pass tracks morph ready when inventory present; without inventory stay quality-only vs --threshold
  report.pass = covIncomplete
    ? report.overall >= args.threshold
    : report.ready.ok;

  if (prev && typeof prev.overall === "number") {
    report.diff = {
      overall: report.overall - prev.overall,
      api: (report.domains.api?.score || 0) - (prev.domains?.api?.score || 0),
      coverage_percent:
        report.coverage && prev.coverage
          ? report.coverage.percent - (prev.coverage.percent || 0)
          : null,
    };
  }

  report.gaps.sort((a, b) => a.score - b.score);
  report.gaps = report.gaps.slice(0, 15);

  if (report.ai_coding_ready.ok) {
    report.suggest_next =
      "开干=YES（ai_coding_ready）；可开始 AI 改业务，仍须人工审契约与代码";
  } else if (gateEval.active && gateEval.blockers.length && baseAiOk) {
    report.suggest_next =
      "开干=NO · gate：" + gateEval.blockers.join("、") + " → 清红项后再开业务改动";
  } else if (!plan.present) {
    report.suggest_next =
      "先 fill-plan --init [--gold]，再按批次 fill-truths-agents；勿用 auto/heuristic 写 SSOT";
  } else if (typeof report.gold_ratio === "number" && report.gold_ratio < 0.6) {
    report.suggest_next = `gold_ratio=${report.gold_ratio} 偏低 → acceptance-check 清 blocker，按 truth-quality 精修金标；勿空追 overall`;
  } else if (!planClosed) {
    report.suggest_next = `fill-plan 仍有开放批次≈${plan.open_total} → 继续 fill-truths-agents；勿因贴 formula_ceiling 早停`;
  } else if (!semanticOk) {
    report.suggest_next = `semantic_ready=false（generic_logic=${genericN}, dto_unbound=${unboundN}）→ 按接口重填逻辑/清错挂 DTO`;
  } else if (!skel.ok) {
    report.suggest_next = "skeleton_ready=false → upgrade/resume 到 L4（hooks/MCP example）";
  } else if (covIncomplete) {
    report.suggest_next =
      "补 inventory（默认 docs/api/.fill-work/）后再判 coverage_ready；fill-mcp【推荐】→ agents";
  } else if (!coverageReady) {
    report.suggest_next =
      "补覆盖：inventory → fill-plan 批次 → fill-truths-agents";
  } else {
    report.suggest_next =
      "继续 fill-truths-agents / fill-calibrate-live；开干只看 ai_coding_ready 与 gate blockers";
  }

  report.suggest_upgrade = buildSuggestUpgrade(report, metaLadder);

  if (args.writeProgress) {
    try {
      writeProgress(root, {
        last_score_overall: report.overall,
        last_ready: !!report.ready?.ok,
        last_ai_coding_ready: !!report.ai_coding_ready?.ok,
        last_mode: "fill-score",
        notes: report.suggest_upgrade?.reason || "",
      });
      progress.log(`wrote ${"docs/harness-eng/progress.yaml"}`);
    } catch (e) {
      progress.log(`progress write skip: ${e.message || e}`);
    }
  }

  progress.step(domains.length, domains.length, `overall=${report.overall}%`);
  progress.done(
    `ai_coding=${report.ai_coding_ready.ok ? "YES" : "NO"} ready_compat=${report.ready.ok ? "YES" : "NO"} gold_ratio=${
      report.gold_ratio == null ? "n/a" : report.gold_ratio
    }`
  );

  // 0.2.19: --output writes JSON to file; --json suppresses summary
  if (args.output) {
    const outAbs = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, JSON.stringify(report, null, 2), "utf8");
    console.error(`Wrote ${outAbs}`);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }

  if (args.json) return;

  report.focus = args.focus || "full";
  console.log("");
  console.log(`—— fill-score 摘要（focus=${report.focus}）——`);
  if (report.focus !== "morph") {
    console.log(
      `开干: ${report.ai_coding_ready.ok ? "YES" : "NO"}  覆盖: ${
        report.coverage ? report.coverage.percent + "%" : "—"
      }(mode=${covEval.mode})  gate_profile: ${scorePolicy.gate_profile || "legacy"}`
    );
    console.log(
      `分层: skeleton=${skel.ok ? "YES" : "NO"} coverage=${coverageReady ? "YES" : "NO"} semantic=${semanticOk ? "YES" : "NO"} plan_closed=${
        plan.present ? (planClosed ? "YES" : `NO(open≈${plan.open_total})`) : "MISSING"
      }${gateEval.active ? ` gate=${gateEval.ok ? "YES" : "NO"}` : ""}`
    );
    if (report.ai_coding_ready.blockers?.length) {
      console.error(`开干 blockers: ${report.ai_coding_ready.blockers.join(" · ")}`);
    }
    if (covEval.gaps?.length) {
      console.error(
        `coverage_gaps: ${covEval.gaps.map((g) => `${g.domain}:${Math.round(g.ratio * 100)}%<${Math.round(g.target * 100)}%`).join(" · ")}`
      );
    }
  }
  if (report.focus !== "gate") {
    console.log(
      `形态: overall=${report.overall}%（ceiling≈${formulaCeiling}%）  template_completeness: ${
        report.template_completeness?.overall != null
          ? report.template_completeness.overall + "%"
          : "—"
      }  ready.ok(compat)=${report.ready.ok ? "YES" : "NO"}（≠开干）`
    );
  }
  if (report.focus === "full") {
    console.log(
      `说明: 开干只看 ai_coding_ready；形态（overall/domain_caps/formula_ceiling）勿当开干；覆盖看 coverage_ready（score-policy）`
    );
    console.log(
      `技术细节 ready(compat): ${report.ready.rule}  quality_ok=${report.ready.quality_ok}  coverage_ok=${report.ready.coverage_ok}${
        report.ready.coverage_incomplete ? "  (coverage incomplete: no inventory)" : ""
      }`
    );
  } else if (report.focus === "morph") {
    console.log(`说明: focus=morph — 看诊断台；开干请 fill-gate / fill-score`);
  } else {
    console.log(`说明: focus=gate — 看决策台；形态细节请 fill-morph / fill-score`);
  }
  if (genericN || unboundN) {
    console.log(`semantic miss: generic-logic-template=${genericN}  dto-unbound=${unboundN}`);
  }
  if (report.coverage) {
    console.log(
      `coverage: ${report.coverage.percent}%  (docs=${report.coverage.covered} / code=${report.coverage.code})`
    );
  }
  if (report.coverage_by_domain) {
    const parts = [];
    for (const [k, v] of Object.entries(report.coverage_by_domain)) {
      if (v && typeof v.percent === "number") parts.push(`${k}=${v.percent}%`);
    }
    if (parts.length) console.log(`coverage_by_domain: ${parts.join("  ")}`);
  }
  if (report.diff) {
    console.log(
      `diff vs compare: overall ${report.diff.overall >= 0 ? "+" : ""}${report.diff.overall}  api ${report.diff.api >= 0 ? "+" : ""}${report.diff.api}`
    );
  }
  for (const d of domains) {
    const x = report.domains[d];
    const filt = x.module_filter_empty
      ? ` ⚠模块过滤空(磁盘${x.truths_unfiltered})`
      : "";
    console.log(
      `${d}: ${x.score}%  (truths=${x.truths}, shells≈${x.shells}, index=${x.index})${filt}`
    );
  }
  if (filterNotes.length) {
    console.log("模块过滤说明（非无真相）:");
    for (const n of filterNotes) console.log(`  - ${n}`);
  }
  if (Object.keys(missHistogram).length) {
    console.log("miss_histogram (domain checks):");
    const sorted = Object.entries(missHistogram).sort((a, b) => b[1] - a[1]);
    for (const [id, n] of sorted.slice(0, 12)) {
      console.log(`  - ${id}: ${n}`);
    }
  }
  if (args.verbose) {
    console.log("verbose checks:");
    for (const d of domains) {
      const files = report.domains[d]?.files || [];
      for (const f of files.slice(0, 40)) {
        const parts = (f.checks || []).map((c) => `[${c.ok ? "OK" : "MISS"}] ${c.id}`);
        console.log(`  ${f.path} (${f.score}%) ${parts.join(" ")}`);
      }
    }
  }
  if (report.gaps.length) {
    console.log("缺口 Top:");
    for (const g of report.gaps.slice(0, 8)) {
      console.log(`  - [${g.score}%] ${g.path} · ${g.issues.join("; ")}`);
    }
  }
  if (report.next_shards.length) {
    console.log("next_shards:");
    for (const s of report.next_shards) {
      console.log(`  - ${s.id}: ${s.package} (count=${s.count})`);
    }
  }
  console.log(`建议下一步: ${report.suggest_next}`);
  if (report.suggest_upgrade) {
    console.log(
      `suggest_upgrade: next_ladder=${report.suggest_upgrade.next_ladder || "—"} · ${report.suggest_upgrade.reason}`
    );
  }
}

try {
  main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
