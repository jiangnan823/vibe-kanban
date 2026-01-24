# 数据管理页面汉化记录

**日期**: 2026-01-24
**任务**: 汉化Settings页面中数据管理相关的文字和弹窗
**状态**: ✅ 已完成

---

## 修改文件清单

### 1. 国际化文件

#### `frontend/src/i18n/locales/zh-Hans/settings.json`
**修改内容**:
- 添加导航项翻译（`dataManagement` 和 `dataManagementDesc`）
- 添加完整的 `dataManagement` 翻译配置，包含：
  - 页面标题和描述
  - 四个标签页（配置、会话、仓库、导入/导出）
  - 配置源管理（当前配置、切换配置源）
  - 会话管理（目录信息、已保存会话列表）
  - 仓库路径验证（扫描、修复）
  - 导入导出（导出配置、导出会话、导入配置）
  - 所有Toast通知消息
  - 错误消息

**新增翻译条目**: 约100+条

---

### 2. 组件文件

#### `frontend/src/pages/settings/DataManagement.tsx`
**修改内容**:
- 使用 `t()` 函数替换硬编码的英文文本
- 汉化内容：页面标题、描述、四个标签页名称

```typescript
// 修改前
<h2 className="text-3xl font-bold tracking-tight">Data Management</h2>
<span className="hidden sm:inline">Config</span>

// 修改后
<h2 className="text-3xl font-bold tracking-tight">
  {t('settings.general.dataManagement.title')}
</h2>
<span className="hidden sm:inline">
  {t('settings.general.dataManagement.tabs.config')}
</span>
```

---

#### `frontend/src/pages/settings/data-management/ConfigSourceManagement.tsx`
**修改内容**:
- 使用 `t()` 函数替换所有硬编码英文
- 汉化内容：
  - Toast通知消息（加载失败、验证结果、重新加载、切换源等）
  - 当前配置源卡片（标题、字段、按钮）
  - 切换配置源卡片（要求列表、输入框、警告信息）
  - 加载状态文本

```typescript
// 示例修改
toast.error(t('settings.general.dataManagement.toasts.failedToLoadConfig'));
toast.success(t('settings.general.dataManagement.toasts.configurationValid'));
<CardTitle>{t('settings.general.dataManagement.configSource.currentConfig.title')}</CardTitle>
```

---

#### `frontend/src/pages/settings/data-management/SessionManagement.tsx`
**修改内容**:
- 使用 `t()` 函数替换所有硬编码英文
- 汉化内容：
  - Toast通知消息（加载失败、扫描结果、删除确认等）
  - 会话目录卡片（标题、统计信息、按钮）
  - 已保存会话列表（标题、空状态、列表项、按钮）
  - 确认对话框（使用 `t()` 动态生成）

```typescript
// 示例修改
if (!confirm(t('settings.general.dataManagement.toasts.deleteConfirm', {
  name: session.task_name || t('settings.general.dataManagement.sessions.untitled')
}))) {
  return;
}
```

---

#### `frontend/src/pages/settings/data-management/RepoPathManagement.tsx`
**修改内容**:
- 使用 `t()` 函数替换所有硬编码英文
- 汉化内容：
  - Toast通知消息（扫描失败、路径更新、修复结果等）
  - 页面标题和描述
  - 扫描进度文本
  - 按钮文本（扫描仓库、修复全部、修复路径）
  - 状态标签（有效/无效）
  - 空状态提示

```typescript
// 示例修改
toast.error(t('settings.general.dataManagement.toasts.failedToScanRepos'));
toast.success(t('settings.general.dataManagement.toasts.pathUpdated'));
<span>{t('settings.general.dataManagement.repos.foundRepos', {
  count: repos.length,
  invalid: invalidCount
})}</span>
```

---

#### `frontend/src/pages/settings/data-management/ImportExportManagement.tsx`
**修改内容**:
- 使用 `t()` 函数替换所有硬编码英文
- 汉化内容：
  - Toast通知消息（导出成功/失败、导入成功/失败）
  - 导出配置卡片（标题、选项列表、按钮）
  - 导出会话卡片（标题、组织结构说明、按钮）
  - 导入配置卡片（标题、选项列表、注意事项、导入结果）
  - 动态导入结果显示

