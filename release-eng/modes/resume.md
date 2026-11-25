# resume（已并入 prepare · 0.4）

**对外模式名已移除。** 同版本身份目录已存在时，直接走 [prepare.md](prepare.md)（刷新 draft / 再定版）。

```bash
node scripts/release.mjs prepare -- --root . --release-date YYYY-MM-DD --release-branch … --baseline …
```

`node scripts/release.mjs resume` → exit 1 并提示改用 prepare。
