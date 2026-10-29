/**
 * 将 docs/api/modules 字段表升级为模板 7 列：
 *   参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值
 * （保留 A/B、默认等已有列；已有「枚举」列则跳过）
 *
 * 用法（仓库根）：
 *   node scripts/apifox/upgrade-field-tables-to-7col.mjs
 *   node scripts/apifox/upgrade-field-tables-to-7col.mjs docs/api/modules/04-conversations.md
 *
 * 一次性迁移工具（0.7.49）：模板默认 7 列（api-doc-template.md）；本脚本把旧 5 列
 * （枚举/条件写在说明里）批量拆分。改写有损风险：先跑 git status 确认工作区干净，
 * 升级后人工抽查 2～3 张表再提交。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const modulesDir = path.join(repoRoot, "docs/api/modules");

function stripMd(s) {
  return String(s || "")
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function splitRow(line) {
  const raw = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return raw.split("|").map((c) => c.trim());
}

function isSeparator(line) {
  if (!line || !line.includes("|")) return false;
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line.trim());
}

function looksLikeEnumOnly(s) {
  return /^\d/.test(s) || /^[A-Z][A-Z0-9_]*\s*[=：:]/.test(s);
}

function extractTitle(desc) {
  if (!desc) return undefined;
  const plain = desc.replace(/`/g, "");
  const colon = plain.split(/[：:]/);
  if (colon.length >= 2) {
    const head = colon[0].trim();
    if (head && head.length <= 24 && !looksLikeEnumOnly(head)) return head;
  }
  const paren = plain.split(/[（(]/)[0].trim();
  if (
    paren &&
    paren.length < plain.length &&
    paren.length <= 24 &&
    !looksLikeEnumOnly(paren)
  ) {
    return paren;
  }
  const comma = plain.split(/[，,；;]/)[0].trim();
  if (
    comma &&
    comma.length < plain.length &&
    comma.length <= 24 &&
    !looksLikeEnumOnly(comma) &&
    !/=/.test(comma)
  ) {
    return comma;
  }
  if (plain.length <= 16 && !looksLikeEnumOnly(plain)) {
    return plain.replace(/[。．.]+$/, "");
  }
  return undefined;
}

function extractEnum(desc) {
  if (!desc) return null;
  const named = [
    ...desc.matchAll(/\b([A-Z][A-Z0-9_]{1,32})\s*[=：:]\s*([^\s,，;；/=]{1,20})/g),
  ];
  if (named.length >= 2) {
    return named.map((m) => ({
      value: m[1],
      name: m[2].replace(/[。．.]+$/, ""),
    }));
  }
  const numLabeled = [
    ...desc.matchAll(
      /(\d+)\s*[-–=：:]\s*([^\d,，;；/]{1,24}?)(?=\s*(?:[,，;；/]|$|\d+\s*[-–=：:]))/g
    ),
  ];
  if (numLabeled.length >= 2) {
    return numLabeled.map((m) => ({
      value: Number(m[1]),
      name: m[2].replace(/[。．.]+$/, ""),
    }));
  }
  const yn = [...desc.matchAll(/(\d+)\s*(否|是)/g)];
  if (yn.length >= 2) {
    return yn.map((m) => ({ value: Number(m[1]), name: m[2] }));
  }
  const ticks = [...desc.matchAll(/`([^`]+)`/g)]
    .map((m) => m[1].trim())
    .filter((v) => /^[A-Z][A-Z0-9_]*$/.test(v) || /^[A-Z]$/.test(v));
  const uniq = [...new Set(ticks)];
  if (uniq.length >= 2 && uniq.length <= 24) {
    return uniq.map((v) => ({ value: v, name: v }));
  }
  return null;
}

function formatEnum(enumerated) {
  if (!enumerated?.length) return "—";
  const yn =
    enumerated.length >= 2 &&
    enumerated.every((e) => typeof e.value === "number") &&
    enumerated.every((e) => e.name === "否" || e.name === "是");
  if (yn) {
    return enumerated.map((e) => `${e.value}${e.name}`).join(" ");
  }
  const allNamed = enumerated.every(
    (e) => e.name && e.name !== String(e.value) && typeof e.value === "string"
  );
  if (allNamed) {
    return enumerated.map((e) => `${e.value}=${e.name}`).join(" / ");
  }
  const allTicks = enumerated.every(
    (e) => typeof e.value === "string" && /^[A-Z][A-Z0-9_]*$/.test(e.value)
  );
  if (allTicks) {
    return enumerated.map((e) => `\`${e.value}\``).join(" / ");
  }
  return enumerated
    .map((e) =>
      e.name && e.name !== String(e.value)
        ? `${e.value}=${e.name}`
        : String(e.value)
    )
    .join(" / ");
}

function splitDesc(desc) {
  const raw = (desc || "").trim();
  if (!raw || raw === "-" || raw === "—") {
    return { meaning: "—", enumText: "—", remark: "—" };
  }
  const enumerated = extractEnum(raw);
  const enumText = formatEnum(enumerated);
  let meaning = extractTitle(raw) || stripMd(raw);
  if (meaning.length > 36) {
    meaning = stripMd(raw).split(/[：:；;。]/)[0].trim().slice(0, 36) || meaning;
  }
  if (!meaning) meaning = "—";

  let remark = stripMd(raw);
  if (meaning !== "—" && remark.startsWith(stripMd(meaning))) {
    remark = remark.slice(stripMd(meaning).length).replace(/^[：:；;，,\s]+/, "");
  }
  if (enumerated) {
    remark = remark
      .replace(/\b[A-Z][A-Z0-9_]{1,32}\s*[=：:]\s*[^\s,，;；/=]{1,20}/g, "")
      .replace(/`[A-Z][A-Z0-9_]*`/g, "")
      .replace(/\d+\s*[-–=：:]\s*[^\d,，;；/]{1,24}/g, "")
      .replace(/\d+\s*(否|是)/g, "")
      .replace(/[/／]\s*/g, " ")
      .replace(/[，,；;]\s*[，,；;]+/g, "；")
      .replace(/\s{2,}/g, " ")
      .replace(/^[；;，,\s/／]+|[；;，,\s/／]+$/g, "")
      .trim();
  }
  if (!remark || remark === stripMd(meaning) || remark.length < 2) {
    remark = "—";
  }
  // 说明里若仍堆满长文且未抽出备注，把条件类后半挪到备注
  if (remark === "—" && /条件必填|缺省|默认|→\s*\d{4}|见『|见「|见模块/.test(raw)) {
    const parts = raw.split(/[；;]/);
    if (parts.length >= 2) {
      meaning = extractTitle(parts[0]) || stripMd(parts[0]).slice(0, 36);
      remark = parts.slice(1).join("；").trim() || "—";
    }
  }
  return { meaning, enumText, remark };
}

