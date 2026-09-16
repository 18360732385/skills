# binding — 环节 ↔ skill 解耦与 lookup

## 原则

- 流程只定义环节、硬闸（见 [stages.md](stages.md)、[gates-common.md](gates-common.md)）；产物形状见 [artifacts.md](artifacts.md)；**不写死**环节用哪个 skill。
- 运行时环节执行者只来自 `config/stage-bindings.yaml`（SSOT；sync 后工作副本在 `.cursor/skills/feature-eng/config/`）。
- 绑定**入库**，团队共用一套映射；个人差异走 `rebind` 提 MR，不改本地副本。
- **推荐 ≠ 强制**：`config/stage-bindings.yaml` 与推荐包 SSOT [`config/stage-bindings.example.yaml`](config/stage-bindings.example.yaml) 里的 skill 名都是建议，不是死绑；init/rebind **首问**须用户选（一键采用推荐 / 逐环改 / 指定其他 skill）。

## 可绑环节（键名固定）

`grill` · `design` · `domain` · `spec` · `plan` · `proto` · `testdesign` · `implement` · `review` · `verify` · `diagnose`

控制器自有环节（不绑子 skill）：`triage` · `proto-bridge` · `go` · `pre-impl` · `handoff` · `advance` · `close`。

## lookup（每个需子 skill 的环节通用）

```text
1. 读 stage-bindings.yaml 中 stages.<环节>.skill
2. skill 为 null / 键缺失
   → 阻断：提示「该环节未绑定 skill，请运行 feature-eng init 或 rebind」
3. skill 已填但当前环境不可调起（未安装）
   → 阻断：协助安装（须用户同意）或提示 rebind；可提示推荐包中的替代名
4. 切断调起（真上下文边界）：用子代理，或请用户在新会话点名该 skill。
   父会话只传输入指针后停在调度，等子 skill 结束再进步骤 5：
   - runs/<slug>/ 路径
   - 上一环产物路径
   - 本环产物期望（[artifacts.md](artifacts.md) 当前环勾选表）
   - 本环截断/回退指令（见下节「同 skill 多环」与「implement 回退」）
5. 子 skill 结束后：只 Read artifacts 当前节勾选 → 全 ✓ 则 [advance.md](advance.md)；缺则停并列缺失项
```

切断完成标准：子 skill 在子代理或新会话中跑完；父会话在步骤 5 才读产物。越界判定见 SKILL.md 控制器边界节。

## 同 skill 多环（brainstorming × design / spec）

`design` 与 `spec` 推荐都绑 `brainstorming`（Superpowers 无独立 writing-specs）。调起时**必须**附加截断指令，避免一口气写到 plan：

| 当前环 | 允许做到 | 禁止 |
|---|---|---|
| design | 澄清问题、方案对比；聊天内设计须用户 yes（F 可分段，每段 yes） | 写 `docs/superpowers/specs/`；调起 `writing-plans`；写业务代码 |
| spec | 将已确认设计落盘为 `docs/superpowers/specs/YYYY-MM-DD-<主题>-设计.md`；自审；等用户审 Spec | 调起 `writing-plans`；实现；重开整段设计访谈（除非用户要求返工） |

域定稿（ADR/CONTEXT）仍走 `domain` 绑定，不由 brainstorming 代做。

## implement 回退（与 Superpowers 同款询问）

1. 读绑定：推荐为 `subagent-driven-development`。
2. 调起前向用户确认（可短问）：
   - **优先**：有子代理能力 → `subagent-driven-development`
   - **其次**：无子代理或用户选择 → `executing-plans`
3. 用户也可指定其他实现类 skill（须已装或同意安装）。
4. 选定后写入本轮会话选用；**不**因单次选择改 yaml（改默认用 rebind）。
5. 实现 skill 内部的 TDD / review 由其自行决定；控制器只按 [artifacts.md](artifacts.md) implement 节勾选校验。

## 临时覆盖

默认**不允许**「本次任务静默换 skill」。确需换默认：先 `rebind`。单次 `implement` 在 SDD / executing-plans 间选择属上节允许的询问，不算污染全局映射。

## 仅 F 环节

`testdesign` / `verify` 的调起时机由路径裁剪决定（SSOT 见 [stages.md](stages.md)）；init 时仍建议预绑，避免 Full 主题跑到一半才发现未绑。
