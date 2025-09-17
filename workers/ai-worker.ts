/**
 * AI计算Worker
 * 在后台线程中执行AI决策，避免阻塞主线程
 */

import type { Card } from '~/stores/game'

// AI消息类型
interface AIMessage {
  type: 'CALCULATE_MOVE' | 'CALCULATE_BID' | 'INIT_AI'
  data: any
  requestId: string
}

interface AIResponse {
  type: 'MOVE_RESULT' | 'BID_RESULT' | 'ERROR'
  data: any
  requestId: string
}

// AI难度配置
interface AIDifficulty {
  name: string
  thinkingTime: [number, number] // [min, max] 毫秒
  errorRate: number // 错误率 0-1
  strategyDepth: number // 策略深度
  memoryAccuracy: number // 记牌准确率 0-1
}

const AI_DIFFICULTIES: Record<string, AIDifficulty> = {
  easy: {
    name: '简单',
    thinkingTime: [1000, 3000],
    errorRate: 0.15,
    strategyDepth: 1,
    memoryAccuracy: 0.7
  },
  normal: {
    name: '普通',
    thinkingTime: [500, 2000],
    errorRate: 0.08,
    strategyDepth: 2,
    memoryAccuracy: 0.85
  },
  hard: {
    name: '困难',
    thinkingTime: [200, 1000],
    errorRate: 0.03,
    strategyDepth: 3,
    memoryAccuracy: 0.95
  }
}

/**
 * AI决策引擎
 */
class AIEngine {
  private difficulty: AIDifficulty
  private playedCards: Card[] = []
  private playerHands: Map<string, number> = new Map()
  
  constructor(difficulty: string = 'normal') {
    this.difficulty = AI_DIFFICULTIES[difficulty] || AI_DIFFICULTIES.normal
  }
  
  /**
   * 计算叫地主决策
   */
  calculateBid(hand: Card[], currentBid: number): Promise<number | 'pass'> {
    return new Promise((resolve) => {
      const thinkingTime = this.getRandomThinkingTime()
      
      setTimeout(() => {
        const handStrength = this.evaluateHandStrength(hand)
        const bidDecision = this.makeBidDecision(handStrength, currentBid)
        resolve(bidDecision)
      }, thinkingTime)
    })
  }
  
  /**
   * 计算出牌决策
   */
  calculateMove(
    hand: Card[], 
    lastPlayedCards: Card[], 
    playHistory: any[]
  ): Promise<{ action: 'play' | 'pass', cards?: Card[] }> {
    return new Promise((resolve) => {
      const thinkingTime = this.getRandomThinkingTime()
      
      setTimeout(() => {
        const decision = this.makePlayDecision(hand, lastPlayedCards, playHistory)
        resolve(decision)
      }, thinkingTime)
    })
  }
  
  /**
   * 评估手牌强度
   */
  private evaluateHandStrength(hand: Card[]): number {
    let strength = 0
    const valueCount = new Map<number, number>()
    
    // 统计牌值
    hand.forEach(card => {
      valueCount.set(card.value, (valueCount.get(card.value) || 0) + 1)
    })
    
    // 基础牌力
    hand.forEach(card => {
      if (card.suit === 'joker') {
        strength += card.value * 3 // 王的价值更高
      } else if (card.value === 15) { // 2
        strength += card.value * 2
      } else {
        strength += card.value
      }
    })
    
    // 牌型奖励
    valueCount.forEach((count, value) => {
      if (count === 4) strength += 100 // 炸弹
      else if (count === 3) strength += 30 // 三张
      else if (count === 2) strength += 10 // 对子
    })
    
    // 王炸奖励
    const hasSmallJoker = hand.some(c => c.suit === 'joker' && c.rank === 'small')
    const hasBigJoker = hand.some(c => c.suit === 'joker' && c.rank === 'big')
    if (hasSmallJoker && hasBigJoker) strength += 200
    
    return strength
  }
  
  /**
   * 叫地主决策
   */
  private makeBidDecision(handStrength: number, currentBid: number): number | 'pass' {
    // 根据手牌强度和当前叫分决定
    const thresholds = {
      1: 300, // 叫1分的最低强度
      2: 400, // 叫2分的最低强度
      3: 500  // 叫3分的最低强度
    }
    
    // 添加随机性和错误率
    const randomFactor = (Math.random() - 0.5) * 100
    const adjustedStrength = handStrength + randomFactor
    
    // 简单策略：如果手牌强度足够就叫地主
    if (currentBid === 0 && adjustedStrength >= thresholds[1]) {
      return Math.random() < this.difficulty.errorRate ? 'pass' : 1
    } else if (currentBid === 1 && adjustedStrength >= thresholds[2]) {
      return Math.random() < this.difficulty.errorRate ? 'pass' : 2
    } else if (currentBid === 2 && adjustedStrength >= thresholds[3]) {
      return Math.random() < this.difficulty.errorRate ? 'pass' : 3
    }
    
    return 'pass'
  }
  
  /**
   * 出牌决策
   */
  private makePlayDecision(
    hand: Card[], 
    lastPlayedCards: Card[], 
    playHistory: any[]
  ): { action: 'play' | 'pass', cards?: Card[] } {
    
    // 如果是首家出牌
    if (lastPlayedCards.length === 0) {
      return this.chooseFirstPlay(hand)
    }
    
    // 尝试找到能压过上家的牌
    const playableCards = this.findPlayableCards(hand, lastPlayedCards)
    
    if (playableCards.length === 0) {
      return { action: 'pass' }
    }
    
    // 选择最优出牌
    const bestPlay = this.selectBestPlay(playableCards, hand, playHistory)
    
    // 添加错误率
    if (Math.random() < this.difficulty.errorRate) {
      // 随机选择一个可出的牌
      const randomPlay = playableCards[Math.floor(Math.random() * playableCards.length)]
      return { action: 'play', cards: randomPlay }
    }
    
    return { action: 'play', cards: bestPlay }
  }
  
