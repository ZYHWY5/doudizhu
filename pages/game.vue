<template>
  <div class="game-container">
    <!-- 主游戏区域 -->
    <div class="game-table">
      <!-- 对手1（左上方） -->
      <div class="player-area absolute left-8 top-16">
        <PlayerArea
          v-if="opponents[0]"
          :player="opponents[0]"
          :is-current-turn="isPlayerCurrentTurn(opponents[0]?.id)"
          :is-landlord="landlord?.id === opponents[0]?.id"
          :game-phase="gamePhase"
          :current-played-cards="currentPlayedCards"
          position="left"
        />
      </div>

      <!-- 对手2（右上方） -->
      <div class="player-area absolute right-8 top-16">
        <PlayerArea
          v-if="opponents[1]"
          :player="opponents[1]"
          :is-current-turn="isPlayerCurrentTurn(opponents[1]?.id)"
          :is-landlord="landlord?.id === opponents[1]?.id"
          :game-phase="gamePhase"
          :current-played-cards="currentPlayedCards"
          position="right"
        />
      </div>

      <!-- 中央出牌区域（上移至真正居中） -->
      <div class="absolute left-1/2 top-1/3 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        <PlayArea
          :last-played-cards="lastPlayedCards"
          :current-player-name="currentPlayerName"
          :bottom-cards="bottomCards"
          :play-history="playHistory"
          :game-phase="gamePhase"
        />
      </div>

      <!-- 游戏阶段指示器 -->
      <GamePhaseIndicator 
        :phase="gamePhase"
        :bidding-info="biddingInfo"
        :multiplier-info="multiplierInfo"
        class="absolute top-4 left-1/2 transform -translate-x-1/2"
      />
    </div>

    <!-- 玩家手牌区域 -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg">
      <PlayerHandArea
        :cards="playerCards"
        :selected-cards="selectedCards"
        :can-play="canPlay"
        :is-my-turn="isMyTurn"
        :suggested-cards="suggestedCards"
        :game-phase="gamePhase"
        :is-landlord="landlord?.id === gameStore.playerId"
        :current-played-cards="currentPlayedCards"
        :player-name="gameStore.playerName"
        @select-card="selectCard"
      />
    </div>

    <!-- 游戏控制面板 - 可拖动 -->
    <div class="fixed bottom-5 right-12 z-50">
      <GameControls
        :game-phase="gamePhase"
        :is-my-turn="isMyTurn"
        :can-play="canPlay"
        :can-pass="canPass"
        :auto-play-enabled="autoPlayEnabled"
        :time-left="turnTimeLeft"
        :can-double="canDouble"
        :bidding-info="biddingInfo"
        :multiplier-info="multiplierInfo"
        @bid-landlord="bidLandlord"
        @play-cards="playCards"
        @pass-turn="passTurn"
        @get-hint="getHint"
        @toggle-auto-play="toggleAutoPlay"
        @show-history="showPlayHistory"
        @show-settings="showSettings"
        @pause-game="pauseGame"
        @show-game-info="showGameInfo"
        @multiplier-decision="handleMultiplierDecision"
      />
    </div>

    <!-- 网络状态指示器 -->
    <NetworkIndicator
      :latency="networkLatency"
      :quality="networkQuality"
      :connection-type="connectionType"
      class="fixed top-4 left-4"
    />

    <!-- 游戏结果弹窗 -->
    <GameResultModal
      v-if="gameResult"
      :result="gameResult"
      :players="allPlayers"
      @play-again="playAgain"
      @return-to-lobby="returnToLobby"
    />

    <!-- 暂停菜单 -->
    <PauseMenu
      v-if="isPaused"
      @resume="resumeGame"
      @settings="showSettings"
      @exit="exitGame"
    />

    <!-- 设置面板 -->
    <SettingsPanel
      v-if="showSettingsPanel"
      @close="showSettingsPanel = false"
      @save="saveSettings"
    />

    <!-- 出牌历史 -->
    <PlayHistoryModal
      v-if="showHistoryModal"
      :history="playHistory"
      @close="showHistoryModal = false"
    />
    
    <!-- 操作反馈 -->
    <ActionFeedback ref="actionFeedbackRef" />
  </div>
</template>

<script setup lang="ts">
// 页面元数据
definePageMeta({
  title: '游戏中',
  layout: false // 游戏页面使用自定义布局
})

// 状态管理
const gameStore = useGameStore()
// const roomStore = useRoomStore() // 已移除联机功能
// const networkStore = useNetworkStore() // 已移除联机功能

// 响应式数据
const showSettingsPanel = ref(false)
const showHistoryModal = ref(false)
const actionFeedbackRef = ref<any>(null)

