<template>
  <Teleport to="body">
    <TransitionGroup
      name="action-feedback"
      tag="div"
      class="fixed inset-0 pointer-events-none z-[8000]"
    >
      <div
        v-for="feedback in feedbacks"
        :key="feedback.id"
        :class="[
          'action-feedback-item absolute',
          'bg-black bg-opacity-80 text-white px-4 py-2 rounded-xl shadow-2xl',
          'flex items-center space-x-2 backdrop-blur-sm',
          'border border-white border-opacity-20',
          getFeedbackClass(feedback.type)
        ]"
        :style="{ 
          ...getPositionStyle(feedback),
          zIndex: 8000 + feedback.id 
        }"
      >
        <!-- 图标 -->
        <div class="flex-shrink-0">
          <Icon :name="getFeedbackIcon(feedback.type)" class="w-6 h-6" />
        </div>
        
        <!-- 内容 -->
        <div class="flex flex-col">
          <div class="font-bold text-lg">{{ feedback.playerName }}</div>
          <div class="text-sm opacity-90">{{ feedback.message }}</div>
        </div>
        
        <!-- 卡牌预览（如果是出牌操作） -->
        <div v-if="feedback.cards && feedback.cards.length > 0" class="flex space-x-1 ml-4">
          <div
            v-for="card in feedback.cards.slice(0, 5)"
            :key="card.id"
            class="w-4 h-6 bg-white rounded text-xs flex items-center justify-center"
            :class="getCardColor(card.suit)"
          >
            {{ card.rank }}
          </div>
          <div v-if="feedback.cards.length > 5" class="text-xs text-gray-300 flex items-center">
            +{{ feedback.cards.length - 5 }}
          </div>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import type { Card } from '~/stores/game'

interface ActionFeedback {
  id: number
  type: 'bid' | 'play' | 'pass' | 'landlord' | 'auto-play'
  playerName: string
  message: string
  cards?: Card[]
  x: number
  y: number
  timestamp: number
}

// 使用操作反馈composable
const { feedbacks } = useActionFeedback()

// 获取反馈样式
const getFeedbackClass = (type: ActionFeedback['type']): string => {
  switch (type) {
    case 'bid':
      return 'border-yellow-400 text-yellow-100'
    case 'play':
      return 'border-green-400 text-green-100'
    case 'pass':
      return 'border-gray-400 text-gray-100'
    case 'landlord':
      return 'border-red-400 text-red-100'
    case 'auto-play':
      return 'border-blue-400 text-blue-100'
    default:
      return 'border-white text-white'
  }
}

// 获取反馈图标
const getFeedbackIcon = (type: ActionFeedback['type']): string => {
  switch (type) {
    case 'bid':
      return 'megaphone'
    case 'play':
      return 'cards'
    case 'pass':
      return 'x-circle'
    case 'landlord':
      return 'star'
    case 'auto-play':
      return 'robot'
    default:
      return 'info'
  }
}

// 获取位置样式
const getPositionStyle = (feedback: any) => {
  const gameStore = useGameStore()
  const isMyAction = feedback.playerName === gameStore.playerName
  
  if (isMyAction) {
    // 玩家自己的操作 - 显示在底部左侧（玩家手牌旁边）
    return {
      bottom: '140px',
      left: '32px',
      transform: 'none'
    }
  } else {
    // AI玩家的操作 - 根据玩家名称判断位置
    const players = gameStore.players
    const playerIndex = players.findIndex(p => p.name === feedback.playerName)
    
    if (playerIndex === 1) {
      // 第一个AI（左上角）
      return {
        top: '80px',
        left: '32px',
        transform: 'none'
      }
    } else if (playerIndex === 2) {
      // 第二个AI（右上角）
      return {
        top: '80px',
        right: '32px',
        transform: 'none'
      }
    }
  }
  
  // 默认位置（中央）
  return {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  }
}

// 获取卡牌颜色
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

// 组件现在只负责显示反馈，不需要暴露方法
</script>

<style scoped>
.action-feedback-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.action-feedback-leave-active {
  transition: all 0.3s ease-out;
}

.action-feedback-enter-from {
  transform: scale(0.5) translateY(-50px);
  opacity: 0;
}

.action-feedback-leave-to {
  transform: scale(0.8) translateY(50px);
  opacity: 0;
}

.action-feedback-item {
  animation: feedbackFloat 3s ease-in-out;
}

@keyframes feedbackFloat {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* 卡牌动画 */
.action-feedback-item .w-4 {
  animation: cardFlip 0.6s ease-out;
}

@keyframes cardFlip {
  0% {
    transform: rotateY(-90deg);
    opacity: 0;
  }
  50% {
    transform: rotateY(0deg);
    opacity: 0.5;
  }
  100% {
    transform: rotateY(0deg);
    opacity: 1;
  }
}
</style>
