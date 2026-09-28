/**
 * Shared domain merge logic for fill-merge-db/redis/func (0.2.19+).
 * Extracted from fill-merge-api.mjs pattern, generalized for all 4 domains.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { domainLabel as registryDomainLabel } from "./domains.mjs";

/** Walk directory for .md files recursively. */
export function walkMd(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkMd(p, acc);
    else if (/\.md$/i.test(name)) acc.push(p);
  }
  return acc;
}

/** Extract evidence from a markdown section body（半角/全角冒号均认，对齐 acceptance-check）。 */
export function extractEvidence(body) {
  if (!body) return null;
  const m =
    body.match(/\*\*evidence[:：]\*\*\s*`([^`]+)`/i) ||
    body.match(/\*\*evidence[:：]\*\*\s*(\S+)/i) ||
    body.match(/evidence[:：]\s*`([^`]+)`/i) ||
    body.match(/evidence[:：]\s*(\S+\.java#\w+)/i) ||
    body.match(/evidence[:：]\s*(\S+\.java)/i);
  return m ? m[1].trim() : null;
}

/** Normalize evidence path to forward slashes. */
export function normalizeEvidence(ev) {
  if (!ev) return "";
  return ev.replace(/\\/g, "/");
}

/** Split fragment into sections keyed by evidence. */
export function parseFragmentSections(text, sourcePath) {
  const sections = [];
  const re = /^##\s+\d+\.\s+.+$/gm;
  const matches = [...text.matchAll(re)];
  if (!matches.length) {
    const ev = extractEvidence(text);
    if (ev) sections.push({ evidence: ev, body: text.trim(), source: sourcePath });
    return sections;
  }
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const body = text.slice(start, end).trim();
    const ev = extractEvidence(body);
    if (!ev) {
      sections.push({ evidence: null, body, source: sourcePath, warn: "no-evidence" });
    } else {
      sections.push({ evidence: ev, body, source: sourcePath });
    }
  }
  return sections;
}

/** Run acceptance-check for a domain. */
export function runAcceptance(workDir, domain, gold, scriptsDir) {
  const script = path.join(scriptsDir, "acceptance-check.mjs");
  const argv = [script, "--work-dir", workDir, "--domain", domain];
  if (gold) argv.push("--gold");
  const r = spawnSync(process.execPath, argv, { encoding: "utf8" });
  const stdout = r.stdout || "";
  let parsed = null;
  try {
    const i = stdout.indexOf("{");
    const j = stdout.lastIndexOf("}");
    if (i >= 0 && j > i) parsed = JSON.parse(stdout.slice(i, j + 1));
  } catch {
    /* ignore */
  }
  return {
    status: r.status == null ? 1 : r.status,
    stderr: r.stderr || "",
    report: parsed,
  };
}

/**
 * Extract evidence list from inventory based on domain.
 * Returns array of { evidence, label } for all items in the inventory.
 */
export function extractInventoryEvidence(inv, domain) {
  const out = [];
  if (domain === "api" && Array.isArray(inv.endpoints)) {
    for (const ep of inv.endpoints) {
      out.push({ evidence: ep.evidence, label: ep.path || ep.method || ep.evidence });
    }
  } else if (domain === "db" && Array.isArray(inv.tables)) {
    for (const t of inv.tables) {
      out.push({ evidence: t.evidence || t.entity || t.tableName || t.name, label: t.tableName || t.name || t.entity });
    }
  } else if (domain === "redis" && Array.isArray(inv.keys)) {
    for (const k of inv.keys) {
      out.push({ evidence: k.evidence || k.pattern || k.prefix, label: k.pattern || k.prefix || k.evidence });
    }
  } else if (domain === "func" && Array.isArray(inv.modules)) {
    for (const mod of inv.modules) {
      const services = mod.services || [];
      for (const svc of services) {
        out.push({ evidence: svc.evidence || svc.className || svc.name, label: svc.className || svc.name || svc.evidence });
      }
    }
  } else if (domain === "func" && Array.isArray(inv.services)) {
    for (const svc of inv.services) {
      out.push({ evidence: svc.evidence || svc.className || svc.name, label: svc.className || svc.name || svc.evidence });
    }
  } else if (domain === "jobs" && Array.isArray(inv.tasks)) {
    for (const t of inv.tasks) {
      out.push({
        evidence: t.evidence || t.task_code || t.id,
        label: t.task_code || t.slug || t.id,
      });
    }
  }
  return out;
}

/** Build default header for a domain. */
export function defaultHeader(inv, domain, count) {
  const label = registryDomainLabel(domain);
  const mod = inv.module || "module";
  return `# ${mod} ${label} Truth

> **真相文档（SSOT）**（fill-merge-${domain} 合并）。
> **累计条目数**：${count}

## 变更记录

| 版本 | 类型 | 内容 | 操作人 | 更新时间 |
|---|---|---|---|---|
| v0.1 | 合并 | fill-merge-${domain} from .fill-work | harness-eng | ${new Date().toISOString().slice(0, 10)} |

---

`;
}

/**
 * Main merge function for any domain.
 * @param {Object} opts - { inventory, workDir, target, domain, gold, forceWrite, scriptsDir, header }
 * @returns {Object} report
 */
export function mergeDomain(opts) {
  const {
    inventory: invPath,
    workDir: workDirRaw,
    target: targetRaw,
    domain,
    gold = false,
    forceWrite = false,
    skipAcceptance = false,
    scriptsDir,
    header: headerPath = null,
  } = opts;

  // Load inventory
  const absInv = path.resolve(invPath);
  let raw = fs.readFileSync(absInv, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const inv = JSON.parse(raw);

  const workDir = path.resolve(workDirRaw);
  const files = walkMd(workDir);
  if (!files.length) throw new Error(`no markdown in work-dir: ${workDir}`);

  // Build inventory evidence set
  const invItems = extractInventoryEvidence(inv, domain);
  const invEvidenceSet = new Set(invItems.map((x) => normalizeEvidence(x.evidence)).filter(Boolean));
  const invKeys = invItems.map((x) => normalizeEvidence(x.evidence)).filter(Boolean);

  // Parse all fragments, filter by inventory evidence
  const byEvidence = new Map();
  const dups = [];
  const noEvidence = [];
  const skippedOther = [];

  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    const rel = f.replace(/\\/g, "/");
    for (const sec of parseFragmentSections(text, rel)) {
      if (!sec.evidence) {
        noEvidence.push({ source: sec.source, preview: sec.body.slice(0, 80) });
        continue;
      }
      const key = normalizeEvidence(sec.evidence);
      // Skip fragments not in this inventory (other modules)
      if (invEvidenceSet.size > 0 && !invEvidenceSet.has(key)) {
        skippedOther.push({ evidence: key, source: sec.source });
        continue;
      }
      if (byEvidence.has(key)) {
        dups.push({ evidence: key, a: byEvidence.get(key).source, b: sec.source });
      } else {
        byEvidence.set(key, sec);
      }
    }
  }

  const mergedKeys = [...byEvidence.keys()];
  const invSet = new Set(invKeys);
  const missing = invKeys.filter((k) => !byEvidence.has(k));
  const extra = mergedKeys.filter((k) => !invSet.has(k));

  const report = {
    ok: dups.length === 0 && missing.length === 0,
    domain,
    module: inv.module || null,
    inventoryItems: invItems.length,
    fragmentFiles: files.length,
    mergedSections: byEvidence.size,
    skippedOtherModule: skippedOther.length,
    missing,
    extra,
    dups,
    noEvidenceCount: noEvidence.length,
    acceptance: null,
  };

  if (dups.length) {
    console.error("FAIL: duplicate evidence");
    process.exitCode = 1;
  }
  if (missing.length && !forceWrite) {
    console.error(`FAIL: missing ${missing.length} inventory items`);
    process.exitCode = 1;
  } else if (missing.length && forceWrite) {
    console.error(`WARN: --force-write skips ${missing.length} missing items; SSOT will have gaps`);
  }
  if (skippedOther.length) {
    console.error(`INFO: skipped ${skippedOther.length} fragments from other modules`);
  }

  // Acceptance check
  const needAcceptance = !forceWrite && !skipAcceptance;
  if (needAcceptance) {
    const acc = runAcceptance(workDir, domain, gold, scriptsDir);
    report.acceptance = {
      status: acc.status,
      gold_pass_ratio: acc.report?.gold_pass_ratio ?? null,
      blockers: acc.report?.blockers?.length ?? null,
      warnings: acc.report?.warnings?.length ?? null,
    };
    if (acc.status === 1) {
      report.ok = false;
      console.error("FAIL: acceptance-check blockers");
      if (acc.stderr) console.error(acc.stderr.trim());
      process.exitCode = 1;
    } else if (acc.status === 2) {
      console.error("WARN: acceptance-check warnings");
    }
  } else if (forceWrite) {
    console.error("WARN: --force-write skips acceptance-check; do not treat as gold SSOT");
  }

  if (!report.ok && !forceWrite) {
    console.log(JSON.stringify(report, null, 2));
    throw new Error(`merge aborted: fix missing/dups/acceptance before --write (or use --force-write)`);
  }
  if (!report.ok && forceWrite && dups.length > 0) {
    console.log(JSON.stringify(report, null, 2));
    throw new Error("merge aborted: duplicate evidence cannot be force-written");
  }

  // Build merged body (0.7.26 FC-6: preserve-order + footer + existing tail)
  const preserveOrder = opts.preserveOrder !== false;
  const footerExtra = opts.footer
    ? fs.readFileSync(path.resolve(opts.footer), "utf8")
    : "";
  let existingTail = "";
  if (targetRaw && fs.existsSync(path.resolve(targetRaw))) {
    const prev = fs.readFileSync(path.resolve(targetRaw), "utf8");
    const matches = [...prev.matchAll(/^##\s+\d+\.\s+/gm)];
    if (matches.length) {
      const last = matches[matches.length - 1];
      const rest = prev.slice(last.index);
      const endOfSec = rest.search(/\n##\s+(?!\d+\.)/);
      if (endOfSec >= 0) {
        existingTail = rest.slice(endOfSec).trim();
      }
    }
  }

  const parts = [];
  let header = defaultHeader(inv, domain, invItems.length);
  if (headerPath) {
    header = fs.readFileSync(path.resolve(headerPath), "utf8");
    if (!header.endsWith("\n")) header += "\n";
  }
  parts.push(header);

  const orderedItems = preserveOrder
    ? invItems
    : [...invItems].sort((a, b) =>
        String(a.label || "").localeCompare(String(b.label || ""))
      );

  let n = 1;
  for (const item of orderedItems) {
    const key = normalizeEvidence(item.evidence);
    if (!key) continue;
    const sec = byEvidence.get(key);
    if (!sec) continue;
    let body = sec.body.replace(/^##\s+\d+\.\s+/, `## ${n}. `);
    parts.push(body);
    if (!body.endsWith("\n")) parts.push("\n");
    parts.push("\n");
    n++;
  }

  if (existingTail) {
    parts.push("\n", existingTail, "\n");
  }
  if (footerExtra) {
    parts.push(footerExtra.endsWith("\n") ? footerExtra : footerExtra + "\n");
  }

  console.log(JSON.stringify(report, null, 2));

  const merged = parts.join("");
  if (targetRaw) {
    const tgt = path.resolve(targetRaw);
    fs.mkdirSync(path.dirname(tgt), { recursive: true });
    fs.writeFileSync(tgt, merged, "utf8");
    console.error(`Wrote SSOT ${tgt}`);
  } else {
    console.error(`DRY-RUN merged chars=${merged.length} sections=${n - 1}`);
  }

  return report;
}

/**
 * 0.7.26 FC-5: write one SSOT file per inventory table/key (db / redis).
 * Filenames: NN-<name>.md under targetDir.
 */
export function mergeDomainSplitByTable(opts) {
  const {
    inventory: invPath,
    workDir: workDirRaw,
    targetDir: targetDirRaw,
    domain,
    gold = false,
    forceWrite = false,
    skipAcceptance = false,
    scriptsDir,
    header: headerPath = null,
    footer: footerPath = null,
    preserveOrder = true,
  } = opts;

  const absInv = path.resolve(invPath);
  let raw = fs.readFileSync(absInv, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const inv = JSON.parse(raw);
  const workDir = path.resolve(workDirRaw);
  const targetDir = path.resolve(targetDirRaw);
  fs.mkdirSync(targetDir, { recursive: true });

  const files = walkMd(workDir);
  if (!files.length) throw new Error(`no markdown in work-dir: ${workDir}`);

  const invItems = extractInventoryEvidence(inv, domain);
  const ordered = preserveOrder
    ? invItems
    : [...invItems].sort((a, b) =>
        String(a.label || "").localeCompare(String(b.label || ""))
      );

  const byEvidence = new Map();
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    for (const sec of parseFragmentSections(text, f)) {
      if (!sec.evidence) continue;
      const key = normalizeEvidence(sec.evidence);
      if (!byEvidence.has(key)) byEvidence.set(key, sec);
    }
  }

  if (!forceWrite && !skipAcceptance) {
    const acc = runAcceptance(workDir, domain, gold, scriptsDir);
    if (acc.status === 1) {
      console.error("FAIL: acceptance-check blockers");
      if (acc.stderr) console.error(acc.stderr.trim());
      process.exitCode = 1;
      throw new Error("merge aborted: acceptance blockers");
    }
  }

  const footerExtra = footerPath
    ? fs.readFileSync(path.resolve(footerPath), "utf8")
    : "";
  const written = [];
  let nn = 1;
  for (const item of ordered) {
    const key = normalizeEvidence(item.evidence);
    const sec = byEvidence.get(key);
    if (!sec) {
      if (!forceWrite) {
        console.error(`FAIL: missing fragment for ${item.label || key}`);
        process.exitCode = 1;
      }
      continue;
    }
    const name = String(item.label || key)
      .replace(/[^\w.-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
    const fileNn = String(nn).padStart(2, "0");
    const outName = `${fileNn}-${name}.md`;
    const outPath = path.join(targetDir, outName);
    let header = defaultHeader(
      { ...inv, module: item.label || inv.module || name },
      domain,
      1
    );
    if (headerPath) {
      header = fs.readFileSync(path.resolve(headerPath), "utf8");
      if (!header.endsWith("\n")) header += "\n";
    }
    let body = sec.body.replace(/^##\s+\d+\.\s+/, "## 1. ");
    if (!body.endsWith("\n")) body += "\n";
    let existingTail = "";
    if (fs.existsSync(outPath)) {
      const prev = fs.readFileSync(outPath, "utf8");
      const matches = [...prev.matchAll(/^##\s+\d+\.\s+/gm)];
      if (matches.length) {
        const last = matches[matches.length - 1];
        const rest = prev.slice(last.index);
        const endOfSec = rest.search(/\n##\s+(?!\d+\.)/);
        if (endOfSec >= 0) existingTail = rest.slice(endOfSec).trim();
      }
    }
    const parts = [header, body, "\n"];
    if (existingTail) parts.push(existingTail, "\n");
    if (footerExtra) parts.push(footerExtra.endsWith("\n") ? footerExtra : footerExtra + "\n");
    fs.writeFileSync(outPath, parts.join(""), "utf8");
    written.push(outName);
    console.error(`Wrote SSOT ${outPath}`);
    nn++;
  }

  const report = {
    ok: process.exitCode !== 1,
    domain,
    split_by: "table",
    target_dir: targetDir,
    written,
    inventoryItems: invItems.length,
  };
  console.log(JSON.stringify(report, null, 2));
  return report;
}

/**
 * 0.7.26 FC-9: ensure domain index (api.md / func.md / db.md) lists known SSOT files.
 */
export function updateDomainIndex(opts) {
  const { root, domain, targetDir, target } = opts;
  const indexName = `${domain}.md`;
  const candidates = [
    path.join(root, domain, indexName),
    path.join(root, "docs", domain, indexName),
    path.join(root, indexName),
  ];
  let indexPath = candidates.find((p) => fs.existsSync(p));
  if (!indexPath) {
    // Prefer docs/<domain>/<domain>.md even if missing — create stub row section only when dir exists
    const prefer = path.join(root, "docs", domain, indexName);
    if (fs.existsSync(path.dirname(prefer))) indexPath = prefer;
    else return { updated: false, reason: "index_missing" };
  }

  let text = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : `# ${domain}\n\n`;
  const dir =
    targetDir ||
    (target ? path.dirname(path.resolve(target)) : null) ||
    path.join(path.dirname(indexPath), domain === "db" ? "table" : domain === "func" || domain === "api" ? "modules" : "keys");
  const absDir = path.resolve(dir);
  if (!fs.existsSync(absDir)) return { updated: false, path: indexPath, reason: "target_dir_missing" };

  const files = fs
    .readdirSync(absDir)
    .filter((f) => /^\d+-.*\.md$/i.test(f) && !/_change\.sql$/i.test(f))
    .sort();
  // 0.7.29 FC-9: splice only under the domain index section (not 变更记录)
  const sectionHeading =
    domain === "db"
      ? "表文档"
      : domain === "redis"
        ? "Key 文档"
        : domain === "jobs"
          ? "任务文档"
          : "模块文档";
  let changed = false;
  for (const f of files) {
    const stem = f.replace(/\.md$/i, "");
    const link = domain === "db" ? `table/${f}` : domain === "redis" ? `keys/${f}` : `modules/${f}`;
    if (text.includes(f) || text.includes(stem)) continue;
    const row = `| ${stem} | [\`${f}\`](${link}) | — |\n`;
    const secRe = new RegExp(
      `(##\\s*${sectionHeading}\\s*\\n)([\\s\\S]*?)(?=\\n##\\s+|$)`,
      "i"
    );
    const sec = text.match(secRe);
    if (sec) {
      const body = sec[2];
      const lines = body.split(/\r?\n/);
      let lastTable = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/^\|/.test(lines[i])) lastTable = i;
      }
      let nextBody;
      if (lastTable >= 0) {
        lines.splice(lastTable + 1, 0, row.trimEnd());
        nextBody = lines.join("\n");
      } else {
        nextBody =
          body.replace(/\s*$/, "") +
          `\n\n| 名称 | 文件 | 备注 |\n|---|---|---|\n${row}`;
      }
      text = text.replace(secRe, `${sec[1]}${nextBody}`);
      changed = true;
      continue;
    }
    text = text.replace(
      /\s*$/,
      `\n\n## ${sectionHeading}\n\n| 名称 | 文件 | 备注 |\n|---|---|---|\n${row}`
    );
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(indexPath, text.endsWith("\n") ? text : text + "\n", "utf8");
  }
  return { updated: changed, path: indexPath, files: files.length };
}
