/**
 * harness-eng 0.6.0-dev M2 document topology.
 * Root basename → canonical path relative to skill root.
 * Identity entries (SKILL, glossary, …) omitted; resolveDoc falls back to basename.
 */
import path from "path";
export const DOC_MOVES = {
  "detect.md": "modes/detect.md",
  "resume.md": "modes/resume.md",
  "pipeline.md": "modes/pipeline.md",
  "pipeline-fill.md": "modes/pipeline-fill.md",
  "audit-report.md": "modes/audit-report.md",
  "upgrade.md": "modes/upgrade.md",
  "seed-truths.md": "modes/seed-truths.md",
  "write-plan.md": "modes/write-plan.md",
  "recommended-profile.md": "modes/recommended-profile.md",
  "conflict-policy.md": "modes/conflict-policy.md",
  "prefill.md": "modes/prefill.md",
  "ladder.md": "modes/ladder.md",
  "session-dashboard.md": "modes/session-dashboard.md",
  "examples.md": "modes/examples.md",
  "foreign-playbook.md": "modes/foreign-playbook.md",
  "domain-extend.md": "modes/domain-extend.md",
  "truth-quality.md": "modes/truth-quality.md",
  "questions.md": "modes/questions.md",
  "fill.md": "fill/fill.md",
  "fill-score.md": "fill/fill-score.md",
  "fill-morph.md": "fill/fill-morph.md",
  "fill-gate.md": "fill/fill-gate.md",
  "fill-plan.md": "fill/fill-plan.md",
  "fill-truths-agents.md": "fill/fill-truths-agents.md",
  "fill-truths.md": "fill/fill-truths.md",
  "fill-workers.md": "fill/fill-workers.md",
  "fill-mcp.md": "fill/fill-mcp.md",
  "ai-tools.md": "host/ai-tools.md",
  "sync-hosts.md": "host/sync-hosts.md",
};

/** Old-path stubs kept at skill root (thin redirect). Others are fully relinked in-repo. */
export const ROOT_STUBS = [
  "write-plan.md",
  "detect.md",
  "fill.md",
  "pipeline.md",
  "fill-truths-auto.md",
];

/** Canonical root docs that stay (not stubs, not moved). */
export const ROOT_KEEP = [
  "AGENT-INDEX.md",
  "CHANGELOG.md",
  "glossary.md",
  "QUICKSTART.md",
  "README.md",
  "ROADMAP-0.6.0.md",
  "SKILL.md",
  "VERIFY.md",
  "使用手册.md",
  "使用手册-摘要.md",
];

export const ROOT_MD_MAX = 20;

export function resolveDocRel(basename) {
  return DOC_MOVES[basename] || basename;
}

export function resolveDoc(skillRoot, basename) {
  return path.join(skillRoot, resolveDocRel(basename));
}
