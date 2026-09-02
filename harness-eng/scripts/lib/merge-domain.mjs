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

/** Extract evidence from a markdown section body. */
export function extractEvidence(body) {
  const m =
    body.match(/\*\*evidence:\*\*\s*`([^`]+)`/i) ||
    body.match(/\*\*evidence:\*\*\s*(\S+)/i) ||
    body.match(/evidence:\s*`([^`]+)`/i) ||
    body.match(/evidence:\s*(\S+\.java#\w+)/i) ||
    body.match(/evidence:\s*(\S+\.java)/i);
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

  // Build merged body in inventory order
  const parts = [];
  let header = defaultHeader(inv, domain, invItems.length);
  if (headerPath) {
    header = fs.readFileSync(path.resolve(headerPath), "utf8");
    if (!header.endsWith("\n")) header += "\n";
  }
  parts.push(header);

  let n = 1;
  for (const item of invItems) {
    const key = normalizeEvidence(item.evidence);
    if (!key) continue;
    const sec = byEvidence.get(key);
    if (!sec) continue; // skip missing (force-write with gaps)
    let body = sec.body.replace(/^##\s+\d+\.\s+/, `## ${n}. `);
    parts.push(body);
    if (!body.endsWith("\n")) parts.push("\n");
    parts.push("\n");
    n++;
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
