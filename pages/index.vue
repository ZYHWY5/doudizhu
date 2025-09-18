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
        
        <!-- AI设置按钮 -->
        <button
          @click="showAISettings = true"
          class="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="AI设置"
        >
          <Icon name="brain" class="w-5 h-5 text-gray-600" />
        </button>
        
        <!-- 设置按钮 -->
        <button
          @click="showSettings = true"
          class="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="游戏设置"
        >
          <Icon name="settings" class="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      <h1 class="text-4xl md:text-6xl font-bold text-gray-800 mb-2">
        🎮 智能斗地主
      </h1>
      <p class="text-lg text-gray-600">
        AI智能对战，策略多样，随时随地享受斗地主乐趣
      </p>
    </header>

    <!-- 主要内容 -->
    <main class="flex-1 flex items-center justify-center px-4">
      <div class="w-full max-w-2xl space-y-8">
        
        <!-- 快速开始 -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white text-center">
          <h2 class="text-2xl font-bold mb-4">🚀 快速开始</h2>
          <p class="text-blue-100 mb-6">选择AI难度，立即开始游戏</p>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <button
              v-for="difficulty in difficulties"
              :key="difficulty.value"
              @click="quickStart(difficulty.value)"
              :class="[
                'py-3 px-4 rounded-lg font-medium transition-all duration-200',
                currentDifficulty === difficulty.value
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              ]"
            >
              <div class="text-sm">{{ difficulty.label }}</div>
              <div class="text-xs opacity-75">{{ difficulty.emoji }}</div>
            </button>
          </div>
          
          <button
            @click="startGame"
            :disabled="isStartingGame"
            class="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center mx-auto"
          >
            <Icon 
              :name="isStartingGame ? 'spinner' : 'play'" 
              :class="['w-6 h-6 mr-2', { 'animate-spin': isStartingGame }]" 
            />
            {{ isStartingGame ? '准备中...' : '开始游戏' }}
          </button>
        </div>

        <!-- AI设置预览 -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800 flex items-center">
              <Icon name="brain" class="w-5 h-5 mr-2 text-purple-500" />
              🤖 AI对手设置
            </h3>
            <button
              @click="showAISettings = true"
              class="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              详细设置 →
            </button>
          </div>
          
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-gray-600">当前难度</div>
              <div class="font-semibold text-gray-800 capitalize">
                {{ getDifficultyLabel(currentDifficulty) }}
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-gray-600">智能AI</div>
              <div class="font-semibold text-gray-800">
                {{ hasApiKey ? '已启用' : '未配置' }}
                <span :class="hasApiKey ? 'text-green-500' : 'text-gray-400'">
                  {{ hasApiKey ? '🟢' : '⚪' }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p class="font-medium mb-1">💡 提示</p>
            <p>配置Groq API密钥可获得更智能的AI对手，提供更具挑战性的游戏体验。</p>
          </div>
        </div>

        <!-- 游戏特色 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white rounded-lg shadow-md p-4 text-center">
            <div class="text-2xl mb-2">🎯</div>
            <h4 class="font-semibold text-gray-800 mb-1">智能AI</h4>
            <p class="text-sm text-gray-600">多种难度，策略丰富</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-4 text-center">
            <div class="text-2xl mb-2">⚡</div>
            <h4 class="font-semibold text-gray-800 mb-1">即时游戏</h4>
            <p class="text-sm text-gray-600">无需等待，立即开始</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-4 text-center">
            <div class="text-2xl mb-2">📱</div>
            <h4 class="font-semibold text-gray-800 mb-1">跨平台</h4>
            <p class="text-sm text-gray-600">手机电脑都能玩</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部信息 -->
    <footer class="text-center py-6 text-gray-500 text-sm">
      <p>🎮 享受纯粹的斗地主乐趣</p>
    </footer>

    <!-- 模态框 -->
    <PlayerNameSettings 
      v-if="showPlayerSettings"
      :current-name="playerName"
      @close="showPlayerSettings = false"
      @save="handlePlayerNameSave"
    />
    
    <SettingsPanel 
      v-if="showSettings"
      @close="showSettings = false"
      @save="handleSettingsSave"
    />
    
    <AISettingsPanel
      v-if="showAISettings"
      @close="showAISettings = false"
      @save="handleAISettingsSave"
    />
  </div>
</template>

<script setup lang="ts">
// 页面元数据
useHead({
  title: '斗地主单机版 - 智能AI对战',
  meta: [
    { name: 'description', content: '专业的斗地主单机游戏，配备智能AI对手，支持多种难度等级，随时随地享受斗地主乐趣。' }
  ]
})

// 响应式数据
const showPlayerSettings = ref(false)
const showSettings = ref(false)
const showAISettings = ref(false)
const isStartingGame = ref(false)
const currentDifficulty = ref<'easy' | 'medium' | 'hard' | 'expert'>('medium')
const hasApiKey = ref(false)

// 难度选项
const difficulties = [
  { value: 'easy', label: '简单', emoji: '😊' },
  { value: 'medium', label: '中等', emoji: '🙂' },
  { value: 'hard', label: '困难', emoji: '😤' },
  { value: 'expert', label: '专家', emoji: '🤯' }
] as const

// 游戏存储
const gameStore = useGameStore()

// 计算属性
const playerName = computed(() => gameStore.playerName)
const isDev = computed(() => process.dev)

// 生命周期
onMounted(async () => {
  // 初始化玩家
  await gameStore.initializePlayer()
  
  // 获取当前AI设置
  currentDifficulty.value = gameStore.getAIDifficulty()
  
  // 检查API密钥
  if (process.client) {
    hasApiKey.value = !!localStorage.getItem('groq_api_key')
  }
})

// 方法
const getInitials = (name: string): string => {
  return name.slice(0, 2).toUpperCase()
}

const getAvatarColor = (name: string): string => {
  const colors = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
    '#EF4444', '#6366F1', '#14B8A6', '#F97316'
  ]
  const index = name.length % colors.length
  return colors[index]
}

