// AI Worker - 简化版JavaScript实现

// AI难度配置
const AI_DIFFICULTY = {
  easy: { thinkTime: 500, errorRate: 0.3, strategy: 'random' },
  normal: { thinkTime: 1000, errorRate: 0.15, strategy: 'basic' },
  hard: { thinkTime: 1500, errorRate: 0.05, strategy: 'advanced' }
}

let currentDifficulty = 'normal'

// 简化的AI引擎
class SimpleAIEngine {
  constructor(difficulty = 'normal') {
    this.difficulty = AI_DIFFICULTY[difficulty] || AI_DIFFICULTY.normal
    currentDifficulty = difficulty
  }

  // 叫地主决策
  async calculateBid(hand, currentBid) {
    // 模拟思考时间
    await this.sleep(this.difficulty.thinkTime)

    // 简单的手牌强度计算
    const strength = this.calculateHandStrength(hand)
    
    // 根据强度和当前叫分决定
    if (currentDifficulty === 'easy') {
      // 简单AI - 随机决策
      return Math.random() < 0.4 ? (currentBid + 1 > 3 ? 'pass' : currentBid + 1) : 'pass'
    } else if (currentDifficulty === 'normal') {
      // 普通AI - 基于手牌强度
      if (strength > 60 && currentBid < 2) return currentBid + 1
      if (strength > 80 && currentBid < 3) return currentBid + 1
      return 'pass'
    } else {
      // 困难AI - 更智能的决策
      if (strength > 50 && currentBid < 1) return 1
      if (strength > 70 && currentBid < 2) return 2
      if (strength > 85 && currentBid < 3) return 3
      return 'pass'
    }
  }

  // 出牌决策
  async calculateMove(hand, lastPlayedCards, playHistory) {
    // 模拟思考时间
    await this.sleep(this.difficulty.thinkTime)

    // 如果是首家出牌
    if (!lastPlayedCards || lastPlayedCards.length === 0) {
      return this.chooseFirstPlay(hand)
    }

    // 尝试找到能出的牌
    const playableCards = this.findPlayableCards(hand, lastPlayedCards)
    
    if (playableCards.length === 0) {
      return { action: 'pass' }
    }

    // 选择出牌策略
    const selectedCards = this.selectBestPlay(playableCards, hand)
    
    return {
      action: 'play',
      cards: selectedCards
    }
  }

  // 计算手牌强度
  calculateHandStrength(hand) {
    let strength = 0
    
    // 统计各种牌型
    const rankCounts = {}
    hand.forEach(card => {
      const rank = card.rank
      rankCounts[rank] = (rankCounts[rank] || 0) + 1
    })
    
    // 炸弹加分
    Object.values(rankCounts).forEach(count => {
      if (count === 4) strength += 25 // 炸弹
      else if (count === 3) strength += 10 // 三张
      else if (count === 2) strength += 5 // 对子
    })
    
    // 大牌加分
    hand.forEach(card => {
      if (card.rank === '2') strength += 8
      else if (card.rank === 'A') strength += 6
      else if (card.rank === 'K') strength += 4
      else if (card.rank === 'JOKER_RED' || card.rank === 'JOKER_BLACK') strength += 15
    })
    
    return Math.min(100, strength)
  }

