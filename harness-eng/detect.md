# 指纹探测与仓库类型

## 定根

```bash
git rev-parse --show-toplevel
```

失败则用当前工作区根，并告知用户「非 git 仓」。

**多工作区 / 兄弟仓**：列出候选根路径，必须经 `Q_TARGET_ROOT` 确认后，**所有写入仅限该根**。

## 信号（S_*）

扫描目标根，记录布尔或路径列表：

| ID | 条件 |
|---|---|
| `S_GIT` | `.git` 存在 |
| `S_EMPTY` | 无常见源码入口（无 `src/`、`pom.xml`、`package.json`、`go.mod` 等）且无 harness 指纹 |
| `S_AGENTS_ROOT` | 根 `AGENTS.md` |
| `S_AGENTS_MOD` | 任意子目录 `**/AGENTS.md`（非根） |
| `S_RULES` | `.cursor/rules/*.mdc` 至少一个 |
| `S_00` | 存在 `00-*.mdc` 且 alwaysApply 类总览 |
| `S_KARPATHY` | `karpathy-guidelines.mdc` |
| `S_FUNC` | `docs/func/` **且至少 1 个非空文件**（仅空目录记「空壳」≠已有契约） |
| `S_API` | `docs/api/` **且至少 1 个非空文件** |
| `S_DB` | `docs/db/` **且至少 1 个非空文件** |
| `S_REDIS` | `docs/redis/` **且至少 1 个非空文件** |
| `S_JOBS` | `docs/jobs/` **且至少 1 个非空文件**；或源码命中 `@Scheduled` / `*Scheduler.java` / `SyncTaskCode` / `SyncTaskMetadataRegistry`（调度指纹） |
| `S_RELEASES` | `docs/releases/` 存在（过程域脚注；非契约） |
| `S_FRONTEND` | 存在前端分册/`apps/*` 且有 path rule `17-*` 或 `package.json` workspace 前端包（协作包脚注） |
| `S_KB` | `docs/agent-kb/` **且至少 1 个非空文件** |
| `S_SP` | `docs/superpowers/` **且至少 1 个非空文件** |
| `S_HOOKS` | `.cursor/hooks.json` |
| `S_MCP` | `.cursor/mcp.json` / `.mcp.json` / `.trae/mcp.json` 或任一 `mcp.json.example` |
| `S_CLAUDE` | `CLAUDE.md` 或 `.claude/` |
| `S_STACK` | `pom.xml` / `package.json` / `go.mod` / `Cargo.toml` / `pyproject.toml` 等 |
| `S_HARNESS_META` | `docs/harness-eng/harness-meta.yaml`（无则回退 `.cursor/harness-meta.yaml` / `.yml`；PARTIAL/upgrade 读 ladder/domains） |
| `S_SECRETS_LEAK` | README / `*.yml` / `*.yaml` / `.env*` 命中启发式：`password:`、`密码`、`passwd`、`secret:`、`api[_-]?key`、疑似长 token（≥20 连续字母数字） |
| `S_SQL_DIR` | 存在 `file/**/*.sql` 或仓内集中手写 SQL 目录，且非标准 migration 树 |
| `S_NO_FLYWAY` | 无 `**/db/migration/**`、无 `flyway` 目录/配置 |
| `S_DB_ENGINE` | 栈侧库引擎集合（mysql / oracle / postgres / …）；见下节 **MCP 矩阵** |
| `S_STACK_REDIS` | 依赖或配置出现 Redis（与契约目录 `S_REDIS` 分开记） |
| `S_SLF4J` | Java 源码命中 `org.slf4j` / `@Slf4j`（行为包 rule 21 推荐信号；非契约域） |
| `S_SPRING` | 根/模块 `pom.xml` 命中 `spring-boot` 依赖（backend-spring 分册变体 `Q_MODULE_AGENTS=spring` 推荐信号） |
| `S_AGENT_CONFIG` | `docs/agent-config/` 或 `scripts/agent-config/sync.mjs` 已存在（L5 已落地的信号；resume/upgrade 优先沿用） |
| `S_MULTI_TOOL` | 探测到的 AI 工具入口 ≥ 2（`.cursor/` `CLAUDE.md`/`.claude/` `.codex/` `.qoder/` `.trae/` `.codebuddy/`）；L5 配置 SSOT 管线推荐信号 |
| `S_ENV_PROFILES` | 从仓库 profile 自动发现的环境名列表（见下节） |

