# 交付收口清单（唯一正文）

> **SSOT**：本文件由 harness-eng 渲染（`docs/agent-kb/delivery-checklist.md`）。  
> rule `00` / `18` / `19`、根 AGENTS「踩坑回流」、stop-checklist、feature-eng close **只留指针**，勿在他处复述步骤正文。  
> **时机**：**宣称交付 / 合并前 / feature-eng close** 时执行；**进行中主题允许中途 commit**，勿因本清单强制假收口。

按顺序勾选（本主题无该项则标 N/A）：

## 1. 契约同步

- [ ] 本主题改动的 `docs/func|api|db|redis|jobs` 真相已与代码对齐（无契约树 → N/A）
- [ ] 漏同步项已补齐或记入残留并获用户接受

## 2. harness 快照刷新（可选）

- [ ] 若存在 harness-eng：代跑  
  `node <harness-eng>/scripts/harness.mjs --mode refresh --root .`  
  （缺 inventory 会重扫；写 `docs/harness-eng/score-latest.json`）
- [ ] 失败：列出 blockers；用户接受残留则在 runs `回链.md` 标 `harness_snapshot: stale`；无 harness → N/A

## 3. superpowers + runs 双归档

- [ ] Spec/Plan 徽章「已交付」+ `git mv`（或未跟踪 `mv`）入 `docs/superpowers/archive/`
- [ ] README「进行中」删行 → ARCHIVE 追加（「提交」列：合并前填 PR/MR URL 或 `pr:<n>`；合并后回填 merge commit SHA；禁止仅写 squash 前分支 tip）
- [ ] **若有** `docs/runs/active/<slug>/`：`stage=done` + active→archive + 回链终态

## 4. pitfalls 三问 + lint

- [ ] 三问：本轮是否修了智能体易再犯错误做法？有则追加/核对 `Pn`（rule `19`）
- [ ] 若存在 `scripts/agent-kb/lint-pitfalls.mjs`：改台账后跑通（不过不许宣称交付）
- [ ] 无台账：三问结论写入 runs 小结并注明「无 L2 pitfalls」

## 5. AGENTS 事实核对

- [ ] 本主题若改变分册事实（路由/命令/边界）：已更新对应 `AGENTS.md` 事实行（不增删 H2）；并在 `回链.md` 记「AGENTS 变更」
- [ ] 无变更 → N/A

## 完成标准

上表适用项全勾；方可宣称「已交付」/ 合并主功能主题。
