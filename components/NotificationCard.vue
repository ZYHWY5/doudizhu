<template>
  <div 
    :class="[
      'bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-sm w-full',
      borderColorClass,
      'animate-slide-up'
    ]"
    role="alert"
  >
    <div class="flex items-start">
      <!-- 图标 -->
      <div :class="['flex-shrink-0 mr-3', iconColorClass]">
        <Icon :name="iconName" class="w-5 h-5" />
      </div>
      
      <!-- 内容 -->
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-semibold text-gray-900 mb-1">
          {{ notification.title }}
        </h4>
        
        <p class="text-sm text-gray-700 mb-3">
          {{ notification.message }}
        </p>
        
        <!-- 操作按钮 -->
        <div v-if="notification.actions" class="flex space-x-2">
          <button
            v-for="action in notification.actions"
            :key="action.label"
            @click="handleAction(action.action)"
            class="btn btn-sm btn-primary"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
      
      <!-- 关闭按钮 -->
      <button
        @click="close"
        class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="关闭通知"
      >
        <Icon name="x" class="w-4 h-4" />
      </button>
    </div>
    
    <!-- 自动关闭进度条 -->
    <div 
      v-if="notification.duration && notification.duration > 0"
      class="absolute bottom-0 left-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden"
      :class="progressBarColorClass"
    >
      <div 
        class="h-full transition-all ease-linear"
        :class="progressBarColorClass"
        :style="{ 
          width: `${progressPercentage}%`,
          transitionDuration: `${notification.duration}ms`
        }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Notification, NotificationAction } from '~/stores/game'

interface Props {
  notification: Notification
}

interface Emits {
  (e: 'close', id: string): void
  (e: 'action', action: () => void): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const progressPercentage = ref(0)

// 计算属性
const iconName = computed(() => {
  switch (props.notification.type) {
    case 'success':
      return 'check-circle'
    case 'error':
      return 'alert-circle'
    case 'warning':
      return 'alert-circle'
    case 'info':
      return 'info'
    default:
      return 'info'
  }
})

const borderColorClass = computed(() => {
  switch (props.notification.type) {
    case 'success':
      return 'border-green-500'
    case 'error':
      return 'border-red-500'
    case 'warning':
      return 'border-yellow-500'
    case 'info':
      return 'border-blue-500'
    default:
      return 'border-gray-500'
  }
})

const iconColorClass = computed(() => {
  switch (props.notification.type) {
    case 'success':
      return 'text-green-500'
    case 'error':
      return 'text-red-500'
    case 'warning':
      return 'text-yellow-500'
    case 'info':
      return 'text-blue-500'
    default:
      return 'text-gray-500'
  }
})

const progressBarColorClass = computed(() => {
  switch (props.notification.type) {
    case 'success':
      return 'bg-green-500'
    case 'error':
      return 'bg-red-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'info':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
})

// 方法
const close = () => {
  emit('close', props.notification.id)
}

const handleAction = (action: () => void) => {
  action()
  close() // 执行操作后自动关闭通知
}

// 自动关闭逻辑
onMounted(() => {
  if (props.notification.duration && props.notification.duration > 0) {
    // 启动进度条动画
    nextTick(() => {
      progressPercentage.value = 100
    })
    
    // 自动关闭
    setTimeout(() => {
      close()
    }, props.notification.duration)
  }
})

// 鼠标悬停暂停自动关闭
const pauseAutoClose = ref(false)
let autoCloseTimer: NodeJS.Timeout | null = null

const handleMouseEnter = () => {
  pauseAutoClose.value = true
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
  }
}

const handleMouseLeave = () => {
  pauseAutoClose.value = false
  if (props.notification.duration && props.notification.duration > 0) {
    autoCloseTimer = setTimeout(() => {
      close()
    }, 1000) // 鼠标离开后1秒关闭
  }
}
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 进度条动画 */
.progress-bar {
  transform-origin: left;
}

/* 悬停效果 */
.notification-card:hover .progress-bar {
  animation-play-state: paused;
}
</style>
