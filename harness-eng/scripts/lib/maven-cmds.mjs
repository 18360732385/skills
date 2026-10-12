/**
 * Spring module Maven command helpers (0.7.34 LD-3 nested reactor).
 */
import fs from "fs";
import path from "path";

/** Read &lt;module&gt; entries from a pom.xml; keep relative paths. */
export function listPomModules(pomPath) {
  if (!fs.existsSync(pomPath)) return [];
  const text = fs.readFileSync(pomPath, "utf8");
  const mods = [];
  const re = /<module>\s*([^<]+?)\s*<\/module>/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim().replace(/\\/g, "/").replace(/\/$/, "");
    if (name && !name.includes("..")) mods.push(name);
  }
  return [...new Set(mods)];
}

function moduleHasSpringBootApp(root, moduleDir) {
  const javaRoot = path.join(root, moduleDir, "src", "main", "java");
  if (!fs.existsSync(javaRoot)) return false;
  const stack = [javaRoot];
  while (stack.length) {
    const dir = stack.pop();
    let names = [];
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      const p = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (name === "target" || name === "node_modules") continue;
        stack.push(p);
      } else if (/\.java$/i.test(name)) {
        try {
          if (/@SpringBootApplication\b/.test(fs.readFileSync(p, "utf8"))) return true;
        } catch {
          /* skip */
        }
      }
    }
  }
  return false;
}

/**
 * Resolve reactor root relative to repo root for a module dir.
 * @returns {{ reactorRel: string, pl: string } | null}
 */
export function resolveNestedReactor(root, moduleDir) {
  const dir = String(moduleDir || ".").replace(/\\/g, "/").replace(/\/$/, "") || ".";
  const rootMods = listPomModules(path.join(root, "pom.xml"));
  if (rootMods.length) {
    return { reactorRel: ".", pl: dir };
  }
  // Nested: backend/pom.xml with <module>order-service</module>, moduleDir=backend/order-service
  const parts = dir.split("/").filter(Boolean);
  if (parts.length >= 2) {
    const parent = parts[0];
    const child = parts.slice(1).join("/");
    const nestedMods = listPomModules(path.join(root, parent, "pom.xml"));
    if (nestedMods.some((m) => m === child || m.endsWith("/" + child) || child.endsWith("/" + m))) {
      return { reactorRel: parent, pl: child };
    }
  }
  // One-level child is itself a reactor leaf (backend with no modules) — no nested -pl
  return null;
}

/**
 * @returns {{ test: string, run: string, note: string, forbid: string }}
 */
export function mavenCmdsForModule(root, moduleDir) {
  const dir = String(moduleDir || ".").replace(/\\/g, "/").replace(/\/$/, "") || ".";
  const nested = resolveNestedReactor(root, dir);
  const hasBoot = moduleHasSpringBootApp(root, dir);

  if (nested && nested.reactorRel === ".") {
    const run = hasBoot
      ? `mvn -pl ${nested.pl} spring-boot:run`
      : `mvn -pl ${nested.pl} -am test`;
    return {
      test: `mvn -pl ${nested.pl} -am test`,
      run,
      note: "Maven 命令**必须在仓库根**执行（reactor / `${revision}` 等只从根解析）",
      forbid: hasBoot
        ? `\`mvn -pl ${nested.pl} -am spring-boot:run\`（正确：不加 \`-am\`；Maven 必须在仓库根）`
        : `本模块无 @SpringBootApplication；勿 spring-boot:run`,
    };
  }

  if (nested && nested.reactorRel !== ".") {
    const fPom = `${nested.reactorRel}/pom.xml`;
    const run = hasBoot
      ? `mvn -f ${fPom} -pl ${nested.pl} spring-boot:run`
      : `mvn -f ${fPom} -pl ${nested.pl} -am test`;
    return {
      test: `mvn -f ${fPom} -pl ${nested.pl} -am test`,
      run,
      note: `Maven 聚合根在 \`${nested.reactorRel}/\`（仓根无 reactor）；命令可在仓根执行`,
      forbid: hasBoot
        ? `勿使用 \`mvn -f ${dir}/pom.xml\`（兄弟模块无法解析）；改用 \`-f ${fPom} -pl ${nested.pl}\``
        : `本模块无 @SpringBootApplication；勿 spring-boot:run；测试用 \`-f ${fPom} -pl ${nested.pl} -am test\``,
    };
  }

  const fArg = dir === "." ? "pom.xml" : `${dir}/pom.xml`;
  const run = hasBoot
    ? `mvn -f ${fArg} spring-boot:run`
    : `mvn -f ${fArg} test`;
  return {
    test: `mvn -f ${fArg} test`,
    run,
    note: "本仓**无根聚合 pom**（或根 pom 无 `<module>`）；用 `mvn -f <module>/pom.xml`，勿假设 `-pl` / 仓库根 reactor",
    forbid: `勿使用 \`mvn -pl ${dir}\`（无根聚合时必失败）；改用 \`mvn -f ${fArg}\``,
  };
}
