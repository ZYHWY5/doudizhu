<template>
  <Teleport to="body">
    <div 
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      :class="{ 'animate-fade-in': show }"
    >
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <!-- 旋转图标 -->
        <div class="flex justify-center mb-4">
          <div class="relative">
            <div class="w-16 h-16 border-4 border-primary-200 rounded-full animate-spin border-t-primary-600"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <Icon name="play" class="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <!-- 加载文本 -->
        <h3 class="text-lg font-semibold text-gray-800 mb-2">
          {{ title }}
        </h3>
        
        <p v-if="message" class="text-gray-600 text-sm mb-4">
          {{ message }}
        </p>
        
        <!-- 进度条 -->
        <div v-if="showProgress" class="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            class="bg-primary-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        
        <!-- 取消按钮 -->
        <button 
          v-if="cancellable && onCancel"
          @click="handleCancel"
          class="btn btn-secondary btn-sm"
        >
          取消
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  show?: boolean
  title?: string
  message?: string
  progress?: number
  showProgress?: boolean
  cancellable?: boolean
}

interface Emits {
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
  title: '加载中...',
  message: '',
  progress: 0,
  showProgress: false,
  cancellable: false
})

const emit = defineEmits<Emits>()

// 计算属性
const onCancel = computed(() => {
  return props.cancellable ? handleCancel : null
})

// 方法
const handleCancel = () => {
  emit('cancel')
}

// 防止背景滚动
watchEffect(() => {
  if (process.client) {
    if (props.show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// 组件卸载时恢复滚动
onUnmounted(() => {
  if (process.client) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 自定义旋转动画 */
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
