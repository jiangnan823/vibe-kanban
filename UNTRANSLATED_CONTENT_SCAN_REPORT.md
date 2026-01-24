# 硬编码英文字符串扫描报告

**扫描日期**: 2026-01-24
**扫描工具**: Agent - general-purpose
**扫描范围**: `frontend/src` 下所有 `.tsx` 和 `.ts` 文件

---

## 📊 执行摘要

本次扫描识别出 **140+ 个**未使用 `t()` 函数翻译的硬编码英文字符串，分为三个优先级：

| 优先级 | 数量 | 说明 |
|--------|------|------|
| **P0** | ~80+ | 用户界面可见文本（按钮、标签、表格列等） |
| **P1** | ~10 | Toast 错误/成功消息 |
| **P2** | ~50+ | aria-label、title 属性等辅助功能文本 |

---

## 🎯 P0 级别：用户界面可见文本（高优先级）

### 1. DiffCard.tsx - Diff状态和操作

**文件**: `frontend/src/components/DiffCard.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 48 | `'Deleted'` | `diff.status.deleted` | 已删除 |
| 49 | `'Renamed'` | `diff.status.renamed` | 已重命名 |
| 52 | `'Copied'` | `diff.status.copied` | 已复制 |
| 54 | `'Permission Changed'` | `diff.status.permissionChanged` | 权限已更改 |
| 276 | `'Collapse'` | `diff.actions.collapse` | 折叠 |
| 276 | `'Expand'` | `diff.actions.expand` | 展开 |
| 295 | `'Open in IDE'` | `diff.actions.openInIDE` | 在IDE中打开 |
| 327 | `'Content omitted due to file size. Open in editor to view.'` | `diff.messages.contentOmitted` | 由于文件大小，内容已省略。在编辑器中打开以查看。 |
| 330 | `'File renamed with no content changes.'` | `diff.messages.renamedNoChanges` | 文件已重命名，无内容更改。 |
| 332 | `'File permission changed.'` | `diff.messages.permissionChanged` | 文件权限已更改。 |
| 333 | `'No content changes to display.'` | `diff.messages.noChanges` | 无内容更改显示。 |
| 334 | `'Failed to render diff for this file.'` | `diff.errors.renderFailed` | 无法呈现此文件的差异。 |

### 2. SearchBar.tsx - 搜索占位符

**文件**: `frontend/src/components/SearchBar.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 30 | `'Search...'` | `search.placeholder.default` | 搜索... |
| 30 | `` `Search ${project.name}...` `` | `search.placeholder.withProject` | 搜索 {项目名}... |

### 3. ExecutorConfigForm.tsx - 配置表单

**文件**: `frontend/src/components/ExecutorConfigForm.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 110 | `'Schema not found for executor type: {executor}'` | `executorConfig.schemaNotFound` | 未找到执行器类型的架构：{executor} |
| 145 | `'Save Configuration'` | `executorConfig.saveButton` | 保存配置 |

### 4. ConfirmDialog.tsx - 确认对话框

**文件**: `frontend/src/components/dialogs/shared/ConfirmDialog.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 28 | `'Confirm'` | `dialog.confirmButton.default` | 确认 |
| 29 | `'Cancel'` | `dialog.cancelButton.default` | 取消 |

### 5. RJSF 表单组件

**SelectWidget.tsx** - `frontend/src/components/rjsf/widgets/SelectWidget.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 49 | `'Not specified'` | `form.select.notSpecified` | 未指定 |
| 62 | `'Select an option...'` | `form.select.placeholder` | 选择一个选项... |

**ArrayFieldTemplate.tsx** - `frontend/src/components/rjsf/templates/ArrayFieldTemplate.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 29 | `'Add Item'` | `form.array.addItem` | 添加项目 |
| 52 | `'Remove item'` | `form.array.removeItem` | 移除项目 |

### 6. ProjectCard.tsx - 项目卡片

