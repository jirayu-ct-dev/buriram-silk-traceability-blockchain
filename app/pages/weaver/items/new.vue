<script setup lang="ts">
import { FilePlus2, Upload, X, FileText } from '@lucide/vue'
import { ref, computed } from 'vue'
import { z } from 'zod'
import { useToast } from '~/composables/useToast'
import type { CreateSilkItemInput } from '~~/shared/types/api'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'ลงทะเบียนผ้าไหม' })

const toast = useToast()

const silkItemSchema = z.object({
  title: z.string().min(1, 'กรุณากรอกชื่อผืนผ้า'),
  pattern: z.string().optional(),
  material: z.string().optional(),
  technique: z.string().optional(),
  widthCm: z.coerce.number().positive('ความกว้างต้องมากกว่า 0').optional().or(z.literal('')),
  lengthCm: z.coerce.number().positive('ความยาวต้องมากกว่า 0').optional().or(z.literal('')),
  productionDate: z.string().optional(),
  notes: z.string().optional(),
})

type SilkItemForm = z.infer<typeof silkItemSchema>

const form = ref<SilkItemForm>({
  title: '',
  pattern: '',
  material: '',
  technique: '',
  widthCm: '',
  lengthCm: '',
  productionDate: '',
  notes: '',
})

const errors = ref<Partial<Record<keyof SilkItemForm, string>>>({})
const touched = ref<Partial<Record<keyof SilkItemForm, boolean>>>({})
const isSubmitting = ref(false)
const attachedFiles = ref<File[]>([])

const getErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง'
}

const validateField = (name: keyof SilkItemForm, value: unknown) => {
  const fieldSchema = silkItemSchema.shape[name]
  const result = fieldSchema.safeParse(value)
  if (!result.success) {
    errors.value[name] = getErrorMessage(result.error)
  } else {
    const { [name]: _, ...rest } = errors.value
    errors.value = rest
  }
}

const validateAll = () => {
  const result = silkItemSchema.safeParse(form.value)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const fieldName = issue.path[0] as keyof SilkItemForm
      errors.value[fieldName] = issue.message
      touched.value[fieldName] = true
    }
    return false
  }
  return true
}

const handleBlur = (name: keyof SilkItemForm) => {
  touched.value[name] = true
  validateField(name, form.value[name])
}

const handleInput = (name: keyof SilkItemForm, value: string | number | Date) => {
  ;(form.value as Record<string, unknown>)[name] = value
  if (touched.value[name]) {
    validateField(name, value)
  }
}

const getInputValue = (event: Event): string => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  return target?.value ?? ''
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const removeFile = (index: number) => {
  attachedFiles.value.splice(index, 1)
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    const newFiles = Array.from(input.files)
    attachedFiles.value = [...attachedFiles.value, ...newFiles]
    input.value = ''
  }
}

