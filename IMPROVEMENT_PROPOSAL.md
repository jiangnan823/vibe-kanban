# Vibe Kanban 改进方案文档

**日期**: 2026-01-24
**版本**: 1.0
**状态**: 方案设计阶段

---

## 📋 需求概述

### 需求1：寻找未汉化内容并添加英文原文
**目标**：全面检查项目中的硬编码英文文本，为重要的中文翻译添加英文原文括号

### 需求2：使用系统文件选择器替代手动输入
**目标**：将所有手动输入路径的地方改为使用系统原生文件/文件夹选择器

### 需求3：确保跨平台稳定运行
**目标**：验证并确保项目在Windows/Linux/macOS上稳定运行

---

## 🎯 需求1：寻找未汉化内容并添加英文原文

### 1.1 问题分析

**当前状况**：
- ✅ 已完成数据管理页面的汉化
- ❓ 其他页面可能存在硬编码英文
- ❌ 重要术语缺少英文原文参考

### 1.2 解决方案

#### 方案A：自动化搜索硬编码文本

**工具**：使用Grep和正则表达式

**搜索范围**：
```
frontend/src/
├── components/
├── pages/
├── contexts/
└── lib/
```

**搜索模式**：
```bash
# 1. 搜索JSX中的硬编码英文字符串
grep -r "\"[A-Z][a-zA-Z ]+\"" frontend/src --include="*.tsx" --include="*.ts"

# 2. 搜索toast通知中的英文
grep -r "toast\.(error|success|warning|info)" frontend/src --include="*.tsx" -A 1

# 3. 搜索placeholder文本
grep -r "placeholder=" frontend/src --include="*.tsx" | grep -v "t("

# 4. 搜索AlertDialog/confirm中的英文
grep -r "confirm(" frontend/src --include="*.tsx" -A 1
```

**优先级分类**：

| 优先级 | 类型 | 示例 | 是否需要英文括号 |
|--------|------|------|-----------------|
| P0 | 按钮文本 | "Submit", "Cancel" | ✅ 是 |
| P0 | 错误提示 | "Failed to load" | ✅ 是 |
| P1 | 表单标签 | "Email", "Password" | ⚠️ 视情况 |
| P2 | 日志输出 | console.log | ❌ 否 |
| P2 | 技术术语 | "API", "JSON" | ❌ 否 |

#### 方案B：定义重要术语列表

**需要添加英文原文的场景**：

```typescript
// 场景1：技术术语或新概念
{t('settings.general.dataManagement.title')}
// 数据管理 (Data Management)

// 场景2：关键操作按钮
{t('common.buttons.submit')}
// 提交 (Submit)

// 场景3：重要的警告信息
{t('settings.backup.warning')}
// 警告：此操作不可撤销 (Warning: This action cannot be undone)
```

**不需要添加英文原文的场景**：

```typescript
// ❌ 通用词汇
"确定" - 不需要 (OK)

// ❌ 技术缩写
"API" - 不需要翻译

// ❌ 已广泛接受的术语
"数据库" - 不需要 (Database)
```

#### 方案C：修改国际化文件结构

**当前结构**：
```json
{
  "settings": {
    "dataManagement": {
      "title": "数据管理"
    }
  }
}
```

**改进后的结构（添加英文原文）**：
```json
{
  "settings": {
    "dataManagement": {
      "title": "数据管理",
      "title_en": "Data Management",
      "description": "管理配置、会话和仓库路径",
      "description_en": "Manage configuration, sessions, and repository paths"
    }
  }
}
```

**或在组件中使用括号**：
```typescript
<CardTitle>
  {t('settings.general.dataManagement.title')}
  {showEnglish && <span className="text-xs text-muted-foreground ml-2">
    ({t('settings.general.dataManagement.title_en')})
  </span>}
</CardTitle>
```

### 1.3 实施步骤

**步骤1：扫描所有组件文件**
```bash
# 使用Agent执行全面扫描
frontend/src/components/
frontend/src/pages/
frontend/src/contexts/
```

**步骤2：生成未汉化内容报告**
- 创建 `UNTRANSLATED_CONTENT_REPORT.md`
- 按页面和优先级分类
- 提供具体的文件位置和行号

**步骤3：批量添加英文原文**
- 为重要的翻译添加 `_en` 键
- 或在组件中添加条件性显示的英文括号

