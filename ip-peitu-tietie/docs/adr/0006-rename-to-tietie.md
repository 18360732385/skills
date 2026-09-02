# 目录与 token 改为 ip-peitu-tietie

技能改造完成后，用户主动将目录和调用 token 从序号 `ip-peitu-02` 改为 `ip-peitu-tietie`。糖糖技能目录从 `ip-peitu-01` 改为 `ip-peitu-tangtang`。两套都迁入中央库 `~/.agents/skills`，平台侧用 junction 指向中央，避免再出现「claude 一份实目录、中央一份旧名」的分叉。
