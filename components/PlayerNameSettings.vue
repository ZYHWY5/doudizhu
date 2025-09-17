<template>
  <div class="player-name-settings">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        玩家名称
      </label>
      <div class="relative">
        <input
          v-model="tempName"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          :class="{
            'border-red-500': validationError,
            'border-green-500': isValid && tempName !== currentName
          }"
          placeholder="输入您的名称"
          maxlength="12"
          @input="validateInput"
          @keydown.enter="saveName"
        />
        
        <!-- 字符计数 -->
        <div class="absolute right-3 top-2 text-xs text-gray-400">
          {{ tempName.length }}/12
        </div>
      </div>
      
      <!-- 验证错误提示 -->
      <div v-if="validationError" class="mt-1 text-sm text-red-600">
        {{ validationError }}
      </div>
      
      <!-- 成功提示 -->
      <div v-else-if="isValid && tempName !== currentName" class="mt-1 text-sm text-green-600">
        名称可用
      </div>
      
      <!-- 使用提示 -->
      <div class="mt-2 text-xs text-gray-500">
        <p>• 2-12个字符</p>
        <p>• 不能包含特殊字符</p>
        <p>• 不能使用敏感词汇</p>
      </div>
    </div>
    
    <!-- 预览区域 -->
    <div class="mb-4 p-3 bg-gray-50 rounded-lg">
      <div class="text-sm font-medium text-gray-700 mb-2">预览</div>
      <div class="flex items-center space-x-3">
        <!-- 头像预览 -->
        <div 
          class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
          :style="{ background: getAvatarColor(tempName || currentName) }"
        >
          {{ getInitials(tempName || currentName) }}
        </div>
        
        <!-- 名称预览 -->
        <div>
          <div class="font-medium text-gray-900">
            {{ tempName || currentName }}
          </div>
          <div class="text-xs text-gray-500">
            这就是其他玩家看到的名称
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="flex space-x-3">
      <button
        @click="saveName"
        :disabled="!canSave"
        :class="[
          'flex-1 py-2 px-4 rounded-lg font-medium transition-colors',
          canSave
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        ]"
      >
        <Icon name="check" class="w-4 h-4 mr-2" />
        保存名称
      </button>
      
      <button
        @click="resetName"
        :disabled="tempName === currentName"
        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon name="arrow-left" class="w-4 h-4" />
      </button>
    </div>
    
    <!-- 历史名称 -->
    <div v-if="nameHistory.length > 0" class="mt-6">
      <div class="text-sm font-medium text-gray-700 mb-2">最近使用的名称</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="name in nameHistory"
          :key="name"
          @click="tempName = name"
          class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
        >
          {{ name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentName: string
}

interface Emits {
  (e: 'save', name: string): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const gameStore = useGameStore()

// 响应式数据
const tempName = ref(props.currentName)
const validationError = ref('')
const isValid = ref(true)

// 名称历史记录
const nameHistory = computed(() => {
  if (!process.client) return []
  
  try {
    const history = localStorage.getItem('playerNameHistory')
    const names = history ? JSON.parse(history) : []
    return names.filter((name: string) => name !== props.currentName).slice(0, 5)
  } catch {
    return []
  }
})

// 计算属性
const canSave = computed(() => {
  return isValid.value && tempName.value.trim() !== '' && tempName.value !== props.currentName
})

// 方法
const validateInput = () => {
  const validation = gameStore.validatePlayerName(tempName.value)
  isValid.value = validation.isValid
  validationError.value = validation.error || ''
}

const saveName = () => {
  if (!canSave.value) return
  
  const success = gameStore.updatePlayerName(tempName.value.trim())
  if (success) {
    // 保存到历史记录
    saveToHistory(tempName.value.trim())
    emit('save', tempName.value.trim())
  }
}

const resetName = () => {
  tempName.value = props.currentName
  validateInput()
}

const saveToHistory = (name: string) => {
  if (!process.client) return
  
  try {
    const history = localStorage.getItem('playerNameHistory')
    let names = history ? JSON.parse(history) : []
    
    // 移除重复项并添加到开头
    names = names.filter((n: string) => n !== name)
    names.unshift(name)
    
    // 最多保存10个历史记录
    names = names.slice(0, 10)
    
    localStorage.setItem('playerNameHistory', JSON.stringify(names))
  } catch (error) {
    console.error('保存名称历史失败:', error)
  }
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

// 监听当前名称变化
watch(() => props.currentName, (newName) => {
  tempName.value = newName
  validateInput()
})

// 初始验证
onMounted(() => {
  validateInput()
})
</script>

<style scoped>
.player-name-settings {
  @apply max-w-md mx-auto;
}
</style>