  // 选择首家出牌 - 改进版
  chooseFirstPlay(hand) {
    console.log('AI首家出牌，手牌:', hand.map(c => `${c.rank}${c.suit}`))
    
    // 分析手牌结构
    const handAnalysis = this.analyzeHand(hand)
    console.log('手牌分析:', handAnalysis)
    
    // 策略优先级：
    // 1. 小对子 (3-8)
    // 2. 小三张 (3-7) 
    // 3. 小单张 (3-7)
    // 4. 较大单张 (8-K)
    
    // 尝试出小对子
    const smallPairs = handAnalysis.pairs.filter(pair => 
      pair.cards[0].value >= 3 && pair.cards[0].value <= 8
    )
    if (smallPairs.length > 0) {
      const selectedPair = smallPairs[0]
      console.log('AI选择出小对子:', selectedPair.cards.map(c => `${c.rank}${c.suit}`))
      return {
        action: 'play',
        cards: selectedPair.cards
      }
    }
    
    // 尝试出小三张
    const smallTriples = handAnalysis.triples.filter(triple => 
      triple.cards[0].value >= 3 && triple.cards[0].value <= 7
    )
    if (smallTriples.length > 0) {
      const selectedTriple = smallTriples[0]
      console.log('AI选择出小三张:', selectedTriple.cards.map(c => `${c.rank}${c.suit}`))
      return {
        action: 'play',
        cards: selectedTriple.cards
      }
    }
    
    // 出最小单张
    const sortedSingles = hand
      .filter(card => !this.isPartOfMultiple(card, handAnalysis))
      .sort((a, b) => (a.value || 0) - (b.value || 0))
    
    if (sortedSingles.length > 0) {
      console.log('AI选择出小单张:', `${sortedSingles[0].rank}${sortedSingles[0].suit}`)
      return {
        action: 'play',
        cards: [sortedSingles[0]]
      }
    }
    
    // 备选：出最小的牌
    const sortedHand = [...hand].sort((a, b) => (a.value || 0) - (b.value || 0))
    console.log('AI备选出最小牌:', `${sortedHand[0].rank}${sortedHand[0].suit}`)
    return {
      action: 'play',
      cards: [sortedHand[0]]
    }
  }

  // 查找可出的牌 - 改进版
  findPlayableCards(hand, lastPlayedCards) {
    console.log('AI查找可出牌，上家出牌:', lastPlayedCards.map(c => `${c.rank}${c.suit}`))
    
    const playableOptions = []
    const handAnalysis = this.analyzeHand(hand)
    const lastCardCount = lastPlayedCards.length
    const lastValue = lastPlayedCards[0]?.value || 0
    
    // 1. 单张
    if (lastCardCount === 1) {
      handAnalysis.singles.forEach(single => {
        if (single.value > lastValue) {
          playableOptions.push({
            type: 'single',
            cards: single.cards,
            value: single.value,
            priority: 1
          })
        }
      })
      
      // 也可以拆对子出单张
      handAnalysis.pairs.forEach(pair => {
        if (pair.value > lastValue) {
          playableOptions.push({
            type: 'single_from_pair',
            cards: [pair.cards[0]],
            value: pair.value,
            priority: 3 // 较低优先级
          })
        }
      })
    }
    
    // 2. 对子
    else if (lastCardCount === 2) {
      handAnalysis.pairs.forEach(pair => {
        if (pair.value > lastValue) {
          playableOptions.push({
            type: 'pair',
            cards: pair.cards,
            value: pair.value,
            priority: 1
          })
        }
      })
      
      // 也可以拆三张出对子
      handAnalysis.triples.forEach(triple => {
        if (triple.value > lastValue) {
          playableOptions.push({
            type: 'pair_from_triple',
            cards: triple.cards.slice(0, 2),
            value: triple.value,
            priority: 3 // 较低优先级
          })
        }
      })
    }
    
    // 3. 三张
    else if (lastCardCount === 3) {
      handAnalysis.triples.forEach(triple => {
        if (triple.value > lastValue) {
          playableOptions.push({
            type: 'triple',
            cards: triple.cards,
            value: triple.value,
            priority: 1
          })
        }
      })
    }
    
    // 4. 炸弹总是可以出（除非对方也是炸弹且更大）
    if (lastCardCount !== 4 || lastValue < 15) { // 不是炸弹或者是小炸弹
      handAnalysis.bombs.forEach(bomb => {
        if (lastCardCount !== 4 || bomb.value > lastValue) {
          playableOptions.push({
            type: 'bomb',
            cards: bomb.cards,
            value: bomb.value,
            priority: 2 // 中等优先级，不轻易出
          })
        }
      })
    }
    
    // 5. 王炸总是可以出
    handAnalysis.rockets.forEach(rocket => {
      playableOptions.push({
        type: 'rocket',
        cards: rocket.cards,
        value: rocket.value,
        priority: 4 // 最低优先级，最后手段
      })
    })
    
    console.log('AI找到可出牌选项:', playableOptions.length, '个')
    playableOptions.forEach((option, i) => {
      console.log(`选项${i+1}: ${option.type}, 牌:`, option.cards.map(c => `${c.rank}${c.suit}`), `优先级:${option.priority}`)
    })
    
    return playableOptions
  }

