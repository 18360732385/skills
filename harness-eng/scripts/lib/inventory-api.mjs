#!/usr/bin/env node
/**
 * fill-inventory-api — Spring Controller → inventory JSON + shards (no npm deps).
 * Alias (0.5.9+): prefer `fill-inventory.mjs --domain api`.
 *
 * Usage:
 *   node scripts/fill-inventory-api.mjs --root <TARGET> [--modules sms-entrance,sms-safe]
 *       [--module sms-entrance] [--all-modules]
 *       [--controller-root <rel>] [--shard-size 80] [--out inv.json]
 *
 * Output JSON:
 * {
 *   ok, root, module, controllerRoot, generatedAt,
 *   endpoints: [{ id, package, controller, http, path, method, bodyType, retType, evidence }],
 *   shards: [{ id, package, count, endpoints: [...] }],
 *   stats: { controllers, endpoints, packages }
 * }
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defaultInventoryPath } from "./inventory-paths.mjs";
import { exitFromReport, pushWarning } from "./exit-codes.mjs";
import { createProgress } from "./progress-log.mjs";

const DEFAULT_EXCLUDE_BASE = ["BaseController", "BaseRestController", "AbstractController"];

function parseArgs(argv) {
  const out = {
    root: null,
    modules: [],
    allModules: false,
    controllerRoot: null,
    shardSize: 80,
    out: null,
    excludeBaseClasses: [...DEFAULT_EXCLUDE_BASE],
    quiet: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--module" || a === "--modules") {
      const vals = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      out.modules.push(...vals);
    } else if (a === "--all-modules") out.allModules = true;
    else if (a === "--controller-root") out.controllerRoot = argv[++i];
    else if (a === "--shard-size") out.shardSize = Number(argv[++i]) || 80;
    else if (a === "--exclude-base-classes") {
      out.excludeBaseClasses = String(argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a === "--out") out.out = argv[++i];
    else if (a === "--quiet") out.quiet = true;
    else if (a === "--help" || a === "-h") {
      out.help = true;
    } else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-inventory-api.mjs --root <TARGET>
      [--modules sms-entrance,sms-safe] [--module sms-entrance] [--all-modules]
      [--controller-root <rel>] [--shard-size 80]
      [--exclude-base-classes BaseController,...] [--out inv.json] [--quiet]

Default --out (when omitted): docs/api/.fill-work/inventory.json
  or docs/api/.fill-work/inventory-<module>.json when a module is set.

--all-modules: expand root pom.xml <module> and scan each (writes per-module inventory).
--modules / --module: comma-separated; --module kept for backward compat.
--quiet: suppress stderr progress.
Modules without @RestController/@Controller are skipped (no ghost endpoints).
Exit: 0 ok · 2 warnings/skips · 1 error
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

function walkJava(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkJava(p, acc);
    else if (/Controller\.java$/i.test(name)) acc.push(p);
  }
  return acc;
}

function lineIsCommented(text, pos) {
  const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
  const line = text.slice(lineStart, pos);
  if (/\/\//.test(line)) return true;
  const before = text.slice(0, pos);
  const lastBlock = before.lastIndexOf("/*");
  const lastEnd = before.lastIndexOf("*/");
  return lastBlock > lastEnd;
}

function parseMappingArgs(args) {
  if (!args) return "";
  const s = args.trim();
  let m = s.match(/(?:value|path)\s*=\s*\{?\s*"([^"]+)"/);
  if (m) return m[1];
  m = s.match(/^"([^"]+)"/);
  return m ? m[1] : "";
}

function joinPath(base, p) {
  if (!p) return base || "/";
  if (p.startsWith("/")) return base ? base.replace(/\/$/, "") + p : p;
  return (base ? base.replace(/\/$/, "") + "/" : "/") + p;
}

function extractClassBase(text, classStart) {
  const pre = text.slice(0, classStart);
  const m = pre.match(/@RequestMapping\s*\(([\s\S]*?)\)\s*$/m) ||
    pre.match(/@RequestMapping\s*\(([\s\S]*?)\)/);
  // last RequestMapping before class
  const all = [...pre.matchAll(/@RequestMapping\s*\(([\s\S]*?)\)/g)];
  if (!all.length) return "";
  return parseMappingArgs(all[all.length - 1][1]);
}

