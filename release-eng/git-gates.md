# Git 闸门（push-gate）

## 【推荐】脚本

在仓库根（分支对确认后）：

```bash
# 增量发版（有基线）
node .cursor/skills/release-eng/scripts/release-push-gate.mjs --root . --release <发版分支> --baseline <基线分支>

# 首次发版（基线=无）
node .cursor/skills/release-eng/scripts/release-push-gate.mjs --root . --release <发版分支> --baseline none
# --baseline 无  等价
```

Exit：`0`=通过 · `2`=未通过 · `1`=错误。

读 stdout JSON：`pass`、`firstRelease`、`headRef`、`baseRef`、`range`、各分支 `unpushed` / `commits`、`warnings`、`hints`（含 `freezeArgs`）。

| 分支对 | 通过条件 | freeze 输入 |
|---|---|---|
| 发版 + 基线分支 | 两侧 ref 存在且相对 origin **未推送均为 0** | `baseRef` / `headRef` |
| 发版 + **`首次发版`（`none`/`无`）** | **仅**发版分支 ref 存在且未推送为 0；`baseRef=null`；`firstRelease=true` | `hints.freezeArgs` → `--first-release --head <headRef>` |

- `pass=true` → Done（通过）；把上表 freeze 输入交给 [freeze.md](freeze.md)  
- `pass=false` → Done（中止）；向用户展示未推送摘要与 `git push` 处置  
- fetch 失败（exit 1）→ 停止并说明 `error`

`--no-fetch` 仅排障用；默认会 `git fetch --prune`。

## 回退（脚本不可用时）

1. 仓库根 `git fetch`  
2. 发版优先 `origin/<name>`；否则本地同名并警告  
3. **有基线**：对发版与基线各算 `git rev-list --count origin/<b>..<b>`；`>0` 则未通过，并 `git log -n 20` 列出  
4. **`首次发版`**：只对发版分支做步骤 3；记下 `headRef`，`baseRef` 记为 `无`

## Done（中止）

- [ ] 用户可见未推送摘要与处置  
- [ ] 发版单「Git 定版」段与本轮定版 WritePlan 均未因本轮而更新  

## Done（通过）

- [ ] 脚本 `pass=true`（或回退：有基线则两分支未推送均为 0；`首次发版` 则仅发版分支为 0）  
- [ ] `headRef` 已选定并告知用户；有基线则另有 `baseRef`；`首次发版` 则明示 `firstRelease=true`  

## 其它警告（仍可定版）

见脚本 `hints.behind` / `hints.dirtyWorktree`（本地落后 origin、工作区脏）。  
