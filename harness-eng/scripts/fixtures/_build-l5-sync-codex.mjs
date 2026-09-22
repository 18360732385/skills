import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fx = path.join(skillRoot, "scripts/fixtures/l5-sync-codex");
fs.mkdirSync(path.join(fx, "scripts/agent-config"), { recursive: true });
fs.mkdirSync(path.join(fx, "docs/agent-config/hooks"), { recursive: true });
fs.mkdirSync(path.join(fx, "docs/agent-config/codex/rules"), { recursive: true });
fs.mkdirSync(path.join(fx, "docs/agent-config/mcp"), { recursive: true });

let tmpl = fs.readFileSync(path.join(skillRoot, "templates/agent-config/sync.mjs.tmpl"), "utf8");
tmpl = tmpl.replace("{{AI_TOOLS_JSON}}", '["codex"]');
fs.writeFileSync(path.join(fx, "scripts/agent-config/sync.mjs"), tmpl);

const gate = fs
  .readFileSync(path.join(skillRoot, "templates/hooks/superpowers-commit-gate.js.tmpl"), "utf8")
  .replace(/\{\{CODE_PREFIXES\}\}/g, "");
fs.writeFileSync(path.join(fx, "docs/agent-config/hooks/superpowers-commit-gate.js"), gate);
fs.copyFileSync(
  path.join(skillRoot, "templates/hooks/codex-adapter.js"),
  path.join(fx, "docs/agent-config/hooks/codex-adapter.js")
);
fs.writeFileSync(
  path.join(fx, "docs/agent-config/hooks/codex-stop-checklist.js"),
  fs.readFileSync(path.join(skillRoot, "templates/hooks/codex-stop-checklist.js.tmpl"), "utf8")
);
fs.copyFileSync(
  path.join(skillRoot, "templates/agent-config/codex/rules/repository.rules"),
  path.join(fx, "docs/agent-config/codex/rules/repository.rules")
);
fs.copyFileSync(
  path.join(skillRoot, "templates/agent-config/mcp/servers.example.json"),
  path.join(fx, "docs/agent-config/mcp/servers.example.json")
);
fs.writeFileSync(
  path.join(fx, "README.fixture.md"),
  "# Fixture: L5 sync Codex\n\nMinimal SSOT with ai_tools=codex.\nRun sync then --check.\n"
);

const syncJs = path.join(fx, "scripts/agent-config/sync.mjs");
const r = spawnSync(process.execPath, [syncJs], { cwd: fx, encoding: "utf8" });
console.log("sync status", r.status, (r.stderr || "") + (r.stdout || ""));
const c = spawnSync(process.execPath, [syncJs, "--check"], { cwd: fx, encoding: "utf8" });
console.log("check status", c.status, (c.stderr || "") + (c.stdout || ""));
console.log(
  "artifacts",
  [
    ".codex/config.toml.example",
    ".codex/hooks.json",
    ".codex/rules/repository.rules",
    ".codex/hooks/codex-adapter.js",
  ].map((p) => [p, fs.existsSync(path.join(fx, p))])
);
