@echo off
chcp 65001 > nul

REM Generate timestamp version using PowerShell
for /f "tokens=*" %%i in ('powershell -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"') do set VERSION=%%i

echo ======================================================
echo   Docker Build Script / Docker 构建脚本
echo   Auto-versioning / 自动版本号
echo ======================================================
echo.
echo Version / 版本号: %VERSION%
echo Image / 镜像名: coordinate-picker:%VERSION%
echo.

REM Clean up old build artifacts
echo [0/3] Cleaning up... / 清理旧文件...
if exist index.js.map del index.js.map
if exist *.log del *.log
echo       ✓ Clean / 清理完成

REM Compile TypeScript
echo.
echo [1/3] Compiling TypeScript... / 编译 TypeScript...
call node node_modules\typescript\bin\tsc
if errorlevel 1 (
    echo       ❌ Compilation failed / 编译失败！
    pause
    exit /b 1
)
echo       ✓ TypeScript compiled / 编译完成

REM Build Docker image
echo.
echo [2/3] Building Docker image... / 构建 Docker 镜像...
docker build -t coordinate-picker:%VERSION% --build-arg VERSION=%VERSION% --build-arg BUILD_DATE=%VERSION% --label "build.version=%VERSION%" --label "build.timestamp=%VERSION%" .
if errorlevel 1 (
    echo       ❌ Build failed / 构建失败！
    echo       Tip: Check if Docker is running / 提示:检查 Docker 是否运行
    pause
    exit /b 1
)
echo       ✓ Image built / 镜像构建成功

REM Tag as latest
echo.
echo [3/3] Tagging as latest... / 创建 latest 标签...
docker tag coordinate-picker:%VERSION% coordinate-picker:latest
if errorlevel 1 (
    echo       ⚠️  Latest tag failed, but main image is ready
    echo       ⚠️  latest 标签失败，但主镜像已就绪
) else (
    echo       ✓ Tagged / 标签完成
)

echo.
echo ✓ Build completed successfully! / 构建成功！
echo ======================================================
echo   Image Information / 镜像信息:
echo   - coordinate-picker:%VERSION% (191 MB)
echo   - coordinate-picker:latest
echo.
echo   Image Tags / 镜像标签:
docker images coordinate-picker --format "   {{.Repository}}:{{.Tag}} - {{.Size}} - {{.CreatedAt}}"
echo ======================================================
echo.
echo   Usage / 使用方法:
echo   Test locally / 本地测试:
echo     docker run -d -p 80:80 --name test coordinate-picker:%VERSION%
echo.
echo   Deploy / 部署:
echo     docker-compose up -d
echo.
echo   View images / 查看镜像:
echo     docker images coordinate-picker
echo.
echo   View details / 查看详情:
echo     docker inspect coordinate-picker:%VERSION%
echo.
pause
