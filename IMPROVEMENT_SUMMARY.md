# Vibe Kanban 项目改进方案 - 总结文档

**日期**: 2026-01-24
**状态**: 方案设计完成，待实施
**Git提交**: df5e0dd0

---

## 📋 执行摘要

本项目为Vibe Kanban制定了三个核心改进需求的完整方案，包括：
1. ✅ 寻找未汉化内容并添加英文原文
2. ✅ 使用系统文件选择器替代手动输入
3. ✅ 确保跨平台稳定运行

所有方案已完成设计，包括详细的实施步骤、测试用例和自动化测试方法。

---

## 📚 文档清单

### 核心文档（3个）

| 文档名称 | 页数 | 内容描述 | 用途 |
|---------|-----|---------|------|
| **IMPROVEMENT_PROPOSAL.md** | ~200行 | 三个需求的完整改进方案 | 实施指南 |
| **TEST_CASES.md** | ~400行 | 40+个详细测试用例 | 测试指导 |
| **UNTRANSLATED_CONTENT_SCAN_REPORT.md** | ~300行 | Agent扫描结果报告 | 汉化工作清单 |

### 辅助文档（4个，已存在）

| 文档名称 | 内容描述 |
|---------|---------|
| PROJECT_STRUCTURE_ANALYSIS.md | 项目结构完整分析 |
| CLEANUP_RECORD.md | 文件清理记录 |
| LOCALIZATION_DATA_MANAGEMENT.md | 数据管理汉化记录 |
| QUICKSTART.md / STARTUP_GUIDE.md | 快速启动指南 |

---

## 🎯 需求1：未汉化内容扫描

### 📊 扫描结果

**使用工具**: Agent (general-purpose)
**扫描范围**: `frontend/src` 所有 `.tsx` 和 `.ts` 文件
**发现**: **140+** 个硬编码英文字符串

### 优先级分布

| 优先级 | 数量 | 示例 |
|--------|------|------|
| **P0** | ~80+ | 按钮、标签、表格列等用户界面可见文本 |
| **P1** | ~10 | Toast错误/成功消息 |
| **P2** | ~50+ | aria-label、title属性等辅助功能 |

### 重点文件

1. **DiffCard.tsx** - 12处
   - Diff状态：Deleted, Renamed, Copied等
   - 操作按钮：Collapse, Expand, Open in IDE
   - 提示消息：文件大小、权限更改等

2. **SearchBar.tsx** - 2处
   - 搜索占位符：Search..., Search {project}...

3. **ExecutorConfigForm.tsx** - 2处
   - 保存按钮：Save Configuration
   - 错误提示：Schema not found

4. **RJSF组件** - 多处
   - SelectWidget：Not specified, Select an option...
   - ArrayFieldTemplate：Add Item, Remove item
   - KeyValueField：环境变量相关文本

5. **ElectricTestPage.tsx** - 20+处
   - 表格列标签：Name, ID, Type, Created等
   - 状态消息：Sync Error, Loading projects...

6. **Navbar.tsx** - 4处
   - 导航菜单：Projects, Docs, Support, Discord

7. **TaskPanel.tsx** - 多处
   - 面板标题：# Task, Base Agent
   - 时间单位：second, minute, hour, day等

### 实施步骤

**步骤1**: 批量添加翻译键
- 为每个识别的硬编码文本创建翻译键
- 组织到合理的命名空间
- 同时添加英文和中文翻译

**步骤2**: 更新组件
- 导入useTranslation hook
- 替换硬编码文本为t()函数调用
- 处理动态参数（如项目名称）

**步骤3**: 添加英文原文括号（可选）
- 为重要术语添加`_en`键
- 在组件中条件性显示英文括号
- 样式：`中文 (English Text)`

**步骤4**: 验证
- 运行应用检查所有界面
- 确认翻译正确显示
- 测试中英文切换

### 预计时间
- 扫描和分析：✅ 已完成（30分钟）
- 添加翻译：2-3小时
- 更新组件：2-3小时
- 测试验证：1小时
- **总计**: 5-7小时

---

## 🎯 需求2：文件选择器改进

### 当前问题

**RepoPathManagement.tsx:46**
```typescript
const newPath = prompt(
  `Enter the new path for repository "${repo.repo_name}":`,
  repo.path
);
```

**问题**：
- ❌ 用户体验差：手动输入完整路径
- ❌ 容易出错：路径格式、拼写错误
- ❌ 不直观：无法浏览文件系统
- ❌ 平台差异：Windows用`\`，Linux用`/`

### 解决方案

#### 创建useFilePicker Hook

**文件**: `frontend/src/hooks/useFilePicker.ts`

**功能**：
- 自动检测运行环境（Tauri/Electron/Web）
- 调用相应的文件选择API
- 统一的接口，支持文件和目录选择
- 自动fallback到手动输入（最后手段）

**API设计**：
```typescript
interface FilePickerOptions {
  type?: 'file' | 'directory';
  accept?: string;
  multiple?: boolean;
}

const { pickFile } = useFilePicker();

// 选择目录
const path = await pickFile({ type: 'directory' });

