/**
 * Build human-facing `ui` projection from fill-score JSON.
 * 报告壳主键：`ui.report_schema`（现 0.4.2）。≠ skill_version。
 * `ui.version` 仅为兼容别名（= report_schema）；人读/页脚只展示 report_schema，勿当 skill 号。
 * Machine fields stay on `score`; report template prefers `ui.*`.
 * 「建议可以开干」仅绑 ai_coding_ready（非旧 ready.ok）。大仓另看 gold_ratio。
 * 0.4.2：术语人话化（形态分→文档质量分等）+ 决策台总评模块（grade_zh / one_line_zh / parts）；0.4.x 趋势仍可比。
 * 0.4.1：首屏 gap/headline 人话化；blockers_grouped；宿主三态 status_zh。
 * 0.4.0：go_nogo · tasks[] · diagnose.story · ladder_progress · host_surface；趋势 incomparable。
 * 0.3.0 / skill 0.7.0：形态满分 100（探针+深度）；ready.ok 对外废弃；morph_scale。
 * 0.2.26：CJK 正文 · 减动 · 命令一键复制 · Escape/键盘切台 · 尊重 #hash · 参考分降权 · 残差分层。
 */
import {
  knownContractDomainIds,
  domainLabel,
  defaultContractDomains,
} from "./domains.mjs";

export const REPORT_SCHEMA = "0.4.2";
const LADDER_STEPS = ["L0", "L1", "L2", "L3", "L4", "L5"];

/** 施工阶梯悬停说明（与 glossary 一句话对齐） */
const LADDER_TIPS = {
  L0: { name_zh: "协作入口", tip_zh: "根/分册 AGENTS.md、总览规则、Karpathy、harness-meta" },
  L1: { name_zh: "契约骨架", tip_zh: "docs/func|api|db|redis|jobs 索引 + templates + 同步 rules" },
  L2: { name_zh: "知识回流", tip_zh: "docs/agent-kb 四件套 + pitfalls「域」列 + rule 19" },
  L3: { name_zh: "规划与软门禁", tip_zh: "docs/superpowers 进行中表 + commit 软提醒 hooks（不拦截）" },
  L4: { name_zh: "工具连接样例", tip_zh: "mcp.json.example + 说明 + gitignore 忽略真密 mcp.json" },
  L5: { name_zh: "配置 SSOT 管线", tip_zh: "docs/agent-config/ + sync.mjs --check；工具目录为生成物" },
};

const DOMAIN_ZH = {
  api: "接口文档",
  func: "功能文档",
  db: "库表文档",
  redis: "缓存文档",
  jobs: "定时任务",
};

function domainDisplayName(d) {
  if (DOMAIN_ZH[d]) return DOMAIN_ZH[d];
  try {
    return domainLabel(d) || d;
  } catch {
    return d;
  }
}

function contractDomainList(score) {
  const fromScore = Object.keys(score?.domains || {});
  if (fromScore.length) return fromScore;
  return knownContractDomainIds();
}

const MISS_ZH = {
  "has-field-comment": "缺字段说明",
  "has-ttl": "缺 TTL 章节",
  "has-value": "缺 Value 说明",
  "has-evidence": "缺 evidence",
  "has-params": "缺请求参数表",
  "has-response": "缺响应参数",
  "has-logic": "缺功能逻辑",
  "has-method-list": "缺方法清单",
  "missing-req-section": "缺模板必填章",
  "req-desc": "缺功能描述",
  "req-path": "缺接口地址",
  "req-method": "缺请求方式",
  "req-evidence": "缺 evidence",
  "req-logic": "缺功能逻辑",
  "req-params": "缺请求参数表",
  "req-response": "缺响应参数表",
  "req-service": "缺服务类说明",
  "req-methods": "缺方法说明",
  "req-links": "缺关联 API/表",
  "req-ddl": "缺建表/字段",
  "req-fields": "缺字段表",
  "req-business": "缺表业务说明",
  "req-prefix": "缺 Key/前缀",
  "req-value-type": "缺 Value/类型",
  "req-ttl": "缺 TTL",
  "generic-logic-template": "通用四步逻辑模板",
  "dto-unbound": "DTO 错挂/未绑定",
  "dto-unresolved": "DTO 类未解析",
  "jobs-no-id": "缺 task_code / 标识",
  "jobs-no-cron": "缺 Cron 表达式",
  "jobs-no-scheduler": "缺 Scheduler / 调度入口",
  "jobs-no-anchors": "缺代码锚点",
  "jobs-heuristic-in-ssot": "heuristic 误入 SSOT",
  "jobs-heuristic-unmarked": "heuristic 未标 quality",
  "jobs-openapi-dump": "jobs 误含 OpenAPI 字段表",
};

const GLOSSARY = [
  {
    id: "composite_score",
    zh: "总评分",
    en: "composite_score",
    tip: "文档质量分35% · 代码覆盖率25% · 验收通过率20% · 开干清单20% 加权；仅供参考，能否开干只看「可 AI coding」。",
  },
  {
    id: "pipeline_progress",
    zh: "开干清单",
    en: "pipeline_progress",
    tip: "原「开干闸路径」：骨架 → 覆盖 → 补文档计划 → 批次完成 → 语义抽检 → 可 AI coding 六步。",
  },
  {
    id: "host_surface",
    zh: "落地检查",
    en: "host_surface",
    tip: "原「宿主台/宿主面」：各 AI 工具的规则/钩子/MCP 是否真配置进仓库；落地≠生效，不否决开干。",
  },
  {
    id: "gold_ratio",
    zh: "验收通过率",
    en: "gold_ratio",
    tip: "原「金标达标率」gold_ratio：acceptance-check 通过节占比；大仓看局部验收，不替代 ai_coding_ready。",
  },
  {
    id: "ai_coding_ready",
    zh: "可 AI coding",
    en: "ai_coding_ready",
    tip: "skeleton+coverage+semantic+fill-plan 全关才算；仪表盘「开干」只看此项。",
  },
  {
    id: "ready",
    zh: "形态/覆盖就绪（已废弃）",
    en: "ready",
    tip: "0.7.0 起对外废弃；JSON 仍保留 deprecated:true。开干只看 ai_coding_ready。",
  },
  {
    id: "skeleton_ready",
    zh: "骨架就绪",
    en: "skeleton_ready",
    tip: "L4 阶梯与 hooks/MCP example 等必备文件齐。",
  },
  {
    id: "semantic_ready",
    zh: "语义抽检",
    en: "semantic_ready",
    tip: "原「语义闸」semantic_ready：启发式抽检——通用逻辑模板、DTO 错挂等 miss 低于阈。",
  },
  {
    id: "fill_plan",
    zh: "补文档计划",
    en: "fill_plan",
    tip: "原「填充计划」fill_plan：docs/harness-eng/fill-plan.yaml 目标/批次/Done；早停看关闭率。",
  },
  {
    id: "quality",
    zh: "文档质量分",
    en: "quality / overall",
    tip: "原「形态分」quality/overall：真相写得像不像模板，不是业务正确性分数。",
  },
  {
    id: "coverage",
    zh: "代码覆盖率",
    en: "coverage",
    tip: "原「覆盖」coverage：已文档化条目 ÷ inventory 扫到的条目。",
  },
  {
    id: "formula_ceiling",
    zh: "理论上限",
    en: "formula_ceiling",
    tip: "原「公式上限」formula_ceiling：当前打分规则理论顶≈100；到顶后走 agents，勿空追。",
  },
  {
    id: "domain_caps",
    zh: "各域上限",
    en: "domain_caps",
    tip: "原「分域上限」domain_caps：各域文档质量分理论顶（0.7 起均为 100）。",
  },
  {
    id: "morph_scale",
    zh: "评分尺度",
    en: "morph_scale",
    tip: "原「形态尺度」morph_scale：0.7=探针≈75+深度≈25；与 0.6.x 历史 overall 不可比。",
  },
  {
    id: "miss_histogram",
    zh: "常见缺口分布",
    en: "miss_histogram",
    tip: "哪类检查项最常未通过（如缺字段说明）。",
  },
  {
    id: "next_shards",
    zh: "下一批补文档任务",
    en: "next_shards",
    tip: "建议下一批要补的接口/模块任务。",
  },
  {
    id: "warning_shards",
    zh: "验收遗留项",
    en: "warning_shards",
    tip: "原「残差」warning_shards：验收批次已关后仍可能剩 acceptance warnings；用 fill-plan --residual 清。",
  },
  {
    id: "coverage_ready",
    zh: "覆盖就绪",
    en: "coverage_ready",
    tip: "相对 inventory 与 score-policy 的覆盖闸；不替代 ai_coding_ready。",
  },
  {
    id: "gap_to_ready",
    zh: "距门槛差距",
    en: "gap_to_ready",
    tip: "相对 ready 质量/覆盖门槛还差多少。",
  },
  {
    id: "score_history",
    zh: "评分历史",
    en: "score-history",
    tip: "docs/harness-eng/score-history.jsonl 追加的历次 overall/coverage/ready。",
  },
  {
    id: "suggest_upgrade",
    zh: "建议升阶",
    en: "suggest_upgrade",
    tip: "根据 ready / 阶梯 meta，建议下一 harness 阶或继续补契约。",
  },
  {
    id: "template_completeness",
    zh: "模板完整度",
    en: "template_completeness",
    tip: "真相是否含模板必填章（启发式）；贴理论上限但此项低 → fill-truths-agents，勿空追文档质量分。",
  },
];

