/**
 * 0.7.0: field-level migrate of legacy morph_floor defaults in score-policy.yaml.
 * Does not wipe other keys. Old fingerprints: strict 60 → 75; gold 90 → 95.
 */
import fs from "fs";
import path from "path";

/**
 * @param {string} root target repo root
 * @returns {{ changed: boolean, path: string|null, migrations: string[], warnings: string[] }}
 */
export function migrateScorePolicyFile(root) {
  const p = path.join(root, "docs", "harness-eng", "score-policy.yaml");
  const out = { changed: false, path: null, migrations: [], warnings: [] };
  if (!fs.existsSync(p)) {
    out.warnings.push("no score-policy.yaml");
    return out;
  }
  out.path = p;
  let raw = fs.readFileSync(p, "utf8");
  const gp = (raw.match(/^\s*gate_profile:\s*(\w+)/m) || [])[1] || "strict";
  const mf = raw.match(/morph_floor:\s*([0-9.]+|null)/);
  if (!mf || mf[1] === "null") {
    out.warnings.push("morph_floor absent or null (runtime defaults apply)");
    return out;
  }
  const floor = Number(mf[1]);
  let next = null;
  if (gp === "gold" && floor === 90) next = 95;
  else if (floor === 60) next = 75;
  if (next == null) {
    if (floor < 75 && gp !== "legacy") {
      out.warnings.push(
        `morph_floor=${floor} below 0.7 strict default 75; history scores not comparable (morph_scale 0.7)`
      );
    }
    return out;
  }
  raw = raw.replace(/morph_floor:\s*[0-9.]+/, `morph_floor: ${next}`);
  // bump comment hints if present
  raw = raw.replace(/形态≥60/g, "形态≥75").replace(/形态≥90/g, "形态≥95");
  raw = raw.replace(/morph_floor:\s*60/g, `morph_floor: ${next}`);
  fs.writeFileSync(p, raw, "utf8");
  out.changed = true;
  out.migrations.push(`morph_floor ${floor}→${next} (gate_profile=${gp})`);
  out.warnings.push(
    "形态尺度 0.7：score-history 旧点不可比；见 report morph_scale"
  );
  return out;
}

/** Detect legacy floors without writing (for fill-score summary warnings). */
export function detectLegacyMorphFloor(root) {
  const p = path.join(root, "docs", "harness-eng", "score-policy.yaml");
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8");
  const gp = (raw.match(/^\s*gate_profile:\s*(\w+)/m) || [])[1] || "strict";
  const mf = raw.match(/morph_floor:\s*([0-9.]+)/);
  if (!mf) return null;
  const floor = Number(mf[1]);
  if (floor === 60 || (gp === "gold" && floor === 90)) {
    return { path: p, gate_profile: gp, morph_floor: floor };
  }
  return null;
}
