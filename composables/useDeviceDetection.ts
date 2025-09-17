/**
 * 设备检测和性能适配
 */

export interface DeviceCapability {
  type: 'mobile' | 'tablet' | 'desktop'
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown'
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown'
  cores: number
  memory: number
  performanceScore: number
  supportedFeatures: {
    webrtc: boolean
    webgl: boolean
    webworker: boolean
    websocket: boolean
    localStorage: boolean
    indexeddb: boolean
    notifications: boolean
    vibration: boolean
    fullscreen: boolean
  }
}

export interface PerformanceConfig {
  animationQuality: 'low' | 'medium' | 'high' | 'ultra'
  particleEffects: boolean
  soundEnabled: boolean
  maxAIThinkingTime: number
  networkUpdateFrequency: number
  renderFrameRate: number
}

export const useDeviceDetection = () => {
  
  /**
   * 检测设备类型
   */
  const detectDeviceType = (): DeviceCapability['type'] => {
    if (!process.client) return 'desktop'
    
    const userAgent = navigator.userAgent.toLowerCase()
    const screenWidth = window.screen.width
    
    // 移动设备检测
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
      return 'mobile'
    }
    
    // 平板设备检测
    if (/tablet|ipad|android(?!.*mobile)/.test(userAgent) || 
        (screenWidth >= 768 && screenWidth <= 1024)) {
      return 'tablet'
    }
    
    return 'desktop'
  }
  
  /**
   * 检测操作系统
   */
  const detectOS = (): DeviceCapability['os'] => {
    if (!process.client) return 'unknown'
    
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios'
    if (/android/.test(userAgent)) return 'android'
    if (/windows/.test(userAgent)) return 'windows'
    if (/mac os x/.test(userAgent)) return 'macos'
    if (/linux/.test(userAgent)) return 'linux'
    
    return 'unknown'
  }
  
  /**
   * 检测浏览器
   */
  const detectBrowser = (): DeviceCapability['browser'] => {
    if (!process.client) return 'unknown'
    
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (/chrome/.test(userAgent) && !/edge/.test(userAgent)) return 'chrome'
    if (/firefox/.test(userAgent)) return 'firefox'
    if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) return 'safari'
    if (/edge/.test(userAgent)) return 'edge'
    
    return 'unknown'
  }
  
  /**
   * 检测硬件规格
   */
  const detectHardwareSpecs = () => {
    const cores = navigator.hardwareConcurrency || 4
    const memory = (navigator as any).deviceMemory || 4
    
    return { cores, memory }
  }
  
  /**
   * 性能基准测试
   */
  const runPerformanceBenchmark = async (): Promise<number> => {
    if (!process.client) return 8
    
    const start = performance.now()
    
    // CPU密集型计算测试
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(Math.random() * i)
    }
    
    const cpuTime = performance.now() - start
    
    // 渲染性能测试
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    
    const renderStart = performance.now()
    
    if (ctx) {
      for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = `hsl(${i % 360}, 50%, 50%)`
        ctx.fillRect(
          Math.random() * 256,
          Math.random() * 256,
          10, 10
        )
      }
    }
    
    const renderTime = performance.now() - renderStart
    
    // 综合评分 (1-10分)
    const cpuScore = Math.max(1, Math.min(10, 10 - cpuTime / 10))
    const renderScore = Math.max(1, Math.min(10, 10 - renderTime / 5))
    
    return Math.round((cpuScore + renderScore) / 2)
  }
  
  /**
   * 检测支持的功能
   */
  const detectSupportedFeatures = () => {
    if (!process.client) {
      return {
        webrtc: false,
        webgl: false,
        webworker: false,
        websocket: false,
        localStorage: false,
        indexeddb: false,
        notifications: false,
        vibration: false,
        fullscreen: false
      }
    }
    
    return {
      webrtc: !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection),
      webgl: !!document.createElement('canvas').getContext('webgl'),
      webworker: !!window.Worker,
      websocket: !!window.WebSocket,
      localStorage: !!window.localStorage,
      indexeddb: !!window.indexedDB,
      notifications: !!window.Notification,
      vibration: !!navigator.vibrate,
      fullscreen: !!(document.fullscreenEnabled || (document as any).webkitFullscreenEnabled)
    }
  }
  
  /**
   * 完整设备检测
   */
  const detectDeviceCapability = async (): Promise<DeviceCapability> => {
    const type = detectDeviceType()
    const os = detectOS()
    const browser = detectBrowser()
    const { cores, memory } = detectHardwareSpecs()
    const performanceScore = await runPerformanceBenchmark()
    const supportedFeatures = detectSupportedFeatures()
    
    return {
      type,
      os,
      browser,
      cores,
      memory,
      performanceScore,
      supportedFeatures
    }
  }
  
  /**
   * 根据设备能力生成性能配置
   */
  const generatePerformanceConfig = (capability: DeviceCapability): PerformanceConfig => {
    const { type, performanceScore } = capability
    
    // 基础配置
    let config: PerformanceConfig = {
      animationQuality: 'medium',
      particleEffects: true,
      soundEnabled: true,
      maxAIThinkingTime: 3000,
      networkUpdateFrequency: 30,
      renderFrameRate: 60
    }
    
    // 根据设备类型调整
    if (type === 'mobile') {
      config.animationQuality = 'low'
      config.particleEffects = false
      config.maxAIThinkingTime = 2000
      config.networkUpdateFrequency = 20
      config.renderFrameRate = 30
    } else if (type === 'tablet') {
      config.animationQuality = 'medium'
      config.particleEffects = false
      config.maxAIThinkingTime = 2500
      config.networkUpdateFrequency = 25
      config.renderFrameRate = 45
    }
    
    // 根据性能分数微调
    if (performanceScore >= 8) {
      config.animationQuality = 'ultra'
      config.particleEffects = true
      config.renderFrameRate = 60
    } else if (performanceScore >= 6) {
      config.animationQuality = 'high'
      config.particleEffects = true
      config.renderFrameRate = 45
    } else if (performanceScore >= 4) {
      config.animationQuality = 'medium'
      config.particleEffects = false
      config.renderFrameRate = 30
    } else {
      config.animationQuality = 'low'
      config.particleEffects = false
      config.maxAIThinkingTime = 1500
      config.networkUpdateFrequency = 15
      config.renderFrameRate = 20
    }
    
    return config
  }
  
  /**
   * 检测网络环境
   */
  const detectNetworkEnvironment = () => {
    if (!process.client) return { type: 'unknown', speed: 'unknown' }
    
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection
    
    if (connection) {
      return {
        type: connection.effectiveType || 'unknown', // '2g', '3g', '4g', 'slow-2g'
        speed: connection.downlink || 0, // Mbps
        rtt: connection.rtt || 0 // ms
      }
    }
    
    return { type: 'unknown', speed: 'unknown' }
  }
  
  /**
   * 检测是否在游戏模式（与其他游戏同时运行）
   */
  const detectGamingMode = (): boolean => {
    if (!process.client) return false
    
    // 检测CPU使用率（简化版）
    const start = performance.now()
    
    // 执行一个简单的计算任务
    let sum = 0
    for (let i = 0; i < 10000; i++) {
      sum += Math.random()
    }
    
    const duration = performance.now() - start
    
    // 如果执行时间异常长，可能是系统负载高
    return duration > 50 // 50ms阈值
  }
  
  /**
   * 获取电池状态（移动设备）
   */
  const getBatteryStatus = async () => {
    if (!process.client) return null
    
    try {
      const battery = await (navigator as any).getBattery?.()
      
      if (battery) {
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        }
      }
    } catch (error) {
      console.warn('无法获取电池状态:', error)
    }
    
    return null
  }
  
  /**
   * 内存使用监控
   */
  const getMemoryUsage = () => {
    if (!process.client || !(performance as any).memory) {
      return null
    }
    
    const memory = (performance as any).memory
    
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
    }
  }
  
  /**
   * 自适应配置更新
   */
  const updateConfigBasedOnPerformance = (
    currentConfig: PerformanceConfig,
    averageFrameTime: number
  ): PerformanceConfig => {
    const newConfig = { ...currentConfig }
    
    // 如果帧时间过长（FPS过低），降低配置
    if (averageFrameTime > 33) { // 低于30fps
      if (newConfig.animationQuality === 'ultra') {
        newConfig.animationQuality = 'high'
      } else if (newConfig.animationQuality === 'high') {
        newConfig.animationQuality = 'medium'
      } else if (newConfig.animationQuality === 'medium') {
        newConfig.animationQuality = 'low'
      }
      
      newConfig.particleEffects = false
      newConfig.renderFrameRate = Math.max(20, newConfig.renderFrameRate - 10)
    }
    
    // 如果性能很好，可以适当提升配置
    else if (averageFrameTime < 16) { // 高于60fps
      if (newConfig.animationQuality === 'low') {
        newConfig.animationQuality = 'medium'
      } else if (newConfig.animationQuality === 'medium') {
        newConfig.animationQuality = 'high'
      }
      
      if (!newConfig.particleEffects && averageFrameTime < 12) {
        newConfig.particleEffects = true
      }
    }
    
    return newConfig
  }
  
  return {
    detectDeviceCapability,
    generatePerformanceConfig,
    detectNetworkEnvironment,
    detectGamingMode,
    getBatteryStatus,
    getMemoryUsage,
    updateConfigBasedOnPerformance,
    runPerformanceBenchmark
  }
}
