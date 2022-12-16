<template>
  <n-config-provider :theme="theme">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <NuxtLayout>
              <NuxtPage />
            </NuxtLayout>
          </n-dialog-provider>
        </n-notification-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>


<script setup lang="ts">
const theme = computed(() => undefined);
</script>
