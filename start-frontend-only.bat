@echo off
REM 只启动前端服务器 (Windows)

echo ==========================================
echo Vibe Kanban 前端启动 (Windows)
echo ==========================================
echo.

if not exist .dev-ports.json (
    echo [错误] 未找到端口配置文件
    echo 请先启动后端或运行 start-dev.bat
    pause
    exit /b 1
)

echo [1/2] 读取端口配置...
for /f "tokens=2" %%a in ('findstr /C:"\"backend\"" .dev-ports.json') do set BACKEND_PORT=%%a
for /f "tokens=2" %%a in ('findstr /C:"\"frontend\"" .dev-ports.json') do set FRONTEND_PORT=%%a
set BACKEND_PORT=%BACKEND_PORT: "=%
set FRONTEND_PORT=%FRONTEND_PORT: "=%
set BACKEND_PORT=%BACKEND_PORT:,=%
set FRONTEND_PORT=%FRONTEND_PORT:,=%
echo 前端端口: %FRONTEND_PORT%
echo 后端端口: %BACKEND_PORT%
echo.

echo [2/2] 更新前端环境并启动...
echo.
echo ==========================================
echo 前端服务: http://localhost:%FRONTEND_PORT%
echo 后端服务: http://localhost:%BACKEND_PORT%
echo ==========================================
echo.
echo 按 Ctrl+C 停止服务
echo.

echo VITE_APP_TITLE=Vibe Kanban> frontend\.env
echo BACKEND_PORT=%BACKEND_PORT%>> frontend\.env

cd frontend
pnpm run dev -- --port %FRONTEND_PORT% --host

pause
