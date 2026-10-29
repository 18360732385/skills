export function run(ctx) {
  const {
    assert, read, exists, skillRoot, PIN, VER_RE,
    path, fs, os, spawnSync,
    isFakeChatTranscriptPlaceholder, isLegalAuthorizedBy,
    RUN_MODE_ENUM, PATH_ENUM, INVOKE_ENUM, HANDOFF_ENUM, REVIEW_ENUM, CHEF_ENUM,
    PROGRESS_TOP_KEYS, ARTIFACT_KEYS, GATE_KEYS,
    validateProgressEnums, validateMonorepoPackages,
    MODES, MODE_EXTRAS, FLAT_SPEC_LEAKS, ROOT_MODE_LEAKS, BINDING_KEYS, TEMPLATES, stageSkillMap,
    FIX_GOOD, FIX_BAD, FIX_SLUG, FIX_ADV, ADV_SLUG, FIX_CLOSE, CLOSE_SLUG,
    FIX_THEATER, THEATER_SLUG, FIX_L2FAIL, L2FAIL_SLUG, FIX_MID, MID_SLUG,
    logCorpusAvailable, changelog, changelogIndex, CHANGELOG_INDEXED, RETAINED_LOGS,
    checkLogs, logRootPresent, logExists, readLog,
  } = ctx;

assert(changelogIndex != null, "CHANGELOG.md exists");
assert(
  /_log\/feature-eng\//.test(changelogIndex || ""),
  "CHANGELOG points to _log/feature-eng/"
);
assert(
  changelogIndex != null && changelogIndex.includes(PIN),
  `CHANGELOG mentions ${PIN}`
);
assert(
  /更早|0\.2\.18-dev|_archive/.test(changelogIndex || ""),
  "CHANGELOG has earlier/_archive pointer"
);
for (const ver of CHANGELOG_INDEXED) {
  assert(
    changelogIndex != null && changelogIndex.includes(`${ver}.md`),
    `CHANGELOG index links ${ver}`
  );
}
if (checkLogs && logRootPresent) {
  for (const ver of RETAINED_LOGS) {
    assert(logExists(ver), `_log/feature-eng retains ${ver}`);
  }
}

}
