---

# harness-eng audit — fixture-mature-claude

**目标根**: `/tmp/skill-up-1332897764`  
**类型**: `MATURE`（骨架级；Claude-only）  
**meta**: 无 `docs/harness-eng/harness-meta.yaml`（亦无遗留 `.cursor/harness-meta.yaml`）

---

## 已具备

### L0 协作入口
- [x] 根 `AGENTS.md`（fixture-mature-claude；含 Commands / Never do）
- [ ] `karpathy-guidelines.mdc`（`alwaysApply: true`）— **缺**
- [ ] `00-project-docs-overview.mdc`（`alwaysApply: true`）— **缺**；现有 `.claude/rules/00-overview.md` 为 `.md` 非 `.mdc`，无 `alwaysApply` 元数据
- [ ] `docs/harness-eng/harness-meta.yaml` — **缺**
- [ ] （可选）rule 14 — **缺**
- [ ] （可选）rule 21 — 非 Java 栈，不适用
- [ ] （可选）rule 17 — 无前端，不适用

### L1 契约骨架
- [ ] `docs/func/` + rule 11 — **缺**
- [x] `docs/api/api.md` 存在（最小契约文件）
- [ ] `docs/api/templates/` — **缺**
- [ ] `docs/api/modules/README.md`（或等价真相子目录）— **缺**
- [ ] rule 12（api-sync）— **缺**
- [ ] `docs/db/` + rule 13 — **缺**
- [ ] `docs/redis/` + rule 16 — **缺**
- [ ] `docs/jobs/` + rule 20 — **缺**

> 模板漂移注：技能 `templates/docs/api/…` 与仓内 `docs/api/api.md` 为 fixture 最小文件，非厚模板。

### L2 知识回流
- [x] `docs/agent-kb/README.md`（最小知识回流）
- [ ] `docs/agent-kb/architecture-overview.md` — **缺**
- [ ] `docs/agent-kb/pitfalls.md` — **缺**
- [ ] `docs/agent-kb/accepted-gaps.md` — **缺**
- [ ] rule 19 — **缺**

### L3 规划与软门禁
- [ ] `docs/superpowers/README.md` / `ARCHIVE.md` — **缺**
- [ ] rule 18 — **缺**
- [ ] hooks.json / `.githooks/pre-commit` + gate — **缺**

### L4 工具连接样例
- [ ] `mcp.json.example` + `docs/harness-eng/mcp-usage-guide.md` — **缺**

### L5 配置 SSOT 管线
- [ ] `docs/agent-config/` + `scripts/agent-config/sync.mjs` — **缺**

---

## 缺口

| 阶 | 缺失路径 / 文件 | 建议动作 |
|---|---|---|
| L0 | `docs/harness-eng/harness-meta.yaml` | resume / write-meta-only：补 ladder / domains / ai_tools 快照 |
| L0 | `.cursor/rules/karpathy-guidelines.mdc` | 因本仓为 Claude-only，可改为 `.claude/rules/karpathy-guidelines.md`（或各宿主等效 alwaysApply） |
| L0 | `00-*` alwaysApply 总览 | `.claude/rules/00-*.md` 补 alwaysApply 语义，或按选定工具面生成 `.mdc` |
| L0 | rule 14 | land / resume 渲染 |
| L1 | `docs/api/templates/`、`docs/api/modules/README`、rule 12 | resume / land 补 api 域骨架 |
| L2 | `architecture-overview.md`、`pitfalls.md`、`accepted-gaps.md`、rule 19 | resume 补 agent-kb 三文件 |
| L3 | `docs/superpowers/`、rule 18、hooks | resume 升 L3 |
| L4 | `mcp.json.example`、`mcp-usage-guide.md`、gitignore snippet | resume 升 L4 |
| 运营 | AGENTS 无「改动路径速查」、Never do 无 `→ Pn` | content-shell-scan 或精填 |

---

## 反模式

| 检查 | 结果 |
|---|---|
| alwaysApply 过多 / 整份 pitfalls alwaysApply | — |
| plan / archive 当契约 SSOT | — |
| `.cursor/mcp.json` 含明文密且被跟踪 | 无 mcp.json |
| `S_SECRETS_LEAK` | 否 |
| 根 AGENTS 与分册严重漂移 | solo 仓，无分册 |
| **Never do 无 Pn 回链** | ⚠️ `AGENTS.md:7`「不要因缺少 `.cursor/rules` 把本仓降为 PARTIAL」— 无 `→ Pn` 回链 |
| **路径速查空壳** | ⚠️ AGENTS 无「改动路径速查」表 |
| meta.ai_tools 与入口不一致 | 无 meta |
| pitfalls 稳定 ID 重号 | 无 pitfalls |
| L5 漂移 / 手改生成物 | 不适用 |
| 旧 `ready.ok` / 形态分当真「可 AI coding」 | 未命中 |
| 默认 auto / 启发式写 SSOT | 未命中 |

---

## 建议下一阶

- **当前最高完整阶**：严格自检约 **L0⁻**（AGENTS 与 rules 存在，但缺 meta、alwaysApply 总览、rule14；L1 api 有文件但无 templates/sync rule）
- **建议**：`resume` 补齐 **L0–L4**（写 meta + 补 alwaysApply + api 域骨架 + agent-kb 三文件 + superpowers + hooks + mcp.example）
- **轻量选项**：`write-meta-only` 仅写 `docs/harness-eng/harness-meta.yaml`，把当前骨架状态快照入 meta
- **若施工**：resume 后跑 `content-shell-scan.mjs --root /tmp/skill-up-1332897764` 补 Never do Pn 回链与路径速查

---

## 会话自证【推荐】L3+

未具备 L3 hooks，暂无需 session-live。若 resume 到 L3+，建议跑 `session-live` 1.2 + `--emit-playbook`。

---

```
╔════════════════════════════════════════════════════════════════╗
║                     会话仪表盘 (Session Dashboard)              ║
╠════════════════════════════════════════════════════════════════╣
║  阶段    : audit（诊断完成）                                    ║
║  现状    : 骨架存在，缺 meta / L0 必备项 / L1–L4 大量缺口        ║
║  工作    : 已输出 Fingerprint + RecommendedProfile + audit 报告 ║
║  下一步  : resume 补齐 L0–L4，或 write-meta-only 快照           ║
╚════════════════════════════════════════════════════════════════╝
```

---

audit 完成。如需施工，请回复 **`resume`**（续跑补齐缺口）或 **`land`**（重新 scaffold），或指定具体目标阶如 **「升到 L4」**。
