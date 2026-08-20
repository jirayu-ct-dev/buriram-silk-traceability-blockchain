<script setup lang="ts">
// TODO(auth): ดึง role จาก session หลัง implement Phase Auth/RBAC
// แล้ว redirect ไปหน้า login เมื่อไม่มี session
const role = useDemoRole()
const sidebarCollapsed = useSidebarCollapsed()

const { navFor } = useDashboardNav()
const navItems = computed(() => (role.value ? navFor(role.value) : []))

const drawerOpen = ref(false)

watch(drawerOpen, (open) => {
  if (import.meta.client) {
    document.documentElement.style.overflow = open ? 'hidden' : ''
  }
})

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && drawerOpen.value) {
    drawerOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.documentElement.style.overflow = ''
})

const route = useRoute()
watch(
  () => route.path,
  () => {
    drawerOpen.value = false
  },
)
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <button
      v-if="drawerOpen"
      type="button"
      class="fixed inset-0 z-40 bg-black/40 lg:hidden"
      aria-label="ปิดเมนู"
      @click="drawerOpen = false"
    />

    <UiAppSidebar :items="navItems" :open="drawerOpen" @close="drawerOpen = false" />

    <div
      class="flex min-h-screen flex-col transition-[padding] duration-200 ease-in-out"
      :class="sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'"
    >
      <UiAppHeader @open-drawer="drawerOpen = true" />
      <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
