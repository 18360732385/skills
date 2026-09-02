#!/usr/bin/env node
/**
 * fill-plan — init / status / set / close for docs/harness-eng/fill-plan.yaml
 *
 * Usage:
 *   node scripts/fill-plan.mjs --root <TARGET> --init [--domains a,b] [--modules m1,m2] [--gold] [--sample-n 30]
 *   node scripts/fill-plan.mjs --root <TARGET> --status
 *   node scripts/fill-plan.mjs --root <TARGET> --set <batch-id> --batch-status in_progress
 *   node scripts/fill-plan.mjs --root <TARGET> --close <batch-id> [--force-close]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { defaultContractDomains } from "./lib/domains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = {
    root: null,
    init: false,
    status: false,
    set: null,
    close: null,
    batchStatus: null,
    domains: defaultContractDomains(),
    modules: [],
    gold: false,
    sampleN: null,
    forceClose: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--init") out.init = true;
    else if (a === "--status") out.status = true;
    else if (a === "--set") out.set = argv[++i];
    else if (a === "--close") out.close = argv[++i];
    else if (a === "--domains") out.domains = String(argv[++i] || "").split(",").filter(Boolean);
    else if (a === "--modules") out.modules = String(argv[++i] || "").split(",").filter(Boolean);
    else if (a === "--gold") out.gold = true;
    else if (a === "--sample-n") out.sampleN = Number(argv[++i]) || 30;
    else if (a === "--force-close") out.forceClose = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (out.set && (a === "open" || a === "in_progress" || a === "blocked" || a === "closed")) {
      out.batchStatus = a;
    } else if (a === "--batch-status") out.batchStatus = argv[++i];
    else if (a === "--status-value") out.batchStatus = argv[++i];
    else if (a === "--status" && out.set) {
      /* second pass */
    } else throw new Error(`Unknown arg: ${a}`);
  }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--status" && out.set && argv[i + 1] && !String(argv[i + 1]).startsWith("--")) {
      const v = argv[i + 1];
      if (["open", "in_progress", "blocked", "closed"].includes(v)) out.batchStatus = v;
    }
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-plan.mjs --root <TARGET> --init [--domains api,func,db,redis] [--modules a,b] [--gold] [--sample-n 30]
  node scripts/fill-plan.mjs --root <TARGET> --status
  node scripts/fill-plan.mjs --root <TARGET> --set <batch-id> --batch-status in_progress
  node scripts/fill-plan.mjs --root <TARGET> --close <batch-id> [--force-close]
