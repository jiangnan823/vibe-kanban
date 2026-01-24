# Vibe Kanban 项目结构分析报告

**生成时间**: 2026-01-24
**项目路径**: `E:\练手项目\vibe-kanban`

---

## 📁 项目目录结构

```
vibe-kanban/
├── 📄 核心配置文件
│   ├── Cargo.toml              # Rust项目配置
│   ├── Cargo.lock              # Rust依赖锁定
│   ├── package.json            # Node.js项目配置
│   ├── pnpm-lock.yaml          # pnpm依赖锁定
│   ├── .gitignore              # Git忽略规则
│   ├── .npmrc                  # npm配置
│   ├── .nvmrc                  # Node版本管理
│   ├── rust-toolchain.toml     # Rust工具链配置
│   └── rustfmt.toml            # Rust代码格式化配置
│
├── 📂 核心源码目录
│   ├── crates/                 # Rust后端代码
│   │   ├── server/            # 服务器主程序
│   │   ├── db/                # 数据库模型
│   │   ├── services/          # 业务服务
│   │   ├── utils/             # 工具函数
│   │   ├── executors/         # 执行器
│   │   ├── deployment/        # 部署相关
│   │   ├── local-deployment/  # 本地部署
│   │   ├── remote/            # 远程部署
│   │   └── review/            # 代码审查
│   │
│   └── frontend/              # React前端代码
│       ├── src/               # 源代码
│       ├── public/            # 静态资源
│       ├── package.json       # 前端依赖
│       └── vite.config.ts     # Vite配置
│
├── 🔧 开发脚本
│   ├── start-dev.bat          # Windows开发环境启动
│   ├── start-dev.sh           # Linux/Mac开发环境启动
│   ├── start-backend-only.bat # 仅启动后端（Windows）
│   ├── start-frontend-only.bat # 仅启动前端（Windows）
│   ├── clear-ports.bat        # 清理端口缓存
│   ├── local-build.sh         # 本地构建脚本
│   └── sync-fork.sh           # 同步fork仓库
│
├── 🧪 测试脚本
│   ├── test-apis.sh           # API测试脚本
│   ├── test-complete.sh       # 完整测试脚本
│   └── test-simple.sh         # 简单测试脚本
│
├── 📚 文档文件（11个MD文件）
│   ├── README.md              # 项目主文档
│   ├── QUICKSTART.md          # 快速开始指南 ⭐ 新增
│   ├── STARTUP_GUIDE.md       # 详细启动指南 ⭐ 新增
│   ├── AGENTS.md              # 代理相关文档
│   ├── WORKFLOW.md            # 工作流文档
│   ├── CLAUDE.md              # Claude AI配置
│   ├── CONFIG-ANALYSIS.md     # 配置分析
│   ├── IMPLEMENTATION_SUMMARY.md   # 实现总结
│   ├── MODIFICATION_SUMMARY.md     # 修改总结
│   ├── LOCALIZATION_DATA_MANAGEMENT.md # 汉化记录 ⭐ 新增
│   └── CODE-OF-CONDUCT.md     # 行为准则
│
├── 🗄️ 数据和资产
│   ├── dev_assets_seed/       # 开发资产种子
│   ├── assets/                # 项目资产
│   └── .sqlx/                 # SQLx离线数据（数据库迁移）
│
├── 🐳 容器化
│   ├── Dockerfile             # Docker镜像构建
│   └── .dockerignore          # Docker忽略规则
│
└── 📦 其他
    ├── docs/                  # 项目文档
    ├── .github/               # GitHub配置
    ├── npx-cli/               # npx CLI工具
    └── remote-frontend/       # 远程前端（可能已废弃）
```

---

## 📜 开发脚本说明

### Windows开发脚本

| 脚本文件 | 功能 | 使用场景 |
|---------|------|---------|
| `start-dev.bat` | 一键启动前后端开发环境 | ⭐ **日常开发使用** |
| `start-backend-only.bat` | 仅启动后端 | 单独调试后端 |
| `start-frontend-only.bat` | 仅启动前端 | 单独调试前端 |
| `clear-ports.bat` | 清理端口缓存 | 端口冲突时使用 |

