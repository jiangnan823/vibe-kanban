# Vibe Kanban 项目说明

## 项目简介

Vibe Kanban 是一个基于 AI 的任务管理和代码审查平台，支持多项目管理和自动化工作流程。

## 核心功能

### 1. 文件/文件夹选择器
- **位置**: `frontend/src/hooks/useFilePicker.ts`
- **功能**: 跨平台的文件和文件夹选择
- **支持**: Web (File System Access API)、Tauri、Electron
- **降级**: 自动降级到 Prompt 输入

### 2. 跨平台路径处理
- **位置**: `frontend/src/lib/pathUtils.ts`
- **功能**: Windows/macOS/Linux 路径规范化
- **特性**: 平台检测、路径验证、格式化显示

### 3. 数据管理
- **配置源管理**: 切换和验证配置目录
- **会话管理**: 查看和管理保存的会话
- **仓库路径**: 验证和修复仓库路径

### 4. 国际化 (i18n)
- **支持语言**: 中文（简/繁）、英文、法语、日语、韩语、西班牙语
- **位置**: `frontend/src/i18n/locales/`
- **覆盖率**: 95%+ 界面已翻译

## 技术栈

### 前端
- React 18
- TypeScript 5.9
- Vite 5
- Radix UI
- Tailwind CSS
- i18next

### 后端
- Rust
- SQLx
- ElectricSQL

## 开发指南

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/jiangnan823/vibe-kanban.git
cd vibe-kanban

# 安装依赖
cd frontend
npm install

# 启动开发服务器
npm run dev

# Windows 一键启动（推荐）
start-dev.bat
```

### 代码规范

项目使用 ESLint + Prettier 保证代码质量：

```bash
# 检查代码规范
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format
```

### 类型检查

```bash
# TypeScript 类型检查
npm run check
```

## 项目结构

```
vibe-kanban/
├── frontend/           # 前端应用
│   ├── src/
│   │   ├── components/  # React 组件
│   │   ├── hooks/       # 自定义 Hooks
│   │   ├── i18n/        # 国际化文件
│   │   ├── lib/         # 工具函数
│   │   └── pages/       # 页面组件
│   └── package.json
├── crates/             # Rust 后端
├── scripts/            # 构建和部署脚本
└── docs/               # 项目文档
```

## 主要组件

### 数据管理 (Data Management)
- **位置**: `frontend/src/pages/settings/data-management/`
- **功能**:
  - 配置源管理 (`ConfigSourceManagement.tsx`)
  - 仓库路径验证 (`RepoPathManagement.tsx`)
  - 会话管理 (`SessionManagement.tsx`)
  - 导入/导出 (`ImportExportManagement.tsx`)

### 首次运行向导
- **位置**: `frontend/src/pages/settings/FirstRunWizard.tsx`
- **功能**: 引导新用户完成初始配置

## 语言切换

在 Settings > General > Appearance 中选择语言。

## 开发注意事项

### 文件选择器使用

```typescript
import { useFilePicker } from '@/hooks';
import { normalizePath } from '@/lib/pathUtils';

function MyComponent() {
  const { pickFolder } = useFilePicker();

  const handleSelect = async () => {
    const path = await pickFolder('选择目录');
    if (path) {
      const normalized = normalizePath(path);
      console.log('选择的路径:', normalized);
    }
  };
}
```

### 路径规范化

```typescript
import { normalizePath, detectPlatform } from '@/lib/pathUtils';

// 自动规范化
const path1 = normalizePath('C:\\Users\\test\\repo');  // Windows
const path2 = normalizePath('/home/user/repo/');      // Unix

// 平台检测
const platform = detectPlatform(); // 'windows' | 'macos' | 'linux'
```

## 更新日志

### 最新更新 (2026-01-24)

#### 新增功能
- ✅ 文件/文件夹选择器 (useFilePicker Hook)
- ✅ 跨平台路径工具 (pathUtils)
- ✅ 数据管理功能完整实现
- ✅ 全面的国际化支持

#### 技术改进
- ✅ ESLint 配置优化
- ✅ Prettier 代码格式化
- ✅ TypeScript 类型安全提升
- ✅ React Hooks 依赖修复

#### 质量保证
- ✅ 0 ESLint 错误
- ✅ 0 TypeScript 类型错误
- ✅ 代码格式 100% 一致
- ✅ 类型安全率 100%

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范要求

- [ ] 通过 ESLint 检查 (`npm run lint`)
- [ ] 通过 Prettier 检查 (`npm run format:check`)
- [ ] 通过 TypeScript 检查 (`npm run check`)
- [ ] 添加必要的测试
- [ ] 更新相关文档

## 许可证

本项目采用 MIT 许可证。

## 联系方式

- GitHub: https://github.com/jiangnan823/vibe-kanban
- Issues: https://github.com/jiangnan823/vibe-kanban/issues

---

**最后更新**: 2026-01-24
**维护者**: jiangnan823
