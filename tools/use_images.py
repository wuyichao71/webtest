#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 images/ 里的角色图片自动接入网站。

不需要任何第三方库，只用标准库。

用法：
    python tools/use_images.py
    python tools/use_images.py --list      # 只看有哪些图，不改文件

命名规则（重要）：
    images/mio.png       -> 接入到 script.js 里 id: "mio" 的角色
    images/hikari.png    -> 接入到 id: "hikari"
    images/yuki.png      -> 接入到 id: "yuki"
    也支持 mio_01.png / mio_1.png / mio-1.png 这种带编号的，取第一个匹配到的

支持格式：png / jpg / jpeg / webp
建议用 png 且透明背景，否则立绘会带一个白底方块。
"""

import argparse
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"
SCRIPT = ROOT / "script.js"
EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def find_images():
    """扫描 images/，返回 {角色id: 文件名}。"""
    if not IMAGES.is_dir():
        return {}
    found = {}
    for f in sorted(IMAGES.iterdir()):
        if f.suffix.lower() not in EXTS:
            continue
        stem = f.stem
        # 去掉结尾的 _01 / _1 / -01 / 001 之类编号
        cid = re.sub(r"[-_ ]?\d+$", "", stem).strip().lower()
        if not cid:
            continue
        # 同一个 id 有多张时，只有不带编号的优先，否则取第一个
        if cid in found:
            if stem.lower() == cid:      # 例如同时有 mio.png 和 mio_01.png
                found[cid] = f.name
            continue
        found[cid] = f.name
    return found


def char_ids():
    """从 script.js 里读出所有角色 id。"""
    if not SCRIPT.is_file():
        return []
    src = SCRIPT.read_text(encoding="utf-8")
    return re.findall(r'\bid:\s*"([a-z0-9_-]+)"', src, flags=re.I)


def patch(found, ids):
    src = SCRIPT.read_text(encoding="utf-8")
    done, skipped, unknown = [], [], []

    for cid, fname in found.items():
        if ids and cid not in ids:
            skipped.append(f"{cid} (不在 CHARS 里)")
            continue
        marker = f'id: "{cid}",'
        idx = src.find(marker)
        if idx < 0:
            unknown.append(cid)
            continue

        seg = src[idx: idx + 500]
        if re.search(r'\bimage:\s*"', seg):
            skipped.append(f"{cid} (已接入)")
            continue

        at = idx + len(marker)
        src = src[:at] + f'\n        image: "images/{fname}",' + src[at:]
        done.append(f"{cid}  ->  images/{fname}")

    if done:
        SCRIPT.write_text(src, encoding="utf-8")

    return done, skipped, unknown


def _setup_console():
    """Windows 控制台 UTF-8 输出（避免中文/emoji 报 UnicodeEncodeError）。"""
    if os.name == "nt":
        try:
            import ctypes
            ctypes.windll.kernel32.SetConsoleOutputCP(65001)
            ctypes.windll.kernel32.SetConsoleCP(65001)
        except Exception:
            pass
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
        except Exception:
            pass


def main():
    _setup_console()

    ap = argparse.ArgumentParser(description="把 images/ 里的图片接入网站")
    ap.add_argument("--list", action="store_true", help="只列出，不修改 script.js")
    ap.add_argument("--only", default=None, help="只处理指定角色，逗号分隔")
    args = ap.parse_args()

    found = find_images()
    ids = char_ids()
    only = [s.strip() for s in args.only.split(",")] if args.only else None

    print("=" * 56)
    print("  \U0001F338  图片 -> 网站  接入工具")
    print("=" * 56)
    print(f"  script.js 里的角色: {', '.join(ids) if ids else '(没读到)'}")
    print(f"  images/ 里找到的图: {', '.join(f'{k}={v}' for k, v in found.items()) if found else '(空)'}")
    print("-" * 56)

    if not found:
        print("  images/ 里还没有图片。")
        print("  去任意 AI 绘画平台生成后，按下面的名字保存进去：")
        for cid in ids or ["mio", "hikari", "yuki"]:
            print(f"      images/{cid}.png")
        print("=" * 56)
        return

    if args.list:
        for cid, fname in found.items():
            mark = "✓" if cid in ids else "?"
            print(f"  {mark} {cid:10} <- {fname}")
        print("=" * 56)
        return

    done, skipped, unknown = patch(found, only)

    for d in done:
        print(f"  ✓ 已接入  {d}")
    for s in skipped:
        print(f"  - 跳过    {s}")
    for u in unknown:
        print(f"  ! 找不到  {u}（script.js 里没有这个角色 id）")

    if done:
        print("-" * 56)
        print("  完成！刷新浏览器就能看到图片立绘了。")
        print("  如果没变化，强刷一下：Ctrl + F5")
    print("=" * 56)


if __name__ == "__main__":
    main()
