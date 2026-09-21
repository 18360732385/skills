# gates-common — 各环硬闸

> 闸概念聚拢：绑定闸定义在 [binding.md](binding.md)（lookup 缺失/未安装 → 阻断）；本页收其余各闸。每闸 = **通过条件** + **失败时行为**。  
> **L1** 形状：[artifacts.md](artifacts.md)；**L2** 语义：[gates-review.md](gates-review.md)。advance 适用时须 L1∧L2；用户硬闸另需短确认卡片。控制器只校验/调度、不代做领域工作、**不替用户 yes**。

## 用户硬闸短确认卡片（模板）

凡需用户显式确认的闸，贴出后等待，不得静默通过：

```text
【硬闸确认 · <闸名>】
依据：…
请回复：确认 / 返工：…
```

进入下一环且 `handoff_policy=confirm` 时，用同款短卡片（「进入〈中文名〉…」）。

## 硬闸授权 `authorized_by`（O3）

凡用户硬闸（分诊 / 共享理解 / 设计确认 / 开干 / Pre-Impl / Gate / Verify / Close 等需显式确认者），在 `回链.md`「硬闸授权」表记录：

| 合法取值 | 含义 |
|---|---|
| `user_chat` | 本会话真实用户确认（短确认卡片回复） |
| `user_task_<id>` | 任务级授权码（如 `user_task_2026-09-21`）；批量/无人值守任务用此，**不**伪造聊天 |
| `policy_exception` | 策略例外（须在备注写清依据） |

**禁止**：把「看起来像对话」的假 transcript / 占位笔录（含伪造的「用户：确认」多轮对话）写入授权证据。校验器 / selfcheck 拒绝此类占位。

## review_policy 降级备注（O5）

`start` 若将 `review_policy` 从 `subagent` 降为 `inline`（宿主无 Task），须在本主题 `回链.md`「仪式与降级」与门禁清单写明，**禁止静默**。L2 仍按 [gates-review.md](gates-review.md) 执行。

## 跨仓契约闸（O8）

适用：`progress.sibling_repos` 非空，且本仓条目（或唯一条目）`role=web`，并声明了至少一条 `role=api` 的 sibling。

- **通过**：Spec（`artifacts.spec`）内有可指认的 **「消费契约」** 小节，**或** 明确链接到 api sibling 的 Spec/OpenAPI（路径或 URL 非空）。回链「跨仓」表已填。
- **失败**：列缺失；不得过 Shared Understanding 后假装契约已对齐；不得进 Pre-Impl（F+跨仓 web）。

## 同仓 layout / Spec 章节闸（M1 / M3）

适用：`progress.layout=monorepo`，或 `packages` 同时含 `role=api` 与 `role=web`。

- **M1**：`packages` 已填；`docs_root` 默认 `docs/`；**禁止** `sibling_repos` 指向与 `packages[].path` 同仓同路径。
- **M3**：单 Spec 含可指认 `## API` / `## UI` / `## 测试矩阵`（或等价标题）；两侧路径或声明至少各一。
- **通过**：上述 L1 勾选成立（见 artifacts spec 节）。
- **失败**：缺章节或仅一侧 → 不得写 `gates.design_confirmed` 完备宣称；F 路径不得进 Pre-Impl 假装双端已设计。

## 联调矩阵 CORS / Dev Proxy（O9）

适用：**Full + UI**（本仓有前端树，或 `sibling_repos` 含 web，或 Spec 含页面/联调）。在 **Pre-Impl** 与 **Gate** 检查 `integration_ready`（可写 progress 旁注或 `回链.md`「其他」）：

| 取值 | 含义 |
|---|---|
| `cors_ready` | 后端 CORS 已配（如 Spring `CorsConfigurationSource`）且可被浏览器直连验证 |
| `proxy_ready` | 前端 Dev Proxy 已配（如 Vite `server.proxy['/api']`）且同源联调可通 |
| `accepted_blocked` | 联调暂不可用；用户显式接受残留（须写入 `accepted_residual` / 回链备注） |

- **通过**：三者之一已记录。
- **失败**：sibling 后端 CORS 未就绪 **且** 前端未配 proxy，又无 `accepted_blocked` → Pre-Impl/Gate 失败。
- Snippet 见 [QUICKSTART.md](../QUICKSTART.md)「CORS 或 Dev Proxy」。

