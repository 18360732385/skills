/**
 * Mechanical check of Agent-written coverage authenticity records.
 * The script never writes verdicts and never reads prose quality.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { truthsSubdir, loadDomainRegistry } from "./domains.mjs";

export function auditRel(domain) {
  return `docs/harness-eng/coverage-audit/${domain}.json`;
}

export function auditAbs(root, domain) {
  return path.join(root, "docs", "harness-eng", "coverage-audit", `${domain}.json`);
}

export function sha256File(abs) {
  const buf = fs.readFileSync(abs);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function loadAudit(root, domain) {
  const abs = auditAbs(root, domain);
  const rel = auditRel(domain);
  if (!fs.existsSync(abs)) {
    return { present: false, path: rel, units: [] };
  }
  let json;
  try {
    json = JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch {
    return { present: true, path: rel, units: [], parse_error: true };
  }
  const units = Array.isArray(json?.units) ? json.units : Array.isArray(json) ? json : [];
  return { present: true, path: rel, units };
}

function normRel(p) {
  return String(p || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * @param {{ root: string, domain: string, unitIds: string[] }} input
 */
export function validateAudit(input) {
  const { root, domain, unitIds } = input;
  const ids = (unitIds || []).map((id) => String(id));
  const loaded = loadAudit(root, domain);
  const total = ids.length;
  if (loaded.parse_error) {
    return {
      ok: false,
      pass: 0,
      total,
      present: true,
      reason: "parse",
      problems: [{ kind: "parse" }],
    };
  }
  if (!loaded.present) {
    return {
      ok: false,
      pass: 0,
      total,
      present: false,
      reason: "absent",
      problems: ids.map((id) => ({ unit_id: id, kind: "missing" })),
    };
  }
  const grouped = new Map();
  for (const row of loaded.units) {
    const id = row && row.unit_id != null ? String(row.unit_id) : "";
    if (!id || !ids.includes(id)) continue;
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id).push(row);
  }
  const truthsRel = `docs/${domain}/${truthsSubdir(domain, loadDomainRegistry())}/`;
  const problems = [];
  let pass = 0;
  for (const id of ids) {
    const rows = grouped.get(id) || [];
    if (rows.length === 0) {
      problems.push({ unit_id: id, kind: "missing" });
      continue;
    }
    if (rows.length > 1) {
      problems.push({ unit_id: id, kind: "dup" });
      continue;
    }
    const row = rows[0];
    if (row.verdict !== "pass") {
      problems.push({ unit_id: id, kind: "fail" });
      continue;
    }
    if (!String(row.reason || "").trim()) {
      problems.push({ unit_id: id, kind: "reason" });
      continue;
    }
    const truthRel = normRel(row.truth_path);
    const evidenceRel = normRel(row.evidence_path);
    if (!truthRel.startsWith(truthsRel) || truthRel.includes("/.fill-work/")) {
      problems.push({ unit_id: id, kind: "truth", expected: truthsRel });
      continue;
    }
    const truthAbs = path.join(root, truthRel);
    const evidenceAbs = path.join(root, evidenceRel);
    if (!evidenceRel || !fs.existsSync(truthAbs) || !fs.existsSync(evidenceAbs)) {
      problems.push({ unit_id: id, kind: "path" });
      continue;
    }
    let truthHash = "";
    let evidenceHash = "";
    try {
      truthHash = sha256File(truthAbs);
      evidenceHash = sha256File(evidenceAbs);
    } catch {
      problems.push({ unit_id: id, kind: "path" });
      continue;
    }
    if (row.truth_sha256 !== truthHash || row.evidence_sha256 !== evidenceHash) {
      problems.push({ unit_id: id, kind: "stale" });
      continue;
    }
    pass++;
  }
  const kinds = [...new Set(problems.map((p) => p.kind))];
  const expected = problems.find((p) => p.kind === "truth" && p.expected)?.expected;
  let reason = kinds.join(",") || "ok";
  if (expected) reason += `(${expected})`;
  return {
    ok: problems.length === 0,
    pass,
    total,
    present: true,
    reason,
    problems,
  };
}