**步骤4：验证翻译质量**
- 检查术语一致性
- 确保没有遗漏

### 1.4 测试用例

#### 测试用例1.1：UI文本扫描

```yaml
测试名称: 扫描所有UI组件中的硬编码英文
前置条件: 项目代码完整
测试步骤:
  1. 运行扫描脚本
  2. 检查生成的报告
  3. 验证所有硬编码文本被识别
预期结果:
  - 生成完整的未汉化文本列表
  - 包含文件路径和行号
  - 按优先级分类
```

#### 测试用例1.2：英文原文显示

```yaml
测试名称: 验证重要术语显示英文原文
前置条件: 已添加英文原文键
测试步骤:
  1. 启动开发环境
  2. 切换到中文界面
  3. 检查重要术语是否显示英文括号
测试数据:
  - 设置页面标题
  - 关键操作按钮
  - 警告提示信息
预期结果:
  - 重要术语后面显示(English Text)
  - 英文原文使用较小字体
  - 不影响布局
```

#### 测试用例1.3：翻译切换

```yaml
测试名称: 验证中英文切换正常
前置条件: 已实现双语显示
测试步骤:
  1. 在中文界面检查英文括号
  2. 切换到英文界面
  3. 确认只显示英文，无重复
预期结果:
  - 中文界面: "数据管理 (Data Management)"
  - 英文界面: "Data Management"
```

### 1.5 自动化测试方法

#### 方法1：ESLint自定义规则

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-hardcoded-english': 'warn',
    'require-english-translation': 'error'
  }
};
```

**自定义规则实现**：
```javascript
// eslint-rules/no-hardcoded-english.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded English text in JSX'
    }
  },
  create(context) {
    return {
      Literal(node) {
        // 检测英文字符串
        if (/^[A-Z][a-zA-Z\s]+$/.test(node.value)) {
          context.report({
            node,
            message: 'Hardcoded English text found. Use t() function instead.'
          });
        }
      }
    };
  }
};
```

#### 方法2：TypeScript类型检查

```typescript
// 强制使用翻译函数
type TranslatedString = string & { __translated: true };

function translate(key: string): TranslatedString {
  return t(key) as TranslatedString;
}

// 这样可以在编译时检测未翻译的文本
// const title: TranslatedString = "Data Management"; // ❌ 编译错误
// const title: TranslatedString = translate('dataManagement.title'); // ✅ 正确
```

#### 方法3：自动化测试脚本

```bash
#!/bin/bash
# test-translation-coverage.sh

echo "扫描未翻译的硬编码文本..."

# 查找所有tsx/ts文件
find frontend/src -name "*.tsx" -o -name "*.ts" | while read file; do
  # 检查是否包含硬编码英文
  if grep -E '"[A-Z][a-zA-Z ]+"' "$file" > /dev/null; then
    echo "发现硬编码英文: $file"
    grep -n -E '"[A-Z][a-zA-Z ]+"' "$file"
  fi
done