function isConcreteRestController(text, className, excludeBase) {
  if (excludeBase.includes(className)) return false;
  if (/^Base\w*Controller$/i.test(className)) return false;
  if (/\babstract\s+class\s+\w+/i.test(text.slice(0, text.indexOf(className) + className.length + 20)))
    return false;
  // Require class-level @RestController or @Controller (not only RequestMapping)
  const preClass = text.slice(0, text.search(new RegExp(`class\\s+${className}\\b`)));
  const lastChunk = preClass.slice(-800);
  return /@(?:RestController|Controller)\b/.test(lastChunk);
}

function extractEndpointsFromFile(absFile, root, excludeBase = DEFAULT_EXCLUDE_BASE) {
  const text = fs.readFileSync(absFile, "utf8");
  const classDecl = text.match(/public\s+(?:abstract\s+)?class\s+(\w+)/);
  if (!classDecl) return [];
  const cls = classDecl[1];
  if (!isConcreteRestController(text, cls, excludeBase)) return [];
  const classStart = classDecl.index;
  const base = extractClassBase(text, classStart);
  const rel = path.relative(root, absFile).replace(/\\/g, "/");
  // package under controller: parent dirs after /controller/
  let pkg = "";
  const idx = rel.toLowerCase().indexOf("/controller/");
  if (idx >= 0) {
    pkg = path.posix.dirname(rel.slice(idx + "/controller/".length));
    if (pkg === ".") pkg = "(root)";
  } else {
    pkg = path.posix.dirname(rel);
  }

  const mapRe = /@(Get|Post|Put|Delete|Patch)Mapping(?:\(([\s\S]*?)\))?/g;
  const methodRe =
    /(?:public|protected|private)\s+([\w.<>,\s\[\]?]+?)\s+(\w+)\s*\(([\s\S]*?)\)\s*(?:throws\s+[\w.\s,]+)?\s*\{/;

  const rows = [];
  let m;
  while ((m = mapRe.exec(text)) !== null) {
    if (m.index < classStart) continue;
    if (lineIsCommented(text, m.index)) continue;
    const http = m[1].toUpperCase();
    const sub = parseMappingArgs(m[2] || "");
    const window = text.slice(m.index + m[0].length, m.index + m[0].length + 1500);
    const mm = window.match(methodRe);
    if (!mm) continue;
    const between = window.slice(0, mm.index);
    if (/\bclass\b/.test(between)) continue;
    const ret = mm[1].trim();
    const method = mm[2];
    const params = mm[3];
    if (/Controller$/.test(method)) continue;
    let full = joinPath(base, sub);
    if (!full.startsWith("/")) full = "/" + full;
    let bodyType = "";
    const rb = params.match(
      /@RequestBody(?:\([^)]*\))?(?:\s*@[\w]+(?:\([^)]*\))?)*\s+(List\s*<\s*[\w.?]+\s*>|[\w.]+)/
    );
    if (rb) bodyType = rb[1].replace(/\s+/g, "");
    rows.push({
      package: pkg,
      controller: cls,
      http,
      path: full,
      method,
      bodyType,
      retType: ret,
      evidence: `${rel}#${method}`,
    });
  }
  return rows;
}

