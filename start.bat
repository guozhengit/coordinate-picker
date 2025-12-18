@echo off
chcp 65001 > nul
echo ======================================================
echo   Coordinate Picker - Development Server
echo   坐标拾取器 - 开发服务器
echo ======================================================
echo.
echo [1/2] Checking port 3001... / 检查端口 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    echo       Found existing process, stopping... / 发现已有进程，正在停止...
    taskkill /F /PID %%a > nul 2>&1
)
echo       ✓ Port ready / 端口就绪
echo.
echo [2/2] Starting server... / 启动服务器...
echo.
echo ======================================================
echo   Server running at / 服务器运行于:
echo   → http://localhost:3001
echo ======================================================
echo.
node server.js
