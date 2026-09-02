/**
 * Shared API endpoint markdown extraction (used by fill-truths-auto / fill-merge --auto-fill).
 */
import fs from "fs";
import path from "path";

/** Dedup when method path already includes class base prefix. */
export function joinHttpPath(classBase, methodPath) {
  const base = String(classBase || "").trim();
  let sub = String(methodPath || "").trim();
  if (!sub && !base) return "/";
  if (!sub) return base.startsWith("/") ? base : `/${base}`;
  if (!base) return sub.startsWith("/") ? sub : `/${sub}`;
  const b = base.replace(/\/$/, "");
  if (!sub.startsWith("/")) sub = `/${sub}`;
  if (sub === b || sub.startsWith(b + "/")) return sub;
  if (b.endsWith(sub)) return b;
  return `${b}${sub}`;
}

function extractApiOp(text, methodName) {
  const re = new RegExp(
    `@ApiOperation\\s*\\([\\s\\S]*?(?:value|notes)\\s*=\\s*"([^"]+)"[\\s\\S]*?\\)\\s*(?:@[\\w]+(?:\\([^)]*\\))?\\s*)*public[\\s\\S]*?\\b${methodName}\\s*\\(`,
    "m"
  );
  const m = text.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `@ApiOperation\\s*\\(\\s*"([^"]+)"\\s*\\)[\\s\\S]{0,400}?\\b${methodName}\\s*\\(`
  );
  const m2 = text.match(re2);
  return m2 ? m2[1] : methodName;
}

function extractMethodSnippet(text, methodName, maxLines = 8) {
  const re = new RegExp(
    `(?:public|protected|private)\\s+[\\w.<>,\\s\\[\\]?]+\\s+${methodName}\\s*\\([^)]*\\)\\s*(?:throws[^{]+)?\\{`,
    "m"
  );
  const m = text.match(re);
  if (!m) return "";
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < text.length && depth > 0) {
    const ch = text[i++];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  const body = text.slice(start, i - 1).trim();
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"));
  return lines.slice(0, maxLines).join("\n");
}

function parseParamsTable(paramsSrc) {
  if (!paramsSrc || !paramsSrc.trim()) {
    return "| 参数名 | 类型 | 注解 | 说明 |\n|---|---|---|---|\n| — | — | — | 无显式参数 |";
  }
  const rows = [];
  const parts = paramsSrc.split(",");
  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    const ann = [...p.matchAll(/@(\w+)(?:\([^)]*\))?/g)].map((x) => x[0]).join(" ");
    const cleaned = p.replace(/@\w+(?:\([^)]*\))?/g, "").trim();
    const mm = cleaned.match(/([\w.<>,\s\[\]]+)\s+(\w+)\s*$/);
    if (!mm) continue;
    const typ = mm[1].replace(/\s+/g, " ").trim();
    const name = mm[2];
    rows.push(`| ${name} | ${typ} | ${ann || "—"} | — |`);
  }
  if (!rows.length) {
    return "| 参数名 | 类型 | 注解 | 说明 |\n|---|---|---|---|\n| — | — | — | 解析失败 |";
  }
  return ["| 参数名 | 类型 | 注解 | 说明 |", "|---|---|---|---|", ...rows].join("\n");
}

function readEndpointSource(root, evidence) {
  if (!evidence) return { text: "", file: null, method: null };
  const [rel, method] = String(evidence).split("#");
  const abs = path.resolve(root, rel);
  if (!fs.existsSync(abs)) return { text: "", file: abs, method };
  return { text: fs.readFileSync(abs, "utf8"), file: abs, method };
}

/** Build one ## N. section from inventory endpoint (+ optional source enrich). */
export function endpointToMarkdown(ep, index, root) {
  const { text, method } = readEndpointSource(root, ep.evidence);
  const title = text && method ? extractApiOp(text, method) : ep.method || `endpoint-${index}`;
  const http = ep.http || "POST";
  let apiPath = ep.path || "/";
  if (!apiPath.startsWith("/")) apiPath = `/${apiPath}`;

  let paramsTable =
    "| 参数名 | 类型 | 注解 | 说明 |\n|---|---|---|---|\n| — | — | — | TODO(harness-eng) |";
  let logic = `- Controller: \`${ep.controller || "?"}\`\n- Method: \`${ep.method || "?"}\``;
  if (text && method) {
    const methodRe = new RegExp(
      `(?:public|protected|private)\\s+([\\w.<>,\\s\\[\\]?]+)\\s+${method}\\s*\\(([\\s\\S]*?)\\)\\s*(?:throws[^{]+)?\\{`,
      "m"
    );
    const mm = text.match(methodRe);
    if (mm) {
      paramsTable = parseParamsTable(mm[2]);
      const snip = extractMethodSnippet(text, method);
      if (snip) {
        logic = `\`\`\`java\n${snip}\n\`\`\``;
      }
    }
  }

  const bodyHint = ep.bodyType ? `\n请求体类型：\`${ep.bodyType}\`` : "";
  const ret = ep.retType || "—";

  return `## ${index}. ${title}

**功能描述：** ${title}  
**接口地址：** ${apiPath}  
**请求方式：** ${http}  
**evidence:** \`${ep.evidence || "—"}\`

### 功能逻辑
${logic}

### 请求参数
${paramsTable}${bodyHint}

### 响应参数
返回类型：\`${ret}\`

`;
}

/** Write shard fragments under workDir from inventory. */
export function writeAutoFillShards(inv, workDir, root, dryRun = false) {
  const shards = Array.isArray(inv.shards) && inv.shards.length
    ? inv.shards
    : [{ id: "shard-01", endpoints: inv.endpoints || [] }];
  const written = [];
  fs.mkdirSync(workDir, { recursive: true });
  for (const shard of shards) {
    const eps = shard.endpoints || [];
    const parts = [];
    eps.forEach((ep, i) => {
      parts.push(endpointToMarkdown(ep, i + 1, root));
    });
    const body = parts.join("\n");
    const outFile = path.join(workDir, `${shard.id || "shard"}.md`);
    if (!dryRun) fs.writeFileSync(outFile, body, "utf8");
    written.push({
      file: outFile.replace(/\\/g, "/"),
      endpoints: eps.length,
      dryRun,
    });
  }
  return written;
}
