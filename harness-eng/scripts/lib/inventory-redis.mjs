#!/usr/bin/env node
/**
 * fill-inventory-redis — heuristic Redis key patterns from Java sources (no npm deps).
 * Alias (0.5.9+): prefer `fill-inventory.mjs --domain redis`.
 *
 * Usage:
 *   node scripts/fill-inventory-redis.mjs --root <TARGET> [--source-root <rel>] [--out redis-inv.json]
 *
 * 0.2.9: infer valueType / valueFields / ttl from RedisTemplate set / expire / JSON serialize.
 * 0.2.10: default scan all module src/main/java (monorepo); promote REDIS_* / SMS: / dict / captcha keys.
 * Default --out: docs/redis/.fill-work/inventory.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defaultInventoryPath } from "./inventory-paths.mjs";
import { exitFromReport, pushWarning } from "./exit-codes.mjs";

function parseArgs(argv) {
  const out = { root: null, sourceRoot: null, out: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--source-root") out.sourceRoot = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--help" || a === "-h") out.help = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/fill-inventory-redis.mjs --root <TARGET> [--source-root <rel-or-.>] [--out redis-inv.json]

Default: scan all <module>/src/main/java under --root (monorepo).
Pass --source-root to limit (e.g. sms-common/src/main/java or . for whole tree).
Default --out: docs/redis/.fill-work/inventory.json

Heuristic scan for Redis key patterns + value/TTL evidence.
Exit: 0 ok · 2 warnings · 1 error
`);
}

function walkJava(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === "target" || name === "node_modules" || name === ".git") continue;
    const p = path.join(dir, name);
    let st;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkJava(p, acc);
    else if (/\.java$/i.test(name)) acc.push(p);
  }
  return acc;
}

/** 0.2.10: return all Java source roots for Maven monorepo (or single-module). */
function listJavaRoots(root) {
  const roots = [];
  const single = path.join(root, "src", "main", "java");
  if (fs.existsSync(single)) roots.push(single);
  try {
    for (const name of fs.readdirSync(root)) {
      if (name === "target" || name === ".git" || name === "node_modules" || name === "docs")
        continue;
      const javaRoot = path.join(root, name, "src", "main", "java");
      if (fs.existsSync(javaRoot)) roots.push(javaRoot);
    }
  } catch {
    /* ignore */
  }
  return [...new Set(roots.map((p) => path.resolve(p)))];
}

function guessSourceRoots(root) {
  const listed = listJavaRoots(root);
  if (listed.length) return listed;
  function find(d, depth, acc) {
    if (depth > 5 || !fs.existsSync(d)) return acc;
    for (const name of fs.readdirSync(d)) {
      if (name === "target" || name === ".git" || name === "node_modules") continue;
      const p = path.join(d, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (name === "java" && d.replace(/\\/g, "/").endsWith("src/main")) acc.push(p);
        else find(p, depth + 1, acc);
      }
    }
    return acc;
  }
  return find(root, 0, []);
}

/** Promote likely Redis key constants even when defining file has no RedisTemplate. */
function shouldPromoteRedis(k) {
  if (!k || isNoisePattern(k.pattern)) return false;
  const pat = k.pattern || "";
  const ev = k.evidence || "";
  const note = k.note || "";
  if (/^SMS:/i.test(pat)) return true;
  if (/^(captcha_codes:|ctr_sys_dict:|enable_sys_dict:|login_tokens:|rate_limit:|repeat_submit:)/i.test(pat))
    return true;
  if (/REDIS_|CAPTCHA_CODE|SYS_DICT_KEY|ENABLE_SYS_DICT|LOGIN_TOKEN|REPEAT_SUBMIT|RATE_LIMIT/i.test(ev))
    return true;
  if (/@Cacheable|redis call|opsFor\.set|RedisCache/i.test(note + ev)) return true;
  return false;
}

function isHardNoise(pat) {
  return /yyyy|customfield_|Bearer |HMAC|AES|9999-12-31|https?:/i.test(pat || "");
}

function isNoisePattern(val) {
  if (!val || val.length < 2) return true;
  if (/\\[dwWsSb]|yyyy|MM-dd|HH:mm|%s|%n|%d|\{0\}|\\\\/.test(val)) return true;
  if (/^[\d\-/:\s.]+$/.test(val)) return true;
  if (/https?:\/\//i.test(val)) return true;
  return false;
}

function fileHasRedisDriver(text) {
  return (
    /RedisTemplate|StringRedisTemplate|RedissonClient|@Cacheable|redisCache/i.test(text) ||
    /opsForValue|opsForHash|opsForList|opsForSet/i.test(text)
  );
}

function extractClassFields(text, className) {
  if (!className) return [];
  // naive: find "class ClassName" in same file or skip
  const fields = [];
  const re =
    /(?:private|protected|public)\s+([\w.<>,\s\[\]]+)\s+(\w+)\s*[;=]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[2];
    if (/^(if|for|while|serialVersionUID)$/.test(name)) continue;
    fields.push(name);
  }
  return fields.slice(0, 40);
}

