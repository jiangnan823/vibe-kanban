# Vibe Kanban 测试用例文档

**版本**: 1.0
**日期**: 2026-01-24
**状态**: 测试用例定义

---

## 📋 测试概述

本文档定义了Vibe Kanban项目的所有测试用例，包括：
- 单元测试
- 集成测试
- 端到端（E2E）测试
- 跨平台测试

---

## 🎯 测试1：未汉化内容扫描

### 测试ID: TC-I18N-001
**测试名称**: 扫描前端组件中的硬编码英文文本
**优先级**: P0
**类型**: 自动化

#### 测试步骤
1. 运行扫描脚本扫描`frontend/src`目录
2. 搜索所有`.tsx`和`.ts`文件
3. 使用正则表达式匹配硬编码英文字符串
4. 生成报告文件

#### 预期结果
- 生成`UNTRANSLATED_CONTENT_REPORT.md`
- 包含所有硬编码文本的位置（文件:行号）
- 按优先级分类（P0/P1/P2）
- 提供修复建议

#### 测试数据
```bash
# 扫描命令
grep -rn "\"[A-Z][a-zA-Z ]+\"" frontend/src --include="*.tsx" --include="*.ts"
```

#### 验证点
- [ ] 报告文件存在
- [ ] 包含文件路径和行号
- [ ] 包含硬编码文本内容
- [ ] 分类正确

---

### 测试ID: TC-I18N-002
**测试名称**: 验证重要术语显示英文原文
**优先级**: P1
**类型**: 半自动化

#### 测试步骤
1. 启动开发环境
2. 切换到中文界面
3. 检查以下页面的重要术语：
   - 设置页面标题
   - 按钮文本
   - 警告信息
   - 表单标签

#### 测试数据
```yaml
检查点:
  - page: /settings
    terms:
      - "数据管理"
      - "退出应用"
      - "导出配置"
  - page: /settings/data-management
    terms:
      - "配置源"
      - "会话管理"
      - "仓库路径验证"
```

#### 预期结果
- 重要术语显示: `中文 (English)`
- 英文使用较小字体
- 颜色较浅（text-muted-foreground）
- 不影响布局

#### 验证点
- [ ] 英文括号存在
- [ ] 英文文本正确
- [ ] 样式正确
- [ ] 无布局问题

---

## 🎯 测试2：文件选择器功能

### 测试ID: TC-FP-001
**测试名称**: 测试文件选择器打开和基本功能
**优先级**: P0
**类型**: 自动化

#### 测试步骤
1. 导航到设置 > 数据管理 > 仓库路径验证
2. 点击"扫描仓库"按钮
3. 找到无效的仓库
4. 点击"选择路径"按钮
5. 在文件选择器中选择一个目录

#### 预期结果
- 文件选择器窗口打开
- 显示文件系统浏览器
- 可以选择目录
- 选择后路径被填充到输入框

#### 验证点
- [ ] 文件选择器API被调用
- [ ] 没有JavaScript错误
- [ ] 路径被正确捕获
- [ ] UI更新正确

---

### 测试ID: TC-FP-002
**测试名称**: 测试取消文件选择
**优先级**: P1
**类型**: 自动化

#### 测试步骤
1. 打开文件选择器
2. 点击"取消"按钮
3. 验证UI状态

#### 预期结果
- 文件选择器关闭
- 路径输入框保持不变
- 不显示错误提示
- 不触发任何API调用

#### 验证点
- [ ] 对话框关闭
- [ ] 状态未改变
- [ ] 无错误消息

---

### 测试ID: TC-FP-003
**测试名称**: 测试选择无效路径
**优先级**: P1
**类型**: 自动化

#### 测试步骤
1. 选择一个不是Git仓库的目录
2. 确认选择
3. 观察系统反应

#### 预期结果
- 显示错误提示
- 路径不被保存
- 提示用户重新选择

#### 验证点
- [ ] 错误提示显示
- [ ] 提示信息清晰
- [ ] 可以重新选择

---

### 测试ID: TC-FP-004
**测试名称**: 测试选择有效Git仓库
**优先级**: P0
**类型**: 自动化

#### 测试步骤
1. 选择一个有效的Git仓库目录
2. 确认选择
3. 验证路径被保存

#### 预期结果
- 路径验证通过
- 仓库状态更新为"有效"
- 路径显示在列表中

