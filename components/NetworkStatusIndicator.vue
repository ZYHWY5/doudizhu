<template>
  <div class="flex items-center space-x-2 text-sm">
    <!-- 连接状态图标 -->
    <div class="flex items-center space-x-1">
      <Icon 
        :name="statusIcon" 
        :class="['w-4 h-4', statusIconClass]"
      />
      <span :class="statusTextClass">
        {{ statusText }}
      </span>
    </div>
    
    <!-- 网络质量指示器 -->
    <div v-if="showQuality" class="flex items-center space-x-1">
      <div class="network-indicator">
        <div 
          v-for="i in 4" 
          :key="i"
          :class="[
            'signal-bar',
            i <= qualityLevel ? 'active' : '',
            qualityBarColor
          ]"
          :style="{ height: `${4 + i * 2}px` }"
        ></div>
      </div>
      
      <span v-if="showLatency" class="text-xs text-gray-500">
        {{ latency }}ms
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
// 状态管理
const networkStore = useNetworkStore()

// 计算属性
const status = computed(() => networkStore.status)
const latency = computed(() => networkStore.latency)
const quality = computed(() => networkStore.quality)

const statusText = computed(() => {
  switch (status.value) {
    case 'connected':
      return '已连接'
    case 'connecting':
      return '连接中'
    case 'reconnecting':
      return '重连中'
    case 'disconnected':
      return '已断开'
    default:
      return '未连接'
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
      return 'text-gray-400'
  }
})

const statusTextClass = computed(() => {
  switch (status.value) {
    case 'connected':
      return 'text-green-600'
    case 'connecting':
    case 'reconnecting':
      return 'text-yellow-600'
    case 'disconnected':
      return 'text-red-600'
    default:
      return 'text-gray-500'
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

const showQuality = computed(() => {
  return status.value === 'connected'
})

const showLatency = computed(() => {
  return status.value === 'connected' && latency.value > 0
})
</script>

<style scoped>
.network-indicator {
  @apply flex items-end space-x-0.5;
}

.signal-bar {
  @apply w-1 bg-gray-300 rounded-full transition-colors duration-200;
}

.signal-bar.active {
  @apply bg-current;
}

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
</style>
