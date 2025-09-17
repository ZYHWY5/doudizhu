import type { Card } from '~/stores/game'

// 斗地主完整规则实现

export interface CardPattern {
  type: string
  cards: Card[]
  weight: number
  description: string
  mainValue?: number
  chainLength?: number
}

export interface GameRules {
  // 牌型验证
  validatePattern(cards: Card[]): CardPattern | null
  
  // 比较牌型大小
  comparePatterns(pattern1: CardPattern, pattern2: CardPattern): number
  
  // 获取可出牌提示
  getPlayableCards(hand: Card[], lastPattern: CardPattern | null): CardPattern[]
  
  // 计算手牌强度
  calculateHandStrength(hand: Card[]): number
}

/**
 * 斗地主规则实现类
 */
export class LandlordRules implements GameRules {
  
  /**
   * 验证牌型
   */
  validatePattern(cards: Card[]): CardPattern | null {
    if (cards.length === 0) return null
    
    const sortedCards = this.sortCards(cards)
    const valueCount = this.getValueCount(sortedCards)
    
    // 按牌数量分类检查
    switch (cards.length) {
      case 1:
        return this.validateSingle(sortedCards)
      case 2:
        return this.validateDouble(sortedCards, valueCount)
      case 3:
        return this.validateTriple(sortedCards, valueCount)
      case 4:
        return this.validateQuadruple(sortedCards, valueCount)
      case 5:
        return this.validateFive(sortedCards, valueCount)
      default:
        return this.validateMultiple(sortedCards, valueCount)
    }
  }
  
  /**
   * 比较两个牌型的大小
   */
  comparePatterns(pattern1: CardPattern, pattern2: CardPattern): number {
    // 王炸最大
    if (pattern1.type === 'rocket') return 1
    if (pattern2.type === 'rocket') return -1
    
    // 炸弹大于普通牌型
    if (pattern1.type === 'bomb' && pattern2.type !== 'bomb') return 1
    if (pattern2.type === 'bomb' && pattern1.type !== 'bomb') return -1
    
    // 相同牌型比较权重
    if (pattern1.type === pattern2.type && pattern1.cards.length === pattern2.cards.length) {
      return pattern1.weight - pattern2.weight
    }
    
    // 不同牌型无法比较
    return 0
  }
  
  /**
   * 获取可出的牌型
   */
  getPlayableCards(hand: Card[], lastPattern: CardPattern | null): CardPattern[] {
    const playablePatterns: CardPattern[] = []
    
    if (!lastPattern) {
      // 首家出牌，返回所有可能的牌型
      return this.getAllPossiblePatterns(hand)
    }
    
    // 寻找能压过上家的牌型
    const allPatterns = this.getAllPossiblePatterns(hand)
    
    for (const pattern of allPatterns) {
      if (this.comparePatterns(pattern, lastPattern) > 0) {
        playablePatterns.push(pattern)
      }
    }
    
    return playablePatterns.sort((a, b) => a.weight - b.weight)
  }
  
  /**
   * 计算手牌强度
   */
  calculateHandStrength(hand: Card[]): number {
    let strength = 0
    const valueCount = this.getValueCount(hand)
    
    // 基础牌力
    hand.forEach(card => {
      strength += this.getCardBaseValue(card)
    })
    
    // 牌型组合奖励
    strength += this.calculatePatternBonus(hand, valueCount)
    
    return strength
  }
  
  /**
   * 验证单张
   */
  private validateSingle(cards: Card[]): CardPattern {
    return {
      type: 'single',
      cards,
      weight: cards[0].value,
      description: `单张${cards[0].rank}`,
      mainValue: cards[0].value
    }
  }
  
  /**
   * 验证对子或王炸
   */
  private validateDouble(cards: Card[], valueCount: Map<number, number>): CardPattern | null {
    // 王炸
    if (cards.length === 2 && 
        cards.every(c => c.suit === 'joker')) {
      return {
        type: 'rocket',
        cards,
        weight: 1000,
        description: '王炸',
        mainValue: 17
      }
    }
    
    // 对子
    const values = Array.from(valueCount.keys())
    if (values.length === 1 && valueCount.get(values[0]) === 2) {
      return {
        type: 'pair',
        cards,
        weight: values[0],
        description: `对${cards[0].rank}`,
        mainValue: values[0]
      }
    }
    
    return null
  }
  
