import fs from "fs";

function patchFile(p, pairs) {
  let s = fs.readFileSync(p, "utf8");
  for (const [a, b] of pairs) {
    if (!s.includes(a)) {
      console.warn("MISS", p, JSON.stringify(a).slice(0, 80));
      continue;
    }
    s = s.split(a).join(b);
  }
  fs.writeFileSync(p, s);
  console.log("ok", p);
}

patchFile("scripts/lib/selfcheck/checks-0.5.mjs", [
  [
    'assert(/对齐矩阵（0\\.6\\.x）/.test(aiTools057), "ai-tools matrix title 0.6.x");',
    'assert(/对齐矩阵（0\\.6\\.9|0\\.6\\.x）/.test(aiTools057), "ai-tools matrix title 0.6.9");',
  ],
  [
    'assert(/部分（P2|部分对齐/.test(aiTools057) && /不默认/.test(aiTools057), "ai-tools.md marks Codex as partial P2");',
    'assert(/\\|\\s*`codex`\\s*\\|\\s*\\*\\*高\\*\\*/.test(aiTools057), "ai-tools.md marks Codex as 高");',
  ],
  [
    'assert(/部分对齐|P2/.test(syncHosts057), "sync-hosts.md keeps Codex as P2 / 部分对齐");',
    'assert(/\\*\\*高\\*\\*/.test(syncHosts057) && /codex/i.test(syncHosts057), "sync-hosts.md Codex 高");',
  ],
  [
    'assert(/部分对齐|P2/.test(codexAd057), "codex adapter stays 部分对齐 P2");',
    'assert(/对齐程度：\\*\\*高\\*\\*|\\*\\*高\\*\\*/.test(codexAd057), "codex adapter is 高");',
  ],
  [
    'assert(!/全量镜像/.test(codexAd057) || /暂不全量|不全量/.test(codexAd057), "codex adapter does not claim full sync");',
    'assert(/不做/.test(codexAd057) && /mdc/.test(codexAd057), "codex adapter no .mdc mirror");',
  ],
  [
    'assert(/部分对齐|P2/.test(wp058) && /codex/i.test(wp058), "write-plan Codex P2 warning");',
    'assert(/高/.test(wp058) && /codex/i.test(wp058) && /纪律 B|不.*全部推荐/.test(wp058), "write-plan Codex 高 + 纪律 B");',
  ],
  [
    `/不全量/.test(wp058) && /hooks/.test(wp058) && /MCP/.test(wp058) && /skills/.test(wp058),
    "write-plan says sync does not fully emit Codex rules/hooks/MCP/skills"
  );`,
    `/Starlark|rules/.test(wp058) && /hooks/.test(wp058) && /MCP|toml/.test(wp058),
    "write-plan Codex emits native rules/hooks/MCP"
  );`,
  ],
  [
    `/P2 \\/ 部分对齐/.test(audit058) || /不全量.*Codex|Codex.*不全量/.test(audit058),
    "audit anti-pattern Codex+L5 full-parity"
  );`,
    `/高/.test(audit058) && /mdc/.test(audit058) && /codex/i.test(audit058),
    "audit anti-pattern Codex .mdc mirror"
  );`,
  ],
  [
    `/## Done[\\s\\S]*部分对齐/.test(syncHosts058) && /\\*\\*不\\*\\*全量发出 Codex/.test(syncHosts058),
    "sync-hosts Done Codex P2 / not full emit"
  );`,
    `/## Done[\\s\\S]*高/.test(syncHosts058) && /codex/i.test(syncHosts058),
    "sync-hosts Done Codex 高"
  );`,
  ],
  [
    `/Codex（部分对齐/.test(qYaml058) && /不默认/.test(qYaml058),
    "questions.yaml Codex option labels P2"
  );`,
    `/Codex（高/.test(qYaml058),
    "questions.yaml Codex option labels 高"
  );`,
  ],
  [
    `/部分对齐（P2）/.test(rpCodex) && /\\*\\*不\\*\\*全量发出 Codex/.test(rpCodex),
    "recommended-profile Codex P2 footnote"
  );`,
    `/高/.test(rpCodex) && /纪律 B|探测/.test(rpCodex),
    "recommended-profile Codex 高 footnote"
  );`,
  ],
  [
    'assert(/部分对齐·不默认|不默认/.test(rp0510) && /codex/i.test(rp0510), "recommended-profile Codex 不默认");',
    'assert(/纪律 B|探测/.test(rp0510) && /codex/i.test(rp0510), "recommended-profile Codex 纪律 B");',
  ],
  [
    'assert(/不默认/.test(qYaml0510) && /codex/i.test(qYaml0510), "Q_AI_TOOL Codex labeled 不默认");',
    'assert(/高/.test(qYaml0510) && /codex/i.test(qYaml0510), "Q_AI_TOOL Codex labeled 高");',
  ],
  [
    'assert(/部分对齐·不默认|不默认/.test(aiTools0510), "ai-tools.md Codex 部分对齐·不默认");',
    'assert(/\\|\\s*`codex`\\s*\\|\\s*\\*\\*高\\*\\*/.test(aiTools0510) || /推荐纪律 B/.test(aiTools0510), "ai-tools.md Codex 高");',
  ],
  [
    'assert(/不默认/.test(wp0510) && /codex/i.test(wp0510), "write-plan Codex 不默认");',
    'assert(/纪律 B|不.*全部推荐/.test(wp0510) && /codex/i.test(wp0510), "write-plan Codex 纪律 B");',
  ],
]);