**文件**: `frontend/src/components/projects/ProjectCard.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 66 | `"Are you sure you want to delete \"{name}\"? This action cannot be undone."` | `project.deleteConfirm` | 确定要删除 "{name}" 吗？此操作无法撤销。 |
| 75 | `'Failed to unlink project'` | `project.unlinkFailed` | 取消项目链接失败 |
| 100 | `"Are you sure you want to unlink \"{name}\"? The local project will remain, but it will no longer be linked to the remote project."` | `project.unlinkConfirm` | 确定要取消链接 "{name}" 吗？本地项目将保留，但不再链接到远程项目。 |

### 7. WYSIWYG 编辑器

**wysiwyg.tsx** - `frontend/src/components/ui/wysiwyg.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 314 | `'Edit'` | `wysiwyg.edit` | 编辑 |
| 328 | `'Delete'` | `wysiwyg.delete` | 删除 |

**toolbar-plugin.tsx** - `frontend/src/components/ui/wysiwyg/plugins/toolbar-plugin.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 238 | `'Strikethrough'` | `wysiwyg.format.strikethrough` | 删除线 |
| 245 | `'Inline Code'` | `wysiwyg.format.inlineCode` | 行内代码 |

### 8. ElectricTestPage.tsx - 测试页面表格

**文件**: `frontend/src/pages/ui-new/ElectricTestPage.tsx`

**表格列标签**：

| 列名 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 状态 | `'Sync Error'` | `electric.syncError` | 同步错误 |
| 加载 | `'Loading projects...'` | `electric.loadingProjects` | 正在加载项目... |
| 状态 | `'synced'` | `electric.synced` | 已同步 |
| 列1 | `'Name'` | `electric.table.name` | 名称 |
| 列2 | `'ID'` | `electric.table.id` | ID |
| 列3 | `'Updated'` | `electric.table.updated` | 更新时间 |
| 列4 | `'Type'` | `electric.table.type` | 类型 |
| 列5 | `'Seen'` | `electric.table.seen` | 已查看 |
| 列6 | `'Created'` | `electric.table.created` | 创建时间 |
| 列7 | `'Title'` | `electric.table.title` | 标题 |
| 列8 | `'Priority'` | `electric.table.priority` | 优先级 |
| 列9 | `'Archived'` | `electric.table.archived` | 已归档 |
| 列10 | `'Files Changed'` | `electric.table.filesChanged` | 文件更改 |
| 列11 | `'Order'` | `electric.table.order` | 顺序 |
| 列12 | `'Issue ID'` | `electric.table.issueId` | 问题ID |
| 列13 | `'User ID'` | `electric.table.userId` | 用户ID |
| 列14 | `'Assigned'` | `electric.table.assigned` | 已分配 |
| 列15 | `'Tag ID'` | `electric.table.tagId` | 标签ID |
| 列16 | `'Related Issue'` | `electric.table.relatedIssue` | 相关问题 |
| 列17 | `'Message'` | `electric.table.message` | 消息 |
| 列18 | `'Author'` | `electric.table.author` | 作者 |
| 列19 | `'Emoji'` | `electric.table.emoji` | 表情符号 |
| 列20 | `'Comment'` | `electric.table.comment` | 评论 |
| 列21 | `'User'` | `electric.table.user` | 用户 |

### 9. Navbar.tsx - 导航菜单

**文件**: `frontend/src/components/layout/Navbar.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 44 | `'Projects'` | `nav.projects` | 项目 |
| 48 | `'Docs'` | `nav.docs` | 文档 |
| 53 | `'Support'` | `nav.support` | 支持 |
| 58 | `'Discord'` | `nav.discord` | Discord |

### 10. TaskPanel.tsx - 任务面板

