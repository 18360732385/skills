# harness-eng 使用情景

## 1. 空仓 land L2

**输入：**「给这个空仓库落地 harness，做到 L2，契约域 api+db」

**Agent 行为要点：**

1. Fingerprint → 类型 `NEW_EMPTY`
2. 提问：`Q_NAME` / `Q_DESC` / globs / `Q_SEED` / `Q_GLOB_PROFILE`；阶梯 L2；域 api、db
3. 展示 WritePlan + 渲染预览 — **停住等确认**（闸门词表：[write-plan.md](write-plan.md)）
4. 确认后优先 `scripts/land.mjs` 写入（非 L5 委托 render）；写 `harness-meta.yaml`
5. ladder 自检；分级移交 TODO

**期望产出：** 确认前零写入；确认后 L0–L2（仅所选域）；无参考仓业务 `Pn`/真密。

---

## 2. PARTIAL：已有根 AGENTS

**输入：**「补齐 harness，已有 AGENTS.md，不要覆盖我写的 Never do」

**Agent 行为要点：**

1. Fingerprint → `PARTIAL`（`S_AGENTS_ROOT`）
2. `Q_AGENTS` → `merge`
3. WritePlan 中根 AGENTS 为 `merge`；同名节不改正文
4. 确认后写入缺失 rules / docs

**期望产出：** 用户 Never do 保留；缺章节追加。

---

## 3. 对本仓（c-be-sms-ai）audit

**输入：**「用 harness-eng 审计本仓成熟度」

**Agent 行为要点：**

1. Fingerprint → `MATURE`；默认 `audit`（不写盘）
2. 按 [audit-report.md](audit-report.md) 输出；读 meta（若有）
3. 不改业务 modules；不拷 Pn 进 templates

**期望产出：** 已具备 / 缺口 / 反模式 / 建议下一阶。

---

## 4. 兄弟仓 land + README 含密 + 仅根 AGENTS + focused

**输入：**「对 sms2023-backend（或其它兄弟仓）做 harness 工程化」

**Agent 行为要点：**

1. 列出候选根 → `Q_TARGET_ROOT` 确认；写入仅限该根
2. Fingerprint → `NEW_CODE_NO_HARNESS`；`S_SECRETS_LEAK` 若 README/yml 命中 → 警告
3. `Q_MODULES=solo` → `AGENTS.root.solo.md.tmpl`；`Q_GLOB_PROFILE=focused`（大仓）
4. WritePlan 含渲染预览与密钥移交 P0；确认后再 `render.mjs`
5. 分级移交：P0 处理泄露文件；P1 建议 `seed-truths`

**期望产出：** 骨架落在正确根；solo 文案无「见分册」；不自动删 README 密；不拷参考仓业务红线。
