<script setup lang="ts">
useHead({
  titleTemplate: (title) =>
    title ? `${title} · ผ้าไหมบุรีรัมย์` : 'ระบบตรวจสอบแหล่งที่มาผ้าไหมบุรีรัมย์',
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
