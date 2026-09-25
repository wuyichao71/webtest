# 个人网站 · Sakura Edition 🌸

一个**日式动漫风**的零依赖个人主页：樱花飘落、漫画集中线、视觉小说对话框、原创角色立绘 galgame 场景、RPG 状态窗口、动漫画廊。

> 🌐 **在线访问**：https://wuyichao71.github.io/webtest/
>
> 部署方式：推送到 `main` 分支后，GitHub Actions 自动发布到 Pages
> （配置见 `.github/workflows/deploy-pages.yml`）。

## 文件结构

```
website/
├── index.html   # 页面结构与内容
├── styles.css   # 样式（昼/夜双主题 + 动画 + 立绘场景）
├── script.js    # 交互（樱花、台词、立绘生成、主题、动画）
├── images/      # 放你自己的立绘图片（可选）
└── README.md
```

## 本地预览

双击 `index.html` 即可，或启动本地服务器：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 动漫风特色

| 元素 | 说明 |
| --- | --- |
| 🌸 樱花飘落 | `<canvas>` 绘制花瓣，自动跟随主题变色 |
| ⚡ 集中线 | 漫画放射速度线，缓慢旋转 |
| 💬 视觉小说对话框 | Hero 区台词打字机效果，点击切换 |
| 🎀 原创立绘 + galgame 场景 | 3 名原创角色（SVG 手绘），点角色切换说话人，选项分支 |
| 🖼️ 动漫画廊 | 从 nekos.best 拉取真实动漫插画，带作者署名，支持分类切换 |
| 🎮 RPG 状态窗口 | 等级、HP/MP/EXP、职业面板 |
| 📖 章节式经历 | 「第1話 / 第2話」分集讲述 |
| 💥 漫画拟声词 | ドキドキ / ゴゴゴ / キラキラ 描边大字背景 |
| ✨ 点击星星 | 点击页面任意处迸出星星与光环 |
| 🌙 昼/夜主题 | 夜模式切换为星空 + 发光花瓣 |

## 立绘场景怎么用

**想换成自己的图片立绘**，把 PNG（建议透明背景、约 600×900）放进 `images/`，
然后在 `script.js` 的 `CHARS` 数组里给角色加上 `image` 字段：

```js
{
  id: "hikari",
  name: "ひかり",
  title: "本作の主人公",
  image: "images/hikari.png",   // ← 加了就会用图片代替 SVG 立绘
  lines: [ "...", "...", "..." ],
  reply: "「...」"
}
```

改台词就改 `lines` / `reply`，改选项就改 `CHOICES` 数组，
加角色就往 `CHARS` 里再 push 一个对象。

> ⚠️ 《千恋万花》等商业游戏的官方素材受版权保护，请勿直接上传到公开网站。
> 本项目里的立绘是**原创绘制的 SVG**，可自由修改与商业使用。

## 如何改成你自己的信息

在 `index.html` 中搜索替换：

| 需要修改 | 搜索关键词 |
| --- | --- |
| 姓名 | `田中ひかり` / `HIKARI` |
| 邮箱 | `hello@example.com` |
| 社交链接 | `https://github.com/`、`https://twitter.com/`、`https://www.pixiv.net/` |
| 自我介绍气泡 | `.bubble` 内的文字 |
| 经历章节 | `第1話`、`第2話`、`第0話` |
| 技能 / 作品 | 对应 section 内的文字 |
| 立绘角色 / 台词 / 选项 | `script.js` 里的 `CHARS` 和 `CHOICES`（并参考 `script.js` 顶部注释） |
| Hero 台词 | `script.js` 里的 `lines` 数组 |

配色在 `styles.css` 顶部修改：

```css
:root {
  --primary: #ff6fa5;   /* 樱粉 */
  --primary-2: #b794f6; /* 薰衣草紫 */
  --accent: #5fd0ee;    /* 天空蓝 */
  --accent-2: #ffc36b;  /* 夕阳橙 */
}
```

## 功能

- 深色 / 浅色主题切换，记忆用户选择，默认跟随系统
- 樱花飘落画布（移动端自动减少数量）
- 视觉小说台词打字机 + 点击推进
- 滚动淡入、数字滚动、技能条动画
- 移动端汉堡菜单、导航高亮当前区块
- 一键复制邮箱、回到顶部、Toast 提示
- 响应式布局 + `prefers-reduced-motion` 无障碍适配

## 局域网发布（手机 / 平板 / 其他电脑都能看）

### 最简单：双击 `serve.bat`

双击后会输出类似：

```
====================================================
  🌸  个人网站 · 局域网发布中
====================================================
  本机访问 :  http://127.0.0.1:8000
  局域网   :  http://192.168.31.245:8000  ← 手机用这个
====================================================
```

手机连上**同一个 Wi-Fi**，浏览器打开那个「局域网」地址就行。
停止服务按 `Ctrl + C`。

### 命令行方式

```bash
python serve.py          # 默认 8000
python serve.py 8080     # 换端口
```

### 如果手机打不开

1. **放行防火墙**（最常见原因）
   右键 `allow-firewall.bat` → 「以管理员身份运行」。
   或手动执行（管理员 CMD）：
   ```cmd
   netsh advfirewall firewall add rule name="PersonalSite-8000" dir=in action=allow protocol=TCP localport=8000
   ```
2. **确认是同一网络**：手机和电脑要连同一个 Wi-Fi / 同一路由器。
3. **确认 IP 正确**：电脑可能有多张网卡（VPN、虚拟机）。以 `serve.py`
   输出里标了「← 手机用这个」的那个为准（一般是 `192.168.x.x`）。
4. **路由器开了 AP 隔离**（访客 Wi-Fi 常见）：换成手机热点让电脑连，
   反过来也一样能访问。

### 用 Node 代替 Python

```bash
npx --yes serve -l tcp://0.0.0.0:8000 .
```

### 注意

- 局域网地址只在**内网**有效，外网（比如发给外地朋友）访问不了。
  想暴露到公网可以用 Cloudflare Tunnel / ngrok / Tailscale Funnel。
- 画廊需要设备能上外网（要请求 `nekos.best`）；
  断网时会自动退回到渐变占位卡，不影响页面其他部分。

## 部署到公网（可选）

纯静态文件，可直接部署到 GitHub Pages、Vercel、Netlify、Cloudflare Pages 等。
`serve.py` / `serve.bat` / `allow-firewall.bat` 不需要上传。
