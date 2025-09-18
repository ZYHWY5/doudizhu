<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <button 
            @click="leaveRoom"
            class="btn btn-secondary flex items-center"
          >
            <Icon name="arrow-left" class="w-4 h-4 mr-2" />
            返回大厅
          </button>
          
          <div class="text-center">
            <h1 class="text-xl font-semibold text-gray-800">
              房间 {{ roomCode }}
            </h1>
            <NetworkStatusIndicator />
          </div>
          
          <div class="w-20"> <!-- 占位符保持布局平衡 --> </div>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- 左侧：房间信息和玩家列表 -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- 房间信息卡片 -->
          <div class="card">
            <div class="card-header flex items-center justify-between">
              <h2 class="text-lg font-semibold flex items-center">
                <Icon name="home" class="w-5 h-5 mr-2" />
                房间信息
              </h2>
              <div class="flex items-center space-x-2">
                <button 
                  v-if="isHost"
                  @click="showShareModal = true"
                  class="btn btn-primary btn-sm"
                >
                  <Icon name="share" class="w-4 h-4 mr-1" />
                  分享房间
                </button>
                <span 
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-medium',
                    roomStatus === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                    roomStatus === 'ready' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-600'
                  ]"
                >
                  {{ roomStatusText }}
                </span>
              </div>
            </div>
            <div class="card-body">
              <div class="space-y-4">
                <!-- 房间码展示 -->
                <div class="text-center">
                  <div class="room-code inline-block">
                    {{ roomCode }}
                  </div>
                  <div class="mt-2 space-x-2">
                    <button 
                      @click="copyRoomCode"
                      class="btn btn-sm btn-secondary"
                    >
                      <Icon name="copy" class="w-4 h-4 mr-1" />
                      复制房间码
                    </button>
                    <button 
                      @click="shareRoomLink"
                      class="btn btn-sm btn-secondary"
                    >
                      <Icon name="share" class="w-4 h-4 mr-1" />
                      分享链接
                    </button>
                  </div>
                </div>
                
                <!-- 房间设置 -->
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">房主:</span>
                    <span class="font-medium">{{ hostPlayer?.name || '未知' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">玩家数:</span>
                    <span class="font-medium">{{ players.length }}/3</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">游戏模式:</span>
                    <span class="font-medium">经典斗地主</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">网络延迟:</span>
                    <span 
                      :class="[
                        'font-medium',
                        networkLatency < 50 ? 'text-green-600' :
                        networkLatency < 100 ? 'text-yellow-600' :
                        'text-red-600'
                      ]"
                    >
                      {{ networkLatency }}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 玩家列表 -->
          <div class="card">
            <div class="card-header">
              <h2 class="text-lg font-semibold flex items-center">
                <Icon name="users" class="w-5 h-5 mr-2" />
                玩家列表
              </h2>
            </div>
            <div class="card-body">
              <div class="space-y-3">
                <PlayerCard 
                  v-for="player in players" 
                  :key="player.id"
                  :player="player"
                  :is-host="player.id === hostPlayer?.id"
                  :is-current-user="player.id === currentUserId"
                  :can-kick="isHost && player.id !== currentUserId"
                  @kick-player="kickPlayer"
                />
                
                <!-- 空位占位符 -->
                <div 
                  v-for="i in (3 - players.length)" 
                  :key="`empty-${i}`"
                  class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg"
                >
                  <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <Icon name="user-plus" class="w-5 h-5 text-gray-400" />
                  </div>
                  <span class="text-gray-500">等待玩家加入...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：聊天和控制 -->
        <div class="space-y-6">
          
          <!-- 聊天区域 -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-semibold flex items-center">
                <Icon name="chat" class="w-5 h-5 mr-2" />
                聊天室
              </h3>
            </div>
            <div class="card-body p-0">
              <ChatBox 
                :messages="chatMessages"
                :current-user-id="currentUserId"
                @send-message="sendChatMessage"
                class="h-64"
              />
            </div>
          </div>

          <!-- 游戏控制 -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-semibold">游戏控制</h3>
            </div>
            <div class="card-body space-y-4">
              
              <!-- 调试信息（仅开发环境） -->
              <div v-if="isDev" class="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                调试: isHost={{ isHost }}, currentUserId={{ currentUserId }}, hostId={{ hostPlayer?.id }}
              </div>
              
              <!-- 非房主的准备状态 -->
              <div v-if="!isHost" class="text-center">
                <button 
                  v-if="!currentUser?.isReady"
                  @click="toggleReady"
                  :disabled="isTogglingReady"
                  class="btn btn-success btn-lg w-full"
                >
                  <Icon name="check" class="w-5 h-5 mr-2" />
                  {{ isTogglingReady ? '准备中...' : '准备' }}
                </button>
                
                <button 
                  v-else
                  @click="toggleReady"
                  :disabled="isTogglingReady"
                  class="btn btn-secondary btn-lg w-full"
                >
                  <Icon name="x" class="w-5 h-5 mr-2" />
                  {{ isTogglingReady ? '取消中...' : '取消准备' }}
                </button>
              </div>

              <!-- 房主专用控制 -->
              <div v-if="isHost" class="space-y-3">
                <button 
                  @click="startGame"
                  :disabled="!canStartGame || isStartingGame"
                  class="btn btn-primary btn-lg w-full"
                >
                  <Icon name="play" class="w-5 h-5 mr-2" />
                  {{ isStartingGame ? '启动中...' : '开始游戏' }}
                </button>
                
                <div class="text-sm text-gray-600 text-center space-y-1">
                  <p v-if="canStartGame" class="text-green-600 font-medium">
                    ✅ 所有玩家已准备，可以开始游戏
                  </p>
                  <p v-else-if="players.length < 3" class="text-orange-600">
                    👥 等待玩家加入 ({{ players.length }}/3)
                  </p>
                  <p v-else>
                    ⏳ 等待其他玩家准备 ({{ readyPlayersCount }}/{{ nonHostPlayersCount }})
                  </p>
                  <p class="text-xs text-gray-500">
                    房主无需准备，等待其他玩家即可
                  </p>
                </div>
              </div>

              <!-- 离开房间 -->
              <div class="pt-4 border-t border-gray-200">
                <button 
                  @click="leaveRoom"
                  class="btn btn-danger w-full"
                >
                  <Icon name="door-open" class="w-5 h-5 mr-2" />
                  离开房间
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 分享房间模态框 -->
    <div v-if="showShareModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">分享房间</h3>
          <button @click="showShareModal = false" class="text-gray-400 hover:text-gray-600">
            <Icon name="x" class="w-5 h-5" />
          </button>
        </div>
        
        <div class="space-y-4">
          <!-- 房间链接 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">房间链接</label>
            <div class="flex">
              <input 
                :value="roomLink"
                readonly
                class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm bg-gray-50"
              />
              <button 
                @click="copyRoomLink"
                class="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 text-sm"
              >
                复制
              </button>
            </div>
          </div>
          
          <!-- 二维码 -->
          <div class="text-center">
            <label class="block text-sm font-medium text-gray-700 mb-2">扫码加入</label>
            <div class="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <div ref="qrCodeRef" class="w-32 h-32 flex items-center justify-center bg-gray-100 rounded">
                <span class="text-xs text-gray-500">二维码加载中...</span>
              </div>
            </div>
          </div>
          
          <!-- 使用说明 -->
          <div class="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <p class="font-medium mb-1">📱 使用方法：</p>
            <ul class="space-y-1 text-xs">
              <li>• 复制链接发送给好友</li>
              <li>• 或让好友扫描二维码</li>
              <li>• 好友点击链接即可加入房间</li>
            </ul>
          </div>
        </div>
        
        <div class="flex justify-end mt-6">
          <button @click="showShareModal = false" class="btn btn-primary">
            完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面参数
const route = useRoute()
const roomCode = route.params.code as string

// 页面元数据
definePageMeta({
  validate: async (route) => {
    const code = route.params.code as string
    return /^[A-Z0-9]{6}$/.test(code)
  }
})

// 状态管理
const roomStore = useRoomStore()
const gameStore = useGameStore()
const networkStore = useNetworkStore()

// 响应式数据
const isTogglingReady = ref(false)
const isStartingGame = ref(false)
const showShareModal = ref(false)
const qrCodeRef = ref<HTMLElement>()
const roomLink = ref('')

// 计算属性
const players = computed(() => roomStore.players)
const hostPlayer = computed(() => roomStore.hostPlayer)
const currentUser = computed(() => roomStore.currentUser)
const currentUserId = computed(() => gameStore.playerId)
const isHost = computed(() => {
  // 直接基于用户ID判断是否为房主，更可靠
  const isHostByUserId = currentUserId.value && hostPlayer.value && currentUserId.value === hostPlayer.value.id
  const storeIsHost = roomStore.isHost
  
  console.log('房间页面 - isHost判断:', { 
    currentUserId: currentUserId.value, 
    hostId: hostPlayer.value?.id, 
    isHostByUserId, 
    storeIsHost,
    finalResult: isHostByUserId || storeIsHost
  })
  
  // 优先使用基于ID的判断，作为store状态的备用
  return isHostByUserId || storeIsHost
})
const chatMessages = computed(() => roomStore.chatMessages)
const networkLatency = computed(() => networkStore.latency)

const roomStatus = computed(() => {
  if (players.value.length < 3) return 'waiting'
  // 房主不需要准备，只检查其他玩家
  const nonHostPlayers = players.value.filter(p => !p.isHost)
  if (nonHostPlayers.every(p => p.isReady)) return 'ready'
  return 'preparing'
})

const roomStatusText = computed(() => {
  switch (roomStatus.value) {
    case 'waiting': return '等待玩家'
    case 'ready': return '准备就绪'
    case 'preparing': return '准备中'
    default: return '未知状态'
  }
})

const canStartGame = computed(() => {
  return roomStore.canStartGame
})

// 非房主玩家数量
const nonHostPlayersCount = computed(() => {
  const count = players.value.filter(p => !p.isHost).length
  console.log('非房主玩家数量:', count, '所有玩家:', players.value.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })))
  return count
})

