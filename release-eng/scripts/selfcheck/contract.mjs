/**
 * @layer contract — 文件/manifest/CLI 契约（快）
 */
import { spawnSync } from "child_process";
import path from "path";

export async function runContract(kit) {
  const { skillRoot, PIN, VER_RE, assert, read, exists } = kit;

  const manifest = read("_meta/manifest.yaml");
  assert(manifest != null, "manifest.yaml exists");
  assert(
    manifest != null && new RegExp(`version:\\s*"${VER_RE}"`).test(manifest),
    `manifest version == ${PIN}`
  );
  assert(
    manifest != null && /harness_land:\s*false/.test(manifest),
    "manifest harness_land == false"
  );
  for (const m of ["prepare", "audit", "seal", "cancel"]) {
    assert(
      manifest != null && new RegExp(`-\\s+${m}\\b`).test(manifest),
      `manifest modes includes ${m}`
    );
  }

  for (const f of [
    "SKILL.md",
    "AGENT-INDEX.md",
    "QUICKSTART.md",
    "VERIFY.md",
    "modes/prepare.md",
    "modes/conventions.md",
    "scripts/release.mjs",
    "scripts/release-prepare.mjs",
    "scripts/release-sql-profile.mjs",
    "scripts/lib/safe-out.mjs",
    "scripts/lib/freeze/paths.mjs",
    "scripts/lib/freeze/preview.mjs",
    "GLOSSARY.md",
  ]) {
    assert(exists(f), `exists ${f}`);
  }

  const skill = read("SKILL.md") || "";
  assert(skill.includes(PIN), `SKILL pins ${PIN}`);
  assert(/AGENT-INDEX\.md/.test(skill), "SKILL links AGENT-INDEX");

  const index = read("AGENT-INDEX.md") || "";
  assert(index.includes(PIN), `AGENT-INDEX pins ${PIN}`);
  assert(/modes\/README/.test(index), "AGENT-INDEX links modes/README");

  function spawnRelease(argv) {
    return spawnSync(
      process.execPath,
      [path.join(skillRoot, "scripts/release.mjs"), ...argv],
      { cwd: skillRoot, encoding: "utf8" }
    );
  }
  const help = spawnRelease(["--help"]);
  assert(help.status === 0, "release.mjs --help exit 0");
  const helpOut = `${help.stdout || ""}`;
  assert(/prepare/.test(helpOut) && /cancel/.test(helpOut), "help lists prepare/cancel");
  assert(/push-gate|freeze|seal-check/.test(helpOut), "help lists script subcommands");
  assert(/sql-profile/.test(helpOut), "help lists sql-profile");

  const modes = spawnRelease(["modes"]);
  assert(modes.status === 0, "release.mjs modes exit 0");
  assert(/prepare/.test(modes.stdout || ""), "modes lists prepare");
  assert(!/^resume\t/m.test(modes.stdout || ""), "modes excludes resume");

  const resume = spawnRelease(["resume"]);
  assert(resume.status !== 0, "resume subcommand fails");

  assert(exists("scripts/lib/freeze/README.md"), "freeze module map README");

  // guide 双份维护的事实漂移守卫（版本 / 身份 / resume / notes）
  for (const rel of ["guide/使用手册.md", "guide/使用手册.html"]) {
    const text = read(rel) || "";
    assert(text.includes(PIN), `${rel} pins ${PIN}`);
    assert(
      /release-V\{yyMMdd\}/.test(text),
      `${rel} states release-V{yyMMdd} identity`
    );
    assert(!/分支名归一化/.test(text), `${rel} drops branch-slug identity`);
    assert(!/resume/i.test(text), `${rel} has no resume mode`);
    assert(!/计划 0\.4 移除/.test(text), `${rel} notes/ removal is final`);
  }
}
