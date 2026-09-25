#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把「白底」立绘自动抠成透明背景（不需要 GPU，不需要 torch）。

大部分在线绘画平台只能导出白底图，直接放进网站会显示一个白方块。
用这个脚本抠一下就好。

依赖：
    .venv\\Scripts\\python.exe -m pip install pillow
    （或系统 python： python -m pip install pillow）

用法：
    .venv\\Scripts\\python.exe tools\\make_transparent.py                # 处理 images/ 下所有图
    .venv\\Scripts\\python.exe tools\\make_transparent.py mio.png        # 只处理一张
    .venv\\Scripts\\python.exe tools\\make_transparent.py --trim         # 顺便裁掉四周空白
    .venv\\Scripts\\python.exe tools\\make_transparent.py --thresh 50    # 背景阈值调大（渐变背景时用）
"""

import argparse
import os
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageDraw, ImageFilter
except ImportError:
    sys.exit(
        "缺少 Pillow。请先运行：\n"
        "    .venv\\Scripts\\python.exe -m pip install pillow\n"
        "或  python -m pip install pillow"
    )

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"
EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def remove_bg(img, thresh=32, erode=1, feather=1):
    """从四边往里洪水填充，把连通的白色背景变透明。"""
    img = img.convert("RGBA")
    w, h = img.size
    rgb = img.convert("RGB").copy()

    sentinel = (255, 0, 255)          # 用来标记"背景"的哨兵色
    seeds = [
        (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
        (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2),
    ]

    for seed in seeds:
        px = rgb.getpixel(seed)
        # 只有接近白色的角落才开始填充，避免把角色本体涂掉
        if min(px) >= max(180, 255 - thresh - 30):
            try:
                ImageDraw.floodfill(rgb, seed, sentinel, thresh=thresh)
            except Exception:
                pass

    # 找出被标记为哨兵色的像素
    r, g, b = rgb.split()
    is_bg = ImageChops.multiply(
        r.point(lambda v: 255 if v >= 250 else 0),
        ImageChops.multiply(
            g.point(lambda v: 255 if v <= 5 else 0),
            b.point(lambda v: 255 if v >= 250 else 0),
        ),
    )

    alpha = ImageChops.invert(is_bg)

    # 向内收缩一点，消掉角色边缘的白色描边
    if erode > 0:
        alpha = alpha.filter(ImageFilter.MinFilter(erode * 2 + 1))

    # 轻微羽化，边缘不那么硬
    if feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(feather))

    out = img.copy()
    out.putalpha(alpha)
    return out


def trim_alpha(img, pad=6):
    """按不透明区域裁剪四周空白。"""
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)
    return img.crop((left, top, right, bottom))


def process(path, args):
    img = Image.open(path)
    before = img.size

    out = remove_bg(img, thresh=args.thresh, erode=args.erode, feather=args.feather)
    if args.trim:
        out = trim_alpha(out)

    if out.mode != "RGBA":
        out = out.convert("RGBA")

    target = path.with_suffix(".png")
    if not args.overwrite and target.exists() and target != path:
        backup = target.with_name(target.stem + "_bak" + target.suffix)
        shutil.copy2(target, backup)

    out.save(target, "PNG")
    print(f"  ✓ {path.name:20} {before[0]}x{before[1]}  ->  {out.size[0]}x{out.size[1]}  {target.name}")
    return target


def _setup_console():
    """Windows 控制台 UTF-8 输出。"""
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

    ap = argparse.ArgumentParser(description="白底立绘 -> 透明背景")
    ap.add_argument("files", nargs="*", help="指定文件（默认处理 images/ 下全部）")
    ap.add_argument("--thresh", type=int, default=32, help="背景色容差，默认 32；渐变背景可调到 50~80")
    ap.add_argument("--erode", type=int, default=1, help="边缘收缩像素，默认 1")
    ap.add_argument("--feather", type=int, default=1, help="边缘羽化，默认 1")
    ap.add_argument("--trim", action="store_true", help="顺便裁掉四周空白")
    ap.add_argument("--overwrite", action="store_true", help="覆盖原文件（默认另存为 .png）")
    args = ap.parse_args()

    if args.files:
        targets = []
        for f in args.files:
            p = Path(f)
            if not p.is_absolute():
                p = (IMAGES / p) if (IMAGES / p).exists() else Path.cwd() / p
            if p.exists():
                targets.append(p)
            else:
                print(f"  ! 找不到 {f}")
    else:
        targets = [p for p in sorted(IMAGES.iterdir()) if p.suffix.lower() in EXTS and p.stem != "README"]

    if not targets:
        print("没有要处理的图片。把生成的立绘放进 images/ 再运行。")
        return

    print("=" * 60)
    print("  \u2728  白底 -> 透明背景")
    print("=" * 60)
    for p in targets:
        try:
            process(p, args)
        except Exception as e:
            print(f"  ! {p.name} 处理失败：{type(e).__name__}: {e}")
    print("=" * 60)
    print("  完成。接着运行：python tools\\use_images.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
