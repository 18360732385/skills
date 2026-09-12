/**
 * Build human-facing `ui` projection from fill-score JSON.
 * `ui.version` = report_schema（报告壳；现 0.2.24）。≠ skill_version。
 * Machine fields stay on `score`; report template prefers `ui.*`.
 * 「建议可以开干」仅绑 ai_coding_ready（非旧 ready.ok）。大仓另看 gold_ratio。
 * 0.2.23：决策台瘦身——徽章二态；decision_kpis + morph_strip；域故事卡默认关。
 * 0.2.24：综合评分 + 流水线进度；报告页 Tab/主题/术语悬停由模板承担。
 */
import { knownContractDomainIds, domainLabel, loadDomainRegistry } from "./domains.mjs";

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
};

const GLOSSARY = [
  {
    id: "gold_ratio",
    zh: "金标达标率",
    en: "gold_ratio",
    tip: "acceptance-check 通过节占比；大仓看局部金标，不替代 ai_coding_ready。",
  },
  {
    id: "ai_coding_ready",
    zh: "可 AI coding",
    en: "ai_coding_ready",
    tip: "skeleton+coverage+semantic+fill-plan 全关才算；仪表盘「开干」只看此项。",
  },
  {
    id: "ready",
    zh: "形态/覆盖就绪（兼容）",
    en: "ready",
    tip: "旧字段：形态分+覆盖达阈。不是开干闸；对用户正写用「覆盖/形态/开干」，开干只看 ai_coding_ready。",
  },
  {
    id: "skeleton_ready",
    zh: "骨架就绪",
    en: "skeleton_ready",
    tip: "L4 阶梯与 hooks/MCP example 等必备文件齐。",
  },
  {
    id: "semantic_ready",
    zh: "语义抽检通过",
    en: "semantic_ready",
    tip: "启发式：通用逻辑模板、DTO 错挂等 miss 低于阈。",
  },
  {
    id: "fill_plan",
    zh: "填充计划",
    en: "fill_plan",
    tip: "docs/harness-eng/fill-plan.yaml：目标/批次/Done；早停看关闭率。",
  },
  {
    id: "quality",
    zh: "文档形态分",
    en: "quality / overall",
    tip: "真相写得像不像模板，不是业务正确性分数。",
  },
  {
    id: "coverage",
    zh: "相对代码覆盖",
    en: "coverage",
    tip: "已文档化条目 ÷ inventory 扫到的条目。",
  },
  {
    id: "formula_ceiling",
    zh: "公式上限",
    en: "formula_ceiling",
    tip: "按当前打分规则，自动填充大致能摸到的顶；贴顶勿空追更高 overall。",
  },
  {
    id: "domain_caps",
    zh: "分域上限",
    en: "domain_caps",
    tip: "各域形态分的理论顶。",
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
    tip: "建议下一批要补的接口/模块分片。",
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
    tip: "真相是否含模板必填章（启发式）；贴 formula_ceiling 但此项低 → fill-truths-agents，勿空追 overall。",
  },
];

function domainStatus(score, d) {
  const x = score.domains?.[d];
  const q = score.quality?.domains?.[d] ?? x?.score;
  const cap = score.domain_caps?.[d];
  const cov = score.coverage_by_domain?.[d];
  const incomplete = score.ready?.coverage_incomplete && d === "api";

  if (incomplete || (cov && cov.ratio == null && !x)) {
    return { tone: "warn", label: "缺清单或缺覆盖数据" };
  }
  if (typeof q === "number" && typeof cap === "number" && q >= cap - 1) {
    return { tone: "ok", label: "已贴形态上限" };
  }
  if (cov && typeof cov.percent === "number" && cov.percent < 60) {
    return { tone: "warn", label: "覆盖仍可补" };
  }
  if (x && typeof x.shells === "number" && x.shells > 0) {
    return { tone: "warn", label: `约 ${x.shells} 个空壳` };
  }
  if (typeof q === "number" && q >= 70) {
    return { tone: "ok", label: "形态达标" };
  }
  return { tone: "warn", label: "建议继续补文档" };
}

