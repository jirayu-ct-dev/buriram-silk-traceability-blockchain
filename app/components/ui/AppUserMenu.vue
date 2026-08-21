<script setup lang="ts">
import { ChevronDown, Home, LayoutDashboard, LogOut, User } from '@lucide/vue'

const { user, signOut, homeFor, signIn: apiSignIn } = useAuthSession()
const route = useRoute()

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

const switchRole = async (role: 'WEAVER' | 'COOPERATIVE_OFFICER' | 'STORE_USER') => {
  const DEMO_EMAILS = {
    WEAVER: 'weaver1@example.com',
    COOPERATIVE_OFFICER: 'officer1@example.com',
    STORE_USER: 'store1@example.com',
  }
  try {
    const newUser = await apiSignIn({
      username: DEMO_EMAILS[role],
      password: 'password',
    })
    open.value = false
    await navigateTo(homeFor(newUser.role))
  } catch (error) {
    console.error('Role switch failed:', error)
  }
}
</script>

<template>
  <div v-if="user" ref="rootRef" class="relative">
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
        <span class="block font-medium text-neutral-900">{{ user.displayName }}</span>
        <span class="block text-neutral-500 text-[10px]">{{ user.organizationName || (user.role === 'WEAVER' ? 'ช่างทอ' : user.role === 'COOPERATIVE_OFFICER' ? 'เจ้าหน้าที่สหกรณ์' : 'ร้านค้า') }}</span>
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
        :to="homeFor(user.role)"
        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="open = false"
      >
        <LayoutDashboard class="size-4 shrink-0" aria-hidden="true" />
        หน้า Dashboard
      </NuxtLink>

      <NuxtLink
        data-menu-item
        to="/"
        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="open = false"
      >
        <Home class="size-4 shrink-0" aria-hidden="true" />
        หน้าเว็บหลัก
      </NuxtLink>

      <!-- Demo role switching -->
      <div class="my-1.5 border-t border-neutral-200" />
      <div class="px-3 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
        สลับบทบาท (Demo)
      </div>

      <button
        v-if="user.role !== 'WEAVER'"
        data-menu-item
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer text-left"
        @click="switchRole('WEAVER')"
      >
        ช่างทอ
      </button>

      <button
        v-if="user.role !== 'COOPERATIVE_OFFICER'"
        data-menu-item
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer text-left"
        @click="switchRole('COOPERATIVE_OFFICER')"
      >
        เจ้าหน้าที่สหกรณ์
      </button>

      <button
        v-if="user.role !== 'STORE_USER'"
        data-menu-item
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer text-left"
        @click="switchRole('STORE_USER')"
      >
        ร้านค้า
      </button>

      <div class="my-1.5 border-t border-neutral-200" />

      <button
        data-menu-item
        type="button"
        class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer text-left"
        @click="signOut"
      >
        <LogOut class="size-4 shrink-0" aria-hidden="true" />
        ออกจากระบบ
      </button>
    </div>
  </div>
</template>
