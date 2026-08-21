<script setup lang="ts">
import { Eye, FileText, Info, Lock, Mail, ShieldCheck } from '@lucide/vue'

useHead({ title: 'นโยบายความเป็นส่วนตัว' })

const PURPOSES = [
  'เพื่อการระบุตัวตนและยืนยันแหล่งกำเนิดผ้าไหมทอมือจังหวัดบุรีรัมย์อย่างถูกต้องตามข้อเท็จจริง',
  'เพื่อการออกใบรับรองดิจิทัลและเปิดให้ผู้บริโภคตรวจสอบย้อนกลับ (Traceability) ผ่าน QR Code',
  'เพื่อบันทึกประวัติการส่งมอบการครอบครอง (Custody Chain) ระหว่างช่างทอ สหกรณ์ และร้านค้า',
  'เพื่อป้องกันการปลอมแปลงใบรับรองและปกป้องภูมิปัญญาผ้าไหมทอมือท้องถิ่น',
]

const DATA_TYPES = [
  {
    type: 'ข้อมูลส่วนบุคคลระบุตัวตน (PII)',
    details: 'ชื่อ-นามสกุล, หมายเลขประจำตัวประชาชน, ที่อยู่, หมายเลขโทรศัพท์',
    storage: 'PostgreSQL 17 (เข้ารหัสในระดับระบบ)',
    access: 'เจ้าหน้าที่สหกรณ์ผู้ได้รับมอบหมายเท่านั้น',
    badge: 'Off-Chain (คุ้มครองเข้มงวด)',
    badgeClass: 'bg-primary-50 text-primary-700 border-primary-200',
  },
  {
    type: 'ข้อมูลผ้าไหมและกระบวนการผลิต',
    details: 'ชื่อช่างทอ (นามแฝง), ชื่อลาย, สี, ขนาด, แหล่งกำเนิดชุมชน',
    storage: 'PostgreSQL 17 + สรุปเป็น Hash บน Ledger',
    access: 'เปิดเผยต่อสาธารณะ / ผู้บริโภค',
    badge: 'Public Read Model',
    badgeClass: 'bg-info-50 text-info-700 border-info-200',
  },
  {
    type: 'ข้อมูลการรับรองและธุรกรรม (Ledger Data)',
    details: 'Cryptographic SHA-256 Hashes, Timestamp, Nonce, Ed25519 Signatures',
    storage: 'ตาราง Append-only บนบล็อกเชนจำลอง',
    access: 'เปิดเผยต่อสาธารณะผ่าน Blockchain Explorer',
    badge: 'On-Chain (บันทึกถาวร)',
    badgeClass: 'bg-success-50 text-success-700 border-success-200',
  },
  {
    type: 'ไฟล์ภาพถ่ายและเอกสารประกอบ',
    details: 'ภาพถ่ายลวดลายผ้า, ภาพถ่ายกระบวนการทอ, เอกสารสิทธิ์',
    storage: 'Server Local Storage (/storage/uploads/)',
    access: 'ช่างทอเจ้าของผลงาน และเจ้าหน้าที่ตรวจรับรอง',
    badge: 'Restricted Storage',
    badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  },
]