// 计算属性
const gamePhase = computed(() => gameStore.gamePhase)
const currentPlayer = computed(() => gameStore.currentPlayer)
const currentPlayerId = computed(() => gameStore.gameState.currentPlayerId)
const currentPlayerName = computed(() => gameStore.currentPlayer?.name || '')
const landlord = computed(() => gameStore.landlord)
const allPlayers = computed(() => gameStore.players)
const opponents = computed(() => gameStore.opponents)
const playerCards = computed(() => gameStore.playerCards)
const selectedCards = computed(() => gameStore.selectedCards)
const lastPlayedCards = computed(() => gameStore.lastPlayedCards)
const bottomCards = computed(() => gameStore.bottomCards)
const playHistory = computed(() => gameStore.playHistory)
const biddingInfo = computed(() => gameStore.biddingInfo)
const currentPlayedCards = computed(() => gameStore.currentPlayedCards)
const gameResult = computed(() => gameStore.gameResult)
const isPaused = computed(() => gameStore.isPaused)
const isMyTurn = computed(() => gameStore.isMyTurn)
const canPlay = computed(() => gameStore.canPlay)
const canPass = computed(() => gameStore.canPass)
const autoPlayEnabled = computed(() => gameStore.autoPlayEnabled)
const turnTimeLeft = computed(() => gameStore.turnTimeLeft)
const suggestedCards = computed(() => gameStore.suggestedCards)
const canDouble = computed(() => gameStore.canPlayerDouble(gameStore.playerId))
const multiplierInfo = computed(() => gameStore.multiplierInfo)

// 单机模式，无需网络状态
// const networkStatus = computed(() => networkStore.status)
// const networkLatency = computed(() => networkStore.latency)  
// const networkQuality = computed(() => networkStore.quality)
// const connectionType = computed(() => networkStore.connectionType)

// 调试：监控地主状态变化
watch([landlord, () => gameStore.playerId], ([newLandlord, newPlayerId]) => {
  console.log('=== 地主状态变化 ===')
  console.log('地主对象:', newLandlord)
  console.log('地主ID:', newLandlord?.id)
  console.log('当前玩家ID:', newPlayerId)
  console.log('是否是地主:', newLandlord?.id === newPlayerId)
  console.log('===================')
}, { immediate: true })

// 方法
const selectCard = (cardIndex: number) => {
  gameStore.selectCard(cardIndex)
}


const playCards = async () => {
  try {
    await gameStore.playSelectedCards()
  } catch (error) {
    console.error('出牌失败:', error)
    gameStore.showNotification({
      type: 'error',
      title: '出牌失败',
      message: '无法出牌，请检查选择的牌型'
    })
  }
}

const passTurn = async () => {
  try {
    await gameStore.passTurn()
  } catch (error) {
    console.error('过牌失败:', error)
  }
}

const getHint = () => {
  gameStore.getPlayingHint()
}

const toggleAutoPlay = () => {
  gameStore.toggleAutoPlay()
}

const bidLandlord = async (bid: 'call' | 'grab' | 'pass') => {
  try {
    await gameStore.handleBidLandlord(gameStore.playerId, bid)
  } catch (error) {
    console.error('叫地主失败:', error)
  }
}

const pauseGame = () => {
  console.log('暂停游戏按钮被点击')
  gameStore.pauseGame()
  console.log('游戏已暂停，isPaused:', gameStore.isPaused)
}

const resumeGame = () => {
  gameStore.resumeGame()
}

const showSettings = () => {
  showSettingsPanel.value = true
}

const showGameInfo = () => {
  // 显示游戏信息（阶段、当前玩家、地主等）
  const gameStore = useGameStore()
  const phaseText = {
    'waiting': '等待中',
    'bidding': '叫地主',
    'multiplier': '决定倍数',
    'playing': '游戏中', 
    'ended': '已结束'
  }[gamePhase.value] || '未知'
  
  const currentPlayerText = currentPlayer.value ? currentPlayer.value.name : '无'
  const landlordText = landlord.value ? landlord.value.name : '未确定'
  
  gameStore.showNotification({
    type: 'info',
    title: '游戏信息',
    message: `阶段: ${phaseText} | 当前: ${currentPlayerText} | 地主: ${landlordText}`,
    duration: 4000
  })
}

const showPlayHistory = () => {
  showHistoryModal.value = true
}

const saveSettings = (settings: GameSettings) => {
  gameStore.updateSettings(settings)
  showSettingsPanel.value = false
}

const playAgain = async () => {
  try {
    console.log('🔄 重新开始游戏')
    
    // 检查当前是否为AI模式
    const isAIMode = gameStore.players.some(p => p.isAutoPlay)
    
    if (isAIMode) {
      console.log('🤖 AI模式 - 重新创建AI对局')
      
      // 获取当前AI难度（从AI玩家名称推断）
      const aiPlayer = gameStore.players.find(p => p.isAutoPlay)
      let difficulty: 'easy' | 'normal' | 'hard' = 'normal'
      
      if (aiPlayer?.name.includes('新手') || aiPlayer?.name.includes('学徒')) {
        difficulty = 'easy'
      } else if (aiPlayer?.name.includes('大师') || aiPlayer?.name.includes('宗师')) {
        difficulty = 'hard'
      }
      
      console.log('🎯 检测到AI难度:', difficulty)
      
      // 重新开始AI游戏
      await gameStore.startAIGame(difficulty)
    } else {
      console.log('👥 多人模式 - 重置游戏状态')
      // 多人模式只重置状态
      await gameStore.startNewGame()
    }
    
    console.log('✅ 游戏重新开始成功')
  } catch (error) {
    console.error('❌ 开始新游戏失败:', error)
  }
}

