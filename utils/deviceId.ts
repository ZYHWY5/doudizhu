/**
 * 设备唯一标识符生成器
 * 在没有服务器的情况下，基于浏览器和设备特征生成稳定的唯一标识符
 */

// 扩展WebGL调试信息接口
interface WebGLDebugRendererInfo {
  readonly UNMASKED_VENDOR_WEBGL: number
  readonly UNMASKED_RENDERER_WEBGL: number
}

interface DeviceFingerprint {
  userAgent: string
  language: string
  platform: string
  screen: {
    width: number
    height: number
    colorDepth: number
    pixelDepth: number
  }
  timezone: string
  hardwareConcurrency: number
  maxTouchPoints: number
  cookieEnabled: boolean
  doNotTrack: string | null
  canvas?: string
  webgl?: string
}

/**
 * 生成设备指纹
 */
const generateDeviceFingerprint = async (): Promise<DeviceFingerprint> => {
  const fingerprint: DeviceFingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack
  }

  // 添加Canvas指纹
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Device fingerprint test 🎮', 2, 2)
      fingerprint.canvas = canvas.toDataURL()
    }
  } catch (error) {
    console.warn('Canvas指纹生成失败:', error)
  }

  // 添加WebGL指纹
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null || 
               canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    
    if (gl) {
      // 尝试获取WebGL调试信息
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as WebGLDebugRendererInfo | null
      if (debugInfo && debugInfo.UNMASKED_VENDOR_WEBGL && debugInfo.UNMASKED_RENDERER_WEBGL) {
        try {
          const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string
          fingerprint.webgl = `${vendor}|${renderer}`
        } catch (paramError) {
          // 如果获取参数失败，使用基本的WebGL信息
          fingerprint.webgl = `WebGL-${gl.getParameter(gl.VERSION) || 'unknown'}`
        }
      } else {
        // 回退到基本WebGL版本信息
        fingerprint.webgl = `WebGL-${gl.getParameter(gl.VERSION) || 'basic'}`
      }
    }
  } catch (error) {
    console.warn('WebGL指纹生成失败:', error)
    // 不设置webgl字段，让系统使用其他指纹特征
  }

  return fingerprint
}

/**
 * 将对象转换为稳定的哈希值
 */
const hashObject = (obj: any): string => {
  const str = JSON.stringify(obj, Object.keys(obj).sort())
  let hash = 0
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * 生成设备唯一ID
 */
export const generateDeviceId = async (): Promise<string> => {
  try {
    // 首先检查是否已有存储的设备ID
    const existingId = localStorage.getItem('device_id')
    if (existingId) {
      console.log('使用已存储的设备ID:', existingId)
      return existingId
    }

    // 生成设备指纹
    const fingerprint = await generateDeviceFingerprint()
    
    // 生成基础哈希
    const baseHash = hashObject(fingerprint)
    
    // 添加时间戳确保唯一性（但保持在同一设备上的稳定性）
    const timestamp = Date.now()
    const deviceId = `device-${baseHash}-${timestamp.toString(36)}`
    
    // 存储到localStorage
    localStorage.setItem('device_id', deviceId)
    localStorage.setItem('device_id_created', timestamp.toString())
    
    console.log('生成新的设备ID:', deviceId)
    return deviceId
    
  } catch (error) {
    console.error('生成设备ID失败，使用回退方案:', error)
    
    // 回退方案：使用简单的随机ID
    const fallbackId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('device_id', fallbackId)
    return fallbackId
  }
}

/**
 * 获取设备ID（同步版本）
 */
export const getDeviceId = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('device_id')
}

/**
 * 生成基于设备ID的玩家ID
 */
export const generateUniquePlayerId = async (): Promise<string> => {
  const deviceId = await generateDeviceId()
  const sessionId = Math.random().toString(36).substr(2, 6)
  return `player-${deviceId.split('-')[1]}-${sessionId}`
}

/**
 * 生成基于设备ID的房间ID
 */
export const generateUniqueRoomId = async (): Promise<string> => {
  const deviceId = await generateDeviceId()
  const roomId = Math.random().toString(36).substr(2, 6).toUpperCase()
  return roomId
}

/**
 * 检查设备ID是否有效
 */
export const validateDeviceId = (deviceId: string): boolean => {
  return /^(device|fallback)-[a-z0-9]+-[a-z0-9]+$/.test(deviceId)
}

/**
 * 重置设备ID（用于调试或隐私清理）
 */
export const resetDeviceId = (): void => {
  localStorage.removeItem('device_id')
  localStorage.removeItem('device_id_created')
  console.log('设备ID已重置')
}

/**
 * 获取设备信息摘要（用于调试）
 */
export const getDeviceInfo = async () => {
  const fingerprint = await generateDeviceFingerprint()
  const deviceId = await generateDeviceId()
  
  return {
    deviceId,
    fingerprint: {
      userAgent: fingerprint.userAgent.substring(0, 50) + '...',
      platform: fingerprint.platform,
      screen: fingerprint.screen,
      timezone: fingerprint.timezone,
      cores: fingerprint.hardwareConcurrency
    },
    created: localStorage.getItem('device_id_created')
  }
}
