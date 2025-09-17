<template>
  <div 
    :class="[
      'flex flex-col items-center space-y-2 p-4 rounded-lg',
      isCurrentTurn ? 'bg-yellow-200 bg-opacity-20 border-2 border-yellow-400' : 'bg-black bg-opacity-10',
      positionClass
    ]"
  >
    <!-- 玩家头像和信息 -->
    <div class="relative">
      <!-- 头像 -->
      <div class="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
        {{ getInitials(player?.name || '') }}
      </div>
      
      <!-- 地主标识 -->
      <div v-if="isLandlord" class="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl border-2 border-white">
        <span class="text-white font-bold text-xs">地主</span>
      </div>
      
      <!-- 农民标识 -->
      <div v-else-if="player && gamePhase === 'playing'" class="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl border-2 border-white">
        <span class="text-white font-bold text-xs">农民</span>
      </div>
      
      <!-- 托管标识 -->
      <div v-if="player?.isAutoPlay" class="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
        <Icon name="robot" class="w-3 h-3 text-white" />
      </div>
      
      <!-- 当前回合指示器 -->
      <div v-if="isCurrentTurn" class="absolute -inset-2 border-2 border-yellow-400 rounded-full animate-pulse"></div>
    </div>
    
    <!-- 玩家名称 -->
    <div class="text-center">
      <div class="text-white font-medium text-sm drop-shadow-lg">
        {{ player?.name || '空位' }}
      </div>
      
      <!-- 状态指示 -->
      <div v-if="player" class="flex items-center justify-center space-x-1 mt-1">
        <div v-if="player.isAutoPlay" class="text-xs text-blue-300">
          🤖 托管中
        </div>
        <div v-else-if="isCurrentTurn" class="text-xs text-yellow-300">
          ⏰ 思考中
        </div>
        <div v-else class="text-xs text-gray-300">
          ⏸️ 等待中
        </div>
      </div>
    </div>
    
    <!-- 手牌数量 -->
    <div v-if="player" class="flex items-center space-x-1">
      <Icon name="cards" class="w-4 h-4 text-white" />
      <span class="text-white font-medium text-sm">
        {{ player.cards?.length || 0 }}张
      </span>
    </div>
    
    <!-- 手牌预览（仅显示牌背） -->
    <div v-if="player && player.cards?.length" class="flex justify-center">
      <div 
        :class="[
          'flex',
          position === 'top' ? '-space-x-2' : 
          position === 'left' ? 'flex-col -space-y-2' :
          position === 'right' ? 'flex-col -space-y-2' : '-space-x-2'
        ]"
      >
        <div
          v-for="i in Math.min(player.cards.length, 10)"
          :key="i"
          :class="[
            'w-6 h-8 bg-gradient-to-br from-blue-800 to-blue-900 rounded border border-blue-600 shadow-sm',
            position === 'left' || position === 'right' ? 'w-8 h-6' : ''
          ]"
        ></div>
        
        <!-- 更多牌指示器 -->
        <div v-if="player.cards.length > 10" class="flex items-center justify-center w-6 h-8 text-white text-xs">
          +{{ player.cards.length - 10 }}
        </div>
      </div>
    </div>
    
    <!-- 玩家出牌显示 -->
    <PlayerCardDisplay
      :current-played-cards="currentPlayedCards"
      :player-name="player?.name || ''"
      :position="position"
    />
  </div>
</template>

<script setup lang="ts">
import type { Player, CurrentPlayedCards } from '~/stores/game'

interface Props {
  player: Player | null
  isCurrentTurn: boolean
  isLandlord: boolean
  position: 'top' | 'left' | 'right' | 'bottom'
  gamePhase: 'waiting' | 'bidding' | 'multiplier' | 'playing' | 'ended'
  currentPlayedCards?: CurrentPlayedCards | null
}

const props = defineProps<Props>()

// 计算属性
const positionClass = computed(() => {
  switch (props.position) {
    case 'top':
      return 'transform -translate-x-1/2'
    case 'left':
      return ''
    case 'right':
      return ''
    case 'bottom':
      return 'transform -translate-x-1/2'
    default:
      return ''
  }
})

// 获取玩家姓名首字母
const getInitials = (name: string): string => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}
</script>

<style scoped>
/* 当前回合动画 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

/* 卡片阴影效果 */
.card-shadow {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}
</style>
