/**
 * 0.7.35 HK-4: probe findings → WritePlan Markdown (no disk writes).
 */
import fs from "fs";
import path from "path";

const DOC_PATH_RE =
  /(?:^|[\s`"'(])((?:docs\/[a-z0-9_\-./]+\.md)|(?:\.cursor\/[a-z0-9_\-./]+\.md))/gim;

/**
 * @param {string} findingsPath file or directory
 * @returns {string[]} relative-ish doc paths
 */
export function collectFindingPaths(findingsPath) {
  const abs = path.resolve(findingsPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`findings path not found: ${abs}`);
  }
  const files = [];
  const st = fs.statSync(abs);
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(abs)) {
      const p = path.join(abs, name);
      if (fs.statSync(p).isFile()) files.push(p);
    }
  } else {
    files.push(abs);
  }

  const out = new Set();
  for (const f of files) {
    const raw = fs.readFileSync(f, "utf8");
    // JSON array of strings or objects with path/file/ssot
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const j = JSON.parse(trimmed);
        const list = Array.isArray(j) ? j : j.findings || j.paths || j.files || [j];
        for (const item of list) {
          if (typeof item === "string") out.add(item.replace(/\\/g, "/"));
          else if (item && typeof item === "object") {
            const p = item.path || item.file || item.ssot || item.target;
            if (p) out.add(String(p).replace(/\\/g, "/"));
          }
        }
        continue;
      } catch {
        /* fall through to line scan */
      }
    }
    for (const m of raw.matchAll(DOC_PATH_RE)) {
      out.add(m[1].replace(/\\/g, "/"));
    }
    // bare docs/... lines
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim().replace(/^[-*]\s+/, "").replace(/`/g, "");
      if (/^docs\/.+\.md$/i.test(t)) out.add(t);
    }
  }
  return [...out].sort();
}

function domainOf(rel) {
  const m = String(rel).match(/^docs\/([a-z0-9_-]+)\//i);
  return m ? m[1] : "other";
}

/**
 * @param {string[]} paths
 * @param {{ root?: string }} [opts]
 * @returns {string} WritePlan markdown
 */
export function formatBackfillWritePlan(paths, opts = {}) {
  const byDomain = new Map();
  for (const p of paths) {
    const d = domainOf(p);
    if (!byDomain.has(d)) byDomain.set(d, []);
    byDomain.get(d).push(p);
  }
  const lines = [];
  lines.push("# WritePlan — backfill（探针回灌 · 不写盘）");
  lines.push("");
  lines.push(
    "> 模式：`backfill`。根据探针 findings 列出待改 SSOT；**须确认闸门后再手改/merge**，本命令不写盘。"
  );
  if (opts.root) lines.push(`> 目标根：\`${opts.root}\``);
  lines.push("");
  lines.push("## 摘要");
  lines.push("");
  lines.push(`- 路径数：**${paths.length}**`);
  lines.push(`- 域：${[...byDomain.keys()].join(", ") || "（无）"}`);
  lines.push("");
  if (!paths.length) {
    lines.push("（findings 未解析到 `docs/**/*.md` 路径；检查 JSON/`path` 字段或明文路径）");
    lines.push("");
    return lines.join("\n");
  }
  lines.push("## 待改 SSOT（按域）");
  lines.push("");
  for (const [d, list] of [...byDomain.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    lines.push(`### ${d}`);
    lines.push("");
    for (const p of list) lines.push(`- [ ] \`${p}\` — 首填后按探针结论改 SSOT`);
    lines.push("");
  }
  lines.push("## 下一步");
  lines.push("");
  lines.push("1. 用户确认本 WritePlan（确认闸门词表见 `modes/write-plan.md`）");
  lines.push("2. 按路径改 SSOT / 跑 `fill-merge`；勿直接改宿主生成物");
  lines.push("3. `fill-score` / `refresh` 复核就绪");
  lines.push("");
  return lines.join("\n");
}

/**
 * @param {string} findingsPath
 * @param {{ root?: string }} [opts]
 */
export function buildBackfillPlan(findingsPath, opts = {}) {
  const paths = collectFindingPaths(findingsPath);
  return {
    paths,
    markdown: formatBackfillWritePlan(paths, opts),
  };
}
