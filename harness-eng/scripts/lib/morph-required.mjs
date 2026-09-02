/**
 * Load morph-required.yaml → { domain: [{ id, kind, re?, test? }] }
 * Named tests resolved by caller via NAMED_TESTS map.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "./yaml.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = path.join(__dirname, "../../templates/_meta/morph-required.yaml");

/**
 * @param {Record<string, (raw: string, policy?: object) => boolean>} namedTests
 * @param {string} [yamlPath]
 */
export function loadMorphRequired(namedTests, yamlPath = DEFAULT_PATH) {
  const raw = fs.readFileSync(yamlPath, "utf8");
  const doc = parseYaml(raw) || {};
  const domains = doc.domains || {};
  const out = {};
  for (const [domain, items] of Object.entries(domains)) {
    if (!Array.isArray(items)) continue;
    out[domain] = items.map((item) => resolveItem(item, namedTests));
  }
  return out;
}

function resolveItem(item, namedTests) {
  const id = item.id;
  if (!id) throw new Error("morph-required item missing id");
  if (item.kind === "re") {
    const flags = item.flags || "";
    return { id, re: new RegExp(String(item.pattern || ""), flags) };
  }
  if (item.kind === "named") {
    const name = item.name || id;
    const fn = namedTests[name];
    if (typeof fn !== "function") {
      throw new Error(`morph-required named test missing: ${name} (domain item ${id})`);
    }
    return { id, test: fn };
  }
  throw new Error(`morph-required unknown kind for ${id}: ${item.kind}`);
}
