<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">🔍 URL解析诊断工具</h1>
      
      <div class="space-y-6">
        <!-- 当前URL信息 -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold">当前URL信息</h2>
          </div>
          <div class="card-body">
            <div class="space-y-2 font-mono text-sm">
              <p><strong>完整URL:</strong> {{ currentUrl }}</p>
              <p><strong>Hash:</strong> {{ currentHash }}</p>
              <p><strong>Search:</strong> {{ currentSearch }}</p>
              <p><strong>Pathname:</strong> {{ currentPathname }}</p>
            </div>
          </div>
        </div>

        <!-- URL解析结果 -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold">URL解析结果</h2>
          </div>
          <div class="card-body">
            <div v-if="parseResult" class="space-y-2">
              <p><strong>房间码:</strong> {{ parseResult.roomCode }}</p>
              <p><strong>房主ID:</strong> {{ parseResult.hostInfo.hostPeerId }}</p>
              <p><strong>房主名称:</strong> {{ parseResult.hostInfo.hostName }}</p>
              <p><strong>时间戳:</strong> {{ parseResult.hostInfo.timestamp }}</p>
            </div>
            <div v-else class="text-red-500">
              ❌ 无法解析URL中的房间信息
            </div>
          </div>
        </div>

        <!-- 正则匹配测试 -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold">正则匹配测试</h2>
          </div>
          <div class="card-body">
            <div class="space-y-2">
              <p><strong>路径匹配:</strong> {{ pathMatch ? `✅ ${pathMatch[1]}` : '❌ 未匹配' }}</p>
              <p><strong>查询匹配:</strong> {{ queryMatch ? `✅ ${queryMatch[1]}` : '❌ 未匹配' }}</p>
            </div>
          </div>
        </div>

        <!-- 测试链接生成 -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold">测试链接生成</h2>
          </div>
          <div class="card-body">
            <button @click="generateTestLink" class="btn btn-primary mb-4">
              生成测试链接
            </button>
            <div v-if="testLink" class="space-y-2">
              <p><strong>生成的链接:</strong></p>
              <div class="bg-gray-100 p-2 rounded font-mono text-sm break-all">
                {{ testLink }}
              </div>
              <button @click="copyTestLink" class="btn btn-secondary btn-sm">
                复制链接
              </button>
            </div>
          </div>
        </div>

        <!-- 手动测试 -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold">手动测试</h2>
          </div>
          <div class="card-body">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">测试URL:</label>
                <input 
                  v-model="manualUrl"
                  type="text" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://zyhwy5.github.io/doudizhu/#/room/ABC123?join=ABC123&host=xxx&name=xxx&t=xxx"
                />
              </div>
              <button @click="parseManualUrl" class="btn btn-primary">
                解析测试URL
              </button>
              <div v-if="manualParseResult" class="mt-4">
                <h3 class="font-semibold mb-2">解析结果:</h3>
                <pre class="bg-gray-100 p-3 rounded text-sm">{{ JSON.stringify(manualParseResult, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 静态导入
import { parseRoomFromUrl, generateRoomLink } from '~/utils/simpleSignaling'

// 响应式数据
const currentUrl = ref('')
const currentHash = ref('')
const currentSearch = ref('')
const currentPathname = ref('')
const parseResult = ref<any>(null)
const pathMatch = ref<RegExpMatchArray | null>(null)
const queryMatch = ref<RegExpMatchArray | null>(null)
const testLink = ref('')
const manualUrl = ref('')
const manualParseResult = ref<any>(null)

// 页面挂载时获取URL信息
onMounted(async () => {
  // 获取当前URL信息
  currentUrl.value = window.location.href
  currentHash.value = window.location.hash
  currentSearch.value = window.location.search
  currentPathname.value = window.location.pathname

  // 测试URL解析
  try {
    parseResult.value = parseRoomFromUrl()
  } catch (error) {
    console.error('解析失败:', error)
  }

  // 测试正则匹配
  const hash = window.location.hash
  pathMatch.value = hash.match(/\/room\/([A-Z0-9]{6})/)
  queryMatch.value = hash.match(/\?(.+)$/)
})

// 生成测试链接
const generateTestLink = async () => {
  try {
    const roomInfo = {
      roomCode: 'TEST01',
      hostPeerId: 'test-host-123',
      hostName: '测试房主',
      timestamp: Date.now()
    }
    testLink.value = generateRoomLink(roomInfo)
  } catch (error) {
    console.error('生成测试链接失败:', error)
  }
}

// 复制测试链接
const copyTestLink = async () => {
  try {
    await navigator.clipboard.writeText(testLink.value)
    alert('链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败')
  }
}

// 解析手动输入的URL
const parseManualUrl = () => {
  try {
    const url = new URL(manualUrl.value)
    const hash = url.hash
    
    // 模拟parseRoomFromUrl的逻辑
    const pathMatch = hash.match(/\/room\/([A-Z0-9]{6})/)
    if (!pathMatch) {
      manualParseResult.value = { error: '未匹配到房间码路径' }
      return
    }
    
    const roomCode = pathMatch[1]
    const queryMatch = hash.match(/\?(.+)$/)
    if (!queryMatch) {
      manualParseResult.value = { error: '未找到查询参数' }
      return
    }
    
    const params = new URLSearchParams(queryMatch[1])
    const hostPeerId = params.get('host')
    const hostName = params.get('name')
    const timestamp = params.get('t')
    
    manualParseResult.value = {
      roomCode,
      hostPeerId,
      hostName,
      timestamp,
      success: !!(hostPeerId && hostName && timestamp)
    }
  } catch (error) {
    manualParseResult.value = { error: error instanceof Error ? error.message : String(error) }
  }
}

// SEO
useSeoMeta({
  title: 'URL解析诊断工具',
  description: '调试房间分享链接的URL解析问题',
  robots: 'noindex, nofollow'
})
</script>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow p-6;
}

.card-header {
  @apply border-b pb-4 mb-4;
}

.card-body {
  @apply space-y-4;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.btn-secondary {
  @apply bg-gray-500 text-white hover:bg-gray-600;
}

.btn-sm {
  @apply px-3 py-1 text-sm;
}
</style>
