<script setup lang="ts">
const appConfig = useAppConfig()

// แปลงสีทั้งหมดจาก app.config.ts เป็น CSS variables บน <html>
// เพื่อให้ token ของ Tailwind (main.css) อ้างอิงค่าจาก config จุดเดียว
const themeVars = computed(() =>
  Object.entries(appConfig.ui.colors)
    .flatMap(([name, shades]) =>
      Object.entries(shades).map(([shade, value]) => `--ui-${name}-${shade}: ${value};`),
    )
    .join(' '),
)

useHead({
  titleTemplate: (title) =>
    title ? `${title} · ผ้าไหมบุรีรัมย์` : 'ระบบตรวจสอบแหล่งที่มาผ้าไหมบุรีรัมย์',
  htmlAttrs: {
    style: themeVars,
  },
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- Feedback layer กลาง — mount ครั้งเดียวที่นี่ (brief Phase 1.1/1.2) -->
    <UiAppToast />
    <UiAppConfirmDialog />
  </div>
</template>
