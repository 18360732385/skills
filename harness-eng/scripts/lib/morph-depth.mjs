/**
 * 0.7.0 morph depth bonuses (reuse acceptance-style heuristics).
 * Probe tier ≈75; depth ≈+25 → theoretical max 100 per domain.
 */
import {
  apiExampleFillRatio,
  dbCommentFillRatio,
  funcMethodDescFillRatio,
  redisHasExampleOrUnknown,
  redisHasTtlContent,
} from "./doc-density.mjs";

function apiLogicStepCount(raw) {
  const logicBlock = raw.match(/###\s*功能逻辑([\s\S]*?)(?=###\s*|$)/i);
  if (!logicBlock) return 0;
  const steps = (logicBlock[1].match(/^\s*(?:[-*]|\d+[.)])\s+\S+/gm) || []).filter(
    (l) => !/成功\/失败以 Service|返回 AjaxResult；成功/.test(l)
  );
  return steps.length;
}

function apiHasEvidence(raw) {
  return /\*\*evidence[:：]\*\*/i.test(raw) || /evidence\s*[：:]\s*`[^`]+`/i.test(raw);
}

function apiIsEchoDesc(raw) {
  const desc = (raw.match(/\*\*功能描述[:：]\*\*\s*([^\n]+)/i) || [])[1] || "";
  return /域接口/.test(desc) && /处理\s*`?\//.test(desc);
}

function hasRedisValueHeading(raw) {
  return /##\s*Value(?:\s*结构)?/i.test(raw);
}

function hasRedisTtlHeading(raw) {
  return /##\s*TTL|TTL\s*策略|过期/i.test(raw);
}

/**
 * Depth points 0–25 (and optional issues).
 * @returns {{ points: number, issues: string[], parts: Record<string, number> }}
 */
