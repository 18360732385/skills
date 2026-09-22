/**
 * Shared acceptance JSON spawn + warning_shards grouping (0.6.8-dev P2).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { detectDomainFromPath, defaultContractDomains } from "./domains.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ACCEPTANCE = path.join(__dirname, "..", "acceptance-check.mjs");

/**
 * @param {string} root
 * @param {{ domain?: string, gold?: boolean, workDir?: string }} [opts]
 * @returns {{ ok: boolean, blockers: object[], warnings: object[], gold_pass_ratio: number|null, status: number|null, raw?: object }}
 */
export function runAcceptanceJson(root, opts = {}) {
  const argv = [ACCEPTANCE];
  if (opts.workDir) {
    argv.push("--work-dir", opts.workDir);
  } else {
    argv.push("--root", path.resolve(root));
    if (opts.domain) argv.push("--domain", opts.domain);
  }
  if (opts.gold) argv.push("--gold");
  const r = spawnSync(process.execPath, argv, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const stdout = r.stdout || "";
  try {
    const i = stdout.indexOf("{");
    const j = stdout.lastIndexOf("}");
    if (i >= 0 && j > i) {
      const parsed = JSON.parse(stdout.slice(i, j + 1));
      return {
        ok: !!parsed.ok,
        blockers: Array.isArray(parsed.blockers) ? parsed.blockers : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        gold_pass_ratio: parsed.gold_pass_ratio ?? null,
        status: r.status == null ? 1 : r.status,
        raw: parsed,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    ok: false,
    blockers: [],
    warnings: [],
    gold_pass_ratio: null,
    status: r.status == null ? 1 : r.status,
  };
}

/**
 * Group acceptance warnings (and optional blockers) into shard-like residual items.
 * @param {object[]} items
 * @param {string} [root]
 * @param {number} [limit]
 */
export function shardsFromAcceptanceItems(items, root, limit = 24) {
  const byFile = new Map();
  for (const it of items || []) {
    const fileAbs = it.file || "(unknown)";
    let rel = fileAbs;
    if (root && fileAbs.startsWith(root)) {
      rel = path.relative(root, fileAbs).replace(/\\/g, "/");
    } else {
      rel = String(fileAbs).replace(/\\/g, "/");
    }
    if (!byFile.has(rel)) {
      byFile.set(rel, {
        id: rel,
        file: rel,
        domain: detectDomainFromPath(rel) || null,
        issue_ids: [],
        details: [],
      });
    }
    const row = byFile.get(rel);
    if (it.id && !row.issue_ids.includes(it.id)) row.issue_ids.push(it.id);
    const detail = it.detail || it.issue || it.title || it.id || "";
    if (detail && row.details.length < 6) row.details.push(String(detail).slice(0, 160));
  }
  return [...byFile.values()].slice(0, limit);
}

/**
 * Residual cleanup scan: acceptance across plan domains (or default contract domains).
 * @param {string} root
 * @param {{ domains?: string[], gold?: boolean }} [opts]
 */
export function collectResidual(root, opts = {}) {
  const domains = opts.domains?.length ? opts.domains : defaultContractDomains();
  const blockers = [];
  const warnings = [];
  const byDomain = {};
  for (const d of domains) {
    const r = runAcceptanceJson(root, { domain: d, gold: !!opts.gold });
    byDomain[d] = {
      status: r.status,
      blockers: r.blockers.length,
      warnings: r.warnings.length,
      gold_pass_ratio: r.gold_pass_ratio,
    };
    blockers.push(...r.blockers);
    warnings.push(...r.warnings);
  }
  return {
    domains,
    gold: !!opts.gold,
    by_domain: byDomain,
    blockers_n: blockers.length,
    warnings_n: warnings.length,
    warning_shards: shardsFromAcceptanceItems(warnings, root),
    blocker_shards: shardsFromAcceptanceItems(blockers, root),
  };
}
