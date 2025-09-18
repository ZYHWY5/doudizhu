<template>
  <div class="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
    <!-- 玩家信息 -->
    <div class="flex items-center space-x-3">
      <!-- 头像 -->
      <div class="relative">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
          {{ getInitials(player.name) }}
        </div>
        
        <!-- 房主标识 -->
        <div v-if="isHost" class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
          <Icon name="star" class="w-2.5 h-2.5 text-white" />
        </div>
        
        <!-- 在线状态 -->
        <div 
          :class="[
            'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
            player.isOnline ? 'bg-green-500' : 'bg-gray-400'
          ]"
        ></div>
      </div>
      
      <!-- 玩家名称和状态 -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2">
          <h3 class="font-medium text-gray-900 truncate">
            {{ player.name }}
          </h3>
          <span v-if="isCurrentUser" class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            你
          </span>
          <span v-if="isHost" class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
            房主
          </span>
        </div>
        
        <!-- 准备状态 -->
        <div class="flex items-center mt-1">
          <Icon 
            :name="player.isReady ? 'check-circle' : 'clock'" 
            :class="[
              'w-4 h-4 mr-1',
              player.isReady ? 'text-green-500' : 'text-yellow-500'
            ]"
          />
          <span :class="[
            'text-sm',
            player.isReady ? 'text-green-600' : 'text-yellow-600'
          ]">
            {{ player.isReady ? '已准备' : '准备中' }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div v-if="canKick" class="flex-shrink-0">
      <button
        @click="$emit('kick-player', player.id)"
        class="p-2 text-gray-400 hover:text-red-500 transition-colors"
        title="踢出玩家"
      >
        <Icon name="x" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// import type { RoomPlayer } from '~/stores/room' // 已移除联机功能

interface RoomPlayer {
  id: string
  name: string
  isReady: boolean
  isHost: boolean
  avatar?: string
}

interface Props {
  player: RoomPlayer
  isHost: boolean
  isCurrentUser: boolean
  canKick: boolean
}

interface Emits {
  (e: 'kick-player', playerId: string): void
}

defineProps<Props>()
defineEmits<Emits>()

// 获取玩家姓名首字母
const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase()
}
</script>
