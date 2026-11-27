/**
 * Mechanical check of Agent-written coverage authenticity records.
 * The script never writes verdicts and never reads prose quality.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { truthsSubdir, loadDomainRegistry } from "./domains.mjs";
import { readTextFile } from "./json-read.mjs";

export function auditRel(domain) {
  return `docs/harness-eng/coverage-audit/${domain}.json`;
}

export function auditAbs(root, domain) {
  return path.join(root, "docs", "harness-eng", "coverage-audit", `${domain}.json`);
}

const UTF8_BOM = [0xef, 0xbb, 0xbf];

function hashBytes(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function isBinary(buf) {
  return buf.includes(0);
}

/** 0.8.13: canonical text bytes — strip UTF-8 BOM, normalize CRLF/CR to LF; binary unchanged. */
function canonicalBytes(buf) {
  if (isBinary(buf)) return buf;
  let body = buf;
  if (
    body.length >= 3 &&
    body[0] === UTF8_BOM[0] &&
    body[1] === UTF8_BOM[1] &&
    body[2] === UTF8_BOM[2]
  ) {
    body = body.subarray(3);
  }
  return Buffer.from(body.toString("utf8").replace(/\r\n?/g, "\n"), "utf8");
}

/** Canonical content hash (line-ending stable). */
export function sha256File(abs) {
  return hashBytes(canonicalBytes(fs.readFileSync(abs)));
}

/**
 * Accepted hashes for one file: canonical + raw bytes + CRLF variant.
 * Legacy audit rows hashed raw bytes on a Windows checkout still match.
 */
export function sha256Candidates(abs) {
  const buf = fs.readFileSync(abs);
  if (isBinary(buf)) return new Set([hashBytes(buf)]);
  const canonical = canonicalBytes(buf);
  const lf = canonical.toString("utf8");
  return new Set([
    hashBytes(buf),
    hashBytes(canonical),
    hashBytes(Buffer.from(lf.replace(/\n/g, "\r\n"), "utf8")),
  ]);
}

export function loadAudit(root, domain) {
  const abs = auditAbs(root, domain);
  const rel = auditRel(domain);
  if (!fs.existsSync(abs)) {
    return { present: false, path: rel, units: [] };
  }
  let json;
  try {
    // 0.8.13: accept UTF-8 BOM / UTF-16 (Windows editors write BOM).
    json = JSON.parse(readTextFile(abs));
  } catch {
    return { present: true, path: rel, units: [], parse_error: true };
  }
  const units = Array.isArray(json?.units) ? json.units : Array.isArray(json) ? json : [];
  return { present: true, path: rel, units };
}

function normRel(p) {
  return String(p || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function normalizeExpectedEvidence(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const out = {};
    for (const row of raw) {
      if (!row) continue;
      const id =
        row.unit_id != null ? String(row.unit_id) : row.id != null ? String(row.id) : "";
      const p = row.evidence_path || row.path;
      if (id && p) out[id] = p;
    }
    return Object.keys(out).length ? out : null;
  }
  if (typeof raw === "object") return raw;
  return null;
}

/**
 * @param {{ root: string, domain: string, unitIds: string[], expectedEvidence?: object }} input
 */
export function validateAudit(input) {
  const { root, domain, unitIds } = input;
  const expectedMap = normalizeExpectedEvidence(input.expectedEvidence);
  const ids = [...new Set((unitIds || []).map((id) => String(id)))];
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
      orphans: [],
      orphan_count: 0,
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
      orphans: [],
      orphan_count: 0,
    };
  }
  const idSet = new Set(ids);
  const orphanSet = new Set();
  for (const row of loaded.units) {
    const oid = row && row.unit_id != null ? String(row.unit_id) : "";
    if (oid && !idSet.has(oid)) orphanSet.add(oid);
  }
  const orphans = [...orphanSet].slice(0, 50);
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
    const expectedRel =
      expectedMap && Object.prototype.hasOwnProperty.call(expectedMap, id)
        ? normRel(expectedMap[id])
        : "";
    if (expectedRel && evidenceRel !== expectedRel) {
      problems.push({
        unit_id: id,
        kind: "evidence",
        expected: expectedRel,
        actual: evidenceRel,
      });
      continue;
    }
    let truthHashes;
    let evidenceHashes;
    try {
      truthHashes = sha256Candidates(truthAbs);
      evidenceHashes = sha256Candidates(evidenceAbs);
    } catch {
      problems.push({ unit_id: id, kind: "path" });
      continue;
    }
    if (
      !truthHashes.has(String(row.truth_sha256 || "")) ||
      !evidenceHashes.has(String(row.evidence_sha256 || ""))
    ) {
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
    orphans,
    orphan_count: orphanSet.size,
  };
}
