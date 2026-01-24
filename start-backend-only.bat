@echo off
REM 只启动后端服务器 (Windows)

echo ==========================================
echo Vibe Kanban 后端启动 (Windows)
echo ==========================================
echo.

REM 检查 Rust
where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未找到 Rust/Cargo
    echo 请安装 Rust: https://rustup.rs/
    pause
    exit /b 1
)

echo [1/2] 分配后端端口...
for /f %%i in ('node scripts/setup-dev-environment.js backend') do set BACKEND_PORT=%%i
echo 后端端口: %BACKEND_PORT%
echo.

echo [2/2] 启动后端服务...
echo.
echo ==========================================
echo 后端服务: http://localhost:%BACKEND_PORT%
echo ==========================================
echo.
echo 按 Ctrl+C 停止服务
echo.

set BACKEND_PORT=%BACKEND_PORT%
set DISABLE_WORKTREE_ORPHAN_CLEANUP=1
set RUST_LOG=debug

cargo watch -w crates -x 'run --bin server'

pause