patchFile("scripts/lib/selfcheck/checks-0.6.mjs", [
  [
    `assert(/不默认/.test(codex060) && /部分对齐|P2/.test(codex060), "adapters/codex.md stays partial/不默认");
  assert(/不做/.test(codex060) && /mdc/.test(codex060) && /另立项|out of scope/.test(codex060), "adapters/codex.md no full .mdc mirror");`,
    `assert(/\\*\\*高\\*\\*|对齐程度：\\*\\*高\\*\\*/.test(codex060), "adapters/codex.md is 高");
  assert(/不做/.test(codex060) && /mdc/.test(codex060), "adapters/codex.md no .mdc mirror");`,
  ],
  [
    'assert(/不默认/.test(aiTools060) && /CODEX-PARITY/.test(aiTools060), "ai-tools.md Codex P0 + 不默认");',
    'assert(/CODEX-PARITY/.test(aiTools060) && /\\|\\s*`codex`\\s*\\|\\s*\\*\\*高\\*\\*/.test(aiTools060), "ai-tools.md Codex 高 + PARITY");',
  ],
  [
    'assert(/不默认/.test(codexM4) && /部分对齐|P2/.test(codexM4), "G6 spirit: adapters/codex.md still partial");',
    'assert(/\\*\\*高\\*\\*/.test(codexM4), "G6 updated: adapters/codex.md is 高");',
  ],
  [
    'assert(/另立项|out of scope/.test(codexM4 + aiToolsM4), "G6 spirit: full Cursor parity out of scope");',
    'assert(/不做/.test(codexM4 + aiToolsM4) && /mdc/.test(codexM4 + aiToolsM4), "G6 spirit: no .mdc mirror");',
  ],
  [
    'assert(/不默认/.test(aiTools064) && /Codex|codex/.test(aiTools064), "Codex still 不默认 (P0 thaw ok)");',
    'assert(/推荐纪律 B|探测/.test(aiTools064) && /Codex|codex/.test(aiTools064), "Codex 纪律 B");',
  ],
  [
    'assert(fs.existsSync(path.join(skillRoot, "host/CODEX-P0-MANUAL.md")), "CODEX-P0-MANUAL.md");',
    'assert(fs.existsSync(path.join(skillRoot, "host/CODEX-MANUAL.md")), "CODEX-MANUAL.md");',
  ],
  [
    'const manual068 = fs.readFileSync(path.join(skillRoot, "host/CODEX-P0-MANUAL.md"), "utf8");',
    'const manual068 = fs.readFileSync(path.join(skillRoot, "host/CODEX-MANUAL.md"), "utf8");',
  ],
  [
    'assert(/P0|增量解冻/.test(adapter068), "adapter mentions P0 thaw");',
    'assert(/\\*\\*高\\*\\*|对齐程度：\\*\\*高\\*\\*/.test(adapter068), "adapter is 高");',
  ],
  [
    'assert(/CODEX-PARITY/.test(aiTools068) && /增量解冻/.test(aiTools068), "ai-tools P0 thaw + PARITY link");',
    'assert(/CODEX-PARITY/.test(aiTools068) && (/0\\.6\\.9/.test(aiTools068) || /\\*\\*高\\*\\*/.test(aiTools068)), "ai-tools 高 + PARITY link");',
  ],
  [
    'assert(/CODEX-PARITY/.test(hostReadme068) && /CODEX-P0-MANUAL/.test(hostReadme068), "host README links Codex docs");',
    'assert(/CODEX-PARITY/.test(hostReadme068) && /CODEX-MANUAL/.test(hostReadme068), "host README links Codex docs");',
  ],
  [
    'assert(/\\.agents\\/skills\\/GENERATED/.test(syncTmpl068), "sync writes Codex skills light pointer");',
    'assert(/\\.agents\\/skills/.test(syncTmpl068), "sync writes Codex skills path");',
  ],
]);

console.log("selfcheck patches applied");
