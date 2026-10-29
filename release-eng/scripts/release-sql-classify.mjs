#!/usr/bin/env node
/**
 * release-sql-classify — SQL 整理归类：文件名双轨 → cache(sha256) → AI JSON
 *
 * Usage:
 *   node release-sql-classify.mjs --refs-dir <dir> [--prior-artifacts <json>] [--ai-json <file>]
 *     [--format json|prompt-md] [--skip-ai-classify] [--out <file>]
 *
 * 不调用外部模型；needsAi 时由 Agent 读 prompt-md 产出 --ai-json（无需用户确认）。
 * Exit 0=闭环；1=仍有未决（且未 --skip-ai-classify）
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  classifyMigrationKindByFilename,
  sha256Hex,
  stripBom,
} from "./release-format.mjs";

function parseArgs(argv) {
  const out = {
    root: process.cwd(),
    refsDir: null,
    priorArtifacts: null,
    aiJson: null,
    format: "json",
    out: null,
    skipAiClassify: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = path.resolve(argv[++i] || "");
    else if (a === "--refs-dir") out.refsDir = argv[++i];
    else if (a === "--prior-artifacts") out.priorArtifacts = argv[++i];
    else if (a === "--ai-json") out.aiJson = argv[++i];
    else if (a === "--format") out.format = argv[++i] || "json";
    else if (a === "--out") out.out = argv[++i] || null;
    else if (a === "--skip-ai-classify") out.skipAiClassify = true;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function baseName(p) {
  return String(p || "").replace(/\\/g, "/").split("/").pop() || "";
}

function loadPriorCache(artifactsPath) {
  /** @type {Map<string, { kind: string, stableId?: string }>} */
  const bySha = new Map();
  if (!artifactsPath || !fs.existsSync(artifactsPath)) return bySha;
  try {
    const art = JSON.parse(stripBom(fs.readFileSync(artifactsPath, "utf8")));
    for (const b of art.sqlBundles || []) {
      for (const s of b.sources || []) {
        if (s.sha256 && (s.kind === "DDL" || s.kind === "DML" || b.kind)) {
          bySha.set(s.sha256, {
            kind: s.kind || b.kind,
            stableId: s.stableId,
            classifySource: "cache",
          });
        }
      }
    }
  } catch {
    /* ignore */
  }
  return bySha;
}

function loadAiMap(aiJsonPath) {
  /** @type {Map<string, object>} */
  const map = new Map();
  if (!aiJsonPath || !fs.existsSync(aiJsonPath)) return map;
  const raw = JSON.parse(fs.readFileSync(aiJsonPath, "utf8"));
  const list = Array.isArray(raw) ? raw : raw.classifications || raw.items || [];
  for (const row of list) {
    const key = baseName(row.path || row.stableId || row.basename || "");
    if (!key) continue;
    map.set(key, row);
    map.set(String(row.path || ""), row);
  }
  return map;
}

function normalizeKind(k) {
  const u = String(k || "").toUpperCase();
  if (u === "DDL" || u === "DML") return u;
  return null;
}

/**
 * @param {{ basename: string, content: string, absPath?: string }[]} files
 * @param {{ priorBySha?: Map, aiByName?: Map, skipAiClassify?: boolean, classifyFn?: Function }} opts
 */
