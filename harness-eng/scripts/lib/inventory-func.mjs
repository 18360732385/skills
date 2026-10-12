#!/usr/bin/env node
/**
 * fill-inventory-func — Service/Component → inventory JSON (no npm deps).
 *
 * Usage:
 *   node scripts/fill-inventory.mjs --domain func --root <TARGET>
 *       [--modules a,b] [--module a] [--all-modules] [--out inv.json]
 *
 * Default --out: docs/func/.fill-work/inventory.json
 *   or docs/func/.fill-work/inventory-<module>.json when a single module is set.
 */
import fs from "fs";
import path from "path";
import { isCliMain } from "./cli-main.mjs";
import { resolveInventoryOutPath } from "./inventory-paths.mjs";
import { exitFromReport, pushWarning } from "./exit-codes.mjs";
import { writeInventoryMeta, toRootRelative } from "./inventory-meta.mjs";
import { stampInventoryGitHead } from "./git-head.mjs";

function parseArgs(argv) {
  const out = {
    root: null,
    modules: [],
    allModules: false,
    out: null,
    help: false,
    noWrite: false,
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
    else if (a === "--no-write") out.noWrite = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-inventory.mjs --domain func --root <TARGET>
      [--modules sms-entrance,sms-safe] [--module sms-safe]
      [--all-modules] [--out inv.json]

Default --out: docs/func/.fill-work/inventory.json

Scans *Service(Impl)?.java / *Component.java (excludes entity/mapper/job/properties paths).
Output: { modules: [{ name, services: [{ class, evidence, methods, annotations }] }], stats }
Exit: 0 ok · 2 warnings · 1 error
`);
}

/** Read `<module>` paths from a pom.xml; keep relative paths (no basename pop). */
function listMavenModulesFromPom(pomPath) {
  if (!fs.existsSync(pomPath)) return [];
  const text = fs.readFileSync(pomPath, "utf8");
  const mods = [];
  const re = /<module>\s*([^<]+)\s*<\/module>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim().replace(/\\/g, "/").replace(/\/$/, "");
    if (name && !name.includes("..")) mods.push(name);
  }
  return [...new Set(mods)];
}

function listMavenModules(root) {
  return listMavenModulesFromPom(path.join(root, "pom.xml"));
}

/**
 * Discover Maven module dirs relative to repo root.
 * 0.7.33: nested reactor (e.g. backend/pom.xml with &lt;module&gt;order-service&lt;/module&gt;)
 * → backend/order-service when repo root has no aggregator pom.
 */
function discoverModuleDirs(root) {
  const fromRoot = listMavenModules(root);
  if (fromRoot.length) return fromRoot;

  const nested = [];
  let entries = [];
  try {
    entries = fs.readdirSync(root);
  } catch {
    return [];
  }
  for (const n of entries) {
    if (n === "target" || n === "node_modules" || n === ".git") continue;
    const sub = path.join(root, n);
    let st;
    try {
      st = fs.statSync(sub);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    const subPom = path.join(sub, "pom.xml");
    if (!fs.existsSync(subPom)) continue;
    const childMods = listMavenModulesFromPom(subPom);
    if (childMods.length) {
      for (const m of childMods) {
        nested.push(`${n}/${m}`.replace(/\\/g, "/"));
      }
    } else {
      nested.push(n);
    }
  }
  return [...new Set(nested)];
}

/**
 * 0.7.37 FS-func-noise: do not treat every .java under /service/ as a service
 * (entity/mapper/job under …/service/entity would inflate coverage).
 * Keep *Service(Impl)?.java / *Component.java; drop entity|mapper|job|properties paths.
 */
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
    else if (/\.java$/i.test(name)) {
      const norm = p.replace(/\\/g, "/");
      if (/\/(entity|mapper|job|jobs|properties)\//i.test(norm)) continue;
      if (/Service(Impl)?\.java$/i.test(name) || /Component\.java$/i.test(name)) {
        acc.push(p);
      }
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
  // 0.7.32 FC-6: walk discovery order — do not alpha-sort services
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
  const outPath = resolveInventoryOutPath(
    root,
    outOverride,
    "func",
    moduleName || null
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
    root: ".",
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
  stampInventoryGitHead(report, root);
  if (!report.stats.services) pushWarning(report, "no services found");

  // Per-module files when multi; single combined when one module or --out set
  const written = [];
  if (!args.noWrite) {
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
  }

  if (!args.noWrite && modules.length) {
    try {
      const relMods = modules.map((m) => toRootRelative(root, m) || m);
      writeInventoryMeta(root, { func: { modules: relMods } });
    } catch {
      /* meta optional */
    }
  }

  console.error(
    args.noWrite
      ? `[inventory-func] --no-write modules=${report.stats.modules} services=${report.stats.services}`
      : `Wrote func inventory modules=${report.stats.modules} services=${report.stats.services} methods=${report.stats.methods}`
  );
  for (const w of written) console.error(`  ${w}`);
  console.log(JSON.stringify(report, null, 2));
  exitFromReport(report);
}

if (isCliMain(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(String(e && e.stack ? e.stack : e));
    process.exit(1);
  }
}
