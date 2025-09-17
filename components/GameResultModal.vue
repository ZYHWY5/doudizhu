<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-scale-in">
        <!-- 游戏结果标题 -->
        <div class="mb-6">
          <div :class="[
            'text-6xl mb-4',
            result.winnerId === currentUserId ? 'animate-bounce' : ''
          ]">
            {{ result.winnerId === currentUserId ? '🎉' : '😢' }}
          </div>
          
          <h2 :class="[
            'text-2xl font-bold mb-2',
            result.winnerId === currentUserId ? 'text-green-600' : 'text-red-600'
          ]">
            {{ result.winnerId === currentUserId ? '恭喜获胜！' : '游戏失败' }}
          </h2>
          
          <p class="text-gray-600">
            {{ result.isLandlordWin ? '地主获胜' : '农民获胜' }}
          </p>
        </div>
        
        <!-- 玩家得分 -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-800">最终得分</h3>
          
          <div class="space-y-3">
            <div
              v-for="score in result.finalScores"
              :key="score.playerId"
              :class="[
                'flex items-center justify-between p-3 rounded-lg',
                score.playerId === currentUserId ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
              ]"
            >
              <div class="flex items-center space-x-3">
                <!-- 玩家头像 -->
                <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {{ getInitials(score.playerName) }}
                </div>
                
                <div class="text-left">
                  <div class="font-medium text-gray-900">
                    {{ score.playerName }}
                    <span v-if="score.playerId === currentUserId" class="text-xs text-blue-600 ml-1">
                      (你)
                    </span>
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ score.isLandlord ? '地主' : '农民' }}
                  </div>
                </div>
              </div>
              
              <div :class="[
                'font-bold text-lg',
                score.score > 0 ? 'text-green-600' : score.score < 0 ? 'text-red-600' : 'text-gray-600'
              ]">
                {{ score.score > 0 ? '+' : '' }}{{ score.score }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 游戏统计 -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="text-center">
              <div class="font-semibold text-gray-900">游戏时长</div>
              <div class="text-gray-600">{{ formatDuration(result.gameDuration) }}</div>
            </div>
            <div class="text-center">
              <div class="font-semibold text-gray-900">结束时间</div>
              <div class="text-gray-600">{{ formatTime(result.gameEndTime) }}</div>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="space-y-3">
          <button
            @click="$emit('play-again')"
            class="btn btn-primary btn-lg w-full"
          >
            <Icon name="refresh" class="w-5 h-5 mr-2" />
            再来一局
          </button>
          
          <button
            @click="$emit('return-to-lobby')"
            class="btn btn-secondary w-full"
          >
            <Icon name="home" class="w-5 h-5 mr-2" />
            返回大厅
          </button>
        </div>
        
        <!-- 分享按钮 -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <button
            @click="shareResult"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Icon name="share" class="w-4 h-4 mr-1" />
            分享游戏结果
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { GameResult, Player } from '~/stores/game'

interface Props {
  result: GameResult
  players: Player[]
}

interface Emits {
  (e: 'play-again'): void
  (e: 'return-to-lobby'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 获取当前用户ID
const gameStore = useGameStore()
const currentUserId = computed(() => gameStore.playerId)

// 方法
const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase()
}

const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  }
  return `${remainingSeconds}秒`
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const shareResult = async () => {
  const text = `我在斗地主网游中${props.result.winnerId === currentUserId.value ? '获胜了' : '战败了'}！最终得分：${
    props.result.finalScores.find(s => s.playerId === currentUserId.value)?.score || 0
  }分`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: '斗地主游戏结果',
        text: text,
        url: window.location.origin
      })
    } catch (error) {
      // 用户取消分享
    }
  } else {
    try {
      await navigator.clipboard.writeText(text)
      gameStore.showNotification({
        type: 'success',
        title: '复制成功',
        message: '游戏结果已复制到剪贴板'
      })
    } catch (error) {
      console.error('复制失败:', error)
    }
  }
}

// 播放结果音效
onMounted(() => {
  if (props.result.winnerId === currentUserId.value) {
    // 播放胜利音效
    console.log('播放胜利音效')
  } else {
    // 播放失败音效
    console.log('播放失败音效')
  }
})
</script>

<style scoped>
.animate-scale-in {
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0, -30px, 0);
  }
  70% {
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
}
</style>
