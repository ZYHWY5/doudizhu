# 斗地主网游 🎮

一个轻量化的在线斗地主游戏，支持AI对战和好友联机。基于现代Web技术构建，无需下载即可游玩。

## ✨ 特性

- 🤖 **智能AI对战** - 三种难度等级，适合不同水平玩家
- 👥 **好友联机** - 支持局域网和互联网联机
- 🎯 **房间码系统** - 简单的6位房间码，轻松邀请朋友
- 📱 **跨平台支持** - 支持PC、手机、平板等所有现代设备
- ⚡ **极低延迟** - WebRTC P2P直连，局域网延迟1-5ms
- 🎨 **精美界面** - 现代化UI设计，流畅动画效果
- 🔧 **智能托管** - 多种托管策略，断线自动托管
- 🌐 **离线可用** - PWA支持，可安装到桌面

## 🚀 快速开始

### 在线游玩

直接访问：[https://your-username.github.io/landlord-game/](https://your-username.github.io/landlord-game/)

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/landlord-game.git
cd landlord-game

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run generate

# 部署到GitHub Pages
npm run deploy
```

## 🎯 游戏模式

### 1. 本地AI对战
- **简单难度** - 适合新手，AI会犯一些小错误
- **普通难度** - 平衡的对手，提供有挑战性的体验  
- **困难难度** - 高智能AI，使用完美策略

### 2. 联机对战
- **局域网联机** - 同一WiFi下极低延迟游戏
- **互联网联机** - 跨网络与朋友对战
- **房间码系统** - 6位房间码，简单易用

## 🛠 技术架构

### 前端技术栈
- **Nuxt 3** - 现代Vue.js框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化CSS框架
- **Pinia** - 状态管理
- **WebRTC** - P2P实时通信

### 核心特性
- **房主权威模式** - 确保游戏公平性
- **客户端预测** - 提供即时反馈
- **自动重连** - 网络异常自动恢复
- **设备自适应** - 根据设备性能自动优化

### 网络架构
```
玩家A (房主) ←→ WebRTC P2P ←→ 玩家B
     ↕                           ↕
   WebRTC P2P              WebRTC P2P  
     ↕                           ↕
           玩家C ←→ WebRTC P2P
```

## 📱 支持的设备和浏览器

### 桌面端
- ✅ Chrome 80+
- ✅ Firefox 75+  
- ✅ Safari 14+
- ✅ Edge 80+

### 移动端
- ✅ iOS Safari 14+
- ✅ Android Chrome 80+
- ✅ Android Firefox 75+

### 功能支持
- ✅ WebRTC P2P连接
- ✅ Web Workers AI计算
- ✅ PWA离线支持
- ✅ 响应式设计

## 🎮 游戏规则

### 基本规则
1. **3人游戏** - 每人17张牌，剩余3张为底牌
2. **叫地主** - 玩家轮流决定是否当地主
3. **出牌** - 地主先出，必须压过上家或选择过牌
4. **获胜条件** - 先出完所有牌的玩家获胜

### 牌型大小
- **单张** - 3 < 4 < 5 < ... < K < A < 2 < 小王 < 大王
- **对子** - 相同点数的两张牌
- **三张** - 相同点数的三张牌  
- **顺子** - 连续5张以上的单牌
- **炸弹** - 四张相同点数，可压任何牌型
- **王炸** - 大王+小王，最大牌型

## 🔧 高级功能

### 智能托管
- **手动托管** - 主动开启AI代打
- **自动托管** - 超时未操作自动托管
- **断线托管** - 网络断开时自动托管
- **托管策略** - 保守/平衡/激进三种策略

### 性能优化
- **设备检测** - 自动识别设备性能
- **自适应渲染** - 根据性能调整画质
- **网络优化** - 智能选择连接方式
- **内存管理** - 自动清理释放内存

### 反作弊系统
- **行为分析** - 检测异常出牌模式
- **时间统计** - 识别机器人特征
- **多重验证** - 房主权威+客户端验证
- **完整性检查** - 防止客户端修改

## 📊 网络性能

### 延迟表现
- **局域网** - 1-5ms（极速体验）
- **同城** - 10-30ms（优秀）
- **跨城** - 30-80ms（良好）
- **跨国** - 80-200ms（可接受）

### 连接成功率
- **普通NAT** - 95%+
- **严格NAT** - 85%+
- **企业网络** - 60%+

## 🚀 部署指南

### GitHub Pages部署

1. Fork本项目到你的GitHub账号
2. 修改`nuxt.config.ts`中的`baseURL`为你的仓库名
3. 推送代码到main分支，自动触发部署
4. 在Settings > Pages中启用GitHub Pages

### 自定义域名

1. 在`public`目录添加`CNAME`文件
2. 在DNS提供商添加CNAME记录指向`username.github.io`
3. 在GitHub Pages设置中配置自定义域名

### 本地部署

```bash
# 构建静态文件
npm run generate

# 使用任意静态文件服务器
npx serve dist
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

### 代码规范
- 使用TypeScript
- 遵循ESLint规则
- 添加适当的注释
- 编写测试用例

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Nuxt.js](https://nuxt.com/) - 优秀的Vue.js框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用的CSS框架
- [WebRTC](https://webrtc.org/) - 实时通信技术
- [GitHub Pages](https://pages.github.com/) - 免费静态托管

## 📞 联系方式

- 项目主页：[GitHub](https://github.com/your-username/landlord-game)
- 问题反馈：[Issues](https://github.com/your-username/landlord-game/issues)
- 邮箱：your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！
