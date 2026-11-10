#!/usr/bin/env python3
"""为指定 markdown 变更记录表分配下一时间戳版本号。

用法：
  python scripts/new_changelog_version.py --file docs/api/api.md

打印一行：v{yyMMddHHmmssSSS}（Asia/Shanghai；同文件已占用则 +1ms 避让）。
存量 vX.Y 保留；新条须插入变更记录表顶。见 rules 11/12/13/16/20。
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from doc_versioning import next_changelog_version

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(description="分配变更记录 v{ts}")
    parser.add_argument(
        "--file",
        required=True,
        help="含变更记录表的 markdown 路径（相对仓库根或绝对路径）",
    )
    args = parser.parse_args()
    path = Path(args.file)
    if not path.is_absolute():
        path = ROOT / path
    if not path.is_file():
        print(f"文件不存在: {path}", file=sys.stderr)
        return 1
    print(next_changelog_version(path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
