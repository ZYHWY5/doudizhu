<template>
  <svg
    :class="[
      'inline-block',
      sizeClass,
      colorClass
    ]"
    :viewBox="viewBox"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path :d="iconPath" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'currentColor'
})

// 图标路径映射
const iconPaths: Record<string, string> = {
  // 基础图标
  'arrow-left': 'M19 12H5m7-7l-7 7 7 7',
  'arrow-right': 'M5 12h14m-7-7l7 7-7 7',
  'arrow-up': 'M12 19V5m-7 7l7-7 7 7',
  'arrow-down': 'M12 5v14m7-7l-7 7-7-7',
  'check': 'M20 6L9 17l-5-5',
  'x': 'M18 6L6 18M6 6l12 12',
  'plus': 'M12 5v14m-7-7h14',
  'minus': 'M5 12h14',
  
  // 游戏相关
  'users': 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-4.5M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  'user': 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  'user-plus': 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6',
  'robot': 'M12 8V4m0 8v8m-4-4h8m-8 0h8M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0z',
  'play': 'M8 5v14l11-7z',
  'pause': 'M6 19h4V5H6v14zM14 5v14h4V5h-4z',
  'stop': 'M5 5h14v14H5z',
  
  // 网络和连接
  'wifi': 'M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zM5 13l2 2c2.76-2.76 7.24-2.76 10 0l2-2c-4.28-4.28-11.72-4.28-16 0zM9 17l3 3 3-3c-1.65-1.66-4.34-1.66-6 0z',
  'globe': 'M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9',
  'signal': 'M2 17h20v2H2zm1.15-4.05L4 11l.85 1.95.85-1.95L6.55 13h2.9l.85-1.95L11.15 13 12 11l.85 1.95L13.7 11l.85 1.95.85-1.95L16.25 13h2.9l.85-1.95L20.85 13 22 11l-1.15-2.05L19 11l-1.85-2.05L15.3 11l-1.85-2.05L11.6 11l-1.85-2.05L7.9 11l-1.85-2.05L4.2 11l-1.85-2.05L1.5 11l.85 2.05z',
  
  // 界面控制
  'home': 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6',
  'settings': 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
  'menu': 'M3 12h18M3 6h18M3 18h18',
  'door-open': 'M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16H5zM9 21h6M9 3v18',
  
  // 通信
  'chat': 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  'copy': 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2m8-2H8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z',
  'share': 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  
  // 状态指示
  'spinner': 'M12 2v4m0 12v4m8.485-8.485l-2.829 2.829M5.757 5.757L8.586 8.586m12.728 2.829l-2.829-2.829M5.757 18.243l2.829-2.829M22 12h-4M6 12H2',
  'alert-circle': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01',
  'info': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01',
  'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  
  // 缺失的图标
  'star': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  'clock': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  'send': 'M2 21l21-9L2 3v7l15 2-15 2v7z',
  'chart-bar': 'M3 3v18h18M7 16l4-4 4 4 4-4M7 8h2v8H7V8zM13 6h2v10h-2V6zM19 10h2v6h-2v-6z'
}

// 尺寸类映射
const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
}

// 计算属性
const sizeClass = computed(() => sizeClasses[props.size])
const colorClass = computed(() => props.color !== 'currentColor' ? `text-${props.color}` : '')
const iconPath = computed(() => iconPaths[props.name] || iconPaths['alert-circle'])
const viewBox = computed(() => {
  // 大部分图标使用24x24的视图框
  return '0 0 24 24'
})

// 如果图标不存在，输出警告
if (process.dev && !iconPaths[props.name]) {
  console.warn(`Icon "${props.name}" not found. Available icons:`, Object.keys(iconPaths))
}
</script>

<style scoped>
/* 旋转动画 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* SVG样式 */
svg {
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

/* 对于填充类图标 */
svg[data-filled] {
  fill: currentColor;
  stroke: none;
}
</style>