function buildHeadline(score) {
  const aiOk = !!score.ai_coding_ready?.ok;
  const morphOk = !!score.ready?.ok;
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
  const gateBlockers = blockers.filter(
    (b) =>
      /^(morph_floor|harness_todo|acceptance_blockers|acceptance_warnings|gold_ratio|template_completeness):/.test(
        String(b)
      )
  );
  if (gateBlockers.length) {
    return `开干=NO · gate：${gateBlockers.join("、")}。见任务台对应 fill 建议。`;
  }
  if (
    typeof score.gold_ratio === "number" &&
    score.gold_ratio < 0.6 &&
    (score.acceptance?.blockers > 0 || score.acceptance?.status === 1)
  ) {
    return `金标达标率 gold_ratio=${score.gold_ratio} 偏低且有 acceptance blocker；先按 truth-quality 精修。`;
  }
  if (blockers.includes("fill_plan_missing")) {
    return "开干=NO：缺 fill-plan → 先 --init，再按批次 fill-truths-agents。";
  }
  if (blockers.includes("fill_plan_open_batches") || (plan?.present && openBatches > 0)) {
    return `开干=NO：fill-plan 仍有开放批次≈${openBatches ?? "?"}；继续 agents。`;
  }
  if (blockers.includes("semantic_ready") || score.semantic_ready?.ok === false) {
    return "开干=NO：semantic_ready=false（通用逻辑模板 / DTO 错挂）；按接口重填后再打分。";
  }
  if (blockers.includes("skeleton_ready") || score.skeleton_ready?.ok === false) {
    return "开干=NO：skeleton_ready=false → upgrade/resume 到 L4。";
  }
  if (blockers.includes("coverage_ready")) {
    return "开干=NO：coverage_ready=false（见分域 coverage_gaps）；按域补 inventory/批次。";
  }
  if (score.ready?.coverage_incomplete) {
    return "缺 inventory，覆盖率不完整；先 inventory → fill-plan → agents。";
  }
  if (morphOk && atCeil) {
    return "形态已贴公式上限，但开干未达；请关 Plan / 过语义 / 清 gate，勿空追 overall≥80。";
  }
  if (morphOk) {
    return "形态/覆盖 compat 已达阈，但开干须等 ai_coding_ready（含 gate）。";
  }
  return "开干=NO；请按 fill-plan 批次 fill-truths-agents 后打分。";
}

function buildVerdict(score) {
  const aiOk = !!score.ai_coding_ready?.ok;
  const morphOk = !!score.ready?.ok;
  if (aiOk) {
    return {
      ready_ok: true,
      ai_coding_ready: true,
      ready_label: "建议可以开干",
      ready_hint: "ai_coding_ready=true；可用 AI 协助改业务，仍须人工审契约与代码。",
    };
  }
  // 徽章仅二态；形态/覆盖中间态只进 hint，不另开第三种标签
  let hint = "先 fill-plan + agents 过语义闸；勿把旧 ready.ok 当可编码。";
  if (morphOk) {
    hint = "形态+覆盖已达阈，但仍差语义或 fill-plan；未达 ai_coding_ready，暂缓开业务改动。";
  }
  return {
    ready_ok: false,
    ai_coding_ready: false,
    ready_label: "建议暂缓",
    ready_hint: hint,
  };
}

