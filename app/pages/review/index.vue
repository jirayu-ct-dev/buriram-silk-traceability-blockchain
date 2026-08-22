<script setup lang="ts">
import { ClipboardList, Search, Eye } from '@lucide/vue'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'คิวตรวจคำขอ' })

interface ReviewQueueItem {
  requestId: string
  silkItemPublicId: string
  revisionTitle: string
  submittedBy: string
  submittedAt: string
}

const searchQuery = ref('')
const isLoading = ref(true)
const error = ref<string | null>(null)
const items = ref<ReviewQueueItem[]>([])

const loadData = async () => {
  isLoading.value = true
  error.value = null
  try {
    items.value = await $fetch<ReviewQueueItem[]>('/api/reviews')
  } catch {
    error.value = 'โหลดคิวคำขอไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(i =>
    i.silkItemPublicId.toLowerCase().includes(q)
    || i.revisionTitle.toLowerCase().includes(q)
    || i.submittedBy.toLowerCase().includes(q),
  )
})

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden">
        <ClipboardList class="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 class="text-xl font-semibold text-neutral-900">คิวตรวจคำขอรับรอง</h1>
        <p class="text-sm text-neutral-600">คำขอที่รอการตรวจสอบจากเจ้าหน้าที่สหกรณ์</p>
      </div>
    </div>

    <div class="mt-6 flex gap-3">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="ค้นหา รหัสผ้า / ชื่อผืน / ผู้ส่ง"
          aria-label="ค้นหาคำขอ"
          class="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        />
      </div>
    </div>

    <div class="mt-6">
      <div v-if="isLoading" class="space-y-3">
        <UiSkeletonList :rows="5" />
      </div>
      <div v-else-if="error">
        <UiErrorState :description="error" retry-label="ลองใหม่" @retry="loadData" />
      </div>
      <div v-else-if="filtered.length === 0">
        <UiEmptyState
          v-if="searchQuery"
          title="ไม่พบผลลัพธ์"
          description="ลองค้นหาด้วยคำอื่น หรือล้างคำค้นหา"
          action-label="ล้างคำค้นหา"
          @action="searchQuery = ''"
        />
        <UiEmptyState
          v-else
          title="ยังไม่มีคำขอที่รอตรวจ"
          description="เมื่อช่างทอส่งคำขอรับรอง รายการจะปรากฏที่นี่"
        />
      </div>
      <div v-else class="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table class="w-full text-left text-sm">
          <thead class="bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr>
              <th class="px-4 py-3 whitespace-nowrap">รหัสผ้า</th>
              <th class="px-4 py-3">ชื่อผืน</th>
              <th class="px-4 py-3 whitespace-nowrap">ผู้ส่ง</th>
              <th class="px-4 py-3 whitespace-nowrap">วันที่ยื่น</th>
              <th class="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr v-for="row in filtered" :key="row.requestId" class="hover:bg-neutral-50">
              <td class="px-4 py-3 font-mono text-xs text-neutral-700 whitespace-nowrap">{{ row.silkItemPublicId }}</td>
              <td class="px-4 py-3 font-medium text-neutral-900 max-w-[220px] truncate">{{ row.revisionTitle }}</td>
              <td class="px-4 py-3 text-neutral-700 whitespace-nowrap">{{ row.submittedBy }}</td>
              <td class="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">{{ formatDate(row.submittedAt) }}</td>
              <td class="px-4 py-3 text-right">
                <NuxtLink
                  :to="`/review/${row.requestId}`"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Eye class="size-3.5" aria-hidden="true" />
                  ตรวจ
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
