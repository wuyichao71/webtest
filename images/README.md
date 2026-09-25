# images/

网站用到的立绘图片。

## 当前文件

| 文件 | 对应角色 | 说明 |
|---|---|---|
| `mio.webp` | 美绪（青梅竹马·巫女） | 969×900，半身，透明背景，330 KB |
| `yukino.webp` | 雪乃（高冷学姐） | 968×900，半身，透明背景，369 KB |
| `_originals/` | — | 原图备份，**已在 `.gitignore` 里，不会发布** |

两张图的处理方式：

- **不横向裁切** —— 左右完整保留，头发一点没切
- **只纵向裁切** —— 从底部裁到半身（头 → 胯），保留头部和完整上身
- **等比缩放** —— 绝不拉伸变形

## 三种立绘来源

1. **图片**（推荐）—— 角色配置里带 `image` 字段，直接读取这里的文件
2. **SVG** —— 配置里没有 `image` 时，用 `script.js` 里的参数化 SVG 绘制
   （当前只剩「光」一个用这个）
3. **在线画廊** —— `#gallery` 区域从 nekos.best 实时拉取，不占仓库体积

## 换成自己的图片

把 PNG（透明背景最好）放进 `images/`，然后在 `script.js` 的 `CHARS` 里加一行：

```js
{
  id: "yukino",
  name: "雪乃",
  title: "高冷学姐",
  image: "images/yukino.webp",   // ← 加这一行，就会用图片代替 SVG 立绘
  ...
}
```

或者直接跑工具自动接入：

```powershell
.\.venv\Scripts\python.exe tools\use_images.py
```

## 如果图片是白底的

用仓库里的工具一键抠成透明：

```powershell
.\.venv\Scripts\python.exe tools\make_transparent.py --trim
```

## 裁成半身 + 压缩

```python
from PIL import Image

im = Image.open("images/_originals/新图.png").convert("RGBA")
top = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()[1]
bottom = int((im.height - top) * 0.62) + top      # 0.62 = 半身
c = im.crop((0, top, im.width, bottom))           # 横向不裁，只裁纵向
c = c.resize((round(c.width * 900 / c.height), 900), Image.LANCZOS)  # 等比
c.save("images/新图.webp", "WEBP", quality=92, method=6)
```

> ⚠️ 请使用你有权使用的图片。商业游戏的官方素材受版权保护，不适合直接放在公开网站上。
