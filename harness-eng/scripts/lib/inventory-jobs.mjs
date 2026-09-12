#!/usr/bin/env node
/**
 * fill-inventory-jobs — SyncTaskCode / @Scheduled / yml cron → inventory JSON (0.3.6+)
 * Alias (0.5.9+): prefer `fill-inventory.mjs --domain jobs`.
 *
 * Usage:
 *   node scripts/fill-inventory-jobs.mjs --root <TARGET>
 *       [--shard-size 20] [--out inv.json] [--quiet]
 *
 * Default --out: docs/jobs/.fill-work/inventory.json
 *
 * Output tasks may include:
 *   scheduler_link: exact | heuristic | none
 *   cron_link: exact | heuristic | none
 * Weak (heuristic) scheduler links must not promote to SSOT unmarked
 * (fragment needs quality: heuristic; acceptance blocks otherwise).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defaultInventoryPath } from "./inventory-paths.mjs";
import { exitFromReport, pushWarning } from "./exit-codes.mjs";
import { createProgress } from "./progress-log.mjs";

function parseArgs(argv) {
  const out = {
    root: null,
    shardSize: 20,
    out: null,
    quiet: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--shard-size") out.shardSize = Number(argv[++i]) || 20;
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--quiet") out.quiet = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-inventory-jobs.mjs --root <TARGET>
      [--shard-size 20] [--out inv.json] [--quiet]

Scans:
  - *TaskCode*.java / SyncTaskCode enum string constants
  - *Scheduler.java @Scheduled methods
  - application*.yml cron keys (*.cron.*)

Links:
  - scheduler_link / cron_link: exact | heuristic | none
  - heuristic = weak name match; may attach many tasks to one method
  - Do NOT promote heuristic scheduler links to docs/jobs/tasks/ SSOT
    without verifying code; mark fill-work fragments quality: heuristic

Default --out: docs/jobs/.fill-work/inventory.json
Exit: 0 ok · 2 warnings · 1 error
`);
}

function normKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** slug/task_code → camelCase candidates for method names */
function methodCandidates(task) {
  const slug = String(task.slug || "");
  const parts = slug.split("-").filter(Boolean);
  const camel =
    parts.length === 0
      ? ""
      : parts[0] + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  const fromEnum = task.enumName
    ? String(task.enumName)
        .toLowerCase()
        .split("_")
        .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
        .join("")
    : "";
  return [...new Set([camel, fromEnum, normKey(slug), normKey(task.task_code)].filter(Boolean))];
}

/**
 * Score scheduled method vs task.
 * exact: normalized equality or unique strong prefix (≥ min of lengths, ≥8 chars).
 * heuristic: weak substring (legacy).
 */
function scoreSchedulerMatch(task, s) {
  const meth = s.method;
  const methN = normKey(meth);
  const cands = methodCandidates(task);
  for (const c of cands) {
    const cn = normKey(c);
    if (!cn || !methN) continue;
    if (cn === methN) return { rank: "exact", score: 100, scheduled: s };
    const minLen = Math.min(cn.length, methN.length);
    if (minLen >= 8 && (cn.startsWith(methN) || methN.startsWith(cn))) {
      return { rank: "exact", score: 90, scheduled: s };
    }
  }
  const slug = normKey(task.slug);
  const code = String(task.task_code || "").toLowerCase();
  const methL = meth.toLowerCase();
  if (
    (slug.length >= 8 && methN.includes(slug.slice(0, 12))) ||
    (slug.length >= 6 && slug.includes(methN.replace(/^(sync|run)/, ""))) ||
    code.split(/[:/]/).some((p) => {
      const pn = normKey(p);
      return pn.length > 3 && methN.includes(pn);
    }) ||
    (slug.length >= 6 && methL.includes(slug.slice(0, 8)))
  ) {
    return { rank: "heuristic", score: 40, scheduled: s };
  }
  return null;
}

function matchScheduler(task, scheduled) {
  const hits = [];
  for (const s of scheduled) {
    const hit = scoreSchedulerMatch(task, s);
    if (hit) hits.push(hit);
  }
  if (!hits.length) return { link: "none", scheduled: null, ambiguous: false };
  hits.sort((a, b) => b.score - a.score);
  const best = hits[0];
  const exactHits = hits.filter((h) => h.rank === "exact");
  if (exactHits.length === 1) {
    return { link: "exact", scheduled: exactHits[0].scheduled, ambiguous: false };
  }
  if (exactHits.length > 1) {
    return { link: "heuristic", scheduled: exactHits[0].scheduled, ambiguous: true };
  }
  const topScore = best.score;
  const tied = hits.filter((h) => h.score === topScore);
  return {
    link: "heuristic",
    scheduled: best.scheduled,
    ambiguous: tied.length > 1 || hits.length > 1,
  };
}

