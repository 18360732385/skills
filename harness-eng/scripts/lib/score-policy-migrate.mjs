/**
 * 0.7.0: field-level migrate of legacy morph_floor defaults in score-policy.yaml.
 * Does not wipe other keys. Old fingerprints: strict 60 → 75; gold 90 → 95.
 * 0.7.35 FS-9: applyGateProfileToPolicyFile for resume/upgrade gate_profile落盘.
 * 0.8.5: CRLF normalize; gold no-op when unchanged; ensure frontend coverage_targets.
 */
import fs from "fs";
import path from "path";
import { reapplyGateProfile } from "./ai-coding-gate.mjs";
import { knownContractDomainIds } from "./domains.mjs";

/** Normalize CR/CRLF → LF so /^…/m line edits never glue keys. */
export function normalizePolicyNewlines(raw) {
  return String(raw || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
  let raw = normalizePolicyNewlines(fs.readFileSync(p, "utf8"));
  const gp = (raw.match(/^\s*gate_profile:\s*(\w+)\s*$/m) || [])[1] || "strict";
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

/**
 * Set or insert `domain: value` under coverage_targets. Only rewrite when Number differs.
 * @param {string} raw
 * @param {string} domain
 * @param {number} value
 */
function upsertCoverageTarget(raw, domain, value) {
  const esc = escapeRe(domain);
  const lineRe = new RegExp(`^(\\s*${esc}:\\s*)([0-9.]+)(\\s*)$`, "m");
  const m = raw.match(lineRe);
  if (m) {
    if (Number(m[2]) === Number(value)) return raw;
    return raw.replace(lineRe, `$1${value}$3`);
  }
  // Insert after coverage_targets: block header
  if (/^\s*coverage_targets:\s*$/m.test(raw)) {
    return raw.replace(/^(\s*coverage_targets:\s*)$/m, `$1\n  ${domain}: ${value}`);
  }
  // No coverage_targets section — append a minimal block before gate_profile / gate / EOF
  const block = `coverage_targets:\n  ${domain}: ${value}\n`;
  if (/^gate_profile:/m.test(raw)) {
    return raw.replace(/^gate_profile:/m, `${block}gate_profile:`);
  }
  if (/^gate:/m.test(raw)) {
    return raw.replace(/^gate:/m, `${block}gate:`);
  }
  return raw.trimEnd() + "\n" + block;
}

/**
 * 0.7.35 FS-9 / 0.8.5: rewrite gate_profile (+ gold coverage targets) on disk.
 * @param {string} root
 * @param {string} profile strict|gold|legacy
 * @returns {{ changed: boolean, path: string|null, from: string|null, to: string|null }}
 */
export function applyGateProfileToPolicyFile(root, profile) {
  const p = path.join(root, "docs", "harness-eng", "score-policy.yaml");
  const out = { changed: false, path: null, from: null, to: null };
  const next = String(profile || "").trim().toLowerCase();
  if (!next || !["strict", "gold", "legacy"].includes(next)) return out;
  if (!fs.existsSync(p)) {
    out.path = null;
    return out;
  }
  out.path = p;
  const diskRaw = fs.readFileSync(p, "utf8");
  let raw = normalizePolicyNewlines(diskRaw);
  const prevNorm = raw;
  const cur = (raw.match(/^\s*gate_profile:\s*(\w+)\s*$/m) || [])[1] || "strict";
  out.from = cur;
  out.to = next;

  // non-gold same-profile: still normalize CRLF→LF if needed
  if (cur === next && next !== "gold") {
    if (raw !== diskRaw) {
      fs.writeFileSync(p, raw, "utf8");
      out.changed = true;
    }
    return out;
  }

  if (/^\s*gate_profile:\s*\w+\s*$/m.test(raw)) {
    if (cur !== next) {
      raw = raw.replace(/^\s*gate_profile:\s*\w+\s*$/m, `gate_profile: ${next}`);
    }
  } else {
    raw = `gate_profile: ${next}\n` + raw;
  }

  if (next === "gold") {
    const domains = knownContractDomainIds();
    const policyStub = {
      gate_profile: cur,
      coverage_targets: {},
      gate: {},
    };
    for (const d of domains) {
      const m = raw.match(new RegExp(`^\\s*${escapeRe(d)}:\\s*([0-9.]+)\\s*$`, "m"));
      if (m) policyStub.coverage_targets[d] = Number(m[1]);
    }
    const applied = reapplyGateProfile(policyStub, "gold", {});
    const targets = applied.coverage_targets || applyGoldTargetsFallback(domains);
    for (const [d, v] of Object.entries(targets)) {
      if (v == null) continue;
      raw = upsertCoverageTarget(raw, d, v);
    }
    if (/^\s*coverage_mode:\s*\w+\s*$/m.test(raw)) {
      const cm = (raw.match(/^\s*coverage_mode:\s*(\w+)\s*$/m) || [])[1];
      if (cm !== "all_domains") {
        raw = raw.replace(/^\s*coverage_mode:\s*\w+\s*$/m, "coverage_mode: all_domains");
      }
    } else if (!/^\s*coverage_mode:/m.test(raw)) {
      raw = `coverage_mode: all_domains\n` + raw;
    }
  } else if (next === "strict" && cur === "gold") {
    const domains = knownContractDomainIds();
    for (const d of domains) {
      const re = new RegExp(`^(\\s*${escapeRe(d)}:\\s*)1(?:\\.0+)?(\\s*)$`, "m");
      if (re.test(raw)) raw = raw.replace(re, `$10.8$2`);
    }
  }

  if (raw === prevNorm && raw === diskRaw) {
    return out;
  }
  // Write when content changed OR only line endings needed normalize after edits
  if (raw !== diskRaw) {
    fs.writeFileSync(p, raw, "utf8");
    out.changed = true;
  }
  return out;
}

function applyGoldTargetsFallback(domains) {
  const out = {};
  for (const d of domains) out[d] = 1.0;
  return out;
}

/** Detect legacy floors without writing (for fill-score summary warnings). */
export function detectLegacyMorphFloor(root) {
  const p = path.join(root, "docs", "harness-eng", "score-policy.yaml");
  if (!fs.existsSync(p)) return null;
  const raw = normalizePolicyNewlines(fs.readFileSync(p, "utf8"));
  const gp = (raw.match(/^\s*gate_profile:\s*(\w+)\s*$/m) || [])[1] || "strict";
  const mf = raw.match(/morph_floor:\s*([0-9.]+)/);
  if (!mf) return null;
  const floor = Number(mf[1]);
  if (floor === 60 || (gp === "gold" && floor === 90)) {
    return { path: p, gate_profile: gp, morph_floor: floor };
  }
  return null;
}
