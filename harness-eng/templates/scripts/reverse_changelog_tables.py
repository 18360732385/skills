#!/usr/bin/env python3
"""将 markdown「变更记录」表按版本键降序排列（不改版本字符串）。

用法：
  python scripts/reverse_changelog_tables.py --dry-run
  python scripts/reverse_changelog_tables.py

目标：五域索引/单篇真相 + 首层分册 */AGENTS.md。
已是新→旧的表跳过；非标准版本（如 v基线）沉底。重复执行幂等。
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

HEADING_RE = re.compile(r"^##\s+变更记录")
SEP_RE = re.compile(r"^\|[\s\-:|]+\|\s*$")
NEW_V_RE = re.compile(r"^v\d{15}$")
LEGACY_V_RE = re.compile(r"^v\d+\.\d+$")


def collect_targets() -> list[Path]:
    out: list[Path] = []
    pairs = [
        ("docs/api", "api.md", "modules"),
        ("docs/func", "func.md", "modules"),
        ("docs/db", "db.md", "table"),
        ("docs/jobs", "jobs.md", "tasks"),
        ("docs/redis", "redis.md", "keys"),
    ]
    for base, index, sub in pairs:
        p = ROOT / base / index
        if p.is_file():
            out.append(p)
        d = ROOT / base / sub
        if d.is_dir():
            for f in sorted(d.glob("*.md")):
                if f.name == "README.md":
                    continue
                if f.name.endswith("_change.sql"):
                    continue
                out.append(f)
    # 去域化：首层分册 AGENTS（如 backend/AGENTS.md、web/AGENTS.md）
    for p in sorted(ROOT.glob("*/AGENTS.md")):
        if p.is_file():
            out.append(p)
    return out


def first_cell(line: str) -> str:
    parts = line.strip().strip("|").split("|")
    return parts[0].strip() if parts else ""


def parse_version_key(ver: str) -> tuple:
    """排序键：新轨时间戳 > 旧轨 vX.Y > 其它标注；同轨内数值越大越新。"""
    if NEW_V_RE.fullmatch(ver):
        return (1, int(ver[1:]))
    if LEGACY_V_RE.fullmatch(ver):
        major, minor = ver[1:].split(".", 1)
        return (0, int(major), int(minor))
    # 非标准（如 v基线）：沉底，按原文稳定区分
    return (-1, ver)


def is_newest_first(data_rows: list[str]) -> bool:
    """相邻行版本键非递增（允许相等）→ 已是新→旧。"""
    keys = [parse_version_key(first_cell(row)) for row in data_rows]
    for i in range(len(keys) - 1):
        if keys[i] < keys[i + 1]:
            return False
    return True


def reverse_tables_in_text(text: str) -> tuple[str, int, int]:
    """返回 (新文本, 反转表数, 跳过表数)。"""
    lines = text.splitlines(keepends=True)
    i = 0
    reversed_n = 0
    skipped_n = 0
    out: list[str] = []

    while i < len(lines):
        line = lines[i]
        if not HEADING_RE.match(line.strip()):
            out.append(line)
            i += 1
            continue

        out.append(line)
        i += 1
        # 标题下的说明行，直到表头
        while i < len(lines) and not lines[i].lstrip().startswith("|"):
            out.append(lines[i])
            i += 1
        if i >= len(lines):
            break

        # 表头
        header = lines[i]
        out.append(header)
        i += 1
        if i >= len(lines):
            break

        # 分隔行
        if SEP_RE.match(lines[i].strip()):
            out.append(lines[i])
            i += 1
        else:
            # 非标准表，不处理后续
            continue

        data: list[str] = []
        while i < len(lines):
            raw = lines[i]
            stripped = raw.strip()
            if not stripped.startswith("|"):
                break
            if SEP_RE.match(stripped):
                break
            data.append(raw)
            i += 1

        if len(data) <= 1:
            out.extend(data)
            skipped_n += 1
        elif is_newest_first(data):
            out.extend(data)
            skipped_n += 1
        else:
            # 按版本键降序（稳定），避免盲目 reverse 后仍不单调、再次跑又翻回去
            out.extend(
                sorted(data, key=lambda row: parse_version_key(first_cell(row)), reverse=True)
            )
            reversed_n += 1

    return "".join(out), reversed_n, skipped_n


def process_file(path: Path, dry_run: bool) -> tuple[str, int, int]:
    text = path.read_text(encoding="utf-8")
    if "## 变更记录" not in text:
        return "no-section", 0, 0
    new_text, rev, skip = reverse_tables_in_text(text)
    if rev == 0 and skip == 0:
        return "no-table", 0, 0
    if rev == 0:
        return "skip", 0, skip
    if not dry_run and new_text != text:
        path.write_text(new_text, encoding="utf-8", newline="\n")
    return "reversed", rev, skip


def main() -> int:
    parser = argparse.ArgumentParser(description="倒排变更记录表")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    files = collect_targets()
    stats = {"reversed": 0, "skip": 0, "no-section": 0, "no-table": 0}
    rev_tables = 0
    skip_tables = 0

    for path in files:
        rel = path.relative_to(ROOT).as_posix()
        status, rev, skip = process_file(path, args.dry_run)
        stats[status] = stats.get(status, 0) + 1
        rev_tables += rev
        skip_tables += skip
        if status == "reversed":
            print(f"  REVERSE {rel} (tables={rev})")
        elif status == "skip" and args.dry_run:
            print(f"  skip    {rel} (already newest-first, tables={skip})")

    mode = "dry-run" if args.dry_run else "apply"
    print(
        f"[{mode}] files={len(files)} reversed_files={stats.get('reversed', 0)} "
        f"skip_files={stats.get('skip', 0)} no_section={stats.get('no-section', 0)} "
        f"tables_reversed={rev_tables} tables_skipped={skip_tables}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