#### 验证点
- [ ] API调用成功
- [ ] 状态更新
- [ ] UI刷新正确

---

## 🎯 测试3：跨平台路径处理

### 测试ID: TC-PP-001
**测试名称**: 测试Windows路径格式
**优先级**: P0
**类型**: 单元测试

#### 测试用例

```typescript
describe('Windows Path Normalization', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { platform: 'Win32' });
  });

  test('should normalize C:/ path', () => {
    expect(normalizePath('C:/Users/Test')).toBe('C:\\Users\\Test');
  });

  test('should keep backslashes', () => {
    expect(normalizePath('C:\\Users\\Test')).toBe('C:\\Users\\Test');
  });

  test('should handle UNC paths', () => {
    expect(normalizePath('\\\\server\\share')).toBe('\\\\server\\share');
  });

  test('should detect absolute paths', () => {
    expect(isAbsolutePath('C:\\Users\\Test')).toBe(true);
    expect(isAbsolutePath('relative\\path')).toBe(false);
  });
});
```

#### 验证点
- [ ] 正斜杠转换为反斜杠
- [ ] 反斜杠保持不变
- [ ] UNC路径正确
- [ ] 绝对路径检测正确

---

### 测试ID: TC-PP-002
**测试名称**: 测试Linux路径格式
**优先级**: P0
**类型**: 单元测试

#### 测试用例

```typescript
describe('Linux Path Normalization', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { platform: 'Linux' });
  });

  test('should keep forward slashes', () => {
    expect(normalizePath('/home/test')).toBe('/home/test');
  });

  test('should convert backslashes', () => {
    expect(normalizePath('home\\test')).toBe('home/test');
  });

  test('should detect absolute paths', () => {
    expect(isAbsolutePath('/home/test')).toBe(true);
    expect(isAbsolutePath('relative/path')).toBe(false);
  });

  test('should validate path format', () => {
    expect(isValidPath('/home/test')).toBe(true);
    expect(isValidPath('')).toBe(false);
    expect(isValidPath('/invalid\x00path')).toBe(false);
  });
});
```

#### 验证点
- [ ] 正斜杠保持不变
- [ ] 反斜杠转换为正斜杠
- [ ] 绝对路径检测正确
- [ ] 路径验证正确

---

### 测试ID: TC-PP-003
**测试名称**: 测试macOS路径格式
**优先级**: P1
**类型**: 单元测试

#### 测试用例

```typescript
describe('macOS Path Handling', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
  });

  test('should handle user directory paths', () => {
    expect(normalizePath('/Users/test/project')).toBe('/Users/test/project');
  });

  test('should handle .app bundles', () => {
    const path = '/Applications/MyApp.app/Contents/MacOS/myapp';
    expect(normalizePath(path)).toBe(path);
  });

  test('should detect absolute paths', () => {
    expect(isAbsolutePath('/Users/test')).toBe(true);
    expect(isAbsolutePath('relative/path')).toBe(false);
  });
});
```

#### 验证点
- [ ] 用户路径处理正确
- [ ] .app路径保持不变
- [ ] 绝对路径检测正确

---

### 测试ID: TC-PP-004
**测试名称**: 测试跨平台路径兼容性
**优先级**: P1
**类型**: 集成测试

#### 测试步骤
1. 在Windows上创建测试文件
2. 使用Windows路径访问
3. 验证文件读写正常
4. 在Linux上重复相同操作
5. 验证结果一致

#### 测试数据
```yaml
windows_path: "C:\\Users\\Test\\config.json"
linux_path: "/home/test/config.json"
content: '{"test": "data"}'
```

#### 预期结果
- Windows上读写正常
- Linux上读写正常
- 文件内容一致
- 路径格式正确

#### 验证点
- [ ] Windows操作成功
- [ ] Linux操作成功
- [ ] 内容一致
- [ ] 无编码问题

---

## 🎯 测试4：端到端功能测试

### 测试ID: TC-E2E-001
**测试名称**: 完整的用户工作流测试
**优先级**: P0
**类型**: E2E测试

#### 测试场景：用户首次配置应用

