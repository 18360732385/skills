/**
 * release-eng 共享格式化：中国时区、元信息内上线摘要（分支级聚合）、mergeSources
 * 中文一句话（origin/ 前缀归一去重）、提交 hash 短码、yml 上一行中文注释、章节编号。
 */
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { DEFAULT_REPO_PROFILE } from "./lib/repo-profile.mjs";

export const TZ_CHINA = "Asia/Shanghai";

/** 提交列表：≤5 全量；>5 前 3 + … + 后 2 */
export const COMMIT_DISPLAY_MAX = 5;
export const COMMIT_DISPLAY_HEAD = 3;
export const COMMIT_DISPLAY_TAIL = 2;

/** 提交 hash 展示长度（前 N 位；JSON 仍保留全量 %H） */
export const COMMIT_HASH_DISPLAY_LEN = 8;

export function shortCommitHash(hash) {
  const h = String(hash || "").trim();
  return h.length > COMMIT_HASH_DISPLAY_LEN ? h.slice(0, COMMIT_HASH_DISPLAY_LEN) : h;
}

/** 去掉 UTF-8 BOM（PowerShell 重定向 / 部分编辑器易引入） */
export function stripBom(text) {
  const s = String(text ?? "");
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/**
 * 版本身份/目录包名派生：发版分支名（去 refs 与 origin/ 前缀，`/` → `-`）。
 * 例：`origin/release/V260827` → `release-V260827`。
 */
export function identityFromBranch(branch) {
  return String(branch || "")
    .trim()
    .replace(/^refs\/remotes\//, "")
    .replace(/^refs\/heads\//, "")
    .replace(/^origin\//, "")
    .replace(/\//g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** 上线内容摘要最多条数 */
export const SUMMARY_MAX = 5;

/** 来源分支功能最多条数 */
export const BRANCH_FEATURE_MAX = 3;

/** 当前时刻（中国时区）YYYY-MM-DD HH:mm:ss */
export function nowChinaTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_CHINA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

/** git spawn 环境：强制中国时区解释 --date=format-local */
export function gitEnvChina(baseEnv = process.env) {
  return { ...baseEnv, TZ: TZ_CHINA };
}

/**
 * 发版单一级章节（一、二、三…）。
 * 上线内容摘要已并入「一、元信息」，不再单独成章。
 */
export const H2 = {
  meta: "一、元信息",
  git: "二、Git 定版",
  services: "三、涉及服务与模块",
  sql: "四、数据库与 SQL",
  config: "五、配置项",
  jobs: "六、定时任务",
  bundle: "七、包内附属文件",
  third: "八、第三方与外部依赖",
  steps: "九、上线步骤与回滚",
  risk: "十、风险与验收",
  appendix: "十一、附录：关联契约与规划（可选）",
  /** @deprecated 0.3.12 起并入元信息；仅供旧稿迁移匹配 */
  summary: "上线内容摘要",
};

/** Git 定版子节（1、2） */
export const H3_GIT = {
  commits: "1、提交列表",
  merges: "2、合并来源（按分支去重全量）",
};

/** 匹配 ## 标题（兼容有无「一、」前缀） */
export function matchH2(line, bareTitle) {
  const t = String(line || "").trim();
  if (t === `## ${bareTitle}`) return true;
  if (t === `## ${bareTitle.replace(/^[一二三四五六七八九十百千]+、/, "")}`) return true;
  const re = new RegExp(
    `^##\\s+(?:[一二三四五六七八九十百千]+、\\s*)?${escapeRe(stripCnOrdinal(bareTitle))}\\s*$`
  );
  return re.test(t);
}

function stripCnOrdinal(title) {
  return String(title).replace(/^[一二三四五六七八九十百千]+、\s*/, "");
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 环境支 / 未识别：不进上线摘要优先位，合并来源表折叠 */
const MERGE_NOISE_EXACT = new Set([
  "无/未识别",
  "test",
  "uat",
  "pre",
  "main",
  "master",
  "develop",
  "dev",
  "staging",
  "prod",
  "production",
]);

/**
 * 是否合并来源噪声支（环境支 / 未识别 / merge/*）。
 * 归一后再判；`feature/...`、`release/...` 业务支为 false。
 */
export function isMergeSourceNoise(source) {
  const norm = normalizeSourceBranch(source);
  if (!norm || norm === "无/未识别") return true;
  const lower = norm.toLowerCase();
  if (MERGE_NOISE_EXACT.has(lower)) return true;
  if (/^merge\//i.test(norm)) return true;
  // 末段为环境短名：foo/test、origin 已剥
  const last = lower.split("/").filter(Boolean).pop() || "";
  if (MERGE_NOISE_EXACT.has(last) && last !== "release") return true;
  return false;
}

/**
 * 上线内容摘要行：1～5 项，**分支级聚合**（不再简单截取最近 5 条提交）。
 * 先按合并来源逐分支一句话（按出现次数降序，**跳过 noise**），再用直推（非 Merge）提交短句补足；
 * recentFirst=true（首次发版，或无 mergeSources）：直推取最近若干条，避免"Initial commit"等最旧提交占位。
 */
export function buildReleaseSummaryLines(
  commits,
  { max = SUMMARY_MAX, recentFirst = false, mergeSources = null } = {}
) {
  const rows = (commits || []).filter((c) => c && !c.__omit__);
  const nonMerge = rows.filter((c) => !/^Merge\b/i.test(String(c.subject || "")));
  const src = nonMerge.length ? nonMerge : rows; // git log 顺序：新→旧
  const lines = [];
  const seen = new Set();

  // 分支级：每个合并来源一行（来源分支功能一句话），覆盖全量范围而非仅尾部提交
  const sources = Array.isArray(mergeSources) ? [...mergeSources] : [];
  sources.sort((a, b) => (b?.count || 0) - (a?.count || 0));
  for (const m of sources) {
    if (!m || !m.source) continue;
    if (m.noise === true || isMergeSourceNoise(m.source)) continue;
    const s = m.branchSummary || branchOneLineSummary(m.source, m.subjects);
    if (!s || seen.has(s)) continue;
    seen.add(s);
    lines.push(s);
    if (lines.length >= max) return lines;
  }

  // 直推提交补足（不经合并的独立工作）
  const ordered = recentFirst ? src.slice(0, max * 2) : [...src].reverse();
  for (const c of ordered) {
    const s = toBusinessPhrase(String(c.subject || "").trim());
    if (!s || seen.has(s)) continue;
    seen.add(s);
    lines.push(s);
    if (lines.length >= max) break;
  }
  return lines;
}

export function releaseSummaryMarkdown(lines) {
  if (!lines?.length) return "（暂无提交摘要）";
  return lines.map((l) => `- ${l}`).join("\n");
}

/**
 * 从分支名提炼中文功能短语。
 * slugCn：分支 slug → 中文短语表；缺省为 DEFAULT_REPO_PROFILE.branchSlugCn
 * （目标仓可用 docs/releases/repo-profile.json 覆盖，经 freeze/note-merge 注入）。
 */
export function featurePhraseFromBranch(source, slugCn = DEFAULT_REPO_PROFILE.branchSlugCn) {
  const raw = String(source || "")
    .replace(/^refs\/remotes\/origin\//, "")
    .replace(/^origin\//, "")
    .trim();
  if (!raw || raw === "无/未识别") return "未识别来源分支";
  const parts = raw.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || raw;
  const slug = last.replace(/^\d{6}-/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  const key = slug.toLowerCase();
  if (slugCn[key]) return slugCn[key];
  if (slugCn[slug]) return slugCn[slug];
  // 含中文的 slug 直接可用
  if (/[\u4e00-\u9fff]/.test(slug)) return slug;
  // 英文连字符拆词查表
  for (const part of slug.split(/[-_]/)) {
    const p = part.toLowerCase();
    if (slugCn[p]) return slugCn[p];
  }
  return `${slug} 相关能力`;
}

/**
 * 将提交 subject 收成业务向中文短语（去掉 conventional 前缀壳）。
 */
export function toBusinessPhrase(subject) {
  let s = String(subject || "").trim();
  if (!s) return "";
  if (/^Merge (?:remote-tracking )?branch\b/i.test(s)) return "";
  if (/^Merge pull request\b/i.test(s)) return "";
  s = s.replace(/^merge:\s*/i, "").trim();
  // feat(scope): / fix(qa): ISSUE-001 — …
  s = s.replace(/^(feat|fix|chore|docs|test|refactor|perf|ci|build|style)(\([^)]*\))?\s*[:：]\s*/i, "");
  s = s.replace(/^ISSUE-\d+\s*[—–-]\s*/i, "");
  s = s.replace(/\s+/g, " ").trim();
  if (!s) return "";
  // 过长截断
  if (s.length > 60) s = `${s.slice(0, 58)}…`;
  return s;
}

/**
 * 来源分支功能：1～3 项中文业务/修复描述，按出现顺序。
 * @returns {string[]}
 */
export function branchFeaturesFromSubjects(
  source,
  subjects,
  { max = BRANCH_FEATURE_MAX, slugCn = DEFAULT_REPO_PROFILE.branchSlugCn } = {}
) {
  const features = [];
  const seen = new Set();
  for (const raw of subjects || []) {
    const phrase = toBusinessPhrase(raw);
    if (!phrase || seen.has(phrase)) continue;
    seen.add(phrase);
    features.push(phrase);
    if (features.length >= max) break;
  }
  if (!features.length) {
    features.push(featurePhraseFromBranch(source, slugCn));
  }
  return features.slice(0, max);
}

/**
 * 来源分支功能一句话总结：
 * 分支名命中词表 → 直接用分支级中文短语；未识别 → 取首条可业务化提交说明；兜底给通用短语。
 * slugCn：短语表注入（缺省 DEFAULT_REPO_PROFILE.branchSlugCn）。
 */
export function branchOneLineSummary(
  source,
  subjects,
  { slugCn = DEFAULT_REPO_PROFILE.branchSlugCn } = {}
) {
  const phrase = featurePhraseFromBranch(source, slugCn);
  const generic = phrase === "未识别来源分支" || /相关能力$/.test(phrase);
  if (!generic) return phrase;
  for (const raw of subjects || []) {
    const p = toBusinessPhrase(raw);
    if (p) return p;
  }
  return phrase;
}

/**
 * 一句话总结（兼容旧消费者）。
 */
export function summarizeBranchFeature(source, subjects) {
  return branchOneLineSummary(source, subjects);
}

/**
 * 来源分支名归一：`origin/code-scaffold` / `refs/remotes/origin/code-scaffold`
 * 与本地 `code-scaffold` 视为同一分支（去重键与展示均用归一名）。
 */
export function normalizeSourceBranch(source) {
  return String(source || "")
    .trim()
    .replace(/^refs\/remotes\/origin\//, "")
    .replace(/^refs\/remotes\//, "")
    .replace(/^origin\//, "");
}

/**
 * 按推测来源分支去重（origin/ 前缀归一）；产出 branchSummary=一句话 + branchFeatures[] + noise（JSON 兼容）
 * slugCn：分支短语表注入（缺省 DEFAULT_REPO_PROFILE.branchSlugCn；目标仓 repo-profile.json 可覆盖）。
 */
export function buildMergeSources(merges, { slugCn = DEFAULT_REPO_PROFILE.branchSlugCn } = {}) {
  const map = new Map();
  for (const m of merges || []) {
    const norm = normalizeSourceBranch(m.source);
    const source = norm || "无/未识别";
    const prev = map.get(source);
    const subject = m.subject || "";
    if (!prev) {
      map.set(source, { source, count: 1, subjects: [subject] });
    } else {
      prev.count += 1;
      prev.subjects.push(subject);
    }
  }
  return [...map.values()]
    .map((row) => {
      const branchFeatures = branchFeaturesFromSubjects(row.source, row.subjects, { slugCn });
      const branchSummary = branchOneLineSummary(row.source, row.subjects, { slugCn });
      const noise = isMergeSourceNoise(row.source);
      return {
        source: row.source,
        count: row.count,
        branchFeatures,
        branchSummary,
        sampleSubject: branchSummary,
        noise,
      };
    })
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}

/**
 * 发版单「合并来源」表行：业务支全列；噪声折叠为一行。
 * @returns {{ source: string, count: number, summary: string, folded?: boolean }[]}
 */
export function formatMergeSourcesTableRows(mergeSources) {
  const rows = Array.isArray(mergeSources) ? mergeSources : [];
  const business = [];
  let noiseCount = 0;
  for (const m of rows) {
    const noise = m?.noise === true || isMergeSourceNoise(m?.source);
    if (noise) {
      noiseCount += Number(m?.count) || 1;
      continue;
    }
    business.push({
      source: m.source || "无/未识别",
      count: m.count ?? 1,
      summary: m.branchSummary || m.sampleSubject || m.subject || "",
    });
  }
  if (noiseCount > 0) {
    business.push({
      source: "环境支/未识别（合计）",
      count: noiseCount,
      summary: "（已折叠，见 freeze.mergeSources noise=true）",
      folded: true,
    });
  }
  return business;
}

/** 目录包 SQL 份数告警阈值（不 fail，仅 warning） */
export const BUNDLE_SQL_WARN_COUNT = 40;
export const BUNDLE_SQL_ALERT_COUNT = 100;

/** draft.sql / 包内 sql/ 超阈文案；未超返回 null */
export function bundleSqlVolumeWarning(sqlCount, { context = "draft.sql" } = {}) {
  const n = Number(sqlCount) || 0;
  if (n >= BUNDLE_SQL_ALERT_COUNT) {
    return `${context} 达 ${n} 份（≥${BUNDLE_SQL_ALERT_COUNT}）：疑似准首次/prior 失效，请核对 rename-alias 与基线树后再定版`;
  }
  if (n >= BUNDLE_SQL_WARN_COUNT) {
    return `${context} 达 ${n} 份（≥${BUNDLE_SQL_WARN_COUNT}）：包体偏大，请确认本版 pending SQL 是否过宽`;
  }
  return null;
}

function escCell(v) {
  return String(v ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

/** 点分键 → 嵌套对象 */
export function unflattenKeyValue(obj, dotted, value) {
  const parts = String(dotted).split(".").filter(Boolean);
  if (!parts.length) return;
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== "object" || Array.isArray(cur[p])) {
      cur[p] = {};
    }
    cur = cur[p];
  }
  const leaf = parts[parts.length - 1];
  if (value === "（删除）") cur[leaf] = null;
  else cur[leaf] = value;
}

/**
 * 简单 YAML dump；comments 为点分键 → 中文说明，写在键**上一行** `# …`（与键同缩进）。
 */
export function dumpYaml(obj, indent = 0, { comments = {}, prefix = "" } = {}) {
  const pad = " ".repeat(indent);
  const lines = [];
  if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
    return `${pad}${yamlScalar(obj)}`;
  }
  for (const [k, v] of Object.entries(obj)) {
    const dotted = prefix ? `${prefix}.${k}` : k;
    const comment = comments[dotted]
      ? `${pad}# ${String(comments[dotted]).replace(/\r?\n/g, " ")}`
      : "";
    if (comment) lines.push(comment);
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      lines.push(`${pad}${k}:`);
      const nested = dumpYaml(v, indent + 2, { comments, prefix: dotted });
      if (nested) lines.push(nested);
    } else {
      lines.push(`${pad}${k}: ${yamlScalar(v)}`);
    }
  }
  return lines.join("\n");
}

function yamlScalar(v) {
  if (v == null) return "null";
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  const s = String(v);
  if (s === "") return '""';
  if (/^[\w./@+-]+$/i.test(s) && !/^(true|false|null|yes|no)$/i.test(s)) return s;
  return JSON.stringify(s);
}

/**
 * 配置项按 yml 文件分组，以 yaml 代码块展示；中文说明写在键**上一行**注释。
 */
export function formatConfigAsYamlMd(configRows) {
  const lines = [];
  const rows = configRows || [];
  if (!rows.length) {
    lines.push("（无配置变更）");
    lines.push("");
    lines.push("> 目标 profile = `prod`");
    return lines.join("\n");
  }

  const bySource = new Map();
  for (const r of rows) {
    const src = r.来源 || r.path || "（未知来源）";
    if (!bySource.has(src)) bySource.set(src, []);
    bySource.get(src).push(r);
  }

  for (const [src, list] of bySource) {
    const isYml = /\.ya?ml$/i.test(src);
    lines.push(`#### ${src}`);
    lines.push("");
    if (isYml) {
      const tree = {};
      const comments = {};
      for (const r of list) {
        const key = r.键 || r.key;
        if (!key) continue;
        const val = r.值 !== undefined && r.值 !== "" ? r.值 : r.变更 === "removed" ? "（删除）" : "";
        unflattenKeyValue(tree, key, val);
        const desc = r.说明 || r.description;
        if (desc && desc !== "待补") comments[key] = desc;
      }
      lines.push("```yaml");
      lines.push(dumpYaml(tree, 0, { comments }) || "# （无键）");
      lines.push("```");
    } else {
      lines.push("| 键 | 说明 | 值 | 目标 profile | 已确认 |");
      lines.push("|---|---|---|---|---|");
      for (const r of list) {
        lines.push(
          `| ${escCell(r.键)} | ${escCell(r.说明 || "待补")} | ${escCell(r.值)} | prod | ${escCell(r.已确认 || "")} |`
        );
      }
    }
    lines.push("");
  }
  lines.push("> 目标 profile = `prod`。允许含密文。键上一行 `#` 为中文说明。");
  return lines.join("\n");
}

/**
 * 从 AGENTS.md / README 抽一句话模块说明。
 * moduleKey 为目录名或「其它」；优先读该模块下文档，否则仓根。
 * moduleBlurbs：兜底文案表注入（缺省 DEFAULT_REPO_PROFILE.moduleBlurbs；目标仓 repo-profile.json 可覆盖）。
 */
export function loadModuleBlurb(root, moduleKey, moduleBlurbs = DEFAULT_REPO_PROFILE.moduleBlurbs) {
  const key = String(moduleKey || "").replace(/\/$/, "");
  const candidates = [];
  if (key && key !== "其它" && key !== "docs") {
    candidates.push(`${key}/AGENTS.md`, `${key}/README.md`);
  }
  candidates.push("AGENTS.md", "README.md");

  for (const rel of candidates) {
    const full = path.join(root, rel);
    let text;
    try {
      text = stripBom(fs.readFileSync(full, "utf8"));
    } catch {
      continue;
    }
    const duty = text.match(/\|\s*职责\s*\|\s*([^|\n]+)\|/);
    if (duty) return oneSentence(duty[1]);
    const mono = text.match(/^Monorepo:\s*(.+)$/m);
    if (mono) return oneSentence(mono[1]);
    const first = text.match(/^#\s+.+\n+>\s*(.+)$/m) || text.match(/^#\s+.+\n\n([^\n#]+)/m);
    if (first) return oneSentence(first[1]);
  }
  const blurbs = moduleBlurbs || DEFAULT_REPO_PROFILE.moduleBlurbs;
  if (key && blurbs[key]) return blurbs[key];
  if (key === "其它" || !key) return blurbs["其它"] || "仓库其它路径（文档、脚手架、配置等）";
  return `${key} 模块`;
}

function oneSentence(s) {
  let t = String(s || "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const m = t.match(/^[^。；\n]{8,120}[。；]?/);
  if (m) return m[0].replace(/[；]$/, "。");
  if (t.length > 80) t = `${t.slice(0, 78)}…`;
  return t;
}

/** 包内附属：相对发版单 md 的可点击链接 */
export function bundleLinkCell(bundlePath) {
  const rel = String(bundlePath || "").replace(/\\/g, "/");
  if (!rel || rel === "无") return "无";
  const name = rel.split("/").pop() || rel;
  return `[${name}](./${rel})`;
}

function normMigrationPath(p) {
  return String(p || "").replace(/\\/g, "/");
}

function migrationBaseName(p) {
  const n = normMigrationPath(p);
  return n.split("/").pop() || n;
}

/**
 * SQL 收紧：migration `Vdddd__…` 或现行 `Vdddd_d__DDL|DML__…`；须在 db/migration 下。
 */
export function isMigrationSql(filePath) {
  const n = normMigrationPath(filePath);
  const base = migrationBaseName(n);
  const nameOk = /^V\d+(_\d+)?__.+\.sql$/i.test(base);
  return nameOk && n.includes("db/migration");
}

/** 主版本号（忽略子序号）；无法解析则 null */
export function migrationVersion(filePath) {
  const base = migrationBaseName(filePath);
  const m = base.match(/^V(\d+)(?:_(\d+))?__/i);
  return m ? Number(m[1]) : null;
}

/** SQL序：四位主号*10 + 子序号（旧格式无子号视为 0） */
export function migrationSortKey(filePath) {
  const base = migrationBaseName(filePath);
  const m = base.match(/^V(\d+)(?:_(\d+))?__/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Number(m[1]) * 10 + (m[2] != null ? Number(m[2]) : 0);
}

/**
 * prior/baseline 去重用 canonical id：`_0` 与无子号等价；`_1+` 保留。
 * 例：V0001__DDL__x.sql ≡ V0001_0__DDL__x.sql → V0001__DDL__x.sql
 */
export function migrationCanonicalId(nameOrPath) {
  const base = migrationBaseName(nameOrPath);
  const m = base.match(/^V(\d+)(?:_(\d+))?__(.+)$/i);
  if (!m) return base;
  const major = m[1];
  const minor = m[2] != null ? Number(m[2]) : 0;
  const rest = m[3];
  if (minor === 0) return `V${major}__${rest}`;
  return `V${major}_${minor}__${rest}`;
}

/** 把原始名与 canonical 一并入 Set，供 prior/baseline 命中 */
export function migrationAliasSet(names) {
  const out = new Set();
  for (const n of names || []) {
    const base = migrationBaseName(n);
    if (!base) continue;
    out.add(base);
    out.add(migrationCanonicalId(base));
  }
  return out;
}

/**
 * 按文件名归类 DDL|DML（整理用）。
 * 1) `__DDL__`/`__DML__` 字面量优先；
 * 2) 新轨 `V{ts≥10位}_{0|1}__` → _0=DDL _1=DML；
 * 3) 旧四位子号不作类型 → null。
 * @returns {"DDL"|"DML"|null}
 */
export function classifyMigrationKindByFilename(nameOrPath) {
  const base = migrationBaseName(nameOrPath);
  if (/__DDL__/i.test(base)) return "DDL";
  if (/__DML__/i.test(base)) return "DML";
  const tsType = base.match(/^V(\d{10,})_(0|1)__/i);
  if (tsType) return tsType[2] === "0" ? "DDL" : "DML";
  return null;
}

/** 发版日期 YYYY-MM-DD → yyMMdd；非法则 null */
export function releaseDateToYyMmDd(releaseDate) {
  const m = String(releaseDate || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return `${m[1].slice(2)}${m[2]}${m[3]}`;
}

/**
 * 整理文件名：`release-V{yyMMdd}-DDL.sql` / `-DML.sql`
 * @param {string} releaseDate YYYY-MM-DD
 * @param {"DDL"|"DML"} kind
 */
export function releaseSqlBundleName(releaseDate, kind) {
  const ymd = releaseDateToYyMmDd(releaseDate);
  if (!ymd) throw new Error(`invalid releaseDate for sql bundle: ${releaseDate}`);
  const k = String(kind || "").toUpperCase();
  if (k !== "DDL" && k !== "DML") throw new Error(`invalid sql bundle kind: ${kind}`);
  return `release-V${ymd}-${k}.sql`;
}

/** 拼接分隔注释（不改源 SQL 正文） */
export function sqlBundleSeparator(basename, which = "begin") {
  const bn = migrationBaseName(basename);
  if (which === "end") return `-- <<< end: ${bn}`;
  return `-- >>> begin: ${bn}`;
}

export function sha256Hex(buf) {
  return createHash("sha256").update(buf == null ? "" : buf).digest("hex");
}

/**
 * 去掉注释与字符串字面量，供分号结构检查（非完整 SQL 解析器）。
 */
export function stripSqlCommentsAndStrings(src) {
  const s = String(src || "");
  let out = "";
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const n = s[i + 1];
    if (c === "-" && n === "-") {
      i += 2;
      while (i < s.length && s[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && n === "*") {
      i += 2;
      while (i < s.length - 1 && !(s[i] === "*" && s[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      const q = c;
      out += " ";
      i++;
      while (i < s.length) {
        if (s[i] === "\\" && q !== "`") {
          i += 2;
          continue;
        }
        if (s[i] === q) {
          if (q === "'" && s[i + 1] === "'") {
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/**
 * 去注释/字符串后，每个非空语句须以 `;` 结束。
 * @returns {{ ok: boolean, message?: string }}
 */
export function assertStatementsEndWithSemicolon(src) {
  const stripped = stripSqlCommentsAndStrings(src);
  const parts = stripped.split(";").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) {
    const onlyNoise = !/\S/.test(stripped);
    if (onlyNoise) return { ok: true };
    return { ok: false, message: "非空 SQL 无完整以 ; 结束的语句" };
  }
  const trimmedSrc = stripSqlCommentsAndStrings(src).trimEnd();
  if (!trimmedSrc.endsWith(";")) {
    return { ok: false, message: "存在不以 ; 结束的非空语句" };
  }
  return { ok: true };
}

/**
 * 按序拼接整理文件内容。
 * @param {{ basename: string, content: string }[]} orderedFiles
 */
export function buildSqlBundleContent(orderedFiles) {
  const chunks = [];
  for (const f of orderedFiles || []) {
    const bn = migrationBaseName(f.basename || f.path || "");
    const body = f.content == null ? "" : String(f.content);
    chunks.push(sqlBundleSeparator(bn, "begin"));
    chunks.push(body.endsWith("\n") ? body.slice(0, -1) : body);
    chunks.push(sqlBundleSeparator(bn, "end"));
    chunks.push("");
  }
  return chunks.join("\n");
}

/**
 * 剥掉 MySQL 列/FK 选项里的 ON UPDATE / ON DELETE 子句，避免误判为 DML 动词。
 * 覆盖到下一逗号、右括号或换行（已 upper 文本）。
 */
export function stripOnUpdateDeleteClauses(upperSql) {
  return String(upperSql || "").replace(
    /\bON\s+(UPDATE|DELETE)\b[^,)\n]*/g,
    " "
  );
}

/** 检测正文是否同时含明显 DDL 与 DML 动词（混合 → 硬失败） */
export function detectMixedDdlDml(src) {
  const stripped = stripOnUpdateDeleteClauses(
    stripSqlCommentsAndStrings(src).toUpperCase()
  );
  const hasDdl =
    /\b(CREATE|ALTER|DROP|TRUNCATE|RENAME)\b/.test(stripped) ||
    /\b(ADD|MODIFY|CHANGE)\s+(COLUMN|INDEX|CONSTRAINT|PRIMARY|UNIQUE|FOREIGN)\b/.test(stripped);
  const hasDml =
    /\b(INSERT|UPDATE|DELETE|REPLACE|MERGE)\b/.test(stripped) ||
    /\b(LOAD\s+DATA)\b/.test(stripped);
  return { hasDdl, hasDml, mixed: hasDdl && hasDml };
}

/** 上线配置路径：application-prod.yml 或 nacos prod overlay（路径段或包内拍平 basename；撞名 __hex 后缀仍放行） */
export function isProdConfigPath(filePath) {
  const n = normMigrationPath(filePath);
  const base = migrationBaseName(n);
  // application-prod.yml | application-prod__deadbe.yml
  if (/^application-prod(__[0-9a-f]+)?\.ya?ml$/i.test(base)) return true;
  // application-prod-nacos.yml | application-prod-nacos__deadbe.yml
  if (/^application-prod-nacos(__[0-9a-f]+)?\.ya?ml$/i.test(base)) return true;
  if (/config\/nacos\//i.test(n) && /^application-prod-nacos(__[0-9a-f]+)?\.ya?ml$/i.test(base)) {
    return true;
  }
  return false;
}

/**
 * 发版单状态归一：trim 后**精确等于** 准备中/已定版/已上线/已取消 之一才返回该值，否则 ""。
 * 模板占位行（如「准备中 | 已定版 | 已上线 | 已取消」）不再被 includes 误判。
 */
export function normalizeNoteStatus(status) {
  const s = String(status ?? "").trim();
  if (s === "准备中" || s === "已定版" || s === "已上线" || s === "已取消") return s;
  return "";
}

/** 从 origin web URL 识别宿主：gitlab | github | other */
export function detectRemoteHost(webUrl) {
  const u = String(webUrl || "").toLowerCase();
  if (!u) return "other";
  if (/github\.com/.test(u)) return "github";
  if (/gitlab\.com|gitlab\./.test(u) || /\/gitlab\b/.test(u)) return "gitlab";
  // 自建常走 GitLab 路径约定；无明确 GitHub 时若含 git@ 已转 web 仍归 other
  return "other";
}

/**
 * 按宿主拼 commits/compare 浏览链接。
 * @param {{ web: string, host?: string, firstRelease?: boolean, base?: string, head?: string }} opts
 */
export function buildRemoteBrowseUrl({ web, host, firstRelease, base, head }) {
  if (!web) return null;
  const hHost = host || detectRemoteHost(web);
  const h = String(head || "").replace(/^origin\//, "");
  const b = String(base || "").replace(/^origin\//, "");
  if (hHost === "github") {
    if (firstRelease) return `${web}/commits/${encodeURIComponent(h)}`;
    return `${web}/compare/${encodeURIComponent(b)}...${encodeURIComponent(h)}`;
  }
  if (hHost === "gitlab") {
    if (firstRelease) return `${web}/-/commits/${encodeURIComponent(h)}`;
    return `${web}/-/compare/${encodeURIComponent(b)}...${encodeURIComponent(h)}`;
  }
  // other：回退仓库根（避免错误 /- 路径）
  return web;
}

/** 定版「完整记录」提示行；host 缺省时从 url 推断 */
export function remoteHintLine(url, host) {
  const h = host || detectRemoteHost(url);
  const label =
    h === "github" ? "GitHub" : h === "gitlab" ? "GitLab" : "远端仓库";
  if (!url) {
    return `> 完整记录请登录 ${label} 查看（未能从 origin 推导链接；请打开仓库 Commits / Compare 页）。`;
  }
  return `> 完整记录请登录 ${label} 查看：${url}`;
}

const DEFAULT_INDEX_HEADER = "| 日期 | 版本身份 | 分支对 | 状态 | 发版单 | 负责人 |";
const DEFAULT_INDEX_SEP = "|---|---|---|---|---|---|";

/** 解析进行中表头 → 列角色下标（cells 含首尾空串，数据列从 1 起） */
export function parseReleasesIndexHeader(headerLine) {
  const cells = String(headerLine || "")
    .split("|")
    .map((c) => c.trim());
  const roles = {};
  for (let i = 1; i < cells.length - 1; i++) {
    const h = cells[i];
    if (!h || /^-+$/.test(h)) continue;
    if (/版本身份/.test(h)) roles.identity = i;
    else if (/上线日期/.test(h)) roles.onlineDate = i;
    else if (/发版日期|^日期$/.test(h)) roles.date = i;
    else if (/分支对/.test(h)) roles.branchPair = i;
    else if (/^状态$/.test(h)) roles.status = i;
    else if (/发版单|路径/.test(h)) roles.note = i;
    else if (/负责人|执行人/.test(h)) roles.owner = i;
  }
  return roles;
}

function buildIndexRowFromRoles(roles, values, colCount) {
  const { date, identity, branchPair, status, noteRel, owner, onlineDate } = values;
  const byRole = {
    date: date || "—",
    onlineDate: onlineDate || date || "—",
    identity,
    branchPair: branchPair || "—",
    status: status || "已定版",
    note: noteRel || "—",
    owner: owner || "—",
  };
  const n = colCount || 6;
  const cells = new Array(n).fill("—");
  for (const [role, idx] of Object.entries(roles)) {
    if (idx == null || idx < 1 || idx > n) continue;
    // roles.identity 等是 split 下标；数据列 = idx（同 header cells 下标）
    const dataIdx = idx - 1; // 0-based among data columns
    if (dataIdx >= 0 && dataIdx < n && byRole[role] != null) cells[dataIdx] = byRole[role];
  }
  // 若未解析到 identity 列，回退 tip 默认：日期|版本身份|…
  if (roles.identity == null) {
    return `| ${byRole.date} | ${byRole.identity} | ${byRole.branchPair} | ${byRole.status} | ${byRole.note} | ${byRole.owner} |`;
  }
  return `| ${cells.join(" | ")} |`;
}

/**
 * upsert docs/releases/releases.md「进行中」表行。
 * 自适应表头列序（tip：日期|版本身份|…；sms-ai：版本身份|发版日期|…|路径|…）。
 * @returns {{ text: string, row: string, updated: boolean }}
 */
export function upsertReleasesIndexRow(
  indexText,
  { date, identity, branchPair, status, noteRel, owner }
) {
  const values = { date, identity, branchPair, status, noteRel, owner };
  const text = String(indexText || "");
  const lines = text.split(/\r?\n/);
  let sectionStart = -1;
  let tableHeader = -1;
  let tableSep = -1;
  let sectionEnd = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (/^##\s*进行中/.test(lines[i].trim())) {
      sectionStart = i;
      break;
    }
  }

  const defaultRoles = parseReleasesIndexHeader(DEFAULT_INDEX_HEADER);
  const defaultRow = buildIndexRowFromRoles(defaultRoles, values, 6);

  if (sectionStart < 0) {
    const block = ["", "## 进行中", "", DEFAULT_INDEX_HEADER, DEFAULT_INDEX_SEP, defaultRow, ""].join(
      "\n"
    );
    return { text: `${text.trimEnd()}\n${block}\n`, row: defaultRow, updated: true };
  }

  for (let i = sectionStart + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i].trim())) {
      sectionEnd = i;
      break;
    }
    if (tableHeader < 0 && /^\|/.test(lines[i]) && /版本身份|日期/.test(lines[i])) {
      // 跳过分隔行
      if (/^\|[\s-|]+$/.test(lines[i].trim())) continue;
      tableHeader = i;
      if (i + 1 < lines.length && /^\|[\s-|]+$/.test(lines[i + 1].trim())) {
        tableSep = i + 1;
      }
    }
  }

  if (tableHeader < 0) {
    const insert = [DEFAULT_INDEX_HEADER, DEFAULT_INDEX_SEP, defaultRow, ""];
    lines.splice(sectionStart + 1, 0, "", ...insert);
    return { text: lines.join("\n"), row: defaultRow, updated: true };
  }

  const roles = parseReleasesIndexHeader(lines[tableHeader]);
  const headerCells = lines[tableHeader].split("|").map((c) => c.trim());
  const colCount = Math.max(0, headerCells.length - 2);
  const row = buildIndexRowFromRoles(roles, values, colCount);
  const idCol = roles.identity != null ? roles.identity : 2;

  const bodyStart = (tableSep >= 0 ? tableSep : tableHeader) + 1;
  const body = [];
  let found = false;
  for (let i = bodyStart; i < sectionEnd; i++) {
    const line = lines[i];
    if (!/^\|/.test(line.trim())) {
      if (line.trim() === "") continue;
      break;
    }
    if (/（暂无）/.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim());
    const idCell = cells[idCol] || "";
    if (idCell === identity) {
      body.push(row);
      found = true;
    } else {
      body.push(line);
    }
  }
  if (!found) body.push(row);

  const before = lines.slice(0, bodyStart);
  const after = lines.slice(sectionEnd);
  const mid = [...body, ""];
  return { text: [...before, ...mid, ...after].join("\n"), row, updated: true };
}

/**
 * 从 docs/releases/releases.md「进行中」表删除指定版本身份行。
 * @returns {{ text: string, removed: boolean, row: string|null }}
 */
export function removeReleasesIndexRow(indexText, identity) {
  const text = String(indexText || "");
  const id = String(identity || "").trim();
  if (!id) return { text, removed: false, row: null };
  const lines = text.split(/\r?\n/);
  let sectionStart = -1;
  let tableHeader = -1;
  let tableSep = -1;
  let sectionEnd = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (/^##\s*进行中/.test(lines[i].trim())) {
      sectionStart = i;
      break;
    }
  }
  if (sectionStart < 0) return { text, removed: false, row: null };

  for (let i = sectionStart + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i].trim())) {
      sectionEnd = i;
      break;
    }
    if (tableHeader < 0 && /^\|/.test(lines[i]) && /版本身份|日期/.test(lines[i])) {
      if (/^\|[\s-|]+$/.test(lines[i].trim())) continue;
      tableHeader = i;
      if (i + 1 < lines.length && /^\|[\s-|]+$/.test(lines[i + 1].trim())) {
        tableSep = i + 1;
      }
    }
  }
  if (tableHeader < 0) return { text, removed: false, row: null };

  const roles = parseReleasesIndexHeader(lines[tableHeader]);
  const idCol = roles.identity != null ? roles.identity : 2;
  const bodyStart = (tableSep >= 0 ? tableSep : tableHeader) + 1;
  const body = [];
  let removedRow = null;
  for (let i = bodyStart; i < sectionEnd; i++) {
    const line = lines[i];
    if (!/^\|/.test(line.trim())) {
      if (line.trim() === "") continue;
      break;
    }
    if (/（暂无）/.test(line)) {
      body.push(line);
      continue;
    }
    const cells = line.split("|").map((c) => c.trim());
    const idCell = cells[idCol] || "";
    if (idCell === id) {
      removedRow = line;
      continue;
    }
    body.push(line);
  }
  if (!removedRow) return { text, removed: false, row: null };
  const before = lines.slice(0, bodyStart);
  const after = lines.slice(sectionEnd);
  const mid = body.length ? [...body, ""] : [""];
  return { text: [...before, ...mid, ...after].join("\n"), removed: true, row: removedRow };
}

/**
 * 追加一行到 docs/releases/ARCHIVE.md（无表则建默认表；适配 tip ARCHIVE 列序）。
 * @returns {{ text: string, row: string, appended: boolean }}
 */
export function appendArchiveRow(
  archiveText,
  { date, identity, branchPair, status, noteRel, owner, onlineDate, executor } = {}
) {
  const releaseDate = date || "—";
  const onDate = onlineDate || date || "—";
  const id = identity || "—";
  const pair = branchPair || "—";
  const st = status || "已上线";
  const note = noteRel || "—";
  const who = executor || owner || "—";
  const text = String(archiveText || "").trimEnd();
  const lines = text ? text.split(/\r?\n/) : [];
  let tableHeader = -1;
  let tableSep = -1;
  for (let i = 0; i < lines.length; i++) {
    if (tableHeader < 0 && /^\|/.test(lines[i]) && /版本身份/.test(lines[i])) {
      if (/^\|[\s-|]+$/.test(lines[i].trim())) continue;
      tableHeader = i;
      if (i + 1 < lines.length && /^\|[\s-|]+$/.test(lines[i + 1].trim())) tableSep = i + 1;
      break;
    }
  }

  const defaultHeader = "| 日期 | 版本身份 | 分支对 | 上线日期 | 执行人 | 发版单 |";
  const defaultSep = "|---|---|---|---|---|---|";

  if (tableHeader < 0) {
    const archiveRow = `| ${releaseDate} | ${id} | ${pair} | ${onDate} | ${who} | ${note} |`;
    const block = ["# docs/releases — 已上线归档索引", "", defaultHeader, defaultSep, archiveRow, ""].join(
      "\n"
    );
    return {
      text: text ? `${text}\n\n${defaultHeader}\n${defaultSep}\n${archiveRow}\n` : block,
      row: archiveRow,
      appended: true,
    };
  }

  const roles = parseReleasesIndexHeader(lines[tableHeader]);
  const headerCells = lines[tableHeader].split("|").map((c) => c.trim());
  const colCount = Math.max(0, headerCells.length - 2);
  const values = {
    date: releaseDate,
    onlineDate: onDate,
    identity: id,
    branchPair: pair,
    status: st,
    noteRel: note,
    owner: who,
  };
  const row = buildIndexRowFromRoles(roles, values, colCount);

  const idCol = roles.identity != null ? roles.identity : 2;
  const bodyStart = (tableSep >= 0 ? tableSep : tableHeader) + 1;
  let found = false;
  for (let i = bodyStart; i < lines.length; i++) {
    if (!/^\|/.test(lines[i].trim())) break;
    if (/（暂无）/.test(lines[i])) {
      lines.splice(i, 1);
      i--;
      continue;
    }
    const cells = lines[i].split("|").map((c) => c.trim());
    if ((cells[idCol] || "") === id) {
      lines[i] = row;
      found = true;
      break;
    }
  }
  if (!found) {
    let insertAt = lines.length;
    for (let i = bodyStart; i < lines.length; i++) {
      if (!/^\|/.test(lines[i].trim()) && lines[i].trim() !== "") {
        insertAt = i;
        break;
      }
      if (/^\|/.test(lines[i].trim())) insertAt = i + 1;
    }
    lines.splice(insertAt, 0, row);
  }
  return { text: lines.join("\n") + (lines[lines.length - 1] === "" ? "" : "\n"), row, appended: true };
}

/**
 * 首次发版 inventory 空层可观测：补 prod/nacos/SyncTaskCode 计数与 layerEmpty。
 * 不改变 layered 收录策略，仅 enrich 已有 inventory + 产出 warnings。
 */
export function enrichFirstReleaseLayerObservability(
  inventory,
  { configKeys = [], jobKeys = [], taskCodes = [] } = {}
) {
  const keys = Array.isArray(configKeys) ? configKeys : [];
  const jobs = Array.isArray(jobKeys) ? jobKeys : [];
  const codes = Array.isArray(taskCodes) ? taskCodes : [];
  // config 与 jobs/cron 键合并统计：jobs/cron 键也是 prod 层配置（防 prod yml 仅 cron 键时误报「prod 层 0 键」）
  const allConfigKeys = [...keys, ...jobs];
  const prodConfigKeyCount = allConfigKeys.filter((k) => k?.source === "application-prod").length;
  const nacosOverlayKeyCount = allConfigKeys.filter((k) => k?.source === "nacos-overlay").length;
  const syncTaskCodeCount = codes.length;
  const layerEmpty = [];
  if (prodConfigKeyCount + nacosOverlayKeyCount === 0) layerEmpty.push("config");
  if (syncTaskCodeCount === 0 && jobs.length === 0) layerEmpty.push("jobs");

  const base = inventory && typeof inventory === "object" ? { ...inventory } : {};
  const enriched = {
    ...base,
    prodConfigKeyCount,
    nacosOverlayKeyCount,
    syncTaskCodeCount,
    layerEmpty,
  };

  const warnings = [];
  if (layerEmpty.includes("config")) {
    warnings.push(
      "prod 层 0 键（未找到 application-prod.yml / nacos overlay 键）"
    );
  }
  if (layerEmpty.includes("jobs")) {
    warnings.push("SyncTaskCode 枚举 0（且无 jobs 键）");
  }
  return { inventory: enriched, warnings };
}
