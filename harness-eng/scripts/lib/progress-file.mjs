/**
 * docs/harness-eng/progress.yaml — fill progress state (0.2.15+).
 * Legacy readable: docs/agent-kb/fill-progress.yaml
 */
import fs from "fs";
import path from "path";
import { parse as parseYaml, stringify as stringifyYaml } from "./yaml.mjs";

export const PROGRESS_REL = "docs/harness-eng/progress.yaml";
export const LEGACY_PROGRESS_REL = "docs/agent-kb/fill-progress.yaml";

export function progressPath(root) {
  return path.join(root, PROGRESS_REL);
}

export function readProgress(root) {
  const primary = progressPath(root);
  const legacy = path.join(root, LEGACY_PROGRESS_REL);
  const file = fs.existsSync(primary) ? primary : fs.existsSync(legacy) ? legacy : null;
  if (!file) return null;
  try {
    let raw = fs.readFileSync(file, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    const doc = parseYaml(raw);
    return doc && typeof doc === "object" ? doc : null;
  } catch {
    return null;
  }
}

/**
 * Merge-write progress.yaml (no secrets).
 * @param {string} root
 * @param {object} patch
 */
export function writeProgress(root, patch = {}) {
  const file = progressPath(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const prev = readProgress(root) || {};
  const next = {
    skill: "harness-eng",
    ...prev,
    ...patch,
    updated_at: patch.updated_at || new Date().toISOString(),
  };
  if (patch.shards) next.shards = patch.shards;
  if (patch.last_score_overall != null) next.last_score_overall = patch.last_score_overall;
  const body = stringifyYaml(next);
  fs.writeFileSync(file, body.endsWith("\n") ? body : body + "\n", "utf8");
  return file.replace(/\\/g, "/");
}