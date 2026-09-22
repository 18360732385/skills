import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function patch(rel, pairs) {
  const p = path.join(root, rel);
  let s = fs.readFileSync(p, "utf8");
  for (const [a, b] of pairs) {
    if (!s.includes(a)) {
      console.warn("MISS", rel, JSON.stringify(a).slice(0, 80));
      continue;
    }
    s = s.split(a).join(b);
  }
  fs.writeFileSync(p, s);
  console.log("ok", rel);
}

patch("questions.yaml", [['version: "0.6.8-dev"', 'version: "0.6.9"']]);

patch("QUICKSTART.md", [
  ["SKILL_VERSION:'0.6.8-dev'", "SKILL_VERSION:'0.6.9'"],
  ["当前 **0.6.8-dev**", "当前 **0.6.9**"],
]);

patch("README.md", [
  ["**当前版本：0.6.8-dev**", "**当前版本：0.6.9**"],
  [
    "**0.6.8-dev**：Codex P0 增量解冻（[host/CODEX-PARITY.md](host/CODEX-PARITY.md) · [host/CODEX-P0-MANUAL.md](host/CODEX-P0-MANUAL.md)；不做 `.mdc` 全量镜像）。",
    "**0.6.9**：Codex → **高**（[host/CODEX-PARITY.md](host/CODEX-PARITY.md) · [host/CODEX-MANUAL.md](host/CODEX-MANUAL.md)；纪律 B；不做 `.mdc` 镜像）。**0.6.8-dev**：Codex P0 解冻。",
  ],
  ["两边 `version` 当前 **0.6.8-dev**", "两边 `version` 当前 **0.6.9**"],
]);

patch("AGENT-INDEX.md", [
  [
    "| Codex P0（**0.6.8-dev**） | [host/CODEX-PARITY.md](host/CODEX-PARITY.md) · [host/CODEX-P0-MANUAL.md](host/CODEX-P0-MANUAL.md) |",
    "| Codex **高**（**0.6.9**） | [host/CODEX-PARITY.md](host/CODEX-PARITY.md) · [host/CODEX-MANUAL.md](host/CODEX-MANUAL.md) |",
  ],
]);

patch("glossary.md", [
  [
    "| `CODEX-PARITY` | Codex 官方对齐清单（P0；不做 `.mdc` 全量镜像）：[host/CODEX-PARITY.md](host/CODEX-PARITY.md) |",
    "| `CODEX-PARITY` | Codex 官方对齐清单（**高**；不做 `.mdc` 全量镜像）：[host/CODEX-PARITY.md](host/CODEX-PARITY.md) · [CODEX-MANUAL.md](host/CODEX-MANUAL.md) |",
  ],
]);

patch("使用手册.html", [
  ["v0.6.8-dev", "v0.6.9"],
  ["0.6.8-dev 起（Codex P0；其上 0.6.7）", "0.6.9 起（Codex 高；其上 0.6.8-dev / 0.6.7）"],
  ["当前 <strong>0.6.8-dev</strong>", "当前 <strong>0.6.9</strong>"],
]);

// harness-meta template skill_version
const metaCandidates = [
  "templates/docs/harness-eng/harness-meta.yaml.tmpl",
  "templates/harness-meta.yaml.tmpl",
];
for (const rel of metaCandidates) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, "utf8");
  if (s.includes("0.6.8-dev")) {
    fs.writeFileSync(p, s.split("0.6.8-dev").join("0.6.9"));
    console.log("ok", rel);
  }
}

// update design status
{
  const rel = "docs/superpowers/specs/2026-09-22-codex-full-support-design.md";
  let s = fs.readFileSync(path.join(root, rel), "utf8");
  s = s.replace(
    /Status:.*/,
    "- **Status:** approved + implemented (0.6.9)"
  );
  fs.writeFileSync(path.join(root, rel), s);
  console.log("ok", rel);
}

console.log("user-facing version bump done");
