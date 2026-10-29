/**
 * repo-profile — 目标仓可覆盖的源仓硬编码表（release-eng 0.3.32+）。
 *
 * DEFAULT_REPO_PROFILE：七张默认表（原散落在 release-format / release-freeze /
 * release-freeze-enrich / release-note-merge 内的源仓 sms-ai 硬编码）。
 * loadRepoProfile(root)：读目标仓 `docs/releases/repo-profile.json`（UTF-8，
 * 容忍 BOM），深合并覆盖 DEFAULT；文件缺失或解析失败回退 DEFAULT，且不抛错。
 *
 * 自包含：不 import release-format（避免环依赖）；stripBom 本地实现。
 */
import fs from "fs";
import path from "path";

/** 分支 slug → 中文业务短语（原 release-format.mjs BRANCH_SLUG_CN） */
export const DEFAULT_REPO_PROFILE = {
  branchSlugCn: {
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
  },
  /** 基线树 SyncTaskCode.java 兜底读取路径（原 release-freeze.mjs 硬编码 sms-ai 路径） */
  syncTaskCodeFallbackPaths: [
    "sms-ai/src/main/java/com/juneyaoair/msp/sms/ai/domain/enums/sync/SyncTaskCode.java",
  ],
  /** 已知服务/模块清单（原 release-note-merge.mjs inferServices） */
  knownServices: ["sms-ai", "sms-ai-web"],
  /** 配置说明 catalog 候选文件（相对目标仓根；原 release-freeze-enrich.mjs loadConfigDescriptionCatalog） */
  configCatalogFiles: ["sms-ai/README.md", "sms-ai/AGENTS.md", "AGENTS.md"],
  /** 第三方/外部依赖路径关键词（大小写不敏感子串；原 release-freeze.mjs isThirdPartyPath） */
  thirdPartyKeywords: [
    "feign",
    "wenxue",
    "问学",
    "lexiang",
    "乐享",
    "dashscope",
    "/mcp",
    "mcp.json",
  ],
  /** 模块一句话兜底文案（原 release-format.mjs loadModuleBlurb 尾部硬编码） */
  moduleBlurbs: {
    "sms-ai": "后端 AI Agent 脚手架服务",
    "sms-ai-web": "前端管理与对话 SPA",
    "其它": "仓库其它路径（文档、脚手架、配置等）",
  },
  /** 发版单 md 启发式 artifact 键前缀（原 release-freeze-enrich.mjs parseReleaseNoteArtifacts） */
  artifactKeyPrefixes: ["sms.", "agent.", "spring."],
};

function stripBom(text) {
  const s = String(text ?? "");
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function isPlainObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

/** 对象表深合并（覆盖键胜出，默认键保留）；数组/标量整体替换 */
function deepMergeTables(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) return override ?? base;
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    out[k] =
      isPlainObject(v) && isPlainObject(base[k]) ? deepMergeTables(base[k], v) : v;
  }
  return out;
}

/**
 * 读目标仓 repo-profile：docs/releases/repo-profile.json 深合并覆盖 DEFAULT。
 * 文件缺失 / JSON 解析失败 / 非对象 → 原样回退 DEFAULT，不抛错。
 */
export function loadRepoProfile(root) {
  const fallback = DEFAULT_REPO_PROFILE;
  try {
    const p = path.join(root, "docs", "releases", "repo-profile.json");
    if (!fs.existsSync(p)) return fallback;
    const text = stripBom(fs.readFileSync(p, "utf8"));
    const override = JSON.parse(text);
    if (!isPlainObject(override)) return fallback;
    return deepMergeTables(DEFAULT_REPO_PROFILE, override);
  } catch {
    return fallback;
  }
}