function matchCron(task, cronKeys) {
  const slug = String(task.slug || "").toLowerCase();
  const slugN = normKey(slug);
  const exact = [];
  const weak = [];
  for (const c of cronKeys) {
    const k = c.cronKey.toLowerCase();
    const kn = normKey(k);
    if (slugN && (kn === slugN || kn.endsWith(slugN) || kn.includes(slugN))) {
      if (kn === slugN || kn.endsWith(slugN)) exact.push(c);
      else weak.push(c);
    } else if (slug.split("-").filter((x) => x.length > 3).some((p) => k.includes(p))) {
      weak.push(c);
    }
  }
  if (exact.length === 1) return { link: "exact", cron: exact[0] };
  if (exact.length > 1) return { link: "heuristic", cron: exact[0] };
  if (weak.length >= 1) return { link: "heuristic", cron: weak[0] };
  return { link: "none", cron: null };
}

function walkJava(dir, acc = [], pred) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === "target" || name === "node_modules" || name === ".git") continue;
    const p = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkJava(p, acc, pred);
    else if (/\.java$/i.test(name) && (!pred || pred(name, p))) acc.push(p);
  }
  return acc;
}

function walkYml(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === "target" || name === "node_modules" || name === ".git") continue;
    const p = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkYml(p, acc);
    else if (/^application.*\.(yml|yaml)$/i.test(name)) acc.push(p);
  }
  return acc;
}

function rel(root, p) {
  return path.relative(root, p).replace(/\\/g, "/");
}

function slugFromCode(code) {
  return String(code || "")
    .replace(/:/g, "-")
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function guessEngine(code) {
  const c = String(code || "").toLowerCase();
  if (c.startsWith("milvus:")) return "milvus";
  if (c.startsWith("neo4j:")) return "neo4j";
  if (c.includes("question") || c.includes("top3")) return "app";
  return "app";
}

/** Enum constants: NAME("task:code") or NAME("code") */
function extractEnumTasks(root, file) {
  const text = fs.readFileSync(file, "utf8");
  const tasks = [];
  const re =
    /^\s*([A-Z][A-Z0-9_]*)\s*\(\s*"([^"]+)"\s*\)/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const enumName = m[1];
    const task_code = m[2];
    if (/^(fromCode|values|valueOf)$/i.test(enumName)) continue;
    tasks.push({
      id: task_code,
      task_code,
      slug: slugFromCode(task_code),
      enumName,
      evidence: `${rel(root, file)}#${enumName}`,
      engine: guessEngine(task_code),
      source: "enum",
    });
  }
  return tasks;
}

function extractScheduled(root, file) {
  const text = fs.readFileSync(file, "utf8");
  const classM = text.match(/class\s+(\w+)/);
  const cls = classM ? classM[1] : path.basename(file, ".java");
  const methods = [];
  // @Scheduled(...) ... void methodName(
  const re =
    /@Scheduled\s*(?:\([^)]*\))?\s*(?:public|protected|private)?\s*(?:final\s+)?void\s+(\w+)\s*\(/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    methods.push({
      schedulerClass: cls,
      method: m[1],
      evidence: `${rel(root, file)}#${m[1]}`,
    });
  }
  return methods;
}

function extractCronKeys(root, file) {
  const text = fs.readFileSync(file, "utf8");
  const keys = [];
  // foo.bar.cron: or cron.foo:
  const re = /^[ \t]*([A-Za-z0-9_.-]*cron[A-Za-z0-9_.-]*)\s*:/gim;
  let m;
  while ((m = re.exec(text)) !== null) {
    keys.push({
      cronKey: m[1],
      evidence: `${rel(root, file)}#${m[1]}`,
    });
  }
  return keys;
}

function shardTasks(tasks, shardSize) {
  const shards = [];
  for (let i = 0; i < tasks.length; i += shardSize) {
    const slice = tasks.slice(i, i + shardSize);
    const n = String(Math.floor(i / shardSize) + 1).padStart(2, "0");
    shards.push({
      id: `shard-jobs-${n}`,
      count: slice.length,
      tasks: slice,
    });
  }
  return shards;
}

