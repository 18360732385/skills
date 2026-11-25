/**
 * @layer unit — 纯函数（快）
 */
import path from "path";
import { pathToFileURL } from "url";

export async function runUnit(kit) {
  const { skillRoot, assert } = kit;

  const format = await import(
    pathToFileURL(path.join(skillRoot, "scripts/release-format.mjs")).href
  );
  const paths = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/freeze/paths.mjs")).href
  );
  const preview = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/freeze/preview.mjs")).href
  );
  const catalog = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/freeze/catalog.mjs")).href
  );
  const prior = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/freeze/prior.mjs")).href
  );
  const change = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/freeze/change-objects.mjs")).href
  );
  const safeOut = await import(
    pathToFileURL(path.join(skillRoot, "scripts/lib/safe-out.mjs")).href
  );

  assert(
    format.identityFromReleaseDate("2026-11-26") === "release-V261126",
    "identityFromReleaseDate"
  );
  assert(format.identityFromReleaseDate("bad") === "", "identityFromReleaseDate bad");
  assert(
    format.identityFromBranch("origin/release/V260827") === "release-V260827",
    "identityFromBranch"
  );
  assert(format.shortCommitHash("abcdef012345") === "abcdef01", "shortCommitHash");
  assert(format.COMMIT_DISPLAY_MAX === 5, "COMMIT_DISPLAY_MAX");
  assert(format.stripBom("\uFEFFabc") === "abc", "stripBom");

  const thu = format.recommendedReleaseThursday(
    new Date(Date.UTC(2026, 10, 24, 12))
  );
  assert(thu === "2026-11-26", "recommendedReleaseThursday Tue");

  assert(paths.pathBucket("docs/x.md") === "docs/", "pathBucket docs");
  assert(
    paths.pathBucket("sms-ai/db/migration/V1__a.sql") === "db/migration",
    "pathBucket migration"
  );
  assert(
    paths.excludeReleasePackageFiles(["docs/releases/a/a.md", "src/a.java"]).length === 1,
    "excludeReleasePackageFiles"
  );

  assert(typeof preview.toDraftPreviewMd === "function", "toDraftPreviewMd");
  assert(typeof preview.toFreezeSummary === "function", "toFreezeSummary");
  assert(typeof preview.toAuditFreezeSummary === "function", "toAuditFreezeSummary");
  const summary = preview.toFreezeSummary({
    range: "a..b",
    draft: { sql: [], config: [], jobs: [] },
    draftSuppressed: { sql: [], config: [], jobs: [] },
  });
  assert(/freeze · summary/.test(summary), "toFreezeSummary renders");

  assert(catalog.rankConfidence("path", "docs-hit") === "docs-hit", "rankConfidence");
  assert(typeof catalog.loadJobsCatalog === "function", "loadJobsCatalog");
  assert(typeof prior.scanOverdueNotes === "function", "scanOverdueNotes");
  assert(typeof prior.scanIndexDrift === "function", "scanIndexDrift");
  assert(typeof change.buildArtifactsJson === "function", "buildArtifactsJson");
  assert(typeof change.buildChangeObjects === "function", "buildChangeObjects");
  const art = change.buildArtifactsJson("release-V261126", {
    draft: { sql: [], config: [], jobs: [] },
  });
  assert(art.identity === "release-V261126" && art.version === 1, "buildArtifactsJson shape");

  const resolved = safeOut.resolveSafeOut({
    format: "json",
    out: null,
    forceTemp: true,
    prefix: "unit-test",
  });
  assert(resolved.autoOut && resolved.outPath, "resolveSafeOut forceTemp");
  const resolvedExplicit = safeOut.resolveSafeOut({
    format: "json",
    out: path.join(skillRoot, "scripts/_tmp_unit_out.json"),
  });
  assert(!resolvedExplicit.autoOut && resolvedExplicit.outPath, "resolveSafeOut explicit");
}
