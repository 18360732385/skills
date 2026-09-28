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
        out.api.controller_root = String(inv.api.controller_root).replace(/\\/g, "/");
      if (inv.api.module_roots && typeof inv.api.module_roots === "object") {
        out.api.module_roots = {};
        for (const [k, v] of Object.entries(inv.api.module_roots)) {
          if (v != null && String(v).trim())
            out.api.module_roots[String(k).replace(/\\/g, "/")] = String(v).replace(
              /\\/g,
              "/"
            );
        }
      }
    }
    if (inv.db && typeof inv.db === "object") {
      out.db = {};
      if (inv.db.sql_root) out.db.sql_root = String(inv.db.sql_root).replace(/\\/g, "/");
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
      nextApi.controller_root = String(patch.api.controller_root).replace(/\\/g, "/");
    if (patch.api.module_roots && typeof patch.api.module_roots === "object") {
      nextApi.module_roots = {
        ...(nextApi.module_roots || {}),
        ...Object.fromEntries(
          Object.entries(patch.api.module_roots).map(([k, v]) => [
            String(k).replace(/\\/g, "/"),
            String(v).replace(/\\/g, "/"),
          ])
        ),
      };
    }
  }
  const next = {
    api: nextApi,
    db: { ...(existing.db || {}), ...(patch.db || {}) },
  };

  const lines = [];
  lines.push("inventory:");
  const hasApi =
    next.api?.controller_root ||
    (next.api?.module_roots && Object.keys(next.api.module_roots).length);
  if (hasApi) {
    lines.push("  api:");
    if (next.api.controller_root)
      lines.push(`    controller_root: "${next.api.controller_root}"`);
    if (next.api.module_roots && Object.keys(next.api.module_roots).length) {
      lines.push("    module_roots:");
      for (const [k, v] of Object.entries(next.api.module_roots)) {
        lines.push(`      "${k}": "${v}"`);
      }
    }
  }
  if (next.db?.sql_root) {
    lines.push("  db:");
    lines.push(`    sql_root: "${next.db.sql_root}"`);
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
