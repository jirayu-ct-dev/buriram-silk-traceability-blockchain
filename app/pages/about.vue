<script setup lang="ts">
import { AlertCircle, FileCheck, Info, Lock, ShieldCheck, Table } from '@lucide/vue'

useHead({ title: 'ระบบทำงานอย่างไร' })

const SECTIONS = [
  {
    icon: FileCheck,
    title: 'ข้อมูลใดที่บันทึกแบบแก้ไม่ได้ (On-Chain Ledger)',
    badge: 'บันทึกถาวร',
    badgeClass: 'bg-success-50 text-success-700 border-success-200',
    points: [
      'เหตุการณ์สำคัญของวงจรชีวิตใบรับรอง: การออกใบรับรอง (Issue), การส่งมอบ (Transfer), การระงับ (Suspend), การคืนสถานะ (Reactivate) และการเพิกถอน (Revoke)',
      'รหัสลับการเข้ารหัส (Cryptographic SHA-256 Hash) ของข้อมูลผ้าไหมและไฟล์หลักฐาน ไม่ใช่ตัวไฟล์ขนาดใหญ่หรือข้อมูลส่วนบุคคล',
      'ลำดับบล็อก (Index), แฮชของบล็อกก่อนหน้า (Previous Hash), ตัวนับรอบ (Nonce) และลายเซ็นดิจิทัล (Ed25519) ของผู้ตรวจสอบ',
    ],
  },
  {
    icon: Lock,
    title: 'ข้อมูลใดที่จัดเก็บแยกไว้ (Off-Chain Database & Files)',
    badge: 'คุ้มครองสิทธิ์',
    badgeClass: 'bg-primary-50 text-primary-700 border-primary-200',
    points: [
      'ข้อมูลส่วนบุคคลที่ระบุตัวตนได้ (PII) ของช่างทอ เช่น ชื่อ-นามสกุลจริง ที่อยู่ และเบอร์โทรศัพท์ เพื่อให้สอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
      'ไฟล์รูปภาพความละเอียดสูงของกระบวนการทอ และเอกสารหลักฐานสิทธิ์ฉบับเต็ม (จัดเก็บบนเครื่องแม่ข่ายปลอดภัย)',
      'บันทึกการตรวจภายในของเจ้าหน้าที่สหกรณ์ (Review Notes) และร่างข้อมูล (Drafts) ที่ยังไม่ได้รับการอนุมัติ',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'ข้อจำกัดที่ควรทราบ (System Limitations & Boundaries)',
    badge: 'ข้อเท็จจริงสำคัญ',
    badgeClass: 'bg-warning-50 text-warning-700 border-warning-200',
    points: [
      'ใบรับรองยืนยันบันทึกดิจิทัลและกระบวนการรับรองที่บันทึกไว้ในระบบ ไม่ใช่การตรวจสอบคุณสมบัติทางเคมีหรือกายภาพแบบ Real-time ณ ปัจจุบัน',
      'ระบบนี้เป็นระบบจำลองฉันทามติแบบ Local Consortium Simulation เพื่อการศึกษาและสาธิตสถาปัตยกรรม ไม่ใช่เครือข่ายบล็อกเชนกระจายศูนย์สาธารณะ',
      'การสแกนตรวจสอบใบรับรองเป็นกระบวนการอ่านข้อมูล (Read-only) ที่ไม่มีการสร้างบล็อกหรือเรียกเก็บค่าธรรมเนียมใดๆ',
      'QR Code บนผืนผ้าสามารถถูกถ่ายภาพหรือคัดลอกได้ในทางกายภาพ ผู้บริโภคควรตรวจสอบภาพถ่ายลายผ้าจริงในระบบและไทม์ไลน์การส่งมอบประกอบด้วยเสมอ',
    ],
  },
]

const ON_CHAIN_DATA = [
  { item: 'รหัสใบรับรอง (Certificate Code)', description: 'รหัสอ้างอิงสาธารณะสำหรับค้นหาและตรวจสอบ' },
  { item: 'แฮชข้อมูลผ้าและหลักฐาน (Revision & Evidence Hash)', description: 'SHA-256 Digest ยืนยันว่าข้อมูลและรูปภาพไม่ถูกแก้ไข' },
  { item: 'รหัสช่างทอแบบนามแฝง (Pseudonymous Weaver ID)', description: 'รหัส UUID ที่ไม่เปิดเผยชื่อ-สกุลจริงโดยตรง' },
  { item: 'เวลาที่ได้รับการรับรอง (Timestamp)', description: 'เวลาที่บล็อกได้รับการยืนยันและลงนาม' },
  { item: 'ประเภทเหตุการณ์ (Domain Event Type)', description: 'เหตุการณ์ที่ได้รับการรับรองร่วม (เช่น ISSUE, TRANSFER, SUSPEND)' },
  { item: 'รหัสองค์กรผู้ออกใบรับรอง (Issuer Org ID)', description: 'รหัสระบุสหกรณ์หรือหน่วยงานที่รับรอง' },
  { item: 'ลำดับบล็อกและแฮชก่อนหน้า (Index & Previous Hash)', description: 'โครงสร้างร้อยเรียงแบบ Hash Chain ที่ตรวจสอบได้' },
  { item: 'ตัวนับรอบและลายเซ็น (Nonce & Ed25519 Signature)', description: 'หลักฐานการลงนามของผู้ตรวจสอบประจำรอบตามฉันทามติ PoA' },
]

const OFF_CHAIN_DATA = [
  { item: 'ชื่อ-นามสกุลจริงของช่างทอ', description: 'ข้อมูลส่วนบุคคล (PII) ภายใต้การคุ้มครองตาม PDPA' },
  { item: 'ที่อยู่และเบอร์โทรศัพท์ติดต่อ', description: 'ข้อมูลติดต่อส่วนตัวของช่างทอ' },
  { item: 'ไฟล์ภาพถ่ายความละเอียดสูง', description: 'ภาพถ่ายลวดลาย เส้นไหม และกระบวนการทอ' },
  { item: 'เอกสารสิทธิ์และบันทึกฉบับเต็ม', description: 'เอกสารอ้างอิงและบันทึกการตรวจประเมิน' },
  { item: 'บันทึกความเห็นภายในของเจ้าหน้าที่', description: 'Internal Review Notes & Audit Log รายบุคคล' },
  { item: 'ข้อมูลฉบับร่างที่รอการส่งตรวจ', description: 'Draft Revisions ที่ยังไม่ผ่านการอนุมัติ' },
]
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6">
    <!-- Header -->
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 rounded-full border border-info-200 bg-info-50 px-3 py-1 text-xs font-medium text-info-700">
        <Info class="size-3.5 shrink-0" aria-hidden="true" />
        <span>ระบบจำลอง Local Blockchain Simulation เพื่อการศึกษา</span>
      </div>
      <h1 class="text-3xl font-bold tracking-tight text-neutral-900">ระบบทำงานอย่างไร</h1>
      <p class="text-base leading-relaxed text-neutral-600">
        ระบบรับรองแหล่งที่มาผ้าไหมทอมือบุรีรัมย์ ใช้สถาปัตยกรรมการแยกข้อมูลระหว่าง
        <strong>On-Chain Ledger (บันทึกธุรกรรมที่ไม่สามารถแก้ไขย้อนหลังได้)</strong> และ
        <strong>Off-Chain Storage (ฐานข้อมูลและไฟล์ภาพภายใต้การคุ้มครอง PDPA)</strong>
      </p>
    </div>

    <!-- Core Sections -->
    <div class="mt-10 space-y-6">
      <section
        v-for="section in SECTIONS"
        :key="section.title"
        class="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <component :is="section.icon" class="size-5" aria-hidden="true" />
            </span>
            <h2 class="font-semibold text-neutral-900">
              {{ section.title }}
            </h2>
          </div>
          <span :class="['inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium', section.badgeClass]">
            {{ section.badge }}
          </span>
        </div>
        <ul class="mt-4 space-y-2.5">
          <li
            v-for="point in section.points"
            :key="point"
            class="flex gap-2.5 text-sm leading-relaxed text-neutral-600"
          >
            <span class="mt-2 size-1.5 shrink-0 rounded-full bg-primary-500" aria-hidden="true" />
            <span>{{ point }}</span>
          </li>
        </ul>
      </section>
    </div>

    <!-- Comparison Table -->
    <section class="mt-12">
      <div class="flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info-100 text-info-700">
          <Table class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 class="font-semibold text-neutral-900">ตารางเปรียบเทียบ On-Chain vs Off-Chain</h2>
          <p class="text-xs text-neutral-500">การจัดประเภทข้อมูลตามระดับความโปร่งใสและการคุ้มครองสิทธิ</p>
        </div>
      </div>

      <div class="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th class="px-4 py-3 font-semibold text-neutral-900">รายการข้อมูล</th>
              <th class="px-4 py-3 font-semibold text-neutral-900">คำอธิบาย</th>
              <th class="px-4 py-3 font-semibold text-neutral-900">สถานที่จัดเก็บ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            <tr
              v-for="(data, index) in ON_CHAIN_DATA"
              :key="'on-' + index"
              class="hover:bg-neutral-50/50"
            >
              <td class="px-4 py-3 font-medium text-neutral-900">{{ data.item }}</td>
              <td class="px-4 py-3 text-neutral-600">{{ data.description }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="inline-flex items-center gap-1 rounded-md bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                  ✓ บันทึกบน Ledger (On-Chain)
                </span>
              </td>
            </tr>
            <tr
              v-for="(data, index) in OFF_CHAIN_DATA"
              :key="'off-' + index"
              class="hover:bg-neutral-50/50"
            >
              <td class="px-4 py-3 font-medium text-neutral-900">{{ data.item }}</td>
              <td class="px-4 py-3 text-neutral-600">{{ data.description }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                  📁 เก็บแยกใน DB (Off-Chain)
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Scope of Certification -->
    <section class="mt-12 rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
      <div class="flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-warning-700">
          <ShieldCheck class="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 class="font-semibold text-neutral-900">ขอบเขตการรับรอง (Certificate Scope)</h2>
          <p class="text-xs text-neutral-500">สิ่งที่ใบรับรองดิจิทัลยืนยันและไม่ยืนยัน</p>
        </div>
      </div>
      
      <p class="mt-4 text-sm leading-relaxed text-neutral-600">
        ใบรับรองดิจิทัลที่ระบบนี้ออกให้ มีวัตถุประสงค์เพื่อยืนยันข้อเท็จจริง 4 ประการ:
      </p>
      
      <div class="mt-4 grid gap-3 sm:grid-cols-2">
        <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5">
          <span class="text-xs font-semibold text-primary-700">1. ผู้ทอ (Weaver)</span>
          <p class="mt-1 text-xs text-neutral-600">ยืนยันว่าผ้าไหมผืนนี้ได้รับการผลิตโดยช่างทอในทะเบียนสมาชิกสหกรณ์</p>
        </div>
        <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5">
          <span class="text-xs font-semibold text-primary-700">2. แหล่งผลิต (Origin)</span>
          <p class="mt-1 text-xs text-neutral-600">ยืนยันพื้นที่แหล่งผลิตในชุมชนหัตถกรรมทอผ้าไหมของจังหวัดบุรีรัมย์</p>
        </div>
        <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5">
          <span class="text-xs font-semibold text-primary-700">3. ผู้ตรวจรับ (Certifier)</span>
          <p class="mt-1 text-xs text-neutral-600">ยืนยันตัวตนเจ้าหน้าที่สหกรณ์ผู้ทำหน้าที่ตรวจรับรองตามมาตรฐาน</p>
        </div>
        <div class="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5">
          <span class="text-xs font-semibold text-primary-700">4. วันที่และประวัติ (Timeline)</span>
          <p class="mt-1 text-xs text-neutral-600">ยืนยันวันเวลาที่ได้รับการรับรองและประวัติการส่งมอบการครอบครอง</p>
        </div>
      </div>

      <div class="mt-4 flex items-start gap-2.5 rounded-lg border border-error-200 bg-error-50 p-3.5 text-xs leading-relaxed text-error-800">
        <AlertCircle class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>ข้อควรระวัง:</strong> ใบรับรองนี้ไม่ได้เป็นการรับประกันคุณภาพทางกายภาพทั้งหมด 100% เช่น ความทนทานต่อการซักล้าง หรือความพึงพอใจส่วนบุคคล ผู้บริโภคควรตรวจสอบลักษณะเนื้อผ้าจริงร่วมด้วย
        </p>
      </div>
    </section>
  </div>
</template>