function guessControllerRoot(root, moduleName) {
  // 0.2.19: expanded controller directory patterns
  const CONTROLLER_DIR_NAMES = ["controller", "controllers", "web", "api", "endpoint", "rest", "restcontroller"];
  if (moduleName) {
    const mod = path.join(root, moduleName);
    const candidates = [
      path.join(mod, "src", "main", "java"),
    ];
    for (const c of candidates) {
      if (!fs.existsSync(c)) continue;
      // find **/controller directories that contain *Controller.java
      const found = [];
      function walk(d, depth) {
        if (depth > 12 || !fs.existsSync(d)) return;
        for (const name of fs.readdirSync(d)) {
          const p = path.join(d, name);
          let st;
          try {
            st = fs.statSync(p);
          } catch {
            continue;
          }
          if (st.isDirectory()) {
            if (CONTROLLER_DIR_NAMES.includes(name.toLowerCase())) {
              const has = fs.readdirSync(p).some((f) => /Controller\.java$/i.test(f)) ||
                walkHasController(p);
              if (has) found.push(p);
            }
            walk(p, depth + 1);
          }
        }
      }
      function walkHasController(d) {
        for (const name of fs.readdirSync(d)) {
          const p = path.join(d, name);
          const st = fs.statSync(p);
          if (st.isFile() && /Controller\.java$/i.test(name)) return true;
          if (st.isDirectory() && walkHasController(p)) return true;
        }
        return false;
      }
      walk(c, 0);
      if (found.length) {
        // prefer longest path ending with webEntrance/controller or similar
        found.sort((a, b) => b.length - a.length);
        return found[0];
      }
      // 0.2.19: fallback — no "controller" dir found, scan entire module src for *Controller.java
      const allJava = walkJava(c);
      if (allJava.length) {
        // return the common parent directory of the first few Controller files
        const sample = allJava[0].replace(/\\/g, "/");
        const idx = sample.toLowerCase().lastIndexOf("/controller/");
        if (idx >= 0) return path.normalize(sample.slice(0, idx + "/controller".length));
        // no "controller" dir — return the module's java root and let extractEndpointsFromFile handle it
        return c;
      }
    }
  }
  // fallback: first controller tree under root
  const javaRoots = [];
  function findJava(d, depth) {
    if (depth > 6 || !fs.existsSync(d)) return;
    for (const name of fs.readdirSync(d)) {
      if (name === "node_modules" || name === ".git" || name === "target") continue;
      const p = path.join(d, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (name === "java" && d.replace(/\\/g, "/").endsWith("src/main")) javaRoots.push(p);
        findJava(p, depth + 1);
      }
    }
  }
  findJava(root, 0);
  for (const jr of javaRoots) {
    const files = walkJava(jr);
    if (files.length) {
      // controller root = common ancestor named controller
      const sample = files[0].replace(/\\/g, "/");
      const i = sample.toLowerCase().lastIndexOf("/controller/");
      if (i >= 0) return path.normalize(sample.slice(0, i + "/controller".length));
      return path.dirname(files[0]);
    }
  }
  return null;
}

function shardEndpoints(endpoints, shardSize) {
  const byPkg = new Map();
  for (const e of endpoints) {
    if (!byPkg.has(e.package)) byPkg.set(e.package, []);
    byPkg.get(e.package).push(e);
  }
  const shards = [];
  let shardIdx = 1;
  let buf = [];
  let bufPkgs = [];

  const flush = () => {
    if (!buf.length) return;
    const id = `shard-${String(shardIdx).padStart(2, "0")}`;
    shards.push({
      id,
      package: bufPkgs.join("+"),
      count: buf.length,
      endpoints: buf,
    });
    shardIdx++;
    buf = [];
    bufPkgs = [];
  };

  const packages = [...byPkg.keys()].sort(
    (a, b) => byPkg.get(b).length - byPkg.get(a).length
  );
  for (const pkg of packages) {
    const list = byPkg.get(pkg);
    if (list.length > shardSize) {
      flush();
      for (let i = 0; i < list.length; i += shardSize) {
        const slice = list.slice(i, i + shardSize);
        const id = `shard-${String(shardIdx).padStart(2, "0")}`;
        shards.push({
          id,
          package: `${pkg}#${Math.floor(i / shardSize) + 1}`,
          count: slice.length,
          endpoints: slice,
        });
        shardIdx++;
      }
      continue;
    }
    if (buf.length + list.length > shardSize) flush();
    buf.push(...list);
    bufPkgs.push(pkg);
  }
  flush();
  return shards;
}

