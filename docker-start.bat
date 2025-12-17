@echo off
chcp 65001 > nul
echo ======================================================
echo   启动 Docker 容器
echo ======================================================
echo.
docker-compose up -d
if errorlevel 1 (
    echo ❌ 启动失败！
    pause
    exit /b 1
)
echo.
echo ✅ Docker 容器已启动！
echo ======================================================
echo 🌐 访问地址: http://localhost:3001
echo ======================================================
echo.
echo 📋 常用命令:
echo    查看日志: docker logs -f coordinate-picker
echo    停止:     docker-compose down
echo    重启:     docker-compose restart
echo.
pause
