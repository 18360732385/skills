#!/usr/bin/env node
/**
 * fill-merge-api — merge docs/api/.fill-work fragments into SSOT (no npm deps).
 * Compat (0.3.7+ / 0.5.9): prefer `fill-merge.mjs --domain api` for check/write;
 * keep this script for --enrich-dto / --module / --auto-fill extras.
 *
 * Usage:
 *   node scripts/fill-merge-api.mjs --inventory inv.json --work-dir <root>/docs/api/.fill-work --check
 *   node scripts/fill-merge-api.mjs --inventory inv.json --work-dir ... --target docs/api/modules/01-x.md --write
 *   node scripts/fill-merge-api.mjs ... --write --enrich-dto --source-root <java-root>
 *   node scripts/fill-merge-api.mjs ... --write --force-write   # skip acceptance (handoff only)
 *   node scripts/fill-merge-api.mjs --help
 *
 * Success: missing = inventory − merged(evidence) must be empty; dup evidence fails.
 * 0.2.18+: --write runs acceptance-check on work-dir (blockers → fail) unless --force-write.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { findClassFile, parseFields, toMarkdown } from "./fill-dto-fields.mjs";
import { writeAutoFillShards } from "./lib/fill-auto-api.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {
    inventory: null,
    workDir: null,
    target: null,
    header: null,
    module: null,
    check: false,
    write: false,
    out: null,
    enrichDto: false,
    sourceRoot: null,
    autoFill: false,
    forceWrite: false,
    skipAcceptance: false,
    gold: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--inventory") out.inventory = argv[++i];
    else if (a === "--work-dir") out.workDir = argv[++i];
    else if (a === "--target") out.target = argv[++i];
    else if (a === "--header") out.header = argv[++i];
    else if (a === "--module") out.module = argv[++i];
    else if (a === "--check") out.check = true;
    else if (a === "--write") out.write = true;
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--enrich-dto") out.enrichDto = true;
    else if (a === "--source-root") out.sourceRoot = argv[++i];
    else if (a === "--auto-fill") out.autoFill = true;
    else if (a === "--force-write") out.forceWrite = true;
    else if (a === "--skip-acceptance") out.skipAcceptance = true;
    else if (a === "--gold") out.gold = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function runAcceptance(workDir, gold) {
  const script = path.join(__dirname, "acceptance-check.mjs");
  const argv = [script, "--work-dir", workDir, "--domain", "api"];
  if (gold) argv.push("--gold");
  const r = spawnSync(process.execPath, argv, { encoding: "utf8" });
  const stdout = r.stdout || "";
  let parsed = null;
  try {
    const i = stdout.indexOf("{");
    const j = stdout.lastIndexOf("}");
    if (i >= 0 && j > i) parsed = JSON.parse(stdout.slice(i, j + 1));
  } catch {
    /* ignore */
  }
  return {
    status: r.status == null ? 1 : r.status,
    stderr: r.stderr || "",
    report: parsed,
  };
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-merge-api.mjs --inventory inv.json --work-dir <dir> --check
  node scripts/fill-merge-api.mjs --inventory inv.json --work-dir <dir> --target <ssot.md> --write
  node scripts/fill-merge-api.mjs ... --write --enrich-dto --source-root <java-root>
  node scripts/fill-merge-api.mjs ... --write --force-write
  node scripts/fill-merge-api.mjs ... --auto-fill --check|--write

Options:
  --inventory   fill-inventory-api JSON
  --work-dir    directory of shard fragments (*.md)
  --target      SSOT module truth path (required with --write)
  --header      optional markdown header file prepended before ## 1.
  --module      filter fragments by module (auto-detected from inventory.module)
  --check       validate only (missing/dup + acceptance); exit 1 on failure
  --write       write SSOT to --target (implies check + acceptance-check)
  --force-write skip acceptance blockers AND missing-endpoint check (handoff only; stderr warn)
  --gold        acceptance gold mode (shallow-resp is blocker)
  --out         also write merged markdown to this path
  --enrich-dto  replace TODO/placeholder request-param tables using inventory bodyType
  --source-root Java source root (required with --enrich-dto)
  --auto-fill   if work-dir empty/missing fragments, generate shards from inventory+source
