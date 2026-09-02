/**
 * release-eng 共享格式化：中国时区、元信息内上线摘要（分支级聚合）、mergeSources
 * 中文一句话（origin/ 前缀归一去重）、提交 hash 短码、yml 上一行中文注释、章节编号。
 */
import fs from "fs";
import path from "path";

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

/**
 * 上线内容摘要行：1～5 项，**分支级聚合**（不再简单截取最近 5 条提交）。
 * 先按合并来源逐分支一句话（按出现次数降序），再用直推（非 Merge）提交短句补足；
 * recentFirst=true（首次发版）：直推提交取最近若干条，避免"Initial commit"等最旧提交占位。
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
    if (!m || !m.source || m.source === "无/未识别") continue;
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

/** 分支 slug → 中文业务短语 */
const BRANCH_SLUG_CN = {
  milvus: "Milvus 向量库同步",
  neo4j: "Neo4j 图数据同步",
  harness: "harness-eng 发版脚手架",
  "harness-eng": "harness-eng 发版脚手架",
  qianduan: "前端管理与对话 SPA",
  xxl: "定时任务 / XXL-JOB",
  file: "文件与附件能力",
  mcp: "MCP 工具集成",
  shenzhouwenxue: "问学 / 神州问学对接",
  wenxue: "问学对接",
  feedback: "用户反馈",
  newmodel: "模型配置改造",
  "模型改造": "模型配置改造",
  ui: "前端 UI",
  "code-scaffold": "代码脚手架基线合入",
  scaffold: "代码脚手架",
  release: "发版分支合入",
  test: "测试分支合入",
  s2: "S2 迭代合入",
  ocr: "OCR 文本提取",
  embedding: "Embedding / 向量检索",
  speech: "语音转写",
  supervisor: "Supervisor 智能路由",
  safety: "安全报告填报",
};

/** 从分支名提炼中文功能短语 */
export function featurePhraseFromBranch(source) {
  const raw = String(source || "")
    .replace(/^refs\/remotes\/origin\//, "")
    .replace(/^origin\//, "")
    .trim();
  if (!raw || raw === "无/未识别") return "未识别来源分支";
  const parts = raw.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || raw;
  const slug = last.replace(/^\d{6}-/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  const key = slug.toLowerCase();
  if (BRANCH_SLUG_CN[key]) return BRANCH_SLUG_CN[key];
  if (BRANCH_SLUG_CN[slug]) return BRANCH_SLUG_CN[slug];
  // 含中文的 slug 直接可用
  if (/[\u4e00-\u9fff]/.test(slug)) return slug;
  // 英文连字符拆词查表
  for (const part of slug.split(/[-_]/)) {
    const p = part.toLowerCase();
    if (BRANCH_SLUG_CN[p]) return BRANCH_SLUG_CN[p];
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
export function branchFeaturesFromSubjects(source, subjects, { max = BRANCH_FEATURE_MAX } = {}) {
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
    features.push(featurePhraseFromBranch(source));
  }
  return features.slice(0, max);
}

/**
 * 来源分支功能一句话总结：
 * 分支名命中词表 → 直接用分支级中文短语；未识别 → 取首条可业务化提交说明；兜底给通用短语。
 */
export function branchOneLineSummary(source, subjects) {
  const phrase = featurePhraseFromBranch(source);
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

/** 按推测来源分支去重（origin/ 前缀归一）；产出 branchSummary=一句话 + branchFeatures[]（JSON 兼容） */
export function buildMergeSources(merges) {
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
      const branchFeatures = branchFeaturesFromSubjects(row.source, row.subjects);
      const branchSummary = branchOneLineSummary(row.source, row.subjects);
      return {
        source: row.source,
        count: row.count,
        branchFeatures,
        branchSummary,
        sampleSubject: branchSummary,
      };
    })
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
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
 */
export function loadModuleBlurb(root, moduleKey) {
  const candidates =
    moduleKey === "sms-ai"
      ? ["sms-ai/AGENTS.md", "sms-ai/README.md"]
      : moduleKey === "sms-ai-web"
        ? ["sms-ai-web/AGENTS.md", "sms-ai-web/README.md"]
        : ["AGENTS.md", "README.md"];

  for (const rel of candidates) {
    const full = path.join(root, rel);
    let text;
    try {
      text = fs.readFileSync(full, "utf8");
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
  if (moduleKey === "sms-ai") return "后端 AI Agent 脚手架服务";
  if (moduleKey === "sms-ai-web") return "前端管理与对话 SPA";
  return "仓库其它路径（文档、脚手架、配置等）";
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
