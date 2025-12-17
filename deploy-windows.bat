@echo off
chcp 65001 > nul
echo ======================================================
echo   坐标拾取器 - 云服务器部署工具 (生产环境)
echo ======================================================
echo.

REM Check if server IP is provided
if "%1"=="" (
    echo 使用方法: deploy-windows.bat 服务器IP [端口]
    echo 示例: deploy-windows.bat 123.45.67.89 80
    echo.
    pause
    exit /b 1
)

set SERVER_IP=%1
set PORT=%2
if "%PORT%"=="" set PORT=80

echo 📦 步骤 1/6: 编译 TypeScript...
call npm run build
if errorlevel 1 (
    echo ❌ 编译失败！
    pause
    exit /b 1
)

echo.
echo 📦 步骤 2/6: 构建 Docker 镜像...
docker build -t coordinate-picker:latest .
if errorlevel 1 (
    echo ❌ Docker 构建失败！
    echo 提示: 请检查 Docker 是否正在运行
    pause
    exit /b 1
)

echo.
echo 💾 步骤 3/6: 保存 Docker 镜像...
docker save coordinate-picker:latest | gzip > coordinate-picker.tar.gz
if errorlevel 1 (
    echo ❌ 保存镜像失败！
    pause
    exit /b 1
)

echo.
echo 📤 步骤 4/6: 上传到服务器...
scp coordinate-picker.tar.gz root@%SERVER_IP%:/tmp/
if errorlevel 1 (
    echo ❌ 上传失败！请检查 SSH 连接
    echo 提示: 确保已配置 SSH 密钥或密码
    pause
    exit /b 1
)

echo.
echo 🚀 步骤 5/6: 在服务器上部署...
ssh root@%SERVER_IP% "cd /tmp && docker load < coordinate-picker.tar.gz && docker stop coordinate-picker 2>/dev/null || true && docker rm coordinate-picker 2>/dev/null || true && docker run -d --name coordinate-picker --restart unless-stopped -p %PORT%:80 coordinate-picker:latest && rm coordinate-picker.tar.gz"
if errorlevel 1 (
    echo ❌ 部署失败！
    echo 提示: 检查服务器上是否安装了 Docker
    pause
    exit /b 1
)

echo.
echo 🧹 步骤 6/6: 清理本地文件...
del coordinate-picker.tar.gz

echo.
echo ✅ 部署成功！
echo ======================================================
echo 🌐 您的应用现在运行在:
echo    http://%SERVER_IP%:%PORT%
echo ======================================================
echo.
echo 🔧 常用管理命令:
echo    查看日志:   ssh root@%SERVER_IP% "docker logs -f coordinate-picker"
echo    重启应用:   ssh root@%SERVER_IP% "docker restart coordinate-picker"
echo    停止应用:   ssh root@%SERVER_IP% "docker stop coordinate-picker"
echo    查看状态:   ssh root@%SERVER_IP% "docker ps ^| grep coordinate-picker"
echo    健康检查:   curl http://%SERVER_IP%:%PORT%/health
echo ======================================================

echo.
pause
