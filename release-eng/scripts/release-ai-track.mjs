#!/usr/bin/env node
/**
 * release-ai-track — 双轨研判：从 freeze 生成 AI 提示 / 合并模型 JSON
 *
 * Usage:
 *   node release-ai-track.mjs --freeze-json <file> --format prompt-md|prompt-json|json
 *   node release-ai-track.mjs --freeze-json <file> --ai-json <file> --format json
 *
 * 不调用外部模型；仪式内模型读 prompt 后写 --ai-json。
 * 合并后 draft 行数不得减少（仅打标 aiSuggestSuppress / aiSuggestKeep）。
 * Exit 0=ok
 */
import fs from "fs";
import path from "path";

const NEED_AI_CONF = new Set(["path"]);

function parseArgs(argv) {
  const out = {
    root: process.cwd(),
    freezeJson: null,
    aiJson: null,
    format: "prompt-md",
    out: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = path.resolve(argv[++i] || "");
    else if (a === "--freeze-json") out.freezeJson = argv[++i];
    else if (a === "--ai-json") out.aiJson = argv[++i];
    else if (a === "--format") out.format = argv[++i] || "prompt-md";
    else if (a === "--out") out.out = argv[++i] || null;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function needsAi(obj) {
  if (!obj) return false;
  if (obj.priorOnly) return true;
  if (obj.confidence && NEED_AI_CONF.has(obj.confidence)) return true;
  if (obj.description === "待补" || obj.说明 === "待补") return true;
  return false;
}

/** 从 freeze 抽出待 AI 研判项 */
export function collectAiCandidates(freeze) {
  const items = [];
  const seen = new Set();
  const push = (row) => {
    const k = `${row.kind}:${row.stableId}`;
    if (!row.stableId || seen.has(k)) return;
    seen.add(k);
    items.push(row);
  };

  for (const o of freeze.changeObjects || []) {
    if (!o.inDraft && !o.priorOnly) continue;
    if (!needsAi(o) && !o.priorOnly) continue;
    push({
      kind: o.kind,
      stableId: o.stableId,
      path: o.path || null,
      confidence: o.confidence || null,
      priorOnly: Boolean(o.priorOnly),
      sources: o.sources || [],
      hint: o.priorOnly ? "prior-only：清单有但基线无" : `confidence=${o.confidence}`,
    });
  }

  for (const r of freeze.draft?.config || []) {
    if (r.说明 === "待补" || r.priorOnly || NEED_AI_CONF.has(r.confidence)) {
      push({
        kind: "config",
        stableId: r.键,
        path: r.来源,
        confidence: r.confidence,
        priorOnly: Boolean(r.priorOnly),
        sources: ["draft"],
        hint: r.说明 === "待补" ? "说明待补" : r.priorOnly ? "prior-only" : "low-confidence",
        valuePreview: String(r.值 ?? "").slice(0, 80),
      });
    }
  }
  for (const r of freeze.draft?.sql || []) {
    if (r.priorOnly || NEED_AI_CONF.has(r.confidence)) {
      push({
        kind: "sql",
        stableId: r.脚本,
        path: r.路径,
        confidence: r.confidence,
        priorOnly: Boolean(r.priorOnly),
        sources: ["draft"],
        hint: r.priorOnly ? "prior-only" : "path-confidence",
      });
    }
  }
  for (const r of freeze.draft?.jobs || []) {
    if (r.priorOnly || NEED_AI_CONF.has(r.confidence) || !r.说明) {
      push({
        kind: "jobs",
        stableId: r.taskCode || r["task / cron 键"],
        path: r.真相 || null,
        confidence: r.confidence,
        priorOnly: Boolean(r.priorOnly),
        sources: ["draft"],
        hint: r.priorOnly ? "prior-only" : "jobs-review",
      });
    }
  }

  return items;
}

function buildPromptMd(freeze, items) {
  const lines = [];
  lines.push("# release-eng 双轨研判提示");
  lines.push("");
  lines.push(`- range: \`${freeze.range || ""}\``);
  lines.push(`- candidatePolicy: ${freeze.candidatePolicy || ""}`);
  lines.push(
    `- draft: sql=${freeze.draft?.sql?.length || 0} config=${freeze.draft?.config?.length || 0} jobs=${freeze.draft?.jobs?.length || 0}`
  );
  lines.push(`- 待研判: ${items.length}`);
  lines.push("");
  lines.push("## 任务");
  lines.push("");
  lines.push("你是发版清单降噪助手。规则轨 `draft` 已保证召回；请对下列项分类：");
  lines.push("- **aiRanked**：建议问卷默认确认上线（keep）");
  lines.push("- **aiNoise**：建议问卷默认不勾选（仍留在 draft，用户可拉回）");
  lines.push("");
  lines.push("只输出一个 JSON 对象（不要 Markdown 围栏），字段：`aiRanked`、`aiNoise`。");
  lines.push("`stableId` / `kind` 必须来自下表。不要发明新键。");
  lines.push("");
  lines.push("## 待研判项");
  lines.push("");
  lines.push("| kind | stableId | confidence | priorOnly | hint | path |");
  lines.push("|---|---|---|---|---|---|");
  if (!items.length) {
    lines.push("| — | （无） | — | — | 可跳过 AI 轨 | — |");
  } else {
    for (const it of items.slice(0, 80)) {
      lines.push(
        `| ${it.kind} | \`${it.stableId}\` | ${it.confidence || ""} | ${it.priorOnly ? "是" : ""} | ${it.hint || ""} | ${it.path || ""} |`
      );
    }
    if (items.length > 80) {
      lines.push(`| … | 另有 ${items.length - 80} 条未列入本批 | | | | |`);
      lines.push("");
      lines.push(
        `> 截断说明：本批仅列前 80 条；未列入的 ${items.length - 80} 条**保持规则轨默认**（留在 draft、问卷正常展示，无 AI 默认勾选），不会被静默删除。如需全量研判，请分批：先合并本批，再对剩余项重跑 prompt。`
      );
    }
  }
  lines.push("");
  lines.push("## 输出示例");
  lines.push("");
  lines.push(
    '{"aiRanked":[{"kind":"sql","stableId":"V0003__x.sql","recommend":"keep","reason":"本轮新增 migration"}],"aiNoise":[{"kind":"config","stableId":"sms.ai.demo","reason":"非 prod 上线项"}]}'
  );
  lines.push("");
  return lines.join("\n");
}

/** 合并 AI 结果：打标，不删 draft */
export function mergeAiTrack(freeze, aiPayload) {
  const aiRanked = Array.isArray(aiPayload?.aiRanked) ? aiPayload.aiRanked : [];
  const aiNoise = Array.isArray(aiPayload?.aiNoise) ? aiPayload.aiNoise : [];

  // 候选集 SSOT：stableId 必须来自本轮 collectAiCandidates；未知键不进打标、进 warnings（防模型发明新键）
  const candidateKeys = new Set(collectAiCandidates(freeze).map((it) => `${it.kind}:${it.stableId}`));
  const unknownKeys = [];
  const known = (x) => {
    const k = `${x.kind}:${x.stableId}`;
    if (!x.kind || !x.stableId) return false;
    if (!candidateKeys.has(k)) {
      unknownKeys.push(k);
      return false;
    }
    return true;
  };
  const rankedOk = aiRanked.filter(known);
  const noiseOk = aiNoise.filter(known);
  const noiseSet = new Set(noiseOk.map((x) => `${x.kind}:${x.stableId}`));
  const rankedSet = new Set(rankedOk.map((x) => `${x.kind}:${x.stableId}`));

  const draftBefore = {
    sql: freeze.draft?.sql?.length || 0,
    config: freeze.draft?.config?.length || 0,
    jobs: freeze.draft?.jobs?.length || 0,
  };

  const markRow = (kind, row) => {
    const id =
      kind === "sql" ? row.脚本 : kind === "config" ? row.键 : row.taskCode || row["task / cron 键"];
    const k = `${kind}:${id}`;
    const next = { ...row };
    if (noiseSet.has(k)) {
      next.aiSuggestSuppress = true;
      next.aiReason = noiseOk.find((x) => `${x.kind}:${x.stableId}` === k)?.reason || "";
    }
    if (rankedSet.has(k)) {
      next.aiSuggestKeep = true;
      next.aiReason =
        rankedOk.find((x) => `${x.kind}:${x.stableId}` === k)?.reason || next.aiReason || "";
    }
    return next;
  };

  const next = {
    ...freeze,
    draft: {
      sql: (freeze.draft?.sql || []).map((r) => markRow("sql", r)),
      config: (freeze.draft?.config || []).map((r) => markRow("config", r)),
      jobs: (freeze.draft?.jobs || []).map((r) => markRow("jobs", r)),
    },
    changeObjects: (freeze.changeObjects || []).map((o) => {
      const k = `${o.kind}:${o.stableId}`;
      const n = { ...o };
      if (noiseSet.has(k)) {
        n.aiSuggestSuppress = true;
        n.aiReason = noiseOk.find((x) => `${x.kind}:${x.stableId}` === k)?.reason || "";
      }
      if (rankedSet.has(k)) {
        n.aiSuggestKeep = true;
        n.aiReason =
          rankedOk.find((x) => `${x.kind}:${x.stableId}` === k)?.reason || n.aiReason || "";
      }
      return n;
    }),
    aiTrack: {
      status: "filled",
      policy: "dual-track",
      filledAt: new Date().toISOString(),
      aiRanked: rankedOk,
      aiNoise: noiseOk,
      rejectedUnknown: unknownKeys,
      draftCountsUnchanged: true,
      draftBefore,
      draftAfter: { ...draftBefore },
      warnings: [],
    },
  };

  const after = {
    sql: next.draft.sql.length,
    config: next.draft.config.length,
    jobs: next.draft.jobs.length,
  };
  if (after.sql !== draftBefore.sql || after.config !== draftBefore.config || after.jobs !== draftBefore.jobs) {
    throw new Error("AI merge must not change draft row counts");
  }
  next.aiTrack.draftAfter = after;
  for (const x of [...aiRanked, ...aiNoise]) {
    if (!x.kind || !x.stableId) {
      next.aiTrack.warnings.push(`invalid entry missing kind/stableId: ${JSON.stringify(x)}`);
    }
  }
  if (unknownKeys.length) {
    next.aiTrack.warnings.push(
      `rejected ${unknownKeys.length} unknown stableId(s) not in candidates: ${unknownKeys.slice(0, 10).join(", ")}${unknownKeys.length > 10 ? " …" : ""}`
    );
  }
  return next;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage:
  node release-ai-track.mjs --freeze-json <file> --format prompt-md|prompt-json [--out <file>]
  node release-ai-track.mjs --freeze-json <file> --ai-json <file> --format json [--out <file>]
  --out <file>  落盘到文件（PowerShell 必用，规避 > 重定向写 UTF-16 BOM）`);
    process.exit(0);
  }
  if (!args.freezeJson) {
    console.error("require --freeze-json");
    process.exit(1);
  }

  const freezePath = path.isAbsolute(args.freezeJson)
    ? args.freezeJson
    : path.join(args.root, args.freezeJson);
  const freeze = JSON.parse(fs.readFileSync(freezePath, "utf8"));
  const items = collectAiCandidates(freeze);

  const emit = (text) => {
    if (args.out) {
      fs.writeFileSync(args.out, text + "\n", "utf8");
      console.log(`written ${args.out}`);
    } else {
      console.log(text);
    }
  };

  if (args.format === "prompt-md") {
    emit(buildPromptMd(freeze, items));
    process.exit(0);
  }
  if (args.format === "prompt-json") {
    emit(
      JSON.stringify(
        {
          status: items.length ? "ready" : "skipped",
          range: freeze.range,
          items,
          schema: {
            aiRanked: [{ kind: "sql|config|jobs", stableId: "", recommend: "keep", reason: "" }],
            aiNoise: [{ kind: "sql|config|jobs", stableId: "", reason: "" }],
          },
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  if (args.format === "json") {
    if (!args.aiJson) {
      const out = {
        ...freeze,
        aiTrack: {
          ...(freeze.aiTrack || {}),
          status: items.length ? "ready" : "skipped",
          policy: "dual-track",
          pendingItems: items.length,
          aiRanked: freeze.aiTrack?.aiRanked || [],
          aiNoise: freeze.aiTrack?.aiNoise || [],
          note: items.length
            ? "请用 --ai-json 合并模型产出；或仪式内直接填写后 merge"
            : "无待研判项，可跳过 AI 轨",
        },
      };
      emit(JSON.stringify(out, null, 2));
      process.exit(0);
    }
    const aiPath = path.isAbsolute(args.aiJson) ? args.aiJson : path.join(args.root, args.aiJson);
    const aiPayload = JSON.parse(fs.readFileSync(aiPath, "utf8"));
    const merged = mergeAiTrack(freeze, aiPayload);
    emit(JSON.stringify(merged, null, 2));
    process.exit(0);
  }

  console.error(`unknown --format ${args.format}`);
  process.exit(1);
}

try {
  main();
} catch (e) {
  console.error(String(e.message || e));
  process.exit(1);
}