echo "扫描完成"
```

---

## 🎯 需求2：使用系统文件选择器替代手动输入

### 2.1 问题分析

**当前实现的问题**：

**文件**: `RepoPathManagement.tsx:46`
```typescript
const newPath = prompt(
  `Enter the new path for repository "${repo.repo_name}":`,
  repo.path
);
```

**问题**：
- ❌ 用户体验差：需要手动输入完整路径
- ❌ 容易出错：路径格式、拼写错误
- ❌ 不直观：无法浏览文件系统
- ❌ 平台差异：Windows用`\`，Linux用`/`

**类似问题位置**：
1. `RepoPathManagement.tsx` - 修复仓库路径
2. `ConfigSourceManagement.tsx` - 选择配置目录
3. 其他可能需要选择路径的地方

### 2.2 解决方案

#### 方案A：使用Tauri API（桌面应用）

**适用场景**: 打包为桌面应用时

```typescript
// 检测是否在Tauri环境中
const selectFolder = async () => {
  if (window.__TAURI__) {
    // 使用Tauri的文件选择API
    const selected = await open({
      directory: true,
      multiple: false,
    });
    return selected;
  } else {
    // Fallback到Web实现
    return showWebFolderPicker();
  }
};
```

#### 方案B：使用HTML5 File API（Web应用）

**适用场景**: 浏览器中运行

```typescript
const showWebFolderPicker = async (): Promise<string | null> => {
  try {
    // 使用showDirectoryPicker API（仅现代浏览器支持）
    if ('showDirectoryPicker' in window) {
      const dirHandle = await (window as any).showDirectoryPicker();
      return dirHandle.name; // 注意：只能获取目录名，无法获取完整路径
    } else {
      // Fallback: 使用input元素
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.onchange = (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files && files.length > 0) {
            // 从第一个文件中提取路径
            const path = files[0].webkitRelativePath.split('/')[0];
            resolve(path);
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    }
  } catch (error) {
    console.error('Failed to show folder picker:', error);
    // 最终fallback: prompt输入
    const path = prompt('请输入目录路径:');
    return path;
  }
};
```

#### 方案C：统一的文件选择器Hook

**创建可复用的Hook**：

```typescript
// frontend/src/hooks/useFilePicker.ts
import { useCallback } from 'react';

interface FilePickerOptions {
  type?: 'file' | 'directory';
  accept?: string;
  multiple?: boolean;
}

export function useFilePicker() {
  const pickFile = useCallback(async (
    options: FilePickerOptions = {}
  ): Promise<string | string[] | null> => {
    const { type = 'file', accept, multiple = false } = options;

    // 1. 尝试使用Tauri API（桌面应用）
    if (window.__TAURI__) {
      const { open } = await import('@tauri-apps/api/dialog');
      const selected = await open({
        directory: type === 'directory',
        multiple: multiple,
        filters: accept ? [{ name: 'Files', extensions: [accept] }] : undefined,
      });
      return selected;
    }

    // 2. 使用现代浏览器API
    if (type === 'directory' && 'showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        // 注意：浏览器安全限制无法获取完整路径
        // 只能获取目录名，需要用户确认或使用其他方式
        const dirName = dirHandle.name;
        const confirmed = confirm(
          `您选择了: ${dirName}\n\n` +
          `由于浏览器安全限制，我们无法自动获取完整路径。\n` +
          `请手动输入完整路径，或点击"取消"使用其他方式。`
        );
        if (confirmed) {
          const fullPath = prompt(`请输入"${dirName}"的完整路径:`, `/path/to/${dirName}`);
          return fullPath;
        }
        return null;
      } catch (err) {
        // 用户取消
        return null;
      }
    }

    // 3. Fallback到input元素
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (type === 'directory') {
        input.webkitdirectory = 'true';
      }
      if (accept) {
        input.accept = accept;
      }
      if (multiple) {
        input.multiple = true;
      }
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          if (multiple) {
            const paths = Array.from(files).map(f => f.webkitRelativePath || f.name);
            resolve(paths);
          } else {
            const path = files[0].webkitRelativePath || files[0].name;
            resolve(path);
          }
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }, []);

  return { pickFile };
}
```

**使用示例**：

```typescript
// RepoPathManagement.tsx
import { useFilePicker } from '@/hooks/useFilePicker';

export function RepoPathManagement() {
  const { pickFile } = useFilePicker();

  const handleFixPath = async (repo: RepoValidationInfo) => {
    const newPath = await pickFile({ type: 'directory' });

    if (!newPath || typeof newPath !== 'string') {
      return; // 用户取消或无效选择
    }

    try {
      const response = await fetch(`/api/repos/${repo.repo_id}/fix-path`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_path: newPath }),
      });

      const data = await response.json();

      if (data.data.success) {
        toast.success(t('settings.general.dataManagement.toasts.pathUpdated'));
        await handleScan();
      } else {
        toast.error(data.data.message || t('settings.general.dataManagement.toasts.updateFailed'));
      }
    } catch (error) {
      toast.error(t('settings.general.dataManagement.toasts.failedToFixPath'));
      console.error(error);
    }
  };

  return (
    // ... JSX
    <Button onClick={() => handleFixPath(repo)}>
      <FolderOpen className="h-4 w-4 mr-2" />
      {t('settings.general.dataManagement.repos.selectPath')}
    </Button>
  );
}
```

### 2.3 跨平台考虑

#### Windows路径处理

```typescript
// 确保Windows路径格式正确
const normalizePath = (path: string): string => {
  // 统一使用正斜杠
  return path.replace(/\\/g, '/');
};

