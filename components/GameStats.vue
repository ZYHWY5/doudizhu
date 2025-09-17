<template>
  <div v-if="stats" class="card">
    <div class="card-header">
      <h2 class="text-lg font-semibold text-gray-800 flex items-center">
        <Icon name="chart-bar" class="w-5 h-5 mr-2" />
        游戏统计
      </h2>
    </div>
    <div class="card-body">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div class="stat-item">
          <div class="text-2xl font-bold text-primary-600">
            {{ stats.totalGames || 0 }}
          </div>
          <div class="text-sm text-gray-600">总局数</div>
        </div>
        
        <div class="stat-item">
          <div class="text-2xl font-bold text-green-600">
            {{ stats.wins || 0 }}
          </div>
          <div class="text-sm text-gray-600">胜利</div>
        </div>
        
        <div class="stat-item">
          <div class="text-2xl font-bold text-blue-600">
            {{ stats.winRate || 0 }}%
          </div>
          <div class="text-sm text-gray-600">胜率</div>
        </div>
        
        <div class="stat-item">
          <div class="text-2xl font-bold text-purple-600">
            {{ stats.totalScore || 0 }}
          </div>
          <div class="text-sm text-gray-600">总积分</div>
        </div>
      </div>
      
      <div v-if="stats.lastPlayed" class="mt-4 text-center text-sm text-gray-500">
        上次游戏: {{ formatLastPlayed(stats.lastPlayed) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  stats: {
    totalGames: number
    wins: number
    winRate: number
    totalScore: number
    lastPlayed?: number
  } | null
}

defineProps<Props>()

const formatLastPlayed = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}
</script>

<style scoped>
.stat-item {
  @apply p-3 bg-gray-50 rounded-lg;
}
</style>
