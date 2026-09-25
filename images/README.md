# images/

网站用到的立绘图片。

## 当前文件

| 文件 | 对应角色 | 说明 |
|---|---|---|
| `yukino.webp` | 雪乃（高冷学姐） | 680×858，透明背景，282 KB |
| `_originals/` | — | 原图备份，**已在 `.gitignore` 里，不会发布** |

## 三种立绘来源

1. **图片**（推荐）—— 角色配置里带 `image` 字段，直接读取这里的文件
2. **SVG** —— 配置里没有 `image` 时，用 `script.js` 里的参数化 SVG 绘制
   （当前「美绪」「光」用的是这个）
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

## 如果图片是白底的

用仓库里的工具一键抠成透明：

```powershell
.\.venv\Scripts\python.exe tools\make_transparent.py --trim
```

## 压缩建议

PNG 立绘动辄 1~3 MB，转成 **WebP** 能压到 1/8 还看不出差别：

```python
from PIL import Image
Image.open("images/新图.png").save("images/新图.webp", "WEBP", quality=92, method=6)
```

> ⚠️ 请使用你有权使用的图片。商业游戏的官方素材受版权保护，不适合直接放在公开网站上。