## Proto 轻量降级通过条件（O12）

适用：`proto=entered` 且（`stages.proto.skill` 为 null **或** `chef_mode=controller_proxy`）。

- **通过**：`设计笔记.md`（或 `artifacts.proto` 指向的等价笔记）含 **交互草图** + **主路径 ≥3 步** + 关键状态机/状态枚举可指认。**不要求**可点击 HTML。
- **失败**：仅有空标题或口头描述无落盘 → 不过 proto 闸。
- `bound` 且 proto skill 可调起时：仍按 [artifacts.md](artifacts.md) proto 节（可打开原型优先）。

## 分诊闸（环 0）

- 通过：Agent 提议 S/B/F 并给依据；用户显式确认其一（短确认卡片）。
- 失败：停在 start；不得创建 `runs/` 下游产物。

## 共享理解闸（环 1 末）

- 通过：L1+L2（离开 grill）过；用户显式确认可进设计（同义可）；advance 写 `gates.shared_understanding`。若用户已提跨仓配对 → `sibling_repos` 至少一条。
- 失败：继续澄清；不得进环 2。
- `express`：可与设计确认闸合并为**一次总 yes**（同时写两闸时间戳）；仍须用户显式确认，不得默认静默通过。

## 设计确认闸（环 2 末）

- 通过：L1+L2（离开 design）过；B = 短设计获用户显式 yes；F = 整体或每段 yes；`express` = 与 grill 合并的一次总 yes。advance 写 `gates.design_confirmed`。
- 失败：回到设计；不得进定稿桥 / spec。
- 通过后 → 跑 [domain-bridge.md](domain-bridge.md)（默认常 skipped，再进 spec 或 domain）。

## 定稿桥（环 2→3）

- 规则见 [domain-bridge.md](domain-bridge.md)；桥本身不写 ADR，只决定 `domain=skipped|skipped_by_user|entered`（展示结论可推翻）。结束后按 `handoff_policy` 主动进下一环。

## 开干闸（环 5 末，计划侧）

- 通过：L1+L2（离开 plan）过；三问语义成立：①任务依赖无环 ②契约变更已列入首批 ③每任务有可测验收；用户短确认（若尚未在 plan 审中显式 yes）。
- 失败：补 plan；不得进 Proto 桥。

## Proto 桥（环 5→6）

- 规则见 [proto-bridge.md](proto-bridge.md)；决定 `proto=*`（展示结论可推翻；需 UI 须显式同意）。结束后按 `handoff_policy` 主动进下一环。

## Pre-Impl 闸（环 7b）

- F 通过：artifacts 中 proto（若 entered）与 testdesign 两节 L1 勾选全过；testdesign/proto 适用时 L2 已过；适用时 O8 消费契约 / O9 联调矩阵 / M3 monorepo Spec 章节已满足。
- B 通过：proto（若 entered）勾选全过；**无** TestDesign 要求；适用时 O9 同上。
- 失败：停；按勾选表列缺失项；不得进环 8。
- 通过后按 `handoff_policy` 主动调起 implement。

## Gate 闸（环 9）

- 通过：artifacts gate 节 L1 全过 + L2（离开 gate）过（机械轨 + 语义轨无未决 blocker）；Full+UI 时 O9 `integration_ready` 仍成立（或 `accepted_blocked`）。
- 失败：回环 8 修；不得进环 10 / 10′。

## Verify 闸（环 10，仅 F）

- 通过：artifacts verify 节 L1 全过 + L2（离开 verify）过（含每条用例结论与残留规则）；`env_notes` 适用时含 `api_base_mode`（O14）与必要的 `pinned_deps`（O11）。
- **M2**：若 `layout=monorepo` 或 `env_notes.verify_commands` 非空 → **每一条** verify_commands 已 exit 0（报告可指认），缺一不得写 `gates.verify`。
- **M5**：命令按 `workdir_policy`（默认 `repo_root`）从仓根书写。
- 失败：进环 10b 排障（先复现再改），修完回本环复测失败项。

## Close 闸（环 11）

- 通过条件正文见 [close.md](close.md)（skill 内收口规则；契约目录 / pitfalls lint 为可选增强）。
- 失败：列缺项；不得宣称交付。
