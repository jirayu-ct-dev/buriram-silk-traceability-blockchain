<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, Eye, EyeOff, ClipboardCheck, Spool, Store } from '@lucide/vue'
import { markRaw, type Component } from 'vue'
import type { DashboardRole } from '~/composables/useDashboardNav'
import { useAuthSession } from '~/composables/useAuthSession'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: false })

useHead({ title: 'เข้าสู่ระบบ' })

const { signIn, homeFor } = useAuthSession()
const toast = useToast()

const DEMO_PASSWORD = 'password'

const ACTORS: { role: DashboardRole, label: string, description: string, icon: Component, demoEmail: string }[] = [
  {
    role: 'WEAVER',
    label: 'ช่างทอ',
    description: 'ลงทะเบียนผ้าไหม แนบหลักฐาน และติดตามผลการตรวจ',
    icon: markRaw(Spool),
    demoEmail: 'weaver1@example.com',
  },
  {
    role: 'COOPERATIVE_OFFICER',
    label: 'เจ้าหน้าที่สหกรณ์',
    description: 'ตรวจคำขอ อนุมัติ และจัดการใบรับรอง',
    icon: markRaw(ClipboardCheck),
    demoEmail: 'officer1@example.com',
  },
  {
    role: 'STORE_USER',
    label: 'ร้านค้า',
    description: 'ยืนยันการรับส่งมอบและดูแลสินค้าที่รับผิดชอบ',
    icon: markRaw(Store),
    demoEmail: 'store1@example.com',
  },
]

const form = ref({
  username: '',
  password: '',
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const showPassword = ref(false)

const validateForm = () => {
  errors.value = {}
  if (!form.value.username.trim()) {
    errors.value.username = 'กรุณากรอกชื่อผู้ใช้'
  }
  if (!form.value.password) {
    errors.value.password = 'กรุณากรอกรหัสผ่าน'
  }
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    const user = await signIn({ username: form.value.username.trim(), password: form.value.password })
    toast.success('เข้าสู่ระบบสำเร็จ')
    await navigateTo(homeFor(user.role))
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } }
    const message = err.data?.message ?? 'อีเมลหรือรหัสผ่านไม่ถูกต่อง'
    errors.value.form = message
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}

const handleDemoLogin = async (actor: typeof ACTORS[number]) => {
  form.value.username = actor.demoEmail
  form.value.password = DEMO_PASSWORD
  await handleSubmit()
}

const getInputValue = (event: Event): string => {
  const target = event.target as HTMLInputElement
  return target?.value ?? ''
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
            <p class="mt-1 text-sm text-neutral-600">กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบ</p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4" novalidate>
          <div>
            <label for="username" class="block text-sm font-medium text-neutral-700">ชื่อผู้ใช้</label>
            <input
              id="username"
              v-model="form.username"
              @input="form.username = getInputValue($event); errors.form && delete errors.form"
              type="text"
              autocomplete="username"
              placeholder="เช่น weaver1@example.com"
              class="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-neutral-100 transition-colors"
              :class="{ 'border-error-500': errors.username || errors.form, 'border-neutral-300': !errors.username && !errors.form }"
              :aria-invalid="(errors.username || errors.form) ? 'true' : 'false'"
              :aria-describedby="errors.username ? 'username-error' : (errors.form ? 'form-error' : undefined)"
              :disabled="isSubmitting"
              required
            />
            <p v-if="errors.username" id="username-error" class="mt-1.5 text-xs leading-relaxed text-error-700" role="alert">
              {{ errors.username }}
            </p>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-neutral-700">รหัสผ่าน</label>
            <div class="relative mt-1.5">
              <input
                id="password"
                v-model="form.password"
                @input="form.password = getInputValue($event); errors.form && delete errors.form"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="รหัสผ่าน"
                class="w-full rounded-lg border px-3 py-2.5 pr-12 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-neutral-100 transition-colors"
                :class="{ 'border-error-500': errors.password || errors.form, 'border-neutral-300': !errors.password && !errors.form }"
                :aria-invalid="(errors.password || errors.form) ? 'true' : 'false'"
                :aria-describedby="errors.password ? 'password-error' : (errors.form ? 'form-error' : undefined)"
                :disabled="isSubmitting"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded text-neutral-400 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="แสดง/ซ่อนรหัสผ่าน"
              >
                <component :is="showPassword ? EyeOff : Eye" class="size-5" aria-hidden="true" />
              </button>
            </div>
            <p v-if="errors.password" id="password-error" class="mt-1.5 text-xs leading-relaxed text-error-700" role="alert">
              {{ errors.password }}
            </p>
            <p v-if="errors.form" id="form-error" class="mt-1.5 text-xs leading-relaxed text-error-700" role="alert">
              {{ errors.form }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isSubmitting" class="flex items-center gap-2">
              <svg class="animate-spin size-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              กำลังเข้าสู่ระบบ...
            </span>
            <span v-else>เข้าสู่ระบบ</span>
          </button>
        </form>

        <div class="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
          <p class="text-xs font-medium text-neutral-700 mb-3">บัญชีตัวอย่าง (Demo Accounts) — คลิกเพื่อเข้าสู่ระบบทันที:</p>
          <ul class="space-y-2">
            <li v-for="actor in ACTORS" :key="actor.role">
              <button type="button" class="flex w-full items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-left text-xs text-neutral-600 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" @click="handleDemoLogin(actor)">
                <span class="flex size-6 shrink-0 items-center justify-center rounded bg-primary-100 text-primary-700">
                  <component :is="actor.icon" class="size-3.5" aria-hidden="true" />
                </span>
                <span class="font-medium text-neutral-900">{{ actor.label }}</span>
                <span class="text-neutral-400">|</span>
                <code class="flex-1 bg-neutral-100 px-2 py-0.5 rounded text-neutral-700 font-mono">{{ actor.demoEmail }}</code>
                <span class="text-neutral-400">/</span>
                <code class="bg-neutral-100 px-2 py-0.5 rounded text-neutral-700 font-mono">password</code>
              </button>
            </li>
          </ul>
          <p class="mt-2 text-[11px] text-neutral-500">หรือกรอกอีเมลและรหัสผ่านด้วยตัวเองด้านบน</p>
        </div>

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