`);
}

function walkMd(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkMd(p, acc);
    else if (/\.md$/i.test(name)) acc.push(p);
  }
  return acc;
}

/** Split fragment into endpoint sections keyed by evidence */
function parseFragmentSections(text, sourcePath) {
  const sections = [];
  const re = /^##\s+\d+\.\s+.+$/gm;
  const matches = [...text.matchAll(re)];
  if (!matches.length) {
    const ev = extractEvidence(text);
    if (ev) sections.push({ evidence: ev, body: text.trim(), source: sourcePath });
    return sections;
  }
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const body = text.slice(start, end).trim();
    const ev = extractEvidence(body);
    if (!ev) {
      sections.push({ evidence: null, body, source: sourcePath, warn: "no-evidence" });
    } else {
      sections.push({ evidence: ev, body, source: sourcePath });
    }
  }
  return sections;
}

function extractEvidence(body) {
  const m =
    body.match(/\*\*evidence:\*\*\s*`([^`]+)`/i) ||
    body.match(/\*\*evidence:\*\*\s*(\S+)/i) ||
    body.match(/evidence:\s*`([^`]+)`/i) ||
    body.match(/evidence:\s*(\S+\.java#\w+)/i);
  return m ? m[1].trim() : null;
}

function normalizeEvidence(ev) {
  if (!ev) return "";
  return ev.replace(/\\/g, "/");
}

function loadInventory(p) {
  const abs = path.resolve(p);
  let raw = fs.readFileSync(abs, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const j = JSON.parse(raw);
  if (!Array.isArray(j.endpoints)) throw new Error("inventory.endpoints missing");
  return j;
}

function defaultHeader(inv) {
  const n = inv.endpoints.length;
  const mod = inv.module || "module";
  return `# ${mod} API

> **真相文档（SSOT）**（fill-merge-api 合并）。  
> **累计接口数**：${n}

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 合并 | fill-merge-api from .fill-work | harness-eng | ${new Date().toISOString().slice(0, 10)} |

---

