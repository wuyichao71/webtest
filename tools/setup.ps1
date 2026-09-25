<#
    一键安装本地 AI 绘画环境（Stable Diffusion）
    用法：
        powershell -ExecutionPolicy Bypass -File tools\setup.ps1

    国内网络默认走清华镜像 + hf-mirror，想用官方源加 -Global：
        powershell -ExecutionPolicy Bypass -File tools\setup.ps1 -Global
#>
param([switch]$Global)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if ($Global) {
    $pipIndex   = "https://pypi.org/simple"
    $torchIndex = "https://download.pytorch.org/whl/cu126"
    Write-Host "[模式] 官方源" -ForegroundColor Yellow
} else {
    $pipIndex   = "https://pypi.tuna.tsinghua.edu.cn/simple"
    $torchIndex = "https://download.pytorch.org/whl/cu126"
    $env:HF_ENDPOINT = "https://hf-mirror.com"
    Write-Host "[模式] 国内镜像（清华 pypi + hf-mirror 模型站）" -ForegroundColor Yellow
}

Write-Host "`n[1/4] 检查 Python ..." -ForegroundColor Cyan
$py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $py) { throw "没找到 python，请先安装 Python 3.10+。" }
& $py --version

Write-Host "`n[2/4] 创建虚拟环境 .venv ..." -ForegroundColor Cyan
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    & $py -m venv .venv
}
$venvPy = ".\.venv\Scripts\python.exe"

Write-Host "`n[3/4] 安装 PyTorch + torchvision（CUDA 12.6，约 3 GB）..." -ForegroundColor Cyan
Write-Host "    这一步最慢，可以去泡杯茶 ☕" -ForegroundColor DarkGray
& $venvPy -m pip install --upgrade pip -i $pipIndex
& $venvPy -m pip install torch torchvision --index-url $torchIndex

Write-Host "`n[4/4] 安装 diffusers / transformers 等（约 300 MB）..." -ForegroundColor Cyan
& $venvPy -m pip install -r tools\requirements.txt -i $pipIndex

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host " 安装完成！下一步生成立绘：" -ForegroundColor Green
Write-Host "   .\.venv\Scripts\python.exe tools\generate_sprites.py" -ForegroundColor White
Write-Host "====================================================`n" -ForegroundColor Green

Write-Host "验证 GPU 是否可用：" -ForegroundColor DarkGray
& $venvPy -c "import torch; print('  CUDA:', torch.cuda.is_available(), '|', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
