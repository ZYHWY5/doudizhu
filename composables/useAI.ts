/**
 * AI系统和托管功能
 */

import type { Card } from '~/stores/game'

export interface AIDecision {
  action: 'play' | 'pass' | 'bid'
  cards?: Card[]
  bid?: 'call' | 'grab' | 'pass'
  confidence: number // 0-1 决策置信度
}

export interface AIConfig {
  difficulty: 'easy' | 'normal' | 'hard'
  enableThinking: boolean // 是否显示思考时间
  enableHints: boolean // 是否提供提示
  autoPlayDelay: number // 托管出牌延迟(ms)
}

export const useAI = () => {
  // AI Worker实例
  const aiWorker = ref<Worker | null>(null)
  const isWorkerReady = ref(false)
  
  // AI配置
  const aiConfig = ref<AIConfig>({
    difficulty: 'normal',
    enableThinking: true,
    enableHints: true,
    autoPlayDelay: 200 // 减少到200ms，让AI反应更快
  })
  
  // 请求ID计数器
  let requestIdCounter = 0
  
  // 等待中的请求
  const pendingRequests = new Map<string, {
    resolve: (value: any) => void
    reject: (error: Error) => void
    timeout?: NodeJS.Timeout
  }>()
  
  /**
   * 初始化AI系统
   */
  const initializeAI = async (difficulty: 'easy' | 'normal' | 'hard' = 'normal') => {
    if (!process.client) return
    
    try {
      // 🔑 初始化API密钥
      const savedApiKey = localStorage.getItem('groq_api_key')
      if (savedApiKey) {
        console.log('🔑 加载已保存的API密钥:', savedApiKey.substring(0, 10) + '...')
        const { setAIApiKey } = await import('~/utils/aiAPI')
        setAIApiKey(savedApiKey)
      } else {
        console.log('🔑 未找到保存的API密钥，将使用本地规则AI')
      }
      
      // 创建AI Worker
      aiWorker.value = new Worker('/workers/ai-worker.js', { type: 'module' })
      
      // 监听Worker消息
      aiWorker.value.onmessage = handleWorkerMessage
      aiWorker.value.onerror = handleWorkerError
      
      // 初始化AI引擎
      await sendWorkerMessage('INIT_AI', { difficulty })
      
      aiConfig.value.difficulty = difficulty
      isWorkerReady.value = true
      
      console.log(`AI系统初始化完成，难度: ${difficulty}`)
      
    } catch (error) {
      console.error('AI系统初始化失败:', error)
      // 降级到同步AI
      isWorkerReady.value = false
    }
  }
  
  /**
   * 计算AI叫地主决策
   */
  const calculateAIBid = async (hand: Card[], biddingInfo: any): Promise<'call' | 'grab' | 'pass'> => {
    if (!isWorkerReady.value || !aiWorker.value) {
      // 降级到简单AI
      return calculateSimpleBid(hand, biddingInfo)
    }
    
    try {
      const result = await sendWorkerMessage('CALCULATE_BID', {
        hand: hand.map(card => ({ ...card })), // 深拷贝避免引用问题
        biddingInfo
      })
      
      return result.bid
    } catch (error) {
      console.error('AI叫地主计算失败:', error)
      return calculateSimpleBid(hand, biddingInfo)
    }
  }
  
  /**
   * 计算AI出牌决策
   */
  const calculateAIMove = async (
    hand: Card[], 
    lastPlayedCards: Card[], 
    playHistory: any[]
  ): Promise<{ action: 'play' | 'pass', cards?: Card[] }> => {
    if (!isWorkerReady.value || !aiWorker.value) {
      // 降级到简单AI
      return calculateSimpleMove(hand, lastPlayedCards)
    }
    
    try {
      const result = await sendWorkerMessage('CALCULATE_MOVE', {
        hand: hand.map(card => ({ ...card })),
        lastPlayedCards: lastPlayedCards.map(card => ({ ...card })),
        playHistory: playHistory.map(record => ({ ...record }))
      })
      
      return result
    } catch (error) {
      console.error('AI出牌计算失败:', error)
      return calculateSimpleMove(hand, lastPlayedCards)
    }
  }
  
  /**
   * 获取AI提示
   */
  const getAIHint = async (
    hand: Card[], 
    lastPlayedCards: Card[]
  ): Promise<{ cards: Card[], description: string } | null> => {
    if (!aiConfig.value.enableHints) return null
    
    try {
      const decision = await calculateAIMove(hand, lastPlayedCards, [])
      
      if (decision.action === 'play' && decision.cards) {
        return {
          cards: decision.cards,
          description: getPlayDescription(decision.cards)
        }
      }
      
      return null
    } catch (error) {
      console.error('获取AI提示失败:', error)
      return null
    }
  }
  
  /**
   * 托管模式执行
   */
  const executeAutoPlay = async (
    gameState: any,
    playerId: string
  ): Promise<AIDecision> => {
    console.log('executeAutoPlay 被调用:', { playerId, phase: gameState.phase })
    const player = gameState.players.find((p: any) => p.id === playerId)
    if (!player) {
      console.error('玩家不存在:', playerId, '所有玩家:', gameState.players.map((p: any) => p.id))
      throw new Error('玩家不存在')
    }
    
    // 检查是否是简单决策（可以快速响应）
    let isSimpleDecision = false
    let delay = aiConfig.value.autoPlayDelay
    
    if (gameState.phase === 'bidding') {
      // 叫地主阶段通常需要一点思考时间
      delay = Math.min(aiConfig.value.autoPlayDelay, 500)
    } else if (gameState.phase === 'playing') {
      // 如果没有可出的牌，只能过牌，这是简单决策
      if (!gameState.lastPlayedCards || gameState.lastPlayedCards.length === 0) {
        // 首次出牌，需要一点思考
        delay = Math.min(aiConfig.value.autoPlayDelay, 300)
      } else {
        // 跟牌阶段，可以相对快一些
        delay = Math.min(aiConfig.value.autoPlayDelay, 400)
      }
    }
    
    console.log('AI思考延迟:', delay, 'ms')
    
    // 添加思考延迟（但更短了）
    if (aiConfig.value.enableThinking && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    // 根据游戏阶段执行不同操作
    if (gameState.phase === 'bidding') {
      const bid = await calculateAIBid(player.cards, gameState.biddingInfo)
      return {
        action: 'bid',
        bid,
        confidence: 0.8
      }
    } else if (gameState.phase === 'playing') {
      const move = await calculateAIMove(
        player.cards,
        gameState.lastPlayedCards,
        gameState.playHistory
      )
      
      return {
        action: move.action,
        cards: move.cards,
        confidence: 0.8
      }
    }
    
    throw new Error('无效的游戏阶段')
  }
  
  /**
   * 发送Worker消息
   */
  const sendWorkerMessage = (type: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!aiWorker.value) {
        reject(new Error('AI Worker未初始化'))
        return
      }
      
      const requestId = `req-${++requestIdCounter}`
      
      // 设置超时
      const timeout = setTimeout(() => {
        pendingRequests.delete(requestId)
        reject(new Error('AI计算超时'))
      }, 10000) // 10秒超时
      
      // 存储请求
      pendingRequests.set(requestId, { resolve, reject, timeout })
      
      // 发送消息
      aiWorker.value.postMessage({ type, data, requestId })
    })
  }
  
  /**
   * 处理Worker消息
   */
  const handleWorkerMessage = (event: MessageEvent) => {
    const { requestId, type, data } = event.data
    const request = pendingRequests.get(requestId)
    
    if (!request) return
    
    // 清理请求
    if (request.timeout) clearTimeout(request.timeout)
    pendingRequests.delete(requestId)
    
    if (type === 'ERROR') {
      request.reject(new Error(data.error))
    } else {
      request.resolve(data)
    }
  }
  
  /**
   * 处理Worker错误
   */
  const handleWorkerError = (error: ErrorEvent) => {
    console.error('AI Worker错误:', error)
    
    // 清理所有等待中的请求
    pendingRequests.forEach(({ reject, timeout }) => {
      if (timeout) clearTimeout(timeout)
      reject(new Error('AI Worker异常'))
    })
    pendingRequests.clear()
    
    isWorkerReady.value = false
  }
  
  /**
   * 简单AI叫地主（降级方案）
   */
  const calculateSimpleBid = (hand: Card[], biddingInfo: any): 'call' | 'grab' | 'pass' => {
    let strength = 0
    let bombs = 0
    let rockets = 0
    
    // 评估手牌强度
    const cardCounts = new Map<number, number>()
    hand.forEach(card => {
      if (card.suit === 'joker') {
        strength += 30
        if (card.value === 16) rockets++ // 小王
        if (card.value === 17) rockets++ // 大王
      } else {
        strength += Math.max(card.value - 10, 1) // 基础分数
        cardCounts.set(card.value, (cardCounts.get(card.value) || 0) + 1)
      }
    })
    
    // 检查炸弹
    cardCounts.forEach(count => {
      if (count >= 4) bombs++
    })
    
    // 王炸额外加分
    if (rockets >= 2) strength += 50
    
    // 炸弹加分
    strength += bombs * 30
    
    console.log('AI叫地主评估:', { 
      strength, 
      bombs, 
      rockets, 
      phase: biddingInfo.phase,
      handSize: hand.length 
    })
    
    // 叫地主阶段
    if (biddingInfo.phase === 'calling') {
      // 手牌强度足够或有特殊牌型就叫地主
      if (strength > 80 || bombs > 0 || rockets >= 2) {
        return 'call'
      }
      // 如果前面的人都不叫，适当放宽标准避免重发
      const passCount = biddingInfo.bids.filter((bid: any) => bid.bid === 'pass').length
      if (passCount >= 2 && strength > 60) {
        return 'call'
      }
      return 'pass'
    }
    
    // 抢地主阶段
    if (biddingInfo.phase === 'grabbing') {
      // 只有手牌特别强才抢地主
      if (strength > 120 || bombs > 1 || rockets >= 2) {
        return 'grab'
      }
      return 'pass'
    }
    
    return 'pass'
  }
  
  /**
   * 简单AI出牌（降级方案）- 改进版
   */
  const calculateSimpleMove = (
    hand: Card[], 
    lastPlayedCards: Card[]
  ): { action: 'play' | 'pass', cards?: Card[] } => {
    console.log('降级AI出牌，手牌:', hand.map(c => `${c.rank}${c.suit}`))
    
    // 分析手牌结构
    const handAnalysis = analyzeSimpleHand(hand)
    
    // 如果是首家出牌
    if (lastPlayedCards.length === 0) {
      console.log('降级AI首家出牌')
      
      // 优先出小对子
      const smallPairs = handAnalysis.pairs.filter(pair => pair.value <= 8)
      if (smallPairs.length > 0) {
        console.log('降级AI选择小对子')
        return { action: 'play', cards: smallPairs[0].cards }
      }
      
      // 其次出小三张
      const smallTriples = handAnalysis.triples.filter(triple => triple.value <= 7)
      if (smallTriples.length > 0) {
        console.log('降级AI选择小三张')
        return { action: 'play', cards: smallTriples[0].cards }
      }
      
      // 最后出最小单张
      const smallestCard = hand.reduce((min, card) => 
        card.value < min.value ? card : min
      )
      console.log('降级AI选择最小单张')
      return { action: 'play', cards: [smallestCard] }
    }
    
    // 跟牌逻辑
    const lastValue = lastPlayedCards[0].value
    const lastCount = lastPlayedCards.length
    
    // 单张
    if (lastCount === 1) {
      const biggerCard = hand.find(card => card.value > lastValue)
      if (biggerCard) {
        console.log('降级AI跟单张')
        return { action: 'play', cards: [biggerCard] }
      }
    }
    
    // 对子
    else if (lastCount === 2) {
      const biggerPair = handAnalysis.pairs.find(pair => pair.value > lastValue)
      if (biggerPair) {
        console.log('降级AI跟对子')
        return { action: 'play', cards: biggerPair.cards }
      }
    }
    
    // 三张
    else if (lastCount === 3) {
      const biggerTriple = handAnalysis.triples.find(triple => triple.value > lastValue)
      if (biggerTriple) {
        console.log('降级AI跟三张')
        return { action: 'play', cards: biggerTriple.cards }
      }
    }
    
    // 炸弹总是可以出
    if (handAnalysis.bombs.length > 0) {
      console.log('降级AI出炸弹')
      return { action: 'play', cards: handAnalysis.bombs[0].cards }
    }
    
    console.log('降级AI选择过牌')
    return { action: 'pass' }
  }
  
  /**
   * 简单手牌分析（降级方案）
   */
  const analyzeSimpleHand = (hand: Card[]) => {
    const analysis = {
      singles: [] as { cards: Card[], value: number }[],
      pairs: [] as { cards: Card[], value: number }[],
      triples: [] as { cards: Card[], value: number }[],
      bombs: [] as { cards: Card[], value: number }[]
    }
    
    // 按rank分组
    const rankGroups = new Map<string, Card[]>()
    hand.forEach(card => {
      const rank = card.rank
      if (!rankGroups.has(rank)) {
        rankGroups.set(rank, [])
      }
      rankGroups.get(rank)!.push(card)
    })
    
    // 分析各种牌型
    rankGroups.forEach((cards, rank) => {
      const count = cards.length
      const value = cards[0].value
      
      if (count === 1) {
        analysis.singles.push({ cards, value })
      } else if (count === 2) {
        analysis.pairs.push({ cards, value })
      } else if (count === 3) {
        analysis.triples.push({ cards, value })
      } else if (count === 4) {
        analysis.bombs.push({ cards, value })
      }
    })
    
    // 按value排序
    analysis.singles.sort((a, b) => a.value - b.value)
    analysis.pairs.sort((a, b) => a.value - b.value)
    analysis.triples.sort((a, b) => a.value - b.value)
    analysis.bombs.sort((a, b) => a.value - b.value)
    
    return analysis
  }
  
  /**
   * 获取出牌描述
   */
  const getPlayDescription = (cards: Card[]): string => {
    if (cards.length === 1) return `单张${cards[0].rank}`
    if (cards.length === 2) return `对${cards[0].rank}`
    if (cards.length === 3) return `三张${cards[0].rank}`
    return `${cards.length}张牌`
  }
  
  /**
   * 更新AI配置
   */
  const updateAIConfig = (newConfig: Partial<AIConfig>) => {
    aiConfig.value = { ...aiConfig.value, ...newConfig }
  }
  
  /**
   * 清理AI资源
   */
  const cleanupAI = () => {
    // 清理等待中的请求
    pendingRequests.forEach(({ reject, timeout }) => {
      if (timeout) clearTimeout(timeout)
      reject(new Error('AI系统已关闭'))
    })
    pendingRequests.clear()
    
    // 终止Worker
    if (aiWorker.value) {
      aiWorker.value.terminate()
      aiWorker.value = null
    }
    
    isWorkerReady.value = false
  }
  
  // 组件卸载时清理（仅在组件上下文中）
  try {
    onUnmounted(() => {
      cleanupAI()
    })
  } catch (error) {
    // 在非组件上下文中，onUnmounted 会失败，这是正常的
    // AI 清理将由游戏状态管理器手动调用
  }
  
  return {
    // 状态
    isWorkerReady: readonly(isWorkerReady),
    aiConfig: readonly(aiConfig),
    
    // 方法
    initializeAI,
    calculateAIBid,
    calculateAIMove,
    getAIHint,
    executeAutoPlay,
    updateAIConfig,
    cleanupAI
  }
}
