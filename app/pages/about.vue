<script setup lang="ts">
import { FileCheck, Lock, ShieldCheck } from '@lucide/vue'

useHead({ title: 'ระบบทำงานอย่างไร' })

const SECTIONS = [
  {
    icon: FileCheck,
    title: 'ข้อมูลใดอยู่บน Blockchain',
    points: [
      'เหตุการณ์สำคัญที่ต้องรับรองร่วมกัน: ออกใบรับรอง ส่งมอบ ระงับ คืนสถานะ และเพิกถอน',
      'Hash ของข้อมูลผ้าและหลักฐาน ไม่ใช่ตัวไฟล์หรือข้อมูลส่วนบุคคล',
      'ลำดับ Block, Previous Hash, Nonce และลายเซ็น Ed25519 ของ Validator',
    ],
  },
  {
    icon: Lock,
    title: 'ข้อมูลใดอยู่นอก Blockchain',
    points: [
      'ข้อมูลส่วนบุคคลของช่างทอ เช่น ชื่อเต็ม ที่อยู่ และเบอร์โทร',
      'ไฟล์รูปภาพและเอกสารหลักฐานฉบับเต็ม (เก็บบนเครื่องแม่ข่าย)',
      'บันทึกภายในของเจ้าหน้าที่และรายละเอียด Workflow ที่ยังไม่ถูกรับรอง',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'ข้อจำกัดที่ควรทราบ',
    points: [
      'ใบรับรองยืนยัน Digital Record และกระบวนการรับรองที่บันทึกไว้ ไม่ใช่การตรวจคุณภาพทางกายภาพแบบ Real-time',
      'Blockchain ในระบบนี้เป็น Local Simulation เพื่อการศึกษา ไม่ใช่เครือข่ายกระจายศูนย์จริง',
      'การตรวจสอบเป็น Read-only ไม่สร้าง Blockchain Transaction ใหม่',
    ],
  },
]
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6">
    <h1 class="text-2xl font-bold text-neutral-900">ระบบทำงานอย่างไร</h1>
    <p class="mt-2 text-sm leading-relaxed text-neutral-600">
      ระบบแยกข้อมูลออกเป็นสองส่วน — ข้อมูลที่ต้องรับรองร่วมกันจะถูกบันทึกลง Ledger
      แบบแก้ย้อนหลังไม่ได้ ส่วนข้อมูลส่วนบุคคลและไฟล์ขนาดใหญ่เก็บไว้นอก Chain
    </p>

    <div class="mt-10 space-y-6">
      <section
        v-for="section in SECTIONS"
        :key="section.title"
        class="rounded-xl border border-neutral-200 bg-white p-6"
      >
        <div class="flex items-center gap-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <component :is="section.icon" class="size-5" aria-hidden="true" />
          </span>
          <h2 class="font-semibold text-neutral-900">
            {{ section.title }}
          </h2>
        </div>
        <ul class="mt-4 space-y-2.5">
          <li
            v-for="point in section.points"
            :key="point"
            class="flex gap-2.5 text-sm leading-relaxed text-neutral-600"
          >
            <span class="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
            {{ point }}
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