const RIGHTS = [
  {
    right: 'สิทธิในการเข้าถึงและขอรับสำเนา (Right of Access)',
    description: 'ช่างทอมีสิทธิเข้าถึงและขอรับสำเนาข้อมูลส่วนบุคคลของตนเองผ่านระบบ Weaver Dashboard',
  },
  {
    right: 'สิทธิในการขอให้แก้ไขข้อมูล (Right to Rectification)',
    description: 'มีสิทธิขอแก้ไขข้อมูลส่วนบุคคลให้ถูกต้อง เป็นปัจจุบัน และสมบูรณ์',
  },
  {
    right: 'สิทธิในการขอให้ลบข้อมูล (Right to Erasure / Right to be Forgotten)',
    description: 'มีสิทธิขอให้ลบหรือทำลายข้อมูลส่วนบุคคลในฐานข้อมูล PostgreSQL เมื่อพ้นความจำเป็นในการจัดเก็บ',
  },
  {
    right: 'สิทธิในการขอเพิกถอนความยินยอม (Right to Withdraw Consent)',
    description: 'สามารถเพิกถอนความยินยอมในการประมวลผลข้อมูลส่วนบุคคลได้ตลอดระยะเวลาที่ข้อมูลถูกเก็บรักษา',
  },
  {
    right: 'สิทธิในการขอระงับหรือคัดค้านการประมวลผล (Right to Restriction / Object)',
    description: 'มีสิทธิขอให้ระงับการใช้ข้อมูลส่วนบุคคล หรือคัดค้านการประมวลผลตามเงื่อนไขที่กฎหมายกำหนด',
  },
]
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6">
    <!-- Header -->
    <div class="text-center">
      <span class="inline-flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
        <Lock class="size-6" aria-hidden="true" />
      </span>
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-neutral-900">นโยบายความเป็นส่วนตัว (Privacy Notice)</h1>
      <p class="mt-2 text-sm leading-relaxed text-neutral-600">
        ประกาศแจ้งการคุ้มครองข้อมูลส่วนบุคคลตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
        สำหรับระบบรับรองแหล่งที่มาผ้าไหมทอมือบุรีรัมย์
      </p>
    </div>

    <!-- Purposes -->
    <section class="mt-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
      <div class="flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
          <FileText class="size-5" aria-hidden="true" />
        </span>
        <h2 class="font-semibold text-neutral-900">1. วัตถุประสงค์ในการเก็บรวบรวมและประมวลผลข้อมูล</h2>
      </div>
      <ul class="mt-4 space-y-2.5">
        <li
          v-for="purpose in PURPOSES"
          :key="purpose"
          class="flex gap-2.5 text-sm leading-relaxed text-neutral-600"
        >
          <span class="mt-2 size-1.5 shrink-0 rounded-full bg-primary-500" aria-hidden="true" />
          <span>{{ purpose }}</span>
        </li>
      </ul>
    </section>

    <!-- Data Types Table -->
    <section class="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
      <div class="flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info-100 text-info-700">
          <Eye class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 class="font-semibold text-neutral-900">2. ประเภทข้อมูล สถานที่จัดเก็บ และการเข้าถึง</h2>
          <p class="text-xs text-neutral-500">การแยกสถาปัตยกรรมข้อมูล On-Chain และ Off-Chain</p>
        </div>
      </div>

      <div class="mt-4 overflow-x-auto rounded-lg border border-neutral-200">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th class="px-4 py-3 font-semibold text-neutral-900">ประเภทข้อมูล</th>
              <th class="px-4 py-3 font-semibold text-neutral-900">รายละเอียด</th>
              <th class="px-4 py-3 font-semibold text-neutral-900">สถานที่จัดเก็บ</th>
              <th class="px-4 py-3 font-semibold text-neutral-900">ผู้มีสิทธิ์เข้าถึง</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            <tr
              v-for="(data, index) in DATA_TYPES"
              :key="index"
              class="hover:bg-neutral-50/50"
            >
              <td class="px-4 py-3 font-medium text-neutral-900">
                <div>{{ data.type }}</div>
                <span :class="['mt-1 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', data.badgeClass]">
                  {{ data.badge }}
                </span>
              </td>
              <td class="px-4 py-3 text-xs leading-relaxed text-neutral-600">{{ data.details }}</td>
              <td class="px-4 py-3 text-xs text-neutral-600">{{ data.storage }}</td>
              <td class="px-4 py-3 text-xs text-neutral-600">{{ data.access }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- PDPA Rights -->
    <section class="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
      <div class="flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success-100 text-success-700">
          <ShieldCheck class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 class="font-semibold text-neutral-900">3. สิทธิของเจ้าของข้อมูลส่วนบุคคลตามกฎหมาย PDPA</h2>
          <p class="text-xs text-neutral-500">การใช้สิทธิและการคุ้มครองความปลอดภัย</p>
        </div>
      </div>

      <ul class="mt-4 space-y-3">
        <li
          v-for="right in RIGHTS"
          :key="right.right"
          class="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4"
        >
          <p class="font-medium text-neutral-900">{{ right.right }}</p>
          <p class="mt-1 text-xs leading-relaxed text-neutral-600">{{ right.description }}</p>
        </li>
      </ul>

      <!-- Immutability vs Right to be Forgotten Alert -->
      <div class="mt-4 flex items-start gap-2.5 rounded-lg border border-info-200 bg-info-50 p-4 text-xs leading-relaxed text-info-900">
        <Info class="mt-0.5 size-4 shrink-0 text-info-700" aria-hidden="true" />
        <div>
          <p class="font-semibold">ข้อชี้แจงทางเทคนิคเกี่ยวกับการขอลบข้อมูล (Right to be Forgotten):</p>
          <p class="mt-1">
            ข้อมูลที่บันทึกลงในบล็อกเชน (On-Chain Ledger) มีเพียงรหัสแฮช (SHA-256 Digest) และรหัสนามแฝงที่ไม่สามารถย้อนกลับเป็นข้อมูลส่วนบุคคลได้โดยตรง เมื่อท่านใช้สิทธิขอลบข้อมูล ระบบจะดำเนินการลบข้อมูลชื่อ ที่อยู่ และประวัติส่วนตัวออกจากฐานข้อมูล Off-Chain ทันที ส่งผลให้แฮชบนบล็อกเชนกลายเป็นแฮชที่ไม่สามารถระบุถึงตัวบุคคลได้อีกต่อไป สอดคล้องกับมาตรฐานทางกฎหมาย PDPA
          </p>
        </div>
      </div>
    </section>

    <!-- Contact Info -->
    <section class="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
      <div class="flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-warning-700">
          <Mail class="size-5" aria-hidden="true" />
        </span>
        <h2 class="font-semibold text-neutral-900">4. ช่องทางการติดต่อผู้ควบคุมข้อมูลส่วนบุคคล</h2>
      </div>
      <div class="mt-4 text-sm leading-relaxed text-neutral-600">
        <p>หากท่านมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ หรือต้องการใช้สิทธิของเจ้าของข้อมูลส่วนบุคคล สามารถติดต่อได้ที่:</p>
        <div class="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-xs">
          <div class="font-semibold text-neutral-900">สหกรณ์ผ้าไหมบุรีรัมย์ (โครงการวิจัยรับรองแหล่งที่มาผ้าไหม)</div>
          <div class="text-neutral-600">ที่อยู่: อำเภอเอบี จังหวัดบุรีรัมย์</div>
          <div class="text-neutral-600">อีเมลติดต่อ: <span class="font-mono text-primary-700">AB@buriramsilk.coop</span></div>
          <div class="text-neutral-600">เวลาทำการ: วันจันทร์ - วันศุกร์ เวลา 08:30 - 16:30 น.</div>
        </div>
      </div>
    </section>
  </div>
</template>
