<template>
  <Html lang="zh-CN">
    <Head>
      <Title>{{ pageTitle }}</Title>
    </Head>
    <Body>
      <div id="app" class="min-h-screen">
        <NuxtPage />
        
        <!-- 全局加载指示器 -->
        <LoadingSpinner v-if="isLoading" />
        
        <!-- 全局通知 -->
        <NotificationContainer />
        
        <!-- 确认对话框 -->
        <ConfirmDialog
          :show="gameStore.confirmDialog.show"
          :title="gameStore.confirmDialog.title"
          :message="gameStore.confirmDialog.message"
          :confirm-text="gameStore.confirmDialog.confirmText"
          :cancel-text="gameStore.confirmDialog.cancelText"
          @confirm="gameStore.handleConfirmDialogConfirm"
          @cancel="gameStore.handleConfirmDialogCancel"
        />
        
        <!-- 网络状态监控 -->
        <NetworkStatusBar />
      </div>
    </Body>
  </Html>
</template>

<script setup lang="ts">
// 全局状态
const { $router } = useNuxtApp()
const gameStore = useGameStore()
const networkStore = useNetworkStore()

// 页面标题
const pageTitle = computed(() => {
  const route = useRoute()
  const baseTitle = '斗地主网游'
  
  switch (route.name) {
    case 'index':
      return `${baseTitle} - 游戏大厅`
    case 'room-code':
      return `${baseTitle} - 房间 ${route.params.code}`
    case 'game':
      return `${baseTitle} - 游戏中`
    default:
      return baseTitle
  }
})

// 全局加载状态
const isLoading = computed(() => {
  return gameStore.isLoading || networkStore.isConnecting
})

// 页面生命周期
onMounted(() => {
  // 初始化应用
  initializeApp()
})

onBeforeUnmount(() => {
  // 清理资源
  cleanupApp()
})

// 初始化应用
const initializeApp = async () => {
  try {
    // 检测设备能力
    await gameStore.detectDeviceCapability()
    
    // 初始化设备ID和玩家信息
    await gameStore.initializePlayer()
    
    // 初始化音效系统
    await gameStore.initializeAudio()
    
    // TODO: 继续未完成对局功能待完善
    // await gameStore.restoreGameState()
    
    console.log('应用初始化完成')
  } catch (error) {
    console.error('应用初始化失败:', error)
  }
}

// 清理应用
const cleanupApp = () => {
  // 断开网络连接
  networkStore.disconnect()
  
  // TODO: 继续未完成对局功能待完善
  // gameStore.saveGameState()
  
  // 清理音效
  gameStore.cleanupAudio()
}

// 监听路由变化
watch(() => $router.currentRoute.value, (to, from) => {
  // 页面切换时的逻辑
  if (from?.name === 'game' && to?.name !== 'game') {
    // 离开游戏页面时保存状态
    gameStore.pauseGame()
  }
})

// 监听网络状态变化
watch(() => networkStore.status, (status) => {
  if (status === 'disconnected') {
    // 网络断开时的处理
    gameStore.handleNetworkDisconnection()
  } else if (status === 'connected') {
    // 网络重连时的处理
    gameStore.handleNetworkReconnection()
  }
})

// 监听页面可见性变化（使用浏览器原生API）
onMounted(() => {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 页面隐藏时暂停游戏
      if (gameStore.isInGame) {
        gameStore.pauseGame()
      }
    } else {
      // 页面显示时恢复游戏
      if (gameStore.isPaused) {
        gameStore.resumeGame()
      }
    }
  })
})

// 全局错误处理
const handleGlobalError = (error: Error) => {
  console.error('全局错误:', error)
  
  // 显示用户友好的错误信息
  gameStore.showNotification({
    type: 'error',
    title: '发生错误',
    message: '游戏遇到了一些问题，请刷新页面重试',
    duration: 5000
  })
}

// 注册全局错误处理器
if (process.client) {
  window.addEventListener('error', (event) => {
    handleGlobalError(event.error)
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    handleGlobalError(new Error(event.reason))
  })
}
</script>

<style>
/* 全局样式已在 main.css 中定义 */
</style>
