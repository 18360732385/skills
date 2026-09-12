#!/usr/bin/env node
/**
 * fill-inventory-func — Service/Component → inventory JSON (no npm deps).
 * Alias (0.5.9+): prefer `fill-inventory.mjs --domain func`.
 *
 * Usage:
 *   node scripts/fill-inventory-func.mjs --root <TARGET>
 *       [--modules a,b] [--module a] [--all-modules] [--out inv.json]
 *
 * Default --out: docs/func/.fill-work/inventory.json
 *   or docs/func/.fill-work/inventory-<module>.json when a single module is set.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defaultInventoryPath } from "./inventory-paths.mjs";
import { exitFromReport, pushWarning } from "./exit-codes.mjs";

function parseArgs(argv) {
  const out = {
    root: null,
    modules: [],
    allModules: false,
    out: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--modules" || a === "--module") {
      const vals = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      out.modules.push(...vals);
    } else if (a === "--all-modules") out.allModules = true;
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-inventory-func.mjs --root <TARGET>
      [--modules sms-entrance,sms-safe] [--module sms-safe]
      [--all-modules] [--out inv.json]

Default --out: docs/func/.fill-work/inventory.json

Scans **/service/**/*.java and *Service(Impl)?.java / *Component.java.
Output: { modules: [{ name, services: [{ class, evidence, methods, annotations }] }], stats }
Exit: 0 ok · 2 warnings · 1 error
`);
}

function listMavenModules(root) {
  const pom = path.join(root, "pom.xml");
  if (!fs.existsSync(pom)) return [];
  const text = fs.readFileSync(pom, "utf8");
  const mods = [];
  const re = /<module>\s*([^<]+)\s*<\/module>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim().replace(/\\/g, "/").split("/").pop();
    if (name) mods.push(name);
  }
  return [...new Set(mods)];
}

function discoverModuleDirs(root) {
  const fromPom = listMavenModules(root);
  if (fromPom.length) return fromPom;
  return fs.readdirSync(root).filter((n) => {
    try {
      return (
        fs.statSync(path.join(root, n)).isDirectory() &&
        fs.existsSync(path.join(root, n, "pom.xml"))
      );
    } catch {
      return false;
    }
  });
}

function walkServices(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === "target" || name === "node_modules" || name === ".git") continue;
    const p = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkServices(p, acc);
    else if (
      /Service(Impl)?\.java$/i.test(name) ||
      /Component\.java$/i.test(name) ||
      (/\/service\//i.test(p.replace(/\\/g, "/")) && /\.java$/i.test(name))
    ) {
      acc.push(p);
    }
  }
  return acc;
}

function parseClass(text, rel) {
  const classM = text.match(
    /(?:@\w+(?:\([^)]*\))?\s*)*public\s+(?:class|interface)\s+(\w+)/
  );
  const cls = classM ? classM[1] : path.basename(rel, ".java");
  const annotations = [];
  for (const a of [
    "Service",
    "Component",
    "Transactional",
    "RestController",
    "Controller",
  ]) {
    if (new RegExp(`@${a}\\b`).test(text)) annotations.push(a);
  }
  const methods = [];
  const re =
    /(?:public|protected)\s+(?!class)([\w.<>,\s\[\]]+)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws[^{;]+)?[{;]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[2];
    if (/^(if|for|while|switch|catch|return|new)$/.test(name)) continue;
    methods.push({
      name,
      ret: m[1].replace(/\s+/g, " ").trim(),
      params: m[3].trim(),
    });
  }
  const deps = [];
  const autowired = [
    ...text.matchAll(
      /@(?:Autowired|Resource|Inject)\s+(?:private\s+|protected\s+)?([\w.<>]+)\s+(\w+)\s*;/g
    ),
  ];
  for (const x of autowired) {
    deps.push({ type: x[1], field: x[2] });
  }
  return { class: cls, evidence: rel, methods, annotations, deps };
}

function scanModule(root, mod) {
  const javaRoot = path.join(root, mod, "src", "main", "java");
  const files = walkServices(javaRoot);
  const services = [];
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    const rel = path.relative(root, f).replace(/\\/g, "/");
    services.push(parseClass(text, rel));
  }
  return {
    name: mod,
    services,
    stats: {
      services: services.length,
      methods: services.reduce((n, s) => n + s.methods.length, 0),
    },
  };
}

function writeInventory(root, moduleName, payload, outOverride) {
  const outPath = path.resolve(
    outOverride || defaultInventoryPath(root, "func", moduleName || null)
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  return outPath;
}

export function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return;
  }
  if (!args.root) {
    printHelp();
    throw new Error("Required: --root <TARGET>");
  }
  const root = path.resolve(args.root);
  if (!fs.existsSync(root)) throw new Error(`root missing: ${root}`);

  let modules = [...new Set(args.modules)];
  if (args.allModules || modules.length === 0) {
    const all = discoverModuleDirs(root);
    modules = args.allModules || modules.length === 0 ? all : modules;
  }
  if (!modules.length) {
    throw new Error("No modules found. Pass --modules or ensure pom.xml <module> exists.");
  }

  const moduleReports = [];
  const warnings = [];
  for (const mod of modules) {
    const m = scanModule(root, mod);
    moduleReports.push(m);
    if (!m.services.length) {
      warnings.push({ module: mod, skip: "no services" });
    }
  }

  const single = modules.length === 1 ? modules[0] : null;
  const report = {
    ok: true,
    root,
    module: single,
    generatedAt: new Date().toISOString().slice(0, 10),
    modules: moduleReports,
    warnings,
    stats: {
      modules: moduleReports.length,
      services: moduleReports.reduce((n, m) => n + m.stats.services, 0),
      methods: moduleReports.reduce((n, m) => n + m.stats.methods, 0),
      empty_modules: warnings.length,
    },
  };
  if (!report.stats.services) pushWarning(report, "no services found");

  // Per-module files when multi; single combined when one module or --out set
  const written = [];
  if (args.out) {
    written.push(writeInventory(root, null, report, args.out));
  } else if (single) {
    written.push(writeInventory(root, single, report, null));
  } else {
    for (const m of moduleReports) {
      const one = {
        ok: true,
        root,
        module: m.name,
        generatedAt: report.generatedAt,
        modules: [m],
        stats: m.stats,
      };
      written.push(writeInventory(root, m.name, one, null));
    }
    // Also write merged inventory.json for fill-truths-auto discovery
    written.push(writeInventory(root, null, report, null));
  }

  console.error(
    `Wrote func inventory modules=${report.stats.modules} services=${report.stats.services} methods=${report.stats.methods}`
  );
  for (const w of written) console.error(`  ${w}`);
  console.log(JSON.stringify(report, null, 2));
  exitFromReport(report);
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (e) {
    console.error(String(e && e.stack ? e.stack : e));
    process.exit(1);
  }
}