// 选择单个文件
const file = await pickFile({ type: 'file', accept: '.json' });

// 选择多个文件
const files = await pickFile({ multiple: true });
```

#### 更新受影响的组件

**1. RepoPathManagement.tsx**
- 移除prompt调用
- 使用pickFile选择目录
- 添加错误处理

**2. ConfigSourceManagement.tsx**
- 选择配置目录
- 同样的改进

**3. 其他可能需要的地方**
- FirstRunWizard.tsx（已部分实现）
- 任何其他路径输入的地方

### 跨平台处理

**Windows**:
- 支持UNC路径：`\\server\share`
- 支持盘符路径：`C:\path`
- 自动处理`\`和`/`

**Linux/macOS**:
- 使用正斜杠：`/path/to/dir`
- 支持`~`扩展
- 处理`.app`包（macOS）

### 测试用例

| 测试ID | 测试内容 | 优先级 |
|--------|---------|--------|
| TC-FP-001 | 基本功能测试 | P0 |
| TC-FP-002 | 取消操作 | P1 |
| TC-FP-003 | 无效路径 | P1 |
| TC-FP-004 | 有效Git仓库 | P0 |
| TC-FP-005 | 跨平台路径格式 | P1 |

### 预计时间
- 创建Hook：1小时
- 更新组件：1小时
- 后端API（如需要）：1小时
- 测试：1小时
- **总计**: 4-5小时

---

## 🎯 需求3：跨平台兼容性

### 当前状况

**项目大小**: 7.8GB
```
├── target/          5.2GB (Rust编译产物)
├── frontend/         1.8GB (主要是node_modules)
├── node_modules/     683MB (根依赖)
└── 其他              <100MB
```

### 跨平台差异

| 方面 | Windows | Linux | macOS |
|------|---------|-------|-------|
| 路径分隔符 | `\` 或 `/` | `/` | `/` |
| 路径根 | `C:\` | `/` | `/` |
| 行结束符 | `\r\n` | `\n` | `\n` |
| 大小写敏感 | 不敏感 | 敏感 | 不敏感 |
| 路径长度限制 | 260字符 | 255字节 | 255字节 |

### 解决方案

#### 1. 路径工具类

**文件**: `frontend/src/lib/pathUtils.ts`

**功能**：
- `normalizePath()` - 规范化路径
- `toPlatformPath()` - 转换为平台特定格式
- `isWindows()`, `isMacOS()`, `isLinux()` - 平台检测
- `isValidPath()` - 验证路径格式
- `isAbsolutePath()` - 检查是否为绝对路径
- `joinPath()` - 跨平台路径拼接

#### 2. 平台检测

**文件**: `frontend/src/lib/platform.ts`

**功能**：
- 检测操作系统类型
- 检测CPU架构
- 检测运行环境（Browser/Tauri/Electron）
- 提供平台特定的配置

#### 3. 后端路径处理

**文件**: `crates/utils/src/platform.rs`

**功能**：
- Rust路径规范化
- 平台特定路径验证
- 绝对路径检测
- 单元测试

#### 4. 测试策略

**CI/CD配置**：
```yaml
jobs:
  test-windows:
    runs-on: windows-latest
  test-linux:
    runs-on: ubuntu-latest
  test-macos:
    runs-on: macos-latest
```

**本地测试**：
```bash
# Docker容器测试
docker run --rm -v $(pwd):/app node:18 pnpm test

