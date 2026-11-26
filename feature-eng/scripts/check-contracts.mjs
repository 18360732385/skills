#!/usr/bin/env node
/**
 * feature-eng 契约单源校验：docs / templates / config 必须与 lib 常量一致。
 * 不写盘。可单独运行，也被 selfcheck 调用。
 *
 * Usage: node scripts/check-contracts.mjs [--cwd <skill-root>]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import {
  BINDING_KEYS,
  GATE_KEYS,
  L2_FOR_GATE,
} from "./lib/progress-shape.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "..");

function read(root, rel) {
  const p = path.join(root, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}

function sameList(actual, expected) {
  return (
    actual.length === expected.length &&
    actual.every((v, i) => v === expected[i])
  );
}

function sectionAfter(text, marker, nextHeading = /^## /m) {
  if (!text) return "";
  const parts = text.split(marker);
  if (parts.length < 2) return "";
  return parts[1].split(nextHeading)[0];
}

export function checkContracts(skillRoot = defaultRoot) {
  const issues = [];

  // flow.md：可绑环节键名列表 = BINDING_KEYS
  const flow = read(skillRoot, "modes/specs/flow.md") || "";
  const flowSection = sectionAfter(flow, "## 可绑环节（键名固定）");
  const flowLine = flowSection
    .split(/\r?\n/)
    .find((l) => l.includes("`grill`"));
  const flowKeys = flowLine
    ? [...flowLine.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1])
    : [];
  if (!sameList(flowKeys, BINDING_KEYS)) {
    issues.push(
      `flow.md 可绑环节键名与 BINDING_KEYS 不一致: ${JSON.stringify(flowKeys)}`
    );
  }

  // progress.yaml.tmpl：gates 块键 = GATE_KEYS
  const progressTmpl = read(skillRoot, "templates/progress.yaml.tmpl") || "";
  const gatesBlock =
    progressTmpl.split(/^gates:\s*$/m)[1]?.split(/^[a-zA-Z_]/m)[0] || "";
  const tmplGateKeys = [...gatesBlock.matchAll(/^\s{2}([a-z_]+)\s*:/gm)].map(
    (m) => m[1]
  );
  if (!sameList(tmplGateKeys, GATE_KEYS)) {
    issues.push(
      `progress.yaml.tmpl gates 键与 GATE_KEYS 不一致: ${JSON.stringify(tmplGateKeys)}`
    );
  }

  // stage-bindings*.yaml：stages 键 = BINDING_KEYS
  for (const rel of [
    "config/stage-bindings.yaml",
    "config/stage-bindings.example.yaml",
    "config/stage-bindings.minimal.yaml",
  ]) {
    const text = read(skillRoot, rel) || "";
    const stagesBlock =
      text.split(/^stages:\s*$/m)[1]?.split(/^[a-zA-Z_]/m)[0] || "";
    const keys = [
      ...stagesBlock.matchAll(/^\s{2}([a-z]+)\s*:\s*\{/gm),
    ].map((m) => m[1]);
    if (!sameList(keys, BINDING_KEYS)) {
      issues.push(`${rel} stages 键与 BINDING_KEYS 不一致: ${JSON.stringify(keys)}`);
    }
  }

  // 回链模板：硬闸授权表行 = GATE_KEYS
  const huilianTmpl = read(skillRoot, "templates/回链.md.tmpl") || "";
  const authSection = sectionAfter(huilianTmpl, "## 硬闸授权");
  const authKeys = [
    ...authSection.matchAll(/^\|\s*([a-z_]+)\s*\|/gm),
  ].map((m) => m[1]);
  if (!sameList(authKeys, GATE_KEYS)) {
    issues.push(
      `回链.md.tmpl 硬闸授权行与 GATE_KEYS 不一致: ${JSON.stringify(authKeys)}`
    );
  }
  for (const key of ["chef_mode", "invoke", "review_policy"]) {
    if (!new RegExp(`^-\\s*${key}\\s*[:：]`, "m").test(huilianTmpl)) {
      issues.push(`回链.md.tmpl 缺仪式行 ${key}`);
    }
  }

  // gates.md：每对 gate→L2 文件都必须可指认
  const gatesMd = read(skillRoot, "modes/specs/gates.md") || "";
  for (const [gate, file] of Object.entries(L2_FOR_GATE)) {
    if (file && !gatesMd.includes(`\`${gate}\`→\`${file}\``)) {
      issues.push(`gates.md 缺 L2 映射 ${gate} → ${file}`);
    }
  }

  // 审核模板：不得保留 pass|fail 占位，必须有 result/reviewer 字段
  const reviewTmpl = read(skillRoot, "templates/审核-stage.md.tmpl") || "";
  if (/result\s*:\s*pass\s*\|\s*fail/i.test(reviewTmpl)) {
    issues.push("审核-stage.md.tmpl 仍含 result: pass | fail 占位");
  }
  if (!/^-\s*result\s*:/m.test(reviewTmpl)) {
    issues.push("审核-stage.md.tmpl 缺 result 字段");
  }
  if (!/^-\s*reviewer\s*:/m.test(reviewTmpl)) {
    issues.push("审核-stage.md.tmpl 缺 reviewer 字段");
  }

  // truncate 契约：design/spec 的 allow/forbid
  const trunc = read(skillRoot, "config/truncate-contracts.yaml") || "";
  for (const stage of ["design", "spec"]) {
    const block =
      trunc.split(new RegExp(`^\\s{2}${stage}\\s*:\\s*$`, "m"))[1]?.split(
        /^\s{2}[a-z]+\s*:/m
      )[0] || "";
    if (!/allow:/.test(block) || !/forbid:/.test(block)) {
      issues.push(`truncate-contracts.yaml ${stage} 缺 allow/forbid`);
    }
  }

  return issues;
}

function main() {
  const cwdIdx = process.argv.indexOf("--cwd");
  const root =
    cwdIdx >= 0 && process.argv[cwdIdx + 1]
      ? path.resolve(process.argv[cwdIdx + 1])
      : defaultRoot;
  const issues = checkContracts(root);
  if (issues.length) {
    console.error(`check-contracts FAIL ${issues.length} issue(s)`);
    for (const i of issues) console.error("  ✗", i);
    process.exit(1);
  }
  console.log("check-contracts PASS");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
