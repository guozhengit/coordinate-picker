@echo off
chcp 65001 > nul

echo ======================================================
echo   Docker Image Information Tool
echo   Docker 镜像信息查看工具
echo ======================================================
echo.

REM Check if image exists
docker images coordinate-picker --format "{{.Repository}}:{{.Tag}}" | findstr coordinate-picker >nul 2>&1
if errorlevel 1 (
    echo ❌ No coordinate-picker images found / 未找到 coordinate-picker 镜像
    echo.
    echo 💡 Build first / 请先构建镜像:
    echo    build.bat
    echo.
    pause
    exit /b 1
)

echo 📦 Local Images / 本地镜像列表:
echo ======================================================
docker images coordinate-picker --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo.

echo 🏷️  Image Details / 镜像标签详情:
echo ======================================================
for /f "tokens=*" %%i in ('docker images coordinate-picker --format "{{.Repository}}:{{.Tag}}"') do (
    echo.
    echo Image / 镜像: %%i
    echo ----------------------------------------
    docker inspect %%i --format="  ID: {{.Id}}"
    docker inspect %%i --format="  Created / 创建时间: {{.Created}}"
    docker inspect %%i --format="  Size / 大小: {{.Size}} bytes"
    docker inspect %%i --format="  Architecture / 架构: {{.Architecture}}"
    docker inspect %%i --format="  OS / 操作系统: {{.Os}}"
    echo.
    echo  Labels / 标签信息:
    docker inspect %%i --format="{{range $k, $v := .Config.Labels}}    {{$k}}: {{$v}}{{println}}{{end}}"
    echo.
    echo  Environment / 环境变量:
    docker inspect %%i --format="{{range .Config.Env}}    {{println .}}{{end}}"
)

echo ======================================================
echo.
echo 💡 Common Commands / 常用命令:
echo    Run container / 运行容器:
echo      docker run -d -p 80:80 --name test coordinate-picker:latest
echo.
echo    View containers / 查看容器:
echo      docker ps -a
echo.
echo    Remove image / 删除镜像:
echo      docker rmi coordinate-picker:TAG
echo.
echo    Prune images / 清理镜像:
echo      docker image prune
echo.
pause
