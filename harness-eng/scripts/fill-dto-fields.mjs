#!/usr/bin/env node
/**
 * fill-dto-fields — Java class fields → markdown table (no npm deps).
 *
 * Usage:
 *   node scripts/fill-dto-fields.mjs --file path/to/Foo.java
 *   node scripts/fill-dto-fields.mjs --class Foo --source-root <repo>/src/main/java
 *   node scripts/fill-dto-fields.mjs --help
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function parseArgs(argv) {
  const out = { file: null, className: null, sourceRoot: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file") out.file = argv[++i];
    else if (a === "--class") out.className = argv[++i];
    else if (a === "--source-root") out.sourceRoot = argv[++i];
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-dto-fields.mjs --file path/to/Foo.java
  node scripts/fill-dto-fields.mjs --class FooReq --source-root <java-root>

Prints a markdown field table. Does not invent fields not present in source.
`);
}

export function findClassFile(sourceRoot, className) {
  const root = path.resolve(sourceRoot);
  const needle = className.endsWith(".java") ? className : `${className}.java`;
  const hits = [];
  function walk(d, depth) {
    if (depth > 20 || !fs.existsSync(d)) return;
    for (const name of fs.readdirSync(d)) {
      if (name === "target" || name === "node_modules" || name === ".git") continue;
      const p = path.join(d, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(p, depth + 1);
      else if (name === needle) hits.push(p);
    }
  }
  walk(root, 0);
  if (!hits.length) throw new Error(`class file not found: ${needle} under ${root}`);
  return hits[0];
}

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

export function parseFields(javaSrc) {
  const text = stripComments(javaSrc);
  // naive: fields inside class body
  const fields = [];
  const fieldRe =
    /(?:^|\n)\s*((?:@\w+(?:\([^)]*\))?\s*)*)(private|protected|public)\s+(?:static\s+)?(?:final\s+)?([\w.<>,\s\[\]]+)\s+(\w+)\s*(?:=|;)/g;
  let m;
  while ((m = fieldRe.exec(text)) !== null) {
    const ann = m[1] || "";
    const typ = m[3].replace(/\s+/g, " ").trim();
    const name = m[4];
    if (name === "serialVersionUID") continue;
    let required = /@NotNull|@NotBlank|@NotEmpty|@Valid/.test(ann) ? "是" : "否";
    let note = "";
    const api = ann.match(/@ApiModelProperty\s*\(\s*(?:value\s*=\s*)?"([^"]+)"/);
    if (api) note = api[1];
    const sch = ann.match(/@Schema\s*\(\s*(?:description\s*=\s*)?"([^"]+)"/);
    if (sch) note = note || sch[1];
    fields.push({ name, type: typ, required, note });
  }
  return fields;
}

export function toMarkdown(className, fileRel, fields) {
  const lines = [];
  lines.push(`<!-- fill-dto-fields: ${className} evidence: ${fileRel} -->`);
  lines.push("");
  lines.push("| 参数名 | 类型 | 必填 | 说明 |");
  lines.push("|---|---|---|---|");
  if (!fields.length) {
    lines.push("| — | — | — | TODO(harness-eng): 未解析到字段，见 evidence |");
  } else {
    for (const f of fields) {
      lines.push(`| ${f.name} | ${f.type} | ${f.required} | ${f.note || ""} |`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }
  let file = args.file ? path.resolve(args.file) : null;
  if (!file) {
    if (!args.className || !args.sourceRoot) {
      printHelp();
      throw new Error("Need --file or (--class and --source-root)");
    }
    file = findClassFile(args.sourceRoot, args.className);
  }
  if (!fs.existsSync(file)) throw new Error(`missing: ${file}`);
  const src = fs.readFileSync(file, "utf8");
  const base = path.basename(file, ".java");
  const fields = parseFields(src);
  const md = toMarkdown(base, file.replace(/\\/g, "/"), fields);
  console.log(md);
  console.error(`fields=${fields.length} file=${file}`);
}

try {
  const isMain =
    process.argv[1] &&
    path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
  if (isMain) main();
} catch (e) {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
}