export function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (!args.root) throw new Error("Required: --root <TARGET>");
  const root = path.resolve(args.root);
  if (!fs.existsSync(root)) throw new Error(`root missing: ${root}`);

  const progress = createProgress({ quiet: args.quiet, label: "fill-inventory-jobs" });
  progress.log("scan");

  const warnings = [];
  const enumFiles = walkJava(root, [], (name) => /TaskCode/i.test(name));
  const schedulerFiles = walkJava(root, [], (name) => /Scheduler\.java$/i.test(name));
  const ymlFiles = [];
  for (const base of [
    path.join(root, "sms-ai", "src", "main", "resources"),
    path.join(root, "src", "main", "resources"),
  ]) {
    walkYml(base, ymlFiles);
  }
  // also scan any */src/main/resources
  for (const ent of fs.readdirSync(root)) {
    const p = path.join(root, ent, "src", "main", "resources");
    if (fs.existsSync(p)) walkYml(p, ymlFiles);
  }

  progress.step(1, 3, `enums=${enumFiles.length}`);
  let tasks = [];
  for (const f of enumFiles) {
    tasks.push(...extractEnumTasks(root, f));
  }
  // dedupe by task_code
  const byCode = new Map();
  for (const t of tasks) {
    if (!byCode.has(t.task_code)) byCode.set(t.task_code, t);
  }
  tasks = [...byCode.values()];

  progress.step(2, 3, `schedulers=${schedulerFiles.length}`);
  const scheduled = [];
  for (const f of schedulerFiles) scheduled.push(...extractScheduled(root, f));

  progress.step(3, 3, `yml=${ymlFiles.length}`);
  const cronKeys = [];
  for (const f of [...new Set(ymlFiles)]) cronKeys.push(...extractCronKeys(root, f));

  if (!tasks.length && scheduled.length) {
    // fallback: invent tasks from scheduled methods
    for (const s of scheduled) {
      const slug = s.method
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase();
      tasks.push({
        id: slug,
        task_code: slug,
        slug,
        enumName: null,
        evidence: s.evidence,
        engine: "app",
        source: "scheduler-only",
        scheduler: s,
        scheduler_link: "exact",
      });
    }
    pushWarning(warnings, "no-enum", "No *TaskCode* enum found; used @Scheduled methods as tasks");
  }

  for (const t of tasks) {
    if (!t.scheduler) {
      const m = matchScheduler(t, scheduled);
      t.scheduler_link = m.link;
      if (m.scheduled) t.scheduler = m.scheduled;
      if (m.link === "heuristic") {
        pushWarning(
          warnings,
          "heuristic-scheduler",
          `${t.task_code} → ${m.scheduled?.method || "?"} (heuristic; do not promote unmarked)`
        );
      }
      if (m.ambiguous) {
        pushWarning(warnings, "ambiguous-scheduler", `${t.task_code} matched multiple @Scheduled methods`);
      }
    } else if (!t.scheduler_link) {
      t.scheduler_link = "exact";
    }
    if (!t.scheduler) t.scheduler_link = "none";

    const c = matchCron(t, cronKeys);
    t.cron_link = c.link;
    if (c.cron) t.cronKey = c.cron.cronKey;
  }

  // Same method claimed by >1 task → force heuristic + warning
  const byMethod = new Map();
  for (const t of tasks) {
    if (!t.scheduler?.method) continue;
    const key = `${t.scheduler.schedulerClass}#${t.scheduler.method}`;
    if (!byMethod.has(key)) byMethod.set(key, []);
    byMethod.get(key).push(t);
  }
  for (const [key, group] of byMethod) {
    if (group.length <= 1) continue;
    for (const t of group) {
      if (t.scheduler_link === "exact") t.scheduler_link = "heuristic";
      pushWarning(
        warnings,
        "ambiguous-scheduler",
        `${t.task_code} shares ${key} with ${group.length - 1} other task(s)`
      );
    }
  }

  if (!tasks.length) {
    pushWarning(warnings, "empty", "No jobs tasks discovered");
  }

  const shards = shardTasks(tasks, args.shardSize);
  const outPath = args.out
    ? path.resolve(args.out)
    : defaultInventoryPath(root, "jobs");

  const report = {
    ok: true,
    root,
    generatedAt: new Date().toISOString(),
    tasks,
    shards,
    stats: {
      tasks: tasks.length,
      enums: enumFiles.length,
      scheduledMethods: scheduled.length,
      cronKeys: cronKeys.length,
      documentedHint: "docs/jobs/tasks/NN-{slug}.md",
    },
    warnings,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ ...report, out: path.relative(root, outPath).replace(/\\/g, "/") }, null, 2));
  progress.log(`wrote ${outPath} tasks=${tasks.length}`);
  exitFromReport(report, warnings);
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (e) {
    console.error(String(e && e.stack ? e.stack : e));
    process.exit(1);
  }
}