function findTypeInRepo(root, typeName) {
  if (!typeName || /^(String|Object|byte|int|long|Integer|Long|Boolean|Map|List)$/i.test(typeName))
    return null;
  const simple = typeName.replace(/<.*>/, "").split(".").pop();
  const hits = [];
  function walk(d, depth) {
    if (depth > 8 || !fs.existsSync(d) || hits.length) return;
    for (const name of fs.readdirSync(d)) {
      if (name === "target" || name === ".git" || name === "node_modules") continue;
      const p = path.join(d, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(p, depth + 1);
      else if (name === `${simple}.java`) hits.push(p);
    }
  }
  walk(root, 0);
  if (!hits.length) return null;
  try {
    return fs.readFileSync(hits[0], "utf8");
  } catch {
    return null;
  }
}

function extractKeys(text, rel, root) {
  const keys = [];
  const hasDriver = fileHasRedisDriver(text);

  // Prefer redis client call contexts
  const callRe =
    /(?:redisCache|stringRedisTemplate|redisTemplate|redisson(?:Client)?)\.\w+\(\s*"([^"]+)"/gi;
  let m;
  while ((m = callRe.exec(text)) !== null) {
    const val = m[1];
    const window = text.slice(m.index, m.index + 400);
    let valueType = "";
    let valueFields = [];
    let ttl = "";
    const jsonM = window.match(
      /(?:JSON\.toJSONString|objectMapper\.writeValueAsString|JSONUtil\.toJsonStr)\(\s*(\w+)/i
    );
    if (jsonM) {
      valueType = "json";
      // try to find variable type nearby
      const varName = jsonM[1];
      const typeM = text.match(new RegExp(`(\\w+)\\s+${varName}\\s*=`));
      if (typeM) {
        const typeSrc = findTypeInRepo(root, typeM[1]);
        if (typeSrc) valueFields = extractClassFields(typeSrc, typeM[1]);
        else valueFields = [typeM[1]];
      }
    }
    const expireM =
      window.match(/expire\s*\([^,]+,\s*([^)]+)\)/i) ||
      window.match(/set\s*\([^,]+,[^,]+,\s*([^)]+)\)/i);
    if (expireM) {
      ttl = expireM[1].replace(/\s+/g, " ").trim().slice(0, 80);
    }
    const durM = window.match(/Duration\.of(\w+)\s*\(\s*(\d+)\s*\)/i);
    if (durM && !ttl) {
      ttl = `Duration.of${durM[1]}(${durM[2]})`;
    } else if (durM && /Duration\.of/i.test(ttl)) {
      ttl = `Duration.of${durM[1]}(${durM[2]})`;
    }
    keys.push({
      pattern: val,
      evidence: `${rel}#call`,
      note: "redis call literal",
      redis: !isNoisePattern(val),
      valueType: valueType || undefined,
      valueFields: valueFields.length ? valueFields : undefined,
      ttl: ttl || undefined,
    });
  }

  // opsForValue().set(key, value) with variable key const
  const setRe =
    /opsFor(?:Value|Hash|List|Set)\(\)\.(?:set|put)\(\s*(\w+)\s*,\s*([^)]+)\)/gi;
  while ((m = setRe.exec(text)) !== null) {
    const keyVar = m[1];
    const valExpr = m[2];
    const constM = text.match(
      new RegExp(`(?:String\\s+)?${keyVar}\\s*=\\s*"([^"]+)"`)
    );
    const pattern = constM ? constM[1] : null;
    if (!pattern || isNoisePattern(pattern)) continue;
    let valueType = "";
    let valueFields = [];
    if (/JSON\.|writeValueAsString|toJson/i.test(valExpr)) {
      valueType = "json";
      const tm = valExpr.match(/(\w+)\s*\)/);
      if (tm) {
        const typeSrc = findTypeInRepo(root, tm[1]);
        if (typeSrc) valueFields = extractClassFields(typeSrc, tm[1]);
      }
    } else if (/^["']/.test(valExpr.trim())) valueType = "string";
    else valueType = "object";
    const after = text.slice(m.index, m.index + 350);
    let ttl = "";
    const ex = after.match(/expire\s*\([^,]+,\s*([^)]+)\)/i);
    if (ex) ttl = ex[1].replace(/\s+/g, " ").trim().slice(0, 60);
    keys.push({
      pattern,
      evidence: `${rel}#opsFor.set`,
      note: "opsFor set",
      redis: hasDriver,
      valueType: valueType || undefined,
      valueFields: valueFields.length ? valueFields : undefined,
      ttl: ttl || undefined,
    });
  }

  // standalone expire(key, ...)
  const expireOnly =
    /\.expire\(\s*"([^"]+)"\s*,\s*([^)]+)\)/gi;
  while ((m = expireOnly.exec(text)) !== null) {
    keys.push({
      pattern: m[1],
      evidence: `${rel}#expire`,
      note: "expire call",
      redis: !isNoisePattern(m[1]) && hasDriver,
      ttl: m[2].replace(/\s+/g, " ").trim().slice(0, 60),
    });
  }

  // @Cacheable key / cacheNames
  const cacheRe = /@Cacheable\s*\(([^)]*)\)/gi;
  while ((m = cacheRe.exec(text)) !== null) {
    const args = m[1];
    const cn = args.match(/(?:cacheNames|value)\s*=\s*\{?\s*"([^"]+)"/);
    if (cn) {
      keys.push({
        pattern: cn[1],
        evidence: `${rel}#@Cacheable`,
        note: "@Cacheable",
        redis: true,
        valueType: "cache",
      });
    }
  }

  const constRe =
    /(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?String\s+(\w+)\s*=\s*"([^"]+)"/g;
  while ((m = constRe.exec(text)) !== null) {
    const name = m[1];
    const val = m[2];
    const nameHit = /key|redis|cache|token|captcha|session|lock/i.test(name);
    const valHit = /key|redis|cache|captcha|session|lock|sms:/i.test(val) || /:/.test(val);
    if (!nameHit && !valHit) continue;
    const noise = isNoisePattern(val);
    // 0.2.9 driver gate; 0.2.10 also allow strong name/value promote candidates (finalized in main)
    const strongName = /^REDIS_|CAPTCHA|SYS_DICT|ENABLE_SYS_DICT|LOGIN_TOKEN|RATE_LIMIT|REPEAT_SUBMIT/i.test(
      name
    );
    const strongVal = /^SMS:/i.test(val) || /^(captcha_codes:|ctr_sys_dict:|enable_sys_dict:)/i.test(val);
    const redis =
      !noise &&
      (hasDriver || /redis call/i.test(name) || strongName || strongVal) &&
      (nameHit || /:/.test(val) || /redis|cache/i.test(name) || strongName || strongVal);
    keys.push({
      pattern: val,
      evidence: `${rel}#${name}`,
      note: `const ${name}`,
      redis,
    });
  }
  return keys;
}

