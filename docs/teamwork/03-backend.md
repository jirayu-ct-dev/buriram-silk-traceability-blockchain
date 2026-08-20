# 03 — บทบาท: Backend (API ทั้งระบบ + Auth + Seed)

> **ให้ AI agent อ่านก่อน:** `AGENTS.md` → skill `web-ui-coding-standards` → `docs/teamwork/00-shared-contract.md` (สัญญากลาง) → ไฟล์นี้
> อ้างอิงหลัก: `docs/system-design.md` §5.5 (API contract — ทำตามเป๊ะ), §6 (flows), §7 (state models), §11 (pseudo-code = business rules), §14.4 (auth), §21 (seed)
> อ้างอิงฐานข้อมูล: `docs/database-design.md` ทั้งเล่ม โดยเฉพาะ §7 (transaction pattern)

## ภาพรวมงานคุณ

สร้าง API ทุก endpoint ให้ทำงานจริงกับ PostgreSQL ปลอดภัยทุกชั้น (session/role/ownership/state/idempotency ตรวจฝั่ง server เสมอ) พร้อมระบบ auth จริงแทน demo และ seed ข้อมูล demo ครบ

**แตะได้:** `server/**` (ยกเว้น `server/services/ledger*`, `server/api/ledger/**`), `app/middleware/**`, `shared/types/**`, `app/composables/useAuthSession.ts`, `prisma/seed.ts`, `package.json` (scripts), `test/integration/**` (api)
**ข้อยกเว้นพิเศษ:** แก้ `app/components/ui/AppUserMenu.vue`, `app/pages/login.vue`, `app/layouts/dashboard.vue` ได้ **เฉพาะ** ในขั้น "ถอด demo auth" (Module 1) ให้เป็น PR เล็กแยก
**ห้ามแตะ:** `app/pages/**` อื่น ๆ, `app/components/**` อื่น ๆ, `shared/utils/**`, `server/services/ledger*`, `server/api/ledger/**`

---

## งานที่ 0 — สร้าง `shared/types/api.ts` (ส่ง PR แรกทันที · คน 2 รออยู่)

- [ ] สร้างไฟล์ `shared/types/api.ts` จาก **Contract B ใน `00-shared-contract.md`** เป๊ะ ๆ ทุก interface
- [ ] เพิ่ม type ของ request body ที่ต้องใช้: `LoginInput { username, password }`, `CreateSilkItemInput`, `SubmitInput { idempotencyKey }`, `ReviewDecisionInput { note?, reasonCode? }`, `CertificateStatusInput { action: 'SUSPEND'|'REACTIVATE'|'REVOKE', reason }`, `CreateTransferInput { silkItemId, toOrgId }`
- [ ] Error response รูปแบบกลาง `{ code: string, message: string }` — สร้าง helper `server/utils/api-error.ts` (`throw createApiError(code, message, statusCode)`)

---

## Module 1 — Auth จริง (ทำก่อนทุกอย่าง · ทุกคนใช้)

สถานะปัจจุบัน: `useDemoRole()` (cookie) + `app/middleware/auth.global.ts` เป็นของปลอม — **แทนที่ด้วยของจริงทั้งชุด**

### 1.1 Endpoints

- [ ] `POST /api/auth/login` — ตรวจ username/password (hash ด้วย **argon2** หรือ bcrypt — เลือกตัวเดียวใช้ทั้งระบบ), สร้าง **Sealed Cookie Session** ด้วย `nuxt-auth-utils` (module ติดตั้งแล้ว — อ่าน docs ของมันก่อนใช้)
- [ ] `POST /api/auth/logout` — ล้าง session
- [ ] `GET /api/auth/session` — คืน `SessionUser` (401 ถ้าไม่มี session)
- [ ] ทุก endpoint ใช้ zod validate body

### 1.2 Server helpers — `server/utils/auth.ts`

- [ ] `requireSession()` — อ่าน session จาก sealed cookie, ไม่มี → throw 401
- [ ] `requireRole(...roles)` — ผิด role → throw 403
- [ ] `requireOwnership(silkItemId, session)` — เจ้าของหรือมีสิทธิ์เท่านั้น
- [ ] ทุก helper คืนข้อมูล user + organization ที่ endpoint ใช้ต่อได้

### 1.3 Route middleware จริง — แทนที่ `auth.global.ts`

- [ ] `app/middleware/auth.ts` — dashboard route ต้องมี session ไม่งั้น redirect `/login`
- [ ] `app/middleware/role.ts` — กำหนด role ต่อ route group: `/weaver/**` = WEAVER, `/review/**` และ `/certificates/**` = COOPERATIVE_OFFICER, `/transfers/**` = ทั้งสาม (ตรวบตามสิทธิ์รายรายการที่ API), `/audit/**` = มี session
- [ ] Public routes (§5.1) ไม่ต้อง login
- [ ] ถอด `useDemoRole()` ออก: `AppUserMenu.vue` (แสดง displayName/organization จาก session), `layouts/dashboard.vue` (เมนูตาม role จริง), `app/pages/login.vue` (คง UI ไว้ คน 2 จะ wire ต่อ) — **แก้ให้น้อยที่สุด แล้วแยก PR**

