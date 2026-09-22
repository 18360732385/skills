import fs from "fs";
import path from "path";

const root = path.resolve(".");

function patch(rel, pairs) {
  const p = path.join(root, rel);
  let s = fs.readFileSync(p, "utf8");
  for (const [a, b] of pairs) {
    if (!s.includes(a)) {
      console.warn("MISS", rel, a.slice(0, 60));
      continue;
    }
    s = s.split(a).join(b);
  }
  fs.writeFileSync(p, s);
  console.log("patched", rel);
}

patch("host/sync-hosts.md", [
  [
    "4. 若 `ai_tools` 含 `codex`：已向用户明示 **部分对齐（P0 解冻·仍不默认）** — sync **不**全量发出 Codex rules / MCP / skills（可写 skills 轻指针与 hooks/config example；见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md) · [CODEX-PARITY.md](CODEX-PARITY.md)）",
    "4. 若 `ai_tools` 含 `codex`：已对齐 **高**（推荐纪律 B）— sync 发出 config.toml.example / hooks+adapter / Starlark rules / `.agents/skills`（**不做** `.mdc` 镜像；见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md) · [CODEX-PARITY.md](CODEX-PARITY.md)）",
  ],
  [
    "| codex | `adapters/codex.md` · [CODEX-PARITY.md](CODEX-PARITY.md) | **部分（P2+P0）** — 勿当成已全量同步；不做 `.mdc` 镜像 |",
    "| codex | `adapters/codex.md` · [CODEX-PARITY.md](CODEX-PARITY.md) | **高**（纪律 B；不做 `.mdc` 镜像） |",
  ],
  [
    "L3+ / L5 全量镜像宿主不再强制冗余 `1x-contract-sync`；Codex 仍写 `.codex/contract-sync.md`。",
    "L3+ / L5 全量镜像宿主与 Codex 不再强制冗余 `1x-contract-sync` / `contract-sync`（L0–L2 Codex 仍写）。",
  ],
]);

patch("modes/write-plan.md", [
  [
    "> **Codex = 部分对齐（P2）·不默认**：未探测到 `.codex/` 时**不**进「全部推荐」。本轮 land / L5 `sync.mjs` **不全量**发出 Codex 的 rules / hooks / MCP / skills。不要当成与 Cursor/Claude 全家桶对等。详见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md)。",
    "> **Codex = 高（推荐纪律 B）**：未探测到 `.codex/` 时**不**进「全部推荐」。选中后 land / L5 `sync.mjs` 发出原生 rules（Starlark）/ hooks / MCP toml / skills。**不做** `.mdc` 镜像。详见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md)。",
  ],
]);

patch("modes/recommended-profile.md", [
  [
    "| `ai_tools` | 仅已探测项：`.cursor`→`cursor`；`CLAUDE.md`→`claude`；`.codex`→`codex`（**部分对齐·不默认**）；`.qoder`→`qoder`；`.trae`→`trae`（**高**；探测到则进「全部推荐」，脚注勿写成吓退式「中高」）；`.codebuddy`/`CODEBUDDY.md`→`workbuddy`。**Codex 不进「全部推荐」** 除非探测到 `.codex/` 或用户显式勾选。皆无则 `[]`，须追问一次 `Q_AI_TOOL`；**不**默认 `[cursor]`，不因此只写 `.cursor/` 适配/hooks。自定义不进「全部推荐」除非用户已写路径。**含 `codex` 时脚注「部分对齐（P2）·不默认」** — L5/`sync.mjs` **不**全量发出 Codex rules/hooks/MCP/skills（见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md)） |",
    "| `ai_tools` | 仅已探测项：`.cursor`→`cursor`；`CLAUDE.md`→`claude`；`.codex`→`codex`（**高**；推荐纪律 B）；`.qoder`→`qoder`；`.trae`→`trae`（**高**；脚注勿写成吓退式「中高」）；`.codebuddy`/`CODEBUDDY.md`→`workbuddy`。**Codex 仅**探测到 `.codex/` 或用户显式勾选才进「全部推荐」。皆无则 `[]`，须追问一次 `Q_AI_TOOL`；**不**默认 `[cursor]`。自定义不进「全部推荐」除非用户已写路径。含 `codex` 时脚注「高 · 不做 .mdc 镜像」（见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md)） |",
  ],
  [
    "- AI 工具面: cursor — 理由：探测到 .cursor（若含 Codex：脚注 **部分对齐（P2）·不默认**，L5 sync 不全量分发；未探测不进「全部推荐」）",
    "- AI 工具面: cursor — 理由：探测到 .cursor（若含 Codex：脚注 **高 · 纪律 B**，不做 .mdc 镜像；未探测不进「全部推荐」）",
  ],
]);

patch("questions.yaml", [
  [
    "- { value: codex, label: Codex（部分对齐·不默认 / P0 解冻；L5 sync 不全量分发） }",
    "- { value: codex, label: Codex（高 · 探测或勾选；不做 .mdc 镜像） }",
  ],
]);

patch("modes/audit-report.md", [
  [
    "- [ ] 若 `ai_tools` 含 `codex`：已标明 **P2 / 部分对齐**（`sync.mjs` **不全量**发出 Codex rules/hooks/MCP/skills；见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md)）",
    "- [ ] 若 `ai_tools` 含 `codex`：已标明 **高**（纪律 B；`sync.mjs` 发出原生 Codex 资产；**不做** `.mdc` 镜像；见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md)）",
  ],
  [
    "| **把 Codex + L5 当成全量对齐**（`sync.mjs` **不全量**发出 Codex rules/hooks/MCP/skills；对齐程度 **P2**，见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md)） | |",
    "| **把 Codex `.mdc` 镜像当成已支持**（Codex **高**但不做 `.mdc` 镜像；见 [adapters/codex.md](../templates/ai-tools/adapters/codex.md)） | |",
  ],
]);

patch("host/README.md", [
  [
    "| [ai-tools.md](ai-tools.md) | `Q_AI_TOOL` / 对齐矩阵 / Codex P0 增量解冻（仍不默认） |",
    "| [ai-tools.md](ai-tools.md) | `Q_AI_TOOL` / 对齐矩阵 / Codex **高**（纪律 B） |",
  ],
  [
    "| [CODEX-PARITY.md](CODEX-PARITY.md) | Codex P0 官方对齐（**0.6.8-dev**；不做 `.mdc` 全量镜像） |",
    "| [CODEX-PARITY.md](CODEX-PARITY.md) | Codex 官方对齐（**0.6.9 · 高**；不做 `.mdc` 全量镜像） |",
  ],
  [
    "| [CODEX-P0-MANUAL.md](CODEX-P0-MANUAL.md) | Codex CLI/IDE 人验短清单 |",
    "| [CODEX-MANUAL.md](CODEX-MANUAL.md) | Codex CLI/IDE 人验清单（P0 stub → 此页） |",
  ],
]);

console.log("done");
