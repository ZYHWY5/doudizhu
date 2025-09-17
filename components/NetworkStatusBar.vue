<template>
  <div 
    v-if="shouldShowNetworkStatus"
    class="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg border p-3 max-w-xs"
    :class="statusColorClass"
  >
    <div class="flex items-center space-x-3">
      <!-- 网络状态图标 -->
      <div class="flex-shrink-0">
        <Icon 
          :name="statusIcon" 
          :class="['w-5 h-5', statusIconClass]"
        />
      </div>
      
      <!-- 状态信息 -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-medium text-gray-900">
            {{ statusText }}
          </span>
          <span v-if="showLatency" class="text-xs text-gray-500">
            {{ latency }}ms
          </span>
        </div>
        
        <!-- 网络质量指示器 -->
        <div v-if="showQualityBars" class="flex items-center space-x-1">
          <div 
            v-for="i in 4" 
            :key="i"
            :class="[
              'w-1 rounded-full',
              i <= qualityLevel ? qualityBarColor : 'bg-gray-300',
              getBarHeight(i)
            ]"
          ></div>
          <span class="text-xs text-gray-500 ml-2">
            {{ qualityText }}
          </span>
        </div>
        
        <!-- 连接类型 -->
        <div v-if="showConnectionType" class="text-xs text-gray-500 mt-1">
          {{ connectionTypeText }}
        </div>
      </div>
      
      <!-- 关闭按钮 -->
      <button 
        @click="hideStatus"
        class="flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <Icon name="x" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 状态管理
const networkStore = useNetworkStore()
const gameStore = useGameStore()

// 响应式数据
const showNetworkStatus = ref(false)

// 计算属性
const status = computed(() => networkStore.status)
const latency = computed(() => networkStore.latency)
const quality = computed(() => networkStore.quality)
const connectionType = computed(() => networkStore.connectionType)

// 只在联机模式下显示网络状态
const shouldShowNetworkStatus = computed(() => {
  return showNetworkStatus.value && gameStore.isMultiplayer
})

const statusText = computed(() => {
  switch (status.value) {
    case 'connected':
      return '已连接'
    case 'connecting':
      return '连接中...'
    case 'reconnecting':
      return '重连中...'
    case 'disconnected':
      return '已断开'
    default:
      return '未知状态'
  }
})

const statusIcon = computed(() => {
  switch (status.value) {
    case 'connected':
      return 'wifi'
    case 'connecting':
    case 'reconnecting':
      return 'spinner'
    case 'disconnected':
      return 'alert-circle'
    default:
      return 'signal'
  }
})

const statusIconClass = computed(() => {
  switch (status.value) {
    case 'connected':
      return 'text-green-500'
    case 'connecting':
    case 'reconnecting':
      return 'text-yellow-500 animate-spin'
    case 'disconnected':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
})

const statusColorClass = computed(() => {
  switch (status.value) {
    case 'connected':
      return 'border-green-200 bg-green-50'
    case 'connecting':
    case 'reconnecting':
      return 'border-yellow-200 bg-yellow-50'
    case 'disconnected':
      return 'border-red-200 bg-red-50'
    default:
      return 'border-gray-200 bg-gray-50'
  }
})

const qualityLevel = computed(() => {
  switch (quality.value) {
    case 'excellent':
      return 4
    case 'good':
      return 3
    case 'fair':
      return 2
    case 'poor':
      return 1
    default:
      return 0
  }
})

const qualityText = computed(() => {
  switch (quality.value) {
    case 'excellent':
      return '优秀'
    case 'good':
      return '良好'
    case 'fair':
      return '一般'
    case 'poor':
      return '较差'
    default:
      return '未知'
  }
})

const qualityBarColor = computed(() => {
  switch (quality.value) {
    case 'excellent':
      return 'bg-green-500'
    case 'good':
      return 'bg-blue-500'
    case 'fair':
      return 'bg-yellow-500'
    case 'poor':
      return 'bg-red-500'
    default:
      return 'bg-gray-300'
  }
})

const connectionTypeText = computed(() => {
  switch (connectionType.value) {
    case 'local':
      return '🏠 局域网连接'
    case 'internet':
      return '🌐 互联网连接'
    case 'mobile':
      return '📱 移动网络'
    case 'unknown':
      return '❓ 未知网络'
    default:
      return ''
  }
})

const showLatency = computed(() => {
  return status.value === 'connected' && latency.value > 0
})

const showQualityBars = computed(() => {
  return status.value === 'connected'
})

const showConnectionType = computed(() => {
  return status.value === 'connected' && connectionType.value !== 'unknown'
})

// 方法
const getBarHeight = (index: number): string => {
  const heights = ['h-1', 'h-2', 'h-3', 'h-4']
  return heights[index - 1] || 'h-1'
}

const hideStatus = () => {
  showNetworkStatus.value = false
}

// 监听网络状态变化
watch(status, (newStatus, oldStatus) => {
  // 状态变化时显示状态栏
  if (newStatus !== oldStatus) {
    showNetworkStatus.value = true
    
    // 连接成功后3秒自动隐藏
    if (newStatus === 'connected') {
      setTimeout(() => {
        showNetworkStatus.value = false
      }, 3000)
    }
  }
})

// 监听延迟变化，高延迟时显示警告
watch(latency, (newLatency) => {
  if (newLatency > 500 && status.value === 'connected') {
    gameStore.showNotification({
      type: 'warning',
      title: '网络延迟较高',
      message: `当前延迟: ${newLatency}ms，可能影响游戏体验`,
      duration: 3000
    })
  }
})

// 生命周期
onMounted(() => {
  // 如果已经连接，3秒后隐藏状态栏
  if (status.value === 'connected') {
    setTimeout(() => {
      showNetworkStatus.value = false
    }, 3000)
  }
})
</script>

<style scoped>
/* 自定义动画 */
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

/* 质量指示条动画 */
.quality-bar {
  transition: all 0.3s ease;
}
</style>
