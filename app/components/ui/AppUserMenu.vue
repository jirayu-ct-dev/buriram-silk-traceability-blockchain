<script setup lang="ts">
import { Check, ChevronDown, LayoutDashboard, LogOut, User } from '@lucide/vue'
import type { DashboardRole } from '~/composables/useDashboardNav'

const role = useDemoRole()
const { homeFor } = useDashboardNav()
const route = useRoute()

const ROLE_OPTIONS: { value: DashboardRole, label: string }[] = [
  { value: 'WEAVER', label: 'ช่างทอ' },
  { value: 'COOPERATIVE_OFFICER', label: 'เจ้าหน้าที่สหกรณ์' },
  { value: 'STORE_USER', label: 'ร้านค้า' },
]

const currentRoleLabel = computed(
  () => ROLE_OPTIONS.find(option => option.value === role.value)?.label ?? '',
)

const open = ref(false)
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const triggerRef = useTemplateRef<HTMLButtonElement>('triggerRef')

const toggle = () => {
  open.value = !open.value
  if (open.value) {
    nextTick(() => {
      rootRef.value?.querySelector<HTMLElement>('[data-menu-item]')?.focus()
    })
  }
}

const close = () => {
  open.value = false
  triggerRef.value?.focus()
}

const switchRole = async (next: DashboardRole) => {
  if (next === role.value) {
    close()
    return
  }
  role.value = next
  open.value = false
  // ถ้าอยู่ในพื้นที่ dashboard ให้พาไปหน้าหลักของบทบาทใหม่
  if (route.meta.layout === 'dashboard') {
    await navigateTo(homeFor(next))
  }
}

// TODO(auth): ออกจากระบบจริงหลัง implement Phase Auth/RBAC
const signOut = async () => {
  role.value = null
  open.value = false
  await navigateTo('/')
}

const onPointerDown = (event: PointerEvent) => {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && open.value) {
    close()
  }
}

watch(open, (isOpen) => {
  if (!import.meta.client) return
  if (isOpen) {
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeydown)
  }
  else {
    document.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('keydown', onKeydown)
})

watch(
  () => route.path,
  () => {
    open.value = false
  },
)
</script>

<template>
  <div v-if="role" ref="rootRef" class="relative">
    <button
      ref="triggerRef"
      type="button"
      class="flex items-center gap-2 cursor-pointer bg-white py-1 pl-1 pr-2.5 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :aria-expanded="open"
      aria-label="เมนูผู้ใช้"
      @click="toggle"
    >
      <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        <User class="size-4" aria-hidden="true" />
      </span>
      <span class="hidden text-left text-xs leading-tight sm:block">
        <span class="block font-medium text-neutral-900">ผู้ใช้ตัวอย่าง</span>
        <span class="block text-neutral-500">{{ currentRoleLabel }}</span>
      </span>
      <ChevronDown
        class="size-4 shrink-0 text-neutral-400 transition-transform"
        :class="open ? 'rotate-180' : ''"
        aria-hidden="true"
      />
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full z-40 mt-4 w-56 rounded-lg border border-neutral-200 bg-white py-1.5 shadow-lg"
    >
      <NuxtLink
        data-menu-item
        :to="homeFor(role)"
        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="open = false"
      >
        <LayoutDashboard class="size-4 shrink-0" aria-hidden="true" />
        หน้าหลัก
      </NuxtLink>

      <div class="my-1.5 border-t border-neutral-200" />

      <p class="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        สลับบทบาท
      </p>
      <button
        v-for="option in ROLE_OPTIONS"
        :key="option.value"
        data-menu-item
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="option.value === role ? 'font-medium text-primary-700' : 'text-neutral-700'"
        @click="switchRole(option.value)"
      >
        <Check v-if="option.value === role" class="size-4 shrink-0" aria-hidden="true" />
        <span v-else class="size-4 shrink-0" aria-hidden="true" />
        {{ option.label }}
      </button>

      <div class="my-1.5 border-t border-neutral-200" />

      <button
        data-menu-item
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="signOut"
      >
        <LogOut class="size-4 shrink-0" aria-hidden="true" />
        ออกจากระบบ
      </button>
    </div>
  </div>
</template>
