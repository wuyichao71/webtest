/* ============================================================
   日式动漫风个人网站 —— 交互脚本
   樱花飘落 / 视觉小说台词 / 主题切换 / 滚动动画
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= 主题切换 ================= */
  var root = document.documentElement;
  var themeToggle = document.getElementById("themeToggle");
  var THEME_KEY = "site-theme";

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    document.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }

  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
  })();

  themeToggle && themeToggle.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    showToast(next === "dark" ? "进入夜晚模式 🌙 おやすみ" : "进入白天模式 ☀️ おはよう");
  });

  /* ================= 樱花飘落 ================= */
  (function petals() {
    var canvas = document.getElementById("petals");
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var flowers = [];
    var THEMES = {
      light: ["#ffc2d6", "#ffa8c8", "#ffd9e6", "#f7b7e2", "#ffb3c9"],
      dark:  ["#ff9fc4", "#e0b3ff", "#ffc9de", "#bcd7ff", "#ffb3d1"]
    };

    function makePetal(initial) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -20,
        size: 7 + Math.random() * 9,
        speed: 0.5 + Math.random() * 1.1,
        drift: (Math.random() - 0.5) * 0.9,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.03,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.008 + Math.random() * 0.016,
        alpha: 0.55 + Math.random() * 0.45,
        color: petalColor()
      };
    }

    function reset() {
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = window.innerWidth < 760 ? 12 : 26;
      flowers = [];
      for (var i = 0; i < count; i++) flowers.push(makePetal(true));
    }

    function petalColor() {
      var theme = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var arr = THEMES[theme];
      return arr[(Math.random() * arr.length) | 0];
    }

    function drawPetal(f) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      // 樱花花瓣：两段贝塞尔组成的爱心花瓣形状
      ctx.moveTo(0, -f.size * 0.5);
      ctx.bezierCurveTo(f.size * 0.75, -f.size * 0.85, f.size * 0.95, f.size * 0.35, 0, f.size * 0.6);
      ctx.bezierCurveTo(-f.size * 0.95, f.size * 0.35, -f.size * 0.75, -f.size * 0.85, 0, -f.size * 0.5);
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      var theme = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      ctx.globalCompositeOperation = theme === "dark" ? "lighter" : "source-over";

      for (var i = 0; i < flowers.length; i++) {
        var f = flowers[i];
        f.sway += f.swaySpeed;
        f.y += f.speed;
        f.x += f.drift + Math.sin(f.sway) * 0.8;
        f.angle += f.spin;

        if (f.y > window.innerHeight + 30) flowers[i] = makePetal(false);
        if (f.x < -40) f.x = window.innerWidth + 30;
        if (f.x > window.innerWidth + 40) f.x = -30;

        drawPetal(f);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }

    // 颜色跟随主题：给每片花瓣换色
    document.addEventListener("themechange", function () {
      flowers.forEach(function (f) { f.color = petalColor(); });
    });

    window.addEventListener("resize", reset);
    reset();
    requestAnimationFrame(frame);
  })();

  /* ================= 视觉小说台词 ================= */
  (function dialogue() {
    var box = document.getElementById("dialogue");
    var nameEl = document.getElementById("dialogueName");
    var textEl = document.getElementById("dialogueText");
    if (!box || !textEl) return;

    var lines = [
      "欢迎来到我的个人网站！我是田中光，一名全栈开发者，也是个重度二次元爱好者 🌸",
      "我喜欢把复杂的想法，做成像动画分镜一样流畅的产品。",
      "写代码的时候，我追求的是那种「啊，就是这个！」的手感。",
      "要不要去看看我的作品集？说不定会有惊喜哦～",
      "如果喜欢的话，记得发邮件找我聊聊！我回信很快的 ✧"
    ];

    var index = -1;
    var charIndex = 0;
    var typing = false;
    var timer = null;

    function typeLine(text) {
      typing = true;
      charIndex = 0;
      textEl.textContent = "";
      box.classList.remove("is-done");

      (function tick() {
        if (charIndex >= text.length) {
          typing = false;
          box.classList.add("is-done");
          return;
        }
        textEl.textContent += text.charAt(charIndex++);
        timer = setTimeout(tick, 32 + Math.random() * 45);
      })();
    }

    function next() {
      clearTimeout(timer);
      if (typing) {
        // 正在打字 -> 直接显示完整句子
        var full = lines[index];
        textEl.textContent = full;
        typing = false;
        box.classList.add("is-done");
        return;
      }
      index = (index + 1) % lines.length;
      typeLine(lines[index]);
    }

    box.addEventListener("click", next);
    box.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); }
    });

    if (reduceMotion) {
      textEl.textContent = lines[0];
      index = 0;
      box.classList.add("is-done");
    } else {
      setTimeout(next, 700);
    }
  })();

  /* ================= 导航滚动状态 ================= */
  var nav = document.getElementById("nav");
  var toTop = document.getElementById("toTop");

  function onScroll() {
    var y = window.scrollY;
    nav && nav.classList.toggle("is-scrolled", y > 12);
    toTop && toTop.classList.toggle("is-visible", y > 520);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop && toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ================= 移动端菜单 ================= */
  var burger = document.getElementById("burger");
  var navLinks = document.getElementById("navLinks");

  function closeMenu() {
    if (!navLinks) return;
    navLinks.classList.remove("is-open");
    burger && burger.classList.remove("is-open");
    burger && burger.setAttribute("aria-expanded", "false");
  }

  burger && burger.addEventListener("click", function () {
    var open = navLinks.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });

  navLinks && navLinks.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeMenu();
  });

  document.addEventListener("click", function (e) {
    if (!navLinks || !navLinks.classList.contains("is-open")) return;
    if (nav && nav.contains(e.target)) return;
    closeMenu();
  });

  /* ================= 滚动出现动画 ================= */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.transitionDelay = Math.min(i * 70, 350) + "ms";
        el.classList.add("is-visible");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ================= 数字滚动 ================= */
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1400;
    var start = performance.now();
    (function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ================= 技能进度条 ================= */
  var bars = document.querySelectorAll(".bar__fill");
  if ("IntersectionObserver" in window) {
    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.width = (el.getAttribute("data-width") || 0) + "%";
        bio.unobserve(el);
      });
    }, { threshold: 0.4 });
    bars.forEach(function (el) { bio.observe(el); });
  } else {
    bars.forEach(function (el) { el.style.width = (el.getAttribute("data-width") || 0) + "%"; });
  }

  /* ================= 导航高亮 ================= */
  var sections = document.querySelectorAll("section[id]");
  var linkMap = {};
  document.querySelectorAll(".nav__links a").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) === "#") linkMap[href.slice(1)] = a;
  });

  if ("IntersectionObserver" in window && sections.length) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkMap[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.keys(linkMap).forEach(function (k) { linkMap[k].classList.remove("is-active"); });
          link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { sio.observe(s); });
  }

  /* ================= Toast ================= */
  var toast = document.getElementById("toast");
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2200);
  }

  /* ================= 复制邮箱 ================= */
  var copyBtn = document.getElementById("copyEmail");
  copyBtn && copyBtn.addEventListener("click", function () {
    var email = copyBtn.getAttribute("data-email") || "";
    function done() { showToast("已复制 ✧ " + email); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = email;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { showToast("复制失败，请手动复制 (>_<)"); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(done).catch(fallback);
    } else {
      fallback();
    }
  });

  /* ================= 点击星星特效 ================= */
  (function clickFx() {
    var layer = document.getElementById("fx");
    if (!layer || reduceMotion) return;

    document.addEventListener("click", function (e) {
      var star = document.createElement("span");
      star.className = "fx__star";
      star.textContent = Math.random() > 0.5 ? "✧" : "✦";
      star.style.left = e.clientX + "px";
      star.style.top = e.clientY + "px";

      var ring = document.createElement("span");
      ring.className = "fx__ring";
      ring.style.left = e.clientX + "px";
      ring.style.top = e.clientY + "px";

      layer.appendChild(star);
      layer.appendChild(ring);
      setTimeout(function () {
        star.remove();
        ring.remove();
      }, 950);
    });
  })();

  /* ================= 视觉小说 · 立绘 ================= */
  (function visualNovel() {
    var stage = document.getElementById("vnChars");
    if (!stage) return;

    var INK = "#3b2b3a";

    /* ---- 角色设定（想换成自己的图片：加 image: "images/xxx.png" 即可） ---- */
    var CHARS = [
      {
        id: "mio",
        name: "美绪",
        title: "青梅竹马",
        style: "twin",
        bangs: "b",
        mouth: "open",
        hair: { main: "#e89552", light: "#ffcb92", shade: "#a5561f" },
        eye: ["#ffd166", "#ff9f43", "#5a2d10"],
        skin: ["#ffe9d9", "#ffd0bd"],
        outfit: { type: "miko", main: "#ffffff", sub: "#e8453c", obi: "#e8453c" },
        accessory: "ribbon",
        accent: "#ff5f8f",
        lines: [
          "小光，你又在做那个网站的页面啦？",
          "休息日就一起去泡个温泉嘛～！",
          "……不过，截稿日之前肯定又没戏了。"
        ],
        reply: "「嘿嘿，那下次你请客哦♪」"
      },
      {
        id: "hikari",
        name: "光",
        title: "本作主角",
        style: "long",
        bangs: "a",
        mouth: "smile",
        hair: { main: "#b06fa2", light: "#dda3cc", shade: "#6f4268" },
        eye: ["#63d0f5", "#6a5ad0", "#2a1d52"],
        skin: ["#ffeade", "#ffd5c3"],
        outfit: { type: "yukata", main: "#ffe1ec", sub: "#ff9ec4", obi: "#ffd166" },
        accessory: "flower",
        accent: "#ff8fb8",
        lines: [
          "欢迎来到我的个人网站，这里就是我的主页啦。",
          "不管是设计还是代码，全部都是我自己写的。",
          "如果你还满意的话，工作合作也随时来找我哦～！"
        ],
        reply: "「谢谢！好开心，记得常来玩呀♪」"
      },
      {
        id: "yukino",
        name: "雪乃",
        title: "高冷学姐",
        image: "images/yukino.webp",
        accent: "#8fb8ff",
        lines: [
          "欢迎来到小光的网站……请随意看看。",
          "听说这些页面，全部都是她一个人写出来的。",
          "……虽然不太想承认，但确实做得不错。"
        ],
        reply: "「……哼，我才没有在夸她呢。」"
      }
    ];

    var CHOICES = [
      { text: "好厉害啊！", target: 1 },
      { text: "好想去泡温泉…", target: 0 },
      { text: "……（默默点头）", target: 2 }
    ];

    /* ---- 发型路径 ---- */
    var BANGS = {
      a: "M70 132 C64 84 96 56 150 56 C204 56 236 84 230 132 C224 110 210 98 198 94 C196 112 186 122 172 126 C176 106 166 92 154 86 C144 102 128 114 112 120 C108 104 98 94 86 90 C80 104 74 120 70 132 Z",
      b: "M68 132 C62 86 96 54 150 54 C206 54 238 86 232 132 C224 112 208 98 194 94 C192 110 180 120 166 124 C168 104 158 90 146 84 C138 100 124 112 110 118 C104 102 94 92 84 88 C78 102 72 118 68 132 Z",
      c: "M72 132 C68 86 98 56 150 56 C202 56 232 86 228 132 C220 112 206 98 194 94 C190 112 178 122 164 126 C166 106 156 92 144 86 C136 102 122 114 108 120 C102 104 92 94 82 90 C78 104 74 120 72 132 Z"
    };

    var BACK_HAIR = "M150 42 C94 42 64 90 66 148 C67 194 54 250 40 312 C36 342 34 362 34 380 L266 380 C266 362 264 342 260 312 C246 250 233 194 234 148 C236 90 206 42 150 42 Z";

    function eye(cx, id) {
      return '<g class="vn-eye" style="transform-box:fill-box;transform-origin:center;">' +
        '<ellipse cx="' + cx + '" cy="136" rx="14" ry="18" fill="#2a1b3d"/>' +
        '<ellipse cx="' + cx + '" cy="137" rx="12.5" ry="16" fill="url(#ir-' + id + ')"/>' +
        '<ellipse cx="' + cx + '" cy="145" rx="10" ry="6.5" fill="#ffffff" opacity="0.5"/>' +
        '<circle cx="' + (cx - 5) + '" cy="128" r="5" fill="#ffffff"/>' +
        '<circle cx="' + (cx + 5) + '" cy="142" r="2.8" fill="#ffffff" opacity="0.9"/>' +
        '<path d="M' + (cx - 16) + ' 120 Q' + cx + ' 109 ' + (cx + 16) + ' 119" fill="none" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/>' +
        '</g>';
    }

    function accessory(c) {
      if (c.accessory === "flower") {
        var petals = [0, 72, 144, 216, 288].map(function (a) {
          return '<ellipse cx="0" cy="-13" rx="8" ry="12" fill="' + c.accent + '" transform="rotate(' + a + ')" opacity="0.95"/>';
        }).join("");
        return '<g transform="translate(228,88)">' + petals + '<circle r="4.5" fill="#ffe08a"/></g>';
      }
      if (c.accessory === "ribbon") {
        function bow(x, y, rot) {
          return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ')">' +
            '<path d="M0 0 L-20 -12 L-20 12 Z" fill="' + c.accent + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
            '<path d="M0 0 L20 -12 L20 12 Z" fill="' + c.accent + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
            '<circle r="6" fill="#ffd166" stroke="' + INK + '" stroke-width="2"/></g>';
        }
        return bow(72, 148, -18) + bow(228, 148, 18);
      }
      if (c.accessory === "kanzashi") {
        return '<g transform="translate(224,92) rotate(24)">' +
          '<rect x="-2" y="-14" width="4" height="28" rx="2" fill="' + c.accent + '"/>' +
          '<circle cx="0" cy="-16" r="7" fill="' + c.accent + '" stroke="' + INK + '" stroke-width="2"/>' +
          '<circle cx="10" cy="8" r="4" fill="#ffd166"/>' +
          '<circle cx="0" cy="16" r="4" fill="#ff9ec4"/>' +
          '<circle cx="-10" cy="8" r="4" fill="#b79ce8"/></g>';
      }
      return "";
    }

    function sprite(c) {
      var o = c.outfit;

      var neck = '<path d="M132 172 h36 v20 q0 12 -18 12 q-18 0 -18 -12 z" fill="' + c.skin[1] + '" stroke="' + INK + '" stroke-width="2.2"/>';

      var torso = '<path d="M150 194 C116 194 94 212 82 242 C68 276 60 322 56 380 L244 380 C240 322 232 276 218 242 C206 212 184 194 150 194 Z" fill="' + o.main + '" stroke="' + INK + '" stroke-width="2.8" stroke-linejoin="round"/>';

      var outfit;
      if (o.type === "miko") {
        outfit = torso +
          '<path d="M62 326 L238 326 L246 380 L54 380 Z" fill="' + o.sub + '" stroke="' + INK + '" stroke-width="2.8" stroke-linejoin="round"/>' +
          '<path d="M112 200 L150 272 L188 200 L177 195 L150 252 L123 195 Z" fill="#ffffff" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
          '<path d="M123 197 L150 250 M177 197 L150 250" stroke="' + o.sub + '" stroke-width="6" stroke-linecap="round" fill="none"/>' +
          '<g stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round">' +
          '<path d="M150 300 L130 289 L130 315 Z" fill="' + o.sub + '"/>' +
          '<path d="M150 300 L170 289 L170 315 Z" fill="' + o.sub + '"/>' +
          '<circle cx="150" cy="302" r="6.5" fill="#ffd166"/></g>';
      } else {
        outfit = torso +
          '<path d="M114 200 L150 272 L186 200 L175 195 L150 250 L125 195 Z" fill="#ffffff" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
          '<path d="M125 197 L150 246 M175 197 L150 246" stroke="' + o.sub + '" stroke-width="5.5" stroke-linecap="round" fill="none"/>' +
          '<rect x="70" y="318" width="160" height="28" rx="8" fill="' + o.obi + '" stroke="' + INK + '" stroke-width="2.8"/>' +
          '<path d="M110 332 h80" stroke="rgba(0,0,0,.16)" stroke-width="3" stroke-linecap="round"/>';
      }

      var tails = "";
      if (c.style === "twin") {
        tails =
          '<path d="M72 116 C26 146 16 232 26 306 C34 330 54 332 62 314 C46 252 52 178 78 148 Z" fill="url(#hb-' + c.id + ')" stroke="' + INK + '" stroke-width="2.8" stroke-linejoin="round"/>' +
          '<path d="M228 116 C274 146 284 232 274 306 C266 330 246 332 238 314 C254 252 248 178 222 148 Z" fill="url(#hb-' + c.id + ')" stroke="' + INK + '" stroke-width="2.8" stroke-linejoin="round"/>';
      }

      var mouth = c.mouth === "open"
        ? '<path d="M141 160 Q150 175 159 160 Z" fill="#d9637f" stroke="' + INK + '" stroke-width="2"/>'
        : '<path d="M141 161 Q150 169 159 161" fill="none" stroke="#b3546f" stroke-width="2.8" stroke-linecap="round"/>';

      return '<svg class="vn-sprite" viewBox="0 0 300 380" role="img" aria-label="' + c.name + ' 的立绘">' +
        '<defs>' +
        '<linearGradient id="hb-' + c.id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.hair.main + '"/><stop offset="1" stop-color="' + c.hair.shade + '"/></linearGradient>' +
        '<linearGradient id="hm-' + c.id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c.hair.shade + '"/><stop offset="0.55" stop-color="' + c.hair.main + '"/><stop offset="1" stop-color="' + c.hair.light + '"/></linearGradient>' +
        '<linearGradient id="sk-' + c.id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.skin[0] + '"/><stop offset="1" stop-color="' + c.skin[1] + '"/></linearGradient>' +
        '<linearGradient id="ir-' + c.id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.eye[0] + '"/><stop offset="0.55" stop-color="' + c.eye[1] + '"/><stop offset="1" stop-color="' + c.eye[2] + '"/></linearGradient>' +
        '<clipPath id="fc-' + c.id + '"><ellipse cx="150" cy="132" rx="46" ry="52"/></clipPath>' +
        '</defs>' +
        '<path d="' + BACK_HAIR + '" fill="url(#hb-' + c.id + ')" stroke="' + INK + '" stroke-width="2.8" stroke-linejoin="round"/>' +
        tails +
        neck +
        outfit +
        '<ellipse cx="150" cy="132" rx="46" ry="52" fill="url(#sk-' + c.id + ')" stroke="' + INK + '" stroke-width="2.8"/>' +
        '<g clip-path="url(#fc-' + c.id + ')" opacity="0.7"><ellipse cx="112" cy="152" rx="11" ry="6" fill="#ff8fb0"/><ellipse cx="188" cy="152" rx="11" ry="6" fill="#ff8fb0"/></g>' +
        eye(126, c.id) + eye(174, c.id) +
        '<path d="M110 106 Q126 100 140 105" fill="none" stroke="' + c.hair.shade + '" stroke-width="3.2" stroke-linecap="round"/>' +
        '<path d="M160 105 Q174 100 190 106" fill="none" stroke="' + c.hair.shade + '" stroke-width="3.2" stroke-linecap="round"/>' +
        mouth +
        '<path d="' + BANGS[c.bangs] + '" fill="url(#hm-' + c.id + ')" stroke="' + INK + '" stroke-width="2.8" stroke-linejoin="round"/>' +
        '<path d="M72 112 C56 148 58 210 72 258 C86 240 90 200 86 152 Z" fill="url(#hm-' + c.id + ')" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M228 112 C244 148 242 210 228 258 C214 240 210 200 214 152 Z" fill="url(#hm-' + c.id + ')" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M98 76 Q150 56 202 76" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.45" stroke-linecap="round"/>' +
        accessory(c) +
        '</svg>';
    }

    /* ---- DOM ---- */
    var els = {
      name: document.getElementById("vnName"),
      role: document.getElementById("vnRole"),
      text: document.getElementById("vnText"),
      box: document.getElementById("vnBox"),
      choices: document.getElementById("vnChoices"),
      ui: document.querySelector(".vn__ui")
    };

    var active = 1;
    var lineIdx = 0;
    var typing = false;
    var typeTimer = null;
    var curText = "";
    var choicesOpen = false;

    CHARS.forEach(function (c, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vn-char " + (c.image ? "vn-char--img" : "vn-char--svg");
      btn.setAttribute("aria-label", "让 " + c.name + " 说话");
      btn.innerHTML = c.image
        ? '<img src="' + c.image + '" alt="' + c.name + ' 的立绘" />'
        : sprite(c);
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        select(i);
      });
      stage.appendChild(btn);
    });

    function updateDim() {
      Array.prototype.forEach.call(stage.children, function (el, i) {
        el.classList.toggle("is-active", i === active);
      });
    }

    function type(text) {
      if (reduceMotion) {
        els.text.textContent = text;
        els.box.classList.add("is-done");
        return;
      }
      typing = true;
      els.text.textContent = "";
      var i = 0;
      (function tick() {
        if (i >= text.length) {
          typing = false;
          els.box.classList.add("is-done");
          return;
        }
        els.text.textContent += text.charAt(i++);
        typeTimer = setTimeout(tick, 34 + Math.random() * 40);
      })();
    }

    function say(text) {
      clearTimeout(typeTimer);
      curText = text;
      els.box.classList.remove("is-done");
      type(text);
    }

    function hideChoices() {
      choicesOpen = false;
      els.choices.classList.remove("is-open");
      els.choices.innerHTML = "";
    }

    function showChoices() {
      if (choicesOpen) return;
      choicesOpen = true;
      els.choices.innerHTML = "";
      CHOICES.forEach(function (ch) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "vn-choice";
        b.textContent = ch.text;
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          hideChoices();
          active = ch.target;
          updateDim();
          var t = CHARS[active];
          els.name.textContent = t.name;
          els.role.textContent = t.title;
          lineIdx = t.lines.length;
          say(t.reply);
        });
        els.choices.appendChild(b);
      });
      els.choices.classList.add("is-open");
    }

    function select(i) {
      active = i;
      updateDim();
      var c = CHARS[i];
      els.name.textContent = c.name;
      els.role.textContent = c.title;
      hideChoices();
      lineIdx = 1;
      say(c.lines[0]);
    }

    function advance() {
      if (typing) {
        clearTimeout(typeTimer);
        els.text.textContent = curText;
        typing = false;
        els.box.classList.add("is-done");
        return;
      }
      if (choicesOpen) return;
      var c = CHARS[active];
      if (lineIdx < c.lines.length) {
        say(c.lines[lineIdx]);
        lineIdx++;
        return;
      }
      showChoices();
    }

    els.box.addEventListener("click", advance);
    els.box.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advance();
      }
    });

    // 点击空白舞台也可推进
    document.querySelector(".vn__stage").addEventListener("click", function (e) {
      if (e.target.closest(".vn-char, .vn__box, .vn__choices, .vn__ui")) return;
      advance();
    });

    els.ui && els.ui.addEventListener("click", function (e) {
      var btn = e.target.closest(".vnbtn");
      if (!btn) return;
      showToast(btn.getAttribute("data-act") + "：体验版里只是装饰按钮啦 (>_<)");
    });

    select(1);
  })();

  /* ================= 页脚年份 ================= */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
