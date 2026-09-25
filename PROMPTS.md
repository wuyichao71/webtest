# 立绘生成 Prompt 记录

> 记录每个角色立绘所用的**生成提示词**与**后处理流程**，
> 方便以后复用、微调、重出图，或者补齐还没换成真图的角色。
>
> 后处理脚本都在 `tools/` 里，一键即可复现。

---

## 📋 目录

| # | 角色 | 立绘文件 | 来源原图 | 状态 |
|---|---|---|---|---|
| 1 | 美绪 · 青梅竹马 | `images/mio.webp` | `_originals/girl_wunv.png` | ✅ 已换成真图 |
| 2 | 雪乃 · 高冷学姐 | `images/yukino.webp` | `_originals/girl_2.png` | ✅ 已换成真图 |
| 3 | 光 · 本作主角 | — | — | ⬜ 仍是 SVG，待生成 |

---

## 1. 美绪 · 青梅竹马（巫女）

**立绘**：`images/mio.webp` ｜ **原图**：`images/_originals/girl_wunv.png`

**正向 Prompt（中文，用于 即梦 / 通义万相 / LiblibAI）**
```
二次元动漫风格，半身立绘，一名黑长直超长发的少女，紫色眼睛，
穿着白色巫女服上衣（白衣）配红色袴裙，头戴红色蝴蝶结发饰与流苏，
手中握着一柄御币（神道杖，带白色纸垂与红绳），温柔地微笑，
纯白背景，柔和光效，高质量，精细的眼睛，构图完整不裁切
```

**正向 Prompt（英文 danbooru 标签，用于 NovelAI / Stable Diffusion）**
```
masterpiece, best quality, very aesthetic, absurdres,
1girl, solo, very long black hair, straight hair, purple eyes,
shrine maiden, white haori, red hakama, red hair ribbon, tassels,
holding gohei, divine wand, gentle smile, blush,
half body, upper body, visual novel character sprite, tachi-e,
simple background, white background, soft lighting, detailed eyes
```

**反向 Prompt**
```
lowres, worst quality, low quality, bad anatomy, bad hands,
extra fingers, fewer fingers, extra limbs, missing limbs, fused fingers,
jpeg artifacts, signature, watermark, username, text, logo,
multiple girls, multiple views, cropped, out of frame, close-up, nsfw
```

---

## 2. 雪乃 · 高冷学姐

**立绘**：`images/yukino.webp` ｜ **原图**：`images/_originals/girl_2.png`

**正向 Prompt（中文）**
```
二次元动漫风格，半身立绘，一名银色超长发的少女，冰蓝色眼睛，
穿着白与深蓝相间的华丽幻想礼裙，裙身有金色刺绣、宝石与花朵装饰，
蓝色缎带与花朵发饰，甜美地微笑，纯白背景，柔和光效，
高质量，精细的眼睛，构图完整不裁切
```

**正向 Prompt（英文 danbooru 标签）**
```
masterpiece, best quality, very aesthetic, absurdres,
1girl, solo, silver hair, very long hair, blue eyes,
white and navy blue fantasy dress, gold embroidery, gem ornament,
blue ribbon, flower hair ornament, frills, sweet smile, blush,
half body, upper body, visual novel character sprite, tachi-e,
simple background, white background, soft lighting, detailed eyes
```

**反向 Prompt**
```
lowres, worst quality, low quality, bad anatomy, bad hands,
extra fingers, fewer fingers, extra limbs, missing limbs, fused fingers,
jpeg artifacts, signature, watermark, username, text, logo,
multiple girls, multiple views, cropped, out of frame, close-up, nsfw
```

---

## 3. 光 · 本作主角（待生成）

**立绘**：⬜ 还没有，当前用 SVG

**正向 Prompt（中文）**
```
二次元动漫风格，半身立绘，一名粉色长发的少女，紫色眼睛，
穿着带樱花图案的浴衣，头上戴着樱花发饰，温柔地微笑，脸颊微红，
双手交叠在身前，纯白背景，柔和光效，高质量，精细的眼睛
```

**正向 Prompt（英文 danbooru 标签）**
```
masterpiece, best quality,
1girl, solo, pink hair, long hair, purple eyes,
yukata, floral print, cherry blossom hair ornament,
gentle smile, blush, hands together,
half body, upper body, visual novel character sprite, tachi-e,
simple background, white background, soft lighting
```

---

## ⚙️ 通用建议参数

| 项目 | 建议值 |
|---|---|
| 尺寸 | `1024 × 1536`（竖构图，3:2） |
| 采样步数 | 28 ~ 30 |
| CFG Scale | 7.0 ~ 7.5 |
| 采样器 | DPM++ 2M Karras |
| 背景 | 一定要写「纯白背景 / simple white background」 |
| 构图 | 一定要写「半身立绘 / half body」，否则会出全身或大头 |
| 随机种子 | 固定 seed 可以让同一角色多张图风格一致 |

---

## 🖼️ 生成后的处理流程

拿到图之后按这三步走，尺寸和构图就能和其它立绘保持一致：

### ① 白底 → 透明背景（如果是白底图）

```powershell
.\.venv\Scripts\python.exe tools\make_transparent.py --trim
```

### ② 裁成半身 + 压缩（本仓库统一标准）

- **不横向裁切** —— 左右完整保留，头发一点不切
- **只纵向裁切** —— 从底部裁到半身（头 → 胯），保留 `62%`
- **等比缩放** —— 绝不拉伸变形
- 输出 **WebP quality 92**，高度统一 `900px`

```python
from PIL import Image

im = Image.open("images/_originals/新图.png").convert("RGBA")

# 只纵向裁掉透明边
top = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()[1]
bottom = int((im.height - top) * 0.62) + top      # 0.62 = 半身
c = im.crop((0, top, im.width, bottom))           # 横向 0~width 完整不动

# 等比缩放到高度 900
c = c.resize((round(c.width * 900 / c.height), 900), Image.LANCZOS)
c.save("images/新图.webp", "WEBP", quality=92, method=6)
```

### ③ 接入网站

把处理好的文件放进 `images/`，然后：

```powershell
.\.venv\Scripts\python.exe tools\use_images.py
```

工具会自动往 `script.js` 的 `CHARS` 里写 `image: "images/xxx.webp"`。

---

## 📝 新增角色模板

复制下面这段，填好后追加到本文件：

```markdown
## N. 角色名 · 称号

**立绘**：`images/xxx.webp` ｜ **原图**：`images/_originals/xxx.png`

**正向 Prompt（中文）**
```
（中文提示词）
```

**正向 Prompt（英文 danbooru 标签）**
```
（英文标签）
```

**反向 Prompt**
```
（反向词）
```

**参数**：1024x1536 ｜ steps 30 ｜ CFG 7.5 ｜ seed ________
```

---

## ⚠️ 版权提醒

以上 Prompt 生成的都是**原创角色**。请勿用它们去复刻《千恋万花》等商业游戏的
官方角色或立绘——那属于受版权保护的素材，不适合放在公开网站上。
