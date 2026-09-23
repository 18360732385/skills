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
    if (/关联\s*(API|接口|表)|相关表|关联接口/.test(text)) {
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
    const biz = text.match(/业务说明|表说明|用途[：:]|表级([\s\S]{0,400})/);
    if (biz && String(biz[0] || "").replace(/业务说明|表说明|用途[：:]|表级/g, "").trim().length > 20) {
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
  }

  return { points: Math.min(25, points), issues, parts };
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
