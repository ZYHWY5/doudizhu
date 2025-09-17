import type { Card } from '~/stores/game'

// 牌型枚举
export enum CardType {
  SINGLE = 'single',           // 单张
  PAIR = 'pair',              // 对子
  TRIPLE = 'triple',          // 三张
  TRIPLE_WITH_ONE = 'triple_with_one',     // 三带一
  TRIPLE_WITH_PAIR = 'triple_with_pair',   // 三带二
  STRAIGHT = 'straight',      // 顺子
  PAIR_STRAIGHT = 'pair_straight',         // 连对
  PLANE = 'plane',           // 飞机
  PLANE_WITH_WINGS = 'plane_with_wings',   // 飞机带翅膀
  FOUR_WITH_TWO = 'four_with_two',         // 四带二
  BOMB = 'bomb',             // 炸弹
  ROCKET = 'rocket',         // 王炸
  INVALID = 'invalid'        // 无效牌型
}

// 牌型信息接口
export interface CardTypeInfo {
  type: CardType
  mainValue: number
  count: number
  weight: number
  description: string
}

// 出牌提示接口
export interface PlayHint {
  cards: Card[]
  cardIndexes: number[]
  type: CardType
  description: string
  weight: number
}

export const useGameLogic = () => {
  
  /**
   * 生成标准52+2张牌
   */
  const generateDeck = (): Card[] => {
    const deck: Card[] = []
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'] as const
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
    const values = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    
    // 生成普通牌
    suits.forEach(suit => {
      ranks.forEach((rank, index) => {
        deck.push({
          suit,
          rank,
          value: values[index],
          id: `${suit}-${rank}`
        })
      })
    })
    
    // 添加大小王
    deck.push({
      suit: 'joker',
      rank: 'small',
      value: 16,
      id: 'joker-small'
    })
    
    deck.push({
      suit: 'joker',
      rank: 'big',
      value: 17,
      id: 'joker-big'
    })
    
    return deck
  }
  
  /**
   * 洗牌算法（Fisher-Yates）
   */
  const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  
  /**
   * 对手牌进行排序
   */
  const sortCards = (cards: Card[]): Card[] => {
    return [...cards].sort((a, b) => {
      if (a.value !== b.value) {
        return a.value - b.value
      }
      // 相同点数按花色排序
      const suitOrder = { spades: 1, hearts: 2, diamonds: 3, clubs: 4, joker: 5 }
      return suitOrder[a.suit] - suitOrder[b.suit]
    })
  }
  
  /**
   * 分析牌型
   */
  const analyzeCardType = (cards: Card[]): CardTypeInfo => {
    if (cards.length === 0) {
      return {
        type: CardType.INVALID,
        mainValue: 0,
        count: 0,
        weight: 0,
        description: '无效牌型'
      }
    }
    
    const sortedCards = sortCards(cards)
    const values = sortedCards.map(c => c.value)
    const valueCount = getValueCount(values)
    
    // 检查各种牌型
    if (cards.length === 1) {
      return analyzeSingle(sortedCards[0])
    } else if (cards.length === 2) {
      return analyzePair(sortedCards, valueCount)
    } else if (cards.length === 3) {
      return analyzeTriple(sortedCards, valueCount)
    } else if (cards.length === 4) {
      return analyzeFourCards(sortedCards, valueCount)
    } else if (cards.length === 5) {
      return analyzeFiveCards(sortedCards, valueCount)
    } else if (cards.length >= 6) {
      return analyzeMultipleCards(sortedCards, valueCount)
    }
    
    return {
      type: CardType.INVALID,
      mainValue: 0,
      count: cards.length,
      weight: 0,
      description: '无效牌型'
    }
  }
  
  /**
   * 获取牌值计数
   */
  const getValueCount = (values: number[]): Map<number, number> => {
    const count = new Map<number, number>()
    values.forEach(value => {
      count.set(value, (count.get(value) || 0) + 1)
    })
    return count
  }
  
  /**
   * 分析单张
   */
  const analyzeSingle = (card: Card): CardTypeInfo => {
    return {
      type: CardType.SINGLE,
      mainValue: card.value,
      count: 1,
      weight: card.value,
      description: `单张${card.rank}`
    }
  }
  
  /**
   * 分析对子或王炸
   */
  const analyzePair = (cards: Card[], valueCount: Map<number, number>): CardTypeInfo => {
    // 检查王炸
    if (cards.length === 2 && 
        cards[0].suit === 'joker' && 
        cards[1].suit === 'joker') {
      return {
        type: CardType.ROCKET,
        mainValue: 17,
        count: 2,
        weight: 1000, // 王炸权重最高
        description: '王炸'
      }
    }
    
    // 检查对子
    const values = Array.from(valueCount.keys())
    if (values.length === 1 && valueCount.get(values[0]) === 2) {
      return {
        type: CardType.PAIR,
        mainValue: values[0],
        count: 2,
        weight: values[0],
        description: `对${cards[0].rank}`
      }
    }
    
    return {
      type: CardType.INVALID,
      mainValue: 0,
      count: 2,
      weight: 0,
      description: '无效牌型'
    }
  }
  
  /**
   * 分析三张
   */
  const analyzeTriple = (cards: Card[], valueCount: Map<number, number>): CardTypeInfo => {
    const values = Array.from(valueCount.keys())
    
    if (values.length === 1 && valueCount.get(values[0]) === 3) {
      return {
        type: CardType.TRIPLE,
        mainValue: values[0],
        count: 3,
        weight: values[0],
        description: `三张${cards[0].rank}`
      }
    }
    
    return {
      type: CardType.INVALID,
      mainValue: 0,
      count: 3,
      weight: 0,
      description: '无效牌型'
    }
  }
  
  /**
   * 分析四张牌
   */
  const analyzeFourCards = (cards: Card[], valueCount: Map<number, number>): CardTypeInfo => {
    const values = Array.from(valueCount.keys())
    
    // 炸弹
    if (values.length === 1 && valueCount.get(values[0]) === 4) {
      return {
        type: CardType.BOMB,
        mainValue: values[0],
        count: 4,
        weight: 100 + values[0], // 炸弹基础权重100
        description: `炸弹${cards[0].rank}`
      }
    }
    
    // 三带一
    if (values.length === 2) {
      const mainValue = values.find(v => valueCount.get(v) === 3)
      const sideValue = values.find(v => valueCount.get(v) === 1)
      
      if (mainValue && sideValue) {
        return {
          type: CardType.TRIPLE_WITH_ONE,
          mainValue,
          count: 4,
          weight: mainValue,
          description: `三带一`
        }
      }
    }
    
    return {
      type: CardType.INVALID,
      mainValue: 0,
      count: 4,
      weight: 0,
      description: '无效牌型'
    }
  }
  
  /**
   * 分析五张牌
   */
  const analyzeFiveCards = (cards: Card[], valueCount: Map<number, number>): CardTypeInfo => {
    const values = Array.from(valueCount.keys()).sort((a, b) => a - b)
    
    // 顺子
    if (values.length === 5 && isConsecutive(values)) {
      return {
        type: CardType.STRAIGHT,
        mainValue: values[0],
        count: 5,
        weight: values[0],
        description: `顺子${cards[0].rank}-${cards[4].rank}`
      }
    }
    
    // 三带二
    if (values.length === 2) {
      const tripleValue = values.find(v => valueCount.get(v) === 3)
      const pairValue = values.find(v => valueCount.get(v) === 2)
      
      if (tripleValue && pairValue) {
        return {
          type: CardType.TRIPLE_WITH_PAIR,
          mainValue: tripleValue,
          count: 5,
          weight: tripleValue,
          description: `三带二`
        }
      }
    }
    
    return {
      type: CardType.INVALID,
      mainValue: 0,
      count: 5,
      weight: 0,
      description: '无效牌型'
    }
  }
  
  /**
   * 分析多张牌
   */
  const analyzeMultipleCards = (cards: Card[], valueCount: Map<number, number>): CardTypeInfo => {
    const values = Array.from(valueCount.keys()).sort((a, b) => a - b)
    
    // 连对
    if (values.length >= 3 && values.every(v => valueCount.get(v) === 2) && isConsecutive(values)) {
      return {
        type: CardType.PAIR_STRAIGHT,
        mainValue: values[0],
        count: cards.length,
        weight: values[0],
        description: `连对${cards[0].rank}-${cards[cards.length-1].rank}`
      }
    }
    
    // 飞机（连续三张）
    const tripleValues = values.filter(v => valueCount.get(v) === 3)
    if (tripleValues.length >= 2 && isConsecutive(tripleValues)) {
      const remainingCount = cards.length - tripleValues.length * 3
      
      if (remainingCount === 0) {
        return {
          type: CardType.PLANE,
          mainValue: tripleValues[0],
          count: cards.length,
          weight: tripleValues[0],
          description: `飞机`
        }
      } else if (remainingCount === tripleValues.length) {
        return {
          type: CardType.PLANE_WITH_WINGS,
          mainValue: tripleValues[0],
          count: cards.length,
          weight: tripleValues[0],
          description: `飞机带翅膀`
        }
      }
    }
    
    // 顺子
    if (values.length >= 5 && values.every(v => valueCount.get(v) === 1) && isConsecutive(values)) {
      return {
        type: CardType.STRAIGHT,
        mainValue: values[0],
        count: cards.length,
        weight: values[0],
        description: `顺子${cards[0].rank}-${cards[cards.length-1].rank}`
      }
    }
    
    return {
      type: CardType.INVALID,
      mainValue: 0,
      count: cards.length,
      weight: 0,
      description: '无效牌型'
    }
  }
  
  /**
   * 检查数值是否连续
   */
  const isConsecutive = (values: number[]): boolean => {
    if (values.length < 2) return false
    
    // 不能包含2和王
    if (values.some(v => v >= 15)) return false
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] - values[i-1] !== 1) {
        return false
      }
    }
    return true
  }
  
  /**
   * 比较两组牌的大小
   */
  const compareCards = (cards1: Card[], cards2: Card[]): number => {
    const type1 = analyzeCardType(cards1)
    const type2 = analyzeCardType(cards2)
    
    // 无效牌型
    if (type1.type === CardType.INVALID || type2.type === CardType.INVALID) {
      return 0
    }
    
    // 王炸最大
    if (type1.type === CardType.ROCKET) return 1
    if (type2.type === CardType.ROCKET) return -1
    
    // 炸弹大于其他牌型（除王炸）
    if (type1.type === CardType.BOMB && type2.type !== CardType.BOMB) return 1
    if (type2.type === CardType.BOMB && type1.type !== CardType.BOMB) return -1
    
    // 相同牌型比较
    if (type1.type === type2.type && type1.count === type2.count) {
      return type1.mainValue - type2.mainValue
    }
    
    // 不同牌型无法比较
    return 0
  }
  
  /**
   * 检查是否可以出牌
   */
  const canPlayCards = (cards: Card[], lastCards: Card[]): boolean => {
    // 首家出牌
    if (lastCards.length === 0) return true
    
    const comparison = compareCards(cards, lastCards)
    return comparison > 0
  }
  
  /**
   * 获取出牌提示
   */
  const getPlayHints = (hand: Card[], lastCards: Card[]): PlayHint[] => {
    const hints: PlayHint[] = []
    
    // 如果是首家出牌，返回所有可能的牌型
    if (lastCards.length === 0) {
      hints.push(...getAllPossiblePlays(hand))
    } else {
      // 找到可以压过上家的牌
      hints.push(...getBeatingPlays(hand, lastCards))
    }
    
    // 按权重排序
    return hints.sort((a, b) => a.weight - b.weight)
  }
  
  /**
   * 获取所有可能的出牌组合
   */
  const getAllPossiblePlays = (hand: Card[]): PlayHint[] => {
    const hints: PlayHint[] = []
    
    // 单张
    hand.forEach((card, index) => {
      hints.push({
        cards: [card],
        cardIndexes: [index],
        type: CardType.SINGLE,
        description: `单张${card.rank}`,
        weight: card.value
      })
    })
    
    // 对子
    const pairs = findPairs(hand)
    pairs.forEach(pair => {
      hints.push({
        cards: pair.cards,
        cardIndexes: pair.indexes,
        type: CardType.PAIR,
        description: `对${pair.cards[0].rank}`,
        weight: pair.cards[0].value
      })
    })
    
    // 三张
    const triples = findTriples(hand)
    triples.forEach(triple => {
      hints.push({
        cards: triple.cards,
        cardIndexes: triple.indexes,
        type: CardType.TRIPLE,
        description: `三张${triple.cards[0].rank}`,
        weight: triple.cards[0].value
      })
    })
    
    // 炸弹
    const bombs = findBombs(hand)
    bombs.forEach(bomb => {
      hints.push({
        cards: bomb.cards,
        cardIndexes: bomb.indexes,
        type: CardType.BOMB,
        description: `炸弹${bomb.cards[0].rank}`,
        weight: 100 + bomb.cards[0].value
      })
    })
    
    // 王炸
    const rocket = findRocket(hand)
    if (rocket) {
      hints.push({
        cards: rocket.cards,
        cardIndexes: rocket.indexes,
        type: CardType.ROCKET,
        description: '王炸',
        weight: 1000
      })
    }
    
    return hints
  }
  
  /**
   * 获取可以压过上家的牌
   */
  const getBeatingPlays = (hand: Card[], lastCards: Card[]): PlayHint[] => {
    const hints: PlayHint[] = []
    const lastType = analyzeCardType(lastCards)
    
    if (lastType.type === CardType.INVALID) return hints
    
    // 如果上家不是炸弹和王炸，可以用炸弹压
    if (lastType.type !== CardType.BOMB && lastType.type !== CardType.ROCKET) {
      const bombs = findBombs(hand)
      bombs.forEach(bomb => {
        hints.push({
          cards: bomb.cards,
          cardIndexes: bomb.indexes,
          type: CardType.BOMB,
          description: `炸弹${bomb.cards[0].rank}`,
          weight: 100 + bomb.cards[0].value
        })
      })
      
      // 王炸
      const rocket = findRocket(hand)
      if (rocket) {
        hints.push({
          cards: rocket.cards,
          cardIndexes: rocket.indexes,
          type: CardType.ROCKET,
          description: '王炸',
          weight: 1000
        })
      }
    }
    
    // 相同牌型的更大牌
    const sameTypeHints = findSameTypeBiggerCards(hand, lastType)
    hints.push(...sameTypeHints)
    
    return hints
  }
  
  /**
   * 查找对子
   */
  const findPairs = (hand: Card[]): Array<{cards: Card[], indexes: number[]}> => {
    const pairs: Array<{cards: Card[], indexes: number[]}> = []
    const valueGroups = groupCardsByValue(hand)
    
    valueGroups.forEach((cards, value) => {
      if (cards.length >= 2) {
        for (let i = 0; i < cards.length - 1; i += 2) {
          pairs.push({
            cards: [cards[i], cards[i + 1]],
            indexes: [cards[i].index!, cards[i + 1].index!]
          })
        }
      }
    })
    
    return pairs
  }
  
  /**
   * 查找三张
   */
  const findTriples = (hand: Card[]): Array<{cards: Card[], indexes: number[]}> => {
    const triples: Array<{cards: Card[], indexes: number[]}> = []
    const valueGroups = groupCardsByValue(hand)
    
    valueGroups.forEach((cards, value) => {
      if (cards.length >= 3) {
        triples.push({
          cards: cards.slice(0, 3),
          indexes: cards.slice(0, 3).map(c => c.index!)
        })
      }
    })
    
    return triples
  }
  
  /**
   * 查找炸弹
   */
  const findBombs = (hand: Card[]): Array<{cards: Card[], indexes: number[]}> => {
    const bombs: Array<{cards: Card[], indexes: number[]}> = []
    const valueGroups = groupCardsByValue(hand)
    
    valueGroups.forEach((cards, value) => {
      if (cards.length === 4) {
        bombs.push({
          cards: cards,
          indexes: cards.map(c => c.index!)
        })
      }
    })
    
    return bombs
  }
  
  /**
   * 查找王炸
   */
  const findRocket = (hand: Card[]): {cards: Card[], indexes: number[]} | null => {
    let smallJokerIndex = -1
    let bigJokerIndex = -1
    
    const smallJoker = hand.find((c, i) => {
      if (c.suit === 'joker' && c.rank === 'small') {
        smallJokerIndex = i
        return true
      }
      return false
    })
    
    const bigJoker = hand.find((c, i) => {
      if (c.suit === 'joker' && c.rank === 'big') {
        bigJokerIndex = i
        return true
      }
      return false
    })
    
    if (smallJoker && bigJoker) {
      return {
        cards: [smallJoker, bigJoker],
        indexes: [smallJokerIndex, bigJokerIndex]
      }
    }
    
    return null
  }
  
  /**
   * 按牌值分组
   */
  const groupCardsByValue = (hand: Card[]): Map<number, (Card & {index: number})[]> => {
    const groups = new Map<number, (Card & {index: number})[]>()
    
    hand.forEach((card, index) => {
      const cardWithIndex = { ...card, index }
      if (!groups.has(card.value)) {
        groups.set(card.value, [])
      }
      groups.get(card.value)!.push(cardWithIndex)
    })
    
    return groups
  }
  
  /**
   * 查找相同牌型的更大牌
   */
  const findSameTypeBiggerCards = (hand: Card[], lastType: CardTypeInfo): PlayHint[] => {
    const hints: PlayHint[] = []
    
    switch (lastType.type) {
      case CardType.SINGLE:
        hand.forEach((card, index) => {
          if (card.value > lastType.mainValue) {
            hints.push({
              cards: [card],
              cardIndexes: [index],
              type: CardType.SINGLE,
              description: `单张${card.rank}`,
              weight: card.value
            })
          }
        })
        break
        
      case CardType.PAIR:
        const pairs = findPairs(hand)
        pairs.forEach(pair => {
          if (pair.cards[0].value > lastType.mainValue) {
            hints.push({
              cards: pair.cards,
              cardIndexes: pair.indexes,
              type: CardType.PAIR,
              description: `对${pair.cards[0].rank}`,
              weight: pair.cards[0].value
            })
          }
        })
        break
        
      // 其他牌型的处理...
    }
    
    return hints
  }
  
  /**
   * 计算手牌强度评分
   */
  const calculateHandStrength = (hand: Card[]): number => {
    let strength = 0
    
    // 基础牌力
    hand.forEach(card => {
      strength += card.value
    })
    
    // 牌型奖励
    const bombs = findBombs(hand).length
    const triples = findTriples(hand).length
    const pairs = findPairs(hand).length
    const rocket = findRocket(hand) ? 1 : 0
    
    strength += rocket * 50  // 王炸奖励
    strength += bombs * 30   // 炸弹奖励
    strength += triples * 10 // 三张奖励
    strength += pairs * 5    // 对子奖励
    
    return strength
  }
  
  return {
    generateDeck,
    shuffleDeck,
    sortCards,
    analyzeCardType,
    compareCards,
    canPlayCards,
    getPlayHints,
    calculateHandStrength,
    CardType
  }
}