`);
}

function planPath(root) {
  return path.join(root, "docs", "harness-eng", "fill-plan.yaml");
}

function defaultAcceptance(domain, gold) {
  const base =
    domain === "api"
      ? [
          "每接口有 evidence path#method",
          "请求参数类型 ∈ 本接口请求体/签名声明",
          "功能逻辑非通用四步模板",
        ]
      : domain === "func"
        ? ["方法说明含业务语义", "禁止无 sample_n 的前N结案"]
        : domain === "db"
          ? ["字段 COMMENT 或显式未知", "有业务说明", "有完整 CREATE TABLE"]
          : ["Key 模式 + Value + TTL", "读写方明确"];
  if (gold) {
    return [
      ...base,
      "深真全：见 skill truth-quality.md",
      "acceptance-check 无 blocker 方可 close",
      "禁止 heuristic 升格 SSOT",
    ];
  }
  return base;
}

function buildInitial(domains, modules, gold, sampleN) {
  const mods = modules.length ? modules : gold ? ["(p0-core)"] : ["(focused-core)"];
  const sn = gold ? sampleN ?? 30 : sampleN;
  const batches = [];
  for (const d of domains) {
    for (let i = 0; i < mods.length; i++) {
      const mod = mods[i];
      const core = mod === "(focused-core)" || mod === "(p0-core)";
      batches.push({
        id: `${d}-${String(i + 1).padStart(2, "0")}-${core ? (gold ? "gold" : "core") : mod}`,
        domain: d,
        modules: core ? [] : [mod],
        status: "open",
        tier: gold ? "gold" : "standard",
        acceptance: defaultAcceptance(d, gold),
        sample_n: sn == null ? null : sn,
      });
    }
  }
  return {
    version: "0.2.19",
    goal: gold
      ? "P0 金标域四域闭环（深真全 + acceptance 过闸）"
      : "契约达到 ai_coding_ready（语义验收 + 批次关闭）",
    domains,
    done_when: gold
      ? [
          "skeleton_ready",
          "coverage_ready",
          "semantic_ready",
          "plan_batches_closed",
          "gold_batches_closed",
        ]
      : ["skeleton_ready", "coverage_ready", "semantic_ready", "plan_batches_closed"],
    batches,
  };
}

function toYaml(obj) {
  const lines = [];
  lines.push(`version: "${obj.version}"`);
  lines.push(`goal: ${JSON.stringify(obj.goal)}`);
  lines.push(`domains: [${obj.domains.map((d) => JSON.stringify(d)).join(", ")}]`);
  lines.push("done_when:");
  for (const x of obj.done_when) lines.push(`  - ${x}`);
  lines.push("batches:");
  for (const b of obj.batches) {
    lines.push(`  - id: ${JSON.stringify(b.id)}`);
    lines.push(`    domain: ${b.domain}`);
    lines.push(
      `    modules: [${(b.modules || []).map((m) => JSON.stringify(m)).join(", ")}]`
    );
    lines.push(`    status: ${b.status}`);
    if (b.tier) lines.push(`    tier: ${b.tier}`);
    lines.push(`    sample_n: ${b.sample_n == null ? "null" : b.sample_n}`);
    lines.push("    acceptance:");
    for (const a of b.acceptance || []) lines.push(`      - ${JSON.stringify(a)}`);
  }
  return lines.join("\n") + "\n";
}

function parsePlanYaml(text) {
  const batches = [];
  let version = "0.2.18";
  let goal = "";
  const domains = [];
  const done_when = [];
  let cur = null;
  let inAcceptance = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\t/g, "  ");
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    if (/^version:/.test(t)) {
      version = t.replace(/^version:\s*/, "").replace(/["']/g, "");
      inAcceptance = false;
      continue;
    }
    if (/^goal:/.test(t)) {
      goal = t.replace(/^goal:\s*/, "").replace(/^"|"$/g, "");
      inAcceptance = false;
      continue;
    }
    if (/^domains:/.test(t)) {
      const inner = t.replace(/^domains:\s*/, "").replace(/^\[/, "").replace(/\]$/, "");
      for (const d of inner.split(",")) {
        const x = d.trim().replace(/^"|"$/g, "");
        if (x) domains.push(x);
      }
      continue;
    }
    if (/^\s*-\s+id:/.test(line) || /^-\s*id:/.test(t)) {
      if (cur) batches.push(cur);
      const id = t.replace(/^-\s*id:\s*/, "").replace(/["']/g, "");
      cur = {
        id,
        domain: "",
        modules: [],
        status: "open",
        acceptance: [],
        sample_n: null,
        tier: null,
      };
      inAcceptance = false;
      continue;
    }
    if (cur && /^\s*domain:/.test(line)) {
      cur.domain = t.replace(/^domain:\s*/, "").replace(/["']/g, "");
      inAcceptance = false;
      continue;
    }
    if (cur && /^\s*status:/.test(line)) {
      cur.status = t.replace(/^status:\s*/, "").replace(/["']/g, "");
      inAcceptance = false;
      continue;
    }
    if (cur && /^\s*tier:/.test(line)) {
      cur.tier = t.replace(/^tier:\s*/, "").replace(/["']/g, "");
      inAcceptance = false;
      continue;
    }
    if (cur && /^\s*sample_n:/.test(line)) {
      const v = t.replace(/^sample_n:\s*/, "").trim();
      cur.sample_n = v === "null" ? null : Number(v);
      inAcceptance = false;
      continue;
    }
    if (cur && /^\s*modules:/.test(line)) {
      const m = t.replace(/^modules:\s*/, "");
      const inner = m.replace(/^\[/, "").replace(/\]$/, "");
      cur.modules = inner
        ? inner
            .split(",")
            .map((s) => s.trim().replace(/^"|"$/g, ""))
            .filter(Boolean)
        : [];
      inAcceptance = false;
      continue;
    }
    if (cur && /^\s*acceptance:/.test(line)) {
      inAcceptance = true;
      continue;
    }
    if (inAcceptance && cur && /^\s*-\s+/.test(line)) {
      cur.acceptance.push(t.replace(/^-\s*/, "").replace(/^"|"$/g, ""));
      continue;
    }
    if (/^-\s+/.test(t) && !cur && /skeleton|coverage|semantic|plan|gold/.test(t)) {
      done_when.push(t.replace(/^-\s*/, ""));
    }
  }
  if (cur) batches.push(cur);
  return { version, goal, domains, done_when, batches };
}

function summarize(plan) {
  const counts = { open: 0, in_progress: 0, closed: 0, blocked: 0 };
  for (const b of plan.batches || []) {
    const s = b.status || "open";
    counts[s] = (counts[s] || 0) + 1;
  }
  const open = (counts.open || 0) + (counts.in_progress || 0) + (counts.blocked || 0);
  return {
    ...counts,
    open_total: open,
    all_closed: open === 0 && (plan.batches || []).length > 0,
    batch_count: (plan.batches || []).length,
  };
}

function runAcceptanceForClose(root, batch, gold) {
  const script = path.join(__dirname, "acceptance-check.mjs");
  const domain = batch.domain || "api";
  const workDir = path.join(root, "docs", domain, ".fill-work");
  const argv = [script];
  // 0.2.29 / P1: prefer work-dir for sample batches; whole-domain gold stays SSOT
  const useWorkDir =
    (batch.tier !== "gold" || batch.sample_n != null) &&
    fs.existsSync(workDir) &&
    (() => {
      try {
        return fs.readdirSync(workDir).some((n) => /\.md$/i.test(n));
      } catch {
        return false;
      }
    })();
  if (useWorkDir) {
    argv.push("--work-dir", workDir);
  } else {
    argv.push("--root", root, "--domain", domain);
  }
  if (gold || batch.tier === "gold") argv.push("--gold");
  const r = spawnSync(process.execPath, argv, { encoding: "utf8" });
  return r.status == null ? 1 : r.status;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }
  if (!args.root) {
    printHelp();
    throw new Error("Required: --root");
  }
  const root = path.resolve(args.root);
  const p = planPath(root);
  const dir = path.dirname(p);

  if (args.init) {
    fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(p)) {
      const existing = parsePlanYaml(fs.readFileSync(p, "utf8"));
      console.log(
        JSON.stringify(
          {
            ok: true,
            action: "skip-exists",
            path: path.relative(root, p).replace(/\\/g, "/"),
            summary: summarize(existing),
          },
          null,
          2
        )
      );
      return;
    }
    const plan = buildInitial(args.domains, args.modules, args.gold, args.sampleN);
    fs.writeFileSync(p, toYaml(plan), "utf8");
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "init",
          gold: args.gold,
          path: path.relative(root, p).replace(/\\/g, "/"),
          summary: summarize(plan),
        },
        null,
        2
      )
    );
    return;
  }

  if (!fs.existsSync(p)) {
    throw new Error(`fill-plan missing: ${p} (run --init)`);
  }
  const plan = parsePlanYaml(fs.readFileSync(p, "utf8"));

  if (args.status) {
    // 0.2.19: shard-level progress — check .fill-work/*.md existence and line count
    const shardProgress = [];
    for (const b of plan.batches) {
      if (b.status === "closed") continue;
      const domain = b.domain || "api";
      const fillWorkDir = path.join(root, "docs", domain, ".fill-work");
      let mdFiles = [];
      let totalLines = 0;
      if (fs.existsSync(fillWorkDir)) {
        function walkFillWork(d, acc) {
          for (const name of fs.readdirSync(d)) {
            const p = path.join(d, name);
            const st = fs.statSync(p);
            if (st.isDirectory()) walkFillWork(p, acc);
            else if (/\.md$/i.test(name)) {
              acc.push(p);
              totalLines += fs.readFileSync(p, "utf8").split("\n").length;
            }
          }
        }
        walkFillWork(fillWorkDir, mdFiles);
      }
      shardProgress.push({
        batch_id: b.id,
        domain,
        status: b.status,
        sample_n: b.sample_n,
        fill_work_files: mdFiles.length,
        fill_work_lines: totalLines,
        shards_ready: mdFiles.length > 0 && totalLines > 100,
      });
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          path: path.relative(root, p).replace(/\\/g, "/"),
          goal: plan.goal,
          summary: summarize(plan),
          batches: plan.batches,
          shard_progress: shardProgress,
        },
        null,
        2
      )
    );
    return;
  }

  if (args.close) {
    const b = plan.batches.find((x) => x.id === args.close);
    if (!b) throw new Error(`batch not found: ${args.close}`);
    if (!args.forceClose) {
      const st = runAcceptanceForClose(root, b, args.gold);
      if (st === 1) {
        b.status = "blocked";
        fs.writeFileSync(p, toYaml(plan), "utf8");
        console.log(
          JSON.stringify(
            {
              ok: false,
              action: "close-blocked",
              id: args.close,
              reason: "acceptance-check blockers; use --force-close to override",
              summary: summarize(plan),
            },
            null,
            2
          )
        );
        process.exitCode = 1;
        return;
      }
    } else {
      console.error("WARN: --force-close skips acceptance-check");
    }
    b.status = "closed";
    fs.writeFileSync(p, toYaml(plan), "utf8");
    console.log(
      JSON.stringify({ ok: true, action: "close", id: args.close, summary: summarize(plan) }, null, 2)
    );
    return;
  }

  if (args.set) {
    const b = plan.batches.find((x) => x.id === args.set);
    if (!b) throw new Error(`batch not found: ${args.set}`);
    const st = args.batchStatus || "in_progress";
    if (!["open", "in_progress", "blocked", "closed"].includes(st)) {
      throw new Error(`bad status: ${st}`);
    }
    b.status = st;
    fs.writeFileSync(p, toYaml(plan), "utf8");
    console.log(
      JSON.stringify(
        { ok: true, action: "set", id: args.set, status: st, summary: summarize(plan) },
        null,
        2
      )
    );
    return;
  }

  printHelp();
  throw new Error("Specify --init | --status | --set | --close");
}

try {
  main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
