<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-fade-in">
        <!-- 暂停图标 -->
        <div class="mb-6">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="pause" class="w-8 h-8 text-gray-600" />
          </div>
          
          <h2 class="text-2xl font-bold text-gray-800 mb-2">
            游戏已暂停
          </h2>
          
          <p class="text-gray-600">
            选择下一步操作
          </p>
        </div>
        
        <!-- 操作按钮 -->
        <div class="space-y-3">
          <button
            @click="$emit('resume')"
            class="btn btn-primary btn-lg w-full"
          >
            <Icon name="play" class="w-5 h-5 mr-2" />
            继续游戏
          </button>
          
          <button
            @click="$emit('settings')"
            class="btn btn-secondary w-full"
          >
            <Icon name="settings" class="w-5 h-5 mr-2" />
            游戏设置
          </button>
          
          <button
            @click="showExitConfirm"
            class="btn btn-danger w-full"
          >
            <Icon name="door-open" class="w-5 h-5 mr-2" />
            退出游戏
          </button>
        </div>
        
        <!-- 游戏信息 -->
        <div class="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="font-medium text-gray-700">当前回合</div>
              <div>{{ currentRound }}</div>
            </div>
            <div class="text-center">
              <div class="font-medium text-gray-700">游戏时长</div>
              <div>{{ gameTime }}</div>
            </div>
          </div>
        </div>
        
        <!-- 快捷键提示 -->
        <div class="mt-4 text-xs text-gray-400">
          按 ESC 键继续游戏
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Emits {
  (e: 'resume'): void
  (e: 'settings'): void
  (e: 'exit'): void
}

const emit = defineEmits<Emits>()

// 获取游戏状态
const gameStore = useGameStore()

// 计算属性
const currentRound = computed(() => {
  return gameStore.gameState?.turn || 1
})

const gameTime = computed(() => {
  // 计算游戏时长
  const startTime = gameStore.gameState?.playHistory[0]?.timestamp || Date.now()
  const duration = Date.now() - startTime
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// 方法
const showExitConfirm = async () => {
  const confirmed = await gameStore.showConfirmDialog({
    title: '确认退出',
    message: '确定要退出当前游戏吗？游戏进度将会丢失。',
    confirmText: '退出',
    cancelText: '取消'
  })
  
  if (confirmed) {
    emit('exit')
  }
}

// 键盘事件监听
const handleKeydown = (event: KeyboardEvent) => {
  if (event.code === 'Escape') {
    event.preventDefault()
    emit('resume')
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
