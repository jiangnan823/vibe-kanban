@echo off
REM Vibe Kanban 开发环境启动脚本 (Windows)
REM 直接在 Windows 上运行前后端

echo ==========================================
echo Vibe Kanban 开发环境启动 (Windows)
echo ==========================================
echo.

REM 检查 Rust
where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未找到 Rust/Cargo
    echo.
    echo 请安装 Rust: https://rustup.rs/
    echo 或运行: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs ^| sh
    pause
    exit /b 1
)

echo [1/3] 分配开发端口...
for /f %%i in ('node scripts/setup-dev-environment.js frontend') do set FRONTEND_PORT=%%i
for /f %%i in ('node scripts/setup-dev-environment.js backend') do set BACKEND_PORT=%%i
echo 前端端口: %FRONTEND_PORT%
echo 后端端口: %BACKEND_PORT%
echo.

echo [2/3] 更新前端环境变量...
echo VITE_APP_TITLE=Vibe Kanban> frontend\.env
echo BACKEND_PORT=%BACKEND_PORT%>> frontend\.env
echo.

echo [3/3] 启动前后端服务...
echo.
echo ==========================================
echo 服务信息:
echo   前端: http://localhost:%FRONTEND_PORT%
echo   后端: http://localhost:%BACKEND_PORT%
echo ==========================================
echo.
echo 按 Ctrl+C 停止所有服务
echo.

REM 使用项目原有的 Windows 开发命令
set FRONTEND_PORT=%FRONTEND_PORT%
set BACKEND_PORT=%BACKEND_PORT%
set VK_ALLOWED_ORIGINS=http://localhost:%FRONTEND_PORT%
set VITE_VK_SHARED_API_BASE=
set DISABLE_WORKTREE_ORPHAN_CLEANUP=1
set RUST_LOG=debug

pnpm exec concurrently ^
  "cargo watch -w crates -x 'run --bin server'" ^
  "cd frontend && pnpm run dev -- --port %FRONTEND_PORT% --host"

pause