`;
}

function needsDtoEnrich(body) {
  if (!/###\s*请求参数/.test(body)) return false;
  if (/TODO\(harness-eng\)/i.test(body)) return true;
  if (/\| — \| — \| — \|/.test(body)) return true;
  if (/\| 参数名 \|[\s\S]*?\|\s*—\s*\|/.test(body)) return true;
  // empty-ish table: only header rows under 请求参数
  const m = body.match(/###\s*请求参数([\s\S]*?)(?=###\s*|$)/);
  if (!m) return false;
  const block = m[1];
  const dataRows = (block.match(/^\|[^|\n]+\|/gm) || []).filter(
    (r) => !/参数名/.test(r) && !/^\|\s*---/.test(r)
  );
  return dataRows.length === 0;
}

function simpleTypeName(bodyType) {
  if (!bodyType) return null;
  // strip generics: AjaxResult<Foo> → Foo; List<Bar> → Bar; com.x.Y → Y
  let t = String(bodyType).trim();
  const gen = t.match(/<([^<>]+)>/);
  if (gen) t = gen[1].trim();
  t = t.replace(/\[\]$/, "");
  const parts = t.split(".");
  t = parts[parts.length - 1];
  if (!t || /^(String|Integer|Long|Boolean|Object|Map|Void|void)$/i.test(t)) return null;
  return t;
}

function enrichSectionBody(body, ep, sourceRoot, stats) {
  const className =
    simpleTypeName(ep.bodyType) ||
    simpleTypeName(
      (body.match(/@RequestBody\s+(?:\w+\s+)?(\w+)/) || [])[1] ||
        (body.match(/请求体[：:]\s*`?(\w+)`?/) || [])[1]
    );
  if (!className) {
    stats.skipped.push({ evidence: ep.evidence, reason: "no-bodyType" });
    return body;
  }
  if (!needsDtoEnrich(body)) {
    stats.skipped.push({ evidence: ep.evidence, reason: "already-filled" });
    return body;
  }
  try {
    const file = findClassFile(sourceRoot, className);
    const src = fs.readFileSync(file, "utf8");
    const fields = parseFields(src);
    const table = toMarkdown(className, file.replace(/\\/g, "/"), fields).trim();
    const replaced = body.replace(
      /(###\s*请求参数\s*\n)([\s\S]*?)(?=\n###\s*|\n##\s+|$)/,
      `$1\n${table}\n`
    );
    if (replaced === body) {
      stats.skipped.push({ evidence: ep.evidence, reason: "replace-failed" });
      return body;
    }
    stats.enriched.push({ evidence: ep.evidence, className, fields: fields.length });
    return replaced;
  } catch (e) {
    stats.skipped.push({
      evidence: ep.evidence,
      reason: String(e.message || e),
      className,
    });
    return body;
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }
  if (!args.inventory || !args.workDir) {
    printHelp();
    throw new Error("Required: --inventory and --work-dir");
  }
  if (args.write && !args.target) {
    throw new Error("--write requires --target");
  }
  if (args.enrichDto && !args.sourceRoot) {
    throw new Error("--enrich-dto requires --source-root");
  }

  const inv = loadInventory(args.inventory);
  const workDir = path.resolve(args.workDir);
  let files = walkMd(workDir);
  if (!files.length && args.autoFill) {
    const rootGuess =
      args.sourceRoot ||
      (inv.root ? inv.root : path.resolve(path.dirname(args.inventory), "../.."));
    const root = path.resolve(String(rootGuess));
    console.error(`--auto-fill: generating shards under ${workDir}`);
    writeAutoFillShards(inv, workDir, root, false);
    files = walkMd(workDir);
  }
  if (!files.length) throw new Error(`no markdown in work-dir: ${workDir}`);

  // 0.2.19: multi-module support — build inventory evidence set and filter fragments
  const invEvidenceSet = new Set(
    inv.endpoints.map((e) => normalizeEvidence(e.evidence))
  );
  const moduleName = args.module || inv.module || null;

  const byEvidence = new Map();
  const dups = [];
  const noEvidence = [];
  const skippedOtherModule = [];

  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    const rel = f.replace(/\\/g, "/");
    for (const sec of parseFragmentSections(text, rel)) {
      if (!sec.evidence) {
        noEvidence.push({ source: sec.source, preview: sec.body.slice(0, 80) });
        continue;
      }
      const key = normalizeEvidence(sec.evidence);
      // 0.2.19: skip fragments whose evidence is not in this inventory (other modules)
      if (invEvidenceSet.size > 0 && !invEvidenceSet.has(key)) {
        skippedOtherModule.push({ evidence: key, source: sec.source });
        continue;
      }
      if (byEvidence.has(key)) {
        dups.push({ evidence: key, a: byEvidence.get(key).source, b: sec.source });
      } else {
        byEvidence.set(key, sec);
      }
    }
  }

  const invKeys = inv.endpoints.map((e) => normalizeEvidence(e.evidence));
  const invSet = new Set(invKeys);
  const mergedKeys = [...byEvidence.keys()];
  const missing = invKeys.filter((k) => !byEvidence.has(k));
  const extra = mergedKeys.filter((k) => !invSet.has(k));

  const report = {
    ok: dups.length === 0 && missing.length === 0,
    inventoryEndpoints: inv.endpoints.length,
    fragmentFiles: files.length,
    mergedSections: byEvidence.size,
    module: moduleName,
    skippedOtherModule: skippedOtherModule.length,
    missing,
    extra,
    dups,
    noEvidenceCount: noEvidence.length,
    enrich: null,
  };

  if (dups.length) {
    console.error("FAIL: duplicate evidence");
    process.exitCode = 1;
  }
  if (missing.length && !args.forceWrite) {
    console.error(`FAIL: missing ${missing.length} inventory endpoints`);
    process.exitCode = 1;
  } else if (missing.length && args.forceWrite) {
    console.error(`WARN: --force-write skips ${missing.length} missing endpoints; SSOT will have gaps`);
  }
  if (skippedOtherModule.length) {
    console.error(`INFO: skipped ${skippedOtherModule.length} fragments from other modules (multi-module work-dir)`);
  }

  // 0.2.18: acceptance semantic gate before promote/--write
  const needAcceptance =
    (args.write || args.check) && !args.forceWrite && !args.skipAcceptance;
  if (needAcceptance) {
    const acc = runAcceptance(workDir, args.gold);
    report.acceptance = {
      status: acc.status,
      gold_pass_ratio: acc.report?.gold_pass_ratio ?? null,
      blockers: acc.report?.blockers?.length ?? null,
      warnings: acc.report?.warnings?.length ?? null,
    };
    if (acc.status === 1) {
      report.ok = false;
      console.error("FAIL: acceptance-check blockers (see truth-quality.md)");
      if (acc.stderr) console.error(acc.stderr.trim());
      process.exitCode = 1;
    } else if (acc.status === 2) {
      console.error("WARN: acceptance-check warnings (gold_pass_ratio may be low)");
    }
  } else if (args.forceWrite && args.write) {
    console.error("WARN: --force-write skips acceptance-check; do not treat as gold SSOT");
  }

  if (args.check && !args.write && !args.out) {
    console.log(JSON.stringify(report, null, 2));
    if (report.ok) console.error("CHECK OK");
    return;
  }
  if (!report.ok && !args.forceWrite) {
    console.log(JSON.stringify(report, null, 2));
    throw new Error("merge aborted: fix missing/dups/acceptance before --write (or use --force-write)");
  }
  if (!report.ok && args.forceWrite && dups.length > 0) {
    console.log(JSON.stringify(report, null, 2));
    throw new Error("merge aborted: duplicate evidence cannot be force-written");
  }

  const enrichStats = { enriched: [], skipped: [] };
  const sourceRoot = args.sourceRoot ? path.resolve(args.sourceRoot) : null;

  // Build body in inventory order
  const parts = [];
  let header = defaultHeader(inv);
  if (args.header) {
    header = fs.readFileSync(path.resolve(args.header), "utf8");
    if (!header.endsWith("\n")) header += "\n";
  }
  parts.push(header);

  let n = 1;
  for (const ep of inv.endpoints) {
    const key = normalizeEvidence(ep.evidence);
    const sec = byEvidence.get(key);
    if (!sec) {
      // 0.2.19: skip missing endpoints (force-write with gaps)
      continue;
    }
    let body = sec.body.replace(/^##\s+\d+\.\s+/, `## ${n}. `);
    if (args.enrichDto && sourceRoot) {
      body = enrichSectionBody(body, ep, sourceRoot, enrichStats);
    }
    parts.push(body);
    if (!body.endsWith("\n")) parts.push("\n");
    parts.push("\n");
    n++;
  }

  if (args.enrichDto) {
    report.enrich = {
      ok: true,
      enriched: enrichStats.enriched.length,
      skipped: enrichStats.skipped.length,
      details: enrichStats,
    };
  }

  console.log(JSON.stringify(report, null, 2));

  const merged = parts.join("");
  if (args.out) {
    const outAbs = path.resolve(args.out);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, merged, "utf8");
    console.error(`Wrote ${outAbs}`);
  }
  if (args.write) {
    const tgt = path.resolve(args.target);
    fs.mkdirSync(path.dirname(tgt), { recursive: true });
    fs.writeFileSync(tgt, merged, "utf8");
    console.error(`Wrote SSOT ${tgt}`);
  }
  if (!args.write && !args.out) {
    console.error(`DRY-RUN merged chars=${merged.length} sections=${n - 1}`);
  }
}

try {
  main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
