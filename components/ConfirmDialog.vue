<template>
  <Teleport to="body">
    <div 
      v-if="show"
      class="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      @click.self="handleCancel"
    >
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-scale-in">
        <!-- 图标 -->
        <div class="mb-6">
          <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="alert-circle" class="w-8 h-8 text-yellow-600" />
          </div>
          
          <h2 class="text-2xl font-bold text-gray-800 mb-2">
            {{ title }}
          </h2>
          
          <p class="text-gray-600">
            {{ message }}
          </p>
        </div>
        
        <!-- 操作按钮 -->
        <div class="flex space-x-4 justify-center">
          <button
            @click="handleCancel"
            class="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors min-w-[100px]"
          >
            {{ cancelText }}
          </button>
          
          <button
            @click="handleConfirm"
            class="px-6 py-3 text-white bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors min-w-[100px]"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: '确认',
  cancelText: '取消'
})

const emit = defineEmits<Emits>()

// 方法
const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

// 键盘事件监听
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.show) return
  
  if (event.code === 'Escape') {
    event.preventDefault()
    handleCancel()
  } else if (event.code === 'Enter') {
    event.preventDefault()
    handleConfirm()
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 监听显示状态，阻止背景滚动
watch(() => props.show, (newShow) => {
  if (process.client) {
    if (newShow) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})
</script>

<style scoped>
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