function scanOneModule(
  root,
  moduleName,
  controllerRootArg,
  shardSize,
  outOverride,
  excludeBase = DEFAULT_EXCLUDE_BASE
) {
  let controllerRoot = controllerRootArg
    ? path.resolve(root, controllerRootArg)
    : guessControllerRoot(root, moduleName);
  if (!controllerRoot || !fs.existsSync(controllerRoot)) {
    return {
      ok: true,
      skip: "no controllers",
      module: moduleName,
      endpoints: [],
      shards: [],
      stats: { controllers: 0, endpoints: 0, packages: 0, shards: 0 },
      warning: "Cannot locate controller root / no @RestController",
    };
  }

  const files = walkJava(controllerRoot);
  const endpoints = [];
  let concreteControllers = 0;
  for (const f of files) {
    const before = endpoints.length;
    endpoints.push(...extractEndpointsFromFile(f, root, excludeBase));
    if (endpoints.length > before) concreteControllers++;
    else {
      // Count file as concrete if annotation present even with 0 mappings
      try {
        const text = fs.readFileSync(f, "utf8");
        const classDecl = text.match(/public\s+(?:abstract\s+)?class\s+(\w+)/);
        if (classDecl && isConcreteRestController(text, classDecl[1], excludeBase)) {
          concreteControllers++;
        }
      } catch {
        /* ignore */
      }
    }
  }

  if (!concreteControllers && !endpoints.length) {
    return {
      ok: true,
      skip: "no controllers",
      module: moduleName,
      controllerRoot: path.relative(root, controllerRoot).replace(/\\/g, "/"),
      endpoints: [],
      shards: [],
      stats: { controllers: 0, endpoints: 0, packages: 0, shards: 0 },
      warning: "no @RestController/@Controller (skipped ghost scan)",
    };
  }

  endpoints.forEach((e, i) => {
    e.id = `ep-${String(i + 1).padStart(4, "0")}`;
  });

  const shards = shardEndpoints(endpoints, shardSize);
  const packages = [...new Set(endpoints.map((e) => e.package))];

  const report = {
    ok: true,
    root,
    module: moduleName || null,
    controllerRoot: path.relative(root, controllerRoot).replace(/\\/g, "/"),
    generatedAt: new Date().toISOString().slice(0, 10),
    endpoints,
    shards,
    stats: {
      controllers: concreteControllers || files.length,
      endpoints: endpoints.length,
      packages: packages.length,
      shards: shards.length,
    },
  };

  const outPath = path.resolve(
    outOverride || defaultInventoryPath(root, "api", moduleName || null)
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.error(
    `Wrote ${outPath} module=${moduleName || "-"} endpoints=${report.stats.endpoints} shards=${report.stats.shards}`
  );
  return { ...report, outPath };
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
  if (args.allModules) {
    modules = listMavenModules(root);
    if (!modules.length) {
      throw new Error("--all-modules: no <module> found in root pom.xml");
    }
  }

  if (modules.length > 1 || args.allModules) {
    if (args.out) {
      throw new Error("--out with multiple modules is unsupported; omit --out for per-module files");
    }
    const results = [];
    const warnings = [];
    const progress = createProgress({ quiet: args.quiet, label: "inventory-api" });
    progress.log(`scanning ${modules.length} modules`);
    let i = 0;
    for (const mod of modules) {
      i++;
      progress.step(i, modules.length, mod);
      try {
        const r = scanOneModule(
          root,
          mod,
          null,
          args.shardSize,
          null,
          args.excludeBaseClasses
        );
        if (r.skip || r.warning) {
          warnings.push({ module: mod, skip: r.skip, warning: r.warning });
          console.error(`Skip ${mod}: ${r.skip || r.warning}`);
        }
        results.push({
          module: mod,
          ok: r.ok !== false,
          skip: r.skip,
          endpoints: r.stats?.endpoints || 0,
          outPath: r.outPath,
          error: r.error,
        });
      } catch (e) {
        results.push({ module: mod, ok: false, error: String(e.message || e) });
        warnings.push({ module: mod, warning: String(e.message || e) });
        console.error(`Skip ${mod}: ${e.message || e}`);
      }
    }
    progress.done(`modules=${results.length}`);
    const hardFail = results.some((x) => x.ok === false && !x.skip);
    const summary = {
      ok: !hardFail,
      root,
      mode: "all-modules",
      modules: results,
      warnings,
      stats: {
        modules: results.length,
        ok: results.filter((x) => x.ok && !x.skip).length,
        skipped: results.filter((x) => x.skip).length,
        endpoints: results.reduce((n, x) => n + (x.endpoints || 0), 0),
      },
    };
    console.log(JSON.stringify(summary, null, 2));
    exitFromReport(summary);
    return;
  }

  const moduleName = modules[0] || null;
  const report = scanOneModule(
    root,
    moduleName,
    args.controllerRoot,
    args.shardSize,
    args.out,
    args.excludeBaseClasses
  );
  if (report.skip) {
    pushWarning(report, report.warning || report.skip);
    console.log(JSON.stringify(report, null, 2));
    exitFromReport(report);
    return;
  }
  if (!report.ok) {
    throw new Error(
      report.error ||
        "Cannot locate controller root. Pass --controller-root <rel> (directory containing *Controller.java trees)."
    );
  }
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
