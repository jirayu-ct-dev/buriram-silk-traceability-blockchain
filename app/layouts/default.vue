<script setup lang="ts">
import { Menu, X } from '@lucide/vue'

const route = useRoute()
const role = useDemoRole()
const mobileMenuOpen = ref(false)

watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false
  },
)

const NAV_LINKS = [
  { label: 'หน้าแรก', to: '/' },
  { label: 'ตรวจสอบใบรับรอง', to: '/verify' },
  { label: 'Blockchain Explorer', to: '/ledger' },
  { label: 'ระบบทำงานอย่างไร', to: '/about' },
]

const isActive = (to: string) =>
  to === '/' ? route.path === to : route.path.startsWith(to)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <header class="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <NuxtLink
          to="/"
          class="flex shrink-0 items-center gap-2.5 rounded-md py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span class="flex size-8 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">
            ไหม
          </span>
          <span class="hidden text-sm font-semibold text-neutral-900 sm:block">
            ระบบตรวจสอบแหล่งที่มาผ้าไหมบุรีรัมย์
          </span>
        </NuxtLink>

        <nav class="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="เมนูหลัก">
          <NuxtLink
            v-for="link in NAV_LINKS"
            :key="link.to"
            :to="link.to"
            class="rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            :class="
              isActive(link.to)
                ? 'bg-primary-50 text-primary-800'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            "
            :aria-current="isActive(link.to) ? 'page' : undefined"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <UiAppUserMenu v-if="role" />
          <NuxtLink
            v-else
            to="/login"
            class="inline-flex items-center rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            เข้าสู่ระบบ
          </NuxtLink>

          <button
            type="button"
            class="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
            :aria-expanded="mobileMenuOpen"
            aria-controls="public-mobile-menu"
            :aria-label="mobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <X v-if="mobileMenuOpen" class="size-5" aria-hidden="true" />
            <Menu v-else class="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <nav
        v-if="mobileMenuOpen"
        id="public-mobile-menu"
        class="border-t border-neutral-200 md:hidden"
        aria-label="เมนูหลัก"
      >
        <ul class="space-y-1 px-4 py-3">
          <li v-for="link in NAV_LINKS" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :class="
                isActive(link.to)
                  ? 'bg-primary-50 text-primary-800'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              "
              :aria-current="isActive(link.to) ? 'page' : undefined"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-neutral-200 bg-neutral-50">
      <div class="mx-auto flex max-w-6xl flex-col items-start gap-2 px-4 py-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>ระบบสาธิตเพื่อการศึกษา — Blockchain ทำงานแบบ Local Simulation</p>
        <p>โครงการวิชา Blockchain · ทีมพัฒนา 5 คน</p>
      </div>
    </footer>
  </div>
</template>
