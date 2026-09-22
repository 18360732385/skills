import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function write(rel, content) {
  fs.writeFileSync(path.join(root, rel), content);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function replaceAll(rel, from, to) {
  const s = read(rel);
  if (!s.includes(from)) {
    console.warn("skip missing", rel, from);
    return;
  }
  write(rel, s.split(from).join(to));
  console.log("replaced in", rel);
}

// dual manifests
for (const rel of ["_meta/manifest.yaml", "templates/_meta/manifest.yaml"]) {
  let s = read(rel);
  s = s.replace(/version:\s*"0\.6\.8-dev"/, 'version: "0.6.9"');
  if (rel.includes("templates/_meta")) {
    if (!s.includes("0.6.9:")) {
      s = s.replace(
        /# 0\.6\.8-dev:/,
        "# 0.6.9: Codex → 高 (Starlark/TOML/hooks/skills; discipline B).\n# 0.6.8-dev:"
      );
    }
  }
  write(rel, s);
  console.log("version", rel);
}

// sync tmpl ids
{
  let s = read("templates/agent-config/sync.mjs.tmpl");
  s = s.replaceAll("0.6.8-dev", "0.6.9");
  write("templates/agent-config/sync.mjs.tmpl", s);
}

// rebuild codex fixture sync from tmpl
spawnSync(process.execPath, [path.join(root, "scripts/fixtures/_build-l5-sync-codex.mjs")], {
  cwd: root,
  stdio: "inherit",
});

// rebuild golden sync from tmpl (keep AI_TOOLS)
{
  const golden = path.join(root, "scripts/fixtures/l5-sync-golden/scripts/agent-config/sync.mjs");
  let tmpl = read("templates/agent-config/sync.mjs.tmpl");
  tmpl = tmpl.replace("{{AI_TOOLS_JSON}}", '["cursor","claude"]');
  fs.writeFileSync(golden, tmpl);
  const r = spawnSync(process.execPath, [golden, "--check"], {
    cwd: path.join(root, "scripts/fixtures/l5-sync-golden"),
    encoding: "utf8",
  });
  console.log("golden check", r.status, (r.stderr || "") + (r.stdout || ""));
}

replaceAll("使用手册-摘要.md", "0.6.8-dev", "0.6.9");
replaceAll("使用手册.md", "0.6.8-dev", "0.6.9");

console.log("version bump prep done");
