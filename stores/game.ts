import { defineStore } from 'pinia'
import { useGameLogic } from '~/composables/useGameLogic'
import { useActionFeedback } from '~/composables/useActionFeedback'

// 类型定义
export interface Card {
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'joker'
  rank: string
  value: number
  id: string
}

export interface CurrentPlayedCards {
  playerId: string
  playerName: string
  cards: Card[]
  cardType: string
  timestamp: number
}


export interface Player {
  id: string
  name: string
  avatar?: string
  cards: Card[]
  isReady: boolean
  isOnline: boolean
  isAutoPlay: boolean
  isHost?: boolean
  position: 'top' | 'left' | 'right' | 'bottom'
}

export interface GameState {
  phase: 'waiting' | 'bidding' | 'multiplier' | 'playing' | 'ended'
  players: Player[]
  currentPlayerId: string | null
  landlordId: string | null
  bottomCards: Card[]
  lastPlayedCards: Card[]
  lastPlayerId: string | null
  playHistory: PlayRecord[]
  turn: number
  biddingInfo: BiddingInfo
  multiplierInfo: MultiplierInfo
  gameResult: GameResult | null
  currentPlayedCards: CurrentPlayedCards | null // 当前显示的出牌
}

export interface PlayRecord {
  playerId: string
  playerName: string
  cards: Card[]
  cardType: string
  timestamp: number
}

export interface BiddingInfo {
  currentBidderId: string | null
  bids: Array<{
    playerId: string
    bid: 'call' | 'grab' | 'pass' // 叫地主 | 抢地主 | 不叫/不抢
    timestamp: number
  }>
  phase: 'calling' | 'grabbing' | 'finished' // 叫地主阶段 | 抢地主阶段 | 结束
  landlordCandidateId: string | null // 当前地主候选人
  multiplierHistory?: Array<{
    playerId: string
    action: 'double' | 'pass'
    timestamp: number
  }>
}

export interface MultiplierInfo {
  currentPlayerId: string | null // 当前需要决定倍数的玩家
  multiplier: number // 当前倍数
  decisions: Array<{
    playerId: string
    playerName: string
    action: 'double' | 'pass' // 加倍 | 不加倍
    timestamp: number
  }>
  completedPlayers: string[] // 已完成决定的玩家ID列表
}

export interface GameResult {
  winnerId: string
  winnerName: string
  isLandlordWin: boolean
  finalScores: Array<{
    playerId: string
    playerName: string
    score: number
    isLandlord: boolean
  }>
  gameEndTime: number
  gameDuration: number
}

export interface GameSettings {
  soundEnabled: boolean
  animationEnabled: boolean
  autoPlayTimeout: number
  showCardHints: boolean
  theme: 'default' | 'dark' | 'green'
}

export interface DeviceInfo {
  type: 'mobile' | 'pc'
  cores: number
  memory: number
  performanceScore: number
}

export interface NotificationAction {
  label: string
  action: () => void
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
}

