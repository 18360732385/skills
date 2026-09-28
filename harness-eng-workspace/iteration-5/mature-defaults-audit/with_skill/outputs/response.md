探测完成。以下是完整的 **harness-eng audit** 报告。

---

# harness-eng audit — skill-up-3771335708

**目标根**: `\\wsl.localhost\Ubuntu\tmp\skill-up-3771335708`  
**类型**: **MATURE（Claude-only）**  
**meta**: 无 meta  
**设计意图**: Fixture 仓库 — 根 AGENTS + `.claude/rules` + 最小 api 契约 + agent-kb，无 `.cursor/rules`（验证 detect 按宿主诚实）

---

## Fingerprint

| 信号 | 结果 | 备注 |
|---|---|---|
| S_GIT | 是 | git 仓 |
| S_EMPTY | 是 | 无 src/、pom.xml、package.json 等源码入口；fixture 仓 |
| S_AGENTS_ROOT | 是 | 根 `AGENTS.md`（fixture-mature-claude） |
| S_AGENTS_MOD | 否 | 无子目录分册 |
| S_RULES | 是 | `.claude/rules/00-overview.md` 非空（Claude 宿主） |
| S_00 | 否 | 无 `00-*.mdc`（只有 `.md`） |
| S_API | 是 | `docs/api/api.md` 非空 |
| S_KB | 是 | `docs/agent-kb/README.md` 非空 |
| S_CLAUDE | 是 | `.claude/` 存在 |
| S_MULTI_TOOL | 否 | 仅探测到 1 个 AI 工具面（claude） |
| S_HARNESS_META | 否 | 无 `docs/harness-eng/harness-meta.yaml` |
| S_STACK | 否 | 无 pom.xml / package.json / go.mod |
| S_SECRETS_LEAK | 否 | 无密文线索 |
| S_HOOKS / S_MCP / S_AGENT_CONFIG | 否 | 无 |
| S_ENV_PROFILES | [local] | 无 profile 文件，默认 local |

---

## 已具备 / 缺口（按 Ladder）

### L0 协作入口
- [x] 根 `AGENTS.md` 存在（fixture，含 Commands / Never do）
- [ ] **karpathy alwaysApply** — 缺口（无 `.cursor/rules/karpathy-guidelines.mdc`；Claude 宿主无 `.mdc` 形态）
- [ ] **00 alwaysApply** — 缺口（无 `.cursor/rules/00-*.mdc`；现有 `.claude/rules/00-overview.md` 为 project instruction，非 harness 总览 rule）
- [ ] **`harness-meta.yaml`** — **缺口**
- [ ] （可选）rule 14 — 缺口

### L1 契约骨架
- [x] `docs/api/api.md` + 真相子目录（最小 fixture）
- [ ] `docs/func/` + rule 11 — 缺口（域未选）
- [ ] `docs/db/` + rule 13 — 缺口（域未选）
- [ ] `docs/redis/` + rule 16 — 缺口（域未选）
- [ ] `docs/jobs/` + rule 20 — 缺口（域未选）
- [ ] 对应 `NN-*-sync*.mdc` — 缺口（Claude 宿主无 `.mdc`）

### L2 知识回流
- [x] `docs/agent-kb/README.md` 存在（最小 fixture）
- [ ] `architecture-overview.md` — 缺口
- [ ] `pitfalls.md`（含域列） — 缺口
- [ ] `accepted-gaps.md` — 缺口
- [ ] rule 19 — 缺口

### L3 规划与软门禁
- [ ] `docs/superpowers/` — 缺口
- [ ] rule 18 — 缺口
- [ ] hooks（任何宿主）— 缺口

### L4 工具连接样例
- [ ] `mcp.json.example` — 缺口
- [ ] `mcp-usage-guide.md` — 缺口

### L5 配置 SSOT 管线
- [ ] `docs/agent-config/` + `sync.mjs` — 缺口

---

## 反模式

| 检查 | 结果 |
|---|---|
| alwaysApply 过多 | 不适用（rules 极少） |
| plan / archive 当契约 SSOT | 未发现 |
| `.cursor/mcp.json` 含明文密 | 未发现（无 mcp.json） |
| `S_SECRETS_LEAK` | 未发现 |
| 根 AGENTS 与分册漂移 | 无分册 |
| 分册 AGENTS 空壳 | 无分册 |
| Never do 无 Pn 回链 | AGENTS.md 无 Pn 回链（fixture 级别） |
| 路径速查空壳 | 无路径速查表 |
| meta.ai_tools 与入口不一致 | 无 meta |
| pitfalls 未过 lint | 无 pitfalls 文件 |
| L5 生成物漂移 / 手改 | 不适用 |
| L5 与直渲混用 | 不适用 |
| Codex `.mdc` 镜像误当支持 | 不适用（无 Codex） |
| 把形态分当真「可 AI coding」 | 不适用 |
| 默认 auto 写 SSOT | 未发现 |

---

## 建议

- **当前最高完整阶**: 介于 L0–L1 之间（信号上 MATURE，但交付物仅 fixture 级别）
- **主要缺口**: `harness-meta.yaml`、Claude 宿主 rules 镜像（无 `.mdc` 形态）、L2–L5 全阶缺失
- **下一步**: 如需补齐，可转 **`resume`**（续跑补阶）或 **`land`**（重新 scaffold 到目标阶）；如仅需 meta 快照，可 **`write-meta-only`**
- **旁注**: 本仓为 fixture，`.claude/skills/harness-eng/` 下含完整技能包副本（346 文件中大部分来自此），非业务代码

---

## RecommendedProfile

| 字段 | 推断值 | 理由 |
|---|---|---|
| mode | **audit**（默认分流）→ 如需施工可转 **resume** | MATURE 缺 meta 及 L2–L5 |
| ladder | L4（若施工） | 小仓默认一次到位 |
| domains | api（已有）+ 可选 func / db | 当前仅有 api fixture |
| agents_variant | solo | 单模块/无模块 |
| glob_profile | wide | 小仓 |
| rule14 / rule21 / rule17 | 否 / 否 / 否 | 非 Java / 无前端 |
| ai_tools | **claude** | 探测到 `.claude/`；无 Cursor |
| mcp_tracking | example_only | 无真密 |
| fill | 如需填充：MCP先行=否（无db/redis域）· 深度=完整档 · 引擎=agents | 当前无栈可抽 |
| ready_coverage | 0.8 | 默认 |
| gate_profile | strict | 默认 |

> 不确定怎么选？可直接回复：**全部推荐**  
> 或逐题自定义；如需施工请回复「确认 resume/land 到 Lx」

---

请问需要：
1. **保持 audit**（仅报告，不写盘）
2. **转 resume/land** 补齐缺口（我会出 WritePlan，过确认闸门后写盘）
3. **仅写 meta 快照**（`docs/harness-eng/harness-meta.yaml`）
