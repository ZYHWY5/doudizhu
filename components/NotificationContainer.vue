<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full">
      <TransitionGroup
        name="notification"
        tag="div"
        class="space-y-3"
      >
        <NotificationCard
          v-for="notification in notifications"
          :key="notification.id"
          :notification="notification"
          @close="removeNotification"
          @action="handleNotificationAction"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// 获取通知状态
const gameStore = useGameStore()
const notifications = computed(() => gameStore.notifications)

// 方法
const removeNotification = (id: string) => {
  gameStore.removeNotification(id)
}

const handleNotificationAction = (action: () => void) => {
  action()
}
</script>

<style scoped>
/* 通知动画 */
.notification-enter-active {
  transition: all 0.3s ease-out;
}

.notification-leave-active {
  transition: all 0.3s ease-in;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
