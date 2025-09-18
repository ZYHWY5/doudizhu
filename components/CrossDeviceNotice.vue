<template>
  <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md shadow-lg">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">
            演示版本限制
          </h3>
          <div class="mt-2 text-sm text-yellow-700">
            <p>当前为演示版本，跨设备实时通信功能受限。</p>
            <p class="mt-1">
              <strong>建议:</strong> 在同一设备上打开多个浏览器标签页进行测试。
            </p>
          </div>
          <div class="mt-3">
            <button 
              @click="dismiss"
              class="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  dismiss: []
}>()

const dismiss = () => {
  emit('dismiss')
}
</script>
