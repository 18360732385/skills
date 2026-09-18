#!/usr/bin/env node
/**
 * 通过 Apifox 开放 API 导入 OpenAPI，强制 endpointOverwriteBehavior=OVERWRITE_EXISTING。
 * CLI `apifox import` 无法指定覆盖策略，且客户端「项目设置 → 导入数据」入口因版本/权限可能不可见。
 *
 * 用法：
 *   node scripts/apifox/import-openapi-overwrite.mjs [openapi.json路径]
 * 环境变量：
 *   APIFOX_PROJECT_ID（必填）
 *   APIFOX_ACCESS_TOKEN（可选；缺省读 ~/.apifox/config.toml 中 apifox auth login 的 token）
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const projectId = process.env.APIFOX_PROJECT_ID;
const apiVersion = process.env.APIFOX_API_VERSION || "2024-03-28";
const openapiFile =
  process.argv[2] ||
  path.join(repoRoot, "docs/api/generated/openapi.json");

if (!projectId) {
  console.error(
    "缺少 APIFOX_PROJECT_ID。请 export/set 后重试，或参考 scripts/apifox/.apifox.env.example"
  );
  process.exit(1);
}

function resolveAccessToken() {
  if (process.env.APIFOX_ACCESS_TOKEN) {
    return process.env.APIFOX_ACCESS_TOKEN;
  }
  const configPath = path.join(os.homedir(), ".apifox", "config.toml");
  if (!fs.existsSync(configPath)) return null;
  const text = fs.readFileSync(configPath, "utf8");
  const m = text.match(/access_token\s*=\s*"([^"]+)"/);
  return m ? m[1] : null;
}

const token = resolveAccessToken();
if (!token) {
  console.error(
    "缺少 APIFOX_ACCESS_TOKEN。请先执行：apifox auth login --with-token <令牌>"
  );
  process.exit(1);
}

if (!fs.existsSync(openapiFile)) {
  console.error(`OpenAPI 文件不存在: ${openapiFile}`);
  process.exit(1);
}

const spec = fs.readFileSync(openapiFile, "utf8");

const url = `https://api.apifox.com/v1/projects/${projectId}/import-openapi?locale=zh-CN`;
console.log(`> POST ${url}`);
console.log(`> file ${openapiFile} (${spec.length} bytes)`);
console.log("> options.endpointOverwriteBehavior=OVERWRITE_EXISTING");

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Apifox-Api-Version": apiVersion,
  },
  body: JSON.stringify({
    input: spec,
    options: {
      endpointOverwriteBehavior: "OVERWRITE_EXISTING",
      schemaOverwriteBehavior: "OVERWRITE_EXISTING",
      updateFolderOfChangedEndpoint: true,
      prependBasePath: false,
    },
  }),
});

const bodyText = await res.text();
let body;
try {
  body = JSON.parse(bodyText);
} catch {
  console.error(bodyText);
  process.exit(1);
}

console.log(JSON.stringify(body, null, 2));

if (!res.ok) {
  console.error(`Apifox import failed: HTTP ${res.status}`);
  process.exit(1);
}

const counters = body?.data?.counters ?? {};
const updated = counters.endpointUpdated ?? counters.updateCount ?? 0;
const created = counters.endpointCreated ?? counters.createCount ?? 0;
const ignored = counters.endpointIgnored ?? counters.ignoreCount ?? 0;
const errors = counters.endpointFailed ?? counters.errorCount ?? 0;

console.log(
  `Done. project=${projectId} created=${created} updated=${updated} ignored=${ignored} errors=${errors}`
);

if (errors > 0) {
  process.exit(1);
}
