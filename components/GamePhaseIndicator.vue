<template>
  <div class="bg-black bg-opacity-40 backdrop-blur-sm rounded-lg p-3 text-white min-w-32">
    <div class="text-center">
      <!-- 阶段图标 -->
      <div class="mb-2">
        <Icon :name="phaseIcon" :class="['w-6 h-6 mx-auto', phaseIconColor]" />
      </div>
      
      <!-- 阶段文本 -->
      <div class="text-sm font-medium mb-1">
        {{ phaseText }}
      </div>
      
      <!-- 叫地主信息 -->
      <div v-if="phase === 'bidding' && biddingInfo" class="text-xs text-gray-300">
        <div v-if="biddingInfo.currentBidderId">
          等待 {{ getCurrentBidderName() }} 叫地主
        </div>
      </div>
      
      <!-- 倍数阶段信息 -->
      <div v-else-if="phase === 'multiplier' && multiplierInfo" class="text-xs text-gray-300">
        <div v-if="multiplierInfo.currentPlayerId">
          等待 {{ getCurrentMultiplierPlayerName() }} 决定倍数
        </div>
        <div class="mt-1">
          当前倍数: {{ multiplierInfo.multiplier }}倍
        </div>
      </div>
      
      <!-- 游戏进行信息 -->
      <div v-else-if="phase === 'playing'" class="text-xs text-gray-300">
        <div>游戏进行中</div>
        <div v-if="multiplierInfo" class="mt-1">
          最终倍数: {{ multiplierInfo.multiplier }}倍
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BiddingInfo } from '~/stores/game'

interface Props {
  phase: 'waiting' | 'bidding' | 'multiplier' | 'playing' | 'ended'
  biddingInfo?: BiddingInfo
  multiplierInfo?: {
    multiplier: number
    currentPlayerId: string | null
  }
}

const props = defineProps<Props>()

// 获取游戏状态
const gameStore = useGameStore()

// 计算属性
const phaseText = computed(() => {
  switch (props.phase) {
    case 'waiting':
      return '等待开始'
    case 'bidding':
      return '叫地主'
    case 'multiplier':
      return '决定倍数'
    case 'playing':
      return '游戏中'
    case 'ended':
      return '游戏结束'
    default:
      return '未知状态'
  }
})

const phaseIcon = computed(() => {
  switch (props.phase) {
    case 'waiting':
      return 'clock'
    case 'bidding':
      return 'hand-raised'
    case 'multiplier':
      return 'plus-circle'
    case 'playing':
      return 'play'
    case 'ended':
      return 'flag'
    default:
      return 'info'
  }
})

const phaseIconColor = computed(() => {
  switch (props.phase) {
    case 'waiting':
      return 'text-yellow-400'
    case 'bidding':
      return 'text-blue-400'
    case 'multiplier':
      return 'text-orange-400'
    case 'playing':
      return 'text-green-400'
    case 'ended':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
})

// 方法
const getCurrentBidderName = (): string => {
  if (!props.biddingInfo?.currentBidderId) return ''
  
  const player = gameStore.players.find(p => p.id === props.biddingInfo?.currentBidderId)
  return player?.name || '未知玩家'
}

const getCurrentMultiplierPlayerName = (): string => {
  if (!props.multiplierInfo?.currentPlayerId) return ''
  
  const player = gameStore.players.find(p => p.id === props.multiplierInfo?.currentPlayerId)
  return player?.name || '未知玩家'
}
</script>
