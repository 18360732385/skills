#!/usr/bin/env node
/**
 * session-live — 会话自证落盘 / 检查表打印（观测由当前宿主 Agent 完成）。
 *
 * Usage:
 *   node scripts/session-live.mjs --help
 *   node scripts/session-live.mjs --validate-checks
 *   node scripts/session-live.mjs --root <TARGET> --host <id> --checklist
 *   node scripts/session-live.mjs --root <TARGET> --recommend-host
 *   node scripts/session-live.mjs --root <TARGET> --write --from-json <obs.json>
 *   node scripts/session-live.mjs --root <TARGET> --write --from-json -   # stdin
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SKILL_ROOT,
  loadSessionLiveChecks,
  listBuiltinHosts,
  recommendLiveHost,
  formatHostChecklist,
  evaluateObservations,
  writeSessionLiveReport,
  patchHarnessMetaSessionLive,
  SESSION_LIVE_CHECKS_REL,
  SESSION_LIVE_LATEST_REL,
} from "./lib/live-probes.mjs";

const HELP = `session-live — harness-eng 会话自证（落盘 / 检查表）

用法:
  node scripts/session-live.mjs --validate-checks
  node scripts/session-live.mjs --root <TARGET> --recommend-host
  node scripts/session-live.mjs --root <TARGET> --host <id> --checklist
  node scripts/session-live.mjs --root <TARGET> --write --from-json <obs.json|->

选项:
  --root <path>         目标仓根（--write / --recommend-host / --checklist 需要）
  --host <id>           cursor|claude|codex|qoder|trae|workbuddy
  --checklist           打印该宿主探针清单（给 Agent）
  --recommend-host      根据磁盘 hints 推荐 live_host（不确定则 recommended=null）
  --write               根据观测 JSON 评分并写入 ${SESSION_LIVE_LATEST_REL} + meta.session_live
  --from-json <path|->  观测文件；- 表示 stdin
  --json                机器可读输出
  --validate-checks     校验技能内 ${SESSION_LIVE_CHECKS_REL}
  --help, -h            本帮助

观测 JSON 最小字段:
  { "host": "cursor",
    "mcp": { "tools_seen": ["mysql-test"], "readonly_call": { "ok": true, "server": "mysql-test" } },
    "hooks": { "triggered": true, "injection_seen": true, "command": "git commit --dry-run" },
    "rules": { "self_report": { "ok": true, "quoted": "Never do …" } },
    "ai_tools": ["cursor", "trae"] }

说明:
  本脚本不代替 Agent 观察「本会话工具列表 / hook 注入」；只评分与落盘。
  规格：modes/session-live.md
`;

function parseArgs(argv) {
  const out = {
    help: false,
    json: false,
    validateChecks: false,
    checklist: false,
    recommendHost: false,
    write: false,
    fromJson: null,
    root: null,
    host: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--json") out.json = true;
    else if (a === "--validate-checks") out.validateChecks = true;
    else if (a === "--checklist") out.checklist = true;
    else if (a === "--recommend-host") out.recommendHost = true;
    else if (a === "--write") out.write = true;
    else if (a === "--root") out.root = argv[++i];
    else if (a === "--host") out.host = argv[++i];
    else if (a === "--from-json") out.fromJson = argv[++i];
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function readJsonInput(fromJson) {
  if (!fromJson) throw new Error("--write requires --from-json <path|->");
  const raw =
    fromJson === "-"
      ? fs.readFileSync(0, "utf8")
      : fs.readFileSync(path.resolve(fromJson), "utf8");
  return JSON.parse(String(raw).replace(/^\uFEFF/, ""));
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(HELP);
    return;
  }

  if (args.validateChecks) {
    const doc = loadSessionLiveChecks(SKILL_ROOT);
    const hosts = listBuiltinHosts(doc);
    const missing = ["cursor", "claude", "codex", "qoder", "trae", "workbuddy"].filter(
      (h) => !hosts.includes(h)
    );
    if (missing.length) {
      throw new Error(`session-live-checks missing hosts: ${missing.join(",")}`);
    }
    const payload = {
      ok: true,
      version: doc.version,
      hosts,
      path: SESSION_LIVE_CHECKS_REL,
    };
    process.stdout.write(
      args.json ? JSON.stringify(payload, null, 2) + "\n" : `OK ${SESSION_LIVE_CHECKS_REL} hosts=${hosts.join(",")}\n`
    );
    return;
  }

  if (args.recommendHost) {
    if (!args.root) throw new Error("--recommend-host requires --root");
    const root = path.resolve(args.root);
    const rec = recommendLiveHost(root);
    if (args.json) {
      process.stdout.write(JSON.stringify(rec, null, 2) + "\n");
    } else {
      process.stdout.write(
        `recommended=${rec.recommended ?? "null"} candidates=[${rec.candidates.join(",")}] note=${rec.note}\n`
      );
    }
    return;
  }

  if (args.checklist) {
    if (!args.host) throw new Error("--checklist requires --host");
    const text = formatHostChecklist(args.host);
    if (args.json) {
      process.stdout.write(JSON.stringify({ host: args.host, checklist: text }, null, 2) + "\n");
    } else {
      process.stdout.write(text.endsWith("\n") ? text : text + "\n");
    }
    return;
  }

  if (args.write) {
    if (!args.root) throw new Error("--write requires --root");
    const root = path.resolve(args.root);
    const obs = readJsonInput(args.fromJson);
    if (args.host && !obs.host) obs.host = args.host;
    const report = evaluateObservations(root, obs);
    const written = writeSessionLiveReport(root, report);
    const meta = patchHarnessMetaSessionLive(root, report);
    const summary = {
      report: written.rel,
      meta: meta.rel,
      host: report.host,
      counts: report.counts,
      claims: report.claims,
    };
    if (args.json) {
      process.stdout.write(JSON.stringify({ ok: true, ...summary, report_doc: report }, null, 2) + "\n");
    } else {
      process.stdout.write(
        [
          `wrote ${written.rel}`,
          `meta ${meta.rel} session_live.host=${report.host}`,
          `counts pass=${report.counts.pass} fail=${report.counts.fail} unproven=${report.counts.unproven} skipped=${report.counts.skipped}`,
          `behavior_pass_claim=${report.claims.behavior_pass_claim} mcp_gate_path_a=${report.claims.mcp_gate_path_a}`,
          "",
        ].join("\n")
      );
    }
    return;
  }

  process.stdout.write(HELP);
  process.exitCode = 1;
}

try {
  main();
} catch (err) {
  process.stderr.write(`session-live: ${err.message || err}\n`);
  process.exitCode = 1;
}