// 或者保持平台原生格式
const platformPath = path.replace(/\//g, '\\'); // Windows
```

#### 路径验证

```typescript
// 验证路径是否有效
const validatePath = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/data-management/validate-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    const result = await response.json();
    return result.valid;
  } catch {
    return false;
  }
};
```

### 2.4 测试用例

#### 测试用例2.1：文件选择器基本功能

```yaml
测试名称: 测试文件选择器打开和选择
前置条件:
  - 应用已启动
  - 用户在修复仓库路径页面
测试步骤:
  1. 点击"选择路径"按钮
  2. 验证文件选择器窗口打开
  3. 选择一个有效的目录
  4. 点击确认
预期结果:
  - 文件选择器正确打开
  - 选择的路径被正确填充
  - 路径格式正确
```

#### 测试用例2.2：取消选择

```yaml
测试名称: 测试取消文件选择
前置条件: 文件选择器已打开
测试步骤:
  1. 点击"选择路径"按钮
  2. 在文件选择器中点击"取消"
预期结果:
  - 对话框关闭
  - 路径输入框保持不变
  - 不显示错误提示
```

#### 测试用例2.3：无效路径处理

```yaml
测试名称: 测试选择无效路径的处理
测试步骤:
  1. 选择一个不是Git仓库的目录
  2. 点击确认
预期结果:
  - 显示错误提示
  - 路径不会被保存
  - 提示用户重新选择
```

#### 测试用例2.4：跨平台路径格式

```yaml
测试名称: 测试不同操作系统的路径格式
测试数据:
  - Windows: C:\Users\Username\project
  - Linux: /home/username/project
  - macOS: /Users/username/project
测试步骤:
  1. 在不同平台上选择相同的目录
  2. 验证路径格式正确
预期结果:
  - Windows路径使用反斜杠或正斜杠
  - Linux/macOS路径使用正斜杠
  - 后端能正确处理所有格式
```

### 2.5 自动化测试方法

#### 方法1：Playwright端到端测试

```typescript
// e2e/file-picker.spec.ts
import { test, expect } from '@playwright/test';

test.describe('File Picker', () => {
  test('should open file picker when clicking select path button', async ({ page }) => {
    await page.goto('/settings/repos');
    await page.click('button:has-text("选择路径")');

    // 验证文件选择器相关的事件被触发
    // 注意：Playwright无法直接测试系统文件选择器
    // 需要mock或使用其他方法
  });

  test('should handle selected path correctly', async ({ page }) => {
    // Mock file picker API
    await page.goto('/settings/repos');
    await page.evaluate(() => {
      window.mockFilePicker = () => '/mock/path/to/repo';
    });

    await page.click('button:has-text("选择路径")');
    await page.fill('input[name="path"]', '/valid/repo/path');
    await page.click('button:has-text("确认")');

    await expect(page.locator('.toast-success')).toBeVisible();
  });
});
```

#### 方法2：单元测试Hook

```typescript
// hooks/useFilePicker.test.ts
import { renderHook } from '@testing-library/react';
import { useFilePicker } from './useFilePicker';

describe('useFilePicker', () => {
  test('should return null when user cancels', async () => {
    const { result } = renderHook(() => useFilePicker());

    // Mock window.showDirectoryPicker to throw (user cancelled)
    global.window.showDirectoryPicker = jest.fn(() => Promise.reject(new Error('Abort')));

    const path = await result.current.pickFile({ type: 'directory' });
    expect(path).toBeNull();
  });

  test('should return selected path', async () => {
    const { result } = renderHook(() => useFilePicker());

    const mockPath = '/selected/path';
    global.window.showDirectoryPicker = jest.fn(() =>
      Promise.resolve({ name: 'path' })
    );

    // Mock prompt to return full path
    global.prompt = jest.fn(() => mockPath);

    const path = await result.current.pickFile({ type: 'directory' });
    expect(path).toBe(mockPath);
  });
});
```

#### 方法3：集成测试

```bash
#!/bin/bash
# test-file-picker-integration.sh

echo "测试文件选择器集成..."

# 测试1: 验证API端点存在
echo "测试1: 验证路径验证API"
curl -X POST http://localhost:3007/api/data-management/validate-path \
  -H "Content-Type: application/json" \
  -d '{"path": "/valid/path"}' \
  | jq .

