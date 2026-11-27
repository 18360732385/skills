/**
 * Official coverage-audit unit_id migration by evidence_path.
 * Does not rewrite hashes or verdicts and does not invent rows.
 */
import fs from "fs";
import { loadAudit, auditAbs } from "./coverage-audit.mjs";
import { readTextFile } from "./json-read.mjs";
import { inventoryExpectedEvidence, inventoryUnitIds } from "./coverage-identity.mjs";
import { loadDomainInventory } from "./inventory-paths.mjs";

function normRel(p) {
  return String(p || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * @param {{ root: string, domain: string, write?: boolean, inventory?: object }} input
 */
export function reconcileAudit(input) {
  const { root, domain, write = false, inventory: invArg } = input || {};
  const inv = invArg || loadDomainInventory(root, domain);
  if (!inv) {
    return {
      ok: false,
      domain,
      reason: "no-inventory",
      changes: [],
      missing_inventory: [],
      unmatched_audit: [],
      written: false,
    };
  }
  const expected = inventoryExpectedEvidence(domain, inv);
  const idByPath = new Map();
  for (const [id, p] of Object.entries(expected || {})) {
    const key = normRel(p);
    if (key && !idByPath.has(key)) idByPath.set(key, id);
  }
  const loaded = loadAudit(root, domain);
  if (loaded.parse_error) {
    return {
      ok: false,
      domain,
      reason: "parse",
      changes: [],
      missing_inventory: [],
      unmatched_audit: [],
      written: false,
    };
  }
  if (!loaded.present) {
    return {
      ok: false,
      domain,
      reason: "absent",
      changes: [],
      missing_inventory: inventoryUnitIds(domain, inv).map((id) => ({
        unit_id: id,
        evidence_path: expected[id] || "",
      })),
      unmatched_audit: [],
      written: false,
    };
  }
  const units = loaded.units.map((row) => ({ ...row }));
  const changes = [];
  const unmatched_audit = [];
  const seenPaths = new Set();
  for (const row of units) {
    const ev = normRel(row.evidence_path);
    if (!ev) {
      unmatched_audit.push({ unit_id: row.unit_id, reason: "no-evidence-path" });
      continue;
    }
    const currentId = idByPath.get(ev);
    if (!currentId) {
      unmatched_audit.push({
        unit_id: row.unit_id,
        evidence_path: ev,
        reason: "path-not-in-inventory",
      });
      continue;
    }
    seenPaths.add(ev);
    const from = row.unit_id != null ? String(row.unit_id) : "";
    if (from !== currentId) {
      changes.push({ from_id: from, to_id: currentId, evidence_path: ev });
      row.unit_id = currentId;
    }
  }
  const missing_inventory = [];
  for (const [id, p] of Object.entries(expected || {})) {
    if (!seenPaths.has(normRel(p))) {
      missing_inventory.push({ unit_id: id, evidence_path: normRel(p) });
    }
  }
  let written = false;
  if (write && changes.length) {
    const abs = auditAbs(root, domain);
    let json;
    try {
      json = JSON.parse(readTextFile(abs));
    } catch {
      json = { units };
    }
    if (Array.isArray(json?.units)) json.units = units;
    else if (Array.isArray(json)) json = units;
    else json = { units };
    fs.writeFileSync(abs, JSON.stringify(json, null, 2) + "\n", "utf8");
    written = true;
  }
  return {
    ok: true,
    domain,
    changes,
    missing_inventory,
    unmatched_audit,
    written,
  };
}

export default { reconcileAudit };
