@echo off
REM 清理开发端口缓存

echo 清理开发端口缓存...
node scripts/setup-dev-environment.js clear
echo.
echo 完成！下次启动时将自动分配新端口。
pause
