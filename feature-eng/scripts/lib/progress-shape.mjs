/**
 * feature-eng progress.yaml 轻量形状（枚举 + monorepo 条件）
 */

export const PATH_ENUM = new Set(["spike", "bounded", "full", null]);
export const RUN_MODE_ENUM = new Set(["guided", "express", "unattended", null]);
export const INVOKE_ENUM = new Set(["strict", "inline", null]);
export const HANDOFF_ENUM = new Set(["auto", "confirm", null]);
export const REVIEW_ENUM = new Set(["subagent", "inline", null]);
export const CHEF_ENUM = new Set(["bound", "controller_proxy", null]);
export const DOMAIN_PROTO_ENUM = new Set([
  "skipped",
  "skipped_by_user",
  "entered",
  null,
]);
export const LAYOUT_ENUM = new Set(["monorepo", "multi_repo", null]);
export const PACKAGE_ROLES = new Set(["api", "web", "other"]);

/** stage 用连字符；gates.pre_impl 用下划线（见 progress.yaml.tmpl 别名表） */
export const STAGE_ENUM = new Set([
  "triage",
  "grill",
  "design",
  "domain-bridge",
  "domain",
  "spec",
  "plan",
  "proto-bridge",
  "proto",
  "testdesign",
  "pre-impl",
  "implement",
  "gate",
  "verify",
  "close",
  "done",
  "smoke",
  "diagnose",
  null,
]);

/**
 * progress.yaml 结构契约单一事实源（0.2.26 单源收敛）：
 * selfcheck（validateProgressShape）/ gate-evidence / close-check 共用，勿在脚本内复制。
 */
/** 顶层键契约（progress.yaml.tmpl ↔ 夹具共用） */
export const PROGRESS_TOP_KEYS = [
  "slug",
  "title",
  "created_at",
  "updated_at",
  "path",
  "run_mode",
  "invoke",
  "handoff_policy",
  "review_policy",
  "chef_mode",
  "stage",
  "domain",
  "proto",
  "artifacts",
  "tasks",
  "gates",
  "env_verified",
  "env_notes",
  "layout",
  "packages",
  "docs_root",
  "sibling_repos",
  "accepted_residual",
];

/** artifacts: 子键契约（adr 为数组，其余为路径或 null） */
export const ARTIFACT_KEYS = [
  "adr",
  "spec",
  "plan",
  "proto",
  "context_delta",
  "testcases",
  "test_report",
  "qa_report",
  "implement",
  "pr_url",
];

/** 9 闸键契约（gates: 子键） */
export const GATE_KEYS = [
  "triage",
  "shared_understanding",
  "design_confirmed",
  "go",
  "proto_confirmed",
  "pre_impl",
  "gate",
  "verify",
  "close",
];

/** ISO 闸 → 必须落盘的 L2 审核文件（null = 该闸不要求 L2） */
export const L2_FOR_GATE = {
  triage: null,
  shared_understanding: "审核-grill.md",
  design_confirmed: "审核-design.md",
  go: "审核-plan.md",
  proto_confirmed: null,
  pre_impl: null,
  gate: "审核-gate.md",
  verify: "审核-verify.md",
  close: null,
};

export function parseScalar(text, key) {
  if (!text) return undefined;
  const m = text.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!m) return undefined;
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (v === "null" || v === "~" || v === "") return null;
  return v;
}

/**
 * Very light packages parse: lines under packages: with role:
 * Returns { ok, roles[], empty }
 */
export function parsePackagesRoles(text) {
  if (!text) return { ok: false, roles: [], empty: true };
  const start = text.search(/^packages:\s*$/m);
  if (start < 0) {
    // 无块状 packages: 键（含内联 packages: null / 整键缺失）一律视为 nullish
    // —— 原写法 `inlineNull || true` 恒真，语义即“缺失视为 null”，据此钉死。
    return { ok: true, roles: [], empty: true, nullish: true };
  }
  const from = text.slice(start);
  const firstNl = from.indexOf("\n");
  const body = firstNl < 0 ? "" : from.slice(firstNl + 1);
  const nextTop = body.search(/^[a-zA-Z_][\w]*:/m);
  const block = nextTop < 0 ? body : body.slice(0, nextTop);
  if (/^\s*null\s*$/m.test(block.trim()) || !block.trim()) {
    return { ok: true, roles: [], empty: true, nullish: true };
  }
  const roles = [];
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^\s+-\s+role:\s*(\S+)/) || line.match(/^\s+role:\s*(\S+)/);
    if (m) {
      let r = m[1].trim().replace(/["']/g, "");
      if (r === "null" || r === "~") continue;
      roles.push(r);
    }
  }
  return { ok: true, roles, empty: roles.length === 0, nullish: false };
}

/**
 * @returns {string[]} issues
 */
export function validateProgressEnums(text, { requireFilledEnums = false } = {}) {
  const issues = [];
  const checks = [
    ["path", PATH_ENUM],
    ["run_mode", RUN_MODE_ENUM],
    ["invoke", INVOKE_ENUM],
    ["handoff_policy", HANDOFF_ENUM],
    ["review_policy", REVIEW_ENUM],
    ["chef_mode", CHEF_ENUM],
    ["stage", STAGE_ENUM],
    ["domain", DOMAIN_PROTO_ENUM],
    ["proto", DOMAIN_PROTO_ENUM],
    ["layout", LAYOUT_ENUM],
  ];
  for (const [key, set] of checks) {
    const v = parseScalar(text, key);
    if (v === undefined) continue;
    if (!set.has(v)) {
      issues.push(`${key} illegal: ${JSON.stringify(v)}`);
    } else if (requireFilledEnums && v === null && key === "stage") {
      issues.push("stage must not be null when requireFilledEnums");
    }
  }
  return issues;
}

/**
 * monorepo layout → packages non-empty with valid roles
 */
export function validateMonorepoPackages(text) {
  const issues = [];
  const layout = parseScalar(text, "layout");
  if (layout !== "monorepo") return issues;
  const pkg = parsePackagesRoles(text);
  if (pkg.empty || pkg.nullish) {
    issues.push("layout=monorepo requires non-empty packages");
    return issues;
  }
  for (const r of pkg.roles) {
    if (!PACKAGE_ROLES.has(r)) {
      issues.push(`packages.role illegal: ${JSON.stringify(r)}`);
    }
  }
  return issues;
}
