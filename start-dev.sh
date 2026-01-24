#!/bin/bash
# Vibe Kanban 开发环境启动脚本 (Linux/Mac/WSL)
# 自动分配和管理前后端端口

echo "=========================================="
echo "Vibe Kanban 开发环境启动"
echo "=========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "[错误] 未找到 pnpm，请先安装 pnpm"
    exit 1
fi

# 检查 Rust/Cargo
if ! command -v cargo &> /dev/null; then
    echo "[错误] 未找到 Rust/Cargo，请先安装 Rust"
    exit 1
fi

echo "[1/4] 分配开发端口..."
FRONTEND_PORT=$(node scripts/setup-dev-environment.js frontend | tr -d '\n')
BACKEND_PORT=$(node scripts/setup-dev-environment.js backend | tr -d '\n')
echo "前端端口: $FRONTEND_PORT"
echo "后端端口: $BACKEND_PORT"
echo ""

echo "[2/4] 更新前端环境变量..."
cat > frontend/.env << EOF
VITE_APP_TITLE=Vibe Kanban
BACKEND_PORT=$BACKEND_PORT
EOF
echo ""

echo "[3/4] 设置后端环境变量..."
export VK_ALLOWED_ORIGINS="http://localhost:$FRONTEND_PORT"
export BACKEND_PORT=$BACKEND_PORT
export DISABLE_WORKTREE_ORPHAN_CLEANUP=1
export RUST_LOG=debug
echo ""

echo "[4/4] 启动前后端服务..."
echo ""
echo "=========================================="
echo "服务信息:"
echo "  前端: http://localhost:$FRONTEND_PORT"
echo "  后端: http://localhost:$BACKEND_PORT"
echo "=========================================="
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 使用 pnpm dev 命令（已经在 package.json 中配置好）
pnpm run dev:gitbash
