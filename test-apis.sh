#!/bin/bash
# 测试新启用功能的API脚本

BASE_URL="http://localhost:42541/api"

echo "=========================================="
echo "测试新启用的功能"
echo "=========================================="
echo ""

# 1. 测试健康检查
echo "1. 健康检查"
curl -s "$BASE_URL/health"
echo -e "\n"

# 2. 测试配置信息
echo "2. 获取配置信息"
curl -s "$BASE_URL/config/path-config"
echo -e "\n"

# 3. 测试仓库列表
echo "3. 获取仓库列表"
curl -s "$BASE_URL/repos"
echo -e "\n"

# 4. 测试任务列表
echo "4. 获取任务列表"
curl -s "$BASE_URL/tasks"
echo -e "\n"

# 5. 测试会话列表
echo "5. 获取会话列表"
curl -s "$BASE_URL/sessions"
echo -e "\n"

# 6. 测试仓库验证
echo "6. 验证所有仓库"
curl -s -X POST "$BASE_URL/repos/validate-all"
echo -e "\n"

echo "=========================================="
echo "测试完成"
echo "=========================================="
