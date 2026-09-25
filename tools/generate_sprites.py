#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用 Stable Diffusion 生成动漫立绘，自动抠成透明背景，并自动接入网站。

用法：
    .\\.venv\\Scripts\\python.exe tools\\generate_sprites.py
    .\\.venv\\Scripts\\python.exe tools\\generate_sprites.py --model animagine
    .\\.venv\\Scripts\\python.exe tools\\generate_sprites.py --n 4        # 每个角色出 4 张备选
    .\\.venv\\Scripts\\python.exe tools\\generate_sprites.py --only mio   # 只生成某个角色
    .\\.venv\\Scripts\\python.exe tools\\generate_sprites.py --no-cutout  # 不抠图

生成结果保存在 images/ 下。加 --patch 会自动往 script.js 里写 image 字段。
"""

import argparse
import os
import re
import sys
import time
from pathlib import Path

os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")   # 国内加速，官方源可注释掉

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images"

# ---------------------------------------------------------------- 模型
MODELS = {
    # SD1.5 动漫模型，2GB 左右，8G 显存轻松跑，出图快 —— 推荐
    "counterfeit": {
        "repo": "gsdf/Counterfeit-V3.0",
        "arch": "sd15",
        "size": (512, 768),
        "steps": 30,
        "cfg": 7.5,
    },
    # SDXL 动漫模型，6.9GB，质量更好但更慢更吃显存
    "animagine": {
        "repo": "cagliostrolab/animagine-xl-3.1",
        "arch": "sdxl",
        "size": (832, 1216),
        "steps": 28,
        "cfg": 7.0,
    },
    # 更梦幻的 SD1.5 动漫模型
    "meinamix": {
        "repo": "Meina/MeinaMix_V11",
        "arch": "sd15",
        "size": (512, 768),
        "steps": 30,
        "cfg": 7.0,
    },
}

# ---------------------------------------------------------------- 角色
# tags 用的是 danbooru 风格的英文标签，改这里就能换人设
CHARACTERS = [
    {
        "id": "mio",
        "name": "美绪 · 青梅竹马",
        "seed": 20240601,
        "tags": (
            "1girl, solo, orange hair, long hair, twintails, amber eyes, "
            "shrine maiden, white haori, red hakama, hair ribbon, "
            "open mouth, happy, smile, arms behind back"
        ),
    },
    {
        "id": "hikari",
        "name": "光 · 本作主角",
        "seed": 20240602,
        "tags": (
            "1girl, solo, pink hair, long hair, purple eyes, "
            "yukata, floral print, cherry blossom hair ornament, "
            "gentle smile, hands together, blush"
        ),
    },
    {
        "id": "yuki",
        "name": "雪 · 高冷学姐",
        "seed": 20240603,
        "tags": (
            "1girl, solo, black hair, very long hair, blue eyes, "
            "kimono, kanzashi hair ornament, expressionless, calm, arms crossed"
        ),
    },
]

BASE_POSITIVE = (
    "masterpiece, best quality, very aesthetic, absurdres, "
    "1girl, full body, standing, from head to toe, "
    "visual novel character sprite, tachi-e, transparent background, "
    "simple background, white background, soft lighting, detailed eyes"
)

BASE_NEGATIVE = (
    "lowres, worst quality, low quality, normal quality, bad anatomy, bad hands, "
    "extra fingers, fewer fingers, extra limbs, missing limbs, fused fingers, "
    "jpeg artifacts, signature, watermark, username, artist name, text, logo, "
    "multiple girls, multiple views, cropped, out of frame, close-up, portrait, "
    "head out of frame, feet out of frame, nsfw"
)


def log(msg):
    print(msg, flush=True)


# ---------------------------------------------------------------- 抠图
_rmbg = None


def _load_rmbg(device):
    """RMBG-1.4：纯 PyTorch 的抠图模型，比 rembg 少一个 onnxruntime 依赖。"""
    global _rmbg
    if _rmbg is None:
        from transformers import AutoModelForImageSegmentation
        log("    首次运行需要下载抠图模型 RMBG-1.4（约 176 MB）...")
        m = AutoModelForImageSegmentation.from_pretrained(
            "briaai/RMBG-1.4", trust_remote_code=True
        )
        m.eval()
        _rmbg = m
    return _rmbg.to(device)


def cutout_rmbg(img, device):
    import torch
    from torchvision import transforms

    model = _load_rmbg(device)
    tf = transforms.Compose([
        transforms.Resize((1024, 1024)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    inp = tf(img.convert("RGB")).unsqueeze(0).to(device)
    with torch.no_grad():
        res = model(inp)[-1].sigmoid().cpu()
    mask = transforms.ToPILImage()(res[0].squeeze()).resize(img.size, resample=1)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def cutout_simple(img):
    """兜底方案：把接近白色的像素变透明。"""
    import numpy as np
    from PIL import Image

    arr = np.array(img.convert("RGB")).astype(np.int16)
    dist = 255 - arr.min(axis=2)          # 距离纯白多远
    alpha = np.clip(dist * 12, 0, 255).astype("uint8")
    out = img.convert("RGBA")
    out.putalpha(Image.fromarray(alpha))
    return out


def cutout(img, device, method):
    if method == "none":
        return img
    if method in ("auto", "rmbg"):
        try:
            return cutout_rmbg(img, device)
        except Exception as e:
            log(f"    [警告] RMBG 抠图失败（{type(e).__name__}: {e}），改用简易抠图")
    return cutout_simple(img)


# ---------------------------------------------------------------- 主流程
def load_pipeline(cfg, device):
    import torch
    from diffusers import (
        StableDiffusionPipeline,
        StableDiffusionXLPipeline,
        DPMSolverMultistepScheduler,
    )

    dtype = torch.float16 if device == "cuda" else torch.float32
    log(f"  加载模型 {cfg['repo']}（首次运行要下载，请耐心等）...")

    Cls = StableDiffusionXLPipeline if cfg["arch"] == "sdxl" else StableDiffusionPipeline
    kwargs = dict(torch_dtype=dtype, use_safetensors=True)
    if cfg["arch"] == "sd15":
        kwargs["safety_checker"] = None

    try:
        pipe = Cls.from_pretrained(cfg["repo"], **kwargs)
    except Exception as e:
        log(f"  [提示] 直接加载失败（{e}），改用单文件 safetensors ...")
        from huggingface_hub import hf_hub_download
        from diffusers import StableDiffusionPipeline as SDP

        # 常见的单文件权重名
        names = [
            "Counterfeit-V3.0_fp16.safetensors",
            "Counterfeit-V3.0.safetensors",
            "MeinaMix_V11.safetensors",
            "model.safetensors",
        ]
        path = None
        for n in names:
            try:
                path = hf_hub_download(cfg["repo"], n)
                break
            except Exception:
                continue
        if not path:
            raise
        pipe = SDP.from_single_file(path, torch_dtype=dtype, safety_checker=None)

    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
    pipe.set_progress_bar_config(disable=True)

    if device == "cuda":
        pipe = pipe.to("cuda")
        try:
            pipe.enable_vae_slicing()
            pipe.enable_attention_slicing()
        except Exception:
            pass

    return pipe


def generate(cfg, pipe, device, args):
    import torch

    w, h = cfg["size"]
    if args.width and args.height:
        w, h = args.width, args.height

    if args.model == "animagine":
        quality = "masterpiece, best quality, very aesthetic, absurdres"
        prompt_base = f"{quality}, 1girl, full body, standing, visual novel character sprite, tachi-e, simple background, white background, soft lighting"
        neg = BASE_NEGATIVE
    else:
        prompt_base = BASE_POSITIVE
        neg = BASE_NEGATIVE

    only = args.only.split(",") if args.only else None
    made = []

    for c in CHARACTERS:
        if only and c["id"] not in only:
            continue

        log(f"\n▶ {c['name']}  ({c['id']})")
        for i in range(args.n):
            seed = c["seed"] + i
            prompt = f"{prompt_base}, {c['tags']}"
            gen = torch.Generator("cuda" if device == "cuda" else "cpu").manual_seed(seed)

            t0 = time.time()
            img = pipe(
                prompt=prompt,
                negative_prompt=neg,
                width=w,
                height=h,
                num_inference_steps=args.steps or cfg["steps"],
                guidance_scale=args.cfg or cfg["cfg"],
                generator=gen,
            ).images[0]
            dt = time.time() - t0

            img = cutout(img, device, args.cutout)

            suffix = "" if args.n == 1 else f"_{i + 1:02d}"
            path = OUT / f"{c['id']}{suffix}.png"
            img.save(path)
            made.append(path.name)
            log(f"    ✓ {path.name}  ({w}x{h}, seed {seed}, {dt:.1f}s)")

            if i == 0 and args.n > 1:
                # 第一张同时存一份不带后缀的名字，方便直接引用
                img.save(OUT / f"{c['id']}.png")

    return made


def patch_site(ids):
    """把 image 字段写进 script.js 的 CHARS 里。"""
    path = ROOT / "script.js"
    src = path.read_text(encoding="utf-8")
    changed = []

    for cid in ids:
        marker = f'id: "{cid}",'
        if marker not in src:
            continue
        idx = src.index(marker)
        seg = src[idx: idx + 400]
        if re.search(r'\bimage:\s*"', seg):
            continue
        insert_at = idx + len(marker)
        src = src[:insert_at] + f'\n        image: "images/{cid}.png",' + src[insert_at:]
        changed.append(cid)

    if changed:
        path.write_text(src, encoding="utf-8")
        log(f"\n已更新 script.js，接入立绘：{', '.join(changed)}")
    else:
        log("\nscript.js 无需改动（已接入或找不到对应角色）。")


def main():
    ap = argparse.ArgumentParser(description="生成动漫立绘并接入网站")
    ap.add_argument("--model", default="counterfeit", choices=list(MODELS))
    ap.add_argument("--n", type=int, default=1, help="每个角色生成几张备选")
    ap.add_argument("--only", default=None, help="只生成指定角色，逗号分隔，如 mio,yuki")
    ap.add_argument("--steps", type=int, default=None)
    ap.add_argument("--cfg", type=float, default=None)
    ap.add_argument("--width", type=int, default=None)
    ap.add_argument("--height", type=int, default=None)
    ap.add_argument("--cutout", default="auto", choices=["auto", "rmbg", "simple", "none"])
    ap.add_argument("--no-cutout", action="store_true", help="不抠图（保留白底）")
    ap.add_argument("--patch", action="store_true", help="自动写入 script.js")
    args = ap.parse_args()

    if args.no_cutout:
        args.cutout = "none"

    try:
        import torch
    except ImportError:
        sys.exit("请先运行 tools\\setup.ps1 安装环境。")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    cfg = MODELS[args.model]

    OUT.mkdir(exist_ok=True)

    log("=" * 56)
    log("  🌸 动漫立绘生成器")
    log("=" * 56)
    log(f"  模型    : {args.model}  ({cfg['repo']})")
    log(f"  设备    : {device.upper()}" + (f"  ({torch.cuda.get_device_name(0)})" if device == "cuda" else "  ← 会非常慢"))
    log(f"  尺寸    : {args.width or cfg['size'][0]} x {args.height or cfg['size'][1]}")
    log(f"  备选数  : {args.n} 张/角色")
    log(f"  抠图    : {args.cutout}")
    log(f"  输出到  : {OUT}")
    log("=" * 56)

    pipe = load_pipeline(cfg, device)
    made = generate(cfg, pipe, device, args)

    log("\n" + "=" * 56)
    log(f" 完成！共生成 {len(made)} 张，文件在 images/ 下。")
    ids = sorted({m.split("_")[0].replace(".png", "") for m in made})
    if args.patch:
        patch_site(ids)
    else:
        log(" 加上 --patch 参数可自动写入 script.js，或手动加一行 image 字段。")
    log("=" * 56)


if __name__ == "__main__":
    main()