```typescript
import { test, expect } from '@playwright/test';

test('complete user onboarding workflow', async ({ page }) => {
  // 步骤1：启动应用
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Vibe Kanban');

  // 步骤2：首次运行向导
  await page.click('button:has-text("开始使用")');

  // 步骤3：选择语言
  await page.selectOption('select[name="language"]', 'zh-Hans');
  await page.click('button:has-text("下一步")');

  // 步骤4：配置编码代理
  await page.selectOption('select[name="agent"]', 'claude');
  await page.click('button:has-text("完成")');

  // 验证：配置被保存
  await expect(page.locator('.settings-link')).toBeVisible();
  await page.click('.settings-link');
  await expect(page.locator('text=语言')).toBeVisible();
  await expect(page.locator('text=简体中文')).toBeVisible();
});
```

---

### 测试ID: TC-E2E-002
**测试名称**: 数据管理完整工作流
**优先级**: P0
**类型**: E2E测试

#### 测试场景：用户管理配置和会话

```typescript
test('data management workflow', async ({ page }) => {
  // 步骤1：导航到数据管理
  await page.goto('/settings/data-management');
  await expect(page.locator('h2')).toContainText('数据管理');

  // 步骤2：测试配置源管理
  await page.click('button:has-text("验证配置")');
  await expect(page.locator('.toast-success')).toBeVisible();

  // 步骤3：测试会话管理
  await page.click('[data-tab="sessions"]');
  await page.click('button:has-text("扫描会话")');
  await expect(page.locator('.session-list')).toBeVisible();

  // 步骤4：测试导出功能
  await page.click('[data-tab="import-export"]');
  await page.click('button:has-text("导出配置")');

  // 验证：下载开始
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("导出配置")')
  ]);
  expect(download.suggestedFilename()).toContain('vibe-kanban-config');
});
```

---

### 测试ID: TC-E2E-003
**测试名称**: 仓库路径修复工作流
**优先级**: P1
**类型**: E2E测试

#### 测试场景：用户修复无效仓库路径

```typescript
test('repository path fixing workflow', async ({ page }) => {
  // 步骤1：导航到仓库路径管理
  await page.goto('/settings/data-management');
  await page.click('[data-tab="repos"]');

  // 步骤2：扫描仓库
  await page.click('button:has-text("扫描仓库")');
  await page.waitForSelector('.repo-list');

  // 步骤3：找到无效仓库
  const invalidRepo = page.locator('.repo-item.invalid').first();
  await expect(invalidRepo).toBeVisible();

  // 步骤4：修复路径（mock文件选择器）
  await page.evaluate(() => {
    window.mockFilePicker = () => '/valid/repo/path';
  });

  await invalidRepo.click('button:has-text("选择路径")');

  // 步骤5：验证修复成功
  await expect(page.locator('.toast-success')).toBeVisible();
  await expect(invalidRepo).not.toHaveClass(/invalid/);
});
```

---

## 🎯 测试5：性能测试

### 测试ID: TC-PERF-001
**测试名称**: 前端首次加载性能
**优先级**: P2
**类型**: 性能测试

#### 测试指标
```yaml
指标:
  - 首次内容绘制(FCP): < 2秒
  - 最大内容绘制(LCP): < 3秒
  - 首次输入延迟(FID): < 100ms
  - 累积布局偏移(CLS): < 0.1
```

#### 测试步骤
1. 清除浏览器缓存
2. 打开应用
3. 使用Lighthouse测量性能
4. 记录各项指标

#### 预期结果
- 所有指标在阈值范围内
- 无JavaScript错误
- 无网络请求失败

---

### 测试ID: TC-PERF-002
**测试名称**: 大文件导出性能
**优先级**: P2
**类型**: 性能测试

#### 测试步骤
1. 创建包含1000个会话的数据
2. 触发导出操作
3. 测量导出时间
4. 测量生成的文件大小

#### 预期结果
```yaml
性能目标:
  - 导出时间: < 30秒
  - 文件大小: < 50MB
  - 内存使用: < 500MB
```

---

## 🎯 测试6：安全测试

### 测试ID: TC-SEC-001
**测试名称**: 路径遍历攻击防护
**优先级**: P0
**类型**: 安全测试

#### 测试用例
```typescript
describe('Path Traversal Protection', () => {
  const maliciousPaths = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '/absolute/path/to/secure',
    'C:\\Windows\\System32\\config\\SAM',
  ];

  test.each(maliciousPaths)('should reject malicious path: %s', (path) => {
    expect(isValidPath(path)).toBe(false);
  });
});
```

#### 验证点
- [ ] 所有恶意路径被拒绝
- [ ] 返回适当的错误
- [ ] 无安全漏洞

---