const getDifficultyLabel = (difficulty: string): string => {
  return difficulties.find(d => d.value === difficulty)?.label || '中等'
}

const quickStart = (difficulty: 'easy' | 'medium' | 'hard' | 'expert') => {
  currentDifficulty.value = difficulty
  gameStore.setAIDifficulty(difficulty)
}

const startGame = async () => {
  isStartingGame.value = true
  
  try {
    // 确保AI难度已设置
    gameStore.setAIDifficulty(currentDifficulty.value)
    
    // 开始AI游戏
    const difficulty = currentDifficulty.value === 'medium' ? 'normal' : 
                      currentDifficulty.value === 'expert' ? 'hard' : 
                      currentDifficulty.value
    await gameStore.startAIGame(difficulty as 'easy' | 'normal' | 'hard')
    
    // 跳转到游戏页面
    await navigateTo('/game')
  } catch (error) {
    console.error('开始游戏失败:', error)
    gameStore.showNotification({
      type: 'error',
      title: '开始失败',
      message: '无法开始游戏，请重试'
    })
  } finally {
    isStartingGame.value = false
  }
}

const handlePlayerNameSave = (newName: string) => {
  gameStore.updatePlayerName(newName)
  showPlayerSettings.value = false
}

const handleSettingsSave = (settings: any) => {
  // 处理游戏设置保存
  console.log('保存游戏设置:', settings)
  showSettings.value = false
}

const handleAISettingsSave = (settings: { difficulty: string; apiKey: string }) => {
  currentDifficulty.value = settings.difficulty as any
  hasApiKey.value = !!settings.apiKey
  showAISettings.value = false
  
  gameStore.showNotification({
    type: 'success',
    title: '设置已保存',
    message: 'AI设置已更新'
  })
}
</script>

<style scoped>
.card {
  @apply bg-white rounded-xl shadow-lg overflow-hidden;
}

.card-header {
  @apply px-6 py-4 bg-gray-50 border-b border-gray-200;
}

.card-body {
  @apply px-6 py-4;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg;
}

.btn-lg {
  @apply px-6 py-3 text-lg;
}
</style>