  /**
   * 验证三张
   */
  private validateTriple(cards: Card[], valueCount: Map<number, number>): CardPattern | null {
    const values = Array.from(valueCount.keys())
    
    if (values.length === 1 && valueCount.get(values[0]) === 3) {
      return {
        type: 'triple',
        cards,
        weight: values[0],
        description: `三张${cards[0].rank}`,
        mainValue: values[0]
      }
    }
    
    return null
  }
  
  /**
   * 验证四张牌
   */
  private validateQuadruple(cards: Card[], valueCount: Map<number, number>): CardPattern | null {
    const values = Array.from(valueCount.keys())
    
    // 炸弹
    if (values.length === 1 && valueCount.get(values[0]) === 4) {
      return {
        type: 'bomb',
        cards,
        weight: 100 + values[0],
        description: `炸弹${cards[0].rank}`,
        mainValue: values[0]
      }
    }
    
    // 三带一
    if (values.length === 2) {
      const tripleValue = values.find(v => valueCount.get(v) === 3)
      const singleValue = values.find(v => valueCount.get(v) === 1)
      
      if (tripleValue && singleValue) {
        return {
          type: 'triple_with_single',
          cards,
          weight: tripleValue,
          description: '三带一',
          mainValue: tripleValue
        }
      }
    }
    
    return null
  }
  
  /**
   * 验证五张牌
   */
  private validateFive(cards: Card[], valueCount: Map<number, number>): CardPattern | null {
    const values = Array.from(valueCount.keys()).sort((a, b) => a - b)
    
    // 顺子
    if (values.length === 5 && this.isConsecutive(values)) {
      return {
        type: 'straight',
        cards,
        weight: values[0],
        description: `顺子${cards[0].rank}-${cards[4].rank}`,
        mainValue: values[0],
        chainLength: 5
      }
    }
    
    // 三带二
    if (values.length === 2) {
      const tripleValue = values.find(v => valueCount.get(v) === 3)
      const pairValue = values.find(v => valueCount.get(v) === 2)
      
      if (tripleValue && pairValue) {
        return {
          type: 'triple_with_pair',
          cards,
          weight: tripleValue,
          description: '三带二',
          mainValue: tripleValue
        }
      }
    }
    
    return null
  }
  
  /**
   * 验证多张牌
   */
  private validateMultiple(cards: Card[], valueCount: Map<number, number>): CardPattern | null {
    const values = Array.from(valueCount.keys()).sort((a, b) => a - b)
    
    // 连对
    if (this.isPairStraight(values, valueCount)) {
      return {
        type: 'pair_straight',
        cards,
        weight: values[0],
        description: `连对${cards[0].rank}-${cards[cards.length-1].rank}`,
        mainValue: values[0],
        chainLength: values.length
      }
    }
    
    // 飞机
    const tripleStraight = this.getTripleStraight(values, valueCount)
    if (tripleStraight.length >= 2) {
      const remainingCards = cards.length - tripleStraight.length * 3
      
      if (remainingCards === 0) {
        return {
          type: 'airplane',
          cards,
          weight: tripleStraight[0],
          description: '飞机',
          mainValue: tripleStraight[0],
          chainLength: tripleStraight.length
        }
      } else if (remainingCards === tripleStraight.length) {
        return {
          type: 'airplane_with_single',
          cards,
          weight: tripleStraight[0],
          description: '飞机带单张',
          mainValue: tripleStraight[0],
          chainLength: tripleStraight.length
        }
      } else if (remainingCards === tripleStraight.length * 2) {
        return {
          type: 'airplane_with_pair',
          cards,
          weight: tripleStraight[0],
          description: '飞机带对子',
          mainValue: tripleStraight[0],
          chainLength: tripleStraight.length
        }
      }
    }
    
    // 长顺子
    if (values.length >= 5 && 
        values.every(v => valueCount.get(v) === 1) && 
        this.isConsecutive(values)) {
      return {
        type: 'straight',
        cards,
        weight: values[0],
        description: `顺子${cards[0].rank}-${cards[cards.length-1].rank}`,
        mainValue: values[0],
        chainLength: values.length
      }
    }
    
    // 四带二
    if (cards.length === 6 || cards.length === 8) {
      const quadValue = values.find(v => valueCount.get(v) === 4)
      if (quadValue) {
        const isTwoPairs = cards.length === 8 && 
          values.filter(v => valueCount.get(v) === 2).length === 2
        const isTwoSingles = cards.length === 6 && 
          values.filter(v => valueCount.get(v) === 1).length === 2
        
        if (isTwoPairs || isTwoSingles) {
          return {
            type: 'quad_with_two',
            cards,
            weight: 100 + quadValue,
            description: isTwoPairs ? '四带两对' : '四带两单',
            mainValue: quadValue
          }
        }
      }
    }
    
    return null
  }
  
