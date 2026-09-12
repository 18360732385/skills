# seed-truths（补空壳真相 · Phase-2）

## Done

1. 启用契约域的索引表有本轮导航行
2. 对应 `01-*.md` 存在且含 `TODO(harness-eng)` 骨架
3. 未覆盖已有非空真相正文

在 land/resume 完成骨架后，为契约域生成**索引导航行 + 空壳真相**，使 Agent 有落点可读。  
**不是**字段级契约生成器。对用户优先说「补空壳真相」。

## 触发

- **补空壳真相**（seed-truths）
- land/resume 移交后用户明确要求继续 Phase-2

## 流水线

```
- [ ] 1 确认目标根（Q_TARGET_ROOT）与已启用契约域；展示术语（glossary）
- [ ] 2 探测：Maven modules / 顶层包 / *Controller 包名 → 候选短名 + RecommendedProfile
- [ ] 3 提问 Q_SEED_DOMAINS / Q_SEED_NAMES（每批≤5；可「全部推荐」）
- [ ] 4 WritePlan：将改哪些索引表行 + 新建哪些 01-*.md — 等待确认
- [ ] 5 确认后优先执行：
        node scripts/seed-truths.mjs --root <TARGET> \
          --domains api,func,db,redis,jobs \
          --modules <comma-list> \
          [--dry-run]
      无脚本环境时才手工写入；已有非空真相正文保留
- [ ] 6 自检：索引表有行；01 文件存在且含 TODO(harness-eng) 骨架
```

## 脚本

```bash
node scripts/seed-truths.mjs --root <TARGET_ROOT> --dry-run
node scripts/seed-truths.mjs --root <TARGET_ROOT> \
  --domains api,func,db,redis,jobs \
  --modules sms-entrance,sms-safe,sms-bpm,sms-system
```

行为摘要：

| 域 | 短名来源 | 产出 |
|---|---|---|
| api / func | `--modules` 或 `pom.xml` `<module>` | `docs/{api\|func}/modules/NN-{slug}.md` |
| db | SQL `CREATE TABLE` / `@TableName`（无证据则跳过该域） | `docs/db/table/NN-{table}.md` |
| redis | Java 字符串启发式 Key 前缀（无则 `redis-cache`） | `docs/redis/keys/NN-{family}.md` |

- 已有**非空**真相 → skip  
- 索引缺导航行 → 追加  
- 无 npm 依赖  

## 产出边界

| 做 | 不做 |
|---|---|
| 在 `docs/{func,api,db,redis,jobs}` 索引表追加导航行 | 展开方法清单 / 请求字段表 |
| 按各域 template 建空壳 `01-{name}.md`（或 `01-{table}.md`） | 从他仓拷贝业务正文 |
| 更新 modules/table/keys 的 README 一句指引（可选） | 写入密码、Token、连接串 |
| | 覆盖已有真相中用户已写章节（已存在则 skip） |

## 空壳最小内容

- 模块/表/Key 中文名或 slug 标题
- 「TODO(harness-eng): 从代码补全」占位节
- 变更记录一行（创建空壳）

## 确认闸门

与 land 相同等价词；确认前零写入（`--dry-run` 可先预览）。
