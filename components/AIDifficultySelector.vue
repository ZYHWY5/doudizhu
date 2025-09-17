<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button
        v-for="difficulty in difficulties"
        :key="difficulty.level"
        @click="selectDifficulty(difficulty.level)"
        :class="[
          'p-4 rounded-lg border-2 transition-all duration-200 text-left',
          selectedDifficulty === difficulty.level
            ? 'border-primary-500 bg-primary-50 shadow-md'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        ]"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-gray-900">
            {{ difficulty.name }}
          </h3>
          <Icon :name="difficulty.icon" class="w-5 h-5 text-gray-600" />
        </div>
        
        <p class="text-sm text-gray-600 mb-3">
          {{ difficulty.description }}
        </p>
        
        <!-- 难度指示器 -->
        <div class="flex items-center space-x-1">
          <span class="text-xs text-gray-500">难度:</span>
          <div class="flex space-x-1">
            <div 
              v-for="i in 5" 
              :key="i"
              :class="[
                'w-2 h-2 rounded-full',
                i <= difficulty.stars 
                  ? difficulty.color 
                  : 'bg-gray-200'
              ]"
            ></div>
          </div>
        </div>
        
        <!-- 特性标签 -->
        <div class="flex flex-wrap gap-1 mt-2">
          <span 
            v-for="feature in difficulty.features"
            :key="feature"
            class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
          >
            {{ feature }}
          </span>
        </div>
      </button>
    </div>
    
    <!-- 开始游戏按钮 -->
    <div class="text-center pt-2">
      <button
        @click="startGame"
        :disabled="!selectedDifficulty || isStarting"
        class="btn btn-primary btn-lg px-8"
      >
        <Icon 
          :name="isStarting ? 'spinner' : 'play'" 
          :class="['w-5 h-5 mr-2', { 'animate-spin': isStarting }]" 
        />
        {{ isStarting ? '启动中...' : '开始游戏' }}
      </button>
    </div>
    
    <!-- 选中难度的详细信息 -->
    <div v-if="selectedDifficultyInfo" class="bg-gray-50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 mb-2 flex items-center">
        <Icon :name="selectedDifficultyInfo.icon" class="w-4 h-4 mr-2" />
        {{ selectedDifficultyInfo.name }} 难度详情
      </h4>
      
      <div class="space-y-2 text-sm text-gray-600">
        <div class="flex justify-between">
          <span>AI反应速度:</span>
          <span>{{ selectedDifficultyInfo.reactionTime }}</span>
        </div>
        <div class="flex justify-between">
          <span>策略复杂度:</span>
          <span>{{ selectedDifficultyInfo.strategy }}</span>
        </div>
        <div class="flex justify-between">
          <span>记牌能力:</span>
          <span>{{ selectedDifficultyInfo.memory }}</span>
        </div>
        <div class="flex justify-between">
          <span>胜率预期:</span>
          <span>{{ selectedDifficultyInfo.winRate }}</span>
        </div>
      </div>
      
      <!-- 推荐说明 -->
      <div class="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
        <p class="text-sm text-blue-700">
          <Icon name="info" class="w-4 h-4 inline mr-1" />
          {{ selectedDifficultyInfo.recommendation }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Difficulty {
  level: 'easy' | 'normal' | 'hard'
  name: string
  description: string
  icon: string
  stars: number
  color: string
  features: string[]
  reactionTime: string
  strategy: string
  memory: string
  winRate: string
  recommendation: string
}

interface Emits {
  (e: 'start-game', difficulty: 'easy' | 'normal' | 'hard'): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const selectedDifficulty = ref<'easy' | 'normal' | 'hard' | null>(null)
const isStarting = ref(false)

// 难度配置
const difficulties: Difficulty[] = [
  {
    level: 'easy',
    name: '简单',
    description: '适合新手玩家，AI会犯一些小错误',
    icon: 'user',
    stars: 2,
    color: 'bg-green-500',
    features: ['基础策略', '反应较慢', '偶有失误'],
    reactionTime: '2-4秒',
    strategy: '基础',
    memory: '一般',
    winRate: '玩家胜率 70%+',
    recommendation: '推荐给刚接触斗地主的新手玩家，可以轻松上手'
  },
  {
    level: 'normal',
    name: '普通',
    description: '平衡的AI对手，提供有挑战性的游戏体验',
    icon: 'users',
    stars: 3,
    color: 'bg-blue-500',
    features: ['平衡策略', '正常反应', '偶尔配合'],
    reactionTime: '1-2秒',
    strategy: '中等',
    memory: '良好',
    winRate: '玩家胜率 50%',
    recommendation: '适合有一定经验的玩家，提供公平的对战体验'
  },
  {
    level: 'hard',
    name: '困难',
    description: '高智能AI，会使用高级策略和完美配合',
    icon: 'robot',
    stars: 5,
    color: 'bg-red-500',
    features: ['高级策略', '快速反应', '完美配合', '记牌精准'],
    reactionTime: '0.5-1秒',
    strategy: '高级',
    memory: '完美',
    winRate: '玩家胜率 30%',
    recommendation: '挑战高手玩家，AI会使用最优策略，需要很强的技巧才能获胜'
  }
]

// 计算属性
const selectedDifficultyInfo = computed(() => {
  return difficulties.find(d => d.level === selectedDifficulty.value) || null
})

// 方法
const selectDifficulty = (level: 'easy' | 'normal' | 'hard') => {
  selectedDifficulty.value = level
}

const startGame = async () => {
  if (!selectedDifficulty.value || isStarting.value) return
  
  isStarting.value = true
  
  try {
    // 延迟一下，让用户看到加载状态
    await new Promise(resolve => setTimeout(resolve, 500))
    
    emit('start-game', selectedDifficulty.value)
  } catch (error) {
    console.error('启动游戏失败:', error)
  } finally {
    isStarting.value = false
  }
}

// 默认选择普通难度
onMounted(() => {
  selectedDifficulty.value = 'normal'
})
</script>

<style scoped>
/* 选中状态的动画 */
.selected-difficulty {
  transform: scale(1.02);
}

/* 难度星级动画 */
.difficulty-stars {
  transition: all 0.3s ease;
}

/* 按钮悬停效果 */
.difficulty-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 特性标签动画 */
.feature-tag {
  transition: all 0.2s ease;
}

.feature-tag:hover {
  transform: scale(1.05);
}
</style>
