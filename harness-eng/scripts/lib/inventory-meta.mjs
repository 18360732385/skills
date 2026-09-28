/**
 * Persist / read inventory scan roots from harness-meta.yaml (0.7.24+).
 *
 * inventory:
 *   api: { controller_root: "...", module_roots: { "<rel>": "..." } }
 *   db: { sql_root: "..." }
 */
import fs from "fs";
import path from "path";
import { findHarnessMetaFile, canonicalHarnessMetaPath } from "./harness-meta.mjs";
import { parse as parseYaml } from "./yaml.mjs";

/**
 * Strip wrapping quotes and collapse quote-inflation from older writers (NEW-10).
 * e.g. """project""" → project
 */
export function stripWrappingQuotes(s) {
  let out = String(s ?? "");
  // Peel layers of wrapping " or ' until stable
  for (let i = 0; i < 32; i++) {
    const t = out.trim();
    if (
      (t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
      (t.startsWith("'") && t.endsWith("'") && t.length >= 2)
    ) {
      out = t.slice(1, -1);
      continue;
    }
    out = t;
    break;
  }
  return out.replace(/\\/g, "/");
}

/** Safe unquoted YAML key (simple path-ish identifiers). */
function formatYamlKey(k) {
  const s = stripWrappingQuotes(k);
  if (/^[A-Za-z0-9_./-]+$/.test(s)) return s;
  return JSON.stringify(s);
}

function formatYamlString(v) {
  return JSON.stringify(stripWrappingQuotes(v));
}

/**
 * @param {string} root
 * @returns {{ api?: { controller_root?: string, module_roots?: Record<string,string> }, db?: { sql_root?: string } }}
 */
export function readInventoryMeta(root) {
  const found = findHarnessMetaFile(root);
  if (!found) return {};
  try {
    const meta = parseYaml(fs.readFileSync(found.abs, "utf8")) || {};
    const inv = meta.inventory;
    if (!inv || typeof inv !== "object") return {};
    const out = {};
    if (inv.api && typeof inv.api === "object") {
      out.api = {};
      if (inv.api.controller_root)
        out.api.controller_root = stripWrappingQuotes(inv.api.controller_root);
      if (inv.api.module_roots && typeof inv.api.module_roots === "object") {
        out.api.module_roots = {};
        for (const [k, v] of Object.entries(inv.api.module_roots)) {
          if (v != null && String(v).trim())
            out.api.module_roots[stripWrappingQuotes(k)] = stripWrappingQuotes(v);
        }
      }
    }
    if (inv.db && typeof inv.db === "object") {
      out.db = {};
      if (inv.db.sql_root) out.db.sql_root = stripWrappingQuotes(inv.db.sql_root);
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Merge inventory roots into harness-meta.yaml (preserve rest of file as much as possible).
 * @param {string} root
 * @param {{ api?: { controller_root?: string, module_roots?: Record<string,string> }, db?: { sql_root?: string } }} patch
 */
export function writeInventoryMeta(root, patch) {
  if (!patch || (!patch.api && !patch.db)) return;
  const found = findHarnessMetaFile(root);
  const dest = found || canonicalHarnessMetaPath(root);
  if (!fs.existsSync(dest.abs)) return;

  let raw = fs.readFileSync(dest.abs, "utf8");
  const existing = readInventoryMeta(root);
  const nextApi = { ...(existing.api || {}) };
  if (patch.api) {
    if (patch.api.controller_root != null)
      nextApi.controller_root = stripWrappingQuotes(patch.api.controller_root);
    if (patch.api.module_roots && typeof patch.api.module_roots === "object") {
      nextApi.module_roots = {
        ...(nextApi.module_roots || {}),
        ...Object.fromEntries(
          Object.entries(patch.api.module_roots).map(([k, v]) => [
            stripWrappingQuotes(k),
            stripWrappingQuotes(v),
          ])
        ),
      };
    }
  }
  const next = {
    api: nextApi,
    db: {
      ...(existing.db || {}),
      ...(patch.db
        ? Object.fromEntries(
            Object.entries(patch.db).map(([k, v]) => [
              k,
              v == null ? v : stripWrappingQuotes(v),
            ])
          )
        : {}),
    },
  };

  const lines = [];
  lines.push("inventory:");
  const hasApi =
    next.api?.controller_root ||
    (next.api?.module_roots && Object.keys(next.api.module_roots).length);
  if (hasApi) {
    lines.push("  api:");
    if (next.api.controller_root)
      lines.push(`    controller_root: ${formatYamlString(next.api.controller_root)}`);
    if (next.api.module_roots && Object.keys(next.api.module_roots).length) {
      lines.push("    module_roots:");
      for (const [k, v] of Object.entries(next.api.module_roots)) {
        // 0.7.30 NEW-10: do not quote safe keys (avoids quote inflation with legacy yaml key parse)
        lines.push(`      ${formatYamlKey(k)}: ${formatYamlString(v)}`);
      }
    }
  }
  if (next.db?.sql_root) {
    lines.push("  db:");
    lines.push(`    sql_root: ${formatYamlString(next.db.sql_root)}`);
  }
  if (lines.length <= 1) return;

  const block = lines.join("\n") + "\n";
  if (/^inventory:\s*$/m.test(raw) || /^inventory:\s*\n/m.test(raw)) {
    // Replace existing inventory: … until next top-level key
    raw = raw.replace(/^inventory:\s*\n(?:[ \t]+.*\n)*/m, block);
  } else {
    // Append before trailing newline or at end
    raw = raw.replace(/\s*$/, "\n") + block;
  }
  fs.writeFileSync(dest.abs, raw, "utf8");
}

/**
 * Relativize an absolute path under root for meta storage.
 * @param {string} root
 * @param {string} absOrRel
 */
export function toRootRelative(root, absOrRel) {
  if (!absOrRel) return null;
  const abs = path.isAbsolute(absOrRel) ? absOrRel : path.resolve(root, absOrRel);
  let rel = path.relative(root, abs).replace(/\\/g, "/");
  if (!rel || rel.startsWith("..")) return absOrRel.replace(/\\/g, "/");
  return rel;
}

/**
 * 0.7.26 FC-10: write fill_mcp_profile into harness-meta.yaml.
 * @param {string} root
 * @param {string} profile
 */
export function writeFillMcpProfile(root, profile) {
  if (!profile) return;
  const found = findHarnessMetaFile(root);
  const dest = found || canonicalHarnessMetaPath(root);
  if (!fs.existsSync(dest.abs)) return;
  let raw = fs.readFileSync(dest.abs, "utf8");
  const line = `fill_mcp_profile: ${JSON.stringify(String(profile))}`;
  if (/^fill_mcp_profile:\s*/m.test(raw)) {
    raw = raw.replace(/^fill_mcp_profile:\s*.*$/m, line);
  } else {
    raw = raw.replace(/\s*$/, "\n") + line + "\n";
  }
  fs.writeFileSync(dest.abs, raw, "utf8");
}
