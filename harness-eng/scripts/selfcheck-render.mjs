#!/usr/bin/env node
/**
 * Dry-run / merge checks for harness-eng render.
 * Usage: node scripts/selfcheck-render.mjs
 */
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(__dirname, "..");
const RENDER = path.join(__dirname, "render.mjs");
const FIX = path.join(__dirname, "fixtures");
const MANIFEST = path.join(SKILL, "templates", "_meta", "manifest.yaml");

function writeParams(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), "utf8");
}

function runRender(root, paramsFile, extraArgs = []) {
  const r = spawnSync(
    process.execPath,
    [RENDER, "--root", root, "--params", paramsFile, ...extraArgs],
    { encoding: "utf8" }
  );
  return r;
}

function runDry(root, paramsFile, extraArgs = []) {
  const r = runRender(root, paramsFile, ["--dry-run", ...extraArgs]);
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error(`render dry-run failed for ${root}`);
  }
  return JSON.parse(r.stdout);
}

function main() {
  const tmp = path.join(__dirname, ".selfcheck-params.json");
  const placeholders = {
    REPO_NAME: "fixture",
    REPO_DESC: "test",
    MODULE_DIRS: "app",
    LADDER_TARGET: "L0",
    DOMAINS_YAML: "[]",
    AGENTS_VARIANT: "solo",
    GLOB_PROFILE: "wide",
    DATE: "2026-08-04",
    LAST_MODE: "land",
    AI_TOOLS_YAML: "[cursor]",
  };

  // 1) NEW_CODE explicit files dry-run
  const newCodeRoot = path.join(FIX, "new-code");
  writeParams(tmp, {
    placeholders,
    files: [
      { template: "agents/AGENTS.root.solo.md.tmpl", target: "AGENTS.md", action: "create" },
      { template: "meta/harness-meta.yaml.tmpl", target: "docs/harness-eng/harness-meta.yaml", action: "create" },
    ],
  });
  const dry1 = runDry(newCodeRoot, tmp);
  const targets1 = dry1.results.map((x) => x.target).sort();
  const expect1 = ["docs/harness-eng/harness-meta.yaml", "AGENTS.md"].sort();
  if (JSON.stringify(targets1) !== JSON.stringify(expect1)) {
    throw new Error(`new-code dry-run targets mismatch: ${targets1}`);
  }

  // 2) PARTIAL merge dry-run
  const partialRoot = path.join(FIX, "partial-agents");
  writeParams(tmp, {
    placeholders,
    files: [{ template: "agents/AGENTS.root.solo.md.tmpl", target: "AGENTS.md", action: "merge" }],
  });
  const dry2 = runDry(partialRoot, tmp);
  if (dry2.results[0].action !== "merge") throw new Error("partial expected merge");

  // 3) mcp.json refuse
  writeParams(tmp, {
    placeholders,
    files: [{ template: "mcp/mcp.json.example", target: ".cursor/mcp.json", action: "create" }],
  });
  const rMcp = runRender(newCodeRoot, tmp, ["--dry-run"]);
  if (rMcp.status === 0) throw new Error("expected mcp.json write to fail");

  const agents = fs.readFileSync(path.join(partialRoot, "AGENTS.md"), "utf8");
  if (!agents.includes("CUSTOM_NEVER_DO_LINE_DO_NOT_DROP")) {
    throw new Error("partial fixture Never do line missing");
  }

  // 4) YAML key-level merge preserves custom keys
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "harness-meta-"));
  const metaDir = path.join(tmpRoot, ".cursor");
  fs.mkdirSync(metaDir, { recursive: true });
  fs.writeFileSync(
    path.join(metaDir, "harness-meta.yaml"),
    [
      "# harness-eng install metadata — do not put secrets here",
      "skill: harness-eng",
      'skill_version: "1.1.0"',
      "ladder: L0",
      "domains: []",
      "agents_variant: solo",
      "glob_profile: wide",
      "installed_at: 2026-01-01",
      "custom_user_key: keep-me",
      "",
    ].join("\n"),
    "utf8"
  );
  writeParams(tmp, {
    placeholders: {
      ...placeholders,
      LADDER_TARGET: "L2",
      DOMAINS_YAML: "[func, api]",
      AGENTS_VARIANT: "solo",
      GLOB_PROFILE: "focused",
      DATE: "2026-08-04",
      LAST_MODE: "upgrade",
      AI_TOOLS_YAML: "[cursor, claude]",
    },
    files: [
      {
        template: "meta/harness-meta.yaml.tmpl",
        target: ".cursor/harness-meta.yaml",
        action: "merge",
        mergeMode: "yaml-keys",
      },
    ],
  });
  const rMeta = runRender(tmpRoot, tmp);
  if (rMeta.status !== 0) {
    console.error(rMeta.stderr || rMeta.stdout);
    throw new Error("meta merge failed");
  }
  const mergedMeta = fs.readFileSync(path.join(metaDir, "harness-meta.yaml"), "utf8");
  if (!mergedMeta.includes("custom_user_key: keep-me")) {
    throw new Error("custom_user_key not preserved");
  }
  if (!/ladder:\s*L2/.test(mergedMeta)) {
    throw new Error(`ladder not updated to L2: ${mergedMeta}`);
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true });

  // 5) Manifest expand L0 solo, no optional, no L1
  writeParams(tmp, {
    ladder: "L0",
    domains: [],
    agents_variant: "solo",
    include_optional: [],
    placeholders,
    files: [],
  });
  const dry5 = runDry(newCodeRoot, tmp, ["--manifest", MANIFEST]);
  if (!dry5.expandedFromManifest) throw new Error("expected expandedFromManifest");
  const t5 = dry5.results.map((x) => x.target.replace(/\\/g, "/"));
  for (const need of [
    "AGENTS.md",
    "docs/harness-eng/harness-meta.yaml",
    ".cursor/rules/00-project-docs-overview.mdc",
    ".cursor/rules/karpathy-guidelines.mdc",
  ]) {
    if (!t5.includes(need)) throw new Error(`manifest expand missing ${need}`);
  }
  if (t5.some((t) => t.includes("14-chinese"))) {
    throw new Error("optional rule-14 should be excluded");
  }
  if (t5.some((t) => t.startsWith("docs/") && t !== "docs/harness-eng/harness-meta.yaml")) {
    throw new Error("L1 docs should be excluded at L0");
  }

  // 6) AI tool adapters + custom
  writeParams(tmp, {
    ladder: "L0",
    domains: [],
    agents_variant: "solo",
    include_optional: [],
    ai_tools: ["claude", "qoder", "trae", "workbuddy", "codex"],
    ai_tools_custom: [{ id: "foo", label: "FooAgent", entry: ".foo/RULES.md" }],
    on_exists: "fail",
    placeholders,
    files: [],
  });
  const dry6 = runDry(newCodeRoot, tmp, ["--manifest", MANIFEST]);
  const t6 = dry6.results.map((x) => x.target.replace(/\\/g, "/"));
  for (const need of [
    "CLAUDE.md",
    ".qoder/rules/00-harness-ssot.md",
    ".trae/rules/00-harness-ssot.md",
    "CODEBUDDY.md",
    ".codebuddy/rules/00-harness-ssot.md",
    ".codex/harness.md",
    ".foo/RULES.md",
  ]) {
    if (!t6.includes(need)) throw new Error(`ai_tools expand missing ${need}`);
  }

  // 7) include_optional boolean true → rule-14 (Q_RULE14 mapping)
  writeParams(tmp, {
    ladder: "L0",
    domains: [],
    agents_variant: "solo",
    include_optional: true,
    on_exists: "fail",
    placeholders,
    files: [],
  });
  const dry7 = runDry(newCodeRoot, tmp, ["--manifest", MANIFEST]);
  const t7 = dry7.results.map((x) => x.target.replace(/\\/g, "/"));
  if (!t7.some((t) => t.includes("14-chinese"))) {
    throw new Error("include_optional:true should expand rule-14");
  }

  // 8) L5 + Trae-only：必须落 SSOT 00-harness-ssot；宿主 00 / 1x 由 sync 分发或省略
  writeParams(tmp, {
    ladder: "L5",
    domains: [],
    agents_variant: "solo",
    include_optional: [],
    ai_tools: ["trae"],
    on_exists: "fail",
    placeholders: { ...placeholders, LADDER_TARGET: "L5" },
    files: [],
  });
  const dry8 = runDry(newCodeRoot, tmp, ["--manifest", MANIFEST]);
  const t8 = dry8.results.map((x) => x.target.replace(/\\/g, "/"));
  if (!t8.includes("docs/agent-config/rules/00-harness-ssot.mdc")) {
    throw new Error("L5 trae-only plan must include SSOT 00-harness-ssot.mdc");
  }
  if (t8.includes(".trae/rules/00-harness-ssot.md")) {
    throw new Error("L5 must not direct-render host 00-harness-ssot (sync distributes)");
  }
  if (t8.some((t) => /1x-contract-sync/.test(t))) {
    throw new Error("L5 must not emit 1x-contract-sync for full-mirror hosts");
  }

  try {
    fs.unlinkSync(tmp);
  } catch (_) {}
  try {
    fs.unlinkSync(path.join(__dirname, ".tmp-expand.json"));
  } catch (_) {}

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "new-code-dry-run-paths",
          "partial-merge-dry-run",
          "mcp-refuse",
          "partial-never-do-intact",
          "meta-yaml-key-merge",
          "manifest-expand-l0-solo",
          "ai-tools-adapters-custom",
          "include-optional-boolean",
          "l5-trae-ssot-00-harness",
        ],
      },
      null,
      2
    )
  );
}

try {
  main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