// 已准备的非房主玩家数量
const readyPlayersCount = computed(() => {
  const count = players.value.filter(p => !p.isHost && p.isReady).length
  console.log('已准备的非房主玩家数量:', count)
  return count
})

// 开发环境判断
const isDev = computed(() => {
  return process.env.NODE_ENV === 'development'
})

// 方法
const toggleReady = async () => {
  if (isTogglingReady.value) return
  
  isTogglingReady.value = true
  
  try {
    await roomStore.toggleReady()
  } catch (error) {
    console.error('切换准备状态失败:', error)
    gameStore.showNotification({
      type: 'error',
      title: '操作失败',
      message: '无法切换准备状态，请重试'
    })
  } finally {
    isTogglingReady.value = false
  }
}

const startGame = async () => {
  if (!canStartGame.value || isStartingGame.value) return
  
  isStartingGame.value = true
  
  try {
    await roomStore.startGame()
    await navigateTo('/game')
  } catch (error) {
    console.error('开始游戏失败:', error)
    gameStore.showNotification({
      type: 'error',
      title: '启动失败',
      message: '无法开始游戏，请重试'
    })
  } finally {
    isStartingGame.value = false
  }
}

const leaveRoom = async () => {
  const confirmed = await gameStore.showConfirmDialog({
    title: '确认离开',
    message: '确定要离开房间吗？',
    confirmText: '离开',
    cancelText: '取消'
  })
  
  if (confirmed) {
    try {
      await roomStore.leaveRoom()
      await navigateTo('/')
    } catch (error) {
      console.error('离开房间失败:', error)
    }
  }
}

