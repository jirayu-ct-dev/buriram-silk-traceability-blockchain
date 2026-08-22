<script setup lang="ts">
import { LayoutDashboard, FilePlus2, Search, Filter } from '@lucide/vue'
import { ref, computed, markRaw } from 'vue'
import type { StatusTone } from '~/composables/useStatusMeta'
import type { SilkItemSummary } from '~~/shared/types/api'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'ภาพรวมช่างทอ' })

const silkItems = ref<SilkItemSummary[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const loadSilkItems = async () => {
  isLoading.value = true
  error.value = null
  try {
    const data = await $fetch<SilkItemSummary[]>('/api/silk-items')
    silkItems.value = data
  } catch {
    error.value = 'โหลดข้้อมูลผ้้าไหมไม่สำเร็จ กรุณาลองใหม่อีกครั้้ง'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadSilkItems)
const searchQuery = ref('')
const statusFilter = ref<'all' | 'DRAFT' | 'SUBMITTED' | 'CERTIFIED' | 'REJECTED'>('all')

const statusCards = [
  { status: 'DRAFT' as const, label: 'ฉบับร่าง', icon: FilePlus2, tone: 'neutral' as StatusTone },
  { status: 'SUBMITTED' as const, label: 'รอตรวจ', icon: Search, tone: 'warning' as StatusTone },
  { status: 'CERTIFIED' as const, label: 'ได้รับใบรับรอง', icon: markRaw(LayoutDashboard), tone: 'success' as StatusTone },
  { status: 'REJECTED' as const, label: 'ถูกปฏิเสธ', icon: Filter, tone: 'error' as StatusTone },
] as const

const toneBg: Record<StatusTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  warning: 'bg-warning-100 text-warning-700',
  success: 'bg-success-100 text-success-700',
  error: 'bg-error-100 text-error-700',
  info: 'bg-info-100 text-info-700',
}

const filteredItems = computed(() => {
  return silkItems.value.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.publicId.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'all' || item.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const getStatusCount = (status: SilkItemSummary['status']) =>
  silkItems.value.filter(item => item.status === status).length

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const navigateToDetail = (id: string) => {
  navigateTo(`/weaver/items/${id}`)
}

const handleCreateNew = () => {
  navigateTo('/weaver/items/new')
}
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden">
          <LayoutDashboard class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-xl font-semibold text-neutral-900">ภาพรวมช่างทอ</h1>
          <p class="text-sm text-neutral-600">สรุปรายการผ้าไหมแยกตามสถานะ</p>
        </div>
      </div>
      <button
        @click="handleCreateNew"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <FilePlus2 class="size-4" aria-hidden="true" />
        ลงทะเบียนผ้าไหมใหม่
      </button>
    </div>

    <!-- Status Summary Cards -->
    <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div
        v-for="card in statusCards"
        :key="card.status"
        class="rounded-xl border bg-white p-5 transition-colors hover:border-primary-300 hover:bg-primary-50/60 cursor-pointer"
        @click="statusFilter = statusFilter === card.status ? 'all' : card.status"
      >
        <div class="flex items-center gap-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-lg" :class="toneBg[card.tone]">
            <component :is="card.icon" class="size-5" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <p class="text-sm font-medium text-neutral-700 truncate">{{ card.label }}</p>
            <p class="text-2xl font-bold text-neutral-900">{{ getStatusCount(card.status) }}</p>
          </div>
        </div>
        <div class="mt-2 text-xs" :class="statusFilter === card.status ? 'text-primary-600' : 'text-neutral-500'">
          {{ statusFilter === card.status ? 'คลิกเพื่อล้างตัวกรอง' : 'คลิกเพื่อกรอง' }}
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="mt-6 flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" aria-hidden="true" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="ค้นหาจากชื่อผืนผ้า หรือรหัสผ้า..."
          class="w-full rounded-lg border border-neutral-300 pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          aria-label="ค้นหาผ้าไหม"
        />
      </div>
      <select
        v-model="statusFilter"
        class="w-full sm:w-48 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary bg-white"
      >
        <option value="all">ทุกสถานะ</option>
        <option value="DRAFT">ฉบับร่าง</option>
        <option value="SUBMITTED">รอตรวจ</option>
        <option value="CERTIFIED">ได้รับใบรับรอง</option>
        <option value="REJECTED">ถูกปฏิเสธ</option>
      </select>
    </div>

    <!-- Items List -->
    <div class="mt-6">
      <div v-if="isLoading" class="space-y-3">
        <UiSkeletonList :rows="5" />
      </div>
      <div v-else-if="error">
        <UiErrorState :description="error" retry-label="ลองใหม่" @retry="loadSilkItems" />
      </div>
      <div v-else-if="filteredItems.length === 0">
        <UiEmptyState
          title="ไม่พบรายการผ้าไหม"
          description="ลองค้นหาด้วยคำค้นหาอื่น หรือล้างตัวกรองสถานะ"
          actionLabel="ล้างตัวกรอง"
          @action="statusFilter = 'all'; searchQuery = ''"
        />
      </div>
      <div v-else class="divide-y divide-neutral-200">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 hover:bg-neutral-50 transition-colors cursor-pointer"
          @click="navigateToDetail(item.id)"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-medium text-neutral-900 truncate">{{ item.title }}</p>
              <code class="shrink-0 bg-neutral-100 px-2 py-0.5 rounded text-xs font-mono text-neutral-600">{{ item.publicId }}</code>
            </div>
            <p class="mt-1 text-xs text-neutral-500">อัปเดตล่าสุด {{ formatDate(item.updatedAt) }}</p>
          </div>
          <UiStatusBadge :status="item.status" />
        </div>
      </div>
    </div>
  </div>
</template>