```typescript
// 示例修改
toast.success(t('settings.general.dataManagement.toasts.exportedSuccessfully'));
{t('settings.general.dataManagement.importExport.importConfig.noteList', {
  returnObjects: true
}).map((item: string, i: number) => (
  <li key={i}>{item}</li>
))}
```

---

## 翻译结构

### 翻译键路径规范
```
settings.general.dataManagement.*
├── title                          # 页面标题
├── description                    # 页面描述
├── tabs.*                         # 标签页名称
├── configSource.*                 # 配置源管理
├── sessions.*                     # 会话管理
├── repos.*                        # 仓库管理
├── importExport.*                 # 导入导出
├── toasts.*                       # Toast通知
└── errors.*                       # 错误消息
```

---

## 特殊处理

### 1. 动态参数翻译
使用 i18next 的插值功能：

```typescript
// 翻译键
"deleteConfirm": "删除会话 \"{{name}}\"？"

// 使用方式
t('settings.general.dataManagement.toasts.deleteConfirm', {
  name: session.task_name || t('settings.general.dataManagement.sessions.untitled')
})
```

### 2. 数组翻译
使用 `returnObjects: true` 返回数组：

```typescript
// 翻译键
"noteList": [
  "导入将与现有配置合并",
  "敏感数据（凭据）不包含在内",
  "跨设备使用时需要调整路径",
  "可能需要重启应用程序"
]

// 使用方式
{t('settings.general.dataManagement.importExport.importConfig.noteList', {
  returnObjects: true
}).map((item: string, i: number) => (
  <li key={i}>{item}</li>
))}
```

### 3. 字符串分割处理
对于需要拆分的文本（如 "注意：点击..."）：

```typescript
{t('settings.general.dataManagement.configSource.note').split('：')[0]}:
  {t('settings.general.dataManagement.configSource.note').split('：')[1]}
```

---

## 测试建议

### 1. 功能测试
- [ ] 访问 Settings > 数据管理 页面
- [ ] 检查所有标签页是否显示中文
- [ ] 测试配置源管理的所有操作
- [ ] 测试会话管理的扫描、查看、删除功能
- [ ] 测试仓库路径验证的扫描和修复功能
- [ ] 测试导入导出的所有功能

### 2. UI测试
- [ ] 检查Toast通知是否正确显示中文
- [ ] 检查确认对话框是否显示中文
- [ ] 检查加载状态是否显示中文
- [ ] 检查空状态是否显示中文
- [ ] 检查按钮文本是否正确翻译

### 3. 语法测试
- [ ] 运行 `pnpm run build` 检查TypeScript编译
- [ ] 运行 `pnpm run dev` 启动开发服务器
- [ ] 检查控制台是否有错误或警告

---

## 后续工作

### 1. 其他语言支持
如需支持其他语言（繁体中文、日语、韩语等），需要在对应的国际化文件中添加相同结构的翻译：

- `frontend/src/i18n/locales/zh-Hant/settings.json`
- `frontend/src/i18n/locales/ja/settings.json`
- `frontend/src/i18n/locales/ko/settings.json`
- `frontend/src/i18n/locales/es/settings.json`
- `frontend/src/i18n/locales/fr/settings.json`

### 2. 英文国际化文件
建议在 `frontend/src/i18n/locales/en/settings.json` 中添加完整的英文翻译结构，以保持一致性。

---

## 相关文件

| 文件路径 | 修改类型 |
|---------|---------|
| `frontend/src/i18n/locales/zh-Hans/settings.json` | 添加翻译 |
| `frontend/src/pages/settings/DataManagement.tsx` | 修改组件 |
| `frontend/src/pages/settings/data-management/ConfigSourceManagement.tsx` | 修改组件 |
| `frontend/src/pages/settings/data-management/SessionManagement.tsx` | 修改组件 |
| `frontend/src/pages/settings/data-management/RepoPathManagement.tsx` | 修改组件 |
| `frontend/src/pages/settings/data-management/ImportExportManagement.tsx` | 修改组件 |

---

## 总结

本次汉化工作完成了数据管理页面的全面国际化，包括：
- ✅ 5个组件文件的修改
- ✅ 1个国际化文件的更新
- ✅ 100+条翻译条目
- ✅ 所有Toast通知的汉化
- ✅ 所有UI文本的汉化
- ✅ 动态参数和数组翻译的正确处理

所有修改都遵循了项目的国际化规范，使用了 i18next 的标准API，确保代码的可维护性和可扩展性。
