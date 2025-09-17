#!/bin/bash

# 🚀 一键部署到GitHub Pages脚本

echo "🎮 开始部署斗地主网游到GitHub Pages..."

# 检查是否在git仓库中
if [ ! -d ".git" ]; then
    echo "❌ 错误：当前目录不是git仓库"
    echo "请先运行: git init"
    exit 1
fi

# 检查是否有远程仓库
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ 错误：没有配置远程仓库"
    echo "请先添加远程仓库: git remote add origin <your-repo-url>"
    exit 1
fi

# 清理之前的构建
echo "🧹 清理之前的构建..."
rm -rf dist .output

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建项目
echo "🏗️  构建项目..."
pnpm run generate

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：没有找到dist目录"
    exit 1
fi

# 提交代码
echo "💾 提交代码..."
git add .
git commit -m "🚀 Deploy: $(date '+%Y-%m-%d %H:%M:%S')"

# 推送到远程仓库
echo "📤 推送到GitHub..."
git push origin main

echo "✅ 部署完成！"
echo ""
echo "🎯 请按以下步骤完成配置："
echo "1. 访问你的GitHub仓库"
echo "2. 进入 Settings > Pages"
echo "3. 选择 Source: GitHub Actions"
echo "4. 等待Actions构建完成"
echo ""
echo "🌐 部署地址将是："
REPO_URL=$(git remote get-url origin)
REPO_NAME=$(basename "$REPO_URL" .git)
USERNAME=$(echo "$REPO_URL" | sed 's/.*github\.com[:/]\([^/]*\)\/.*/\1/')
echo "https://${USERNAME}.github.io/${REPO_NAME}/"
echo ""
echo "🎮 多设备测试愉快！"
