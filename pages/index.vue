<template>
  <div class="min-h-screen flex flex-col">
    <!-- 顶部标题 -->
    <header class="relative text-center py-8">
      <!-- 玩家信息 -->
      <div class="absolute top-4 right-4 flex items-center space-x-4">
        <div class="flex items-center space-x-3 bg-white rounded-lg shadow-md px-4 py-2">
          <!-- 玩家头像 -->
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg cursor-pointer"
            :style="{ background: getAvatarColor(playerName) }"
            @click="showPlayerSettings = true"
            title="点击修改名称"
          >
            {{ getInitials(playerName) }}
          </div>
          
          <!-- 玩家名称 -->
          <div class="text-sm">
            <div class="font-medium text-gray-900">{{ playerName }}</div>
            <div class="text-xs text-gray-500">点击头像修改</div>
          </div>
        </div>
        
        <!-- 设置按钮 -->
        <button
          @click="showSettings = true"
          class="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="游戏设置"
        >
          <Icon name="settings" class="w-5 h-5 text-gray-600" />
        </button>
        
        <!-- 调试按钮（开发模式） -->
        <button
          v-if="isDev"
          @click="showDeviceInfo"
          class="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="设备信息"
        >
          <Icon name="info" class="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      <h1 class="text-4xl md:text-6xl font-bold text-gray-800 mb-2">
        🎮 斗地主网游
      </h1>
      <p class="text-lg text-gray-600">
        轻量化在线斗地主，支持AI对战和好友联机
      </p>
    </header>

    <!-- 主要内容 -->
    <main class="flex-1 flex items-center justify-center px-4">
      <div class="w-full max-w-2xl space-y-8">
        
        <!-- AI对战区域 -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold text-gray-800 flex items-center">
              <Icon name="robot" class="w-6 h-6 mr-2" />
              🤖 本地AI对战
            </h2>
          </div>
          <div class="card-body">
            <p class="text-gray-600 mb-4">
              与智能AI进行斗地主对战，无需网络连接
            </p>
            <AIDifficultySelector @start-game="startAIGame" />
          </div>
        </div>

        <!-- 联机对战区域 -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold text-gray-800 flex items-center">
              <Icon name="users" class="w-6 h-6 mr-2" />
              👥 联机对战
            </h2>
          </div>
          <div class="card-body space-y-6">
            <p class="text-gray-600">
              与朋友一起游戏，支持局域网和互联网连接
            </p>
            
            <!-- 创建房间 -->
            <div class="space-y-3">
              <button 
                @click="createRoom"
                :disabled="isCreatingRoom"
                class="btn btn-primary btn-lg w-full flex items-center justify-center"
              >
                <Icon 
                  :name="isCreatingRoom ? 'spinner' : 'plus'" 
                  :class="['w-5 h-5 mr-2', { 'animate-spin': isCreatingRoom }]" 
                />
                {{ isCreatingRoom ? '创建中...' : '创建房间' }}
              </button>
              
              <!-- 显示创建的房间信息 -->
              <RoomCreatedInfo 
                v-if="createdRoomCode" 
                :room-code="createdRoomCode"
                @copy-code="copyRoomCode"
                @share-link="shareRoomLink"
              />
            </div>

            <!-- 分隔线 -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">或</span>
              </div>
            </div>

            <!-- 加入房间 -->
            <div class="space-y-3">
              <div class="flex space-x-3">
                <input
                  v-model="roomCodeInput"
                  type="text"
                  placeholder="输入6位房间码"
                  maxlength="6"
                  class="input flex-1 text-center text-lg font-mono uppercase"
                  @input="formatRoomCode"
                  @keyup.enter="joinRoom"
                />
                <button 
                  @click="joinRoom"
                  :disabled="!isValidRoomCode || isJoiningRoom"
                  class="btn btn-primary px-6 flex items-center"
                >
                  <Icon 
                    :name="isJoiningRoom ? 'spinner' : 'arrow-right'" 
                    :class="['w-5 h-5', { 'animate-spin': isJoiningRoom }]" 
                  />
                </button>
              </div>
              
              <!-- 提示信息 -->
              <div class="text-sm text-gray-500 space-y-1">
                <p class="flex items-center">
                  <Icon name="wifi" class="w-4 h-4 mr-1 text-green-500" />
                  同一WiFi: 低延迟，速度快
                </p>
                <p class="flex items-center">
                  <Icon name="globe" class="w-4 h-4 mr-1 text-blue-500" />
                  跨网络: 支持任意网络环境
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 游戏统计 -->
        <GameStats v-if="gameStats" :stats="gameStats" />
      </div>
    </main>

    <!-- 底部信息 -->
    <footer class="text-center py-6 text-sm text-gray-500">
      <p>
        基于WebRTC技术，支持P2P直连 • 
        <a href="https://github.com/your-repo" target="_blank" class="text-primary-600 hover:text-primary-700">
          开源项目
        </a>
      </p>
    </footer>
    
    <!-- 设置面板 -->
    <SettingsPanel
      v-if="showSettings"
      @close="showSettings = false"
      @save="handleSettingsSave"
    />
    
    <!-- 玩家名称设置弹窗 -->
    <div v-if="showPlayerSettings" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showPlayerSettings = false">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <!-- 标题栏 -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">修改玩家名称</h2>
          <button
            @click="showPlayerSettings = false"
            class="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Icon name="x" class="w-5 h-5" />
          </button>
        </div>
        
        <!-- 内容 -->
        <div class="p-6">
          <PlayerNameSettings
            :current-name="playerName"
            @save="handlePlayerNameSave"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面元数据
