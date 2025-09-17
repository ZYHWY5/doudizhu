// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-09-16',
  devtools: { enabled: true },
  
  // 静态生成模式
  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true
    }
  },
  
  // GitHub Pages 路径配置
  app: {
    baseURL: process.env.NODE_ENV === 'production' 
      ? '/doudizhu/' // 替换为你的仓库名
      : '/',
    buildAssetsDir: '/assets/',
    head: {
      title: '斗地主网游',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '轻量化斗地主网游，支持AI对战和好友联机，无需下载直接游玩' },
        { name: 'keywords', content: '斗地主,纸牌游戏,在线游戏,WebRTC,P2P游戏' },
        { name: 'author', content: 'Your Name' },
        
        // Open Graph
        { property: 'og:title', content: '斗地主网游' },
        { property: 'og:description', content: '免费在线斗地主游戏，支持AI对战和好友联机' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/images/game-preview.jpg' },
        
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '斗地主网游' },
        { name: 'twitter:description', content: '免费在线斗地主游戏' },
        
        // PWA
        { name: 'theme-color', content: '#4f46e5' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.json' }
      ]
    }
  },
  
  // 静态生成
  ssr: false,
  
  // 模块
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/google-fonts'
  ],
  
  // Google Fonts
  googleFonts: {
    families: {
      'Inter': [400, 500, 600, 700],
      'Noto+Sans+SC': [400, 500, 600, 700]
    },
    display: 'swap'
  },
  
  // Tailwind CSS
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js'
  },
  
  // TypeScript
  typescript: {
    strict: true,
    typeCheck: true
  },
  
  // 构建优化
  experimental: {
    payloadExtraction: false
  },
  
  // 运行时配置
  runtimeConfig: {
    public: {
      appName: '斗地主网游',
      appVersion: '1.0.0',
      isDev: process.env.NODE_ENV === 'development'
    }
  }
})
