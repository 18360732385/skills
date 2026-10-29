# MCP 使用说明（多工具 SSOT）

面向本仓本地开发：在 AI 编程工具中直连 `{engine}-{profile}` MCP server。  
**SSOT 为本目录 `servers.json`**（若团队约定 `mcp_tracking=vendored_shared`：与配置源同密、入库）；各宿主 `mcp.json`（`.cursor/mcp.json` / 根 `.mcp.json` / `.trae/mcp.json` / `.qoder/mcp.json`）均为 `node scripts/agent-config/sync.mjs` 生成物；`servers.example.json` 为脱敏镜像（example_only 仓真密走本机 `mcp.local.json` / gitignore 真密路径，勿提交）。

## 前置条件

1. Node.js（建议 ≥ 20，提供 `npx`）
2. TODO(harness-eng): server 运行时依赖（如 `uvx`；勿把个人机绝对路径写进仓库——保持 `"command"` 可在 PATH 解析；本机缺依赖时临时用 local 覆盖，勿回传仓库）
3. TODO(harness-eng): 本机网络可达性与各环境地址（或回链 `application-*.yml`，不在此复制连接参数）

## 启用步骤

1. 拉取仓库后生成物已就位（各宿主 mcp.json；example_only 仓先复制 `.example` 为真密并本地填写）
2. 在对应工具的 MCP 设置中确认出现并启用相关 server
3. 重启工具窗口（或重新加载 MCP）后再在对话中调用工具

## Server 对照

| MCP 名称 | 用途 |
|---|---|
| TODO(harness-eng): `{engine}-{profile}` | 库名 / 权限一句话（如 SELECT+DDL）；**勿对 prod 配置可写 MCP** |

## 安全约定

- 勿对 **prod** 配置同类 MCP；测试环境慎用破坏性语句（DROP / 无 WHERE 批量 DELETE / `FLUSHDB` / `FLUSHALL` 等）
- 环境隔离勿混用（如用 `-{test}` server 排查 UAT 数据）；server 命名带 `-{profile}` 后缀防混
- 修改 `servers.json` 并重新生成后，须重启工具的 MCP 才生效

## 验收

- MCP 面板中相关 server 无报错连接
- TODO(harness-eng): 每引擎一条无害探针（`SELECT 1`；Redis SET/GET 后删除等）