  /**
   * 选择首家出牌
   */
  private chooseFirstPlay(hand: Card[]): { action: 'play', cards: Card[] } {
    // 简单策略：出最小的单牌或对子
    const sortedHand = [...hand].sort((a, b) => a.value - b.value)
    
    // 查找对子
    const valueCount = new Map<number, Card[]>()
    sortedHand.forEach(card => {
      if (!valueCount.has(card.value)) {
        valueCount.set(card.value, [])
      }
      valueCount.get(card.value)!.push(card)
    })
    
    // 优先出最小的对子
    for (const [value, cards] of valueCount) {
      if (cards.length >= 2 && value < 15) { // 不出2的对子
        return { action: 'play', cards: cards.slice(0, 2) }
      }
    }
    
    // 否则出最小的单牌
    const smallestCard = sortedHand.find(card => card.value < 15) || sortedHand[0]
    return { action: 'play', cards: [smallestCard] }
  }
  
  /**
   * 找到可出的牌
   */
  private findPlayableCards(hand: Card[], lastPlayedCards: Card[]): Card[][] {
    const playableCards: Card[][] = []
    
    // 这里需要集成牌型判断逻辑
    // 简化版本：只处理单牌和对子
    if (lastPlayedCards.length === 1) {
      // 找比上家大的单牌
      const targetValue = lastPlayedCards[0].value
      const biggerCards = hand.filter(card => card.value > targetValue)
      biggerCards.forEach(card => {
        playableCards.push([card])
      })
    } else if (lastPlayedCards.length === 2) {
      // 找比上家大的对子
      const targetValue = lastPlayedCards[0].value
      const valueCount = new Map<number, Card[]>()
      
      hand.forEach(card => {
        if (!valueCount.has(card.value)) {
          valueCount.set(card.value, [])
        }
        valueCount.get(card.value)!.push(card)
      })
      
      valueCount.forEach((cards, value) => {
        if (cards.length >= 2 && value > targetValue) {
          playableCards.push(cards.slice(0, 2))
        }
      })
    }
    
    // 添加炸弹和王炸
    playableCards.push(...this.findBombs(hand))
    
    return playableCards
  }
  
  /**
   * 找到炸弹
   */
  private findBombs(hand: Card[]): Card[][] {
    const bombs: Card[][] = []
    const valueCount = new Map<number, Card[]>()
    
    hand.forEach(card => {
      if (!valueCount.has(card.value)) {
        valueCount.set(card.value, [])
      }
      valueCount.get(card.value)!.push(card)
    })
    
    // 四张炸弹
    valueCount.forEach(cards => {
      if (cards.length === 4) {
        bombs.push(cards)
      }
    })
    
    // 王炸
    const smallJoker = hand.find(c => c.suit === 'joker' && c.rank === 'small')
    const bigJoker = hand.find(c => c.suit === 'joker' && c.rank === 'big')
    if (smallJoker && bigJoker) {
      bombs.push([smallJoker, bigJoker])
    }
    
    return bombs
  }
  
  /**
   * 选择最佳出牌
   */
  private selectBestPlay(playableCards: Card[][], hand: Card[], playHistory: any[]): Card[] {
    if (playableCards.length === 0) return []
    
    // 简单策略：选择最小的可出牌
    return playableCards.reduce((best, current) => {
      const bestValue = Math.min(...best.map(c => c.value))
      const currentValue = Math.min(...current.map(c => c.value))
      return currentValue < bestValue ? current : best
    })
  }
  
  /**
   * 获取随机思考时间
   */
  private getRandomThinkingTime(): number {
    const [min, max] = this.difficulty.thinkingTime
    return Math.random() * (max - min) + min
  }
  
  /**
   * 更新记牌信息
   */
  updateMemory(playedCards: Card[], playerId: string) {
    // 根据记牌准确率决定是否记住
    if (Math.random() < this.difficulty.memoryAccuracy) {
      this.playedCards.push(...playedCards)
      
      // 更新玩家手牌数量
      const currentCount = this.playerHands.get(playerId) || 17
      this.playerHands.set(playerId, currentCount - playedCards.length)
    }
  }
}

// Worker消息处理
let aiEngine: AIEngine

self.onmessage = async (event: MessageEvent<AIMessage>) => {
  const { type, data, requestId } = event.data
  
  try {
    let response: AIResponse
    
    switch (type) {
      case 'INIT_AI':
        aiEngine = new AIEngine(data.difficulty)
        response = {
          type: 'MOVE_RESULT',
          data: { success: true },
          requestId
        }
        break
        
      case 'CALCULATE_BID':
        const bidResult = await aiEngine.calculateBid(data.hand, data.currentBid)
        response = {
          type: 'BID_RESULT',
          data: { bid: bidResult },
          requestId
        }
        break
        
      case 'CALCULATE_MOVE':
        const moveResult = await aiEngine.calculateMove(
          data.hand, 
          data.lastPlayedCards, 
          data.playHistory
        )
        response = {
          type: 'MOVE_RESULT',
          data: moveResult,
          requestId
        }
        break
        
      default:
        throw new Error(`Unknown message type: ${type}`)
    }
    
    self.postMessage(response)
    
  } catch (error) {
    const errorResponse: AIResponse = {
      type: 'ERROR',
      data: { error: error instanceof Error ? error.message : String(error) },
      requestId
    }
    self.postMessage(errorResponse)
  }
}