### 1.4 Composable ให้คน 2 ใช้ — `app/composables/useAuthSession.ts`

- [ ] `useAuthSession()` — fetch `/api/auth/session` แบบ reactive + `signIn`, `signOut` methods + `homeFor(role)` logic (ย้ายมาจาก `useDashboardNav` หรือ reuse)

---

## Module 2 — Silk Item Workflow (§6.1–6.2, §11.1)

> Business rules อ่านจาก pseudo-code §11.1 — implement ให้ตรงทุก REQUIRE

- [ ] `GET /api/silk-items` — คืน list ตามสิทธิ์: WEAVER เห็นของตัวเอง, OFFICER เห็นทั้งหมด, STORE เห็นเฉพาะที่ตนเป็น custodian; คืน `SilkItemSummary[]` (สถานะ map จาก revision + certificate: มี ACTIVE cert = CERTIFIED, REJECTED ล่าสุด = REJECTED, ฯลฯ)
- [ ] `POST /api/silk-items` — WEAVER เท่านั้น; สร้าง SilkItem + revision แรก DRAFT ใน transaction เดียว; `publicId` สร้างแบบอ่านง่าย (เช่น `SI-XXXXXX`)
- [ ] `GET /api/silk-items/:id` — คืน `SilkItemDetail` (มี evidence + latestReview)
- [ ] `PATCH /api/silk-items/:id` — **เฉพาะ owner + สถานะ DRAFT** เท่านั้น (ผิดเงื่อนไข → 409 พร้อม code ชัดเจน)
- [ ] `POST /api/silk-items/:id/evidence` — multipart upload; เซฟไฟล์ที่ `storage/uploads/` (ตั้งชื่อด้วย uuid ไม่ใช้ชื่อเดิม); คำนวณ **SHA-256** ของไฟล์เก็บลง `evidence` ตาราง; จำกัดชนิดไฟล์ (jpg/png/pdf) และขนาด (เช่น ≤10MB)
- [ ] `POST /api/silk-items/:id/submit` — DRAFT เท่านั้น; ล็อก revision เป็น SUBMITTED + สร้าง CertificationRequest; **idempotency**: ตาราง `idempotency_keys` กัน submit ซ้ำ (ส่ง key เดิมซ้ำ → คืนผลเดิม ไม่ error)
- [ ] `GET /api/reviews` — COOPERATIVE_OFFICER; คิว request สถานะ SUBMITTED คืน `ReviewQueueItem[]`
- [ ] ทุก mutation เขียน `audit_logs` ด้วย (AuditAction ตาม Contract C)
- [ ] **Integration test** (`test/integration/`): ownership ผิดโดน 403/409 · แก้ revision ที่ SUBMITTED ไม่ได้ · submit ซ้ำ idempotent · reject → สร้าง revision ใหม่ได้ (revisionNumber +1) โดยของเดิมไม่ถูกลบ

---

## Module 3 — Certification + Transfer (§6.3, §11.2–11.5) — ต้องใช้ `appendEvents` ของคน 4

> ถ้าคน 4 ยังไม่ merge: เขียนโครงไว้ก่อนโดย import จาก contract (สร้าง stub ตาม type แล้วทำ PR หลังคน 4 merge — PM จะจัดการ) หรือทำ Module 2 ก่อน

### 3.1 Approve (§11.2 — atomic สำคัญสุด)

- [ ] `POST /api/reviews/:id/approve` — `prisma.$transaction(async (tx) => { ... })`:
  1. ตรวจ request สถานะ SUBMITTED + ไม่มี certificate ACTIVE ของ silk item นี้อยู่แล้ว
  2. สร้าง Certificate (ACTIVE) + `certificate_code` สำหรับ public URL (เช่น `BR-SILK-XXXXXX`)
  3. อัปเดต revision → APPROVED, request → APPROVED
  4. `await appendEvents(tx, [{ eventType: 'ISSUE_CERTIFICATE', aggregateId: publicId, actorId: officer.id, payload: { certificateCode, revisionNumber } }])`
  5. commit — **ถ้าขั้นใดพังทั้งหมด rollback** (certificate กับ block ต้องเกิด/ตายด้วยกัน)
- [ ] `POST /api/reviews/:id/reject` — ต้องมี `reasonCode` + `reviewNote`; อัปเดต request + revision เป็น REJECTED; audit log

### 3.2 Certificate status (§11.3)

