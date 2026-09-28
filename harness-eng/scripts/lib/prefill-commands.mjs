/**
 * Prefill AGENTS Commands from package.json / Maven (0.7.25 LT-5).
 */
import fs from "fs";
import path from "path";

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function pkgScripts(root, dirRel) {
  const pkgPath = path.join(root, dirRel || ".", "package.json");
  const pkg = readJson(pkgPath);
  if (!pkg?.scripts || typeof pkg.scripts !== "object") return [];
  const rows = [];
  const prefer = ["test", "lint", "build", "dev", "start", "typecheck"];
  for (const k of prefer) {
    if (pkg.scripts[k]) {
      const prefix = dirRel && dirRel !== "." ? `cd ${dirRel} && ` : "";
      rows.push({ task: k, cmd: `${prefix}npm run ${k}` });
    }
  }
  return rows;
}

function mavenRows(root, dirRel) {
  const pom = path.join(root, dirRel || ".", "pom.xml");
  if (!fs.existsSync(pom)) return [];
  const flag = dirRel && dirRel !== "." ? `-f ${dirRel}/pom.xml` : "";
  return [
    { task: "test", cmd: `mvn ${flag} test`.replace(/\s+/g, " ").trim() },
    {
      task: "run",
      cmd: `mvn ${flag} spring-boot:run`.replace(/\s+/g, " ").trim(),
    },
  ];
}

/**
 * Build markdown table rows for Commands section.
 * @returns {{ rows: { task: string, cmd: string }[], source: string }}
 */
export function collectCommandPrefill(root, { moduleDirs = [] } = {}) {
  const rows = [];
  const seen = new Set();
  const push = (r) => {
    const k = `${r.task}|${r.cmd}`;
    if (seen.has(k)) return;
    seen.add(k);
    rows.push(r);
  };
  for (const r of pkgScripts(root, ".")) push(r);
  for (const r of mavenRows(root, ".")) push(r);
  for (const dir of moduleDirs) {
    const rel = String(dir).replace(/\\/g, "/").replace(/\/$/, "");
    for (const r of pkgScripts(root, rel)) push(r);
    for (const r of mavenRows(root, rel)) push(r);
  }
  return { rows, source: "package.json|pom.xml" };
}

/** Render | Task | Command | rows (no header). */
export function formatCommandsTableRows(rows) {
  return rows.map((r) => `| ${r.task} | \`${r.cmd}\` |`).join("\n");
}

/**
 * Replace TODO Commands rows in AGENTS markdown when seed enabled.
 */
export function applyCommandsPrefill(md, root, opts = {}) {
  const { rows } = collectCommandPrefill(root, opts);
  if (!rows.length) return md;
  const table = formatCommandsTableRows(rows);
  // Replace placeholder TODO command rows under ## Commands
  if (/##\s*Commands[\s\S]*?TODO\(harness-eng\)/i.test(md)) {
    return md.replace(
      /(##\s*Commands[\s\S]*?\|\s*---\|\s*---\s*\|\s*\n)([\s\S]*?)(?=\n##\s+|$)/i,
      (_, head) => `${head}${table}\n\n`
    );
  }
  return md;
}
