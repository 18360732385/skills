/**
 * Consumer `scripts/agent-config/sync.mjs` vs skill `templates/agent-config/sync.mjs.tmpl`
 * freshness (0.6.3+). Marker must appear in BOTH the skill tmpl and instantiated script.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SKILL_ROOT = path.resolve(__dirname, "..");

export const SYNC_TMPL_REL = "templates/agent-config/sync.mjs.tmpl";
export const CONSUMER_SYNC_REL = "scripts/agent-config/sync.mjs";

export const SYNC_TMPL_ID_RE = /HARNESS_SYNC_TMPL_ID:\s*(\S+)/;
export const HARNESS_ENG_VERSION_RE = /HARNESS_ENG_VERSION:\s*(\S+)/;

export function readMarker(text, re = SYNC_TMPL_ID_RE) {
  const m = String(text || "").match(re);
  if (!m) return null;
  return String(m[1]).replace(/^["'`]+/, "").replace(/["'`]+$/, "");
}

export function compareSyncFreshness(targetRoot, skillRoot = DEFAULT_SKILL_ROOT) {
  const tmplPath = path.join(skillRoot, ...SYNC_TMPL_REL.split("/"));
  const consumerPath = path.join(targetRoot, ...CONSUMER_SYNC_REL.split("/"));
  const tmplExists = fs.existsSync(tmplPath);
  const consumerExists = fs.existsSync(consumerPath);
  if (!consumerExists) {
    return {
      status: "skip",
      reason: "no-consumer-sync",
      tmplPath,
      consumerPath,
      skillId: null,
      consumerId: null,
    };
  }
  if (!tmplExists) {
    return {
      status: "error",
      reason: "no-skill-tmpl",
      tmplPath,
      consumerPath,
      skillId: null,
      consumerId: null,
    };
  }
  const tmplText = fs.readFileSync(tmplPath, "utf8");
  const consumerText = fs.readFileSync(consumerPath, "utf8");
  const skillId = readMarker(tmplText);
  const consumerId = readMarker(consumerText);
  const skillVer = readMarker(tmplText, HARNESS_ENG_VERSION_RE);
  const consumerVer = readMarker(consumerText, HARNESS_ENG_VERSION_RE);
  if (!skillId) {
    return {
      status: "error",
      reason: "tmpl-missing-marker",
      tmplPath,
      consumerPath,
      skillId,
      consumerId,
      skillVer,
      consumerVer,
    };
  }
  if (!consumerId || consumerId !== skillId) {
    return {
      status: "stale",
      reason: consumerId ? "marker-mismatch" : "consumer-missing-marker",
      tmplPath,
      consumerPath,
      skillId,
      consumerId,
      skillVer,
      consumerVer,
    };
  }
  return {
    status: "fresh",
    reason: "ok",
    tmplPath,
    consumerPath,
    skillId,
    consumerId,
    skillVer,
    consumerVer,
  };
}

export function formatFreshnessMessage(report, targetRoot) {
  const root = targetRoot || "<TARGET>";
  if (report.status === "error" && report.reason === "no-skill-tmpl") {
    return (
      "harness: 找不到 skill templates/agent-config/sync.mjs.tmpl，无法做 freshness 对照。请从技能根执行 scripts/harness.mjs。\n"
    );
  }
  if (report.status === "error" && report.reason === "tmpl-missing-marker") {
    return "harness: skill templates/agent-config/sync.mjs.tmpl 缺少 HARNESS_SYNC_TMPL_ID 标记。\n";
  }
  return [
    `harness: scripts/agent-config/sync.mjs 落后于 skill 模板（消费仓 HARNESS_SYNC_TMPL_ID=${report.consumerId || "(无)"}，skill tmpl=${report.skillId || "(无)"}）。`,
    "静默过期会导致 Trae FM strip 等旧行为。刷新步骤：",
    "  1. land / upgrade（L5）重渲 artifact `agent-config-sync`，或把 `templates/agent-config/sync.mjs.tmpl` 渲染/复制为 `scripts/agent-config/sync.mjs`",
    "  2. 在目标仓执行：node scripts/agent-config/sync.mjs",
    `  3. 再跑：node scripts/harness.mjs --check-freshness --root ${root}`,
    "详见 host/TRAE-P0-MANUAL.md §0 · modes/conflict-policy.md · QUICKSTART.md",
    "",
  ].join("\n");
}

/**
 * Check-mode: skip (no consumer script) and fresh → 0; stale / error → 1.
 */
export function runFreshnessCheck(targetRoot, skillRoot = DEFAULT_SKILL_ROOT, log = console) {
  const report = compareSyncFreshness(targetRoot, skillRoot);
  if (report.status === "skip") {
    log.error(`harness: --check-freshness skip（目标仓无 ${CONSUMER_SYNC_REL}）。`);
    log.error(
      "harness: 模板漂移提醒：技能 API 模板 vs 仓内 docs/api 厚模板可能不一致；upgrade on_exists=skip 以仓为准。"
    );
    return 0;
  }
  if (report.status === "fresh") {
    log.error(`harness: sync.mjs freshness OK（HARNESS_SYNC_TMPL_ID=${report.skillId}）。`);
    log.error(
      "harness: 模板漂移提醒：技能 API 模板 vs 仓内 docs/api 厚模板可能不一致；upgrade on_exists=skip 以仓为准。"
    );
    return 0;
  }
  log.error(formatFreshnessMessage(report, targetRoot));
  log.error(
    "harness: 模板漂移提醒：技能 API 模板 vs 仓内 docs/api 厚模板可能不一致；upgrade on_exists=skip 以仓为准。"
  );
  return 1;
}