# 测试2: 测试路径修复API
echo "测试2: 测试路径修复API"
REPO_ID="test-repo-id"
curl -X PUT "http://localhost:3007/api/repos/${REPO_ID}/fix-path" \
  -H "Content-Type: application/json" \
  -d '{"new_path": "/new/path"}' \
  | jq .

echo "集成测试完成"
```

---

## 🎯 需求3：确保跨平台稳定运行

### 3.1 问题分析

**跨平台差异**：

| 方面 | Windows | Linux | macOS |
|------|---------|-------|-------|
| 路径分隔符 | `\` 或 `/` | `/` | `/` |
| 路径根目录 | `C:\` | `/` | `/` |
| 行结束符 | `\r\n` | `\n` | `\n` |
| 文件权限 | ACL | chmod | chmod |
| 大小写敏感 | 不敏感 | 敏感（通常） | 不敏感（通常） |
| 文件名长度 | 260字符限制 | 255字节 | 255字节 |
| 特殊字符 | 不能用 `<>:"|?*` | 不能用 `/` 和 `\0` | 不能用 `:` 和 `/` |

### 3.2 解决方案

#### 方案A：路径规范化

**创建路径工具类**：

```typescript
// frontend/src/lib/pathUtils.ts

/**
 * 规范化路径以适应当前平台
 */
export function normalizePath(path: string): string {
  // 统一使用正斜杠（在所有平台上都能工作）
  return path.replace(/\\/g, '/');
}

/**
 * 转换为平台特定的路径格式
 */
export function toPlatformPath(path: string): string {
  if (isWindows()) {
    return path.replace(/\//g, '\\');
  }
  return path;
}

/**
 * 检查是否为Windows平台
 */
export function isWindows(): boolean {
  return navigator.platform.indexOf('Win') > -1;
}

/**
 * 检查是否为macOS平台
 */
export function isMacOS(): boolean {
  return navigator.platform.indexOf('Mac') > -1;
}

/**
 * 检查是否为Linux平台
 */
export function isLinux(): boolean {
  return navigator.platform.indexOf('Linux') > -1;
}

/**
 * 验证路径格式是否正确
 */
export function isValidPath(path: string): boolean {
  // 基本验证
  if (!path || path.trim().length === 0) {
    return false;
  }

  // Windows路径验证
  if (isWindows()) {
    // 允许: C:\path, C:/path, /path
    const windowsPathRegex = /^[a-zA-Z]:[\\/].+/;
    const uncPathRegex = /^\\\\[\\]+/;
    const unixPathRegex = /^\/.+/;

    return windowsPathRegex.test(path) ||
           uncPathRegex.test(path) ||
           unixPathRegex.test(path);
  }

  // Unix路径验证 (Linux/macOS)
  const unixPathRegex = /^\/[a-zA-Z0-9_\-./]+$/;
  return unixPathRegex.test(path);
}

/**
 * 检查路径是否为绝对路径
 */
export function isAbsolutePath(path: string): boolean {
  if (isWindows()) {
    return /^[a-zA-Z]:/.test(path) || path.startsWith('\\\\');
  }
  return path.startsWith('/');
}

/**
 * 路径拼接（跨平台）
 */
export function joinPath(...parts: string[]): string {
  const normalized = parts.map(normalizePath);
  const result = normalized.join('/');

  // 移除重复的斜杠
  return result.replace(/\/+/g, '/');
}
```

#### 方案B：环境检测和适配

