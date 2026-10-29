# feature-eng 一页纸

**须点名**本 skill（不自动加载）。按意图走模式。热路径：[AGENT-INDEX.md](AGENT-INDEX.md)。验收：`node scripts/selfcheck.mjs`。版本：**0.2.27**。

**可选接力**：需要工程化仓时先完成工程化（常见实现别名：`harness-eng`）→ **新会话**再点名本 skill；同会话勿并行。本 skill 可独立使用（无工程化 meta 亦可）。有工程化 meta 时 `start` 会软提示 `ai_coding_ready`（可忽略继续）；详见 [SKILL.md](SKILL.md)「可选接力（工程化仓）」。

## 主循环

```text
init（首次绑 11 环；可选推荐包 / minimal）
  → start（分诊 S/B/F · 建 docs/runs/active/<slug>/）
    → 子 skill 干活（lookup / 指针卡片）
      → advance（L1→L2→写盘→按 handoff_policy 调下一环）
        → … 循环至收口
          → close（active → archive）
```

续跑：`resume`。只看进度：`status`（`node scripts/feature.mjs status`）。改绑：`rebind`。列模式：`node scripts/feature.mjs modes`。  
闸检：`node scripts/feature.mjs gate-evidence --cwd <仓根> --slug <slug>`。收口检查：`node scripts/feature.mjs close-check …`。

## 路径一句话

| 路径 | 一句话 |
|---|---|
| **S** Spike | 可行性探查；结论是答案，不入库代码 |
| **B** Bounded | 小变更；聊天短设计，可无独立 Spec |
| **F** Full | 新子系统 / 改公共接口 / 需 ADR；Spec+Plan+集成用例+测试报告+收口 |

## 三条硬规则

1. **调度员不进厨房**——控制器不写领域正文 / 业务代码。
2. **progress / 回链 仅控制器写**——厨师只回报产物路径列表。
3. **自动调起 ≠ 替用户 yes 硬闸**。

**证据条**：写 `gates.*` 前须合法 `authorized_by`（禁 fixture/auto 占位）+ 适用环 `审核-<stage>.md` 且 **`result: pass`**（proxy 不豁免；proxy 须「仪式与降级」非空）。`proto=entered` 须 ISO `gates.proto_confirmed`。可选产物指针：`artifacts.implement` / `artifacts.pr_url`。

详情：[SKILL.md](SKILL.md) · [flow.md](modes/specs/flow.md) · [gates.md](modes/specs/gates.md)

## 无厨师也能跑完 Full（最小清单）

宿主未装 `stage-bindings` 所指厨师时，`start` 会强制 `chef_mode: controller_proxy`（须警告，勿静默）。也可 init 时选 **minimal** 绑定包。最小可跑完 Full：

1. **绑定文件在**：目标仓 `docs/runs/stage-bindings.yaml`（或先 `init`；可回退技能包 `config/`）；关键环非 null（F：`spec`/`plan`/`testdesign`/`implement`/`verify` 等）——否则 proxy。
2. **过程态**：`docs/runs/active/<slug>/{progress.yaml,回链.md}`；`chef_mode: controller_proxy` 已写入回链「仪式与降级」。
3. **硬闸授权**：用真实 `user_task_<id>` 或 `user_chat`——**禁止伪造聊天笔录与 fixture/auto 占位**。批跑用 `run_mode: unattended` + `user_task_<id>`。
4. **环间**：控制器戴厨师帽按 [gates.md](modes/specs/gates.md) L1 落盘领域产物；仍走 advance L1/L2；`review_policy` 无 Task 则显式降为 `inline`；`invoke` 无 Task / CloudAgent·executor 则显式降为 `inline`（O5b，禁止静默）。
5. **收口**：按 [close.md](modes/close.md) 双归档 L1 检查单（runs + superpowers/archive）。本地无 PR 业务树时契约可认 PR 分支（`契约同步: pr_branch`）；merge 后再 refresh。pitfalls「→ Pn」warn 属目标仓卫生。

边界仍有效：proxy 是**显式降级**，不是默认；能装厨师时优先 `bound`。

## Gate 无 CI 时的可接受证据

环 9 机械轨按下表优先序取至少一项（详情与禁止项见 [gates.md](modes/specs/gates.md) Part A「gate」）：

| 序 | 可接受证据 |
|---|---|
| A | 本地 hooks / lint / smoke：命令 + exit 0 |
| B | `env_notes.verify_commands[]` 每条 exit 0（若有） |
| C | PR Checks / CI 链接且结论可指认 |
| D | **无 CI**：用户接受本地自证 → `mech_track: local_self_attest` + 命令清单 |

**禁止**仅写「测试已跑过」而无命令/退出码/路径/Checks。

## 绿地前端（O10：非空目录脚手架）

仓根已有 `.git` / `LICENSE` / `.gitignore` 时，`create-vite` / `create-next-app` 常因「目录非空」取消。用临时目录再拷回：

```bash
# Vite 示例（按需改 template）
scaffold_dir=$(mktemp -d)
npm create vite@latest "$scaffold_dir" -- --template react-ts
cp -a "$scaffold_dir"/. .
rm -rf "$scaffold_dir"
# 保留远程已有 LICENSE/.gitignore；冲突时人工合并后再 commit + push
```

PowerShell 等价（Windows 宿主）：

```powershell
# Vite 示例（按需改 template）
$tmp = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ("scaffold-" + [guid]::NewGuid().ToString("N").Substring(0,8)))
npm create vite@latest $tmp.FullName -- --template react-ts
Copy-Item -Path (Join-Path $tmp.FullName '*') -Destination . -Recurse -Force
Remove-Item -Recurse -Force $tmp
# 保留远程已有 LICENSE/.gitignore；冲突时人工合并后再 commit + push
```

init/start 遇「仅模板文件、无 package.json」时**提示本配方**，勿只报失败。

## CORS 或 Dev Proxy（O9）

Full+UI 联调二选一（或 `accepted_blocked`）。矩阵与完整片段见 [gates.md](modes/specs/gates.md)。

- **Vite**：`vite.config.ts` → `server.proxy['/api']` → 后端 origin
- **Spring**：须有 `CorsConfigurationSource` Bean（仅 `cors(withDefaults())` 不够）；或改用前端 proxy

## 同仓 monorepo（M1–M6 速记）

- **M1**：`layout: monorepo` + `packages: [{ path, role: api|web|other }]` + `docs_root: docs/`；**勿**用 sibling_repos 指本仓包路径。
- **M2 / M5**：`env_notes.verify_commands` 全员 exit 0 才写 `gates.verify`；`workdir_policy: repo_root`（默认），命令从仓根写（例：`mvn -f backend test` · `npm --prefix frontend test`）。
- **M3**：单 Spec 强制 `## API` / `## UI` / `## 测试矩阵`。
- **M4**：根 README = 双端启动 SSOT；子包 README 短链到根。
- **M6**：合并旧仓时剥离子包 `docs/runs|superpowers`；可选 `docs/HISTORY-split-repos.md`。

## 跨仓 / env_notes 速记

- **O8**：配对仓 → `sibling_repos: [{ url, role: api|web, spec_path }]`；web 消费 api → Spec「消费契约」。
- **O11/O14**：`env_notes.pinned_deps` + `api_base_mode: proxy|absolute`；`node -v` 对照 `engines`。
- **O12**：proto 无厨师 → `设计笔记.md`（模板 `templates/设计笔记.md.tmpl`）草图+主路径 3 步。
- **O13**：web+auth Spec → 会话存储 `memory|sessionStorage|localStorage(+风险)`。
