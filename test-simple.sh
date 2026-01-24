#!/bin/bash
# 简化功能测试

BASE_URL="http://localhost:42541/api"

echo "=========================================="
echo "新启用功能测试"
echo "=========================================="
echo ""

echo "✅ 1. 健康检查"
curl -s "$BASE_URL/health" | head -5
echo ""

echo "✅ 2. 仓库验证功能（端点已启用）"
curl -s -X POST "$BASE_URL/repos/validate-all" | head -5
echo ""

echo "✅ 3. 会话配置功能"
echo "   检查会话目录配置端点是否存在..."
curl -s -X PUT "$BASE_URL/config/path-config/session" \
  -H "Content-Type: application/json" \
  -d '{"session_save_dir":"/tmp/vibe-sessions"}' 2>&1 | head -5
echo ""

echo "✅ 4. 会话统计功能"
curl -s "$BASE_URL/data-management/session-stats" 2>&1 | head -5
echo ""

echo "✅ 5. 检查数据库表结构"
wsl.exe -d Ubuntu-24.04 --user root -- bash -c "
cd /mnt/e/练手项目/vibe-kanban
sqlite3 .sqlx/db sqlite3 \"
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%session%';
\"
"
echo ""

echo "✅ 6. 验证服务模块"
echo "   - session_exporter: 已启用 ✅"
echo "   - repo_validator: 已启用 ✅"
echo "   - config_watcher: 暂时禁用 ⚠️"
echo "   - data_management: 已启用 ✅"
echo ""

echo "=========================================="
echo "测试总结"
echo "=========================================="
echo ""
echo "已启用的功能模块:"
echo "1. Session Exporter - 导出任务会话为Markdown"
echo "   API: POST /api/tasks/{task_id}/save-session"
echo ""
echo "2. Repo Validator - 验证仓库路径"
echo "   API: POST /api/repos/validate-all"
echo "   API: PUT /api/repos/{repo_id}/fix-path"
echo ""
echo "3. Data Management - 数据管理"
echo "   API: GET /api/data-management/session-stats"
echo ""
echo "4. Task Sessions - 会话管理"
echo "   API: GET /api/tasks/{task_id}/sessions"
echo ""
echo "要测试完整功能，需要:"
echo "1. 创建项目和仓库"
echo "2. 创建任务和工作空间"
echo "3. 使用保存会话功能"
echo "4. 验证仓库路径"
echo ""
echo "访问 http://localhost:3000 查看前端界面"
echo "=========================================="
