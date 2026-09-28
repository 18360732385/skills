#!/usr/bin/env node
/**
 * questions-next — emit next question batch from questions.yaml (no npm deps).
 *
 * Usage:
 *   node scripts/questions-next.mjs --answers answers.json
 *   node scripts/questions-next.mjs --answers '{"type":"NEW_CODE_NO_HARNESS","mode":"land","ladder":"L2"}'
 *
 * answers.json fields (all optional except driving ones as available):
 *   type, mode, ladder, multi_workspace, large_repo,
 *   answered: ["Q_MODE", ...], current_batch, signals: ["S_AGENTS_ROOT"],
 *   domains: ["api","func"] (for domains_has_*)
 *
 * 0.7.25: remaining/truncated; S_* + domains_has_* in evalWhen; question-level recommended_when
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "./lib/yaml.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YAML_PATH = path.join(__dirname, "..", "questions.yaml");

function parseArgs(argv) {
  const out = { answers: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--answers") out.answers = argv[++i];
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function loadAnswers(raw) {
  if (!raw) return {};
  if (raw.trim().startsWith("{")) return JSON.parse(raw);
  const abs = path.resolve(raw);
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function ladderOrd(l) {
  const m = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4, L5: 5 };
  if (l == null || l === "") return 0;
  if (!(l in m)) {
    throw new Error(`Unknown ladder: ${l} (expected L0–L5)`);
  }
  return m[l];
}

export function evalWhen(expr, ctx) {
  if (!expr || expr === "always") return true;
  if (expr === "large_repo") return Boolean(ctx.large_repo);
  if (expr === "multi_workspace") return Boolean(ctx.multi_workspace);
  const type = ctx.type || "";
  const mode = ctx.mode || "";
  const ladder = ctx.ladder || "L0";
  const signals = Array.isArray(ctx.signals) ? ctx.signals : [];
  const domains = Array.isArray(ctx.domains)
    ? ctx.domains
    : Array.isArray(ctx.meta?.domains)
      ? ctx.meta.domains
      : [];
  const domainSet = new Set(domains.map((d) => String(d).toLowerCase()));

  let e = String(expr);
  e = e.replace(/type\s*==\s*(\w+)/g, (_, t) => (type === t ? "true" : "false"));
  e = e.replace(/mode\s*==\s*([\w-]+)/g, (_, m) => (mode === m ? "true" : "false"));
  e = e.replace(/ladder\s*>=\s*(L\d)/g, (_, l) =>
    ladderOrd(ladder) >= ladderOrd(l) ? "true" : "false"
  );
  e = e.replace(/\blarge_repo\b/g, ctx.large_repo ? "true" : "false");
  e = e.replace(/\bmulti_workspace\b/g, ctx.multi_workspace ? "true" : "false");
  // 0.7.25 QF-2: fingerprint signals
  e = e.replace(/\b(S_[A-Z0-9_]+)\b/g, (_, s) => (signals.includes(s) ? "true" : "false"));
  e = e.replace(/\bdomains_has_([a-z0-9_]+)\b/g, (_, d) =>
    domainSet.has(String(d).toLowerCase()) ? "true" : "false"
  );
  if (!/^(true|false|\(|\)|\s|\||&|!)+$/.test(e)) {
    if (/[a-zA-Z_]/.test(e)) return false;
  }
  try {
    return Boolean(Function(`"use strict"; return (${e});`)());
  } catch {
    return false;
  }
}

function batchEligible(batch, ctx) {
  if (batch.when && !evalWhen(batch.when, ctx)) return false;
  if (batch.when_mode) {
    const modes = Array.isArray(batch.when_mode) ? batch.when_mode : [batch.when_mode];
    if (ctx.mode && !modes.includes(ctx.mode)) return false;
  }
  return true;
}

function questionEligible(q, ctx) {
  if (q.when_mode) {
    const modes = Array.isArray(q.when_mode) ? q.when_mode : [q.when_mode];
    if (ctx.mode && !modes.includes(ctx.mode)) return false;
  }
  if (q.when_ladder_min && ladderOrd(ctx.ladder || "L0") < ladderOrd(q.when_ladder_min))
    return false;
  if (q.required_when === "multi_workspace" && !ctx.multi_workspace) return false;
  if (q.when_signal) {
    const sigs = ctx.signals || [];
    if (!sigs.includes(q.when_signal)) return false;
  }
  return true;
}

function getByPath(obj, dotted) {
  if (!obj || !dotted) return undefined;
  const parts = String(dotted).split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

export function pickRecommended(q, ctx) {
  // 0.7.25 QF-2: question-level recommended_when (booleans / explicit recommended)
  if (q.recommended_when) {
    if (evalWhen(q.recommended_when, ctx)) {
      if (q.recommended !== undefined) return q.recommended;
      if (q.type === "boolean") return true;
    } else if (q.type === "boolean" && q.recommended === undefined) {
      return false;
    }
  }
  if (q.recommended !== undefined) return q.recommended;
  if (q.recommended_from) {
    const from = getByPath(ctx, q.recommended_from);
    if (Array.isArray(from) && from.length) return from;
    if (from != null && !Array.isArray(from) && from !== "") return from;
  }
  if (q.recommended_fallback !== undefined && Array.isArray(q.recommended_fallback))
    return q.recommended_fallback;
  if (q.options) {
    // 0.7.26 QF-6: multi → all options matching recommended / recommended_when
    if (q.type === "multi") {
      const hits = q.options
        .filter(
          (o) =>
            o.recommended === true ||
            (o.recommended_when && evalWhen(o.recommended_when, ctx))
        )
        .map((o) => o.value);
      if (hits.length) return hits;
    } else {
      const hit = q.options.find((o) => o.recommended === true);
      if (hit) return hit.value;
      const cond = q.options.find(
        (o) => o.recommended_when && evalWhen(o.recommended_when, ctx)
      );
      if (cond) return cond.value;
    }
  }
  return null;
}

function resolveNextBatchId(doc, ctx, answeredBatchIds) {
  if (ctx.current_batch && !answeredBatchIds.includes(ctx.current_batch)) {
    return ctx.current_batch;
  }
  if (!answeredBatchIds.length) return "batch-0-global";
  const last = answeredBatchIds[answeredBatchIds.length - 1];
  const transitions = doc.transitions || [];
  for (const t of transitions) {
    if (t.from !== last) continue;
    if (t.when && !evalWhen(t.when, ctx)) continue;
    return t.next;
  }
  for (const b of doc.batches || []) {
    if (answeredBatchIds.includes(b.id)) continue;
    if (batchEligible(b, ctx)) return b.id;
  }
  return null;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage: node scripts/questions-next.mjs --answers <json|path>`);
    return;
  }
  const ctx = loadAnswers(args.answers || "{}");
  const answered = new Set(ctx.answered || []);
  const answeredBatches = ctx.answered_batches || [];

  let doc;
  try {
    doc = parseYaml(fs.readFileSync(YAML_PATH, "utf8")) || {};
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: String(e), fallback: "Read questions.md" }));
    process.exit(1);
  }

  const batchId = resolveNextBatchId(doc, ctx, answeredBatches);
  if (!batchId) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          done: true,
          message: "无更多批次；进入 WritePlan",
          all_recommend_phrases: doc.all_recommend_phrases || [],
        },
        null,
        2
      )
    );
    return;
  }

  const batch = (doc.batches || []).find((b) => b.id === batchId);
  if (!batch || !batchEligible(batch, ctx)) {
    console.log(
      JSON.stringify(
        { ok: true, done: true, message: `batch ${batchId} 不适用`, batch_id: batchId },
        null,
        2
      )
    );
    return;
  }

  const eligible = [];
  for (const q of batch.questions || []) {
    if (answered.has(q.id)) continue;
    if (!questionEligible(q, ctx)) continue;
    eligible.push(q);
  }

  const max = batch.max || 5;
  const slice = eligible.slice(0, max);
  const remainingIds = eligible.slice(max).map((q) => q.id);
  const truncated = remainingIds.length > 0;

  const questions = slice.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    options: q.options || null,
    recommended: pickRecommended(q, ctx),
  }));

  console.log(
    JSON.stringify(
      {
        ok: true,
        done: false,
        batch_id: batch.id,
        questions,
        truncated,
        remaining: remainingIds,
        hint: truncated
          ? "本批已截断：先答当前题，勿将 batch 标为已答；再次调用会继续吐 remaining"
          : "不确定请回复：全部推荐（不等于写盘确认）",
        all_recommend_phrases: doc.all_recommend_phrases || [],
      },
      null,
      2
    )
  );
}

import { pathToFileURL } from "url";
const isMain =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  try {
    main();
  } catch (e) {
    console.error(String(e && e.stack ? e.stack : e));
    process.exit(1);
  }
}