/** Resolve --root for shell commands; placeholder when unknown. */
function cmdRoot(root) {
  const r = root != null && String(root).trim() ? String(root).trim() : "";
  return r || "<TARGET>";
}

function domainsCsv(score, meta) {
  const fromMeta = Array.isArray(meta?.domains) ? meta.domains.filter(Boolean) : [];
  if (fromMeta.length) return fromMeta.join(",");
  const fromScore = contractDomainList(score).filter((d) => score?.domains?.[d] != null);
  if (fromScore.length) return fromScore.join(",");
  try {
    return defaultContractDomains().join(",");
  } catch {
    return "api,func,db,redis,jobs";
  }
}

function preferredInventoryDomain(score, meta) {
  const gaps = score?.coverage_ready?.gaps;
  if (Array.isArray(gaps) && gaps.length && gaps[0]?.domain) return String(gaps[0].domain);
  const metaD = Array.isArray(meta?.domains) ? meta.domains : [];
  if (metaD.includes("api")) return "api";
  if (metaD[0]) return metaD[0];
  return "api";
}

function preferredAcceptanceDomain(score) {
  const stories = [];
  for (const d of contractDomainList(score)) {
    const x = score.domains?.[d];
    const q = score.quality?.domains?.[d] ?? x?.score;
    const cap = score.domain_caps?.[d];
    if (typeof q === "number" && typeof cap === "number") {
      stories.push({ d, room: Math.max(0, cap - q) });
    }
  }
  stories.sort((a, b) => b.room - a.room);
  if (stories[0]?.d) return stories[0].d;
  if (score?.domains?.api) return "api";
  const ids = contractDomainList(score);
  return ids[0] || "api";
}

function warningShardCount(score) {
  return Array.isArray(score?.warning_shards) ? score.warning_shards.length : 0;
}

function hasResidualHint(score) {
  if (warningShardCount(score) > 0) return true;
  const blockers = Array.isArray(score?.ai_coding_ready?.blockers)
    ? score.ai_coding_ready.blockers
    : [];
  return blockers.some((b) => String(b).startsWith("acceptance_warnings:"));
}

function residualCommand(root, score) {
  const gold =
    typeof score?.gold_ratio === "number" ||
    score?.gate_profile === "gold" ||
    score?.score_policy?.gate_profile === "gold";
  return `node scripts/fill-plan.mjs --root ${cmdRoot(root)}${gold ? " --residual --gold" : " --residual"}`;
}

function buildTasksEmptyHint(score) {
  const blockers = Array.isArray(score?.ai_coding_ready?.blockers)
    ? score.ai_coding_ready.blockers
    : [];
  if (blockers.includes("fill_plan_missing")) {
    return "暂无任务：先 fill-plan --init，再 inventory / agents。";
  }
  if (score?.ready?.coverage_incomplete) {
    return "暂无任务：先跑 fill-inventory.mjs --domain <域> 生成 inventory。";
  }
  if (hasResidualHint(score) && !(score?.next_shards?.length)) {
    return "无 next_shards；有验收遗留项 → 见上方遗留卡或 fill-plan --residual。";
  }
  return "暂无任务。先完成 fill-plan / inventory 后再看本台。";
}

function domainStatus(score, d) {
  const x = score.domains?.[d];
  const q = score.quality?.domains?.[d] ?? x?.score;
  const cap = score.domain_caps?.[d];
  const cov = score.coverage_by_domain?.[d];
  const incomplete = score.ready?.coverage_incomplete && d === "api";

  if (incomplete || (cov && cov.ratio == null && !x)) {
    return { tone: "warn", label: "缺代码清单或缺覆盖率数据" };
  }
  if (typeof q === "number" && typeof cap === "number" && q >= cap - 1) {
    return { tone: "ok", label: "已达理论上限" };
  }
  if (cov && typeof cov.percent === "number" && cov.percent < 60) {
    return { tone: "warn", label: "代码覆盖率仍可补" };
  }
  if (x && typeof x.shells === "number" && x.shells > 0) {
    return { tone: "warn", label: `约 ${x.shells} 个空壳` };
  }
  if (typeof q === "number" && q >= 70) {
    return { tone: "ok", label: "文档质量达标" };
  }
  return { tone: "warn", label: "建议继续补文档" };
}

/** Short domain id → display for morph_floor / coverage tips. */
const DOMAIN_SHORT_ZH = {
  api: "接口",
  func: "功能域",
  db: "库表",
  redis: "缓存",
  jobs: "定时任务",
};

/**
 * Group machine blocker IDs into human-readable buckets for first-screen UI.
 * Raw IDs stay in `ids`; never dump path/method strings into summary.
 * @param {string[]} blockers
 * @returns {{ groups: Array<{id:string,label_zh:string,count:number,ids:string[]}>, summary_zh: string, headline_bits: string[] }}
 */