  /**
   * 获取所有可能的牌型
   */
  private getAllPossiblePatterns(hand: Card[]): CardPattern[] {
    const patterns: CardPattern[] = []
    
    // 生成所有可能的牌组合
    const combinations = this.generateCombinations(hand)
    
    for (const combo of combinations) {
      const pattern = this.validatePattern(combo)
      if (pattern) {
        patterns.push(pattern)
      }
    }
    
    return patterns
  }
  
  /**
   * 生成牌的所有组合
   */
  private generateCombinations(cards: Card[]): Card[][] {
    const combinations: Card[][] = []
    const n = cards.length
    
    // 生成所有非空子集
    for (let i = 1; i < (1 << n); i++) {
      const combo: Card[] = []
      for (let j = 0; j < n; j++) {
        if (i & (1 << j)) {
          combo.push(cards[j])
        }
      }
      combinations.push(combo)
    }
    
    return combinations
  }
  
  /**
   * 检查是否为连续数值
   */
  private isConsecutive(values: number[]): boolean {
    if (values.length < 2) return false
    
    // 2和王不能参与顺子
    if (values.some(v => v >= 15)) return false
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] - values[i-1] !== 1) {
        return false
      }
    }
    return true
  }
  
  /**
   * 检查是否为连对
   */
  private isPairStraight(values: number[], valueCount: Map<number, number>): boolean {
    return values.length >= 3 && 
           values.every(v => valueCount.get(v) === 2) && 
           this.isConsecutive(values)
  }
  
  /**
   * 获取连续三张
   */
  private getTripleStraight(values: number[], valueCount: Map<number, number>): number[] {
    const triples = values.filter(v => valueCount.get(v) === 3).sort((a, b) => a - b)
    
    if (triples.length < 2) return []
    
    // 找最长连续三张
    let maxLength = 0
    let bestStart = 0
    
    for (let i = 0; i < triples.length; i++) {
      let length = 1
      for (let j = i + 1; j < triples.length; j++) {
        if (triples[j] - triples[j-1] === 1) {
          length++
        } else {
          break
        }
      }
      
      if (length >= 2 && length > maxLength) {
        maxLength = length
        bestStart = i
      }
    }
    
    return maxLength >= 2 ? triples.slice(bestStart, bestStart + maxLength) : []
  }
  
  /**
   * 获取牌值计数
   */
  private getValueCount(cards: Card[]): Map<number, number> {
    const count = new Map<number, number>()
    cards.forEach(card => {
      count.set(card.value, (count.get(card.value) || 0) + 1)
    })
    return count
  }
  
  /**
   * 排序手牌
   */
  private sortCards(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => {
      if (a.value !== b.value) return a.value - b.value
      const suitOrder = { spades: 1, hearts: 2, diamonds: 3, clubs: 4, joker: 5 }
      return suitOrder[a.suit] - suitOrder[b.suit]
    })
  }
  
  /**
   * 获取牌的基础分值
   */
  private getCardBaseValue(card: Card): number {
    // 大小王分值更高
    if (card.suit === 'joker') return card.value * 2
    // 2的分值较高
    if (card.value === 15) return card.value * 1.5
    return card.value
  }
  
  /**
   * 计算牌型组合奖励
   */
  private calculatePatternBonus(hand: Card[], valueCount: Map<number, number>): number {
    let bonus = 0
    
    // 炸弹奖励
    valueCount.forEach((count, value) => {
      if (count === 4) bonus += 50
    })
    
    // 王炸奖励
    const hasSmallJoker = hand.some(c => c.suit === 'joker' && c.rank === 'small')
    const hasBigJoker = hand.some(c => c.suit === 'joker' && c.rank === 'big')
    if (hasSmallJoker && hasBigJoker) bonus += 100
    
    // 三张奖励
    valueCount.forEach((count, value) => {
      if (count === 3) bonus += 15
    })
    
    // 对子奖励
    valueCount.forEach((count, value) => {
      if (count === 2) bonus += 5
    })
    
    return bonus
  }
}

// 导出单例实例
export const landlordRules = new LandlordRules()
