# tools/ —— 给网站加「图片立绘」

## 为什么不能让我（AI 助手）直接画

我现在用的是 **deepseek-flash，纯文本模型**，输出的是文字 token，没有产生像素的能力。
换任何 LLM（GPT-4o、Gemini）都一样——它们能*看懂*图，但不能*画出*图。
**画图必须靠专门的绘画模型**（Stable Diffusion / 即梦 / NovelAI / 通义万相等）。

所以流程是：**你去绘画平台出图 → 放进 `images/` → 跑一个脚本接入网站**。

---

## 三步搞定

### 第 1 步：去平台生成 3 张立绘

推荐（都有免费额度，国内直连）：

| 平台 | 网址 | 特点 |
|---|---|---|
| **即梦 AI** | jimeng.jianying.com | 出图快，二次元效果好，每天免费积分 |
| **LiblibAI** | www.liblib.art | 大量动漫模型可挑，免费额度 |
| **吐司 TusiArt** | tusiart.com | 模型多，社区活跃 |
| **通义万相** | tongyi.aliyun.com/wanxiang | 阿里出品，稳定 |
| **NovelAI** | novelai.net | 二次元最强，但要付费订阅 |
| **Bing 图像创建器** | bing.com/create | 免费，偏欧美风 |

生成参数建议：
- **尺寸**：竖图 `512x768` / `768x1152` / `832x1216`
- **背景**：写「纯白背景 / simple white background」，方便后面抠图
- **全身**：一定要包含「全身立绘 / full body」关键词

> ⚠️ 《千恋万花》等商业游戏的官方素材有版权，别直接拿来用。用 AI 生成的原创角色最安全。

### 第 2 步：存进 `images/`，文件名叫这些

```
images/mio.png        <- 美绪（青梅竹马）
images/hikari.png     <- 光（本作主角）
images/yuki.png       <- 雪（高冷学姐）
```

支持 `png / jpg / jpeg / webp`。带编号也行（`mio_01.png`）。

### 第 3 步：跑两个命令

```powershell
# ① 白底 -> 透明背景（否则立绘会带一个白方块）
.\.venv\Scripts\python.exe tools\make_transparent.py --trim

# ② 自动接入 script.js
.\.venv\Scripts\python.exe tools\use_images.py
```

刷新浏览器（`Ctrl + F5`）就能看到图片立绘了。

> 只需要 Pillow，已装好。**不需要 GPU、不需要 torch、不需要下载任何模型。**

---

## 现成的提示词（直接复制）

### 🍊 美绪 · 青梅竹马（巫女）

**中文（即梦 / 通义万相 / LiblibAI 用）：**
```
二次元动漫风格，全身立绘，一名橙色长发双马尾少女，琥珀色大眼睛，
穿白色巫女服上衣和红色袴裙，头发系红色蝴蝶结，张嘴开心地笑，
双手背在身后，视觉小说角色立绘，纯白背景，柔和光效，
高质量，精细的眼睛，构图完整不裁切

反向词：低质量，畸形，多余手指，多只手，水印，文字，签名，多个女孩，裁切，特写
```

**英文标签（NovelAI / Stable Diffusion 用）：**
```
1girl, solo, orange hair, long hair, twintails, amber eyes, shrine maiden,
white haori, red hakama, hair ribbon, open mouth, happy, smile,
arms behind back, full body, standing, visual novel character sprite,
tachi-e, simple background, white background, masterpiece, best quality

Negative: lowres, bad anatomy, bad hands, extra fingers, extra limbs,
jpeg artifacts, signature, watermark, text, multiple girls, cropped, close-up, nsfw
```

### 🌸 光 · 本作主角（浴衣）

**中文：**
```
二次元动漫风格，全身立绘，一名粉色长发少女，紫色眼睛，
穿带樱花图案的浴衣，头上戴樱花发饰，温柔地微笑，脸颊微红，
双手交叠在身前，视觉小说角色立绘，纯白背景，柔和光效，高质量

反向词：低质量，畸形，多余手指，水印，文字，签名，多个女孩，裁切
```

**英文标签：**
```
1girl, solo, pink hair, long hair, purple eyes, yukata, floral print,
cherry blossom hair ornament, gentle smile, blush, hands together,
full body, standing, visual novel character sprite, tachi-e,
simple background, white background, masterpiece, best quality

Negative: lowres, bad anatomy, bad hands, extra fingers, extra limbs,
jpeg artifacts, signature, watermark, text, multiple girls, cropped, close-up, nsfw
```

### ❄️ 雪 · 高冷学姐（和服）

**中文：**
```
二次元动漫风格，全身立绘，一名黑色超长发少女，冰蓝色眼睛，
穿深色和服，头戴精致发簪，面无表情气质清冷，双臂抱胸，
视觉小说角色立绘，纯白背景，柔和光效，高质量

反向词：低质量，畸形，多余手指，水印，文字，签名，多个女孩，裁切
```

**英文标签：**
```
1girl, solo, black hair, very long hair, blue eyes, kimono,
kanzashi hair ornament, expressionless, calm, arms crossed,
full body, standing, visual novel character sprite, tachi-e,
simple background, white background, masterpiece, best quality

Negative: lowres, bad anatomy, bad hands, extra fingers, extra limbs,
jpeg artifacts, signature, watermark, text, multiple girls, cropped, close-up, nsfw
```

---

## 想换角色 / 加角色

- **换人设**：直接用上面的模板改颜色、发型、服装关键词
- **加第 4 个角色**：先在 `script.js` 的 `CHARS` 里加一个对象（`id: "新id"`），
  再把图片存成 `images/新id.png`，跑一次 `use_images.py` 就自动接上了

---

## 工具参数速查

### make_transparent.py

| 参数 | 说明 |
|---|---|
| `--trim` | 裁掉四周空白（推荐） |
| `--thresh 50` | 背景色容差，渐变背景调大到 50~80 |
| `--erode 2` | 边缘白色描边残留时调大 |
| `--feather 2` | 边缘更柔和 |
| `--overwrite` | 覆盖原文件 |

### use_images.py

| 参数 | 说明 |
|---|---|
| `--list` | 只列出找到的图，不修改文件 |
| `--only mio` | 只接入指定角色 |

---

## （可选）本地 GPU 生成

如果你以后想批量出图，`tools/setup.ps1` + `tools/generate_sprites.py`
能用你的 RTX 4060 Ti 本地跑 Stable Diffusion。
但需要下载约 5 GB，**日常用在线平台就够了**。
