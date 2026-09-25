@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 个人网站 - 局域网服务器

echo.
echo   正在启动局域网服务器...
echo.

where python >nul 2>&1
if %errorlevel%==0 (
    python serve.py %1
) else (
    where py >nul 2>&1
    if %errorlevel%==0 (
        py serve.py %1
    ) else (
        echo   [错误] 没找到 Python，请先安装 Python 3。
        echo   或改用 Node：  npx --yes serve -l tcp://0.0.0.0:8000
    )
)

echo.
echo   服务器已停止。
pause
