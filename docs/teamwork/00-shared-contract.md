# 00 — สัญญากลางของทีม (ทุก AI agent ต้องอ่านไฟล์นี้ก่อนทำงาน)

> ไฟล์นี้คือ "กฎที่ทุกคนต้องทำตามเหมือนกัน" — brief ของแต่ละคน (01–05) จะอ้างมาที่นี่
> ทั้งหมดออกแบบให้ 4 คนทำงานขนานกันบน branch ของตัวเอง แล้ว PM รวมเข้า main แล้วรันได้ทันที

## 0. คำสั่งเริ่มงานสำหรับ AI agent (ทำตามลำดับนี้เสมอ)

1. อ่าน `AGENTS.md` ที่ root ของ repo แล้วปฏิบัติตามทุกข้อ (โดยเฉพาะ "กฎเหล็ก")
2. โหลด skill `web-ui-coding-standards` ด้วย skill tool **ก่อนแก้หรือสร้างโค้ดทุกครั้ง**
3. อ่านไฟล์นี้ (สัญญากลาง) จนจบ แล้วอ่าน brief ของตัวเอง (01–04)
4. อ่านเอกสารอ้างอิงตามที่ brief ของตัวเองระบุ (ส่วนใหญ่คือ `docs/system-design.md`)
5. ทำงานทีละ checkbox จากบนลงล่าง — อย่าข้ามขั้น
6. ติดปัญหาหรือขัดกับ system-design: **หยุดและถามผู้ใช้ (PM)** — ห้ามตัดสินใจเอง

## 1. ข้อมูลโปรเจกต์ที่ต้องรู้

- **ระบบ:** รับรองแหล่งที่มาผ้าไหมทอมือบุรีรัมย์ ด้วย Local Blockchain Simulation (SHA-256 Hash Chain + PoA + Ed25519 — ไม่ใช่ network จริง)
- **Stack:** Nuxt 4 full-stack (TypeScript) · Tailwind v4 (semantic token จาก `app/app.config.ts`) · Prisma 7 + PostgreSQL 17 · `nuxt-auth-utils` · Vitest + Playwright
- **Ports:** App **3007** · PostgreSQL (host) **5437** — ห้ามใช้ 3000/5432 (ชนโปรเจกต์อื่นบนเครื่อง)
- **ภาษา:** UI และข้อความผู้ใช้ = ภาษาไทย · ชื่อตัวแปร/ฟังก์ชัน/ไฟล์ = อังกฤษ
- **Source of truth:** `docs/system-design.md` (§ ระบุใน brief แต่ละคน) · `docs/database-design.md` — ขัดแล้วให้ถาม PM ห้ามแก้เอกสารสองไฟล์นี้เอง

## 2. Setup เครื่องก่อนเริ่ม (ครั้งเดียว)

```bash
cp .env.example .env        # ตั้ง NUXT_SESSION_PASSWORD ให้ยาว 32+ ตัวอักษร (openssl rand -base64 32)
docker compose up -d postgres   # PostgreSQL บน port 5437
pnpm install
pnpm db:migrate
pnpm dev                    # เปิด http://localhost:3007 ได้ = setup ผ่าน
```

## 3. สิ่งที่มีให้แล้ว (อย่าสร้างซ้ำ — หากไม่แน่ใจให้ไปดูไฟล์จริงก่อน)

| อย่าง | ที่ไหน | สถานะ |
|---|---|---|
| DB 14 ตาราง + migration + append-only trigger | `prisma/` | เสร็จ ห้ามแก้ schema โดยไม่ได้รับอนุมัติ |
| Layout public + dashboard (sidebar, user menu, collapse, mobile drawer) | `app/layouts/`, `app/components/ui/` | เสร็จ ใช้งานได้ |
| หน้าเว็บ 17 route (skeleton + TODO) | `app/pages/` | โครงพร้อม — เติมเนื้อจริง |
| ระบบสี semantic token | `app/app.config.ts` + `main.css` | เสร็จ ใช้ `bg-primary`, `text-error-700` ฯลฯ |
| Auth demo (cookie role) | `useDemoRole()` + `app/middleware/auth.global.ts` | **ชั่วคราว** — คน 3 จะแทนที่ด้วย session จริง |
| Docker ทั้งระบบ | `Dockerfile`, `docker-compose.yml` | เสร็จ `docker compose up -d --build` ได้ |
| e2e 17 tests | `test/e2e/home.spec.ts` | ผ่านอยู่ — ห้ามทำให้พัง |

## 4. กติกาการทำงาน (บังคับ)