**文件**: `frontend/src/components/panels/TaskPanel.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 78 | `'# Task'` | `taskPanel.defaultTitle` | # 任务 |
| 85 | `'Base Agent'` | `taskPanel.baseAgent` | 基础代理 |
| 91 | `'—'` | `taskPanel.noValue` | — |
| 129 | `'Parent Attempt'` | `taskPanel.parentAttempt` | 父尝试 |
| Time units | `'second'`, `'minute'`, `'hour'`, `'day'`, `'month'`, `'year'` | `timeAgo.units.*` | 秒/分钟/小时/天/月/年 |

---

## ⚠️ P1 级别：错误提示和 Toast 消息（中优先级）

### 1. FirstRunWizard.tsx - 首次运行向导

**文件**: `frontend/src/pages/settings/FirstRunWizard.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 77 | `'Failed to select folder'` | `wizard.error.selectFolderFailed` | 选择文件夹失败 |
| 81 | `'Enter the full path to the configuration directory:'` | `wizard.prompt.configPath` | 输入配置目录的完整路径： |
| 101 | `'Invalid config: {issues}'` | `wizard.error.invalidConfig` | 配置无效：{issues} |
| 105 | `'Failed to validate configuration'` | `wizard.error.validationFailed` | 配置验证失败 |
| 111 | `'Please select a valid configuration directory'` | `wizard.error.invalidDirectory` | 请选择有效的配置目录 |
| 129 | `'Configuration applied successfully!'` | `wizard.success.configApplied` | 配置应用成功！ |
| 132 | `'Failed to apply configuration'` | `wizard.error.applyFailed` | 应用配置失败 |

### 2. ActionsDropdown.tsx - 操作下拉菜单

**文件**: `frontend/src/components/ui/actions-dropdown.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 149 | `'Session saved successfully'` | `actions.saveSuccess` | 会话保存成功 |
| 151 | `'Failed to save session'` | `actions.saveFailed` | 保存会话失败 |
| 154 | `'Failed to save session'` | `actions.saveFailed` | 保存会话失败 |

---

## 🔧 P2 级别：aria-label、title 属性（低优先级）

### aria-label 属性（部分示例）

| 文件 | 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|------|-----------|-----------|---------|
| `DiffViewSwitch.tsx` | 42 | `'Diff view mode'` | `aria.diffViewMode` | 差异视图模式 |
| `DiffViewSwitch.tsx` | 48 | `'Inline view'` | `aria.inlineView` | 内联视图 |
| `DiffViewSwitch.tsx` | 63 | `'Split view'` | `aria.splitView` | 分割视图 |
| `Navbar.tsx` | 152 | `'Join our Discord'` | `aria.joinDiscord` | 加入我们的Discord |
| `Navbar.tsx` | 227 | `'Create new task'` | `aria.createTask` | 创建新任务 |
| `Navbar.tsx` | 250 | `'Settings'` | `aria.settings` | 设置 |
| `Navbar.tsx` | 269 | `'Main navigation'` | `aria.mainNav` | 主导航 |

### title 属性（部分示例）

| 文件 | 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|------|-----------|-----------|---------|
| `ProjectSettings.tsx` | 509 | `'Delete repository'` | `repository.deleteTitle` | 删除仓库 |
| `PendingInvitationItem.tsx` | 55 | `'Revoke invitation'` | `invitation.revokeTitle` | 撤销邀请 |
| `ReleaseNotesDialog.tsx` | 75 | `'Release Notes'` | `releaseNotes.title` | 发布说明 |
| `RetryEditorInline.tsx` | 172 | `'Attach image'` | `editor.attachImageTitle` | 附加图片 |
| `TaskFollowUpSection.tsx` | 805 | `'Attach image'` | `editor.attachImageTitle` | 附加图片 |
| `TaskFollowUpSection.tsx` | 817 | `'Insert PR comment'` | `editor.insertPrCommentTitle` | 插入PR评论 |

### RJSF KeyValueField

**文件**: `frontend/src/components/rjsf/fields/KeyValueField.tsx`

| 行号 | 硬编码文本 | 建议翻译键 | 翻译建议 |
|------|-----------|-----------|---------|
| 75 | `'Environment variable key'` | `form.keyValue.envKeyLabel` | 环境变量键 |
| 107 | `'New environment variable key'` | `form.keyValue.newEnvKeyPlaceholder` | 新环境变量键 |
| 121 | `'New environment variable value'` | `form.keyValue.newEnvValuePlaceholder` | 新环境变量值 |
| 130 | `'Add environment variable'` | `form.keyValue.addButton` | 添加环境变量 |

---

## 📈 统计摘要

| 类别 | 数量 |
|------|------|
| **P0 - UI可见文本** | 80+ |
| **P1 - 错误/Toast消息** | 10 |
| **P2 - 辅助功能** | 50+ |
| **总计** | **140+** |

---

## 🎯 推荐修复顺序

### 第一批（P0 - 高频用户界面）
- [ ] `DiffCard.tsx` - Diff状态和操作
- [ ] `ExecutorConfigForm.tsx` - 配置表单
- [ ] `SearchBar.tsx` - 搜索占位符
- [ ] `ProjectCard.tsx` - 项目操作
- [ ] RJSF组件 - 表单文本

### 第二批（P0 - 表格和导航）
- [ ] `ElectricTestPage.tsx` - 表格列
- [ ] `Navbar.tsx` - 导航菜单
- [ ] `TaskPanel.tsx` - 任务面板

### 第三批（P1 - 错误消息）
- [ ] `FirstRunWizard.tsx` - 向导错误
- [ ] `ActionsDropdown.tsx` - 操作反馈

### 第四批（P2 - 辅助功能）
- [ ] 所有 `aria-label` 属性
- [ ] 所有 `title` 属性

---

## 💡 修复示例

### 修复前
```tsx
// DiffCard.tsx
function labelAndIcon(diff: Diff) {
  const c = diff.change;
  if (c === 'deleted') return { label: 'Deleted', Icon: Trash2 };
  if (c === 'renamed') return { label: 'Renamed', Icon: ArrowLeftRight };
}

