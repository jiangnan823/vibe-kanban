# 快速开始 - Vibe Kanban 开发环境

## 系统要求

确保你的系统已安装：
- **Node.js** >= 18
- **pnpm** >= 8
- **Rust/Cargo** (通过 https://rustup.rs/ 安装)

---

## Windows 用户

### 一键启动（推荐）
双击运行：
```
start-dev.bat
```

或命令行：
```cmd
start-dev.bat
```

### 分离启动（高级调试）
```cmd
# 终端 1: 只启动后端
start-backend-only.bat

# 终端 2: 只启动前端
start-frontend-only.bat
```

### 清理端口缓存
```cmd
clear-ports.bat
```

---

## Linux / macOS 用户

### 一键启动
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### 分离启动
```bash
# 终端 1
./start-backend-only.sh

# 终端 2
./start-frontend-only.sh
```

### 清理端口缓存
```bash
./clear-ports.sh
```

---

## 启动后

服务地址会在控制台显示：
```
==========================================
服务信息:
  前端: http://localhost:3006
  后端: http://localhost:3007
==========================================
```

自动打开浏览器访问前端即可。

---

## 工作原理

1. **自动端口分配** - 从 3000 开始查找可用端口
2. **端口持久化** - 保存到 `.dev-ports.json`
3. **环境同步** - 自动更新 `frontend/.env`
4. **端口对应** - 前后端端口自动匹配

---

## 故障排除

### Rust 未安装
```
[错误] 未找到 Rust/Cargo
```
**解决**: 访问 https://rustup.rs/ 安装 Rust

### 端口被占用
脚本会自动查找下一个可用端口，无需手动处理。

### 前端无法连接后端
1. 确保两个服务都在运行
2. 使用 `start-dev.bat` 同时启动
3. 或检查 `frontend/.env` 中的 `BACKEND_PORT`

---

## 查看详细文档

- `STARTUP_GUIDE.md` - 详细使用指南
- `README.md` - 项目文档