const kickPlayer = async (playerId: string) => {
  const confirmed = await gameStore.showConfirmDialog({
    title: '确认踢出',
    message: '确定要踢出该玩家吗？',
    confirmText: '踢出',
    cancelText: '取消'
  })
  
  if (confirmed) {
    try {
      await roomStore.kickPlayer(playerId)
    } catch (error) {
      console.error('踢出玩家失败:', error)
      gameStore.showNotification({
        type: 'error',
        title: '操作失败',
        message: '无法踢出玩家，请重试'
      })
    }
  }
}

const sendChatMessage = async (message: string) => {
  try {
    await roomStore.sendChatMessage(message)
  } catch (error) {
    console.error('发送消息失败:', error)
  }
}

const copyRoomCode = async () => {
  try {
    await navigator.clipboard.writeText(roomCode)
    gameStore.showNotification({
      type: 'success',
      title: '复制成功',
      message: '房间码已复制到剪贴板'
    })
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const shareRoomLink = async () => {
  const url = `${window.location.origin}/room/${roomCode}`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: '斗地主游戏邀请',
        text: `来和我一起玩斗地主吧！房间码: ${roomCode}`,
        url: url
      })
    } catch (error) {
      // 用户取消分享
    }
  } else {
    try {
      await navigator.clipboard.writeText(url)
      gameStore.showNotification({
        type: 'success',
        title: '链接已复制',
        message: '房间链接已复制到剪贴板'
      })
    } catch (error) {
      console.error('复制链接失败:', error)
    }
  }
}

