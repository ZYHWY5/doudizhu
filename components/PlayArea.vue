<template>
  <div class="bg-black bg-opacity-30 rounded-2xl p-6 min-w-96 min-h-48 backdrop-blur-sm">
    <!-- 标题 -->
    <div class="text-center mb-4">
      <h3 class="text-white text-lg font-semibold drop-shadow-lg">
        出牌区域
      </h3>
    </div>
    
    <!-- 当前出牌 -->
    <div class="flex flex-col items-center space-y-4">
      <!-- 最后出牌的玩家 -->
      <div v-if="currentPlayerName" class="text-center">
        <span class="text-gray-200 text-sm">当前出牌玩家:</span>
        <span class="text-yellow-300 font-medium ml-2">{{ currentPlayerName }}</span>
      </div>
      
      <!-- 出牌内容 -->
      <div class="flex justify-center items-center min-h-24">
        <div v-if="lastPlayedCards.length > 0" class="flex space-x-2">
          <div
            v-for="(card, index) in lastPlayedCards"
            :key="card.id"
            class="playing-card bg-white rounded-lg shadow-lg flex flex-col items-center justify-center text-center p-2 transform hover:scale-105 transition-transform"
            :style="{ zIndex: index }"
          >
            <!-- 牌面数字/字母 -->
            <div :class="[
              'font-bold text-lg',
              getCardColor(card.suit)
            ]">
              {{ card.rank }}
            </div>
            
            <!-- 花色图标 -->
            <div :class="[
              'text-sm',
              getCardColor(card.suit)
            ]">
              {{ getSuitSymbol(card.suit) }}
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="text-center text-gray-400">
          <Icon name="cards" class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p class="text-sm">等待出牌...</p>
        </div>
      </div>
      
      <!-- 底牌显示 -->
      <div v-if="bottomCards.length > 0" class="mt-6 pt-4 border-t border-gray-600">
        <div class="text-center mb-2">
          <span class="text-gray-200 text-sm">底牌:</span>
        </div>
        <div class="flex justify-center space-x-1">
          <!-- 叫地主阶段显示牌背 -->
          <div v-if="gamePhase === 'bidding'" class="flex space-x-1">
            <div
              v-for="i in 3"
              :key="i"
              class="w-8 h-12 bg-blue-600 rounded shadow flex items-center justify-center text-white text-xs border border-blue-400"
            >
              <Icon name="cards" class="w-3 h-3" />
            </div>
          </div>
          
          <!-- 地主确定后显示真实底牌 -->
          <div v-else class="flex space-x-1">
            <div
              v-for="card in bottomCards"
              :key="card.id"
              class="w-8 h-12 bg-white rounded shadow flex flex-col items-center justify-center text-xs"
            >
              <div :class="getCardColor(card.suit)">{{ card.rank }}</div>
              <div :class="getCardColor(card.suit)">{{ getSuitSymbol(card.suit) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 出牌历史按钮 -->
    <div class="absolute bottom-4 right-4">
      <button
        @click="showHistory = !showHistory"
        class="p-2 bg-black bg-opacity-40 hover:bg-opacity-60 rounded-lg text-white transition-colors"
        title="出牌历史"
      >
        <Icon name="history" class="w-4 h-4" />
      </button>
    </div>
    
    <!-- 出牌历史弹窗 -->
    <div v-if="showHistory" class="absolute top-full left-0 right-0 mt-2 bg-black bg-opacity-80 rounded-lg p-4 max-h-48 overflow-y-auto">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-white font-medium">出牌历史</h4>
        <button @click="showHistory = false" class="text-gray-400 hover:text-white">
          <Icon name="x" class="w-4 h-4" />
        </button>
      </div>
      
      <div class="space-y-2">
        <div
          v-for="record in playHistory.slice(-10)"
          :key="record.timestamp"
          class="flex items-center justify-between text-sm"
        >
          <span class="text-gray-300">{{ record.playerName }}:</span>
          <span class="text-white">
            {{ record.cardType === 'pass' ? '过牌' : `${record.cardType} (${record.cards.length}张)` }}
          </span>
        </div>
        
        <div v-if="playHistory.length === 0" class="text-center text-gray-500 py-4">
          暂无出牌记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card, PlayRecord } from '~/stores/game'

interface Props {
  lastPlayedCards: Card[]
  currentPlayerName: string
  bottomCards: Card[]
  playHistory: PlayRecord[]
  gamePhase: 'waiting' | 'bidding' | 'playing' | 'ended'
}

defineProps<Props>()

// 响应式数据
const showHistory = ref(false)

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
  width: 48px;
  height: 72px;
  transition: all 0.2s ease;
}

.playing-card:hover {
  transform: translateY(-4px) scale(1.05);
}

/* 出牌动画 */
.card-play-animation {
  animation: cardPlay 0.5s ease-out;
}

@keyframes cardPlay {
  0% {
    transform: translateY(100px) scale(0.8);
    opacity: 0;
  }
  50% {
    transform: translateY(-10px) scale(1.1);
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* 历史记录滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