1. **Branch ของตัวเอง:** `feature/<บทบาท>-<งาน>` เช่น `feature/backend-auth`, `feature/frontend-toast` — ห้าม push main (PM เท่านั้นที่ merge)
2. **Gates ก่อนส่งทุกครั้ง:** `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` ผ่านทั้งชุด (e2e ต้องรัน `docker compose up -d postgres` ก่อน)
3. **แตะเฉพาะไฟล์ที่ brief ของตัวเองอนุญาต** (ดูแผนที่ด้านล่าง) — นี่คือเงื่อนไขที่ทำให้ merge ไม่ชนกัน
4. **ห้าม:** `any` / `@ts-ignore` / hard-code palette (`amber-600`) / browser `alert()`/`confirm()` / commit `.env` หรือ `storage/`
5. Validation ทุก input ใช้ **zod** · ทุกหน้า dashboard ต้องมีสถานะ Loading/Empty/Error/Permission (§5.3)
6. Commit message สั้นและตรงงาน ภาษาอังกฤษ เช่น `feat(api): auth login with sealed session`

## 5. แผนที่ความเป็นเจ้าของไฟล์

| คน | แตะได้ | ห้ามแตะ |
|---|---|---|
| 1 Docs | `docs/report/**`, `app/pages/about.vue`, `app/pages/privacy.vue` | ไฟล์อื่นทั้งหมด |
| 2 Frontend | `app/pages/**` (ยกเว้น about/privacy), `app/components/**`, `app/composables/**` (ยกเว้น `useAuthSession.ts`), `test/unit/**` (component), e2e ที่ไม่ใช่ของ 4 | `server/**`, `prisma/**`, `shared/**`, `app/middleware/**` |
| 3 Backend | `server/**` (ยกเว้น `server/services/ledger*` และ `server/api/ledger/**`), `app/middleware/**`, `shared/types/**`, `app/composables/useAuthSession.ts`, `prisma/seed.ts`, `package.json` (เฉพาะ scripts), `test/integration/**` (api) | `app/pages/**`, `app/components/**`, `shared/utils/**`, `server/services/ledger*`, `server/api/ledger/**` |
| 4 Blockchain+QA | `shared/utils/**`, `server/services/ledger*`, `server/api/ledger/**`, `prisma/seed-ledger.ts`, `test/unit/ledger*`, `test/integration/ledger*`, `test/e2e/**` (ชุด QA), `package.json` (script `ledger:verify`) | `app/pages/**`, `app/components/**`, `server/api/**` (ยกเว้น ledger) |
| PM | merge, `docs/system-design.md`, `docs/teamwork/**`, ตัดสินทุกข้อขัดแย้ง | — |

> **ข้อยกเว้นหนึ่งเดียว:** คน 3 ต้องแก้ `AppUserMenu.vue` + `login.vue` + `layouts/dashboard.vue` เล็กน้อยตอนเปลี่ยนจาก demo role เป็น session จริง — ทำ PR แยกชิ้นเล็กสุด แล้ว PM จัดการ conflict เอง

## 6. Contract A — LedgerService (คน 4 สร้าง · คน 3 เรียกใช้)

ไฟล์: `server/services/ledger.service.ts`

```ts
import type { Prisma } from '../../app/generated/prisma/client'
import type { PrismaClient } from '../../app/generated/prisma/client'

export type Tx = Prisma.TransactionClient | PrismaClient

export type LedgerEventType =
  | 'GENESIS' // สร้างเฉพาะใน seedLedger เท่านั้น
  | 'ISSUE_CERTIFICATE'
  | 'TRANSFER_ACCEPTED'
  | 'CERTIFICATE_SUSPENDED'
  | 'CERTIFICATE_REACTIVATED'
  | 'CERTIFICATE_REVOKED'

export interface LedgerEventInput {
  eventType: Exclude<LedgerEventType, 'GENESIS'>
  aggregateId: string          // silk_items.public_id เสมอ
  actorId: string              // user id ของผู้กระทำ
  payload: Record<string, string | number | null>  // ห้ามมี PII — ใส่แค่ id/code/hash/ตัวเลข
}

export interface AppendResult {
  blockIndex: number
  blockHash: string
}

export function appendEvents(tx: Tx, events: LedgerEventInput[]): Promise<AppendResult>

export interface VerifyResult {
  valid: boolean
  checkedBlocks: number
  firstInvalidIndex: number | null
  detail?: string
}

export function verifyChain(): Promise<VerifyResult>

// เรียกจาก prisma/seed.ts — สร้าง validator 3 ราย + genesis block
export function seedLedger(tx: Tx): Promise<void>
```

กติกาการคำนวณ (มาจาก comment ใน `prisma/schema.prisma` — คน 4 ต้องทำตามนี้เป๊ะ):

- `hash = SHA256(index + timestamp + canonicalData + nonce + previousHash + validatorId)`
- `signature = Ed25519Sign(hash, validatorPrivateKey)` ด้วย `node:crypto`
- **Validator เลือกแบบ round-robin** จากตาราง `ledger_validators` (เรียงตาม `createdAt`), `nonce` = ค่าสะสมของ validator รายนั้น +1 ทุกรอบ (ตามบริบท PoA — **ไม่ใช่ mining**)
- Private key ไฟล์ `storage/validator-keys/` (server-only), public key ลง DB
- **Atomic:** `appendEvents` รับ `tx` จากผู้เรียก — บันทึก block + events ภายใน PostgreSQL transaction เดียวกับข้อมูลธุรกิจ (pattern: `docs/database-design.md` §7) ถ้าอะไรพัง ทุกอย่าง rollback ด้วยกัน

