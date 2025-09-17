import type { Card } from '~/stores/game'

interface ActionFeedback {
  id: number
  type: 'bid' | 'play' | 'pass' | 'landlord' | 'auto-play' | 'warning' | 'multiplier'
  playerName: string
  message: string
  cards?: Card[]
  x: number
  y: number
  timestamp: number
}

// 全局反馈状态
const feedbacks = ref<ActionFeedback[]>([])
let feedbackId = 0

export const useActionFeedback = () => {
  // 判断是否需要显示反馈
  const shouldShowFeedback = (type: ActionFeedback['type'], gamePhase: string): boolean => {
    switch (type) {
      case 'bid':
        return gamePhase === 'bidding' // 只在叫地主阶段显示
      case 'landlord':
        return true // 地主确定总是显示
      case 'play':
      case 'pass':
        return false // 出牌和过牌不显示反馈，避免频繁提示
      case 'auto-play':
        return false // 托管状态不显示反馈
      case 'multiplier':
        return true // 倍数操作总是显示
      default:
        return true
    }
  }

  // 添加操作反馈
  const addFeedback = (
    type: ActionFeedback['type'],
    playerName: string,
    message: string,
    options: {
      cards?: Card[]
      position?: { x: number, y: number }
      duration?: number
      gamePhase?: string
    } = {}
  ) => {
    // 检查是否需要显示反馈
    const gamePhase = options.gamePhase || 'playing'
    const shouldShow = shouldShowFeedback(type, gamePhase)
    
    console.log('操作反馈检查:', {
      type,
      playerName,
      message,
      gamePhase,
      shouldShow
    })
    
    if (!shouldShow) {
      console.log('反馈被过滤，不显示')
      return // 不显示反馈，直接返回
    }
    
    const id = ++feedbackId
    const feedback: ActionFeedback = {
      id,
      type,
      playerName,
      message,
      cards: options.cards,
      x: 0, // 位置现在在组件中计算
      y: 0, // 位置现在在组件中计算
      timestamp: Date.now()
    }
    
    feedbacks.value.push(feedback)
    
    // 自动移除
    setTimeout(() => {
      removeFeedback(id)
    }, options.duration || 3000)
  }

  // 移除反馈
  const removeFeedback = (id: number) => {
    const index = feedbacks.value.findIndex(f => f.id === id)
    if (index >= 0) {
      feedbacks.value.splice(index, 1)
    }
  }

  // 清空所有反馈
  const clearFeedbacks = () => {
    feedbacks.value = []
  }

  return {
    feedbacks: readonly(feedbacks),
    addFeedback,
    removeFeedback,
    clearFeedbacks
  }
}
