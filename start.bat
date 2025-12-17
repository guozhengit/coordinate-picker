@echo off
chcp 65001 > nul
echo ====================================================
echo Starting Coordinate Picker...
echo ====================================================
echo.
echo Checking for running servers on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    echo Found process using port 3001, stopping it...
    taskkill /F /PID %%a > nul 2>&1
)
echo.
echo Starting server...
node server.js
