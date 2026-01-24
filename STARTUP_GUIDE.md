# 开发环境启动脚本使用指南

## 概述

这些脚本自动管理前后端端口，确保每次启动时端口自动对应，无需手动配置。

## 脚本说明

### 1. `start-dev.bat` (Windows) / `start-dev.sh` (Linux/Mac/WSL)
**完整开发环境启动** - 同时启动前后端服务

**功能**:
- ✅ 自动检测环境依赖（Node.js, pnpm, Rust/Cargo）
- ✅ 自动分配可用端口（避免端口冲突）
- ✅ 自动更新前端 `.env` 配置
- ✅ 同时启动前后端（使用 concurrently）
- ✅ 按 Ctrl+C 一次性停止所有服务

**使用方法**:
```bash
# Windows
start-dev.bat

# Linux/Mac/WSL
chmod +x start-dev.sh
./start-dev.sh
```

**输出示例**:
```
==========================================
Vibe Kanban 开发环境启动
==========================================

[1/4] 分配开发端口...
前端端口: 3000
后端端口: 3001

[2/4] 更新前端环境变量...

[3/4] 设置后端环境变量...

[4/4] 启动前后端服务...

==========================================
服务信息:
  前端: http://localhost:3000
  后端: http://localhost:3001
==========================================
```

---

### 2. `start-backend-only.bat`
**仅启动后端服务** - 适用于只需要后端的场景

**功能**:
- ✅ 自动分配后端端口
- ✅ 启动 Rust 后端服务器
- ✅ 保存端口配置到 `.dev-ports.json`

**使用方法**:
```bash
start-backend-only.bat
```

---

### 3. `start-frontend-only.bat`
**仅启动前端服务** - 连接到已运行的后端

**功能**:
- ✅ 读取已保存的后端端口配置
- ✅ 自动更新前端 `.env`
- ✅ 启动前端开发服务器

**使用方法**:
```bash
# 先启动后端
start-backend-only.bat

# 在另一个终端启动前端
start-frontend-only.bat
```

---

### 4. `clear-ports.bat`
**清理端口缓存** - 强制重新分配端口

**使用场景**:
- 端口配置损坏
- 想要使用新的端口
- 排查端口相关问题时

**使用方法**:
```bash
clear-ports.bat
```

---

## 工作原理

### 端口管理机制

1. **端口分配**: `scripts/setup-dev-environment.js` 脚本负责
   - 检测从 3000 开始的可用端口
   - 前端端口: 自动分配（默认 3000）
   - 后端端口: 前端端口 + 1（默认 3001）

2. **端口持久化**: 配置保存在 `.dev-ports.json`
   ```json
   {
     "frontend": 3000,
     "backend": 3001,
     "timestamp": "2026-01-24T03:30:00.000Z"
   }
   ```

3. **端口复用**: 如果端口未被占用，下次启动会重用相同端口
   - 避免频繁更改端口
   - 保持开发环境一致性

4. **环境变量同步**:
   - 后端通过 `BACKEND_PORT` 环境变量读取
   - 前端通过 `frontend/.env` 文件同步
   - Vite 代理自动配置到正确的后端端口

---

## 常见问题

### Q1: 启动时提示端口被占用？
**A**: 脚本会自动查找下一个可用端口，无需手动处理。如果仍有问题，运行：
```bash
clear-ports.bat  # 清理端口缓存
```

### Q2: 前端无法连接后端？
**A**: 确保：
1. 后端服务正在运行
2. `frontend/.env` 中的 `BACKEND_PORT` 与实际后端端口一致
3. 或直接使用 `start-dev.bat` 同时启动前后端

### Q3: 想要使用固定端口？
**A**: 设置环境变量 `PORT`，脚本会使用该端口作为前端端口，后端端口 = PORT + 1：
```bash
# Windows CMD
set PORT=4000
start-dev.bat

# Windows PowerShell
$env:PORT="4000"
.\start-dev.bat

# Linux/Mac
PORT=4000 ./start-dev.sh
```

### Q4: 如何查看当前使用的端口？
**A**: 查看 `.dev-ports.json` 文件：
```bash
type .dev-ports.json  # Windows
cat .dev-ports.json   # Linux/Mac
```

### Q5: 并发工具 (concurrently) 未安装？
**A**: 安装开发依赖：
```bash
pnpm install -g concurrently
# 或
pnpm add -D concurrently
```

---

## 手动启动（不推荐）

如果确实需要手动启动，请按以下步骤：

### 步骤 1: 获取端口
```bash
node scripts/setup-dev-environment.js get
```

### 步骤 2: 设置环境变量
**Windows**:
```bash
set BACKEND_PORT=<从步骤1获取的后端端口>
set FRONTEND_PORT=<从步骤1获取的前端端口>
```

**Linux/Mac**:
```bash
export BACKEND_PORT=<后端端口>
export FRONTEND_PORT=<前端端口>
```

### 步骤 3: 更新前端 `.env`
```bash
echo BACKEND_PORT=%BACKEND_PORT%> frontend\.env
```

### 步骤 4: 启动服务
```bash
# 后端
cargo watch -w crates -x 'run --bin server'

# 前端（另一个终端）
cd frontend
pnpm run dev -- --port %FRONTEND_PORT% --host
```

---

## 技术细节

### 文件结构
```
vibe-kanban/
├── scripts/
│   └── setup-dev-environment.js  # 端口管理脚本
├── .dev-ports.json                # 端口配置缓存（自动生成）
├── frontend/
│   └── .env                       # 前端环境变量（自动更新）
├── start-dev.bat                  # Windows 完整启动脚本
├── start-dev.sh                   # Linux/Mac 完整启动脚本
├── start-backend-only.bat         # 仅后端启动
├── start-frontend-only.bat        # 仅前端启动
└── clear-ports.bat                # 清理端口缓存
```

### 端口优先级
1. `PORT` 环境变量（最高优先级）
2. `.dev-ports.json` 保存的端口（如果可用）
3. 自动分配的端口（从 3000 开始）

---

## 推荐工作流

### 开发流程
```bash
# 1. 启动完整开发环境（推荐）
start-dev.bat

# 2. 打开浏览器访问前端
# http://localhost:3000 (自动显示)

# 3. 开发完成后按 Ctrl+C 停止所有服务
```

### 调试流程（分离前后端）
```bash
# 终端 1: 启动后端
start-backend-only.bat

# 终端 2: 启动前端
start-frontend-only.bat

# 便于分别查看前后端日志
```

---

## 更新日志

- **2026-01-24**: 创建初始脚本
  - 添加 Windows 批处理脚本
  - 添加 Linux/Mac Bash 脚本
  - 实现端口自动管理
  - 添加使用文档
