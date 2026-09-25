#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
局域网静态服务器 —— 用来在局域网里发布这个个人网站。

用法：
    python serve.py            # 默认端口 8000
    python serve.py 8080       # 指定端口
    PORT=8080 python serve.py  # 环境变量指定端口

停止：Ctrl + C
"""

import http.server
import socket
import socketserver
import sys
import os
import functools

ROOT = os.path.dirname(os.path.abspath(__file__))


def setup_console():
    """让 Windows 控制台能正常输出 UTF-8 中文与 emoji。"""
    if os.name == "nt":
        try:
            import ctypes
            ctypes.windll.kernel32.SetConsoleOutputCP(65001)
            ctypes.windll.kernel32.SetConsoleCP(65001)
        except Exception:
            pass
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
        except Exception:
            pass


def pick_port(preferred: int) -> int:
    """端口被占用时自动往后找一个可用的。"""
    for p in range(preferred, preferred + 30):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("0.0.0.0", p))
                return p
            except OSError:
                continue
    raise SystemExit("找不到可用端口，请用 python serve.py 9000 手动指定。")


def lan_ips():
    """列出本机所有可用于局域网访问的 IPv4 地址。"""
    ips = set()

    # 方法一：连一下外网，拿到默认出口网卡的 IP（最准）
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            ips.add(s.getsockname()[0])
    except OSError:
        pass

    # 方法二：解析主机名
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ips.add(info[4][0])
    except OSError:
        pass

    # 剔除回环 / 链路本地 / 虚拟网卡常见网段（可按需删掉过滤）
    def useful(ip: str) -> bool:
        if ip.startswith("127.") or ip.startswith("169.254."):
            return False
        if ip.startswith("100."):      # Tailscale
            return False
        if ip.startswith("10.66."):    # ZeroTier（按你自己环境可调整）
            return False
        return True

    good = sorted(i for i in ips if useful(i))

    def priority(ip: str) -> int:
        if ip.startswith("192.168."):
            return 0
        if ip.startswith("172."):
            try:
                if 16 <= int(ip.split(".")[1]) <= 31:
                    return 1
            except (ValueError, IndexError):
                pass
        if ip.startswith("10."):
            return 2
        return 3

    return sorted(good, key=lambda ip: (priority(ip), ip)) or sorted(ips)


class Handler(http.server.SimpleHTTPRequestHandler):
    """补上常见的 MIME 类型，并禁用缓存，方便改完立刻看到效果。"""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".map": "application/json",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        # 想看到访问日志就注释掉下面这行
        return
        super().log_message(fmt, *args)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    setup_console()

    preferred = 8000
    if len(sys.argv) > 1:
        try:
            preferred = int(sys.argv[1])
        except ValueError:
            raise SystemExit("端口必须是数字，例如：python serve.py 8080")
    elif os.environ.get("PORT"):
        preferred = int(os.environ["PORT"])

    port = pick_port(preferred)
    handler = functools.partial(Handler, directory=ROOT)

    line = "=" * 52
    print()
    print(line)
    print("  \U0001F338  个人网站 · 局域网发布中")
    print(line)
    print(f"  本机访问 :  http://127.0.0.1:{port}")
    ips = lan_ips()
    for n, ip in enumerate(ips):
        tag = "  ← 手机用这个" if n == 0 else ""
        print(f"  局域网   :  http://{ip}:{port}{tag}")
    print(line)
    print("  手机 / 平板连同一个 Wi-Fi，浏览器打开上面的「局域网」地址")
    print("  停止服务 :  Ctrl + C")
    print(line)
    print()

    with Server(("0.0.0.0", port), handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n已停止。再见~ \U0001F44B")


if __name__ == "__main__":
    main()
