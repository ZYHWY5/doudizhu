<template>
  <div class="p-4 space-y-4">
    <!-- 手牌区域 - 居中显示 -->
    <div class="relative flex justify-center mt-10zh">
      <!-- 手牌展示 -->
      <div class="flex justify-center items-end space-x-1 overflow-x-auto py-4 max-w-full">
        <div
          v-for="(card, index) in cards"
          :key="card.id"
          @click="$emit('select-card', index)"
          :class="[
            'playing-card cursor-pointer transition-all duration-200 flex-shrink-0',
            selectedCards.includes(index) ? 'selected' : '',
            suggestedCards.includes(index) ? 'suggested' : '',
            !canPlay && !selectedCards.includes(index) ? 'disabled' : ''
          ]"
        >
          <!-- 牌面内容 -->
          <div class="card-content">
            <!-- 牌面数字/字母 -->
            <div :class="['card-rank', getCardColor(card.suit)]">
              {{ card.rank }}
            </div>
            
            <!-- 花色图标 -->
            <div :class="['card-suit', getCardColor(card.suit)]">
              {{ getSuitSymbol(card.suit) }}
            </div>
          </div>
          
          <!-- 选中指示器 -->
          <div v-if="selectedCards.includes(index)" class="selected-indicator">
            <Icon name="check" class="w-3 h-3 text-white" />
          </div>
          
          <!-- 提示指示器 -->
          <div v-if="suggestedCards.includes(index)" class="suggested-indicator">
            <Icon name="lightbulb" class="w-3 h-3 text-yellow-400" />
          </div>
        </div>
      </div>
      
      <!-- 空手牌提示 -->
      <div v-if="cards.length === 0" class="text-center py-8 text-gray-500">
        <Icon name="cards" class="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>暂无手牌</p>
      </div>
    </div>
    
    <!-- 状态提示区域 -->
    <div class="text-center space-y-2">
      <!-- 角色标识 -->
      <div v-if="gamePhase === 'playing'" class="flex justify-center">
        <div v-if="isLandlord" class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold shadow-lg">
          <span class="mr-1">👑</span>
          地主
        </div>
        <div v-else class="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full text-sm font-bold shadow-lg">
          <span class="mr-1">🌾</span>
          农民
        </div>
      </div>
      
      <!-- 我的回合提示 -->
      <div v-if="isMyTurn" class="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium animate-pulse">
        <Icon name="clock" class="w-4 h-4 mr-2" />
        轮到你出牌了
        <span v-if="selectedCards.length > 0" class="ml-2 text-xs bg-green-200 px-2 rounded">
          已选 {{ selectedCards.length }} 张
        </span>
      </div>
      
      <!-- 等待提示 -->
      <div v-else class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm">
        <Icon name="pause" class="w-4 h-4 mr-2" />
        等待其他玩家
      </div>
    </div>
    
    <!-- 玩家出牌显示 -->
    <PlayerCardDisplay
      :current-played-cards="currentPlayedCards"
      :player-name="playerName"
      position="bottom"
    />
  </div>
</template>

<script setup lang="ts">
import type { Card, CurrentPlayedCards } from '~/stores/game'

interface Props {
  cards: Card[]
  selectedCards: number[]
  canPlay: boolean
  isMyTurn: boolean
  suggestedCards: number[]
  gamePhase: 'waiting' | 'bidding' | 'playing' | 'ended'
  isLandlord: boolean
  currentPlayedCards?: CurrentPlayedCards | null
  playerName: string
}

interface Emits {
  (e: 'select-card', index: number): void
}

const props = defineProps<Props>()

// 调试信息 - 检查玩家名称
watchEffect(() => {
  console.log(`PlayerHandArea - 玩家名称: "${props.playerName}"`)
})
defineEmits<Emits>()

// 调试：监控地主标识
watch(() => props.isLandlord, (newValue) => {
  console.log('=== PlayerHandArea 地主状态 ===')
  console.log('isLandlord prop:', newValue)
  console.log('gamePhase:', props.gamePhase)
  console.log('===============================')
}, { immediate: true })

// 获取花色颜色
const getCardColor = (suit: Card['suit']): string => {
  switch (suit) {
    case 'hearts':
    case 'diamonds':
      return 'text-red-500'
    case 'spades':
    case 'clubs':
      return 'text-black'
    case 'joker':
      return 'text-purple-600'
    default:
      return 'text-black'
  }
}

// 获取花色符号
const getSuitSymbol = (suit: Card['suit']): string => {
  switch (suit) {
    case 'hearts':
      return '♥'
    case 'diamonds':
      return '♦'
    case 'spades':
      return '♠'
    case 'clubs':
      return '♣'
    case 'joker':
      return '★'
    default:
      return ''
  }
}
</script>

<style scoped>
.playing-card {
  @apply relative w-14 h-20 bg-white border-2 border-gray-300 rounded-lg shadow-md;
  transition: all 0.2s ease;
}

.playing-card:hover:not(.disabled) {
  @apply transform -translate-y-2 shadow-lg border-blue-400;
}

.playing-card.selected {
  @apply transform -translate-y-4 border-blue-500 shadow-xl;
}

.playing-card.suggested {
  @apply border-yellow-400 shadow-lg;
  animation: pulse-yellow 2s infinite;
}

.playing-card.disabled {
  @apply opacity-50 cursor-not-allowed;
}

.card-content {
  @apply flex flex-col items-center justify-center h-full p-1;
}

.card-rank {
  @apply text-lg font-bold leading-none;
}

.card-suit {
  @apply text-sm leading-none mt-1;
}

.selected-indicator {
  @apply absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center;
}

.suggested-indicator {
  @apply absolute -top-2 -left-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center;
}

/* 动画效果 */
@keyframes pulse-yellow {
  0%, 100% {
    @apply border-yellow-400;
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
  }
  50% {
    @apply border-yellow-500;
    box-shadow: 0 0 0 4px rgba(251, 191, 36, 0);
  }
}

/* 手牌区域滚动条样式 */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  @apply bg-gray-200 rounded;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-600;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .playing-card {
    @apply w-10 h-14;
  }
  
  .card-rank {
    @apply text-sm;
  }
  
  .card-suit {
    @apply text-xs;
  }
}
</style>