definePageMeta({
  title: '游戏大厅',
  description: '选择游戏模式开始斗地主游戏'
})

// 状态管理
const gameStore = useGameStore()
const roomStore = useRoomStore()
const networkStore = useNetworkStore()

// 响应式数据
const roomCodeInput = ref('')
const isCreatingRoom = ref(false)
const isJoiningRoom = ref(false)
const createdRoomCode = ref('')
const showSettings = ref(false)
const showPlayerSettings = ref(false)

// 计算属性
const isValidRoomCode = computed(() => {
  return roomCodeInput.value.length === 6 && /^[A-Z0-9]{6}$/.test(roomCodeInput.value)
})

const gameStats = computed(() => {
  return gameStore.playerStats
})

const playerName = computed(() => {
  return gameStore.playerName
})

const isDev = computed(() => {
  return process.dev
})

// 方法
const startAIGame = async (difficulty: 'easy' | 'normal' | 'hard') => {
  try {
    await gameStore.startAIGame(difficulty)
    await navigateTo('/game')
  } catch (error) {
    console.error('启动AI游戏失败:', error)
    gameStore.showNotification({
      type: 'error',
      title: '启动失败',
      message: '无法启动AI游戏，请重试'
    })
  }
}

const createRoom = async () => {
  if (isCreatingRoom.value) return
  
  isCreatingRoom.value = true
  
  try {
    const roomCode = await roomStore.createRoom()
    createdRoomCode.value = roomCode
    
    gameStore.showNotification({
      type: 'success',
      title: '房间创建成功',
      message: `房间码: ${roomCode}`
    })
    
    // 导航到房间页面
    await navigateTo(`/room/${roomCode}`)
  } catch (error) {
    console.error('创建房间失败:', error)
    gameStore.showNotification({
      type: 'error',
      title: '创建失败',
      message: '无法创建房间，请检查网络连接'
    })
  } finally {
    isCreatingRoom.value = false
  }
}

const joinRoom = async () => {
  if (!isValidRoomCode.value || isJoiningRoom.value) return
  
  isJoiningRoom.value = true
  
  try {
    await roomStore.joinRoom(roomCodeInput.value)
    await navigateTo(`/room/${roomCodeInput.value}`)
  } catch (error) {
    console.error('加入房间失败:', error)
    gameStore.showNotification({
      type: 'error',
      title: '加入失败',
      message: '房间不存在或已满员，请检查房间码'
    })
  } finally {
    isJoiningRoom.value = false
  }
}

const formatRoomCode = (event: Event) => {
  const target = event.target as HTMLInputElement
  target.value = target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  roomCodeInput.value = target.value
}

const getInitials = (name: string): string => {
  if (!name) return '?'
  
  // 处理中文和英文
  const cleanName = name.trim()
  if (/^[\u4e00-\u9fa5]/.test(cleanName)) {
    // 中文取最后一个字符
    return cleanName.charAt(cleanName.length - 1)
  } else {
    // 英文取首字母
    return cleanName.charAt(0).toUpperCase()
  }
}

const getAvatarColor = (name: string): string => {
  if (!name) return '#6b7280'
  
  // 基于名称生成稳定的颜色
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff8a80 0%, #ea6100 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
  ]
  
  return colors[Math.abs(hash) % colors.length]
}

const handlePlayerNameSave = (newName: string) => {
  showPlayerSettings.value = false
  console.log('玩家名称已保存:', newName)
}

const handleSettingsSave = (settings: any) => {
  console.log('设置已保存:', settings)
}

const showDeviceInfo = async () => {
  try {
    const { getDeviceInfo } = await import('~/utils/deviceId')
    const deviceInfo = await getDeviceInfo()
    
    gameStore.showNotification({
      type: 'info',
      title: '设备信息',
      message: `设备ID: ${deviceInfo.deviceId}`,
      duration: 5000
    })
    
    console.log('设备信息:', deviceInfo)
  } catch (error) {
    console.error('获取设备信息失败:', error)
  }
}

const copyRoomCode = async (roomCode: string) => {
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

const shareRoomLink = async (roomCode: string) => {
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
    // 降级到复制链接
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
onMounted(() => {
  // TODO: 继续未完成对局功能待完善
  // if (gameStore.hasUnfinishedGame) {
  //   gameStore.showNotification({
  //     type: 'info',
  //     title: '检测到未完成的游戏',
  //     message: '点击继续游戏可恢复之前的进度',
  //     actions: [
  //       {
  //         label: '继续游戏',
  //         action: () => navigateTo('/game')
  //       },
  //       {
  //         label: '开始新游戏',
  //         action: () => gameStore.clearUnfinishedGame()
  //       }
  //     ]
  //   })
  // }
})

// SEO
useSeoMeta({
  title: '斗地主网游 - 游戏大厅',
  description: '选择AI对战或创建房间与朋友联机，享受经典斗地主游戏',
  keywords: '斗地主,在线游戏,AI对战,朋友联机'
})
</script>