输出给用户一张 **Fingerprint 表**（信号 | 是/否 | 备注），再判定类型。  
`S_SECRETS_LEAK=是` 时备注必须写「移交 P0：人工迁出/脱敏；skill 不自动删密」。  
契约目录若存在但 **0 文件**：备注写「空壳目录」；类型倾向 PARTIAL / NEW（空壳不算 MATURE）。

若 `S_HARNESS_META=是`，摘要打印 meta 中的 `ladder` / `domains` / `agents_variant` / `glob_profile`。

## MCP 矩阵（引擎 × 环境）

填充前若需 db/redis 实据，须满足 **填充 MCP 闸**（规格：[fill-mcp.md](fill-mcp.md) · [pipeline-fill.md](pipeline-fill.md)）。detect 只产出应有集合，不写盘。

### 发现环境 `S_ENV_PROFILES`

以仓库为准自动发现，**不**用固定勾选表替代。线索（命中即收名，去重、小写）：

| 来源 | 示例 → profile 名 |
|---|---|
| Spring / Boot | `application-{name}.yml` / `.yaml` / `.properties` → `name` |
| 多文档 | `application.yml` 内 `spring.config.activate.on-profile` / `---` 文档头 |
| 其它常见 | `config/{name}.*`、`.env.{name}`、`profiles: [name]`（仅当能稳定解析） |

忽略明显非运行环境名（如 `common`、`default` 若无独立连接块）。**无任何 profile 文件**时记 `S_ENV_PROFILES=[local]` 并备注「无 profile 文件，默认 local」。

### 发现引擎

| 线索 | 记入 `S_DB_ENGINE` / `S_STACK_REDIS` |
|---|---|
| `mysql` / `mariadb` 依赖或 jdbc url | `mysql` |
| `oracle` / `ojdbc` / `oracle.jdbc` | `oracle` |
| `postgres` / `postgresql` | `postgres` |
| redis 依赖或 `spring.data.redis` / `Jedis` / `Lettuce` | `S_STACK_REDIS=是` |

### 应有 server 集合

对每个引擎 × 每个已发现 profile：若该 profile 配置块里**能抽出**该引擎的主机/库或 Redis URL，则应有 server 名：

```text
{engine}-{profile}     例：mysql-dev、mysql-test、oracle-uat、redis-dev
```

抽不出连接信息的「profile × 引擎」→ 记入 `matrix_gap: no_creds`（不纳入应有集合；Fingerprint 备注列出）。  
Fingerprint 摘要须打印：**应有 MCP 矩阵**（列表）+ **已有 mcp.json server 名**（若 `S_MCP`）+ 覆盖缺口。

## 类型判定（优先序）

1. **FOREIGN**：有 `S_CLAUDE` 且无本 harness 形态（无 `S_00`+契约索引+真相结构）→ 先问并存策略（[foreign-playbook.md](foreign-playbook.md)）
2. **MATURE**：`S_AGENTS_ROOT` 且 `S_RULES` 且（`S_FUNC|S_API|S_DB|S_REDIS|S_JOBS` 至少一个）且 `S_KB` → 默认 audit
3. **PARTIAL**：有任一 harness 信号但不满足 MATURE → 差分补齐
4. **NEW_CODE_NO_HARNESS**：有 `S_STACK` 或明显源码，无 `S_AGENTS_ROOT` 且无 `S_RULES` 且无契约目录 → 全量 scaffold
5. **NEW_EMPTY**：其余近空 → 全量 scaffold

## 栈默认 globs（推断后须用户确认）

