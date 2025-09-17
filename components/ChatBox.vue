<template>
  <div class="flex flex-col h-full">
    <!-- 消息列表 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="[
          'flex',
          message.playerId === currentUserId ? 'justify-end' : 'justify-start'
        ]"
      >
        <!-- 系统消息 -->
        <div v-if="message.type === 'system'" class="text-center w-full">
          <span class="inline-block px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
            {{ message.message }}
          </span>
        </div>
        
        <!-- 普通消息 -->
        <div v-else :class="[
          'max-w-xs lg:max-w-md px-3 py-2 rounded-lg',
          message.playerId === currentUserId
            ? 'bg-primary-500 text-white'
            : 'bg-white border border-gray-200'
        ]">
          <!-- 发送者名称 -->
          <div v-if="message.playerId !== currentUserId" class="text-xs text-gray-500 mb-1">
            {{ message.playerName }}
          </div>
          
          <!-- 消息内容 -->
          <div class="text-sm">
            {{ message.message }}
          </div>
          
          <!-- 时间戳 -->
          <div :class="[
            'text-xs mt-1',
            message.playerId === currentUserId ? 'text-primary-100' : 'text-gray-400'
          ]">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="messages.length === 0" class="text-center text-gray-500 py-8">
        <Icon name="chat" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p class="text-sm">暂无消息</p>
      </div>
    </div>
    
    <!-- 输入框 -->
    <div class="border-t border-gray-200 p-4">
      <form @submit.prevent="sendMessage" class="flex space-x-2">
        <input
          v-model="newMessage"
          type="text"
          placeholder="输入消息..."
          maxlength="200"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          :disabled="isSending"
        />
        <button
          type="submit"
          :disabled="!newMessage.trim() || isSending"
          class="btn btn-primary px-4"
        >
          <Icon 
            :name="isSending ? 'spinner' : 'send'" 
            :class="['w-4 h-4', { 'animate-spin': isSending }]"
          />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/stores/room'

interface Props {
  messages: ChatMessage[]
  currentUserId: string
}

interface Emits {
  (e: 'send-message', message: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const newMessage = ref('')
const isSending = ref(false)

// 发送消息
const sendMessage = async () => {
  const message = newMessage.value.trim()
  if (!message || isSending.value) return
  
  isSending.value = true
  
  try {
    await emit('send-message', message)
    newMessage.value = ''
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    isSending.value = false
  }
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  
  // 如果是今天的消息，只显示时间
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  // 否则显示月日和时间
  return date.toLocaleString('zh-CN', { 
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    const container = document.querySelector('.overflow-y-auto')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动
watch(() => props.messages.length, () => {
  scrollToBottom()
})

// 组件挂载后滚动到底部
onMounted(() => {
  scrollToBottom()
})
</script>
