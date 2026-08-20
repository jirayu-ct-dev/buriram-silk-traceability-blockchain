<script setup lang="ts">
import { Lock } from '@lucide/vue'

useHead({ title: 'นโยบายความเป็นส่วนตัว' })
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
    <div class="text-center">
      <span class="inline-flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
        <Lock class="size-6" aria-hidden="true" />
      </span>
      <h1 class="mt-4 text-2xl font-bold text-neutral-900">นโยบายความเป็นส่วนตัว</h1>
      <p class="mt-2 text-sm leading-relaxed text-neutral-600">
        วัตถุประสงค์ของการเก็บข้อมูล ประเภทข้อมูลที่ใช้ และช่องทางการใช้สิทธิของเจ้าของข้อมูล
      </p>
    </div>

    <!-- TODO(privacy): เนื้อหานโยบายฉบับเต็มตาม PDPA จะเขียนใน Phase Certification -->
    <div class="mt-10 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
      <p class="text-sm font-medium text-neutral-700">เนื้อหาอยู่ระหว่างจัดทำ</p>
      <p class="mt-1 text-xs text-neutral-500">
        ประกาศความเป็นส่วนตัวฉบับเต็มจะเผยแพร่พร้อม Phase Certification
      </p>
    </div>
  </div>
</template>