export function humanizeBlockers(blockers) {
  const list = Array.isArray(blockers) ? blockers.map(String) : [];
  const buckets = {
    skeleton: { id: "skeleton", label_zh: "骨架未就绪", ids: [] },
    coverage: { id: "coverage", label_zh: "代码覆盖率未达标", ids: [] },
    semantic: { id: "semantic", label_zh: "语义抽检", ids: [] },
    fill_plan: { id: "fill_plan", label_zh: "补文档计划", ids: [] },
    drift: { id: "drift", label_zh: "文档漂移", ids: [] },
    morph: { id: "morph", label_zh: "文档质量未过线", ids: [] },
    acceptance: { id: "acceptance", label_zh: "验收（金标）", ids: [] },
    other: { id: "other", label_zh: "其他缺口", ids: [] },
  };

  for (const b of list) {
    if (b === "skeleton_ready") buckets.skeleton.ids.push(b);
    else if (b === "coverage_ready") buckets.coverage.ids.push(b);
    else if (b === "semantic_ready") buckets.semantic.ids.push(b);
    else if (b.startsWith("fill_plan_")) buckets.fill_plan.ids.push(b);
    else if (/^doc_\w+_drift:/.test(b)) buckets.drift.ids.push(b);
    else if (
      /^(morph_floor|template_completeness|harness_todo):/.test(b)
    ) {
      buckets.morph.ids.push(b);
    } else if (
      /^(acceptance_blockers|acceptance_warnings|gold_ratio):/.test(b)
    ) {
      buckets.acceptance.ids.push(b);
    } else {
      buckets.other.ids.push(b);
    }
  }

  const order = [
    "skeleton",
    "coverage",
    "semantic",
    "fill_plan",
    "drift",
    "morph",
    "acceptance",
    "other",
  ];
  const groups = [];
  const summaryParts = [];
  const headlineBits = [];

  for (const key of order) {
    const buck = buckets[key];
    if (!buck.ids.length) continue;
    const count = buck.ids.length;
    let label = buck.label_zh;
    if (key === "drift") label = `文档漂移×${count}`;
    else if (key === "morph") {
      const mf = buck.ids.find((x) => x.startsWith("morph_floor:"));
      const domains = mf
        ? String(mf)
            .replace(/^morph_floor:/, "")
            .split(",")
            .map((p) => p.split(":")[0])
            .filter(Boolean)
        : [];
      const domTip = domains.length
        ? domains.map((d) => DOMAIN_SHORT_ZH[d] || d).join("/")
        : "";
      label = domTip ? `文档质量未过线（${domTip}）` : "文档质量未过线";
    } else if (key === "acceptance") {
      const hasBlock = buck.ids.some((x) => x.startsWith("acceptance_blockers:"));
      const hasWarn = buck.ids.some((x) => x.startsWith("acceptance_warnings:"));
      if (hasBlock && hasWarn) label = "验收有 blocker/warning";
      else if (hasBlock) label = "验收有 blocker";
      else if (hasWarn) label = "验收有 warning";
      else label = "验收未过";
    } else if (key === "fill_plan") {
      if (buck.ids.includes("fill_plan_missing")) label = "缺补文档计划";
      else if (buck.ids.includes("fill_plan_open_batches")) label = "补文档计划批次未完成";
    } else if (key === "other" && count > 1) {
      label = `其他缺口×${count}`;
    }
    groups.push({ id: buck.id, label_zh: label, count, ids: buck.ids });
    summaryParts.push(label);
    if (headlineBits.length < 3) headlineBits.push(label);
  }

  const summary_zh = summaryParts.length
    ? "距开干：" + summaryParts.join("、")
    : "距开干：仍有缺口（见诊断台）";

  return { groups, summary_zh, headline_bits: headlineBits };
}

/** Humanize morph_floor:func:87<95,api:89<95 → 功能域 87<95、接口 89<95 */
function formatMorphFloorDetail(raw) {
  const body = String(raw).replace(/^morph_floor:/, "");
  const parts = body.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return "文档质量分未过线，按拖后腿域补模板章/列密度，再 fill-score。";
  const bits = parts.map((p) => {
    const [dom, rest] = p.split(":");
    const name = DOMAIN_SHORT_ZH[dom] || dom;
    return rest ? `${name} ${rest}` : name;
  });
  return `${bits.join("、")}。按拖后腿域补模板章/列密度，再 fill-score。`;
}

function buildHeadline(score) {
  const aiOk = !!score.ai_coding_ready?.ok;
  const overall = score.overall;
  const ceil = score.formula_ceiling;
  const atCeil =
    typeof overall === "number" && typeof ceil === "number" && overall >= ceil - 1;
  const blockers = Array.isArray(score.ai_coding_ready?.blockers)
    ? score.ai_coding_ready.blockers
    : [];
  const plan = score.fill_plan;
  const openBatches = plan?.open_total;

  if (aiOk) {
    return "开干=YES：建议可以开干；仍须人工审契约与代码。";
  }

  const gateBlockers = blockers.filter((b) =>
    /^(morph_floor|harness_todo|acceptance_blockers|acceptance_warnings|gold_ratio|template_completeness):/.test(
      String(b)
    )
  );
  if (gateBlockers.length) {
    const { headline_bits } = humanizeBlockers(gateBlockers);
    const tip = headline_bits.length ? headline_bits.join(" · ") : "文档质量/验收闸未过";
    const line = `开干=NO · ${tip}。见任务台对应 fill 建议。`;
    return line.length > 80 ? line.slice(0, 77) + "…" : line;
  }
  if (
    typeof score.gold_ratio === "number" &&
    score.gold_ratio < 0.6 &&
    (score.acceptance?.blockers > 0 || score.acceptance?.status === 1)
  ) {
    return "开干=NO · 验收通过率偏低且有验收阻断项；先按 truth-quality 精修。";
  }
  if (blockers.includes("fill_plan_missing")) {
    return "开干=NO：缺 fill-plan → 先 --init，再按批次 fill-truths-agents。";
  }
  if (blockers.includes("fill_plan_open_batches") || (plan?.present && openBatches > 0)) {
    return `开干=NO：fill-plan 仍有开放批次≈${openBatches ?? "?"}；继续 agents。`;
  }
  if (blockers.includes("semantic_ready") || score.semantic_ready?.ok === false) {
    return "开干=NO：语义抽检未过（通用逻辑模板 / DTO 错挂）；按接口重填后再打分。";
  }
  if (blockers.includes("skeleton_ready") || score.skeleton_ready?.ok === false) {
    return "开干=NO：骨架未就绪 → upgrade/resume 到 L4。";
  }
  if (blockers.includes("coverage_ready")) {
    return "开干=NO：代码覆盖率未达标（见分域 coverage_gaps）；按域补 inventory/批次。";
  }
  if (blockers.length) {
    const { headline_bits } = humanizeBlockers(blockers);
    const tip = headline_bits.length ? headline_bits.join(" · ") : "仍有缺口";
    const line = `开干=NO · ${tip}。见任务台。`;
    return line.length > 80 ? line.slice(0, 77) + "…" : line;
  }
  if (score.ready?.coverage_incomplete) {
    return "缺 inventory，覆盖率不完整；先 inventory → fill-plan → agents。";
  }
  if (atCeil) {
    return "文档质量分已达理论上限，但开干未达；请关 Plan / 过语义抽检 / 清闸门，勿空追分数。";
  }
  return "开干=NO；请按 fill-plan 批次 fill-truths-agents 后打分。";
}

function buildVerdict(score) {
  const aiOk = !!score.ai_coding_ready?.ok;
  if (aiOk) {
    return {
      ready_ok: true,
      ai_coding_ready: true,
      ready_label: "建议可以开干",
      ready_hint: "可 AI coding 已达标；可用 AI 协助改业务，仍须人工审契约与代码。",
    };
  }
  return {
    ready_ok: false,
    ai_coding_ready: false,
    ready_label: "建议暂缓",
    ready_hint: "先推进补文档计划并过语义抽检；能否开干只看「可 AI coding」。",
  };
}