// 生命周期
onMounted(async () => {
  try {
    // 加入房间
    await roomStore.joinRoom(roomCode)
    
    // 开始网络监控
    networkStore.startMonitoring()
  } catch (error) {
    console.error('加入房间失败:', error)
    gameStore.showNotification({
      type: 'error',
      title: '加入失败',
      message: '无法加入房间，可能房间不存在或已满员'
    })
    
    // 返回大厅
    await navigateTo('/')
  }
})

onBeforeUnmount(() => {
  // 停止网络监控
  networkStore.stopMonitoring()
})

// 监听房间状态变化
watch(() => roomStore.gameStarted, (started) => {
  if (started) {
    // 游戏开始，跳转到游戏页面
    navigateTo('/game')
  }
})

// 监听玩家离开
watch(() => players.value.length, (newLength, oldLength) => {
  if (oldLength && newLength < oldLength) {
    gameStore.showNotification({
      type: 'info',
      title: '玩家离开',
      message: '有玩家离开了房间'
    })
  }
})

// 生命周期
onMounted(() => {
  console.log('房间页面挂载完成')
  console.log('roomStore.isHost:', roomStore.isHost)
  console.log('roomStore.currentUserId:', roomStore.currentUserId)
  console.log('roomStore.players:', roomStore.players)
})

// 生成房间分享链接
const generateRoomLink = async () => {
  try {
    const { generateRoomLink } = await import('~/utils/simpleSignaling')
    const roomInfo = {
      roomCode: roomCode,
      hostPeerId: currentUserId.value,
      hostName: gameStore.playerName || '房主',
      timestamp: Date.now()
    }
    roomLink.value = generateRoomLink(roomInfo)
    console.log('📡 生成房间链接:', roomLink.value)
  } catch (error) {
    console.error('生成房间链接失败:', error)
    roomLink.value = `${window.location.origin}${window.location.pathname}#/room/${roomCode}`
  }
}

// 复制房间链接
const copyRoomLink = async () => {
  try {
    await navigator.clipboard.writeText(roomLink.value)
    gameStore.showNotification({
      type: 'success',
      title: '复制成功',
      message: '链接已复制到剪贴板'
    })
  } catch (error) {
    console.error('复制失败:', error)
    gameStore.showNotification({
      type: 'error',
      title: '复制失败',
      message: '请手动复制链接'
    })
  }
}

// 生成二维码
const generateQRCode = async () => {
  if (!qrCodeRef.value || !roomLink.value) return
  
  try {
    // 使用简单的二维码生成方案
    const qrText = roomLink.value
    const qrSize = 128
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}`
    
    qrCodeRef.value.innerHTML = `<img src="${qrUrl}" alt="房间二维码" class="w-full h-full" />`
    console.log('📡 生成二维码:', qrUrl)
  } catch (error) {
    console.error('生成二维码失败:', error)
    if (qrCodeRef.value) {
      qrCodeRef.value.innerHTML = '<span class="text-xs text-red-500">二维码生成失败</span>'
    }
  }
}

// 监听分享模态框状态
watch(showShareModal, async (newValue) => {
  if (newValue && isHost.value) {
    await generateRoomLink()
    await nextTick()
    await generateQRCode()
  }
})

// SEO
useSeoMeta({
  title: `斗地主网游 - 房间 ${roomCode}`,
  description: '等待玩家加入，准备开始斗地主游戏',
  robots: 'noindex, nofollow'
})
</script>