  // 选择最佳出牌 - 改进版
  selectBestPlay(playableOptions, hand) {
    if (playableOptions.length === 0) return []
    
    console.log('AI选择最佳出牌，选项数量:', playableOptions.length)
    
    // 按优先级分组
    const groupedByPriority = {}
    playableOptions.forEach(option => {
      const priority = option.priority
      if (!groupedByPriority[priority]) {
        groupedByPriority[priority] = []
      }
      groupedByPriority[priority].push(option)
    })
    
    // 选择最高优先级组（数字越小优先级越高）
    const priorities = Object.keys(groupedByPriority).map(Number).sort((a, b) => a - b)
    const bestPriorityGroup = groupedByPriority[priorities[0]]
    
    console.log('最佳优先级组:', priorities[0], '选项数量:', bestPriorityGroup.length)
    
    // 在同优先级中选择最小的牌
    const selectedOption = bestPriorityGroup.reduce((best, current) => {
      return current.value < best.value ? current : best
    })
    
    console.log('AI最终选择:', selectedOption.type, '牌:', selectedOption.cards.map(c => `${c.rank}${c.suit}`))
    
    return selectedOption.cards
  }

  // 分析手牌结构 - 新增
  analyzeHand(hand) {
    const analysis = {
      singles: [],
      pairs: [],
      triples: [],
      bombs: [],
      rockets: []
    }
    
    // 按rank分组
    const rankGroups = {}
    hand.forEach(card => {
      const rank = card.rank
      if (!rankGroups[rank]) {
        rankGroups[rank] = []
      }
      rankGroups[rank].push(card)
    })
    
    // 分析各种牌型
    Object.entries(rankGroups).forEach(([rank, cards]) => {
      const count = cards.length
      const value = cards[0].value || 0
      
      if (count === 1) {
        analysis.singles.push({ rank, cards, value })
      } else if (count === 2) {
        analysis.pairs.push({ rank, cards, value })
      } else if (count === 3) {
        analysis.triples.push({ rank, cards, value })
      } else if (count === 4) {
        analysis.bombs.push({ rank, cards, value })
      }
    })
    
    // 检查王炸
    const jokers = hand.filter(card => card.suit === 'joker' || card.rank.includes('JOKER'))
    if (jokers.length === 2) {
      analysis.rockets.push({ rank: 'ROCKET', cards: jokers, value: 100 })
    }
    
    // 按value排序
    analysis.singles.sort((a, b) => a.value - b.value)
    analysis.pairs.sort((a, b) => a.value - b.value)
    analysis.triples.sort((a, b) => a.value - b.value)
    analysis.bombs.sort((a, b) => a.value - b.value)
    
    return analysis
  }
  
  // 检查卡牌是否属于多张组合 - 新增
  isPartOfMultiple(card, analysis) {
    const rank = card.rank
    
    // 检查是否是对子、三张或炸弹的一部分
    return analysis.pairs.some(pair => pair.rank === rank) ||
           analysis.triples.some(triple => triple.rank === rank) ||
           analysis.bombs.some(bomb => bomb.rank === rank) ||
           analysis.rockets.some(rocket => rocket.cards.includes(card))
  }
  
  // 延迟函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 全局AI引擎实例
let aiEngine = null

// Worker消息处理
self.onmessage = async (event) => {
  const { type, data, requestId } = event.data
  
  try {
    let response
    
    switch (type) {
      case 'INIT_AI':
        aiEngine = new SimpleAIEngine(data.difficulty)
        response = {
          type: 'INIT_RESULT',
          data: { success: true },
          requestId
        }
        break
        
      case 'CALCULATE_BID':
        if (!aiEngine) {
          throw new Error('AI引擎未初始化')
        }
        const bidResult = await aiEngine.calculateBid(data.hand, data.currentBid)
        response = {
          type: 'BID_RESULT',
          data: { bid: bidResult },
          requestId
        }
        break
        
      case 'CALCULATE_MOVE':
        if (!aiEngine) {
          throw new Error('AI引擎未初始化')
        }
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
        throw new Error(`未知消息类型: ${type}`)
    }
    
    self.postMessage(response)
    
  } catch (error) {
    const errorResponse = {
      type: 'ERROR',
      data: { error: error.message },
      requestId
    }
    self.postMessage(errorResponse)
  }
}

console.log('AI Worker 已加载')