/** 决策台 KPI：开干判定 + 条件验收 + 四态参考灯（不决定开干） */
function buildDecisionKpis(score) {
  const aiOk = !!score.ai_coding_ready?.ok;
  const kpis = [
    {
      id: "ai_coding_ready",
      label_zh: "可 AI coding",
      value: aiOk ? "是" : "否",
      sub: "开干只看此项",
      tone: aiOk ? "ok" : "no",
    },
  ];
  if (typeof score.gold_ratio === "number") {
    kpis.push({
      id: "gold_ratio",
      label_zh: "验收通过率",
      value: Math.round(score.gold_ratio * 1000) / 10 + "%",
      sub:
        score.gold_ratio < 0.6
          ? "偏低 · 请清验收阻断项"
          : "验收参考 · 不替代开干灯",
      tone: score.gold_ratio < 0.6 ? "warn" : "ok",
    });
  }
  const skOk = score.skeleton_ready?.ok;
  kpis.push({
    id: "skeleton_ready",
    label_zh: "骨架",
    value: skOk === true ? "是" : skOk === false ? "否" : "—",
    sub: "参考灯 · 不决定开干",
    tone: skOk === true ? "ok" : skOk === false ? "warn" : "",
  });
  const covOk = score.coverage_ready?.ok;
  kpis.push({
    id: "coverage_ready",
    label_zh: "覆盖就绪",
    value: covOk === true ? "是" : covOk === false ? "否" : "—",
    sub: "参考灯 · 不决定开干",
    tone: covOk === true ? "ok" : covOk === false ? "warn" : "",
  });
  const semOk = score.semantic_ready?.ok;
  kpis.push({
    id: "semantic_ready",
    label_zh: "语义",
    value: semOk === true ? "是" : semOk === false ? "否" : "—",
    sub: "参考灯 · 不决定开干",
    tone: semOk === true ? "ok" : semOk === false ? "warn" : "",
  });
  const plan = score.fill_plan;
  let planVal = "—";
  let planTone = "";
  if (plan?.present === false || plan == null) {
    planVal = "缺";
    planTone = "warn";
  } else if (typeof plan.open_total === "number") {
    if (plan.open_total === 0) {
      planVal = "已关";
      planTone = "ok";
    } else {
      planVal = "开" + plan.open_total;
      planTone = "warn";
    }
  } else if (plan?.present) {
    planVal = "有";
    planTone = "ok";
  }
  kpis.push({
    id: "fill_plan",
    label_zh: "Plan",
    value: planVal,
    sub: "参考灯 · 不决定开干",
    tone: planTone,
  });
  return kpis;
}

/** 诊断台形态条：仅形态轴（overall / ceiling / template_completeness） */
function buildMorphStrip(score) {
  const overall = typeof score.overall === "number" ? score.overall : null;
  const ceil =
    typeof score.formula_ceiling === "number" ? score.formula_ceiling : null;
  const tc =
    typeof score.template_completeness?.overall === "number"
      ? score.template_completeness.overall
      : null;
  const items = [];
  if (overall != null) {
    items.push({
      id: "quality",
      label_zh: "文档质量分",
      value: overall + "%",
      sub: ceil != null ? "上限约 " + ceil + "%" : "像不像模板",
    });
  }
  if (ceil != null) {
    items.push({
      id: "ceiling",
      label_zh: "理论上限",
      value: "~" + ceil + "%",
      sub: "到顶后转 agents 精修",
    });
  }
  if (tc != null) {
    items.push({
      id: "template_completeness",
      label_zh: "模板完整度",
      value: tc + "%",
      sub: "必填章启发式",
    });
  }
  return items;
}

/**
 * 0.8.2 patch (D8): gate-aligned coverage percent — prefers the same aggregate
 * the coverage_ready gate uses (coverage_ready.all_percent), falls back to the
 * legacy API-scoped coverage.percent for old reports.
 */
function gateCoveragePercent(score) {
  const all = score?.coverage_ready?.all_percent;
  if (typeof all === "number") return all;
  const legacy = score?.coverage?.percent;
  return typeof legacy === "number" ? legacy : null;
}

/** 0.8.2 patch (D8): true when gateCoveragePercent resolved from the gate scope. */
function coverageIsGateScope(score) {
  return typeof score?.coverage_ready?.all_percent === "number";
}

/** 0.8.2 patch (D8): gate-aligned ratio (effective_ratio first, legacy fallback). */
function gateCoverageRatio(score) {
  const er = score?.coverage_ready?.effective_ratio;
  if (typeof er === "number") return er;
  const r = score?.coverage?.ratio;
  if (typeof r === "number") return r;
  const p = score?.coverage?.percent;
  return typeof p === "number" ? p / 100 : null;
}

/** 覆盖条：与形态条分列（三词名实） */
function buildCoverageStrip(score) {
  const covP = gateCoveragePercent(score);
  if (covP == null) return [];
  const covered = score.coverage?.covered;
  const code = score.coverage?.code;
  const mode = score.coverage_ready?.mode || score.score_policy?.coverage_mode;
  const scopeNote = coverageIsGateScope(score) ? "按分域口径" : "相对 inventory";
  return [
    {
      id: "coverage",
      label_zh: "代码覆盖率",
      value: covP + "%",
      sub:
        (covered != null && code != null && !coverageIsGateScope(score)
          ? covered + " / " + code
          : scopeNote) +
        (mode ? " · mode=" + mode : ""),
    },
  ];
}

function buildGapToReady(score) {
  const rq = score.ready?.ready_quality ?? 70;
  const rc =
    typeof score.ready?.ready_coverage === "number"
      ? score.ready.ready_coverage
      : 0.6;
  const overall = typeof score.overall === "number" ? score.overall : null;
  // 0.8.2 patch (D8): gap-to-ready must measure against the gate scope.
  const covRatio = gateCoverageRatio(score);

  const qualityGap =
    overall == null ? null : Math.max(0, Math.round((rq - overall) * 10) / 10);
  const coverageGap =
    covRatio == null ? null : Math.max(0, Math.round((rc - covRatio) * 1000) / 1000);
  const coverageGapPct =
    coverageGap == null ? null : Math.round(coverageGap * 1000) / 10;

  const blockers = Array.isArray(score.ai_coding_ready?.blockers)
    ? score.ai_coding_ready.blockers
    : [];
  const grouped = humanizeBlockers(blockers);
  let summary = "";
  if (score.ai_coding_ready?.ok) {
    summary = "已达 ai_coding_ready。";
  } else if (blockers.length) {
    summary = grouped.summary_zh;
  } else if (score.ready?.coverage_incomplete) {
    summary = "缺 inventory，覆盖门槛无法完整判定。";
  } else if (score.ready?.ok) {
    summary = "形态/覆盖已就绪；仍差语义或 fill-plan。";
  } else {
    const bits = [];
    if (qualityGap != null && qualityGap > 0) bits.push(`文档质量分还差约 ${qualityGap} 分`);
    if (coverageGapPct != null && coverageGapPct > 0) {
      bits.push(`代码覆盖率还差约 ${coverageGapPct}%`);
    }
    summary = bits.length ? bits.join("；") : "尚未达标，请查看分域与缺口。";
  }

  return {
    ready_quality: rq,
    ready_coverage: rc,
    quality_gap: qualityGap,
    coverage_gap: coverageGap,
    coverage_gap_percent: coverageGapPct,
    ai_coding_blockers: blockers,
    blockers_grouped: grouped.groups,
    summary_zh: summary,
    at_ceiling:
      typeof overall === "number" &&
      typeof score.formula_ceiling === "number" &&
      overall >= score.formula_ceiling - 1,
    summary,
  };
}