function colIndex(headers, names) {
  return headers.findIndex((h) => names.includes(h));
}

function padSep(n) {
  return Array.from({ length: n }, () => "---").join("|");
}

function upgradeTable(headerLine, sepLine, bodyLines) {
  const headers = splitRow(headerLine).map(stripMd);
  const nameIdx = colIndex(headers, ["参数名", "字段"]);
  const descIdx = colIndex(headers, ["说明"]);
  if (nameIdx < 0 || descIdx < 0) return null;
  if (colIndex(headers, ["枚举"]) >= 0) return null;
  // 跳过「接口字段与表字段映射」类（含 表字段 / 操作）
  if (colIndex(headers, ["表字段", "操作"]) >= 0) return null;

  const exampleIdx = colIndex(headers, ["示例值", "示例"]);
  const reqIdx = colIndex(headers, ["必填"]);
  const insertAt = descIdx + 1;

  const newHeaders = [...headers];
  // 统一「字段」→「参数名」
  if (headers[nameIdx] === "字段") newHeaders[nameIdx] = "参数名";
  newHeaders.splice(insertAt, 0, "枚举", "备注");
  let forcedReq = false;
  if (reqIdx < 0 && colIndex(headers, ["A"]) < 0) {
    // 在类型后插入必填
    const typeIdx = colIndex(newHeaders, ["类型"]);
    const at = typeIdx >= 0 ? typeIdx + 1 : insertAt;
    newHeaders.splice(at, 0, "必填");
    forcedReq = true;
  }
  if (exampleIdx < 0 && colIndex(newHeaders, ["示例值"]) < 0) {
    newHeaders.push("示例值");
  }

  // 重新定位（插入后）
  const h = newHeaders;

  // 逐行按新表头重建
  const rebuilt = bodyLines.map((line) => {
    const cells = splitRow(line);
    while (cells.length < headers.length) cells.push("");
    const oldDesc = cells[descIdx] || "";
    const { meaning, enumText, remark } = splitDesc(oldDesc);
    const map = {};
    headers.forEach((name, i) => {
      map[name] = cells[i] ?? "";
    });
    if (headers[nameIdx] === "字段") {
      map["参数名"] = map["字段"];
    }
    map["说明"] = meaning;
    map["枚举"] = enumText;
    map["备注"] = remark;
    if (forcedReq && map["必填"] == null) {
      // 必填列缺省时按常见包装字段猜测；其余一律「否」，落地仓可人工复核
      const p = String(map["参数名"] || map["字段"] || "");
      map["必填"] =
        p.startsWith("data") || p === "code" || p === "type" || p === "msg" || p === "desc"
          ? "是"
          : "否";
    }
    if (map["示例值"] == null && map["示例"] == null) map["示例值"] = "—";
    return h.map((name) => {
      if (name === "示例值") return map["示例值"] ?? map["示例"] ?? "—";
      return map[name] ?? "—";
    });
  });

  const outHeader = `| ${h.join(" | ")} |`;
  const outSep = `|${padSep(h.length)}|`;
  const outBody = rebuilt.map((cells) => `| ${cells.join(" | ")} |`);
  return [outHeader, outSep, ...outBody].join("\n");
}

