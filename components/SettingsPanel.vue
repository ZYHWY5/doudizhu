<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900 flex items-center">
          <Icon name="settings" class="w-6 h-6 mr-2" />
          游戏设置
        </h2>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Icon name="x" class="w-5 h-5" />
        </button>
      </div>
      
      <!-- 内容区域 -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        <div class="space-y-8">
          
          <!-- 玩家信息设置 -->
          <div class="section">
            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Icon name="user" class="w-5 h-5 mr-2" />
              玩家信息
            </h3>
            <PlayerNameSettings
              :current-name="playerName"
              @save="handleNameSave"
            />
          </div>
          
          <!-- 游戏设置 -->
          <div class="section">
            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Icon name="play" class="w-5 h-5 mr-2" />
              游戏设置
            </h3>
            
            <div class="space-y-4">
              <!-- 音效设置 -->
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-700">音效</label>
                  <p class="text-xs text-gray-500">开启游戏音效和背景音乐</p>
                </div>
                <button
                  @click="toggleSound"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
              
              <!-- 动画设置 -->
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-700">动画效果</label>
                  <p class="text-xs text-gray-500">开启卡牌和界面动画</p>
                </div>
                <button
                  @click="toggleAnimation"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    settings.animationEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      settings.animationEnabled ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
              
              <!-- 卡牌提示 -->
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-sm font-medium text-gray-700">卡牌提示</label>
                  <p class="text-xs text-gray-500">显示可出牌的提示</p>
                </div>
                <button
                  @click="toggleCardHints"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    settings.showCardHints ? 'bg-blue-600' : 'bg-gray-200'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      settings.showCardHints ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
              
              <!-- 自动托管时间 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  自动托管时间 ({{ settings.autoPlayTimeout }}秒)
                </label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  v-model="settings.autoPlayTimeout"
                  @change="updateSettings"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>15秒</span>
                  <span>60秒</span>
                  <span>120秒</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 统计信息 -->
          <div v-if="playerStats" class="section">
            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Icon name="chart-bar" class="w-5 h-5 mr-2" />
              游戏统计
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-gray-50 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-blue-600">{{ playerStats.totalGames || 0 }}</div>
                <div class="text-sm text-gray-600">总场次</div>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-green-600">{{ playerStats.wins || 0 }}</div>
                <div class="text-sm text-gray-600">胜利</div>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-orange-600">
                  {{ playerStats.totalGames > 0 ? Math.round((playerStats.wins || 0) / playerStats.totalGames * 100) : 0 }}%
                </div>
                <div class="text-sm text-gray-600">胜率</div>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-purple-600">{{ playerStats.landlordWins || 0 }}</div>
                <div class="text-sm text-gray-600">地主胜利</div>
              </div>
            </div>
          </div>
          
          <!-- 关于信息 -->
          <div class="section">
            <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Icon name="info" class="w-5 h-5 mr-2" />
              关于游戏
            </h3>
            
            <div class="space-y-3 text-sm text-gray-600">
              <div class="flex justify-between">
                <span>版本</span>
                <span class="font-mono">v1.0.0</span>
              </div>
              <div class="flex justify-between">
                <span>更新时间</span>
                <span>2024-12-19</span>
              </div>
              <div class="flex justify-between">
                <span>设备类型</span>
                <span class="capitalize">{{ deviceInfo.type }}</span>
              </div>
              <div class="flex justify-between">
                <span>性能评分</span>
                <span>{{ deviceInfo.performanceScore }}/10</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      <!-- 底部按钮 -->
      <div class="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
        <button
          @click="resetToDefaults"
          class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          恢复默认
        </button>
        <button
          @click="saveAndClose"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          保存设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Emits {
  (e: 'close'): void
  (e: 'save', settings: any): void
}

const emit = defineEmits<Emits>()
const gameStore = useGameStore()

// 响应式数据
const playerName = computed(() => gameStore.playerName)
const settings = reactive({ ...gameStore.settings })
const deviceInfo = computed(() => gameStore.deviceInfo)
const playerStats = computed(() => gameStore.playerStats)

// 方法
const handleNameSave = (newName: string) => {
  console.log('名称已保存:', newName)
}

const toggleSound = () => {
  settings.soundEnabled = !settings.soundEnabled
  updateSettings()
}

const toggleAnimation = () => {
  settings.animationEnabled = !settings.animationEnabled
  updateSettings()
}

const toggleCardHints = () => {
  settings.showCardHints = !settings.showCardHints
  updateSettings()
}

const updateSettings = () => {
  gameStore.updateSettings(settings)
}

const resetToDefaults = () => {
  const defaults = {
    soundEnabled: true,
    animationEnabled: true,
    autoPlayTimeout: 45,
    showCardHints: true,
    theme: 'default'
  }
  
  Object.assign(settings, defaults)
  updateSettings()
  
  gameStore.showNotification({
    type: 'success',
    title: '设置已重置',
    message: '所有设置已恢复为默认值'
  })
}

const saveAndClose = () => {
  emit('save', settings)
  emit('close')
  
  gameStore.showNotification({
    type: 'success',
    title: '设置已保存',
    message: '您的设置已成功保存'
  })
}

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.section {
  @apply pb-6 border-b border-gray-100 last:border-b-0 last:pb-0;
}

/* 自定义滑块样式 */
.slider::-webkit-slider-thumb {
  @apply appearance-none w-5 h-5 bg-blue-600 rounded-full cursor-pointer;
}

.slider::-moz-range-thumb {
  @apply w-5 h-5 bg-blue-600 rounded-full cursor-pointer border-0;
}
</style>
