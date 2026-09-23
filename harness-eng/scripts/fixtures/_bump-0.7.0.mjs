import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const files = [
  "_meta/manifest.yaml",
  "templates/_meta/manifest.yaml",
  "questions.yaml",
  "QUICKSTART.md",
  "README.md",
  "VERIFY.md",
  "glossary.md",
  "使用手册.md",
  "使用手册-摘要.md",
  "modes/upgrade.md",
  "fill/fill-score.md",
  "fill/fill-gate.md",
  "templates/docs/harness-eng/harness-meta.yaml.tmpl",
  "host/ai-tools.md",
  "host/CODEX-MANUAL.md",
];

for (const rel of files) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.log("missing", rel);
    continue;
  }
  let s = fs.readFileSync(p, "utf8");
  const o = s;
  s = s.split("0.6.9").join("0.7.0");
  if (s !== o) {
    fs.writeFileSync(p, s);
    console.log("bumped", rel);
  } else {
    console.log("no 0.6.9", rel);
  }
}

// CHANGELOG: prepend 0.7.0 section if missing
const cl = path.join(root, "CHANGELOG.md");
let changelog = fs.readFileSync(cl, "utf8");
if (!/^## 0\.7\.0\b/m.test(changelog)) {
  changelog = changelog.replace(
    /当前 \*\*0\.6\.9\*\*/,
    "当前 **0.7.0**"
  );
  changelog = changelog.replace(
    /（当前 \*\*0\.7\.0\*\*）/,
    "（当前 **0.7.0**）"
  );
  // after train line, ensure 0.7.0 in train
  changelog = changelog.replace(
    /→ 0\.6\.9`（当前 \*\*0\.7\.0\*\*）/,
    "→ 0.6.9 → 0.7.0`（当前 **0.7.0**）"
  );
  if (!changelog.includes("→ 0.7.0`")) {
    changelog = changelog.replace(
      /→ 0\.6\.9`（当前/,
      "→ 0.6.9 → 0.7.0`（当前"
    );
  }
  const section = `## 0.7.0 — 2026-09-23（形态重标定 · gold 可达 · ready 废弃）

### Breaking
- **形态分**：探针≈75 + 深度≈25 → 满分 **100**；\`morph_cap=100\`；\`formula_ceiling≈100\`；JSON \`morph_scale: "0.7"\`
- **strict** \`morph_floor\`: 60 → **75**；**gold** \`morph_floor\`: 90 → **95**（仍双 95：完成度≥95）
- **strict semantic**：\`generic≤3 && unbound≤2 && tc≥70\`（legacy 保持 5/3/50；gold 0/0/95）
- **\`ready.ok\` 对外废弃**（JSON 保留 \`deprecated: true\`）；开干只看 \`ai_coding_ready\`
- **report_schema** → **0.3.0**；旧 score-history 与 0.6.x overall **不可比**

### Added
- \`scripts/lib/morph-depth.mjs\` 深度档；\`scripts/lib/score-policy-migrate.mjs\` 字段级迁移 60→75 / gold 90→95
- \`fill-score --migrate-policy\`；\`harness.mjs\` resume/upgrade/land 后自动迁移旧默认 morph_floor

### Docs
- fill-score / fill-gate / glossary / upgrade 迁移要点对齐 0.7.0

`;
  changelog = changelog.replace(/^(## 0\.6\.9\b)/m, section + "$1");
  // report_schema pin in header
  changelog = changelog.replace(
    /报告对照 \*\*\`skill_version\` \+ \`report_schema\`\*\*（\*\*0\.2\.26\*\*/g,
    "报告对照 **`skill_version` + `report_schema`**（**0.3.0**"
  );
  fs.writeFileSync(cl, changelog);
  console.log("CHANGELOG 0.7.0 section");
} else {
  console.log("CHANGELOG already has 0.7.0");
}

// manifest comment line
for (const rel of ["templates/_meta/manifest.yaml", "_meta/manifest.yaml"]) {
  const p = path.join(root, rel);
  let s = fs.readFileSync(p, "utf8");
  if (!s.includes("0.7.0:")) {
    s = s.replace(
      /# 0\.6\.9:/,
      "# 0.7.0: morph recalibrate (probe+depth→100); gold morph_floor 95; ready.ok deprecated; report_schema 0.3.0.\n# 0.6.9:"
    );
    fs.writeFileSync(p, s);
    console.log("manifest comment", rel);
  }
}

console.log("done");
