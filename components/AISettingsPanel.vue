<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">🤖 AI设置</h3>
        <button 
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-6">
        <!-- AI难度设置 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">AI难度</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="difficulty in difficulties"
              :key="difficulty.value"
              @click="selectedDifficulty = difficulty.value"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedDifficulty === difficulty.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              {{ difficulty.label }}
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            {{ getDifficultyDescription(selectedDifficulty) }}
          </p>
        </div>

        <!-- API密钥设置 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-gray-700">
              Groq API密钥 (可选)
            </label>
            <button
              @click="showApiInfo = !showApiInfo"
              class="text-blue-500 hover:text-blue-600 text-xs"
            >
              {{ showApiInfo ? '隐藏' : '说明' }}
            </button>
          </div>
          
          <div v-if="showApiInfo" class="bg-blue-50 p-3 rounded-lg mb-3 text-sm">
            <p class="text-blue-800 mb-2">
              <strong>🌟 智能AI功能</strong>
            </p>
            <ul class="text-blue-700 space-y-1 text-xs">
              <li>• 免费获取: <a href="https://console.groq.com" target="_blank" class="underline">console.groq.com</a></li>
              <li>• 每天14,400次免费请求</li>
              <li>• 提供更智能的策略决策</li>
              <li>• 不设置则使用本地规则AI</li>
            </ul>
          </div>

          <div class="relative">
            <input
              v-model="apiKey"
              :type="showApiKey ? 'text' : 'password'"
              placeholder="输入Groq API密钥 (gsk-...)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              @click="showApiKey = !showApiKey"
              class="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
            >
              <svg v-if="showApiKey" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l-.637-.637m5.321 5.321l1.414 1.414m-1.414-1.414l-.637-.637m-.637-.637l-2.828-2.828m0 0L8.464 8.464m5.657 5.657L12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="aiStatus" class="mt-2 text-xs" :class="aiStatus.type === 'success' ? 'text-green-600' : 'text-red-600'">
            {{ aiStatus.message }}
          </div>
        </div>

        <!-- AI请求统计 -->
        <div v-if="requestStats.total > 0" class="bg-gray-50 p-3 rounded-lg">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">今日AI请求</span>
            <div class="flex items-center space-x-2">
              <span class="font-medium">{{ requestStats.used }} / {{ requestStats.total }}</span>
              <button
                @click="refreshUsageStats"
                class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="刷新本地使用统计"
                :disabled="refreshing"
              >
                <Icon 
                  name="arrow-path" 
                  :class="['w-3 h-3', refreshing ? 'animate-spin' : '']"
                />
              </button>
            </div>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              class="bg-blue-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(requestStats.used / requestStats.total) * 100}%` }"
            ></div>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            剩余 {{ requestStats.remaining }} 次请求
            <span v-if="lastRefresh" class="ml-2">
              ({{ formatLastRefresh(lastRefresh) }})
            </span>
          </p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-3 mt-8">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          取消
        </button>
        <button
          @click="saveSettings"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          保存设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Difficulty {
  value: 'easy' | 'medium' | 'hard' | 'expert'
  label: string
  description: string
}

const emit = defineEmits<{
  close: []
  save: [settings: { difficulty: string; apiKey: string }]
}>()

// 难度选项
const difficulties: Difficulty[] = [
  { value: 'easy', label: '简单', description: '适合新手，AI会犯一些错误' },
  { value: 'medium', label: '中等', description: '平衡的游戏体验' },
  { value: 'hard', label: '困难', description: '有挑战性，AI策略更好' },
  { value: 'expert', label: '专家', description: '最强AI，需要高超技巧' }
]

// 响应式数据
const selectedDifficulty = ref<'easy' | 'medium' | 'hard' | 'expert'>('medium')
const apiKey = ref('')
const showApiKey = ref(false)
const showApiInfo = ref(false)
const aiStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// 请求统计
const requestStats = ref({
  used: 0,
  total: 14400,
  remaining: 14400
})

const refreshing = ref(false)
const lastRefresh = ref<Date | null>(null)

// 获取当前设置
onMounted(async () => {
  const gameStore = useGameStore()
  selectedDifficulty.value = gameStore.getAIDifficulty()
  
  // 从localStorage读取API密钥
  if (process.client) {
    const savedApiKey = localStorage.getItem('groq_api_key')
    if (savedApiKey) {
      apiKey.value = savedApiKey
    }
    
    // 获取请求统计
    updateRequestStats()
  }
})

const getDifficultyDescription = (difficulty: string): string => {
  return difficulties.find(d => d.value === difficulty)?.description || ''
}

const updateRequestStats = async () => {
  try {
    // 获取本地计数统计（Groq API暂不支持使用统计端点）
    const { getAPIUsage } = await import('~/utils/aiAPI')
    const apiUsage = await getAPIUsage()
    
    if (apiUsage) {
      requestStats.value.used = apiUsage.used
      requestStats.value.total = apiUsage.limit
      requestStats.value.remaining = apiUsage.limit - apiUsage.used
      lastRefresh.value = new Date()
      console.log('📊 已更新本地使用统计:', apiUsage)
    } else {
      // 备用获取方式
      const { getAIService } = await import('~/utils/aiAPI')
      const aiService = getAIService()
      requestStats.value.used = aiService.getRequestCount()
      requestStats.value.remaining = aiService.getRemainingRequests()
      console.log('📊 使用备用方式获取统计')
    }
  } catch (error) {
    console.error('获取AI请求统计失败:', error)
  }
}

const refreshUsageStats = async () => {
  if (refreshing.value) return
  
  refreshing.value = true
  try {
    await updateRequestStats()
  } finally {
    refreshing.value = false
  }
}

const formatLastRefresh = (date: Date): string => {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diff < 60) return '刚刚更新'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  return `${Math.floor(diff / 3600)}小时前`
}

const testApiKey = async (key: string) => {
  if (!key) {
    aiStatus.value = null
    return
  }

  try {
    const { getAIService } = await import('~/utils/aiAPI')
    const aiService = getAIService()
    aiService.setApiKey(key)
    
    aiStatus.value = { type: 'success', message: '✅ API密钥格式正确' }
  } catch (error) {
    aiStatus.value = { type: 'error', message: '❌ API密钥无效' }
  }
}

// 监听API密钥变化
watch(apiKey, (newKey) => {
  testApiKey(newKey)
})

const saveSettings = async () => {
  const gameStore = useGameStore()
  
  // 保存AI难度
  gameStore.setAIDifficulty(selectedDifficulty.value)
  
  // 保存API密钥
  if (process.client) {
    if (apiKey.value) {
      localStorage.setItem('groq_api_key', apiKey.value)
      const { setAIApiKey } = await import('~/utils/aiAPI')
      setAIApiKey(apiKey.value)
    } else {
      localStorage.removeItem('groq_api_key')
    }
  }
  
  emit('save', {
    difficulty: selectedDifficulty.value,
    apiKey: apiKey.value
  })
  
  emit('close')
}
</script>
