import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function patch(rel, pairs) {
  const p = path.join(root, rel);
  let s = fs.readFileSync(p, "utf8");
  const o = s;
  for (const [a, b] of pairs) {
    if (!s.includes(a) && !a.startsWith("/")) {
      console.warn("MISS", rel, JSON.stringify(a).slice(0, 80));
      continue;
    }
    s = s.split(a).join(b);
  }
  if (s !== o) {
    fs.writeFileSync(p, s);
    console.log("patched", rel);
  } else console.log("unchanged", rel);
}

// selfcheck.mjs version pins
patch("scripts/selfcheck.mjs", [
  [
    " * 0.6.9: Codex → 高 (Starlark/TOML/hooks/skills; discipline B).",
    " * 0.7.0: morph recalibrate (probe+depth→100); gold floor 95; ready deprecated; report_schema 0.3.0.\n * 0.6.9: Codex → 高 (Starlark/TOML/hooks/skills; discipline B).",
  ],
  ['version:\\s*"0\\.6\\.9"', 'version:\\s*"0\\.7\\.0"'], // won't work - these are regex in source
]);

// Direct string replacements in selfcheck source (the assert pattern strings)
{
  const p = path.join(root, "scripts/selfcheck.mjs");
  let s = fs.readFileSync(p, "utf8");
  s = s.replace(
    /assert\(\/version:\\s\*"0\\\.6\\\.9"\/\.test\(qYaml\), "questions\.yaml version 0\.6\.9"\);/,
    'assert(/version:\\s*"0\\.7\\.0"/.test(qYaml), "questions.yaml version 0.7.0");'
  );
  s = s.replace(
    /assert\(\/version:\\s\*"0\\\.6\\\.9"\/\.test\(manifest\), "manifest 0\.6\.9"\);/,
    'assert(/version:\\s*"0\\.7\\.0"/.test(manifest), "manifest 0.7.0");'
  );
  s = s.replace(
    /assert\(\/version:\\s\*"0\\\.6\\\.9"\/\.test\(rootManifest\), "root _meta manifest 0\.6\.9"\);/,
    'assert(/version:\\s*"0\\.7\\.0"/.test(rootManifest), "root _meta manifest 0.7.0");'
  );
  s = s.replace(
    /assert\(\/skill_version:\\s\*"0\\\.6\\\.9"\/\.test\(metaTmpl\), "harness-meta 0\.6\.9"\);/,
    'assert(/skill_version:\\s*"0\\.7\\.0"/.test(metaTmpl), "harness-meta 0.7.0");'
  );
  s = s.replace(
    /assert\(\/\^## 0\\\.6\\\.9\\b\/m\.test\(changelog\), "CHANGELOG 0\.6\.9"\);/,
    'assert(/^## 0\\.7\\.0\\b/m.test(changelog), "CHANGELOG 0.7.0");'
  );
  s = s.replace(
    /assert\(\/验收记录（0\\\.6\\\.9）\/\.test\(verifyMd\) && \/当前 \\\*\\\*0\\\.6\\\.9\\\*\\\*\/\.test\(verifyMd\), "VERIFY is 0\.6\.9"\);/,
    'assert(/验收记录（0\\.7\\.0）/.test(verifyMd) && /当前 \\*\\*0\\.7\\.0\\*\\*/.test(verifyMd), "VERIFY is 0.7.0");'
  );
  s = s.replace(
    /assert\(\/当前版本：0\\\.6\\\.9\/\.test\(readme\), "README header version 0\.6\.9"\);/,
    'assert(/当前版本：0\\.7\\.0/.test(readme), "README header version 0.7.0");'
  );
  s = s.replace(
    /assert\(\/当前 \\\*\\\*0\\\.6\\\.9\\\*\\\*\/\.test\(readme\), "README footer version 0\.6\.9"\);/,
    'assert(/当前 \\*\\*0\\.7\\.0\\*\\*/.test(readme), "README footer version 0.7.0");'
  );
  s = s.replace(
    /assert\(\/版本：\\\*\\\*0\\\.6\\\.9\\\*\\\*\/\.test\(handbookMd\), "使用手册\.md version 0\.6\.9"\);/,
    'assert(/版本：\\*\\*0\\.7\\.0\\*\\*/.test(handbookMd), "使用手册.md version 0.7.0");'
  );
  s = s.replace(
    /assert\(\/v0\\\.6\\\.9\/\.test\(handbookHtml\), "使用手册\.html version 0\.6\.9"\);/,
    'assert(/v0\\.7\\.0/.test(handbookHtml), "使用手册.html version 0.7.0");'
  );
  s = s.replace(
    /assert\(\/当前 \\\*\\\*0\\\.6\\\.9\\\*\\\*\/\.test\(quickstartMd\), "QUICKSTART version 0\.6\.9"\);/,
    'assert(/当前 \\*\\*0\\.7\\.0\\*\\*/.test(quickstartMd), "QUICKSTART version 0.7.0");'
  );
  s = s.replace(
    'assert(["0.2.18","0.2.19","0.2.20","0.2.21","0.2.22","0.2.23","0.2.24","0.2.25","0.2.26","0.2.27","0.2.28","0.2.29"].includes(ui.version), "ui.version compatible");',
    'assert(["0.2.18","0.2.19","0.2.20","0.2.21","0.2.22","0.2.23","0.2.24","0.2.25","0.2.26","0.2.27","0.2.28","0.2.29","0.3.0"].includes(ui.version), "ui.version compatible");'
  );
  s = s.replace(
    'assert(ui.report_schema === "0.2.26", "report_schema 0.2.26");',
    'assert(ui.report_schema === "0.3.0", "report_schema 0.3.0");\n  assert(ui.morph_scale === "0.7" || scoreObj.morph_scale === "0.7" || ui.morph_scale == null, "morph_scale present or fixture lag ok");'
  );
  s = s.replace(
    'SKILL_VERSION: "0.6.9"',
    'SKILL_VERSION: "0.7.0"'
  );
  s = s.replace(
    'assert(goldGate.morph_floor === 90, "gold morph_floor 90");',
    'assert(goldGate.morph_floor === 95, "gold morph_floor 95");'
  );
  s = s.replace(
    'domains: { api: { score: 85 }, func: { score: 95 }, db: { score: 95 }, redis: { score: 95 } },',
    'domains: { api: { score: 90 }, func: { score: 96 }, db: { score: 96 }, redis: { score: 96 } },'
  );
  s = s.replace(
    '"gold morph_floor 90 blocks api 85"',
    '"gold morph_floor 95 blocks api 90"'
  );
  s = s.replace(
    /assert\(\/version:\\s\*"0\\\.6\\\.9"\/\.test\(fs\.readFileSync\(path\.join\(skillRoot, "templates\/_meta\/manifest\.yaml"\), "utf8"\)\), "manifest 0\.6\.9"\);/,
    'assert(/version:\\s*"0\\.7\\.0"/.test(fs.readFileSync(path.join(skillRoot, "templates/_meta/manifest.yaml"), "utf8")), "manifest 0.7.0");'
  );
  // strict default floor
  if (!/assert\(gate\.morph_floor === 75/.test(s)) {
    s = s.replace(
      "const gate = applyStrictGateDefaults({});",
      'const gate = applyStrictGateDefaults({});\n  assert(gate.morph_floor === 75, "strict morph_floor 75");'
    );
  }
  fs.writeFileSync(p, s);
  console.log("selfcheck.mjs updated");
}

// checks-0.6 current pins
{
  const p = path.join(root, "scripts/lib/selfcheck/checks-0.6.mjs");
  let s = fs.readFileSync(p, "utf8");
  s = s.replace(
    'assert(verLine && verLine[1] === "0.6.9", "manifest version exactly 0.6.9");',
    'assert(verLine && verLine[1] === "0.7.0", "manifest version exactly 0.7.0");'
  );
  s = s.replace(
    'assert(manVer063 === "0.6.9", "current manifest pin 0.6.9");',
    'assert(manVer063 === "0.7.0", "current manifest pin 0.7.0");'
  );
  s = s.replace(
    '"使用手册-摘要 version 0.6.9"',
    '"使用手册-摘要 version 0.7.0"'
  );
  s = s.replace(
    /assert\(\/版本：\\\*\\\*0\\\.6\\\.9\\\*\\\*\//,
    'assert(/版本：\\*\\*0\\.7\\.0\\*\\*/'
  );
  s = s.replace(
    'assert(/0\\.6\\.9/.test(syncTmpl068), "sync tmpl id 0.6.9");',
    'assert(/0\\.7\\.0/.test(syncTmpl068), "sync tmpl id 0.7.0");'
  );
  // keep changelog 0.6.9 heading assert; add 0.7.0
  if (!/CHANGELOG 0\.7\.0 heading/.test(s)) {
    s = s.replace(
      'assert(/^## 0\\.6\\.9\\b/m.test(changelog068), "CHANGELOG 0.6.9 heading");',
      'assert(/^## 0\\.6\\.9\\b/m.test(changelog068), "CHANGELOG 0.6.9 heading");\n  assert(/^## 0\\.7\\.0\\b/m.test(changelog068), "CHANGELOG 0.7.0 heading");'
    );
  }
  if (!/0\.6\.9 → 0\.7\.0/.test(s)) {
    s = s.replace(
      'assert(/0\\.6\\.8-dev → 0\\.6\\.9/.test(upgrade068), "upgrade has 0.6.8-dev → 0.6.9");',
      'assert(/0\\.6\\.8-dev → 0\\.6\\.9/.test(upgrade068), "upgrade has 0.6.8-dev → 0.6.9");\n  assert(/0\\.6\\.9 → 0\\.7\\.0/.test(upgrade068), "upgrade has 0.6.9 → 0.7.0");'
    );
  }
  if (!/VERIFY 0\.7\.0 section/.test(s)) {
    s = s.replace(
      'assert(/0\\.6\\.9 增量验收/.test(verify068), "VERIFY 0.6.9 section");',
      'assert(/0\\.6\\.9 增量验收/.test(verify068), "VERIFY 0.6.9 section");\n  assert(/0\\.7\\.0 增量验收/.test(verify068), "VERIFY 0.7.0 section");'
    );
  }
  fs.writeFileSync(p, s);
  console.log("checks-0.6.mjs updated");
}

{
  const p = path.join(root, "scripts/lib/selfcheck/checks-0.5.mjs");
  let s = fs.readFileSync(p, "utf8");
  s = s.replace(
    'assert(uiObj.version === "0.2.26", "ui.version 0.2.26 for consumers");',
    'assert(uiObj.version === "0.3.0", "ui.version 0.3.0 for consumers");'
  );
  s = s.replace(
    /assert\(\/对齐矩阵（0\\\.6\\\.9\|0\\\.6\\\.x）\//,
    'assert(/对齐矩阵（0\\.7\\.0|0\\.6\\.9|0\\.6\\.x）/'
  );
  fs.writeFileSync(p, s);
  console.log("checks-0.5.mjs updated");
}

// handbook html + score sample
{
  const p = path.join(root, "使用手册.html");
  let s = fs.readFileSync(p, "utf8");
  s = s.split("0.6.9").join("0.7.0");
  fs.writeFileSync(p, s);
  console.log("handbook html bumped");
}

{
  const p = path.join(root, "scripts/fixtures/score-sample.json");
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  j.formula_ceiling = 100;
  j.domain_caps = { api: 100, func: 100, db: 100, redis: 100 };
  j.morph_scale = "0.7";
  j.overall = 88;
  j.quality = { ...(j.quality || {}), overall: 88 };
  if (j.ready) j.ready.deprecated = true;
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  console.log("score-sample updated");
}

console.log("done");
