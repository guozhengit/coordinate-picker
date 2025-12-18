@echo off
chcp 65001 > nul
echo ======================================================
echo   Cloud Deployment Tool / 云服务器部署工具
echo   Coordinate Picker / 坐标拾取器
echo ======================================================
echo.

REM Check if server IP is provided
if "%1"=="" (
    echo Usage / 使用方法: deploy-windows.bat SERVER_IP [PORT]
    echo Example / 示例: deploy-windows.bat 123.45.67.89 80
    echo.
    pause
    exit /b 1
)

set SERVER_IP=%1
set PORT=%2
if "%PORT%"=="" set PORT=80

REM Generate timestamp version using PowerShell
for /f "tokens=*" %%i in ('powershell -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"') do set VERSION=%%i

echo ======================================================
echo Server / 服务器: %SERVER_IP%:%PORT%
echo Version / 版本号: %VERSION%
echo Image / 镜像名: coordinate-picker:%VERSION%
echo ======================================================
echo.

echo [1/7] Compiling TypeScript... / 编译 TypeScript...
call npm run build
if errorlevel 1 (
    echo       ❌ Compilation failed / 编译失败！
    pause
    exit /b 1
)
echo       ✓ TypeScript compiled / 编译完成

echo.
echo [2/7] Building Docker image... / 构建 Docker 镜像...
docker build -t coordinate-picker:%VERSION% --build-arg VERSION=%VERSION% --build-arg BUILD_DATE=%VERSION% --label "build.version=%VERSION%" --label "build.timestamp=%VERSION%" --label "deploy.server=%SERVER_IP%" .
if errorlevel 1 (
    echo       ❌ Build failed / 构建失败！
    echo       Tip: Check if Docker is running / 提示:检查 Docker 是否运行
    pause
    exit /b 1
)
echo       ✓ Image built / 镜像构建成功

echo.
echo [3/7] Verifying image... / 验证镜像...
docker inspect coordinate-picker:%VERSION% >nul 2>&1
if errorlevel 1 (
    echo       ❌ Verification failed / 验证失败！
    pause
    exit /b 1
)
echo       ✓ Image verified / 镜像验证通过

echo.
echo [4/7] Saving Docker image... / 保存 Docker 镜像...
docker save coordinate-picker:%VERSION% | gzip > coordinate-picker-%VERSION%.tar.gz
if errorlevel 1 (
    echo       ❌ Save failed / 保存失败！
    pause
    exit /b 1
)
for %%F in (coordinate-picker-%VERSION%.tar.gz) do set FILESIZE=%%~zF
set /a FILESIZE_MB=%FILESIZE% / 1048576
echo       ✓ Image saved / 镜像已保存 (%FILESIZE_MB% MB)

echo.
echo [5/7] Uploading to server... / 上传到服务器...
scp coordinate-picker-%VERSION%.tar.gz root@%SERVER_IP%:/tmp/
if errorlevel 1 (
    echo       ❌ Upload failed / 上传失败！
    echo       Tip: Check SSH connection / 提示:检查 SSH 连接
    pause
    exit /b 1
)
echo       ✓ Upload completed / 上传完成

echo.
echo [6/7] Deploying on server... / 在服务器上部署...
ssh root@%SERVER_IP% "cd /tmp && echo 'Loading image...' && docker load < coordinate-picker-%VERSION%.tar.gz && echo 'Stopping old container...' && docker stop coordinate-picker 2>/dev/null || true && docker rm coordinate-picker 2>/dev/null || true && echo 'Starting new container...' && docker run -d --name coordinate-picker --restart unless-stopped -p %PORT%:80 -e VERSION=%VERSION% -e BUILD_DATE=%VERSION% --label deploy.timestamp=%VERSION% coordinate-picker:%VERSION% && echo 'Cleaning up...' && rm coordinate-picker-%VERSION%.tar.gz && echo 'Deployment complete!'"
if errorlevel 1 (
    echo       ❌ Deployment failed / 部署失败！
    echo       Tip: Check if Docker is installed on server / 提示:检查服务器Docker
    pause
    exit /b 1
)
echo       ✓ Deployed successfully / 服务器部署成功

echo.
echo [7/7] Cleaning up local files... / 清理本地文件...
del coordinate-picker-%VERSION%.tar.gz
echo       ✓ Cleanup completed / 清理完成

echo.
echo ✓ Deployment successful! / 部署成功！
echo ======================================================
echo   Application URL / 应用地址:
echo   → http://%SERVER_IP%:%PORT%
echo.
echo   Version Info / 版本信息:
echo   - Version / 版本: %VERSION%
echo   - Image / 镜像: coordinate-picker:%VERSION%
echo   - Server / 服务器: %SERVER_IP%:%PORT%
echo ======================================================
echo.
echo   Verification / 验证部署:
echo   - Health check / 健康检查:
echo     curl http://%SERVER_IP%:%PORT%/health
echo   - Browser / 浏览器:
echo     http://%SERVER_IP%:%PORT%
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
