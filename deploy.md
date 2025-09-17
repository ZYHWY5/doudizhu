# 🚀 部署到GitHub Pages

## 快速部署步骤

### 1. 创建GitHub仓库
```bash
# 在项目根目录执行
git init
git add .
git commit -m "Initial commit: 斗地主网游完整版"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. 配置GitHub Pages
1. 进入GitHub仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Pages**
4. 在 **Source** 下选择 **GitHub Actions**
5. 保存设置

### 3. 修改配置文件
在 `nuxt.config.ts` 中修改第17行：
```typescript
baseURL: process.env.NODE_ENV === 'production' 
  ? '/YOUR_REPO_NAME/' // 替换为你的仓库名
  : '/',
```

### 4. 推送代码触发部署
```bash
git add .
git commit -m "Configure for GitHub Pages deployment"
git push
```

## 🎮 多设备测试说明

### 部署完成后的测试流程：

1. **获取部署地址**
   - GitHub Pages地址：`https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

2. **多设备测试**
   - 设备A（房主）：创建房间，获得房间码
   - 设备B、C：使用房间码加入房间
   - 测试准备、开始游戏等功能

3. **测试场景**
   - ✅ 房主创建房间
   - ✅ 其他玩家加入房间  
   - ✅ 房主无需准备，其他玩家准备
   - ✅ 房主开始游戏
   - ✅ 游戏进行和结算

## 🔧 本地测试替代方案

如果暂时不想部署，也可以：

### 方案1：本地网络测试
```bash
# 启动开发服务器，绑定到所有网络接口
npm run dev -- --host 0.0.0.0
```
然后其他设备通过你的本地IP访问（如：`http://192.168.1.100:3000`）

### 方案2：使用ngrok
```bash
# 安装ngrok
npm install -g ngrok

# 启动本地服务器
npm run dev

# 在另一个终端中
ngrok http 3000
```
使用ngrok提供的公网地址进行测试

## 📱 移动设备优化

项目已经包含了移动设备优化：
- 响应式设计
- 触摸友好的UI
- PWA支持
- 移动端手势支持

## 🐛 调试信息

部署版本会自动移除调试信息，如需保留调试功能：
```typescript
// 在相关组件中添加
const isDev = computed(() => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost'
})
```

## 🚀 性能优化

生产版本已包含：
- 代码分割
- 资源压缩
- 图片优化
- 缓存策略
- PWA离线支持
