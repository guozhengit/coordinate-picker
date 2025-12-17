@echo off
chcp 65001 > nul
echo ======================================================
echo   停止 Docker 容器
echo ======================================================
echo.
docker-compose down
if errorlevel 1 (
    echo ❌ 停止失败！
    pause
    exit /b 1
)
echo.
echo ✅ Docker 容器已停止！
echo.
pause