# WSL测试
./test-in-wsl.sh
```

### 测试用例

| 测试ID | 测试内容 | 优先级 |
|--------|---------|--------|
| TC-PP-001 | Windows路径处理 | P0 |
| TC-PP-002 | Linux路径处理 | P0 |
| TC-PP-003 | macOS路径处理 | P1 |
| TC-PP-004 | 跨平台兼容性 | P0 |

### 预计时间
- 工具类创建：2小时
- 平台检测：30分钟
- 更新路径处理代码：2-3小时
- 后端规范化：1-2小时
- 单元测试：2小时
- CI/CD配置：1小时
- **总计**: 7-10小时

---

## 📊 总体时间估算

| 需求 | 预计时间 | 优先级 |
|------|---------|--------|
| 需求1：未汉化内容扫描 | 5-7小时 | P0 |
| 需求2：文件选择器 | 4-5小时 | P0 |
| 需求3：跨平台兼容 | 7-10小时 | P0 |
| **总计** | **16-22小时** | - |

**建议工作量**: 2-3个工作日

---

## 🚀 推荐实施顺序

### 阶段1：基础改进（第1天）
- ✅ 扫描未汉化内容（已完成）
- ✅ 创建路径工具类（已设计）
- ✅ 创建useFilePicker Hook（已设计）

### 阶段2：功能实现（第2天）
- [ ] 实现文件选择器（需求2）
- [ ] 添加英文原文（需求1）
- [ ] 更新路径处理代码（需求3）

### 阶段3：测试验证（第3天）
- [ ] 编写单元测试
- [ ] 编写E2E测试
- [ ] 跨平台测试
- [ ] 文档更新

---

## 📝 待办事项清单

### 需求1：汉化改进
- [ ] 为140+个硬编码文本创建翻译键
- [ ] 更新所有涉及的组件
- [ ] 添加英文原文括号（可选）
- [ ] 验证翻译正确性

### 需求2：文件选择器
- [ ] 创建`useFilePicker` Hook
- [ ] 更新`RepoPathManagement.tsx`
- [ ] 更新`ConfigSourceManagement.tsx`
- [ ] 添加文件选择器测试

### 需求3：跨平台
- [ ] 创建`pathUtils.ts`
- [ ] 创建`platform.ts`
- [ ] 更新所有路径处理代码
- [ ] 添加Rust后端路径规范化
- [ ] 配置CI/CD多平台测试

---

## ✅ 验收标准

### 需求1验收
- [ ] 所有P0级别文本已翻译
- [ ] 重要术语显示英文原文括号
- [ ] 无硬编码英文字符串残留
- [ ] 翻译覆盖率100%

### 需求2验收
- [ ] 所有路径选择使用文件选择器
- [ ] 支持Windows/Linux/macOS
- [ ] 正确处理取消操作
- [ ] 正确验证路径有效性

### 需求3验收
- [ ] 在Windows上运行稳定
- [ ] 在Linux上运行稳定
- [ ] 在macOS上运行稳定
- [ ] 路径处理正确
- [ ] CI/CD测试全部通过

---

## 🔧 技术栈和工具

### 开发工具
- **Agent**: 用于自动化扫描和分析
- **Playwright**: E2E测试
- **Vitest**: 单元测试
- **ESLint**: 代码质量检查
- **Cargo watch**: 自动重新编译

### 测试工具
- **Jest**: 单元测试框架
- **React Testing Library**: 组件测试
- **Docker**: 容器化测试
- **GitHub Actions**: CI/CD

---

## 📞 相关文档索引

1. **IMPROVEMENT_PROPOSAL.md** - 完整改进方案
   - 需求1详细方案
   - 需求2详细方案
   - 需求3详细方案
   - 实施步骤和代码示例

2. **TEST_CASES.md** - 测试用例文档
   - 功能测试用例
   - 性能测试用例
   - 安全测试用例
   - 可访问性测试用例

3. **UNTRANSLATED_CONTENT_SCAN_REPORT.md** - 扫描报告
   - P0级别：80+条
   - P1级别：10条
   - P2级别：50+条
   - 详细修复建议

4. **PROJECT_STRUCTURE_ANALYSIS.md** - 项目结构
   - 目录结构
   - 开发脚本说明
   - 磁盘空间分析

5. **CLEANUP_RECORD.md** - 清理记录
   - 已删除的文件
   - 保留的文件
   - 维护建议

---

## 🎓 经验总结

### 使用Agent进行扫描的优势
1. **自动化**: 无需手动grep搜索
2. **智能化**: 能识别上下文并分类
3. **全面性**: 不会遗漏任何文件
4. **结构化输出**: 生成格式化报告

### 文档驱动开发的好处
1. **清晰的计划**: 知道要做什么
2. **可追溯**: 有完整的记录
3. **可协作**: 团队成员可以参考
4. **可维护**: 后续可以更新和改进

---

## 📌 下一步行动

### 选项A：开始实施
如果准备好开始实施，可以：
1. 从需求1开始（添加翻译键）
2. 按照推荐的顺序进行
3. 使用Task工具跟踪进度

### 选项B：进一步细化
如果需要更详细的实施指南：
1. 为每个需求创建Task
2. 生成具体的代码修改diff
3. 创建详细的测试脚本

### 选项C：其他需求
如果有其他需求或问题：
1. 继续完善现有方案
2. 添加新的需求分析
3. 优化实施计划

---

## 📊 项目健康度

当前项目状态评估：

| 方面 | 状态 | 说明 |
|------|------|------|
| **代码质量** | ✅ 良好 | 结构清晰，有类型保护 |
| **国际化** | ⚠️ 部分 | 数据管理已汉化，其他待完成 |
| **文档** | ✅ 完善 | 有完整的文档体系 |
| **测试覆盖** | ⚠️ 待提升 | 需要添加自动化测试 |
| **跨平台** | ⚠️ 部分 | 需要改进路径处理 |
| **用户体验** | ⚠️ 部分 | 需要改进文件选择器 |

---

## 🎯 长期目标

基于本次分析，项目的长期改进方向：

1. **完善国际化** - 100%汉化覆盖
2. **提升用户体验** - 原生文件选择器
3. **跨平台稳定** - Windows/Linux/macOS无缝运行
4. **自动化测试** - CI/CD全覆盖
5. **性能优化** - 减少编译时间和文件大小

---

## 📝 变更日志

| 日期 | 版本 | 变更内容 |
|------|------|---------|
| 2026-01-24 | 1.0 | 初始版本，完成三个需求方案设计 |
| 2026-01-24 | 1.1 | 添加测试用例文档 |
| 2026-01-24 | 1.2 | 完成未汉化内容扫描 |
| 2026-01-24 | 1.3 | 添加项目结构分析和清理记录 |

---

**文档状态**: ✅ 完成
**准备状态**: ✅ 可以开始实施
**Git提交**: df5e0dd0