export const useGameStore = defineStore('game', () => {
  // 基础状态
  const gameState = ref<GameState>({
    phase: 'waiting',
    players: [],
    currentPlayerId: null,
    landlordId: null,
    bottomCards: [],
    lastPlayedCards: [],
    lastPlayerId: null,
    playHistory: [],
    turn: 0,
    biddingInfo: {
      currentBidderId: null,
      bids: [],
      phase: 'calling',
      landlordCandidateId: null
    },
    multiplierInfo: {
      currentPlayerId: null,
      multiplier: 1,
      decisions: [],
      completedPlayers: []
    },
    gameResult: null,
    currentPlayedCards: null
  })

  // 玩家状态
  const playerId = ref<string>('')
  const playerName = ref<string>('玩家')
  const selectedCards = ref<number[]>([])
  const suggestedCards = ref<number[]>([])

  // 游戏控制状态
  const isLoading = ref(false)
  const isPaused = ref(false)
  const autoPlayEnabled = ref(false)
  const turnTimeLeft = ref(45)
  const isMultiplayer = ref(false) // 是否为联机模式

  // 设备和性能
  const deviceInfo = ref<DeviceInfo>({
    type: 'pc',
    cores: 4,
    memory: 8,
    performanceScore: 8
  })

  // 设置
  const settings = ref<GameSettings>({
    soundEnabled: true,
    animationEnabled: true,
    autoPlayTimeout: 45, // 增加到45秒，给玩家更多思考时间
    showCardHints: true,
    theme: 'default'
  })

  // 通知系统
  const notifications = ref<Notification[]>([])

  // 计算属性
  const isGameActive = computed(() => {
    return ['bidding', 'multiplier', 'playing'].includes(gameState.value.phase)
  })

  const isInGame = computed(() => {
    return gameState.value.phase === 'playing'
  })

  const currentPlayer = computed(() => {
    return gameState.value.players.find(p => p.id === gameState.value.currentPlayerId) || null
  })

  const landlord = computed(() => {
    return gameState.value.players.find(p => p.id === gameState.value.landlordId) || null
  })

  const myPlayer = computed(() => {
    return gameState.value.players.find(p => p.id === playerId.value) || null
  })

  const isMyTurn = computed(() => {
    if (gameState.value.phase === 'bidding') {
      return gameState.value.biddingInfo.currentBidderId === playerId.value
    } else if (gameState.value.phase === 'multiplier') {
      return gameState.value.multiplierInfo.currentPlayerId === playerId.value
    } else if (gameState.value.phase === 'playing') {
      return gameState.value.currentPlayerId === playerId.value
    }
    return false
  })

  const opponents = computed(() => {
    return gameState.value.players.filter(p => p.id !== playerId.value)
  })

  const playerCards = computed(() => {
    return myPlayer.value?.cards || []
  })


  const canPlay = computed(() => {
    return isMyTurn.value && selectedCards.value.length > 0 && gameState.value.phase === 'playing'
  })

  const canPass = computed(() => {
    return isMyTurn.value && gameState.value.lastPlayedCards.length > 0 && gameState.value.phase === 'playing'
  })

  const gamePhase = computed(() => gameState.value.phase)

  const players = computed(() => gameState.value.players)

  const lastPlayedCards = computed(() => gameState.value.lastPlayedCards)

  const bottomCards = computed(() => gameState.value.bottomCards)

  const playHistory = computed(() => gameState.value.playHistory)

  const biddingInfo = computed(() => gameState.value.biddingInfo)

  const currentPlayedCards = computed(() => gameState.value.currentPlayedCards)

  const gameResult = computed(() => gameState.value.gameResult)

  const hasUnfinishedGame = computed(() => {
    // 检查本地存储是否有未完成的游戏
    if (process.client) {
      const saved = localStorage.getItem('unfinished_game')
      return !!saved
    }
    return false
  })

  const playerStats = computed(() => {
    // 从本地存储获取玩家统计信息
    if (process.client) {
      const stats = localStorage.getItem('player_stats')
      return stats ? JSON.parse(stats) : null
    }
    return null
  })

  // Actions
  const initializePlayer = async (id?: string, name?: string) => {
    // 使用设备唯一ID生成玩家ID
    if (id) {
      playerId.value = id
    } else if (process.client) {
      const { generateUniquePlayerId } = await import('~/utils/deviceId')
      playerId.value = await generateUniquePlayerId()
    } else {
      playerId.value = generatePlayerId()
    }
    
    // 优先使用传入的名称，然后是本地存储，最后是随机名称
    if (name) {
      playerName.value = name
    } else if (process.client) {
      const savedName = localStorage.getItem('playerName')
      playerName.value = savedName || `玩家${Math.floor(Math.random() * 1000)}`
    } else {
      playerName.value = `玩家${Math.floor(Math.random() * 1000)}`
    }
    
    // 保存到本地存储
    savePlayerName(playerName.value)
    
    console.log('玩家初始化完成:', { id: playerId.value, name: playerName.value })
  }

  const updatePlayerName = (newName: string): boolean => {
    // 验证名称
    const validationResult = validatePlayerName(newName)
    if (!validationResult.isValid) {
      showNotification({
        type: 'error',
        title: '名称无效',
        message: validationResult.error || '请输入有效的玩家名称'
      })
      return false
    }

    const oldName = playerName.value
    playerName.value = newName
    
    // 保存到本地存储
    savePlayerName(newName)
    
    // 更新游戏中的玩家对象
    const myPlayer = gameState.value.players.find(p => p.id === playerId.value)
    if (myPlayer) {
      myPlayer.name = newName
    }
    
    // 如果在联机模式，同步到其他玩家
    if (isMultiplayer.value) {
      syncPlayerNameToRoom(newName).catch(console.error)
    }
    
    showNotification({
      type: 'success',
      title: '名称已更新',
      message: `玩家名称已更改为: ${newName}`
    })
    
    console.log(`玩家名称从 "${oldName}" 更改为 "${newName}"`)
    return true
  }

  const validatePlayerName = (name: string): { isValid: boolean; error?: string } => {
    // 去除首尾空格
    name = name.trim()
    
    // 检查长度
    if (name.length < 2) {
      return { isValid: false, error: '名称至少需要2个字符' }
    }
    if (name.length > 12) {
      return { isValid: false, error: '名称不能超过12个字符' }
    }
    
    // 检查特殊字符
    const invalidChars = /[<>\/\\\|\*\?\"\:]/
    if (invalidChars.test(name)) {
      return { isValid: false, error: '名称不能包含特殊字符 < > / \\ | * ? " :' }
    }
    
    // 检查是否只包含空格
    if (!name.replace(/\s/g, '')) {
      return { isValid: false, error: '名称不能只包含空格' }
    }
    
    // 检查敏感词
    const sensitiveWords = ['管理员', 'admin', '系统', 'system', '机器人', 'bot']
    const lowerName = name.toLowerCase()
    for (const word of sensitiveWords) {
      if (lowerName.includes(word.toLowerCase())) {
        return { isValid: false, error: '名称包含敏感词汇' }
      }
    }
    
    return { isValid: true }
  }

  const savePlayerName = (name: string) => {
    if (process.client) {
      try {
        localStorage.setItem('playerName', name)
        localStorage.setItem('playerNameTimestamp', Date.now().toString())
      } catch (error) {
        console.error('保存玩家名称失败:', error)
      }
    }
  }

  const syncPlayerNameToRoom = async (newName: string) => {
    // 单机模式，无需同步到房间
    console.log('单机模式，玩家名称已更新:', newName)
  }

  const generatePlayerId = (): string => {
    return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const detectDeviceCapability = async () => {
    const info: DeviceInfo = {
      type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'pc',
      cores: navigator.hardwareConcurrency || 2,
      memory: (navigator as any).deviceMemory || 4,
      performanceScore: 0
    }

    // 简单性能测试
    const start = performance.now()
    for (let i = 0; i < 100000; i++) {
      Math.random() * Math.random()
    }
    const duration = performance.now() - start
    info.performanceScore = Math.max(1, Math.min(10, Math.floor(100 / duration)))

    deviceInfo.value = info
    
    console.log('设备信息检测完成:', info)
  }

  const initializeAudio = async () => {
    if (!settings.value.soundEnabled) return
    
    try {
      // 初始化音效系统
      console.log('音效系统初始化完成')
    } catch (error) {
      console.error('音效系统初始化失败:', error)
    }
  }

  const cleanupAudio = () => {
    // 清理音效资源
    console.log('音效系统已清理')
  }

  const startAIGame = async (difficulty: 'easy' | 'normal' | 'hard') => {
    isLoading.value = true
    isMultiplayer.value = false // 设置为单机模式
    
    try {
      console.log('🚀 开始AI游戏，难度:', difficulty)
      
      // 停止当前游戏循环
      stopGameLoop()
      
      // 🔥 清除游戏结果弹窗
      gameState.value.gameResult = null
      console.log('🗑️ 游戏结果弹窗已清除')
      
      // 清理AI资源
      const { cleanupAI } = useAI()
      cleanupAI()
      
      // 确保玩家ID已设置
      if (!playerId.value) {
        await initializePlayer(generatePlayerId(), `玩家${Math.floor(Math.random() * 1000)}`)
      }
      
      console.log('🧹 AI资源已清理，玩家ID:', playerId.value)
      
      // 初始化AI系统
      const { initializeAI } = useAI()
      await initializeAI(difficulty)
      
      // 创建AI玩家 - 确保名字不会被覆盖
      const aiPlayer1Name = difficulty === 'easy' ? 'AI新手' : difficulty === 'normal' ? 'AI高手' : 'AI大师'
      const aiPlayer2Name = difficulty === 'easy' ? 'AI学徒' : difficulty === 'normal' ? 'AI专家' : 'AI宗师'
      
      const aiPlayers = [
        {
          id: 'ai-1',
          name: aiPlayer1Name,
          cards: [],
          isReady: true,
          isOnline: true,
          isAutoPlay: true,
          position: 'left' as const  // 真人玩家的上家
        },
        {
          id: 'ai-2', 
          name: aiPlayer2Name,
          cards: [],
          isReady: true,
          isOnline: true,
          isAutoPlay: true,
          position: 'right' as const  // 真人玩家的下家
        }
      ]
      
      // 调试AI玩家创建
      console.log('🔍 创建AI玩家:')
      aiPlayers.forEach(ai => {
        console.log(`  - AI玩家: ${ai.name} (ID: ${ai.id}, isAutoPlay: ${ai.isAutoPlay})`)
      })

      // 创建玩家 - 确保人类玩家信息正确
      const player: Player = {
        id: playerId.value,
        name: playerName.value,
        cards: [],
        isReady: true,
        isOnline: true,
        isAutoPlay: false,
        position: 'bottom'
      }
      
      // 🔍 调试人类玩家创建
      console.log('🔍 创建人类玩家:')
      console.log(`  - 玩家: ${player.name} (ID: ${player.id}, isAutoPlay: ${player.isAutoPlay})`)
      console.log(`  - playerName.value: ${playerName.value}`)
      console.log(`  - playerId.value: ${playerId.value}`)

      // 按照正确的顺时针顺序排列：底部（真人）→ 右边（下家）→ 左边（上家）
      const leftAI = aiPlayers.find(ai => ai.position === 'left')!
      const rightAI = aiPlayers.find(ai => ai.position === 'right')!
      
      gameState.value.players = [player, rightAI, leftAI]
      gameState.value.phase = 'waiting'
      
      // 🔍 最终玩家列表验证
      console.log('🔍 最终玩家列表（顺时针顺序）:')
      gameState.value.players.forEach((p, index) => {
        let positionDesc = ''
        if (p.position === 'bottom') positionDesc = '真人玩家'
        else if (p.position === 'right') positionDesc = '下家AI'
        else if (p.position === 'left') positionDesc = '上家AI'
        console.log(`  [${index}] ${p.name} (ID: ${p.id}, AI: ${p.isAutoPlay}, 位置: ${p.position} - ${positionDesc})`)
      })
      console.log('🔄 顺时针顺序确认: 底部真人 → 右边下家 → 左边上家')
      
      // 先跳转到游戏页面
      if (process.client) {
        await navigateTo('/game')
      }
      
      // 等待一下让页面加载完成
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 发牌
      await dealCards()
      console.log('发牌完成，每位玩家手牌数量:', gameState.value.players.map(p => `${p.name}: ${p.cards.length}张`))
      
      // 🔍 调试：检查玩家信息
      console.log('🔍 调试玩家信息:')
      gameState.value.players.forEach(p => {
        console.log(`  - 玩家: ${p.name} (ID: ${p.id})`)
        console.log(`    手牌数量: ${p.cards.length}`)
        console.log(`    位置: ${p.position}`)
        console.log(`    是否AI: ${p.isAutoPlay}`)
      })
      
      // 🔍 调试：检查当前玩家信息
      console.log('🔍 当前玩家信息:')
      console.log(`  - playerId: ${playerId.value}`)
      console.log(`  - playerName: ${playerName.value}`)
      console.log(`  - myPlayer: ${myPlayer.value?.name} (${myPlayer.value?.id})`)
      console.log(`  - myPlayer手牌: ${myPlayer.value?.cards.length || 0}张`)
      
      // 🚨 检测到玩家ID不匹配问题！
      if (!myPlayer.value) {
        console.error('🚨 严重错误：找不到当前玩家！')
        console.error('  - 期望的playerId:', playerId.value)
        console.error('  - 实际的玩家列表:', gameState.value.players.map(p => `${p.name}(${p.id})`))
        
        // 🔧 尝试修复：使用游戏中的第一个非AI玩家作为当前玩家
        const humanPlayer = gameState.value.players.find(p => !p.isAutoPlay)
        if (humanPlayer) {
          console.log('🔧 修复：更新playerId为正确的人类玩家ID')
          playerId.value = humanPlayer.id
          console.log(`  - 修复后的playerId: ${playerId.value}`)
          // 重新获取myPlayer，因为playerId已经更新
          const fixedMyPlayer = gameState.value.players.find(p => p.id === playerId.value)
          console.log(`  - 修复后的myPlayer: ${fixedMyPlayer?.name} (${fixedMyPlayer?.id})`)
        }
      }
      
      // 重置重发计数器
      reshuffleCount.value = 0
      
      // 开始叫地主
      startBiddingPhase() // 单机模式，无需种子
      
      // 确保游戏未暂停，重置托管状态
      isPaused.value = false
      autoPlayEnabled.value = false
      
      // 启动游戏循环
      startGameLoop()
      
      console.log(`AI游戏开始，难度: ${difficulty}`)
    } catch (error) {
      console.error('启动AI游戏失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const dealCards = async () => {
    // 🧹 清除出牌显示区的残留数据
    gameState.value.currentPlayedCards = null
    gameState.value.lastPlayedCards = []
    gameState.value.lastPlayerId = null
    gameState.value.playHistory = []
    console.log('🗑️ 出牌显示区已清理')
    
    // 生成完整的54张牌
    const deck = generateDeck()
    
    // 洗牌
    shuffleDeck(deck)
    
    // 动画发牌：每人17张，剩余3张作为底牌
    const players = gameState.value.players
    
    // 清空所有玩家手牌
    players.forEach(player => {
      player.cards = []
    })
    
    // 动画发牌过程
    for (let round = 0; round < 17; round++) {
      for (let playerIndex = 0; playerIndex < 3; playerIndex++) {
        const cardIndex = round * 3 + playerIndex
        players[playerIndex].cards.push(deck[cardIndex])
        
        // 每发一张牌暂停一下，创造动画效果
        await new Promise(resolve => setTimeout(resolve, 30))
      }
    }
    
    // 底牌
    gameState.value.bottomCards = deck.slice(51, 54)
    
    // 对每个玩家的手牌进行排序
    players.forEach(player => {
      player.cards = sortCards(player.cards)
    })
    
    console.log('发牌完成')
  }

  const selectCard = (cardIndex: number) => {
    const index = selectedCards.value.indexOf(cardIndex)
    if (index === -1) {
      selectedCards.value.push(cardIndex)
    } else {
      selectedCards.value.splice(index, 1)
    }
    
    // 排序选中的牌
    selectedCards.value.sort((a, b) => a - b)
  }

  const playSelectedCards = async () => {
    if (!canPlay.value) return
    
    const cards = selectedCards.value.map(index => playerCards.value[index])
    
    console.log('=== 出牌调试信息 ===')
    console.log('选中的牌:', cards.map(c => `${c.rank}${c.suit}`))
    console.log('选中的牌数量:', cards.length)
    console.log('上一手牌:', gameState.value.lastPlayedCards.map(c => `${c.rank}${c.suit}`))
    
    try {
      // 验证牌型
      const cardType = validateCardType(cards)
      console.log('牌型校验结果:', cardType)
      
      if (!cardType) {
        console.log('牌型校验失败，无效的牌型')
        throw new Error('无效的牌型')
      }
      
      // 验证是否可以出牌
      const canPlayResult = canPlayCards(cards, gameState.value.lastPlayedCards)
      console.log('出牌规则校验结果:', canPlayResult)
      
      if (!canPlayResult) {
        console.log('出牌规则校验失败，无法出这些牌')
        throw new Error('无法出这些牌')
      }
      
      console.log('校验通过，执行出牌')
      
      // 执行出牌
      await executePlay(cards, cardType)
      
      // 清空选中的牌
      selectedCards.value = []
      
    } catch (error) {
      console.log('出牌失败:', error)
      throw error
    }
  }

  const executePlay = async (cards: Card[], cardType: string) => {
    // 从手牌中移除出的牌
    const player = myPlayer.value!
    cards.forEach(card => {
      const index = player.cards.findIndex(c => c.id === card.id)
      if (index !== -1) {
        player.cards.splice(index, 1)
      }
    })
    
    // 重新排序手牌
    player.cards = sortCards(player.cards)
    
    // 更新游戏状态
    gameState.value.lastPlayedCards = cards
    gameState.value.lastPlayerId = playerId.value
    
    // 设置当前出牌显示
    setCurrentPlayedCards(playerId.value, playerName.value, cards, cardType)
    
    // 记录出牌历史
    gameState.value.playHistory.push({
      playerId: playerId.value,
      playerName: playerName.value,
      cards: [...cards],
      cardType,
      timestamp: Date.now()
    })
    
    // 播放出牌音效
    playCardSound(cardType)
    
    // 检查是否获胜
    if (player.cards.length === 0) {
      await endGame(playerId.value)
      return
    }
    
    // 检查报牌提醒
    checkCardCountWarning(player)
    
    // 切换到下一个玩家
    nextTurn()
    
    console.log(`出牌: ${cardType}`, cards)
  }

  const passTurn = async () => {
    if (!canPass.value) return
    
    // 记录过牌
    gameState.value.playHistory.push({
      playerId: playerId.value,
      playerName: playerName.value,
      cards: [],
      cardType: 'pass',
      timestamp: Date.now()
    })
    
    // 检查是否需要重置出牌状态
    checkAndResetPlayState()
    
    // 切换到下一个玩家
    nextTurn()
    
    console.log('过牌')
  }

  // 设置当前出牌显示
  const setCurrentPlayedCards = (playerId: string, playerName: string, cards: Card[], cardType: string) => {
    console.log('=== 设置当前出牌 ===')
    console.log('玩家:', playerName, playerId)
    console.log('出牌:', cards.map(c => `${c.rank}${c.suit}`))
    console.log('牌型:', cardType)
    
    // 设置当前出牌（替换之前的）
    gameState.value.currentPlayedCards = {
      playerId,
      playerName,
      cards: [...cards],
      cardType,
      timestamp: Date.now()
    }
    
    console.log('当前出牌显示:', gameState.value.currentPlayedCards)
  }

  // 检查并重置出牌状态
  const checkAndResetPlayState = () => {
    const history = gameState.value.playHistory
    if (history.length < 2) return
    
    // 获取最近的两次操作
    const lastTwo = history.slice(-2)
    
    // 如果最近两次都是过牌，且不是同一个玩家
    if (lastTwo.every(record => record.cardType === 'pass') && 
        lastTwo[0].playerId !== lastTwo[1].playerId) {
      
      // 找到最后一次实际出牌的记录
      const lastPlayRecord = history.slice().reverse().find(record => record.cardType !== 'pass')
      
      if (lastPlayRecord) {
        // 检查接下来轮到的是否是最后出牌的玩家
        // 如果是，说明其他两个玩家都过了，应该重置状态
        const currentPlayer = gameState.value.players.find(p => p.id === gameState.value.currentPlayerId)
        const nextPlayer = getNextPlayer()
        
        if (nextPlayer && nextPlayer.id === lastPlayRecord.playerId) {
          // 重置出牌状态，开始新一轮
          gameState.value.lastPlayedCards = []
          gameState.value.lastPlayerId = null
          // 清除当前出牌显示
          gameState.value.currentPlayedCards = null
          console.log('新一轮开始，可以出任意牌型')
        }
      }
    }
  }
  
  // 获取叫地主阶段的顺时针顺序（从起始玩家开始）
  const getBiddingClockwiseOrder = (): Player[] => {
    if (gameState.value.phase !== 'bidding') {
      return gameState.value.players
    }
    
    const biddingInfo = gameState.value.biddingInfo
    let startPlayerId: string
    
    // 确定起始玩家
    if (biddingInfo.bids.length > 0) {
      // 如果已有决策，使用第一个做决策的玩家作为起始点
      startPlayerId = biddingInfo.bids[0].playerId
    } else {
      // 如果还没有任何决策，使用当前应该做决策的玩家作为起始点
      startPlayerId = biddingInfo.currentBidderId || gameState.value.players[0].id
    }
    
    const startIndex = gameState.value.players.findIndex(p => p.id === startPlayerId)
    if (startIndex === -1) {
      console.warn('🚨 getBiddingClockwiseOrder: 找不到起始玩家，使用原始顺序')
      return gameState.value.players
    }
    
    // 从起始玩家开始，按顺时针顺序排列
    const orderedPlayers = []
    for (let i = 0; i < gameState.value.players.length; i++) {
      const index = (startIndex + i) % gameState.value.players.length
      orderedPlayers.push(gameState.value.players[index])
    }
    
    const startPlayerName = gameState.value.players.find(p => p.id === startPlayerId)?.name
    const orderDesc = orderedPlayers.map(p => {
      const pos = p.position === 'bottom' ? '底部真人' : p.position === 'right' ? '右边下家' : '左边上家'
      return `${p.name}(${pos})`
    }).join(' → ')
    console.log(`🔄 叫地主顺时针顺序 (起始: ${startPlayerName}): ${orderDesc}`)
    return orderedPlayers
  }

  // 获取地主顺时针的玩家顺序
  const getLandlordClockwiseOrder = (): Player[] => {
    if (!gameState.value.landlordId) {
      // 如果还没有地主，使用叫地主阶段的顺序
      return getBiddingClockwiseOrder()
    }
    
    const landlordIndex = gameState.value.players.findIndex(p => p.id === gameState.value.landlordId)
    if (landlordIndex === -1) {
      return gameState.value.players
    }
    
    // 从地主开始，按顺时针顺序排列
    const orderedPlayers = []
    for (let i = 0; i < gameState.value.players.length; i++) {
      const index = (landlordIndex + i) % gameState.value.players.length
      orderedPlayers.push(gameState.value.players[index])
    }
    
    const orderDesc = orderedPlayers.map(p => {
      const pos = p.position === 'bottom' ? '底部真人' : p.position === 'right' ? '右边下家' : '左边上家'
      return `${p.name}(${pos})`
    }).join(' → ')
    console.log(`🔄 地主顺时针顺序: ${orderDesc}`)
    return orderedPlayers
  }

  // 获取下一个玩家（按地主顺时针）
  const getNextPlayer = () => {
    const orderedPlayers = getLandlordClockwiseOrder()
    const currentIndex = orderedPlayers.findIndex(p => p.id === gameState.value.currentPlayerId)
    const nextIndex = (currentIndex + 1) % orderedPlayers.length
    return orderedPlayers[nextIndex]
  }

  const nextTurn = () => {
    const orderedPlayers = getLandlordClockwiseOrder()
    const currentIndex = orderedPlayers.findIndex(p => p.id === gameState.value.currentPlayerId)
    const nextIndex = (currentIndex + 1) % orderedPlayers.length
    const nextPlayer = orderedPlayers[nextIndex]
    
    console.log(`🔄 nextTurn: ${gameState.value.players.find(p => p.id === gameState.value.currentPlayerId)?.name} → ${nextPlayer.name}`)
    gameState.value.currentPlayerId = nextPlayer.id
    gameState.value.turn++
    
    // 重置回合计时器（保持托管状态）
    turnTimeLeft.value = settings.value.autoPlayTimeout
    // 注意：不重置托管状态，让用户自己控制
  }

  const endGame = async (winnerId: string) => {
    const winner = gameState.value.players.find(p => p.id === winnerId)!
    const isLandlordWin = winnerId === gameState.value.landlordId
    
    gameState.value.gameResult = {
      winnerId,
      winnerName: winner.name,
      isLandlordWin,
      finalScores: gameState.value.players.map(p => ({
        playerId: p.id,
        playerName: p.name,
        score: calculatePlayerScore(p.id, isLandlordWin),
        isLandlord: p.id === gameState.value.landlordId
      })),
      gameEndTime: Date.now(),
      gameDuration: Date.now() - (gameState.value.playHistory[0]?.timestamp || Date.now())
    }
    
    gameState.value.phase = 'ended'
    
    // 保存统计信息
    savePlayerStats(gameState.value.gameResult)
    
    console.log('游戏结束:', gameState.value.gameResult)
  }

  // 开始倍数阶段
  const startMultiplierPhase = () => {
    console.log('🎯 开始倍数阶段')
    
    // 切换到倍数阶段
    gameState.value.phase = 'multiplier'
    
    // 获取地主顺时针顺序的玩家列表
    const orderedPlayers = getLandlordClockwiseOrder()
    
    // 重置倍数信息，从地主开始（顺时针第一个）
    gameState.value.multiplierInfo = {
      currentPlayerId: orderedPlayers[0].id, // 从地主开始
      multiplier: 1,
      decisions: [],
      completedPlayers: []
    }
    
    // 重置计时器
    turnTimeLeft.value = settings.value.autoPlayTimeout
    
    // 启动游戏循环处理倍数阶段
    startGameLoop()
    
    // 添加反馈
    if (process.client) {
      const { addFeedback } = useActionFeedback()
      addFeedback('multiplier', '系统', '倍数阶段开始', { duration: 2000 })
    }
  }
  
  // 处理倍数决定
  const handleMultiplierDecision = (playerId: string, action: 'double' | 'pass') => {
    const player = gameState.value.players.find(p => p.id === playerId)
    if (!player) return
    
    const multiplierInfo = gameState.value.multiplierInfo
    
    // 检查是否是当前玩家的回合
    if (multiplierInfo.currentPlayerId !== playerId) return
    
    // 检查是否已经做过决定
    if (multiplierInfo.completedPlayers.includes(playerId)) return
    
    // 记录决定
    multiplierInfo.decisions.push({
      playerId,
      playerName: player.name,
      action,
      timestamp: Date.now()
    })
    
    // 如果选择加倍，更新倍数
    if (action === 'double') {
      multiplierInfo.multiplier *= 2
      console.log(`${player.name} 加倍！当前倍数: ${multiplierInfo.multiplier}`)
      
      // 添加反馈
      if (process.client) {
        const { addFeedback } = useActionFeedback()
        addFeedback('multiplier', player.name, '加倍！', { 
          duration: 2000,
          gamePhase: gameState.value.phase 
        })
      }
    } else {
      console.log(`${player.name} 不加倍`)
      
      // 添加反馈
      if (process.client) {
        const { addFeedback } = useActionFeedback()
        addFeedback('multiplier', player.name, '不加倍', { 
          duration: 1500,
          gamePhase: gameState.value.phase 
        })
      }
    }
    
    // 标记玩家已完成决定
    multiplierInfo.completedPlayers.push(playerId)
    
    // 检查是否所有玩家都完成了决定
    if (multiplierInfo.completedPlayers.length === gameState.value.players.length) {
      // 所有玩家都完成了决定，进入出牌阶段
      startPlayingPhase()
    } else {
      // 继续下一个玩家
      proceedToNextMultiplierPlayer()
    }
  }
  
  // 进入下一个倍数决定玩家
  const proceedToNextMultiplierPlayer = () => {
    const multiplierInfo = gameState.value.multiplierInfo
    const currentIndex = gameState.value.players.findIndex(p => p.id === multiplierInfo.currentPlayerId)
    const nextIndex = (currentIndex + 1) % gameState.value.players.length
    multiplierInfo.currentPlayerId = gameState.value.players[nextIndex].id
    
    // 重置计时器
    turnTimeLeft.value = settings.value.autoPlayTimeout
  }
  
  // 进入下一个需要倍数决策的玩家（智能跳过已决策的玩家）
  const proceedToNextMultiplier = () => {
    const multiplierInfo = gameState.value.multiplierInfo
    const orderedPlayers = getLandlordClockwiseOrder()
    const currentIndex = orderedPlayers.findIndex(p => p.id === multiplierInfo.currentPlayerId)
    
    console.log('🔄 proceedToNextMultiplier 开始:')
    console.log(`  - 当前玩家索引: ${currentIndex}`)
    console.log(`  - 已做决策的玩家:`, multiplierInfo.decisions.map(d => `${d.playerName}:${d.action}`))
    console.log(`  - 地主顺时针顺序:`, orderedPlayers.map(p => p.name).join(' → '))
    
    if (currentIndex === -1) {
      console.error('🚨 proceedToNextMultiplier: 找不到当前玩家')
      return
    }
    
    // 检查是否所有玩家都已经做出决策
    if (multiplierInfo.decisions.length >= orderedPlayers.length) {
      console.log('🔄 所有玩家已完成倍数决策，开始出牌阶段')
      startPlayingPhase()
      return
    }
    
    // 寻找下一个需要做倍数决策的玩家（按地主顺时针顺序）
    let nextIndex = (currentIndex + 1) % orderedPlayers.length
    let attempts = 0
    const maxAttempts = orderedPlayers.length
    
    while (attempts < maxAttempts) {
      const nextPlayer = orderedPlayers[nextIndex]
      
      // 检查这个玩家是否已经做过倍数决策
      const hasDecision = multiplierInfo.decisions.some(d => d.playerId === nextPlayer.id)
      if (hasDecision) {
        console.log(`🔄 跳过已做倍数决策的玩家: ${nextPlayer.name}`)
        nextIndex = (nextIndex + 1) % orderedPlayers.length
        attempts++
        continue
      }
      
      // 找到了需要做决策的玩家
      console.log(`🔄 找到下一个需要倍数决策的玩家: ${nextPlayer.name}`)
      multiplierInfo.currentPlayerId = nextPlayer.id
      turnTimeLeft.value = settings.value.autoPlayTimeout
      return
    }
    
    // 如果循环了一圈都没找到，说明所有人都决策完了
    console.log('🔄 循环检查后，所有玩家都已完成倍数决策')
    startPlayingPhase()
  }
  
  // 开始出牌阶段
  const startPlayingPhase = () => {
    console.log('🎮 开始出牌阶段，最终倍数:', gameState.value.multiplierInfo.multiplier)
    
    // 切换到出牌阶段
    gameState.value.phase = 'playing'
    gameState.value.currentPlayerId = gameState.value.landlordId // 地主先出牌
    
    // 重置计时器
    turnTimeLeft.value = settings.value.autoPlayTimeout
    
    // 添加反馈
    if (process.client) {
      const { addFeedback } = useActionFeedback()
      const landlord = gameState.value.players.find(p => p.id === gameState.value.landlordId)
      addFeedback('play', '系统', `出牌阶段开始，${landlord?.name}先出`, { duration: 2000 })
    }
  }
  
  // 检查玩家是否可以加倍
  const canPlayerDouble = (playerId: string): boolean => {
    if (gameState.value.phase !== 'multiplier') return false
    if (gameState.value.multiplierInfo.currentPlayerId !== playerId) return false
    return !gameState.value.multiplierInfo.completedPlayers.includes(playerId)
  }

  const calculatePlayerScore = (playerId: string, isLandlordWin: boolean): number => {
    const isLandlord = playerId === gameState.value.landlordId
    // 新规则：基础分数固定为1分，抢地主的话为2分
    const hasGrabbed = gameState.value.biddingInfo.bids.some(bid => bid.bid === 'grab')
    const baseScore = hasGrabbed ? 2 : 1
    
    // 应用倍数
    const finalScore = baseScore * gameState.value.multiplierInfo.multiplier
    
    if (isLandlord) {
      return isLandlordWin ? finalScore * 2 : -finalScore * 2
    } else {
      return isLandlordWin ? -finalScore : finalScore
    }
  }

  const savePlayerStats = (result: GameResult) => {
    if (!process.client) return
    
    try {
      const stats = JSON.parse(localStorage.getItem('player_stats') || '{}')
      const myResult = result.finalScores.find(s => s.playerId === playerId.value)
      
      if (!stats.totalGames) stats.totalGames = 0
      if (!stats.wins) stats.wins = 0
      if (!stats.totalScore) stats.totalScore = 0
      
      stats.totalGames++
      if (result.winnerId === playerId.value) stats.wins++
      stats.totalScore += myResult?.score || 0
      stats.winRate = Math.round((stats.wins / stats.totalGames) * 100)
      stats.lastPlayed = Date.now()
      
      localStorage.setItem('player_stats', JSON.stringify(stats))
    } catch (error) {
      console.error('保存统计信息失败:', error)
    }
  }

  const getPlayingHint = async () => {
    // 获取AI出牌提示
    try {
      const { getAIHint } = useAI()
      const hint = await getAIHint(playerCards.value, gameState.value.lastPlayedCards)
      
      if (hint) {
        // 找到提示牌在手牌中的索引
        const cardIndexes = hint.cards.map(card => 
          playerCards.value.findIndex(c => c.id === card.id)
        ).filter(index => index !== -1)
        
        suggestedCards.value = cardIndexes
      } else {
        suggestedCards.value = []
      }
    } catch (error) {
      console.error('获取提示失败:', error)
    }
  }

  const toggleAutoPlay = () => {
    autoPlayEnabled.value = !autoPlayEnabled.value
    
    // 使用ActionFeedback显示托管状态
    if (process.client) {
      const { addFeedback } = useActionFeedback()
      const message = autoPlayEnabled.value ? '托管已开启' : '托管已关闭'
      addFeedback('auto-play', '系统', message, { duration: 2000 })
    }
  }

  const pauseGame = () => {
    isPaused.value = true
  }

  const resumeGame = () => {
    isPaused.value = false
  }

  const initializeGameUI = async () => {
    // 初始化游戏UI
    console.log('游戏UI初始化完成')
  }

  // 游戏循环定时器
  let gameLoopTimer: NodeJS.Timeout | null = null
  let aiProcessing = ref(false)
  
  const startGameLoop = () => {
    // 先停止旧的游戏循环（如果存在）
    stopGameLoop()
    
    // 开始游戏主循环
    gameLoopTimer = setInterval(async () => {
      await processGameTurn()
    }, 1000) // 每秒检查一次
    
    console.log('游戏循环已开始')
  }
  
  const stopGameLoop = () => {
    // 停止游戏循环
    if (gameLoopTimer) {
      clearInterval(gameLoopTimer)
      gameLoopTimer = null
      console.log('游戏循环已停止')
    }
  }
  
  // 处理游戏回合
  const processGameTurn = async () => {
    if (!isGameActive.value || isPaused.value || aiProcessing.value) {
      console.log('游戏循环跳过:', { 
        isGameActive: isGameActive.value, 
        isPaused: isPaused.value, 
        aiProcessing: aiProcessing.value 
      })
      return
    }
    
    // 根据游戏阶段获取当前玩家
    let currentPlayerId: string | null = null
    if (gameState.value.phase === 'bidding') {
      currentPlayerId = gameState.value.biddingInfo?.currentBidderId || null
      console.log('叫地主阶段 - 当前玩家ID:', currentPlayerId)
    } else if (gameState.value.phase === 'multiplier') {
      currentPlayerId = gameState.value.multiplierInfo?.currentPlayerId || null
      console.log('倍数阶段 - 当前玩家ID:', currentPlayerId)
    } else {
      currentPlayerId = gameState.value.currentPlayerId
    }
    
    const currentPlayer = gameState.value.players.find(p => p.id === currentPlayerId)
    if (!currentPlayer) {
      console.log('未找到当前玩家:', currentPlayerId, '所有玩家:', gameState.value.players.map(p => p.id))
      return
    }
    
    console.log('当前玩家:', currentPlayer.name, 'isAutoPlay:', currentPlayer.isAutoPlay, '游戏阶段:', gameState.value.phase)
    console.log('玩家ID:', currentPlayer.id, '是否是当前用户:', playerId.value === currentPlayer.id, '是否是人类玩家:', !currentPlayer.isAutoPlay)
    console.log('剩余时间:', turnTimeLeft.value)
    
    // 检查是否需要AI处理（真AI玩家 或 托管模式下的人类玩家）
    const needsAIProcessing = currentPlayer.isAutoPlay || (!currentPlayer.isAutoPlay && autoPlayEnabled.value)
    
    if (needsAIProcessing) {
      const playerType = currentPlayer.isAutoPlay ? 'AI玩家' : '托管玩家'
      console.log(`${playerType}回合，准备执行操作:`, currentPlayer.name)
      
      // 🔍 检查该玩家是否已经做过决策
      if (gameState.value.phase === 'bidding') {
        const existingDecision = gameState.value.biddingInfo.bids.find(bid => bid.playerId === currentPlayer.id)
        if (existingDecision) {
          console.log(`🔍 ${playerType} ${currentPlayer.name} 已经做过叫地主决策 (${existingDecision.bid})，跳过处理并进入下一个玩家`)
          proceedToNextBidder()
          return
        }
      } else if (gameState.value.phase === 'multiplier') {
        const existingDecision = gameState.value.multiplierInfo.decisions.find(d => d.playerId === currentPlayer.id)
        if (existingDecision) {
          console.log(`🔍 ${playerType} ${currentPlayer.name} 已经做过倍数决策 (${existingDecision.action})，跳过处理并进入下一个玩家`)
          proceedToNextMultiplier()
          return
        }
      }
      
      // AI玩家或托管玩家需要很短的思考时间（1-3秒），让玩家看清楚是哪个玩家在操作
      if (turnTimeLeft.value > 42) {
        turnTimeLeft.value--
        return // 给一点思考时间，但不会太长
      }
      
      // 🔒 设置AI处理标志，防止重复处理
      aiProcessing.value = true
      
      try {
        console.log(`即将调用 processAITurn for: ${currentPlayer.name} (${playerType})`)
        await processAITurn(currentPlayer)
        console.log(`processAITurn 完成 for: ${currentPlayer.name} (${playerType})`)
      } catch (error) {
        console.error(`${playerType}处理失败:`, error)
      } finally {
        // 🔓 处理完成后延迟释放锁，防止立即重复处理
        setTimeout(() => {
          aiProcessing.value = false
        }, 500)
      }
      return // 处理完成后立即返回，不继续处理计时器
    }
    
    // 只有非托管的人类玩家才需要完整的计时器逻辑
    const isHumanPlayer = !currentPlayer.isAutoPlay && !autoPlayEnabled.value
    
    // 人类玩家正常回合，更新计时器
    if (isHumanPlayer) {
      if (turnTimeLeft.value > 0) {
        const oldTime = turnTimeLeft.value
        turnTimeLeft.value--
        console.log(`[${new Date().toLocaleTimeString()}] 人类玩家倒计时:`, currentPlayer.name, `${oldTime} -> ${turnTimeLeft.value}`)
        
        // 时间到自动托管（只对人类玩家）
        if (turnTimeLeft.value === 0) {
          console.log('人类玩家超时，启用托管:', currentPlayer.name)
          autoPlayEnabled.value = true // 使用全局托管状态
          // 使用ActionFeedback显示超时托管
          if (process.client) {
            const { addFeedback } = useActionFeedback()
            addFeedback('warning', currentPlayer.name, '超时托管', { duration: 3000 })
          }
        }
      }
    }
  }
  
  // 处理AI回合
  const processAITurn = async (player: Player) => {
    console.log('🤖 开始处理AI回合:', player.name, '游戏阶段:', gameState.value.phase)
    
    // AI决策延迟，让玩家看到AI在"思考"
    const thinkingTime = 800 + Math.random() * 1500
    await new Promise(resolve => setTimeout(resolve, thinkingTime))
    
    try {
      // 尝试使用智能AI决策
      const smartDecision = await makeSmartAIDecision(player)
      if (smartDecision) {
        console.log(`🤖 AI ${player.name} 智能决策:`, smartDecision.decision, `(置信度: ${smartDecision.confidence})`)
        await executeAIDecision(player, smartDecision)
        return
      }
    } catch (error) {
      console.error('🤖 智能AI决策失败:', error)
    }
    
    // 回退到本地规则AI
    console.log(`🤖 AI ${player.name} 使用本地规则决策`)
    await executeLocalAIDecision(player)
  }

  const makeSmartAIDecision = async (player: Player) => {
    try {
      const { makeAIDecision } = await import('~/utils/aiAPI')
      
      // 构建AI决策上下文
      const context = {
        phase: gameState.value.phase as 'bidding' | 'multiplier' | 'playing',
        currentCards: player.cards.map(card => `${card.rank}${card.suit}`),
        playedCards: gameState.value.currentPlayedCards ? 
          gameState.value.currentPlayedCards.cards.map(card => `${card.rank}${card.suit}`) : [],
        remainingCards: Object.fromEntries(
          gameState.value.players.map(p => [p.id, p.cards.length])
        ),
        playerId: player.id,
        playerRole: gameState.value.landlordId === player.id ? 'landlord' as const : 'farmer' as const,
        biddingHistory: gameState.value.biddingInfo.bids,
        multiplierHistory: gameState.value.biddingInfo.multiplierHistory || [],
        playHistory: [], // TODO: 添加出牌历史记录
        personality: getAIPersonality(player.id),
        difficulty: getAIDifficulty()
      }
      
      return await makeAIDecision(context)
    } catch (error) {
      console.error('构建AI决策上下文失败:', error)
      return null
    }
  }

  const executeAIDecision = async (player: Player, decision: any) => {
    console.log(`🤖 executeAIDecision: ${player.name} 准备执行决策 ${decision.decision} (阶段: ${gameState.value.phase})`)
    
    if (gameState.value.phase === 'bidding') {
      // 🚨 第一重验证：确保轮到该AI玩家
      if (gameState.value.biddingInfo.currentBidderId !== player.id) {
        console.error(`🚨 AI ${player.name} 试图在非自己回合做决策，当前应该是 ${gameState.value.players.find(p => p.id === gameState.value.biddingInfo.currentBidderId)?.name} 的回合`)
        return
      }
      
      // 🚨 第二重验证：确保该AI玩家还没有做过决策
      const existingDecision = gameState.value.biddingInfo.bids.find(bid => bid.playerId === player.id)
      if (existingDecision) {
        console.error(`🚨 AI ${player.name} 已经做过决策 (${existingDecision.bid})，不能重复决策`)
        return
      }
      
      // 🚨 第三重验证：在抢地主阶段，确保不是叫地主的玩家
      if (gameState.value.biddingInfo.phase === 'grabbing') {
        const callerId = gameState.value.biddingInfo.bids.find(bid => bid.bid === 'call')?.playerId
        if (callerId === player.id) {
          console.error(`🚨 ${player.name} 是叫地主的玩家，在抢地主阶段不应该再次决策`)
          // 如果是叫地主的玩家，直接进入下一个玩家
          proceedToNextBidder()
          return
        }
      }
      
      console.log(`✅ AI ${player.name} 验证通过，执行决策: ${decision.decision}`)
      await handleBidLandlord(player.id, decision.decision)
    } else if (gameState.value.phase === 'multiplier') {
      handleMultiplierDecision(player.id, decision.decision)
    } else if (gameState.value.phase === 'playing') {
      // 解析出牌决策
      const cardStrings = parsePlayDecision(decision.decision, player.cards.map(card => `${card.rank}${card.suit}`))
      if (cardStrings.length > 0) {
        // 将字符串转换为Card对象
        const cards = player.cards.filter(card => cardStrings.includes(`${card.rank}${card.suit}`))
        await executeAIPlay(player, cards)
      } else {
        // 解析失败，回退到原有AI逻辑
        const { executeAutoPlay } = useAI()
        const fallbackDecision = await executeAutoPlay(gameState.value, player.id)
        if (fallbackDecision.action === 'play' && fallbackDecision.cards) {
          await executeAIPlay(player, fallbackDecision.cards)
        } else {
          await executeAIPass(player)
        }
      }
    }
  }

  const executeLocalAIDecision = async (player: Player) => {
    try {
      const { getLocalAIDecision } = await import('~/utils/aiAPI')
      
      const context = {
        phase: gameState.value.phase as 'bidding' | 'multiplier' | 'playing',
        currentCards: player.cards.map(card => `${card.rank}${card.suit}`),
        playedCards: gameState.value.currentPlayedCards ? 
          gameState.value.currentPlayedCards.cards.map(card => `${card.rank}${card.suit}`) : [],
        remainingCards: Object.fromEntries(
          gameState.value.players.map(p => [p.id, p.cards.length])
        ),
        playerId: player.id,
        playerRole: gameState.value.landlordId === player.id ? 'landlord' as const : 'farmer' as const,
        biddingHistory: gameState.value.biddingInfo.bids,
        multiplierHistory: gameState.value.biddingInfo.multiplierHistory || [],
        playHistory: [],
        personality: getAIPersonality(player.id),
        difficulty: getAIDifficulty()
      }
      
      const decision = getLocalAIDecision(context)
      await executeAIDecision(player, decision)
    } catch (error) {
      console.error('本地AI决策失败，使用原有逻辑:', error)
      
      // 最后的回退逻辑
      if (gameState.value.phase === 'bidding') {
        await handleBidLandlord(player.id, 'pass')
      } else if (gameState.value.phase === 'multiplier') {
        handleMultiplierDecision(player.id, 'pass')
      } else {
        await executeAIPass(player)
      }
    }
  }
  
  // AI个性和难度设置
  const aiPersonalities = ref<{ [playerId: string]: string }>({})
  const aiDifficulty = ref<'easy' | 'medium' | 'hard' | 'expert'>('medium')

  const getAIPersonality = (playerId: string): 'aggressive' | 'conservative' | 'balanced' | 'unpredictable' => {
    if (!aiPersonalities.value[playerId]) {
      const personalities = ['aggressive', 'conservative', 'balanced', 'unpredictable']
      aiPersonalities.value[playerId] = personalities[Math.floor(Math.random() * personalities.length)]
    }
    return aiPersonalities.value[playerId] as any
  }

  const getAIDifficulty = () => aiDifficulty.value

  const setAIDifficulty = (difficulty: 'easy' | 'medium' | 'hard' | 'expert') => {
    aiDifficulty.value = difficulty
    console.log('🤖 AI难度已设置为:', difficulty)
  }

  const parsePlayDecision = (decision: string, hand: string[]): string[] => {
    // 简单的出牌决策解析
    try {
      // 尝试解析单牌或多牌
      const cards = decision.split(',').map(c => c.trim())
      const validCards = cards.filter(card => hand.includes(card))
      return validCards
    } catch (error) {
      console.error('解析AI出牌决策失败:', error)
      return []
    }
  }

  // 执行AI出牌
  const executeAIPlay = async (player: Player, cards: Card[]) => {
    // 从AI玩家手牌中移除出的牌
    cards.forEach(card => {
      const index = player.cards.findIndex(c => c.id === card.id)
      if (index !== -1) {
        player.cards.splice(index, 1)
      }
    })
    
    // 重新排序手牌
    player.cards = sortCards(player.cards)
    
    // 更新游戏状态
    gameState.value.lastPlayedCards = cards
    gameState.value.lastPlayerId = player.id
    
    // 记录出牌历史
    const cardType = validateCardType(cards) || 'unknown'
    
    // 设置当前出牌显示
    setCurrentPlayedCards(player.id, player.name, cards, cardType)
    gameState.value.playHistory.push({
      playerId: player.id,
      playerName: player.name,
      cards: [...cards],
      cardType,
      timestamp: Date.now()
    })
    
    // 播放出牌音效
    playCardSound(cardType)
    
    // 检查是否获胜
    if (player.cards.length === 0) {
      await endGame(player.id)
      return
    }
    
    // 检查报牌提醒
    checkCardCountWarning(player)
    
    // 切换到下一个玩家
    nextTurn()
    
    console.log(`AI玩家 ${player.name} 出牌:`, cards)
  }
  
  // 执行AI过牌
  const executeAIPass = async (player: Player) => {
    // 记录过牌
    gameState.value.playHistory.push({
      playerId: player.id,
      playerName: player.name,
      cards: [],
      cardType: 'pass',
      timestamp: Date.now()
    })
    
    // 检查是否需要重置出牌状态
    checkAndResetPlayState()
    
    // 切换到下一个玩家
    nextTurn()
    
    console.log(`AI玩家 ${player.name} 过牌`)
  }

  const handleNetworkDisconnection = () => {
    showNotification({
      type: 'warning',
      title: '网络连接断开',
      message: '正在尝试重新连接...',
      duration: 0
    })
  }

  const handleNetworkReconnection = () => {
    showNotification({
      type: 'success',
      title: '网络已重连',
      message: '连接已恢复，游戏继续',
      duration: 3000
    })
  }

  const saveGameState = () => {
    if (!process.client) return
    
    try {
      if (isGameActive.value) {
        localStorage.setItem('unfinished_game', JSON.stringify({
          gameState: gameState.value,
          playerId: playerId.value,
          playerName: playerName.value,
          timestamp: Date.now()
        }))
      } else {
        localStorage.removeItem('unfinished_game')
      }
    } catch (error) {
      console.error('保存游戏状态失败:', error)
    }
  }

  const restoreGameState = async () => {
    if (!process.client) return
    
    try {
      const saved = localStorage.getItem('unfinished_game')
      if (saved) {
        const data = JSON.parse(saved)
        // 检查游戏是否还有效（比如不超过24小时）
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          gameState.value = data.gameState
          playerId.value = data.playerId
          playerName.value = data.playerName
          console.log('游戏状态已恢复')
        } else {
          localStorage.removeItem('unfinished_game')
        }
      }
    } catch (error) {
      console.error('恢复游戏状态失败:', error)
      localStorage.removeItem('unfinished_game')
    }
  }

  const clearUnfinishedGame = () => {
    if (process.client) {
      localStorage.removeItem('unfinished_game')
    }
  }

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`
    const fullNotification: Notification = {
      id,
      ...notification,
      duration: notification.duration ?? 4000
    }
    
    notifications.value.push(fullNotification)
    
    // 自动移除通知
    if (fullNotification.duration && fullNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, fullNotification.duration)
    }
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  // 确认对话框状态
  const confirmDialog = ref<{
    show: boolean
    title: string
    message: string
    confirmText: string
    cancelText: string
    resolve?: (value: boolean) => void
  }>({
    show: false,
    title: '',
    message: '',
    confirmText: '确认',
    cancelText: '取消'
  })

  const showConfirmDialog = async (options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmDialog.value = {
        show: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || '确认',
        cancelText: options.cancelText || '取消',
        resolve
      }
    })
  }

  const handleConfirmDialogConfirm = () => {
    if (confirmDialog.value.resolve) {
      confirmDialog.value.resolve(true)
    }
    confirmDialog.value.show = false
    confirmDialog.value.resolve = undefined
  }

  const handleConfirmDialogCancel = () => {
    if (confirmDialog.value.resolve) {
      confirmDialog.value.resolve(false)
    }
    confirmDialog.value.show = false
    confirmDialog.value.resolve = undefined
  }

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    
    // 保存到本地存储
    if (process.client) {
      localStorage.setItem('game_settings', JSON.stringify(settings.value))
    }
  }

  const startNewGame = async () => {
    console.log('🔄 重置游戏状态')
    
    // 停止游戏循环
    stopGameLoop()
    
    // 🔥 立即清除游戏结果弹窗（确保UI响应）
    gameState.value.gameResult = null
    console.log('🗑️ 游戏结果弹窗已清除')
    
    // 重置游戏状态
    gameState.value = {
      phase: 'waiting',
      players: [],
      currentPlayerId: null,
      landlordId: null,
      bottomCards: [],
      lastPlayedCards: [],
      lastPlayerId: null,
      playHistory: [],
      turn: 0,
      biddingInfo: {
        currentBidderId: null,
        bids: [],
        phase: 'calling',
        landlordCandidateId: null
      },
      multiplierInfo: {
        currentPlayerId: null,
        multiplier: 1,
        decisions: [],
        completedPlayers: []
      },
      gameResult: null,
      currentPlayedCards: null
    }
    
    // 重置其他状态
    selectedCards.value = []
    suggestedCards.value = []
    isPaused.value = false
    autoPlayEnabled.value = false
    turnTimeLeft.value = settings.value.autoPlayTimeout
    
    // 重置重发计数器
    reshuffleCount.value = 0
    
    console.log('✅ 游戏状态已重置')
  }

  const exitGame = async () => {
    // 停止游戏循环
    stopGameLoop()
    
    // 清理AI系统
    try {
      const { cleanupAI } = useAI()
      if (cleanupAI && typeof cleanupAI === 'function') {
        cleanupAI()
      }
    } catch (error) {
      console.warn('清理AI系统时出错:', error)
    }
    
    // 清理音效
    cleanupAudio()
    
    // 重置游戏状态
    gameState.value = {
      phase: 'waiting',
      players: [],
      currentPlayerId: null,
      landlordId: null,
      bottomCards: [],
      lastPlayedCards: [],
      lastPlayerId: null,
      playHistory: [],
      turn: 0,
      biddingInfo: {
        currentBidderId: null,
        bids: [],
        phase: 'calling',
        landlordCandidateId: null
      },
      multiplierInfo: {
        currentPlayerId: null,
        multiplier: 1,
        decisions: [],
        completedPlayers: []
      },
      gameResult: null,
      currentPlayedCards: null
    }
    
    // 重置控制状态
    isPaused.value = false
    autoPlayEnabled.value = false
    aiProcessing.value = false
    selectedCards.value = []
    suggestedCards.value = []
    isMultiplayer.value = false
    
    // 清理本地存储
    clearUnfinishedGame()
    
    // 清理操作反馈
    if (process.client) {
      const { clearFeedbacks } = useActionFeedback()
      clearFeedbacks()
    }
    
    console.log('游戏已退出，状态已清理')
  }

  const showGameResult = () => {
    // 显示游戏结果（通过gameResult计算属性自动显示）
  }

  // 工具函数
  const generateDeck = (): Card[] => {
    const deck: Card[] = []
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'] as const
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
    
    // 普通牌
    suits.forEach(suit => {
      ranks.forEach((rank, index) => {
        deck.push({
          suit,
          rank,
          value: index + 3,
          id: `${suit}-${rank}`
        })
      })
    })
    
    // 大小王
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

  const shuffleDeck = (deck: Card[]) => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
  }

  const sortCards = (cards: Card[]): Card[] => {
    return [...cards].sort((a, b) => {
      if (a.value !== b.value) return a.value - b.value
      return a.suit.localeCompare(b.suit)
    })
  }

  const validateCardType = (cards: Card[]): string | null => {
    console.log('validateCardType 输入的牌:', cards)
    console.log('牌的结构检查:', cards.map(c => ({
      suit: c.suit,
      rank: c.rank, 
      value: c.value,
      id: c.id
    })))
    
    // 使用完整的牌型校验逻辑
    const { analyzeCardType } = useGameLogic()
    
    try {
      const cardTypeInfo = analyzeCardType(cards)
      console.log('analyzeCardType 返回结果:', cardTypeInfo)
      
      if (cardTypeInfo.type === 'invalid') {
        console.log('无效牌型:', cards.map(c => `${c.rank}${c.suit}`))
        console.log('详细分析结果:', cardTypeInfo)
        return null
      }
      
      console.log('识别的牌型:', cardTypeInfo.type, cardTypeInfo.description)
      return cardTypeInfo.type
    } catch (error) {
      console.error('analyzeCardType 执行出错:', error)
      return null
    }
  }

  const canPlayCards = (cards: Card[], lastCards: Card[]): boolean => {
    // 使用游戏逻辑组合中的规则验证
    const { canPlayCards: gameCanPlayCards } = useGameLogic()
    return gameCanPlayCards(cards, lastCards)
  }

  const calculatePlayingHints = async (hand: Card[], lastCards: Card[]) => {
    // 使用斗地主规则引擎获取提示
    try {
      const { landlordRules } = await import('~/utils/landlord-rules')
      const lastPattern = lastCards.length > 0 ? landlordRules.validatePattern(lastCards) : null
      const playablePatterns = landlordRules.getPlayableCards(hand, lastPattern)
      
      return playablePatterns.slice(0, 3).map((pattern, index) => ({
        cardIndexes: pattern.cards.map(card => hand.findIndex(c => c.id === card.id)).filter(i => i !== -1),
        description: pattern.description
      }))
    } catch (error) {
      console.error('计算提示失败:', error)
      return []
    }
  }
  
  // 播放音效
  const playCardSound = (cardType: string) => {
    if (!settings.value.soundEnabled) return
    
    try {
      // 这里可以集成音效库
      console.log(`播放音效: ${cardType}`)
    } catch (error) {
      console.error('播放音效失败:', error)
    }
  }
  
  // 检查报牌提醒
  const checkCardCountWarning = (player: Player) => {
    const cardCount = player.cards.length
    
    if (cardCount === 1) {
      if (process.client) {
        const { addFeedback } = useActionFeedback()
        addFeedback('warning', player.name, '报单！', { duration: 3000 })
      }
    } else if (cardCount === 2) {
      if (process.client) {
        const { addFeedback } = useActionFeedback()
        addFeedback('warning', player.name, '报双！', { duration: 3000 })
      }
    }
  }
  
  // 开始叫地主阶段
  const startBiddingPhase = (randomSeed?: number) => {
    if (!gameState.value.players || gameState.value.players.length === 0) {
      console.error('叫地主阶段开始失败：没有玩家')
      return
    }
    
    // 🧹 确保出牌显示区完全清空（防止残留）
    gameState.value.currentPlayedCards = null
    console.log('🗑️ 叫地主阶段：出牌显示区已清空')
    
    // 🎲 选择起始玩家，确保公平性
    let randomStartIndex: number
    if (isMultiplayer.value && randomSeed !== undefined) {
      // 联机模式：使用同步的种子确保所有玩家得到相同结果
      randomStartIndex = randomSeed % gameState.value.players.length
      console.log('🌐 联机模式：使用同步种子', randomSeed, '选择起始玩家')
    } else {
      // 单机模式：使用真随机
      randomStartIndex = Math.floor(Math.random() * gameState.value.players.length)
      console.log('🎮 单机模式：使用真随机选择起始玩家')
    }
    
    // 🔍 调试：叫地主阶段开始
    console.log('🔍 叫地主阶段调试信息:')
    console.log(`  - 起始玩家索引: ${randomStartIndex}`)
    console.log(`  - 玩家列表:`, gameState.value.players.map(p => `${p.name}(${p.id})`))
    console.log(`  - 当前玩家ID: ${playerId.value}`)
    console.log(`  - isMyTurn: ${isMyTurn.value}`)
    
    const firstPlayer = gameState.value.players[randomStartIndex]
    
    if (!firstPlayer || !firstPlayer.id) {
      console.error('叫地主阶段开始失败：随机选择的玩家ID无效', firstPlayer)
      return
    }
    
    gameState.value.phase = 'bidding'
    gameState.value.biddingInfo = {
      currentBidderId: firstPlayer.id, // 从随机选择的玩家开始
      bids: [],
      phase: 'calling',
      landlordCandidateId: null
    }
    
    // 重置回合计时器
    turnTimeLeft.value = settings.value.autoPlayTimeout
    
    // 使用ActionFeedback显示叫地主开始
    if (process.client) {
      const { addFeedback } = useActionFeedback()
      addFeedback('bid', firstPlayer.name, '先叫地主', { 
        duration: 3000,
        gamePhase: 'bidding'
      })
    }
    
    console.log('🎲 叫地主阶段开始，随机起始玩家:', firstPlayer.name, 'ID:', firstPlayer.id, `(位置${randomStartIndex})`)
    console.log('所有玩家:', gameState.value.players.map((p, i) => `${i}: ${p.name}(${p.id})`))
    console.log('游戏状态:', gameState.value.phase)
    console.log('叫地主信息:', gameState.value.biddingInfo)
  }
  
  // 处理叫地主/抢地主
  const handleBidLandlord = async (playerId: string, bidType: 'call' | 'grab' | 'pass') => {
    const biddingInfo = gameState.value.biddingInfo
    const player = gameState.value.players.find(p => p.id === playerId)
    
    // 🔍 调试：记录叫地主决策
    console.log('🔍 handleBidLandlord 开始:')
    console.log(`  - 玩家: ${player?.name} (${playerId})`)
    console.log(`  - 决策: ${bidType}`)
    console.log(`  - 当前阶段: ${biddingInfo.phase}`)
    console.log(`  - 当前应该决策的玩家: ${biddingInfo.currentBidderId}`)
    console.log(`  - 已有决策历史:`, biddingInfo.bids.map(b => `${gameState.value.players.find(p => p.id === b.playerId)?.name}:${b.bid}`))
    
    // 🚨 验证：检查玩家是否已经做过决策
    const existingDecision = biddingInfo.bids.find(bid => bid.playerId === playerId)
    if (existingDecision) {
      console.error(`🚨 玩家 ${player?.name} 已经做过决策 (${existingDecision.bid})，拒绝重复决策 ${bidType}`)
      return
    }
    
    // 🚨 验证：检查是否轮到该玩家
    if (biddingInfo.currentBidderId !== playerId) {
      console.error(`🚨 不是玩家 ${player?.name} 的回合，当前应该是 ${gameState.value.players.find(p => p.id === biddingInfo.currentBidderId)?.name} 的回合`)
      return
    }
    
    // 添加操作反馈
    if (player && process.client) {
      const { addFeedback } = useActionFeedback()
      let message = ''
      if (bidType === 'call') message = '叫地主'
      else if (bidType === 'grab') message = '抢地主'
      else message = biddingInfo.phase === 'calling' ? '不叫' : '不抢'
      
      addFeedback('bid', player.name, message, { 
        duration: 2000, 
        gamePhase: gameState.value.phase 
      })
    }
    
    // 记录叫地主/抢地主
    biddingInfo.bids.push({
      playerId,
      bid: bidType,
      timestamp: Date.now()
    })
    
    // 处理叫地主阶段
    if (biddingInfo.phase === 'calling') {
      if (bidType === 'call') {
        // 有人叫地主，设为候选人，进入抢地主阶段
        biddingInfo.landlordCandidateId = playerId
        biddingInfo.phase = 'grabbing'
        
        // 🔍 抢地主阶段：从叫地主玩家的下家开始
        const orderedPlayers = getBiddingClockwiseOrder()
        const callerIndex = orderedPlayers.findIndex(p => p.id === playerId)
        const nextPlayerIndex = (callerIndex + 1) % orderedPlayers.length
        const nextPlayer = orderedPlayers[nextPlayerIndex]
        
        console.log(`🔄 ${player?.name} 叫地主，进入抢地主阶段`)
        console.log(`🔄 抢地主从叫地主玩家的下家开始: ${nextPlayer.name}(${nextPlayer.position === 'right' ? '右边下家' : nextPlayer.position === 'left' ? '左边上家' : '底部真人'})`)
        
        // 设置下一个玩家为抢地主的起始玩家
        biddingInfo.currentBidderId = nextPlayer.id
        turnTimeLeft.value = settings.value.autoPlayTimeout
        return
      }
      
      // 检查是否所有人都不叫
      if (biddingInfo.bids.length === 3 && biddingInfo.bids.every(bid => bid.bid === 'pass')) {
        await reshuffleCards()
        return
      }
      
      // 如果还有人没叫，继续
      if (biddingInfo.bids.length < 3) {
        proceedToNextBidder()
        return
      }
      
      // 所有人都叫过了，检查是否有人叫地主
      const callers = biddingInfo.bids.filter(bid => bid.bid === 'call')
      if (callers.length === 0) {
        await reshuffleCards()
        return
      }
      
      // 有人叫地主但没人抢，第一个叫的成为地主
      await confirmLandlord(callers[0].playerId)
      return
    }
    
    // 处理抢地主阶段
    if (biddingInfo.phase === 'grabbing') {
      if (bidType === 'grab') {
        // 有人抢地主，更新候选人
        biddingInfo.landlordCandidateId = playerId
      }
      
      // 找到叫地主的玩家
      const callerId = biddingInfo.bids.find(bid => bid.bid === 'call')?.playerId
      if (!callerId) {
        console.error('抢地主阶段但找不到叫地主的玩家，强制重新洗牌')
        await reshuffleCards()
        return
      }
      
      // 计算需要参与抢地主的玩家（除了叫地主的玩家）
      const otherPlayers = gameState.value.players.filter(p => p.id !== callerId)
      console.log('抢地主阶段 - 叫地主玩家:', callerId, '需要抢地主的玩家:', otherPlayers.map(p => p.name))
      
      // 计算已经做出抢地主决策的玩家（grab或pass，但不是call）
      const grabPhaseDecisions = biddingInfo.bids.filter(bid => 
        bid.playerId !== callerId && (bid.bid === 'grab' || bid.bid === 'pass')
      )
      console.log('已做出抢地主决策的玩家数量:', grabPhaseDecisions.length, '需要决策的玩家数量:', otherPlayers.length)
      
      // 检查是否所有其他玩家都已经做出抢地主决策
      if (grabPhaseDecisions.length >= otherPlayers.length) {
        // 所有人都做出了选择，确定地主
        console.log('所有玩家完成抢地主决策，确定地主:', biddingInfo.landlordCandidateId)
        await confirmLandlord(biddingInfo.landlordCandidateId!)
        return
      }
      
      // 继续到下一个玩家或等待当前玩家决策
      proceedToNextBidder()
    }
  }
  
  // 进入下一个叫地主/抢地主的玩家
  const proceedToNextBidder = () => {
    const biddingInfo = gameState.value.biddingInfo
    
    // 获取当前阶段的正确顺序
    const orderedPlayers = getBiddingClockwiseOrder()
    let currentIndex = orderedPlayers.findIndex(p => p.id === biddingInfo.currentBidderId)
    
    console.log('🔄 proceedToNextBidder 开始:')
    console.log(`  - 当前阶段: ${biddingInfo.phase}`)
    console.log(`  - 当前玩家索引: ${currentIndex}`)
    console.log(`  - 已有决策:`, biddingInfo.bids.map(b => `${gameState.value.players.find(p => p.id === b.playerId)?.name}:${b.bid}`))
    const orderDesc = orderedPlayers.map(p => {
      const pos = p.position === 'bottom' ? '底部真人' : p.position === 'right' ? '右边下家' : '左边上家'
      return `${p.name}(${pos})`
    }).join(' → ')
    console.log(`  - 叫地主顺时针顺序: ${orderDesc}`)
    
    if (currentIndex === -1) {
      console.error('🚨 proceedToNextBidder: 找不到当前玩家，强制重新洗牌')
      reshuffleCards()
      return
    }
    
    // 🔍 检查当前玩家是否应该被跳过
    const shouldSkipCurrentPlayer = () => {
      if (biddingInfo.phase === 'grabbing') {
        const callerId = biddingInfo.bids.find(bid => bid.bid === 'call')?.playerId
        const grabPhaseDecisions = biddingInfo.bids.filter(bid => 
          bid.playerId !== callerId && (bid.bid === 'grab' || bid.bid === 'pass')
        )
        
        // 跳过叫地主的玩家
        if (biddingInfo.currentBidderId === callerId) {
          console.log('🔄 当前玩家是叫地主的玩家，需要跳过')
          return true
        }
        
        // 跳过已经做过抢地主决策的玩家
        const hasDecision = grabPhaseDecisions.some(d => d.playerId === biddingInfo.currentBidderId)
        if (hasDecision) {
          console.log('🔄 当前玩家已经做过抢地主决策，需要跳过')
          return true
        }
      } else if (biddingInfo.phase === 'calling') {
        // 在叫地主阶段，跳过已经做过决策的玩家
        const hasDecision = biddingInfo.bids.some(bid => bid.playerId === biddingInfo.currentBidderId)
        if (hasDecision) {
          console.log('🔄 当前玩家已经做过叫地主决策，需要跳过')
          return true
        }
      }
      
      return false
    }
    
    // 如果当前玩家需要被跳过，立即移动到下一个玩家（带递归保护）
    let skipAttempts = 0
    const maxSkipAttempts = orderedPlayers.length
    
    while (shouldSkipCurrentPlayer() && skipAttempts < maxSkipAttempts) {
      console.log('🔄 跳过当前玩家，移动到下一个')
      currentIndex = (currentIndex + 1) % orderedPlayers.length
      biddingInfo.currentBidderId = orderedPlayers[currentIndex].id
      skipAttempts++
    }
    
    if (skipAttempts >= maxSkipAttempts) {
      console.error('🚨 跳过玩家次数过多，可能存在逻辑错误')
      reshuffleCards()
      return
    }
    
    // 重置计时器
    turnTimeLeft.value = settings.value.autoPlayTimeout
    
    // 检查阶段完成条件
    if (biddingInfo.phase === 'grabbing') {
      const callerId = biddingInfo.bids.find(bid => bid.bid === 'call')?.playerId
      const otherPlayers = orderedPlayers.filter(p => p.id !== callerId)
      const grabPhaseDecisions = biddingInfo.bids.filter(bid => 
        bid.playerId !== callerId && (bid.bid === 'grab' || bid.bid === 'pass')
      )
      
      console.log('🔄 抢地主阶段状态检查:')
      console.log(`  - 需要决策的玩家数: ${otherPlayers.length}`)
      console.log(`  - 已决策的玩家数: ${grabPhaseDecisions.length}`)
      
      // 如果所有需要抢地主的玩家都已经决策完毕，直接确定地主
      if (grabPhaseDecisions.length >= otherPlayers.length) {
        console.log('🔄 所有玩家已完成抢地主决策，确定地主:', biddingInfo.landlordCandidateId)
        confirmLandlord(biddingInfo.landlordCandidateId!)
        return
      }
    } else if (biddingInfo.phase === 'calling') {
      // 检查叫地主阶段是否完成
      if (biddingInfo.bids.length >= orderedPlayers.length) {
        const callers = biddingInfo.bids.filter(bid => bid.bid === 'call')
        if (callers.length === 0) {
          console.log('🔄 所有玩家都不叫地主，重新洗牌')
          reshuffleCards()
          return
        } else {
          console.log('🔄 叫地主阶段完成，确定地主:', callers[0].playerId)
          confirmLandlord(callers[0].playerId)
          return
        }
      }
    }
    
    // 正常处理：移动到下一个玩家（按叫地主顺时针顺序）
    const nextIndex = (currentIndex + 1) % orderedPlayers.length
    const nextPlayer = orderedPlayers[nextIndex]
    const oldCurrentBidderId = biddingInfo.currentBidderId
    biddingInfo.currentBidderId = nextPlayer.id
    
    console.log(`🔄 proceedToNextBidder: 从 ${orderedPlayers[currentIndex].name} 切换到 ${nextPlayer.name}`)
    console.log(`  - 旧的currentBidderId: ${oldCurrentBidderId}`)
    console.log(`  - 新的currentBidderId: ${biddingInfo.currentBidderId}`)
    
    // 注意：计时器已经在前面重置过了
  }
  
  // 确定地主
  const confirmLandlord = async (landlordId: string) => {
    gameState.value.landlordId = landlordId
    
    // 🧹 确保进入出牌阶段时没有残留显示
    gameState.value.currentPlayedCards = null
    console.log('🗑️ 进入出牌阶段：出牌显示区已清空')
    
    // 地主获得底牌
    const landlord = gameState.value.players.find(p => p.id === landlordId)!
    landlord.cards.push(...gameState.value.bottomCards)
    landlord.cards = sortCards(landlord.cards)
    
    // 调试信息
    console.log('=== 地主确定调试信息 ===')
    console.log('地主ID:', landlordId)
    console.log('地主名称:', landlord.name)
    console.log('当前玩家ID:', playerId.value)
    console.log('是否是地主:', landlordId === playerId.value)
    console.log('所有玩家:', gameState.value.players.map(p => ({ id: p.id, name: p.name })))
    console.log('========================')
    
    // 添加地主确定反馈
    if (process.client) {
      const { addFeedback } = useActionFeedback()
      addFeedback('landlord', landlord.name, '成为地主！', { duration: 3000 })
    }
    
    // 进入倍数阶段
    startMultiplierPhase()
    
    // 重置计时器（保持托管状态）
    turnTimeLeft.value = settings.value.autoPlayTimeout
    // 注意：不重置托管状态，让用户自己控制
    
    console.log('地主确定，重置计时器:', turnTimeLeft.value)
    
  }
  
  // 重新洗牌计数器
  const reshuffleCount = ref(0)
  
  // 重新洗牌
  const reshuffleCards = async () => {
    reshuffleCount.value++
    
    // 防止无限重发，最多重发3次
    if (reshuffleCount.value > 3) {
      console.log('重发次数过多，强制随机指定一个玩家为地主')
      // 🎲 强制随机指定一个玩家为地主，确保公平性
      const randomLandlordIndex = Math.floor(Math.random() * gameState.value.players.length)
      const randomLandlord = gameState.value.players[randomLandlordIndex]
      if (randomLandlord) {
        gameState.value.landlordId = randomLandlord.id
        gameState.value.phase = 'playing'
        gameState.value.currentPlayerId = randomLandlord.id
        
        // 给地主发底牌
        randomLandlord.cards.push(...gameState.value.bottomCards)
        
        // 添加地主确定反馈
        if (process.client) {
          const { addFeedback } = useActionFeedback()
          addFeedback('landlord', randomLandlord.name, '成为地主！', { duration: 3000 })
        }
        
        reshuffleCount.value = 0 // 重置计数器
        return
      }
    }
    
    // 重新发牌
    await dealCards()
    startBiddingPhase() // 重发时也使用随机起始
  }

  return {
    // 状态
    gameState: readonly(gameState),
    playerId: readonly(playerId),
    playerName: readonly(playerName),
    selectedCards,
    suggestedCards,
    isLoading: readonly(isLoading),
    isPaused: readonly(isPaused),
    autoPlayEnabled: readonly(autoPlayEnabled),
    turnTimeLeft: readonly(turnTimeLeft),
    isMultiplayer: readonly(isMultiplayer),
    deviceInfo: readonly(deviceInfo),
    settings: readonly(settings),
    notifications: readonly(notifications),
    confirmDialog: readonly(confirmDialog),

    // 计算属性
    isGameActive,
    isInGame,
    currentPlayer,
    landlord,
    myPlayer,
    isMyTurn,
    opponents,
    playerCards,
    canPlay,
    canPass,
    gamePhase,
    players,
    lastPlayedCards,
    bottomCards,
    playHistory,
    biddingInfo,
    multiplierInfo: computed(() => gameState.value.multiplierInfo),
    gameResult,
    currentPlayedCards,
    hasUnfinishedGame,
    playerStats,

    // 方法
    initializePlayer,
    updatePlayerName,
    validatePlayerName,
    startBiddingPhase, // 导出供联机模式使用
    detectDeviceCapability,
    initializeAudio,
    cleanupAudio,
    startAIGame,
    setAIDifficulty,
    getAIDifficulty,
    selectCard,
    playSelectedCards,
    passTurn,
    getPlayingHint,
    toggleAutoPlay,
    pauseGame,
    resumeGame,
    initializeGameUI,
    startGameLoop,
    stopGameLoop,
    handleNetworkDisconnection,
    handleNetworkReconnection,
    saveGameState,
    restoreGameState,
    clearUnfinishedGame,
    showNotification,
    removeNotification,
    showConfirmDialog,
    handleConfirmDialogConfirm,
    handleConfirmDialogCancel,
    updateSettings,
    startNewGame,
    exitGame,
    showGameResult,
    handleBidLandlord,
    confirmLandlord,
    handleMultiplierDecision,
    canPlayerDouble
  }
})