function upgradeFile(filePath) {
  const md = fs.readFileSync(filePath, "utf8");
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  let upgraded = 0;
  let inFence = false;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      out.push(line);
      i += 1;
      continue;
    }
    if (
      !inFence &&
      line.includes("|") &&
      i + 1 < lines.length &&
      isSeparator(lines[i + 1])
    ) {
      const headerLine = line;
      const sepLine = lines[i + 1];
      const body = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith("|") && !isSeparator(lines[j])) {
        body.push(lines[j]);
        j += 1;
      }
      const replaced = upgradeTable(headerLine, sepLine, body);
      if (replaced) {
        out.push(...replaced.split("\n"));
        upgraded += 1;
        i = j;
        continue;
      }
    }
    out.push(line);
    i += 1;
  }
  if (upgraded > 0) {
    fs.writeFileSync(filePath, out.join("\n"), "utf8");
  }
  return upgraded;
}

/** 若文档自带「| 版本 | 类型 | 内容 | 操作人 | 更新时间 |」变更记录表则补一行；无该表则跳过（不造表）。 */
function appendChangelog(filePath, note) {
  const md = fs.readFileSync(filePath, "utf8");
  if (/说明\/枚举\/备注分列|字段表升级新 7 列|枚举与备注列/.test(md)) return;
  const re =
    /(\| 版本 \| 类型 \| 内容 \| 操作人 \| 更新时间 \|\r?\n\|---\|---\|---\|---\|---\|\r?\n)/;
  if (!re.test(md)) return;
  const today = new Date().toISOString().slice(0, 10);
  const row = `| v-auto | 规范 | ${note} | harness-eng | ${today} |\n`;
  const next = md.replace(re, `$1${row}`);
  fs.writeFileSync(filePath, next, "utf8");
}

const args = process.argv.slice(2);
const targets = args.length
  ? args.map((a) => path.resolve(repoRoot, a))
  : fs
      .readdirSync(modulesDir)
      .filter((f) => /^\d{2}-.*\.md$/.test(f))
      .map((f) => path.join(modulesDir, f));

let total = 0;
for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.warn("skip missing", file);
    continue;
  }
  const n = upgradeFile(file);
  if (n > 0) {
    appendChangelog(file, "字段表升级为说明/枚举/备注分列（模板 7 列）");
    console.log(`${path.relative(repoRoot, file)}: upgraded ${n} table(s)`);
    total += n;
  } else {
    console.log(`${path.relative(repoRoot, file)}: no change`);
  }
}
console.log(`Done. total tables upgraded: ${total}`);