/** 决策台 KPI：开干闸 + 条件金标（无 SSOT 则省略金标卡） */
function buildDecisionKpis(score) {
  const aiOk = !!score.ai_coding_ready?.ok;
  const kpis = [
    {
      id: "ai_coding_ready",
      label_zh: "可 AI coding",
      value: aiOk ? "YES" : "NO",
      sub: score.ai_coding_ready?.rule || "开干只看此项",
      tone: aiOk ? "ok" : "no",
    },
  ];
  if (typeof score.gold_ratio === "number") {
    kpis.push({
      id: "gold_ratio",
      label_zh: "金标达标率",
      value: Math.round(score.gold_ratio * 1000) / 10 + "%",
      sub:
        score.gold_ratio < 0.6
          ? "偏低 · 清 acceptance blocker"
          : "acceptance · 不替代 ai_coding_ready",
      tone: score.gold_ratio < 0.6 ? "warn" : "ok",
    });
  }
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
      label_zh: "形态分",
      value: overall + "%",
      sub: ceil != null ? "上限约 " + ceil + "%" : "像不像模板",
    });
  }
  if (ceil != null) {
    items.push({
      id: "ceiling",
      label_zh: "公式上限",
      value: "~" + ceil + "%",
      sub: "贴顶后走 agents",
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

/** 覆盖条：与形态条分列（三词名实） */
function buildCoverageStrip(score) {
  const covP =
    typeof score.coverage?.percent === "number" ? score.coverage.percent : null;
  if (covP == null) return [];
  const covered = score.coverage?.covered;
  const code = score.coverage?.code;
  const mode = score.coverage_ready?.mode || score.score_policy?.coverage_mode;
  return [
    {
      id: "coverage",
      label_zh: "覆盖",
      value: covP + "%",
      sub:
        (covered != null && code != null ? covered + " / " + code : "相对 inventory") +
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
  const covRatio =
    typeof score.coverage?.ratio === "number"
      ? score.coverage.ratio
      : typeof score.coverage?.percent === "number"
        ? score.coverage.percent / 100
        : null;

  const qualityGap =
    overall == null ? null : Math.max(0, Math.round((rq - overall) * 10) / 10);
  const coverageGap =
    covRatio == null ? null : Math.max(0, Math.round((rc - covRatio) * 1000) / 1000);
  const coverageGapPct =
    coverageGap == null ? null : Math.round(coverageGap * 1000) / 10;

  const blockers = Array.isArray(score.ai_coding_ready?.blockers)
    ? score.ai_coding_ready.blockers
    : [];
  let summary = "";
  if (score.ai_coding_ready?.ok) {
    summary = "已达 ai_coding_ready。";
  } else if (blockers.length) {
    summary = "距 ai_coding_ready：" + blockers.join("、");
  } else if (score.ready?.coverage_incomplete) {
    summary = "缺 inventory，覆盖门槛无法完整判定。";
  } else if (score.ready?.ok) {
    summary = "形态/覆盖已就绪；仍差语义或 fill-plan。";
  } else {
    const bits = [];
    if (qualityGap != null && qualityGap > 0) bits.push(`形态分还差约 ${qualityGap} 分`);
    if (coverageGapPct != null && coverageGapPct > 0) {
      bits.push(`覆盖还差约 ${coverageGapPct}%`);
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
  const quality = [];
  const caps = [];
  for (const d of contractDomainList(score)) {
    const x = score.domains?.[d];
    const q = score.quality?.domains?.[d] ?? x?.score;
    if (x == null && q == null) continue;
    labels.push(d);
    quality.push(typeof q === "number" ? q : 0);
    caps.push(
      typeof score.domain_caps?.[d] === "number" ? score.domain_caps[d] : 100
    );
  }
  return { labels, quality, caps };
}

function buildNextActions(score) {
  const actions = [];
  const aiOk = !!score.ai_coding_ready?.ok;
  const blockers = Array.isArray(score.ai_coding_ready?.blockers)
    ? score.ai_coding_ready.blockers
    : [];
  const overall = score.overall;
  const ceil = score.formula_ceiling;
  const atCeil =
    typeof overall === "number" && typeof ceil === "number" && overall >= ceil - 1;

  if (aiOk) {
    actions.push({
      title: "可开始业务改动（人工审契约）",
      detail: "ai_coding_ready=true。形态分贴顶时勿空追 overall≥80。",
      command: null,
    });
    return actions;
  }

  if (blockers.includes("fill_plan_missing")) {
    actions.push({
      title: "初始化 fill-plan",
      detail: "建立目标与批次后再 agents 精填。",
      command:
        "node scripts/fill-plan.mjs --root <TARGET> --init --domains api,func,db,redis",
    });
  } else if (blockers.includes("fill_plan_open_batches")) {
    actions.push({
      title: "按 Plan 批次继续多 Agent 精填",
      detail: `开放批次≈${score.fill_plan?.open_total ?? "?"}。关批次前勿宣称可 AI coding。`,
      command: "node scripts/fill-plan.mjs --root <TARGET> --status",
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

  // 0.3.0: gate 红项 → 可执行 fill 建议
  for (const b of blockers) {
    if (actions.length >= 3) break;
    if (String(b).startsWith("morph_floor:")) {
      actions.push({
        title: "抬域形态分（过 morph_floor）",
        detail: `${b}。按拖后腿域补模板章/列密度，再 fill-score。`,
        command: null,
      });
    } else if (String(b).startsWith("harness_todo:")) {
      actions.push({
        title: "清 harness TODO(harness-eng)",
        detail: `${b}。扫面见 gate.todo_scan（gold=harness_docs：真相+索引+AGENTS+agent-kb+rules）。`,
        command: "node scripts/fill-plan.mjs --root <TARGET> --status",
      });
    } else if (String(b).startsWith("acceptance_warnings:")) {
      actions.push({
        title: "清 acceptance warnings（gold）",
        detail: `${b}。按 truth-quality 精修 api 真相至 warnings=0。`,
        command:
          "node scripts/acceptance-check.mjs --root <TARGET> --domain api --gold",
      });
    } else if (
      String(b).startsWith("acceptance_blockers:") ||
      String(b).startsWith("gold_ratio:")
    ) {
      actions.push({
        title: "清 acceptance blocker / 抬金标",
        detail: `${b}。对 .fill-work 或 SSOT 跑 acceptance-check，过闸再 merge。`,
        command:
          "node scripts/acceptance-check.mjs --root <TARGET> --domain api --gold",
      });
    } else if (String(b).startsWith("template_completeness:")) {
      actions.push({
        title: "补模板完整度",
        detail: `${b}。对照 api/func/db/redis 模板补必填章与示例列。`,
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
      .map((g) => `${g.domain}:${Math.round((g.ratio || 0) * 100)}%<${Math.round((g.target || 0) * 100)}%`)
      .join("、");
    actions.push({
      title: "按分域补覆盖（all_domains）",
      detail: `coverage_gaps：${tip}。开 fill-plan 对应域批次 → agents。`,
      command: "node scripts/fill-plan.mjs --root <TARGET> --status",
    });
  }

  if (score.ready?.coverage_incomplete) {
    actions.push({
      title: "先跑 inventory（代码清单）",
      detail: "默认写出 docs/<域>/.fill-work/inventory*.json，再 fill-plan / agents。",
      command:
        "node scripts/fill-inventory-api.mjs --root <TARGET> --all-modules",
    });
  } else if (
    blockers.includes("coverage_ready") ||
    (score.coverage &&
      typeof score.coverage.percent === "number" &&
      score.coverage.percent < 90)
  ) {
    const shards = Array.isArray(score.next_shards) ? score.next_shards : [];
    const top = shards
      .slice(0, 3)
      .map((s) => `${s.package || s.id}≈${s.count || "?"}`)
      .join("、");
    actions.push({
      title: "按批次补覆盖（fill-truths-agents）",
      detail: top
        ? `覆盖约 ${score.coverage.percent}%（${score.coverage.covered}/${score.coverage.code}）。优先：${top}`
        : `覆盖约 ${score.coverage?.percent ?? "?"}% 。走 agents，勿默认 auto 写 SSOT。`,
      command: null,
    });
  }

  if (atCeil && actions.length < 3) {
    actions.push({
      title: "不必再追更高形态总分",
      detail: `overall≈${overall}% ，formula_ceiling≈${ceil}% 。看 ai_coding_ready / Plan。`,
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
    out.push({
      id: d,
      name_zh: domainDisplayName(d),
      score: typeof q === "number" ? q : null,
      cap: score.domain_caps?.[d] ?? null,
      truths: x?.truths ?? null,
      shells: x?.shells ?? null,
      coverage_percent: cov?.percent ?? null,
      coverage_covered: cov?.covered ?? null,
      coverage_code: cov?.code ?? null,
      tone: st.tone,
      status_label: st.label,
    });
  }
  return out;
}

function buildShards(score) {
  const shards = Array.isArray(score.next_shards) ? score.next_shards : [];
  return shards.slice(0, 12).map((s) => {
    const id = s.id || "";
    const pkg = s.package || "(root)";
    const count =
      s.count ?? (Array.isArray(s.endpoints) ? s.endpoints.length : null);
    return {
      id,
      package: pkg,
      count,
      title: id || pkg,
      hint: count != null ? `约 ${count} 条` : "待估条目数",
      command: "node scripts/fill-plan.mjs --root <TARGET> --status",
    };
  });
}

function buildDiff(score) {
  const d = score.diff;
  if (!d || typeof d !== "object") return null;
  const overall = typeof d.overall === "number" ? d.overall : null;
  const domains = {};
  for (const k of Object.keys(d)) {
    if (k === "overall") continue;
    if (typeof d[k] === "number") domains[k] = d[k];
  }
  const sign = (n) => (n > 0 ? "+" : "") + n;
  let summary = "无相对上次变化";
  if (overall != null) {
    summary = "相对上次 overall " + sign(overall);
    const bits = Object.keys(domains).map((k) => k + " " + sign(domains[k]));
    if (bits.length) summary += "（" + bits.join("、") + "）";
  }
  return { overall, domains, summary };
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
  const nums = overall.filter((n) => typeof n === "number");
  let delta = null;
  if (nums.length >= 2) {
    delta = Math.round((nums[nums.length - 1] - nums[nums.length - 2]) * 10) / 10;
  }
  return {
    labels: historySeries.labels,
    overall: historySeries.overall,
    coverage: historySeries.coverage,
    ready: historySeries.ready,
    count: historySeries.labels.length,
    delta_overall: delta,
    summary:
      historySeries.labels.length < 2
        ? "历史不足 2 次，暂无趋势"
        : delta == null
          ? "已有 " + historySeries.labels.length + " 次评分快照"
          : "最近 overall Δ " +
            (delta > 0 ? "+" : "") +
            delta +
            "（共 " +
            historySeries.labels.length +
            " 点）",
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
      label_zh: "填充计划",
      done: !!plan.present,
    },
    {
      id: "batches",
      label_zh: "批次关闭",
      done: !!plan.all_closed,
    },
    {
      id: "semantic",
      label_zh: "语义闸",
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
    steps,
    summary:
      percent >= 100
        ? "流水线已达可 AI coding"
        : "进行中：" + current.label_zh + "（" + doneCount + "/" + steps.length + "）",
  };
}

/** 仪表参考分（≠开干）：形态×0.35 + 覆盖×0.25 + 金标×0.2 + 流水线×0.2；报告仅趋势台次区展示 */
function buildCompositeScore(score, pipeline) {
  const overall = typeof score.overall === "number" ? score.overall : null;
  const cov =
    typeof score.coverage?.percent === "number" ? score.coverage.percent : null;
  const gold =
    typeof score.gold_ratio === "number" ? score.gold_ratio * 100 : null;
  const pipe = typeof pipeline?.percent === "number" ? pipeline.percent : null;

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
      label_zh: "仪表参考分",
      breakdown: { overall, coverage: cov, gold_ratio: gold, pipeline: pipe },
      tip: "缺评分输入；≠开干",
    };
  }
  const value = Math.round((sum / weight) * 10) / 10;
  return {
    value,
    label_zh: "仪表参考分",
    breakdown: { overall, coverage: cov, gold_ratio: gold, pipeline: pipe },
    tip: "形态35%·覆盖25%·金标20%·流水线20% — 仅参考，开干只看 ai_coding_ready",
  };
}

/**
 * @param {object} score fill-score JSON
 * @param {object} [opts]
 * @param {object} [opts.history_series] prebuilt trend series
 * @param {object} [opts.run] pipeline run stats
 * @returns {object} ui projection
 */
export function buildReportUi(score, opts = {}) {
  const s = score && typeof score === "object" ? score : {};
  const cov = s.coverage || {};
  const domains = buildDomains(s);
  const missTop = buildMissTop(s);
  const domainStories = buildDomainStories(s);
  const lagging = domainStories.find((d) => d.tone === "warn") || domainStories[0];
  const diff = buildDiff(s);
  const run_timeline = buildRunTimeline(opts.run);
  const trend = buildTrend(opts.history_series || null);
  const showDomainCards = opts.show_domain_cards === true;
  const pipeline_progress = buildPipelineProgress(s);
  const composite_score = buildCompositeScore(s, pipeline_progress);
  return {
    version: "0.2.24",
    report_schema: "0.2.24",
    headline: buildHeadline(s),
    verdict: buildVerdict(s),
    gap_to_ready: buildGapToReady(s),
    decision_kpis: buildDecisionKpis(s),
    morph_strip: buildMorphStrip(s),
    coverage_strip: buildCoverageStrip(s),
    show_domain_cards: showDomainCards,
    composite_score,
    pipeline_progress,
    quality_overall: typeof s.overall === "number" ? s.overall : null,
    formula_ceiling: typeof s.formula_ceiling === "number" ? s.formula_ceiling : null,
    gold_ratio: typeof s.gold_ratio === "number" ? s.gold_ratio : null,
    template_completeness:
      typeof s.template_completeness?.overall === "number"
        ? s.template_completeness.overall
        : null,
    template_completeness_by_domain: s.template_completeness?.by_domain || null,
    coverage_percent: typeof cov.percent === "number" ? cov.percent : null,
    coverage_covered: cov.covered ?? null,
    coverage_code: cov.code ?? null,
    ready_rule: s.ai_coding_ready?.rule || s.ready?.rule || null,
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
    next_actions: buildNextActions(s),
    shards: buildShards(s),
    diff,
    trend,
    run_timeline,
    suggest_upgrade: s.suggest_upgrade || null,
    glossary: GLOSSARY,
    suggest_raw: s.suggest_next || null,
    disclaimer:
      "本报告不是契约真相。契约见 docs/func|api|db|redis；踩坑回流见 docs/agent-kb/。施工产物默认在 docs/harness-eng/。",
  };
}

export { DOMAIN_ZH, GLOSSARY, MISS_ZH };