export function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return;
  }
  if (!args.root) {
    printHelp();
    throw new Error("Required: --root");
  }
  const root = path.resolve(args.root);
  let sourceRoots;
  if (args.sourceRoot) {
    const resolved = path.resolve(root, args.sourceRoot);
    if (!fs.existsSync(resolved)) {
      throw new Error(`source-root not found: ${args.sourceRoot}`);
    }
    sourceRoots = [resolved];
  } else {
    sourceRoots = guessSourceRoots(root);
  }
  if (!sourceRoots.length) {
    throw new Error("Cannot find source-root; pass --source-root");
  }
  const files = [];
  for (const src of sourceRoots) walkJava(src, files);
  const seen = new Set();
  const keys = [];
  for (const f of files) {
    const rel = path.relative(root, f).replace(/\\/g, "/");
    const text = fs.readFileSync(f, "utf8");
    for (const k of extractKeys(text, rel, root)) {
      const id = `${k.pattern}@@${k.evidence}`;
      if (seen.has(id)) continue;
      seen.add(id);
      keys.push(k);
    }
  }
  // Merge duplicate patterns: prefer entry with valueType/ttl
  const byPattern = new Map();
  for (const k of keys) {
    const prev = byPattern.get(k.pattern);
    if (!prev) {
      byPattern.set(k.pattern, k);
      continue;
    }
    byPattern.set(k.pattern, {
      ...prev,
      ...k,
      redis: prev.redis || k.redis,
      valueType: k.valueType || prev.valueType,
      valueFields: k.valueFields?.length ? k.valueFields : prev.valueFields,
      ttl: k.ttl || prev.ttl,
      note: [prev.note, k.note].filter(Boolean).join("; "),
    });
  }
  let promoted = 0;
  for (const k of byPattern.values()) {
    if (isHardNoise(k.pattern)) {
      k.redis = false;
      continue;
    }
    if (!k.redis && shouldPromoteRedis(k)) {
      k.redis = true;
      k.note = (k.note || "") + (k.note ? "; " : "") + "promoted";
      promoted++;
    }
  }
  const merged = [...byPattern.values()].sort((a, b) =>
    a.pattern.localeCompare(b.pattern)
  );
  const real = merged.filter((k) => k.redis).length;
  const withMeta = merged.filter((k) => k.valueType || k.ttl).length;
  const report = {
    ok: true,
    root,
    sourceRoot: sourceRoots
      .map((s) => path.relative(root, s).replace(/\\/g, "/") || ".")
      .join(";"),
    sourceRoots: sourceRoots.map((s) => path.relative(root, s).replace(/\\/g, "/") || "."),
    keys: merged,
    warnings: [],
    stats: {
      files: files.length,
      keys: merged.length,
      redis_true: real,
      redis_false: merged.length - real,
      with_value_or_ttl: withMeta,
      promoted,
      java_roots: sourceRoots.length,
    },
  };
  if (!merged.length) pushWarning(report, "no redis key patterns found");

  const json = JSON.stringify(report, null, 2);
  const outPath = path.resolve(args.out || defaultInventoryPath(root, "redis"));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, json, "utf8");
  console.error(
    `Wrote ${outPath} keys=${merged.length} redis_true=${real} redis_false=${merged.length - real} meta=${withMeta}`
  );
  console.log(json);
  exitFromReport(report);
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (e) {
    console.error(String(e && e.stack ? e.stack : e));
    process.exit(1);
  }
}
