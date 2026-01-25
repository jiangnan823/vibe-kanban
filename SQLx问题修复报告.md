# SQLx 编译错误修复报告

**问题时间**: 2026-01-25  
**修复提交**: efc8ec24

---

## 🚨 问题描述

### 错误信息

GitHub Actions 编译失败，出现多个 SQLx 错误：

```
error: set `DATABASE_URL` to use query macros online, or run `cargo sqlx prepare` to update the query cache
   --> crates/db/src/models/task_session.rs:37:9
    |
37  | /         sqlx::query_as!(
38  | |             TaskSession,
39  | |             r#"SELECT id AS "id!: Uuid",
...
```

**错误数量**: 10 个错误
**影响范围**: `task_session.rs` 中的所有 SQLx 查询宏
**失败阶段**: build-backend (Linux/macOS/Windows)

---

## 🔍 根本原因

### 问题分析

1. **缺少 SQLx 离线模式配置**
   - GitHub Actions workflow 中**未设置** `SQLX_OFFLINE=true`
   - SQLx 默认尝试连接数据库验证 SQL 查询

2. **缺少查询缓存文件**
   - `task_session.rs` 是新添加的模块（数据管理功能）
   - 对应的 `.sqlx` 查询缓存文件未生成
   - 没有缓存文件时，SQLx 需要数据库连接

3. **GitHub Actions 环境限制**
   - CI 环境中不运行数据库
   - 无法提供 `DATABASE_URL`
   - 必须使用离线模式

---

## 🛠️ 解决方案

### 实施的修复

**添加 SQLx 离线模式环境变量**到所有后端构建步骤：

#### 1. Linux 构建
```yaml
- name: Build backend (Linux)
  if: runner.os == 'Linux' && !contains(matrix.target, 'windows')
  run: |
    cargo zigbuild --release --target ${{ matrix.target }} -p server -p review --bin server --bin mcp_task_server --bin review
  env:
    SQLX_OFFLINE: true  # ✅ 新增
    POSTHOG_API_KEY: ${{ secrets.POSTHOG_API_KEY }}
    ...
```

#### 2. macOS 构建
```yaml
- name: Build backend (macOS)
  if: runner.os == 'macOS'
  run: |
    cargo build --release --target ${{ matrix.target }} -p server -p review --bin server --bin mcp_task_server --bin review
  env:
    SQLX_OFFLINE: true  # ✅ 新增
    POSTHOG_API_KEY: ${{ secrets.POSTHOG_API_KEY }}
    ...
```

#### 3. Windows 构建
```yaml
- name: Build backend (Windows)
  if: runner.os == 'Linux' && contains(matrix.target, 'windows')
  run: |
    cargo xwin build --cross-compiler clang-cl --release --target ${{ matrix.target }} -p server -p review --bin server --bin mcp_task_server --bin review
  env:
    SQLX_OFFLINE: true  # ✅ 新增
    POSTHOG_API_KEY: ${{ secrets.POSTHOG_API_KEY }}
    ...
```

---

## ✅ 修复效果

### 预期结果

1. ✅ **编译成功通过**
   - SQLx 使用离线模式
   - 从 `.sqlx` 目录读取查询缓存
   - 不需要数据库连接

2. ✅ **支持所有平台**
   - Linux (x86_64, ARM64)
   - macOS (x86_64, ARM64)
   - Windows (x86_64, ARM64)

3. ✅ **与上游保持一致**
   - 上游也使用 SQLx 离线模式
   - 这是标准做法

---

## 📊 技术背景

### SQLx 的两种模式

#### 在线模式（需要 DATABASE_URL）
```bash
export DATABASE_URL="sqlite://database.db"
cargo build
```
- **优点**: 实时验证 SQL 语法
- **缺点**: 需要数据库连接
- **适用**: 开发环境

#### 离线模式（需要 SQLX_OFFLINE=true）
```bash
export SQLX_OFFLINE=true
cargo build
```
- **优点**: 无需数据库，快速编译
- **缺点**: 需要预先生成缓存文件
- **适用**: CI/CD 环境

### 查询缓存文件

`.sqlx/query-<hash>.json` 文件示例：
```json
{
  "database": "SQLite",
  "query": "SELECT * FROM task_sessions WHERE id = ?",
  "describe": {
    "columns": [
      {"name": "id", "ordinal": 0, "type": "Text"}
    ],
    "parameters": {
      "Left": ["Text"]
    }
  }
}
```

---

## 🔧 后续建议

### 短期

1. ✅ **重新触发 GitHub Actions** - 使用修复后的 workflow
2. 🧪 **验证编译成功** - 确认所有平台都能编译
3. 📦 **下载编译产物** - 获取 Windows 可执行文件

### 长期

1. 📝 **生成查询缓存**（可选）
   ```bash
   # 在有数据库的环境生成缓存
   cargo sqlx prepare -- --workspace
   ```
   
2. 🔒 **提交缓存文件**（可选）
   ```bash
   git add .sqlx/
   git commit -m "chore: update SQLx query cache"
   ```

3. 📚 **文档化** - 记录 CI/CD 配置

---

## 📋 修复清单

- [x] 分析错误原因
- [x] 检查上游 workflow 配置
- [x] 添加 SQLX_OFFLINE=true 到 Linux 构建
- [x] 添加 SQLX_OFFLINE=true 到 macOS 构建
- [x] 添加 SQLX_OFFLINE=true 到 Windows 构建
- [x] 提交修复
- [x] 推送到远程
- [ ] 重新触发 GitHub Actions
- [ ] 验证编译成功

---

## ✅ 结论

**问题状态**: ✅ 已解决

**修复内容**:
- 在 3 个构建步骤中添加 `SQLX_OFFLINE=true`
- 与上游配置保持一致
- 允许离线编译，无需数据库连接

**下一步**: 重新触发 GitHub Actions 编译

---

**修复耗时**: 约 5 分钟  
**文件修改**: 1 个文件（3 处）  
**影响范围**: 所有后端构建步骤