## 7. Contract B — DTO ของ API (คน 3 สร้าง `shared/types/api.ts` จากส่วนนี้ · คน 2 import ใช้)

```ts
export type Role = 'WEAVER' | 'COOPERATIVE_OFFICER' | 'STORE_USER'

export interface SessionUser {
  id: string
  displayName: string
  role: Role
  organizationName: string
}

export type SilkItemStatus = 'DRAFT' | 'SUBMITTED' | 'CERTIFIED' | 'REJECTED'

export interface SilkItemSummary {
  id: string
  publicId: string
  title: string
  status: SilkItemStatus
  updatedAt: string // ISO datetime
}

export interface SilkItemDetail {
  id: string
  publicId: string
  status: SilkItemStatus
  revision: {
    revisionNumber: number
    title: string
    pattern?: string
    material?: string
    technique?: string
    widthCm?: number
    lengthCm?: number
    productionDate?: string
    notes?: string
  }
  evidence: { id: string, fileName: string, sha256: string }[]
  latestReview?: {
    status: 'SUBMITTED' | 'APPROVED' | 'REJECTED'
    rejectionReasonCode?: string
    reviewNote?: string
    reviewedAt?: string
  }
}

export interface ReviewQueueItem {
  requestId: string
  silkItemPublicId: string
  revisionTitle: string
  submittedBy: string   // display name ของช่างทอ
  submittedAt: string
}

export type TransferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'

export interface TransferItem {
  id: string
  silkItemPublicId: string
  silkItemTitle: string
  fromOrgName: string
  toOrgName: string
  status: TransferStatus
  canResolve: boolean   // ผู้ใช้ปัจจุบันมีสิทธิ์ยืนยัน/ปฏิเสธรายการนี้หรือไม่
  createdAt: string
}

export type PublicCertResult = 'VALID' | 'SUSPENDED' | 'REVOKED' | 'NOT_FOUND'

export interface PublicCertificate {
  result: PublicCertResult
  certificateCode: string
  issuedAt?: string
  silkItem: { publicId: string, title: string, pattern?: string, technique?: string }
  weaverDisplayName: string     // เฉพาะชื่อที่ยินยอมเปิดเผย — ไม่มี PII อื่น
  issuerOrgName: string
  custodyTimeline: { event: string, orgName: string, at: string }[]
  hashSummary: {
    blockIndex: number
    blockHash: string
    previousHash: string
    validatorName: string
    signatureValid: boolean
  }
}

export interface LedgerBlockSummary {
  index: number
  timestamp: string
  hash: string
  previousHash: string
  validatorName: string
  eventCount: number
}

export interface LedgerBlockDetail extends LedgerBlockSummary {
  events: { eventType: string, aggregateId?: string, payload: Record<string, unknown> }[]
  signatureValid: boolean
}
```

รายการ endpoint ทั้งหมด (path + สิทธิ์) อยู่ใน `docs/system-design.md` **§5.5** — ทำตามนั้นเป๊ะ ห้ามเปลี่ยน path เอง
รูปแบบ error กลาง (ทุก endpoint ใช้เหมือนกัน): `{ code: string, message: string }` โดย `message` เป็นภาษาไทยอธิบายให้ผู้ใช้แก้ไขต่อได้

## 8. Contract C — enum สถานะทั้งระบบ (จาก `prisma/schema.prisma` จริง — ห้ามเพิ่มเอง)

- Role: `WEAVER | COOPERATIVE_OFFICER | STORE_USER`
- RevisionStatus: `DRAFT | SUBMITTED | APPROVED | REJECTED`
- RequestStatus: `SUBMITTED | APPROVED | REJECTED`
- CertificateStatus: `ACTIVE | SUSPENDED | REVOKED`
- TransferStatus: `PENDING | ACCEPTED | REJECTED | CANCELLED | EXPIRED`
- LedgerEventType: `GENESIS | ISSUE_CERTIFICATE | TRANSFER_ACCEPTED | CERTIFICATE_SUSPENDED | CERTIFICATE_REACTIVATED | CERTIFICATE_REVOKED`

## 9. ลำดับการรวมงาน (สำหรับ PM — รายละเอียดอยู่ใน `05-pm-integration.md`)

```text
main ─┬─ (1) shared/types/api.ts          (คน 3 — ส่งเร็วสุด ไม่มี dependency)
      ├─ (2) ledger.service + seedLedger  (คน 4 — คน 3 รออยู่)
      ├─ (3) auth จริง                    (คน 3 — PM แก้ conflict ที่ AppUserMenu เอง)
      ├─ (4) ที่เหลือของทุกคน            (อิสระตาม ownership map)
      └─ (5) QA + Quality Gate            (คน 4 + PM)
```