- [ ] `POST /api/certificates/:id/status` — action ∈ SUSPEND/REACTIVATE/REVOKE + `reason` จำเป็น
- [ ] State rules: ACTIVE→SUSPENDED→ACTIVE ได้; →REVOKED ได้จาก ACTIVE/SUSPENDED; **REVOKED ย้อนไม่ได้** (ผิด → 409)
- [ ] ทุก action สร้าง ledger event ตรงกัน (`CERTIFICATE_SUSPENDED/REACTIVATED/REVOKED`) แบบ atomic เหมือน approve

### 3.3 Transfers (§11.4–11.5)

- [ ] `GET /api/transfers` — รายการที่เกี่ยวข้องกับ org ของผู้ใช้; คำนวณ `canResolve` (ผู้ใช้อยู่ org ปลายทาง + สถานะ PENDING)
- [ ] `POST /api/transfers` — เฉพาะ custodian ปัจจุบัน; silk item ต้องมี certificate **ACTIVE**; กัน pending ซ้อน (มี partial unique index อยู่แล้ว — จับ error เป็น 409 ข้อความไทย)
- [ ] `POST /api/transfers/:id/accept` — เฉพาะ org ปลายทาง + PENDING; เปลี่ยน `custodianOrgId` + สร้าง `TRANSFER_ACCEPTED` event แบบ atomic
- [ ] `POST /api/transfers/:id/reject` — เฉพาะ org ปลายทาง + PENDING

### 3.4 Public certificate (§12)

- [ ] `GET /api/public/certificates/:code` — Public endpoint ไม่ต้อง login; คืน `PublicCertificate` (Contract B)
- [ ] **ตัด PII ทั้งหมด** — ชื่อช่างทอแสดงเฉพาะ display name; ไม่มี email/เบอร์/id ภายใน; custodyTimeline ใช้ชื่อ org + event
- [ ] `result` logic: ไม่เจอ code → NOT_FOUND; ACTIVE → VALID; SUSPENDED/REVOKED → ตามสถานะ
- [ ] `hashSummary` — ดึง block ล่าสุดที่มี event ของ silk item นี้ + ผล signature จาก ledger (เรียกใช้ผ่าน service ของคน 4 ไม่ query ตรง)

### 3.5 QR

- [ ] สร้าง QR รูปภาพ (lib `qrcode` ติดตั้งแล้ว) จาก URL `/certificate/<certificate_code>` — endpoint `GET /api/certificates/:id/qr` คืน PNG (dataURL หรือ binary ก็ได้ แต่ให้คน 2 รู้ format)

---

## Module 4 — Seed + scripts (§21)

- [ ] `prisma/seed.ts`: บัญชี demo 3 role (username ง่าย เช่น `weaver1`/`officer1`/`store1`, password เดียวกันทั้งชุดแบบ demo) + organization จำลอง (สหกรณ์ 1 + ร้าน 1 + validator roles 3) + **เรียก `seedLedger(tx)` ของคน 4** (ครอบด้วย try/catch พร้อมข้อความชัดเจนถ้ายังไม่มี) + silk item ครบ 4 สถานะ (Draft, Submitted, Active Certificate, Revoked Certificate) + transfer 2 รายการ (PENDING, ACCEPTED) + certificate code สำหรับสาธิต
- [ ] Script `pnpm db:seed` — รัน seed โดยไม่ทำลายข้อมูลเดิม (upsert)
- [ ] Script `pnpm db:reset` — `prisma migrate reset` + seed ใหม่ในคำสั่งเดียว
- [ ] Seed ต้อง deterministic (ไม่สุ่มค่าที่ทำให้ run ซ้ำแล้วเปลี่ยนผล)

---

## เกณฑ์เสร็จ (Definition of Done)

- [ ] curl ทดสอบทุก endpoint: happy path ผ่าน + ไม่ login → 401 + ผิด role → 403 + validation fail → 400 + ผิด state → 409 (มี `code` อ่านรู้เรื่องทุกอัน)
- [ ] Integration test: **approve สำเร็จ → certificate + block เกิดพร้อมกัน**; **บังคับ fail ตอนสร้าง block → rollback ทั้งคู่** (เช่น stub appendEvents ให้ throw)
- [ ] `pnpm db:reset` แล้วทุกอย่างพร้อม demo ทันที
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` ผ่านทั้งชุด (e2e เดิม 17 ตัวต้องยังผ่าน — เมื่อถอด demo auth ให้ปรับ test เรื่อง login ให้เข้ากับระบบใหม่)

## ถ้าติดขัด

- `appendEvents` ของคน 4 ยังไม่มี → ทำ Module 2 + public cert (ยกเว้น hashSummary) ก่อน
- ต้องแก้ schema (เช่น field ไม่พอ) → **ห้ามแก้เอง** — เปิด issue ถึง PM (schema เป็นของส่วนรวม)
- e2e เดิมพังจากการถอด demo → แก้ test ให้ตรงระบบใหม่ได้ (test ไม่ใช่ของใคนคนเดียว)
