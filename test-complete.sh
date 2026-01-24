#!/bin/bash
# 创建测试数据并完整测试新功能

BASE_URL="http://localhost:42541/api"

echo "=========================================="
echo "完整功能测试"
echo "=========================================="
echo ""

# 1. 创建测试项目
echo "1. 创建测试项目"
PROJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试项目",
    "display_name": "Test Project",
    "description": "用于测试新功能的项目"
  }')

echo "项目创建响应: $PROJECT_RESPONSE"
PROJECT_ID=$(echo $PROJECT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "项目ID: $PROJECT_ID"
echo ""

if [ -z "$PROJECT_ID" ]; then
  echo "❌ 项目创建失败，退出测试"
  exit 1
fi

# 2. 添加仓库到项目
echo "2. 添加测试仓库"
REPO_RESPONSE=$(curl -s -X POST "$BASE_URL/project-repos" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": \"$PROJECT_ID\",
    \"name\": \"test-repo\",
    \"display_name\": \"Test Repo\"
  }")
echo "$REPO_RESPONSE"
echo ""

# 3. 创建测试任务
echo "3. 创建测试任务"
TASK_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks?project_id=$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试会话保存功能",
    "description": "测试Session Exporter服务"
  }')

echo "任务创建响应: $TASK_RESPONSE"
TASK_ID=$(echo $TASK_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "任务ID: $TASK_ID"
echo ""

# 4. 创建工作空间
echo "4. 创建工作空间"
WORKSPACE_RESPONSE=$(curl -s -X POST "$BASE_URL/workspaces?task_id=$TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "main"
  }')

echo "工作空间响应: $WORKSPACE_RESPONSE"
WORKSPACE_ID=$(echo $WORKSPACE_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "工作空间ID: $WORKSPACE_ID"
echo ""

# 5. 等待一下确保数据已保存
sleep 2

# 6. 测试会话保存
echo "5. 测试会话保存功能"
SAVE_SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks/$TASK_ID/save-session" \
  -H "Content-Type: application/json" \
  -d "{
    \"workspace_id\": \"$WORKSPACE_ID\"
  }")

echo "会话保存响应: $SAVE_SESSION_RESPONSE"
echo ""

# 7. 检查会话是否保存到数据库
echo "6. 验证会话已保存"
SESSIONS=$(curl -s "$BASE_URL/tasks/$TASK_ID/sessions")
echo "会话列表: $SESSIONS"
echo ""

# 8. 测试仓库验证
echo "7. 测试仓库验证功能"
VALIDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/repos/validate-all")
echo "验证结果: $VALIDATE_RESPONSE"
echo ""

# 9. 测试会话统计
echo "8. 测试会话统计"
STATS=$(curl -s "$BASE_URL/data-management/session-stats")
echo "会话统计: $STATS"
echo ""

echo "=========================================="
echo "✅ 功能测试完成"
echo "=========================================="