const returnToLobby = async () => {
  const confirmed = await gameStore.showConfirmDialog({
    title: '确认退出',
    message: '确定要退出游戏返回大厅吗？',
    confirmText: '退出',
    cancelText: '取消'
  })
  
  if (confirmed) {
    await exitGame()
  }
}

const exitGame = async () => {
  try {
    await gameStore.exitGame()
    await navigateTo('/')
  } catch (error) {
    console.error('退出游戏失败:', error)
  }
}

const handleMultiplierDecision = (action: 'double' | 'pass') => {
  gameStore.handleMultiplierDecision(gameStore.playerId, action)
}

// 判断指定玩家是否是当前回合玩家
const isPlayerCurrentTurn = (playerId?: string) => {
  if (!playerId) return false
  
  if (gamePhase.value === 'bidding') {
    return biddingInfo.value.currentBidderId === playerId
  } else if (gamePhase.value === 'multiplier') {
    return multiplierInfo.value.currentPlayerId === playerId
  } else if (gamePhase.value === 'playing') {
    return currentPlayerId.value === playerId
  }
  
  return false
}

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  if (!isMyTurn.value) return
  
  switch (event.code) {
    case 'Space':
      event.preventDefault()
      if (canPlay.value) {
        playCards()
      }
      break
    case 'KeyP':
      event.preventDefault()
      if (canPass.value) {
        passTurn()
      }
      break
    case 'KeyH':
      event.preventDefault()
      getHint()
      break
    case 'KeyA':
      event.preventDefault()
      toggleAutoPlay()
      break
    case 'Escape':
      event.preventDefault()
      pauseGame()
      break
  }
}

// 生命周期
onMounted(async () => {
  try {
    // 检查游戏状态
    if (!gameStore.isGameActive) {
      // 没有活跃的游戏，返回大厅
      await navigateTo('/')
      return
    }
    
    // 初始化游戏界面
    await gameStore.initializeGameUI()
    
    // 开始游戏循环
    gameStore.startGameLoop()
    
    // 监听键盘事件
    window.addEventListener('keydown', handleKeydown)
    
    // 单机模式，无需网络监控
    // networkStore.startMonitoring()
    
    console.log('游戏界面初始化完成')
  } catch (error) {
    console.error('游戏初始化失败:', error)
    await navigateTo('/')
  }
})

onBeforeUnmount(() => {
  // 清理事件监听
  window.removeEventListener('keydown', handleKeydown)
  
  // 停止游戏循环
  gameStore.stopGameLoop()
  
  // 单机模式，无需停止网络监控
  // networkStore.stopMonitoring()
  
  // TODO: 继续未完成对局功能待完善
  // gameStore.saveGameState()
})

// 监听游戏状态变化
watch(() => gameStore.gamePhase, (newPhase) => {
  if (newPhase === 'ended') {
    // 游戏结束，显示结果
    setTimeout(() => {
      gameStore.showGameResult()
    }, 1000)
  }
})

// 单机模式，无需监听网络状态
// watch(() => networkStore.status, (status) => {
//   if (status === 'disconnected') {
//     gameStore.handleNetworkDisconnection()
//   } else if (status === 'connected') {
//     gameStore.handleNetworkReconnection()
//   }
// })

// 监听页面可见性
onMounted(() => {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (gameStore.isGameActive && !gameStore.isPaused) {
        gameStore.pauseGame()
      }
    } else {
      if (gameStore.isPaused && gameStore.isGameActive) {
        // 询问是否恢复游戏
        gameStore.showNotification({
          type: 'info',
          title: '游戏已暂停',
          message: '点击恢复继续游戏',
          actions: [
            {
              label: '恢复游戏',
              action: () => gameStore.resumeGame()
            }
          ]
        })
      }
    }
  })
})

// 防止页面刷新丢失游戏
if (process.client) {
  window.addEventListener('beforeunload', (event) => {
    if (gameStore.isGameActive) {
      event.preventDefault()
      event.returnValue = '游戏正在进行中，确定要离开吗？'
      return event.returnValue
    }
  })
}

// SEO
useSeoMeta({
  title: '斗地主网游 - 游戏中',
  description: '正在进行斗地主游戏',
  robots: 'noindex, nofollow'
})
</script>

<style scoped>
.game-container {
  @apply relative w-full h-screen overflow-hidden bg-gradient-to-br from-green-700 to-green-800;
}

.game-table {
  @apply relative w-full h-full;
}

.player-area {
  @apply z-10;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .game-container {
    @apply text-sm;
  }
}

@media (max-width: 480px) {
  .player-area {
    @apply scale-75;
  }
}
</style>
