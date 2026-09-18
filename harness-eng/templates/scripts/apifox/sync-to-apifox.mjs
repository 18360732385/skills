#!/usr/bin/env node
/**
 * 将 docs/api 同步到 Apifox（仅可调试接口）：
 * 1) md → openapi.json
 * 2) import openapi（覆盖已有同路径接口）
 *
 * 用法：
 *   node scripts/apifox/sync-to-apifox.mjs
 * 环境变量：
 *   APIFOX_PROJECT_ID（必填；见 .apifox.env.example）
 *   APIFOX_ACCESS_TOKEN（可选；缺省读 ~/.apifox/config.toml）
 *   OPENAPI_TITLE / OPENAPI_SERVER_URL / OPENAPI_MODULES_GLOB（传给 md-to-openapi）
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const projectId = process.env.APIFOX_PROJECT_ID;

if (!projectId) {
  console.error(
    "缺少 APIFOX_PROJECT_ID。请 export/set 后重试，或参考 scripts/apifox/.apifox.env.example"
  );
  process.exit(1);
}

function run(cmd, args) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env, APIFOX_PROJECT_ID: projectId },
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    throw new Error(`${cmd} exited ${r.status}`);
  }
}

run("node", ["scripts/apifox/md-to-openapi.mjs"]);

run("node", [
  "scripts/apifox/import-openapi-overwrite.mjs",
  "docs/api/generated/openapi.json",
]);

console.log(`Done. OpenAPI endpoints → project ${projectId} (overwrite import)`);