export function morphDepthBonus(raw, domain) {
  const text = raw || "";
  const parts = {};
  const issues = [];
  let points = 0;

  if (domain === "api") {
    if (apiHasEvidence(text)) {
      parts.evidence = 6;
      points += 6;
    } else {
      issues.push("深度:缺 evidence");
    }
    const steps = apiLogicStepCount(text);
    if (steps >= 2) {
      parts.logic = 7;
      points += 7;
    } else {
      issues.push("深度:功能逻辑<2步");
    }
    const ex = apiExampleFillRatio(text);
    if (ex.hasColumn && ex.total > 0) {
      const pts = Math.round(7 * Math.min(1, ex.ratio));
      parts.examples = pts;
      points += pts;
      if (ex.ratio < 0.9) issues.push("深度:示例值未齐");
    } else {
      issues.push("深度:缺示例值列");
    }
    if (!apiIsEchoDesc(text) && /\*\*功能描述[:：]\*\*\s*\S+/i.test(text)) {
      parts.non_echo = 5;
      points += 5;
    } else {
      issues.push("深度:描述回声/缺失");
    }
  } else if (domain === "func") {
    const md = funcMethodDescFillRatio(text);
    if (md.total > 0) {
      const pts = Math.round(10 * Math.min(1, md.ratio));
      parts.method_desc = pts;
      points += pts;
      if (md.ratio < 0.7) issues.push("深度:方法说明偏空");
    } else if (/方法清单|功能说明/.test(text)) {
      parts.method_desc = 5;
      points += 5;
    } else {
      issues.push("深度:缺方法说明");
    }
    // 0.7.25 SG-4: also accept ### 关联文档
    if (/关联\s*(API|接口|表|文档)|相关表|关联接口/.test(text)) {
      parts.links = 8;
      points += 8;
    } else {
      issues.push("深度:缺关联 API/表");
    }
    if (/evidence:\s*`[^`]+`/i.test(text) || /\*\*evidence[:：]\*\*/i.test(text)) {
      parts.evidence = 7;
      points += 7;
    } else {
      issues.push("深度:缺 evidence 路径");
    }
  } else if (domain === "db") {
    const dens = dbCommentFillRatio(text);
    if (dens.total > 0 && dens.ratio >= 0.5) {
      parts.comment = 15;
      points += 15;
    } else if (dens.total > 0 && dens.ratio >= 0.2) {
      parts.comment = 8;
      points += 8;
      issues.push("深度:COMMENT 率偏低");
    } else {
      issues.push("深度:COMMENT 不足");
    }
    // 0.7.25 SG-3 / 0.7.34 FS-6: capture full section body (no {0,400} cap — long 业务说明 must not fail)
    const bizSec = text.match(
      /##\s*(?:业务说明|表说明)\s*\n([\s\S]*?)(?=\n##\s+|$)/i
    );
    const bizInline = text.match(/用途[：:]\s*([^\n]{20,})/);
    const bizTableLevel = text.match(/表级[^\n]*\n([\s\S]*?)(?=\n##\s+|$)/);
    const bizBody = String(
      (bizSec && bizSec[1]) || (bizInline && bizInline[1]) || (bizTableLevel && bizTableLevel[1]) || ""
    )
      .replace(/```[\s\S]*?```/g, "")
      .trim();
    if (bizBody.length > 20) {
      parts.business = 10;
      points += 10;
    } else {
      issues.push("深度:业务说明偏薄");
    }
  } else if (domain === "redis") {
    if (redisHasTtlContent(text)) {
      parts.ttl = 8;
      points += 8;
    } else {
      issues.push("深度:缺 TTL 证据");
    }
    if (redisValueEvidenceOk(text)) {
      parts.value = 9;
      points += 9;
    } else {
      issues.push("深度:Value 证据不足");
    }
    if (redisHasExampleOrUnknown(text)) {
      parts.example = 8;
      points += 8;
    } else {
      issues.push("深度:缺 Key 示例");
    }
  } else if (domain === "jobs") {
    if (/##\s*代码锚点|Registry/i.test(text)) {
      parts.anchors = 10;
      points += 10;
    } else {
      issues.push("深度:缺代码锚点");
    }
    const openapiDump =
      /###\s*请求参数/.test(text) &&
      /\|\s*字段\s*\|\s*类型\s*\|/.test(text) &&
      /OpenAPI|接口地址/.test(text);
    if (!openapiDump) {
      parts.no_openapi = 8;
      points += 8;
    } else {
      issues.push("深度:疑似 OpenAPI 误抄");
    }
    if (/task_code|##\s*标识/i.test(text) && /##\s*Cron|cronConfigKey|默认表达式/i.test(text)) {
      parts.id_cron = 7;
      points += 7;
    } else {
      issues.push("深度:标识/Cron 交叉不足");
    }

  } else if (domain === "design") {
    if (/留原地/.test(text) && /tokens?\.css|运行源码|packages\/theme/i.test(text)) {
      parts.runtime_inplace = 8;
      points += 8;
    } else {
      issues.push("深度:未标明 runtime 留原地");
    }
    if (hasRealPathRef(text)) {
      parts.paths = 9;
      points += 9;
    } else {
      issues.push("深度:缺真实资产路径");
    }
    const content = extractSection(text, /##\s*内容/) || "";
    if (contentTableOrLong(content)) {
      parts.content_substance = 8;
      points += 8;
    } else {
      issues.push("深度:内容偏薄");
    }
  } else if (domain === "prototype") {
    if (/docs\/ui-prototypes|docs\/prototype\//.test(text)) {
      parts.root = 10;
      points += 10;
    } else {
      issues.push("深度:缺原型真实路径");
    }
    if (/不搬|留原地|未(?:经确认)?.*归档|尚未.*归档|现行对照|docs\/pages/.test(text)) {
      parts.archive_or_page = 8;
      points += 8;
    } else {
      issues.push("深度:缺归档纪律或页面映射");
    }
    const ev = extractSection(text, /##\s*变体与演进/) || "";
    if (variantSubstance(ev) || /已选|弃用|权威|优选|勿再作实现基准/.test(text)) {
      parts.variants = 7;
      points += 7;
    } else {
      issues.push("深度:变体与演进偏薄");
    }
  } else if (domain === "pages") {
    if (hasRealPathRef(text) && /\.(?:tsx|jsx|vue)\b/.test(text)) {
      parts.entry = 8;
      points += 8;
    } else {
      issues.push("深度:缺真实入口文件");
    }
    if (/docs\/ui-prototypes|docs\/prototype|无原型|无独立原型/.test(text)) {
      parts.proto = 9;
      points += 9;
    } else {
      issues.push("深度:缺原型映射或「无原型」声明");
    }
    const duty = extractSection(text, /##\s*职责/) || "";
    if (duty.replace(/TODO\(harness-eng\)/gi, "").trim().length > 80) {
      parts.duty = 8;
      points += 8;
    } else {
      issues.push("深度:职责偏薄");
    }
  } else if (domain === "components") {
    if (hasRealPathRef(text)) {
      parts.path = 10;
      points += 10;
    } else {
      issues.push("深度:缺组件源码路径");
    }
    if (/props|变体/i.test(text) && text.replace(/TODO\(harness-eng\)/gi, "").length > 200) {
      parts.props = 8;
      points += 8;
    } else {
      issues.push("深度:缺 props/变体实质");
    }
    if (/token 依赖|docs\/design|无 token/.test(text)) {
      parts.token = 7;
      points += 7;
    } else {
      issues.push("深度:缺 token 依赖声明");
    }
  } else if (domain === "client-api") {
    if (/契约回链/.test(text) && /docs\/api|外部仓|生成物/.test(text)) {
      parts.link = 10;
      points += 10;
    } else {
      issues.push("深度:缺契约回链（docs/api 或外部仓/生成物）");
    }
    if (
      /态 A|fullstack|禁止[^\n]{0,20}字段|不展开[^\n]{0,20}字段/.test(text) ||
      (/态 B|字段级/.test(text) && /\|\s*字段\s*\|/.test(text))
    ) {
      parts.dual = 8;
      points += 8;
    } else {
      issues.push("深度:缺双态填写（态 A 回链或态 B 字段表）");
    }
    if (
      /`?(?:GET|POST|PUT|PATCH|DELETE)`?\s+\//.test(text) ||
      (/端点消费/.test(text) && /\/[A-Za-z][\w./-]*/.test(text))
    ) {
      parts.endpoints = 7;
      points += 7;
    } else {
      issues.push("深度:消费表缺真实端点");
    }
  }


  return { points: Math.min(25, points), issues, parts };
}


const FRONTEND_MORPH_DOMAINS = new Set([
  "design",
  "prototype",
  "pages",
  "components",
  "client-api",
]);

export function isFrontendMorphDomain(domain) {
  return FRONTEND_MORPH_DOMAINS.has(domain);
}

function extractSection(raw, headingRe) {
  const flags = headingRe.flags.includes("i") ? "i" : "";
  const re = new RegExp(headingRe.source + "\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)", flags);
  const m = String(raw || "").match(re);
  return m ? m[1] : null;
}

function sectionFilled(raw, headingRe, minLen = 40) {
  const body = extractSection(raw, headingRe);
  if (body == null) return false;
  const t = body.replace(/TODO\(harness-eng\)/gi, "").replace(/\s+/g, " ").trim();
  return t.length >= minLen;
}

function hasRealPathRef(text) {
  return (
    /`[^`]*(?:\.(?:tsx?|jsx?|vue|css|md|html))[^`]*`/.test(text) ||
    /`[^`]*(?:packages\/|apps\/|docs\/)[^`]+`/.test(text)
  );
}

function contentTableOrLong(content) {
  const body = String(content || "").replace(/TODO\(harness-eng\)/gi, "").trim();
  const rows = (body.match(/^\|.*\|/gm) || []).filter(
    (r) => !/^\|\s*:?-/.test(r) && !/^\|\s*-{2,}/.test(r)
  );
  return rows.length >= 2 || body.length > 120;
}

function variantSubstance(ev) {
  const body = String(ev || "").replace(/TODO\(harness-eng\)/gi, "").trim();
  const rows = (body.match(/^\|.*\|/gm) || []).filter(
    (r) => !/^\|\s*:?-/.test(r) && !/^\|\s*-{2,}/.test(r)
  );
  return rows.length >= 2 || body.length > 80;
}

/**
 * Probe-tier points for frontend domains (0.8.1 templates).
 * Added on top of base 10 + optional length+5; caller caps at 75.
 * Empty TODO(harness-eng) headings must not earn the bonus.
 */
export function frontendProbeBonus(raw, domain) {
  const text = raw || "";
  const issues = [];
  let points = 0;
  const add = (ok, pts, issue) => {
    if (ok) points += pts;
    else if (issue) issues.push(issue);
  };

  if (domain === "design") {
    add(sectionFilled(text, /##\s*资产定位/, 40), 20, "缺填写的资产定位");
    add(sectionFilled(text, /##\s*内容/, 40), 20, "缺填写的内容");
    add(sectionFilled(text, /##\s*变更触发/, 20), 15, "缺变更触发");
    add(/##\s*变更记录/.test(text) && /\|\s*v\d+/.test(text), 5, null);
  } else if (domain === "prototype") {
    add(sectionFilled(text, /##\s*资产定位/, 40), 20, "缺填写的资产定位");
    add(sectionFilled(text, /##\s*变体与演进/, 40), 20, "缺填写的变体与演进");
    add(sectionFilled(text, /##\s*变更触发/, 20), 15, "缺变更触发");
    add(/##\s*变更记录/.test(text) && /\|\s*v\d+/.test(text), 5, null);
  } else if (domain === "pages") {
    add(
      sectionFilled(text, /##\s*页面定位/, 40) && /路由|入口|\//.test(text),
      20,
      "缺填写的页面定位/路由/入口"
    );
    add(sectionFilled(text, /##\s*职责/, 40), 15, "缺填写的职责");
    add(
      /原型映射|docs\/prototype|docs\/ui-prototypes|无原型/.test(text) &&
        sectionFilled(text, /##\s*原型映射/, 20),
      15,
      "缺原型映射"
    );
    add(sectionFilled(text, /##\s*变更触发/, 20), 10, "缺变更触发");
  } else if (domain === "components") {
    add(
      sectionFilled(text, /##\s*组件定位/, 30) ||
        (/归属/.test(text) && sectionFilled(text, /##\s*组件定位/, 20)),
      15,
      "缺组件定位/归属"
    );
    add(sectionFilled(text, /##\s*用途/, 30), 15, "缺用途");
    add(/props|变体/i.test(text) && !/TODO\(harness-eng\).*props/i.test(text), 15, "缺 props/变体");
    add(/token 依赖|docs\/design|无 token/.test(text), 10, "缺 token 依赖");
    add(sectionFilled(text, /##\s*变更触发/, 20), 10, "缺变更触发");
  } else if (domain === "client-api") {
    add(
      sectionFilled(text, /##\s*端点消费(?:表)?/, 40) &&
        (/\|\s*/.test(text) || /createApiClient|createUse|api\./.test(text)),
      25,
      "缺填写的端点消费表"
    );
    add(
      sectionFilled(text, /##\s*契约回链/, 40) && /docs\/api|外部仓|生成物/.test(text),
      20,
      "缺契约回链"
    );
    add(sectionFilled(text, /##\s*变更触发/, 20), 15, "缺变更触发");
  }

  return { points, issues };
}


/** Value-evidence quality (heading alone is probe-tier). */
function redisValueEvidenceOk(raw) {
  const sec = raw.match(/##\s*Value(?:\s*结构)?[\s\S]*?(?=\n##\s+|$)/i);
  if (!sec) return false;
  const b = sec[0];
  if (/TODO\(harness-eng\)/i.test(b) && b.replace(/##\s*Value(?:\s*结构)?/i, "").trim().length < 40)
    return false;
  if (/\|\s*`[^`]+`\s*\|/.test(b)) return true;
  if (/\|\s*字段\s*\|\s*类型\s*\|/i.test(b) || /\|\s*项\s*\|\s*说明\s*\|/i.test(b)) return true;
  if (/\|/.test(b) && /类型|说明|String|Hash|List|ZSet|JSON/i.test(b)) return true;
  return b.replace(/##\s*Value(?:\s*结构)?/i, "").trim().length > 20;
}

export {
  apiLogicStepCount,
  apiHasEvidence,
  apiIsEchoDesc,
  hasRedisValueHeading,
  hasRedisTtlHeading,
};
