@echo off
chcp 65001 > nul
echo ======================================================
echo   坐标拾取器 - 无需 Docker 部署工具
echo ======================================================
echo.
echo 此脚本将直接部署到云服务器，无需 Docker
echo.

REM Check if server IP is provided
if "%1"=="" (
    echo 使用方法: deploy-without-docker.bat 服务器IP [端口]
    echo 示例: deploy-without-docker.bat 123.45.67.89 80
    echo.
    pause
    exit /b 1
)

set SERVER_IP=%1
set PORT=%2
if "%PORT%"=="" set PORT=80

echo 📦 步骤 1/4: 编译 TypeScript...
call npm run build
if errorlevel 1 (
    echo ❌ 编译失败！
    pause
    exit /b 1
)

echo.
echo 📦 步骤 2/4: 打包文件...
tar -czf deploy-files.tar.gz index.html index.js nginx.conf
if errorlevel 1 (
    echo 尝试使用 PowerShell 压缩...
    powershell -Command "Compress-Archive -Force -Path index.html,index.js,nginx.conf -DestinationPath deploy-files.zip"
    if errorlevel 1 (
        echo ❌ 打包失败！
        pause
        exit /b 1
    )
)

echo.
echo 📤 步骤 3/4: 上传到服务器...
if exist deploy-files.tar.gz (
    scp deploy-files.tar.gz root@%SERVER_IP%:/tmp/
) else (
    scp deploy-files.zip root@%SERVER_IP%:/tmp/
)
if errorlevel 1 (
    echo ❌ 上传失败！请检查 SSH 连接
    pause
    exit /b 1
)

echo.
echo 🚀 步骤 4/4: 在服务器上部署...
ssh root@%SERVER_IP% "apt update && apt install -y nginx && mkdir -p /var/www/coordinate-picker && cd /tmp && (tar -xzf deploy-files.tar.gz || unzip -o deploy-files.zip) && mv index.html index.js /var/www/coordinate-picker/ && mv nginx.conf /etc/nginx/sites-available/coordinate-picker && ln -sf /etc/nginx/sites-available/coordinate-picker /etc/nginx/sites-enabled/coordinate-picker && nginx -t && systemctl restart nginx && rm -f deploy-files.* && echo 'Deployment completed!'"

if errorlevel 1 (
    echo ❌ 部署失败！
    pause
    exit /b 1
)

echo.
echo ✅ 部署成功！（无需 Docker）
echo ======================================================
echo 🌐 您的应用现在运行在:
echo    http://%SERVER_IP%
echo ======================================================
echo.
echo 🔧 常用命令:
echo    查看日志:   ssh root@%SERVER_IP% "tail -f /var/log/nginx/access.log"
echo    重启:       ssh root@%SERVER_IP% "systemctl restart nginx"
echo    查看状态:   ssh root@%SERVER_IP% "systemctl status nginx"
echo ======================================================

REM Cleanup
if exist deploy-files.tar.gz del deploy-files.tar.gz
if exist deploy-files.zip del deploy-files.zip

echo.
pause
