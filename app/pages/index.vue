<script setup lang="ts">
import { ArrowRight, Blocks, ClipboardCheck, QrCode } from '@lucide/vue'

useHead({ title: 'หน้าแรก' })

const STEPS = [
  {
    icon: ClipboardCheck,
    title: 'ลงทะเบียนและรับรอง',
    description: 'ช่างทอลงทะเบียนผ้าไหมพร้อมหลักฐาน และสหกรณ์ตรวจรับรองแหล่งที่มา',
  },
  {
    icon: Blocks,
    title: 'บันทึกลง Blockchain',
    description: 'เหตุการณ์สำคัญถูกบันทึกเป็น Block ที่เชื่อมกันด้วย Hash และลายเซ็นของ Validator',
  },
  {
    icon: QrCode,
    title: 'สแกน QR เพื่อตรวจสอบ',
    description: 'ผู้บริโภคสแกน QR บนผืนผ้าเพื่อดูใบรับรอง ประวัติการส่งมอบ และผลตรวจ Chain',
  },
]
</script>

<template>
  <div>
    <section class="flex min-h-hero w-full items-center justify-center px-4 py-10 sm:px-6 tall:py-16">
      <div class="mx-auto w-full max-w-6xl text-center">
        <p class="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800">
          <span class="size-1.5 rounded-full bg-primary-500" aria-hidden="true" />
          Consortium Blockchain · Proof of Authority (Simulation)
        </p>
        <h1 class="mt-5 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl tall:mt-6">
          ตรวจสอบแหล่งที่มาของ
          <span class="whitespace-nowrap text-primary-700">ผ้าไหมทอมือบุรีรัมย์</span>
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg tall:mt-5">
          ระบบรับรองผ้าไหมรายผืน ติดตามการส่งมอบจากช่างทอสู่ร้านค้า
          และยืนยันความถูกต้องของประวัติด้วย Hash Chain ที่แก้ไขย้อนหลังไม่ได้
        </p>
        <div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row tall:mt-8">
          <NuxtLink
            to="/verify"
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto"
          >
            ตรวจสอบใบรับรอง
            <ArrowRight class="size-4" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink
            to="/ledger"
            class="inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto"
          >
            ดู Blockchain Explorer
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="border-t border-neutral-200 bg-neutral-50">
      <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 class="text-center text-xl font-semibold text-neutral-900 sm:text-2xl">
          ระบบทำงานอย่างไร
        </h2>
        <ol class="mt-10 grid gap-6 md:grid-cols-3">
          <li
            v-for="(step, index) in STEPS"
            :key="step.title"
            class="rounded-xl border border-neutral-200 bg-white p-6"
          >
            <div class="flex items-center gap-3">
              <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <component :is="step.icon" class="size-5" aria-hidden="true" />
              </span>
              <span class="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                ขั้นตอนที่ {{ index + 1 }}
              </span>
            </div>
            <h3 class="mt-4 font-semibold text-neutral-900">
              {{ step.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-neutral-600">
              {{ step.description }}
            </p>
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>
