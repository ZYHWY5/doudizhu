<template>
  <div 
    v-if="shouldShowCards"
    class="player-card-display absolute z-20"
    :class="positionClasses"
  >
    <!-- 出牌卡片 - 与手牌相同大小，透明背景 -->
    <div class="flex space-x-1 mb-2">
      <div
        v-for="(card, index) in currentPlayedCards!.cards"
        :key="card.id"
        class="playing-card-display"
        :style="{ zIndex: index }"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card, CurrentPlayedCards } from '~/stores/game'

interface Props {
  currentPlayedCards: CurrentPlayedCards | null
  playerName: string
  position: 'left' | 'right' | 'bottom'
}

const props = defineProps<Props>()

// 判断是否应该显示卡片（只显示当前出牌的玩家）
const shouldShowCards = computed(() => {
  if (!props.currentPlayedCards) return false
  // 检查当前出牌是否是这个玩家的（通过玩家名称匹配）
  return props.currentPlayedCards.playerName === props.playerName
})

// 调试信息
watchEffect(() => {
  console.log(`PlayerCardDisplay - ${props.playerName}:`, {
    hasCurrentCards: !!props.currentPlayedCards,
    shouldShow: shouldShowCards.value,
    currentPlayerName: props.currentPlayedCards?.playerName || 'none',
    cardCount: props.currentPlayedCards?.cards?.length || 0,
    cards: props.currentPlayedCards?.cards?.map(c => `${c.rank}${c.suit}`) || [],
    cardType: props.currentPlayedCards?.cardType
  })
})

// 根据位置计算样式类
const positionClasses = computed(() => {
  switch (props.position) {
    case 'left':
      return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    case 'right':
      return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
    case 'bottom':
      return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    default:
      return ''
  }
})

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
    case 'clubs':
      return '♣'
    case 'spades':
      return '♠'
    case 'joker':
      return '★'
    default:
      return ''
  }
}
</script>

<style scoped>
/* 与手牌卡片保持相同样式 */
.playing-card-display {
  @apply relative w-14 h-20 bg-white border-2 border-gray-300 rounded-lg shadow-md;
  transition: all 0.2s ease;
  animation: fadeIn 0.3s ease-in-out;
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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .playing-card-display {
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