// SearchBar.tsx
<Input
  placeholder={project ? `Search ${project.name}...` : 'Search...'}
/>
```

### 修复后
```tsx
// DiffCard.tsx
import { useTranslation } from 'react-i18next';

function labelAndIcon(diff: Diff) {
  const { t } = useTranslation('diff');
  const c = diff.change;
  if (c === 'deleted') return { label: t('status.deleted'), Icon: Trash2 };
  if (c === 'renamed') return { label: t('status.renamed'), Icon: ArrowLeftRight };
}

// SearchBar.tsx
const { t } = useTranslation('search');
<Input
  placeholder={project
    ? t('placeholder.withProject', { projectName: project.name })
    : t('placeholder.default')
  }
/>
```

---

## 📚 建议的翻译文件结构

```
frontend/src/i18n/locales/
├── en/
│   ├── common.json
│   ├── diff.json         ← 新建
│   ├── search.json       ← 新建
│   ├── executor.json     ← 新建
│   ├── project.json      ← 新建
│   ├── dialog.json       ← 新建
│   ├── form.json         ← 新建
│   ├── wysiwyg.json      ← 新建
│   ├── electric.json     ← 新建
│   ├── nav.json          ← 新建
│   ├── task.json         ← 新建
│   └── wizard.json       ← 新建
└── zh-Hans/
    ├── common.json
    ├── diff.json         ← 新建
    ├── search.json       ← 新建
    ├── executor.json     ← 新建
    ├── project.json      ← 新建
    ├── dialog.json       ← 新建
    ├── form.json         ← 新建
    ├── wysiwyg.json      ← 新建
    ├── electric.json     ← 新建
    ├── nav.json          ← 新建
    ├── task.json         ← 新建
    └── wizard.json       ← 新建
```

---

## ✅ 验收标准

完成标准：
- [ ] 所有P0级别文本已翻译
- [ ] 所有P1级别错误消息已翻译
- [ ] P2级别辅助功能文本已翻译（可选）
- [ ] 所有新翻译已添加到英文和中文文件
- [ ] 组件已更新使用t()函数
- [ ] 通过手动测试验证翻译正确
- [ ] 无硬编码英文字符串残留

---

## 📞 相关文档

- [IMPROVEMENT_PROPOSAL.md](./IMPROVEMENT_PROPOSAL.md) - 完整改进方案
- [TEST_CASES.md](./TEST_CASES.md) - 测试用例文档
- [PROJECT_STRUCTURE_ANALYSIS.md](./PROJECT_STRUCTURE_ANALYSIS.md) - 项目结构分析
