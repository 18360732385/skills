import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tmpl = fs.readFileSync(path.join(root, "templates/agent-config/sync.mjs.tmpl"), "utf8");
const golden = path.join(root, "scripts/fixtures/l5-sync-golden/scripts/agent-config/sync.mjs");
fs.writeFileSync(golden, tmpl.replace("{{AI_TOOLS_JSON}}", '["cursor","claude"]'));
const r = spawnSync(process.execPath, [golden, "--check"], {
  cwd: path.join(root, "scripts/fixtures/l5-sync-golden"),
  encoding: "utf8",
});
console.log("golden", r.status, (r.stderr || "") + (r.stdout || ""));
const build = path.join(root, "scripts/fixtures/_build-l5-sync-codex.mjs");
if (fs.existsSync(build)) {
  const b = spawnSync(process.execPath, [build], { cwd: root, encoding: "utf8" });
  console.log("codex build", b.status, (b.stderr || "") + (b.stdout || ""));
}
