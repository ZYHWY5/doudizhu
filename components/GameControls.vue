<template>
  <div 
    ref="controlPanel"
    :style="{ transform: `translate(${position.x}px, ${position.y}px)` }"
    class="bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-3 space-y-3 select-none"
  >
    <!-- 拖拽手柄 -->
    <div 
      @mousedown="startDrag"
      @touchstart="startDrag"
      class="drag-handle flex items-center justify-center py-1 cursor-move border-b border-gray-600 mb-2 -mt-1"
    >
      <div class="flex space-x-1">
        <div class="w-1 h-1 bg-gray-400 rounded-full"></div>
        <div class="w-1 h-1 bg-gray-400 rounded-full"></div>
        <div class="w-1 h-1 bg-gray-400 rounded-full"></div>
        <div class="w-1 h-1 bg-gray-400 rounded-full"></div>
        <div class="w-1 h-1 bg-gray-400 rounded-full"></div>
      </div>
    </div>
    <!-- 主要操作按钮 -->
    <div class="space-y-2">
      <!-- 叫地主/抢地主按钮 -->
      <div v-if="gamePhase === 'bidding' && isMyTurn" class="grid grid-cols-2 gap-1">
        <!-- 叫地主阶段 -->
        <template v-if="biddingInfo?.phase === 'calling'">
          <button
            @click="$emit('bid-landlord', 'call')"
            class="btn btn-warning btn-sm text-xs"
          >
            叫地主
          </button>
          <button
            @click="$emit('bid-landlord', 'pass')"
            class="btn btn-secondary btn-sm text-xs"
          >
            不叫
          </button>
        </template>
        
        <!-- 抢地主阶段 -->
        <template v-if="biddingInfo?.phase === 'grabbing'">
          <button
            @click="$emit('bid-landlord', 'grab')"
            class="btn btn-danger btn-sm text-xs"
          >
            抢地主
          </button>
          <button
            @click="$emit('bid-landlord', 'pass')"
            class="btn btn-secondary btn-sm text-xs"
          >
            不抢
          </button>
        </template>
      </div>
      
      <!-- 出牌按钮 -->
      <button
        v-if="gamePhase === 'playing' && isMyTurn && canPlay"
        @click="$emit('play-cards')"
        class="btn btn-success w-full text-sm"
      >
        <Icon name="play" class="w-4 h-4 mr-1" />
        出牌
      </button>
      
      <!-- 不要按钮 -->
      <button
        v-if="gamePhase === 'playing' && isMyTurn && canPass"
        @click="$emit('pass-turn')"
        class="btn btn-secondary w-full text-sm"
      >
        <Icon name="x" class="w-4 h-4 mr-1" />
        不要
      </button>
      
      <!-- 倍数阶段按钮 -->
      <div v-if="gamePhase === 'multiplier' && isMyTurn" class="grid grid-cols-2 gap-1">
        <button
          @click="$emit('multiplier-decision', 'double')"
          class="btn btn-warning btn-sm text-xs"
        >
          <Icon name="plus" class="w-3 h-3 mr-1" />
          加倍
        </button>
        <button
          @click="$emit('multiplier-decision', 'pass')"
          class="btn btn-secondary btn-sm text-xs"
        >
          <Icon name="x" class="w-3 h-3 mr-1" />
          不加倍
        </button>
      </div>
    </div>
    
    <!-- 辅助功能 -->
    <div class="grid grid-cols-3 gap-1">
      <!-- 提示按钮 -->
      <button
        @click="$emit('get-hint')"
        class="btn btn-secondary btn-sm"
        title="获取出牌提示"
      >
        <Icon name="lightbulb" class="w-3 h-3" />
      </button>
      
      <!-- 托管按钮 -->
      <button
        @click="$emit('toggle-auto-play')"
        :class="[
          'btn btn-sm',
          autoPlayEnabled ? 'btn-danger' : 'btn-secondary'
        ]"
        :title="autoPlayEnabled ? '取消托管' : '开启托管'"
      >
        <Icon :name="autoPlayEnabled ? 'robot' : 'user'" class="w-3 h-3" />
      </button>
      
      <!-- 历史按钮 -->
      <button
        @click="$emit('show-history')"
        class="btn btn-secondary btn-sm"
        title="查看出牌历史"
      >
        <Icon name="history" class="w-3 h-3" />
      </button>
      
      <!-- 设置按钮 -->
      <button
        @click="$emit('show-settings')"
        class="btn btn-secondary btn-sm"
        title="游戏设置"
      >
        <Icon name="settings" class="w-3 h-3" />
      </button>
      
      <!-- 暂停按钮 -->
      <button
        @click="$emit('pause-game')"
        class="btn btn-warning btn-sm"
        title="暂停游戏"
      >
        <Icon name="pause" class="w-3 h-3" />
      </button>
      
      <!-- 游戏信息按钮 -->
      <button
        @click="$emit('show-game-info')"
        class="btn btn-info btn-sm"
        title="游戏信息"
      >
        <Icon name="info" class="w-3 h-3" />
      </button>
    </div>
    
    <!-- 回合计时器 -->
    <div v-if="isMyTurn && timeLeft > 0" class="text-center">
      <div class="text-white text-xs mb-1">剩余时间</div>
      <div class="flex items-center justify-center">
        <div :class="[
          'text-lg font-bold',
          timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'
        ]">
          {{ timeLeft }}s
        </div>
      </div>
      
      <!-- 时间进度条 -->
      <div class="w-full bg-gray-600 rounded-full h-1 mt-2">
        <div 
          :class="[
            'h-1 rounded-full transition-all duration-1000',
            timeLeft <= 10 ? 'bg-red-500' : 'bg-blue-500'
          ]"
          :style="{ width: `${(timeLeft / 45) * 100}%` }"
        ></div>
      </div>
    </div>
    
    <!-- 托管状态指示 -->
    <div v-if="autoPlayEnabled" class="text-center">
      <div class="inline-flex items-center px-2 py-1 bg-blue-500 bg-opacity-80 rounded text-white text-xs">
        <Icon name="robot" class="w-3 h-3 mr-1 animate-spin" />
        AI托管中
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  gamePhase: 'waiting' | 'bidding' | 'multiplier' | 'playing' | 'ended'
  isMyTurn: boolean
  canPlay: boolean
  canPass: boolean
  autoPlayEnabled: boolean
  timeLeft: number
  canDouble: boolean
  biddingInfo?: {
    phase: 'calling' | 'grabbing' | 'finished'
    landlordCandidateId: string | null
  }
  multiplierInfo?: {
    multiplier: number
    currentPlayerId: string | null
  }
}

