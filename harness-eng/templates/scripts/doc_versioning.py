#!/usr/bin/env python3
"""文档变更记录版本号 / pitfalls Pn 时间戳发号契约。

新形态（Asia/Shanghai）：
  变更记录：v{yyMMddHHmmssSSS}
  pitfalls：P{yyMMddHHmmssSSS}

存量双轨永久保留：vX.Y、P1–P999（1–3 位）；禁止新写短号 / 其它位数。
SSOT：rules 11/12/13/16/19/20；对齐 migration_naming 的时间戳进位思路。
"""
from __future__ import annotations

import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

SHANGHAI = ZoneInfo("Asia/Shanghai")

LEGACY_V_RE = re.compile(r"^v\d+\.\d+$")
NEW_V_RE = re.compile(r"^v(\d{15})$")
LEGACY_P_RE = re.compile(r"^P\d{1,3}$")
NEW_P_RE = re.compile(r"^P(\d{15})$")

# 变更记录表数据行首列版本（允许前导空格）
CHANGELOG_VERSION_CELL_RE = re.compile(
    r"^\|\s*(v\d+\.\d+|v\d{15})\s*\|"
)
# pitfalls 台账行 ID
PITFALL_ID_CELL_RE = re.compile(r"^\|\s*(P\d+)\s*\|")


def now_shanghai() -> datetime:
    return datetime.now(SHANGHAI)


def format_ts(dt: datetime) -> str:
    """yyMMddHHmmssSSS（毫秒三位）。"""
    ms = dt.microsecond // 1000
    return dt.strftime("%y%m%d%H%M%S") + f"{ms:03d}"


def now_ts() -> str:
    return format_ts(now_shanghai())


def bump_ts(ts: str, delta_ms: int = 1) -> str:
    if len(ts) != 15 or not ts.isdigit():
        raise ValueError(f"非法时间戳: {ts}")
    yy, mo, dd = int(ts[0:2]), int(ts[2:4]), int(ts[4:6])
    hh, mi, ss = int(ts[6:8]), int(ts[8:10]), int(ts[10:12])
    ms = int(ts[12:15])
    year = 2000 + yy
    dt = datetime(year, mo, dd, hh, mi, ss, ms * 1000, tzinfo=SHANGHAI)
    return format_ts(dt + timedelta(milliseconds=delta_ms))


def allocate_unique(occupied: set[str], prefix: str, start_ts: str | None = None) -> str:
    """分配 prefix+ts，占用则 +1ms；最多重试 10000 次。

    prefix 为 'v' 或 'P'。
    """
    if prefix not in ("v", "P"):
        raise ValueError(f"prefix 须为 v 或 P: {prefix}")
    ts = start_ts or now_ts()
    # 若占用集合里已有更大同前缀时间戳，从 max+1 起
    max_existing: str | None = None
    for item in occupied:
        if prefix == "v":
            m = NEW_V_RE.match(item)
        else:
            m = NEW_P_RE.match(item)
        if m:
            cand = m.group(1)
            if max_existing is None or cand > max_existing:
                max_existing = cand
    if max_existing is not None and ts <= max_existing:
        ts = bump_ts(max_existing, 1)
    for _ in range(10_000):
        candidate = f"{prefix}{ts}"
        if candidate not in occupied:
            return candidate
        ts = bump_ts(ts, 1)
        time.sleep(0.001)
    raise SystemExit(f"无法分配空闲 {prefix}{{ts}}（重试耗尽）")


def extract_changelog_versions(text: str) -> set[str]:
    """从 markdown 全文抽取变更记录表中的版本号。"""
    found: set[str] = set()
    for line in text.splitlines():
        m = CHANGELOG_VERSION_CELL_RE.match(line.strip())
        if m:
            found.add(m.group(1))
    return found


def extract_pitfall_ids(text: str) -> set[str]:
    found: set[str] = set()
    for line in text.splitlines():
        m = PITFALL_ID_CELL_RE.match(line.strip())
        if m:
            found.add(m.group(1))
    return found


def next_changelog_version(file_path: Path) -> str:
    text = file_path.read_text(encoding="utf-8")
    occupied = extract_changelog_versions(text)
    return allocate_unique(occupied, "v")


def next_pitfall_id(file_path: Path) -> str:
    text = file_path.read_text(encoding="utf-8")
    occupied = extract_pitfall_ids(text)
    return allocate_unique(occupied, "P")