```typescript
// frontend/src/lib/platform.ts

export interface PlatformInfo {
  os: 'windows' | 'linux' | 'macos' | 'unknown';
  arch: 'x86' | 'x64' | 'arm' | 'arm64' | 'unknown';
  isBrowser: boolean;
  isTauri: boolean;
  isElectron: boolean;
}

export function getPlatformInfo(): PlatformInfo {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  let os: PlatformInfo['os'] = 'unknown';
  if (platform.indexOf('Win') > -1) {
    os = 'windows';
  } else if (platform.indexOf('Mac') > -1) {
    os = 'macos';
  } else if (platform.indexOf('Linux') > -1) {
    os = 'linux';
  }

  let arch: PlatformInfo['arch'] = 'unknown';
  if (userAgent.includes('x86_64') || userAgent.includes('x64')) {
    arch = 'x64';
  } else if (userAgent.includes('i386') || userAgent.includes('x86')) {
    arch = 'x86';
  } else if (userAgent.includes('arm')) {
    arch = 'arm';
  } else if (userAgent.includes('aarch64')) {
    arch = 'arm64';
  }

  return {
    os,
    arch,
    isBrowser: typeof window !== 'undefined',
    isTauri: typeof window !== 'undefined' && '__TAURI__' in window,
    isElectron: typeof window !== 'undefined' && 'electron' in window,
  };
}

/**
 * 根据平台获取相应的命令或配置
 */
export function getPlatformConfig() {
  const platform = getPlatformInfo();

  const configs = {
    windows: {
      pathSeparator: '\\',
      lineEnding: '\r\n',
      shell: 'cmd.exe',
      filePicker: 'windows-file-picker',
    },
    linux: {
      pathSeparator: '/',
      lineEnding: '\n',
      shell: '/bin/bash',
      filePicker: 'linux-file-picker',
    },
    macos: {
      pathSeparator: '/',
      lineEnding: '\n',
      shell: '/bin/zsh',
      filePicker: 'macos-file-picker',
    },
  };

  return configs[platform.os] || configs.linux; // 默认使用Linux配置
}
```

#### 方案C：条件性导入和功能检测

```typescript
// frontend/src/lib/api.ts

// 根据环境选择不同的实现
let filePickerImpl: FilePickerImplementation;

if (typeof window !== 'undefined') {
  if ('__TAURI__' in window) {
    // Tauri环境
    filePickerImpl = await import('./filePicker/tauri');
  } else if ('electron' in window) {
    // Electron环境
    filePickerImpl = await import('./filePicker/electron');
  } else {
    // 浏览器环境
    filePickerImpl = await import('./filePicker/web');
  }
}

export const pickFile = filePickerImpl.pickFile;
```

### 3.3 后端跨平台处理

```rust
// crates/utils/src/platform.rs

use std::path::{Path, PathBuf};

/// 规范化路径以适应当前平台
pub fn normalize_path(path: &str) -> PathBuf {
    // 在Windows上，将正斜杠转换为反斜杠
    // 在Unix上，确保使用正斜杠
    #[cfg(windows)]
    {
        PathBuf::from(path.replace('/', "\\"))
    }

    #[cfg(not(windows))]
    {
        PathBuf::from(path.replace("\\", "/"))
    }
}

/// 验证路径是否有效
pub fn is_valid_path(path: &str) -> bool {
    let path = Path::new(path);

    // 检查路径是否为空
    if path.as_os_str().is_empty() {
        return false;
    }

    // 检查路径是否包含非法字符
    #[cfg(windows)]
    {
        let path_str = path.to_string_lossy();
        for ch in ['<', '>', ':', '"', '|', '?', '*'].iter() {
            if path_str.contains(*ch) {
                return false;
            }
        }
    }

    // 检查路径长度
    if path.as_os_str().len() > 260 {
        return false;
    }

    true
}

/// 检查路径是否为绝对路径
pub fn is_absolute_path(path: &str) -> bool {
    #[cfg(windows)]
    {
        // Windows: C:\ 或 UNC路径 \\server\share
        path.chars().nth(1) == Some(':') ||
        (path.starts_with("\\\\") && path.len() > 2)
    }

    #[cfg(not(windows))]
    {
        // Unix: 以 / 开头
        path.starts_with('/')
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_path_windows() {
        #[cfg(windows)]
        {
            assert_eq!(normalize_path("C:/Users/Test"), PathBuf::from("C:\\Users\\Test"));
        }
    }

    #[test]
    fn test_is_absolute_path() {
        #[cfg(windows)]
        assert!(is_absolute_path("C:\\Users\\Test"));

        #[cfg(not(windows))]
        assert!(is_absolute_path("/home/test"));
    }
}
```

### 3.4 测试用例

#### 测试用例3.1：Windows路径处理

```yaml
测试名称: 测试Windows路径格式处理
测试数据:
  - "C:\\Users\\Username\\project"
  - "C:/Users/Username/project"
  - "\\\\server\\share\\project"
测试步骤:
  1. 输入Windows格式的路径
  2. 调用normalizePath函数
  3. 验证路径被正确规范化
预期结果:
  - 所有反斜杠保持为反斜杠
  - 正斜杠被转换为反斜杠
  - UNC路径保持正确格式
```

