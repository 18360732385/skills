# Apifox / OpenAPI 桥（harness-eng 可选包）

把仓库 `docs/api/modules/*.md` 模块真相生成 OpenAPI，导入 Apifox 作为**可调试接口**。不同步 Markdown 文档页。  
**契约 SSOT 仍是** `docs/api/modules/*.md`；生成的 OpenAPI 仅供导入。

## 前置

1. Node.js >= 18
2. 安装 CLI（可选，用于 `apifox auth login`）：`npm i -g apifox-cli@latest`
3. 登录：`apifox auth login --with-token <你的访问令牌>`（或设 `APIFOX_ACCESS_TOKEN`）
4. 在 Apifox 客户端打开目标项目 → **项目设置 → 功能设置 → 外部 AI 编辑权限**，开启对应权限
5. 设置 **`APIFOX_PROJECT_ID`**（见 `.apifox.env.example`）

## 一键同步

```bash
# Linux / macOS
export APIFOX_PROJECT_ID=<你的项目ID>
node scripts/apifox/sync-to-apifox.mjs

# Windows PowerShell
$env:APIFOX_PROJECT_ID="<你的项目ID>"
node scripts/apifox/sync-to-apifox.mjs
```

流程：

1. `md-to-openapi.mjs`：从 `docs/api/modules/*.md` 生成 `docs/api/generated/openapi.json`
2. `import-openapi-overwrite.mjs`：调用 Apifox 开放 API，`endpointOverwriteBehavior=OVERWRITE_EXISTING`

> **为何不用 CLI `apifox import`？** CLI 无法指定覆盖策略，会沿用项目默认「智能合并」。开放 API 可显式覆盖。

可选环境变量：

| 变量 | 含义 |
|---|---|
| `OPENAPI_TITLE` | OpenAPI `info.title`（默认 `API`） |
| `OPENAPI_SERVER_URL` | servers[0].url（默认 `http://localhost:8080`） |
| `OPENAPI_MODULES_GLOB` | 模块文件名 glob（默认全部 `*.md`，排除 `_` 前缀） |
| `OPENAPI_BEARER_FORMAT` | Bearer 方案的 bearerFormat（默认 `JWT`） |

字段表基线：`| 参数名 | 类型 | 必填 | 说明 | 枚举 | 备注 | 示例值 |`（与 harness-eng API 金标一致；旧 5 列仍兼容）。

## Agent commit 软提醒

若启用 hooks 扩展门禁且本包已落地，暂存含 `docs/api` / controller 变更时会**软提醒**跑本脚本（永不拦截提交）。

## 注意

- 勿把业务仓专名硬编码进脚本；项目 ID / 令牌只走环境变量或本机 `~/.apifox/config.toml`
- 本包由 harness-eng `Q_APIFOX=yes` 可选写入；未选 api 域时不必装
