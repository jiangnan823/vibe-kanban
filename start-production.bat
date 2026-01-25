@echo off
REM ========================================
REM Vibe Kanban - Production (Windows)
REM ========================================

echo ========================================
echo Starting Vibe Kanban (Production Mode)
echo Backend: Windows Native (Upstream Build)
echo ========================================

REM 检查可执行文件是否存在
if not exist "vibe-kanban.exe" (
    echo.
    echo ERROR: vibe-kanban.exe not found!
    echo.
    echo To download the Windows binary:
    echo   npx vibe-kanban@latest
    echo.
    echo Or copy from:
    echo   %%USERPROFILE%%\AppData\Local\npm-cache\_npx\*\node_modules\.bin\vibe-kanban
    echo.
    pause
    exit /b 1
)

REM 检查前端是否已编译
if not exist "frontend\dist" (
    echo.
    echo ERROR: Frontend not built!
    echo.
    echo Please run:
    echo   cd frontend
    echo   pnpm run build
    echo.
    pause
    exit /b 1
)

REM 设置环境变量
set VK_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
set PORT=42541
REM DATABASE_URL留空，让服务器自动创建/管理数据库

echo.
echo Environment:
echo - Port: %PORT%
echo - Frontend: frontend/dist (embedded)
echo - Allowed Origins: %VK_ALLOWED_ORIGINS%
echo.
echo Starting server...
echo Press Ctrl+C to stop
echo.

REM 启动服务器
vibe-kanban.exe

REM 如果服务器异常退出，暂停以查看错误信息
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Server exited with error code: %ERRORLEVEL%
    pause
)
