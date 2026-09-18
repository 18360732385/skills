# 安全预填策略（Q_SEED）

`Q_SEED=是`（默认）时，WritePlan 写入前用**目标仓可推断且无密**的信息填充占位符与骨架段落；不确定项仍标 `TODO(harness-eng):`。

## 可预填 vs 必须 TODO

| 可预填（Q_SEED=是） | 必须留 TODO |
|---|---|
| `REPO_NAME` / `REPO_DESC`（pom `artifactId`/`name`/`description`、package.json `name`） | Never do **域**红线（鉴权、迁移边界等） |
| `MODULE_DIRS` 列表（Maven modules / 顶层包目录） | 鉴权 Header、角色模型细节 |
| 技术栈一行（如 Spring Boot x.y · Maven · MyBatis）写入 func 索引「技术栈」 | 生产连接串、密码、Token |
| Commands 骨架（`mvn -pl <module> …` / `npm test` 占位） | **未验证**的 profile、端口、环境名 |
| architecture-overview 模块表目录列 | 完整请求链路、外部依赖 URL |
| `BASE_PACKAGE`（如 `com.juneyaoair`） | 业务 Pn 行 |

## 禁止预填

- 任意参考仓的 Never do / pitfalls 业务行
- README / yml 中的密码、主机账号
- 把 plan/archive 正文当契约

## 与渲染预览

WritePlan 必须展示预填后的 `AGENTS.md` Critical/Commands 前约 20 行，供用户确认后再写入。  
若 `agents_variant=modules`：另预览**一份**分册 `AGENTS.md` 的「模块定位 / 改动路径速查」前约 30 行（厚 SSOT 骨架）。见 [write-plan.md](write-plan.md)。

## 分级移交（land / resume / upgrade）

写盘 Done 后打印移交 TODO，至少含：

| 优先级 | 项 |
|---|---|
| P0 | README/yml 疑似密钥（若探测到） |
| **P1** | **精填分册 AGENTS**（定位表、改动路径速查实表、Never do 一句话↔`Pn`；勿抄他仓业务条） |
| **P1** | **Pn 回流**：从 Critical/Commands/Never do 补 `docs/agent-kb/pitfalls.md` **路径速查**；Never do 一律 `一句话 → Pn`；改台账后跑 lint |
| P1 | seed-truths / fill-plan（大仓） |
| P2 | OpenAPI 桥：设 `APIFOX_PROJECT_ID` 后跑 `node scripts/apifox/sync-to-apifox.mjs`（若 `Q_APIFOX`） |

## Q_SEED=否

所有可推断字段也写成 `TODO(harness-eng):`，仅替换用户在提问中明确给出的 `REPO_NAME` 等。
