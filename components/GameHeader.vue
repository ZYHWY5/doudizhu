<template>
  <div class="absolute top-0 left-0 right-0 z-50 bg-black bg-opacity-30 text-white px-4 py-2">
    <div class="flex items-center justify-between">
      <!-- 左侧：游戏信息 -->
      <div class="flex items-center space-x-4">
        <div class="text-sm">
          <span class="text-gray-200">游戏阶段:</span>
          <span class="font-medium">{{ phaseText }}</span>
        </div>
        
        <div v-if="landlord" class="text-sm">
          <span class="text-gray-200">地主:</span>
          <span class="font-medium text-yellow-300">{{ landlord.name }}</span>
        </div>
        
        <div v-if="currentPlayer" class="text-sm">
          <span class="text-gray-200">当前:</span>
          <span class="font-medium text-green-300">{{ currentPlayer.name }}</span>
        </div>
      </div>
      
      <!-- 右侧：网络状态和操作 -->
      <div class="flex items-center space-x-4">
        <!-- 网络状态（仅在联机模式显示） -->
        <div v-if="isMultiplayer" class="text-sm">
          <NetworkStatusIndicator />
        </div>
        
        <!-- 操作按钮 -->
        <div class="flex items-center space-x-2">
          <button
            @click="handlePauseClick"
            class="p-2 bg-black bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-colors cursor-pointer"
            title="暂停游戏"
          >
            <Icon name="pause" class="w-4 h-4" />
          </button>
          
          <button
            @click="$emit('show-settings')"
            class="p-2 bg-black bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-colors"
            title="游戏设置"
          >
            <Icon name="settings" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/stores/game'

interface Props {
  gamePhase: 'waiting' | 'bidding' | 'playing' | 'ended'
  currentPlayer: Player | null
  landlord: Player | null
  networkStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
}

interface Emits {
  (e: 'pause-game'): void
  (e: 'show-settings'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 处理暂停按钮点击
const handlePauseClick = () => {
  console.log('GameHeader: 暂停按钮被点击')
  emit('pause-game')
}

// 获取游戏状态
const gameStore = useGameStore()
const isMultiplayer = computed(() => gameStore.isMultiplayer)

// 计算属性
const phaseText = computed(() => {
  switch (props.gamePhase) {
    case 'waiting':
      return '等待中'
    case 'bidding':
      return '叫地主'
    case 'playing':
      return '游戏中'
    case 'ended':
      return '已结束'
    default:
      return '未知'
  }
})
</script>
