# release-eng

发版仪式域：把一次上线做成带 Git 证据的目录包，并在上线后归档。本词汇表只定名，不含实现细节。

## Language

**发版仪式**:
在目标仓 `docs/releases/` 上完成准备、审计与归档的固定流程；产物是证据包，不是生产变更。
_Avoid_: 发版流水线, changelog 助手, 上线脚本

**半自动编排**:
首问通过后同会话直跑到 WritePlan 预览（问卷默认「全部推荐」，高风险项才打断）；确认词后才写盘。不落闸状态文件。
_Avoid_: 全自动发版, 一键上线

**版本身份**:
目录包名字，默认 `release-V{yyMMdd}`，由已确认的发版日期导出。与发版分支名解耦；改发版日期则改身份与路径。
_Avoid_: 分支归一化 slug, 版号文件夹

**目录包**:
`docs/releases/<版本身份>/` 整夹（发版单、artifacts、sql/config/jobs 附属）。同一 `yyMMdd` 至多一包进行中。
_Avoid_: notes 包, 发版文件夹（口语可，文书用目录包）

**定版**:
push-gate 已通过且 WritePlan 经确认词（或预授权）写入目录包后的状态。
_Avoid_: 冻结（易与 freeze 采集混淆）, 封版

**freeze**:
对分支对做只读采集，产出 Git 摘要与 sql/config/jobs 候选 draft；本身不写目录包。
_Avoid_: 定版, 冻结发版

**push-gate**:
要求相关分支在 origin 存在且无未推送提交；未通过则禁止写入进行中目录包。
_Avoid_: push 检查（弱）, 远程同步建议

**WritePlan**:
写盘前的计划展示与确认闸；仅词表内确认（或同会话预授权）才允许 note-merge / seal --apply。
_Avoid_: 执行计划, 变更计划（易与工程 plan 混淆）

**评审预览**:
draft-md / WritePlan 只在会话中展示；仓库内无草稿落点。
_Avoid_: 评审草稿, 临时落盘, 先写后推

**闸状态**:
本轮编排的瞬时进度；只存在于命令输出与当前会话。
_Avoid_: 可恢复 state 文件, _work 账本, 编排续跑

**prepare 刷新**:
同版本身份目录已存在时，prepare 直接走刷新采集并再出 WritePlan；不再单独暴露 resume 模式名。
_Avoid_: resume（作为对外模式名）, 续跑状态机

**仓内脚本快照**:
消费仓 `scripts/release-eng/` 可执行副本；须带版本对账，mismatch 默认挡写盘，允许书面/`--allow-drift`。
_Avoid_: vendored skill（正文不进仓）, 默契手工拷贝

**双轨研判**:
可选的 AI 轨（ai-track）；半自动编排默认跳过，仅用户点名或高噪声时再跑。
_Avoid_: 每轮必跑 AI, 双源去重（那是 freeze 规则轨）

**取消发版**:
对未 seal 的进行中目录包做正式撤销（删包并清索引）；不是 seal，不进 archive。
_Avoid_: 手工删文件夹, 当 archive 用

**发版单 HTML**:
目录包内与发版单同名的 `.html` 只读渲染（note-merge 定版/seal 自动重建，`note-html` 可补渲）；md 为唯一 SSOT，勾选/折叠不入档。
_Avoid_: 发版单网页版（非镜像整站）, 手改 html

**首次使用**:
目标仓 `docs/releases/releases.md` 还没有同时记下 SQL 目录和 SQL 格式。与「首次发版」无关：首次发版指基线为「无」。
_Avoid_: 首次发版, 第一次上线

**SQL 目录**:
版本 SQL 所在目录，相对仓库根，记在索引「SQL 扫描」。采集只看这个目录之下的文件。
_Avoid_: db/migration（那只是未记录时的旧默认）, 包内 sql/

**SQL 格式**:
版本 SQL 的文件名规则，与 SQL 目录一起记录。`flyway` 表示 `V<数字>__.sql`；其它值是文件名 glob（如 `*.sql`）。
_Avoid_: 文件编码, DDL/DML 侧（那是整理归类，不是扫描格式）

**逾期未归档**:
进行中目录包已定版且发版日期已过仍未 seal 的状态；对新 prepare 为硬闸。
_Avoid_: 过期发版单, 忘了 archive
