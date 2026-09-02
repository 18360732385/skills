#!/usr/bin/env node
/**
 * release-seal-check — seal 前只读校验发版单
 *
 * Usage:
 *   node release-seal-check.mjs --root <REPO> --note <path> [--force] [--format json|md]
 *
 * 检查：位于 notes/、状态已定版（或 --force）、元信息/发版日期、Git 定版、
 * SQL·配置·任务目标 profile=prod（或显式无）、目录包 artifacts.json SSOT、
 * 索引进行中表有对应行（警告级可缺）。
 * 密文：配置项章 / artifacts.json **允许**含密文，本脚本不做密文拦截。
 * Exit 0=通过（仅 warning 也可 0）；1=有 error
 */
import fs from "fs";
import path from "path";

function parseArgs(argv) {
  const out = {
    root: process.cwd(),
    note: null,
    force: false,
    format: "json",
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = path.resolve(argv[++i] || "");
    else if (a === "--note") out.note = argv[++i];
    else if (a === "--force") out.force = true;
    else if (a === "--format") out.format = argv[++i] || "json";
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function readText(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function section(text, heading) {
  const lines = String(text).split(/\r?\n/);
  const bare = String(heading).replace(/^[一二三四五六七八九十百千]+、\s*/, "");
  const start = lines.findIndex((l) => {
    const t = l.trim();
    if (t === `## ${heading}` || t === `## ${bare}`) return true;
    return new RegExp(`^##\\s+(?:[一二三四五六七八九十百千]+、\\s*)?${bare.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`).test(t);
  });
  if (start < 0) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage:
  node release-seal-check.mjs --root <REPO> --note <path> [--force] [--format json|md]`);
    process.exit(0);
  }
  if (!args.note) {
    console.error("require --note");
    process.exit(1);
  }

  const notePath = path.isAbsolute(args.note) ? args.note : path.join(args.root, args.note);
  const rel = path.relative(args.root, notePath).replace(/\\/g, "/");
  const errors = [];
  const warnings = [];

  const text = readText(notePath);
  if (!text) {
    errors.push(`发版单不存在: ${rel}`);
    emit(args, { ok: false, note: rel, errors, warnings });
    process.exit(1);
  }

  if (!rel.includes("docs/releases/notes/")) {
    errors.push(`seal 源路径须在 docs/releases/notes/，当前: ${rel}`);
  }
  if (rel.includes("docs/releases/archive/")) {
    errors.push("发版单已在 archive/，勿重复 seal");
  }

  // 推荐目录包：notes/{identity}/{identity}.md
  const bundleMatch = rel.match(/^docs\/releases\/notes\/([^/]+)\/([^/]+)\.md$/i);
  const flatMatch = rel.match(/^docs\/releases\/notes\/([^/]+)\.md$/i);
  if (flatMatch && !bundleMatch) {
    warnings.push(
      `发版单仍为扁平路径 notes/${flatMatch[1]}.md；推荐目录包 notes/${flatMatch[1]}/${flatMatch[1]}.md（seal 仍可强制）`
    );
  }
  if (bundleMatch && bundleMatch[1] !== bundleMatch[2]) {
    warnings.push(`目录名 ${bundleMatch[1]} 与 md 名 ${bundleMatch[2]} 不一致`);
  }

  const statusM = text.match(/>\s*状态：\s*([^\n]+)/) || text.match(/\|\s*状态\s*\|\s*([^|]+)\|/);
  const status = statusM ? statusM[1].trim() : "";
  if (!status.includes("已定版")) {
    if (args.force) warnings.push(`状态非「已定版」（${status || "空"}），已 --force`);
    else errors.push(`状态须为「已定版」（当前: ${status || "空"}）；强制 seal 请加 --force`);
  }
  if (status.includes("已上线")) {
    errors.push("状态已是「已上线」，可能已 seal");
  }

  const idM = text.match(/\|\s*版本身份\s*\|\s*([^|]+)\|/) || text.match(/^#\s*发版单[：:]\s*(\S+)/m);
  const identity = idM ? idM[1].trim() : "";
  if (!identity) errors.push("缺少版本身份");

  const dateM = text.match(/\|\s*发版日期\s*\|\s*([^|]+)\|/) || text.match(/>\s*发版日期：\s*(\S+)/);
  if (!dateM || !/\d{4}-\d{2}-\d{2}/.test(dateM[1])) {
    errors.push("缺少有效发版日期（YYYY-MM-DD）");
  }

  const git = section(text, "Git 定版");
  if (!git.trim()) errors.push("缺少「Git 定版」章");
  else {
    if (!git.includes("| hash |") && !git.includes("提交列表")) warnings.push("Git 定版可能缺少提交列表表头");
  }

  // 目录包附属 + artifacts.json SSOT
  if (bundleMatch) {
    if (!/包内附属文件/.test(text) && !/<!-- auto:bundle:/.test(text)) {
      warnings.push("发版单缺少「包内附属文件」章（note-merge 0.3.8+ 应写入）");
    }
    const bundleDir = path.dirname(notePath);
    const artifactsPath = path.join(bundleDir, "artifacts.json");
    let artifacts = null;
    if (!fs.existsSync(artifactsPath)) {
      errors.push("目录包缺少 artifacts.json（发版制品清单 SSOT；请用 note-merge 重写）");
    } else {
      try {
        artifacts = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));
      } catch (e) {
        errors.push(`artifacts.json 无法解析: ${e.message || e}`);
      }
    }
    if (artifacts) {
      const sqlIds = new Set((artifacts.sql || []).map((r) => r.stableId).filter(Boolean));
      const sqlSec = section(text, "数据库与 SQL");
      for (const id of sqlIds) {
        if (sqlSec && !sqlSec.includes(id)) {
          warnings.push(`artifacts.sql 含 ${id} 但 Markdown「数据库与 SQL」未出现该脚本名`);
        }
      }
      for (const m of (sqlSec || "").matchAll(/\b(V\d+__[A-Za-z0-9_.-]+\.sql)\b/gi)) {
        if (sqlIds.size && !sqlIds.has(m[1])) {
          warnings.push(`Markdown 含 ${m[1]} 但 artifacts.json sql[] 无对应 stableId`);
        }
      }
    }
    const bundleSection = section(text, "包内附属文件");
    const claimsFiles = bundleSection && !/\|\s*—\s*\|\s*无\s*\|/.test(bundleSection);
    if (claimsFiles) {
      for (const sub of ["sql", "config", "jobs"]) {
        if (!bundleSection.includes(`| ${sub} |`) && !bundleSection.includes(`|${sub}|`)) continue;
        const subDir = path.join(bundleDir, sub);
        if (!fs.existsSync(subDir)) {
          warnings.push(`正文引用 ${sub}/ 但目录不存在`);
          continue;
        }
        let files = [];
        try {
          files = fs.readdirSync(subDir).filter((f) => !f.startsWith("."));
        } catch {
          files = [];
        }
        if (!files.length) warnings.push(`正文含 ${sub} 附属但 ${sub}/ 为空`);
        if (sub === "jobs" && files.length > 1) {
          warnings.push(`jobs/ 应只放 1 个文件（README.md 上线任务清单），当前 ${files.length} 个`);
        }
        if (sub === "jobs" && files.length && !files.includes("README.md")) {
          warnings.push("jobs/ 缺少 README.md（上线任务清单）");
        }
      }
    }
  }

  for (const [name, heading] of [
    ["数据库与 SQL", "数据库与 SQL"],
    ["配置项", "配置项"],
    ["定时任务", "定时任务"],
  ]) {
    const body = section(text, heading);
    if (!body.trim()) {
      warnings.push(`缺少「${name}」章（可接受若本版无）`);
      continue;
    }
    const hasProd = /prod/i.test(body);
    const isEmpty = /\| — \| 无/.test(body) || /\|\s*无\s*\|/.test(body);
    if (!hasProd && !isEmpty) {
      errors.push(`「${name}」未体现目标 profile=prod`);
    }
  }

  // 索引进行中
  const indexPath = path.join(args.root, "docs", "releases", "releases.md");
  const indexText = readText(indexPath);
  if (indexText && identity) {
    if (!indexText.includes(identity) && !indexText.includes(path.basename(notePath))) {
      warnings.push(`releases.md 进行中表未找到版本身份 ${identity}（seal 前建议有索引行）`);
    }
  } else if (!indexText) {
    warnings.push("缺少 docs/releases/releases.md");
  }

  // 上线日期/执行人 seal 时才填 — 此处若已填则 warning
  if (/\|\s*上线日期\s*\|\s*\d{4}-\d{2}-\d{2}/.test(text)) {
    warnings.push("上线日期似已填写（seal 将覆盖/确认）");
  }

  const ok = errors.length === 0;
  emit(args, { ok, note: rel, identity, status, errors, warnings, force: args.force });
  process.exit(ok ? 0 : 1);
}

function emit(args, data) {
  if (args.format === "md") {
    const lines = [`# seal-check ${data.ok ? "PASS" : "FAIL"}`, ""];
    lines.push(`- note: \`${data.note}\``);
    if (data.identity) lines.push(`- identity: ${data.identity}`);
    if (data.status) lines.push(`- status: ${data.status}`);
    if (data.errors?.length) {
      lines.push("", "## errors");
      for (const e of data.errors) lines.push(`- ${e}`);
    }
    if (data.warnings?.length) {
      lines.push("", "## warnings");
      for (const w of data.warnings) lines.push(`- ${w}`);
    }
    if (!data.errors?.length && !data.warnings?.length) lines.push("", "- （无问题）");
    console.log(lines.join("\n"));
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

main();
