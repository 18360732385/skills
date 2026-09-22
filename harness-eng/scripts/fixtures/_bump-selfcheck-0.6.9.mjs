import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function patch(rel, pairs) {
  const p = path.join(root, rel);
  let s = fs.readFileSync(p, "utf8");
  for (const [a, b] of pairs) {
    if (!s.includes(a)) {
      console.warn("MISS", rel, a.slice(0, 70));
      continue;
    }
    s = s.split(a).join(b);
  }
  fs.writeFileSync(p, s);
  console.log("ok", rel);
}

// Current-version pins → 0.6.9 (keep historical CHANGELOG 0.6.8-dev headings)
patch("scripts/selfcheck.mjs", [
  [' * 0.6.8-dev: Codex P0 parity thaw (PARITY/MANUAL/config.toml/hooks regex).',
   ' * 0.6.9: Codex → 高 (Starlark/TOML/hooks/skills; discipline B).\n * 0.6.8-dev: Codex P0 parity thaw (PARITY/MANUAL/config.toml/hooks regex).'],
  ['assert(/version:\\s*"0\\.6\\.8-dev"/.test(qYaml), "questions.yaml version 0.6.8-dev");',
   'assert(/version:\\s*"0\\.6\\.9"/.test(qYaml), "questions.yaml version 0.6.9");'],
  ['assert(/version:\\s*"0\\.6\\.8-dev"/.test(manifest), "manifest 0.6.8-dev");',
   'assert(/version:\\s*"0\\.6\\.9"/.test(manifest), "manifest 0.6.9");'],
  ['assert(/version:\\s*"0\\.6\\.8-dev"/.test(rootManifest), "root _meta manifest 0.6.8-dev");',
   'assert(/version:\\s*"0\\.6\\.9"/.test(rootManifest), "root _meta manifest 0.6.9");'],
  ['assert(/skill_version:\\s*"0\\.6\\.8-dev"/.test(metaTmpl), "harness-meta 0.6.8-dev");',
   'assert(/skill_version:\\s*"0\\.6\\.9"/.test(metaTmpl), "harness-meta 0.6.9");'],
  ['assert(/^## 0\\.6\\.8-dev\\b/m.test(changelog), "CHANGELOG 0.6.8-dev");',
   'assert(/^## 0\\.6\\.9\\b/m.test(changelog), "CHANGELOG 0.6.9");\nassert(/^## 0\\.6\\.8-dev\\b/m.test(changelog), "CHANGELOG keeps 0.6.8-dev");'],
  ['assert(/验收记录（0\\.6\\.8-dev）/.test(verifyMd) && /当前 \\*\\*0\\.6\\.8-dev\\*\\*/.test(verifyMd) && !/验收记录（0\\.6\\.5-dev）/.test(verifyMd), "VERIFY is 0.6.8-dev");',
   'assert(/验收记录（0\\.6\\.9）/.test(verifyMd) && /当前 \\*\\*0\\.6\\.9\\*\\*/.test(verifyMd), "VERIFY is 0.6.9");'],
  ['assert(/当前版本：0\\.6\\.8-dev/.test(readme), "README header version 0.6.8-dev");',
   'assert(/当前版本：0\\.6\\.9/.test(readme), "README header version 0.6.9");'],
  ['assert(/当前 \\*\\*0\\.6\\.8-dev\\*\\*/.test(readme), "README footer version 0.6.8-dev");',
   'assert(/当前 \\*\\*0\\.6\\.9\\*\\*/.test(readme), "README footer version 0.6.9");'],
  ['assert(/版本：\\*\\*0\\.6\\.8-dev\\*\\*/.test(handbookMd), "使用手册.md version 0.6.8-dev");',
   'assert(/版本：\\*\\*0\\.6\\.9\\*\\*/.test(handbookMd), "使用手册.md version 0.6.9");'],
  ['assert(/v0\\.6\\.8-dev/.test(handbookHtml), "使用手册.html version 0.6.8-dev");',
   'assert(/v0\\.6\\.9/.test(handbookHtml), "使用手册.html version 0.6.9");'],
  ['assert(/当前 \\*\\*0\\.6\\.8-dev\\*\\*/.test(quickstartMd), "QUICKSTART version 0.6.8-dev");',
   'assert(/当前 \\*\\*0\\.6\\.9\\*\\*/.test(quickstartMd), "QUICKSTART version 0.6.9");'],
  ['SKILL_VERSION: "0.6.8-dev"', 'SKILL_VERSION: "0.6.9"'],
  ['assert(/version:\\s*"0\\.6\\.8-dev"/.test(fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8")), "manifest 0.6.8-dev");',
   'assert(/version:\\s*"0\\.6\\.9"/.test(fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8")), "manifest 0.6.9");'],
]);

patch("scripts/lib/selfcheck/checks-0.6.mjs", [
  ['assert(verLine && verLine[1] === "0.6.8-dev", "manifest version exactly 0.6.8-dev");',
   'assert(verLine && verLine[1] === "0.6.9", "manifest version exactly 0.6.9");'],
  ['assert(manVer063 === "0.6.8-dev", "current manifest pin (0.6.8-dev; 0.6.3 formal retained in CHANGELOG)");',
   'assert(manVer063 === "0.6.9", "current manifest pin 0.6.9");'],
  ['"使用手册-摘要 version 0.6.8-dev"', '"使用手册-摘要 version 0.6.9"'],
  ['/版本：\\*\\*0\\.6\\.8-dev\\*\\*/', '/版本：\\*\\*0\\.6\\.9\\*\\*/'],
  ['assert(/^## 0\\.6\\.8-dev\\b/m.test(changelog068), "CHANGELOG 0.6.8-dev heading");',
   'assert(/^## 0\\.6\\.9\\b/m.test(changelog068), "CHANGELOG 0.6.9 heading");\n  assert(/^## 0\\.6\\.8-dev\\b/m.test(changelog068), "CHANGELOG keeps 0.6.8-dev");'],
  ['assert(/0\\.6\\.7 → 0\\.6\\.8-dev/.test(upgrade068), "upgrade has 0.6.7 → 0.6.8-dev");',
   'assert(/0\\.6\\.8-dev → 0\\.6\\.9/.test(upgrade068), "upgrade has 0.6.8-dev → 0.6.9");\n  assert(/0\\.6\\.7 → 0\\.6\\.8-dev/.test(upgrade068), "upgrade keeps 0.6.7 → 0.6.8-dev");'],
  ['assert(/0\\.6\\.8-dev 增量验收/.test(verify068), "VERIFY 0.6.8-dev section");',
   'assert(/0\\.6\\.9 增量验收/.test(verify068), "VERIFY 0.6.9 section");'],
  ['assert(/0\\.6\\.8-dev/.test(syncTmpl068), "sync tmpl id 0.6.8-dev");',
   'assert(/0\\.6\\.9/.test(syncTmpl068), "sync tmpl id 0.6.9");'],
]);

// freshness markers in checks-0.6 (0.6.3 suite)
patch("scripts/lib/selfcheck/checks-0.6.mjs", [
  ["HARNESS_SYNC_TMPL_ID:\\s*0\\.6\\.8-dev", "HARNESS_SYNC_TMPL_ID:\\s*0\\.6\\.9"],
  ["HARNESS_SYNC_TMPL_ID=0\\.6\\.8-dev", "HARNESS_SYNC_TMPL_ID=0\\.6\\.9"],
]);

console.log("selfcheck version pins updated");
