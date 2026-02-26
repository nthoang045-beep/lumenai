@echo off
chcp 65001 >nul
title LUMEN AI — Setup & Start

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║          LUMEN AI — Windows Setup            ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ── Check Node.js ──────────────────────────────────────────────────────────
echo  [1/4] Kiểm tra Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ❌ Node.js chưa được cài đặt!
    echo.
    echo  Làm theo các bước sau:
    echo  1. Mở trình duyệt, vào: https://nodejs.org
    echo  2. Tải bản LTS ^(nút màu xanh lá^)
    echo  3. Cài đặt, giữ mặc định, nhấn Next tất cả
    echo  4. Restart máy tính
    echo  5. Chạy lại file này
    echo.
    echo  Nhấn Enter để mở trang tải Node.js...
    pause >nul
    start https://nodejs.org
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  ✅ Node.js %NODE_VER% đã sẵn sàng

:: ── Check .env ─────────────────────────────────────────────────────────────
echo.
echo  [2/4] Kiểm tra API Key...

if exist .env (
    findstr /C:"ANTHROPIC_API_KEY=sk-ant" .env >nul 2>&1
    if %errorlevel% equ 0 (
        echo  ✅ API Key đã được cài đặt
        goto :check_public
    )
)

echo  ⚠️  Chưa có API Key!
echo.
echo  Cần có Anthropic API Key để chạy LUMEN AI.
echo  Lấy key tại: https://console.anthropic.com/settings/keys
echo.
set /p APIKEY="  Nhập API Key của bạn (sk-ant-...): "

if "%APIKEY%"=="" (
    echo  ❌ API Key không được để trống!
    pause
    exit /b 1
)

echo ANTHROPIC_API_KEY=%APIKEY%> .env
echo PORT=3000>> .env
echo  ✅ Đã lưu API Key vào file .env

:: ── Check public folder ────────────────────────────────────────────────────
:check_public
echo.
echo  [3/4] Kiểm tra files...

if not exist public mkdir public

if not exist public\index.html (
    if exist index.html (
        copy index.html public\index.html >nul
        echo  ✅ Đã copy index.html vào public\
    ) else (
        echo  ❌ Không tìm thấy index.html!
        echo  Đảm bảo bạn đã giải nén đầy đủ thư mục lumen-fixed
        pause
        exit /b 1
    )
)

if not exist public\lumen-advanced.html (
    if exist lumen-advanced.html (
        copy lumen-advanced.html public\lumen-advanced.html >nul
        echo  ✅ Đã copy lumen-advanced.html vào public\
    )
)

echo  ✅ Files OK

:: ── Start server ───────────────────────────────────────────────────────────
echo.
echo  [4/4] Khởi động server...
echo.

:: Open browser after 2 seconds
start "" /min cmd /c "timeout /t 2 >nul && start http://localhost:3000"

echo  ┌─────────────────────────────────────────────┐
echo  │  Server đang chạy! Trình duyệt sẽ tự mở.   │
echo  │                                             │
echo  │  🌿 http://localhost:3000                   │
echo  │  ⚡ http://localhost:3000/advanced           │
echo  │                                             │
echo  │  Nhấn Ctrl+C để dừng server                │
echo  └─────────────────────────────────────────────┘
echo.

node server.js

echo.
echo  Server đã dừng. Nhấn phím bất kỳ để thoát.
pause >nul