function buildMissTop(score) {
  const miss = score.miss_histogram || {};
  return Object.keys(miss)
    .map((k) => ({
      id: k,
      label_zh: MISS_ZH[k] || k,
      count: miss[k],
    }))
    .filter((x) => typeof x.count === "number" && x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function buildGapsTop(score) {
  const gaps = Array.isArray(score.gaps) ? score.gaps : [];
  return gaps.slice(0, 10).map((g) => ({
    domain: g.domain || "",
    domain_zh: domainDisplayName(g.domain || ""),
    path: g.path || "",
    score: g.score ?? null,
    issues: Array.isArray(g.issues) ? g.issues.slice(0, 3) : [],
  }));
}

function buildDomainStories(score) {
  const stories = [];
  for (const d of contractDomainList(score)) {
    const x = score.domains?.[d];
    const q = score.quality?.domains?.[d] ?? x?.score;
    if (x == null && q == null) continue;
    const cap = score.domain_caps?.[d];
    const cov = score.coverage_by_domain?.[d];
    const st = domainStatus(score, d);
    const room =
      typeof q === "number" && typeof cap === "number"
        ? Math.max(0, Math.round((cap - q) * 10) / 10)
        : null;
    let story = st.label;
    if (room != null && room > 1) story += `；距上限约 ${room} 分`;
    if (typeof cov?.percent === "number") story += `；覆盖 ${cov.percent}%`;
    if (x?.shells > 0) story += `；空壳 ${x.shells}`;
    stories.push({
      id: d,
      name_zh: domainDisplayName(d),
      score: typeof q === "number" ? q : null,
      cap: cap ?? null,
      room,
      coverage_percent: cov?.percent ?? null,
      tone: st.tone,
      status_label: st.label,
      story,
    });
  }
  return stories.sort((a, b) => {
    const ra = a.room == null ? -1 : a.room;
    const rb = b.room == null ? -1 : b.room;
    return rb - ra;
  });
}

function buildChartDomains(score) {
  const labels = [];
  const labels_zh = [];
  const quality = [];
  const caps = [];
  for (const d of contractDomainList(score)) {
    const x = score.domains?.[d];
    const q = score.quality?.domains?.[d] ?? x?.score;
    if (x == null && q == null) continue;
    labels.push(d);
    labels_zh.push(domainDisplayName(d));
    quality.push(typeof q === "number" ? q : 0);
    caps.push(
      typeof score.domain_caps?.[d] === "number" ? score.domain_caps[d] : 100
    );
  }
  return { labels, labels_zh, quality, caps };
}

function buildNextActions(score, opts = {}) {
  const actions = [];
  const root = opts.root;
  const meta = opts.meta || {};
  const R = cmdRoot(root);
  const aiOk = !!score.ai_coding_ready?.ok;
  const blockers = Array.isArray(score.ai_coding_ready?.blockers)
    ? score.ai_coding_ready.blockers
    : [];
  const overall = score.overall;
  const ceil = score.formula_ceiling;
  const atCeil =
    typeof overall === "number" && typeof ceil === "number" && overall >= ceil - 1;
  const accDomain = preferredAcceptanceDomain(score);
  const invDomain = preferredInventoryDomain(score, meta);
  const domCsv = domainsCsv(score, meta);

  if (aiOk) {
    actions.push({
      title: "可开始业务改动（人工审契约）",
      detail: "ai_coding_ready=true。文档质量分到顶时勿空追分数（尺度 0.7）。",
      command: null,
    });
    if (hasResidualHint(score) && actions.length < 3) {
      const n = warningShardCount(score);
      actions.push({
        title: "清验收遗留项（--residual）",
        detail:
          (n ? `warning_shards×${n}。` : "") +
          "开干 YES 仍建议清 warnings；见任务台验收遗留卡。",
        command: residualCommand(root, score),
      });
    }
    return actions.slice(0, 3);
  }

  if (blockers.includes("fill_plan_missing")) {
    actions.push({
      title: "初始化 fill-plan",
      detail: "建立目标与批次后再 agents 精填。",
      command: `node scripts/fill-plan.mjs --root ${R} --init --domains ${domCsv}`,
    });
  } else if (blockers.includes("fill_plan_open_batches")) {
    actions.push({
      title: "按 Plan 批次继续多 Agent 精填",
      detail: `开放批次≈${score.fill_plan?.open_total ?? "?"}。关批次前勿宣称可 AI coding。`,
      command: `node scripts/fill-plan.mjs --root ${R} --status`,
    });
  }

  if (blockers.includes("semantic_ready")) {
    actions.push({
      title: "清语义 miss（逻辑模板 / DTO 错挂）",
      detail: `generic_logic=${score.semantic_ready?.generic_logic_template ?? "?"}，dto_unbound=${score.semantic_ready?.dto_unbound ?? "?"}`,
      command: null,
    });
  }

  if (blockers.includes("skeleton_ready")) {
    actions.push({
      title: "升到 L4 骨架",
      detail: "补 hooks / mcp.json.example / gitignore 后重打分。",
      command: null,
    });
  }

  if (hasResidualHint(score) && actions.length < 3) {
    const n = warningShardCount(score);
    actions.push({
      title: "清验收遗留项（--residual）",
      detail:
        (n ? `warning_shards×${n}。` : "") +
        "验收批次已关后清 warnings；再 fill-score。",
      command: residualCommand(root, score),
    });
  }

  for (const b of blockers) {
    if (actions.length >= 3) break;
    if (String(b).startsWith("morph_floor:")) {
      actions.push({
        title: "抬域文档质量分（过下限）",
        detail: formatMorphFloorDetail(b),
        command: null,
      });
    } else if (String(b).startsWith("harness_todo:")) {
      actions.push({
        title: "清 harness TODO(harness-eng)",
        detail: "扫面见 gate.todo_scan（gold=harness_docs：真相+索引+AGENTS+agent-kb+rules）。",
        command: `node scripts/fill-plan.mjs --root ${R} --status`,
      });
    } else if (String(b).startsWith("acceptance_warnings:")) {
      if (!hasResidualHint(score) || warningShardCount(score) === 0) {
        actions.push({
          title: "清验收 warnings（gold）",
          detail: `按 truth-quality 精修 ${accDomain} 真相至 warnings=0。`,
          command: `node scripts/acceptance-check.mjs --root ${R} --domain ${accDomain} --gold`,
        });
      }
    } else if (
      String(b).startsWith("acceptance_blockers:") ||
      String(b).startsWith("gold_ratio:")
    ) {
      actions.push({
        title: "清验收 blocker / 抬验收通过率",
        detail: "对 .fill-work 或 SSOT 跑 acceptance-check，过闸再 merge。",
        command: `node scripts/acceptance-check.mjs --root ${R} --domain ${accDomain} --gold`,
      });
    } else if (String(b).startsWith("template_completeness:")) {
      const m = String(b).match(/^template_completeness:(\d+)<(\d+)/);
      const tip = m ? `模板完整度 ${m[1]}<${m[2]}。` : "";
      actions.push({
        title: "补模板完整度",
        detail: `${tip}对照 api/func/db/redis/jobs 模板补必填章与示例列。`,
        command: null,
      });
    }
  }

  const covGaps = score.coverage_ready?.gaps;
  if (
    blockers.includes("coverage_ready") &&
    Array.isArray(covGaps) &&
    covGaps.length &&
    actions.length < 3
  ) {
    const tip = covGaps
      .slice(0, 3)
      .map(
        (g) =>
          `${g.domain}:${Math.round((g.ratio || 0) * 100)}%<${Math.round((g.target || 0) * 100)}%`
      )
      .join("、");
    actions.push({
      title: "按分域补代码覆盖率（all_domains）",
      detail: `coverage_gaps：${tip}。开 fill-plan 对应域批次 → agents。`,
      command: `node scripts/fill-plan.mjs --root ${R} --status`,
    });
  }

  if (score.ready?.coverage_incomplete) {
    actions.push({
      title: "先跑 inventory（代码清单）",
      detail: `写出 docs/${invDomain}/.fill-work/inventory*.json，再 fill-plan / agents。`,
      command: `node scripts/fill-inventory.mjs --domain ${invDomain} --root ${R}`,
    });
  } else if (
    blockers.includes("coverage_ready") ||
    (typeof gateCoveragePercent(score) === "number" && gateCoveragePercent(score) < 90)
  ) {
    const shards = Array.isArray(score.next_shards) ? score.next_shards : [];
    const top = shards
      .slice(0, 3)
      .map((s) => `${s.package || s.id}≈${s.count || "?"}`)
      .join("、");
    // 0.8.2 patch (D8): advice text uses the gate-aligned percent too.
    const covP = gateCoveragePercent(score);
    const legacyDetail =
      score.coverage &&
      typeof score.coverage.covered === "number" &&
      typeof score.coverage.code === "number"
        ? `（${score.coverage.covered}/${score.coverage.code}）`
        : "";
    actions.push({
      title: "按批次补文档覆盖（fill-truths-agents）",
      detail: top
        ? `覆盖约 ${covP ?? "?"}%${legacyDetail}。优先：${top}`
        : `覆盖约 ${covP ?? "?"}% 。走 agents，勿默认 auto 写 SSOT。`,
      command: null,
    });
  }

  if (atCeil && actions.length < 3) {
    actions.push({
      title: "不必再追更高文档质量分",
      detail: `文档质量分≈${overall}% ，理论上限≈${ceil}% 。看 ai_coding_ready / Plan。`,
      command: null,
    });
  }

  if (score.suggest_next && actions.length < 3) {
    actions.push({
      title: "系统建议",
      detail: String(score.suggest_next),
      command: null,
    });
  }

  if (!actions.length) {
    actions.push({
      title: "查看分域诊断与任务台",
      detail: "核对契约域故事、缺口分布与 fill-plan 批次。",
      command: null,
    });
  }

  return actions.slice(0, 3);
}

function buildDomains(score) {
  const out = [];
  for (const d of contractDomainList(score)) {
    const x = score.domains?.[d];
    const q = score.quality?.domains?.[d] ?? x?.score;
    if (x == null && q == null) continue;
    const cov = score.coverage_by_domain?.[d];
    const st = domainStatus(score, d);
    const truths =
      typeof cov?.truths === "number"
        ? cov.truths
        : x?.truths ?? null;
    out.push({
      id: d,
      name_zh: domainDisplayName(d),
      score: typeof q === "number" ? q : null,
      cap: score.domain_caps?.[d] ?? null,
      truths,
      shells: x?.shells ?? null,
      coverage_percent: cov?.percent ?? null,
      coverage_covered: cov?.covered ?? null,
      coverage_code: cov?.code ?? null,
      // 0.8.4: surface frontend asset_ratio so YES/100 does not hide 1/64 gaps
      inventory_assets:
        typeof cov?.inventory_assets === "number" ? cov.inventory_assets : null,
      asset_ratio: typeof cov?.asset_ratio === "number" ? cov.asset_ratio : null,
      ...(typeof cov?.mapped === "number" ? { mapped: cov.mapped } : {}),
      ...(typeof cov?.unmapped === "number" ? { unmapped: cov.unmapped } : {}),
      tone: st.tone,
      status_label: st.label,
    });
  }
  return out;
}

/** Frontend domains with asset_ratio < 0.2 → short chips like `pages 1/64`. */
export function lowAssetRatioHints(score) {
  const cov = score?.coverage_by_domain || {};
  const hints = [];
  for (const [id, row] of Object.entries(cov)) {
    if (!row || typeof row !== "object") continue;
    if (typeof row.asset_ratio !== "number" || !(row.asset_ratio < 0.2)) continue;
    const assets = Number(row.inventory_assets) || 0;
    if (!(assets > 0)) continue;
    const truths = typeof row.truths === "number" ? row.truths : "?";
    hints.push(`${id} ${truths}/${assets}`);
  }
  return hints;
}

function buildShards(score, opts = {}) {
  const root = opts.root;
  const R = cmdRoot(root);
  const out = [];
  const shards = Array.isArray(score.next_shards) ? score.next_shards : [];
  for (const s of shards.slice(0, 12)) {
    const id = s.id || "";
    const pkg = s.package || "(root)";
    const count =
      s.count ?? (Array.isArray(s.endpoints) ? s.endpoints.length : null);
    out.push({
      id,
      package: pkg,
      count,
      kind: "fill",
      title: id || pkg,
      hint: count != null ? `约 ${count} 条` : "待估条目数",
      command: `node scripts/fill-plan.mjs --root ${R} --status`,
    });
  }
  const warnings = Array.isArray(score.warning_shards) ? score.warning_shards : [];
  for (const s of warnings.slice(0, 8)) {
    const id = s.id || s.path || s.file || "residual";
    const pkg = s.package || s.domain || "acceptance";
    const count =
      s.count ??
      (Array.isArray(s.warnings) ? s.warnings.length : s.items?.length) ??
      null;
    out.push({
      id: String(id),
      package: String(pkg),
      count,
      kind: "residual",
      title: "验收遗留 · " + (s.title || id),
      hint:
        count != null
          ? `warnings≈${count} · fill-plan --residual`
          : "acceptance residual · fill-plan --residual",
      command: residualCommand(root, score),
    });
  }
  return out.slice(0, 16);
}

function buildDiff(score) {
  const d = score.diff;
  if (!d || typeof d !== "object") return null;
  const overall = typeof d.overall === "number" ? d.overall : null;
  const domains = {};
  for (const k of Object.keys(d)) {
    if (k === "overall" || k === "source" || k === "coverage_percent_source") continue;
    if (typeof d[k] === "number") domains[k] = d[k];
  }
  // 0.8.4: prefer gate-aligned coverage delta; never treat missing as 0.
  let coverageDelta = null;
  let coverageSource = null;
  if (typeof d.coverage_all_percent === "number") {
    coverageDelta = d.coverage_all_percent;
    coverageSource = "gate";
  } else if (
    typeof d.coverage_percent === "number" &&
    d.coverage_percent_source !== "omit"
  ) {
    coverageDelta = d.coverage_percent;
    coverageSource = d.coverage_percent_source || "legacy";
  }
  const sign = (n) => (n > 0 ? "+" : "") + n;
  let summary = "无相对上次变化";
  if (overall != null) {
    summary = "相对上次 overall " + sign(overall);
    const bits = Object.keys(domains)
      .filter((k) => k !== "coverage_percent" && k !== "coverage_all_percent")
      .map((k) => k + " " + sign(domains[k]));
    if (coverageDelta != null) {
      bits.unshift(
        "门禁覆盖 " +
          sign(coverageDelta) +
          (coverageSource === "legacy" ? "（API口径）" : "")
      );
    }
    if (bits.length) summary += "（" + bits.join("、") + "）";
  }
  return {
    overall,
    domains,
    summary,
    coverage_delta: coverageDelta,
    coverage_percent_source: coverageSource,
  };
}

function buildRunTimeline(run) {
  if (!run || typeof run !== "object") return [];
  const keys = ["round", "written", "merged", "unchanged", "skips", "note"];
  const labels = {
    round: "轮次",
    written: "新写",
    merged: "合并",
    unchanged: "未变",
    skips: "跳过",
    note: "备注",
  };
  const out = [];
  for (const k of keys) {
    if (run[k] == null || run[k] === "") continue;
    out.push({ id: k, label_zh: labels[k] || k, value: run[k] });
  }
  return out;
}

function buildTrend(historySeries) {
  if (!historySeries || !Array.isArray(historySeries.labels)) return null;
  if (historySeries.labels.length < 1) return null;
  const overall = historySeries.overall || [];
  const linkable = Array.isArray(historySeries.overall_linkable)
    ? historySeries.overall_linkable
    : overall;
  const nums = linkable.filter((n) => typeof n === "number");
  let delta = null;
  if (nums.length >= 2) {
    delta = Math.round((nums[nums.length - 1] - nums[nums.length - 2]) * 10) / 10;
  }
  const incomparable = Array.isArray(historySeries.incomparable)
    ? historySeries.incomparable
    : [];
  const incomparableCount = incomparable.filter(Boolean).length;
  let summary =
    historySeries.labels.length < 2
      ? "历史不足 2 次，暂无趋势"
      : delta == null
        ? "已有 " + historySeries.labels.length + " 次评分快照"
        : "最近 overall Δ " +
          (delta > 0 ? "+" : "") +
          delta +
          "（共 " +
          historySeries.labels.length +
          " 点）";
  if (incomparableCount > 0) {
    summary +=
      " · " +
      incomparableCount +
      " 点尺度不可比（report_schema/morph 不符，已灰显不连线）";
  }
  return {
    labels: historySeries.labels,
    overall: historySeries.overall,
    coverage: historySeries.coverage,
    overall_linkable: historySeries.overall_linkable || null,
    coverage_linkable: historySeries.coverage_linkable || null,
    report_schema: historySeries.report_schema || null,
    morph_scale: historySeries.morph_scale || null,
    incomparable,
    ready: historySeries.ready,
    count: historySeries.labels.length,
    delta_overall: delta,
    summary,
  };
}

function buildGoNogo(score, nextActions) {
  const aiOk = !!score.ai_coding_ready?.ok;
  const blockers = Array.isArray(score.ai_coding_ready?.blockers)
    ? score.ai_coding_ready.blockers
    : [];
  const next_commands = (nextActions || [])
    .map((a) => a.command)
    .filter(Boolean)
    .slice(0, 3);
  return {
    ok: aiOk,
    label_zh: aiOk ? "建议可以开干" : "建议暂缓",
    blockers,
    next_commands,
    rule: score.ai_coding_ready?.rule || "开干只看 ai_coding_ready",
  };
}

function buildTasks(score, shards, nextActions) {
  const out = [];
  let pri = 1;
  for (const a of nextActions || []) {
    if (out.length >= 12) break;
    out.push({
      id: "action-" + pri,
      title: a.title || "下一步",
      why: a.detail || "",
      priority: pri++,
      cmd: a.command || null,
      kind: "action",
    });
  }
  for (const s of shards || []) {
    if (out.length >= 16) break;
    out.push({
      id: s.id || "shard-" + out.length,
      title: s.title || s.id || "任务",
      why: s.hint || s.package || "",
      priority: pri++,
      cmd: s.command || null,
      kind: s.kind || "fill",
    });
  }
  return out;
}

function buildDiagnose(score, domainStories, missTop, decisionKpis) {
  const story = [];
  const sk = score.skeleton_ready?.ok;
  const cov = score.coverage_ready?.ok;
  const sem = score.semantic_ready?.ok;
  const plan = score.fill_plan;
  story.push({
    id: "gates",
    tone: score.ai_coding_ready?.ok ? "ok" : "warn",
    text:
      "四态灯：骨架=" +
      (sk === true ? "YES" : sk === false ? "NO" : "—") +
      " · 覆盖=" +
      (cov === true ? "YES" : cov === false ? "NO" : "—") +
      " · 语义=" +
      (sem === true ? "YES" : sem === false ? "NO" : "—") +
      " · Plan=" +
      (plan?.present === false
        ? "缺"
        : plan?.all_closed
          ? "已关"
          : plan?.present
            ? "有"
            : "—") +
      "（不替代开干）",
  });
  const lagging = domainStories.find((d) => d.tone === "warn") || domainStories[0];
  if (lagging) {
    story.push({
      id: "lagging",
      tone: lagging.tone || "warn",
      text:
        "拖后腿：" +
        (lagging.name_zh || lagging.id) +
        " — " +
        (lagging.story || lagging.status_label || ""),
    });
  }
  if (missTop?.length) {
    story.push({
      id: "miss",
      tone: "warn",
      text:
        "常见缺口：" +
        missTop
          .slice(0, 4)
          .map((m) => (m.label_zh || m.id) + "×" + m.count)
          .join("、"),
    });
  }
  const gateKpis = (decisionKpis || []).filter((k) =>
    ["skeleton_ready", "coverage_ready", "semantic_ready", "fill_plan"].includes(k.id)
  );
  return {
    story,
    gate_lamps: gateKpis,
    lagging_domain: lagging
      ? { id: lagging.id, name_zh: lagging.name_zh, story: lagging.story }
      : null,
  };
}

function buildLadderProgress(score, meta = {}) {
  const raw =
    meta.ladder ||
    score.skeleton_ready?.ladder ||
    score.suggest_upgrade?.current_ladder ||
    null;
  const cur = raw ? String(raw).toUpperCase().replace(/^L?/, "L") : null;
  const curIdx = cur ? LADDER_STEPS.indexOf(cur) : -1;
  const next =
    score.suggest_upgrade?.next_ladder ||
    (curIdx >= 0 && curIdx < LADDER_STEPS.length - 1
      ? LADDER_STEPS[curIdx + 1]
      : null);
  const steps = LADDER_STEPS.map((id, i) => {
    const tip = LADDER_TIPS[id] || {};
    return {
      id,
      label_zh: id,
      name_zh: tip.name_zh || id,
      tip_zh: tip.tip_zh
        ? id + " " + tip.name_zh + " — " + tip.tip_zh
        : id,
      done: curIdx >= 0 && i <= curIdx,
      current: curIdx >= 0 && i === curIdx,
    };
  });
  const doneCount = steps.filter((s) => s.done).length;
  const percent =
    curIdx < 0 ? 0 : Math.round(((curIdx + 1) / LADDER_STEPS.length) * 100);
  return {
    current: cur,
    next: next ? String(next).toUpperCase().replace(/^L?/, "L") : null,
    percent,
    done: doneCount,
    total: LADDER_STEPS.length,
    steps,
    summary:
      curIdx < 0
        ? "阶梯未写入 meta（未知）"
        : curIdx >= LADDER_STEPS.length - 1
          ? "施工阶梯已达 L5"
          : "施工阶梯 " + cur + "（下一阶 " + (next || "—") + "）",
  };
}

function buildPipelineProgress(score) {
  const plan = score.fill_plan || {};
  const steps = [
    {
      id: "skeleton",
      label_zh: "骨架就绪",
      done: !!score.skeleton_ready?.ok,
    },
    {
      id: "coverage",
      label_zh: "覆盖就绪",
      done: !!score.coverage_ready?.ok && !score.ready?.coverage_incomplete,
    },
    {
      id: "fill_plan",
      label_zh: "补文档计划",
      done: !!plan.present,
    },
    {
      id: "batches",
      label_zh: "批次完成",
      done: !!plan.all_closed,
    },
    {
      id: "semantic",
      label_zh: "语义抽检",
      done: !!score.semantic_ready?.ok,
    },
    {
      id: "ai_coding",
      label_zh: "可 AI coding",
      done: !!score.ai_coding_ready?.ok,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);
  const current = steps.find((s) => !s.done) || steps[steps.length - 1];
  const ladder =
    score.skeleton_ready?.ladder ||
    score.suggest_upgrade?.next_ladder ||
    null;
  return {
    percent,
    done: doneCount,
    total: steps.length,
    current_id: current.id,
    current_label_zh: current.label_zh,
    ladder,
    label_zh: "开干清单",
    steps,
    summary:
      percent >= 100
        ? "开干清单全部完成，可以 AI coding"
        : "开干清单：" + current.label_zh + "（" + doneCount + "/" + steps.length + "）",
  };
}

/** 总评分（≠开干）：文档质量分×0.35 + 代码覆盖率×0.25 + 验收×0.2 + 开干清单×0.2；决策台总评模块展示 */
function buildCompositeScore(score, pipeline) {
  const overall = typeof score.overall === "number" ? score.overall : null;
  // 0.8.2 patch (D8): composite coverage part uses the gate-aligned percent.
  const cov = gateCoveragePercent(score);
  const gold =
    typeof score.gold_ratio === "number" ? score.gold_ratio * 100 : null;
  const pipe = typeof pipeline?.percent === "number" ? pipeline.percent : null;

  const parts = [];
  if (overall != null) parts.push({ id: "overall", label_zh: "文档质量分", value: overall });
  if (cov != null) parts.push({ id: "coverage", label_zh: "代码覆盖率", value: cov });
  if (gold != null) {
    parts.push({
      id: "gold_ratio",
      label_zh: "验收通过率",
      value: Math.round(gold * 10) / 10,
    });
  }
  if (pipe != null) parts.push({ id: "pipeline", label_zh: "开干清单", value: pipe });

  let weight = 0;
  let sum = 0;
  if (overall != null) {
    sum += overall * 0.35;
    weight += 0.35;
  }
  if (cov != null) {
    sum += cov * 0.25;
    weight += 0.25;
  }
  if (gold != null) {
    sum += gold * 0.2;
    weight += 0.2;
  }
  if (pipe != null) {
    sum += pipe * 0.2;
    weight += 0.2;
  }
  if (weight <= 0) {
    return {
      value: null,
      label_zh: "总评分",
      grade_zh: null,
      grade_tone: "",
      parts,
      breakdown: { overall, coverage: cov, gold_ratio: gold, pipeline: pipe },
      one_line_zh: "",
      tip: "缺评分输入；能否开干只看「可 AI coding」",
    };
  }
  const value = Math.round((sum / weight) * 10) / 10;
  const grade_zh =
    value >= 90 ? "优秀" : value >= 75 ? "良好" : value >= 60 ? "合格" : "待改进";
  const grade_tone = value >= 75 ? "ok" : value >= 60 ? "warn" : "no";
  return {
    value,
    label_zh: "总评分",
    grade_zh,
    grade_tone,
    parts,
    breakdown: { overall, coverage: cov, gold_ratio: gold, pipeline: pipe },
    one_line_zh: "",
    tip: "文档质量分35% · 代码覆盖率25% · 验收通过率20% · 开干清单20% 加权——仅供参考；能否开干只看「可 AI coding」",
  };
}

/** 总评一句话：短板 + 资产比偏低 + 先做什么（大白话；机器字段留在 breakdown / tech 弹层） */
function buildOverallOneLine(composite, lagging, nextActions, score) {
  if (composite.value == null) return "";
  const bits = [];
  if (lagging && (lagging.story || lagging.status_label)) {
    bits.push(
      "主要短板：" +
        (lagging.name_zh || lagging.id) +
        "（" +
        (lagging.story || lagging.status_label) +
        "）"
    );
  }
  const assetHints = lowAssetRatioHints(score);
  if (assetHints.length) {
    bits.push("资产比偏低：" + assetHints.slice(0, 3).join("、"));
  }
  const first = (nextActions || []).find((a) => a && a.title);
  if (first) bits.push("先做：" + first.title);
  return bits.join("；");
}

/**
 * @param {object} score fill-score JSON
 * @param {object} [opts]
 * @param {string} [opts.root] target repo root for command paths
 * @param {object} [opts.meta] harness-meta (domains etc.)
 * @param {object} [opts.history_series] prebuilt trend series
 * @param {object} [opts.run] pipeline run stats
 * @param {object} [opts.host_surface] prebuilt host surface (0.4.0+)
 * @returns {object} ui projection
 */
export function buildReportUi(score, opts = {}) {
  const s = score && typeof score === "object" ? score : {};
  const meta = opts.meta || {};
  const cov = s.coverage || {};
  const actionOpts = { root: opts.root || s.root || null, meta };
  const domains = buildDomains(s);
  const missTop = buildMissTop(s);
  const domainStories = buildDomainStories(s);
  const lagging = domainStories.find((d) => d.tone === "warn") || domainStories[0];
  const diff = buildDiff(s);
  const run_timeline = buildRunTimeline(opts.run);
  const trend = buildTrend(opts.history_series || null);
  const showDomainCards = opts.show_domain_cards === true;
  const pipeline_progress = buildPipelineProgress(s);
  const ladder_progress = buildLadderProgress(s, meta);
  const composite_score = buildCompositeScore(s, pipeline_progress);
  const decision_kpis = buildDecisionKpis(s);
  const next_actions = buildNextActions(s, actionOpts);
  composite_score.one_line_zh = buildOverallOneLine(
    composite_score,
    lagging,
    next_actions,
    s
  );
  const shards = buildShards(s, actionOpts);
  const go_nogo = buildGoNogo(s, next_actions);
  const tasks = buildTasks(s, shards, next_actions);
  const diagnose = buildDiagnose(s, domainStories, missTop, decision_kpis);
  const host_surface =
    opts.host_surface && typeof opts.host_surface === "object"
      ? opts.host_surface
      : null;
  return {
    version: REPORT_SCHEMA,
    report_schema: REPORT_SCHEMA,
    morph_scale: s.morph_scale || "0.7",
    headline: buildHeadline(s),
    verdict: buildVerdict(s),
    go_nogo,
    gap_to_ready: buildGapToReady(s),
    decision_kpis,
    morph_strip: buildMorphStrip(s),
    coverage_strip: buildCoverageStrip(s),
    diagnose,
    show_domain_cards: showDomainCards,
    composite_score,
    ladder_progress,
    pipeline_progress,
    quality_overall: typeof s.overall === "number" ? s.overall : null,
    formula_ceiling: typeof s.formula_ceiling === "number" ? s.formula_ceiling : null,
    gold_ratio: typeof s.gold_ratio === "number" ? s.gold_ratio : null,
    template_completeness:
      typeof s.template_completeness?.overall === "number"
        ? s.template_completeness.overall
        : null,
    template_completeness_by_domain: s.template_completeness?.by_domain || null,
    // 0.8.2 patch (D8): top-bar coverage_percent is gate-aligned (all_domains
    // aggregate via coverage_ready.all_percent); legacy JSON falls back to the
    // API-scoped percent and is flagged with coverage_percent_source="legacy".
    coverage_percent: gateCoveragePercent(s),
    coverage_percent_source: coverageIsGateScope(s) ? "gate" : "legacy",
    coverage_covered: cov.covered ?? null,
    coverage_code: cov.code ?? null,
    ready_rule: s.ai_coding_ready?.rule || null,
    ready_deprecated: s.ready?.deprecated === true,
    ai_coding_ready: !!s.ai_coding_ready?.ok,
    skeleton_ready: !!s.skeleton_ready?.ok,
    semantic_ready: !!s.semantic_ready?.ok,
    coverage_ready: !!s.coverage_ready?.ok,
    fill_plan: s.fill_plan || null,
    domains,
    domain_stories: domainStories,
    lagging_domain: lagging
      ? { id: lagging.id, name_zh: lagging.name_zh, story: lagging.story }
      : null,
    chart_domains: buildChartDomains(s),
    miss_top: missTop,
    gaps_top: buildGapsTop(s),
    next_actions,
    shards,
    tasks,
    tasks_empty_hint: buildTasksEmptyHint(s),
    host_surface,
    diff,
    trend,
    run_timeline,
    suggest_upgrade: s.suggest_upgrade || null,
    glossary: GLOSSARY,
    suggest_raw: s.suggest_next || null,
    disclaimer:
      "本报告不是契约真相；契约见 docs/func|api|db|redis|jobs；踩坑回流见 docs/agent-kb/；施工产物默认在 docs/harness-eng/；开干只看 ai_coding_ready；落地检查不否决开干",
  };
}

export { DOMAIN_ZH, GLOSSARY, MISS_ZH };