### Linux/Mac开发脚本

| 脚本文件 | 功能 | 使用场景 |
|---------|------|---------|
| `start-dev.sh` | 一键启动前后端开发环境 | ⭐ **日常开发使用** |
| `local-build.sh` | 本地构建npx包 | 发布npx包 |
| `sync-fork.sh` | 同步上游fork仓库 | 与上游同步 |

### 测试脚本

| 脚本文件 | 功能 |
|---------|------|
| `test-apis.sh` | 测试API接口 |
| `test-complete.sh` | 完整功能测试 |
| `test-simple.sh` | 简单功能测试 |

---

## 📖 文档说明

### 官方文档（上游）

| 文档 | 说明 | 维护者 |
|------|------|--------|
| `README.md` | 项目主文档 | BloopAI |
| `CODE-OF-CONDUCT.md` | 社区行为准则 | BloopAI |
| `AGENTS.md` | AI代理使用指南 | BloopAI |
| `WORKFLOW.md` | 工作流程说明 | BloopAI |

### 本地文档（自建）

| 文档 | 说明 | 创建时间 |
|------|------|---------|
| `QUICKSTART.md` | 快速启动指南 | 2026-01-24 ⭐ |
| `STARTUP_GUIDE.md` | 详细启动文档 | 2026-01-24 ⭐ |
| `CONFIG-ANALYSIS.md` | 配置分析文档 | 2026-01-23 |
| `IMPLEMENTATION_SUMMARY.md` | 功能实现总结 | 2026-01-21 |
| `MODIFICATION_SUMMARY.md` | 项目修改总结 | 2026-01-22 |
| `LOCALIZATION_DATA_MANAGEMENT.md` | 汉化工作记录 | 2026-01-24 ⭐ |

**推荐阅读顺序**：
1. `README.md` - 了解项目概况
2. `QUICKSTART.md` - 快速启动开发环境
3. `STARTUP_GUIDE.md` - 深入了解配置选项
4. `LOCALIZATION_DATA_MANAGEMENT.md` - 查看最近的汉化工作

---

## 🚀 NPM Scripts 命令

### 开发命令

```bash
# Windows - 启动开发环境（推荐）
pnpm run dev:windows

# Linux/Mac - 启动开发环境
pnpm run dev

# 仅启动后端（带自动重载）
pnpm run backend:dev:watch        # Linux/Mac
pnpm run backend:dev:watch:windows # Windows

# 仅启动前端
pnpm run frontend:dev
```

### 构建命令

```bash
# 构建npx CLI包
pnpm run build:npx

# 生成类型定义
pnpm run generate-types

# 准备数据库
pnpm run prepare-db
```

### 代码质量

```bash
# 代码检查
pnpm run check

# 代码格式化
pnpm run format

# 代码lint
pnpm run lint
```

---

## 🗑️ 可删除文件分析

### 临时/日志文件（建议删除）

| 文件/目录 | 大小 | 说明 | 建议操作 |
|----------|------|------|---------|
| `frontend.log` | 17KB | 前端运行日志 | ✅ 可删除 |
| `rustc-ice-*.txt` (4个) | ~60KB | Rust编译器崩溃报告 | ✅ 可删除 |
| `nul` | 452B | Windows空设备文件（误创建） | ✅ 可删除 |
| `.sqlx/` | - | SQLx离线数据缓存 | ⚠️ 开发需要，可删除但会重新生成 |
| `server-linux-x64` | 40MB | Linux二进制文件 | ⚠️ 保留作为备份 |
| `remote-frontend/` | - | 远程前端目录（可能已废弃） | ❓ 需确认是否使用 |

### 依赖/构建产物（谨慎删除）

| 目录 | 大小 | 说明 | 建议 |
|------|------|------|------|
| `node_modules/` | 683MB | npm依赖 | ⚠️ 可删除，需运行 `pnpm install` 恢复 |
| `target/` | - | Rust编译产物 | ⚠️ 可删除，需重新编译 |
| `.cargo/` | - | Cargo缓存 | ⚠️ 可删除，但会重新下载依赖 |

---