interface Emits {
  (e: 'bid-landlord', bid: 'call' | 'grab' | 'pass'): void
  (e: 'play-cards'): void
  (e: 'pass-turn'): void
  (e: 'get-hint'): void
  (e: 'toggle-auto-play'): void
  (e: 'show-history'): void
  (e: 'show-settings'): void
  (e: 'pause-game'): void
  (e: 'show-game-info'): void
  (e: 'multiplier-decision', action: 'double' | 'pass'): void
}

defineProps<Props>()
defineEmits<Emits>()

// 拖拽功能
const controlPanel = ref<HTMLElement>()
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, elementX: 0, elementY: 0 })

// 从localStorage加载保存的位置
onMounted(() => {
  const savedPosition = localStorage.getItem('gameControlsPosition')
  if (savedPosition) {
    try {
      const parsed = JSON.parse(savedPosition)
      position.value = parsed
    } catch (e) {
      console.warn('Failed to parse saved position:', e)
    }
  }
})

// 保存位置到localStorage
const savePosition = () => {
  localStorage.setItem('gameControlsPosition', JSON.stringify(position.value))
}

// 开始拖拽
const startDrag = (event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  isDragging.value = true
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  dragStart.value = {
    x: clientX,
    y: clientY,
    elementX: position.value.x,
    elementY: position.value.y
  }
  
  // 添加全局事件监听
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

// 拖拽中
const onDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  
  event.preventDefault()
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  const deltaX = clientX - dragStart.value.x
  const deltaY = clientY - dragStart.value.y
  
  position.value = {
    x: dragStart.value.elementX + deltaX,
    y: dragStart.value.elementY + deltaY
  }
}

// 停止拖拽
const stopDrag = () => {
  if (!isDragging.value) return
  
  isDragging.value = false
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
  
  // 保存位置
  savePosition()
}

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
/* 脉冲动画 */
.animate-pulse {
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

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

/* 按钮悬停效果 */
.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}
</style>
