<template>
  <div class="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
    <div class="flex items-center">
      <Icon name="check-circle" class="w-5 h-5 text-green-500 mr-2" />
      <h3 class="text-sm font-medium text-green-800">
        房间创建成功！
      </h3>
    </div>
    
    <div class="space-y-2">
      <div class="text-center">
        <div class="room-code text-green-800 bg-green-100">
          {{ roomCode }}
        </div>
      </div>
      
      <div class="flex space-x-2">
        <button
          @click="$emit('copy-code', roomCode)"
          class="btn btn-sm btn-success flex-1"
        >
          <Icon name="copy" class="w-4 h-4 mr-1" />
          复制房间码
        </button>
        
        <button
          @click="$emit('share-link', roomCode)"
          class="btn btn-sm btn-success flex-1"
        >
          <Icon name="share" class="w-4 h-4 mr-1" />
          分享链接
        </button>
      </div>
    </div>
    
    <p class="text-xs text-green-700 text-center">
      分享房间码给朋友，让他们加入游戏
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  roomCode: string
}

interface Emits {
  (e: 'copy-code', roomCode: string): void
  (e: 'share-link', roomCode: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
