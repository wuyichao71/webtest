@echo off
chcp 65001 >nul
title 放行局域网端口（需要管理员）

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   请右键这个文件 -^> 「以管理员身份运行」
    echo.
    pause
    exit /b 1
)

echo.
echo   正在为端口 8000 添加 Windows 防火墙入站规则...
echo.

netsh advfirewall firewall delete rule name="PersonalSite-8000" >nul 2>&1
netsh advfirewall firewall add rule name="PersonalSite-8000" dir=in action=allow protocol=TCP localport=8000 >nul

if %errorlevel%==0 (
    echo   [完成] 已放行 TCP 8000，局域网设备现在可以访问了。
    echo   如果以后换端口（比如 8080），把下面的数字改一下再跑一次即可。
) else (
    echo   [失败] 添加规则失败，请确认是以管理员身份运行。
)

echo.
pause
