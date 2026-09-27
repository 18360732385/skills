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
    const inlineNull = /^packages:\s*null\s*$/m.test(text);
    return { ok: true, roles: [], empty: true, nullish: inlineNull || true };
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