| 栈线索 | `{{GLOB_FUNC}}` 示例 | `{{GLOB_API}}` 示例 | `{{GLOB_DB}}` 示例 |
|---|---|---|---|
| Maven/Java | `**/src/main/java/**/*.java,docs/func/**` | `**/controller/**/*.java,docs/api/**` | `**/db/migration/**,docs/db/**,**/entity/**/*.java` |
| Maven + 手写 SQL（`S_SQL_DIR` 或 `S_NO_FLYWAY`） | 同上 | 同上 | `**/mapper/**/*.java,**/*Mapper.xml,**/domain/**/*.java,file/**/*.sql,docs/db/**` |
| Node/TS | `src/**/*.ts,docs/func/**` | `**/routes/**,**/api/**,docs/api/**` | `**/migrations/**,docs/db/**` |
| 未知 | 问用户 | 问用户 | 问用户 |

Redis：`docs/redis/**` + 探测到的 cache/redis 目录。  
Jobs：`docs/jobs/**` + `**/scheduler/**/*.java` + 任务码枚举 / Metadata Registry + `**/application*.yml`（`{{GLOB_JOBS}}`）。  
行为包（rule 21，`{{GLOB_OBSERVABILITY}}`）：Maven/Java 默认 `**/src/main/java/**/*.java,**/src/main/resources/application*.yml,**/src/main/resources/config/**/*.yml`；非 Java 栈不装。  
前端协作包（rule 17，`{{GLOB_FRONTEND}}`）：默认 `**/apps/**/*.ts,**/apps/**/*.tsx,**/packages/**`；focused 时收窄到前端目录前缀。  
db 迁移模式：`S_NO_FLYWAY` / `S_SQL_DIR` → 推荐 `Q_DB_MIGRATION=manual_sql`，并写入 `docs/db/db.md`「迁移模式」声明。

Fingerprint 若 `S_RELEASES` / `S_FRONTEND`：备注「过程/协作包已存在；非 L1 契约域，见 glossary」。

## glob 档位（`Q_GLOB_PROFILE`）

| 档位 | 含义 | 何时建议 |
|---|---|---|
| `wide` | 上表全仓默认（如全部 `**/src/main/java/**/*.java`） | 小仓 / 单模块 |
| `focused` | 收窄到入口模块 controller + 用户确认的模块/包前缀，再加 `docs/{domain}/**` | **大仓默认**（多模块、Controller 百级+） |

detect 结束时输出「建议档位」；最终以 `Q_GLOB_PROFILE` 为准。focused 时须在提问中给出拟用前缀示例（如 `sms-entrance/**/controller/**/*.java`）。

## AI 工具面线索（供 Q_AI_TOOL）

| 信号 | 推断 ID |
|---|---|
| `.cursor/` 或 `.cursor/rules` | `cursor` |
| `CLAUDE.md` / `.claude/` | `claude` |
| `.codex/` | `codex` |
| `.qoder/` | `qoder` |
| `.trae/` | `trae` |
| `.codebuddy/` / `CODEBUDDY.md` / 用户提 WorkBuddy | `workbuddy` |

本版按选中工具生成**入口适配**（指针文件），契约 SSOT 仍为 `AGENTS` + `docs/**`。详见 [ai-tools.md](ai-tools.md)。  
无信号时推荐包默认 `ai_tools: [cursor]`。自定义工具须用户给出入口路径。

**宿主交叉校验（0.2.16+）**：若已有 meta.`ai_tools`，对照磁盘入口 + 契约 sync 镜像（非 cursor：如 workbuddy → `CODEBUDDY.md` + `.codebuddy/rules/1x-contract-sync.md`）。缺失记入 RecommendedProfile 缺口 / audit 反模式。

## RecommendedProfile（强制输出）

Fingerprint + 类型判定之后，**必须**按 [recommended-profile.md](recommended-profile.md) 输出推荐包，并引导：

> 不确定怎么选？回复：**全部推荐**

`PARTIAL` 或 `S_HARNESS_META` 未达用户目标阶 → 推荐模式优先 **`resume`（续跑）**。  
术语中文名见 [glossary.md](glossary.md)。  
推荐包须含 `ai_tools` 行（已探测预勾 + 可自定义）。