export function classifyRefs(files, opts = {}) {
  const priorBySha = opts.priorBySha || new Map();
  const aiByName = opts.aiByName || new Map();
  const skipAi = Boolean(opts.skipAiClassify);
  const classifyFn = opts.classifyFn;

  const resolved = [];
  const needsAi = [];
  const cached = [];
  const failed = [];

  for (const f of files || []) {
    const bn = baseName(f.basename || f.path || f.absPath);
    const content = f.content == null ? "" : String(f.content);
    const hash = sha256Hex(content);
    const row = {
      basename: bn,
      path: f.path || bn,
      absPath: f.absPath || null,
      sha256: hash,
      kind: null,
      classifySource: null,
      confidence: null,
      reason: null,
    };

    const byName = classifyMigrationKindByFilename(bn);
    if (byName) {
      row.kind = byName;
      row.classifySource = "filename";
      row.confidence = "filename";
      resolved.push(row);
      continue;
    }

    const hit = priorBySha.get(hash);
    if (hit && normalizeKind(hit.kind)) {
      row.kind = normalizeKind(hit.kind);
      row.classifySource = "cache";
      row.confidence = "cache";
      row.reason = "sha256 match prior artifacts";
      cached.push(row);
      resolved.push(row);
      continue;
    }

    if (typeof classifyFn === "function") {
      const r = classifyFn({ basename: bn, content, sha256: hash });
      const k = normalizeKind(r?.kind);
      if (k && !/uncertain/i.test(String(r?.confidence || r?.reason || ""))) {
        row.kind = k;
        row.classifySource = "ai";
        row.confidence = r.confidence ?? null;
        row.reason = r.reason ?? null;
        resolved.push(row);
        continue;
      }
      failed.push({ ...row, error: r?.reason || "classifyFn uncertain/invalid" });
      continue;
    }

    const ai =
      aiByName.get(bn) ||
      aiByName.get(f.path || "") ||
      aiByName.get(row.path);
    if (ai) {
      const uncertain =
        /uncertain/i.test(String(ai.confidence || "")) ||
        /uncertain/i.test(String(ai.reason || "")) ||
        ai.uncertain === true;
      const k = normalizeKind(ai.kind);
      if (!k || uncertain) {
        failed.push({
          ...row,
          error: uncertain ? "ai uncertain" : "ai missing kind DDL|DML",
        });
        continue;
      }
      row.kind = k;
      row.classifySource = "ai";
      row.confidence = ai.confidence ?? null;
      row.reason = ai.reason ?? null;
      resolved.push(row);
      continue;
    }

    needsAi.push({
      basename: bn,
      path: row.path,
      sha256: hash,
      contentPreview: content.slice(0, 800),
    });
  }

  const incomplete = needsAi.length > 0 || failed.length > 0;
  const ok = skipAi ? failed.length === 0 : !incomplete;

  return {
    ok,
    incomplete: incomplete || skipAi,
    skipAiClassify: skipAi,
    resolved,
    cached,
    needsAi,
    failed,
  };
}

export function listRefsDir(refsDir) {
  if (!refsDir || !fs.existsSync(refsDir)) return [];
  return fs
    .readdirSync(refsDir)
    .filter((n) => n.toLowerCase().endsWith(".sql") && !n.startsWith("."))
    .sort()
    .map((n) => {
      const abs = path.join(refsDir, n);
      return {
        basename: n,
        path: n,
        absPath: abs,
        content: fs.readFileSync(abs, "utf8"),
      };
    });
}

export function buildClassifyPromptMd(needsAi) {
  const lines = [
    "# SQL DDL/DML 分类（release-sql-classify）",
    "",
    "对下列 migration 判定 kind 为 DDL 或 DML。勿改写 SQL。",
    "若无法判断，在该条设 `uncertain: true`（整次整理将硬失败）。",
    "",
    "输出 JSON 数组：",
    "```json",
    '[{ "path": "<basename>", "kind": "DDL"|"DML", "confidence": "high|low", "reason": "..." }]',
    "```",
    "",
    `待分类 ${needsAi.length} 项：`,
    "",
  ];
  for (const n of needsAi) {
    lines.push(`## ${n.basename}`);
    lines.push("");
    lines.push("```sql");
    lines.push(n.contentPreview || "");
    lines.push("```");
    lines.push("");
  }
  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage:
  node release-sql-classify.mjs --refs-dir <dir> [--prior-artifacts f] [--ai-json f]
    [--format json|prompt-md] [--skip-ai-classify] [--out <file>]`);
    process.exit(0);
  }
  if (!args.refsDir) {
    console.error("require --refs-dir");
    process.exit(1);
  }
  const refsDir = path.isAbsolute(args.refsDir)
    ? args.refsDir
    : path.join(args.root, args.refsDir);
  const priorPath = args.priorArtifacts
    ? path.isAbsolute(args.priorArtifacts)
      ? args.priorArtifacts
      : path.join(args.root, args.priorArtifacts)
    : null;
  const aiPath = args.aiJson
    ? path.isAbsolute(args.aiJson)
      ? args.aiJson
      : path.join(args.root, args.aiJson)
    : null;

  const files = listRefsDir(refsDir);
  const result = classifyRefs(files, {
    priorBySha: loadPriorCache(priorPath),
    aiByName: loadAiMap(aiPath),
    skipAiClassify: args.skipAiClassify,
  });

  const emit = (text) => {
    if (args.out) {
      fs.writeFileSync(args.out, text.endsWith("\n") ? text : text + "\n", "utf8");
      console.log(`written ${args.out}`);
    } else {
      console.log(text);
    }
  };

  if (args.format === "prompt-md") {
    emit(buildClassifyPromptMd(result.needsAi));
    process.exit(0);
  }

  emit(JSON.stringify(result, null, 2));
  if (!result.ok) {
    const msgs = [
      ...result.needsAi.map((n) => `needsAi: ${n.basename}`),
      ...result.failed.map((f) => `failed: ${f.basename} (${f.error})`),
    ];
    console.error(msgs.join("\n") || "classify incomplete");
    process.exit(1);
  }
  process.exit(0);
}

const isMain =
  process.argv[1] &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (isMain) main();