### 测试ID: TC-SEC-002
**测试名称**: XSS防护测试
**优先级**: P0
**类型**: 安全测试

#### 测试用例
```typescript
describe('XSS Protection', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
  ];

  test('should escape XSS in user input', async ({ page }) => {
    await page.goto('/settings/data-management');

    for (const payload of xssPayloads) {
      await page.fill('input[name="repo-name"]', payload);
      await page.click('button:has-text("保存")');

      // 验证：脚本未执行
      await expect(page.locator('script')).toHaveCount(0);
    }
  });
});
```

---

## 🎯 测试7：可访问性测试

### 测试ID: TC-A11Y-001
**测试名称**: 键盘导航测试
**优先级**: P1
**类型**: 可访问性测试

#### 测试步骤
1. 使用Tab键导航整个应用
2. 验证焦点顺序合理
3. 验证所有交互元素可通过键盘访问
4. 测试快捷键功能

#### 预期结果
- Tab顺序逻辑正确
- 所有按钮可通过Tab访问
- Enter/Space键激活按钮
- ESC键关闭对话框

---

### 测试ID: TC-A11Y-002
**测试名称**: 屏幕阅读器兼容性
**优先级**: P2
**类型**: 可访问性测试

#### 测试步骤
1. 启用屏幕阅读器（NVDA/VoiceOver）
2. 导航应用
3. 验证所有元素有正确的标签
4. 验证ARIA属性正确

#### 预期结果
- 所有按钮有描述性标签
- 表单输入有关联的label
- 状态变化有公告
- 错误信息可访问

---

## 📊 测试覆盖率目标

### 代码覆盖率
```yaml
目标:
  - 语句覆盖率: > 80%
  - 分支覆盖率: > 75%
  - 函数覆盖率: > 80%
  - 行覆盖率: > 80%
```

### 功能覆盖率
```yaml
核心功能:
  - 用户认证: 100%
  - 任务管理: 100%
  - 数据管理: 100%
  - 配置管理: 100%

次要功能:
  - 主题切换: 80%
  - 语言切换: 80%
  - 帮助文档: 50%
```

---

## 🚀 测试执行计划

### 自动化测试执行频率

| 测试类型 | 执行频率 | 触发方式 |
|---------|---------|---------|
| 单元测试 | 每次提交 | Git Hook |
| 集成测试 | 每天 | Cron Job |
| E2E测试 | 每次发布 | CI/CD |
| 性能测试 | 每周 | 定时任务 |
| 安全测试 | 每月 | 手动触发 |

### CI/CD集成

```yaml
# .github/workflows/test.yml

name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - checkout
      - setup-node
      - install
      - run: pnpm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node
      - install
      - run: pnpm run build
      - run: pnpm run test:e2e

  lint:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - run: pnpm run lint
```

---

## 📝 测试报告模板

```markdown
# 测试执行报告

**日期**: YYYY-MM-DD
**版本**: v1.0.0
**测试人员**: [姓名]

## 执行摘要

- 总测试用例: X
- 通过: X
- 失败: X
- 跳过: X
- 通过率: XX%

## 失败用例详情

| 用例ID | 名称 | 失败原因 | 严重程度 | 状态 |
|-------|------|---------|---------|------|
| TC-001 | 测试名称 | 描述 | P0 | 待修复 |

## 性能测试结果

| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| FCP | <2s | 1.5s | ✅ |

## 建议

- [ ] 建议1
- [ ] 建议2
```

---

## ✅ 测试验收标准

### 功能测试
- [ ] 所有核心功能正常工作
- [ ] 无阻塞性bug
- [ ] 所有P0用例通过

### 性能测试
- [ ] 满足所有性能指标
- [ ] 无内存泄漏
- [ ] 响应时间在阈值内

### 兼容性测试
- [ ] Windows上运行正常
- [ ] Linux上运行正常
- [ ] macOS上运行正常

### 安全测试
- [ ] 无已知安全漏洞
- [ ] 通过所有安全检查
- [ ] 敏感数据已加密

---

## 🔗 相关文档

- [IMPROVEMENT_PROPOSAL.md](./IMPROVEMENT_PROPOSAL.md) - 改进方案
- [PROJECT_STRUCTURE_ANALYSIS.md](./PROJECT_STRUCTURE_ANALYSIS.md) - 项目结构
- [CLEANUP_RECORD.md](./CLEAN_RECORD.md) - 清理记录