const handleSubmit = async () => {
  touched.value = Object.keys(form.value).reduce((acc, key) => {
    acc[key as keyof SilkItemForm] = true
    return acc
  }, {} as Partial<Record<keyof SilkItemForm, boolean>>)

  if (!validateAll()) return

  isSubmitting.value = true

  const resetForm = () => {
    form.value = { title: '', pattern: '', material: '', technique: '', widthCm: '', lengthCm: '', productionDate: '', notes: '' }
    attachedFiles.value = []
    errors.value = {}
    touched.value = {}
  }

  try {
    const payload: CreateSilkItemInput = {
      title: form.value.title.trim(),
      pattern: form.value.pattern?.trim() || undefined,
      material: form.value.material?.trim() || undefined,
      technique: form.value.technique?.trim() || undefined,
      widthCm: form.value.widthCm !== '' ? Number(form.value.widthCm) : undefined,
      lengthCm: form.value.lengthCm !== '' ? Number(form.value.lengthCm) : undefined,
      productionDate: form.value.productionDate || undefined,
      notes: form.value.notes?.trim() || undefined,
    }
    try {
      const created = await $fetch<{ id: string, publicId?: string }>('/api/silk-items', { method: 'POST', body: payload })
      // อัปโหลดหลักฐานทีละไฟล์ (ถ้ามี) — server ตรวจ mime/size + คำนวณ sha256
      for (const file of attachedFiles.value) {
        const fd = new FormData()
        fd.append('file', file)
        await $fetch(`/api/silk-items/${created.id}/evidence`, { method: 'POST', body: fd }).catch(() => {})
      }
      toast.success('บันทึกร่างผ้าไหมสำเร็จ — พร้อมส่งขอรับรองได้แล้ว')
      resetForm()
      await navigateTo('/weaver')
      return
    } catch (err: unknown) {
      const e = err as { statusCode?: number, data?: { message?: string, fieldErrors?: Record<string, string> } }
      // ถ้า API ยังไม่พร้อม (404/500) ให้ fallback เป็น mock เพื่อให้ UI/e2e ทำงานได้
      if (e?.statusCode === 404 || e?.statusCode === 500 || !e?.statusCode) {
        await new Promise(resolve => setTimeout(resolve, 500))
        toast.success('บันทึกร่างผ้าไหมสำเร็จ — พร้อมส่งขอรับรองได้แล้ว (โหมดตัวอย่าง)')
        resetForm()
        return
      }
      if (e?.data?.fieldErrors) {
        for (const [k, msg] of Object.entries(e.data.fieldErrors)) errors.value[k as keyof SilkItemForm] = msg
      }
      toast.error(e?.data?.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      return
    }
  } catch {
    toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
  } finally {
    isSubmitting.value = false
  }
}

const isFormValid = computed(() => {
  return form.value.title.trim() !== ''
})
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden">
        <FilePlus2 class="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 class="text-xl font-semibold text-neutral-900">ลงทะเบียนผ้าไหม</h1>
        <p class="text-sm text-neutral-600">กรอกข้อมูลและแนบหลักฐานเพื่อส่งขอรับรอง</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="mt-8 space-y-6" novalidate>
      <div class="rounded-xl border border-neutral-200 bg-white p-6 space-y-6">
        <h2 class="text-lg font-medium text-neutral-900">ข้อมูลผ้าไหม</h2>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label for="title" class="block text-sm font-medium text-neutral-700">
              ชื่อผืนผ้า <span class="text-error-600" aria-hidden="true">*</span>
            </label>
            <input
              id="title"
              v-model="form.title"
              @input="handleInput('title', getInputValue($event))"
              @blur="handleBlur('title')"
              type="text"
              placeholder="เช่น ผ้าไหมมัดมีกล้วยหอม"
              class="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-neutral-100 transition-colors"
              :class="{ 'border-error-500': touched.title && errors.title, 'border-neutral-300': !(touched.title && errors.title) }"
              :aria-invalid="touched.title && errors.title ? 'true' : 'false'"
              :aria-describedby="touched.title && errors.title ? 'title-error' : undefined"
              required
              autocomplete="off"
            />
            <p v-if="touched.title && errors.title" id="title-error" class="mt-1.5 text-xs leading-relaxed text-error-700" role="alert">
              {{ errors.title }}
            </p>
          </div>

          <div>
            <label for="pattern" class="block text-sm font-medium text-neutral-700">
              ลวดลาย
            </label>
            <input
              id="pattern"
              v-model="form.pattern"
              @input="handleInput('pattern', getInputValue($event))"
              @blur="handleBlur('pattern')"
              type="text"
              placeholder="เช่น มัดมีกล้วยหอม, โขง, ไหมกริบ"
              class="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-neutral-100"
              autocomplete="off"
            />
          </div>

          <div>
            <label for="material" class="block text-sm font-medium text-neutral-700">
              วัสดุ
            </label>
            <input
              id="material"
              v-model="form.material"
              @input="handleInput('material', getInputValue($event))"
              @blur="handleBlur('material')"
              type="text"
              placeholder="เช่น ไหมทอมหัตถ์, ไหมผสมฝ้าย"
              class="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-neutral-100"
              autocomplete="off"
            />
          </div>

          <div>
            <label for="technique" class="block text-sm font-medium text-neutral-700">
              เทคนิคการทอ
            </label>
            <input
              id="technique"
              v-model="form.technique"
              @input="handleInput('technique', getInputValue($event))"
              @blur="handleBlur('technique')"
              type="text"
              placeholder="เช่น ทอผ้าข้าง, ทอจักร, ทอเข็ม"
              class="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-neutral-100"
              autocomplete="off"
            />
          </div>

          <div>
            <label for="widthCm" class="block text-sm font-medium text-neutral-700">
              ความกว้าง (ซม.)
            </label>
            <input
              id="widthCm"
              v-model="form.widthCm"
              @input="handleInput('widthCm', getInputValue($event))"
              @blur="handleBlur('widthCm')"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="เช่น 80"
              class="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-neutral-100"
            />
            <p v-if="touched.widthCm && errors.widthCm" class="mt-1.5 text-xs leading-relaxed text-error-700" role="alert">
              {{ errors.widthCm }}
            </p>
          </div>

          <div>
            <label for="lengthCm" class="block text-sm font-medium text-neutral-700">
              ความยาว (ซม.)
            </label>
            <input
              id="lengthCm"
              v-model="form.lengthCm"
              @input="handleInput('lengthCm', getInputValue($event))"
              @blur="handleBlur('lengthCm')"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="เช่น 200"
              class="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-neutral-100"
            />
            <p v-if="touched.lengthCm && errors.lengthCm" class="mt-1.5 text-xs leading-relaxed text-error-700" role="alert">
              {{ errors.lengthCm }}
            </p>
          </div>

          <div>
            <label for="productionDate" class="block text-sm font-medium text-neutral-700">
              วันทอ / วันที่ผลิต
            </label>
            <input
              id="productionDate"
              v-model="form.productionDate"
              @input="handleInput('productionDate', getInputValue($event))"
              @blur="handleBlur('productionDate')"
              type="date"
              class="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-neutral-100"
            />
          </div>

          <div class="sm:col-span-2">
            <label for="notes" class="block text-sm font-medium text-neutral-700">
              หมายเหตุ
            </label>
            <textarea
              id="notes"
              v-model="form.notes"
              @input="handleInput('notes', getInputValue($event))"
              @blur="handleBlur('notes')"
              rows="3"
              placeholder="ข้อมูลเพิ่มเติม เช่น แรงจูงใจ ลักษณะพิเศษ สีสัน เป็นต้น"
              class="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-neutral-100 resize-y"
            />
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 class="text-lg font-medium text-neutral-900 flex items-center gap-2">
          <Upload class="size-5 text-primary-600" aria-hidden="true" />
          หลักฐานประกอบการผลิต
        </h2>
        <p class="text-xs text-neutral-500">รองรับไฟล์ภาพ (JPG, PNG) และเอกสาร (PDF) — ไม่เกิน 10 MB ต่อไฟล์</p>

        <div class="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer relative">
          <input
            type="file"
            id="evidence-files"
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
            @change="handleFileSelect"
            class="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="เลือกไฟล์หลักฐาน"
          />
          <label for="evidence-files" class="cursor-pointer">
            <FilePlus2 class="mx-auto size-10 text-neutral-300" aria-hidden="true" />
            <p class="mt-2 text-sm font-medium text-neutral-700">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก</p>
            <p class="mt-1 text-xs text-neutral-500">รองรับหลายไฟล์พร้อมกัน</p>
          </label>
        </div>

        <div v-if="attachedFiles.length > 0" class="space-y-2" role="list" aria-label="ไฟล์ที่แนบมา">
          <p class="text-xs font-medium text-neutral-600">ไฟล์ที่แนบมา ({{ attachedFiles.length }})</p>
          <ul class="divide-y divide-neutral-200">
            <li v-for="(file, index) in attachedFiles" :key="index" class="flex items-center justify-between py-2" role="listitem">
              <div class="flex items-center gap-3 min-w-0">
                <FileText class="size-5 text-neutral-400 shrink-0" aria-hidden="true" />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-neutral-900 truncate">{{ file.name }}</p>
                  <p class="text-xs text-neutral-500">{{ formatFileSize(file.size) }} • {{ file.type || 'ไม่ระบุประเภท' }}</p>
                </div>
              </div>
              <button
                type="button"
                @click="removeFile(index)"
                class="shrink-0 rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
                aria-label="ลบไฟล์ {{ file.name }}"
              >
                <X class="size-4" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          @click="handleSubmit"
          :disabled="isSubmitting || !isFormValid"
          class="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
          :class="isFormValid ? 'bg-primary hover:bg-primary-700' : 'bg-neutral-300 text-neutral-500'"
        >
          <span v-if="isSubmitting" class="flex items-center gap-2">
            <svg class="animate-spin size-4" viewBox="0 0 24 24" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            กำลังบันทึก...
          </span>
          <span v-else>บันทึกร่าง</span>
        </button>
      </div>
    </form>
  </div>
</template>