#### 测试用例3.2：Linux路径处理

```yaml
测试名称: 测试Linux路径格式处理
测试数据:
  - "/home/username/project"
  - "/var/www/html"
测试步骤:
  1. 输入Unix格式的路径
  2. 调用normalizePath函数
  3. 验证路径格式正确
预期结果:
  - 路径使用正斜杠
  - 以根目录/开头
  - 没有反斜杠
```

#### 测试用例3.3：macOS路径处理

```yaml
测试名称: 测试macOS路径格式处理
测试数据:
  - "/Users/username/project"
  - "/Applications/MyApp.app"
测试步骤:
  1. 输入macOS格式的路径
  2. 验证.app路径处理
预期结果:
  - 路径格式正确
  - .app包被正确识别
```

#### 测试用例3.4：跨平台文件操作

```yaml
测试名称: 测试跨平台文件读写
测试步骤:
  1. 在Windows上创建测试文件
  2. 写入多行文本
  3. 读取文件并验证内容
  4. 在Linux上重复相同操作
  5. 验证行结束符正确处理
预期结果:
  - Windows: 行结束符为\r\n
  - Linux/macOS: 行结束符为\n
  - 文件内容在所有平台上一致
```

#### 测试用例3.5：文件权限处理

```yaml
测试名称: 测试文件权限在不同平台的表现
测试步骤:
  1. 创建一个新文件
  2. 设置可执行权限
  3. 验证权限在当前平台生效
预期结果:
  - Unix: chmod +x正常工作
  - Windows: 使用文件属性对话框
  - 权限检查考虑平台差异
```

### 3.5 自动化测试方法

#### 方法1：CI/CD多平台测试

```yaml
# .github/workflows/test-platforms.yml

name: Multi-Platform Tests

on: [push, pull_request]

jobs:
  test-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm run test
      - run: pnpm run build
      - name: Run Windows-specific tests
        run: pnpm run test:platform-windows

  test-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm run test
      - run: pnpm run build
      - name: Run Linux-specific tests
        run: pnpm run test:platform-linux

  test-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm run test
      - run: pnpm run build
      - name: Run macOS-specific tests
        run: pnpm run test:platform-macos
```

#### 方法2：Docker容器测试

```bash
#!/bin/bash
# test-all-platforms.sh

echo "在Docker容器中测试跨平台兼容性..."

# 测试Linux环境
echo "测试Linux环境..."
docker run --rm -v $(pwd):/app -w /app node:18 bash -c "
  pnpm install &&
  pnpm run test &&
  pnpm run build
"

# 测试Windows环境（需要Windows主机）
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
  echo "测试Windows环境..."
  pnpm install
  pnpm run test
  pnpm run build
fi

echo "跨平台测试完成"
```

#### 方法3：自动化路径测试套件

```typescript
// tests/platform/path-utils.test.ts
import { normalizePath, isWindows, isAbsolutePath } from '@/lib/pathUtils';

describe('Path Utils - Cross Platform', () => {
  describe('normalizePath', () => {
    test('should normalize Windows paths', () => {
      // Mock isWindows to return true
      vi.stubGlobal('navigator', {
        platform: 'Win32'
      });

      expect(normalizePath('C:/Users/Test')).toBe('C:\\Users\\Test');
      expect(normalizePath('C:\\Users\\Test')).toBe('C:\\Users\\Test');
    });

    test('should normalize Unix paths', () => {
      vi.stubGlobal('navigator', {
        platform: 'Linux'
      });

      expect(normalizePath('/home/test')).toBe('/home/test');
      expect(normalizePath('home\\test')).toBe('home/test');
    });
  });

  describe('isAbsolutePath', () => {
    test('should detect Windows absolute paths', () => {
      vi.stubGlobal('navigator', {
        platform: 'Win32'
      });

      expect(isAbsolutePath('C:\\Users\\Test')).toBe(true);
      expect(isAbsolutePath('\\\\server\\share')).toBe(true);
      expect(isAbsolutePath('relative\\path')).toBe(false);
    });

    test('should detect Unix absolute paths', () => {
      vi.stubGlobal('navigator', {
        platform: 'Linux'
      });

      expect(isAbsolutePath('/home/test')).toBe(true);
      expect(isAbsolutePath('relative/path')).toBe(false);
    });
  });
});
```