## 📊 磁盘空间统计

```
总大小估算：
├── node_modules/        683 MB  ⚠️ 最大
├── target/             ~500 MB  （估算，Rust编译产物）
├── server-linux-x64      40 MB  （Linux二进制）
├── 前端构建产物         ~100 MB  （估算）
└── 其他文件             ~200 MB

总计：约 1.5 GB
```

---

## 🧹 建议的清理操作

### 安全清理（推荐）

```powershell
# 1. 删除日志文件
Remove-Item frontend.log
Remove-Item rustc-ice-*.txt
Remove-Item nul

# 2. 清理端口缓存（如果存在）
Remove-Item .dev-ports.json

# 3. 清理SQLx缓存（可选）
Remove-Item -Recurse -Force .sqlx
```

### 深度清理（需要重新安装/编译）

```powershell
# ⚠️ 会删除node_modules，需要重新运行 pnpm install
Remove-Item -Recurse -Force node_modules

# ⚠️ 会删除Rust编译产物，需要重新编译
Remove-Item -Recurse -Force target

# ⚠️ 会删除Cargo缓存，会重新下载依赖
Remove-Item -Recurse -Force .cargo
```

### 不建议删除

```
✅ server-linux-x64     - 保留作为Linux备份
✅ remote-frontend/     - 除非确定不使用
✅ docs/                - 项目文档
✅ assets/              - 项目资产
✅ dev_assets_seed/     - 开发种子数据
```

---

## ⚡ 快速参考

### 日常开发流程

```powershell
# 1. 启动开发环境（一键启动）
.\start-dev.bat

# 或者分步启动
.\start-backend-only.bat    # 终端1
.\start-frontend-only.bat   # 终端2
```

### 修改代码后的操作

| 修改类型 | 操作 | 是否需要重新编译 |
|---------|------|----------------|
| 前端代码 | 保存即可 | ❌ 否（Vite自动热重载） |
| 后端代码 | cargo watch自动检测 | ✅ 是（自动重新编译） |
| 配置文件 | 重启服务 | ❌ 否 |

### 常见问题

**Q: 端口被占用怎么办？**
```powershell
.\clear-ports.bat
```

**Q: 如何仅测试前端？**
```powershell
.\start-frontend-only.bat
```

**Q: 如何编译Windows版本？**
```powershell
cargo build --release
# 输出：target/release/vibe-kanban.exe
```

**Q: 如何编译Linux版本（在WSL中）？**
```bash
cd /mnt/e/练手项目/vibe-kanban
cargo build --release
# 输出：target/release/vibe-kanban
```

---

## 📝 项目配置要点

### 关键环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `FRONTEND_PORT` | 前端端口 | 自动分配（从3000开始） |
| `BACKEND_PORT` | 后端端口 | 前端端口+1 |
| `VK_ALLOWED_ORIGINS` | 允许的CORS源 | 自动设置 |
| `RUST_LOG` | Rust日志级别 | debug |
| `HOST` | 后端绑定地址 | 127.0.0.1 |

### 端口配置文件

```json
// .dev-ports.json
{
  "frontend": 3006,
  "backend": 3007
}
```

---

## 🔗 相关链接

- **上游仓库**: https://github.com/BloopAI/vibe-kanban
- **文档网站**: https://vibekanban.com/docs
- **你的仓库**: https://github.com/jiangnan823/vibe-kanban

---

## 📌 总结

### 项目特点
- ✅ Rust后端 + React前端
- ✅ 支持Windows/Linux/Mac
- ✅ 完善的开发脚本
- ✅ 自动化编译（cargo watch）
- ✅ 热重载（前端Vite）
- ✅ 中文本地化（已完成）

### 开发建议
1. **日常开发**: 使用 `start-dev.bat` 一键启动
2. **后端修改**: cargo watch会自动重新编译
3. **前端修改**: Vite自动热重载，无需刷新
4. **定期清理**: 删除日志文件和临时文件
5. **版本控制**: 及时提交代码，保留重要文档

### 文档维护
- ✅ 保留了所有自建文档
- ✅ 文档结构清晰，易于查找
- ✅ 记录了重要的开发过程
