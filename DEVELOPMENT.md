# 斗地主网游 - 开发文档

## 项目状态 ✅

### 已完成的功能模块

#### 1. 基础架构 ✅
- [x] Nuxt 3 项目初始化
- [x] TypeScript 配置
- [x] Tailwind CSS 样式系统
- [x] Pinia 状态管理
- [x] 响应式设计适配

#### 2. 页面结构 ✅
- [x] 大厅页面 (`/`) - 游戏模式选择
- [x] 房间页面 (`/room/[code]`) - 等待和准备
- [x] 游戏页面 (`/game`) - 主要游戏界面

#### 3. 核心组件 ✅
- [x] Icon - 统一图标系统
- [x] LoadingSpinner - 加载指示器
- [x] NotificationContainer - 通知系统
- [x] NetworkStatusBar - 网络状态监控
- [x] AIDifficultySelector - AI难度选择
- [x] PlayerCard - 玩家信息卡片
- [x] ChatBox - 聊天功能
- [x] GameHeader - 游戏头部信息
- [x] PlayerArea - 玩家区域显示
- [x] PlayArea - 出牌区域

#### 4. 状态管理 ✅
- [x] GameStore - 游戏核心状态
- [x] RoomStore - 房间管理
- [x] NetworkStore - 网络连接管理

#### 5. 工具函数 ✅
- [x] useGameLogic - 斗地主游戏规则
- [x] useDeviceDetection - 设备检测和性能适配

#### 6. 部署配置 ✅
- [x] GitHub Actions 自动部署
- [x] PWA 配置
- [x] 静态文件优化

## 待实现功能 🚧

### 1. 游戏核心逻辑 (高优先级)
- [ ] 完整的牌型判断算法
- [ ] 叫地主流程
- [ ] 出牌验证和比较
- [ ] 游戏结束判定
- [ ] 积分计算系统

### 2. AI系统 (高优先级)
- [ ] 基础AI决策算法
- [ ] 三种难度等级实现
- [ ] 托管系统完善
- [ ] Web Worker异步计算

### 3. 网络功能 (高优先级)
- [ ] WebRTC P2P连接实现
- [ ] 信令服务器集成
- [ ] 房间码系统完善
- [ ] 断线重连机制
- [ ] 状态同步优化

### 4. 游戏界面完善 (中优先级)
- [ ] 手牌交互和选择
- [ ] 出牌动画效果
- [ ] 发牌动画
- [ ] 音效系统
- [ ] 游戏设置面板

### 5. 高级功能 (低优先级)
- [ ] 游戏录像回放
- [ ] 详细统计分析
- [ ] 自定义主题
- [ ] 观战模式
- [ ] 反作弊系统增强

## 技术架构

### 前端技术栈
```
Nuxt 3 (Vue.js 框架)
├── TypeScript (类型安全)
├── Tailwind CSS (样式框架)
├── Pinia (状态管理)
├── VueUse (组合式API工具)
└── PWA (渐进式Web应用)
```

### 网络架构
```
房主权威模式
├── WebRTC P2P (点对点通信)
├── 客户端预测 (即时反馈)
├── 状态同步 (数据一致性)
└── 断线重连 (容错机制)
```

### 文件结构
```
game/
├── pages/              # 页面路由
├── components/         # Vue组件
├── stores/            # Pinia状态管理
├── composables/       # 组合式API
├── utils/             # 工具函数
├── public/            # 静态资源
└── .github/           # GitHub Actions
```

## 开发指南

### 本地开发环境

#### 系统要求
- Node.js 16+
- npm 或 yarn
- 现代浏览器 (Chrome 80+, Firefox 75+, Safari 14+)

#### 快速开始
```bash
# 克隆项目
git clone <repo-url>
cd landlord-game

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或使用增强版启动脚本
npm run dev:enhanced
```

#### 开发服务器特性
- 🔥 热重载 - 代码修改自动刷新
- 📱 多设备支持 - 局域网访问
- 🔧 开发工具 - Nuxt DevTools
- ⚡ 快速构建 - Vite驱动

### 代码规范

#### TypeScript
- 所有新代码必须使用TypeScript
- 定义清晰的接口和类型
- 避免使用`any`类型

#### Vue组件
- 使用Composition API
- Props和Emits必须定义类型
- 组件名使用PascalCase

#### 样式
- 优先使用Tailwind CSS类
- 自定义样式放在`<style scoped>`中
- 响应式设计优先

### 测试策略

#### 单元测试
- 组合式API函数测试
- 游戏逻辑算法测试
- 状态管理测试

#### 集成测试
- 页面渲染测试
- 用户交互测试
- 网络功能测试

#### 性能测试
- 加载速度测试
- 内存使用监控
- 网络延迟测试

## 部署说明

### GitHub Pages (推荐)
```bash
# 自动部署
git push origin main

# 手动部署
npm run deploy
```

### 其他平台
- **Netlify**: 拖拽`dist`文件夹
- **Vercel**: 导入GitHub仓库
- **静态服务器**: 上传`dist`文件夹

### 环境变量
```bash
# 生产环境
NUXT_APP_BASE_URL=/your-repo-name/

# 开发环境
NUXT_PUBLIC_DEV_MODE=true
```

## 性能优化

### 代码分割
- 页面级别自动分割
- 组件懒加载
- 第三方库按需引入

### 资源优化
- 图片压缩和WebP格式
- CSS和JS压缩
- 字体优化加载

### 网络优化
- HTTP/2推送
- 资源预加载
- CDN加速

## 常见问题

### Q: 开发服务器启动失败
**A:** 检查Node.js版本是否≥16，删除`node_modules`重新安装

### Q: WebRTC连接失败
**A:** 检查浏览器是否支持WebRTC，网络防火墙设置

### Q: 移动端样式异常
**A:** 检查viewport设置，使用相对单位和弹性布局

### Q: GitHub Pages部署404
**A:** 检查`nuxt.config.ts`中的`baseURL`配置是否正确

## 贡献指南

### 提交流程
1. Fork项目
2. 创建功能分支
3. 编写代码和测试
4. 提交Pull Request

### 代码审查
- 功能完整性检查
- 代码质量评估
- 性能影响分析
- 兼容性测试

### 发布流程
1. 版本号更新
2. 更新日志编写
3. 创建GitHub Release
4. 自动部署触发

## 路线图

### v1.0 (当前) - 基础功能
- [x] 项目架构搭建
- [x] 基础UI组件
- [ ] 完整游戏逻辑
- [ ] AI对战功能
- [ ] P2P联机功能

### v1.1 - 体验优化
- [ ] 动画效果增强
- [ ] 音效系统
- [ ] 性能优化
- [ ] 移动端适配

### v1.2 - 高级功能
- [ ] 游戏录像
- [ ] 统计分析
- [ ] 自定义主题
- [ ] 观战模式

### v2.0 - 服务器版本
- [ ] 服务器权威模式
- [ ] 全局匹配系统
- [ ] 排行榜功能
- [ ] 账号系统

---

最后更新: 2025-09-16