#### 方法4：自动化跨平台E2E测试

```typescript
// e2e/platform-compatibility.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Platform Compatibility', () => {
  test('should handle Windows-style paths', async ({ page }) => {
    await page.goto('/settings/data-management');

    // 输入Windows路径
    await page.fill('input[name="config-path"]', 'C:\\Users\\Test\\Config');
    await page.click('button:has-text("保存")');

    // 验证路径被正确保存
    await expect(page.locator('.saved-path')).toHaveText('C:\\Users\\Test\\Config');
  });

  test('should handle Unix-style paths', async ({ page }) => {
    await page.goto('/settings/data-management');

    // 输入Unix路径
    await page.fill('input[name="config-path"]', '/home/test/config');
    await page.click('button:has-text("保存")');

    // 验证路径被正确保存
    await expect(page.locator('.saved-path')).toHaveText('/home/test/config');
  });
});
```

---

## 📊 实施优先级和时间估算

### 需求1：未汉化内容扫描和英文原文

| 任务 | 优先级 | 预计时间 |
|------|--------|---------|
| 扫描所有组件文件 | P0 | 30分钟 |
| 生成未汉化报告 | P0 | 15分钟 |
| 添加英文原文键 | P1 | 2-3小时 |
| 更新组件显示 | P1 | 1-2小时 |
| 测试验证 | P1 | 1小时 |
| **总计** | | **5-7小时** |

### 需求2：文件选择器

| 任务 | 优先级 | 预计时间 |
|------|--------|---------|
| 创建useFilePicker Hook | P0 | 1小时 |
| 更新RepoPathManagement组件 | P0 | 30分钟 |
| 更新ConfigSourceManagement组件 | P0 | 30分钟 |
| 后端路径验证API | P1 | 1小时 |
| 跨平台测试 | P1 | 1小时 |
| **总计** | | **4-5小时** |

### 需求3：跨平台兼容性

| 任务 | 优先级 | 预计时间 |
|------|--------|---------|
| 创建路径工具类 | P0 | 1小时 |
| 创建平台检测工具 | P0 | 30分钟 |
| 更新所有路径处理代码 | P1 | 2-3小时 |
| 后端路径规范化 | P1 | 1-2小时 |
| 编写单元测试 | P1 | 2小时 |
| CI/CD配置 | P2 | 1小时 |
| **总计** | | **7-10小时** |

### 总计：16-22小时（约2-3个工作日）

---

## 🎯 推荐实施顺序

### 阶段1：基础改进（第1天）
1. ✅ 扫描未汉化内容（需求1）
2. ✅ 创建路径工具类（需求3）
3. ✅ 创建useFilePicker Hook（需求2）

### 阶段2：功能实现（第2天）
1. ✅ 实现文件选择器（需求2）
2. ✅ 添加英文原文（需求1）
3. ✅ 更新路径处理代码（需求3）

### 阶段3：测试验证（第3天）
1. ✅ 编写单元测试
2. ✅ 编写E2E测试
3. ✅ 跨平台测试
4. ✅ 文档编写

---

## 📝 需要创建的文档

1. **UNTRANSLATED_CONTENT_REPORT.md** - 未汉化内容扫描报告
2. **FILE_PICKER_IMPLEMENTATION.md** - 文件选择器实现文档
3. **CROSS_PLATFORM_GUIDE.md** - 跨平台开发指南
4. **TESTING_DOCUMENTATION.md** - 测试文档

---

## 🔧 需要的依赖和工具

### 前端
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/react": "^14.0.0",
    "vitest": "^1.0.0"
  }
}
```

### 后端
```toml
[dev-dependencies]
cfg-if = "1.0"
```

---

## ✅ 验收标准

### 需求1验收
- [ ] 所有UI文本使用t()函数翻译
- [ ] 重要术语显示英文原文括号
- [ ] 无硬编码英文字符串
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

## 🚀 下一步行动

**选项A：自动执行扫描**
- 使用Agent扫描未汉化内容
- 生成详细报告
- 列出所有需要修改的地方

**选项B：开始实施**
- 从需求1开始执行
- 按照推荐顺序实施
- 持续记录进度

**选项C：详细规划**
- 进一步细化每个需求的实施步骤
- 创建详细的任务清单
- 设置里程碑和检查点

请告诉我你希望如何进行！
