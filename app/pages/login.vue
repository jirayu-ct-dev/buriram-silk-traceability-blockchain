<script setup lang="ts">
import { markRaw, type Component } from 'vue'
import { ArrowLeft, ClipboardCheck, Spool, Store } from '@lucide/vue'
import type { DashboardRole } from '~/composables/useDashboardNav'

definePageMeta({ layout: false })

useHead({ title: 'เข้าสู่ระบบ' })

const { signIn: apiSignIn } = useAuthSession()

const ACTORS: { role: DashboardRole, label: string, description: string, icon: Component }[] = [
  {
    role: 'WEAVER',
    label: 'ช่างทอ',
    description: 'ลงทะเบียนผ้าไหม แนบหลักฐาน และติดตามผลการตรวจ',
    icon: markRaw(Spool),
  },
  {
    role: 'COOPERATIVE_OFFICER',
    label: 'เจ้าหน้าที่สหกรณ์',
    description: 'ตรวจคำขอ อนุมัติ และจัดการใบรับรอง',
    icon: markRaw(ClipboardCheck),
  },
  {
    role: 'STORE_USER',
    label: 'ร้านค้า',
    description: 'ยืนยันการรับส่งมอบและดูแลสินค้าที่รับผิดชอบ',
    icon: markRaw(Store),
  },
]

const pending = ref<DashboardRole | null>(null)

const DEMO_EMAILS: Record<DashboardRole, string> = {
  WEAVER: 'weaver1@example.com',
  COOPERATIVE_OFFICER: 'officer1@example.com',
  STORE_USER: 'store1@example.com',
}

const signIn = async (next: DashboardRole) => {
  if (pending.value) return
  pending.value = next
  try {
    const email = DEMO_EMAILS[next]
    const user = await apiSignIn({
      username: email,
      password: 'password',
    })
    await navigateTo(useAuthSession().homeFor(user.role))
  } catch (error) {
    console.error('Login failed:', error)
    const toast = useToast()
    toast.add({
      title: 'เข้าสู่ระบบไม่สำเร็จ',
      description: 'กรุณาตรวจสอบว่ามีข้อมูลผู้ใช้งานในระบบหรือรัน seed หรือยัง',
      color: 'error',
    })
  } finally {
    pending.value = null
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-neutral-50">
    <main class="flex flex-1 items-center justify-center px-4 py-10">
      <div class="w-full max-w-sm">
        <div class="mb-8 flex flex-col items-center gap-3 text-center">
          <NuxtLink
            to="/"
            class="flex items-center gap-2.5 rounded-md py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span class="flex size-10 items-center justify-center rounded-lg bg-primary-100 text-base font-bold text-primary-700">
              ไหม
            </span>
          </NuxtLink>
          <div>
            <h1 class="text-xl font-semibold text-neutral-900">เข้าสู่ระบบ</h1>
            <p class="mt-1 text-sm text-neutral-600">เลือกบทบาทเพื่อเข้าสู่ระบบ</p>
          </div>
        </div>

        <ul class="space-y-3">
          <li v-for="actor in ACTORS" :key="actor.role">
            <button
              type="button"
              class="flex w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="pending !== null"
              @click="signIn(actor.role)"
            >
              <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <component :is="actor.icon" class="size-5" aria-hidden="true" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-neutral-900">{{ actor.label }}</span>
                <span class="mt-0.5 block text-xs leading-relaxed text-neutral-500">{{ actor.description }}</span>
              </span>
            </button>
          </li>
        </ul>

        <p class="mt-4 text-center text-xs text-neutral-500">
          โหมดตัวอย่าง — เข้าสู่ระบบในบทบาทที่เลือกทันที ระบบยืนยันตัวตนจริงจะเปิดใช้งานใน Phase Auth/RBAC
        </p>

        <NuxtLink
          to="/"
          class="mt-6 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ArrowLeft class="size-4" aria-hidden="true" />
          กลับหน้าแรก
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
